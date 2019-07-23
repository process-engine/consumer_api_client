namespace ProcessEngine.ConsumerAPI.Client.Tests
{
  using System;
  using System.Linq;
  using System.Threading.Tasks;

  using ProcessEngine.ConsumerAPI.Client.Tests.xUnit;

  using Xunit;
  using ProcessEngine.ConsumerAPI.Contracts.DataModel;

  [Collection("ConsumerAPI collection")]
    public class GetProcessModelByProcessInstanceId : ProcessEngineBaseTest
    {
        private readonly ConsumerAPIFixture fixture;

        public GetProcessModelByProcessInstanceId(ConsumerAPIFixture fixture)
        {
            this.fixture = fixture;
        }

        [Fact]
        public async Task BPMN_GetProcessModelByProcessInstanceId_ShouldGetProcessModel()
        {
            var processModelId = "test_consumer_api_correlation_result";
            var payload = new ProcessStartRequestPayload<object>();
            var callbackType = StartCallbackType.CallbackOnProcessInstanceFinished;

            var processStartResponsePayload = await this
                .fixture
                .ConsumerAPIClient
                .StartProcessInstance(this.fixture.DefaultIdentity, processModelId, "StartEvent_1", payload, callbackType);

            Assert.NotNull(processStartResponsePayload);

            var processModel = await this
                .fixture
                .ConsumerAPIClient
                .GetProcessModelByProcessInstanceId(this.fixture.DefaultIdentity, processStartResponsePayload.ProcessInstanceId);

            Assert.NotNull(processModel);

            Assert.Equal(processModelId, processModel.ID);
            Assert.Equal("StartEvent_1", processModel.StartEvents.ToList()[0].Id);
            Assert.Equal("EndEvent_Success", processModel.EndEvents.ToList()[0].Id);
        }
    }
}
