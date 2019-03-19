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
    public class OnUserTaskFinishedTests : ProcessEngineBaseTest
    {
        private readonly ConsumerAPIFixture fixture;

        public OnUserTaskFinishedTests(ConsumerAPIFixture fixture)
        {
            this.fixture = fixture;
        }

        [Fact]
        public async Task BPMN_OnUserTaskFinished_ShouldExecuteCallbackOnEvent()
        {
            string processModelId = "test_consumer_api_usertask";
            var identity = DummyIdentity.Create();
            var callbackExecuted = false;

            this.fixture.ConsumerAPIClient.OnUserTaskFinished(identity, (UserTaskFinishedMessage userTaskFinishedMessage) =>
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

            UserTaskList userTasks = await this.fixture.ConsumerAPIClient.GetUserTasksForCorrelation(
                identity,
                processInstance.CorrelationId);

            var userTask = userTasks.UserTasks.ToArray()[0];
            var userTaskResult = new UserTaskResult();
            userTaskResult.FormFields.Add("test", "value");

            await this.fixture.ConsumerAPIClient.FinishUserTask(identity,
                                                                processInstance.ProcessInstanceId,
                                                                processInstance.CorrelationId,
                                                                userTask.FlowNodeInstanceId,
                                                                userTaskResult);

            await Task.Delay(1000);

            Assert.NotEmpty(userTasks.UserTasks);
            Assert.Equal(callbackExecuted, true);
        }
    }
}
