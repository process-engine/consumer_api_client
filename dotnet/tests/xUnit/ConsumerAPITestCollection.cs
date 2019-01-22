namespace ProcessEngine.ConsumerAPI.Tests.xUnit {
    using ProcessEngine.ConsumerAPI.Client.Tests.xUnit;

    using Xunit;

    // https://xunit.github.io/docs/shared-context

    [CollectionDefinition ("ConsumerAPI collection")]
    public class ConsumerAPITestCollection : ICollectionFixture<ConsumerAPIFixture> { }
}
