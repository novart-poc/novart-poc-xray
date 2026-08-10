/**
 * Prepares the JSON report produced by @cucumber/cucumber for the
 * Xray execution import (/api/v2/import/execution/cucumber):
 *
 *  - adds @{{XRAY_EXEC_KEY}} (Test Execution issue) as a tag
 *  - adds @{{XRAY_TEST_KEY}} (Test issue, e.g. KAN-6) as a tag,
 *    if set via env var (optional; if the feature file already
 *    contains the test key as a tag, this is just a safety net)
 *  - makes every error_message single-line, so the Tests panel in
 *    Jira doesn't crash on multi-line stack traces
 *
 * Usage: node scripts/postprocess-cucumber-json.js <path-to-json>
 * Requires env var XRAY_EXEC_KEY (required), XRAY_TEST_KEY (optional)
 */

const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2] || path.join('reports', 'cucumber-report.json');
const execKey = process.env.XRAY_EXEC_KEY;
const testKey = process.env.XRAY_TEST_KEY;

if (!execKey) {
  console.error('Error: env var XRAY_EXEC_KEY is not set.');
  process.exit(1);
}

if (!fs.existsSync(inputPath)) {
  console.error(`Error: file not found: ${inputPath}`);
  process.exit(1);
}

/** @param {string} msg */
function sanitizeErrorMessage(msg) {
  return msg
    .replace(/\r\n/g, ' ')
    .replace(/\n/g, ' | ')
    .replace(/\s+/g, ' ')
    .trim();
}

function ensureTag(tagsArray, tagName) {
  if (!tagsArray.some((t) => t.name === tagName)) {
    tagsArray.push({ name: tagName });
  }
}

const raw = fs.readFileSync(inputPath, 'utf8');
const report = JSON.parse(raw);

let taggedCount = 0;
let sanitizedCount = 0;

for (const feature of report) {
  feature.tags = feature.tags || [];
  ensureTag(feature.tags, `@${execKey}`);
  if (testKey) ensureTag(feature.tags, `@${testKey}`);

  for (const element of feature.elements || []) {
    element.tags = element.tags || [];
    ensureTag(element.tags, `@${execKey}`);
    if (testKey) ensureTag(element.tags, `@${testKey}`);
    taggedCount++;

    for (const step of element.steps || []) {
      if (step.result && typeof step.result.error_message === 'string') {
        const before = step.result.error_message;
        const after = sanitizeErrorMessage(before);
        if (after !== before) sanitizedCount++;
        step.result.error_message = after;
      }
    }
  }
}

fs.writeFileSync(inputPath, JSON.stringify(report, null, 2), 'utf8');

console.log(
  `OK: injected @${execKey}${testKey ? ' and @' + testKey : ''} into ${taggedCount} scenario(s), ` +
    `sanitized ${sanitizedCount} error_message(s) -> ${inputPath}`
);
