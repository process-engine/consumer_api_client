namespace ProcessEngine.ConsumerAPI.Client
{
    using System.Collections.Generic;
    using System.Net.Http.Headers;
    using System.Net.Http;
    using System.Text;
    using System.Threading.Tasks;
    using System;

    using EssentialProjects.IAM.Contracts;

    using ProcessEngine.ConsumerAPI.Contracts;
    using ProcessEngine.ConsumerAPI.Contracts.DataModel;

    using RestSettings = ProcessEngine.ConsumerAPI.Contracts.RestSettings;

    using Newtonsoft.Json.Serialization;
    using Newtonsoft.Json;

    public class ConsumerApiClientService : IConsumerApiClient
    {
        private readonly HttpClient httpClient;

        public ConsumerApiClientService(HttpClient httpClient)
        {
            this.httpClient = httpClient;
        }

        public void Dispose()
        {
            this.httpClient.Dispose();
        }

        public async Task<ProcessModelList> GetProcessModels(IIdentity identity, int offset = 0, int limit = 0)
        {
            var endpoint = RestSettings.Paths.ProcessModels;

            var result = await this.SendRequestAndExpectResult<ProcessModelList>(identity, HttpMethod.Get, endpoint, null, offset, limit);

            return result;
        }

        public async Task<ProcessModel> GetProcessModelById(IIdentity identity, string processModelId)
        {
            var endpoint = RestSettings.Paths.ProcessModelById
                .Replace(RestSettings.Params.ProcessModelId, processModelId);

            var parsedResult = await this.GetProcessModelFromUrl(identity, endpoint);

            return parsedResult;
        }

        public async Task<ProcessModel> GetProcessModelByProcessInstanceId(IIdentity identity, string processInstanceId)
        {
            var endpoint = RestSettings.Paths.ProcessModelByProcessInstanceId
                .Replace(RestSettings.Params.ProcessInstanceId, processInstanceId);

            var parsedResult = await this.GetProcessModelFromUrl(identity, endpoint);

            return parsedResult;
        }

        public async Task<ProcessStartResponsePayload> StartProcessInstance<TInputValues>(
            IIdentity identity,
            string processModelId,
            string startEventId,
            ProcessStartRequestPayload<TInputValues> processStartRequestPayload,
            StartCallbackType callbackType = StartCallbackType.CallbackOnProcessInstanceCreated,
            string endEventId = "")
        where TInputValues : new()
        {

            if (identity == null)
            {
                throw new UnauthorizedAccessException(nameof(identity));
            }

            var noEndEventIdProvided = callbackType == StartCallbackType.CallbackOnEndEventReached &&
                String.IsNullOrEmpty(endEventId);

            if (noEndEventIdProvided)
            {
                throw new ArgumentNullException(nameof(endEventId));
            }

            var endpoint = RestSettings.Paths.StartProcessInstance
                .Replace(RestSettings.Params.ProcessModelId, processModelId);

            var urlWithEndpoint = this.ApplyBaseUrl(endpoint);

            var urlWithParams = $"{RestSettings.Endpoints.ConsumerAPI}{endpoint}?start_callback_type={(int)callbackType}";

            var startEventIdProvided = !String.IsNullOrEmpty(startEventId);
            if (startEventIdProvided)
            {
                urlWithParams = $"{urlWithParams}&start_event_id={startEventId}";
            }

            var attachEndEventId = callbackType == StartCallbackType.CallbackOnEndEventReached;
            if (attachEndEventId)
            {
                urlWithParams = $"{urlWithParams}&end_event_id={endEventId}";
            }

            var jsonResult = "";

            var jsonPayload = SerializeForProcessEngine(processStartRequestPayload);
            var requestContent = new StringContent(jsonPayload, Encoding.UTF8, "application/json");
            var request = this.CreateRequestMessage(identity, HttpMethod.Post, urlWithParams, requestContent);
            var result = await this.httpClient.SendAsync(request);

            if (result.IsSuccessStatusCode)
            {
                jsonResult = await result.Content.ReadAsStringAsync();
                var parsedResult = JsonConvert.DeserializeObject<ProcessStartResponsePayload>(jsonResult);
                return parsedResult;
            }

            throw new Exception("Process could not be started.");
        }

        public async Task<IEnumerable<CorrelationResult<TPayload>>> GetProcessResultForCorrelation<TPayload>(
            IIdentity identity,
            string correlationId,
            string processModelId)
        where TPayload : new()
        {
            var endpoint = RestSettings.Paths.GetProcessResultForCorrelation
                .Replace(RestSettings.Params.CorrelationId, correlationId)
                .Replace(RestSettings.Params.ProcessModelId, processModelId);

            var urlWithEndpoint = this.ApplyBaseUrl(endpoint);

            var jsonResult = "";

            IEnumerable<CorrelationResult<TPayload>> parsedResult = null;

            var request = this.CreateRequestMessage(identity, HttpMethod.Get, urlWithEndpoint);
            var result = await this.httpClient.SendAsync(request);

            if (result.IsSuccessStatusCode)
            {
                jsonResult = await result.Content.ReadAsStringAsync();
                parsedResult = JsonConvert.DeserializeObject<IEnumerable<CorrelationResult<TPayload>>>(jsonResult);
            }

            return parsedResult;
        }

        public async Task<IEnumerable<ProcessInstance>> GetProcessInstancesByIdentity(IIdentity identity, int offset = 0, int limit = 0)
        {
            var endpoint = RestSettings.Paths.GetOwnProcessInstances;

            var result = await this.SendRequestAndExpectResult<IEnumerable<ProcessInstance>>(identity, HttpMethod.Get, endpoint, null, offset, limit);

            return result;
        }

        public async Task<EventList> GetEventsForProcessModel(IIdentity identity, string processModelId, int offset = 0, int limit = 0)
        {
            var endpoint = RestSettings.Paths.ProcessModelEvents
                .Replace(RestSettings.Params.ProcessModelId, processModelId);

            var parsedResult = await this.GetTriggerableEventsFromUrl(identity, endpoint, offset, limit);

            return parsedResult;
        }

        public async Task<EventList> GetEventsForCorrelation(IIdentity identity, string correlationId, int offset = 0, int limit = 0)
        {
            var endpoint = RestSettings.Paths.CorrelationEvents
                .Replace(RestSettings.Params.CorrelationId, correlationId);

            var parsedResult = await this.GetTriggerableEventsFromUrl(identity, endpoint, offset, limit);

            return parsedResult;
        }

        public async Task<EventList> GetEventsForProcessModelInCorrelation(IIdentity identity, string processModelId, string correlationId, int offset = 0, int limit = 0)
        {
            var endpoint = RestSettings.Paths.CorrelationEvents
                .Replace(RestSettings.Params.ProcessModelId, processModelId)
                .Replace(RestSettings.Params.CorrelationId, correlationId);

            var parsedResult = await this.GetTriggerableEventsFromUrl(identity, endpoint, offset, limit);

            return parsedResult;
        }

        public async Task TriggerMessageEvent(IIdentity identity, string messageName)
        {
            await this.TriggerMessageEvent(identity, messageName, new {});
        }

        public async Task TriggerMessageEvent(IIdentity identity, string messageName, object triggerPayload)
        {
            var endpoint = RestSettings.Paths.TriggerMessageEvent
                .Replace(RestSettings.Params.EventName, messageName);

            var urlWithEndpoint = this.ApplyBaseUrl(endpoint);

            var jsonPayload = SerializeForProcessEngine(triggerPayload);
            var requestContent = new StringContent(jsonPayload, Encoding.UTF8, "application/json");
            var request = this.CreateRequestMessage(identity, HttpMethod.Post, urlWithEndpoint, requestContent);
            var result = await this.httpClient.SendAsync(request);

            if (!result.IsSuccessStatusCode)
            {
                throw new Exception("Message event could not be triggered");
            }
        }

        public async Task TriggerSignalEvent(IIdentity identity, string signalName)
        {
            await this.TriggerSignalEvent(identity, signalName, new {});
        }

        public async Task TriggerSignalEvent(IIdentity identity, string signalName, object triggerPayload)
        {
            var endpoint = RestSettings.Paths.TriggerSignalEvent
                .Replace(RestSettings.Params.EventName, signalName);

            var urlWithEndpoint = this.ApplyBaseUrl(endpoint);

            var jsonPayload = SerializeForProcessEngine(triggerPayload);
            var requestContent = new StringContent(jsonPayload, Encoding.UTF8, "application/json");
            var request = this.CreateRequestMessage(identity, HttpMethod.Post, urlWithEndpoint, requestContent);
            var result = await this.httpClient.SendAsync(request);

            if (!result.IsSuccessStatusCode)
            {
                throw new Exception("Signal event could not be triggered");
            }
        }

        public async Task<EmptyActivityList> GetEmptyActivitiesForProcessModel(IIdentity identity, string processModelId, int offset = 0, int limit = 0)
        {
            var endpoint = RestSettings.Paths.ProcessModelEmptyActivities
                .Replace(RestSettings.Params.ProcessModelId, processModelId);

            var parsedResult = await this.GetEmptyActivitiesFromUrl(identity, endpoint, offset, limit);

            return parsedResult;
        }

        public async Task<EmptyActivityList> GetEmptyActivitiesForProcessInstance(IIdentity identity, string processInstanceId, int offset = 0, int limit = 0)
        {
            var endpoint = RestSettings.Paths.ProcessInstanceEmptyActivities
                .Replace(RestSettings.Params.ProcessInstanceId, processInstanceId);

            var parsedResult = await this.GetEmptyActivitiesFromUrl(identity, endpoint, offset, limit);

            return parsedResult;
        }

        public async Task<EmptyActivityList> GetEmptyActivitiesForCorrelation(IIdentity identity, string correlationId, int offset = 0, int limit = 0)
        {
            var endpoint = RestSettings.Paths.CorrelationEmptyActivities
                .Replace(RestSettings.Params.CorrelationId, correlationId);

            var parsedResult = await this.GetEmptyActivitiesFromUrl(identity, endpoint, offset, limit);

            return parsedResult;
        }

        public async Task<EmptyActivityList> GetEmptyActivitiesForProcessModelInCorrelation(IIdentity identity, string processModelId, string correlationId, int offset = 0, int limit = 0)
        {
            var endpoint = RestSettings.Paths.ProcessModelCorrelationEmptyActivities
                .Replace(RestSettings.Params.ProcessModelId, processModelId)
                .Replace(RestSettings.Params.CorrelationId, correlationId);

            var parsedResult = await this.GetEmptyActivitiesFromUrl(identity, endpoint, offset, limit);

            return parsedResult;
        }

        public async Task<EmptyActivityList> GetWaitingEmptyActivitiesByIdentity(IIdentity identity, int offset = 0, int limit = 0)
        {
            var endpoint = RestSettings.Paths.GetOwnEmptyActivities;

            var parsedResult = await this.GetEmptyActivitiesFromUrl(identity, endpoint, offset, limit);

            return parsedResult;
        }

        public async Task FinishEmptyActivity(IIdentity identity, string processInstanceId, string correlationId, string emptyActivityInstanceId)
        {
            var endpoint = RestSettings.Paths.FinishEmptyActivity
                .Replace(RestSettings.Params.ProcessInstanceId, processInstanceId)
                .Replace(RestSettings.Params.CorrelationId, correlationId)
                .Replace(RestSettings.Params.EmptyActivityInstanceId, emptyActivityInstanceId);

            var urlWithEndpoint = this.ApplyBaseUrl(endpoint);

            var request = this.CreateRequestMessage(identity, HttpMethod.Post, urlWithEndpoint);
            var result = await this.httpClient.SendAsync(request);

            if (!result.IsSuccessStatusCode)
            {
                throw new Exception($"Failed to finish EmptyActivity: {result.ReasonPhrase}");
            }
        }

        public async Task<IEnumerable<ExternalTask<TPayload>>> FetchAndLockExternalTasks<TPayload>(IIdentity identity, string workerId, string topicName, int maxTasks, int longPollingTimeout, int lockDuration) where TPayload : new()
        {
            var endpoint = RestSettings.Paths.FetchAndLockExternalTasks;
            var url = this.ApplyBaseUrl(endpoint);

            var fetchAndLockRequest = new FetchAndLockRequest
            (
                workerId,
                topicName,
                maxTasks,
                longPollingTimeout,
                lockDuration
            );

            var jsonPayload = SerializeForProcessEngine(fetchAndLockRequest);
            var requestContent = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            var result = await this.SendRequestAndExpectResult<IEnumerable<ExternalTask<TPayload>>>(identity, HttpMethod.Post, url, requestContent);

            return result;
        }

        public async Task ExtendLock(IIdentity identity, string workerId, string externalTaskId, int additionalDuration)
        {
            var endpoint = RestSettings.Paths.ExtendExternalTaskLock.Replace(RestSettings.Params.ExternalTaskId, externalTaskId);
            var url = this.ApplyBaseUrl(endpoint);

            var extendLockRequest = new ExtendLockRequest
            (
                workerId,
                additionalDuration
            );

            await this.PostExternalTaskRequest<ExtendLockRequest>(identity, endpoint, extendLockRequest);
        }

        public async Task FinishExternalTask<TPayload>(IIdentity identity, string workerId, string externalTaskId, TPayload payload)
        {
            var endpoint = RestSettings.Paths.FinishExternalTask.Replace(RestSettings.Params.ExternalTaskId, externalTaskId);

            var finishExternalTaskRequest = new FinishExternalTaskRequest<TPayload>
            (
                workerId,
                payload
            );

            await this.PostExternalTaskRequest<FinishExternalTaskRequest<TPayload>>(identity, endpoint, finishExternalTaskRequest);
        }

        public async Task HandleBpmnError(IIdentity identity, string workerId, string externalTaskId, string errorCode)
        {
            var endpoint = RestSettings.Paths.FinishExternalTaskWithBpmnError.Replace(RestSettings.Params.ExternalTaskId, externalTaskId);

            var handleBpmnErrorRequest = new HandleBpmnErrorRequest
            (
                workerId,
                errorCode
            );

            await this.PostExternalTaskRequest<HandleBpmnErrorRequest>(identity, endpoint, handleBpmnErrorRequest);
        }

        public async Task HandleServiceError(IIdentity identity, string workerId, string externalTaskId, string errorMessage, string errorDetails)
        {
            var endpoint = RestSettings.Paths.FinishExternalTaskWithServiceError.Replace(RestSettings.Params.ExternalTaskId, externalTaskId);

            var handleServiceErrorRequest = new HandleServiceErrorRequest
            (
                workerId,
                errorMessage,
                errorDetails
            );

            await this.PostExternalTaskRequest<HandleServiceErrorRequest>(identity, endpoint, handleServiceErrorRequest);
        }

        public async Task<UserTaskList> GetUserTasksForProcessModel(IIdentity identity, string processModelId, int offset = 0, int limit = 0)
        {
            var endpoint = RestSettings.Paths.ProcessModelUserTasks
                .Replace(RestSettings.Params.ProcessModelId, processModelId);

            var parsedResult = await this.GetUserTasksFromUrl(identity, endpoint, offset, limit);

            return parsedResult;
        }

        public async Task<UserTaskList> GetUserTasksForProcessInstance(IIdentity identity, string processInstanceId, int offset = 0, int limit = 0)
        {
            var endpoint = RestSettings.Paths.ProcessInstanceUserTasks
                .Replace(RestSettings.Params.ProcessInstanceId, processInstanceId);

            var parsedResult = await this.GetUserTasksFromUrl(identity, endpoint, offset, limit);

            return parsedResult;
        }

        public async Task<UserTaskList> GetUserTasksForCorrelation(IIdentity identity, string correlationId, int offset = 0, int limit = 0)
        {
            var endpoint = RestSettings.Paths.CorrelationUserTasks
                .Replace(RestSettings.Params.CorrelationId, correlationId);

            var parsedResult = await this.GetUserTasksFromUrl(identity, endpoint, offset, limit);

            return parsedResult;
        }

        public async Task<UserTaskList> GetUserTasksForProcessModelInCorrelation(IIdentity identity, string processModelId, string correlationId, int offset = 0, int limit = 0)
        {
            var endpoint = RestSettings.Paths.ProcessModelCorrelationUserTasks
                .Replace(RestSettings.Params.ProcessModelId, processModelId)
                .Replace(RestSettings.Params.CorrelationId, correlationId);

            var parsedResult = await this.GetUserTasksFromUrl(identity, endpoint, offset, limit);

            return parsedResult;
        }

        public async Task<UserTaskList> GetWaitingUserTasksByIdentity(IIdentity identity, int offset = 0, int limit = 0)
        {
            var endpoint = RestSettings.Paths.GetOwnUserTasks;

            var parsedResult = await this.GetUserTasksFromUrl(identity, endpoint, offset, limit);

            return parsedResult;
        }

        public async Task FinishUserTask(IIdentity identity, string processInstanceId, string correlationId, string userTaskInstanceId, UserTaskResult userTaskResult)
        {
            var endpoint = RestSettings.Paths.FinishUserTask
                .Replace(RestSettings.Params.ProcessInstanceId, processInstanceId)
                .Replace(RestSettings.Params.CorrelationId, correlationId)
                .Replace(RestSettings.Params.UserTaskInstanceId, userTaskInstanceId);

            var urlWithEndpoint = this.ApplyBaseUrl(endpoint);

            var jsonPayload = SerializeForProcessEngine(userTaskResult);
            var requestContent = new StringContent(jsonPayload, Encoding.UTF8, "application/json");
            var request = this.CreateRequestMessage(identity, HttpMethod.Post, urlWithEndpoint, requestContent);
            var result = await this.httpClient.SendAsync(request);

            if (!result.IsSuccessStatusCode)
            {
                throw new Exception($"Failed to finish UserTask: {result.ReasonPhrase}");
            }
        }

        public async Task<ManualTaskList> GetManualTasksForProcessModel(IIdentity identity, string processModelId, int offset = 0, int limit = 0)
        {
            var endpoint = RestSettings.Paths.ProcessModelManualTasks
                .Replace(RestSettings.Params.ProcessModelId, processModelId);

            var parsedResult = await this.GetManualTasksFromUrl(identity, endpoint, offset, limit);

            return parsedResult;
        }

        public async Task<ManualTaskList> GetManualTasksForProcessInstance(IIdentity identity, string processInstanceId, int offset = 0, int limit = 0)
        {
            var endpoint = RestSettings.Paths.ProcessInstanceManualTasks
                .Replace(RestSettings.Params.ProcessInstanceId, processInstanceId);

            var parsedResult = await this.GetManualTasksFromUrl(identity, endpoint, offset, limit);

            return parsedResult;
        }

        public async Task<ManualTaskList> GetManualTasksForCorrelation(IIdentity identity, string correlationId, int offset = 0, int limit = 0)
        {
            var endpoint = RestSettings.Paths.CorrelationManualTasks
                .Replace(RestSettings.Params.CorrelationId, correlationId);

            var parsedResult = await this.GetManualTasksFromUrl(identity, endpoint, offset, limit);

            return parsedResult;
        }

        public async Task<ManualTaskList> GetManualTasksForProcessModelInCorrelation(IIdentity identity, string processModelId, string correlationId, int offset = 0, int limit = 0)
        {
            var endpoint = RestSettings.Paths.ProcessModelCorrelationManualTasks
                .Replace(RestSettings.Params.ProcessModelId, processModelId)
                .Replace(RestSettings.Params.CorrelationId, correlationId);

            var parsedResult = await this.GetManualTasksFromUrl(identity, endpoint, offset, limit);

            return parsedResult;
        }

        public async Task<ManualTaskList> GetWaitingManualTasksByIdentity(IIdentity identity, int offset = 0, int limit = 0)
        {
            var endpoint = RestSettings.Paths.GetOwnManualTasks;

            var parsedResult = await this.GetManualTasksFromUrl(identity, endpoint, offset, limit);

            return parsedResult;
        }

        public async Task FinishManualTask(IIdentity identity, string processInstanceId, string correlationId, string manualTaskInstanceId)
        {
            var endpoint = RestSettings.Paths.FinishManualTask
                .Replace(RestSettings.Params.ProcessInstanceId, processInstanceId)
                .Replace(RestSettings.Params.CorrelationId, correlationId)
                .Replace(RestSettings.Params.ManualTaskInstanceId, manualTaskInstanceId);

            var urlWithEndpoint = this.ApplyBaseUrl(endpoint);

            var request = this.CreateRequestMessage(identity, HttpMethod.Post, urlWithEndpoint);
            var result = await this.httpClient.SendAsync(request);

            if (!result.IsSuccessStatusCode)
            {
                throw new Exception($"Failed to finish ManualTask: {result.ReasonPhrase}");
            }
        }

        private async Task<ProcessModel> GetProcessModelFromUrl(IIdentity identity, string url)
        {
            var result = await this.SendRequestAndExpectResult<ProcessModel>(identity, HttpMethod.Get, url);

            return result;
        }

        private async Task<EventList> GetTriggerableEventsFromUrl(IIdentity identity, string url, int offset = 0, int limit = 0)
        {
            var result = await this.SendRequestAndExpectResult<EventList>(identity, HttpMethod.Get, url);

            return result;
        }

        private async Task<EmptyActivityList> GetEmptyActivitiesFromUrl(IIdentity identity, string url, int offset = 0, int limit = 0)
        {
            var result = await this.SendRequestAndExpectResult<EmptyActivityList>(identity, HttpMethod.Get, url);

            return result;
        }

        private async Task PostExternalTaskRequest<TRequest>(IIdentity identity, string endpoint, TRequest request)
        {
            var url = this.ApplyBaseUrl(endpoint);

            var jsonPayload = SerializeForProcessEngine(request);
            var requestContent = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            var httpRequest = this.CreateRequestMessage(identity, HttpMethod.Post, url, requestContent);

            var result = await this.httpClient.SendAsync(httpRequest);

            if (!result.IsSuccessStatusCode)
            {
                throw new Exception($"Failed to send ExternalTask request: {result.ReasonPhrase}");
            }
        }

        private async Task<ManualTaskList> GetManualTasksFromUrl(IIdentity identity, string url, int offset = 0, int limit = 0)
        {
            var result = await this.SendRequestAndExpectResult<ManualTaskList>(identity, HttpMethod.Get, url);

            return result;
        }

        private async Task<UserTaskList> GetUserTasksFromUrl(IIdentity identity, string url, int offset = 0, int limit = 0)
        {
            var result = await this.SendRequestAndExpectResult<UserTaskList>(identity, HttpMethod.Get, url);

            return result;
        }

        private async Task<TResult> SendRequestAndExpectResult<TResult>(IIdentity identity, HttpMethod method, string endpoint, HttpContent content = null, int offset = 0, int limit = 0)
        {
            var url = this.ApplyBaseUrl(endpoint);

            if(url.Contains("?")) {
                url = $"{url}&offset={offset}&limit={limit}";
            }
            else
            {
                url = $"{url}?offset={offset}&limit={limit}";
            }

            TResult parsedResult = default(TResult);

            var request = this.CreateRequestMessage(identity, HttpMethod.Get, url);
            var result = await this.httpClient.SendAsync(request);

            if (result.IsSuccessStatusCode)
            {
                var jsonResult = await result.Content.ReadAsStringAsync();
                parsedResult = JsonConvert.DeserializeObject<TResult>(jsonResult);
            }
            else
            {
                throw new Exception($"Request failed: {result.ReasonPhrase}");
            }

            return parsedResult;
        }

        private string ApplyBaseUrl(string endpoint)
        {
            return $"{RestSettings.Endpoints.ConsumerAPI}{endpoint}";
        }

        private HttpRequestMessage CreateRequestMessage(IIdentity identity, HttpMethod method, string url, HttpContent content = null)
        {
            var hasNoIdentity = identity == null || identity.Token == null;
            if (hasNoIdentity)
            {
                throw new UnauthorizedAccessException();
            }

            var message = new HttpRequestMessage();

            message.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            message.Headers.Authorization = new AuthenticationHeaderValue("Bearer", identity.Token);

            message.RequestUri = new Uri(this.httpClient.BaseAddress, url);
            message.Content = content;
            message.Method = method;

            return message;
        }

        private string SerializeForProcessEngine(object payload)
        {
            var contractResolver = new DefaultContractResolver
            {
                NamingStrategy = new CamelCaseNamingStrategy()
            };

            var serializerSettings = new JsonSerializerSettings
            {
                ContractResolver = contractResolver,
                Formatting = Formatting.None
            };

            var jsonPayload = JsonConvert.SerializeObject(payload, serializerSettings);
            return jsonPayload;
        }
  }
}
