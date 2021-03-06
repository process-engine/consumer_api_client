/* eslint-disable max-lines */
import * as uuid from 'node-uuid';
import * as io from 'socket.io-client';

import {UnauthorizedError} from '@essential-projects/errors_ts';
import {Subscription} from '@essential-projects/event_aggregator_contracts';
import {IHttpClient, IRequestOptions} from '@essential-projects/http_contracts';
import {IIdentity} from '@essential-projects/iam_contracts';

import {
  DataModels,
  IConsumerApiAccessor,
  IConsumerSocketIoAccessor,
  Messages,
  restSettings,
  socketSettings,
} from '@process-engine/consumer_api_contracts';

/**
 * Associates a Socket with a userId taken from an IIdentity.
 */
type IdentitySocketCollection = {[userId: string]: SocketIOClient.Socket};

/**
 * Connects a Subscription ID to a specific callback.
 * This allows us to remove that Subscription from SocketIO
 * when "ExternalAccessor.removeSubscription" is called.
 */
type SubscriptionCallbackAssociation = {[subscriptionId: string]: Function};

export class ExternalAccessor implements IConsumerApiAccessor, IConsumerSocketIoAccessor {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public config: any;

  private baseUrl = 'api/consumer/v1';

  private socketCollection: IdentitySocketCollection = {};
  private subscriptionCollection: SubscriptionCallbackAssociation = {};

  private httpClient: IHttpClient = undefined;

  constructor(httpClient: IHttpClient) {
    this.httpClient = httpClient;
  }

  public initializeSocket(identity: IIdentity): void {
    this.createSocketForIdentity(identity);
  }

  public disconnectSocket(identity: IIdentity): void {
    this.removeSocketForIdentity(identity);
  }

  // Application Info

