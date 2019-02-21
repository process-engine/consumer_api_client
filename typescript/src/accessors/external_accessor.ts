// tslint:disable:max-file-line-count
import * as uuid from 'node-uuid';
import * as io from 'socket.io-client';

import {UnauthorizedError} from '@essential-projects/errors_ts';
import {Subscription} from '@essential-projects/event_aggregator_contracts';
import {IHttpClient, IRequestOptions, IResponse} from '@essential-projects/http_contracts';
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
type SubscriptionCallbackAssociation = {[subscriptionId: string]: any};

export class ExternalAccessor implements IConsumerApiAccessor, IConsumerSocketIoAccessor {
  private baseUrl: string = 'api/consumer/v1';

  private _socketCollection: IdentitySocketCollection = {};
  private _subscriptionCollection: SubscriptionCallbackAssociation = {};

  private _httpClient: IHttpClient = undefined;

  public config: any;

  constructor(httpClient: IHttpClient) {
    this._httpClient = httpClient;
  }

  public initializeSocket(identity: IIdentity): void {
    this._createSocketForIdentity(identity);
  }

  public disconnectSocket(identity: IIdentity): void {
    this._removeSocketForIdentity(identity);
  }

  // Notifications
  public async onUserTaskWaiting(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnUserTaskWaitingCallback,
    subscribeOnce: boolean = false,
  ): Promise<any> {
    return this._createSocketIoSubscription(identity, socketSettings.paths.userTaskWaiting, callback, subscribeOnce);
  }

  public async onUserTaskFinished(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnUserTaskFinishedCallback,
    subscribeOnce: boolean = false,
  ): Promise<any> {
    return this._createSocketIoSubscription(identity, socketSettings.paths.userTaskFinished, callback, subscribeOnce);
  }

  public async onUserTaskForIdentityWaiting(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnUserTaskWaitingCallback,
    subscribeOnce: boolean = false,
  ): Promise<any> {
    const socketEventName: string = socketSettings.paths.userTaskForIdentityWaiting
      .replace(socketSettings.pathParams.userId, identity.userId);

    return this._createSocketIoSubscription(identity, socketEventName, callback, subscribeOnce);
  }

  public async onUserTaskForIdentityFinished(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnUserTaskFinishedCallback,
    subscribeOnce: boolean = false,
  ): Promise<any> {
    const socketEventName: string = socketSettings.paths.userTaskForIdentityFinished
      .replace(socketSettings.pathParams.userId, identity.userId);

    return this._createSocketIoSubscription(identity, socketEventName, callback, subscribeOnce);
  }

  public async onProcessTerminated(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnProcessTerminatedCallback,
    subscribeOnce: boolean = false,
  ): Promise<any> {
    return this._createSocketIoSubscription(identity, socketSettings.paths.processTerminated, callback, subscribeOnce);
  }

  public async onProcessStarted(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnProcessStartedCallback,
    subscribeOnce: boolean = false,
  ): Promise<any> {
    return this._createSocketIoSubscription(identity, socketSettings.paths.processStarted, callback, subscribeOnce);
  }

  public async onProcessWithProcessModelIdStarted(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnProcessStartedCallback,
    processModelId: string,
    subscribeOnce: boolean = false,
  ): Promise<any> {
    const eventName: string = socketSettings.paths.processInstanceStarted
      .replace(socketSettings.pathParams.processModelId, processModelId);

    return this._createSocketIoSubscription(identity, eventName, callback, subscribeOnce);
  }

  public async onManualTaskWaiting(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnManualTaskWaitingCallback,
    subscribeOnce: boolean = false,
  ): Promise<any> {
    return this._createSocketIoSubscription(identity, socketSettings.paths.manualTaskWaiting, callback, subscribeOnce);
  }

  public async onManualTaskFinished(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnManualTaskFinishedCallback,
    subscribeOnce: boolean = false,
  ): Promise<any> {
    return this._createSocketIoSubscription(identity, socketSettings.paths.manualTaskFinished, callback, subscribeOnce);
  }

