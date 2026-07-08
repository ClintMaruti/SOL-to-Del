import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { useSupplierServiceDetailTabs } from "../model/useSupplierServiceDetailTabs";

function createWrapper(initialEntry = "/service") {
  return ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/service" element={children} />
      </Routes>
    </MemoryRouter>
  );
}

function LocationDisplay() {
  const location = useLocation();
  return <span data-testid="search">{location.search}</span>;
}

function TestHarness({ initialEntry = "/service" }: { initialEntry?: string }) {
  return (
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/service" element={<TabsConsumer />} />
      </Routes>
    </MemoryRouter>
  );
}

function TabsConsumer() {
  const { activeTab, tabBar } = useSupplierServiceDetailTabs();
  return (
    <div>
      <span data-testid="active-tab">{activeTab}</span>
      {tabBar}
      <LocationDisplay />
    </div>
  );
}

describe("useSupplierServiceDetailTabs", () => {
  describe("default behavior", () => {
    it("should default to general tab when no tab param is present", () => {
      const wrapper = createWrapper("/service");
      const { result } = renderHook(() => useSupplierServiceDetailTabs(), {
        wrapper,
      });

      expect(result.current.activeTab).toBe("general");
    });

    it("should read tab from URL search params", () => {
      const wrapper = createWrapper("/service?tab=options");
      const { result } = renderHook(() => useSupplierServiceDetailTabs(), {
        wrapper,
      });

      expect(result.current.activeTab).toBe("options");
    });
  });

  describe("setActiveTab", () => {
    it("should update activeTab when setActiveTab is called", () => {
      const wrapper = createWrapper("/service");
      const { result } = renderHook(() => useSupplierServiceDetailTabs(), {
        wrapper,
      });

      act(() => {
        result.current.setActiveTab("notes");
      });

      expect(result.current.activeTab).toBe("notes");
    });

    it("should remove tab param when switching back to default tab", () => {
      render(<TestHarness initialEntry="/service?tab=closeout" />);

      expect(screen.getByTestId("active-tab").textContent).toBe("closeout");
      expect(screen.getByTestId("search").textContent).toBe("?tab=closeout");
    });
  });

  describe("tab bar rendering", () => {
    it("should render all service detail tabs including Rates, Rate Plan, and Eligibility", () => {
      render(<TestHarness />);

      expect(screen.getByRole("tab", { name: "General" })).toBeDefined();
      expect(screen.getByRole("tab", { name: "Options" })).toBeDefined();
      expect(screen.getByRole("tab", { name: "Rates" })).toBeDefined();
      expect(screen.getByRole("tab", { name: "Rate Plan" })).toBeDefined();
      expect(screen.getByRole("tab", { name: "Eligibility" })).toBeDefined();
      expect(screen.getByRole("tab", { name: "Closeout" })).toBeDefined();
      expect(screen.getByRole("tab", { name: "Notes" })).toBeDefined();
      expect(screen.getByRole("tab", { name: "Extras" })).toBeDefined();
    });

    it("should read rates tab from URL search params", () => {
      render(<TestHarness initialEntry="/service?tab=rates" />);

      expect(screen.getByTestId("active-tab").textContent).toBe("rates");
    });

    it("should mark the active tab as selected", () => {
      render(<TestHarness initialEntry="/service?tab=options" />);

      const optionsTab = screen.getByRole("tab", { name: "Options" });
      expect(optionsTab.getAttribute("data-state")).toBe("active");

      const generalTab = screen.getByRole("tab", { name: "General" });
      expect(generalTab.getAttribute("data-state")).toBe("inactive");
    });

    it("should switch active tab when a tab trigger is clicked", async () => {
      const user = userEvent.setup();
      render(<TestHarness />);

      expect(screen.getByTestId("active-tab").textContent).toBe("general");

      await user.click(screen.getByRole("tab", { name: "Closeout" }));

      expect(screen.getByTestId("active-tab").textContent).toBe("closeout");
      expect(screen.getByTestId("search").textContent).toBe("?tab=closeout");
    });

    it("should navigate to ratePlan tab via URL param", () => {
      const wrapper = createWrapper("/service?tab=ratePlan");
      const { result } = renderHook(() => useSupplierServiceDetailTabs(), {
        wrapper,
      });

      expect(result.current.activeTab).toBe("ratePlan");
    });

    it("should remove tab param from URL when General tab is clicked", async () => {
      const user = userEvent.setup();
      render(<TestHarness initialEntry="/service?tab=notes" />);

      await user.click(screen.getByRole("tab", { name: "General" }));

      expect(screen.getByTestId("active-tab").textContent).toBe("general");
      expect(screen.getByTestId("search").textContent).toBe("");
    });
  });
});
