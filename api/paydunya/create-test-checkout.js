/**
 * Ndimbal Shop — PayDunya sandbox preparation endpoint.
 * This is deliberately TEST-ONLY. It never calls the production API.
 * No secrets are exposed to the browser.
 */
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (process.env.PAYDUNYA_MODE !== "sandbox") {
    return res.status(503).json({
      error: "Sandbox integration is not configured. Live payments are intentionally disabled."
    });
  }

  const masterKey = process.env.PAYDUNYA_MASTER_KEY;
  const privateKey = process.env.PAYDUNYA_PRIVATE_KEY;
  const token = process.env.PAYDUNYA_TOKEN;
  if (!masterKey || !privateKey || !token) {
    return res.status(503).json({
      error: "Missing PayDunya TEST credentials. Add test credentials in Vercel environment variables."
    });
  }

  try {
    const response = await fetch("https://app.paydunya.com/sandbox-api/v1/checkout-invoice/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "PAYDUNYA-MASTER-KEY": masterKey,
        "PAYDUNYA-PRIVATE-KEY": privateKey,
        "PAYDUNYA-TOKEN": token
      },
      body: JSON.stringify({
        invoice: {
          total_amount: 100,
          description: "Ndimbal Shop — test de paiement (sandbox)"
        },
        store: {
          name: "Ndimbal Shop",
          tagline: "Test technique — aucun paiement réel"
        },
        custom_data: {
          purpose: "sandbox-integration-check",
          environment: "test"
        }
      })
    });

    const data = await response.json().catch(() => ({}));
    const checkoutUrl = typeof data.response_text === "string" ? data.response_text : "";
    const validSandboxUrl =
      data.response_code === "00" &&
      /^https:\/\/app\.paydunya\.com\/sandbox-checkout\/invoice\/[A-Za-z0-9_-]+$/.test(checkoutUrl) &&
      typeof data.token === "string" &&
      /^test_[A-Za-z0-9_-]+$/.test(data.token);

    if (!response.ok || !validSandboxUrl) {
      console.error("PayDunya sandbox invoice creation failed", {
        httpStatus: response.status,
        responseCode: data.response_code || null
      });
      return res.status(502).json({ error: "PayDunya could not create a sandbox invoice. Check test credentials and application settings." });
    }

    return res.status(200).json({
      checkoutUrl,
      invoiceToken: data.token,
      mode: "sandbox",
      amount: 100,
      currency: "XOF",
      message: "Test invoice created. This is not a real charge."
    });
  } catch (error) {
    console.error("PayDunya sandbox request failed", error && error.message);
    return res.status(502).json({ error: "Could not reach PayDunya sandbox. Try again later." });
  }
};
