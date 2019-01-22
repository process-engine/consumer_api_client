namespace ProcessEngine.ConsumerAPI.Client.Tests
{
  using System;
  using System.Collections.Generic;
  using System.Net.Http;
  using System.Net.Http.Headers;
  using System.Text;
  using System.Threading.Tasks;
  using EssentialProjects.IAM.Contracts;
  using Newtonsoft.Json;
  using ProcessEngine.ConsumerAPI.Contracts;

  public class ProcessEngineBaseTest
    {        
        
        private string processEngineRestApiUrl;

        public ProcessEngineBaseTest()
        {
            SetProcessEngineRestApiUrl();
        }

        private void SetProcessEngineRestApiUrl()
        {
            string baseUrlFromEnv = Environment.GetEnvironmentVariable("PROCESS_ENGINE_REST_API_URL");
            string baseUrl = string.IsNullOrEmpty(baseUrlFromEnv) ? "http://localhost:8080" : baseUrlFromEnv;

            this.processEngineRestApiUrl = $"{baseUrl}/engine-rest/";
        }

        protected IIdentity GetDummyIdentity() {
          return new Identity() { token = Convert.ToBase64String(Encoding.UTF8.GetBytes("dummy_token"))};
        }

    }


}