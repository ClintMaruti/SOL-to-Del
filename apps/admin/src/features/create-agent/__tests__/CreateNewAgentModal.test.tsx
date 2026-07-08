import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUpdateAgent } from "@/entities/agent";
import type { UpdateAgentRequest } from "@/entities/agent/model/api-types";
import type { Agent } from "@/entities/agent/model/types";
import type { AgentFormData } from "@/features/edit-agent/model/useAgentForm";
import { useAgentForm } from "@/features/edit-agent/model/useAgentForm";

import { useCreateAgent } from "../api/useCreateAgent";
import { CreateNewAgentModal } from "../ui/CreateNewAgentModal";

const { mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock("@/features/edit-agent/model/useAgentForm", () => ({
  useAgentForm: vi.fn(),
}));

vi.mock("@sol/ui", async () => {
  const actual = await vi.importActual<typeof import("@sol/ui")>("@sol/ui");
  return {
    ...actual,
    toast: {
      success: mockToastSuccess,
      error: mockToastError,
    },
  };
});

const mockMutate = vi.fn();
const mockResetCreateMutation = vi.fn();
const mockResetUpdateMutation = vi.fn();
vi.mock("../api/useCreateAgent", () => ({
  useCreateAgent: vi.fn(() => ({
    mutate: mockMutate,
    isPending: false,
    error: null,
    reset: mockResetCreateMutation,
  })),
}));

const mockUpdateAgent = vi.fn();
vi.mock("@/entities/agent", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/agent")>();
  return {
    ...actual,
    useUpdateAgent: vi.fn(() => ({
      mutate: mockUpdateAgent,
      isPending: false,
      error: null,
      reset: mockResetUpdateMutation,
    })),
  };
});

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

const defaultFormData: AgentFormData = {
  firstName: "Johnatan",
  lastName: "Annan",
  agencyId: "",
  assignedSafariPlannerId: "sp-2",
  assignedSafariPlannerName: "Amelia Earhart",
  primaryEmail: "",
  phone: "",
  alternateEmail: "",
  notes: "",
  language: "",
  currency: "",
  status: "Active",
};

