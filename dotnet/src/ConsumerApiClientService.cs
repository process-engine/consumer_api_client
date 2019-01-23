namespace ProcessEngine.ConsumerAPI.Client {
    using System.Collections.Generic;
    using System.Net.Http.Headers;
    using System.Net.Http;
    using System.Text;
    using System.Threading.Tasks;
    using System;

    using EssentialProjects.IAM.Contracts;

    using ProcessEngine.ConsumerAPI.Contracts.RestSettings;
    using ProcessEngine.ConsumerAPI.Contracts;

    using Newtonsoft.Json.Serialization;
    using Newtonsoft.Json;

    public class ConsumerApiClientService : IConsumerAPI {

        private ConsumerApiClientServiceConfiguration Configuration { get; set; }

        public ConsumerApiClientService (ConsumerApiClientServiceConfiguration configuration) {
            this.Configuration = configuration;
        }

        public async Task<ProcessStartResponsePayload> StartProcessInstance<TInputValues> (
            IIdentity identity,
            string processModelId,
            string startEventKey,
            ProcessStartRequestPayload<TInputValues> processStartRequestPayload,
            StartCallbackType callbackType = StartCallbackType.CallbackOnProcessInstanceCreated,
            string endEventKey = "")
        where TInputValues : new () {

            if (identity == null) {
                throw new UnauthorizedAccessException (nameof (identity));
            }

            var noStartEventIdProvided = String.IsNullOrEmpty (startEventKey);

            if (noStartEventIdProvided) {
                throw new ArgumentNullException (nameof (startEventKey));
            }

            var noEndEventIdProvided = callbackType == StartCallbackType.CallbackOnEndEventReached &&
                String.IsNullOrEmpty (endEventKey);

            if (noEndEventIdProvided) {
                throw new ArgumentNullException (nameof (endEventKey));
            }

            var url = Paths.StartProcessInstance
                .Replace (Params.ProcessModelId, processModelId)
                .Replace (Params.StartEventId, startEventKey);

            url = $"{Endpoints.ConsumerAPI}/{url}?start_callback_type={(int)callbackType}";

            var attachEndEventId = callbackType == StartCallbackType.CallbackOnEndEventReached;

            if (attachEndEventId) {
                url = $"{url}&end_event_id={endEventKey}";
            }

            var jsonResult = "";

            using (var client = ProcessEngineHttpClientFactory.CreateHttpClient(identity, this.Configuration.BaseUrl)) {
                var jsonPayload = SerializeForProcessEngine (processStartRequestPayload);
                var result = await client.PostAsync (url, new StringContent (jsonPayload, Encoding.UTF8, "application/json"));

                if (result.IsSuccessStatusCode) {
                    jsonResult = await result.Content.ReadAsStringAsync ();
                    var parsedResult = JsonConvert.DeserializeObject<ProcessStartResponsePayload> (jsonResult);
                    return parsedResult;
                }

                throw new Exception ("Process could not be started.");
            }
        }

        public async Task<IEnumerable<CorrelationResult<TPayload>>> GetProcessResultForCorrelation<TPayload> (
            IIdentity identity,
            string correlationId,
            string processModelId)
        where TPayload : new () {
            var url = Paths.GetProcessResultForCorrelation
                .Replace (Params.CorrelationId, correlationId)
                .Replace (Params.ProcessModelId, processModelId);

            url = $"{Endpoints.ConsumerAPI}/{url}";

            var jsonResult = "";

            IEnumerable<CorrelationResult<TPayload>> parsedResult = null;

            using (var client = ProcessEngineHttpClientFactory.CreateHttpClient(identity, this.Configuration.BaseUrl)) {
                var result = await client.GetAsync (url);

                if (result.IsSuccessStatusCode) {
                    jsonResult = await result.Content.ReadAsStringAsync ();
                    parsedResult = JsonConvert.DeserializeObject<IEnumerable<CorrelationResult<TPayload>>> (jsonResult);
                }
            }

            return parsedResult;
        }

        private string SerializeForProcessEngine (object payload) {
            var contractResolver = new DefaultContractResolver {
                NamingStrategy = new CamelCaseNamingStrategy ()
            };
            var serializerSettings = new JsonSerializerSettings {
                ContractResolver = contractResolver,
                Formatting = Formatting.None
            };
            var jsonPayload = JsonConvert.SerializeObject (payload, serializerSettings);
            return jsonPayload;
        }
    }
}
