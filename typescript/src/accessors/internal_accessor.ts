import {Subscription} from '@essential-projects/event_aggregator_contracts';
import {IIdentity} from '@essential-projects/iam_contracts';

import {
  DataModels,
  IConsumerApi,
  IConsumerApiAccessor,
  Messages,
} from '@process-engine/consumer_api_contracts';

import {UnauthorizedError} from '@essential-projects/errors_ts';

export class InternalAccessor implements IConsumerApiAccessor {

  private _consumerApiService: IConsumerApi = undefined;

  constructor(consumerApiService: IConsumerApi) {
    this._consumerApiService = consumerApiService;
  }

  // Notifications
  public async onUserTaskWaiting(identity: IIdentity, callback: Messages.CallbackTypes.OnUserTaskWaitingCallback): Promise<Subscription> {
    this._ensureIsAuthorized(identity);

    return this._consumerApiService.onUserTaskWaiting(identity, callback);
  }

  public async onUserTaskFinished(identity: IIdentity, callback: Messages.CallbackTypes.OnUserTaskFinishedCallback): Promise<Subscription> {
    this._ensureIsAuthorized(identity);

    return this._consumerApiService.onUserTaskFinished(identity, callback);
  }

  public async onUserTaskForIdentityWaiting(identity: IIdentity, callback: Messages.CallbackTypes.OnUserTaskWaitingCallback): Promise<Subscription> {
    this._ensureIsAuthorized(identity);

    return this._consumerApiService.onUserTaskForIdentityWaiting(identity, callback);
  }

  public async onUserTaskForIdentityFinished(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnUserTaskFinishedCallback,
  ): Promise<Subscription> {
    this._ensureIsAuthorized(identity);

    return this._consumerApiService.onUserTaskForIdentityFinished(identity, callback);
  }

  public async onManualTaskWaiting(identity: IIdentity, callback: Messages.CallbackTypes.OnManualTaskWaitingCallback): Promise<Subscription> {
    this._ensureIsAuthorized(identity);

    return this._consumerApiService.onManualTaskWaiting(identity, callback);
  }

  public async onManualTaskFinished(identity: IIdentity, callback: Messages.CallbackTypes.OnManualTaskFinishedCallback): Promise<Subscription> {
    this._ensureIsAuthorized(identity);

    return this._consumerApiService.onManualTaskFinished(identity, callback);
  }

  public async onManualTaskForIdentityWaiting(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnManualTaskWaitingCallback,
  ): Promise<Subscription> {
    this._ensureIsAuthorized(identity);

    return this._consumerApiService.onManualTaskForIdentityWaiting(identity, callback);
  }

  public async onManualTaskForIdentityFinished(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnManualTaskFinishedCallback,
  ): Promise<Subscription> {
    this._ensureIsAuthorized(identity);

    return this._consumerApiService.onManualTaskForIdentityFinished(identity, callback);
  }

  public async onProcessStarted(identity: IIdentity, callback: Messages.CallbackTypes.OnProcessStartedCallback): Promise<Subscription> {
    this._ensureIsAuthorized(identity);

    return this._consumerApiService.onProcessStarted(identity, callback);
  }

  public async onProcessWithProcessModelIdStarted(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnProcessStartedCallback,
    processModelId: string,
  ): Promise<Subscription> {
    this._ensureIsAuthorized(identity);

    return this._consumerApiService.onProcessWithProcessModelIdStarted(identity, callback, processModelId);
  }

  public async onProcessTerminated(identity: IIdentity, callback: Messages.CallbackTypes.OnProcessTerminatedCallback): Promise<Subscription> {
    this._ensureIsAuthorized(identity);

    return this._consumerApiService.onProcessTerminated(identity, callback);
  }

  public async onProcessEnded(identity: IIdentity, callback: Messages.CallbackTypes.OnProcessEndedCallback): Promise<Subscription> {
    this._ensureIsAuthorized(identity);

    return this._consumerApiService.onProcessEnded(identity, callback);
  }

  // Process models and instances
  public async getProcessModels(identity: IIdentity): Promise<DataModels.ProcessModels.ProcessModelList> {

    this._ensureIsAuthorized(identity);

    return this._consumerApiService.getProcessModels(identity);
  }

  public async getProcessModelById(identity: IIdentity, processModelId: string): Promise<DataModels.ProcessModels.ProcessModel> {

    this._ensureIsAuthorized(identity);

    return this._consumerApiService.getProcessModelById(identity, processModelId);
  }

  public async startProcessInstance(identity: IIdentity,
                                    processModelId: string,
                                    startEventId: string,
                                    payload: DataModels.ProcessModels.ProcessStartRequestPayload,
                                    startCallbackType?: DataModels.ProcessModels.StartCallbackType,
                                    endEventId?: string,
                                  ): Promise<DataModels.ProcessModels.ProcessStartResponsePayload> {

    this._ensureIsAuthorized(identity);

    return this._consumerApiService.startProcessInstance(identity, processModelId, startEventId, payload, startCallbackType, endEventId);
  }

  public async getProcessResultForCorrelation(identity: IIdentity,
                                              correlationId: string,
                                              processModelId: string): Promise<Array<DataModels.CorrelationResult>> {

    this._ensureIsAuthorized(identity);

    return this._consumerApiService.getProcessResultForCorrelation(identity, correlationId, processModelId);
  }

