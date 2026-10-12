/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Outgoing mail, used by the SEND_MAIL block.
 *
 * The mail account is the ORGAN's, read from its environment — never part of an analytic: SMTP
 * credentials must not live in the graph, and the sender (the company no-reply address) is not
 * something an analytic gets to change. Same variables as the other SpinalCom organs that send
 * mail (spinal-organ-cnp-report):
 *
 *   SMTP_HOST, SMTP_PORT     required
 *   SMTP_SECURE              optional "true" / "false" (default: true on port 465)
 *   SMTP_EMAIL, SMTP_PASS    optional — leave both unset for an IP-authenticated relay
 *                            (e.g. Google Workspace smtp-relay)
 *   SMTP_NAME                optional hostname sent in EHLO (some relays require it)
 *   MAIL_FROM                the sender, e.g. no-reply@company.com (defaults to SMTP_EMAIL;
 *                            required with a relay)
 *   MAIL_MAX_PER_MINUTE      optional safety cap for this process (default 60, 0 = no cap)
 *
 * Sending goes through spinal-service-mailer, which must be installed in the organ. It ships as
 * ESM, so it is loaded with a native dynamic import, lazily and once (see excel.algorithms.ts).
 */

export interface MailMessage {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text?: string;
  html?: string;
}

export interface MailSendResult {
  messageId?: string;
}

export type MailSender = (message: MailMessage) => Promise<MailSendResult>;

const DEFAULT_MAX_PER_MINUTE = 60;

const _importESM = new Function('specifier', 'return import(specifier);') as (
  specifier: string
) => Promise<any>;

let customSender: MailSender | undefined;
let smtpSenderPromise: Promise<MailSender> | null = null;
let recentSends: number[] = [];

/**
 * Replaces the SMTP transport — for tests, or an organ that delivers mail another way. Call it
 * with no argument to go back to SMTP, rebuilt from the current environment. Either way the
 * per-minute counter starts fresh.
 */
export function setMailSender(sender?: MailSender): void {
  customSender = sender;
  smtpSenderPromise = null;
  recentSends = [];
}

function readSmtpConfig() {
  const env = process.env;
  const host = env.SMTP_HOST?.trim();
  const port = Number(env.SMTP_PORT);
  if (!host || !Number.isFinite(port) || port <= 0) {
    throw new Error(
      'Mail is not configured on this organ: set SMTP_HOST and SMTP_PORT, MAIL_FROM, and ' +
      'SMTP_EMAIL / SMTP_PASS unless the SMTP server is an IP-authenticated relay'
    );
  }
  const user = env.SMTP_EMAIL?.trim();
  const pass = env.SMTP_PASS;
  if (Boolean(user) !== Boolean(pass)) {
    throw new Error('Mail configuration: set both SMTP_EMAIL and SMTP_PASS, or neither (IP-authenticated relay)');
  }
  const from = env.MAIL_FROM?.trim() || user;
  if (!from) throw new Error('Mail configuration: set MAIL_FROM, the sender address (e.g. the no-reply address)');
  const secure = env.SMTP_SECURE?.trim().toLowerCase();
  return {
    host,
    port,
    secure: secure ? secure === 'true' : undefined,
    auth: user ? { user, pass: pass as string } : false,
    name: env.SMTP_NAME?.trim() || undefined,
    defaultFrom: from,
  };
}

async function getSmtpSender(): Promise<MailSender> {
  if (!smtpSenderPromise) {
    const pending = (async (): Promise<MailSender> => {
      const config = readSmtpConfig();
      let mailerModule: any;
      try {
        mailerModule = await _importESM('spinal-service-mailer');
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        throw new Error(`Mail: the "spinal-service-mailer" package is not installed in this organ (${reason})`);
      }
      const SpinalMailer = mailerModule?.SpinalMailer ?? mailerModule?.default?.SpinalMailer;
      if (typeof SpinalMailer !== 'function') {
        throw new Error('Mail: could not load SpinalMailer from "spinal-service-mailer" (unexpected module shape)');
      }
      const mailer = new SpinalMailer(config);
      return async (message) => {
        try {
          return await mailer.send(message);
        } catch (error) {
          throw explainSmtpRefusal(error, config.host, Boolean(config.auth));
        }
      };
    })();
    // A failed setup (missing config or package) is not cached: it is retried on the next mail.
    pending.catch(() => {
      if (smtpSenderPromise === pending) smtpSenderPromise = null;
    });
    smtpSenderPromise = pending;
  }
  return smtpSenderPromise;
}

/**
 * The two refusals a misconfigured account gets, rewritten with the fix. Raw SMTP replies (e.g.
 * "530-5.7.0 Authentication Required") don't say that the cause is the organ's configuration.
 */
function explainSmtpRefusal(error: unknown, host: string, hasLogin: boolean): unknown {
  const reply = error instanceof Error ? error.message : String(error);
  const code = (error as { responseCode?: number })?.responseCode;
  if (!hasLogin && (code === 530 || /authentication required/i.test(reply))) {
    return new Error(
      `Mail: ${host} requires a login and none is configured. Either set SMTP_EMAIL and SMTP_PASS (an account ` +
      `of that server), or use an IP-authenticated relay that accepts this organ's IP — for the company ` +
      `no-reply on Google Workspace: SMTP_HOST=smtp-relay.gmail.com. Server reply: ${reply}`
    );
  }
  if (/relay denied|invalid credentials for relay/i.test(reply)) {
    return new Error(
      `Mail: ${host} refused to relay for this organ — its public IP is not allowed, or MAIL_FROM is not an ` +
      `address of the allowed domains. On Google Workspace: Admin console → Apps → Google Workspace → Gmail → ` +
      `Routing → SMTP relay service. Server reply: ${reply}`
    );
  }
  return error;
}

/** Counts a send against MAIL_MAX_PER_MINUTE (sliding minute); throws when the cap is reached. */
function takeSendSlot(now = Date.now()): void {
  const raw = process.env.MAIL_MAX_PER_MINUTE?.trim();
  const parsed = raw ? Number(raw) : DEFAULT_MAX_PER_MINUTE;
  const max = Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : DEFAULT_MAX_PER_MINUTE;
  if (max === 0) return;
  recentSends = recentSends.filter((sentAt) => now - sentAt < 60_000);
  if (recentSends.length >= max) {
    throw new Error(
      `Mail: this organ already sent ${max} mails in the last minute (MAIL_MAX_PER_MINUTE) — this one was not sent`
    );
  }
  recentSends.push(now);
}

/** Sends a mail from the organ's account (see the header for the configuration). */
export async function sendMail(message: MailMessage): Promise<MailSendResult> {
  const sender = customSender ?? (await getSmtpSender());
  takeSendSlot();
  return sender(message);
}
