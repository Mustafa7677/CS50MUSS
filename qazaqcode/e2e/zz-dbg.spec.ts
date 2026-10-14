import { test } from "@playwright/test";
test("dbg", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("teacher1@demo.qazaqcode.kz");
  await page.getByLabel("Құпиясөз").fill("DemoPass123");
  await page.getByRole("button", { name: "Кіру" }).click();
  await page.waitForURL(/\/teacher/);
  await page.goto("/teacher/courses");
  await page.getByTestId("course-row").first().getByRole("link", { name: "Ашу" }).click();
  await page.waitForSelector("[data-testid=module]");
  await page.evaluate(() => { for (const t of ["dragstart","dragover","drop","dragend"]) document.addEventListener(t, (e) => console.log("EV", t, (e.target as HTMLElement).tagName, (e as DragEvent).defaultPrevented), true); });
  page.on("console", (m) => console.log(m.text()));
  console.log(await page.getByTestId("drag-module").count());
  await page.getByTestId("drag-module").nth(1).dragTo(page.getByTestId("module").first().locator("input").first());
  console.log(await page.getByLabel("1-модульдің атауы").inputValue());
});
