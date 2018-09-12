import * as EssentialProjectErrors from '@essential-projects/errors_ts';
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
  ProcessEndedMessage,
  UserTaskFinishedMessage,
  UserTaskWaitingMessage,
} from '@process-engine/process_engine_contracts';

export class ConsumerApiClientService implements IConsumerApi {

  private consumerApiAccessor: IConsumerApiAccessor = undefined;

  constructor(consumerApiAccessor: IConsumerApiAccessor) {
    this.consumerApiAccessor = consumerApiAccessor;
  }

  // public onUserTaskWaiting(correlationId: string, callback: (userTaskFinished: UserTaskFinishedMessage) => void|Promise<void>): void {
  //   this.consumerApiAccessor.onUserTaskWaiting((userTaskFinished: UserTaskFinishedMessage) => {
  //     if (userTaskFinished.correlationId === correlationId) {
  //       callback(userTaskFinished);
  //     }
  //   });
  // }

  public onUserTaskWaiting(callback: (userTaskWaiting: UserTaskWaitingMessage) => void|Promise<void>): void {
    this.consumerApiAccessor.onUserTaskWaiting((userTaskWaiting: UserTaskWaitingMessage) => {
      callback(userTaskWaiting);
    });
  }

  public onUserTaskFinished(callback: (userTaskFinished: UserTaskFinishedMessage) => void|Promise<void>): void {
    this.consumerApiAccessor.onUserTaskFinished((userTaskFinished: UserTaskFinishedMessage) => {
      callback(userTaskFinished);
    });
  }

  public onProcessTerminated(callback: (processTerminated: ProcessEndedMessage) => void|Promise<void>): void {
    this.consumerApiAccessor.onProcessTerminated((processTerminated: ProcessEndedMessage) => {
      callback(processTerminated);
    });
  }

  public onProcessEnded(callback: (processEnded: ProcessEndedMessage) => void|Promise<void>): void {
    this.consumerApiAccessor.onProcessEnded((processEnded: ProcessEndedMessage) => {
      callback(processEnded);
    });
  }

  public async getProcessModels(identity: IIdentity): Promise<ProcessModelList> {

    return this.consumerApiAccessor.getProcessModels(identity);
  }

  public async getProcessModelById(identity: IIdentity, processModelId: string): Promise<ProcessModel> {

    return this.consumerApiAccessor.getProcessModelById(identity, processModelId);
  }

  public async startProcessInstance(identity: IIdentity,
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

    return this.consumerApiAccessor.startProcessInstance(identity, processModelId, startEventId, payload, startCallbackType, endEventId);
  }

  public async getProcessResultForCorrelation(identity: IIdentity,
                                              correlationId: string,
                                              processModelId: string): Promise<Array<CorrelationResult>> {

    return this.consumerApiAccessor.getProcessResultForCorrelation(identity, correlationId, processModelId);
  }

  // Events
  public async getEventsForProcessModel(identity: IIdentity, processModelId: string): Promise<EventList> {

    return this.consumerApiAccessor.getEventsForProcessModel(identity, processModelId);
  }

  public async getEventsForCorrelation(identity: IIdentity, correlationId: string): Promise<EventList> {

    return this.consumerApiAccessor.getEventsForCorrelation(identity, correlationId);
  }

  public async getEventsForProcessModelInCorrelation(identity: IIdentity, processModelId: string, correlationId: string): Promise<EventList> {

    return this.consumerApiAccessor.getEventsForProcessModelInCorrelation(identity, processModelId, correlationId);
  }

  public async triggerEvent(identity: IIdentity,
                            processModelId: string,
                            correlationId: string,
                            eventId: string,
                            eventTriggerPayload?: EventTriggerPayload): Promise<void> {

    return this.consumerApiAccessor.triggerEvent(identity, processModelId, correlationId, eventId, eventTriggerPayload);
  }

  // UserTasks
  public async getUserTasksForProcessModel(identity: IIdentity, processModelId: string): Promise<UserTaskList> {

    return this.consumerApiAccessor.getUserTasksForProcessModel(identity, processModelId);
  }

  public async getUserTasksForCorrelation(identity: IIdentity, correlationId: string): Promise<UserTaskList> {

    return this.consumerApiAccessor.getUserTasksForCorrelation(identity, correlationId);
  }

  public async getUserTasksForProcessModelInCorrelation(identity: IIdentity,
                                                        processModelId: string,
                                                        correlationId: string): Promise<UserTaskList> {

    return this.consumerApiAccessor.getUserTasksForProcessModelInCorrelation(identity, processModelId, correlationId);
  }

  public async finishUserTask(identity: IIdentity,
                              processModelId: string,
                              correlationId: string,
                              userTaskId: string,
                              userTaskResult: UserTaskResult): Promise<void> {

    return this.consumerApiAccessor.finishUserTask(identity, processModelId, correlationId, userTaskId, userTaskResult);
  }
}
