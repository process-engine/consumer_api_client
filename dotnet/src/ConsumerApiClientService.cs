namespace ProcessEngine.ConsumerAPI.Client
{
    using System.Collections.Generic;
    using System.Net.Http.Headers;
    using System.Net.Http;
    using System.Text;
    using System.Threading.Tasks;
    using System;

    using EssentialProjects.IAM.Contracts;

    using RestSettings = ProcessEngine.ConsumerAPI.Contracts.RestSettings;
    using ProcessEngine.ConsumerAPI.Contracts.DataModel;
    using ProcessEngine.ConsumerAPI.Contracts;

    using Newtonsoft.Json.Serialization;
    using Newtonsoft.Json;
    using ProcessEngine.ConsumerAPI.Contracts.APIs;
    using ProcessEngine.ConsumerAPI.Contracts.DataModel;

    public class ConsumerApiClientService : IConsumerAPI
    {
        private readonly HttpClient httpClient;

        public ConsumerApiClientService(HttpClient httpClient)
        {
            this.httpClient = httpClient;
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

            var url = RestSettings.Paths.StartProcessInstance
                .Replace(RestSettings.Params.ProcessModelId, processModelId);

            url = $"{RestSettings.Endpoints.ConsumerAPI}{url}?start_callback_type={(int)callbackType}";

            var startEventIdProvided = !String.IsNullOrEmpty(startEventId);

            if (startEventIdProvided)
            {
                url = $"{url}&start_event_id={startEventId}";
            }

            var attachEndEventId = callbackType == StartCallbackType.CallbackOnEndEventReached;
            if (attachEndEventId)
            {
                url = $"{url}&end_event_id={endEventId}";
            }

            var jsonResult = "";

            var jsonPayload = SerializeForProcessEngine(processStartRequestPayload);
            var requestContent = new StringContent(jsonPayload, Encoding.UTF8, "application/json");
            var request = this.CreateRequestMessage(identity, HttpMethod.Post, url, requestContent);
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
            var url = RestSettings.Paths.GetProcessResultForCorrelation
                .Replace(RestSettings.Params.CorrelationId, correlationId)
                .Replace(RestSettings.Params.ProcessModelId, processModelId);

            url = $"{RestSettings.Endpoints.ConsumerAPI}{url}";

            var jsonResult = "";

            IEnumerable<CorrelationResult<TPayload>> parsedResult = null;

            var request = this.CreateRequestMessage(identity, HttpMethod.Get, url);
            var result = await this.httpClient.SendAsync(request);

            if (result.IsSuccessStatusCode)
            {
                jsonResult = await result.Content.ReadAsStringAsync();
                parsedResult = JsonConvert.DeserializeObject<IEnumerable<CorrelationResult<TPayload>>>(jsonResult);
            }

            return parsedResult;
        }
        public async Task<EventList> GetEventsForProcessModel(IIdentity identity, string processModelId)
        {
            var url = RestSettings.Paths.ProcessModelEvents
                .Replace(RestSettings.Params.ProcessModelId, processModelId);

            url = $"{RestSettings.Endpoints.ConsumerAPI}{url}";

            var jsonResult = "";

            EventList parsedResult = null;

            var request = this.CreateRequestMessage(identity, HttpMethod.Get, url);
            var result = await this.httpClient.SendAsync(request);

            if (result.IsSuccessStatusCode)
            {
                jsonResult = await result.Content.ReadAsStringAsync();
                parsedResult = JsonConvert.DeserializeObject<EventList>(jsonResult);
            }

            return parsedResult;
        }

        public async Task<EventList> GetEventsForCorrelation(IIdentity identity, string correlationId)
        {
            var url = RestSettings.Paths.CorrelationEvents
                .Replace(RestSettings.Params.CorrelationId, correlationId);

            url = $"{RestSettings.Endpoints.ConsumerAPI}{url}";

            var jsonResult = "";

            EventList parsedResult = null;

            var request = this.CreateRequestMessage(identity, HttpMethod.Get, url);
            var result = await this.httpClient.SendAsync(request);

            if (result.IsSuccessStatusCode)
            {
                jsonResult = await result.Content.ReadAsStringAsync();
                parsedResult = JsonConvert.DeserializeObject<EventList>(jsonResult);
            }

            return parsedResult;
        }

        public async Task<EventList> GetEventsForProcessModelInCorrelation(IIdentity identity, string processModelId, string correlationId)
        {
            var url = RestSettings.Paths.CorrelationEvents
                .Replace(RestSettings.Params.ProcessModelId, processModelId)
                .Replace(RestSettings.Params.CorrelationId, correlationId);

            url = $"{RestSettings.Endpoints.ConsumerAPI}{url}";

            var jsonResult = "";

            EventList parsedResult = null;

            var request = this.CreateRequestMessage(identity, HttpMethod.Get, url);
            var result = await this.httpClient.SendAsync(request);

            if (result.IsSuccessStatusCode)
            {
                jsonResult = await result.Content.ReadAsStringAsync();
                parsedResult = JsonConvert.DeserializeObject<EventList>(jsonResult);
            }

            return parsedResult;
        }

        public async Task TriggerMessageEvent(IIdentity identity, string messageName)
        {
            await this.TriggerMessageEvent(identity, messageName, new {});
        }

        public async Task TriggerMessageEvent(IIdentity identity, string messageName, object triggerPayload)
        {
            var url = RestSettings.Paths.TriggerMessageEvent
                .Replace(RestSettings.Params.EventName, messageName);

            url = $"{RestSettings.Endpoints.ConsumerAPI}{url}";

            var jsonPayload = SerializeForProcessEngine(triggerPayload);
            var requestContent = new StringContent(jsonPayload, Encoding.UTF8, "application/json");
            var request = this.CreateRequestMessage(identity, HttpMethod.Post, url, requestContent);
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
            var url = RestSettings.Paths.TriggerSignalEvent
                .Replace(RestSettings.Params.EventName, signalName);

            url = $"{RestSettings.Endpoints.ConsumerAPI}{url}";

            var jsonPayload = SerializeForProcessEngine(triggerPayload);
            var requestContent = new StringContent(jsonPayload, Encoding.UTF8, "application/json");
            var request = this.CreateRequestMessage(identity, HttpMethod.Post, url, requestContent);
            var result = await this.httpClient.SendAsync(request);

            if (!result.IsSuccessStatusCode)
            {
                throw new Exception("Signal event could not be triggered");
            }
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

        public Task<UserTaskList> GetUserTasksForProcessModel(IIdentity identity, string processModelId)
        {
            throw new NotImplementedException();
        }

        public Task<UserTaskList> GetUserTasksForCorrelation(IIdentity identity, string correlationId)
        {
            throw new NotImplementedException();
        }

        public Task<UserTaskList> GetUserTasksForProcessModelInCorrelation(IIdentity identity, string processModelId, string correlationId)
        {
            throw new NotImplementedException();
        }

        public Task<UserTaskList> GetWaitingUserTasksByIdentity(IIdentity identity)
        {
            throw new NotImplementedException();
        }

        public Task FinishUserTask(IIdentity identity, string processInstanceId, string correlationId, string userTaskInstanceId, UserTaskResult userTaskResult)
        {
            throw new NotImplementedException();
        }

        public Task<UserTaskList> GetUserTasksForProcessInstance(IIdentity identity, string processInstanceId)
        {
            throw new NotImplementedException();
        }

        public async Task<ManualTaskList> GetManualTasksForProcessModel(IIdentity identity, string processModelId)
        {
            var url = RestSettings.Paths.ProcessModelManualTasks
                .Replace(RestSettings.Params.ProcessModelId, processModelId);

            url = $"{RestSettings.Endpoints.ConsumerAPI}{url}";

            var jsonResult = "";

            ManualTaskList parsedResult = null;

            var request = this.CreateRequestMessage(identity, HttpMethod.Get, url);
            var result = await this.httpClient.SendAsync(request);

            if (result.IsSuccessStatusCode)
            {
                jsonResult = await result.Content.ReadAsStringAsync();
                parsedResult = JsonConvert.DeserializeObject<ManualTaskList>(jsonResult);
            }

            return parsedResult;
        }

        public async Task<ManualTaskList> GetManualTasksForProcessInstance(IIdentity identity, string processInstanceId)
        {
            var url = RestSettings.Paths.ProcessInstanceManualTasks
                .Replace(RestSettings.Params.ProcessInstanceId, processInstanceId);

            url = $"{RestSettings.Endpoints.ConsumerAPI}{url}";

            var jsonResult = "";

            ManualTaskList parsedResult = null;

            var request = this.CreateRequestMessage(identity, HttpMethod.Get, url);
            var result = await this.httpClient.SendAsync(request);

            if (result.IsSuccessStatusCode)
            {
                jsonResult = await result.Content.ReadAsStringAsync();
                parsedResult = JsonConvert.DeserializeObject<ManualTaskList>(jsonResult);
            }

            return parsedResult;
        }

        public async Task<ManualTaskList> GetManualTasksForCorrelation(IIdentity identity, string correlationId)
        {
            var url = RestSettings.Paths.CorrelationManualTasks
                .Replace(RestSettings.Params.CorrelationId, correlationId);

            url = $"{RestSettings.Endpoints.ConsumerAPI}{url}";

            var jsonResult = "";

            ManualTaskList parsedResult = null;

            var request = this.CreateRequestMessage(identity, HttpMethod.Get, url);
            var result = await this.httpClient.SendAsync(request);

            if (result.IsSuccessStatusCode)
            {
                jsonResult = await result.Content.ReadAsStringAsync();
                parsedResult = JsonConvert.DeserializeObject<ManualTaskList>(jsonResult);
            }

            return parsedResult;
        }

        public async Task<ManualTaskList> GetManualTasksForProcessModelInCorrelation(IIdentity identity, string processModelId, string correlationId)
        {
            var url = RestSettings.Paths.ProcessModelCorrelationManualTasks
                .Replace(RestSettings.Params.ProcessModelId, processModelId)
                .Replace(RestSettings.Params.CorrelationId, correlationId);

            url = $"{RestSettings.Endpoints.ConsumerAPI}{url}";

            var jsonResult = "";

            ManualTaskList parsedResult = null;

            var request = this.CreateRequestMessage(identity, HttpMethod.Get, url);
            var result = await this.httpClient.SendAsync(request);

            if (result.IsSuccessStatusCode)
            {
                jsonResult = await result.Content.ReadAsStringAsync();
                parsedResult = JsonConvert.DeserializeObject<ManualTaskList>(jsonResult);
            }

            return parsedResult;
        }

        public async Task<ManualTaskList> GetWaitingManualTasksByIdentity(IIdentity identity)
        {
            var url = RestSettings.Paths.GetOwnManualTasks;

            url = $"{RestSettings.Endpoints.ConsumerAPI}{url}";

            var jsonResult = "";

            ManualTaskList parsedResult = null;

            var request = this.CreateRequestMessage(identity, HttpMethod.Get, url);
            var result = await this.httpClient.SendAsync(request);

            if (result.IsSuccessStatusCode)
            {
                jsonResult = await result.Content.ReadAsStringAsync();
                parsedResult = JsonConvert.DeserializeObject<ManualTaskList>(jsonResult);
            }

            return parsedResult;
        }

        public Task FinishManualTask(IIdentity identity, string processInstanceId, string correlationId, string manualTaskInstanceId)
        {
            throw new NotImplementedException();
        }
    }
}
