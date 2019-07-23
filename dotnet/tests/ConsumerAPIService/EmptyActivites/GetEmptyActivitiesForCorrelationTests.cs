namespace ProcessEngine.ConsumerAPI.Client.Tests
{
  using System.Threading.Tasks;
  using System;

  using ProcessEngine.ConsumerAPI.Client.Tests.xUnit;
  using ProcessEngine.ConsumerAPI.Contracts.DataModel;

  using Xunit;

  [Collection("ConsumerAPI collection")]
    public class GetEmptyActivitiesForCorrelationTests : ProcessEngineBaseTest
    {
        private readonly ConsumerAPIFixture fixture;

        public GetEmptyActivitiesForCorrelationTests(ConsumerAPIFixture fixture)
        {
            this.fixture = fixture;
        }

        [Fact]
        public void GetEmptyActivitiesForCorrelation_EmptyParameters_ShouldThrowException()
        {
            Assert.ThrowsAsync<ArgumentNullException>(async () => await this
                .fixture
                .ConsumerAPIClient
                .GetEmptyActivitiesForCorrelation(this.fixture.DefaultIdentity, "")
            );
        }

        [Fact]
        public void GetEmptyActivitiesForCorrelation_ProcessModelNotFound_ShouldThrowException()
        {
            Assert.ThrowsAsync<Exception>(async () => await this
                .fixture
                .ConsumerAPIClient
                .GetEmptyActivitiesForCorrelation(this.fixture.DefaultIdentity, "Test"));
        }

        [Fact]
        public async Task BPMN_GetEmptyActivitiesForCorrelation_ShouldFetchEmptyActivityList()
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
                .GetEmptyActivitiesForCorrelation(this.fixture.DefaultIdentity, processInstance.CorrelationId);

            Assert.NotEmpty(emptyActivities.EmptyActivities);
        }
    }
}