  public async getApplicationInfo(identity: IIdentity): Promise<DataModels.ApplicationInfo> {
    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const url = this.buildUrl(restSettings.paths.getApplicationInfo);

    const httpResponse = await this.httpClient.get<DataModels.ApplicationInfo>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  // Notifications

  public async onActivityReached(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnActivityReachedCallback,
    subscribeOnce: boolean = false,
  ): Promise<Subscription> {
    return this.createSocketIoSubscription<typeof callback>(identity, socketSettings.paths.activityReached, callback, subscribeOnce);
  }

  public async onActivityFinished(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnActivityFinishedCallback,
    subscribeOnce: boolean = false,
  ): Promise<Subscription> {
    return this.createSocketIoSubscription<typeof callback>(identity, socketSettings.paths.activityFinished, callback, subscribeOnce);
  }

  public async onEmptyActivityWaiting(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnEmptyActivityWaitingCallback,
    subscribeOnce = false,
  ): Promise<Subscription> {
    return this.createSocketIoSubscription<typeof callback>(identity, socketSettings.paths.emptyActivityWaiting, callback, subscribeOnce);
  }

  public async onEmptyActivityFinished(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnEmptyActivityFinishedCallback,
    subscribeOnce = false,
  ): Promise<Subscription> {
    return this.createSocketIoSubscription<typeof callback>(identity, socketSettings.paths.emptyActivityFinished, callback, subscribeOnce);
  }

  public async onEmptyActivityForIdentityWaiting(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnEmptyActivityWaitingCallback,
    subscribeOnce = false,
  ): Promise<Subscription> {
    const socketEventName = socketSettings.paths.emptyActivityForIdentityWaiting
      .replace(socketSettings.pathParams.userId, identity.userId);

    return this.createSocketIoSubscription<typeof callback>(identity, socketEventName, callback, subscribeOnce);
  }

  public async onEmptyActivityForIdentityFinished(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnEmptyActivityFinishedCallback,
    subscribeOnce = false,
  ): Promise<Subscription> {
    const socketEventName = socketSettings.paths.emptyActivityForIdentityFinished
      .replace(socketSettings.pathParams.userId, identity.userId);

    return this.createSocketIoSubscription<typeof callback>(identity, socketEventName, callback, subscribeOnce);
  }

  public async onUserTaskWaiting(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnUserTaskWaitingCallback,
    subscribeOnce = false,
  ): Promise<Subscription> {
    return this.createSocketIoSubscription<typeof callback>(identity, socketSettings.paths.userTaskWaiting, callback, subscribeOnce);
  }

  public async onUserTaskFinished(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnUserTaskFinishedCallback,
    subscribeOnce = false,
  ): Promise<Subscription> {
    return this.createSocketIoSubscription<typeof callback>(identity, socketSettings.paths.userTaskFinished, callback, subscribeOnce);
  }

  public async onBoundaryEventTriggered(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnBoundaryEventTriggeredCallback,
    subscribeOnce: boolean = false,
  ): Promise<Subscription> {
    return this.createSocketIoSubscription<typeof callback>(identity, socketSettings.paths.boundaryEventTriggered, callback, subscribeOnce);
  }

  public async onIntermediateThrowEventTriggered(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnIntermediateThrowEventTriggeredCallback,
    subscribeOnce: boolean = false,
  ): Promise<Subscription> {
    return this.createSocketIoSubscription<typeof callback>(identity, socketSettings.paths.intermediateThrowEventTriggered, callback, subscribeOnce);
  }

  public async onIntermediateCatchEventReached(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnIntermediateCatchEventReachedCallback,
    subscribeOnce: boolean = false,
  ): Promise<Subscription> {
    return this.createSocketIoSubscription<typeof callback>(identity, socketSettings.paths.intermediateCatchEventReached, callback, subscribeOnce);
  }

  public async onIntermediateCatchEventFinished(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnIntermediateCatchEventFinishedCallback,
    subscribeOnce: boolean = false,
  ): Promise<Subscription> {
    return this.createSocketIoSubscription<typeof callback>(identity, socketSettings.paths.intermediateCatchEventFinished, callback, subscribeOnce);
  }

  public async onUserTaskForIdentityWaiting(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnUserTaskWaitingCallback,
    subscribeOnce = false,
  ): Promise<Subscription> {
    const socketEventName = socketSettings.paths.userTaskForIdentityWaiting
      .replace(socketSettings.pathParams.userId, identity.userId);

    return this.createSocketIoSubscription<typeof callback>(identity, socketEventName, callback, subscribeOnce);
  }

  public async onUserTaskForIdentityFinished(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnUserTaskFinishedCallback,
    subscribeOnce = false,
  ): Promise<Subscription> {
    const socketEventName = socketSettings.paths.userTaskForIdentityFinished
      .replace(socketSettings.pathParams.userId, identity.userId);

    return this.createSocketIoSubscription<typeof callback>(identity, socketEventName, callback, subscribeOnce);
  }

  public async onProcessTerminated(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnProcessTerminatedCallback,
    subscribeOnce = false,
  ): Promise<Subscription> {
    return this.createSocketIoSubscription<typeof callback>(identity, socketSettings.paths.processTerminated, callback, subscribeOnce);
  }

  public async onProcessError(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnProcessErrorCallback,
    subscribeOnce = false,
  ): Promise<Subscription> {
    return this.createSocketIoSubscription<typeof callback>(identity, socketSettings.paths.processError, callback, subscribeOnce);
  }

  public async onProcessStarted(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnProcessStartedCallback,
    subscribeOnce = false,
  ): Promise<Subscription> {
    return this.createSocketIoSubscription<typeof callback>(identity, socketSettings.paths.processStarted, callback, subscribeOnce);
  }

  public async onProcessWithProcessModelIdStarted(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnProcessStartedCallback,
    processModelId: string,
    subscribeOnce = false,
  ): Promise<Subscription> {
    const eventName = socketSettings.paths.processInstanceStarted
      .replace(socketSettings.pathParams.processModelId, processModelId);

    return this.createSocketIoSubscription<typeof callback>(identity, eventName, callback, subscribeOnce);
  }

  public async onManualTaskWaiting(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnManualTaskWaitingCallback,
    subscribeOnce = false,
  ): Promise<Subscription> {
    return this.createSocketIoSubscription<typeof callback>(identity, socketSettings.paths.manualTaskWaiting, callback, subscribeOnce);
  }

  public async onManualTaskFinished(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnManualTaskFinishedCallback,
    subscribeOnce = false,
  ): Promise<Subscription> {
    return this.createSocketIoSubscription<typeof callback>(identity, socketSettings.paths.manualTaskFinished, callback, subscribeOnce);
  }

  public async onManualTaskForIdentityWaiting(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnManualTaskWaitingCallback,
    subscribeOnce = false,
  ): Promise<Subscription> {
    const socketEventName = socketSettings.paths.manualTaskForIdentityWaiting
      .replace(socketSettings.pathParams.userId, identity.userId);

    return this.createSocketIoSubscription<typeof callback>(identity, socketEventName, callback, subscribeOnce);
  }

  public async onManualTaskForIdentityFinished(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnManualTaskFinishedCallback,
    subscribeOnce = false,
  ): Promise<Subscription> {
    const socketEventName = socketSettings.paths.manualTaskForIdentityFinished
      .replace(socketSettings.pathParams.userId, identity.userId);

    return this.createSocketIoSubscription<typeof callback>(identity, socketEventName, callback, subscribeOnce);
  }

  public async onProcessEnded(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnProcessEndedCallback,
    subscribeOnce = false,
  ): Promise<Subscription> {
    return this.createSocketIoSubscription<typeof callback>(identity, socketSettings.paths.processEnded, callback, subscribeOnce);
  }

  public async removeSubscription(identity: IIdentity, subscription: Subscription): Promise<void> {

    const socketForIdentity = this.getSocketForIdentity(identity);
    if (!socketForIdentity) {
      return;
    }

    const callbackToRemove = this.subscriptionCollection[subscription.id];
    if (!callbackToRemove) {
      return;
    }

    socketForIdentity.off(subscription.eventName, callbackToRemove);

    delete this.subscriptionCollection[subscription.id];
  }

  // Process models and instances
  public async getProcessModels(
    identity: IIdentity,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.ProcessModels.ProcessModelList> {
    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const url = this.buildUrl(restSettings.paths.processModels, offset, limit);

    const httpResponse = await this.httpClient.get<DataModels.ProcessModels.ProcessModelList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getProcessModelById(identity: IIdentity, processModelId: string): Promise<DataModels.ProcessModels.ProcessModel> {
    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const urlRestPart = restSettings.paths.processModelById
      .replace(restSettings.params.processModelId, processModelId);

    const url = this.buildUrl(urlRestPart);

    const httpResponse = await this.httpClient.get<DataModels.ProcessModels.ProcessModel>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getProcessModelByProcessInstanceId(identity: IIdentity, processInstanceId: string): Promise<DataModels.ProcessModels.ProcessModel> {
    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const urlRestPart = restSettings.paths.processModelByProcessInstanceId
      .replace(restSettings.params.processInstanceId, processInstanceId);

    const url = this.buildUrl(urlRestPart);

    const httpResponse = await this.httpClient.get<DataModels.ProcessModels.ProcessModel>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async startProcessInstance(
    identity: IIdentity,
    processModelId: string,
    payload?: DataModels.ProcessModels.ProcessStartRequestPayload,
    startCallbackType?: DataModels.ProcessModels.StartCallbackType,
    startEventId?: string,
    endEventId?: string,
    processEndedCallback?: Messages.CallbackTypes.OnProcessEndedCallback,
  ): Promise<DataModels.ProcessModels.ProcessStartResponsePayload> {

    const url = this.buildStartProcessInstanceUrl(processModelId, startCallbackType, endEventId, startEventId);

    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const httpResponse = await this
      .httpClient
      // eslint-disable-next-line max-len
      .post<DataModels.ProcessModels.ProcessStartRequestPayload, DataModels.ProcessModels.ProcessStartResponsePayload>(url, payload, requestAuthHeaders);

    const socketIoSubscriptionRequired = processEndedCallback !== undefined;
    if (socketIoSubscriptionRequired) {
      const socketForIdentity = this.createSocketForIdentity(identity);
      socketForIdentity.once(socketSettings.paths.processEnded, processEndedCallback);
    }

    return httpResponse.result;
  }

  private buildStartProcessInstanceUrl(
    processModelId: string,
    startCallbackType: DataModels.ProcessModels.StartCallbackType,
    endEventId: string,
    startEventId?: string,
  ): string {

    const urlRestPart = restSettings.paths.startProcessInstance
      .replace(restSettings.params.processModelId, processModelId);

    let url = `${urlRestPart}?start_callback_type=${startCallbackType}`;

    const startEventIdIsGiven = startEventId !== undefined;
    if (startEventIdIsGiven) {
      url = `${url}&start_event_id=${startEventId}`;
    }

    const attachEndEventId = startCallbackType === DataModels.ProcessModels.StartCallbackType.CallbackOnEndEventReached;
    if (attachEndEventId) {
      url = `${url}&end_event_id=${endEventId}`;
    }

    url = this.buildUrl(url);

    return url;
  }

  public async getProcessResultForCorrelation(
    identity: IIdentity,
    correlationId: string,
    processModelId: string,
  ): Promise<DataModels.Correlations.CorrelationResultList> {

    const urlRestPart = restSettings.paths.getProcessResultForCorrelation
      .replace(restSettings.params.correlationId, correlationId)
      .replace(restSettings.params.processModelId, processModelId);

    const url = this.buildUrl(urlRestPart);

    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const httpResponse = await this.httpClient.get<DataModels.Correlations.CorrelationResultList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getProcessInstancesByIdentity(
    identity: IIdentity,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.ProcessModels.ProcessInstanceList> {
    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const url = this.buildUrl(restSettings.paths.getOwnProcessInstances, offset, limit);

    const httpResponse = await this.httpClient.get<DataModels.ProcessModels.ProcessInstanceList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  // Empty Activities
  public async getEmptyActivitiesForProcessModel(
    identity: IIdentity,
    processModelId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.EmptyActivities.EmptyActivityList> {
    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const urlRestPart = restSettings.paths.processModelEmptyActivities
      .replace(restSettings.params.processModelId, processModelId);

    const url = this.buildUrl(urlRestPart, offset, limit);

    const httpResponse = await this.httpClient.get<DataModels.EmptyActivities.EmptyActivityList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getEmptyActivitiesForProcessInstance(
    identity: IIdentity,
    processInstanceId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.EmptyActivities.EmptyActivityList> {
    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const urlRestPart = restSettings.paths.processInstanceEmptyActivities
      .replace(restSettings.params.processInstanceId, processInstanceId);

    const url = this.buildUrl(urlRestPart, offset, limit);

    const httpResponse = await this.httpClient.get<DataModels.EmptyActivities.EmptyActivityList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getEmptyActivitiesForCorrelation(
    identity: IIdentity,
    correlationId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.EmptyActivities.EmptyActivityList> {
    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const urlRestPart = restSettings.paths.correlationEmptyActivities
      .replace(restSettings.params.correlationId, correlationId);

    const url = this.buildUrl(urlRestPart, offset, limit);

    const httpResponse = await this.httpClient.get<DataModels.EmptyActivities.EmptyActivityList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getEmptyActivitiesForProcessModelInCorrelation(
    identity: IIdentity,
    processModelId: string,
    correlationId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.EmptyActivities.EmptyActivityList> {
    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const urlRestPart = restSettings.paths.processModelCorrelationEmptyActivities
      .replace(restSettings.params.processModelId, processModelId)
      .replace(restSettings.params.correlationId, correlationId);

    const url = this.buildUrl(urlRestPart, offset, limit);

    const httpResponse = await this.httpClient.get<DataModels.EmptyActivities.EmptyActivityList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getWaitingEmptyActivitiesByIdentity(
    identity: IIdentity,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.EmptyActivities.EmptyActivityList> {
    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const url = this.buildUrl(restSettings.paths.getOwnEmptyActivities, offset, limit);

    const httpResponse = await this.httpClient.get<DataModels.EmptyActivities.EmptyActivityList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async finishEmptyActivity(
    identity: IIdentity,
    processInstanceId: string,
    correlationId: string,
    emptyActivityInstanceId: string,
  ): Promise<void> {
    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const urlRestPart = restSettings.paths.finishEmptyActivity
      .replace(restSettings.params.processInstanceId, processInstanceId)
      .replace(restSettings.params.correlationId, correlationId)
      .replace(restSettings.params.emptyActivityInstanceId, emptyActivityInstanceId);

    const url = this.buildUrl(urlRestPart);

    const body: {} = {};
    await this.httpClient.post(url, body, requestAuthHeaders);
  }

  // Events
  public async getEventsForProcessModel(
    identity: IIdentity,
    processModelId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.Events.EventList> {
    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const urlRestPart = restSettings.paths.processModelEvents
      .replace(restSettings.params.processModelId, processModelId);

    const url = this.buildUrl(urlRestPart, offset, limit);

    const httpResponse = await this.httpClient.get<DataModels.Events.EventList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getEventsForCorrelation(
    identity: IIdentity,
    correlationId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.Events.EventList> {
    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const urlRestPart = restSettings.paths.correlationEvents
      .replace(restSettings.params.correlationId, correlationId);

    const url = this.buildUrl(urlRestPart, offset, limit);

    const httpResponse = await this.httpClient.get<DataModels.Events.EventList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getEventsForProcessModelInCorrelation(
    identity: IIdentity,
    processModelId: string,
    correlationId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.Events.EventList> {
    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const urlRestPart = restSettings.paths.processModelCorrelationEvents
      .replace(restSettings.params.processModelId, processModelId)
      .replace(restSettings.params.correlationId, correlationId);

    const url = this.buildUrl(urlRestPart, offset, limit);

    const httpResponse = await this.httpClient.get<DataModels.Events.EventList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async triggerMessageEvent(identity: IIdentity, messageName: string, payload?: DataModels.Events.EventTriggerPayload): Promise<void> {
    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const urlRestPart = restSettings.paths.triggerMessageEvent
      .replace(restSettings.params.eventName, messageName);

    const url = this.buildUrl(urlRestPart);

    await this.httpClient.post<DataModels.Events.EventTriggerPayload, void>(url, payload, requestAuthHeaders);
  }

  public async triggerSignalEvent(identity: IIdentity, signalName: string, payload?: DataModels.Events.EventTriggerPayload): Promise<void> {
    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const urlRestPart = restSettings.paths.triggerSignalEvent
      .replace(restSettings.params.eventName, signalName);

    const url = this.buildUrl(urlRestPart);

    await this.httpClient.post<DataModels.Events.EventTriggerPayload, void>(url, payload, requestAuthHeaders);
  }

  // ExternalTasks
  public async fetchAndLockExternalTasks<TPayloadType>(
    identity: IIdentity,
    workerId: string,
    topicName: string,
    maxTasks: number,
    longPollingTimeout: number,
    lockDuration: number,
  ): Promise<Array<DataModels.ExternalTask.ExternalTask<TPayloadType>>> {

    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const urlRestPart = restSettings.paths.fetchAndLockExternalTasks;
    const url = this.buildUrl(urlRestPart);

    const payload = new DataModels.ExternalTask.FetchAndLockRequestPayload(workerId, topicName, maxTasks, longPollingTimeout, lockDuration);

    const httpResponse = await this
      .httpClient
      // eslint-disable-next-line max-len
      .post<DataModels.ExternalTask.FetchAndLockRequestPayload, Array<DataModels.ExternalTask.ExternalTask<TPayloadType>>>(url, payload, requestAuthHeaders);

    return httpResponse.result;
  }

  public async extendLock(identity: IIdentity, workerId: string, externalTaskId: string, additionalDuration: number): Promise<void> {

    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const urlRestPart = restSettings.paths.extendExternalTaskLock
      .replace(restSettings.params.externalTaskId, externalTaskId);

    const url = this.buildUrl(urlRestPart);

    const payload = new DataModels.ExternalTask.ExtendLockRequestPayload(workerId, additionalDuration);

    await this.httpClient.post<DataModels.ExternalTask.ExtendLockRequestPayload, void>(url, payload, requestAuthHeaders);
  }

  public async handleBpmnError(
    identity: IIdentity,
    workerId: string,
    externalTaskId: string,
    errorCode: string,
    errorMessage?: string,
  ): Promise<void> {

    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const urlRestPart = restSettings.paths.finishExternalTaskWithBpmnError
      .replace(restSettings.params.externalTaskId, externalTaskId);

    const url = this.buildUrl(urlRestPart);

    const payload = new DataModels.ExternalTask.HandleBpmnErrorRequestPayload(workerId, errorCode, errorMessage);

    await this.httpClient.post<DataModels.ExternalTask.HandleBpmnErrorRequestPayload, void>(url, payload, requestAuthHeaders);
  }

  public async handleServiceError(
    identity: IIdentity,
    workerId: string,
    externalTaskId: string,
    errorMessage: string,
    errorDetails: string,
    errorCode?: string,
  ): Promise<void> {

    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const urlRestPart = restSettings.paths.finishExternalTaskWithServiceError
      .replace(restSettings.params.externalTaskId, externalTaskId);

    const url = this.buildUrl(urlRestPart);

    const payload = new DataModels.ExternalTask.HandleServiceErrorRequestPayload(workerId, errorMessage, errorDetails, errorCode);

    await this.httpClient.post<DataModels.ExternalTask.HandleServiceErrorRequestPayload, void>(url, payload, requestAuthHeaders);
  }

  public async finishExternalTask<TResultType>(identity: IIdentity, workerId: string, externalTaskId: string, results: TResultType): Promise<void> {

    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const urlRestPart = restSettings.paths.finishExternalTask
      .replace(restSettings.params.externalTaskId, externalTaskId);

    const url = this.buildUrl(urlRestPart);

    const payload = new DataModels.ExternalTask.FinishExternalTaskRequestPayload(workerId, results);

    await this.httpClient.post<DataModels.ExternalTask.FinishExternalTaskRequestPayload<TResultType>, void>(url, payload, requestAuthHeaders);
  }

  // ManualTasks
  public async getManualTasksForProcessModel(
    identity: IIdentity,
    processModelId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.ManualTasks.ManualTaskList> {
    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const urlRestPart = restSettings.paths.processModelManualTasks
      .replace(restSettings.params.processModelId, processModelId);

    const url = this.buildUrl(urlRestPart, offset, limit);

    const httpResponse = await this.httpClient.get<DataModels.ManualTasks.ManualTaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getManualTasksForProcessInstance(
    identity: IIdentity,
    processInstanceId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.ManualTasks.ManualTaskList> {
    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const urlRestPart = restSettings.paths.processInstanceManualTasks
      .replace(restSettings.params.processInstanceId, processInstanceId);

    const url = this.buildUrl(urlRestPart, offset, limit);

    const httpResponse = await this.httpClient.get<DataModels.ManualTasks.ManualTaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getManualTasksForCorrelation(
    identity: IIdentity,
    correlationId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.ManualTasks.ManualTaskList> {
    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const urlRestPart = restSettings.paths.correlationManualTasks
      .replace(restSettings.params.correlationId, correlationId);

    const url = this.buildUrl(urlRestPart, offset, limit);

    const httpResponse = await this.httpClient.get<DataModels.ManualTasks.ManualTaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getManualTasksForProcessModelInCorrelation(
    identity: IIdentity,
    processModelId: string,
    correlationId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.ManualTasks.ManualTaskList> {
    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const urlRestPart = restSettings.paths.processModelCorrelationManualTasks
      .replace(restSettings.params.processModelId, processModelId)
      .replace(restSettings.params.correlationId, correlationId);

    const url = this.buildUrl(urlRestPart, offset, limit);

    const httpResponse = await this.httpClient.get<DataModels.ManualTasks.ManualTaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getWaitingManualTasksByIdentity(
    identity: IIdentity,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.ManualTasks.ManualTaskList> {
    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const url = this.buildUrl(restSettings.paths.getOwnManualTasks, offset, limit);

    const httpResponse = await this.httpClient.get<DataModels.ManualTasks.ManualTaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async finishManualTask(
    identity: IIdentity,
    processInstanceId: string,
    correlationId: string,
    manualTaskInstanceId: string,
  ): Promise<void> {
    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const urlRestPart = restSettings.paths.finishManualTask
      .replace(restSettings.params.processInstanceId, processInstanceId)
      .replace(restSettings.params.correlationId, correlationId)
      .replace(restSettings.params.manualTaskInstanceId, manualTaskInstanceId);

    const url = this.buildUrl(urlRestPart);

    const body: {} = {};
    await this.httpClient.post(url, body, requestAuthHeaders);
  }

  // UserTasks
  public async getUserTasksForProcessModel(
    identity: IIdentity,
    processModelId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.UserTasks.UserTaskList> {
    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const urlRestPart = restSettings.paths.processModelUserTasks
      .replace(restSettings.params.processModelId, processModelId);

    const url = this.buildUrl(urlRestPart, offset, limit);

    const httpResponse = await this.httpClient.get<DataModels.UserTasks.UserTaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getUserTasksForProcessInstance(
    identity: IIdentity,
    processInstanceId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.UserTasks.UserTaskList> {
    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const urlRestPart = restSettings.paths.processInstanceUserTasks
      .replace(restSettings.params.processInstanceId, processInstanceId);

    const url = this.buildUrl(urlRestPart, offset, limit);

    const httpResponse = await this.httpClient.get<DataModels.UserTasks.UserTaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getUserTasksForCorrelation(
    identity: IIdentity,
    correlationId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.UserTasks.UserTaskList> {
    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const urlRestPart = restSettings.paths.correlationUserTasks
      .replace(restSettings.params.correlationId, correlationId);

    const url = this.buildUrl(urlRestPart, offset, limit);

    const httpResponse = await this.httpClient.get<DataModels.UserTasks.UserTaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getUserTasksForProcessModelInCorrelation(
    identity: IIdentity,
    processModelId: string,
    correlationId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.UserTasks.UserTaskList> {
    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const urlRestPart = restSettings.paths.processModelCorrelationUserTasks
      .replace(restSettings.params.processModelId, processModelId)
      .replace(restSettings.params.correlationId, correlationId);

    const url = this.buildUrl(urlRestPart, offset, limit);

    const httpResponse = await this.httpClient.get<DataModels.UserTasks.UserTaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getWaitingUserTasksByIdentity(
    identity: IIdentity,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.UserTasks.UserTaskList> {
    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const url = this.buildUrl(restSettings.paths.getOwnUserTasks, offset, limit);

    const httpResponse = await this.httpClient.get<DataModels.UserTasks.UserTaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async finishUserTask(
    identity: IIdentity,
    processInstanceId: string,
    correlationId: string,
    userTaskInstanceId: string,
    userTaskResult: DataModels.UserTasks.UserTaskResult,
  ): Promise<void> {
    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const urlRestPart = restSettings.paths.finishUserTask
      .replace(restSettings.params.processInstanceId, processInstanceId)
      .replace(restSettings.params.correlationId, correlationId)
      .replace(restSettings.params.userTaskInstanceId, userTaskInstanceId);

    const url = this.buildUrl(urlRestPart);

    await this.httpClient.post<DataModels.UserTasks.UserTaskResult, void>(url, userTaskResult, requestAuthHeaders);
  }

  private createRequestAuthHeaders(identity: IIdentity): IRequestOptions {
    const noAuthTokenProvided = !identity || typeof identity.token !== 'string';
    if (noAuthTokenProvided) {
      return {};
    }

    const requestAuthHeaders = {
      headers: {
        Authorization: `Bearer ${identity.token}`,
      },
    };

    return requestAuthHeaders;
  }

  private buildUrl(url: string, offset: number = 0, limit: number = 0): string {
    let finalUrl = `${this.baseUrl}${url}`;

    if (finalUrl.indexOf('?') > 0) {
      finalUrl = `${finalUrl}&offset=${offset}&limit=${limit}`;
    } else {
      finalUrl = `${finalUrl}?offset=${offset}&limit=${limit}`;
    }

    return finalUrl;
  }

  // Tasks
  public async getAllSuspendedTasks(
    identity: IIdentity,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.FlowNodeInstances.TaskList> {
    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    const url = this.buildUrl(restSettings.paths.allSuspendedTasks, offset, limit);

    const httpResponse = await this.httpClient.get<DataModels.FlowNodeInstances.TaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getSuspendedTasksForProcessModel(
    identity: IIdentity,
    processModelId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.FlowNodeInstances.TaskList> {
    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    let url = restSettings.paths.suspendedProcessModelTasks.replace(restSettings.params.processModelId, processModelId);
    url = this.buildUrl(url, offset, limit);

    const httpResponse = await this.httpClient.get<DataModels.FlowNodeInstances.TaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getSuspendedTasksForProcessInstance(
    identity: IIdentity,
    processInstanceId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.FlowNodeInstances.TaskList> {
    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    let url = restSettings.paths.suspendedProcessInstanceTasks.replace(restSettings.params.processInstanceId, processInstanceId);
    url = this.buildUrl(url, offset, limit);

    const httpResponse = await this.httpClient.get<DataModels.FlowNodeInstances.TaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getSuspendedTasksForCorrelation(
    identity: IIdentity, correlationId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.FlowNodeInstances.TaskList> {
    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    let url = restSettings.paths.suspendedCorrelationTasks.replace(restSettings.params.correlationId, correlationId);
    url = this.buildUrl(url, offset, limit);

    const httpResponse = await this.httpClient.get<DataModels.FlowNodeInstances.TaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getSuspendedTasksForProcessModelInCorrelation(
    identity: IIdentity,
    processModelId: string,
    correlationId: string,
    offset: number = 0,
    limit: number = 0,
  ): Promise<DataModels.FlowNodeInstances.TaskList> {
    const requestAuthHeaders = this.createRequestAuthHeaders(identity);

    let url = restSettings.paths.suspendedProcessModelCorrelationTasks
      .replace(restSettings.params.processModelId, processModelId)
      .replace(restSettings.params.correlationId, correlationId);

    url = this.buildUrl(url, offset, limit);

    const httpResponse = await this.httpClient.get<DataModels.FlowNodeInstances.TaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  private createSocketIoSubscription<TCallback extends Function>(
    identity: IIdentity,
    route: string,
    callback: TCallback,
    subscribeOnce: boolean,
  ): Subscription {

    const socketForIdentity = this.createSocketForIdentity(identity);

    if (subscribeOnce) {
      socketForIdentity.once(route, callback);
    } else {
      socketForIdentity.on(route, callback);
    }

    const subscriptionId = uuid.v4();
    const subscription = new Subscription(subscriptionId, route, subscribeOnce);

    this.subscriptionCollection[subscriptionId] = callback;

    return subscription;
  }

  private createSocketForIdentity(identity: IIdentity): SocketIOClient.Socket {

    const existingSocket = this.getSocketForIdentity(identity);
    if (existingSocket) {
      return existingSocket;
    }

    const noAuthTokenProvided = !identity || typeof identity.token !== 'string';
    if (noAuthTokenProvided) {
      throw new UnauthorizedError('No auth token provided!');
    }

    const socketUrl = `${this.config.socketUrl}/${socketSettings.namespace}`;
    const socketIoOptions: SocketIOClient.ConnectOpts = {
      transportOptions: {
        polling: {
          extraHeaders: {
            Authorization: identity.token,
          },
        },
      },
    };

    this.socketCollection[identity.userId] = io(socketUrl, socketIoOptions);

    return this.socketCollection[identity.userId];
  }

  private removeSocketForIdentity(identity: IIdentity): void {
    const socketForIdentity = this.getSocketForIdentity(identity);

    const noSocketFound = !socketForIdentity;
    if (noSocketFound) {
      return;
    }
    socketForIdentity.disconnect();
    socketForIdentity.close();

    delete this.socketCollection[identity.userId];
  }

  private getSocketForIdentity(identity: IIdentity): SocketIOClient.Socket {
    return this.socketCollection[identity.userId];
  }

}
