<!-- Generated from the module by scripts/build-skill-reference.cjs (npm run build). Do not edit. -->
# Mail & HTTP (COMMUNICATION)

Send a mail, call an external service.

## CURL_REQUEST

cURL Request · French label in the builder: « Requête cURL »

`CURL_REQUEST(curl?: string) → string`

Parses a curl command and performs the HTTP request, returning the response body as a string (JSON responses are stringified so they can be fed to GET_PROPERTY / PARSE_NUMBER). The curl command comes from the wired input if present, otherwise from the "curl" parameter. Supports -X, -H, -d/--data*, --json, -u, -G, -b, -A, -e. Throws on network errors and non-2xx responses (the status and body are included in the error).

Inputs, in this order:
1. `curl` (string, optional) — Optional curl command string. Overrides the "curl" parameter when wired (e.g. a curl template stored on a node).

Parameters:
- `curl` (string, optional) — The curl command to parse and execute (used when no curl input is wired).
- `timeoutMs` (number, optional, default 30000) — Request timeout in milliseconds (default 30000).

## SEND_MAIL

Send Mail · French label in the builder: « Envoyer un mail »

`SEND_MAIL(to: string | string[], ...values?: any) → any`

Sends an email from the organ's mail account — the company no-reply address, configured on the organ, never in the analytic. Wire the recipient(s) first (one address, a list separated by "," or ";", or a list of addresses — e.g. read from a ticket), then any values to insert: {0} in "subject" or "body" is replaced by the second wired input, {1} by the third, and so on. With "format" html the body is sent as HTML and inserted values are escaped. Running an analytic from the builder sends real mails: set "dryRun" to build the mail without sending it. Returns { sent, to, subject, messageId }.

Inputs, in this order:
1. `to` (string | string[]) — Recipient address(es): one address, a list separated by "," or ";", or a list of addresses.
2. `values` (any, optional, one or more) — Values for the {0}, {1}, … placeholders of subject and body, in wiring order (after the recipient).

Parameters:
- `subject` (string, required) — Subject template, e.g. "Ticket {0}: new step".
- `body` (string, required) — Body template, e.g. "Your ticket {0} moved to step {1}."
- `format` (string, optional, one of "text", "html", default "text") — "text" (default) or "html".
- `cc` (string, optional) — Optional CC address(es), separated by "," or ";".
- `bcc` (string, optional) — Optional BCC address(es), separated by "," or ";".
- `dryRun` (boolean, optional, default false) — Build the mail without sending it (default false) — returns what would be sent.
