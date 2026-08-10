# novart-poc – Playwright/Cucumber + Xray Integration (KAN-5)

Tests that "Prepare for Success" is visible on https://www.tests.com/ and
automatically imports the results into Jira/Xray Cloud (project KAN).

**Every CI run creates a brand new Xray Test (linked to Story KAN-5) and a
brand new Test Execution — there is no persistent/hardcoded test key
anywhere in this setup.**

## Run locally

```bash
npm install
npx playwright install --with-deps chromium
npm test              # produces reports/cucumber-report.json
npm run report:html   # produces reports/html-report/index.html
```

## One-time setup (before the first CI run)

### Create GitHub Secrets

Under **Settings → Secrets and variables → Actions → Secrets** in the
`novart-poc/novart-poc` repo, add:

| Secret               | Description                                        |
|-----------------------|-----------------------------------------------------|
| `JIRA_BASE_URL`       | e.g. `https://yourdomain.atlassian.net`             |
| `JIRA_EMAIL`          | Email of the Jira service account                   |
| `JIRA_API_TOKEN`      | Jira API token of the service account                |
| `XRAY_CLIENT_ID`      | Xray Cloud API client ID                             |
| `XRAY_CLIENT_SECRET`  | Xray Cloud API client secret                         |

That's it — no test key needs to be created or stored up front. Then push
to `main` (see commands below).

## How the pipeline works (`.github/workflows/xray-tests.yml`)

1. Checkout, Node/Playwright setup, `npm ci`
2. Get an Xray auth token (`/api/v2/authenticate`)
3. **Import the feature file** (`/api/v2/import/feature`) → this creates a
   **new Test issue every run** and links it to Story KAN-5 via the
   `@KAN-5` tag in the feature file → response gives us `test_key`
   (e.g. `KAN-15`)
4. **Create a new Test Execution** in Jira (`/rest/api/3/issue`, issue type
   `Test Execution` in project `KAN`) → returns `exec_key` (e.g. `KAN-16`)
5. Run the Cucumber tests → `reports/cucumber-report.json`
   (the job continues even if tests fail, so reporting/import still happen)
6. Generate the HTML report → `reports/html-report/`
7. `scripts/postprocess-cucumber-json.js`:
   - injects `@{{exec_key}}` and `@{{test_key}}` (both freshly created in
     steps 3–4) as tags directly into the JSON report (query parameters
     are ignored by Xray — per your experience the tags must live in the
     JSON itself)
   - makes every `error_message` single-line (prevents the Tests panel
     in Jira from crashing on multi-line stack traces)
8. POST the JSON report to `/api/v2/import/execution/cucumber`
9. Upload the JSON + HTML report as a GitHub Actions artifact
10. The job fails if the tests failed (the import still happens regardless)

**Note / assumption:** The workflow assumes that the `KAN` Jira project
has an issue type called `Test Execution` (Xray Cloud's default). If the
name differs in your instance, adjust it in the "Create Test Execution
issue in Jira" step.

## Files in this package

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
