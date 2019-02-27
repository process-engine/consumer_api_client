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
    public class GetUserTasksForProcessModelTests : ProcessEngineBaseTest
    {
        private readonly ConsumerAPIFixture fixture;

        public GetUserTasksForProcessModelTests(ConsumerAPIFixture fixture)
        {
            this.fixture = fixture;
        }

        [Fact]
        public void GetUserTasksForProcessModel_EmptyParameters_ShouldThrowException()
        {
            var ex = Assert.ThrowsAsync<ArgumentNullException>(async () => await this.fixture.ConsumerAPIClient.GetUserTasksForProcessModel(
                DummyIdentity.Create(),
                ""));
        }

        [Fact]
        public void GetUserTasksForProcessModel_ProcessModelNotFound_ShouldThrowException()
        {
            var ex = Assert.ThrowsAsync<Exception>(async () => await this.fixture.ConsumerAPIClient.GetUserTasksForProcessModel(
                DummyIdentity.Create(),
                "Test"));
        }

        [Fact]
        public async Task BPMN_GetUserTasksForProcessModel_ShouldFetchUserTaskList()
        {
            string processModelId = "test_consumer_api_usertask";
            var identity = DummyIdentity.Create();

            ProcessStartResponsePayload processInstance = await this.fixture.ConsumerAPIClient.StartProcessInstance(
                identity,
                processModelId,
                "StartEvent_1",
                new ProcessStartRequestPayload<object>(),
                StartCallbackType.CallbackOnProcessInstanceCreated);

            // Give the process engine time to reach the user task
            await Task.Delay(1000);

            UserTaskList userTasks = await this.fixture.ConsumerAPIClient.GetUserTasksForProcessModel(
                identity,
                processModelId);

            Assert.NotEmpty(userTasks.UserTasks);
        }

    }
}
