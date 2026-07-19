async (page) => {
  await page.getByRole("button", { name: /頝喳撠?閫敹? }).first().click();
  await page.waitForTimeout(1600);
}
