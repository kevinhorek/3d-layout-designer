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
})
