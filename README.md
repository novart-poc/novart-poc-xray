# novart-poc – Playwright/Cucumber + Xray Integration (KAN-5)

Tests that "Prepare for Success" is visible on https://www.tests.com/ and
automatically imports the results into Jira/Xray Cloud (project KAN).

## Run locally

```bash
npm install
npx playwright install --with-deps chromium
npm test              # produces reports/cucumber-report.json
npm run report:html   # produces reports/html-report/index.html
```

## One-time setup (before the first CI run)

### 1. Create GitHub Secrets
Under **Settings → Secrets and variables → Actions** in the
`novart-poc/novart-poc` repo:

| Secret               | Description                                        |
|-----------------------|-----------------------------------------------------|
| `JIRA_BASE_URL`       | e.g. `https://yourdomain.atlassian.net`             |
| `JIRA_EMAIL`          | Email of the Jira service account                   |
| `JIRA_API_TOKEN`      | Jira API token of the service account                |
| `XRAY_CLIENT_ID`      | Xray Cloud API client ID                             |
| `XRAY_CLIENT_SECRET`  | Xray Cloud API client secret                         |
| `XRAY_TEST_KEY`       | *(optional, see step 2)* e.g. `KAN-6`                |

### 2. Create the Test issue once via feature import

Since you've already tested this successfully, run it once (locally or
via `curl`) to create the Test issue linked to KAN-5:

```bash
curl -H "Authorization: Bearer <XRAY_TOKEN>" \
  -F "file=@features/prepare-for-success.feature" \
  "https://xray.cloud.getxray.app/api/v2/import/feature?projectKey=KAN"
```

The response contains the newly created Test key (e.g. `KAN-6`). Then:

- Optional: add `XRAY_TEST_KEY` as a GitHub secret with that value
  (the import workflow will additionally inject it into the JSON report), **and/or**
- Recommended: add the tag directly in the feature file, e.g.
  `@KAN-5 @KAN-6` before `Feature:`, so future feature imports update
  the same Test instead of creating a new one.

### 3. Push to `main`

See the commands below.

## How the pipeline works (`.github/workflows/xray-tests.yml`)

1. Checkout, Node/Playwright setup, `npm ci`
2. Get an Xray auth token (`/api/v2/authenticate`)
3. Create a new **Test Execution** in Jira (`/rest/api/3/issue`, issue type
   `Test Execution` in project `KAN`) → returns `exec_key`, e.g. `KAN-10`
4. Run the Cucumber tests → `reports/cucumber-report.json`
   (the job continues even if tests fail, so reporting/import still happen)
5. Generate the HTML report → `reports/html-report/`
6. `scripts/postprocess-cucumber-json.js`:
   - injects `@{{exec_key}}` and optionally `@{{test_key}}` as tags
     directly into the JSON report (query parameters are ignored by
     Xray — per your experience the tags must live in the JSON itself)
   - makes every `error_message` single-line (prevents the Tests panel
     in Jira from crashing on multi-line stack traces)
7. POST the JSON report to `/api/v2/import/execution/cucumber`
8. Upload the JSON + HTML report as a GitHub Actions artifact
9. The job fails if the tests failed (the import still happens regardless)

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
