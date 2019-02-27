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
    public class GetUserTasksForCorrelationTests : ProcessEngineBaseTest
    {
        private readonly ConsumerAPIFixture fixture;

        public GetUserTasksForCorrelationTests(ConsumerAPIFixture fixture)
        {
            this.fixture = fixture;
        }

        [Fact]
        public void GetUserTasksForCorrelation_EmptyParameters_ShouldThrowException()
        {
            var ex = Assert.ThrowsAsync<ArgumentNullException>(async () => await this.fixture.ConsumerAPIClient.GetUserTasksForCorrelation(
                DummyIdentity.Create(),
                ""));
        }

        [Fact]
        public void GetUserTasksForCorrelation_ProcessModelNotFound_ShouldThrowException()
        {
            var ex = Assert.ThrowsAsync<Exception>(async () => await this.fixture.ConsumerAPIClient.GetUserTasksForCorrelation(
                DummyIdentity.Create(),
                "Test"));
        }

        [Fact]
        public async Task BPMN_GetUserTasksForCorrelation_ShouldFetchUserTaskList()
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

            UserTaskList userTasks = await this.fixture.ConsumerAPIClient.GetUserTasksForCorrelation(
                identity,
                processInstance.CorrelationId);

            Assert.NotEmpty(userTasks.UserTasks);
        }

    }
}
