async (page) => {
  await page.getByRole("button", { name: /?啣??啣蝑? }).click();
  await page.waitForTimeout(1200);
}
