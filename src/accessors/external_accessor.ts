import * as jsonwebtoken from 'jsonwebtoken';
import * as io from 'socket.io-client';

import {UnauthorizedError} from '@essential-projects/errors_ts';
import {IHttpClient, IRequestOptions, IResponse} from '@essential-projects/http_contracts';
import {IIdentity, TokenBody} from '@essential-projects/iam_contracts';

import {
  DataModels,
  IConsumerApiAccessor,
  Messages,
  restSettings,
  socketSettings,
} from '@process-engine/consumer_api_contracts';

export class ExternalAccessor implements IConsumerApiAccessor {
  private baseUrl: string = 'api/consumer/v1';

  private _httpClient: IHttpClient = undefined;
  private _socket: SocketIOClient.Socket = undefined;

  public config: any;

  constructor(httpClient: IHttpClient) {
    this._httpClient = httpClient;
  }

  public initializeSocket(identity: IIdentity): void {
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
    this._socket = io(socketUrl, socketIoOptions);
  }

  // Notifications
  public onUserTaskWaiting(identity: IIdentity, callback: Messages.CallbackTypes.OnUserTaskWaitingCallback): void {
    this._ensureIsAuthorized(identity);
    this._socket.on(socketSettings.paths.userTaskWaiting, callback);
  }

  public onUserTaskFinished(identity: IIdentity, callback: Messages.CallbackTypes.OnUserTaskFinishedCallback): void {
    this._ensureIsAuthorized(identity);
    this._socket.on(socketSettings.paths.userTaskFinished, callback);
  }

  public onUserTaskForIdentityWaiting(identity: IIdentity, callback: Messages.CallbackTypes.OnUserTaskWaitingCallback): void {
    this._ensureIsAuthorized(identity);

    const decodedIdentity: TokenBody = <TokenBody> jsonwebtoken.decode(identity.token);
    const userId: string = decodedIdentity.sub;

    const socketEventName: string = socketSettings.paths.userTaskForIdentityWaiting
      .replace(socketSettings.pathParams.userId, userId);

    this._socket.on(socketEventName, callback);
  }

  public onUserTaskForIdentityFinished(identity: IIdentity, callback: Messages.CallbackTypes.OnUserTaskFinishedCallback): void {
    this._ensureIsAuthorized(identity);

    const decodedIdentity: TokenBody = <TokenBody> jsonwebtoken.decode(identity.token);
    const userId: string = decodedIdentity.sub;

    const socketEventName: string = socketSettings.paths.userTaskForIdentityFinished
      .replace(socketSettings.pathParams.userId, userId);

    this._socket.on(socketEventName, callback);
  }

  public onProcessTerminated(identity: IIdentity, callback: Messages.CallbackTypes.OnProcessTerminatedCallback): void {
    this._ensureIsAuthorized(identity);
    this._socket.on(socketSettings.paths.processTerminated, callback);
  }

  public onProcessStarted(identity: IIdentity, callback: Messages.CallbackTypes.OnProcessStartedCallback): void {
    this._ensureIsAuthorized(identity);
    this._socket.on(socketSettings.paths.processStarted, callback);
  }

  public onProcessWithProcessModelIdStarted(identity: IIdentity,
                                            callback: Messages.CallbackTypes.OnProcessStartedCallback,
                                            processModelId: string): void {
    this._ensureIsAuthorized(identity);
    const eventName: string = socketSettings.paths.processInstanceStarted
      .replace(socketSettings.pathParams.processModelId, processModelId);

    this._socket.on(eventName, callback);
  }

  public onManualTaskWaiting(identity: IIdentity, callback: Messages.CallbackTypes.OnManualTaskWaitingCallback): void {
    this._ensureIsAuthorized(identity);
    this._socket.on(socketSettings.paths.manualTaskWaiting, callback);
  }

  public onManualTaskFinished(identity: IIdentity, callback: Messages.CallbackTypes.OnManualTaskFinishedCallback): void {
    this._ensureIsAuthorized(identity);
    this._socket.on(socketSettings.paths.manualTaskFinished, callback);
  }

