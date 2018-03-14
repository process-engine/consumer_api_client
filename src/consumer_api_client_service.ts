import {IHttpClient, IRequestOptions, IResponse} from '@essential-projects/http_contracts';
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
  restSettings,
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

  public async getProcessModels(): Promise<IProcessModelList> {
    const httpResponse: IResponse<IProcessModelList> = await this.httpClient.get<IProcessModelList>(restSettings.paths.processModels);

    return httpResponse.result;
  }

  public async getProcessModelByKey(processModelKey: string): Promise<IProcessModel> {

    const url: string = restSettings.paths.processModelByKey.replace(restSettings.params.processModelKey, processModelKey);

    const httpResponse: IResponse<IProcessModel> = await this.httpClient.get<IProcessModel>(url);

    return httpResponse.result;
  }

  public async startProcess(processModelKey: string,
                            startEventKey: string,
                            payload: IProcessStartRequestPayload,
                            returnOn: ProcessStartReturnOnOptions): Promise<IProcessStartResponsePayload> {

    let url: string = restSettings.paths.startProcess
      .replace(restSettings.params.processModelKey, processModelKey)
      .replace(restSettings.params.startEventKey, startEventKey);

    url = `${url}?return_on=${returnOn}`;

    const httpResponse: IResponse<IProcessStartResponsePayload> =
      await this.httpClient.post<IProcessStartRequestPayload, IProcessStartResponsePayload>(url, payload);

    return httpResponse.result;
  }

  public async startProcessAndAwaitEndEvent(processModelKey: string,
                                            startEventKey: string,
                                            endEventKey: string,
                                            payload: IProcessStartRequestPayload): Promise<IProcessStartResponsePayload> {

    const url: string = restSettings.paths.startProcessAndAwaitEndEvent
      .replace(restSettings.params.processModelKey, processModelKey)
      .replace(restSettings.params.startEventKey, startEventKey)
      .replace(restSettings.params.endEventKey, endEventKey);

    const httpResponse: IResponse<IProcessStartResponsePayload> =
      await this.httpClient.post<IProcessStartRequestPayload, IProcessStartResponsePayload>(url, payload);

    return httpResponse.result;
  }

  // Events
  public async getEventsForProcessModel(processModelKey: string): Promise<IEventList> {

    const url: string = restSettings.paths.processModelEvents.replace(restSettings.params.processModelKey, processModelKey);

    const httpResponse: IResponse<IEventList> = await this.httpClient.get<IEventList>(url);

    return httpResponse.result;
  }

  public async getEventsForCorrelation(correlationId: string): Promise<IEventList> {

    const url: string = restSettings.paths.correlationEvents.replace(restSettings.params.correlationId, correlationId);

    const httpResponse: IResponse<IEventList> = await this.httpClient.get<IEventList>(url);

    return httpResponse.result;
  }

  public async getEventsForProcessModelInCorrelation(processModelKey: string, correlationId: string): Promise<IEventList> {

    const url: string = restSettings.paths.processModelCorrelationEvents
      .replace(restSettings.params.processModelKey, processModelKey)
      .replace(restSettings.params.correlationId, correlationId);

    const httpResponse: IResponse<IEventList> = await this.httpClient.get<IEventList>(url);

    return httpResponse.result;
  }

  public async triggerEvent(processModelKey: string,
                            correlationId: string,
                            eventId: string,
                            eventTriggerPayload?: IEventTriggerPayload): Promise<void> {

    const url: string = restSettings.paths.triggerEvent
      .replace(restSettings.params.processModelKey, processModelKey)
      .replace(restSettings.params.correlationId, correlationId)
      .replace(restSettings.params.eventId, eventId);

    await this.httpClient.post<IEventTriggerPayload, any>(url, eventTriggerPayload);
  }

  // UserTasks
  public async getUserTasksForProcessModel(processModelKey: string): Promise<IUserTaskList> {

    const url: string = restSettings.paths.processModelUserTasks.replace(restSettings.params.processModelKey, processModelKey);

    const httpResponse: IResponse<IUserTaskList> = await this.httpClient.get<IUserTaskList>(url);

    return httpResponse.result;
  }

  public async getUserTasksForCorrelation(correlationId: string): Promise<IUserTaskList> {

    const url: string = restSettings.paths.correlationUserTasks.replace(restSettings.params.correlationId, correlationId);

    const httpResponse: IResponse<IUserTaskList> = await this.httpClient.get<IUserTaskList>(url);

    return httpResponse.result;
  }

  public async getUserTasksForProcessModelInCorrelation(processModelKey: string, correlationId: string): Promise<IUserTaskList> {

    const url: string = restSettings.paths.processModelCorrelationUserTasks
      .replace(restSettings.params.processModelKey, processModelKey)
      .replace(restSettings.params.correlationId, correlationId);

    const httpResponse: IResponse<IUserTaskList> = await this.httpClient.get<IUserTaskList>(url);

    return httpResponse.result;
  }

  public async finishUserTask(processModelKey: string,
                              correlationId: string,
                              userTaskId: string,
                              userTaskResult: IUserTaskResult): Promise<void> {

    const url: string = restSettings.paths.finishUserTask
      .replace(restSettings.params.processModelKey, processModelKey)
      .replace(restSettings.params.correlationId, correlationId)
      .replace(restSettings.params.userTaskId, userTaskId);

    await this.httpClient.post<IUserTaskResult, any>(url, userTaskResult);
  }
}
