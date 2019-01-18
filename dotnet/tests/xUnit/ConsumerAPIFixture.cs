namespace ProcessEngine.ConsumerAPI.Client.Tests.xUnit
{
    using System;
    using System.IO;
    using System.Net;
    using System.Net.Http;
    using System.Net.Http.Headers;
    using System.Threading.Tasks;

    using ProcessEngine.ConsumerAPI.Client;

    public class ConsumerAPIFixture : IDisposable
    {
        public ConsumerApiClientService ConsumerAPIClient { get; private set; }

        private string processEngineRestApiUrl;

        public ConsumerAPIFixture()
        {
            SetProcessEngineRestApiUrl();

            this.ConsumerAPIClient = new ConsumerApiClientService();

            this.ConsumerAPIClient.Configuration = new ConsumerApiClientServiceConfiguration()
            {
                BaseUrl = this.processEngineRestApiUrl
            };

            // Deploy test files from ./bpmn folder. The property "Copy to output directory" has to be true for these files.
            foreach (var file in Directory.GetFiles("./bpmn"))
            {
                FileInfo bpmnFile = new FileInfo(file);

                var isBpmnFile = bpmnFile.Extension.ToLower().Equals(".bpmn");
                if (isBpmnFile)
                {
                    DeployTestBpmnFilesAsync(bpmnFile).GetAwaiter().GetResult();
                }
            }
        }

        private void SetProcessEngineRestApiUrl()
        {
            string baseUrlFromEnv = Environment.GetEnvironmentVariable("PROCESS_ENGINE_REST_API_URL");
            string baseUrl = string.IsNullOrEmpty(baseUrlFromEnv) ? "http://127.0.0.1:8080" : baseUrlFromEnv;

            this.processEngineRestApiUrl = baseUrl;
        }

        private async Task DeployTestBpmnFilesAsync(FileInfo bpmnFile)
        {
            try
            {
                var bpmnFileContent = File.ReadAllText(bpmnFile.FullName);
                using (HttpClient client = CreateHttpClient())
                {
                    var importPayload = new {
                        xml = bpmnFileContent,
                        overwriteExisting = true
                    };

                    var response = await client.PostAsync("api/deployment/v1", importPayload);

                    if (response.StatusCode != HttpStatusCode.OK)
                    {
                        throw new Exception($"Process Engine Rest API returned status {response.StatusCode}.");
                    }
                }
            }
            catch (Exception unknownException)
            {
                throw new Exception($"Cannot deploy BPMN files for base URL '{this.processEngineRestApiUrl}'. See inner exception for details.", unknownException);
            }
        }

        private HttpClient CreateHttpClient()
        {
            var result = new HttpClient();

            result.DefaultRequestHeaders.Accept.Clear();
            result.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            result.BaseAddress = new Uri(this.processEngineRestApiUrl);

            return result;
        }

        public void Dispose()
        {
            this.ConsumerAPIClient.Dispose();
        }
    }
}