async (page) => {
  await page.getByRole("button", { name: /銝?萄???銝血??亦?閮銝?萄???/ }).last().click();
  await page.waitForTimeout(2200);
}
