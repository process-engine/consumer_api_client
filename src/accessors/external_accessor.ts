import {IHttpClient, IRequestOptions, IResponse} from '@essential-projects/http_contracts';
import {IIdentity} from '@essential-projects/iam_contracts';

import {
  CorrelationResult,
  EventList,
  EventTriggerPayload,
  IConsumerApiAccessor,
  ProcessModel,
  ProcessModelList,
  ProcessStartRequestPayload,
  ProcessStartResponsePayload,
  restSettings,
  socketSettings,
  StartCallbackType,
  UserTaskList,
  UserTaskResult,
} from '@process-engine/consumer_api_contracts';
import {
  ProcessEndedMessage,
  ProcessEndType,
  UserTaskFinishedMessage,
  UserTaskWaitingMessage,
} from '@process-engine/process_engine_contracts';
import io from 'socket.io-client';

export class ExternalAccessor implements IConsumerApiAccessor {

  private baseUrl: string = 'api/consumer/v1';

  private _socket: SocketIOClient.Socket = undefined;
  private _httpClient: IHttpClient = undefined;
  private _identity: IIdentity = undefined;

  public config: any;

  public get httpClient(): IHttpClient {
    return this._httpClient;
  }

  public get identity(): IIdentity {
    return this._identity;
  }

  constructor(httpClient: IHttpClient, identity: IIdentity) {
    this._httpClient = httpClient;
    this._identity = identity;
  }

  public initialize(): void {
    this._initializeSocket();
  }

  private _initializeSocket(): void {
    const socketUrl: string = `${this.config.socketUrl}/${socketSettings.namespace}`;
    const socketIoOptions: SocketIOClient.ConnectOpts = {
      transportOptions: {
        polling: {
          extraHeaders: {
            Authorization: this.identity.token,
          },
        },
      },
    };
    this._socket = io(socketUrl, socketIoOptions);
  }

  public onUserTaskWaiting(callback: (userTaskWaiting: UserTaskWaitingMessage) => void|Promise<void>): void {
    this._socket.on(socketSettings.paths.userTaskWaiting, (userTaskWaiting: UserTaskWaitingMessage) => {
      callback(userTaskWaiting);
    });
  }

  public onUserTaskFinished(callback: (userTaskFinished: UserTaskFinishedMessage) => void|Promise<void>): void {
    this._socket.on(socketSettings.paths.userTaskFinished, (userTaskFinished: UserTaskFinishedMessage) => {
      callback(userTaskFinished);
    });
  }

  public onProcessTerminated(callback: (processEnded: ProcessEndedMessage) => void|Promise<void>): void {
    this._socket.on(socketSettings.paths.processEnded, (processEnded: ProcessEndedMessage) => {
      const isProcessTerminated: boolean = processEnded.endType === ProcessEndType.Terminated;
      if (isProcessTerminated) {
        callback(processEnded);
      }
    });
  }

  public onProcessEnded(callback: (processEnded: ProcessEndedMessage) => void|Promise<void>): void {
    this._socket.on(socketSettings.paths.processEnded, (processEnded: ProcessEndedMessage) => {
      const isProcessEnded: boolean = processEnded.endType === ProcessEndType.Ended;
      if (isProcessEnded) {
        callback(processEnded);
      }
    });
  }

