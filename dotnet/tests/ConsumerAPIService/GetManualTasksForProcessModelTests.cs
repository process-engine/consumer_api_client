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
    public class GetManualTasksForProcessModelTests : ProcessEngineBaseTest
    {
        private readonly ConsumerAPIFixture fixture;

        public GetManualTasksForProcessModelTests(ConsumerAPIFixture fixture)
        {
            this.fixture = fixture;
        }

        [Fact]
        public async Task BPMN_GetManualTasksForProcessModel_ShouldFetchManualTaskList()
        {
            string processModelId = "test_consumer_api_manualtask";
            var identity = DummyIdentity.Create();

            ProcessStartResponsePayload processInstance = await this.fixture.ConsumerAPIClient.StartProcessInstance(
                identity,
                processModelId,
                "StartEvent_1",
                new ProcessStartRequestPayload<object>(),
                StartCallbackType.CallbackOnProcessInstanceCreated);

            // Give the process engine time to reach the user task
            await Task.Delay(1000);

            ManualTaskList manualTasks = await this.fixture.ConsumerAPIClient.GetManualTasksForProcessModel(
                identity,
                processModelId);

            Assert.NotEmpty(manualTasks.ManualTasks);
        }

    }
}
