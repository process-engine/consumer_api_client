namespace ProcessEngine.ConsumerAPI.Client.Tests
{
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Threading.Tasks;
    using System;
    using System.Threading;

    using EssentialProjects.IAM.Contracts;

    using ProcessEngine.ConsumerAPI.Client.Tests.xUnit;
    using ProcessEngine.ConsumerAPI.Contracts.DataModel;
    using ProcessEngine.ConsumerAPI.Contracts;

    using Xunit;

    [Collection("ConsumerAPI collection")]
    public class FinishManualTaskTests : ProcessEngineBaseTest
    {
        private readonly ConsumerAPIFixture fixture;

        public FinishManualTaskTests(ConsumerAPIFixture fixture)
        {
            this.fixture = fixture;
        }

        [Fact]
        public void FinishManualTask_EmptyParameters_ShouldThrowException()
        {
            var ex = Assert.ThrowsAsync<ArgumentNullException>(async () => await this
                .fixture
                .ConsumerAPIClient
                .FinishManualTask(this.fixture.DefaultIdentity, "", "", "")
            );
        }

        [Fact]
        public void FinishManualTask_ProcessInstanceNotFound_ShouldThrowException()
        {
            var ex = Assert.ThrowsAsync<Exception>(async () => await this
                .fixture
                .ConsumerAPIClient
                .FinishManualTask( this.fixture.DefaultIdentity, "abc", "", "")
            );
        }

        [Fact]
        public async Task BPMN_FinishManualTask_ShouldFinishManualTask()
        {
            var processModelId = "test_consumer_api_manualtask";
            var identity = this.fixture.DefaultIdentity;
            var payload = new ProcessStartRequestPayload<object>();
            var callbackType = StartCallbackType.CallbackOnProcessInstanceCreated;

            ProcessStartResponsePayload processInstance = await this
                .fixture
                .ConsumerAPIClient
                .StartProcessInstance(identity, processModelId, "StartEvent_1", payload, callbackType);

            // Give the ProcessEngine time to reach the ManualTask
            await Task.Delay(1000);

            ManualTaskList manualTasks = await this
                .fixture
                .ConsumerAPIClient
                .GetManualTasksForCorrelation(identity, processInstance.CorrelationId);

            Assert.NotEmpty(manualTasks.ManualTasks);

            var manualTaskToBeFinished = manualTasks.ManualTasks.ElementAt(0);

            await this
                .fixture
                .ConsumerAPIClient
                .FinishManualTask(
                    identity,
                    processInstance.ProcessInstanceId,
                    processInstance.CorrelationId,
                    manualTaskToBeFinished.FlowNodeInstanceId
                );
        }

    }
}
