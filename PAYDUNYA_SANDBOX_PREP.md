# PayDunya integration preparation — Ndimbal Shop

This branch is a **sandbox-only preparation**. It does not add a checkout button to the live storefront and it does not enable real payments. The existing `index.html` is unchanged.

## What is included

- `api/paydunya/create-test-checkout.js`: creates a fixed 100 XOF PayDunya sandbox invoice. It does not accept a client-supplied amount or product price.
- `api/paydunya/check-test-status.js`: checks a `test_...` invoice token against PayDunya's sandbox status endpoint.
- Both endpoints fail closed unless `PAYDUNYA_MODE=sandbox` and test credentials are configured.
- No production API endpoint or live-mode switch exists in these routes.

## Before testing

PayDunya's documentation says an activated PayDunya Business account is required to generate API keys. Once PayDunya makes test-mode credentials available, add these variables in the Vercel project connected to **Ndimbal Shop**:

- `PAYDUNYA_MODE` = `sandbox`
- `PAYDUNYA_MASTER_KEY` = your PayDunya TEST master key
- `PAYDUNYA_PRIVATE_KEY` = your PayDunya TEST private key
- `PAYDUNYA_TOKEN` = your PayDunya TEST token

Add them under **Vercel → Ndimbal Shop project → Settings → Environment Variables**. For this preparation branch, use Preview scope only. Never use production credentials in this branch, never prefix secrets with `NEXT_PUBLIC_`, and never commit credentials to GitHub or send them in chat. Redeploy the preview after adding variables.

## Sandbox smoke test

After the preview deployment is ready and the TEST keys are configured:

1. Send a POST request to `/api/paydunya/create-test-checkout` with a JSON content-type and an empty JSON body `{}`.
2. A successful response should contain a PayDunya URL under `https://app.paydunya.com/sandbox-checkout/invoice/`, an invoice token beginning with `test_`, and `mode: "sandbox"`.
3. Open the returned URL and use only PayDunya's documented sandbox/test customer flow.
4. Check the status from `/api/paydunya/check-test-status?token=YOUR_TEST_TOKEN`.
5. Confirm the server reports `COMPLETED` only when PayDunya's server confirms it. A browser return page alone is not proof of payment.

If the endpoint returns 503, that is expected until test credentials are available and configured. Do not add production credentials to make the test work.

## Not production-ready yet

- The storefront's current sample products and prices are demonstration content and are not wired to this endpoint.
- Do not collect customer payments through this fixed 100 XOF test endpoint.
- Before any live checkout, replace demo catalogue data with the real catalogue and server-owned product IDs/prices, implement an order store and idempotency, add verified IPN/webhook handling, validate the final server-confirmed invoice and amount, and obtain PayDunya approval.
- Do not enable live payments until PayDunya confirms merchant activation and the production integration has been separately reviewed and tested.
