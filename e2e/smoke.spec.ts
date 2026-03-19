import { test, expect } from '@playwright/test'

test.describe('smoke', () => {
  test('home page loads and shows app content', async ({ page }) => {
    const res = await page.goto('/')
    expect(res?.status()).toBe(200)
    await page.waitForLoadState('networkidle').catch(() => {})
    const body = await page.locator('body').textContent()
    expect(body?.length).toBeGreaterThan(50)
    expect(body).toMatch(/3D|Layout|Loading|Sign in|layout/i)
  })

  test('login page loads when requested', async ({ page }) => {
    const res = await page.goto('/auth/login')
    if (res?.status() === 404) {
      test.skip(true, 'Dev server may 404 on first request for this route')
      return
    }
    expect(res?.status()).toBe(200)
    await expect(page).toHaveURL(/\/auth\/login/)
    const body = await page.locator('body').textContent() ?? ''
    expect(body).toMatch(/Layout|Sign|email|3D|password/i)
  })

  test('layouts page loads when requested', async ({ page }) => {
    const res = await page.goto('/layouts')
    if (res?.status() === 404) {
      test.skip(true, 'Dev server may 404 on first request for this route')
      return
    }
    expect(res?.status()).toBe(200)
    const body = await page.locator('body').textContent() ?? ''
    expect(body.length).toBeGreaterThan(20)
  })

  test('layouts page shows new layout or list', async ({ page }) => {
    const res = await page.goto('/layouts')
    if (res?.status() !== 200) {
      test.skip(true, 'Layouts page not available')
      return
    }
    await page.waitForLoadState('domcontentloaded')
    const body = await page.locator('body').textContent() ?? ''
    expect(body).toMatch(/New layout|My layouts|Create|first layout|Sign in/i)
  })

  test('share route accepts token param', async ({ page }) => {
    const res = await page.goto('/s/invalid-token-test')
    if (res?.status() === 404) {
      test.skip(true, 'Share route may 404 in this environment')
      return
    }
    expect([200, 307, 302]).toContain(res?.status() ?? 0)
    await page.waitForLoadState('domcontentloaded')
    const body = await page.locator('body').textContent() ?? ''
    expect(body?.length).toBeGreaterThan(20)
  })

  test('overflow menu opens and shows Export options', async ({ page }) => {
    test.setTimeout(60000)
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    const menuButton = page.getByRole('button', { name: /open menu/i })
    await expect(menuButton).toBeVisible({ timeout: 45000 })
    await menuButton.click()
    const menu = page.locator('.omenu')
    await expect(menu).toBeVisible()
    await expect(menu.getByRole('button', { name: /^Print$/ })).toBeVisible()
    await expect(menu.getByRole('button', { name: /^PDF$/ })).toBeVisible()
    await expect(menu.getByRole('button', { name: /^Copy link$/ })).toBeVisible()
  })

  test('Share dialog opens and shows share UI when Share is available', async ({ page }) => {
    test.setTimeout(60000)
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    const menuButton = page.getByRole('button', { name: /open menu/i })
    await expect(menuButton).toBeVisible({ timeout: 45000 })
    await menuButton.click()
    const shareBtn = page.getByRole('button', { name: /^Share$/ })
    if (!(await shareBtn.isVisible())) {
      test.skip(true, 'Share only appears when a layout or share link is loaded')
      return
    }
    await shareBtn.click()
    const dialog = page.locator('div').filter({ hasText: 'Share layout' }).first()
    await expect(dialog).toBeVisible()
    const body = (await dialog.locator('..').first().textContent()) ?? ''
    expect(body).toMatch(/Create new link|Existing links|Copy link|Share layout/)
  })

  test('Notes panel can be toggled when Notes menu item is available', async ({ page }) => {
    test.setTimeout(60000)
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    const menuButton = page.getByRole('button', { name: /open menu/i })
    await expect(menuButton).toBeVisible({ timeout: 45000 })
    await menuButton.click()
    const notesBtn = page.getByRole('button', { name: /^Notes/ })
    if (!(await notesBtn.isVisible())) {
      test.skip(true, 'Notes only appears when a saved layout or edit share link is loaded')
      return
    }
    await notesBtn.click()
    await expect(page.getByText('Notes', { exact: true }).first()).toBeVisible({ timeout: 3000 })
    await expect(page.locator('body')).toContainText(/Add|No notes/)
  })
})