describe("CreateNewAgentModal", () => {
  const mockOnOpenChange = vi.fn();
  const mockUpdateField = vi.fn();
  const mockValidate = vi.fn(() => ({ valid: true, errors: {} }));
  const mockReset = vi.fn();

  const fakeCreatedAgent: Agent = {
    id: "agent-new-1",
    version: 0,
    firstName: "Johnatan",
    lastName: "Annan",
    primaryEmail: "johnatan@example.com",
    phoneNumber: "",
    agencyId: "",
    agencyGroups: [],
    assignedSafariPlannerId: "sp-2",
    assignedSafariPlannerName: "Amelia Earhart",
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutate.mockImplementation(
      (_payload: unknown, opts?: { onSuccess?: (agent: Agent) => void }) => {
        opts?.onSuccess?.(fakeCreatedAgent);
      }
    );
    vi.mocked(useCreateAgent).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: null,
      reset: mockResetCreateMutation,
    } as unknown as ReturnType<typeof useCreateAgent>);
    vi.mocked(useUpdateAgent).mockReturnValue({
      mutate: mockUpdateAgent,
      isPending: false,
      error: null,
      reset: mockResetUpdateMutation,
    } as unknown as ReturnType<typeof useUpdateAgent>);
    vi.mocked(useAgentForm).mockReturnValue({
      formData: defaultFormData,
      errors: {},
      updateField: mockUpdateField,
      validate: mockValidate,
      reset: mockReset,
      isDirty: false,
      getSubmitData: undefined,
    } as unknown as ReturnType<typeof useAgentForm>);
  });

  describe("Rendering", () => {
    it("should not render modal content when open is false", () => {
      renderWithProviders(
        <CreateNewAgentModal open={false} onOpenChange={mockOnOpenChange} />
      );

      expect(
        screen.queryByRole("heading", { name: "Create New Agent" })
      ).toBeNull();
    });

    it("should render modal when open is true", () => {
      renderWithProviders(
        <CreateNewAgentModal open={true} onOpenChange={mockOnOpenChange} />
      );

      expect(
        screen.getByRole("heading", { name: "Create New Agent" })
      ).toBeDefined();
      expect(
        screen.getByText(/Newly created agent will be active by default/)
      ).toBeDefined();
    });

    it("should render all form fields when open", () => {
      renderWithProviders(
        <CreateNewAgentModal open={true} onOpenChange={mockOnOpenChange} />
      );

      expect(screen.getByLabelText(/first name/i)).toBeDefined();
      expect(screen.getByLabelText(/last name/i)).toBeDefined();
      expect(screen.getByLabelText(/^email/i)).toBeDefined();
      expect(screen.getByLabelText(/alternate email/i)).toBeDefined();
      expect(screen.getByLabelText(/phone/i)).toBeDefined();
      expect(screen.getByLabelText(/notes/i)).toBeDefined();
      expect(screen.getByLabelText(/assigned sp/i)).toBeDefined();
    });

    it("should render Cancel and Create Agent buttons", () => {
      renderWithProviders(
        <CreateNewAgentModal open={true} onOpenChange={mockOnOpenChange} />
      );

      expect(screen.getByRole("button", { name: /cancel/i })).toBeDefined();
      expect(
        screen.getByRole("button", { name: "Create Agent" })
      ).toBeDefined();
    });

    it("should display validation errors when present", () => {
      vi.mocked(useAgentForm).mockReturnValue({
        formData: defaultFormData,
        errors: {
          firstName: "First name is required",
          primaryEmail: "Email is required",
        },
        updateField: mockUpdateField,
        validate: mockValidate,
        reset: mockReset,
        isDirty: false,
        getSubmitData: undefined,
      } as unknown as ReturnType<typeof useAgentForm>);

      renderWithProviders(
        <CreateNewAgentModal open={true} onOpenChange={mockOnOpenChange} />
      );

      expect(screen.getByText("First name is required")).toBeDefined();
      expect(screen.getByText("Email is required")).toBeDefined();
    });

    it("should show pre-filled first and last name from form data", () => {
      renderWithProviders(
        <CreateNewAgentModal open={true} onOpenChange={mockOnOpenChange} />
      );

      const firstNameInput = screen.getByLabelText(
        /first name/i
      ) as HTMLInputElement;
      const lastNameInput = screen.getByLabelText(
        /last name/i
      ) as HTMLInputElement;

      expect(firstNameInput.value).toBe("Johnatan");
      expect(lastNameInput.value).toBe("Annan");
    });
  });

  describe("User interactions", () => {
    it("should call updateField when first name is changed", () => {
      renderWithProviders(
        <CreateNewAgentModal open={true} onOpenChange={mockOnOpenChange} />
      );

      const firstNameInput = screen.getByLabelText(/first name/i);
      fireEvent.change(firstNameInput, { target: { value: "Jane" } });

      expect(mockUpdateField).toHaveBeenCalledWith(
        "firstName",
        expect.any(String)
      );
    });

    it("should call updateField when last name is changed", () => {
      renderWithProviders(
        <CreateNewAgentModal open={true} onOpenChange={mockOnOpenChange} />
      );

      const lastNameInput = screen.getByLabelText(/last name/i);
      fireEvent.change(lastNameInput, { target: { value: "Annan Doe" } });

      expect(mockUpdateField).toHaveBeenCalledWith(
        "lastName",
        expect.any(String)
      );
    });

    it("should call updateField when email is changed", () => {
      renderWithProviders(
        <CreateNewAgentModal open={true} onOpenChange={mockOnOpenChange} />
      );

      const emailInput = screen.getByLabelText(/^email/i);
      fireEvent.change(emailInput, { target: { value: "jane@example.com" } });

      expect(mockUpdateField).toHaveBeenCalledWith(
        "primaryEmail",
        expect.any(String)
      );
    });

    it("should call updateField when phone is changed", () => {
      renderWithProviders(
        <CreateNewAgentModal open={true} onOpenChange={mockOnOpenChange} />
      );

      const phoneInput = screen.getByLabelText(/phone/i);
      fireEvent.change(phoneInput, { target: { value: "+1234567890" } });

      expect(mockUpdateField).toHaveBeenCalledWith("phone", expect.any(String));
    });
  });

  describe("Accessibility", () => {
    it("should mark required fields", () => {
      renderWithProviders(
        <CreateNewAgentModal open={true} onOpenChange={mockOnOpenChange} />
      );

      const requiredLabels = screen.getAllByText(/\*/);
      expect(requiredLabels.length).toBeGreaterThanOrEqual(4);
    });

    it("should associate labels with inputs", () => {
      renderWithProviders(
        <CreateNewAgentModal open={true} onOpenChange={mockOnOpenChange} />
      );

      expect(screen.getByLabelText(/first name/i).getAttribute("id")).toBe(
        "agent-firstName"
      );
      expect(screen.getByLabelText(/last name/i).getAttribute("id")).toBe(
        "agent-lastName"
      );
      expect(screen.getByLabelText(/^email/i).getAttribute("id")).toBe(
        "agent-primaryEmail"
      );
      expect(screen.getByLabelText(/alternate email/i).getAttribute("id")).toBe(
        "agent-alternateEmail"
      );
      expect(screen.getByLabelText(/phone/i).getAttribute("id")).toBe(
        "agent-phone"
      );
      expect(screen.getByLabelText(/notes/i).getAttribute("id")).toBe(
        "agent-notes"
      );
      expect(screen.getByLabelText(/assigned sp/i).getAttribute("id")).toBe(
        "agent-assignedSafariPlanner"
      );
    });
  });

  describe("agencyId prop", () => {
    it("should call updateField with agencyId when agencyId prop is provided", () => {
      renderWithProviders(
        <CreateNewAgentModal
          open={true}
          onOpenChange={mockOnOpenChange}
          agencyId="agency-123"
        />
      );

      expect(mockUpdateField).toHaveBeenCalledWith("agencyId", "agency-123");
    });
  });

  describe("Form submission (create)", () => {
    it("should call validate, createAgent with schema payload, onAgentCreated, and close modal on valid submit", async () => {
      const mockOnAgentCreated = vi.fn();
      renderWithProviders(
        <CreateNewAgentModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onAgentCreated={mockOnAgentCreated}
        />
      );

      const createButton = screen.getByRole("button", {
        name: "Create Agent",
      });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockValidate).toHaveBeenCalled();
        expect(mockMutate).toHaveBeenCalledTimes(1);
      });

      const payload = mockMutate.mock.calls[0][0];
      expect(payload).toMatchObject({
        firstName: "Johnatan",
        lastName: "Annan",
        primaryEmail: "",
        phoneNumber: "",
        agencyId: "",
        assignedSafariPlannerId: "sp-2",
        assignedSafariPlannerName: "Amelia Earhart",
      });
      expect(Object.keys(payload)).toContain("phoneNumber");

      expect(mockOnAgentCreated).toHaveBeenCalledWith(fakeCreatedAgent);
      expect(mockToastSuccess).toHaveBeenCalledWith(
        "Agent created successfully."
      );
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it("should not call createAgent when validation fails", async () => {
      vi.mocked(useAgentForm).mockReturnValue({
        formData: defaultFormData,
        errors: {},
        updateField: mockUpdateField,
        validate: vi.fn(() => ({ valid: false, errors: {} })),
        reset: mockReset,
        isDirty: false,
        getSubmitData: undefined,
      } as unknown as ReturnType<typeof useAgentForm>);

      renderWithProviders(
        <CreateNewAgentModal open={true} onOpenChange={mockOnOpenChange} />
      );

      fireEvent.click(screen.getByRole("button", { name: "Create Agent" }));

      await waitFor(() => {
        expect(mockMutate).not.toHaveBeenCalled();
      });
      expect(mockOnOpenChange).not.toHaveBeenCalled();
    });
  });

  describe("Cancel", () => {
    it("should call reset, mutation resets, and onOpenChange(false) when Cancel is clicked", () => {
      renderWithProviders(
        <CreateNewAgentModal open={true} onOpenChange={mockOnOpenChange} />
      );

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockReset).toHaveBeenCalled();
      expect(mockResetCreateMutation).toHaveBeenCalled();
      expect(mockResetUpdateMutation).toHaveBeenCalled();
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Reset on close", () => {
    it("should call reset and mutation resets when modal closes", async () => {
      const queryClient = new QueryClient({
        defaultOptions: { mutations: { retry: false } },
      });
      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <CreateNewAgentModal open={true} onOpenChange={mockOnOpenChange} />
        </QueryClientProvider>
      );

      rerender(
        <QueryClientProvider client={queryClient}>
          <CreateNewAgentModal open={false} onOpenChange={mockOnOpenChange} />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(mockReset).toHaveBeenCalled();
        expect(mockResetCreateMutation).toHaveBeenCalled();
        expect(mockResetUpdateMutation).toHaveBeenCalled();
      });
    });
  });

  describe("Loading state", () => {
    it("should disable buttons and keep Create Agent label when isPending is true", () => {
      vi.mocked(useCreateAgent).mockReturnValue({
        mutate: mockMutate,
        isPending: true,
        error: null,
        reset: mockResetCreateMutation,
      } as unknown as ReturnType<typeof useCreateAgent>);

      renderWithProviders(
        <CreateNewAgentModal open={true} onOpenChange={mockOnOpenChange} />
      );

      expect(
        (screen.getByRole("button", { name: /cancel/i }) as HTMLButtonElement)
          .disabled
      ).toBe(true);
      const submitBtn = screen.getByRole("button", { name: /create agent/i });
      expect((submitBtn as HTMLButtonElement).disabled).toBe(true);
    });
  });

  describe("API error display", () => {
    it("should display create error message when useCreateAgent returns error", () => {
      vi.mocked(useCreateAgent).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        error: new Error("Network error"),
        reset: mockResetCreateMutation,
      } as unknown as ReturnType<typeof useCreateAgent>);

      renderWithProviders(
        <CreateNewAgentModal open={true} onOpenChange={mockOnOpenChange} />
      );

      expect(screen.getByText(/network error|failed to save/i)).toBeDefined();
    });
  });

  describe("Edit mode", () => {
    const existingAgent: Agent = {
      id: "agent-1",
      version: 0,
      firstName: "Jane",
      lastName: "Smith",
      primaryEmail: "jane@example.com",
      phoneNumber: "+123",
      agencyId: "agency-1",
      agencyGroups: [{ id: "group-1", name: "Test Agency Group" }],
      assignedSafariPlannerId: "sp-2",
      assignedSafariPlannerName: "Amelia Earhart",
      isActive: true,
    };

    it("should show Update Agent button when agent is provided", () => {
      renderWithProviders(
        <CreateNewAgentModal
          open={true}
          onOpenChange={mockOnOpenChange}
          agent={existingAgent}
        />
      );

      expect(
        screen.getByRole("button", { name: "Update Agent" })
      ).toBeDefined();
      expect(screen.queryByRole("button", { name: "Create Agent" })).toBeNull();
    });

    it("should call updateAgent and onAgentUpdated on submit when agent is provided", async () => {
      mockUpdateAgent.mockImplementation(
        (_args: unknown, opts?: { onSuccess?: (agent: Agent) => void }) => {
          opts?.onSuccess?.(existingAgent);
        }
      );

      const editFormData: AgentFormData = {
        ...defaultFormData,
        firstName: existingAgent.firstName,
        lastName: existingAgent.lastName,
        primaryEmail: existingAgent.primaryEmail,
        phone: existingAgent.phoneNumber,
      };
      const updatePayload: UpdateAgentRequest = {
        version: existingAgent.version,
        firstName: existingAgent.firstName,
        lastName: existingAgent.lastName,
        primaryEmail: existingAgent.primaryEmail,
        phone: existingAgent.phoneNumber,
        agencyId: existingAgent.agencyId,
        assignedSafariPlannerId: existingAgent.assignedSafariPlannerId,
        assignedSafariPlannerName: existingAgent.assignedSafariPlannerName,
        status: "Active",
      };
      const mockGetSubmitData = vi.fn(() => updatePayload);
      vi.mocked(useAgentForm).mockReturnValue({
        formData: editFormData,
        errors: {},
        updateField: mockUpdateField,
        validate: mockValidate,
        reset: mockReset,
        isDirty: false,
        getSubmitData: mockGetSubmitData,
      } as unknown as ReturnType<typeof useAgentForm>);

      const mockOnAgentUpdated = vi.fn();
      renderWithProviders(
        <CreateNewAgentModal
          open={true}
          onOpenChange={mockOnOpenChange}
          agent={existingAgent}
          onAgentUpdated={mockOnAgentUpdated}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: "Update Agent" }));

      await waitFor(() => {
        expect(mockUpdateAgent).toHaveBeenCalledWith(
          { id: existingAgent.id, data: updatePayload },
          expect.any(Object)
        );
        expect(mockOnAgentUpdated).toHaveBeenCalledWith(existingAgent);
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });
});
