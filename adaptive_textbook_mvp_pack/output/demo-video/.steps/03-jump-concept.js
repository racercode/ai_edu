async (page) => {
  await page.locator("[data-testid='jump-concept']").click();
  await page.waitForTimeout(2600);
}
