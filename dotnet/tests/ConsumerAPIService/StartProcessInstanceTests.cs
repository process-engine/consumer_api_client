namespace ProcessEngine.ConsumerAPI.Client.Tests
{
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Threading.Tasks;
    using System;

    using EssentialProjects.IAM.Contracts;

    using ProcessEngine.ConsumerAPI.Client.Tests.xUnit;
    using ProcessEngine.ConsumerAPI.Contracts;

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
            var ex = Assert.ThrowsAsync<ArgumentNullException>(async () => await this.fixture.ConsumerAPIClient.StartProcessInstance(
                DummyIdentity.Create(),
                "",
                "Test",
                new ProcessStartRequestPayload<object>()));
        }

        [Fact]
        public void StartProcessInstance_ProcessModelNotFound_ShouldThrowException()
        {
            var ex = Assert.ThrowsAsync<Exception>(async () => await this.fixture.ConsumerAPIClient.StartProcessInstance(
                DummyIdentity.Create(),
                "Test",
                "Test",
                new ProcessStartRequestPayload<object>()));
        }

        [Fact]
        public async Task BPMN_StartProcessInstance_ShouldCreateAndFinishProcess()
        {
            string processModelId = "test_start_process";

            ProcessStartResponsePayload processInstance = await this.fixture.ConsumerAPIClient.StartProcessInstance(
                DummyIdentity.Create(),
                processModelId,
                "StartEvent_1",
                new ProcessStartRequestPayload<object>(),
                StartCallbackType.CallbackOnEndEventReached,
                "EndEvent_1");
        }

        [Fact]
        public async Task BPMN_StartProcessInstance_ShouldCreateProcessWithDistinctCorrelationId()
        {
            string processModelId = "test_start_process";
            string correlationId = "CorrelationId_1";

            var requestPayload = new ProcessStartRequestPayload<object>
            {
                CorrelationId = correlationId
            };

            ProcessStartResponsePayload processStartResponsePayload = await this.fixture.ConsumerAPIClient.StartProcessInstance(
                DummyIdentity.Create(),
                processModelId,
                "StartEvent_1",
                requestPayload);

            Assert.Equal(processStartResponsePayload.CorrelationId, correlationId);
        }

        [Fact]
        public async Task BPMN_StartProcessInstance_ShouldCreateCorrelationIdIfNoneProvided()
        {
            string processModelId = "test_start_process";

            var requestPayload = new ProcessStartRequestPayload<object>();

            ProcessStartResponsePayload processStartResponsePayload = await this.fixture.ConsumerAPIClient.StartProcessInstance(
                DummyIdentity.Create(),
                processModelId,
                "StartEvent_1",
                requestPayload);

            Assert.NotEmpty(processStartResponsePayload.CorrelationId);
        }
    }
}
