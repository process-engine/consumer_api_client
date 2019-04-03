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
    public class GetManualTasksForCorrelationTests : ProcessEngineBaseTest
    {
        private readonly ConsumerAPIFixture fixture;

        public GetManualTasksForCorrelationTests(ConsumerAPIFixture fixture)
        {
            this.fixture = fixture;
        }

        [Fact]
        public void GetManualTasksForCorrelation_EmptyParameters_ShouldThrowException()
        {
            Assert.ThrowsAsync<ArgumentNullException>(async () => await this
                .fixture
                .ConsumerAPIClient
                .GetManualTasksForCorrelation(this.fixture.DefaultIdentity, "")
            );
        }

        [Fact]
        public void GetManualTasksForCorrelation_ProcessModelNotFound_ShouldThrowException()
        {
            Assert.ThrowsAsync<Exception>(async () => await this
                .fixture
                .ConsumerAPIClient
                .GetManualTasksForCorrelation(this.fixture.DefaultIdentity, "Test"));
        }

        [Fact]
        public async Task BPMN_GetManualTasksForCorrelation_ShouldFetchManualTaskList()
        {
            var processModelId = "test_consumer_api_manualtask";
            var payload = new ProcessStartRequestPayload<object>();
            var callbackType = StartCallbackType.CallbackOnProcessInstanceCreated;

            ProcessStartResponsePayload processInstance = await this
                .fixture
                .ConsumerAPIClient
                .StartProcessInstance(this.fixture.DefaultIdentity, processModelId, "StartEvent_1", payload, callbackType);

            // Give the ProcessEngine time to reach the ManualTask
            await Task.Delay(1000);

            ManualTaskList manualTasks = await this
                .fixture
                .ConsumerAPIClient
                .GetManualTasksForCorrelation(this.fixture.DefaultIdentity, processInstance.CorrelationId);

            Assert.NotEmpty(manualTasks.ManualTasks);
        }
    }
}
