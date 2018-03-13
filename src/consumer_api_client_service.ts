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

    const url: string = routes.processModel.replace(this.urlParameters.processModelKey, processModelKey);

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

  // Events - TODO
  public async getEventsForProcessModel(processModelKey: string): Promise<IEventList> {
    const mockData: IEventList = {
      page_number: 0,
      page_size: 30,
      element_count: 0,
      page_count: 0,
      events: [],
    };

    return Promise.resolve(mockData);
  }

  public async getEventsForCorrelation(correlationId: string): Promise<IEventList> {
    const mockData: IEventList = {
      page_number: 0,
      page_size: 30,
      element_count: 0,
      page_count: 0,
      events: [],
    };

    return Promise.resolve(mockData);
  }

  public async getEventsForProcessModelInCorrelation(processModelKey: string, correlationId: string): Promise<IEventList> {
    const mockData: IEventList = {
      page_number: 0,
      page_size: 30,
      element_count: 0,
      page_count: 0,
      events: [],
    };

    return Promise.resolve(mockData);
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

  // UserTasks - TODO
  public async getUserTasksForProcessModel(processModelKey: string): Promise<IUserTaskList> {
    const mockData: IUserTaskList = {
      page_number: 0,
      page_size: 30,
      element_count: 0,
      page_count: 0,
      user_tasks: [{
        key: 'mock_user_task',
        id: '123',
        process_instance_id: '123412534124535',
        data: {},
      }],
    };

    return Promise.resolve(mockData);
  }

  public async getUserTasksForCorrelation(correlationId: string): Promise<IUserTaskList> {
    const mockData: IUserTaskList = {
      page_number: 0,
      page_size: 30,
      element_count: 0,
      page_count: 0,
      user_tasks: [{
        key: 'mock_user_task',
        id: '123',
        process_instance_id: '123412534124535',
        data: {},
      }],
    };

    return Promise.resolve(mockData);
  }

  public async getUserTasksForProcessModelInCorrelation(processModelKey: string, correlationId: string): Promise<IUserTaskList> {
    const mockData: IUserTaskList = {
      page_number: 0,
      page_size: 30,
      element_count: 0,
      page_count: 0,
      user_tasks: [{
        key: 'mock_user_task',
        id: '123',
        process_instance_id: '123412534124535',
        data: {},
      }],
    };

    return Promise.resolve(mockData);
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
