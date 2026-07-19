async (page) => {
  await page.getByText("?梁?").first().hover();
  await page.waitForTimeout(1800);
}
