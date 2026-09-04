# AccuKnox User Management Tests

Playwright + TypeScript E2E automation for the **Admin > User Management** module of the
[OrangeHRM Demo Application](https://opensource-demo.orangehrmlive.com/web/index.php/auth/login),
built for the **AccuKnox QA Trainee Practical Assessment – Problem Statement 1**.

## What's covered

Manual test cases live in [`docs/OrangeHRM_UserManagement_TestCases.xlsx`](docs/OrangeHRM_UserManagement_TestCases.xlsx)
(10 cases, plus a bugs/observations sheet). The automated suite covers the six core scenarios
from the assessment, one per Playwright test block:

| Test | Scenario |
|------|----------|
| TC01 | Navigate to the Admin module |
| TC02 | Add a new user |
| TC03 | Search the newly created user |
| TC04 | Edit all possible user details |
| TC05 | Validate the updated details |
| TC06 | Delete the user |

## Tech stack

- **Playwright**: `@playwright/test` **v1.62.1** (latest stable as of this submission — run
  `npx playwright --version` after install to confirm what's actually installed)
- **Language**: TypeScript
- **Pattern**: Page Object Model (`pages/LoginPage.ts`, `pages/AdminUsersPage.ts`)
- **Node.js**: v20+ recommended (v22/24 also supported)

## Project structure

```
AccuKnox-user-management-tests/
├── pages/
│   ├── LoginPage.ts          # Login page object
│   └── AdminUsersPage.ts     # Admin > System Users page object (navigate/add/search/edit/delete)
├── tests/
│   └── userManagement.spec.ts   # TC01–TC06, one test block per scenario
├── docs/
│   └── OrangeHRM_UserManagement_TestCases.xlsx   # Manual test cases + bug notes
├── playwright.config.ts
├── package.json
├── tsconfig.json
└── .gitignore
```

## Setup

**Prerequisites:** Node.js 20+ and npm installed.

```bash
# 1. Clone the repo
git clone https://github.com/<your-username>/AccuKnox-user-management-tests.git
cd AccuKnox-user-management-tests

# 2. Install dependencies
npm install

# 3. Install Playwright browsers (and OS dependencies)
npx playwright install --with-deps
```

### (Optional) Environment variables

The credentials for the OrangeHRM demo app are hardcoded as defaults (`Admin` / `admin123`,
as given in the assessment), but can be overridden without editing code:

```bash
export ORANGEHRM_ADMIN_USER=Admin
export ORANGEHRM_ADMIN_PASSWORD=admin123
```

## Running the tests

```bash
# Run the full suite headless (default)
npm test

# Run with the browser visible
npm run test:headed

# Run in Playwright's interactive UI mode (recommended for debugging)
npm run test:ui

# Run a single test file
npx playwright test tests/userManagement.spec.ts

# Run a single test by name
npx playwright test -g "TC02 - Add a new user"

# View the HTML report after a run
npm run report
```

> The suite runs **serially in a single worker** (see `playwright.config.ts`). This is
> intentional: TC02 creates a user that TC03–TC06 subsequently search, edit, validate, and
> delete, so the tests are stateful by design and must not run in parallel or out of order.

## Design notes

- **Page Object Model**: all locators and page interactions live in `pages/`; test files only
  orchestrate calls to POM methods and make assertions. This keeps selector changes isolated to
  one place if OrangeHRM's DOM changes.
- **Selectors**: prioritized `getByRole`, `getByPlaceholder`, and `getByText` (Playwright's
  recommended user-facing locators) over brittle CSS/XPath. A couple of custom dropdown/icon
  selectors were necessary because OrangeHRM's dropdowns and row-action icons are div/icon-based
  rather than native `<select>`/`<button>` elements.
- **Waits**: no hardcoded `page.waitForTimeout()` sleeps in the assertions path — waits are
  driven by `expect(...).toBeVisible()`, `page.waitForURL()`, and `page.waitForLoadState()`,
  relying on Playwright's built-in auto-waiting.
- **Test data**: usernames are generated with `Date.now()` at run time to avoid collisions with
  existing data on the shared public demo instance, and to make repeated runs idempotent.

## Known issues / observations

See the **"Bugs & Observations"** sheet in
[`docs/OrangeHRM_UserManagement_TestCases.xlsx`](docs/OrangeHRM_UserManagement_TestCases.xlsx)
for full details. Highlights:

- The public demo instance's seed data (employees, existing usernames) is periodically reset by
  the site owner, which can affect the Employee Name autocomplete and duplicate-username tests.
  Automation avoids this by generating unique usernames per run.
- The Username search filter on the System Users screen can retain a stale value between
  searches; the automation resets the filter bar before every new search as a precaution.
- Deletion has no undo from the UI — confirmed via the "Yes, Delete" modal, it's immediate.

## CI

A sample GitHub Actions workflow is included at
[`.github/workflows/playwright.yml`](.github/workflows/playwright.yml) to run the suite on every
push/PR.
