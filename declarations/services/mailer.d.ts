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
/**
 * Replaces the SMTP transport — for tests, or an organ that delivers mail another way. Call it
 * with no argument to go back to SMTP, rebuilt from the current environment. Either way the
 * per-minute counter starts fresh.
 */
export declare function setMailSender(sender?: MailSender): void;
/** Sends a mail from the organ's account (see the header for the configuration). */
export declare function sendMail(message: MailMessage): Promise<MailSendResult>;
