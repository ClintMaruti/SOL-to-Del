import { setupServer } from "msw/node";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGIN = "http://localhost";

describe("promotionRoutes", () => {
  let server: ReturnType<typeof setupServer>;

  beforeEach(async () => {
    vi.resetModules();

    const { promotionRoutes } = await import("./promotions");
    server = setupServer(...promotionRoutes(`${ORIGIN}/api`));
    server.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    server.close();
  });

  it("returns promotions scoped to the requested head office", async () => {
    const response = await fetch(
      `${ORIGIN}/api/catalog/head-offices/sho-2/promotions`
    );

    expect(response.status).toBe(200);

    const body = (await response.json()) as Array<{ headOfficeId: string }>;

    expect(body).toHaveLength(1);
    expect(body.every((promotion) => promotion.headOfficeId === "sho-2")).toBe(
      true
    );
  });

  it("persists activate and deactivate changes across subsequent GET requests", async () => {
    const listUrl = `${ORIGIN}/api/catalog/head-offices/sho-1/promotions`;
    const toggleUrl = `${ORIGIN}/api/catalog/promotions/promo-1`;

    const deactivateResponse = await fetch(`${toggleUrl}/deactivate`, {
      method: "PATCH",
    });
    expect(deactivateResponse.status).toBe(200);

    let listResponse = await fetch(listUrl);
    expect(listResponse.status).toBe(200);

    let listBody = (await listResponse.json()) as Array<{
      id: string;
      isActive: boolean;
    }>;
    expect(
      listBody.find((promotion) => promotion.id === "promo-1")?.isActive
    ).toBe(false);

    const activateResponse = await fetch(`${toggleUrl}/activate`, {
      method: "PATCH",
    });
    expect(activateResponse.status).toBe(200);

    listResponse = await fetch(listUrl);
    expect(listResponse.status).toBe(200);

    listBody = (await listResponse.json()) as Array<{
      id: string;
      isActive: boolean;
    }>;
    expect(
      listBody.find((promotion) => promotion.id === "promo-1")?.isActive
    ).toBe(true);
  });

  it("creates a promotion and makes it available in subsequent list and detail requests", async () => {
    const createResponse = await fetch(
      `${ORIGIN}/api/catalog/head-offices/sho-1/promotions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: 0,
          name: "Stay 4 Pay 3",
          isPartiallySupported: false,
          note: null,
          travelDates: [
            {
              id: "travel-1",
              version: 0,
              from: "2026-06-01",
              to: "2026-10-31",
            },
          ],
          bookingWindow: { from: "2026-01-01", to: "2026-05-31" },
          bookingWindowRelative: null,
          conditions: [
            {
              id: "condition-1",
              version: 0,
              type: "SupplierNights",
              supplierId: "sup-1",
              serviceId: null,
              optionText: null,
              paxType: null,
              nights: {
                min: 4,
                max: 0,
              },
              suppliers: null,
              nightsTotal: null,
              paxCount: null,
              age: null,
            },
          ],
          actions: [
            {
              id: "action-1",
              version: 0,
              type: "DiscountPercentage",
              addOn: null,
              discount: {
                id: "discount-1",
                version: 0,
                discountPercent: 25,
                targetType: "Nights",
                paxType: "Any",
                paxIndexFrom: 0,
                paxIndexTo: 0,
                targetNightsType: "Cheapest",
                nightsIndexFrom: 0,
                nightsIndexTo: 0,
              },
            },
          ],
          isActive: false,
        }),
      }
    );

    expect(createResponse.status).toBe(201);

    const createdPromotion = (await createResponse.json()) as {
      id: string;
      name: string;
      bookingWindow: { from: string; to: string };
    };

    expect(createdPromotion.name).toBe("Stay 4 Pay 3");

    const listResponse = await fetch(
      `${ORIGIN}/api/catalog/head-offices/sho-1/promotions`
    );
    const listBody = (await listResponse.json()) as Array<{
      id: string;
      name: string;
      bookingWindowFrom: string;
      bookingWindowTo: string;
    }>;

    expect(
      listBody.some(
        (promotion) =>
          promotion.id === createdPromotion.id &&
          promotion.bookingWindowFrom === "2026-01-01" &&
          promotion.bookingWindowTo === "2026-05-31"
      )
    ).toBe(true);

    const detailResponse = await fetch(
      `${ORIGIN}/api/catalog/promotions/${createdPromotion.id}`
    );
    expect(detailResponse.status).toBe(200);

    const detailBody = (await detailResponse.json()) as {
      id: string;
      bookingWindow: { from: string; to: string };
      conditions: Array<{ type: string; nights: { min: number; max: number } }>;
    };

    expect(detailBody.id).toBe(createdPromotion.id);
    expect(detailBody.bookingWindow).toEqual({
      from: "2026-01-01",
      to: "2026-05-31",
    });
    expect(detailBody.conditions[0]?.type).toBe("SupplierNights");
    expect(detailBody.conditions[0]?.nights.min).toBe(4);
  });

  it("updates a promotion and keeps list and detail responses in sync", async () => {
    const updateResponse = await fetch(
      `${ORIGIN}/api/catalog/promotions/promo-1`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: 1,
          name: "Updated Long Stay Discount",
          isPartiallySupported: false,
          note: null,
          travelDates: [
            {
              id: "travel-1",
              version: 1,
              from: "2027-03-01",
              to: "2027-11-30",
            },
          ],
          bookingWindow: { from: "2027-01-15", to: "2027-09-30" },
          bookingWindowRelative: null,
          conditions: [
            {
              id: "condition-1",
              version: 1,
              type: "SupplierNights",
              supplierId: "sup-1",
              serviceId: null,
              optionText: null,
              paxType: null,
              nights: {
                min: 6,
                max: 0,
              },
              suppliers: null,
              nightsTotal: null,
              paxCount: null,
              age: null,
            },
          ],
          actions: [
            {
              id: "action-1",
              version: 1,
              type: "DiscountPercentage",
              addOn: null,
              discount: {
                id: "discount-1",
                version: 1,
                discountPercent: 20,
                targetType: "Nights",
                paxType: "Any",
                paxIndexFrom: 0,
                paxIndexTo: 0,
                targetNightsType: "Cheapest",
                nightsIndexFrom: 0,
                nightsIndexTo: 0,
              },
            },
          ],
          isActive: false,
        }),
      }
    );

    expect(updateResponse.status).toBe(200);

    const updatedPromotion = (await updateResponse.json()) as {
      id: string;
      name: string;
      version: number;
      bookingWindow: { from: string; to: string };
      isActive: boolean;
    };

    expect(updatedPromotion.id).toBe("promo-1");
    expect(updatedPromotion.name).toBe("Updated Long Stay Discount");
    expect(updatedPromotion.version).toBe(2);
    expect(updatedPromotion.isActive).toBe(false);

    const listResponse = await fetch(
      `${ORIGIN}/api/catalog/head-offices/sho-1/promotions`
    );
    expect(listResponse.status).toBe(200);

    const listBody = (await listResponse.json()) as Array<{
      id: string;
      name: string;
      bookingWindowFrom: string;
      bookingWindowTo: string;
      isActive: boolean;
    }>;

    expect(listBody.find((promotion) => promotion.id === "promo-1")).toEqual({
      id: "promo-1",
      name: "Updated Long Stay Discount",
      bookingWindowFrom: "2027-01-15",
      bookingWindowTo: "2027-09-30",
      headOfficeId: "sho-1",
      isActive: false,
    });

    const detailResponse = await fetch(
      `${ORIGIN}/api/catalog/promotions/promo-1`
    );
    expect(detailResponse.status).toBe(200);

    const detailBody = (await detailResponse.json()) as {
      name: string;
      bookingWindow: { from: string; to: string };
      conditions: Array<{ nights: { min: number; max: number } }>;
      isActive: boolean;
    };

    expect(detailBody.name).toBe("Updated Long Stay Discount");
    expect(detailBody.bookingWindow).toEqual({
      from: "2027-01-15",
      to: "2027-09-30",
    });
    expect(detailBody.conditions[0]?.nights.min).toBe(6);
    expect(detailBody.isActive).toBe(false);
  });
});
