namespace ProcessEngine.ConsumerAPI.Client
{
  using System;
  using System.Net.Http;
  using System.Net.Http.Headers;

  using EssentialProjects.IAM.Contracts;

    public static class ProcessEngineHttpClientFactory {

        public static HttpClient CreateHttpClient (IIdentity identity, string baseUrl) {
            var client = new HttpClient (new HttpClientHandler () {
                UseDefaultCredentials = true
            });
            client.BaseAddress = new Uri(baseUrl);

            client.DefaultRequestHeaders.Accept.Clear ();
            client.DefaultRequestHeaders.Accept.Add (new MediaTypeWithQualityHeaderValue ("application/json"));

            var hasNoIdentity = identity == null || identity.Token == null;
            if (hasNoIdentity) {
                throw new UnauthorizedAccessException ();
            }

            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue ("Bearer", identity.Token);

            return client;
        }
    }
}
