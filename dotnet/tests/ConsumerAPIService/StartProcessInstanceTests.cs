namespace ProcessEngine.ConsumerAPI.Client.Tests
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading.Tasks;

    using Xunit;

    using ProcessEngine.ConsumerAPI.Contracts;

    [Collection("ConsumerAPI collection")]
    public class StartProcessInstanceTests
    {
        private readonly ConsumerAPIFixture fixture;

        public StartProcessInstanceTests(ConsumerAPIFixture fixture)
        {
            this.fixture = fixture;
        }

        [Fact]
        public void StartProcessInstance_EmptyParameters_ShouldThrowException()
        {
            var ex = Assert.ThrowsAsync<ArgumentNullException>(async () => await this.fixture.ConsumerAPIClient.StartProcessInstance<ProcessStartRequestPayload, ProcessStartResponsePayload>(
                "",
                "",
                "",
                new ProcessStartRequestPayload()));
        }

        [Fact]
        public void StartProcessInstance_ProcessModelNotFound_ShouldThrowException()
        {
            var ex = Assert.ThrowsAsync<Exception>(async () => await this.fixture.ConsumerAPIClient.StartProcessInstance<ProcessStartRequestPayload, ProcessStartResponsePayload>(
                "",
                "Test",
                "",
                new ProcessStartRequestPayload()));
        }

        // ----------------------------------------------------------------------------------------------------
        // The next tests use: bpmn/test_start_process.bpmn
        // 
        // Simple process with just one start event and one end event
        // ----------------------------------------------------------------------------------------------------

        [Fact]
        public async Task BPMN_StartProcessInstance_ShouldCreateAndFinishProcess()
        {
            string processModelId = "test_start_process";

            ProcessStartResponsePayload processInstance = await this.fixture.ConsumerAPIClient.StartProcessInstance<ProcessStartRequestPayload, ProcessStartResponsePayload>(
                "",
                processModelId,
                "",
                new ProcessStartRequestPayload());

            IEnumerable<IProcessInstance> processes = await GetFinishedProcesses(processModelId);

            Assert.Single(processes, p => p.ProcessInstanceId.Equals(processInstance.ProcessInstanceId));
        }

        [Fact]
        public async Task BPMN_StartProcessInstance_ShouldCreateProcessWithDistinctCorrelationId()
        {
            string processModelId = "test_start_process";
            string correlationId = "CorrelationId_1";

            var requestPayload = new ProcessStartRequestPayload
            {
                CorrelationId = correlationId
            };

            ProcessStartResponsePayload processInstance = await this.fixture.ConsumerAPIClient.StartProcessInstance<ProcessStartRequestPayload, ProcessStartResponsePayload>(
                "",
                processModelId,
                "",
                requestPayload);

            IEnumerable<IProcessInstance> processes = await GetFinishedProcesses(processModelId);

            Assert.Single(processes, p => p.CorrelationId.Equals(correlationId) && p.ProcessInstanceId.Equals(processInstance.ProcessInstanceId));
        }

        [Fact]
        public async Task BPMN_StartProcessInstance_ShouldCreateCorrelationIdIfNoneProvided()
        {
            string processModelId = "test_start_process";

            // No correlation id provided
            var requestPayload = new ProcessStartRequestPayload();

            ProcessStartResponsePayload processInstance = await this.fixture.ConsumerAPIClient.StartProcessInstance<ProcessStartRequestPayload, ProcessStartResponsePayload>(
                "",
                processModelId,
                "",
                requestPayload);

            IEnumerable<IProcessInstance> processes = await GetFinishedProcesses(processModelId);

            Assert.Single(processes, p => p.ProcessInstanceId.Equals(processInstance.ProcessInstanceId) && !string.IsNullOrEmpty(p.CorrelationId));
        }
    }
}