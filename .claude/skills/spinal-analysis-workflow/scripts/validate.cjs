#!/usr/bin/env node
'use strict';
/**
 * Checks an analytic config with the module itself — the same checks the builder runs on save —
 * plus a few warnings the module leaves to run time.
 *
 *   node validate.cjs <config.json> [more.json …]
 *
 * Exit code 0 when every file is valid (warnings allowed), 1 otherwise, 2 when the module cannot
 * be found. The module is looked up in $SPINAL_MODEL_ANALYSIS, then in the folders above this
 * script (the skill ships inside the module's repository), then from the current directory.
 */
const fs = require('node:fs');
const path = require('node:path');

function findModule() {
  const candidates = [];
  if (process.env.SPINAL_MODEL_ANALYSIS) candidates.push(path.resolve(process.env.SPINAL_MODEL_ANALYSIS));
  for (let dir = __dirname; dir !== path.dirname(dir); dir = path.dirname(dir)) {
    const manifest = path.join(dir, 'package.json');
    if (fs.existsSync(manifest) && JSON.parse(fs.readFileSync(manifest, 'utf8')).name === 'spinal-model-analysis') {
      candidates.push(dir);
      break;
    }
  }
  try {
    candidates.push(path.dirname(require.resolve('spinal-model-analysis/package.json', { paths: [process.cwd()] })));
  } catch {
    // not installed from the current directory
  }
  return candidates.find((dir) => fs.existsSync(path.join(dir, 'dist', 'index.js')));
}

const moduleDir = findModule();
if (!moduleDir) {
  console.error(
    'spinal-model-analysis (built) was not found: set SPINAL_MODEL_ANALYSIS to its folder, or run this from a ' +
    'project that depends on it. Without it, load the config in the builder and save: it lists the same errors.'
  );
  process.exit(2);
}

// The module logs while it loads and validates; keep the output to the verdict.
const log = console.log;
for (const level of ['log', 'warn', 'info']) console[level] = () => undefined;
const analysis = require(path.join(moduleDir, 'dist'));
const registry = analysis.ALGORITHM_REGISTRY;

const CONTAINERS = ['subWorkflow', 'thenWorkflow', 'elseWorkflow'];

/** Every block of a workflow, containers included, with its path. */
function* walk(blocks, at) {
  for (const block of Array.isArray(blocks) ? blocks : []) {
    const where = `${at}.${block.ref}`;
    yield [block, where];
    for (const key of CONTAINERS) if (block[key]) yield* walk(block[key].blocks, `${where}.${key}`);
  }
}

function warningsOf(config) {
  const warnings = [];
  const registers = new Set();
  for (const [block] of walk(config.inputWorkflow?.blocks, 'inputWorkflow')) if (block.registerAs) registers.add(block.registerAs);

  for (const name of ['worknodeResolver', 'inputWorkflow', 'executionWorkflow']) {
    for (const [block, where] of walk(config[name]?.blocks, name)) {
      if (!registry.has(block.algorithmName)) continue;
      const definition = registry.get(block.algorithmName);
      const wired = (block.inputs ?? []).length;
      const required = definition.inputs.filter((input) => input.required !== false).length;
      const variadic = definition.inputs.some((input) => input.variadic);
      const names = definition.inputs.map((input) => input.name).join(', ') || 'none';
      if (wired < required) warnings.push(`${where}: ${block.algorithmName} needs ${required} input(s) (${names}), ${wired} wired`);
      if (!variadic && wired > definition.inputs.length) {
        warnings.push(`${where}: ${block.algorithmName} takes ${definition.inputs.length} input(s) (${names}), ${wired} wired`);
      }
      if (block.algorithmName === 'FETCH_INPUT_REGISTER' && !registers.has(String(block.parameters?.registerName))) {
        warnings.push(`${where}: register "${block.parameters?.registerName}" is never set — no inputWorkflow block has "registerAs": "${block.parameters?.registerName}"`);
      }
      if (block.registerAs && name !== 'inputWorkflow') warnings.push(`${where}: "registerAs" only works in the inputWorkflow`);
    }
  }
  for (const [index, trigger] of (config.triggers ?? []).entries()) {
    if (trigger.type === 'COV' && !registers.has(trigger.inputRegister)) {
      warnings.push(`triggers[${index}]: COV watches register "${trigger.inputRegister}", which no inputWorkflow block sets ("registerAs")`);
    }
  }
  // The work nodes are the output of the resolver's last block: the one nothing depends on.
  const resolver = config.worknodeResolver?.blocks ?? [];
  const used = new Set(resolver.flatMap((block) => [...(block.inputs ?? []), ...(block.after ?? [])]));
  const leaves = resolver.filter((block) => !used.has(block.ref));
  if (leaves.length > 1) {
    warnings.push(`worknodeResolver: ${leaves.length} blocks are used by no other (${leaves.map((block) => block.ref).join(', ')}) — exactly one must be last: its output is the list of work nodes`);
  }
  if (!config.triggers?.length) warnings.push('no trigger: the analytic only runs when it is executed by hand');
  if (!config.anchorNodeId) warnings.push('no "anchorNodeId": the entity the analytic starts from must be chosen in the builder before saving');
  return warnings;
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('usage: node validate.cjs <config.json> [more.json …]');
  process.exit(2);
}

let failed = false;
for (const file of files) {
  let config;
  try {
    config = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    log(`✖ ${file}: not valid JSON — ${error.message}`);
    failed = true;
    continue;
  }
  const errors = analysis.spinalAnalysisFactoryService.validateConfig(config);
  const warnings = warningsOf(config);
  log(`${errors.length ? '✖' : '✔'} ${file}: ${errors.length} error(s), ${warnings.length} warning(s)`);
  for (const error of errors) log(`  error   ${error}`);
  for (const warning of warnings) log(`  warning ${warning}`);
  if (errors.length) failed = true;
}
process.exit(failed ? 1 : 0);
