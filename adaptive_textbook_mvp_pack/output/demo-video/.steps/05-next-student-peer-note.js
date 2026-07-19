async (page) => {
  await page.locator("[data-testid='peer-marker']").hover();
  await page.waitForTimeout(2200);
}
