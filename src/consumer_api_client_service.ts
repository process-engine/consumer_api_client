import {ExecutionContext} from '@essential-projects/core_contracts';
import * as EssentialProjectErrors from '@essential-projects/errors_ts';
import {IHttpClient, IRequestOptions, IResponse} from '@essential-projects/http_contracts';
import {
  IConsumerApiService,
  IConsumerContext,
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

  public async getProcessModels(context: IConsumerContext): Promise<IProcessModelList> {

    const requestAuthHeaders: IRequestOptions = this.createRequestAuthHeaders(context);

    const httpResponse: IResponse<IProcessModelList> =
      await this.httpClient.get<IProcessModelList>(restSettings.paths.processModels, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getProcessModelByKey(context: IConsumerContext, processModelKey: string): Promise<IProcessModel> {

    const requestAuthHeaders: IRequestOptions = this.createRequestAuthHeaders(context);

    const url: string = restSettings.paths.processModelByKey.replace(restSettings.params.processModelKey, processModelKey);

    const httpResponse: IResponse<IProcessModel> = await this.httpClient.get<IProcessModel>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async startProcess(context: IConsumerContext,
                            processModelKey: string,
                            startEventKey: string,
                            payload: IProcessStartRequestPayload,
                            returnOn: ProcessStartReturnOnOptions = ProcessStartReturnOnOptions.onProcessInstanceStarted,
                          ): Promise<IProcessStartResponsePayload> {

    if (!(returnOn in ProcessStartReturnOnOptions)) {
      throw new EssentialProjectErrors.BadRequestError(`${returnOn} is not a valid return option!`);
    }

    let url: string = restSettings.paths.startProcess
      .replace(restSettings.params.processModelKey, processModelKey)
      .replace(restSettings.params.startEventKey, startEventKey);

    url = `${url}?return_on=${returnOn}`;

    const requestAuthHeaders: IRequestOptions = this.createRequestAuthHeaders(context);

    const httpResponse: IResponse<IProcessStartResponsePayload> =
      await this.httpClient.post<IProcessStartRequestPayload, IProcessStartResponsePayload>(url, payload, requestAuthHeaders);

    return httpResponse.result;
  }

  public async startProcessAndAwaitEndEvent(context: IConsumerContext,
                                            processModelKey: string,
                                            startEventKey: string,
                                            endEventKey: string,
                                            payload: IProcessStartRequestPayload): Promise<IProcessStartResponsePayload> {

    const url: string = restSettings.paths.startProcessAndAwaitEndEvent
      .replace(restSettings.params.processModelKey, processModelKey)
      .replace(restSettings.params.startEventKey, startEventKey)
      .replace(restSettings.params.endEventKey, endEventKey);

    const requestAuthHeaders: IRequestOptions = this.createRequestAuthHeaders(context);

    const httpResponse: IResponse<IProcessStartResponsePayload> =
      await this.httpClient.post<IProcessStartRequestPayload, IProcessStartResponsePayload>(url, payload, requestAuthHeaders);

    return httpResponse.result;
  }

  // Events
  public async getEventsForProcessModel(context: IConsumerContext, processModelKey: string): Promise<IEventList> {

    const requestAuthHeaders: IRequestOptions = this.createRequestAuthHeaders(context);

    const url: string = restSettings.paths.processModelEvents.replace(restSettings.params.processModelKey, processModelKey);

    const httpResponse: IResponse<IEventList> = await this.httpClient.get<IEventList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getEventsForCorrelation(context: IConsumerContext, correlationId: string): Promise<IEventList> {

    const requestAuthHeaders: IRequestOptions = this.createRequestAuthHeaders(context);

    const url: string = restSettings.paths.correlationEvents.replace(restSettings.params.correlationId, correlationId);

    const httpResponse: IResponse<IEventList> = await this.httpClient.get<IEventList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getEventsForProcessModelInCorrelation(context: IConsumerContext, processModelKey: string, correlationId: string): Promise<IEventList> {

    const requestAuthHeaders: IRequestOptions = this.createRequestAuthHeaders(context);

    const url: string = restSettings.paths.processModelCorrelationEvents
      .replace(restSettings.params.processModelKey, processModelKey)
      .replace(restSettings.params.correlationId, correlationId);

    const httpResponse: IResponse<IEventList> = await this.httpClient.get<IEventList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async triggerEvent(context: IConsumerContext,
                            processModelKey: string,
                            correlationId: string,
                            eventId: string,
                            eventTriggerPayload?: IEventTriggerPayload): Promise<void> {

    const requestAuthHeaders: IRequestOptions = this.createRequestAuthHeaders(context);

    const url: string = restSettings.paths.triggerEvent
      .replace(restSettings.params.processModelKey, processModelKey)
      .replace(restSettings.params.correlationId, correlationId)
      .replace(restSettings.params.eventId, eventId);

    await this.httpClient.post<IEventTriggerPayload, any>(url, eventTriggerPayload, requestAuthHeaders);
  }

  // UserTasks
  public async getUserTasksForProcessModel(context: IConsumerContext, processModelKey: string): Promise<IUserTaskList> {

    const requestAuthHeaders: IRequestOptions = this.createRequestAuthHeaders(context);

    const url: string = restSettings.paths.processModelUserTasks.replace(restSettings.params.processModelKey, processModelKey);

    const httpResponse: IResponse<IUserTaskList> = await this.httpClient.get<IUserTaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getUserTasksForCorrelation(context: IConsumerContext, correlationId: string): Promise<IUserTaskList> {

    const requestAuthHeaders: IRequestOptions = this.createRequestAuthHeaders(context);

    const url: string = restSettings.paths.correlationUserTasks.replace(restSettings.params.correlationId, correlationId);

    const httpResponse: IResponse<IUserTaskList> = await this.httpClient.get<IUserTaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async getUserTasksForProcessModelInCorrelation(context: IConsumerContext,
                                                        processModelKey: string,
                                                        correlationId: string): Promise<IUserTaskList> {

    const requestAuthHeaders: IRequestOptions = this.createRequestAuthHeaders(context);

    const url: string = restSettings.paths.processModelCorrelationUserTasks
      .replace(restSettings.params.processModelKey, processModelKey)
      .replace(restSettings.params.correlationId, correlationId);

    const httpResponse: IResponse<IUserTaskList> = await this.httpClient.get<IUserTaskList>(url, requestAuthHeaders);

    return httpResponse.result;
  }

  public async finishUserTask(context: IConsumerContext,
                              processModelKey: string,
                              correlationId: string,
                              userTaskId: string,
                              userTaskResult: IUserTaskResult): Promise<void> {

    const requestAuthHeaders: IRequestOptions = this.createRequestAuthHeaders(context);

    const url: string = restSettings.paths.finishUserTask
      .replace(restSettings.params.processModelKey, processModelKey)
      .replace(restSettings.params.correlationId, correlationId)
      .replace(restSettings.params.userTaskId, userTaskId);

    await this.httpClient.post<IUserTaskResult, any>(url, userTaskResult, requestAuthHeaders);
  }

  private createRequestAuthHeaders(context: IConsumerContext): IRequestOptions {
    const requestAuthHeaders: IRequestOptions = {
      headers: {
        Authorization: context.authorization,
      },
    };

    return requestAuthHeaders;
  }
}
