/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AlgorithmDefinition,
  AlgorithmRunResult,
  createAlgorithm,
} from './core';
import { resolveBooleanFlag } from '../../services/utils';
import { sendMail } from '../../services/mailer';

// Catches typos without rejecting valid addresses (the same check spinal-service-mailer makes).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Recipients from a value: one address, a list separated by "," or ";", a list of those, or a
 * spinal Model holding one (e.g. an attribute). Trimmed, validated, de-duplicated (ignoring case).
 */
function parseAddresses(value: unknown, field: string): string[] {
  const entries: unknown[] = Array.isArray(value) ? value : [value];
  const seen = new Set<string>();
  const addresses: string[] = [];
  for (const entry of entries) {
    if (entry === null || entry === undefined) continue;
    const text = typeof (entry as any)?.get === 'function' ? (entry as any).get() : entry;
    if (typeof text !== 'string') {
      throw new Error(`SEND_MAIL: "${field}" must be email address text, got ${Array.isArray(text) ? 'a list' : typeof text}`);
    }
    for (const part of text.split(/[,;]/)) {
      const address = part.trim();
      if (!address) continue;
      if (!EMAIL_RE.test(address)) throw new Error(`SEND_MAIL: invalid address "${address}" in "${field}"`);
      const key = address.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      addresses.push(address);
    }
  }
  return addresses;
}

/** A value as text in a mail: a node by its name, a spinal Model by its value, objects as JSON. */
function valueAsText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value !== 'object') return String(value);
  const model = value as { getName?: () => { get: () => unknown }; get?: () => unknown };
  if (typeof model.getName === 'function') return String(model.getName().get());
  if (typeof model.get === 'function') return valueAsText(model.get());
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const MAIL_ALGORITHMS: AlgorithmDefinition[] = [
  createAlgorithm({
    name: 'SEND_MAIL',
    description:
      'Sends an email from the organ\'s mail account — the company no-reply address, configured on the organ, ' +
      'never in the analytic. Wire the recipient(s) first (one address, a list separated by "," or ";", or a ' +
      'list of addresses — e.g. read from a ticket), then any values to insert: {0} in "subject" or "body" is ' +
      'replaced by the second wired input, {1} by the third, and so on. With "format" html the body is sent as ' +
      'HTML and inserted values are escaped. Running an analytic from the builder sends real mails: set "dryRun" ' +
      'to build the mail without sending it. Returns { sent, to, subject, messageId }.',
    inputs: [
      { name: 'to', types: ['string', 'string[]'], description: 'Recipient address(es): one address, a list separated by "," or ";", or a list of addresses.', required: true },
      { name: 'values', types: ['any'], description: 'Values for the {0}, {1}, … placeholders of subject and body, in wiring order (after the recipient).', required: false, variadic: true },
    ],
    outputType: 'any',
    parameters: [
      { name: 'subject', type: 'string', description: 'Subject template, e.g. "Ticket {0}: new step".', required: true },
      { name: 'body', type: 'string', description: 'Body template, e.g. "Your ticket {0} moved to step {1}."', required: true },
      { name: 'format', type: 'string', description: '"text" (default) or "html".', required: false },
      { name: 'cc', type: 'string', description: 'Optional CC address(es), separated by "," or ";".', required: false },
      { name: 'bcc', type: 'string', description: 'Optional BCC address(es), separated by "," or ";".', required: false },
      { name: 'dryRun', type: 'boolean', description: 'Build the mail without sending it (default false) — returns what would be sent.', required: false },
    ],
    run: async (input, params, context): AlgorithmRunResult => {
      // One wired input → it IS the recipients (possibly a list of addresses); more → [to, ...values].
      const wired = context?.inputCount ?? 1;
      const [rawTo, ...values]: unknown[] = wired > 1 && Array.isArray(input) ? (input as unknown[]) : [input];

      const subjectTemplate = typeof params?.subject === 'string' ? params.subject : '';
      const bodyTemplate = typeof params?.body === 'string' ? params.body : '';
      if (!subjectTemplate.trim()) throw new Error('SEND_MAIL requires a non-empty "subject" parameter');
      if (!bodyTemplate.trim()) throw new Error('SEND_MAIL requires a non-empty "body" parameter');
      const format = String(params?.format ?? 'text').trim().toLowerCase() || 'text';
      if (format !== 'text' && format !== 'html') {
        throw new Error(`SEND_MAIL: "format" must be "text" or "html", got ${JSON.stringify(params?.format)}`);
      }

      const to = parseAddresses(rawTo, 'to');
      if (to.length === 0) throw new Error('SEND_MAIL: no recipient — the "to" input is empty');
      const cc = parseAddresses(params?.cc, 'cc');
      const bcc = parseAddresses(params?.bcc, 'bcc');

      const fill = (template: string, field: 'subject' | 'body'): string =>
        template.replace(/\{(\d+)\}/g, (_match, digits: string) => {
          const index = Number(digits);
          if (index >= values.length) {
            throw new Error(
              `SEND_MAIL: "${field}" uses {${index}} but only ${values.length} value input(s) are wired after the recipient`
            );
          }
          const text = valueAsText(values[index]);
          return format === 'html' && field === 'body' ? escapeHtml(text) : text;
        });
      const subject = fill(subjectTemplate, 'subject').replace(/[\r\n]+/g, ' ').trim();
      const body = fill(bodyTemplate, 'body');

      if (resolveBooleanFlag(params?.dryRun, false)) {
        return { sent: false, dryRun: true, to, cc, bcc, subject, [format]: body } as any;
      }

      const result = await sendMail({
        to,
        cc: cc.length ? cc : undefined,
        bcc: bcc.length ? bcc : undefined,
        subject,
        ...(format === 'html' ? { html: body } : { text: body }),
      });
      return { sent: true, to, subject, messageId: result?.messageId } as any;
    },
  }),
];
