import * as EssentialProjectErrors from '@essential-projects/errors_ts';
import {IHttpClient, IRequestOptions, IResponse} from '@essential-projects/http_contracts';
import {
  ConsumerContext,
  EventList,
  EventTriggerPayload,
  IConsumerApiConnector,
  ICorrelationResult,
  ProcessModel,
  ProcessModelList,
  ProcessStartRequestPayload,
  ProcessStartResponsePayload,
  restSettings,
  StartCallbackType,
  UserTaskList,
  UserTaskResult,
} from '@process-engine/consumer_api_contracts';

import {IFactoryAsync} from 'addict-ioc';

export class ExternalConnector implements IConsumerApiConnector {

  public config: any = undefined;

  private _httpClientFactory: IFactoryAsync<IHttpClient> = undefined;
  private _httpClient: IHttpClient = undefined;

  constructor(httpClientFactory: IFactoryAsync<IHttpClient>) {
    this._httpClientFactory = httpClientFactory;
  }

  public get httpClient(): IHttpClient {
    return this._httpClient;
  }

  public async initialize(): Promise<void> {
    this._httpClient = await this._httpClientFactory(undefined, this.config);
  }

  public async getProcessModels(context: ConsumerContext): Promise<ProcessModelList> {

    const requestAuthHeaders: IRequestOptions = this.createRequestAuthHeaders(context);

    const httpResponse: IResponse<ProcessModelList> =
      await this.httpClient.get<ProcessModelList>(restSettings.paths.processModels, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getProcessModelByKey(context: ConsumerContext, processModelKey: string): Promise<ProcessModel> {

    const requestAuthHeaders: IRequestOptions = this.createRequestAuthHeaders(context);

    const url: string = restSettings.paths.processModelByKey.replace(restSettings.params.processModelKey, processModelKey);

    const httpResponse: IResponse<ProcessModel> = await this.httpClient.get<ProcessModel>(url, requestAuthHeaders);

    return httpResponse.result;
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

    const url: string = this._buildStartProcessInstanceUrl(processModelKey, startEventKey, startCallbackType, endEventKey);

    const requestAuthHeaders: IRequestOptions = this.createRequestAuthHeaders(context);

    const httpResponse: IResponse<ProcessStartResponsePayload> =
      await this.httpClient.post<ProcessStartRequestPayload, ProcessStartResponsePayload>(url, payload, requestAuthHeaders);

    return httpResponse.result;
  }

  private _buildStartProcessInstanceUrl(processModelKey: string,
                                        startEventKey: string,
                                        startCallbackType: StartCallbackType,
                                        endEventKey: string): string {

    let url: string = restSettings.paths.startProcessInstance
      .replace(restSettings.params.processModelKey, processModelKey)
      .replace(restSettings.params.startEventKey, startEventKey);

    url = `${url}?start_callback_type=${startCallbackType}`;

    if (startCallbackType === StartCallbackType.CallbackOnEndEventReached) {
      if (!endEventKey) {
        throw new EssentialProjectErrors.BadRequestError(`Must provide an EndEventKey, when using callback type 'CallbackOnEndEventReached'!`);
      }

      url = `${url}&end_event_key=${endEventKey}`;
    }

    return url;
  }

  public async getProcessResultForCorrelation(context: ConsumerContext,
                                              correlationId: string,
                                              processModelKey: string): Promise<ICorrelationResult> {

    const url: string = restSettings.paths.getProcessResultForCorrelation
      .replace(restSettings.params.correlationId, correlationId)
      .replace(restSettings.params.processModelKey, processModelKey);

    const requestAuthHeaders: IRequestOptions = this.createRequestAuthHeaders(context);

    const httpResponse: IResponse<ICorrelationResult> = await this.httpClient.get<ICorrelationResult>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  // Events
  public async getEventsForProcessModel(context: ConsumerContext, processModelKey: string): Promise<EventList> {

    const requestAuthHeaders: IRequestOptions = this.createRequestAuthHeaders(context);

    const url: string = restSettings.paths.processModelEvents.replace(restSettings.params.processModelKey, processModelKey);

    const httpResponse: IResponse<EventList> = await this.httpClient.get<EventList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getEventsForCorrelation(context: ConsumerContext, correlationId: string): Promise<EventList> {

    const requestAuthHeaders: IRequestOptions = this.createRequestAuthHeaders(context);

    const url: string = restSettings.paths.correlationEvents.replace(restSettings.params.correlationId, correlationId);

    const httpResponse: IResponse<EventList> = await this.httpClient.get<EventList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getEventsForProcessModelInCorrelation(context: ConsumerContext, processModelKey: string, correlationId: string): Promise<EventList> {

    const requestAuthHeaders: IRequestOptions = this.createRequestAuthHeaders(context);

    const url: string = restSettings.paths.processModelCorrelationEvents
      .replace(restSettings.params.processModelKey, processModelKey)
      .replace(restSettings.params.correlationId, correlationId);

    const httpResponse: IResponse<EventList> = await this.httpClient.get<EventList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async triggerEvent(context: ConsumerContext,
                            processModelKey: string,
                            correlationId: string,
                            eventId: string,
                            eventTriggerPayload?: EventTriggerPayload): Promise<void> {

    const requestAuthHeaders: IRequestOptions = this.createRequestAuthHeaders(context);

    const url: string = restSettings.paths.triggerEvent
      .replace(restSettings.params.processModelKey, processModelKey)
      .replace(restSettings.params.correlationId, correlationId)
      .replace(restSettings.params.eventId, eventId);

    await this.httpClient.post<EventTriggerPayload, any>(url, eventTriggerPayload, requestAuthHeaders);
  }

  // UserTasks
  public async getUserTasksForProcessModel(context: ConsumerContext, processModelKey: string): Promise<UserTaskList> {

    const requestAuthHeaders: IRequestOptions = this.createRequestAuthHeaders(context);

    const url: string = restSettings.paths.processModelUserTasks.replace(restSettings.params.processModelKey, processModelKey);

    const httpResponse: IResponse<UserTaskList> = await this.httpClient.get<UserTaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getUserTasksForCorrelation(context: ConsumerContext, correlationId: string): Promise<UserTaskList> {

    const requestAuthHeaders: IRequestOptions = this.createRequestAuthHeaders(context);

    const url: string = restSettings.paths.correlationUserTasks.replace(restSettings.params.correlationId, correlationId);

    const httpResponse: IResponse<UserTaskList> = await this.httpClient.get<UserTaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getUserTasksForProcessModelInCorrelation(context: ConsumerContext,
                                                        processModelKey: string,
                                                        correlationId: string): Promise<UserTaskList> {

    const requestAuthHeaders: IRequestOptions = this.createRequestAuthHeaders(context);

    const url: string = restSettings.paths.processModelCorrelationUserTasks
      .replace(restSettings.params.processModelKey, processModelKey)
      .replace(restSettings.params.correlationId, correlationId);

    const httpResponse: IResponse<UserTaskList> = await this.httpClient.get<UserTaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async finishUserTask(context: ConsumerContext,
                              processModelKey: string,
                              correlationId: string,
                              userTaskId: string,
                              userTaskResult: UserTaskResult): Promise<void> {

    const requestAuthHeaders: IRequestOptions = this.createRequestAuthHeaders(context);

    const url: string = restSettings.paths.finishUserTask
      .replace(restSettings.params.processModelKey, processModelKey)
      .replace(restSettings.params.correlationId, correlationId)
      .replace(restSettings.params.userTaskId, userTaskId);

    await this.httpClient.post<UserTaskResult, any>(url, userTaskResult, requestAuthHeaders);
  }

  private createRequestAuthHeaders(context: ConsumerContext): IRequestOptions {
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
}
