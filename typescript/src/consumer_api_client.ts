import * as EssentialProjectErrors from '@essential-projects/errors_ts';
import {Subscription} from '@essential-projects/event_aggregator_contracts';
import {IIdentity} from '@essential-projects/iam_contracts';

import {
  DataModels,
  IConsumerApiAccessor,
  IConsumerApiClient,
  Messages,
} from '@process-engine/consumer_api_contracts';

export class ConsumerApiClient implements IConsumerApiClient {

  private consumerApiAccessor: IConsumerApiAccessor = undefined;

  constructor(consumerApiAccessor: IConsumerApiAccessor) {
    this.consumerApiAccessor = consumerApiAccessor;
  }

  public async getApplicationInfo(identity: IIdentity): Promise<DataModels.ApplicationInfo> {
    return this.consumerApiAccessor.getApplicationInfo(identity);
  }

  // Notifications
  public async onActivityReached(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnActivityReachedCallback,
    subscribeOnce: boolean = false,
  ): Promise<Subscription> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.onActivityReached(identity, callback, subscribeOnce);
  }

  public async onActivityFinished(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnActivityFinishedCallback,
    subscribeOnce: boolean = false,
  ): Promise<Subscription> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.onActivityFinished(identity, callback, subscribeOnce);
  }

  public async onEmptyActivityWaiting(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnEmptyActivityWaitingCallback,
    subscribeOnce: boolean = false,
  ): Promise<Subscription> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.onEmptyActivityWaiting(identity, callback, subscribeOnce);
  }

  public async onEmptyActivityFinished(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnEmptyActivityFinishedCallback,
    subscribeOnce: boolean = false,
  ): Promise<Subscription> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.onEmptyActivityFinished(identity, callback, subscribeOnce);
  }

  public async onEmptyActivityForIdentityWaiting(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnEmptyActivityWaitingCallback,
    subscribeOnce: boolean = false,
  ): Promise<Subscription> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.onEmptyActivityForIdentityWaiting(identity, callback, subscribeOnce);
  }

  public async onEmptyActivityForIdentityFinished(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnEmptyActivityFinishedCallback,
    subscribeOnce: boolean = false,
  ): Promise<Subscription> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.onEmptyActivityForIdentityFinished(identity, callback, subscribeOnce);
  }

  public async onUserTaskWaiting(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnUserTaskWaitingCallback,
    subscribeOnce: boolean = false,
  ): Promise<Subscription> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.onUserTaskWaiting(identity, callback, subscribeOnce);
  }

  public async onUserTaskFinished(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnUserTaskFinishedCallback,
    subscribeOnce: boolean = false,
  ): Promise<Subscription> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.onUserTaskFinished(identity, callback, subscribeOnce);
  }

  public async onUserTaskForIdentityWaiting(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnUserTaskWaitingCallback,
    subscribeOnce: boolean = false,
  ): Promise<Subscription> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.onUserTaskForIdentityWaiting(identity, callback, subscribeOnce);
  }

  public async onUserTaskForIdentityFinished(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnUserTaskFinishedCallback,
    subscribeOnce: boolean = false,
  ): Promise<Subscription> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.onUserTaskForIdentityFinished(identity, callback, subscribeOnce);
  }

  public async onBoundaryEventTriggered(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnBoundaryEventTriggeredCallback,
    subscribeOnce: boolean = false,
  ): Promise<Subscription> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.onBoundaryEventTriggered(identity, callback, subscribeOnce);
  }

  public async onIntermediateThrowEventTriggered(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnIntermediateThrowEventTriggeredCallback,
    subscribeOnce: boolean = false,
  ): Promise<Subscription> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.onIntermediateThrowEventTriggered(identity, callback, subscribeOnce);
  }

  public async onIntermediateCatchEventReached(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnIntermediateCatchEventReachedCallback,
    subscribeOnce: boolean = false,
  ): Promise<Subscription> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.onIntermediateCatchEventReached(identity, callback, subscribeOnce);
  }

  public async onIntermediateCatchEventFinished(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnIntermediateCatchEventFinishedCallback,
    subscribeOnce: boolean = false,
  ): Promise<Subscription> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.onIntermediateCatchEventFinished(identity, callback, subscribeOnce);
  }

  public async onProcessTerminated(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnProcessTerminatedCallback,
    subscribeOnce: boolean = false,
  ): Promise<Subscription> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.onProcessTerminated(identity, callback, subscribeOnce);
  }

  public async onProcessError(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnProcessErrorCallback,
    subscribeOnce: boolean = false,
  ): Promise<Subscription> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.onProcessError(identity, callback, subscribeOnce);
  }

  public async onProcessStarted(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnProcessStartedCallback,
    subscribeOnce: boolean = false,
  ): Promise<Subscription> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.onProcessStarted(identity, callback, subscribeOnce);
  }

  public async onProcessWithProcessModelIdStarted(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnProcessStartedCallback,
    processModelId: string,
    subscribeOnce: boolean = false,
  ): Promise<Subscription> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.onProcessWithProcessModelIdStarted(identity, callback, processModelId, subscribeOnce);
  }

  public async onManualTaskWaiting(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnManualTaskWaitingCallback,
    subscribeOnce: boolean = false,
  ): Promise<Subscription> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.onManualTaskWaiting(identity, callback, subscribeOnce);
  }

  public async onManualTaskFinished(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnManualTaskFinishedCallback,
    subscribeOnce: boolean = false,
  ): Promise<Subscription> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.onManualTaskFinished(identity, callback, subscribeOnce);
  }

  public async onManualTaskForIdentityWaiting(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnManualTaskWaitingCallback,
    subscribeOnce: boolean = false,
  ): Promise<Subscription> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.onManualTaskForIdentityWaiting(identity, callback, subscribeOnce);
  }

  public async onManualTaskForIdentityFinished(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnManualTaskFinishedCallback,
    subscribeOnce: boolean = false,
  ): Promise<Subscription> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.onManualTaskForIdentityFinished(identity, callback, subscribeOnce);
  }

  public async onProcessEnded(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnProcessEndedCallback,
    subscribeOnce: boolean = false,
  ): Promise<Subscription> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.onProcessEnded(identity, callback, subscribeOnce);
  }

  public async removeSubscription(identity: IIdentity, subscription: Subscription): Promise<void> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.removeSubscription(identity, subscription);
  }

  // Process models and instances
  public async getProcessModels(
    identity: IIdentity,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.ProcessModels.ProcessModelList> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.getProcessModels(identity, offset, limit);
  }

  public async getProcessModelById(identity: IIdentity, processModelId: string): Promise<DataModels.ProcessModels.ProcessModel> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.getProcessModelById(identity, processModelId);
  }

  public async getProcessModelByProcessInstanceId(identity: IIdentity, processInstanceId: string): Promise<DataModels.ProcessModels.ProcessModel> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.getProcessModelByProcessInstanceId(identity, processInstanceId);
  }

  public async startProcessInstance(
    identity: IIdentity,
    processModelId: string,
    payload?: DataModels.ProcessModels.ProcessStartRequestPayload,
    startCallbackType?: DataModels.ProcessModels.StartCallbackType,
    startEventId?: string,
    endEventId?: string,
  ): Promise<DataModels.ProcessModels.ProcessStartResponsePayload> {
    this.ensureIsAuthorized(identity);

    let startCallbackTypeToUse = startCallbackType;

    const useDefaultStartCallbackType = !startCallbackTypeToUse;
    if (useDefaultStartCallbackType) {
      startCallbackTypeToUse = DataModels.ProcessModels.StartCallbackType.CallbackOnProcessInstanceCreated;
    }

    const invalidStartCallbackType = !Object.values(DataModels.ProcessModels.StartCallbackType).includes(startCallbackTypeToUse);
    if (invalidStartCallbackType) {
      throw new EssentialProjectErrors.BadRequestError(`${startCallbackTypeToUse} is not a valid return option!`);
    }

    const noEndEventIdProvided = startCallbackTypeToUse === DataModels.ProcessModels.StartCallbackType.CallbackOnEndEventReached && !endEventId;
    if (noEndEventIdProvided) {
      throw new EssentialProjectErrors.BadRequestError('Must provide an EndEventId, when using callback type \'CallbackOnEndEventReached\'!');
    }

    return this.consumerApiAccessor.startProcessInstance(identity, processModelId, payload, startCallbackTypeToUse, startEventId, endEventId);
  }

  public async getProcessResultForCorrelation(
    identity: IIdentity,
    correlationId: string,
    processModelId: string,
  ): Promise<DataModels.Correlations.CorrelationResultList> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.getProcessResultForCorrelation(identity, correlationId, processModelId);
  }

  public async getProcessInstancesByIdentity(
    identity: IIdentity,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.ProcessModels.ProcessInstanceList> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.getProcessInstancesByIdentity(identity, offset, limit);
  }

  // Empty Activities
  public async getEmptyActivitiesForProcessModel(
    identity: IIdentity,
    processModelId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.EmptyActivities.EmptyActivityList> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.getEmptyActivitiesForProcessModel(identity, processModelId, offset, limit);
  }

  public async getEmptyActivitiesForProcessInstance(
    identity: IIdentity,
    processInstanceId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.EmptyActivities.EmptyActivityList> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.getEmptyActivitiesForProcessInstance(identity, processInstanceId, offset, limit);
  }

  public async getEmptyActivitiesForCorrelation(
    identity: IIdentity,
    correlationId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.EmptyActivities.EmptyActivityList> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.getEmptyActivitiesForCorrelation(identity, correlationId, offset, limit);
  }

  public async getEmptyActivitiesForProcessModelInCorrelation(
    identity: IIdentity,
    processModelId: string,
    correlationId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.EmptyActivities.EmptyActivityList> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.getEmptyActivitiesForProcessModelInCorrelation(identity, processModelId, correlationId, offset, limit);
  }

  public async getWaitingEmptyActivitiesByIdentity(
    identity: IIdentity,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.EmptyActivities.EmptyActivityList> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.getWaitingEmptyActivitiesByIdentity(identity, offset, limit);
  }

  public async finishEmptyActivity(
    identity: IIdentity,
    processInstanceId: string,
    correlationId: string,
    emptyActivityInstanceId: string,
  ): Promise<void> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.finishEmptyActivity(identity, processInstanceId, correlationId, emptyActivityInstanceId);
  }

  // Events
  public async getEventsForProcessModel(
    identity: IIdentity,
    processModelId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.Events.EventList> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.getEventsForProcessModel(identity, processModelId, offset, limit);
  }

  public async getEventsForCorrelation(
    identity: IIdentity,
    correlationId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.Events.EventList> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.getEventsForCorrelation(identity, correlationId, offset, limit);
  }

  public async getEventsForProcessModelInCorrelation(
    identity: IIdentity,
    processModelId: string,
    correlationId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.Events.EventList> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.getEventsForProcessModelInCorrelation(identity, processModelId, correlationId, offset, limit);
  }

  public async triggerMessageEvent(identity: IIdentity, messageName: string, payload?: DataModels.Events.EventTriggerPayload): Promise<void> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.triggerMessageEvent(identity, messageName, payload);
  }

  public async triggerSignalEvent(identity: IIdentity, signalName: string, payload?: DataModels.Events.EventTriggerPayload): Promise<void> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.triggerSignalEvent(identity, signalName, payload);
  }

  // ExternalTask
  public async fetchAndLockExternalTasks<TPayloadType>(
    identity: IIdentity,
    workerId: string,
    topicName: string,
    maxTasks: number,
    longPollingTimeout: number,
    lockDuration: number,
  ): Promise<Array<DataModels.ExternalTask.ExternalTask<TPayloadType>>> {
    this.ensureIsAuthorized(identity);

    return this
      .consumerApiAccessor
      .fetchAndLockExternalTasks<TPayloadType>(identity, workerId, topicName, maxTasks, longPollingTimeout, lockDuration);
  }

  public async extendLock(identity: IIdentity, workerId: string, externalTaskId: string, additionalDuration: number): Promise<void> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.extendLock(identity, workerId, externalTaskId, additionalDuration);
  }

  public async handleBpmnError(
    identity: IIdentity,
    workerId: string,
    externalTaskId: string,
    errorCode: string,
    errorMessage?: string,
  ): Promise<void> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.handleBpmnError(identity, workerId, externalTaskId, errorCode, errorMessage);
  }

  public async handleServiceError(
    identity: IIdentity,
    workerId: string,
    externalTaskId: string,
    errorMessage: string,
    errorDetails: string,
    errorCode?: string,
  ): Promise<void> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.handleServiceError(identity, workerId, externalTaskId, errorMessage, errorDetails, errorCode);
  }

  public async finishExternalTask<TResultType>(identity: IIdentity, workerId: string, externalTaskId: string, payload: TResultType): Promise<void> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.finishExternalTask<TResultType>(identity, workerId, externalTaskId, payload);
  }

  // ManualTasks
  public async getManualTasksForProcessModel(
    identity: IIdentity,
    processModelId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.ManualTasks.ManualTaskList> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.getManualTasksForProcessModel(identity, processModelId, offset, limit);
  }

  public async getManualTasksForProcessInstance(
    identity: IIdentity,
    processInstanceId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.ManualTasks.ManualTaskList> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.getManualTasksForProcessInstance(identity, processInstanceId, offset, limit);
  }

  public async getManualTasksForCorrelation(
    identity: IIdentity,
    correlationId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.ManualTasks.ManualTaskList> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.getManualTasksForCorrelation(identity, correlationId, offset, limit);
  }

  public async getManualTasksForProcessModelInCorrelation(
    identity: IIdentity,
    processModelId: string,
    correlationId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.ManualTasks.ManualTaskList> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.getManualTasksForProcessModelInCorrelation(identity, processModelId, correlationId, offset, limit);
  }

  public async getWaitingManualTasksByIdentity(
    identity: IIdentity,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.ManualTasks.ManualTaskList> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.getWaitingManualTasksByIdentity(identity, offset, limit);
  }

  public async finishManualTask(
    identity: IIdentity,
    processInstanceId: string,
    correlationId: string,
    manualTaskInstanceId: string,
  ): Promise<void> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.finishManualTask(identity, processInstanceId, correlationId, manualTaskInstanceId);
  }

  // UserTasks
  public async getUserTasksForProcessModel(
    identity: IIdentity,
    processModelId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.UserTasks.UserTaskList> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.getUserTasksForProcessModel(identity, processModelId, offset, limit);
  }

  public async getUserTasksForProcessInstance(
    identity: IIdentity,
    processInstanceId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.UserTasks.UserTaskList> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.getUserTasksForProcessInstance(identity, processInstanceId, offset, limit);
  }

  public async getUserTasksForCorrelation(
    identity: IIdentity,
    correlationId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.UserTasks.UserTaskList> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.getUserTasksForCorrelation(identity, correlationId, offset, limit);
  }

  public async getUserTasksForProcessModelInCorrelation(
    identity: IIdentity,
    processModelId: string,
    correlationId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.UserTasks.UserTaskList> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.getUserTasksForProcessModelInCorrelation(identity, processModelId, correlationId, offset, limit);
  }

  public async getWaitingUserTasksByIdentity(
    identity: IIdentity,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.UserTasks.UserTaskList> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.getWaitingUserTasksByIdentity(identity, offset, limit);
  }

  public async finishUserTask(
    identity: IIdentity,
    processInstanceId: string,
    correlationId: string,
    userTaskInstanceId: string,
    userTaskResult: DataModels.UserTasks.UserTaskResult,
  ): Promise<void> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.finishUserTask(identity, processInstanceId, correlationId, userTaskInstanceId, userTaskResult);
  }

  // Tasks
  public async getAllSuspendedTasks(
    identity: IIdentity,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.FlowNodeInstances.TaskList> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.getAllSuspendedTasks(identity, offset, limit);
  }

  public async getSuspendedTasksForProcessModel(
    identity: IIdentity,
    processModelId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.FlowNodeInstances.TaskList> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.getSuspendedTasksForProcessModel(identity, processModelId, offset, limit);
  }

  public async getSuspendedTasksForProcessInstance(
    identity: IIdentity,
    processInstanceId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.FlowNodeInstances.TaskList> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.getSuspendedTasksForProcessInstance(identity, processInstanceId, offset, limit);
  }

  public async getSuspendedTasksForCorrelation(
    identity: IIdentity,
    correlationId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.FlowNodeInstances.TaskList> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.getSuspendedTasksForCorrelation(identity, correlationId, offset, limit);
  }

  public async getSuspendedTasksForProcessModelInCorrelation(
    identity: IIdentity,
    processModelId: string,
    correlationId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.FlowNodeInstances.TaskList> {
    this.ensureIsAuthorized(identity);

    return this.consumerApiAccessor.getSuspendedTasksForProcessModelInCorrelation(identity, processModelId, correlationId, offset, limit);
  }

  private ensureIsAuthorized(identity: IIdentity): void {
    const noAuthTokenProvided = !identity || typeof identity.token !== 'string';
    if (noAuthTokenProvided) {
      throw new EssentialProjectErrors.UnauthorizedError('No auth token provided!');
    }
  }

}
