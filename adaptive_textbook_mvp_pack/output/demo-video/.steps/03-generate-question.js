async (page) => {
  await page.getByRole("button", { name: /?寞???閫敹萄銝憿? }).click();
  await page.waitForTimeout(1800);
}
