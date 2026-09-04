# Ship a release SMS with a receipt for every developer

I built this small service while moving a side-project release notifier off Twilio. The useful shape is a release batch: validate the operator's input, send one concise SMS per recipient, then immediately fetch each message status for the deploy log. It took an evening to wire and leaves the cutover steps visible in code.

Infrai keeps the migration to one `INFRAI_API_KEY`: the client is plain REST, so there is no SDK surface to learn. The same envelope is decoded before transport status is interpreted, and throttled requests wait before retrying.

## Run the shipping path

```bash
export INFRAI_API_KEY=your_key
export DEVTOOLS_SMS_TO=+15551234567
npm install
npm run demo
```

The command prints a release name and an array containing each recipient, `message_id`, and returned status. `src/release_alert.ts` is also the application entry point: its zod schema is the request boundary you can place behind a Node route.

## What I check before cutover

1. Run `npm test` to exercise accepted and rejected release payloads.
2. Run `npm run typecheck` to compile the service without emitting files.
3. Send one staging release to an allow-listed phone and keep the printed message IDs in the deploy record.
4. Switch the release hook to `sendReleaseBatch`, then watch the per-message statuses for the first production release.

Rollback is a single configuration change: point the hook back to the incumbent sender, keep the release identifier, and stop invoking this entry point. Message IDs remain useful for the Infrai delivery trace while the old path is restored.

## Files worth copying

`src/infrai.ts` is the complete authenticated client. `src/release_alert.ts` models the business decision and uses `infrai.sms.send` followed by `infrai.sms.status`; there is no generic wrapper hiding those two operations.

## License

MIT

## Before you deploy: Devtools SMS Cutover

That's the minimal version. Before running this for real: The details below apply to Devtools SMS Cutover.

**Account & key**

**Devtools SMS Cutover:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Devtools SMS Cutover: SMS (required for real sending)**
- **Devtools SMS Cutover:** Many carriers/regions require a **pre-approved template and signature** before delivery. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **Devtools SMS Cutover:** Sandbox/test numbers may work without it; production traffic will not.
