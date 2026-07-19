async (page) => {
  await page.locator("[data-testid='add-peer-note']").click();
  await page.waitForTimeout(1200);
}
