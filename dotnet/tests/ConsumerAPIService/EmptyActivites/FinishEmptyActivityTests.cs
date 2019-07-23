namespace ProcessEngine.ConsumerAPI.Client.Tests
{
  using System.Linq;
  using System.Threading.Tasks;
  using System;

  using ProcessEngine.ConsumerAPI.Client.Tests.xUnit;
  using ProcessEngine.ConsumerAPI.Contracts.DataModel;

  using Xunit;

  [Collection("ConsumerAPI collection")]
    public class FinishEmptyActivityTests : ProcessEngineBaseTest
    {
        private readonly ConsumerAPIFixture fixture;

        public FinishEmptyActivityTests(ConsumerAPIFixture fixture)
        {
            this.fixture = fixture;
        }

        [Fact]
        public void FinishEmptyActivity_EmptyParameters_ShouldThrowException()
        {
            Assert.ThrowsAsync<ArgumentNullException>(async () => await this
                .fixture
                .ConsumerAPIClient
                .FinishEmptyActivity(this.fixture.DefaultIdentity, "", "", "")
            );
        }

        [Fact]
        public void FinishEmptyActivity_ProcessInstanceNotFound_ShouldThrowException()
        {
            Assert.ThrowsAsync<Exception>(async () => await this
                .fixture
                .ConsumerAPIClient
                .FinishEmptyActivity( this.fixture.DefaultIdentity, "abc", "", "")
            );
        }

        [Fact]
        public async Task BPMN_FinishEmptyActivity_ShouldFinishEmptyActivity()
        {
            var processModelId = "test_consumer_api_emptyactivity";
            var identity = this.fixture.DefaultIdentity;
            var payload = new ProcessStartRequestPayload<object>();
            var callbackType = StartCallbackType.CallbackOnProcessInstanceCreated;

            var processInstance = await this
                .fixture
                .ConsumerAPIClient
                .StartProcessInstance(identity, processModelId, "StartEvent_1", payload, callbackType);

            // Give the ProcessEngine time to reach the EmptyActivity
            await Task.Delay(1000);

            var emptyActivities = await this
                .fixture
                .ConsumerAPIClient
                .GetEmptyActivitiesForCorrelation(identity, processInstance.CorrelationId);

            Assert.NotEmpty(emptyActivities.EmptyActivities);

            var emptyActivityToBeFinished = emptyActivities.EmptyActivities.ElementAt(0);

            await this
                .fixture
                .ConsumerAPIClient
                .FinishEmptyActivity(
                    identity,
                    processInstance.ProcessInstanceId,
                    processInstance.CorrelationId,
                    emptyActivityToBeFinished.FlowNodeInstanceId
                );
        }

    }
}
