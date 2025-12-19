Deploy your Clerk app to production
Before you begin:

You will need to have a domain you own.
You will need to be able to add DNS records on your domain.
You will need social sign-in (OAuth) credentials for any providers that you would like to use in production. Each OAuth provider has a dedicated guide on how to set up OAuth credentials for Clerk production apps.
Create your production instance
Navigate to the Clerk Dashboard.
At the top of the Dashboard, select the Development button to reveal the instance selection dropdown. Select Create production instance.
You will be prompted with a modal to either clone your development instance settings to your production instance or create your production instance with Clerk's default settings.
The homepage of the dashboard will show you what is still required to deploy your production instance.
Warning

For security reasons, SSO connections, Integrations, and Paths settings do not copy over. You will need to set these values again.

API keys and environment variables
A common mistake when deploying to production is forgetting to change your API keys to your production instances keys. The best way to set this up is to make use of environment variables. All modern hosting providers, such as Vercel, AWS, GCP, Heroku, and Render, make it easy to add these values. Locally, you should use an .env file. This way, these values are being set dynamically depending on your environment. Here's a list of Clerk variables you'll need to change:

Publishable Key: Formatted as pk_test_ in development and pk_live_ in production. This is passed to the <ClerkProvider> during initialization.

Secret Key: Formatted as sk_test_ in development and sk_live_ in production. These values are used to access Clerk's Backend API.

Tip

Be sure to update these values in your hosting provider's environment variables, and also to redeploy your app.

OAuth credentials
In development, for most social providers, Clerk provides you with a set of shared OAuth credentials.

In production, these are not secure and you will need to provide your own. Each OAuth provider has a dedicated guide on how to set up OAuth credentials for Clerk production apps.

Webhooks
Your webhook endpoints will need to be updated to use your production instance's URL and signing secret. See the guide on syncing data for more information.

Content Security Policy (CSP)
If you're using a CSP, follow the instructions in the CSP guide.

DNS records
Clerk uses DNS records to provide session management and emails verified from your domain.

To see what DNS records you need, navigate to the Domains page in the Clerk Dashboard.

Note

It can take up to 48hrs for DNS records to fully propagate.

Authentication across subdomains
When you set a root domain for your production deployment, Clerk's authentication will work across all subdomains. User sessions will also be shared across the subdomains.

Examples

example-site.com and dashboard.example-site.com
dashboard.example-site.com and accounts.example-site.com
Note

If you're using passkeys, only the first scenario in the above example will work due to restrictions in the WebAuthn standard.

To share sessions and authentication across two different domains with the same Clerk application, see the Authentication across different domains guide.

Configure authorizedParties for secu