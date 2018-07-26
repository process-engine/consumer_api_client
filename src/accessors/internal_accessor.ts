import {
  ConsumerContext,
  CorrelationResult,
  EventList,
  EventTriggerPayload,
  IConsumerApiAccessor,
  IConsumerApiService,
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

  public async getProcessModelById(context: ConsumerContext, processModelId: string): Promise<ProcessModel> {

    this._ensureIsAuthorized(context);

    return this.consumerApiService.getProcessModelById(context, processModelId);
  }

  public async startProcessInstance(context: ConsumerContext,
                                    processModelId: string,
                                    startEventId: string,
                                    payload: ProcessStartRequestPayload,
                                    startCallbackType: StartCallbackType = StartCallbackType.CallbackOnProcessInstanceCreated,
                                    endEventId?: string,
                                  ): Promise<ProcessStartResponsePayload> {

    this._ensureIsAuthorized(context);

    return this.consumerApiService.startProcessInstance(context, processModelId, startEventId, payload, startCallbackType, endEventId);
  }

  public async getProcessResultForCorrelation(context: ConsumerContext,
                                              correlationId: string,
                                              processModelId: string): Promise<Array<CorrelationResult>> {

    this._ensureIsAuthorized(context);

    return this.consumerApiService.getProcessResultForCorrelation(context, correlationId, processModelId);
  }

  // Events
  public async getEventsForProcessModel(context: ConsumerContext, processModelId: string): Promise<EventList> {

    this._ensureIsAuthorized(context);

    return this.consumerApiService.getEventsForProcessModel(context, processModelId);
  }

  public async getEventsForCorrelation(context: ConsumerContext, correlationId: string): Promise<EventList> {

    this._ensureIsAuthorized(context);

    return this.consumerApiService.getEventsForCorrelation(context, correlationId);
  }

  public async getEventsForProcessModelInCorrelation(context: ConsumerContext, processModelId: string, correlationId: string): Promise<EventList> {

    this._ensureIsAuthorized(context);

    return this.consumerApiService.getEventsForProcessModelInCorrelation(context, processModelId, correlationId);
  }

  public async triggerEvent(context: ConsumerContext,
                            processModelId: string,
                            correlationId: string,
                            eventId: string,
                            eventTriggerPayload?: EventTriggerPayload): Promise<void> {

    this._ensureIsAuthorized(context);

    return this.consumerApiService.triggerEvent(context, processModelId, correlationId, eventId, eventTriggerPayload);
  }

  // UserTasks
  public async getUserTasksForProcessModel(context: ConsumerContext, processModelId: string): Promise<UserTaskList> {

    this._ensureIsAuthorized(context);

    return this.consumerApiService.getUserTasksForProcessModel(context, processModelId);
  }

  public async getUserTasksForCorrelation(context: ConsumerContext, correlationId: string): Promise<UserTaskList> {

    this._ensureIsAuthorized(context);

    return this.consumerApiService.getUserTasksForCorrelation(context, correlationId);
  }

  public async getUserTasksForProcessModelInCorrelation(context: ConsumerContext,
                                                        processModelId: string,
                                                        correlationId: string): Promise<UserTaskList> {

    this._ensureIsAuthorized(context);

    return this.consumerApiService.getUserTasksForProcessModelInCorrelation(context, processModelId, correlationId);
  }

  public async finishUserTask(context: ConsumerContext,
                              processModelId: string,
                              correlationId: string,
                              userTaskId: string,
                              userTaskResult: UserTaskResult): Promise<void> {

    this._ensureIsAuthorized(context);

    return this.consumerApiService.finishUserTask(context, processModelId, correlationId, userTaskId, userTaskResult);
  }

  private _ensureIsAuthorized(context: ConsumerContext): void {

    // Note: When using an external accessor, this check is performed by the ConsumerApiHttp module.
    // Since that component is bypassed by the internal accessor, we need to perform this check here.
    if (!context || !context.identity) {
      throw new UnauthorizedError('No auth token provided!');
    }
  }
}