  public async getProcessModels(identity: IIdentity): Promise<ProcessModelList> {

    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    const url: string = this._applyBaseUrl(restSettings.paths.processModels);

    const httpResponse: IResponse<ProcessModelList> = await this.httpClient.get<ProcessModelList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getProcessModelById(identity: IIdentity, processModelId: string): Promise<ProcessModel> {

    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    let url: string = restSettings.paths.processModelById.replace(restSettings.params.processModelId, processModelId);
    url = this._applyBaseUrl(url);

    const httpResponse: IResponse<ProcessModel> = await this.httpClient.get<ProcessModel>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async startProcessInstance(identity: IIdentity,
                                    processModelId: string,
                                    startEventId: string,
                                    payload: ProcessStartRequestPayload,
                                    startCallbackType: StartCallbackType = StartCallbackType.CallbackOnProcessInstanceCreated,
                                    endEventId?: string,
                                    processEndedCallback?: (processEnded: ProcessEndedMessage) => void|Promise<void>,
                                  ): Promise<ProcessStartResponsePayload> {

    const url: string = this._buildStartProcessInstanceUrl(processModelId, startEventId, startCallbackType, endEventId);

    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    const httpResponse: IResponse<ProcessStartResponsePayload> =
      await this.httpClient.post<ProcessStartRequestPayload, ProcessStartResponsePayload>(url, payload, requestAuthHeaders);

    if (processEndedCallback !== undefined) {
      this._socket.on(socketSettings.paths.processEnded, (processEnded: ProcessEndedMessage) => {
        processEndedCallback(processEnded);
      });
    }

    return httpResponse.result;
  }

  private _buildStartProcessInstanceUrl(processModelId: string,
                                        startEventId: string,
                                        startCallbackType: StartCallbackType,
                                        endEventId: string): string {

    let url: string = restSettings.paths.startProcessInstance
      .replace(restSettings.params.processModelId, processModelId)
      .replace(restSettings.params.startEventId, startEventId);

    url = `${url}?start_callback_type=${startCallbackType}`;

    if (startCallbackType === StartCallbackType.CallbackOnEndEventReached) {
      url = `${url}&end_event_id=${endEventId}`;
    }

    url = this._applyBaseUrl(url);

    return url;
  }

  public async getProcessResultForCorrelation(identity: IIdentity,
                                              correlationId: string,
                                              processModelId: string): Promise<Array<CorrelationResult>> {

    let url: string = restSettings.paths.getProcessResultForCorrelation
      .replace(restSettings.params.correlationId, correlationId)
      .replace(restSettings.params.processModelId, processModelId);

    url = this._applyBaseUrl(url);

    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    const httpResponse: IResponse<Array<CorrelationResult>> = await this.httpClient.get<Array<CorrelationResult>>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  // Events
  public async getEventsForProcessModel(identity: IIdentity, processModelId: string): Promise<EventList> {

    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    let url: string = restSettings.paths.processModelEvents.replace(restSettings.params.processModelId, processModelId);
    url = this._applyBaseUrl(url);

    const httpResponse: IResponse<EventList> = await this.httpClient.get<EventList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getEventsForCorrelation(identity: IIdentity, correlationId: string): Promise<EventList> {

    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    let url: string = restSettings.paths.correlationEvents.replace(restSettings.params.correlationId, correlationId);
    url = this._applyBaseUrl(url);

    const httpResponse: IResponse<EventList> = await this.httpClient.get<EventList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getEventsForProcessModelInCorrelation(identity: IIdentity, processModelId: string, correlationId: string): Promise<EventList> {

    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    let url: string = restSettings.paths.processModelCorrelationEvents
      .replace(restSettings.params.processModelId, processModelId)
      .replace(restSettings.params.correlationId, correlationId);

    url = this._applyBaseUrl(url);

    const httpResponse: IResponse<EventList> = await this.httpClient.get<EventList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async triggerEvent(identity: IIdentity,
                            processModelId: string,
                            correlationId: string,
                            eventId: string,
                            eventTriggerPayload?: EventTriggerPayload): Promise<void> {

    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    let url: string = restSettings.paths.triggerEvent
      .replace(restSettings.params.processModelId, processModelId)
      .replace(restSettings.params.correlationId, correlationId)
      .replace(restSettings.params.eventId, eventId);

    url = this._applyBaseUrl(url);

    await this.httpClient.post<EventTriggerPayload, any>(url, eventTriggerPayload, requestAuthHeaders);
  }

  // UserTasks
  public async getUserTasksForProcessModel(identity: IIdentity, processModelId: string): Promise<UserTaskList> {

    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    let url: string = restSettings.paths.processModelUserTasks.replace(restSettings.params.processModelId, processModelId);
    url = this._applyBaseUrl(url);

    const httpResponse: IResponse<UserTaskList> = await this.httpClient.get<UserTaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getUserTasksForCorrelation(identity: IIdentity, correlationId: string): Promise<UserTaskList> {

    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    let url: string = restSettings.paths.correlationUserTasks.replace(restSettings.params.correlationId, correlationId);
    url = this._applyBaseUrl(url);

    const httpResponse: IResponse<UserTaskList> = await this.httpClient.get<UserTaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getUserTasksForProcessModelInCorrelation(identity: IIdentity,
                                                        processModelId: string,
                                                        correlationId: string): Promise<UserTaskList> {

    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    let url: string = restSettings.paths.processModelCorrelationUserTasks
      .replace(restSettings.params.processModelId, processModelId)
      .replace(restSettings.params.correlationId, correlationId);

    url = this._applyBaseUrl(url);

    const httpResponse: IResponse<UserTaskList> = await this.httpClient.get<UserTaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async finishUserTask(identity: IIdentity,
                              processModelId: string,
                              correlationId: string,
                              userTaskId: string,
                              userTaskResult: UserTaskResult): Promise<void> {

    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(identity);

    let url: string = restSettings.paths.finishUserTask
      .replace(restSettings.params.processModelId, processModelId)
      .replace(restSettings.params.correlationId, correlationId)
      .replace(restSettings.params.userTaskId, userTaskId);

    url = this._applyBaseUrl(url);

    await this.httpClient.post<UserTaskResult, any>(url, userTaskResult, requestAuthHeaders);
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
}