  public async getProcessInstancesByIdentity(identity: IIdentity): Promise<Array<DataModels.ProcessInstance>> {
    this._ensureIsAuthorized(identity);

    return this._consumerApiService.getProcessInstancesByIdentity(identity);
  }

  // Events
  public async getEventsForProcessModel(identity: IIdentity, processModelId: string): Promise<DataModels.Events.EventList> {
    this._ensureIsAuthorized(identity);

    return this._consumerApiService.getEventsForProcessModel(identity, processModelId);
  }

  public async getEventsForCorrelation(identity: IIdentity, correlationId: string): Promise<DataModels.Events.EventList> {
    this._ensureIsAuthorized(identity);

    return this._consumerApiService.getEventsForCorrelation(identity, correlationId);
  }

  public async getEventsForProcessModelInCorrelation(
    identity: IIdentity,
    processModelId: string,
    correlationId: string,
  ): Promise<DataModels.Events.EventList> {
    this._ensureIsAuthorized(identity);

    return this._consumerApiService.getEventsForProcessModelInCorrelation(identity, processModelId, correlationId);
  }

  public async triggerMessageEvent(identity: IIdentity, messageName: string, payload?: DataModels.Events.EventTriggerPayload): Promise<void> {
    this._ensureIsAuthorized(identity);

    return this._consumerApiService.triggerMessageEvent(identity, messageName, payload);
  }

  public async triggerSignalEvent(identity: IIdentity, signalName: string, payload?: DataModels.Events.EventTriggerPayload): Promise<void> {
    this._ensureIsAuthorized(identity);

    return this._consumerApiService.triggerSignalEvent(identity, signalName, payload);
  }

  // UserTasks
  public async getUserTasksForProcessModel(identity: IIdentity, processModelId: string): Promise<DataModels.UserTasks.UserTaskList> {
    this._ensureIsAuthorized(identity);

    return this._consumerApiService.getUserTasksForProcessModel(identity, processModelId);
  }

  public async getUserTasksForCorrelation(identity: IIdentity, correlationId: string): Promise<DataModels.UserTasks.UserTaskList> {
    this._ensureIsAuthorized(identity);

    return this._consumerApiService.getUserTasksForCorrelation(identity, correlationId);
  }

  public async getUserTasksForProcessModelInCorrelation(identity: IIdentity,
                                                        processModelId: string,
                                                        correlationId: string): Promise<DataModels.UserTasks.UserTaskList> {
    this._ensureIsAuthorized(identity);

    return this._consumerApiService.getUserTasksForProcessModelInCorrelation(identity, processModelId, correlationId);
  }

  public async getWaitingUserTasksByIdentity(identity: IIdentity): Promise<DataModels.UserTasks.UserTaskList> {
    this._ensureIsAuthorized(identity);

    return this._consumerApiService.getWaitingUserTasksByIdentity(identity);
  }

  public async finishUserTask(identity: IIdentity,
                              processInstanceId: string,
                              correlationId: string,
                              userTaskInstanceId: string,
                              userTaskResult: DataModels.UserTasks.UserTaskResult): Promise<void> {
    this._ensureIsAuthorized(identity);

    return this._consumerApiService.finishUserTask(identity, processInstanceId, correlationId, userTaskInstanceId, userTaskResult);
  }

  // ManualTasks
  public async getManualTasksForProcessModel(identity: IIdentity, processModelId: string): Promise<DataModels.ManualTasks.ManualTaskList> {
    this._ensureIsAuthorized(identity);

    return this._consumerApiService.getManualTasksForProcessModel(identity, processModelId);
  }

  public async getManualTasksForCorrelation(identity: IIdentity, correlationId: string): Promise<DataModels.ManualTasks.ManualTaskList> {
    this._ensureIsAuthorized(identity);

    return this._consumerApiService.getManualTasksForCorrelation(identity, correlationId);
  }

  public async getManualTasksForProcessModelInCorrelation(identity: IIdentity,
                                                          processModelId: string,
                                                          correlationId: string): Promise<DataModels.ManualTasks.ManualTaskList> {
    this._ensureIsAuthorized(identity);

    return this._consumerApiService.getManualTasksForProcessModelInCorrelation(identity, processModelId, correlationId);
  }

  public async getWaitingManualTasksByIdentity(identity: IIdentity): Promise<DataModels.ManualTasks.ManualTaskList> {
    this._ensureIsAuthorized(identity);

    return this._consumerApiService.getWaitingManualTasksByIdentity(identity);
  }

  public async finishManualTask(identity: IIdentity,
                                processInstanceId: string,
                                correlationId: string,
                                manualTaskInstanceId: string): Promise<void> {
    this._ensureIsAuthorized(identity);

    return this._consumerApiService.finishManualTask(identity, processInstanceId, correlationId, manualTaskInstanceId);
  }

  private _ensureIsAuthorized(identity: IIdentity): void {

    // Note: When using an external accessor, this check is performed by the ConsumerApiHttp module.
    // Since that component is bypassed by the internal accessor, we need to perform this check here.
    const noAuthTokenProvided: boolean = !identity || typeof identity.token !== 'string';
    if (noAuthTokenProvided) {
      throw new UnauthorizedError('No auth token provided!');
    }
  }
}
