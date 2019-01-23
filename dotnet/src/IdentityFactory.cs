namespace ProcessEngine.ConsumerAPI.Client
{
  using System;
  using System.Text;

  using EssentialProjects.IAM.Contracts;

  public static class IdentityFactory {

        public static IIdentity GetDummyIdentity () {
            return new Identity () { token = Convert.ToBase64String (Encoding.UTF8.GetBytes ("dummy_token")) };
        }
    }
}


