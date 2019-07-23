namespace ProcessEngine.ConsumerAPI.Client.Tests
{
  using System.Threading.Tasks;
  using System;

  using ProcessEngine.ConsumerAPI.Client.Tests.xUnit;

  using Xunit;
  using ProcessEngine.ConsumerAPI.Contracts.DataModel;

  [Collection("ConsumerAPI collection")]
    public class StartProcessInstanceTests : ProcessEngineBaseTest
    {
        private readonly ConsumerAPIFixture fixture;

        public StartProcessInstanceTests(ConsumerAPIFixture fixture)
        {
            this.fixture = fixture;
        }

        [Fact]
        public void StartProcessInstance_EmptyParameters_ShouldThrowException()
        {
            var payload = new ProcessStartRequestPayload<object>();

            Assert.ThrowsAsync<ArgumentNullException>(async () => await this
                .fixture
                .ConsumerAPIClient
                .StartProcessInstance(this.fixture.DefaultIdentity, "", "Test", payload));
        }

        [Fact]
        public void StartProcessInstance_ProcessModelNotFound_ShouldThrowException()
        {
            var payload = new ProcessStartRequestPayload<object>();

            Assert.ThrowsAsync<Exception>(async () => await this
                .fixture
                .ConsumerAPIClient
                .StartProcessInstance(this.fixture.DefaultIdentity, "Test", "Test", payload));
        }

        [Fact]
        public async Task BPMN_StartProcessInstance_ShouldCreateAndFinishProcess()
        {
            var processModelId = "test_start_process";
            var payload = new ProcessStartRequestPayload<object>();
            var callbackType = StartCallbackType.CallbackOnEndEventReached;

            ProcessStartResponsePayload processInstance = await this
                .fixture
                .ConsumerAPIClient
                .StartProcessInstance(this.fixture.DefaultIdentity, processModelId, "StartEvent_1", payload, callbackType, "EndEvent_1");
        }

        [Fact]
        public async Task BPMN_StartProcessInstance_ShouldCreateProcessWithDistinctCorrelationId()
        {
            var processModelId = "test_start_process";
            var correlationId = "CorrelationId_1";
            var payload = new ProcessStartRequestPayload<object>
            {
                CorrelationId = correlationId
            };

            ProcessStartResponsePayload processStartResponsePayload = await this
                .fixture
                .ConsumerAPIClient
                .StartProcessInstance(this.fixture.DefaultIdentity, processModelId, "StartEvent_1", payload);

            Assert.Equal(processStartResponsePayload.CorrelationId, correlationId);
        }

        [Fact]
        public async Task BPMN_StartProcessInstance_ShouldCreateCorrelationIdIfNoneProvided()
        {
            var processModelId = "test_start_process";
            var payload = new ProcessStartRequestPayload<object>();

            ProcessStartResponsePayload processStartResponsePayload = await this
                .fixture
                .ConsumerAPIClient
                .StartProcessInstance(this.fixture.DefaultIdentity, processModelId, "StartEvent_1", payload);

            Assert.NotEmpty(processStartResponsePayload.CorrelationId);
        }
    }
}
