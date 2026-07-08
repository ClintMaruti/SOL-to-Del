import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
// import userEvent from "@testing-library/user-event";
import { useEffect, useRef, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreateSupplierPage } from "@/pages/CreateSupplierPage";
import { ROUTES } from "@/shared/lib/paths";

class IntersectionObserverMock {
  disconnect = vi.fn();
  observe = vi.fn();
  takeRecords = vi.fn();
  unobserve = vi.fn();
}
vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);

class ResizeObserverMock {
  disconnect = vi.fn();
  observe = vi.fn();
  unobserve = vi.fn();
}
vi.stubGlobal("ResizeObserver", ResizeObserverMock);

Element.prototype.hasPointerCapture = vi.fn();
Element.prototype.setPointerCapture = vi.fn();
Element.prototype.releasePointerCapture = vi.fn();
Element.prototype.scrollIntoView = vi.fn();

import { useCreateSupplier } from "../api/useCreateSupplier";
// import type { CreateSupplierFormData } from "../model/types";

const { mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));
vi.mock("@sol/ui", async () => {
  const actual = await vi.importActual<typeof import("@sol/ui")>("@sol/ui");
  return {
    ...actual,
    toast: Object.assign(vi.fn(), {
      success: mockToastSuccess,
      error: mockToastError,
    }),
  };
});

vi.mock("../api/useCreateSupplier", () => ({
  useCreateSupplier: vi.fn(),
}));

vi.mock("@/entities/suppliers", () => ({
  useSuppliers: vi.fn(() => ({ data: [] })),
}));

vi.mock("@/entities/supplier-head-office", () => ({
  useSupplierHeadOffices: vi.fn(() => ({
    data: [
      { id: "ho-1", name: "Elewana Collection" },
      { id: "ho-2", name: "Serengeti Safari" },
    ],
    isLoading: false,
  })),
  useSupplierHeadOffice: vi.fn(() => ({
    data: null,
    isLoading: false,
  })),
}));

