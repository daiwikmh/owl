export async function sendWebhook(url: string, message: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: message,
        timestamp: new Date().toISOString(),
        source: "owl-alerts",
      }),
    });

    return res.ok;
  } catch (err) {
    console.error("Webhook send failed:", (err as Error).message);
    return false;
  }
}