  public async onManualTaskForIdentityWaiting(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnManualTaskWaitingCallback,
    subscribeOnce: boolean = false,
  ): Promise<any> {
    const socketEventName: string = socketSettings.paths.manualTaskForIdentityWaiting
      .replace(socketSettings.pathParams.userId, identity.userId);

    return this._createSocketIoSubscription(identity, socketEventName, callback, subscribeOnce);
  }

  public async onManualTaskForIdentityFinished(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnManualTaskFinishedCallback,
    subscribeOnce: boolean = false,
  ): Promise<any> {
    const socketEventName: string = socketSettings.paths.manualTaskForIdentityFinished
      .replace(socketSettings.pathParams.userId, identity.userId);

    return this._createSocketIoSubscription(identity, socketEventName, callback, subscribeOnce);
  }

  public async onProcessEnded(
    identity: IIdentity,
    callback: Messages.CallbackTypes.OnProcessEndedCallback,
    subscribeOnce: boolean = false,
  ): Promise<any> {
    return this._createSocketIoSubscription(identity, socketSettings.paths.processEnded, callback, subscribeOnce);
  }

  public async removeSubscription(identity: IIdentity, subscription: Subscription): Promise<void> {

    const socketForIdentity: SocketIOClient.Socket = this._getSocketForIdentity(identity);
    if (!socketForIdentity) {
      return;
    }

    const callbackToRemove: any = this._subscriptionCollection[subscription.id];
    if (!callbackToRemove) {
      return;
    }

    socketForIdentity.off(subscription.eventName, callbackToRemove);

    delete this._subscriptionCollection[subscription.id];

    return Promise.resolve();
  }

