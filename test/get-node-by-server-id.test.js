'use strict';
const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const H = require('./helpers');
const { SpinalGraphService } = require('spinal-env-viewer-graph-service');
const { FileSystem, Lst } = require('spinal-core-connectorjs_type');

const algo = (name) => H.mod.ALGORITHM_REGISTRY.get(name);
const makeNode = (name, type) => SpinalGraphService.getRealNode(SpinalGraphService.createNode({ name, type }, undefined));
const byServerId = (input, params) => algo('GET_NODE_BY_SERVER_ID').run(input, params);

// No hub in tests: a model "already loaded" is put in the connector's object table by hand, and
// the hub is a stand-in connection whose load_ptr answers from `hub`.
const planted = [];
const plant = (serverId, model) => {
  FileSystem._objects[serverId] = model;
  planted.push(serverId);
};
const realGetInst = FileSystem.get_inst;
const useHub = (hub) => {
  const asked = [];
  FileSystem.get_inst = () => ({
    load_ptr: (serverId, callback) => {
      asked.push(serverId);
      setImmediate(() => callback(hub[serverId]));
    },
  });
  return asked;
};
afterEach(() => {
  planted.splice(0).forEach((serverId) => delete FileSystem._objects[serverId]);
  FileSystem.get_inst = realGetInst;
});

describe('GET_NODE_BY_SERVER_ID', () => {
  it('returns a node this process already holds, without asking the hub', async () => {
    const room = makeNode('Bureau 12', 'geographicRoom');
    plant(990001, room);
    const asked = useHub({});
    assert.equal(await byServerId(undefined, { serverId: 990001 }), room);
    assert.deepEqual(asked, []);
  });

  it('loads any other node from the hub, and registers it for the blocks that read nodes by id', async () => {
    const remote = makeNode('Étage 3', 'geographicFloor');
    delete SpinalGraphService.nodes[remote.getId().get()]; // as a node another process created
    assert.equal(SpinalGraphService.getRealNode(remote.getId().get()), undefined);
    const asked = useHub({ 990002: remote });
    assert.equal(await byServerId(undefined, { serverId: 990002 }), remote);
    assert.deepEqual(asked, [990002]);
    assert.equal(SpinalGraphService.getRealNode(remote.getId().get()), remote);
  });

  it('a wired id (number or numeric text, e.g. an Excel cell) overrides the parameter', async () => {
    const wired = makeNode('Wired', 'geographicRoom');
    plant(990003, wired);
    plant(990004, makeNode('Param', 'geographicRoom'));
    assert.equal(await byServerId(' 990003 ', { serverId: 990004 }), wired);
    assert.equal(await byServerId(990003, {}), wired);
  });

  it('an unknown id fails, or gives null with ifNotFound "null"', async () => {
    useHub({});
    await assert.rejects(byServerId(undefined, { serverId: 990005 }), /no node with server id 990005/);
    assert.equal(await byServerId(undefined, { serverId: 990005, ifNotFound: 'null' }), null);
  });

  it('an id that is not a node fails, whatever ifNotFound says', async () => {
    plant(990006, new Lst());
    await assert.rejects(byServerId(undefined, { serverId: 990006, ifNotFound: 'null' }), /990006 is a Lst, not a node/);
  });

  it('fails clearly without an id, with something that is not an id, or with no hub connection', async () => {
    await assert.rejects(byServerId(undefined, {}), /needs a server id/);
    await assert.rejects(byServerId('B1-02', {}), /"B1-02" is not a server id/);
    await assert.rejects(byServerId(undefined, { serverId: -3 }), /is not a server id/);
    await assert.rejects(byServerId([990001, 990002], {}), /a list — use a FOREACH/);
    FileSystem.get_inst = () => undefined;
    await assert.rejects(byServerId(undefined, { serverId: 990007 }), /no hub connection/);
  });
});
