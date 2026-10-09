'use strict';
const { describe, it, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const H = require('./helpers');
const { SpinalGraphService } = require('spinal-env-viewer-graph-service');

const MAIL_ENV = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_EMAIL', 'SMTP_PASS', 'SMTP_NAME', 'MAIL_FROM', 'MAIL_MAX_PER_MINUTE'];
const savedEnv = Object.fromEntries(MAIL_ENV.map((key) => [key, process.env[key]]));
const clearMailEnv = () => MAIL_ENV.forEach((key) => delete process.env[key]);

// Every mail goes to this capture instead of SMTP.
const sent = [];
const capture = async (message) => {
  sent.push(message);
  return { messageId: `<m${sent.length}@test>` };
};
beforeEach(() => {
  clearMailEnv();
  sent.length = 0;
  H.mod.setMailSender(capture);
});
after(() => {
  H.mod.setMailSender();
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

/** Runs SEND_MAIL as the engine does: `inputCount` = how many inputs are wired. */
const send = (input, params, inputCount = 1) => H.mod.ALGORITHM_REGISTRY.get('SEND_MAIL').run(input, params, { inputCount });
const template = { subject: 'Ticket {0}', body: 'Le ticket {0} est passé à l\'étape {1}.' };

describe('SEND_MAIL', () => {
  it('sends to the recipient, with the values wired after it filled into subject and body', async () => {
    const result = await send(['jane@corp.com', 'T-42', 'En cours'], template, 3);
    assert.deepEqual(result, { sent: true, to: ['jane@corp.com'], subject: 'Ticket T-42', messageId: '<m1@test>' });
    assert.deepEqual(sent, [{
      to: ['jane@corp.com'], cc: undefined, bcc: undefined,
      subject: 'Ticket T-42', text: 'Le ticket T-42 est passé à l\'étape En cours.',
    }]);
  });

  it('recipients: a lone list of addresses, "," / ";" separators, de-duplication, cc / bcc', async () => {
    // One wired input that is a list: all of it is recipients — not [to, value].
    await send(['a@corp.com', 'b@corp.com; A@CORP.com'], { subject: 's', body: 'b' }, 1);
    await send('c@corp.com', { subject: 's', body: 'b', cc: 'd@corp.com, e@corp.com', bcc: 'f@corp.com' });
    assert.deepEqual(sent[0].to, ['a@corp.com', 'b@corp.com']);
    assert.deepEqual([sent[1].cc, sent[1].bcc], [['d@corp.com', 'e@corp.com'], ['f@corp.com']]);
  });

  it('refuses a missing or invalid recipient, without sending', async () => {
    await assert.rejects(() => send(null, template), /no recipient — the "to" input is empty/);
    await assert.rejects(() => send('  ', template), /no recipient/);
    await assert.rejects(() => send('not-an-address', template), /invalid address "not-an-address" in "to"/);
    await assert.rejects(() => send('a@corp.com', { ...template, cc: 'oops' }), /invalid address "oops" in "cc"/);
    assert.equal(sent.length, 0);
  });

  it('html: inserted values are escaped in the body; the subject stays plain text on one line', async () => {
    await send(['jane@corp.com', '<b>R&D</b>', 'x\nBcc: evil@corp.com'], { subject: 'Re {0} {1}', body: '<p>{0}</p>', format: 'html' }, 3);
    assert.equal(sent[0].html, '<p>&lt;b&gt;R&amp;D&lt;/b&gt;</p>');
    assert.equal(sent[0].text, undefined);
    assert.equal(sent[0].subject, 'Re <b>R&D</b> x Bcc: evil@corp.com', 'no header injection through a value');
    await assert.rejects(() => send('a@corp.com', { ...template, format: 'pdf' }), /"format" must be "text" or "html"/);
  });

  it('values: nodes by name, models by value; a placeholder without a value fails', async () => {
    const ticket = SpinalGraphService.getRealNode(SpinalGraphService.createNode({ name: 'Ticket 7', type: 'SpinalSystemServiceTicket' }, undefined));
    await send(['jane@corp.com', ticket, { get: () => 'Clôturé' }], template, 3);
    assert.equal(sent[0].text, 'Le ticket Ticket 7 est passé à l\'étape Clôturé.');
    await assert.rejects(() => send(['jane@corp.com', 'T-1'], template, 2), /"body" uses \{1\} but only 1 value input\(s\) are wired/);
  });

  it('dryRun builds the mail without sending it', async () => {
    const result = await send(['jane@corp.com', 'T-42', 'En cours'], { ...template, dryRun: true }, 3);
    assert.equal(result.sent, false);
    assert.equal(result.text, 'Le ticket T-42 est passé à l\'étape En cours.');
    assert.equal(sent.length, 0);
  });

  it('MAIL_MAX_PER_MINUTE caps the sends of the process; 0 removes the cap', async () => {
    process.env.MAIL_MAX_PER_MINUTE = '2';
    await send('a@corp.com', { subject: 's', body: 'b' });
    await send('a@corp.com', { subject: 's', body: 'b' });
    await assert.rejects(() => send('a@corp.com', { subject: 's', body: 'b' }), /already sent 2 mails in the last minute/);
    assert.equal(sent.length, 2);
    process.env.MAIL_MAX_PER_MINUTE = '0';
    for (let i = 0; i < 5; i++) await send('a@corp.com', { subject: 's', body: 'b' });
    assert.equal(sent.length, 7);
  });

  it('over SMTP: a clear error for missing configuration, then for the missing package', async () => {
    H.mod.setMailSender(); // back to SMTP
    const plain = { subject: 's', body: 'b' };
    await assert.rejects(() => send('a@corp.com', plain), /Mail is not configured on this organ: set SMTP_HOST and SMTP_PORT/);
    Object.assign(process.env, { SMTP_HOST: 'smtp.corp.com', SMTP_PORT: '587', SMTP_EMAIL: 'bot@corp.com' });
    await assert.rejects(() => send('a@corp.com', plain), /set both SMTP_EMAIL and SMTP_PASS, or neither/);
    delete process.env.SMTP_EMAIL;
    await assert.rejects(() => send('a@corp.com', plain), /set MAIL_FROM/);
    process.env.MAIL_FROM = 'no-reply@corp.com';
    // Not installed in this repo — exactly the situation of an organ that lacks it.
    await assert.rejects(() => send('a@corp.com', plain), /"spinal-service-mailer" package is not installed in this organ/);
  });
});

describe('SEND_MAIL in an analytic — notify the person on the ticket', () => {
  const graph = new H.SpinalGraph('mail');
  const executor = H.makeExecutor(H.makeRegistry({}));
  const config = {
    contextName: 'Ctx mail',
    analysisName: 'Notify ticket step change',
    executionWorkflow: { blocks: [
      { ref: 'Recipient', algorithmName: 'GET_NODE_INFO', inputs: ['$node'], parameters: { property: 'email' } },
      { ref: 'Ticket name', algorithmName: 'GET_NODE_INFO', inputs: ['$node'] },
      { ref: 'Notify', algorithmName: 'SEND_MAIL', inputs: ['Recipient', 'Ticket name'],
        parameters: { subject: 'Ticket {0}', body: 'Bonjour, votre ticket {0} a changé d\'étape.' } },
    ] },
  };
  const ticket = (info) => SpinalGraphService.getRealNode(SpinalGraphService.createNode({ type: 'SpinalSystemServiceTicket', ...info }, undefined));

  it('mails the address read from the ticket', async () => {
    const { dag } = await H.createAndLoad(config, graph);
    const ctx = await H.runDag(executor, dag, { workNode: ticket({ name: 'Fuite salle 12', email: 'jane@corp.com' }), errorPolicy: 'continue' });
    assert.deepEqual(ctx.failures, []);
    assert.deepEqual(sent.map((m) => [m.to, m.subject, m.text]), [
      [['jane@corp.com'], 'Ticket Fuite salle 12', 'Bonjour, votre ticket Fuite salle 12 a changé d\'étape.'],
    ]);
  });

  it('a ticket without an address is reported as a block failure, and nothing is sent', async () => {
    const { dag } = await H.createAndLoad({ ...config, analysisName: 'Notify (no address)' }, graph);
    const ctx = await H.runDag(executor, dag, { workNode: ticket({ name: 'Sans contact' }), errorPolicy: 'continue' });
    assert.deepEqual(ctx.failures.map((f) => [f.algorithmName, f.reason]), [['SEND_MAIL', 'error']]);
    assert.match(ctx.failures[0].error, /no recipient/);
    assert.equal(sent.length, 0);
  });
});
