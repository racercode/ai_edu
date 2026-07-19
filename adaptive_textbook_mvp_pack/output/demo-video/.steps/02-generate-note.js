async (page) => {
  const trigger = page.getByRole("button", { name: /AI ????蝑?|撟急???暺? }).first();
  await trigger.click();
  await page.waitForTimeout(1800);
}
