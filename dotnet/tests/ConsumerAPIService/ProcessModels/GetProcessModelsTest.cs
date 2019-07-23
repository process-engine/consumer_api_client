namespace ProcessEngine.ConsumerAPI.Client.Tests
{
  using System.Threading.Tasks;

  using ProcessEngine.ConsumerAPI.Client.Tests.xUnit;

  using Xunit;

  [Collection("ConsumerAPI collection")]
    public class GetProcessModels : ProcessEngineBaseTest
    {
        private readonly ConsumerAPIFixture fixture;

        public GetProcessModels(ConsumerAPIFixture fixture)
        {
            this.fixture = fixture;
        }

        [Fact]
        public async Task BPMN_GetProcessModels_ShouldGetProcessModels()
        {
            var processModels = await this
                .fixture
                .ConsumerAPIClient
                .GetProcessModels(this.fixture.DefaultIdentity);

            Assert.NotEmpty(processModels.ProcessModels);
        }
    }
}
