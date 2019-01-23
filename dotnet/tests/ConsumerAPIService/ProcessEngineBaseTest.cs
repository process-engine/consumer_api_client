namespace ProcessEngine.ConsumerAPI.Client.Tests {
    using System.Collections.Generic;
    using System.Net.Http.Headers;
    using System.Net.Http;
    using System.Text;
    using System.Threading.Tasks;
    using System;

    using EssentialProjects.IAM.Contracts;

    using ProcessEngine.ConsumerAPI.Contracts;

    using Newtonsoft.Json;

    public class ProcessEngineBaseTest {
        private string processEngineRestApiUrl;

        public ProcessEngineBaseTest() {
            SetProcessEngineRestApiUrl();
        }

        private void SetProcessEngineRestApiUrl() {
            string baseUrlFromEnv = Environment.GetEnvironmentVariable("PROCESS_ENGINE_REST_API_URL");
            string baseUrl = string.IsNullOrEmpty(baseUrlFromEnv) ? "http://localhost:8080" : baseUrlFromEnv;

            this.processEngineRestApiUrl = $"{baseUrl}";
        }
    }
}