  public onManualTaskForIdentityWaiting(identity: IIdentity, callback: Messages.CallbackTypes.OnManualTaskWaitingCallback): void {
    this._ensureIsAuthorized(identity);

    const decodedIdentity: TokenBody = <TokenBody> jsonwebtoken.decode(identity.token);
    const userId: string = decodedIdentity.sub;

    const socketEventName: string = socketSettings.paths.manualTaskForIdentityWaiting
      .replace(socketSettings.pathParams.userId, userId);

    this._socket.on(socketEventName, callback);
  }

  public onManualTaskForIdentityFinished(identity: IIdentity, callback: Messages.CallbackTypes.OnManualTaskFinishedCallback): void {
    this._ensureIsAuthorized(identity);

    const decodedIdentity: TokenBody = <TokenBody> jsonwebtoken.decode(identity.token);
    const userId: string = decodedIdentity.sub;

    const socketEventName: string = socketSettings.paths.manualTaskForIdentityFinished
      .replace(socketSettings.pathParams.userId, userId);

    this._socket.on(socketEventName, callback);
  }

  public onProcessEnded(identity: IIdentity, callback: Messages.CallbackTypes.OnProcessEndedCallback): void {
    this._ensureIsAuthorized(identity);
    this._socket.on(socketSettings.paths.processEnded, callback);
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

  public async startProcessInstance(identity: IIdentity,
                                    processModelId: string,
                                    startEventId: string,
                                    payload: DataModels.ProcessModels.ProcessStartRequestPayload,
                                    startCallbackType: DataModels.ProcessModels.StartCallbackType,
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

    const callbackProvided: boolean = processEndedCallback !== undefined;
    if (callbackProvided) {
      this._socket.on(socketSettings.paths.processEnded, processEndedCallback);
    }

    return httpResponse.result;
  }

  private _buildStartProcessInstanceUrl(processModelId: string,
                                        startEventId: string,
                                        startCallbackType: DataModels.ProcessModels.StartCallbackType,
                                        endEventId: string): string {
    let url: string = restSettings.paths.startProcessInstance
      .replace(restSettings.params.processModelId, processModelId)
      .replace(restSettings.params.startEventId, startEventId);

    url = `${url}?start_callback_type=${startCallbackType}`;

    if (startCallbackType === DataModels.ProcessModels.StartCallbackType.CallbackOnEndEventReached) {
      url = `${url}&end_event_id=${endEventId}`;
    }

    url = this._applyBaseUrl(url);

    return url;
  }

  public async getProcessResultForCorrelation(identity: IIdentity,
                                              correlationId: string,
                                              processModelId: string): Promise<Array<DataModels.CorrelationResult>> {
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

  public async getUserTasksForCorrelation(identity: IIdentity, correlationId: string): Promise<DataModels.UserTasks.UserTaskList> {
    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    let url: string = restSettings.paths.correlationUserTasks.replace(restSettings.params.correlationId, correlationId);
    url = this._applyBaseUrl(url);

    const httpResponse: IResponse<DataModels.UserTasks.UserTaskList> =
      await this._httpClient.get<DataModels.UserTasks.UserTaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getUserTasksForProcessModelInCorrelation(identity: IIdentity,
                                                        processModelId: string,
                                                        correlationId: string): Promise<DataModels.UserTasks.UserTaskList> {
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

  public async finishUserTask(identity: IIdentity,
                              processInstanceId: string,
                              correlationId: string,
                              userTaskInstanceId: string,
                              userTaskResult: DataModels.UserTasks.UserTaskResult): Promise<void> {
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

  public async getManualTasksForProcessModelInCorrelation(identity: IIdentity,
                                                          processModelId: string,
                                                          correlationId: string): Promise<DataModels.ManualTasks.ManualTaskList> {
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

  public async finishManualTask(identity: IIdentity,
                                processInstanceId: string,
                                correlationId: string,
                                manualTaskInstanceId: string): Promise<void> {
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

  private _ensureIsAuthorized(identity: IIdentity): void {
    const noAuthTokenProvided: boolean = !identity || typeof identity.token !== 'string';
    if (noAuthTokenProvided) {
      throw new UnauthorizedError('No auth token provided!');
    }
  }
}
