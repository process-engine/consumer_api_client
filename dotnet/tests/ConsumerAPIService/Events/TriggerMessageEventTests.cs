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
    public class TriggerMessageEventTests : ProcessEngineBaseTest
    {
        private readonly ConsumerAPIFixture fixture;

        public TriggerMessageEventTests(ConsumerAPIFixture fixture)
        {
            this.fixture = fixture;
        }

        [Fact]
        public async Task BPMN_TriggerMessageEvent_ShouldContinueProcessWithMessageIntermediateCatchEvent()
        {
            string processModelId = "test_consumer_api_message_event";
            string messageName = "test_message_event";

            var requestPayload = new ProcessStartRequestPayload<object>();

            ProcessStartResponsePayload processStartResponsePayload = await this
                .fixture
                .ConsumerAPIClient
                .StartProcessInstance(this.fixture.DefaultIdentity, processModelId, "StartEvent_1", requestPayload);

            await Task.Delay(5000);

            await this.fixture.ConsumerAPIClient.TriggerMessageEvent(this.fixture.DefaultIdentity, messageName);

            await Task.Delay(5000);

            var processResult = await this
                .fixture
                .ConsumerAPIClient
                .GetProcessResultForCorrelation<object>(this.fixture.DefaultIdentity, processStartResponsePayload.CorrelationId, processModelId);

            Assert.NotEmpty(processResult.CorrelationResults);
        }

    }
}
