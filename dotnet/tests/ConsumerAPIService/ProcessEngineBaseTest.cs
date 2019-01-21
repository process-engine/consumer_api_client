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

        protected Task<IEnumerable<ProcessInstance>> GetFinishedProcesses(string bla) {
          return GetProcesses("/process_instances/own");
        }
        
        private async Task<IEnumerable<ProcessInstance>> GetProcesses(string uri)
        {
            try
            {
                string stringContent = await GetHttpGetResponseFromProcessEngine(uri);

                return JsonConvert.DeserializeObject<IEnumerable<ProcessInstance>>(stringContent);
            }
            catch (Exception unknownException)
            {
                throw new Exception($"Could not get processes. See inner exception for details.", unknownException);
            }
        }  
        
        protected async Task<string> GetHttpGetResponseFromProcessEngine(string uri)
        {
            HttpClient httpClient = CreateHttpClient(this.processEngineRestApiUrl);
            HttpResponseMessage response = await httpClient.GetAsync(uri);

            string stringContent = await response.Content.ReadAsStringAsync();

            return stringContent;
        }
        
        protected IIdentity GetDummyIdentity() {
          return new Identity() { token = Convert.ToBase64String(Encoding.UTF8.GetBytes("dummy_token"))};
        }

        protected HttpClient CreateHttpClient(string processEngineAPIBaseUrl)
        {
            var result = new HttpClient();

            result.DefaultRequestHeaders.Accept.Clear();
            result.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            result.BaseAddress = new Uri(processEngineAPIBaseUrl);

            var token = Convert.ToBase64String(Encoding.UTF8.GetBytes("dummy_token"));

            result.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            return result;
        }

    }


}