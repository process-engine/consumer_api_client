namespace ProcessEngine.ConsumerAPI.Client.Tests
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading.Tasks;

    using Xunit;

    using EssentialProjects.IAM.Contracts;
    using ProcessEngine.ConsumerAPI.Contracts;
    using ProcessEngine.ConsumerAPI.Client.Tests.xUnit;
  using System.Text;

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
            var ex = Assert.ThrowsAsync<ArgumentNullException>(async () => await this.fixture.ConsumerAPIClient.StartProcessInstance(
                GetDummyIdentity(),
                "",
                "Test",
                new ProcessStartRequestPayload()));
        }

        [Fact]
        public void StartProcessInstance_ProcessModelNotFound_ShouldThrowException()
        {
            var ex = Assert.ThrowsAsync<Exception>(async () => await this.fixture.ConsumerAPIClient.StartProcessInstance(
                GetDummyIdentity(),
                "Test",
                "Test",
                new ProcessStartRequestPayload()));
        }

        [Fact]
        public async Task BPMN_StartProcessInstance_ShouldCreateAndFinishProcess()
        {
            string processModelId = "test_start_process";

            ProcessStartResponsePayload processInstance = await this.fixture.ConsumerAPIClient.StartProcessInstance(
                GetDummyIdentity(),
                processModelId,
                "StartEvent_1",
                new ProcessStartRequestPayload(),
                StartCallbackType.CallbackOnEndEventReached,
                "EndEvent_1");
        }

        [Fact]
        public async Task BPMN_StartProcessInstance_ShouldCreateProcessWithDistinctCorrelationId()
        {
            string processModelId = "test_start_process";
            string correlationId = "CorrelationId_1";

            var requestPayload = new ProcessStartRequestPayload
            {
                correlationId = correlationId
            };

            ProcessStartResponsePayload processStartResponsePayload = await this.fixture.ConsumerAPIClient.StartProcessInstance(
                GetDummyIdentity(),
                processModelId,
                "StartEvent_1",
                requestPayload);

            Assert.Equal(processStartResponsePayload.correlationId, correlationId);
        }

        [Fact]
        public async Task BPMN_StartProcessInstance_ShouldCreateCorrelationIdIfNoneProvided()
        {
            string processModelId = "test_start_process";

            var requestPayload = new ProcessStartRequestPayload();

            ProcessStartResponsePayload processStartResponsePayload = await this.fixture.ConsumerAPIClient.StartProcessInstance(
                GetDummyIdentity(),
                processModelId,
                "StartEvent_1",
                requestPayload);

            Assert.NotEmpty(processStartResponsePayload.correlationId);
        }
    }
}