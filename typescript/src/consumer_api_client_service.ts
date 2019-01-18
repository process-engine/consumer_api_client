import * as EssentialProjectErrors from '@essential-projects/errors_ts';
import {Subscription} from '@essential-projects/event_aggregator_contracts';
import {IIdentity} from '@essential-projects/iam_contracts';

import {
  DataModels,
  IConsumerApi,
  IConsumerApiAccessor,
  Messages,
} from '@process-engine/consumer_api_contracts';

export class ConsumerApiClientService implements IConsumerApi {

  private consumerApiAccessor: IConsumerApiAccessor = undefined;

  constructor(consumerApiAccessor: IConsumerApiAccessor) {
    this.consumerApiAccessor = consumerApiAccessor;
  }

  // Notifications
  public async onUserTaskWaiting(identity: IIdentity, callback: Messages.CallbackTypes.OnUserTaskWaitingCallback): Promise<Subscription> {
    return this.consumerApiAccessor.onUserTaskWaiting(identity, callback);
  }

  public async onUserTaskFinished(identity: IIdentity, callback: Messages.CallbackTypes.OnUserTaskFinishedCallback): Promise<Subscription> {
    return this.consumerApiAccessor.onUserTaskFinished(identity, callback);
  }

  public async onUserTaskForIdentityWaiting(identity: IIdentity, callback: Messages.CallbackTypes.OnUserTaskWaitingCallback): Promise<Subscription> {
    return this.consumerApiAccessor.onUserTaskForIdentityWaiting(identity, callback);
  }

  public async onUserTaskForIdentityFinished(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnUserTaskFinishedCallback,
  ): Promise<Subscription> {
    return this.consumerApiAccessor.onUserTaskForIdentityFinished(identity, callback);
  }

  public async onProcessTerminated(identity: IIdentity, callback: Messages.CallbackTypes.OnProcessTerminatedCallback): Promise<Subscription> {
    return this.consumerApiAccessor.onProcessTerminated(identity, callback);
  }

  public async onProcessStarted(identity: IIdentity, callback: Messages.CallbackTypes.OnProcessStartedCallback): Promise<Subscription> {
    return this.consumerApiAccessor.onProcessStarted(identity, callback);
  }

  public async onProcessWithProcessModelIdStarted(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnProcessStartedCallback,
    processModelId: string,
  ): Promise<Subscription> {
    return this.consumerApiAccessor.onProcessWithProcessModelIdStarted(identity, callback, processModelId);
  }

  public async onManualTaskWaiting(identity: IIdentity, callback: Messages.CallbackTypes.OnManualTaskWaitingCallback): Promise<Subscription> {
    return this.consumerApiAccessor.onManualTaskWaiting(identity, callback);
  }

  public async onManualTaskFinished(identity: IIdentity, callback: Messages.CallbackTypes.OnManualTaskFinishedCallback): Promise<Subscription> {
    return this.consumerApiAccessor.onManualTaskFinished(identity, callback);
  }

  public async onManualTaskForIdentityWaiting(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnManualTaskWaitingCallback,
  ): Promise<Subscription> {
    return this.consumerApiAccessor.onManualTaskForIdentityWaiting(identity, callback);
  }

  public async onManualTaskForIdentityFinished(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnManualTaskFinishedCallback,
  ): Promise<Subscription> {
    return this.consumerApiAccessor.onManualTaskForIdentityFinished(identity, callback);
  }

  public async onProcessEnded(identity: IIdentity, callback: Messages.CallbackTypes.OnProcessEndedCallback): Promise<Subscription> {
    return this.consumerApiAccessor.onProcessEnded(identity, callback);
  }

  // Process models and instances
  public async getProcessModels(identity: IIdentity): Promise<DataModels.ProcessModels.ProcessModelList> {
    return this.consumerApiAccessor.getProcessModels(identity);
  }

  public async getProcessModelById(identity: IIdentity, processModelId: string): Promise<DataModels.ProcessModels.ProcessModel> {
    return this.consumerApiAccessor.getProcessModelById(identity, processModelId);
  }

  public async startProcessInstance(identity: IIdentity,
                                    processModelId: string,
                                    startEventId: string,
                                    payload: DataModels.ProcessModels.ProcessStartRequestPayload,
                                    startCallbackType?: DataModels.ProcessModels.StartCallbackType,
                                    endEventId?: string,
                                  ): Promise<DataModels.ProcessModels.ProcessStartResponsePayload> {

    const useDefaultStartCallbackType: boolean = !startCallbackType;
    if (useDefaultStartCallbackType) {
      startCallbackType = DataModels.ProcessModels.StartCallbackType.CallbackOnProcessInstanceCreated;
    }

    const invalidStartCallbackType: boolean = !Object.values(DataModels.ProcessModels.StartCallbackType).includes(startCallbackType);
    if (invalidStartCallbackType) {
      throw new EssentialProjectErrors.BadRequestError(`${startCallbackType} is not a valid return option!`);
    }

    const noEndEventIdProvided: boolean = startCallbackType === DataModels.ProcessModels.StartCallbackType.CallbackOnEndEventReached && !endEventId;
    if (noEndEventIdProvided) {
      throw new EssentialProjectErrors.BadRequestError(`Must provide an EndEventId, when using callback type 'CallbackOnEndEventReached'!`);
    }

    return this.consumerApiAccessor.startProcessInstance(identity, processModelId, startEventId, payload, startCallbackType, endEventId);
  }

