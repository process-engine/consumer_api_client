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
            var ex = Assert.ThrowsAsync<ArgumentNullException>(async () => await this.fixture.ConsumerAPIClient.FinishUserTask(
                DummyIdentity.Create(),
                "",
                "",
                "",
                null));
        }

        [Fact]
        public void FinishUserTask_ProcessInstanceNotFound_ShouldThrowException()
        {
            var ex = Assert.ThrowsAsync<Exception>(async () => await this.fixture.ConsumerAPIClient.FinishUserTask(
                DummyIdentity.Create(),
                "abc",
                "",
                "",
                null));
        }

        [Fact]
        public async Task BPMN_FinishUserTask_ShouldFetchUserTaskList()
        {
            string processModelId = "test_consumer_api_usertask";
            var identity = DummyIdentity.Create();

            ProcessStartResponsePayload processInstance = await this.fixture.ConsumerAPIClient.StartProcessInstance(
                identity,
                processModelId,
                "StartEvent_1",
                new ProcessStartRequestPayload<object>(),
                StartCallbackType.CallbackOnProcessInstanceCreated);

            UserTaskList userTasks = await this.fixture.ConsumerAPIClient.GetUserTasksForCorrelation(
                identity,
                processInstance.CorrelationId);

            var userTaskToBeFinished = userTasks.UserTasks.ElementAt(0);
            var userTaskResult = new UserTaskResult()
            {
                FormFields = new Dictionary<string, object>()
            };

            userTaskResult.FormFields.Add("my_test_key", "my_test_value");

            await this.fixture.ConsumerAPIClient.FinishUserTask(
                identity,
                processInstance.ProcessInstanceId,
                processInstance.CorrelationId,
                userTaskToBeFinished.FlowNodeInstanceId,
                userTaskResult);
        }

    }
}