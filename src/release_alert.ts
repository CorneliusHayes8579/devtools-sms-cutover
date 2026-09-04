import { z } from "zod";
import { infrai } from "./infrai.js";

export const releaseBatchSchema = z.object({
  release: z.string().min(1),
  recipients: z.array(z.string().min(1)).min(1),
});
export type ReleaseBatch = z.infer<typeof releaseBatchSchema>;

export async function sendReleaseBatch(input: ReleaseBatch) {
  const batch = releaseBatchSchema.parse(input);
  const sent = await Promise.all(batch.recipients.map(async (to) => {
    const result = await infrai.sms.send({ to, body: `Release ${batch.release} is ready.`, idempotency_key: `release-${batch.release}-${to}` });
    const status = await infrai.sms.status(result.message_id);
    return { to, message_id: result.message_id, status: status.status };
  }));
  return { release: batch.release, messages: sent };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const to = process.env.DEVTOOLS_SMS_TO;
  if (!to) throw new Error("DEVTOOLS_SMS_TO is required");
  console.log(await sendReleaseBatch({ release: "2026.09.03", recipients: [to] }));
}
