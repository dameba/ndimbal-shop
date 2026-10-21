/**
 * Check a PayDunya sandbox invoice status server-side.
 * Deliberately test-only; never accepts production invoice tokens.
 */
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (process.env.PAYDUNYA_MODE !== "sandbox") {
    return res.status(503).json({ error: "Sandbox integration is not configured. Live payments are intentionally disabled." });
  }

  const masterKey = process.env.PAYDUNYA_MASTER_KEY;
  const privateKey = process.env.PAYDUNYA_PRIVATE_KEY;
  const token = process.env.PAYDUNYA_TOKEN;
  if (!masterKey || !privateKey || !token) {
    return res.status(503).json({ error: "Missing PayDunya TEST credentials in Vercel environment variables." });
  }

  const invoiceToken = typeof req.query.token === "string" ? req.query.token : "";
  if (!/^test_[A-Za-z0-9_-]{1,100}$/.test(invoiceToken)) {
    return res.status(400).json({ error: "A valid sandbox invoice token is required." });
  }

  try {
    const response = await fetch(
      "https://app.paydunya.com/sandbox-api/v1/checkout-invoice/confirm/" + encodeURIComponent(invoiceToken),
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "PAYDUNYA-MASTER-KEY": masterKey,
          "PAYDUNYA-PRIVATE-KEY": privateKey,
          "PAYDUNYA-TOKEN": token
        }
      }
    );

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.response_code !== "00" || !data.invoice) {
      return res.status(502).json({ error: "Unable to confirm this sandbox invoice with PayDunya." });
    }

    const rawStatus = String(data.status || data.invoice.status || "").toUpperCase();
    const allowed = ["PENDING", "COMPLETED", "CANCELLED", "FAILED"];
    const status = allowed.includes(rawStatus) ? rawStatus : "UNKNOWN";

    return res.status(200).json({
      invoiceToken,
      status,
      paid: status === "COMPLETED",
      mode: "sandbox",
      message: status === "COMPLETED"
        ? "PayDunya confirms this sandbox payment is completed."
        : "This invoice is not confirmed as paid."
    });
  } catch (error) {
    console.error("PayDunya sandbox status check failed", error && error.message);
    return res.status(502).json({ error: "Could not check the sandbox payment status. Try again later." });
  }
};
