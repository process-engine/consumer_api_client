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

  public async getProcessModelByKey(context: ConsumerContext, processModelKey: string): Promise<ProcessModel> {

    return this.consumerApiAccessor.getProcessModelByKey(context, processModelKey);
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

    return this.consumerApiAccessor.startProcessInstance(context, processModelKey, startEventKey, payload, startCallbackType, endEventKey);
  }

  public async getProcessResultForCorrelation(context: ConsumerContext,
                                              correlationId: string,
                                              processModelKey: string): Promise<Array<CorrelationResult>> {

    return this.consumerApiAccessor.getProcessResultForCorrelation(context, correlationId, processModelKey);
  }

  // Events
  public async getEventsForProcessModel(context: ConsumerContext, processModelKey: string): Promise<EventList> {

    return this.consumerApiAccessor.getEventsForProcessModel(context, processModelKey);
  }

  public async getEventsForCorrelation(context: ConsumerContext, correlationId: string): Promise<EventList> {

    return this.consumerApiAccessor.getEventsForCorrelation(context, correlationId);
  }

  public async getEventsForProcessModelInCorrelation(context: ConsumerContext, processModelKey: string, correlationId: string): Promise<EventList> {

    return this.consumerApiAccessor.getEventsForProcessModelInCorrelation(context, processModelKey, correlationId);
  }

  public async triggerEvent(context: ConsumerContext,
                            processModelKey: string,
                            correlationId: string,
                            eventId: string,
                            eventTriggerPayload?: EventTriggerPayload): Promise<void> {

    return this.consumerApiAccessor.triggerEvent(context, processModelKey, correlationId, eventId, eventTriggerPayload);
  }

  // UserTasks
  public async getUserTasksForProcessModel(context: ConsumerContext, processModelKey: string): Promise<UserTaskList> {

    return this.consumerApiAccessor.getUserTasksForProcessModel(context, processModelKey);
  }

  public async getUserTasksForCorrelation(context: ConsumerContext, correlationId: string): Promise<UserTaskList> {

    return this.consumerApiAccessor.getUserTasksForCorrelation(context, correlationId);
  }

  public async getUserTasksForProcessModelInCorrelation(context: ConsumerContext,
                                                        processModelKey: string,
                                                        correlationId: string): Promise<UserTaskList> {

    return this.consumerApiAccessor.getUserTasksForProcessModelInCorrelation(context, processModelKey, correlationId);
  }

  public async finishUserTask(context: ConsumerContext,
                              processModelKey: string,
                              correlationId: string,
                              userTaskId: string,
                              userTaskResult: UserTaskResult): Promise<void> {

    return this.consumerApiAccessor.finishUserTask(context, processModelKey, correlationId, userTaskId, userTaskResult);
  }
}
