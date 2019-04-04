namespace ProcessEngine.ConsumerAPI.Client
{
    using System.Collections.Generic;
    using System.Net.Http.Headers;
    using System.Net.Http;
    using System.Net.WebSockets;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using System;

    using EssentialProjects.IAM.Contracts;
    using EssentialProjects.WebSocket.Contracts;
    using EssentialProjects.WebSocket;

    using ProcessEngine.ConsumerAPI.Contracts;
    using ProcessEngine.ConsumerAPI.Contracts.APIs;
    using ProcessEngine.ConsumerAPI.Contracts.DataModel;
    using ProcessEngine.ConsumerAPI.Contracts.Messages.SystemEvent;
    using RestSettings = ProcessEngine.ConsumerAPI.Contracts.RestSettings;
    using SocketSettings = ProcessEngine.ConsumerAPI.Contracts.SocketSettings;

    using Newtonsoft.Json.Serialization;
    using Newtonsoft.Json;

    public class ConsumerApiClientService : IConsumerAPI
    {
        private readonly HttpClient HttpClient;
        private readonly Action<ClientWebSocket> WebSocketConfigurationCallback;
        private SocketClient SocketClient;

        public ConsumerApiClientService(HttpClient httpClient, Action<ClientWebSocket> webSocketConfigurationCallback)
        {
            this.HttpClient = httpClient;
            this.WebSocketConfigurationCallback = webSocketConfigurationCallback;

            this.InitializeSocket();
            this.InitializeSocketSubscriptions();
        }

        private void InitializeSocket()
        {
            var webSocket = new ClientWebSocket();
            this.WebSocketConfigurationCallback(webSocket);
            this.SocketClient = new SocketClient(webSocket, "consumer_api");
        }

        private void InitializeSocketSubscriptions() {
            this.SocketClient.RegisterMessageType<UserTaskReachedMessage>(SocketSettings.Paths.UserTaskWaiting);
            this.SocketClient.RegisterMessageType<UserTaskReachedMessage>(SocketSettings.Paths.UserTaskForIdentityWaiting);
            this.SocketClient.RegisterMessageType<UserTaskFinishedMessage>(SocketSettings.Paths.UserTaskFinished);
            this.SocketClient.RegisterMessageType<UserTaskFinishedMessage>(SocketSettings.Paths.UserTaskForIdentityFinished);
        }

        public async Task StartListening(CancellationToken cancellationToken) {
            await this.SocketClient.StartListening(cancellationToken);
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

            var urlWithParams = $"{urlWithEndpoint}?start_callback_type={(int)callbackType}";

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

            string jsonResult;

            var jsonPayload = SerializeForProcessEngine(processStartRequestPayload);
            var requestContent = new StringContent(jsonPayload, Encoding.UTF8, "application/json");
            var request = this.CreateRequestMessage(identity, HttpMethod.Post, urlWithParams, requestContent);
            var result = await this.HttpClient.SendAsync(request);

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

            string jsonResult;

            IEnumerable<CorrelationResult<TPayload>> parsedResult = null;

            var request = this.CreateRequestMessage(identity, HttpMethod.Get, urlWithEndpoint);
            var result = await this.HttpClient.SendAsync(request);

            if (result.IsSuccessStatusCode)
            {
                jsonResult = await result.Content.ReadAsStringAsync();
                parsedResult = JsonConvert.DeserializeObject<IEnumerable<CorrelationResult<TPayload>>>(jsonResult);
            }

            return parsedResult;
        }
        public async Task<EventList> GetEventsForProcessModel(IIdentity identity, string processModelId)
        {
            var endpoint = RestSettings.Paths.ProcessModelEvents
                .Replace(RestSettings.Params.ProcessModelId, processModelId);

            var urlWithEndpoint = this.ApplyBaseUrl(endpoint);

            var parsedResult = await this.GetTriggerableEventsFromUrl(identity, urlWithEndpoint);

            return parsedResult;
        }

        public async Task<EventList> GetEventsForCorrelation(IIdentity identity, string correlationId)
        {
            var endpoint = RestSettings.Paths.CorrelationEvents
                .Replace(RestSettings.Params.CorrelationId, correlationId);

            var urlWithEndpoint = this.ApplyBaseUrl(endpoint);

            var parsedResult = await this.GetTriggerableEventsFromUrl(identity, urlWithEndpoint);

            return parsedResult;
        }

        public async Task<EventList> GetEventsForProcessModelInCorrelation(IIdentity identity, string processModelId, string correlationId)
        {
            var endpoint = RestSettings.Paths.CorrelationEvents
                .Replace(RestSettings.Params.ProcessModelId, processModelId)
                .Replace(RestSettings.Params.CorrelationId, correlationId);

            var urlWithEndpoint = this.ApplyBaseUrl(endpoint);

            var parsedResult = await this.GetTriggerableEventsFromUrl(identity, urlWithEndpoint);

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
            var result = await this.HttpClient.SendAsync(request);

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
            var result = await this.HttpClient.SendAsync(request);

            if (!result.IsSuccessStatusCode)
            {
                throw new Exception("Signal event could not be triggered");
            }
        }

        public async Task<UserTaskList> GetUserTasksForProcessModel(IIdentity identity, string processModelId)
        {
            var endpoint = RestSettings.Paths.ProcessModelUserTasks
                .Replace(RestSettings.Params.ProcessModelId, processModelId);

            var urlWithEndpoint = this.ApplyBaseUrl(endpoint);

            var parsedResult = await this.GetUserTasksFromUrl(identity, urlWithEndpoint);

            return parsedResult;
        }

        public async Task<UserTaskList> GetUserTasksForProcessInstance(IIdentity identity, string processInstanceId)
        {
            var endpoint = RestSettings.Paths.ProcessInstanceUserTasks
                .Replace(RestSettings.Params.ProcessInstanceId, processInstanceId);

            var urlWithEndpoint = this.ApplyBaseUrl(endpoint);

            var parsedResult = await this.GetUserTasksFromUrl(identity, urlWithEndpoint);

            return parsedResult;
        }

        public async Task<UserTaskList> GetUserTasksForCorrelation(IIdentity identity, string correlationId)
        {
            var endpoint = RestSettings.Paths.CorrelationUserTasks
                .Replace(RestSettings.Params.CorrelationId, correlationId);

            var urlWithEndpoint = this.ApplyBaseUrl(endpoint);

            var parsedResult = await this.GetUserTasksFromUrl(identity, urlWithEndpoint);

            return parsedResult;
        }

        public async Task<UserTaskList> GetUserTasksForProcessModelInCorrelation(IIdentity identity, string processModelId, string correlationId)
        {
            var endpoint = RestSettings.Paths.ProcessModelCorrelationUserTasks
                .Replace(RestSettings.Params.ProcessModelId, processModelId)
                .Replace(RestSettings.Params.CorrelationId, correlationId);

            var urlWithEndpoint = this.ApplyBaseUrl(endpoint);

            var parsedResult = await this.GetUserTasksFromUrl(identity, urlWithEndpoint);

            return parsedResult;
        }

        public async Task<UserTaskList> GetWaitingUserTasksByIdentity(IIdentity identity)
        {
            var endpoint = RestSettings.Paths.GetOwnUserTasks;

            var urlWithEndpoint = this.ApplyBaseUrl(endpoint);

            var parsedResult = await this.GetUserTasksFromUrl(identity, urlWithEndpoint);

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
            var result = await this.HttpClient.SendAsync(request);

            if (!result.IsSuccessStatusCode)
            {
                throw new Exception($"Failed to finish UserTask: {result.ReasonPhrase}");
            }
        }

        public async Task<ManualTaskList> GetManualTasksForProcessModel(IIdentity identity, string processModelId)
        {
            var endpoint = RestSettings.Paths.ProcessModelManualTasks
                .Replace(RestSettings.Params.ProcessModelId, processModelId);

            var urlWithEndpoint = this.ApplyBaseUrl(endpoint);

            var parsedResult = await this.GetManualTasksFromUrl(identity, urlWithEndpoint);

            return parsedResult;
        }

        public async Task<ManualTaskList> GetManualTasksForProcessInstance(IIdentity identity, string processInstanceId)
        {
            var endpoint = RestSettings.Paths.ProcessInstanceManualTasks
                .Replace(RestSettings.Params.ProcessInstanceId, processInstanceId);

            var urlWithEndpoint = this.ApplyBaseUrl(endpoint);

            var parsedResult = await this.GetManualTasksFromUrl(identity, urlWithEndpoint);

            return parsedResult;
        }

        public async Task<ManualTaskList> GetManualTasksForCorrelation(IIdentity identity, string correlationId)
        {
            var endpoint = RestSettings.Paths.CorrelationManualTasks
                .Replace(RestSettings.Params.CorrelationId, correlationId);

            var urlWithEndpoint = this.ApplyBaseUrl(endpoint);

            var parsedResult = await this.GetManualTasksFromUrl(identity, urlWithEndpoint);

            return parsedResult;
        }

        public async Task<ManualTaskList> GetManualTasksForProcessModelInCorrelation(IIdentity identity, string processModelId, string correlationId)
        {
            var endpoint = RestSettings.Paths.ProcessModelCorrelationManualTasks
                .Replace(RestSettings.Params.ProcessModelId, processModelId)
                .Replace(RestSettings.Params.CorrelationId, correlationId);

            var urlWithEndpoint = this.ApplyBaseUrl(endpoint);

            var parsedResult = await this.GetManualTasksFromUrl(identity, urlWithEndpoint);

            return parsedResult;
        }

        public async Task<ManualTaskList> GetWaitingManualTasksByIdentity(IIdentity identity)
        {
            var endpoint = RestSettings.Paths.GetOwnManualTasks;

            var urlWithEndpoint = this.ApplyBaseUrl(endpoint);

            var parsedResult = await this.GetManualTasksFromUrl(identity, urlWithEndpoint);

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
            var result = await this.HttpClient.SendAsync(request);

            if (!result.IsSuccessStatusCode)
            {
                throw new Exception($"Failed to finish ManualTask: {result.ReasonPhrase}");
            }
        }

        private string ApplyBaseUrl(string endpoint)
        {
            return $"{RestSettings.Endpoints.ConsumerAPI}{endpoint}";
        }

        private async Task<EventList> GetTriggerableEventsFromUrl(IIdentity identity, string url, HttpContent content = null)
        {
            var result = await this.SendRequestAndExpectResult<EventList>(identity, HttpMethod.Get, url, content);

            return result;
        }

        private async Task<ManualTaskList> GetManualTasksFromUrl(IIdentity identity, string url, HttpContent content = null)
        {
            var result = await this.SendRequestAndExpectResult<ManualTaskList>(identity, HttpMethod.Get, url, content);

            return result;
        }

        private async Task<UserTaskList> GetUserTasksFromUrl(IIdentity identity, string url, HttpContent content = null)
        {
            var result = await this.SendRequestAndExpectResult<UserTaskList>(identity, HttpMethod.Get, url, content);

            return result;
        }

        private async Task<TResult> SendRequestAndExpectResult<TResult>(IIdentity identity, HttpMethod method, string url, HttpContent content = null)
        {
            TResult parsedResult = default(TResult);

            var request = this.CreateRequestMessage(identity, HttpMethod.Get, url);
            var result = await this.HttpClient.SendAsync(request);

            if (!result.IsSuccessStatusCode)
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

            message.RequestUri = new Uri(this.HttpClient.BaseAddress, url);
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

        public IDisposable OnUserTaskWaiting(IIdentity identity, Action<UserTaskReachedMessage> callback, bool? subscribeOnce)
        {
            var eventType = SocketSettings.Paths.UserTaskWaiting;

            if (subscribeOnce == true) {
                return this.SocketClient.Once(eventType, callback);
            }

            return this.SocketClient.On(eventType, callback);
        }

        public IDisposable OnUserTaskFinished(IIdentity identity, Action<UserTaskFinishedMessage> callback, bool? subscribeOnce)
        {
            var eventType = SocketSettings.Paths.UserTaskFinished;

            if (subscribeOnce == true) {
                return this.SocketClient.Once(eventType, callback);
            }

            return this.SocketClient.On(eventType, callback);
        }

        public IDisposable OnUserTaskForIdentityWaiting(IIdentity identity, Action<UserTaskReachedMessage> callback, bool? subscribeOnce)
        {
            var eventType = SocketSettings.Paths.UserTaskForIdentityWaiting
                .Replace(SocketSettings.Params.UserId, identity.UserId);

            if (subscribeOnce == true) {
                return this.SocketClient.Once(eventType, callback);
            }

            return this.SocketClient.On(eventType, callback);
        }

        public IDisposable OnUserTaskForIdentityFinished(IIdentity identity, Action<UserTaskFinishedMessage> callback, bool? subscribeOnce)
        {
            var eventType = SocketSettings.Paths.UserTaskForIdentityFinished
                .Replace(SocketSettings.Params.UserId, identity.UserId);

            if (subscribeOnce == true) {
                return this.SocketClient.Once(eventType, callback);
            }

            return this.SocketClient.On(eventType, callback);
        }
}
