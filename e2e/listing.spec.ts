import { expect, test, type Page } from "@playwright/test";

async function gotoListing(page: Page) {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "37 alquileres en Madrid" }),
  ).toBeVisible();
  await page.waitForLoadState("networkidle");
}

test.describe("Yaya House listing", () => {
  test("shows the available rentals by default", async ({ page }) => {
    await gotoListing(page);

    await expect(page).toHaveTitle("Yaya House");
    await expect(
      page.getByRole("heading", { name: "37 alquileres en Madrid" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Estudio práctico cerca del metro" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Estudio tranquilo interior" }),
    ).toHaveCount(0);
  });

  test("can include unavailable rentals", async ({ page }) => {
    await gotoListing(page);

    await page.getByRole("switch", { name: "Mostrar no disponibles" }).click();

    await expect(
      page.getByRole("heading", { name: "50 alquileres en Madrid" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Estudio tranquilo interior" }),
    ).toBeVisible();
    await expect(page.getByText("No disponible").first()).toBeVisible();
  });

  test("can filter rentals by bedroom count", async ({ page }) => {
    await gotoListing(page);

    await page.getByRole("button", { name: "Filtros" }).click();
    await expect(page.getByRole("dialog", { name: "Filtros" })).toBeVisible();

    await page.locator("label").filter({ hasText: "2 dormitorios" }).click();
    await expect(page.getByLabel("2 dormitorios")).toBeChecked();

    await expect(page.getByText("8 resultados")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Aplicar filtros" }),
    ).toBeEnabled();

    await page.getByRole("button", { name: "Aplicar filtros" }).click();

    await expect(
      page.getByRole("heading", { name: "8 alquileres en Madrid" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Piso cómodo bien distribuido" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Estudio práctico cerca del metro" }),
    ).toHaveCount(0);
  });
});
