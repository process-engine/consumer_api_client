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
    using ProcessEngine.ConsumerAPI.Contracts.DataModel;
    using ProcessEngine.ConsumerAPI.Contracts;

    using Xunit;
    using ProcessEngine.ConsumerAPI.Contracts.DataModel;

    [Collection("ConsumerAPI collection")]
    public class GetProcessResultForCorrelationTests : ProcessEngineBaseTest
    {
        private readonly ConsumerAPIFixture fixture;

        public GetProcessResultForCorrelationTests(ConsumerAPIFixture fixture)
        {
            this.fixture = fixture;
        }

        [Fact]
        public async Task BPMN_GetProcessResultForCorrelation_ShouldGetResultOfStaticProcess()
        {
            var processModelId = "test_consumer_api_correlation_result";
            var endEventId = "EndEvent_Success";
            var payload = new ProcessStartRequestPayload<object>();
            var callbackType = StartCallbackType.CallbackOnEndEventReached;

            ProcessStartResponsePayload processInstance = await this
                .fixture
                .ConsumerAPIClient
                .StartProcessInstance(this.fixture.DefaultIdentity, processModelId, "StartEvent_1", payload, callbackType, endEventId);

            var correlationResults = await this
                .fixture
                .ConsumerAPIClient
                .GetProcessResultForCorrelation<TestResult>(this.fixture.DefaultIdentity, processInstance.CorrelationId, processModelId);

            var expectedCorrelationResult = new CorrelationResult<TestResult>
            {
                TokenPayload = new TestResult()
                {
                    scriptOutput = "hello world"
                },
                CorrelationId = processInstance.CorrelationId,
                EndEventId = endEventId
            };

            var actualCorrelationResult = new List<CorrelationResult<TestResult>>(correlationResults).FirstOrDefault();

            Assert.NotNull(actualCorrelationResult);

            Assert.Equal(expectedCorrelationResult.CorrelationId, actualCorrelationResult.CorrelationId);
            Assert.Equal(expectedCorrelationResult.EndEventId, actualCorrelationResult.EndEventId);
            Assert.Equal(expectedCorrelationResult.TokenPayload.scriptOutput, actualCorrelationResult.TokenPayload.scriptOutput);
        }
    }

    public class TestResult
    {
        public string scriptOutput { get; set; }
    }
}
