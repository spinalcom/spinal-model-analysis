'use strict';
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const ExcelJS = require('exceljs');
const H = require('./helpers');
const { SpinalGraphService, SPINAL_RELATION_PTR_LST_TYPE: PTR_LST } = require('spinal-env-viewer-graph-service');
const { spinalServiceTicket } = require('spinal-service-ticket');
const { attributeService } = require('spinal-env-viewer-plugin-documentation-service');

const algo = (name) => H.mod.ALGORITHM_REGISTRY.get(name);
const rowsOf = (handle, params) => algo('GET_EXCEL_ROWS').run(handle, params);
const day = (y, m, d, hh = 0, mm = 0) => new Date(Date.UTC(y, m - 1, d, hh, mm));

/** A workbook handle, as LOAD_EXCEL returns it, for a workbook built in memory. */
async function workbookHandle(build) {
  const workbook = new ExcelJS.Workbook();
  build(workbook);
  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  const { SpinalExcelFiller } = await import('spinal-service-excel-filler');
  const filler = new SpinalExcelFiller();
  await filler.loadTemplateFromBuffer(buffer);
  return { __excelHandle: true, filler, originalBuffer: buffer, sourceName: 'tickets.xlsx' };
}

// The use case's file: one ticket per line. A notes sheet comes first; the table has an empty
// line, a column without a name (G), and formatted-but-empty lines under it.
function ticketsWorkbook(workbook) {
  workbook.addWorksheet('Notes').getCell('A1').value = 'Import des tickets';
  const sheet = workbook.addWorksheet('Tickets');
  sheet.addRow(['Nom', 'Priorité', 'Description', 'Local', 'Réf. client', 'Date', null, 'Commentaire']);
  sheet.addRow(["Fuite d'eau", 2, "Sous l'évier", 'B-12', 'C-001', day(2026, 10, 28)]);
  sheet.addRow([]);
  sheet.addRow(['Ampoule grillée', 0, 'Couloir', 'B-14', 'C-002', day(2026, 10, 29, 14, 30), 'hors tableau', 'À faire vite']);
  sheet.addRow(['Porte bloquée ', '1', null, 'B-12', 'C-003', null]);
  for (const r of [6, 7, 8]) sheet.getCell(`A${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
}

let handle;
before(async () => {
  handle = await workbookHandle(ticketsWorkbook);
});

describe('GET_EXCEL_ROWS', () => {
  it('reads one object per line, keyed by the header row; empty lines and unnamed columns are left out', async () => {
    assert.deepEqual(await rowsOf(handle, { sheet: 'Tickets' }), [
      { Nom: "Fuite d'eau", Priorité: 2, Description: "Sous l'évier", Local: 'B-12', 'Réf. client': 'C-001', Date: day(2026, 10, 28), Commentaire: null },
      { Nom: 'Ampoule grillée', Priorité: 0, Description: 'Couloir', Local: 'B-14', 'Réf. client': 'C-002', Date: day(2026, 10, 29, 14, 30), Commentaire: 'À faire vite' },
      { Nom: 'Porte bloquée ', Priorité: '1', Description: null, Local: 'B-12', 'Réf. client': 'C-003', Date: null, Commentaire: null },
    ]);
  });

  it('"columns" keeps and renames columns (case-insensitive match); a line empty in those columns is left out', async () => {
    assert.deepEqual(await rowsOf(handle, { sheet: 'Tickets', columns: 'Nom=name, priorité=priority, Local' }), [
      { name: "Fuite d'eau", priority: 2, Local: 'B-12' },
      { name: 'Ampoule grillée', priority: 0, Local: 'B-14' },
      { name: 'Porte bloquée ', priority: '1', Local: 'B-12' },
    ]);
    assert.deepEqual(await rowsOf(handle, { sheet: 'Tickets', columns: 'Commentaire' }), [{ Commentaire: 'À faire vite' }]);
  });

  it('reads the first sheet by default, and a header row below a title with "headerRow"', async () => {
    assert.deepEqual(await rowsOf(handle, {}), []); // "Notes": a header and no line
    const titled = await workbookHandle((workbook) => {
      const sheet = workbook.addWorksheet('Export');
      sheet.addRow(['Export GMAO du 30/10']);
      sheet.addRow(['Nom', 'Local']);
      sheet.addRow(['Fuite', 'B-12']);
    });
    assert.deepEqual(await rowsOf(titled, { headerRow: 2 }), [{ Nom: 'Fuite', Local: 'B-12' }]);
  });

  it('fails clearly on a wrong sheet, column, header row, or two columns under one key', async () => {
    await assert.rejects(() => rowsOf(handle, { sheet: 'Feuil1' }), /no sheet named "Feuil1" \(sheets: Notes, Tickets\)/);
    await assert.rejects(
      () => rowsOf(handle, { sheet: 'Tickets', columns: 'Nom, Statut' }),
      /no column "Statut" in sheet "Tickets" \(columns: Nom, Priorité, Description, Local, Réf\. client, Date, Commentaire\)/
    );
    await assert.rejects(() => rowsOf(handle, { sheet: 'Tickets', headerRow: 3 }), /row 3 of sheet "Tickets" has no column names/);
    await assert.rejects(() => rowsOf(handle, { sheet: 'Tickets', headerRow: 0 }), /"headerRow" must be a row number/);
    await assert.rejects(() => rowsOf(handle, { sheet: 'Tickets', columns: 'Nom=x, Local=x' }), /reads both "Nom" and "Local" as "x"/);
    const twice = await workbookHandle((workbook) => {
      const sheet = workbook.addWorksheet('S');
      sheet.addRow(['Nom', 'Local', 'Nom']);
      sheet.addRow(['a', 'b', 'c']);
    });
    await assert.rejects(() => rowsOf(twice, {}), /columns A and C of sheet "S" are both named "Nom"/);
    assert.deepEqual(await rowsOf(twice, { columns: 'Local' }), [{ Local: 'b' }]);
  });
});

describe('reading a row', () => {
  it('GET_PROPERTY reads a live row: values keep their type, and a header with a dot is read as written', async () => {
    const [row] = await rowsOf(handle, { sheet: 'Tickets' });
    const get = (key) => algo('GET_PROPERTY').run(row, { key });
    assert.equal(await get('Priorité'), 2);
    assert.equal(await get('Réf. client'), 'C-001');
    assert.deepEqual(await get('Date'), day(2026, 10, 28));
    assert.equal(await get('Commentaire'), null);
    assert.equal(await get('Absent'), undefined);
    assert.equal(await algo('GET_PROPERTY').run({ a: { b: 5 } }, { key: 'a.b' }), 5);
  });

  it('GET_PROPERTY on a JSON string still returns strings; a node is refused', async () => {
    assert.equal(await algo('GET_PROPERTY').run('{"a":{"b":5}}', { key: 'a.b' }), '5');
    assert.equal(await algo('GET_PROPERTY').run('{"a":{"b":5}}', { key: 'a' }), '{"b":5}');
    assert.equal(await algo('GET_PROPERTY').run('{"a.b":1}', { key: 'a.b' }), '1');
    await assert.rejects(() => algo('GET_PROPERTY').run(H.createAnchor().node, { key: 'name' }), /use GET_NODE_INFO or GET_ATTRIBUTE/);
  });

  it('LIST_GET reads a live array (a GET_EXCEL_RANGE row) and still a JSON array string', async () => {
    const [row] = await algo('GET_EXCEL_RANGE').run(handle, { ref: 'Tickets!A2:F2' });
    assert.equal(await algo('LIST_GET').run(row, { index: 1 }), 2);
    assert.deepEqual(await algo('LIST_GET').run(row, { index: -1 }), day(2026, 10, 28));
    assert.equal(await algo('LIST_GET').run('[1,2,3]', { index: 1 }), '2');
  });
});

describe('CREATE_TICKET from data', () => {
  const graph = new H.SpinalGraph('excel-tickets');
  const CONTEXT = 'Tickets import';
  const base = { contextName: CONTEXT, processName: 'Plomberie' };
  let contextId;
  let processId;

  const createTicket = (input, params, inputCount) =>
    algo('CREATE_TICKET').run(input, { ...base, ...params }, inputCount ? { inputCount } : undefined);
  const ticketsOf = (node) => node.getChildren(['SpinalSystemServiceTicketHasTicket']);
  const named = async (node, name) => (await ticketsOf(node)).filter((t) => t.getName().get() === name);
  const attributesOf = async (ticket, category = 'default') =>
    Object.fromEntries((await attributeService.getAttributesByCategory(ticket, category)).map((a) => [a.label.get(), a.value.get()]));
  const stepOf = async (ticket) => (await ticket.getParents(['SpinalSystemServiceTicketHasTicket']))
    .find((n) => n.getType().get() === 'SpinalSystemServiceTicketTypeStep').getName().get();

  before(async () => {
    await SpinalGraphService.setGraph(graph);
    const context = await spinalServiceTicket.createContext(CONTEXT, [
      { name: 'Déclaré', color: '#ff0000', order: 0 },
      { name: 'En cours', color: '#ffa500', order: 1 },
      { name: 'Terminé', color: '#00ff00', order: 2 },
    ]);
    SpinalGraphService._addNode(context);
    contextId = context.getId().get();
    processId = await spinalServiceTicket.createProcess('Plomberie', contextId);
  });

  it('LOAD_EXCEL → GET_EXCEL_ROWS → FOREACH(CREATE_TICKET): one ticket per line, created once', async () => {
    const room = H.createAnchor('Bureau 12');
    const node = await H.factory.createFromJSON({
      contextName: 'Ctx excel tickets', analysisName: 'Import tickets', anchorNodeId: room.id, errorPolicy: 'stop',
      executionWorkflow: { blocks: [
        { ref: 'Workbook', algorithmName: 'LOAD_EXCEL', inputs: ['$node'] },
        { ref: 'Rows', algorithmName: 'GET_EXCEL_ROWS', inputs: ['Workbook'],
          parameters: { sheet: 'Tickets', columns: 'Nom=name, Priorité=priority, Description=description, Local, Date' } },
        { ref: 'Tickets', algorithmName: 'FOREACH', inputs: ['Rows'], itemRef: 'row', concurrency: { mode: 'FULL' },
          subWorkflow: { outputRef: 'Ticket', blocks: [
            { ref: 'Ticket', algorithmName: 'CREATE_TICKET', inputs: ['$node', 'row'], parameters: { ...base, ifExists: 'reuse' } },
          ] } },
      ] },
    }, graph);
    const execution = new H.AnalysisExecutionService(H.manager, H.makeRegistry({
      LOAD_EXCEL: H.fakeAlgorithm('LOAD_EXCEL', async () => handle),
    }));
    const run = async () => {
      const { results } = await execution.executeAnalysis(node);
      assert.equal(results.length, 1);
      assert.equal(results[0].success, true, results[0].error);
    };

    await run();
    const tickets = await ticketsOf(room.node);
    assert.deepEqual(tickets.map((t) => t.getName().get()).sort(), ['Ampoule grillée', "Fuite d'eau", 'Porte bloquée']);
    const byName = Object.fromEntries(await Promise.all(tickets.map(async (t) => [t.getName().get(), t])));
    for (const ticket of tickets) assert.equal(await stepOf(ticket), 'Déclaré');

    const leak = await attributesOf(byName["Fuite d'eau"]);
    assert.equal(leak.name, "Fuite d'eau");
    assert.equal(leak.priority, '2');
    assert.equal(leak.description, "Sous l'évier");
    assert.equal(leak.Local, 'B-12');
    assert.equal(leak.Date, '2026-10-28');
    assert.equal(leak.processId, processId);
    assert.equal((await attributesOf(byName['Ampoule grillée'])).Date, '2026-10-29 14:30', 'as written in the file');
    const door = await attributesOf(byName['Porte bloquée']);
    assert.equal(door.priority, '1');
    assert.equal('description' in door || 'Date' in door, false, 'empty cells are not written');

    // Running again creates nothing — also once a ticket has moved on to another step.
    await spinalServiceTicket.moveTicketToNextStep(contextId, processId, byName["Fuite d'eau"].getId().get());
    await run();
    assert.equal((await ticketsOf(room.node)).length, 3);
    assert.equal(await stepOf(byName["Fuite d'eau"]), 'En cours');
  });

  it('a line can name the node its ticket goes to: FILTER the candidates by name inside the FOREACH', async () => {
    const building = H.createAnchor('Bâtiment B');
    const rooms = {};
    for (const name of ['B-12', 'B-14', 'B-16']) {
      rooms[name] = H.createAnchor(name).node;
      await building.node.addChild(rooms[name], 'hasGeographicRoom', PTR_LST);
    }
    const lines = await workbookHandle((workbook) => {
      const sheet = workbook.addWorksheet('Tickets');
      for (const line of [['Nom', 'Local'], ["Fuite d'eau", 'B-12'], ['Ampoule', 'B-14'], ['Porte', 'B-12'], ['Inconnu', 'Z-99']]) {
        sheet.addRow(line);
      }
    });
    const node = await H.factory.createFromJSON({
      contextName: 'Ctx excel tickets', analysisName: 'Import by room', anchorNodeId: building.id,
      executionWorkflow: { blocks: [
        { ref: 'Workbook', algorithmName: 'LOAD_EXCEL', inputs: ['$node'] },
        { ref: 'Rows', algorithmName: 'GET_EXCEL_ROWS', inputs: ['Workbook'], parameters: { columns: 'Nom=name, Local' } },
        { ref: 'Rooms', algorithmName: 'GET_NODE_CHILDREN', inputs: ['$node'], parameters: { regex: 'hasGeographicRoom' } },
        { ref: 'Tickets', algorithmName: 'FOREACH', inputs: ['Rows'], itemRef: 'row', subWorkflow: { outputRef: 'Ticket', blocks: [
          { ref: 'Wanted', algorithmName: 'GET_PROPERTY', inputs: ['row'], parameters: { key: 'Local' } },
          { ref: 'Matches', algorithmName: 'FILTER', inputs: ['Rooms'], itemRef: 'room', subWorkflow: { outputRef: 'Same name', blocks: [
            { ref: 'Room name', algorithmName: 'GET_NODE_INFO', inputs: ['room'], parameters: { property: 'name' } },
            { ref: 'Same name', algorithmName: 'EQUALS', inputs: ['Room name', 'Wanted'] },
          ] } },
          { ref: 'Target', algorithmName: 'FIRST_NODE', inputs: ['Matches'] },
          { ref: 'Ticket', algorithmName: 'CREATE_TICKET', inputs: ['Target', 'row'], parameters: { ...base, ifExists: 'reuse' } },
        ] } },
      ] },
    }, graph);
    const execution = new H.AnalysisExecutionService(H.manager, H.makeRegistry({
      LOAD_EXCEL: H.fakeAlgorithm('LOAD_EXCEL', async () => lines),
    }));
    const [result] = (await execution.executeAnalysis(node)).results;

    // The line naming an unknown room fails alone; the other lines go on (errorPolicy "continue").
    assert.deepEqual(result.blockFailures.map((f) => [f.blockName, f.reason]), [['Target', 'error'], ['Ticket', 'skipped']]);
    const names = async (room) => (await ticketsOf(room)).map((t) => t.getName().get()).sort();
    assert.deepEqual(await names(rooms['B-12']), ["Fuite d'eau", 'Porte']);
    assert.deepEqual(await names(rooms['B-14']), ['Ampoule']);
    assert.deepEqual(await names(rooms['B-16']), []);
  });

  it('takes a name alone as the ticket input, or puts the extra keys in another category', async () => {
    const room = H.createAnchor('Bureau 14');
    const visit = await createTicket([room.node, 'Contrôle annuel'], { priority: '1', description: 'Visite' }, 2);
    assert.deepEqual(
      (({ name, priority, description }) => ({ name, priority, description }))(await attributesOf(visit)),
      { name: 'Contrôle annuel', priority: '1', description: 'Visite' }
    );

    const roof = await createTicket(
      [room.node, { name: 'Fuite toiture', Local: 'Toit', Date: day(2026, 11, 2) }],
      { attributesCategory: 'Import Excel' },
      2
    );
    assert.equal('Local' in (await attributesOf(roof)), false);
    assert.deepEqual(await attributesOf(roof, 'Import Excel'), { Local: 'Toit', Date: '2026-11-02' });
  });

  it('ifExists: "allow" (default) creates again, "reuse" once even in parallel, "error" refuses', async () => {
    const room = H.createAnchor('Bureau 16');
    await createTicket(room.node, { name: 'Alarme CTA' });
    await createTicket(room.node, { name: 'Alarme CTA' });
    assert.equal((await named(room.node, 'Alarme CTA')).length, 2);

    const parallel = await Promise.all([1, 2, 3, 4, 5].map(() => createTicket([room.node, 'Fuite'], { ifExists: 'reuse' }, 2)));
    assert.equal(new Set(parallel.map((t) => t.getId().get())).size, 1);
    assert.equal((await named(room.node, 'Fuite')).length, 1);

    await assert.rejects(
      () => createTicket([room.node, 'Fuite'], { ifExists: 'error' }, 2),
      /"Bureau 16" already has a ticket "Fuite" in process "Plomberie"/
    );
  });

  it('fails clearly on a bad priority, a key the ticket service owns, no name, or a list of nodes', async () => {
    const room = H.createAnchor('Bureau 18');
    await assert.rejects(
      () => createTicket([room.node, { name: 'X', priority: 5 }], {}, 2),
      /priority must be 0 \(occasionally\), 1 \(normal\) or 2 \(urgent\), got 5/
    );
    await assert.rejects(() => createTicket([room.node, { name: 'X', stepId: 's1' }], {}, 2), /"stepId" is written by the ticket service/);
    await assert.rejects(() => createTicket([room.node, { Nom: 'X' }], {}, 2), /needs a name/);
    await assert.rejects(() => createTicket([room.node, H.createAnchor().node], { name: 'X' }), /expects ONE node, got a list/);
    await assert.rejects(() => createTicket([room.node, 'a', 'b'], {}, 3), /at most 2 inputs/);
    assert.equal((await ticketsOf(room.node)).length, 0);
  });
});

describe('SET_ATTRIBUTE', () => {
  it('stores a date (e.g. an Excel date cell) as ISO text', async () => {
    const room = H.createAnchor('Local technique');
    await algo('SET_ATTRIBUTE').run([room.node, day(2026, 10, 28)], { categoryName: 'Infos', label: 'Mise en service' });
    const [attribute] = await attributeService.getAttributesByCategory(room.node, 'Infos');
    assert.equal(attribute.value.get(), '2026-10-28');
  });
});
