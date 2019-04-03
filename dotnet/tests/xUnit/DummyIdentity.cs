namespace ProcessEngine.ConsumerAPI.Client.Tests.xUnit
{
    using System;
    using System.Text;

    using EssentialProjects.IAM.Contracts;

    public static class DummyIdentity
    {

        public static IIdentity Create()
        {
            return new Identity() { Token = Convert.ToBase64String(Encoding.UTF8.GetBytes("dummy_token")) };
        }
    }
}


