namespace ProcessEngine.ConsumerAPI.Client
{
  using System;
  using System.Collections.Generic;
  using System.Net.Http;
  using System.Net.Http.Headers;
  using System.Text;
  using System.Threading.Tasks;

  using Newtonsoft.Json;
  using Newtonsoft.Json.Serialization;

  using ProcessEngine.ConsumerAPI.Contracts;
  using ProcessEngine.ConsumerAPI.Contracts.RestSettings;
  using EssentialProjects.IAM.Contracts;

  public class ConsumerApiClientService : IConsumerAPI
  {

    private ConsumerApiClientServiceConfiguration Configuration { get; set; }

    public ConsumerApiClientService(ConsumerApiClientServiceConfiguration configuration)
    {
        this.Configuration = configuration;
    }

    public async Task<ProcessStartResponsePayload> StartProcessInstance<TInputValues>(
          IIdentity identity,
          string processModelId,
          string startEventKey,
          ProcessStartRequestPayload<TInputValues> processStartRequestPayload,
          StartCallbackType callbackType = StartCallbackType.CallbackOnProcessInstanceCreated,
          string endEventKey = "")
          where TInputValues : new()
    {

      if (identity == null) {
        throw new UnauthorizedAccessException(nameof(identity));
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

      var url = Paths.StartProcessInstance
        .Replace(Params.ProcessModelId, processModelId)
        .Replace(Params.StartEventId, startEventKey);

      url = $"{Endpoints.ConsumerAPI}/{url}?start_callback_type={(int)callbackType}";

      var attachEndEventId = callbackType == StartCallbackType.CallbackOnEndEventReached;

      if (attachEndEventId)
      {
        url = $"{url}&end_event_id={endEventKey}";
      }

      var jsonResult = "";

      using(var client = CreateHttpClient(identity))
      {
        var jsonPayload = SerializeForProcessEngine(processStartRequestPayload);
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
      var url = Paths.GetProcessResultForCorrelation
        .Replace(Params.CorrelationId, correlationId)
        .Replace(Params.ProcessModelId, processModelId);

      url = $"{Endpoints.ConsumerAPI}/{url}";
      
      var jsonResult = "";

      IEnumerable<CorrelationResult<TPayload>> parsedResult = null;

      using(var client = CreateHttpClient(identity))
      {
        var result = await client.GetAsync(url);

        if (result.IsSuccessStatusCode)
        {
          jsonResult = await result.Content.ReadAsStringAsync();
          parsedResult = JsonConvert.DeserializeObject<IEnumerable<CorrelationResult<TPayload>>>(jsonResult);
        }
      }

      return parsedResult;
    }

    public void Dispose()
    {

    }

    private string SerializeForProcessEngine(object payload)
    {
        var contractResolver = new DefaultContractResolver
        {
            NamingStrategy = new CamelCaseNamingStrategy()
        };
        var serializerSettings = new JsonSerializerSettings
        {
            ContractResolver = contractResolver,
            Formatting = Formatting.None
        };
        var jsonPayload = JsonConvert.SerializeObject(payload, serializerSettings);
        return jsonPayload;
    }

    private HttpClient CreateHttpClient(IIdentity identity)
    {
        var client = new HttpClient(new HttpClientHandler()
        {
            UseDefaultCredentials = true
        });
        client.BaseAddress = new Uri(this.Configuration.BaseUrl);

        client.DefaultRequestHeaders.Accept.Clear();
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var hasNoIdentity = identity == null || identity.token == null;
        if (hasNoIdentity)
        {
            throw new UnauthorizedAccessException();
        }

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", identity.token);

        return client;
    }
  }
}
