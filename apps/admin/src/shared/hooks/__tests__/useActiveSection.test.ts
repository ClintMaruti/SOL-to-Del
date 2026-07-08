import { act, renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { useActiveSection } from "../useActiveSection";

describe("useActiveSection", () => {
  let observerCallback: (entries: IntersectionObserverEntry[]) => void;
  let observeTargets: Element[] = [];

  class MockIntersectionObserver {
    constructor(callback: (entries: IntersectionObserverEntry[]) => void) {
      observerCallback = callback;
    }
    observe(el: Element) {
      observeTargets.push(el);
    }
    disconnect = vi.fn();
    unobserve = vi.fn();
    takeRecords = vi.fn();
    root = null;
    rootMargin = "";
    thresholds: number[] = [];
  }

  beforeEach(() => {
    observeTargets = [];
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null activeSectionId when no sections are in the DOM", () => {
    const { result } = renderHook(() =>
      useActiveSection(["general-information", "other"])
    );

    expect(result.current.activeSectionId).toBeNull();
  });

  it("updates activeId when a section element is reported intersecting", () => {
    const section = document.createElement("div");
    section.id = "general-information";
    document.body.appendChild(section);

    const { result } = renderHook(() =>
      useActiveSection(["general-information", "other"])
    );

    expect(result.current.activeSectionId).toBeNull();

    // Section center must be within active zone (20%-60% of viewport)
    const vh = window.innerHeight;
    const zoneTop = vh * 0.2;
    const zoneBottom = vh * 0.6;
    const sectionCenter = (zoneTop + zoneBottom) / 2;
    const sectionTop = sectionCenter - 50;
    const sectionBottom = sectionCenter + 50;

    act(() => {
      observerCallback([
        {
          target: section,
          isIntersecting: true,
          boundingClientRect: {
            top: sectionTop,
            bottom: sectionBottom,
            left: 0,
            right: 100,
            width: 100,
            height: 100,
            x: 0,
            y: sectionTop,
            toJSON: () => ({}),
          },
          intersectionRatio: 1,
          intersectionRect: {
            top: sectionTop,
            bottom: sectionBottom,
            left: 0,
            right: 100,
            width: 100,
            height: 100,
            x: 0,
            y: sectionTop,
            toJSON: () => ({}),
          },
          rootBounds: null,
          time: 0,
        } as IntersectionObserverEntry,
      ]);
    });

    expect(result.current.activeSectionId).toBe("general-information");

    document.body.removeChild(section);
  });

  it("ignores intersection for ids not in sectionIds", () => {
    const section = document.createElement("div");
    section.id = "unknown-section";
    document.body.appendChild(section);

    const { result } = renderHook(() =>
      useActiveSection(["general-information"])
    );

    act(() => {
      observerCallback([
        {
          target: section,
          isIntersecting: true,
          boundingClientRect: {
            top: 0,
            bottom: 100,
            left: 0,
            right: 100,
            width: 100,
            height: 100,
            x: 0,
            y: 0,
            toJSON: () => ({}),
          },
          intersectionRatio: 1,
          intersectionRect: {
            top: 0,
            bottom: 100,
            left: 0,
            right: 100,
            width: 100,
            height: 100,
            x: 0,
            y: 0,
            toJSON: () => ({}),
          },
          rootBounds: null,
          time: 0,
        } as IntersectionObserverEntry,
      ]);
    });

    expect(result.current.activeSectionId).toBeNull();

    document.body.removeChild(section);
  });

  it("observes elements that exist in the DOM", () => {
    const section = document.createElement("div");
    section.id = "general-information";
    document.body.appendChild(section);

    renderHook(() => useActiveSection(["general-information"]));

    expect(observeTargets.length).toBe(1);
    expect(observeTargets[0].id).toBe("general-information");

    document.body.removeChild(section);
  });

  it("highlights section containing focused element when user focuses a field (e.g. Other/Notes)", () => {
    const otherSection = document.createElement("div");
    otherSection.id = "other";
    const input = document.createElement("input");
    input.type = "text";
    otherSection.appendChild(input);
    document.body.appendChild(otherSection);

    const { result } = renderHook(() =>
      useActiveSection(["general-information", "contacts-address", "other"])
    );

    expect(result.current.activeSectionId).toBeNull();

    act(() => {
      input.focus();
    });

    expect(result.current.activeSectionId).toBe("other");

    document.body.removeChild(otherSection);
  });
});
