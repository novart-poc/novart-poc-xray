# novart-poc – Playwright/Cucumber + Xray Integration (KAN-5)

Testet, dass "Prepare for Success" auf https://www.tests.com/ sichtbar ist,
und importiert die Ergebnisse automatisch nach Jira/Xray Cloud (Projekt KAN).

## Lokal ausführen

```bash
npm install
npx playwright install --with-deps chromium
npm test              # erzeugt reports/cucumber-report.json
npm run report:html   # erzeugt reports/html-report/index.html
```

## Einmaliges Setup (vor dem ersten CI-Lauf)

### 1. GitHub Secrets anlegen
Unter **Settings → Secrets and variables → Actions** im Repo `novart-poc/novart-poc`:

| Secret               | Beschreibung                                      |
|-----------------------|----------------------------------------------------|
| `JIRA_BASE_URL`       | z. B. `https://euerdomain.atlassian.net`           |
| `JIRA_EMAIL`          | E-Mail des Jira-Service-Accounts                   |
| `JIRA_API_TOKEN`      | Jira API-Token des Service-Accounts                |
| `XRAY_CLIENT_ID`      | Xray Cloud API Client ID                           |
| `XRAY_CLIENT_SECRET`  | Xray Cloud API Client Secret                       |
| `XRAY_TEST_KEY`       | *(optional, siehe Schritt 2)* z. B. `KAN-6`        |

### 2. Test-Issue einmalig per Feature-Import erzeugen

Da ihr das bereits erfolgreich getestet habt, einmalig ausführen (lokal oder
via `curl`), um den Test-Issue zu KAN-5 zu erzeugen:

```bash
curl -H "Authorization: Bearer <XRAY_TOKEN>" \
  -F "file=@features/prepare-for-success.feature" \
  "https://xray.cloud.getxray.app/api/v2/import/feature?projectKey=KAN"
```

Die Antwort enthält den neu erzeugten Test-Key (z. B. `KAN-6`). Danach:

- Optional: `XRAY_TEST_KEY` als GitHub Secret mit diesem Wert anlegen
  (der Import-Workflow injiziert ihn dann zusätzlich in den JSON-Report), **und/oder**
- Empfohlen: den Tag direkt im Feature-File ergänzen, z. B.
  `@KAN-5 @KAN-6` vor `Feature:`, damit künftige Feature-Importe denselben
  Test aktualisieren statt einen neuen zu erzeugen.

### 3. Push nach `main`

Siehe Befehle unten.

## Wie die Pipeline funktioniert (`.github/workflows/xray-tests.yml`)

1. Checkout, Node/Playwright-Setup, `npm ci`
2. Xray-Auth-Token holen (`/api/v2/authenticate`)
3. Neue **Test Execution** in Jira anlegen (`/rest/api/3/issue`, Issuetype
   `Test Execution` im Projekt `KAN`) → liefert `exec_key`, z. B. `KAN-10`
4. Cucumber-Tests ausführen → `reports/cucumber-report.json`
   (Job läuft trotz Testfehlern weiter, damit Reporting/Import trotzdem passieren)
5. HTML-Report erzeugen → `reports/html-report/`
6. `scripts/postprocess-cucumber-json.js`:
   - injiziert `@{{exec_key}}` und optional `@{{test_key}}` als Tags
     direkt in den JSON-Report (Query-Parameter werden von Xray ignoriert,
     die Tags müssen laut eurer Erfahrung im JSON selbst stehen)
   - macht jede `error_message` einzeilig (verhindert Absturz des
     Tests-Panels in Jira bei mehrzeiligen Stacktraces)
7. JSON-Report per POST an `/api/v2/import/execution/cucumber`
8. JSON + HTML Report als GitHub-Actions-Artefakt hochladen
9. Job schlägt fehl, falls die Tests fehlgeschlagen sind (Import ist trotzdem passiert)

**Hinweis / Annahme:** Der Workflow geht davon aus, dass im Jira-Projekt `KAN`
ein Issuetype namens `Test Execution` existiert (Standard bei Xray Cloud).
Falls der Name abweicht, in Schritt "Test Execution Issue anlegen" anpassen.

## Dateien in diesem Paket

```
package.json
tsconfig.json
cucumber.js
.gitignore
features/
  prepare-for-success.feature
  step_definitions/steps.ts
  support/world.ts
scripts/
  generate-html-report.js
  postprocess-cucumber-json.js
.github/workflows/xray-tests.yml
```
