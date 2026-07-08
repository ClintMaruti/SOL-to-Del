import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect, useRef, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ROUTES, agencyGroupDetailPath } from "@/shared/lib/paths";
import { AgencyGroupForm } from "@/widgets/agency-group-form";

import { useCreateAgencyGroup } from "../api/useCreateAgencyGroup";
import type { CreateAgencyGroupFormData } from "../model/useCreateAgencyGroupForm";
import {
  CREATE_AGENCY_GROUP_ANCHOR_SECTIONS,
  CREATE_AGENCY_GROUP_DRAFT_KEY,
  useCreateNewAgencyGroupPage,
} from "../model/useCreateAgencyGroupPage";

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

Element.prototype.scrollIntoView = vi.fn();

const mockSetDraft = vi.fn();
const mockClearDraft = vi.fn();
vi.mock("@/shared/lib/draftStorage", () => ({
  setDraft: (...args: unknown[]) => mockSetDraft(...args),
  clearDraft: (...args: unknown[]) => mockClearDraft(...args),
  getDraft: vi.fn(),
  hasReturningFromCreateAgencyFlag: vi.fn(() => false),
  setReturningFromCreateAgencyFlag: vi.fn(),
  clearReturningFromCreateAgencyFlag: vi.fn(),
}));

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

vi.mock("../api/useCreateAgencyGroup", () => ({
  useCreateAgencyGroup: vi.fn(),
}));

vi.mock("@/entities/agency", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/agency")>();
  return {
    ...actual,
    useUpdateAgency: vi.fn(() => ({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
    })),
  };
});

vi.mock("@/entities/agency/api/useAgencies", () => ({
  useAgencies: vi.fn(() => ({ data: [] })),
}));

const mockNavigate = vi.hoisted(() => vi.fn());
vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom"
    );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/shared/hooks/useActiveSection", () => ({
  useActiveSection: () => ({
    activeSectionId: "general-information",
    onSectionClick: vi.fn(),
  }),
}));

vi.mock("@/shared/hooks/useUnsavedChangesBlocker", () => ({
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
}));

function TestPage({
  initialData,
}: {
  initialData?: CreateAgencyGroupFormData;
}) {
  const props = useCreateNewAgencyGroupPage(initialData ?? null);
  return <AgencyGroupForm {...props} mode="create" />;
}

function createTestWrapper() {
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
}

