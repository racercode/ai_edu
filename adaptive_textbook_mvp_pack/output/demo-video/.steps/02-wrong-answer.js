async (page) => {
  await page.locator("[data-testid='demo-wrong-answer']").click();
  await page.waitForTimeout(1800);
}
