import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Agency } from "@/entities/agency";
import type { Agent } from "@/entities/agent";

import { agencySelectionValue } from "../model/validation";
import { AgencyAgentSelect } from "../ui/AgencyAgentSelect";

const agencies = [
  {
    id: "agency-1",
    name: "Etosha Escapes",
    isActive: true,
  },
  {
    id: "agency-2",
    name: "Serengeti Adventures",
    isActive: true,
  },
] as Agency[];

const agents = [
  {
    id: "agent-1",
    firstName: "Raylan",
    lastName: "Givens",
    agencyId: "agency-2",
    status: "Active",
  },
  {
    id: "agent-2",
    firstName: "Boyd",
    lastName: "Crowder",
    agencyId: "agency-2",
    status: "Active",
  },
] as unknown as Agent[];

describe("AgencyAgentSelect", () => {
  it("renders agencies as expandable groups and allows selecting an agent", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <AgencyAgentSelect
        agencies={agencies}
        agents={agents}
        value=""
        onValueChange={onValueChange}
      />
    );

    await user.click(
      screen.getByRole("button", { name: /select agency or agent/i })
    );

    expect(screen.getByText("Etosha Escapes")).toBeTruthy();
    expect(screen.getByText("Serengeti Adventures")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Raylan Givens/i })).toBeNull();

    await user.click(
      screen.getByRole("button", {
        name: /expand Serengeti Adventures agents/i,
      })
    );

    await user.click(screen.getByRole("button", { name: /Raylan Givens/i }));

    expect(onValueChange).toHaveBeenCalledWith(
      agencySelectionValue({ type: "agent", id: "agent-1" })
    );
  });

  it("allows selecting an agency row directly", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <AgencyAgentSelect
        agencies={agencies}
        agents={agents}
        value=""
        onValueChange={onValueChange}
      />
    );

    await user.click(
      screen.getByRole("button", { name: /select agency or agent/i })
    );
    await user.click(screen.getByRole("button", { name: /Etosha Escapes/i }));

    expect(onValueChange).toHaveBeenCalledWith(
      agencySelectionValue({ type: "agency", id: "agency-1" })
    );
  });
});