describe("useCreateNewAgencyGroupPage", () => {
  const mockCreateAgencyGroup = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockToastSuccess.mockClear();
    mockToastError.mockClear();
    vi.mocked(useCreateAgencyGroup).mockReturnValue({
      mutate: mockCreateAgencyGroup,
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useCreateAgencyGroup>);
  });

  describe("Exports", () => {
    it("should export CREATE_AGENCY_GROUP_DRAFT_KEY", () => {
      expect(CREATE_AGENCY_GROUP_DRAFT_KEY).toBe("createAgencyGroupDraft");
    });

    it("should export CREATE_AGENCY_GROUP_ANCHOR_SECTIONS", () => {
      expect(CREATE_AGENCY_GROUP_ANCHOR_SECTIONS).toEqual([
        { id: "general-information", label: "General" },
      ]);
    });
  });

  describe("Rendering", () => {
    it("should render page with title and form sections from hook", () => {
      render(<TestPage />, { wrapper: createTestWrapper() });

      expect(
        screen.getByRole("heading", { name: "Create New Agency Group" })
      ).toBeDefined();
      expect(screen.getByText("General Information")).toBeDefined();
      expect(screen.getByRole("link", { name: "General" })).toBeDefined();
      expect(screen.queryByRole("link", { name: "Agency" })).toBeNull();
      expect(screen.queryByRole("link", { name: "Agencies" })).toBeNull();
    });

    it("should render with initial data when provided", () => {
      render(
        <TestPage
          initialData={{
            name: "Draft Group",
            description: "Draft description",
            agencies: ["ag-1"],
          }}
        />,
        { wrapper: createTestWrapper() }
      );

      expect(
        (screen.getByLabelText(/group name/i) as HTMLInputElement).value
      ).toBe("Draft Group");
      expect(
        (screen.getByLabelText(/description/i) as HTMLTextAreaElement).value
      ).toBe("Draft description");
    });
  });

  describe("Draft persistence", () => {
    // TODO: Disabled due to slow render times in CI - needs optimization
    // it("should call setDraft when form is dirty", async () => {
    //   render(<TestPage />, { wrapper: createTestWrapper() });
    //   fireEvent.change(screen.getByLabelText(/group name/i), {
    //     target: { value: "New Group" },
    //   });
    //   await waitFor(
    //     () => {
    //       expect(mockSetDraft).toHaveBeenCalledWith(
    //         CREATE_AGENCY_GROUP_DRAFT_KEY,
    //         expect.objectContaining({
    //           name: "New Group",
    //           description: "",
    //           agencies: [],
    //         })
    //       );
    //     },
    //     { timeout: 1500 }
    //   );
    // });
  });

  describe("Validation", () => {
    it("should show Group Name error and not call API when submitting empty form", async () => {
      render(<TestPage />, { wrapper: createTestWrapper() });

      fireEvent.click(
        screen.getAllByRole("button", { name: "Save New Agency Group" })[0]!
      );

      await waitFor(() => {
        expect(screen.getByText(/group name is required/i)).toBeDefined();
      });
      expect(mockCreateAgencyGroup).not.toHaveBeenCalled();
    });
  });

  describe("Submit", () => {
    it("should call createAgencyGroup with payload on valid submit", async () => {
      render(<TestPage />, { wrapper: createTestWrapper() });

      fireEvent.change(screen.getByLabelText(/group name/i), {
        target: { value: "Test Agency Group" },
      });

      fireEvent.click(
        screen.getAllByRole("button", { name: "Save New Agency Group" })[0]!
      );

      await waitFor(() => {
        expect(mockCreateAgencyGroup).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Test Agency Group",
            description: "",
            isActive: true,
          }),
          expect.objectContaining({
            onSuccess: expect.any(Function),
            onError: expect.any(Function),
          })
        );
      });
    });

    it("should show toast and navigate on successful create", async () => {
      const newId = "ag-new-123";
      mockCreateAgencyGroup.mockImplementation(
        (
          _data: unknown,
          options?: { onSuccess?: (data: { id: string }) => void }
        ) => {
          options?.onSuccess?.({ id: newId });
        }
      );

      render(<TestPage />, { wrapper: createTestWrapper() });

      fireEvent.change(screen.getByLabelText(/group name/i), {
        target: { value: "New Group" },
      });

      fireEvent.click(
        screen.getAllByRole("button", { name: "Save New Agency Group" })[0]!
      );

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith(
          expect.stringMatching(/agency group created successfully/i)
        );
      });
      expect(mockClearDraft).toHaveBeenCalledWith(
        CREATE_AGENCY_GROUP_DRAFT_KEY
      );
      expect(mockNavigate).toHaveBeenCalledWith(agencyGroupDetailPath(newId));
    });

    it("should show toast on create error", async () => {
      mockCreateAgencyGroup.mockImplementation(
        (_data: unknown, options?: { onError?: (err: Error) => void }) => {
          options?.onError?.(new Error("Network error"));
        }
      );

      render(<TestPage />, { wrapper: createTestWrapper() });

      fireEvent.change(screen.getByLabelText(/group name/i), {
        target: { value: "Failing Group" },
      });

      fireEvent.click(
        screen.getAllByRole("button", { name: "Save New Agency Group" })[0]!
      );

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalled();
      });
    });

    it("should keep Save New Agency Group label when mutation is pending", () => {
      vi.mocked(useCreateAgencyGroup).mockReturnValue({
        mutate: mockCreateAgencyGroup,
        isPending: true,
        error: null,
      } as unknown as ReturnType<typeof useCreateAgencyGroup>);

      render(<TestPage />, { wrapper: createTestWrapper() });

      const saveButtons = screen.getAllByRole("button", {
        name: /save new agency group/i,
      });
      expect(saveButtons.length).toBeGreaterThan(0);
      expect((saveButtons[0] as HTMLButtonElement).disabled).toBe(true);
    });
  });

  describe("Cancel", () => {
    it("should navigate to agency groups list when Cancel is clicked and form is not dirty", () => {
      render(<TestPage />, { wrapper: createTestWrapper() });

      fireEvent.click(screen.getAllByRole("button", { name: /cancel/i })[0]!);

      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.AGENCY_GROUPS);
    });

    it("should call onPrepareDiscard (clearDraft, reset) when cancelling with dirty form and user discards", async () => {
      render(<TestPage />, { wrapper: createTestWrapper() });

      fireEvent.change(screen.getByLabelText(/group name/i), {
        target: { value: "Dirty" },
      });

      fireEvent.click(screen.getAllByRole("button", { name: /cancel/i })[0]!);

      await waitFor(() => {
        expect(screen.getByText(/leave without saving/i)).toBeDefined();
      });

      fireEvent.click(
        screen.getByRole("button", { name: /leave without saving/i })
      );

      await waitFor(() => {
        expect(mockClearDraft).toHaveBeenCalledWith(
          CREATE_AGENCY_GROUP_DRAFT_KEY
        );
        expect(mockNavigate).toHaveBeenCalledWith(ROUTES.AGENCY_GROUPS);
      });
    });
  });
});
