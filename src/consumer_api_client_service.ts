import {
  IConsumerApiService,
  IEventList,
  IEventTriggerPayload,
  IProcessModel,
  IProcessModelList,
  IUserTaskList,
  IUserTaskResult,
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

    // TODO - FIXME: The response returned by the HttpClient is always a string,
    // even if the response headers include "Content-Type application/json"!?
    // Need to investigate if this is an issue with the HttpClient itself or with popsicle.
    return <IProcessModelList> JSON.parse(httpResponse.result);
  }

  public async getProcessModelByKey(processModelKey: string): Promise<IProcessModel> {

    const url: string = routes.processModels.replace(this.urlParameters.processModelKey, processModelKey);

    const httpResponse: IResponse<IProcessModel> = await this.httpClient.get<IProcessModel>(url);

    // TODO - FIXME: See above
    return <IProcessModel> JSON.parse(httpResponse.result);
  }

  public async startProcess(processModelKey: string, startEventKey: string): Promise<void> {
    return Promise.resolve();
  }

  public async startProcessAndAwaitEndEvent(processModelKey: string, startEventKey: string, endEventKey: string): Promise<void> {
    return Promise.resolve();
  }

  // Events
  public async getEventsForProcessModel(processModelKey: string): Promise<IEventList> {
    return Promise.resolve();
  }

  public async getEventsForCorrelation(correlationId: string): Promise<IEventList> {
    return Promise.resolve();
  }

  public async getEventsForProcessModelInCorrelation(processModelKey: string, correlationId: string): Promise<IEventList> {
    return Promise.resolve();
  }

  public async triggerEvent(processModelKey: string, eventId: string, eventTriggerPayload?: IEventTriggerPayload): Promise<void> {
    return Promise.resolve();
  }

  public async triggerEventInCorrelation(processModelKey: string,
                                         correlationId: string,
                                         eventId: string,
                                         eventTriggerPayload?: IEventTriggerPayload): Promise<void> {
    return Promise.resolve();
  }

  // UserTasks
  public async getUserTasksForProcessModel(processModelKey: string): Promise<IUserTaskList> {
    return Promise.resolve();
  }

  public async getUserTasksForCorrelation(correlationId: string): Promise<IUserTaskList> {
    return Promise.resolve();
  }

  public async getUserTasksForProcessModelInCorrelation(processModelKey: string, correlationId: string): Promise<IUserTaskList> {
    return Promise.resolve();
  }

  public async finishUserTask(processModelKey: string, userTaskId: string, userTaskResult: IUserTaskResult): Promise<void> {
    return Promise.resolve();
  }

  public async finishUserTaskInCorrelation(processModelKey: string,
                                           correlationId: string,
                                           userTaskId: string,
                                           userTaskResult: IUserTaskResult): Promise<void> {
    return Promise.resolve();
  }
}
