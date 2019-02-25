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
    public class GetUserTasksForProcessModelInCorrelationTests : ProcessEngineBaseTest
    {
        private readonly ConsumerAPIFixture fixture;

        public GetUserTasksForProcessModelInCorrelationTests(ConsumerAPIFixture fixture)
        {
            this.fixture = fixture;
        }

        [Fact]
        public void GetUserTasksForProcessModelInCorrelation_EmptyParameters_ShouldThrowException()
        {
            var ex = Assert.ThrowsAsync<ArgumentNullException>(async () => await this.fixture.ConsumerAPIClient.GetUserTasksForProcessModelInCorrelation(
                DummyIdentity.Create(),
                "",
                ""));
        }

        [Fact]
        public void GetUserTasksForProcessModelInCorrelation_ProcessModelNotFound_ShouldThrowException()
        {
            var ex = Assert.ThrowsAsync<Exception>(async () => await this.fixture.ConsumerAPIClient.GetUserTasksForProcessModelInCorrelation(
                DummyIdentity.Create(),
                "Test",
                "1234"));
        }

        [Fact]
        public async Task BPMN_GetUserTasksForProcessModelInCorrelation_ShouldFetchUserTaskList()
        {
            string processModelId = "test_consumer_api_usertask";
            var identity = DummyIdentity.Create();

            ProcessStartResponsePayload processInstance = await this.fixture.ConsumerAPIClient.StartProcessInstance(
                identity,
                processModelId,
                "StartEvent_1",
                new ProcessStartRequestPayload<object>(),
                StartCallbackType.CallbackOnProcessInstanceCreated);


            UserTaskList userTasks = await this.fixture.ConsumerAPIClient.GetUserTasksForProcessModelInCorrelation(
                identity,
                processModelId,
                processInstance.CorrelationId);

            Assert.NotEmpty(userTasks.UserTasks);
        }

    }
}