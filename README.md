# novart-poc – Playwright/Cucumber + Xray Integration (KAN-5)

Tests that "Prepare for Success" is visible on https://www.tests.com/ and
automatically imports the results into Jira/Xray Cloud (project KAN).

**Whether a CI run updates the existing Xray Test or creates a brand new
one is controlled entirely in the feature file** — see "Controlling Test
creation" below. No workflow/CI changes are needed to release a new test
version.

## Run locally

```bash
npm install
npx playwright install --with-deps chromium
npm test              # produces reports/cucumber-report.json
npm run report:html   # produces reports/html-report/index.html
```

## Controlling Test creation via the feature file

Xray's feature import matches a Scenario to an existing Test using this
precedence (per Xray Cloud docs):

1. same relative feature file path **and** (same `@id:...` tag **or**
   same Scenario name) → **updates** that Test
2. else: same Scenario name anywhere else in the project → **updates**
   that Test
3. else: **creates** a new Test

Because of the **or** in rule 1, changing only the `@id:...` tag is
**not** enough — if the Scenario name stays the same, Xray still matches
on the name and updates the existing Test. To reliably get a **new**
Test, both must change together.

`features/prepare-for-success.feature` currently looks like this:

```gherkin
@KAN-5
Feature: tests.com homepage

  @id:v1
  Scenario: "Prepare for Success" is visible on the homepage (v1)
    Given I open the page "https://www.tests.com/"
    Then the text "Prepare for Success" should be visible on the page
```

- **Same `@id:v1` and same Scenario name, changed steps** → next CI run
  updates the *same* Test issue with the new step definition (execution
  history keeps accumulating against it).
- **Bump both** the tag and the Scenario name (e.g. `@id:v1` → `@id:v2`,
  and `(v1)` → `(v2)` in the name) → next CI run can't match it to any
  existing Test, so Xray creates a **brand new Test issue**, automatically
  linked to Story KAN-5 via the `@KAN-5` tag.

So: to release a new test version and have it tracked as its own Test in
Xray, edit the feature file, bump **both** the `@id:` tag and the Scenario
name, and push to `main`.

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
3. **Import the feature file** (`/api/v2/import/feature`) as committed →
   creates a new Test or updates the existing one, per the matching rules
   above → response gives us `test_key`
4. **Create a new Test Execution** in Jira (`/rest/api/3/issue`, issue type
   `Test Execution` in project `KAN`) → returns `exec_key` (e.g. `KAN-16`)
5. Run the Cucumber tests → `reports/cucumber-report.json`
   (the job continues even if tests fail, so reporting/import still happen)
6. Generate the HTML report → `reports/html-report/`
7. `scripts/postprocess-cucumber-json.js` injects `@{{exec_key}}` and
   `@{{test_key}}` (from steps 3–4) as tags directly into the JSON report
   (query parameters are ignored by Xray — per your experience the tags
   must live in the JSON itself). `error_message` is passed through
   unchanged, full text including multi-line stack traces.
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
