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
    public class FinishUserTaskTests : ProcessEngineBaseTest
    {
        private readonly ConsumerAPIFixture fixture;

        public FinishUserTaskTests(ConsumerAPIFixture fixture)
        {
            this.fixture = fixture;
        }

        [Fact]
        public void FinishUserTask_EmptyParameters_ShouldThrowException()
        {
            Assert.ThrowsAsync<ArgumentNullException>(async () => await this
                .fixture
                .ConsumerAPIClient
                .FinishUserTask(this.fixture.DefaultIdentity, "", "", "", null)
            );
        }

        [Fact]
        public void FinishUserTask_ProcessInstanceNotFound_ShouldThrowException()
        {
            Assert.ThrowsAsync<Exception>(async () => await this
                .fixture
                .ConsumerAPIClient
                .FinishUserTask( this.fixture.DefaultIdentity, "abc", "", "", null)
            );
        }

        [Fact]
        public async Task BPMN_FinishUserTask_ShouldFinishUserTask()
        {
            var processModelId = "test_consumer_api_usertask";
            var payload = new ProcessStartRequestPayload<object>();
            var callbackType = StartCallbackType.CallbackOnProcessInstanceCreated;

            ProcessStartResponsePayload processInstance = await this
                .fixture
                .ConsumerAPIClient
                .StartProcessInstance(this.fixture.DefaultIdentity, processModelId, "StartEvent_1", payload, callbackType);

            // Give the ProcessEngine time to reach the UserTask
            await Task.Delay(5000);

            UserTaskList userTasks = await this
                .fixture
                .ConsumerAPIClient
                .GetUserTasksForCorrelation(this.fixture.DefaultIdentity, processInstance.CorrelationId);

            Assert.NotEmpty(userTasks.UserTasks);

            var userTaskToBeFinished = userTasks.UserTasks.ElementAt(0);
            var userTaskResult = new UserTaskResult()
            {
                FormFields = new Dictionary<string, object>()
            };

            userTaskResult.FormFields.Add("my_test_key", "my_test_value");

            await this
                .fixture
                .ConsumerAPIClient
                .FinishUserTask(
                    this.fixture.DefaultIdentity,
                    processInstance.ProcessInstanceId,
                    processInstance.CorrelationId,
                    userTaskToBeFinished.FlowNodeInstanceId,
                    userTaskResult
                );
        }

    }
}
