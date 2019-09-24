namespace ProcessEngine.ConsumerAPI.Client.Tests
{
  using System.Threading.Tasks;

  using ProcessEngine.ConsumerAPI.Client.Tests.xUnit;

  using Xunit;
  using ProcessEngine.ConsumerAPI.Contracts.DataModel;

  [Collection("ConsumerAPI collection")]
    public class GetProcessInstancesByIdentity : ProcessEngineBaseTest
    {
        private readonly ConsumerAPIFixture fixture;

        public GetProcessInstancesByIdentity(ConsumerAPIFixture fixture)
        {
            this.fixture = fixture;
        }

        [Fact]
        public async Task BPMN_GetProcessInstancesByIdentity_ShouldGetProcessInstances()
        {
            var processModelId = "test_consumer_api_correlation_result";
            var payload = new ProcessStartRequestPayload<object>();
            var callbackType = StartCallbackType.CallbackOnProcessInstanceFinished;

            var processInstance = await this
                .fixture
                .ConsumerAPIClient
                .StartProcessInstance(this.fixture.DefaultIdentity, processModelId, "StartEvent_1", payload, callbackType);

            var processInstances = await this
                .fixture
                .ConsumerAPIClient
                .GetProcessInstancesByIdentity(this.fixture.DefaultIdentity);

            Assert.NotNull(processInstances.ProcessInstances);
        }
    }
}
