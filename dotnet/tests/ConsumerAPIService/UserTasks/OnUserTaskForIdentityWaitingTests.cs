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
    using ProcessEngine.ConsumerAPI.Contracts.Messages.SystemEvent;

    [Collection("ConsumerAPI collection")]
    public class OnUserTaskForIdentityWaitingTests : ProcessEngineBaseTest
    {
        private readonly ConsumerAPIFixture fixture;

        public OnUserTaskForIdentityWaitingTests(ConsumerAPIFixture fixture)
        {
            this.fixture = fixture;
        }

        [Fact]
        public async Task BPMN_OnUserTaskForIdentityWaiting_ShouldExecuteCallbackOnEvent()
        {
            var processModelId = "test_consumer_api_usertask";
            var payload = new ProcessStartRequestPayload<object>();
            var callbackType = StartCallbackType.CallbackOnProcessInstanceCreated;

            var notificationReceived = false;

            var notificationHandler = (UserTaskReachedMessage userTaskWaitingMessage) =>
            {
                notificationReceived = true;
            };

            this.fixture.ConsumerAPIClient.OnUserTaskForIdentityWaiting(this.fixture.DefaultIdentity, notificationHandler, true);


            var processInstance = await this
                .fixture
                .ConsumerAPIClient
                .StartProcessInstance(this.fixture.DefaultIdentity, processModelId, "StartEvent_1", payload, callbackType);

            // Give the process engine time to reach the user task
            await Task.Delay(1000);

            var userTasks = await this
                .fixture
                .ConsumerAPIClient
                .GetWaitingUserTasksByIdentity(this.fixture.DefaultIdentity);

            Assert.NotEmpty(userTasks.UserTasks);
            Assert.Equal(notificationReceived, true);
        }

        [Fact]
        public async Task BPMN_OnUserTaskForIdentityWaiting_ShouldNotExecuteCallbackForOtherIdentity()
        {
            var processModelId = "test_consumer_api_usertask";
            var payload = new ProcessStartRequestPayload<object>();
            var callbackType = StartCallbackType.CallbackOnProcessInstanceCreated;

            var notificationReceived = false;

            var notificationHandler = (UserTaskReachedMessage userTaskWaitingMessage) =>
            {
                notificationReceived = true;
            };

            this.fixture.ConsumerAPIClient.OnUserTaskForIdentityWaiting(this.fixture.DefaultIdentity, notificationHandler, true);

            var processInstance = await this
                .fixture
                .ConsumerAPIClient
                .StartProcessInstance(this.fixture.DefaultIdentity, processModelId, "StartEvent_1", payload, callbackType);

            // Give the process engine time to reach the user task
            await Task.Delay(1000);

            var userTasks = await this
                .fixture
                .ConsumerAPIClient
                .GetWaitingUserTasksByIdentity(this.fixture.DefaultIdentity);

            Assert.NotEmpty(userTasks.UserTasks);
            Assert.Equal(notificationReceived, false);
        }

    }
}
