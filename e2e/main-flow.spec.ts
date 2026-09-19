import { test, expect } from '@playwright/test';

const EMAIL = `e2e-${Date.now()}@example.com`;
const PASSWORD = 'secret123';
const TASK_TITLE = `E2E Task ${Date.now()}`;

test.describe('Main task management flow', () => {
  test('signup, login, dashboard, create task, comment, activity, logout', async ({ page }) => {
    test.setTimeout(120000);

    // 1. Signup
    await page.goto('/signup');
    await page.getByLabel('Full Name').fill('E2E User');
    await page.getByLabel('Email').fill(EMAIL);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: /create account/i }).click();

    // 2. Redirected to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
    await expect(page.getByText('Dashboard', { exact: true })).toBeVisible();

    // 3. Create a task
    await page.goto('/tasks');
    await page.getByRole('button', { name: /new task/i }).click();
    await page.getByPlaceholder('Task title').fill(TASK_TITLE);
    await page.getByPlaceholder('Optional description').fill('Created through the E2E test');
    await page.getByRole('button', { name: /^create task$/i }).first().click();

    // 5. Task appears in the list
    const taskLink = page.getByRole('link', { name: TASK_TITLE });
    await expect(taskLink).toBeVisible({ timeout: 15000 });

    // 6. Open the task detail — Comments section heading
    await taskLink.click();
    await expect(page.getByRole('heading', { name: /comments/i })).toBeVisible();

    // 7. Add a comment
    await page.getByPlaceholder('Add a comment...').fill('Hello from E2E');
    await page.locator('button[type="submit"]').filter({ has: page.locator('svg') }).last().click();
    await expect(page.getByText('Hello from E2E')).toBeVisible();

    // 8. Activity shows history
    await expect(page.getByText(/created this task/i)).toBeVisible();

    // 9. Logout
    await page.goto('/dashboard');
    await page.getByRole('button', { name: /logout/i }).first().click();
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });
});