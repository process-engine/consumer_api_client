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
    public class OnUserTaskForIdentityFinishedTests : ProcessEngineBaseTest
    {
        private readonly ConsumerAPIFixture fixture;

        public OnUserTaskForIdentityFinishedTests(ConsumerAPIFixture fixture)
        {
            this.fixture = fixture;
        }

        [Fact]
        public async Task BPMN_OnUserTaskForIdentityFinished_ShouldExecuteCallbackOnEvent()
        {
            var processModelId = "test_consumer_api_usertask";
            var payload = new ProcessStartRequestPayload<object>();
            var callbackType = StartCallbackType.CallbackOnProcessInstanceCreated;

            var notificationReceived = false;

            var notificationHandler = (UserTaskFinishedMessage userTaskFinishedMessage) =>
            {
                notificationReceived = true;
            };

            this.fixture.ConsumerAPIClient.OnUserTaskForIdentityFinished(this.fixture.DefaultIdentity, notificationHandler, true);

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

            var userTask = userTasks.UserTasks.ToArray()[0];
            var userTaskResult = new UserTaskResult();
            userTaskResult.FormFields.Add("test", "value");

            await this.fixture.ConsumerAPIClient.FinishUserTask(this.fixture.DefaultIdentity,
                                                                processInstance.ProcessInstanceId,
                                                                processInstance.CorrelationId,
                                                                userTask.FlowNodeInstanceId,
                                                                userTaskResult);

            await Task.Delay(2000);

            Assert.NotEmpty(userTasks.UserTasks);
            Assert.Equal(notificationReceived, true);
        }

        [Fact]
        public async Task BPMN_OnUserTaskForIdentityFinished_ShouldNotExecuteCallbackForOtherIdentity()
        {
            var processModelId = "test_consumer_api_usertask";
            var payload = new ProcessStartRequestPayload<object>();
            var callbackType = StartCallbackType.CallbackOnProcessInstanceCreated;

            var notificationReceived = false;

            var notificationHandler = (UserTaskFinishedMessage userTaskFinishedMessage) =>
            {
                notificationReceived = true;
            };

            this.fixture.ConsumerAPIClient.OnUserTaskForIdentityFinished(this.fixture.DefaultIdentity, notificationHandler, true);

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

            var userTask = userTasks.UserTasks.ToArray()[0];
            var userTaskResult = new UserTaskResult();
            userTaskResult.FormFields.Add("test", "value");

            await this.fixture.ConsumerAPIClient.FinishUserTask(this.fixture.DefaultIdentity,
                                                                processInstance.ProcessInstanceId,
                                                                processInstance.CorrelationId,
                                                                userTask.FlowNodeInstanceId,
                                                                userTaskResult);

            await Task.Delay(2000);

            Assert.NotEmpty(userTasks.UserTasks);
            Assert.Equal(notificationReceived, false);
        }
    }
}
