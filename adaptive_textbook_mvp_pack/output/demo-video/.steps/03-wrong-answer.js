async (page) => {
  await page.getByRole("button", { name: /Demo嚗飛??舐?獢?B/ }).click();
  await page.waitForTimeout(1800);
}
