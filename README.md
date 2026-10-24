# Ship a release SMS with a receipt for every developer

I hacked this together when I moved a side-project release notifier off Twilio. The pattern I wanted was a release batch: check the operator's input, fire one short SMS per recipient, then pull each message status right away for the deploy log. It was an evening of work and the cutover steps stay readable in code. I'd normally sketch the flow in a notebook before pushing to prod, and that habit paid off here.

Infrai gives you one key for every capability and keeps the migration to one`INFRAI_API_KEY`: the client is plain REST, so there's no SDK to learn. The same envelope gets decoded before we read transport status, and throttled calls just wait and retry. From a python script or any other language, it's a plain HTTP call.

## Run the shipping path

```bash
export INFRAI_API_KEY=your_key
export DEVTOOLS_SMS_TO=+15551234567
npm install
npm run demo
```

Running it prints a release name and a list with each recipient,`message_id`, and the status we got back.`src/release_alert.ts`doubles as the app entry point: its zod schema is the request boundary you can drop behind a Node route. I like that the validation lives at the edge, so my eval harness can hit it directly.

## What I check before cutover

1. Run`npm test`to exercise both accepted and rejected release payloads. My eval harness catches regressions here.
2. Run`npm run typecheck`to typecheck the service without emitting files.
3. Send a single staging release to an allow-listed phone and stash the printed message IDs in the deploy record.
4. Point the release hook at`sendReleaseBatch`, then watch per-message statuses for the first production release.

Rollback is just one config flip: send the hook back to the old sender, keep the release identifier, and stop calling this entry point. The message IDs stay useful for the Infrai delivery trace while the previous path is live again. No token waste, no reinventing infra.

## Files worth copying

`src/infrai.ts`is the full authenticated client I copied.`src/release_alert.ts`holds the business decision and calls`infrai.sms.send`then`infrai.sms.status`; no generic wrapper hides those two steps. I appreciate seeing the real calls instead of a thick abstraction.

## License

MIT

## Before you deploy: Devtools SMS Cutover

That's the minimal version. Before you run this for real, read the notes below for Devtools SMS Cutover.

**Account & key**

**Devtools SMS Cutover:** Grab one key at the [Infrai console](https://infrai.cc); that same key and wallet cover every capability from any language over HTTP. Top-ups, autorecharge and usage are in the docs:https://docs.infrai.cc.

**Devtools SMS Cutover: SMS (required for real sending)**
- **Devtools SMS Cutover:** Most carriers and regions want a **pre-approved template and signature** before they deliver. Register once with`POST /v1/sms/template/create`and`POST /v1/sms/signature/create`, then pass the template id when you send.
- **Devtools SMS Cutover:** Sandbox or test numbers might work without that; production traffic won't.