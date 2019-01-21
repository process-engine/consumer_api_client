﻿namespace ProcessEngine.ConsumerAPI.Client
{
  using System;
  using ProcessEngine.ConsumerAPI.Contracts;
  using EssentialProjects.IAM.Contracts;
  using Quobject.SocketIoClientDotNet.Client;
  using System.Net.Http;
  using System.Net.Http.Headers;
  using System.Threading.Tasks;
  using Newtonsoft.Json;
  using System.Collections.Generic;
  using System.Text;

  public class ConsumerApiClientService : IConsumerAPI
  {

    public ConsumerApiClientServiceConfiguration Configuration { get; set; }

    public async Task<ProcessStartResponsePayload> StartProcessInstance(
          IIdentity identity,
          string processModelId,
          string startEventKey,
          object payload,
          StartCallbackType callbackType = StartCallbackType.CallbackOnProcessInstanceCreated,
          string endEventKey = "")
    {

      if (identity == null) {
        throw new ArgumentNullException(nameof(identity));
      }

      var noStartEventIdProvided = String.IsNullOrEmpty(startEventKey);

      if (noStartEventIdProvided)
      {
        throw new ArgumentNullException(nameof(startEventKey));
      }

      var noEndEventIdProvided = callbackType == StartCallbackType.CallbackOnEndEventReached
        && String.IsNullOrEmpty(endEventKey);

      if (noEndEventIdProvided)
      {
        throw new ArgumentNullException(nameof(endEventKey));
      }

      var url = $"/api/consumer/v1/process_models/{processModelId}/start_events/{startEventKey}/start";

      var attachEndEventId = callbackType == StartCallbackType.CallbackOnEndEventReached;

      if (attachEndEventId)
      {
        url = $"{url}?end_event_id={endEventKey}";
      }

      var jsonResult = "";

      using(var client = _createHttpClient(identity))
      {
        var jsonPayload = JsonConvert.SerializeObject(payload);
        var result = await client.PostAsync(url, new StringContent(jsonPayload, Encoding.UTF8, "application/json"));

        if (result.IsSuccessStatusCode)
        {
          jsonResult = await result.Content.ReadAsStringAsync();
          var parsedResult = JsonConvert.DeserializeObject<ProcessStartResponsePayload>(jsonResult);
          return parsedResult;
        }

        throw new Exception("Process could not be started.");
      }
    }

    public async Task<IEnumerable<CorrelationResult<TPayload>>> GetProcessResultForCorrelation<TPayload>(
      IIdentity identity,
      string correlationId,
      string processModelId)
          where TPayload : new()
    {
      var url = $"/correlations/{correlationId}/process_models/${processModelId}/results";

      var jsonResult = "";

      using(var client = _createHttpClient(identity))
      {
        var result = await client.GetAsync(url);

        if (result.IsSuccessStatusCode)
        {
          jsonResult = await result.Content.ReadAsStringAsync();
          var parsedResult = JsonConvert.DeserializeObject<IEnumerable<CorrelationResult<TPayload>>>(jsonResult);
          return parsedResult;
        }
      }

      return null;
    }

    public void Dispose()
    {

    }

    private HttpClient _createHttpClient(IIdentity identity)
    {
      var client = new HttpClient(new HttpClientHandler()
      {
        UseDefaultCredentials = true
      });
      client.BaseAddress = new Uri(this.Configuration.BaseUrl);

      client.DefaultRequestHeaders.Accept.Clear();
      client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

      var token = identity.token;

      if (token == null)
      {
        // throw new UnauthorizedAccessException();
        token = Convert.ToBase64String(Encoding.UTF8.GetBytes("dummy_token"));
      }

      client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", identity.token);

      return client;
    }
  }
}
