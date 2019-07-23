namespace ProcessEngine.ConsumerAPI.Client.Tests
{
  using System.Threading.Tasks;

  using ProcessEngine.ConsumerAPI.Client.Tests.xUnit;
  using ProcessEngine.ConsumerAPI.Contracts.DataModel;

  using Xunit;

  [Collection("ConsumerAPI collection")]
    public class GetEmptyActivitiesForProcessInstanceTests : ProcessEngineBaseTest
    {
        private readonly ConsumerAPIFixture fixture;

        public GetEmptyActivitiesForProcessInstanceTests(ConsumerAPIFixture fixture)
        {
            this.fixture = fixture;
        }

        [Fact]
        public async Task BPMN_GetEmptyActivitiesForProcessInstance_ShouldFetchEmptyActivityList()
        {
            var processModelId = "test_consumer_api_emptyactivity";
            var payload = new ProcessStartRequestPayload<object>();
            var callbackType = StartCallbackType.CallbackOnProcessInstanceCreated;

            var processInstance = await this
                .fixture
                .ConsumerAPIClient
                .StartProcessInstance(this.fixture.DefaultIdentity, processModelId, "StartEvent_1", payload, callbackType);

            // Give the ProcessEngine time to reach the EmptyActivity
            await Task.Delay(1000);

            var emptyActivities = await this
                .fixture
                .ConsumerAPIClient
                .GetEmptyActivitiesForProcessInstance(this.fixture.DefaultIdentity, processInstance.ProcessInstanceId);

            Assert.NotEmpty(emptyActivities.EmptyActivities);
        }

    }
}
