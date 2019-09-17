import {Logger} from 'loggerhythm';
import * as uuid from 'node-uuid';

import {IIdentity} from '@essential-projects/iam_contracts';

import {
  APIs,
  DataModels,
  HandleExternalTaskAction,
  IExternalTaskWorker,
} from '@process-engine/consumer_api_contracts';

const logger: Logger = Logger.createLogger('processengine:consumer_api:external_task_worker');

export class ExternalTaskWorker implements IExternalTaskWorker {

  // eslint-disable-next-line @typescript-eslint/member-naming
  private readonly _workerId = uuid.v4();
  private readonly lockDuration = 30000;
  private readonly externalTaskService: APIs.IExternalTaskConsumerApi;

  constructor(externalTaskService: APIs.IExternalTaskConsumerApi) {
    this.externalTaskService = externalTaskService;
  }

  public get workerId(): string {
    return this._workerId;
  }

  public async waitForAndHandle<TPayload>(
    identity: IIdentity,
    topic: string,
    maxTasks: number,
    longpollingTimeout: number,
    handleAction: HandleExternalTaskAction<TPayload>,
  ): Promise<void> {

    const keepPolling = true;
    while (keepPolling) {

      const externalTaskList = await this.fetchAndLockExternalTasks<TPayload>(
        identity,
        topic,
        maxTasks,
        longpollingTimeout,
      );

      if (externalTaskList.externalTasks.length === 0) {
        await this.sleep(1000);
        continue;
      }

      const executeTaskPromises: Array<Promise<void>> = [];

      for (const externalTask of externalTaskList.externalTasks) {
        executeTaskPromises.push(this.executeExternalTask(identity, externalTask, handleAction));
      }

      await Promise.all(executeTaskPromises);
    }
  }

  private async fetchAndLockExternalTasks<TPayload>(
    identity: IIdentity,
    topic: string,
    maxTasks: number,
    longpollingTimeout: number,
  ): Promise<DataModels.ExternalTask.ExternalTaskList<TPayload>> {

    try {
      const externalTasks = await this
        .externalTaskService
        .fetchAndLockExternalTasks<TPayload>(identity, this.workerId, topic, maxTasks, longpollingTimeout, this.lockDuration);

      return {externalTasks: externalTasks, totalCount: externalTasks.length};
    } catch (error) {

      logger.error(
        'An error occured during fetchAndLock!',
        error.message,
        error.stack,
      );

      // Returning an empty Array here, since "waitForAndHandle" already implements a timeout, in case no tasks are available for processing.
      // No need to do that twice.
      return {externalTasks: [], totalCount: 0};
    }
  }

  private async executeExternalTask<TPayload>(
    identity: IIdentity,
    externalTask: DataModels.ExternalTask.ExternalTask<TPayload>,
    handleAction: HandleExternalTaskAction<TPayload>,
  ): Promise<void> {

    try {
      const lockExtensionBuffer = 5000;

      const interval =
        setInterval(async (): Promise<void> => this.extendLocks<TPayload>(identity, externalTask), this.lockDuration - lockExtensionBuffer);

      const result = await handleAction(externalTask);
      clearInterval(interval);

      await this.processResult(identity, result, externalTask.id);
    } catch (error) {
      logger.error('Failed to execute ExternalTask!', error.message, error.stack);
      await this.externalTaskService.handleServiceError(identity, this.workerId, externalTask.id, error.message, '');
    }
  }

  private async extendLocks<TPayload>(identity: IIdentity, externalTask: DataModels.ExternalTask.ExternalTask<TPayload>): Promise<void> {
    try {
      await this.externalTaskService.extendLock(identity, this.workerId, externalTask.id, this.lockDuration);
    } catch (error) {
      // This can happen, if the lock-extension was performed after the task was already finished.
      // Since this isn't really an error, a warning suffices here.
      logger.warn(`An error occured while trying to extend the lock for ExternalTask ${externalTask.id}`, error.message, error.stack);
    }
  }

  private async processResult(identity: IIdentity, result: DataModels.ExternalTask.ExternalTaskResultBase, externalTaskId: string): Promise<void> {

    if (result instanceof DataModels.ExternalTask.ExternalTaskBpmnError) {

      const bpmnError = result as DataModels.ExternalTask.ExternalTaskBpmnError;
      await this.externalTaskService.handleBpmnError(identity, this.workerId, externalTaskId, bpmnError.errorCode);

    } else if (result instanceof DataModels.ExternalTask.ExternalTaskServiceError) {

      const serviceError = result as DataModels.ExternalTask.ExternalTaskServiceError;
      await this
        .externalTaskService
        .handleServiceError(identity, this.workerId, externalTaskId, serviceError.errorMessage, serviceError.errorDetails);

    } else {
      await this
        .externalTaskService
        .finishExternalTask(identity, this.workerId, externalTaskId, (result as DataModels.ExternalTask.ExternalTaskSuccessResult<any>).result);
    }
  }

  private async sleep(milliseconds: number): Promise<void> {
    return new Promise<void>((resolve: Function): void => {
      setTimeout((): void => { resolve(); }, milliseconds);
    });
  }

}
