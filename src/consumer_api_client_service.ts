import * as EssentialProjectErrors from '@essential-projects/errors_ts';
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

export class ConsumerApiClientService implements IConsumerApiService {

  private _consumerApiAccessor: IConsumerApiAccessor = undefined;

  constructor(consumerApiAccessor: IConsumerApiAccessor) {
    this._consumerApiAccessor = consumerApiAccessor;
  }

  public get consumerApiAccessor(): IConsumerApiAccessor {
    return this._consumerApiAccessor;
  }

  public async getProcessModels(context: ConsumerContext): Promise<ProcessModelList> {

    return this.consumerApiAccessor.getProcessModels(context);
  }

  public async getProcessModelById(context: ConsumerContext, processModelId: string): Promise<ProcessModel> {

    return this.consumerApiAccessor.getProcessModelById(context, processModelId);
  }

  public async startProcessInstance(context: ConsumerContext,
                                    processModelId: string,
                                    startEventId: string,
                                    payload: ProcessStartRequestPayload,
                                    startCallbackType: StartCallbackType = StartCallbackType.CallbackOnProcessInstanceCreated,
                                    endEventId?: string,
                                  ): Promise<ProcessStartResponsePayload> {

    if (!Object.values(StartCallbackType).includes(startCallbackType)) {
      throw new EssentialProjectErrors.BadRequestError(`${startCallbackType} is not a valid return option!`);
    }

    if (startCallbackType === StartCallbackType.CallbackOnEndEventReached && !endEventId) {
      throw new EssentialProjectErrors.BadRequestError(`Must provide an EndEventId, when using callback type 'CallbackOnEndEventReached'!`);
    }

    return this.consumerApiAccessor.startProcessInstance(context, processModelId, startEventId, payload, startCallbackType, endEventId);
  }

  public async getProcessResultForCorrelation(context: ConsumerContext,
                                              correlationId: string,
                                              processModelId: string): Promise<Array<CorrelationResult>> {

    return this.consumerApiAccessor.getProcessResultForCorrelation(context, correlationId, processModelId);
  }

  // Events
  public async getEventsForProcessModel(context: ConsumerContext, processModelId: string): Promise<EventList> {

    return this.consumerApiAccessor.getEventsForProcessModel(context, processModelId);
  }

  public async getEventsForCorrelation(context: ConsumerContext, correlationId: string): Promise<EventList> {

    return this.consumerApiAccessor.getEventsForCorrelation(context, correlationId);
  }

  public async getEventsForProcessModelInCorrelation(context: ConsumerContext, processModelId: string, correlationId: string): Promise<EventList> {

    return this.consumerApiAccessor.getEventsForProcessModelInCorrelation(context, processModelId, correlationId);
  }

  public async triggerEvent(context: ConsumerContext,
                            processModelId: string,
                            correlationId: string,
                            eventId: string,
                            eventTriggerPayload?: EventTriggerPayload): Promise<void> {

    return this.consumerApiAccessor.triggerEvent(context, processModelId, correlationId, eventId, eventTriggerPayload);
  }

  // UserTasks
  public async getUserTasksForProcessModel(context: ConsumerContext, processModelId: string): Promise<UserTaskList> {

    return this.consumerApiAccessor.getUserTasksForProcessModel(context, processModelId);
  }

  public async getUserTasksForCorrelation(context: ConsumerContext, correlationId: string): Promise<UserTaskList> {

    return this.consumerApiAccessor.getUserTasksForCorrelation(context, correlationId);
  }

  public async getUserTasksForProcessModelInCorrelation(context: ConsumerContext,
                                                        processModelId: string,
                                                        correlationId: string): Promise<UserTaskList> {

    return this.consumerApiAccessor.getUserTasksForProcessModelInCorrelation(context, processModelId, correlationId);
  }

  public async finishUserTask(context: ConsumerContext,
                              processModelId: string,
                              correlationId: string,
                              userTaskId: string,
                              userTaskResult: UserTaskResult): Promise<void> {

    return this.consumerApiAccessor.finishUserTask(context, processModelId, correlationId, userTaskId, userTaskResult);
  }
}
