'use strict';
/**
 * Generates the block reference of the "spinal-analysis-workflow" skill from the built module, so
 * what an assistant reads about the blocks is always what the module runs:
 *
 *   .claude/skills/spinal-analysis-workflow/reference/blocks.md         one line per block
 *   .claude/skills/spinal-analysis-workflow/reference/blocks/<CAT>.md   every block of a category, in full
 *
 * Run by `npm run build` (after tsc). Never edit the generated files by hand.
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, '.claude', 'skills', 'spinal-analysis-workflow', 'reference');
const { getAlgorithmCatalog, VERSION } = require(path.join(ROOT, 'dist'));

const english = getAlgorithmCatalog('en');
const french = getAlgorithmCatalog('fr');
const frenchLabel = new Map(Object.values(french.algorithms).flat().map((block) => [block.name, block.label]));

const GENERATED = '<!-- Generated from the module by scripts/build-skill-reference.cjs (npm run build). Do not edit. -->';

/** The first sentence of a description, as the one-line summary of the index. */
const summary = (description) => {
  const text = description.replace(/\s+/g, ' ').trim();
  const end = text.search(/[.!?](\s|$)/);
  const sentence = end === -1 ? text : text.slice(0, end + 1);
  return sentence.length > 200 ? `${sentence.slice(0, 197)}…` : sentence;
};

const inputSignature = (input) =>
  `${input.variadic ? '...' : ''}${input.name}${input.required === false ? '?' : ''}: ${input.types.join(' | ')}`;

const signature = (block) => `(${block.inputs.map(inputSignature).join(', ')}) → ${block.outputType}`;

const parameterNames = (block) =>
  block.parameters.map((parameter) => `${parameter.name}${parameter.required ? '*' : ''}`).join(', ');

const parameterDetail = (parameter) => {
  const facts = [parameter.type, parameter.required ? 'required' : 'optional'];
  if (parameter.options) facts.push(`one of ${parameter.options.map((option) => JSON.stringify(option)).join(', ')}`);
  if (parameter.default !== undefined) facts.push(`default ${JSON.stringify(parameter.default)}`);
  return `- \`${parameter.name}\` (${facts.join(', ')}) — ${parameter.description}`;
};

const blockDetail = (block) => [
  `## ${block.name}`,
  '',
  `${block.label} · French label in the builder: « ${frenchLabel.get(block.name) ?? block.label} »`,
  '',
  `\`${block.name}${signature(block)}\``,
  '',
  block.description,
  '',
  ...(block.inputs.length > 0
    ? [
      'Inputs, in this order:',
      ...block.inputs.map((input, index) =>
        `${index + 1}. \`${input.name}\` (${input.types.join(' | ')}${input.required === false ? ', optional' : ''}` +
        `${input.variadic ? ', one or more' : ''}) — ${input.description}`),
    ]
    : ['Inputs: none.']),
  '',
  ...(block.parameters.length > 0 ? ['Parameters:', ...block.parameters.map(parameterDetail)] : ['Parameters: none.']),
  '',
].join('\n');

const index = [
  GENERATED,
  '# Blocks — index',
  '',
  `${english.count} blocks, from spinal-model-analysis ${VERSION}. One line each: \`NAME(inputs) → output\` · parameters (\`*\` = required) — what it does.`,
  'An input marked `?` is optional, `...` takes one or more. Read `blocks/<CATEGORY>.md` for the full description,',
  'the parameter choices and defaults of the blocks you use — block and parameter names must match exactly.',
  '',
];
fs.rmSync(path.join(OUT, 'blocks'), { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'blocks'), { recursive: true });

for (const category of english.categories) {
  const blocks = english.algorithms[category.id];
  index.push(`## ${category.label} — \`blocks/${category.id}.md\``, '', category.description, '');
  for (const block of blocks) {
    const parameters = parameterNames(block);
    index.push(`- \`${block.name}${signature(block)}\`${parameters ? ` · ${parameters}` : ''} — ${summary(block.description)}`);
  }
  index.push('');
  fs.writeFileSync(
    path.join(OUT, 'blocks', `${category.id}.md`),
    [GENERATED, `# ${category.label} (${category.id})`, '', category.description, '', ...blocks.map(blockDetail)].join('\n')
  );
}
fs.writeFileSync(path.join(OUT, 'blocks.md'), index.join('\n'));
console.log(`skill reference: ${english.count} blocks in ${english.categories.length} categories → ${path.relative(ROOT, OUT)}`);
