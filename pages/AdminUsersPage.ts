import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object for OrangeHRM Admin > User Management (System Users) screens.
 * Covers: navigation, add user, search, edit, and delete flows.
 */
export class AdminUsersPage {
  readonly page: Page;

  // Navigation
  readonly adminMenuLink: Locator;
  readonly pageHeading: Locator;

  // Add / Edit form fields (shared form layout in OrangeHRM)
  readonly addButton: Locator;
  readonly userRoleDropdown: Locator;
  readonly employeeNameInput: Locator;
  readonly statusDropdown: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly formHeading: Locator;

  // Search / filter bar
  readonly searchUsernameInput: Locator;
  readonly searchButton: Locator;
  readonly resetButton: Locator;

  // Results table
  readonly tableRows: Locator;
  readonly noRecordsFound: Locator;

  // Delete confirmation modal
  readonly confirmDeleteButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.adminMenuLink = page.getByRole('link', { name: 'Admin' });
    this.pageHeading = page.getByRole('heading', { name: 'System Users' });

    this.addButton = page.getByRole('button', { name: 'Add' });
    this.formHeading = page.locator('.oxd-topbar-body-nav-tab-item, h6.oxd-text');

    this.userRoleDropdown = page
      .locator('.oxd-form-row')
      .filter({ hasText: 'User Role' })
      .locator('.oxd-select-text');

    this.employeeNameInput = page.getByPlaceholder('Type for hints...');

    this.statusDropdown = page
      .locator('.oxd-form-row')
      .filter({ hasText: 'Status' })
      .locator('.oxd-select-text');

    this.usernameInput = page
      .locator('.oxd-form-row')
      .filter({ hasText: 'Username' })
      .locator('input');

    this.passwordInput = page.locator('input[type="password"]').first();
    this.confirmPasswordInput = page.locator('input[type="password"]').nth(1);

    this.saveButton = page.getByRole('button', { name: 'Save' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });

    this.searchUsernameInput = page
      .locator('.oxd-table-filter-area .oxd-form-row')
      .filter({ hasText: 'Username' })
      .locator('input');

    this.searchButton = page.getByRole('button', { name: 'Search' });
    this.resetButton = page.getByRole('button', { name: 'Reset' });

    this.tableRows = page.locator('.oxd-table-card');
    this.noRecordsFound = page.getByText('No Records Found');

    this.confirmDeleteButton = page.getByRole('button', { name: 'Yes, Delete' });
  }

  /** TC-01: Navigate from the sidebar to Admin > User Management. */
  async navigateToAdmin(): Promise<void> {
    await this.adminMenuLink.click();
    await this.page.waitForURL('**/viewSystemUsers');
    await expect(this.pageHeading).toBeVisible();
  }

  /** Opens the "Add User" form. */
  async clickAdd(): Promise<void> {
    await this.addButton.click();
    await expect(this.page.getByText('Add User')).toBeVisible();
  }

  /** Generic helper for OrangeHRM's custom (non-native) dropdowns. */
  private async selectDropdownOption(dropdown: Locator, optionText: string): Promise<void> {
    await dropdown.click();
    const option = this.page.getByRole('option', { name: optionText, exact: true });
    await expect(option).toBeVisible();
    await option.click();
  }

  /** Fills the Employee Name autocomplete field and picks the first suggestion. */
  private async fillEmployeeName(employeeName: string): Promise<void> {
    await this.employeeNameInput.fill(employeeName);
    const suggestion = this.page.locator('.oxd-autocomplete-dropdown .oxd-autocomplete-option').first();
    await expect(suggestion).toBeVisible({ timeout: 10_000 });
    await suggestion.click();
  }

  /** TC-02: Fills and submits the Add User form. */
  async addUser(params: {
    userRole: string;
    employeeName: string;
    status: string;
    username: string;
    password: string;
  }): Promise<void> {
    const { userRole, employeeName, status, username, password } = params;

    await this.selectDropdownOption(this.userRoleDropdown, userRole);
    await this.fillEmployeeName(employeeName);
    await this.selectDropdownOption(this.statusDropdown, status);
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(password);

    await this.saveButton.click();
    await this.page.waitForURL('**/viewSystemUsers');
    await expect(this.pageHeading).toBeVisible();
  }

  /** TC-03: Searches the System Users grid by username. */
  async searchByUsername(username: string): Promise<void> {
    // A fresh search screen may still have a previous filter applied.
    if (await this.resetButton.isVisible().catch(() => false)) {
      await this.resetButton.click();
    }
    await this.searchUsernameInput.fill(username);
    await this.searchButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /** Returns the first row Locator of the current results grid. */
  getFirstRow(): Locator {
    return this.tableRows.first();
  }

  /** Asserts a user with the given username is present in the results grid. */
  async expectUserVisible(username: string): Promise<void> {
    await expect(this.page.getByRole('cell', { name: username, exact: true })).toBeVisible();
  }

  /** Asserts no results were returned for the current search. */
  async expectNoResults(): Promise<void> {
    await expect(this.noRecordsFound).toBeVisible();
  }

  /** TC-04: Opens the edit form for the first row in the results grid. */
  async editFirstResult(): Promise<void> {
    const row = this.getFirstRow();
    await row.locator('.oxd-icon.bi-pencil-fill, .bi-pencil-fill').click();
    await expect(this.page.getByText('Edit User')).toBeVisible();
  }

  /** Updates Status and Username fields on an already-open Edit User form. */
  async updateUserDetails(params: { status?: string; username?: string }): Promise<void> {
    const { status, username } = params;

    if (status) {
      await this.selectDropdownOption(this.statusDropdown, status);
    }
    if (username) {
      await this.usernameInput.fill('');
      await this.usernameInput.fill(username);
    }

    await this.saveButton.click();
    await this.page.waitForURL('**/viewSystemUsers');
    await expect(this.pageHeading).toBeVisible();
  }

  /** TC-06: Deletes the first row in the current results grid and confirms the modal. */
  async deleteFirstResult(): Promise<void> {
    const row = this.getFirstRow();
    await row.locator('.oxd-icon.bi-trash, .bi-trash').click();
    await expect(this.confirmDeleteButton).toBeVisible();
    await this.confirmDeleteButton.click();
    await this.page.waitForLoadState('networkidle');
  }
}
