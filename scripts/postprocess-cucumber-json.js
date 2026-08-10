/**
 * Bereitet den von @cucumber/cucumber erzeugten JSON-Report fuer den
 * Xray-Execution-Import auf (/api/v2/import/execution/cucumber):
 *
 *  - fuegt @{{XRAY_EXEC_KEY}} (Test Execution Issue) als Tag ein
 *  - fuegt @{{XRAY_TEST_KEY}} (Test Issue, z.B. KAN-6) als Tag ein,
 *    falls per Env-Var gesetzt (optional, falls das Feature-File den
 *    Test-Key bereits selbst als Tag enthaelt, ist dieser Schritt nur
 *    ein Sicherheitsnetz)
 *  - macht jede error_message einzeilig, damit das Tests-Panel in
 *    Jira nicht an mehrzeiligen Stacktraces abstuerzt
 *
 * Aufruf: node scripts/postprocess-cucumber-json.js <pfad-zur-json>
 * Benoetigt Env-Var XRAY_EXEC_KEY (Pflicht), XRAY_TEST_KEY (optional)
 */

const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2] || path.join('reports', 'cucumber-report.json');
const execKey = process.env.XRAY_EXEC_KEY;
const testKey = process.env.XRAY_TEST_KEY;

if (!execKey) {
  console.error('Fehler: Env-Var XRAY_EXEC_KEY ist nicht gesetzt.');
  process.exit(1);
}

if (!fs.existsSync(inputPath)) {
  console.error(`Fehler: Datei nicht gefunden: ${inputPath}`);
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

let injectedCount = 0;
let sanitizedCount = 0;

for (const feature of report) {
  feature.tags = feature.tags || [];
  ensureTag(feature.tags, `@${execKey}`);
  if (testKey) ensureTag(feature.tags, `@${testKey}`);

  for (const element of feature.elements || []) {
    element.tags = element.tags || [];
    ensureTag(element.tags, `@${execKey}`);
    if (testKey) ensureTag(element.tags, `@${testKey}`);
    injectedCount++;

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
  `OK: @${execKey}${testKey ? ' und @' + testKey : ''} in ${injectedCount} Szenario(s) injiziert, ` +
    `${sanitizedCount} error_message(s) einzeilig gemacht -> ${inputPath}`
);
