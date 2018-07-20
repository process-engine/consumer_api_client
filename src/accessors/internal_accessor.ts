import {
  ConsumerContext,
  EventList,
  EventTriggerPayload,
  IConsumerApiAccessor,
  IConsumerApiService,
  ICorrelationResult,
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

  private _consumerApiService: IConsumerApiService = undefined;

  constructor(consumerApiService: IConsumerApiService) {
    this._consumerApiService = consumerApiService;
  }

  public get consumerApiService(): IConsumerApiService {
    return this._consumerApiService;
  }

  public async getProcessModels(context: ConsumerContext): Promise<ProcessModelList> {

    this._ensureIsAuthorized(context);

    return this.consumerApiService.getProcessModels(context);
  }

  public async getProcessModelByKey(context: ConsumerContext, processModelKey: string): Promise<ProcessModel> {

    this._ensureIsAuthorized(context);

    return this.consumerApiService.getProcessModelByKey(context, processModelKey);
  }

  public async startProcessInstance(context: ConsumerContext,
                                    processModelKey: string,
                                    startEventKey: string,
                                    payload: ProcessStartRequestPayload,
                                    startCallbackType: StartCallbackType = StartCallbackType.CallbackOnProcessInstanceCreated,
                                    endEventKey?: string,
                                  ): Promise<ProcessStartResponsePayload> {

    this._ensureIsAuthorized(context);

    return this.consumerApiService.startProcessInstance(context, processModelKey, startEventKey, payload, startCallbackType, endEventKey);
  }

  public async getProcessResultForCorrelation(context: ConsumerContext,
                                              correlationId: string,
                                              processModelKey: string): Promise<Array<ICorrelationResult>> {

    this._ensureIsAuthorized(context);

    return this.consumerApiService.getProcessResultForCorrelation(context, correlationId, processModelKey);
  }

  // Events
  public async getEventsForProcessModel(context: ConsumerContext, processModelKey: string): Promise<EventList> {

    this._ensureIsAuthorized(context);

    return this.consumerApiService.getEventsForProcessModel(context, processModelKey);
  }

  public async getEventsForCorrelation(context: ConsumerContext, correlationId: string): Promise<EventList> {

    this._ensureIsAuthorized(context);

    return this.consumerApiService.getEventsForCorrelation(context, correlationId);
  }

  public async getEventsForProcessModelInCorrelation(context: ConsumerContext, processModelKey: string, correlationId: string): Promise<EventList> {

    this._ensureIsAuthorized(context);

    return this.consumerApiService.getEventsForProcessModelInCorrelation(context, processModelKey, correlationId);
  }

  public async triggerEvent(context: ConsumerContext,
                            processModelKey: string,
                            correlationId: string,
                            eventId: string,
                            eventTriggerPayload?: EventTriggerPayload): Promise<void> {

    this._ensureIsAuthorized(context);

    return this.consumerApiService.triggerEvent(context, processModelKey, correlationId, eventId, eventTriggerPayload);
  }

  // UserTasks
  public async getUserTasksForProcessModel(context: ConsumerContext, processModelKey: string): Promise<UserTaskList> {

    this._ensureIsAuthorized(context);

    return this.consumerApiService.getUserTasksForProcessModel(context, processModelKey);
  }

  public async getUserTasksForCorrelation(context: ConsumerContext, correlationId: string): Promise<UserTaskList> {

    this._ensureIsAuthorized(context);

    return this.consumerApiService.getUserTasksForCorrelation(context, correlationId);
  }

  public async getUserTasksForProcessModelInCorrelation(context: ConsumerContext,
                                                        processModelKey: string,
                                                        correlationId: string): Promise<UserTaskList> {

    this._ensureIsAuthorized(context);

    return this.consumerApiService.getUserTasksForProcessModelInCorrelation(context, processModelKey, correlationId);
  }

  public async finishUserTask(context: ConsumerContext,
                              processModelKey: string,
                              correlationId: string,
                              userTaskId: string,
                              userTaskResult: UserTaskResult): Promise<void> {

    this._ensureIsAuthorized(context);

    return this.consumerApiService.finishUserTask(context, processModelKey, correlationId, userTaskId, userTaskResult);
  }

  private _ensureIsAuthorized(context: ConsumerContext): void {

    // Note: When using an external accessor, this check is performed by the ConsumerApiHttp module.
    // Since that component is bypassed by the internal accessor, we need to perform this check here.
    if (!context || !context.identity) {
      throw new UnauthorizedError('No auth token provided!');
    }
  }
}
