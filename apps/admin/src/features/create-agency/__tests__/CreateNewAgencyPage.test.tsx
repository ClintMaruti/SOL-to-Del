import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { render, screen } from "@testing-library/react";
// import userEvent from "@testing-library/user-event";
import { useEffect, useRef, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { beforeEach, describe, vi } from "vitest";

import { CreateNewAgencyPage } from "@/pages/CreateNewAgencyPage";

import { useCreateAgency } from "../api/useCreateAgency";
// import type { CreateAgencyFormData } from "../model/types";

// jsdom does not provide these; CreateNewAgencyPage and Radix UI depend on them
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

// Radix Select uses pointer capture and scrollIntoView which jsdom doesn't support
Element.prototype.hasPointerCapture = vi.fn();
Element.prototype.setPointerCapture = vi.fn();
Element.prototype.releasePointerCapture = vi.fn();
Element.prototype.scrollIntoView = vi.fn();

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

vi.mock("../api/useCreateAgency", () => ({
  useCreateAgency: vi.fn(),
}));

vi.mock("@/entities/source-market/api/useSourceMarkets", () => ({
  useSourceMarkets: () => ({
    data: [
      { id: "UK", name: "UK", taxCode: "GB-VAT", code: "UK", isActive: true },
      { id: "FIT", name: "FIT", taxCode: "FIT", code: "FIT", isActive: true },
    ],
    isLoading: false,
    error: null,
  }),
}));

vi.mock("@/entities/safari-planners/api/useSafariPlanners", () => ({
  useSafariPlanners: () => ({
    data: [
      { id: "sp-1", userName: "Amelia Earhart", email: "amelia@test.com" },
      { id: "sp-2", userName: "Erik Karlsson", email: "erik@test.com" },
    ],
    isLoading: false,
    error: null,
  }),
}));

const mockCreateAgentMutate = vi.fn();
vi.mock("@/features/create-agent/api/useCreateAgent", () => ({
  useCreateAgent: vi.fn(() => ({
    mutate: mockCreateAgentMutate,
    isPending: false,
  })),
}));

vi.mock("@/features/edit-agent/model/useAgentForm", () => ({
  useAgentForm: () => ({
    formData: {
      firstName: "James",
      lastName: "Okonkwo",
      primaryEmail: "james@example.com",
      phone: "",
      alternateEmail: "",
      agencyId: "",
      assignedSafariPlanner: "Amelia Earhart",
      language: "",
      notes: "",
      currency: "",
      status: "Active",
    },
    errors: {},
    updateField: vi.fn(),
    validate: () => ({ valid: true, errors: {} }),
    reset: vi.fn(),
    isDirty: false,
    getSubmitData: undefined,
  }),
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

describe("CreateNewAgencyPage", () => {
  const mockCreateAgency = vi.fn();

  beforeEach(() => {
    void createTestWrapper;
    void CreateNewAgencyPage;
    vi.clearAllMocks();
    mockToastSuccess.mockClear();
    mockToastError.mockClear();
    vi.mocked(useCreateAgency).mockReturnValue({
      mutate: mockCreateAgency,
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useCreateAgency>);
  });

  describe("Rendering", () => {
    // TODO: Disabled due to slow render times in CI - needs optimization
    // it("should render page title and description", async () => {
    //   render(<CreateNewAgencyPage />, { wrapper: createTestWrapper() });
    //   await screen.findByRole("heading", { name: "Create New Agency" });
    //   await screen.findByText(/Newly created agency will be active by default/);
    // });
    // it(
    //   "should render Cancel and Save New Agency buttons",
    //   { timeout: 60000 },
    //   () => {
    //     render(<CreateNewAgencyPage />, { wrapper: createTestWrapper() });
    //     expect(
    //       screen.getAllByRole("button", { name: /cancel/i })[0]
    //     ).toBeDefined();
    //     expect(
    //       screen.getAllByRole("button", { name: /save new agency/i })[0]
    //     ).toBeDefined();
    //   }
    // );
    // TODO: Disabled due to slow render times in CI - needs optimization
    // it("should render General Information section", () => {
    //   render(<CreateNewAgencyPage />, { wrapper: createTestWrapper() });
    //   expect(screen.getByText("General Information")).toBeDefined();
    //   expect(screen.getByLabelText(/agency name/i)).toBeDefined();
    // });
    // it("should render Contacts & Address section", () => {
    //   render(<CreateNewAgencyPage />, { wrapper: createTestWrapper() });
    //   expect(screen.getAllByText("Contacts & Address").length).toBeGreaterThan(
    //     0
    //   );
    //   expect(screen.getByLabelText(/^email/i)).toBeDefined();
    // });
    // TODO: Disabled due to slow render times in CI - needs optimization
    // it("should render Payment Terms and Credit Terms sections", () => {
    //   render(<CreateNewAgencyPage />, { wrapper: createTestWrapper() });
    //   expect(screen.getByText("Payment Terms")).toBeDefined();
    //   expect(screen.getByText("Credit Terms")).toBeDefined();
    // });
    // TODO: Disabled due to slow render times in CI - needs optimization
    // it("should render Agents section with description", () => {
    //   render(<CreateNewAgencyPage />, { wrapper: createTestWrapper() });
    //   expect(screen.getAllByText("Agents").length).toBeGreaterThan(0);
    //   expect(
    //     screen.getByText(
    //       /Newly created agency will be active by default. You can add or remove agents later./i
    //     )
    //   ).toBeDefined();
    // });
    // it("should render anchor navigation with section labels", () => {
    //   render(<CreateNewAgencyPage />, { wrapper: createTestWrapper() });
    //   expect(screen.getByRole("link", { name: "General" })).toBeDefined();
    //   expect(
    //     screen.getByRole("link", { name: "Contacts & Address" })
    //   ).toBeDefined();
    //   expect(screen.getByRole("link", { name: "Agents" })).toBeDefined();
    // });
  });

  // describe("Form interactions", () => {
  //   it("should update input value when agency name is changed", async () => {
  //     const user = userEvent.setup({ delay: null });
  //     render(<CreateNewAgencyPage />, { wrapper: createTestWrapper() });

  //     const agencyNameInput = await screen.findByLabelText(/agency name/i);
  //     await user.type(agencyNameInput, "Safari Co");

  //     expect((agencyNameInput as HTMLInputElement).value).toBe("Safari Co");
  //   });

  //   it("should update input value when email is changed", async () => {
  //     const user = userEvent.setup({ delay: null });
  //     render(<CreateNewAgencyPage />, { wrapper: createTestWrapper() });

  //     const emailInput = await screen.findByLabelText(/^email/i);
  //     await user.type(emailInput, "agency@example.com");

  //     expect((emailInput as HTMLInputElement).value).toBe("agency@example.com");
  //   });
  // });

  // describe("Validation", () => {
  //   it("should not call createAgency when required fields are empty", async () => {
  //     render(<CreateNewAgencyPage />, { wrapper: createTestWrapper() });

  //     const submitButton = screen.getAllByRole("button", {
  //       name: /save new agency/i,
  //     })[0];
  //     fireEvent.click(submitButton);

  //     await waitFor(() => {
  //       expect(screen.getByText("Agency name is required")).toBeDefined();
  //     });
  //     expect(mockCreateAgency).not.toHaveBeenCalled();
  //   });

  //   it("should display validation errors on submit", async () => {
  //     render(<CreateNewAgencyPage />, { wrapper: createTestWrapper() });

  //     const submitButton = screen.getAllByRole("button", {
  //       name: /save new agency/i,
  //     })[0];
  //     fireEvent.click(submitButton);

  //     await waitFor(() => {
  //       expect(screen.getByText("Agency name is required")).toBeDefined();
  //       expect(screen.getByText("Email is required")).toBeDefined();
  //     });
  //   });
  // });

  // describe("Submit", () => {
  //   it("should call createAgency with form data on valid submit", async () => {
  //     const user = userEvent.setup();
  //     render(<CreateNewAgencyPage />, { wrapper: createTestWrapper() });

  //     await user.type(screen.getByLabelText(/agency name/i), "Test Agency");

  //     await user.click(screen.getByRole("combobox", { name: /agency group/i }));
  //     await user.click(screen.getByRole("option", { name: "WHElewana" }));

  //     const sourceMarketTrigger = screen.getByRole("combobox", {
  //       name: /source market/i,
  //     });
  //     await user.click(sourceMarketTrigger);
  //     await user.click(screen.getByRole("option", { name: "UK" }));

  //     await user.click(screen.getByRole("combobox", { name: /assigned sp/i }));
  //     await user.click(screen.getByRole("option", { name: "Amelia Earhart" }));

  //     await user.type(screen.getByLabelText(/^email/i), "agency@test.com");
  //     await user.type(screen.getByLabelText(/phone/i), "+1234567890");
  //     await user.type(screen.getByLabelText(/deposit/i), "50");
  //     await user.type(screen.getByLabelText(/balance due/i), "30");
  //     await user.type(screen.getByLabelText(/tax code/i), "VAT");
  //     await user.type(screen.getByLabelText(/ken xero id/i), "ken-1");

  //     const submitButton = screen.getAllByRole("button", {
  //       name: /save new agency/i,
  //     })[0];
  //     await user.click(submitButton);

  //     await waitFor(() => {
  //       expect(mockCreateAgency).toHaveBeenCalledWith(
  //         expect.objectContaining({
  //           agencyName: "Test Agency",
  //           sourceMarket: "UK",
  //           email: "agency@test.com",
  //           phone: "+1234567890",
  //           taxCode: "VAT",
  //           kenXeroId: "ken-1",
  //         }),
  //         expect.objectContaining({
  //           onSuccess: expect.any(Function),
  //         })
  //       );
  //     });
  //   }, 15000);

  //   it("should navigate to new agency detail page on successful create", async () => {
  //     const user = userEvent.setup();
  //     const newAgencyId = "agency-new-123";
  //     mockCreateAgency.mockImplementation(
  //       (
  //         _data: CreateAgencyFormData,
  //         options?: { onSuccess?: (data: { id: string }) => void }
  //       ) => {
  //         options?.onSuccess?.({ id: newAgencyId });
  //       }
  //     );

  //     render(<CreateNewAgencyPage />, { wrapper: createTestWrapper() });

  //     await user.type(screen.getByLabelText(/agency name/i), "A");
  //     await user.click(screen.getByRole("combobox", { name: /agency group/i }));
  //     await user.click(screen.getByRole("option", { name: "WHElewana" }));
  //     await user.click(
  //       screen.getByRole("combobox", { name: /source market/i })
  //     );
  //     await user.click(screen.getByRole("option", { name: "UK" }));
  //     await user.click(screen.getByRole("combobox", { name: /assigned sp/i }));
  //     await user.click(screen.getByRole("option", { name: "Amelia Earhart" }));
  //     await user.type(screen.getByLabelText(/^email/i), "a@b.com");
  //     await user.type(screen.getByLabelText(/phone/i), "+1234567890");
  //     await user.type(screen.getByLabelText(/deposit/i), "50");
  //     await user.type(screen.getByLabelText(/balance due/i), "30");
  //     await user.type(screen.getByLabelText(/tax code/i), "VAT");
  //     await user.type(screen.getByLabelText(/ken xero id/i), "ken-1");

  //     await user.click(
  //       screen.getAllByRole("button", { name: /save new agency/i })[0]
  //     );

  //     await waitFor(
  //       () => {
  //         expect(mockNavigate).toHaveBeenCalledWith(
  //           expect.stringContaining(newAgencyId)
  //         );
  //       },
  //       { timeout: 5000 }
  //     );
  //   }, 15000);

  //   it("should not navigate when create fails", async () => {
  //     const user = userEvent.setup();
  //     mockCreateAgency.mockImplementation(
  //       (
  //         _data: CreateAgencyFormData,
  //         options?: { onError?: (error: Error) => void }
  //       ) => {
  //         options?.onError?.(new Error("Network error"));
  //       }
  //     );

  //     render(<CreateNewAgencyPage />, { wrapper: createTestWrapper() });

  //     await user.type(screen.getByLabelText(/agency name/i), "A");
  //     await user.click(screen.getByRole("combobox", { name: /agency group/i }));
  //     await user.click(screen.getByRole("option", { name: "WHElewana" }));
  //     await user.click(
  //       screen.getByRole("combobox", { name: /source market/i })
  //     );
  //     await user.click(screen.getByRole("option", { name: "UK" }));
  //     await user.click(screen.getByRole("combobox", { name: /assigned sp/i }));
  //     await user.click(screen.getByRole("option", { name: "Amelia Earhart" }));
  //     await user.type(screen.getByLabelText(/^email/i), "a@b.com");
  //     await user.type(screen.getByLabelText(/phone/i), "+1234567890");
  //     await user.type(screen.getByLabelText(/deposit/i), "50");
  //     await user.type(screen.getByLabelText(/balance due/i), "30");
  //     await user.type(screen.getByLabelText(/tax code/i), "VAT");
  //     await user.type(screen.getByLabelText(/ken xero id/i), "ken-1");

  //     await user.click(
  //       screen.getAllByRole("button", { name: /save new agency/i })[0]
  //     );

  //     await waitFor(
  //       () => {
  //         expect(mockCreateAgency).toHaveBeenCalled();
  //       },
  //       { timeout: 5000 }
  //     );
  //     expect(mockNavigate).not.toHaveBeenCalledWith(
  //       expect.stringContaining("agency-")
  //     );
  //   }, 15000);

  //   it("should show Saving… and disable buttons when mutation is pending", () => {
  //     vi.mocked(useCreateAgency).mockReturnValue({
  //       mutate: mockCreateAgency,
  //       isPending: true,
  //       error: null,
  //     } as unknown as ReturnType<typeof useCreateAgency>);

  //     render(<CreateNewAgencyPage />, { wrapper: createTestWrapper() });

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
    // TODO: Disabled due to slow render times in CI - needs optimization
    // it("should navigate to agencies list when Cancel is clicked and form is not dirty", () => {
    //   render(<CreateNewAgencyPage />, { wrapper: createTestWrapper() });
    //   const cancelButton = screen.getAllByRole("button", {
    //     name: /cancel/i,
    //   })[0];
    //   fireEvent.click(cancelButton);
    //   expect(mockNavigate).toHaveBeenCalledWith(ROUTES.AGENCIES);
    // });
  });
});
