namespace ProcessEngine.ConsumerAPI.Client
{
    using System;
    using ProcessEngine.ConsumerAPI.Contracts;
    using Quobject.SocketIoClientDotNet.Client;

    public class ConsumerApiClientService : IConsumerApi, IDisposable
    {

      private delegate void ProcessEndedDelegate();

      private ProcessEndedDelegate ProcessEnded = new ProcessEndedDelegate();
      private Socket Socket { get; set; }

      public ConsumerApiClientServiceConfiguration Configuration { get; set; }

      public void initializeSocket() {
        
            var socketUrl = this.Configuration.SocketUrl;
            this.Socket = IO.Socket(socketUrl);

            // ACHTUNG: Dieser Client ist bereits deprecated aber der Ersatz von
            // IBM kann nur Rooms verwenden (hilft uns nicht)
            //
            // Siehe:
            // https://github.com/Quobject/EngineIoClientDotNet/issues/69
            // https://github.com/IBM/socket-io
            //
            // Laut Issues ist von diesem Paket 1.0.2 die letzte funktionierende
            // Version. Das konnte ich noch nicht testen (SM).

            this.Socket.On(socket.EVENT_OPEN, () => {

              this.Socket.On("process_ended", () => {
                this.ProcessEnded();
              });
            });

            this.Socket.Open();
      }

      public void Dispose() {

            this.Socket.Close();
      }

      private HttpClient _createHttpClient(IIdentity identity) {
            var client = new HttpClient(new HttpClientHandler()
            {
                UseDefaultCredentials = true
            });
            client.BaseAddress = new Uri(this.Configuration.BaseUrl);

            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            
            var token = identity.token;

            if (token == null) {
              throw new UnauthorizedAccessException();
            }

            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", identity.token);
            
            return client;
      }

      public Task<TProcessStartResponsePayload> StartProcessInstance<TProcessStartRequestPayload, TProcessStartResponsePayload>(
            string identity,
            string processModelId,
            string startEventKey,
            TProcessStartRequestPayload payload,
            StartCallbackType callbackType = StartCallbackType.CallbackOnProcessInstanceCreated,
            string endEventKey = "",
            Delegate processEndedCallback = null)
            where TProcessStartResponsePayload : new() {

            var url = $"/process_models/{processModelId}/start_events/{startEventKey}/start";

            var attachEndEventId = startCallbackType == StartCallbackType.CallbackOnEndEventReached;
            
            if (attachEndEventId) {
              url = $"{url}&end_event_id={endEventKey}";
            }

            var jsonResult = "";

            var client = _createHttpClient(identity);

            var callbackProvided = processEndedCallback != null;

            if (callbackProvided) {
              // Hier müsste noch eine ID-Prüfung stattfinden
              // scheinbar fehlt die aber auch bei der TS-Variante
              this.ProcessEnded += processEndedCallback;
            }

            var result = await client.PostAsJsonAsync(url, payload);

            if (result.IsSuccessStatusCode) {
                jsonResult = await result.Content.ReadAsStringAsync();
                var parsedResult = JsonConvert.DeserializeObject<TProcessStartResponsePayload>(jsonResult);
                return parsedResult;
            }

            if (callbackProvided) {
              this.ProcessEnded -= processEndedCallback;
            }

            return null;
      }

      Task<IEnumerable<CorrelationResult<TPayload>>> GetProcessResultForCorrelation<TPayload>(string identity, string correlationId, string processModelId)
            where TPayload : new() {
            
            var url = $"/correlations/{correlationId}/process_models/${processModelId}/results";

            var jsonResult = "";

            var client = _createHttpClient(identity);

            var result = await client.GetAsync(url);

            if (result.IsSuccessStatusCode) {
                jsonResult = await result.Content.ReadAsStringAsync();
                var parsedResult = JsonConvert.DeserializeObject<IEnumerable<CorrelationResult<TPayload>>>(jsonResult);
                return parsedResult;
            }

            return null;
      }
    }
}