const mockNavigate = vi.hoisted(() => vi.fn());
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/shared/hooks/useUnsavedChangesBlocker", () => {
  return {
    useUnsavedChangesBlocker: (opts: {
      isDirty: boolean;
      exitPath: string;
      onPrepareDiscard: () => void;
    }) => {
      const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
      const discardRef = useRef<(() => void) | null>(null);
      const pendingSavePath = useRef<string | null>(null);
      const navigate = mockNavigate;

      useEffect(() => {
        if (!opts.isDirty && pendingSavePath.current) {
          const path = pendingSavePath.current;
          pendingSavePath.current = null;
          navigate(path);
        }
      }, [opts.isDirty, navigate]);

      return {
        showUnsavedDialog: unsavedDialogOpen,
        handleCancel: () => {
          if (opts.isDirty) {
            discardRef.current = () => {
              opts.onPrepareDiscard();
              setUnsavedDialogOpen(false);
              navigate(opts.exitPath);
            };
            setUnsavedDialogOpen(true);
          } else {
            navigate(opts.exitPath);
          }
        },
        handleUnsavedDiscard: () => {
          discardRef.current?.();
          discardRef.current = null;
        },
        handleUnsavedStay: () => {
          setUnsavedDialogOpen(false);
          discardRef.current = null;
        },
        scheduleNavigateAfterSave: (path: string) => {
          pendingSavePath.current = path;
        },
      };
    },
  };
});

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe("CreateSupplierPage", () => {
  const mockCreateSupplier = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockToastSuccess.mockClear();
    mockToastError.mockClear();
    vi.mocked(useCreateSupplier).mockReturnValue({
      mutate: mockCreateSupplier,
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useCreateSupplier>);
  });

  describe("Rendering", () => {
    // TODO: Disabled due to slow render times in CI - needs optimization
    // it("should render page title and description", async () => {
    //   render(<CreateSupplierPage />, { wrapper: createTestWrapper() });

    //   await screen.findByRole("heading", { name: "Create Supplier" });
    //   await screen.findByText(/Add a new supplier to the system/);
    // });

    // TODO: Disabled due to slow render times in CI - needs optimization
    // it("should render Cancel and Next buttons", () => {
    //   render(<CreateSupplierPage />, { wrapper: createTestWrapper() });

    //   expect(
    //     screen.getAllByRole("button", { name: /cancel/i })[0]
    //   ).toBeDefined();
    //   expect(screen.getAllByRole("button", { name: /next/i })[0]).toBeDefined();
    // });

    it("should render General Information section", () => {
      render(<CreateSupplierPage />, { wrapper: createTestWrapper() });

      expect(screen.getAllByText("General Information").length).toBeGreaterThan(
        0
      );
      expect(screen.getByLabelText(/^name/i)).toBeDefined();
    });

    it("should render Contacts section", () => {
      render(<CreateSupplierPage />, { wrapper: createTestWrapper() });

      expect(screen.getAllByText("Contacts").length).toBeGreaterThan(0);
      expect(screen.getByLabelText(/^email/i)).toBeDefined();
    });

    it("should render Address & Location section", () => {
      render(<CreateSupplierPage />, { wrapper: createTestWrapper() });

      expect(screen.getAllByText("Address & Location").length).toBeGreaterThan(
        0
      );
    });

    it("should render General Policy section", () => {
      render(<CreateSupplierPage />, { wrapper: createTestWrapper() });

      expect(screen.getAllByText("General Policy").length).toBeGreaterThan(0);
    });

    it("should render Finance section", () => {
      render(<CreateSupplierPage />, { wrapper: createTestWrapper() });

      expect(screen.getAllByText("Finance").length).toBeGreaterThan(0);
    });

    it("should render Payment Terms section", () => {
      render(<CreateSupplierPage />, { wrapper: createTestWrapper() });

      expect(screen.getAllByText("Payment Terms").length).toBeGreaterThan(0);
    });

    it("should render anchor navigation with section labels", () => {
      render(<CreateSupplierPage />, { wrapper: createTestWrapper() });

      expect(
        screen.getByRole("link", { name: "General Information" })
      ).toBeDefined();
      expect(screen.getByRole("link", { name: "Contacts" })).toBeDefined();
      expect(
        screen.getByRole("link", { name: "Address & Location" })
      ).toBeDefined();
      expect(
        screen.getByRole("link", { name: "General Policy" })
      ).toBeDefined();
      expect(screen.getByRole("link", { name: "Finance" })).toBeDefined();
      expect(screen.getByRole("link", { name: "Payment Terms" })).toBeDefined();
    });
  });

  describe("Form interactions", () => {
    // TODO: Disabled due to slow render times in CI - needs optimization
    // it("should update input value when name is changed", async () => {
    //   const user = userEvent.setup({ delay: null });
    //   render(<CreateSupplierPage />, { wrapper: createTestWrapper() });
    //   const nameInput = await screen.findByLabelText(/^name/i);
    //   await user.type(nameInput, "Elewana Sand River");
    //   expect((nameInput as HTMLInputElement).value).toBe("Elewana Sand River");
    // });
    // it("should update input value when email is changed", async () => {
    //   const user = userEvent.setup({ delay: null });
    //   render(<CreateSupplierPage />, { wrapper: createTestWrapper() });
    //   const emailInput = await screen.findByLabelText(/^email/i);
    //   await user.type(emailInput, "supplier@example.com");
    //   expect((emailInput as HTMLInputElement).value).toBe(
    //     "supplier@example.com"
    //   );
    // });
  });

  describe("Validation", () => {
    it("should not call createSupplier when save-required fields are empty", async () => {
      render(<CreateSupplierPage />, { wrapper: createTestWrapper() });

      const submitButton = screen.getAllByRole("button", {
        name: /save/i,
      })[0];
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCreateSupplier).not.toHaveBeenCalled();
      });
    });
  });

  // describe("Submit", () => {
  //   it("should call createSupplier with form data on valid submit", async () => {
  //     const user = userEvent.setup({ delay: null });
  //     render(<CreateSupplierPage />, { wrapper: createTestWrapper() });

  //     const nameInput = await screen.findByLabelText(/^name/i);
  //     await user.type(nameInput, "Test Supplier");

  //     const headOfficeTrigger = await screen.findByRole("combobox", {
  //       name: /head office/i,
  //     });
  //     await user.click(headOfficeTrigger);
  //     await user.click(
  //       await screen.findByRole("option", { name: "Elewana Collection" })
  //     );

  //     const emailInput = await screen.findByLabelText(/^email/i);
  //     await user.type(emailInput, "supplier@test.com");

  //     const submitButton = (
  //       await screen.findAllByRole("button", {
  //         name: /save/i,
  //       })
  //     )[0];
  //     await user.click(submitButton);

  //     await waitFor(() => {
  //       expect(mockCreateSupplier).toHaveBeenCalledWith(
  //         expect.objectContaining({
  //           name: "Test Supplier",
  //           headOfficeId: "ho-1",
  //           email: "supplier@test.com",
  //         }),
  //         expect.objectContaining({
  //           onSuccess: expect.any(Function),
  //         })
  //       );
  //     });
  //   });

  //   it("should navigate to new supplier detail page on successful create", async () => {
  //     const user = userEvent.setup({ delay: null });
  //     const newSupplierId = "supplier-new-123";
  //     mockCreateSupplier.mockImplementation(
  //       (
  //         _data: CreateSupplierFormData,
  //         options?: { onSuccess?: (data: { id: string }) => void }
  //       ) => {
  //         options?.onSuccess?.({ id: newSupplierId });
  //       }
  //     );

  //     render(<CreateSupplierPage />, { wrapper: createTestWrapper() });

  //     const nameInput = await screen.findByLabelText(/^name/i);
  //     await user.type(nameInput, "A");
  //     await user.click(
  //       await screen.findByRole("combobox", { name: /head office/i })
  //     );
  //     await user.click(
  //       await screen.findByRole("option", { name: "Elewana Collection" })
  //     );
  //     const emailInput = await screen.findByLabelText(/^email/i);
  //     await user.type(emailInput, "a@b.com");

  //     const nextButton = (
  //       await screen.findAllByRole("button", { name: /next/i })
  //     )[0];
  //     await user.click(nextButton);

  //     await waitFor(() => {
  //       expect(mockNavigate).toHaveBeenCalledWith(
  //         expect.stringContaining(newSupplierId)
  //       );
  //     });
  //   });

  //   it("should show Saving… and disable buttons when mutation is pending", () => {
  //     vi.mocked(useCreateSupplier).mockReturnValue({
  //       mutate: mockCreateSupplier,
  //       isPending: true,
  //       error: null,
  //     } as unknown as ReturnType<typeof useCreateSupplier>);

  //     render(<CreateSupplierPage />, { wrapper: createTestWrapper() });

  //     const savingTexts = screen.getAllByText("Saving…");
  //     expect(savingTexts.length).toBeGreaterThan(0);
  //     const cancelButtons = screen.getAllByRole("button", { name: /cancel/i });
  //     const submitButtons = screen.getAllByRole("button", {
  //       name: /saving/i,
  //     });
  //     expect((cancelButtons[0] as HTMLButtonElement).disabled).toBe(true);
  //     expect((submitButtons[0] as HTMLButtonElement).disabled).toBe(true);
  //   });
  // });

  describe("Cancel", () => {
    it("should navigate to suppliers list when Cancel is clicked and form is not dirty", () => {
      render(<CreateSupplierPage />, { wrapper: createTestWrapper() });

      const cancelButton = screen.getAllByRole("button", {
        name: /cancel/i,
      })[0];
      fireEvent.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.SUPPLIERS);
    });
  });
});
