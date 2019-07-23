namespace ProcessEngine.ConsumerAPI.Client.Tests
{
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Threading.Tasks;
    using System.Threading;
    using System;

    using EssentialProjects.IAM.Contracts;

    using ProcessEngine.ConsumerAPI.Client.Tests.xUnit;
    using ProcessEngine.ConsumerAPI.Contracts;

    using Xunit;
    using ProcessEngine.ConsumerAPI.Contracts.DataModel;

    [Collection("ConsumerAPI collection")]
    public class GetProcessModelByIdTest : ProcessEngineBaseTest
    {
        private readonly ConsumerAPIFixture fixture;

        public GetProcessModelByIdTest(ConsumerAPIFixture fixture)
        {
            this.fixture = fixture;
        }

        [Fact]
        public async Task BPMN_GetProcessModelByIdTest_ShouldGetProcessModel()
        {
            var processModelId = "test_consumer_api_correlation_result";

            var processModel = await this
                .fixture
                .ConsumerAPIClient
                .GetProcessModelById(this.fixture.DefaultIdentity, processModelId);

            Assert.NotNull(processModel);

            Assert.Equal(processModel.ID, processModelId);
            Assert.Equal(processModel.StartEvents.ToList()[0].Id, "StartEvent_1");
            Assert.Equal(processModel.EndEvents.ToList()[0].Id, "EndEvent_Success");
        }
    }
}
