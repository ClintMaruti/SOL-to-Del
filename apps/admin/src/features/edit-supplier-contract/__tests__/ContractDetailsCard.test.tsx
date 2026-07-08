import { useForm } from "@tanstack/react-form";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAgencyGroups } from "@/entities/agency-group";
import { ANY_AGENCY_GROUP_VALUE } from "@/features/create-supplier-contract/model/schema";
import { ContractDetailsCard } from "../ui/ContractDetailsCard";

vi.mock("@/entities/agency-group", () => ({
  useAgencyGroups: vi.fn(),
}));

function Wrapper({
  agencyGroupId = "ag-1",
  agencyGroupLabel = "AAConsultants",
  formAgencyGroupId,
}: {
  agencyGroupId?: string | null;
  agencyGroupLabel?: string;
  formAgencyGroupId?: string;
}) {
  const form = useForm({
    defaultValues: {
      name: "Contract 2026",
      link: "",
      agencyGroupId:
        formAgencyGroupId ?? agencyGroupId ?? ANY_AGENCY_GROUP_VALUE,
      validFrom: "2026-01-01",
      validTo: "2026-12-31",
    },
  });

  return (
    <ContractDetailsCard
      form={form}
      agencyGroupId={agencyGroupId}
      agencyGroupLabel={agencyGroupLabel}
    />
  );
}

describe("ContractDetailsCard", () => {
  beforeEach(() => {
    vi.mocked(useAgencyGroups).mockReturnValue({
      data: [
        {
          id: "ag-1",
          name: "AAConsultants",
          description: null,
          isActive: true,
          numberOfAgencies: 1,
          version: 0,
        },
        {
          id: "ag-2",
          name: "Inactive Group",
          description: null,
          isActive: false,
          numberOfAgencies: 0,
          version: 0,
        },
      ],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useAgencyGroups>);
  });

  it("renders Agency Group as a disabled dropdown", () => {
    render(<Wrapper />);

    const agencyGroupSelect = screen.getByRole("combobox", {
      name: /agency group/i,
    });

    expect(agencyGroupSelect).toHaveProperty("disabled", true);
    expect(agencyGroupSelect.textContent).toContain("AAConsultants");
  });

  it("falls back to ANY when no agency group label is provided", () => {
    render(<Wrapper agencyGroupId={null} agencyGroupLabel={undefined} />);

    expect(
      screen.getByRole("combobox", { name: /agency group/i }).textContent
    ).toContain("ANY");
  });

  it("uses persisted contract scope when the form still has the ANY fallback", () => {
    render(
      <Wrapper
        agencyGroupId="ag-3"
        agencyGroupLabel="Elewana Lodges & Camps"
        formAgencyGroupId={ANY_AGENCY_GROUP_VALUE}
      />
    );

    expect(
      screen.getByRole("combobox", { name: /agency group/i }).textContent
    ).toContain("Elewana Lodges & Camps");
  });
});
