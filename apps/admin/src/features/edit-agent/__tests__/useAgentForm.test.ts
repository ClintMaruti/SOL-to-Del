import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import type { Agent } from "@/entities/agent/model/types";
import { CATALOG_NOTE_NIL_ID } from "@/entities/catalog-extra";

import { useAgentForm } from "../model/useAgentForm";

/** Flush microtasks (useAgentForm's useEffect uses queueMicrotask for sync). */
async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
  });
}

async function renderAgentFormHook(agent: Agent | null) {
  const rendered = renderHook(() => useAgentForm(agent));
  await flushMicrotasks();
  return rendered;
}

function createAgent(overrides: Partial<Agent> = {}): Agent {
  return {
    id: "agent-1",
    firstName: "Jonathan",
    lastName: "Annan",
    primaryEmail: "jonathan.annan@africatours.com",
    phoneNumber: "+14455501020",
    agencyId: "agency-1",
    agencyGroups: [{ id: "group-1", name: "Test Agency Group" }],
    assignedSafariPlannerId: "sp-2",
    assignedSafariPlannerName: "Amelia Earhart",
    isActive: true,
    version: 0,
    ...overrides,
  };
}

describe("useAgentForm", () => {
  describe("Initialization", () => {
    it("should initialize with empty form data when agent is null", async () => {
      const { result } = await renderAgentFormHook(null);

      expect(result.current.formData).toEqual({
        firstName: "",
        lastName: "",
        primaryEmail: "",
        alternateEmail: "",
        phone: "",
        agencyId: "",
        assignedSafariPlannerId: "",
        assignedSafariPlannerName: "",
        language: "",
        notes: "",
        currency: "",
        status: "Active",
      });
      expect(result.current.errors).toEqual({});
    });

    it("should initialize with agent data when agent is provided", async () => {
      const agent = createAgent();
      const { result } = await renderAgentFormHook(agent);

      expect(result.current.formData.firstName).toBe("Jonathan");
      expect(result.current.formData.lastName).toBe("Annan");
      expect(result.current.formData.primaryEmail).toBe(
        "jonathan.annan@africatours.com"
      );
      expect(result.current.formData.phone).toBe("+14455501020");
      expect(result.current.formData.agencyId).toBe("agency-1");
      expect(result.current.formData.assignedSafariPlannerId).toBe("sp-2");
      expect(result.current.formData.assignedSafariPlannerName).toBe(
        "Amelia Earhart"
      );
      expect(result.current.formData.status).toBe("Active");
      expect(result.current.errors).toEqual({});
    });

    it("should map optional agent fields (alternateEmail, notes)", async () => {
      const agent = createAgent({
        alternateEmail: "alt@example.com",
        notes: { id: "note-1", text: "Some notes", version: 2 },
      });
      const { result } = await renderAgentFormHook(agent);

      expect(result.current.formData.alternateEmail).toBe("alt@example.com");
      expect(result.current.formData.notes).toBe("Some notes");
    });
  });

  describe("Form data updates", () => {
    it("should update firstName", async () => {
      const agent = createAgent();
      const { result } = await renderAgentFormHook(agent);

      act(() => {
        result.current.updateField("firstName", "Jane");
      });

      expect(result.current.formData.firstName).toBe("Jane");
    });

    it("should update status", async () => {
      const agent = createAgent();
      const { result } = await renderAgentFormHook(agent);

      act(() => {
        result.current.updateField("status", "Inactive");
      });

      expect(result.current.formData.status).toBe("Inactive");
    });

    it("should clear field error when field is updated", async () => {
      const agent = createAgent();
      const { result } = await renderAgentFormHook(agent);

      act(() => {
        result.current.updateField("firstName", "");
        result.current.validate();
      });
      await waitFor(() => {
        expect(result.current.errors.firstName).toBeDefined();
      });

      act(() => {
        result.current.updateField("firstName", "Jonathan");
      });
      await waitFor(() => {
        expect(result.current.errors.firstName).toBeUndefined();
      });
    });
  });

  describe("Validation", () => {
    it("should return valid and no errors when data is valid (edit)", async () => {
      const agent = createAgent();
      const { result } = await renderAgentFormHook(agent);

      let valid: boolean | undefined;
      act(() => {
        const out = result.current.validate();
        valid = out.valid;
      });
      await waitFor(() => {
        expect(result.current.errors).toEqual({});
      });

      expect(valid).toBe(true);
    });

    it("should require firstName", async () => {
      const agent = createAgent();
      const { result } = await renderAgentFormHook(agent);

      let valid: boolean | undefined;
      act(() => {
        result.current.updateField("firstName", "");
        const out = result.current.validate();
        valid = out.valid;
      });

      expect(result.current.errors.firstName).toBe("First name is required");
      expect(valid).toBe(false);
    });

    it("should require lastName", async () => {
      const agent = createAgent();
      const { result } = await renderAgentFormHook(agent);

      act(() => {
        result.current.updateField("lastName", "");
        result.current.validate();
      });

      expect(result.current.errors.lastName).toBe("Last name is required");
    });

    it("should require primaryEmail", async () => {
      const agent = createAgent();
      const { result } = await renderAgentFormHook(agent);

      act(() => {
        result.current.updateField("primaryEmail", "");
        result.current.validate();
      });

      expect(result.current.errors.primaryEmail).toBe(
        "Primary email is required"
      );
    });

    it("should reject invalid primary email format", async () => {
      const agent = createAgent();
      const { result } = await renderAgentFormHook(agent);

      act(() => {
        result.current.updateField("primaryEmail", "not-an-email");
        result.current.validate();
      });

      expect(result.current.errors.primaryEmail).toBe(
        "Please enter a valid email address"
      );
    });

    it("should reject invalid alternate email when provided", async () => {
      const agent = createAgent();
      const { result } = await renderAgentFormHook(agent);

      act(() => {
        result.current.updateField("alternateEmail", "bad");
        result.current.validate();
      });

      expect(result.current.errors.alternateEmail).toBe(
        "Please enter a valid email address"
      );
    });

    it("should require phone", async () => {
      const agent = createAgent();
      const { result } = await renderAgentFormHook(agent);

      let valid: boolean | undefined;
      act(() => {
        result.current.updateField("phone", "");
        const out = result.current.validate();
        valid = out.valid;
      });

      expect(result.current.errors.phone).toBe("Phone number is required");
      expect(valid).toBe(false);
    });

    it("should reject phone with invalid E.164 format", async () => {
      const agent = createAgent();
      const { result } = await renderAgentFormHook(agent);

      act(() => {
        result.current.updateField("phone", "abcdef");
        result.current.validate();
      });

      expect(result.current.errors.phone).toBe(
        "Enter a valid international number, e.g. +254 712 345 678"
      );
    });

    it("should reject phone that is too short for E.164", async () => {
      const agent = createAgent();
      const { result } = await renderAgentFormHook(agent);

      act(() => {
        result.current.updateField("phone", "+123");
        result.current.validate();
      });

      expect(result.current.errors.phone).toBe(
        "Enter a valid international number, e.g. +254 712 345 678"
      );
    });

    it("should accept valid E.164 phone formats", async () => {
      const agent = createAgent();
      const { result } = await renderAgentFormHook(agent);

      act(() => {
        result.current.updateField("phone", "+1234567890");
        result.current.validate();
      });
      expect(result.current.errors.phone).toBeUndefined();

      act(() => {
        result.current.updateField("phone", "+442071234567");
        result.current.validate();
      });
      expect(result.current.errors.phone).toBeUndefined();
    });

    it("should reject phone exceeding E.164 max (15 digits)", async () => {
      const agent = createAgent();
      const { result } = await renderAgentFormHook(agent);

      act(() => {
        result.current.updateField("phone", "+" + "1".repeat(16));
        result.current.validate();
      });

      expect(result.current.errors.phone).toBe(
        "Enter a valid international number, e.g. +254 712 345 678"
      );
    });

    it("should require assignedSafariPlannerId", async () => {
      const agent = createAgent();
      const { result } = await renderAgentFormHook(agent);

      act(() => {
        result.current.updateField("assignedSafariPlannerId", "");
        result.current.validate();
      });

      expect(result.current.errors.assignedSafariPlannerId).toBe(
        "Assigned Safari Planner is required"
      );
    });

    it("should require agencyId in create mode", async () => {
      const { result } = await renderAgentFormHook(null);

      act(() => {
        result.current.updateField("firstName", "Jane");
        result.current.updateField("lastName", "Doe");
        result.current.updateField("primaryEmail", "jane@example.com");
        result.current.updateField("assignedSafariPlannerId", "sp-1");
        result.current.validate();
      });

      expect(result.current.errors.agencyId).toBe("Agency is required");
    });
  });

  describe("Reset", () => {
    it("should reset form to initial agent data", async () => {
      const agent = createAgent();
      const { result } = await renderAgentFormHook(agent);

      act(() => {
        result.current.updateField("firstName", "Changed");
        result.current.updateField("lastName", "Name");
      });

      act(() => {
        result.current.reset();
      });
      await waitFor(() => {
        expect(result.current.formData.firstName).toBe("Jonathan");
        expect(result.current.formData.lastName).toBe("Annan");
        expect(result.current.errors).toEqual({});
      });
    });

    it("should clear errors on reset", async () => {
      const agent = createAgent();
      const { result } = await renderAgentFormHook(agent);

      act(() => {
        result.current.updateField("firstName", "");
        result.current.validate();
      });
      await waitFor(() => {
        expect(result.current.errors.firstName).toBeDefined();
      });

      act(() => {
        result.current.reset();
      });
      await waitFor(() => {
        expect(result.current.errors).toEqual({});
      });
    });
  });

  describe("getSubmitData", () => {
    it("should return undefined when agent is null", async () => {
      const { result } = await renderAgentFormHook(null);

      expect(result.current.getSubmitData()).toBeUndefined();
    });

    it("should return UpdateAgentRequest shape with trimmed values when agent is set", async () => {
      const agent = createAgent();
      const { result } = await renderAgentFormHook(agent);

      act(() => {
        result.current.updateField("firstName", "  Jane  ");
        result.current.updateField("notes", "  note  ");
      });
      await waitFor(() => {
        expect(result.current.formData.firstName).toBe("  Jane  ");
      });

      const data = result.current.getSubmitData();

      expect(data).toBeDefined();
      expect(data!.firstName).toBe("Jane");
      expect(data!.lastName).toBe("Annan");
      expect(data!.primaryEmail).toBe("jonathan.annan@africatours.com");
      expect(data!.agencyId).toBe("agency-1");
      expect(data!.assignedSafariPlannerId).toBe("sp-2");
      expect(data!.assignedSafariPlannerName).toBe("Amelia Earhart");
      expect(data!.status).toBe("Active");
      expect(data!.notes).toEqual({
        id: CATALOG_NOTE_NIL_ID,
        text: "note",
        version: 0,
      });
    });

    it("should omit optional fields when empty", async () => {
      const agent = createAgent({ alternateEmail: "" });
      const { result } = await renderAgentFormHook(agent);

      await waitFor(() => {
        expect(result.current.getSubmitData()).toBeDefined();
      });
      const data = result.current.getSubmitData();

      expect(data).toBeDefined();
      expect(data!.alternateEmail).toBeUndefined();
      expect(data!.notes).toBeNull();
    });
  });

  describe("Agent ID change", () => {
    it("should reset form when agent id changes", async () => {
      const agent1 = createAgent({ id: "agent-1", firstName: "First" });
      const agent2 = createAgent({
        id: "agent-2",
        firstName: "Second",
        lastName: "User",
      });

      const { result, rerender } = renderHook(
        ({ agent }: { agent: Agent | null }) => useAgentForm(agent),
        { initialProps: { agent: agent1 } }
      );
      await flushMicrotasks();

      expect(result.current.formData.firstName).toBe("First");

      act(() => {
        result.current.updateField("firstName", "Modified");
      });

      rerender({ agent: agent2 });
      await flushMicrotasks();

      await waitFor(() => {
        expect(result.current.formData.firstName).toBe("Second");
        expect(result.current.formData.lastName).toBe("User");
      });
    });

    it("should clear errors when agent id changes", async () => {
      const agent1 = createAgent({ id: "agent-1" });
      const agent2 = createAgent({ id: "agent-2" });

      const { result, rerender } = renderHook(
        ({ agent }: { agent: Agent | null }) => useAgentForm(agent),
        { initialProps: { agent: agent1 } }
      );
      await flushMicrotasks();

      act(() => {
        result.current.updateField("firstName", "");
        result.current.validate();
      });
      expect(result.current.errors.firstName).toBeDefined();

      rerender({ agent: agent2 });
      await flushMicrotasks();

      await waitFor(() => {
        expect(result.current.errors).toEqual({});
      });
    });
  });
});
