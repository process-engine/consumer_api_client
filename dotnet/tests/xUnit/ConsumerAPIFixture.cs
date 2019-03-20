namespace ProcessEngine.ConsumerAPI.Client.Tests.xUnit
{
    using System.IO;
    using System.Net.Http.Headers;
    using System.Net.Http;
    using System.Net.WebSockets;
    using System.Net;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using System;

    using EssentialProjects.IAM.Contracts;

    using ProcessEngine.ConsumerAPI.Client;

    using Newtonsoft.Json;
    using Xunit;

    public class ConsumerAPIFixture : IAsyncLifetime
    {
        private string processEngineRestApiUrl;
        private HttpClient httpClient;
        private ClientWebSocket webSocket;
        public ConsumerApiClientService ConsumerAPIClient { get; private set; }
        public CancellationTokenSource CancellationTokenSource { get; private set; }
        public IIdentity DefaultIdentity { get; private set; }

        public async Task InitializeAsync()
        {
            this.SetProcessEngineRestApiUrl();
            this.CreateConsumerAPIClient();
            await this.DeployBpmnProcesses();
            await this.StartWebSocket(this.CancellationTokenSource.Token);


            this.DefaultIdentity = DummyIdentity.Create();
        }

        public async Task DisposeAsync()
        {
            await this.CloseWebSocket(this.CancellationTokenSource.Token);
            this.CancellationTokenSource.Dispose();
        }

        public async Task StartWebSocket(CancellationToken cancellationToken)
        {
            var restApiUrl = this.processEngineRestApiUrl;
            var socketApiUrl = restApiUrl.Replace("http://", "ws://");
            var socketUri = new Uri(socketApiUrl);
            await this.webSocket.ConnectAsync(socketUri, cancellationToken);
            // The following call is not awaited because the returned task will
            // not be finished before listening stops.
            // This call only starts the loop that receives messages.
            // The loop is canceled using the cancellation token. This is done
            // via the Dispose-method in CloseWebSocket.
            this.ConsumerAPIClient.StartListening(this.CancellationTokenSource.Token);
        }

        public async Task CloseWebSocket(CancellationToken cancellationToken)
        {
            await this.webSocket.CloseOutputAsync(WebSocketCloseStatus.NormalClosure, "test run completed", cancellationToken);
            this.CancellationTokenSource.Dispose();
        }

        private void SetProcessEngineRestApiUrl()
        {
            string baseUrlFromEnv = Environment.GetEnvironmentVariable("PROCESS_ENGINE_REST_API_URL");
            string baseUrl = string.IsNullOrEmpty(baseUrlFromEnv) ? "http://localhost:8000" : baseUrlFromEnv;

            this.processEngineRestApiUrl = baseUrl;
        }

        private void CreateConsumerAPIClient()
        {
            this.CancellationTokenSource = new CancellationTokenSource();
            this.httpClient = CreateHttpClient();
            var identity = DummyIdentity.Create();

            Action<ClientWebSocket> webSocketConfiguration = (ClientWebSocket webSocket) =>
            {
                this.webSocket = webSocket;
                webSocket.Options.SetRequestHeader("Authorization", $"Bearer {identity.Token}");
            };

            this.ConsumerAPIClient = new ConsumerApiClientService(this.httpClient, webSocketConfiguration);
        }

        private HttpClient CreateHttpClient()
        {
            var identity = DummyIdentity.Create();

            var httpClient = new HttpClient();
            httpClient.BaseAddress = new Uri(this.processEngineRestApiUrl);

            httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", identity.Token);

            return httpClient;
        }

        private async Task DeployBpmnProcesses() {
            // Deploy test files from ./bpmn folder. The property "Copy to output directory" has to be true for these files.
            foreach (var file in Directory.GetFiles("./bpmn"))
            {
                FileInfo bpmnFile = new FileInfo(file);

                var isBpmnFile = bpmnFile.Extension.ToLower().Equals(".bpmn");
                if (isBpmnFile)
                {
                    await DeployTestBpmnFileAsync(bpmnFile);
                }
            }
        }

        private async Task DeployTestBpmnFileAsync(FileInfo bpmnFile)
        {
            try
            {
                var bpmnFileContent = File.ReadAllText(bpmnFile.FullName);
                var identity = DummyIdentity.Create();

                var importPayload = new
                {
                    name = bpmnFile.Name.Replace(bpmnFile.Extension, ""),
                    xml = bpmnFileContent,
                    overwriteExisting = true
                };

                var jsonImportPayload = JsonConvert.SerializeObject(importPayload);

                var response = await this.httpClient.PostAsync("api/deployment/v1/import_process_model", new StringContent(jsonImportPayload, Encoding.UTF8, "application/json"));

                if (response.StatusCode != HttpStatusCode.OK)
                {
                    throw new Exception($"ProcessEngine Rest API returned status {response.StatusCode}.");
                }

            }
            catch (Exception unknownException)
            {
                throw new Exception($"Cannot deploy BPMN file for base URL '{this.processEngineRestApiUrl}'. See inner exception for details.", unknownException);
            }
        }

    }
}
