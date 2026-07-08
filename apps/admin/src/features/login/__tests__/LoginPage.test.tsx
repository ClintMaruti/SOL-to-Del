import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoginPage } from "@/pages/LoginPage";

// Mock the auth-config module (keep real helpers used by LoginPage)
const mockGetLoginUrl = vi.fn();
vi.mock("@/shared/lib/auth-config", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/shared/lib/auth-config")>();
  return {
    ...actual,
    getLoginUrl: (returnUrlPathOrFullUrl?: string) =>
      mockGetLoginUrl(returnUrlPathOrFullUrl),
  };
});

// Create a wrapper with Router for testing
const createTestWrapper = (initialEntries = ["/login"]) => {
  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
  );
};

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLoginUrl.mockReturnValue("http://localhost:5447/api/auth/login");

    // Mock window.location.href
    Object.defineProperty(window, "location", {
      value: {
        href: "",
      },
      writable: true,
      configurable: true,
    });
  });

  describe("Rendering", () => {
    it("should render logo", () => {
      render(<LoginPage />, { wrapper: createTestWrapper() });

      const logo = screen.getByAltText("CHELI & PEACOCK SAFARIS East Africa");
      expect(logo).toBeDefined();
      expect(logo.getAttribute("src")).toBeTruthy();
    });

    it("should render background watermark", () => {
      render(<LoginPage />, { wrapper: createTestWrapper() });

      const watermark = screen.getByAltText("");
      expect(watermark).toBeDefined();
      // aria-hidden is on the parent div, not the img
      const parentDiv = watermark.parentElement;
      expect(parentDiv?.getAttribute("aria-hidden")).toBe("true");
    });

    it("should render Login button", () => {
      render(<LoginPage />, { wrapper: createTestWrapper() });

      const loginButton = screen.getByRole("button", { name: /login/i });
      expect(loginButton).toBeDefined();
      expect(loginButton.getAttribute("data-variant")).toBe("primary");
      expect(loginButton.getAttribute("data-size")).toBe("lg");
      expect(loginButton.className.includes("w-full")).toBe(true);
    });

    it("should render footer with copyright", () => {
      render(<LoginPage />, { wrapper: createTestWrapper() });

      const currentYear = new Date().getFullYear();
      expect(
        screen.getByText(
          new RegExp(`© Cheli & Peacock ${currentYear}. All Rights Reserved`)
        )
      ).toBeDefined();
    });
  });

  describe("Login Button Click", () => {
    it("should redirect to backend login URL when Login button is clicked", () => {
      const mockLoginUrl = "http://localhost:5447/api/auth/login";
      mockGetLoginUrl.mockReturnValue(mockLoginUrl);

      // Spy on window.location.href assignment
      let hrefValue = "";
      const hrefSetter = vi.fn((value: string) => {
        hrefValue = value;
      });

      Object.defineProperty(window, "location", {
        configurable: true,
        value: {
          get href() {
            return hrefValue;
          },
          set href(value: string) {
            hrefSetter(value);
          },
        },
      });

      render(<LoginPage />, { wrapper: createTestWrapper() });

      const loginButton = screen.getByRole("button", { name: /login/i });
      fireEvent.click(loginButton);

      expect(mockGetLoginUrl).toHaveBeenCalledWith(
        "/database/destinations/destinations"
      );
      expect(hrefSetter).toHaveBeenCalledWith(mockLoginUrl);
    });

    it("should call getLoginUrl with default dashboard path when on /login path", () => {
      render(<LoginPage />, { wrapper: createTestWrapper(["/login"]) });

      const loginButton = screen.getByRole("button", { name: /login/i });
      fireEvent.click(loginButton);

      expect(mockGetLoginUrl).toHaveBeenCalledWith(
        "/database/destinations/destinations"
      );
    });

    it("should call getLoginUrl with current path when not on /login", () => {
      render(<LoginPage />, {
        wrapper: createTestWrapper(["/database/destinations"]),
      });

      const loginButton = screen.getByRole("button", { name: /login/i });
      fireEvent.click(loginButton);

      expect(mockGetLoginUrl).toHaveBeenCalledWith("/database/destinations");
    });

    it("should include search params in returnUrl when present", () => {
      render(<LoginPage />, {
        wrapper: createTestWrapper(["/database/destinations?filter=active"]),
      });

      const loginButton = screen.getByRole("button", { name: /login/i });
      fireEvent.click(loginButton);

      expect(mockGetLoginUrl).toHaveBeenCalledWith(
        "/database/destinations?filter=active"
      );
    });

    it("should use returnUrl query param (full URL) for IdP redirect after deep link", () => {
      const fullReturn =
        "https://frontend.test/admin/database/destinations/suppliers/supplier-uuid";
      const query = `?returnUrl=${encodeURIComponent(fullReturn)}`;
      render(<LoginPage />, {
        wrapper: createTestWrapper([`/login${query}`]),
      });

      const loginButton = screen.getByRole("button", { name: /login/i });
      fireEvent.click(loginButton);

      expect(mockGetLoginUrl).toHaveBeenCalledWith(
        "/database/destinations/suppliers/supplier-uuid"
      );
    });
  });

  describe("Layout", () => {
    it("should render logo at the top", () => {
      render(<LoginPage />, { wrapper: createTestWrapper() });

      const logo = screen.getByAltText("CHELI & PEACOCK SAFARIS East Africa");
      expect(logo).toBeDefined();
    });

    it("should render Login button in center", () => {
      render(<LoginPage />, { wrapper: createTestWrapper() });

      const loginButton = screen.getByRole("button", { name: /login/i });
      expect(loginButton).toBeDefined();
    });

    it("should render footer at the bottom", () => {
      render(<LoginPage />, { wrapper: createTestWrapper() });

      const footer = screen.getByText(/© Cheli & Peacock/);
      expect(footer).toBeDefined();
    });
  });
});
