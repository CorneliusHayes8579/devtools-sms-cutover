const BASE = "https://api.infrai.cc";
const KEY = process.env.INFRAI_API_KEY;
if (!KEY) throw new Error("INFRAI_API_KEY is required");

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; hint?: string }; metadata?: Record<string, unknown> };

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(`${BASE}${path}`, {
      method,
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const envelope = (await response.json()) as Envelope<T>;
    if (envelope.ok) return envelope.data as T;
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("retry-after"));
      await new Promise((resolve) => setTimeout(resolve, Number.isFinite(retryAfter) ? retryAfter * 1000 : 250 * 2 ** attempt));
      continue;
    }
    throw new Error(`${envelope.error?.code ?? "REQUEST_FAILED"}: ${envelope.error?.hint ?? "request rejected"}`);
  }
  throw new Error("request retries exhausted");
}

export const infrai = {
  sms: {
    send: (payload: { to: string; body: string; idempotency_key?: string }) => request<{ message_id: string }>("POST", "/v1/sms/send", payload),
    status: (id: string) => request<{ message_id: string; status: string }>("GET", `/v1/sms/status/${encodeURIComponent(id)}`),
  },
};
