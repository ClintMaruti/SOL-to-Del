import { describe, expect, it } from "vitest";

import { formDataEqual, normalizeFormValue } from "../formDataEqual";

describe("normalizeFormValue", () => {
  it("returns booleans as-is", () => {
    expect(normalizeFormValue(true)).toBe(true);
    expect(normalizeFormValue(false)).toBe(false);
  });
  it("converts undefined and null to empty string", () => {
    expect(normalizeFormValue(undefined)).toBe("");
    expect(normalizeFormValue(null)).toBe("");
  });
  it("trims strings", () => {
    expect(normalizeFormValue("  foo  ")).toBe("foo");
    expect(normalizeFormValue("")).toBe("");
  });
});

describe("formDataEqual", () => {
  it("returns true for equal primitives (string, boolean)", () => {
    type T = { name: string; active: boolean };
    const keys: (keyof T)[] = ["name", "active"];
    expect(
      formDataEqual<T>(
        { name: "x", active: true },
        { name: "x", active: true },
        keys
      )
    ).toBe(true);
  });

  it("returns false when string or boolean differs", () => {
    type T = { name: string; active: boolean };
    const keys: (keyof T)[] = ["name", "active"];
    expect(
      formDataEqual<T>(
        { name: "a", active: false },
        { name: "b", active: false },
        keys
      )
    ).toBe(false);
    expect(
      formDataEqual<T>(
        { name: "a", active: true },
        { name: "a", active: false },
        keys
      )
    ).toBe(false);
  });

  it("treats undefined/null and empty string as equal for string fields", () => {
    type T = { name: string };
    const keys: (keyof T)[] = ["name"];
    expect(
      formDataEqual<T>(
        { name: "" },
        { name: undefined as unknown as string },
        keys
      )
    ).toBe(true);
    expect(
      formDataEqual<T>({ name: "" }, { name: null as unknown as string }, keys)
    ).toBe(true);
  });

  it("returns true for equal array of strings", () => {
    type T = { tags: string[] };
    const keys: (keyof T)[] = ["tags"];
    expect(
      formDataEqual<T>({ tags: ["a", "b"] }, { tags: ["a", "b"] }, keys)
    ).toBe(true);
    expect(formDataEqual<T>({ tags: [] }, { tags: [] }, keys)).toBe(true);
  });

  it("returns false when array of strings differs", () => {
    type T = { tags: string[] };
    const keys: (keyof T)[] = ["tags"];
    expect(
      formDataEqual<T>({ tags: ["a", "b"] }, { tags: ["a", "c"] }, keys)
    ).toBe(false);
    expect(formDataEqual<T>({ tags: ["a"] }, { tags: ["a", "b"] }, keys)).toBe(
      false
    );
    expect(formDataEqual<T>({ tags: ["a"] }, { tags: [] }, keys)).toBe(false);
  });

  it("returns true for equal array of objects", () => {
    type Item = { title: string; percent: string };
    type T = { items: Item[] };
    const keys: (keyof T)[] = ["items"];
    const a: T = {
      items: [
        { title: "Deposit", percent: "50" },
        { title: "Balance", percent: "50" },
      ],
    };
    const b: T = {
      items: [
        { title: "Deposit", percent: "50" },
        { title: "Balance", percent: "50" },
      ],
    };
    expect(formDataEqual<T>(a, b, keys)).toBe(true);
  });

  it("returns false when array of objects differs", () => {
    type Item = { title: string; percent: string };
    type T = { items: Item[] };
    const keys: (keyof T)[] = ["items"];
    expect(
      formDataEqual<T>(
        {
          items: [
            { title: "Deposit", percent: "50" },
            { title: "Balance", percent: "50" },
          ],
        },
        {
          items: [
            { title: "Deposit", percent: "30" },
            { title: "Balance", percent: "70" },
          ],
        },
        keys
      )
    ).toBe(false);
    expect(
      formDataEqual<T>(
        { items: [{ title: "A", percent: "100" }] },
        { items: [] },
        keys
      )
    ).toBe(false);
  });

  it("returns false when one value is array and the other is not", () => {
    type T = { tags: string[] | string };
    const keys: (keyof T)[] = ["tags"];
    expect(
      formDataEqual<T>(
        { tags: ["a"] },
        { tags: "a" as unknown as string[] },
        keys
      )
    ).toBe(false);
  });

  it("supplier-like objects: A vs B (differ by headOfficeId) are not equal", () => {
    const objectA = {
      name: "Serengeti Safari Co.",
      status: "Active" as const,
      headOfficeId: "",
      code: "SSC-002",
      additionalName: "",
      starRating: 0,
      serviceTypeId: "",
      type: "",
      preferredSupplier: false,
      email: "inquiries@serengetisafarico.com",
      phone: "+255 234 567 890",
      additionalEmail: "",
      secondAdditionalEmail: "",
      website: "",
      liveAvailabilityCheck: "",
      otherCommunicationChannels: "",
      country: "",
      city: "",
      postalCode: "",
      streetAddress: "",
      poBox: "",
      locationId: null as string | null,
      latitude: "",
      longitude: "",
      closestAirstrip: "",
      airstripLatitude: 0,
      airstripLongitude: 0,
      checkIn: "",
      checkOut: "",
      pickUp: "",
      dropOff: "",
      xeroId: "",
      paymentTerms: [] as unknown[],
      taxCode: "",
      visibilityForAgentZone: false,
      agentZoneId: "",
    };

    const objectB = {
      ...objectA,
      headOfficeId: "sho-2",
    };

    const keys = Object.keys(objectA) as (keyof typeof objectA)[];
    const areEqual = formDataEqual(objectA, objectB, keys);
    expect(areEqual).toBe(false);
  });
});
