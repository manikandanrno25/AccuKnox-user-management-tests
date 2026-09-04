import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { AdminUsersPage } from '../pages/AdminUsersPage';

/**
 * OrangeHRM - Admin > User Management E2E suite
 * AccuKnox QA Trainee Practical Assessment - Problem Statement 1
 *
 * Scenarios (each in its own test block, mapped to the manual test cases
 * in docs/OrangeHRM_UserManagement_TestCases.xlsx):
 *   TC01 - Navigate to the Admin module
 *   TC02 - Add a new user
 *   TC03 - Search the newly created user
 *   TC04 - Edit all possible user details
 *   TC05 - Validate the updated details
 *   TC06 - Delete the user
 *
 * NOTE: These tests are intentionally stateful and share a single dynamically
 * generated username across the file (a new user must exist before it can be
 * searched, edited, validated, and deleted). They therefore run serially in
 * one worker - see playwright.config.ts (fullyParallel: false, workers: 1)
 * and the `test.describe.configure({ mode: 'serial' })` call below.
 */

const ADMIN_USERNAME = process.env.ORANGEHRM_ADMIN_USER ?? 'Admin';
const ADMIN_PASSWORD = process.env.ORANGEHRM_ADMIN_PASSWORD ?? 'admin123';

const runId = Date.now();
const newUsername = `qa_trainee_${runId}`;
const updatedUsername = `qa_trainee_${runId}_upd`;
const initialPassword = 'AccuKnox@123';

test.describe.configure({ mode: 'serial' });

test.describe('OrangeHRM Admin - User Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(ADMIN_USERNAME, ADMIN_PASSWORD);
    await expect(page).toHaveURL(/dashboard/);
  });

  test('TC01 - Navigate to the Admin module', async ({ page }) => {
    const adminUsersPage = new AdminUsersPage(page);
    await adminUsersPage.navigateToAdmin();
    await expect(page).toHaveURL(/viewSystemUsers/);
    await expect(adminUsersPage.pageHeading).toBeVisible();
  });

  test('TC02 - Add a new user', async ({ page }) => {
    const adminUsersPage = new AdminUsersPage(page);
    await adminUsersPage.navigateToAdmin();
    await adminUsersPage.clickAdd();

    await adminUsersPage.addUser({
      userRole: 'ESS',
      employeeName: 'a', // matches the seeded demo employees; first suggestion is selected
      status: 'Enabled',
      username: newUsername,
      password: initialPassword,
    });

    // Confirm the new user shows up in the grid immediately after saving.
    await adminUsersPage.searchByUsername(newUsername);
    await adminUsersPage.expectUserVisible(newUsername);
  });

  test('TC03 - Search the newly created user', async ({ page }) => {
    const adminUsersPage = new AdminUsersPage(page);
    await adminUsersPage.navigateToAdmin();
    await adminUsersPage.searchByUsername(newUsername);
    await adminUsersPage.expectUserVisible(newUsername);
  });

  test('TC04 - Edit all possible user details', async ({ page }) => {
    const adminUsersPage = new AdminUsersPage(page);
    await adminUsersPage.navigateToAdmin();
    await adminUsersPage.searchByUsername(newUsername);
    await adminUsersPage.editFirstResult();

    await adminUsersPage.updateUserDetails({
      status: 'Disabled',
      username: updatedUsername,
    });
  });

  test('TC05 - Validate the updated user details', async ({ page }) => {
    const adminUsersPage = new AdminUsersPage(page);
    await adminUsersPage.navigateToAdmin();
    await adminUsersPage.searchByUsername(updatedUsername);

    await adminUsersPage.expectUserVisible(updatedUsername);
    await expect(page.getByRole('cell', { name: 'Disabled', exact: true })).toBeVisible();
    // The old username should no longer be searchable.
    await adminUsersPage.searchByUsername(newUsername);
    await adminUsersPage.expectNoResults();
  });

  test('TC06 - Delete the user', async ({ page }) => {
    const adminUsersPage = new AdminUsersPage(page);
    await adminUsersPage.navigateToAdmin();
    await adminUsersPage.searchByUsername(updatedUsername);
    await adminUsersPage.deleteFirstResult();

    await adminUsersPage.searchByUsername(updatedUsername);
    await adminUsersPage.expectNoResults();
  });
});
