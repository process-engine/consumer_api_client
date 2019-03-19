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
            string processModelId = "test_consumer_api_usertask";
            var identity = DummyIdentity.Create();
            var callbackExecuted = false;

            this.fixture.ConsumerAPIClient.OnUserTaskForIdentityWaiting(identity, (UserTaskReachedMessage userTaskWaitingMessage) =>
            {
                callbackExecuted = true;
            }, true);

            ProcessStartResponsePayload processInstance = await this.fixture.ConsumerAPIClient.StartProcessInstance(
                identity,
                processModelId,
                "StartEvent_1",
                new ProcessStartRequestPayload<object>(),
                StartCallbackType.CallbackOnProcessInstanceCreated);

            // Give the process engine time to reach the user task
            await Task.Delay(1000);

            UserTaskList userTasks = await this.fixture.ConsumerAPIClient.GetWaitingUserTasksByIdentity(
                identity);

            Assert.NotEmpty(userTasks.UserTasks);
            Assert.Equal(callbackExecuted, true);
        }

        [Fact]
        public async Task BPMN_OnUserTaskForIdentityWaiting_ShouldNotExecuteCallbackForOtherIdentity()
        {
            string processModelId = "test_consumer_api_usertask";
            var identity = DummyIdentity.Create();
            var wrongIdentity = DummyIdentity.CreateFake("wrong");
            var callbackExecuted = false;

            this.fixture.ConsumerAPIClient.OnUserTaskForIdentityWaiting(wrongIdentity, (UserTaskReachedMessage userTaskWaitingMessage) =>
            {
                callbackExecuted = true;
            }, true);

            ProcessStartResponsePayload processInstance = await this.fixture.ConsumerAPIClient.StartProcessInstance(
                identity,
                processModelId,
                "StartEvent_1",
                new ProcessStartRequestPayload<object>(),
                StartCallbackType.CallbackOnProcessInstanceCreated);

            // Give the process engine time to reach the user task
            await Task.Delay(1000);

            UserTaskList userTasks = await this.fixture.ConsumerAPIClient.GetWaitingUserTasksByIdentity(
                identity);

            Assert.NotEmpty(userTasks.UserTasks);
            Assert.Equal(callbackExecuted, false);
        }

    }
}
