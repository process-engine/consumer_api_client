import * as EssentialProjectErrors from '@essential-projects/errors_ts';
import {IHttpClient, IRequestOptions, IResponse} from '@essential-projects/http_contracts';
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

export class InternalAccessor implements IConsumerApiAccessor {

  public config: any = undefined;

  private _consumerApiService: IConsumerApiService = undefined;

  constructor(consumerApiService: IConsumerApiService) {
    this._consumerApiService = consumerApiService;
  }

  public get consumerApiService(): IConsumerApiService {
    return this._consumerApiService;
  }

  public async getProcessModels(context: ConsumerContext): Promise<ProcessModelList> {

    return this.consumerApiService.getProcessModels(context);
  }

  public async getProcessModelByKey(context: ConsumerContext, processModelKey: string): Promise<ProcessModel> {

    return this.consumerApiService.getProcessModelByKey(context, processModelKey);
  }

  public async startProcessInstance(context: ConsumerContext,
                                    processModelKey: string,
                                    startEventKey: string,
                                    payload: ProcessStartRequestPayload,
                                    startCallbackType: StartCallbackType = StartCallbackType.CallbackOnProcessInstanceCreated,
                                    endEventKey?: string,
                                  ): Promise<ProcessStartResponsePayload> {

    if (!Object.values(StartCallbackType).includes(startCallbackType)) {
      throw new EssentialProjectErrors.BadRequestError(`${startCallbackType} is not a valid return option!`);
    }

    if (startCallbackType === StartCallbackType.CallbackOnEndEventReached && !endEventKey) {
      throw new EssentialProjectErrors.BadRequestError(`Must provide an EndEventKey, when using callback type 'CallbackOnEndEventReached'!`);
    }

    return this.consumerApiService.startProcessInstance(context, processModelKey, startEventKey, payload, startCallbackType, endEventKey);
  }

  public async getProcessResultForCorrelation(context: ConsumerContext,
                                              correlationId: string,
                                              processModelKey: string): Promise<ICorrelationResult> {

    return this.consumerApiService.getProcessResultForCorrelation(context, correlationId, processModelKey);
  }

  // Events
  public async getEventsForProcessModel(context: ConsumerContext, processModelKey: string): Promise<EventList> {

    return this.consumerApiService.getEventsForProcessModel(context, processModelKey);
  }

  public async getEventsForCorrelation(context: ConsumerContext, correlationId: string): Promise<EventList> {

    return this.consumerApiService.getEventsForCorrelation(context, correlationId);
  }

  public async getEventsForProcessModelInCorrelation(context: ConsumerContext, processModelKey: string, correlationId: string): Promise<EventList> {

    return this.consumerApiService.getEventsForProcessModelInCorrelation(context, processModelKey, correlationId);
  }

  public async triggerEvent(context: ConsumerContext,
                            processModelKey: string,
                            correlationId: string,
                            eventId: string,
                            eventTriggerPayload?: EventTriggerPayload): Promise<void> {

    return this.consumerApiService.triggerEvent(context, processModelKey, correlationId, eventId, eventTriggerPayload);
  }

  // UserTasks
  public async getUserTasksForProcessModel(context: ConsumerContext, processModelKey: string): Promise<UserTaskList> {

    return this.consumerApiService.getUserTasksForProcessModel(context, processModelKey);
  }

  public async getUserTasksForCorrelation(context: ConsumerContext, correlationId: string): Promise<UserTaskList> {

    return this.consumerApiService.getUserTasksForCorrelation(context, correlationId);
  }

  public async getUserTasksForProcessModelInCorrelation(context: ConsumerContext,
                                                        processModelKey: string,
                                                        correlationId: string): Promise<UserTaskList> {

    return this.consumerApiService.getUserTasksForProcessModelInCorrelation(context, processModelKey, correlationId);
  }

  public async finishUserTask(context: ConsumerContext,
                              processModelKey: string,
                              correlationId: string,
                              userTaskId: string,
                              userTaskResult: UserTaskResult): Promise<void> {

    return this.consumerApiService.finishUserTask(context, processModelKey, correlationId, userTaskId, userTaskResult);
  }
}
