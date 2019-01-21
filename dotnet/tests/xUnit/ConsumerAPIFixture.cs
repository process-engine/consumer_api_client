namespace ProcessEngine.ConsumerAPI.Client.Tests.xUnit
{
    using System;
    using System.IO;
    using System.Net;
    using System.Net.Http;
    using System.Net.Http.Headers;
    using System.Text;
    using System.Threading.Tasks;
    using EssentialProjects.IAM.Contracts;
    using Newtonsoft.Json;
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
            string baseUrl = string.IsNullOrEmpty(baseUrlFromEnv) ? "http://localhost:8000" : baseUrlFromEnv;

            this.processEngineRestApiUrl = baseUrl;
        }

        private async Task DeployTestBpmnFilesAsync(FileInfo bpmnFile)
        {
            try
            {
                var bpmnFileContent = File.ReadAllText(bpmnFile.FullName);
                using (HttpClient client = _createHttpClient(null))
                {
                    var importPayload = new {
                        name = bpmnFile.Name.Replace(bpmnFile.Extension, ""),
                        xml = bpmnFileContent,
                        overwriteExisting = true
                    };

                    var jsonImportPayload = JsonConvert.SerializeObject(importPayload);

                    var response = await client.PostAsync("api/deployment/v1/import_process_model", new StringContent(jsonImportPayload, Encoding.UTF8, "application/json"));

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

        private HttpClient _createHttpClient(IIdentity identity)
        {
            var client = new HttpClient(new HttpClientHandler()
            {
                UseDefaultCredentials = true
            });
            client.BaseAddress = new Uri(this.processEngineRestApiUrl);

            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));


            string token;

            if (identity == null)
            {
                // throw new UnauthorizedAccessException();
                token = Convert.ToBase64String(Encoding.UTF8.GetBytes("dummy_token"));
            } else 
            {
                token = identity.token;
            }

            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            return client;
        }

        public void Dispose()
        {
            this.ConsumerAPIClient.Dispose();
        }
    }
}