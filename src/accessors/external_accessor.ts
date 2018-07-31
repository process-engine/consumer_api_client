import {IHttpClient, IRequestOptions, IResponse} from '@essential-projects/http_contracts';
import {
  ConsumerContext,
  CorrelationResult,
  EventList,
  EventTriggerPayload,
  IConsumerApiAccessor,
  ProcessModel,
  ProcessModelList,
  ProcessStartRequestPayload,
  ProcessStartResponsePayload,
  restSettings,
  StartCallbackType,
  UserTaskList,
  UserTaskResult,
} from '@process-engine/consumer_api_contracts';

export class ExternalAccessor implements IConsumerApiAccessor {

  private baseUrl: string = 'api/consumer/v1';

  private _httpClient: IHttpClient = undefined;

  constructor(httpClient: IHttpClient) {
    this._httpClient = httpClient;
  }

  public get httpClient(): IHttpClient {
    return this._httpClient;
  }

  public async getProcessModels(context: ConsumerContext): Promise<ProcessModelList> {

    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(context);

    const url: string = this._applyBaseUrl(restSettings.paths.processModels);

    const httpResponse: IResponse<ProcessModelList> = await this.httpClient.get<ProcessModelList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getProcessModelById(context: ConsumerContext, processModelId: string): Promise<ProcessModel> {

    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(context);

    const encodedProcessModelId: string = encodeURIComponent(processModelId);

    let url: string = restSettings.paths.processModelById.replace(restSettings.params.processModelId, encodedProcessModelId);
    url = this._applyBaseUrl(url);

    const httpResponse: IResponse<ProcessModel> = await this.httpClient.get<ProcessModel>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async startProcessInstance(context: ConsumerContext,
                                    processModelId: string,
                                    startEventId: string,
                                    payload: ProcessStartRequestPayload,
                                    startCallbackType: StartCallbackType = StartCallbackType.CallbackOnProcessInstanceCreated,
                                    endEventId?: string,
                                  ): Promise<ProcessStartResponsePayload> {

    const url: string = this._buildStartProcessInstanceUrl(processModelId, startEventId, startCallbackType, endEventId);

    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(context);

    const httpResponse: IResponse<ProcessStartResponsePayload> =
      await this.httpClient.post<ProcessStartRequestPayload, ProcessStartResponsePayload>(url, payload, requestAuthHeaders);

    return httpResponse.result;
  }

  private _buildStartProcessInstanceUrl(processModelId: string,
                                        startEventId: string,
                                        startCallbackType: StartCallbackType,
                                        endEventId: string): string {

    const encodedProcessModelId: string = encodeURIComponent(processModelId);
    const encodedStartEventId: string = encodeURIComponent(startEventId);

    let url: string = restSettings.paths.startProcessInstance
      .replace(restSettings.params.processModelId, encodedProcessModelId)
      .replace(restSettings.params.startEventId, encodedStartEventId);

    url = `${url}?start_callback_type=${startCallbackType}`;

    if (startCallbackType === StartCallbackType.CallbackOnEndEventReached) {

      const encodedEndEventId: string = encodeURIComponent(endEventId);

      url = `${url}&end_event_id=${encodedEndEventId}`;
    }

    url = this._applyBaseUrl(url);

    return url;
  }

  public async getProcessResultForCorrelation(context: ConsumerContext,
                                              correlationId: string,
                                              processModelId: string): Promise<Array<CorrelationResult>> {

    const encodedCorrelationId: string = encodeURIComponent(correlationId);
    const encodedProcessModelId: string = encodeURIComponent(processModelId);

    let url: string = restSettings.paths.getProcessResultForCorrelation
      .replace(restSettings.params.correlationId, encodedCorrelationId)
      .replace(restSettings.params.processModelId, encodedProcessModelId);

    url = this._applyBaseUrl(url);

    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(context);

    const httpResponse: IResponse<Array<CorrelationResult>> = await this.httpClient.get<Array<CorrelationResult>>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  // Events
  public async getEventsForProcessModel(context: ConsumerContext, processModelId: string): Promise<EventList> {

    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(context);

    const encodedProcessModelId: string = encodeURIComponent(processModelId);

    let url: string = restSettings.paths.processModelEvents.replace(restSettings.params.processModelId, encodedProcessModelId);
    url = this._applyBaseUrl(url);

    const httpResponse: IResponse<EventList> = await this.httpClient.get<EventList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getEventsForCorrelation(context: ConsumerContext, correlationId: string): Promise<EventList> {

    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(context);

    const encodedCorrelationId: string = encodeURIComponent(correlationId);

    let url: string = restSettings.paths.correlationEvents.replace(restSettings.params.correlationId, encodedCorrelationId);
    url = this._applyBaseUrl(url);

    const httpResponse: IResponse<EventList> = await this.httpClient.get<EventList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getEventsForProcessModelInCorrelation(context: ConsumerContext, processModelId: string, correlationId: string): Promise<EventList> {

    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(context);

    const encodedProcessModelId: string = encodeURIComponent(processModelId);
    const encodedCorrelationId: string = encodeURIComponent(correlationId);

    let url: string = restSettings.paths.processModelCorrelationEvents
      .replace(restSettings.params.processModelId, encodedProcessModelId)
      .replace(restSettings.params.correlationId, encodedCorrelationId);

    url = this._applyBaseUrl(url);

    const httpResponse: IResponse<EventList> = await this.httpClient.get<EventList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async triggerEvent(context: ConsumerContext,
                            processModelId: string,
                            correlationId: string,
                            eventId: string,
                            eventTriggerPayload?: EventTriggerPayload): Promise<void> {

    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(context);

    const encodedProcessModelId: string = encodeURIComponent(processModelId);
    const encodedCorrelationId: string = encodeURIComponent(correlationId);
    const encodedEventId: string = encodeURIComponent(eventId);

    let url: string = restSettings.paths.triggerEvent
      .replace(restSettings.params.processModelId, encodedProcessModelId)
      .replace(restSettings.params.correlationId, encodedCorrelationId)
      .replace(restSettings.params.eventId, encodedEventId);

    url = this._applyBaseUrl(url);

    await this.httpClient.post<EventTriggerPayload, any>(url, eventTriggerPayload, requestAuthHeaders);
  }

  // UserTasks
  public async getUserTasksForProcessModel(context: ConsumerContext, processModelId: string): Promise<UserTaskList> {

    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(context);

    const encodedProcessModelId: string = encodeURIComponent(processModelId);

    let url: string = restSettings.paths.processModelUserTasks.replace(restSettings.params.processModelId, encodedProcessModelId);
    url = this._applyBaseUrl(url);

    const httpResponse: IResponse<UserTaskList> = await this.httpClient.get<UserTaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getUserTasksForCorrelation(context: ConsumerContext, correlationId: string): Promise<UserTaskList> {

    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(context);

    const encodedCorrelationId: string = encodeURIComponent(correlationId);

    let url: string = restSettings.paths.correlationUserTasks.replace(restSettings.params.correlationId, encodedCorrelationId);
    url = this._applyBaseUrl(url);

    const httpResponse: IResponse<UserTaskList> = await this.httpClient.get<UserTaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getUserTasksForProcessModelInCorrelation(context: ConsumerContext,
                                                        processModelId: string,
                                                        correlationId: string): Promise<UserTaskList> {

    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(context);

    const encodedProcessModelId: string = encodeURIComponent(processModelId);
    const encodedCorrelationId: string = encodeURIComponent(correlationId);

    let url: string = restSettings.paths.processModelCorrelationUserTasks
      .replace(restSettings.params.processModelId, encodedProcessModelId)
      .replace(restSettings.params.correlationId, encodedCorrelationId);

    url = this._applyBaseUrl(url);

    const httpResponse: IResponse<UserTaskList> = await this.httpClient.get<UserTaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async finishUserTask(context: ConsumerContext,
                              processModelId: string,
                              correlationId: string,
                              userTaskId: string,
                              userTaskResult: UserTaskResult): Promise<void> {

    const requestAuthHeaders: IRequestOptions = this._createRequestAuthHeaders(context);

    const encodedProcessModelId: string = encodeURIComponent(processModelId);
    const encodedCorrelationId: string = encodeURIComponent(correlationId);
    const encodedUserTaskId: string = encodeURIComponent(userTaskId);

    let url: string = restSettings.paths.finishUserTask
      .replace(restSettings.params.processModelId, encodedProcessModelId)
      .replace(restSettings.params.correlationId, encodedCorrelationId)
      .replace(restSettings.params.userTaskId, encodedUserTaskId);

    url = this._applyBaseUrl(url);

    await this.httpClient.post<UserTaskResult, any>(url, userTaskResult, requestAuthHeaders);
  }

  private _createRequestAuthHeaders(context: ConsumerContext): IRequestOptions {
    if (context.identity === undefined || context.identity === null) {
      return {};
    }

    const requestAuthHeaders: IRequestOptions = {
      headers: {
        Authorization: `Bearer ${context.identity}`,
      },
    };

    return requestAuthHeaders;
  }

  private _applyBaseUrl(url: string): string {
    return `${this.baseUrl}${url}`;
  }
}