  public async getProcessResultForCorrelation(
    identity: IIdentity,
    correlationId: string,
    processModelId: string,
  ): Promise<Array<DataModels.CorrelationResult>> {

    return this.consumerApiAccessor.getProcessResultForCorrelation(identity, correlationId, processModelId);
  }

  public async getProcessInstancesByIdentity(identity: IIdentity): Promise<Array<DataModels.ProcessInstance>> {
    return this.consumerApiAccessor.getProcessInstancesByIdentity(identity);
  }

  // Events
  public async getEventsForProcessModel(identity: IIdentity, processModelId: string): Promise<DataModels.Events.EventList> {
    return this.consumerApiAccessor.getEventsForProcessModel(identity, processModelId);
  }

  public async getEventsForCorrelation(identity: IIdentity, correlationId: string): Promise<DataModels.Events.EventList> {
    return this.consumerApiAccessor.getEventsForCorrelation(identity, correlationId);
  }

  public async getEventsForProcessModelInCorrelation(
    identity: IIdentity,
    processModelId: string,
    correlationId: string,
  ): Promise<DataModels.Events.EventList> {
    return this.consumerApiAccessor.getEventsForProcessModelInCorrelation(identity, processModelId, correlationId);
  }

  public async triggerMessageEvent(identity: IIdentity, messageName: string, payload?: DataModels.Events.EventTriggerPayload): Promise<void> {
    return this.consumerApiAccessor.triggerMessageEvent(identity, messageName, payload);
  }

  public async triggerSignalEvent(identity: IIdentity, signalName: string, payload?: DataModels.Events.EventTriggerPayload): Promise<void> {
    return this.consumerApiAccessor.triggerSignalEvent(identity, signalName, payload);
  }

  // UserTasks
  public async getUserTasksForProcessModel(identity: IIdentity, processModelId: string): Promise<DataModels.UserTasks.UserTaskList> {
    return this.consumerApiAccessor.getUserTasksForProcessModel(identity, processModelId);
  }

  public async getUserTasksForCorrelation(identity: IIdentity, correlationId: string): Promise<DataModels.UserTasks.UserTaskList> {
    return this.consumerApiAccessor.getUserTasksForCorrelation(identity, correlationId);
  }

  public async getUserTasksForProcessModelInCorrelation(identity: IIdentity,
                                                        processModelId: string,
                                                        correlationId: string): Promise<DataModels.UserTasks.UserTaskList> {

    return this.consumerApiAccessor.getUserTasksForProcessModelInCorrelation(identity, processModelId, correlationId);
  }

  public async getWaitingUserTasksByIdentity(identity: IIdentity): Promise<DataModels.UserTasks.UserTaskList> {
    return this.consumerApiAccessor.getWaitingUserTasksByIdentity(identity);
  }

  public async finishUserTask(
    identity: IIdentity,
    processInstanceId: string,
    correlationId: string,
    userTaskInstanceId: string,
    userTaskResult: DataModels.UserTasks.UserTaskResult,
  ): Promise<void> {

    return this.consumerApiAccessor.finishUserTask(identity, processInstanceId, correlationId, userTaskInstanceId, userTaskResult);
  }

  // ManualTasks
  public async getManualTasksForProcessModel(identity: IIdentity, processModelId: string): Promise<DataModels.ManualTasks.ManualTaskList> {
    return this.consumerApiAccessor.getManualTasksForProcessModel(identity, processModelId);
  }

  public async getManualTasksForCorrelation(identity: IIdentity, correlationId: string): Promise<DataModels.ManualTasks.ManualTaskList> {
    return this.consumerApiAccessor.getManualTasksForCorrelation(identity, correlationId);
  }

  public async getManualTasksForProcessModelInCorrelation(identity: IIdentity,
                                                          processModelId: string,
                                                          correlationId: string): Promise<DataModels.ManualTasks.ManualTaskList> {

    return this.consumerApiAccessor.getManualTasksForProcessModelInCorrelation(identity, processModelId, correlationId);
  }

  public async getWaitingManualTasksByIdentity(identity: IIdentity): Promise<DataModels.ManualTasks.ManualTaskList> {
    return this.consumerApiAccessor.getWaitingManualTasksByIdentity(identity);
  }

  public async finishManualTask(identity: IIdentity,
                                processInstanceId: string,
                                correlationId: string,
                                manualTaskInstanceId: string): Promise<void> {

  return this.consumerApiAccessor.finishManualTask(identity, processInstanceId, correlationId, manualTaskInstanceId);
  }
}
