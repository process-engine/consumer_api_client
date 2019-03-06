namespace ProcessEngine.ConsumerAPI.Client.Tests
{
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Threading.Tasks;
    using System;

    using EssentialProjects.IAM.Contracts;

    using ProcessEngine.ConsumerAPI.Client.Tests.xUnit;
    using ProcessEngine.ConsumerAPI.Contracts;

    using Xunit;
    using ProcessEngine.ConsumerAPI.Contracts.DataModel;

    [Collection("ConsumerAPI collection")]
    public class GetEventsForProcessModelTests : ProcessEngineBaseTest
    {
        private readonly ConsumerAPIFixture fixture;

        public GetEventsForProcessModelTests(ConsumerAPIFixture fixture)
        {
            this.fixture = fixture;
        }

        [Fact]
        public async Task BPMN_GetEventsForCorrelationTests_ShouldFetchEventsOfRunningProcess()
        {
            var identity = DummyIdentity.Create();
            string processModelId = "test_consumer_api_message_event";
            string messageName = "test_message_event";

            var requestPayload = new ProcessStartRequestPayload<object>();

            ProcessStartResponsePayload processStartResponsePayload = await this.fixture.ConsumerAPIClient.StartProcessInstance(
                identity,
                processModelId,
                "StartEvent_1",
                requestPayload);

            await Task.Delay(1000);

            var events = await this.fixture.ConsumerAPIClient.GetEventsForProcessModel(
                identity,
                processModelId
            );

            Assert.NotEmpty(events.Events);

            var fetchedEvent = events.Events.ElementAt(0);
            Assert.Equal(fetchedEvent.EventName, messageName);
        }

    }
}
