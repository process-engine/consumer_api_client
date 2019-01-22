namespace ProcessEngine.ConsumerAPI.Client.Tests
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading.Tasks;

    using Xunit;

    using EssentialProjects.IAM.Contracts;
    using ProcessEngine.ConsumerAPI.Contracts;
    using ProcessEngine.ConsumerAPI.Client.Tests.xUnit;
    using System.Text;
    using System.Threading;

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
            string processModelId = "test_consumer_api_correlation_result";
            string endEventId = "EndEvent_Success";
            var identity = GetDummyIdentity();

            ProcessStartResponsePayload processInstance = await this.fixture.ConsumerAPIClient.StartProcessInstance(
                identity,
                processModelId,
                "StartEvent_1",
                new ProcessStartRequestPayload<object>(),
                StartCallbackType.CallbackOnEndEventReached,
                endEventId);

            var correlationResults = await this.fixture.ConsumerAPIClient.GetProcessResultForCorrelation<TestResult>(
                identity,
                processInstance.CorrelationId,
                processModelId);

            var expectedCorrelationResult = new CorrelationResult<TestResult> {
                TokenPayload = new TestResult() {
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

    public class TestResult {
        public string scriptOutput { get; set; }
    }
}