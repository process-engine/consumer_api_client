namespace ProcessEngine.ConsumerAPI.Client.Tests
{
  using System;

  public class ProcessEngineBaseTest
    {
        private string processEngineRestApiUrl;

        public ProcessEngineBaseTest()
        {
            SetProcessEngineRestApiUrl();
        }

        private void SetProcessEngineRestApiUrl()
        {
            var baseUrlFromEnv = Environment.GetEnvironmentVariable("PROCESS_ENGINE_REST_API_URL");
            var baseUrl = string.IsNullOrEmpty(baseUrlFromEnv) ? "http://localhost:8080" : baseUrlFromEnv;

            this.processEngineRestApiUrl = $"{baseUrl}";
        }
    }
}
