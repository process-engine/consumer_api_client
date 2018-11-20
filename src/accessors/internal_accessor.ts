import {IIdentity} from '@essential-projects/iam_contracts';

import {
  CorrelationResult,
  EventList,
  EventTriggerPayload,
  IConsumerApi,
  IConsumerApiAccessor,
  ManualTaskList,
  Messages,
  ProcessModel,
  ProcessModelList,
  ProcessStartRequestPayload,
  ProcessStartResponsePayload,
  StartCallbackType,
  UserTaskList,
  UserTaskResult,
} from '@process-engine/consumer_api_contracts';

import {UnauthorizedError} from '@essential-projects/errors_ts';

export class InternalAccessor implements IConsumerApiAccessor {

  private _consumerApiService: IConsumerApi = undefined;

  constructor(consumerApiService: IConsumerApi) {
    this._consumerApiService = consumerApiService;
  }

  public onUserTaskWaiting(identity: IIdentity, callback: Messages.CallbackTypes.OnUserTaskWaitingCallback): void {
    this._ensureIsAuthorized(identity);
    this._consumerApiService.onUserTaskWaiting(identity, callback);
  }

  public onUserTaskFinished(identity: IIdentity, callback: Messages.CallbackTypes.OnUserTaskFinishedCallback): void {
    this._ensureIsAuthorized(identity);
    this._consumerApiService.onUserTaskFinished(identity, callback);
  }

  public onManualTaskWaiting(identity: IIdentity, callback: Messages.CallbackTypes.OnManualTaskWaitingCallback): void {
    this._ensureIsAuthorized(identity);
    this._consumerApiService.onManualTaskWaiting(identity, callback);
  }

  public onManualTaskFinished(identity: IIdentity, callback: Messages.CallbackTypes.OnManualTaskFinishedCallback): void {
    this._ensureIsAuthorized(identity);
    this._consumerApiService.onManualTaskFinished(identity, callback);
  }

  public onProcessTerminated(identity: IIdentity, callback: Messages.CallbackTypes.OnProcessTerminatedCallback): void {
    this._ensureIsAuthorized(identity);
    this._consumerApiService.onProcessTerminated(identity, callback);
  }

  public onProcessEnded(identity: IIdentity, callback: Messages.CallbackTypes.OnProcessEndedCallback): void {
    this._ensureIsAuthorized(identity);
    this._consumerApiService.onProcessEnded(identity, callback);
  }

  public async getProcessModels(identity: IIdentity): Promise<ProcessModelList> {

    this._ensureIsAuthorized(identity);

    return this._consumerApiService.getProcessModels(identity);
  }

  public async getProcessModelById(identity: IIdentity, processModelId: string): Promise<ProcessModel> {

    this._ensureIsAuthorized(identity);

    return this._consumerApiService.getProcessModelById(identity, processModelId);
  }

  public async startProcessInstance(identity: IIdentity,
                                    processModelId: string,
                                    startEventId: string,
                                    payload: ProcessStartRequestPayload,
                                    startCallbackType: StartCallbackType = StartCallbackType.CallbackOnProcessInstanceCreated,
                                    endEventId?: string,
                                  ): Promise<ProcessStartResponsePayload> {

    this._ensureIsAuthorized(identity);

    return this._consumerApiService.startProcessInstance(identity, processModelId, startEventId, payload, startCallbackType, endEventId);
  }

  public async getProcessResultForCorrelation(identity: IIdentity,
                                              correlationId: string,
                                              processModelId: string): Promise<Array<CorrelationResult>> {

    this._ensureIsAuthorized(identity);

    return this._consumerApiService.getProcessResultForCorrelation(identity, correlationId, processModelId);
  }

  // Events
  public async getEventsForProcessModel(identity: IIdentity, processModelId: string): Promise<EventList> {

    this._ensureIsAuthorized(identity);

    return this._consumerApiService.getEventsForProcessModel(identity, processModelId);
  }

  public async getEventsForCorrelation(identity: IIdentity, correlationId: string): Promise<EventList> {

    this._ensureIsAuthorized(identity);

    return this._consumerApiService.getEventsForCorrelation(identity, correlationId);
  }

  public async getEventsForProcessModelInCorrelation(identity: IIdentity, processModelId: string, correlationId: string): Promise<EventList> {

    this._ensureIsAuthorized(identity);

    return this._consumerApiService.getEventsForProcessModelInCorrelation(identity, processModelId, correlationId);
  }

  public async triggerMessageEvent(identity: IIdentity, messageName: string, payload?: EventTriggerPayload): Promise<void> {

    this._ensureIsAuthorized(identity);

    return this._consumerApiService.triggerMessageEvent(identity, messageName, payload);
  }

  public async triggerSignalEvent(identity: IIdentity, signalName: string, payload?: EventTriggerPayload): Promise<void> {

    this._ensureIsAuthorized(identity);

    return this._consumerApiService.triggerSignalEvent(identity, signalName, payload);
  }

  // UserTasks
  public async getUserTasksForProcessModel(identity: IIdentity, processModelId: string): Promise<UserTaskList> {

    this._ensureIsAuthorized(identity);

    return this._consumerApiService.getUserTasksForProcessModel(identity, processModelId);
  }

  public async getUserTasksForCorrelation(identity: IIdentity, correlationId: string): Promise<UserTaskList> {

    this._ensureIsAuthorized(identity);

    return this._consumerApiService.getUserTasksForCorrelation(identity, correlationId);
  }

  public async getUserTasksForProcessModelInCorrelation(identity: IIdentity,
                                                        processModelId: string,
                                                        correlationId: string): Promise<UserTaskList> {

    this._ensureIsAuthorized(identity);

    return this._consumerApiService.getUserTasksForProcessModelInCorrelation(identity, processModelId, correlationId);
  }

  public async finishUserTask(identity: IIdentity,
                              processInstanceId: string,
                              correlationId: string,
                              userTaskInstanceId: string,
                              userTaskResult: UserTaskResult): Promise<void> {

    this._ensureIsAuthorized(identity);

    return this._consumerApiService.finishUserTask(identity, processInstanceId, correlationId, userTaskInstanceId, userTaskResult);
  }

  // ManualTasks
  public async getManualTasksForProcessModel(identity: IIdentity, processModelId: string): Promise<ManualTaskList> {

    this._ensureIsAuthorized(identity);

    return this._consumerApiService.getManualTasksForProcessModel(identity, processModelId);
  }

  public async getManualTasksForCorrelation(identity: IIdentity, correlationId: string): Promise<ManualTaskList> {

    this._ensureIsAuthorized(identity);

    return this._consumerApiService.getManualTasksForCorrelation(identity, correlationId);
  }

  public async getManualTasksForProcessModelInCorrelation(identity: IIdentity,
                                                          processModelId: string,
                                                          correlationId: string): Promise<ManualTaskList> {

    this._ensureIsAuthorized(identity);

    return this._consumerApiService.getManualTasksForProcessModelInCorrelation(identity, processModelId, correlationId);
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
