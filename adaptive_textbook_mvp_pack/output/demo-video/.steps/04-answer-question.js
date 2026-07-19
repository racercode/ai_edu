async (page) => {
  await page.getByRole("button", { name: /撘菔????? }).first().click();
  await page.waitForTimeout(2200);
}
