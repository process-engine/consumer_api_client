namespace ProcessEngine.ConsumerAPI.Client.Tests.xUnit
{
    using System;
    using System.Text;

    using EssentialProjects.IAM.Contracts;

    public static class DummyIdentity
    {

        public static IIdentity Create()
        {
            return new Identity() { Token = Convert.ToBase64String(Encoding.UTF8.GetBytes("dummy_token")), UserId = "dummy_token" };
        }

        public static IIdentity CreateFake(string userId)
        {
            // This is the default token content found at https://jwt.io/
            // The dummy token is the only exception to the JWT standard. All
            // other tokens have to be valid JWT tokens.
            return new Identity() { Token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c", UserId = userId };
        }
    }
}