  // Process models and instances
  public async getProcessModels(identity: IIdentity): Promise<DataModels.ProcessModels.ProcessModelList> {
    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    const url: string = this._applyBaseUrl(restSettings.paths.processModels);

    const httpResponse: IResponse<DataModels.ProcessModels.ProcessModelList> =
      await this._httpClient.get<DataModels.ProcessModels.ProcessModelList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getProcessModelById(identity: IIdentity, processModelId: string): Promise<DataModels.ProcessModels.ProcessModel> {
    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    let url: string = restSettings.paths.processModelById.replace(restSettings.params.processModelId, processModelId);
    url = this._applyBaseUrl(url);

    const httpResponse: IResponse<DataModels.ProcessModels.ProcessModel> =
      await this._httpClient.get<DataModels.ProcessModels.ProcessModel>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getProcessModelByProcessInstanceId(identity: IIdentity, processInstanceId: string): Promise<DataModels.ProcessModels.ProcessModel> {
    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    let url: string = restSettings.paths.processModelByProcessInstanceId.replace(restSettings.params.processInstanceId, processInstanceId);
    url = this._applyBaseUrl(url);

    const httpResponse: IResponse<DataModels.ProcessModels.ProcessModel> =
      await this._httpClient.get<DataModels.ProcessModels.ProcessModel>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async startProcessInstance(
    identity: IIdentity,
    processModelId: string,
    payload: DataModels.ProcessModels.ProcessStartRequestPayload,
    startCallbackType: DataModels.ProcessModels.StartCallbackType,
    startEventId?: string,
    endEventId?: string,
    processEndedCallback?: Messages.CallbackTypes.OnProcessEndedCallback,
  ): Promise<DataModels.ProcessModels.ProcessStartResponsePayload> {

    const url: string = this._buildStartProcessInstanceUrl(processModelId, startEventId, startCallbackType, endEventId);

    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    const httpResponse: IResponse<DataModels.ProcessModels.ProcessStartResponsePayload> =
      await this
        ._httpClient
        // tslint:disable-next-line:max-line-length
        .post<DataModels.ProcessModels.ProcessStartRequestPayload, DataModels.ProcessModels.ProcessStartResponsePayload>(url, payload, requestAuthHeaders);

    const socketIoSubscriptionRequired: boolean = processEndedCallback !== undefined;
    if (socketIoSubscriptionRequired) {
      const socketForIdentity: SocketIOClient.Socket = this._createSocketForIdentity(identity);
      socketForIdentity.once(socketSettings.paths.processEnded, processEndedCallback);
    }

    return httpResponse.result;
  }

  private _buildStartProcessInstanceUrl(
    processModelId: string,
    startEventId: string,
    startCallbackType: DataModels.ProcessModels.StartCallbackType,
    endEventId: string,
  ): string {
    let url: string = restSettings.paths.startProcessInstance
      .replace(restSettings.params.processModelId, processModelId)
      .replace(restSettings.params.startEventId, startEventId);

    url = `${url}?start_callback_type=${startCallbackType}`;

    const attachEndEventId: boolean = startCallbackType === DataModels.ProcessModels.StartCallbackType.CallbackOnEndEventReached;
    if (attachEndEventId) {
      url = `${url}&end_event_id=${endEventId}`;
    }

    url = this._applyBaseUrl(url);

    return url;
  }

  public async getProcessResultForCorrelation(
    identity: IIdentity,
    correlationId: string,
    processModelId: string,
  ): Promise<Array<DataModels.CorrelationResult>> {
    let url: string = restSettings.paths.getProcessResultForCorrelation
      .replace(restSettings.params.correlationId, correlationId)
      .replace(restSettings.params.processModelId, processModelId);

    url = this._applyBaseUrl(url);

    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    const httpResponse: IResponse<Array<DataModels.CorrelationResult>> = await
      this._httpClient.get<Array<DataModels.CorrelationResult>>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getProcessInstancesByIdentity(identity: IIdentity): Promise<Array<DataModels.ProcessInstance>> {
    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    let url: string = restSettings.paths.getOwnProcessInstances;
    url = this._applyBaseUrl(url);

    const httpResponse: IResponse<Array<DataModels.ProcessInstance>> =
      await this._httpClient.get<Array<DataModels.ProcessInstance>>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  // Events
  public async getEventsForProcessModel(identity: IIdentity, processModelId: string): Promise<DataModels.Events.EventList> {
    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    let url: string = restSettings.paths.processModelEvents.replace(restSettings.params.processModelId, processModelId);
    url = this._applyBaseUrl(url);

    const httpResponse: IResponse<DataModels.Events.EventList> = await this._httpClient.get<DataModels.Events.EventList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getEventsForCorrelation(identity: IIdentity, correlationId: string): Promise<DataModels.Events.EventList> {
    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    let url: string = restSettings.paths.correlationEvents.replace(restSettings.params.correlationId, correlationId);
    url = this._applyBaseUrl(url);

    const httpResponse: IResponse<DataModels.Events.EventList> = await this._httpClient.get<DataModels.Events.EventList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getEventsForProcessModelInCorrelation(
    identity: IIdentity,
    processModelId: string,
    correlationId: string,
  ): Promise<DataModels.Events.EventList> {
    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    let url: string = restSettings.paths.processModelCorrelationEvents
      .replace(restSettings.params.processModelId, processModelId)
      .replace(restSettings.params.correlationId, correlationId);

    url = this._applyBaseUrl(url);

    const httpResponse: IResponse<DataModels.Events.EventList> = await this._httpClient.get<DataModels.Events.EventList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async triggerMessageEvent(identity: IIdentity, messageName: string, payload?: DataModels.Events.EventTriggerPayload): Promise<void> {
    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    let url: string = restSettings.paths.triggerMessageEvent
      .replace(restSettings.params.eventName, messageName);

    url = this._applyBaseUrl(url);

    await this._httpClient.post<DataModels.Events.EventTriggerPayload, any>(url, payload, requestAuthHeaders);
  }

  public async triggerSignalEvent(identity: IIdentity, signalName: string, payload?: DataModels.Events.EventTriggerPayload): Promise<void> {
    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    let url: string = restSettings.paths.triggerSignalEvent
      .replace(restSettings.params.eventName, signalName);

    url = this._applyBaseUrl(url);

    await this._httpClient.post<DataModels.Events.EventTriggerPayload, any>(url, payload, requestAuthHeaders);
  }

  // UserTasks
  public async getUserTasksForProcessModel(identity: IIdentity, processModelId: string): Promise<DataModels.UserTasks.UserTaskList> {
    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    let url: string = restSettings.paths.processModelUserTasks.replace(restSettings.params.processModelId, processModelId);
    url = this._applyBaseUrl(url);

    const httpResponse: IResponse<DataModels.UserTasks.UserTaskList> =
      await this._httpClient.get<DataModels.UserTasks.UserTaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getUserTasksForProcessInstance(identity: IIdentity, processInstanceId: string): Promise<DataModels.UserTasks.UserTaskList> {
    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    let url: string = restSettings.paths.processInstanceUserTasks.replace(restSettings.params.processInstanceId, processInstanceId);
    url = this._applyBaseUrl(url);

    const httpResponse: IResponse<DataModels.UserTasks.UserTaskList> =
      await this._httpClient.get<DataModels.UserTasks.UserTaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getUserTasksForCorrelation(identity: IIdentity, correlationId: string): Promise<DataModels.UserTasks.UserTaskList> {
    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    let url: string = restSettings.paths.correlationUserTasks.replace(restSettings.params.correlationId, correlationId);
    url = this._applyBaseUrl(url);

    const httpResponse: IResponse<DataModels.UserTasks.UserTaskList> =
      await this._httpClient.get<DataModels.UserTasks.UserTaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getUserTasksForProcessModelInCorrelation(
    identity: IIdentity,
    processModelId: string,
    correlationId: string,
  ): Promise<DataModels.UserTasks.UserTaskList> {
    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    let url: string = restSettings.paths.processModelCorrelationUserTasks
      .replace(restSettings.params.processModelId, processModelId)
      .replace(restSettings.params.correlationId, correlationId);

    url = this._applyBaseUrl(url);

    const httpResponse: IResponse<DataModels.UserTasks.UserTaskList> =
      await this._httpClient.get<DataModels.UserTasks.UserTaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getWaitingUserTasksByIdentity(identity: IIdentity): Promise<DataModels.UserTasks.UserTaskList> {
    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    const urlRestPart: string = restSettings.paths.getOwnUserTasks;
    const url: string = this._applyBaseUrl(urlRestPart);

    const httpResponse: IResponse<DataModels.UserTasks.UserTaskList> =
      await this._httpClient.get<DataModels.UserTasks.UserTaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async finishUserTask(
    identity: IIdentity,
    processInstanceId: string,
    correlationId: string,
    userTaskInstanceId: string,
    userTaskResult: DataModels.UserTasks.UserTaskResult,
  ): Promise<void> {
    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    let url: string = restSettings.paths.finishUserTask
      .replace(restSettings.params.processInstanceId, processInstanceId)
      .replace(restSettings.params.correlationId, correlationId)
      .replace(restSettings.params.userTaskInstanceId, userTaskInstanceId);

    url = this._applyBaseUrl(url);

    await this._httpClient.post<DataModels.UserTasks.UserTaskResult, any>(url, userTaskResult, requestAuthHeaders);
  }

  // ManualTasks
  public async getManualTasksForProcessModel(identity: IIdentity, processModelId: string): Promise<DataModels.ManualTasks.ManualTaskList> {
    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    const urlRestPart: string = restSettings.paths
                                                  .processModelManualTasks
                                                  .replace(restSettings.params.processModelId, processModelId);
    const url: string = this._applyBaseUrl(urlRestPart);

    const httpResponse: IResponse<DataModels.ManualTasks.ManualTaskList> =
      await this._httpClient.get<DataModels.ManualTasks.ManualTaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getManualTasksForProcessInstance(identity: IIdentity, processInstanceId: string): Promise<DataModels.ManualTasks.ManualTaskList> {
    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    const urlRestPart: string = restSettings.paths
                                              .processInstanceManualTasks
                                              .replace(restSettings.params.processInstanceId, processInstanceId);

    const url: string = this._applyBaseUrl(urlRestPart);

    const httpResponse: IResponse<DataModels.ManualTasks.ManualTaskList> =
      await this._httpClient.get<DataModels.ManualTasks.ManualTaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getManualTasksForCorrelation(identity: IIdentity, correlationId: string): Promise<DataModels.ManualTasks.ManualTaskList> {
    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    const urlRestPart: string = restSettings.paths
                                            .correlationManualTasks
                                            .replace(restSettings.params.correlationId, correlationId);
    const url: string = this._applyBaseUrl(urlRestPart);

    const httpResponse: IResponse<DataModels.ManualTasks.ManualTaskList> =
      await this._httpClient.get<DataModels.ManualTasks.ManualTaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getManualTasksForProcessModelInCorrelation(
    identity: IIdentity,
    processModelId: string,
    correlationId: string,
  ): Promise<DataModels.ManualTasks.ManualTaskList> {
    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    const urlRestPart: string = restSettings.paths.processModelCorrelationManualTasks
      .replace(restSettings.params.processModelId, processModelId)
      .replace(restSettings.params.correlationId, correlationId);

    const url: string = this._applyBaseUrl(urlRestPart);

    const httpResponse: IResponse<DataModels.ManualTasks.ManualTaskList> =
      await this._httpClient.get<DataModels.ManualTasks.ManualTaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getWaitingManualTasksByIdentity(identity: IIdentity): Promise<DataModels.ManualTasks.ManualTaskList> {
    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    const urlRestPart: string = restSettings.paths.getOwnManualTasks;
    const url: string = this._applyBaseUrl(urlRestPart);

    const httpResponse: IResponse<DataModels.ManualTasks.ManualTaskList> =
      await this._httpClient.get<DataModels.ManualTasks.ManualTaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async finishManualTask(
    identity: IIdentity,
    processInstanceId: string,
    correlationId: string,
    manualTaskInstanceId: string,
  ): Promise<void> {
    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    const urlRestPart: string = restSettings.paths.finishManualTask
      .replace(restSettings.params.processInstanceId, processInstanceId)
      .replace(restSettings.params.correlationId, correlationId)
      .replace(restSettings.params.manualTaskInstanceId, manualTaskInstanceId);

    const url: string = this._applyBaseUrl(urlRestPart);

    const body: {} = {};
    await this._httpClient.post(url, body, requestAuthHeaders);
  }

  private _createRequestAuthHeaders(identity: IIdentity): IRequestOptions {
    const noAuthTokenProvided: boolean = !identity || typeof identity.token !== 'string';
    if (noAuthTokenProvided) {
      return {};
    }

    const requestAuthHeaders: IRequestOptions = {
      headers: {
        Authorization: `Bearer ${identity.token}`,
      },
    };

    return requestAuthHeaders;
  }

  private _applyBaseUrl(url: string): string {
    return `${this.baseUrl}${url}`;
  }

  private _createSocketIoSubscription(identity: IIdentity, route: string, callback: any, subscribeOnce: boolean): Subscription {

    const socketForIdentity: SocketIOClient.Socket = this._createSocketForIdentity(identity);

    if (subscribeOnce) {
      socketForIdentity.once(route, callback);
    } else {
      socketForIdentity.on(route, callback);
    }

    const subscriptionId: string = uuid.v4();
    const subscription: Subscription = new Subscription(subscriptionId, route, subscribeOnce);

    this._subscriptionCollection[subscriptionId] = callback;

    return subscription;
  }

  private _createSocketForIdentity(identity: IIdentity): SocketIOClient.Socket {

    const existingSocket: SocketIOClient.Socket = this._getSocketForIdentity(identity);
    if (existingSocket) {
      return existingSocket;
    }

    const noAuthTokenProvided: boolean = !identity || typeof identity.token !== 'string';
    if (noAuthTokenProvided) {
      throw new UnauthorizedError('No auth token provided!');
    }

    const socketUrl: string = `${this.config.socketUrl}/${socketSettings.namespace}`;
    const socketIoOptions: SocketIOClient.ConnectOpts = {
      transportOptions: {
        polling: {
          extraHeaders: {
            Authorization: identity.token,
          },
        },
      },
    };

    this._socketCollection[identity.userId] = io(socketUrl, socketIoOptions);

    return this._socketCollection[identity.userId];
  }

  private _removeSocketForIdentity(identity: IIdentity): void {
    const socketForIdentity: SocketIOClient.Socket = this._getSocketForIdentity(identity);

    const noSocketFound: boolean = !socketForIdentity;
    if (noSocketFound) {
      return;
    }
    socketForIdentity.disconnect();
    socketForIdentity.close();

    delete this._socketCollection[identity.userId];
  }

  private _getSocketForIdentity(identity: IIdentity): SocketIOClient.Socket {
    return this._socketCollection[identity.userId];
  }
}
