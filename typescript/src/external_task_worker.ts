/* eslint-disable @typescript-eslint/member-naming */
import {Logger} from 'loggerhythm';
import * as uuid from 'node-uuid';

import {HttpClient} from '@essential-projects/http';
import {IIdentity} from '@essential-projects/iam_contracts';
import {
  DataModels,
  HandleExternalTaskAction,
  IExternalTaskWorker,
} from '@process-engine/consumer_api_contracts';

import {ExternalAccessor} from './accessors/external_accessor';
import {ConsumerApiClient} from './consumer_api_client';

const logger: Logger = Logger.createLogger('processengine:consumer_api_client:external_task_worker');

export class ExternalTaskWorker<TExternalTaskPayload, TResultPayload> implements IExternalTaskWorker {

  private readonly _workerId = uuid.v4();
  private readonly lockDuration = 30000;
  private readonly processEngineUrl: string;
  private readonly topic: string;
  private readonly maxTasks: number;
  private readonly longpollingTimeout: number;
  private readonly processingFunction: HandleExternalTaskAction<TExternalTaskPayload, TResultPayload>;

  private _identity: IIdentity;
  private _pollingActive = false;
  private consumerApiClient: ConsumerApiClient;

  constructor(
    processEngineUrl: string,
    identity: IIdentity,
    topic: string,
    maxTasks: number,
    longpollingTimeout: number,
    processingFunction: HandleExternalTaskAction<TExternalTaskPayload, TResultPayload>,
  ) {
    this.processEngineUrl = processEngineUrl;
    this.identity = identity;
    this.topic = topic;
    this.maxTasks = maxTasks;
    this.longpollingTimeout = longpollingTimeout;
    this.processingFunction = processingFunction;

    this.initialize();
  }

  public get identity(): IIdentity {
    return this._identity;
  }

  public set identity(value: IIdentity) {
    this._identity = value;
  }

  public get workerId(): string {
    return this._workerId;
  }

  public get pollingIsActive(): boolean {
    return this._pollingActive;
  }

  public start(): void {
    this._pollingActive = true;
    this.processExternalTasks();
  }

  public stop(): void {
    this._pollingActive = false;
  }

  private initialize(): void {
    const httpClient = new HttpClient();
    httpClient.config = {url: this.processEngineUrl};

    const externalAccessor = new ExternalAccessor(httpClient);
    this.consumerApiClient = new ConsumerApiClient(externalAccessor);
  }

  private async processExternalTasks(): Promise<void> {

    while (this.pollingIsActive) {

      const externalTasks = await this.fetchAndLockExternalTasks(
        this.identity,
        this.topic,
        this.maxTasks,
        this.longpollingTimeout,
      );

      if (externalTasks.length === 0) {
        await this.sleep(1000);
        continue;
      }

      const executeTaskPromises: Array<Promise<void>> = [];

      for (const externalTask of externalTasks) {
        executeTaskPromises.push(this.executeExternalTask(this.identity, externalTask));
      }

      await Promise.all(executeTaskPromises);
    }
  }

  private async fetchAndLockExternalTasks(
    identity: IIdentity,
    topic: string,
    maxTasks: number,
    longpollingTimeout: number,
  ): Promise<Array<DataModels.ExternalTask.ExternalTask<TExternalTaskPayload>>> {

    try {
      return await this
        .consumerApiClient
        .fetchAndLockExternalTasks<TExternalTaskPayload>(identity, this.workerId, topic, maxTasks, longpollingTimeout, this.lockDuration);
    } catch (error) {

      logger.error(
        'An error occured during fetchAndLock!',
        error.message,
        error.stack,
      );

      // Returning an empty Array here, since "waitForAndHandle" already implements a timeout, in case no tasks are available for processing.
      // No need to do that twice.
      return [];
    }
  }

  private async executeExternalTask(
    identity: IIdentity,
    externalTask: DataModels.ExternalTask.ExternalTask<TExternalTaskPayload>,
  ): Promise<void> {

    try {
      const lockExtensionBuffer = 5000;

      const interval =
        setInterval(async (): Promise<void> => this.extendLocks(identity, externalTask), this.lockDuration - lockExtensionBuffer);

      const result = await this.processingFunction(externalTask);
      clearInterval(interval);

      await this.processResult(identity, result, externalTask.id);

    } catch (error) {
      logger.error('Failed to execute ExternalTask!', error.message, error.stack);
      await this.consumerApiClient.handleServiceError(identity, this.workerId, externalTask.id, error.message, '');
    }
  }

  private async extendLocks(identity: IIdentity, externalTask: DataModels.ExternalTask.ExternalTask<TExternalTaskPayload>): Promise<void> {
    try {
      await this.consumerApiClient.extendLock(identity, this.workerId, externalTask.id, this.lockDuration);
    } catch (error) {
      // This can happen, if the lock-extension was performed after the task was already finished.
      // Since this isn't really an error, a warning suffices here.
      logger.warn(`An error occured while trying to extend the lock for ExternalTask ${externalTask.id}`, error.message, error.stack);
    }
  }

  private async processResult(identity: IIdentity, result: DataModels.ExternalTask.ExternalTaskResultBase, externalTaskId: string): Promise<void> {

    if (result instanceof DataModels.ExternalTask.ExternalTaskBpmnError) {
      const bpmnError = result as DataModels.ExternalTask.ExternalTaskBpmnError;
      await this.consumerApiClient.handleBpmnError(identity, this.workerId, externalTaskId, bpmnError.errorCode);

    } else if (result instanceof DataModels.ExternalTask.ExternalTaskServiceError) {

      const serviceError = result as DataModels.ExternalTask.ExternalTaskServiceError;
      await this
        .consumerApiClient
        .handleServiceError(identity, this.workerId, externalTaskId, serviceError.errorMessage, serviceError.errorDetails);

    } else {
      await this
        .consumerApiClient
        .finishExternalTask(identity, this.workerId, externalTaskId, (result as DataModels.ExternalTask.ExternalTaskSuccessResult).result);
    }
  }

  private async sleep(milliseconds: number): Promise<void> {
    return new Promise<void>((resolve: Function): void => {
      setTimeout((): void => { resolve(); }, milliseconds);
    });
  }

}
