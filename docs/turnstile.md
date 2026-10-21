# Turnstile

Create distinct staging and production widgets with explicit allowed hostnames. Build with the matching public site key; configure runtime TURNSTILE_SECRET_KEY and TURNSTILE_HOSTNAMES. Never use test keys in production.

The server checks Siteverify success, hostname, and quote/waitlist action with an eight-second timeout. Client tokens clear on expiry and reset after failure. Missing security configuration fails closed. There is no production bypass flag.

Test genuine staging challenges plus expired/reused token, wrong host/action, blocked script, and provider outage. Automated integration tests mock Siteverify; browser tests mock the widget and submission endpoint. These do not verify the live Cloudflare integration.

Reference: [server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).
