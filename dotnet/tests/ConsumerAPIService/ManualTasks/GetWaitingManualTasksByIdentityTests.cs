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
    public class GetWaitingManualTasksByIdentityTests : ProcessEngineBaseTest
    {
        private readonly ConsumerAPIFixture fixture;

        public GetWaitingManualTasksByIdentityTests(ConsumerAPIFixture fixture)
        {
            this.fixture = fixture;
        }

        [Fact]
        public async Task BPMN_GetWaitingManualTasksByIdentity_ShouldFetchManualTaskList()
        {
            var processModelId = "test_consumer_api_manualtask";
            var payload = new ProcessStartRequestPayload<object>();
            var callbackType = StartCallbackType.CallbackOnProcessInstanceCreated;

            ProcessStartResponsePayload processInstance = await this
                .fixture
                .ConsumerAPIClient
                .StartProcessInstance(this.fixture.DefaultIdentity, processModelId, "StartEvent_1", payload, callbackType);

            // Give the process engine time to reach the user task
            await Task.Delay(2000);

            ManualTaskList manualTasks = await this.fixture.ConsumerAPIClient.GetWaitingManualTasksByIdentity(this.fixture.DefaultIdentity);

            Assert.NotEmpty(manualTasks.ManualTasks);
        }

    }
}
