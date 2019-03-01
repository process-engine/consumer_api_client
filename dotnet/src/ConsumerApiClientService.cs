namespace ProcessEngine.ConsumerAPI.Client
{
    using System.Collections.Generic;
    using System.Net.Http.Headers;
    using System.Net.Http;
    using System.Text;
    using System.Threading.Tasks;
    using System;

    using EssentialProjects.IAM.Contracts;

    using ProcessEngine.ConsumerAPI.Contracts.RestSettings;
    using ProcessEngine.ConsumerAPI.Contracts;
    using ProcessEngine.ConsumerAPI.DataModel;

    using Newtonsoft.Json.Serialization;
    using Newtonsoft.Json;

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

            var url = Paths.StartProcessInstance
                .Replace(Params.ProcessModelId, processModelId);

            url = $"{Endpoints.ConsumerAPI}/{url}?start_callback_type={(int)callbackType}";

            var startEventIdIsGiven = startEventId != null;
            if (startEventIdIsGiven) {
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
            var url = Paths.GetProcessResultForCorrelation
                .Replace(Params.CorrelationId, correlationId)
                .Replace(Params.ProcessModelId, processModelId);

            url = $"{Endpoints.ConsumerAPI}/{url}";

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
            var url = Paths.ProcessModelEvents
                .Replace(Params.ProcessModelId, processModelId);

            url = $"{Endpoints.ConsumerAPI}/{url}";

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
            var url = Paths.CorrelationEvents
                .Replace(Params.CorrelationId, correlationId);

            url = $"{Endpoints.ConsumerAPI}/{url}";

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
            var url = Paths.CorrelationEvents
                .Replace(Params.ProcessModelId, processModelId)
                .Replace(Params.CorrelationId, correlationId);

            url = $"{Endpoints.ConsumerAPI}/{url}";

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

        public async Task TriggerMessageEvent(IIdentity identity, string messageName, object triggerPayload = null)
        {
            var url = Paths.TriggerMessageEvent
                .Replace(Params.EventName, messageName);

            var payload = triggerPayload == null ? new {} : triggerPayload;
            var jsonPayload = SerializeForProcessEngine(payload);
            var requestContent = new StringContent(jsonPayload, Encoding.UTF8, "application/json");
            var request = this.CreateRequestMessage(identity, HttpMethod.Post, url, requestContent);
            var result = await this.httpClient.SendAsync(request);

            if (!result.IsSuccessStatusCode)
            {
                throw new Exception("Message event could not be triggered");
            }
        }

        public async Task TriggerSignalEvent(IIdentity identity, string signalName, object triggerPayload = null)
        {
            var url = Paths.TriggerSignalEvent
                .Replace(Params.EventName, signalName);

            var payload = triggerPayload == null ? new {} : triggerPayload;
            var jsonPayload = SerializeForProcessEngine(payload);
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
    }
}
