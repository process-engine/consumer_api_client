import {IIdentity} from '@essential-projects/iam_contracts';

import {
  CorrelationResult,
  EventList,
  EventTriggerPayload,
  IConsumerApi,
  IConsumerApiAccessor,
  ProcessModel,
  ProcessModelList,
  ProcessStartRequestPayload,
  ProcessStartResponsePayload,
  StartCallbackType,
  UserTaskList,
  UserTaskResult,
} from '@process-engine/consumer_api_contracts';
import {
  eventAggregatorSettings,
  ProcessEndedMessage,
  ProcessTerminatedMessage,
  UserTaskFinishedMessage,
  UserTaskWaitingMessage,
} from '@process-engine/process_engine_contracts';

import {UnauthorizedError} from '@essential-projects/errors_ts';

export class InternalAccessor implements IConsumerApiAccessor {

  private consumerApiService: IConsumerApi = undefined;

  constructor(consumerApiService: IConsumerApi) {
    this.consumerApiService = consumerApiService;
  }

  public onUserTaskWaiting(callback: (userTaskWaiting: UserTaskWaitingMessage) => void|Promise<void>): void {
    this._consumerApiService.onUserTaskWaiting((userTaskWaiting: UserTaskWaitingMessage) => {
      callback(userTaskWaiting);
    });
  }

  public onUserTaskFinished(callback: (userTaskFinished: UserTaskFinishedMessage) => void|Promise<void>): void {
    this._consumerApiService.onUserTaskFinished((userTaskFinished: UserTaskFinishedMessage) => {
      callback(userTaskFinished);
    });
  }

  public onProcessTerminated(callback: (processTerminated: ProcessTerminatedMessage) => void|Promise<void>): void {
    this._consumerApiService.onProcessTerminated((processTerminated: ProcessTerminatedMessage) => {
      callback(processTerminated);
    });
  }

  public onProcessEnded(callback: (processEnded: ProcessEndedMessage) => void|Promise<void>): void {
    this._consumerApiService.onProcessEnded((processEnded: ProcessEndedMessage) => {
      callback(processEnded);
    });
  }

  public async getProcessModels(identity: IIdentity): Promise<ProcessModelList> {

    this._ensureIsAuthorized(identity);

    return this.consumerApiService.getProcessModels(identity);
  }

  public async getProcessModelById(identity: IIdentity, processModelId: string): Promise<ProcessModel> {

    this._ensureIsAuthorized(identity);

    return this.consumerApiService.getProcessModelById(identity, processModelId);
  }

  public async startProcessInstance(identity: IIdentity,
                                    processModelId: string,
                                    startEventId: string,
                                    payload: ProcessStartRequestPayload,
                                    startCallbackType: StartCallbackType = StartCallbackType.CallbackOnProcessInstanceCreated,
                                    endEventId?: string,
                                  ): Promise<ProcessStartResponsePayload> {

    this._ensureIsAuthorized(identity);

    return this.consumerApiService.startProcessInstance(identity, processModelId, startEventId, payload, startCallbackType, endEventId);
  }

  public async getProcessResultForCorrelation(identity: IIdentity,
                                              correlationId: string,
                                              processModelId: string): Promise<Array<CorrelationResult>> {

    this._ensureIsAuthorized(identity);

    return this.consumerApiService.getProcessResultForCorrelation(identity, correlationId, processModelId);
  }

  // Events
  public async getEventsForProcessModel(identity: IIdentity, processModelId: string): Promise<EventList> {

    this._ensureIsAuthorized(identity);

    return this.consumerApiService.getEventsForProcessModel(identity, processModelId);
  }

  public async getEventsForCorrelation(identity: IIdentity, correlationId: string): Promise<EventList> {

    this._ensureIsAuthorized(identity);

    return this.consumerApiService.getEventsForCorrelation(identity, correlationId);
  }

  public async getEventsForProcessModelInCorrelation(identity: IIdentity, processModelId: string, correlationId: string): Promise<EventList> {

    this._ensureIsAuthorized(identity);

    return this.consumerApiService.getEventsForProcessModelInCorrelation(identity, processModelId, correlationId);
  }

  public async triggerEvent(identity: IIdentity,
                            processModelId: string,
                            correlationId: string,
                            eventId: string,
                            eventTriggerPayload?: EventTriggerPayload): Promise<void> {

    this._ensureIsAuthorized(identity);

    return this.consumerApiService.triggerEvent(identity, processModelId, correlationId, eventId, eventTriggerPayload);
  }

  // UserTasks
  public async getUserTasksForProcessModel(identity: IIdentity, processModelId: string): Promise<UserTaskList> {

    this._ensureIsAuthorized(identity);

    return this.consumerApiService.getUserTasksForProcessModel(identity, processModelId);
  }

  public async getUserTasksForCorrelation(identity: IIdentity, correlationId: string): Promise<UserTaskList> {

    this._ensureIsAuthorized(identity);

    return this.consumerApiService.getUserTasksForCorrelation(identity, correlationId);
  }

  public async getUserTasksForProcessModelInCorrelation(identity: IIdentity,
                                                        processModelId: string,
                                                        correlationId: string): Promise<UserTaskList> {

    this._ensureIsAuthorized(identity);

    return this.consumerApiService.getUserTasksForProcessModelInCorrelation(identity, processModelId, correlationId);
  }

  public async finishUserTask(identity: IIdentity,
                              processModelId: string,
                              correlationId: string,
                              userTaskId: string,
                              userTaskResult: UserTaskResult): Promise<void> {

    this._ensureIsAuthorized(identity);

    return this.consumerApiService.finishUserTask(identity, processModelId, correlationId, userTaskId, userTaskResult);
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
