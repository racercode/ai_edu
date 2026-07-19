async (page) => {
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
}
