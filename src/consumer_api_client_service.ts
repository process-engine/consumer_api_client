import {
  IConsumerApiService,
  IEventList,
  IEventTriggerPayload,
  IProcessModel,
  IProcessModelList,
  IProcessStartRequestPayload,
  IProcessStartResponsePayload,
  IUserTaskList,
  IUserTaskResult,
  ProcessStartReturnOnOptions,
  routes,
} from '@process-engine/consumer_api_contracts';

import {IHttpClient, IRequestOptions, IResponse} from '@essential-projects/http_contracts';

import {IFactoryAsync} from 'addict-ioc';

export class ConsumerApiClientService implements IConsumerApiService {

  public config: any = undefined;

  private _httpClientFactory: IFactoryAsync<IHttpClient> = undefined;
  private _httpClient: IHttpClient = undefined;

  private urlParameters: any = {
    processModelKey: ':process_model_key',
    correlationId: ':correlation_id',
    startEventKey: ':start_event_key',
    endEventKey: ':end_event_key',
    eventId: ':event_id',
    userTaskId: ':user_task_id',
  };

  constructor(httpClientFactory: IFactoryAsync<IHttpClient>) {
    this._httpClientFactory = httpClientFactory;
  }

  public get httpClient(): IHttpClient {
    return this._httpClient;
  }

  public async initialize(): Promise<void> {
    this._httpClient = await this._httpClientFactory(undefined, this.config);
  }

  public async getProcessModels(): Promise<IProcessModelList> {
    const httpResponse: IResponse<IProcessModelList> = await this.httpClient.get<IProcessModelList>(routes.processModels);

    return httpResponse.result;
  }

  public async getProcessModelByKey(processModelKey: string): Promise<IProcessModel> {

    const url: string = routes.processModelByKey.replace(this.urlParameters.processModelKey, processModelKey);

    const httpResponse: IResponse<IProcessModel> = await this.httpClient.get<IProcessModel>(url);

    return httpResponse.result;
  }

  public async startProcess(processModelKey: string,
                            startEventKey: string,
                            payload: IProcessStartRequestPayload,
                            returnOn: ProcessStartReturnOnOptions): Promise<IProcessStartResponsePayload> {

    let url: string = routes.startProcess
      .replace(this.urlParameters.processModelKey, processModelKey)
      .replace(this.urlParameters.startEventKey, startEventKey);

    url = `${url}?return_on=${returnOn}`;

    const httpResponse: IResponse<IProcessStartResponsePayload> =
      await this.httpClient.post<IProcessStartRequestPayload, IProcessStartResponsePayload>(url, payload);

    return httpResponse.result;
  }

  public async startProcessAndAwaitEndEvent(processModelKey: string,
                                            startEventKey: string,
                                            endEventKey: string,
                                            payload: IProcessStartRequestPayload): Promise<IProcessStartResponsePayload> {

    const url: string = routes.startProcessAndAwaitEndEvent
      .replace(this.urlParameters.processModelKey, processModelKey)
      .replace(this.urlParameters.startEventKey, startEventKey)
      .replace(this.urlParameters.endEventKey, endEventKey);

    const httpResponse: IResponse<IProcessStartResponsePayload> =
      await this.httpClient.post<IProcessStartRequestPayload, IProcessStartResponsePayload>(url, payload);

    return httpResponse.result;
  }

  // Events
  public async getEventsForProcessModel(processModelKey: string): Promise<IEventList> {

    const url: string = routes.processModelEvents.replace(this.urlParameters.processModelKey, processModelKey);

    const httpResponse: IResponse<IEventList> = await this.httpClient.get<IEventList>(url);

    return httpResponse.result;
  }

  public async getEventsForCorrelation(correlationId: string): Promise<IEventList> {

    const url: string = routes.correlationEvents.replace(this.urlParameters.correlationId, correlationId);

    const httpResponse: IResponse<IEventList> = await this.httpClient.get<IEventList>(url);

    return httpResponse.result;
  }

  public async getEventsForProcessModelInCorrelation(processModelKey: string, correlationId: string): Promise<IEventList> {

    const url: string = routes.processModelCorrelationEvents
      .replace(this.urlParameters.processModelKey, processModelKey)
      .replace(this.urlParameters.correlationId, correlationId);

    const httpResponse: IResponse<IEventList> = await this.httpClient.get<IEventList>(url);

    return httpResponse.result;
  }

  public async triggerEvent(processModelKey: string, eventId: string, eventTriggerPayload?: IEventTriggerPayload): Promise<void> {

    const url: string = routes.triggerEvent
      .replace(this.urlParameters.processModelKey, processModelKey)
      .replace(this.urlParameters.eventId, eventId);

    await this.httpClient.post<IEventTriggerPayload, any>(url, eventTriggerPayload);
  }

  public async triggerEventInCorrelation(processModelKey: string,
                                         correlationId: string,
                                         eventId: string,
                                         eventTriggerPayload?: IEventTriggerPayload): Promise<void> {

    const url: string = routes.triggerProcessModelCorrelationEvent
      .replace(this.urlParameters.processModelKey, processModelKey)
      .replace(this.urlParameters.correlationId, correlationId)
      .replace(this.urlParameters.eventId, eventId);

    await this.httpClient.post<IEventTriggerPayload, any>(url, eventTriggerPayload);
  }

  // UserTasks
  public async getUserTasksForProcessModel(processModelKey: string): Promise<IUserTaskList> {

    const url: string = routes.processModelUserTasks.replace(this.urlParameters.processModelKey, processModelKey);

    const httpResponse: IResponse<IUserTaskList> = await this.httpClient.get<IUserTaskList>(url);

    return httpResponse.result;
  }

  public async getUserTasksForCorrelation(correlationId: string): Promise<IUserTaskList> {

    const url: string = routes.correlationUserTasks.replace(this.urlParameters.correlationId, correlationId);

    const httpResponse: IResponse<IUserTaskList> = await this.httpClient.get<IUserTaskList>(url);

    return httpResponse.result;
  }

  public async getUserTasksForProcessModelInCorrelation(processModelKey: string, correlationId: string): Promise<IUserTaskList> {

    const url: string = routes.processModelCorrelationUserTasks
      .replace(this.urlParameters.processModelKey, processModelKey)
      .replace(this.urlParameters.correlationId, correlationId);

    const httpResponse: IResponse<IUserTaskList> = await this.httpClient.get<IUserTaskList>(url);

    return httpResponse.result;
  }

  public async finishUserTask(processModelKey: string, userTaskId: string, userTaskResult: IUserTaskResult): Promise<void> {

    const url: string = routes.finishUserTask
      .replace(this.urlParameters.processModelKey, processModelKey)
      .replace(this.urlParameters.userTaskId, userTaskId);

    await this.httpClient.post<IUserTaskResult, any>(url, userTaskResult);
  }

  public async finishUserTaskInCorrelation(processModelKey: string,
                                           correlationId: string,
                                           userTaskId: string,
                                           userTaskResult: IUserTaskResult): Promise<void> {

    const url: string = routes.finishProcessModelCorrelationUserTask
      .replace(this.urlParameters.processModelKey, processModelKey)
      .replace(this.urlParameters.correlationId, correlationId)
      .replace(this.urlParameters.userTaskId, userTaskId);

    await this.httpClient.post<IUserTaskResult, any>(url, userTaskResult);
  }
}
