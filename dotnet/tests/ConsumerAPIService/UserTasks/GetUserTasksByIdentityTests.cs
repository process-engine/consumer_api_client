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
    public class GetWaitingUserTasksByIdentityTests : ProcessEngineBaseTest
    {
        private readonly ConsumerAPIFixture fixture;

        public GetWaitingUserTasksByIdentityTests(ConsumerAPIFixture fixture)
        {
            this.fixture = fixture;
        }

        [Fact]
        public async Task BPMN_GetWaitingUserTasksByIdentity_ShouldFetchUserTaskList()
        {
            var processModelId = "test_consumer_api_usertask";
            var payload = new ProcessStartRequestPayload<object>();
            var callbackType = StartCallbackType.CallbackOnProcessInstanceCreated;

            ProcessStartResponsePayload processInstance = await this
                .fixture
                .ConsumerAPIClient
                .StartProcessInstance(this.fixture.DefaultIdentity, processModelId, "StartEvent_1", payload, callbackType);

            // Give the ProcessEngine time to reach the UserTask
            await Task.Delay(2000);

            UserTaskList userTasks = await this.fixture.ConsumerAPIClient.GetWaitingUserTasksByIdentity(this.fixture.DefaultIdentity);

            Assert.NotEmpty(userTasks.UserTasks);
        }

    }
}
