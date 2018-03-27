import {ExecutionContext} from '@essential-projects/core_contracts';
import * as EssentialProjectErrors from '@essential-projects/errors_ts';
import {IHttpClient, IRequestOptions, IResponse} from '@essential-projects/http_contracts';
import {
  ConsumerContext,
  EventList,
  EventTriggerPayload,
  IConsumerApiService,
  ProcessModel,
  ProcessModelList,
  ProcessStartRequestPayload,
  ProcessStartResponsePayload,
  ProcessStartReturnOnOptions,
  restSettings,
  UserTaskList,
  UserTaskResult,
} from '@process-engine/consumer_api_contracts';

import {IFactoryAsync} from 'addict-ioc';

export class ConsumerApiClientService implements IConsumerApiService {

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

  public async startProcess(context: ConsumerContext,
                            processModelKey: string,
                            startEventKey: string,
                            payload: ProcessStartRequestPayload,
                            returnOn: ProcessStartReturnOnOptions = ProcessStartReturnOnOptions.onProcessInstanceStarted,
                          ): Promise<ProcessStartResponsePayload> {

    if (!Object.values(ProcessStartReturnOnOptions).includes(returnOn)) {
      throw new EssentialProjectErrors.BadRequestError(`${returnOn} is not a valid return option!`);
    }

    let url: string = restSettings.paths.startProcess
      .replace(restSettings.params.processModelKey, processModelKey)
      .replace(restSettings.params.startEventKey, startEventKey);

    url = `${url}?return_on=${returnOn}`;

    const requestAuthHeaders: IRequestOptions = this.createRequestAuthHeaders(context);

    const httpResponse: IResponse<ProcessStartResponsePayload> =
      await this.httpClient.post<ProcessStartRequestPayload, ProcessStartResponsePayload>(url, payload, requestAuthHeaders);

    return httpResponse.result;
  }

  public async startProcessAndAwaitEndEvent(context: ConsumerContext,
                                            processModelKey: string,
                                            startEventKey: string,
                                            endEventKey: string,
                                            payload: ProcessStartRequestPayload): Promise<ProcessStartResponsePayload> {

    const url: string = restSettings.paths.startProcessAndAwaitEndEvent
      .replace(restSettings.params.processModelKey, processModelKey)
      .replace(restSettings.params.startEventKey, startEventKey)
      .replace(restSettings.params.endEventKey, endEventKey);

    const requestAuthHeaders: IRequestOptions = this.createRequestAuthHeaders(context);

    const httpResponse: IResponse<ProcessStartResponsePayload> =
      await this.httpClient.post<ProcessStartRequestPayload, ProcessStartResponsePayload>(url, payload, requestAuthHeaders);

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
    const requestAuthHeaders: IRequestOptions = {
      headers: {
        Authorization: `Bearer ${context.identiy}`,
      },
    };

    return requestAuthHeaders;
  }
}
