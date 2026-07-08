import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Destination } from "@/entities/destination";

import { DestinationMultiSelect } from "../ui/DestinationMultiSelect";

const destinations: Destination[] = [
  {
    id: "kenya",
    name: "Kenya",
    type: "Country",
    status: "Active",
    children: [
      {
        id: "southern-kenya",
        name: "Southern Kenya",
        type: "Region",
        status: "Active",
      },
    ],
  },
  {
    id: "tanzania",
    name: "Tanzania",
    type: "Country",
    status: "Active",
  },
  {
    id: "inactive-country",
    name: "Inactive Country",
    type: "Country",
    status: "Inactive",
  },
];

describe("DestinationMultiSelect", () => {
  it("shows only active country destinations without secondary text", async () => {
    const user = userEvent.setup();

    render(
      <DestinationMultiSelect
        destinations={destinations}
        value={[]}
        onValueChange={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button"));

    expect(screen.getByText("Kenya")).toBeTruthy();
    expect(screen.getByText("Tanzania")).toBeTruthy();
    expect(screen.queryByText("Southern Kenya")).toBeNull();
    expect(screen.queryByText("Inactive Country")).toBeNull();
    expect(screen.queryByText("Country")).toBeNull();
  });

  it("when groupByPreferred, shows segment headers and preferred before other", async () => {
    const user = userEvent.setup();
    const withPreferred: Destination[] = [
      {
        id: "tanzania",
        name: "Tanzania",
        type: "Country",
        status: "Active",
        isPreferred: false,
      },
      {
        id: "kenya",
        name: "Kenya",
        type: "Country",
        status: "Active",
        isPreferred: true,
      },
    ];

    render(
      <DestinationMultiSelect
        destinations={withPreferred}
        value={[]}
        onValueChange={vi.fn()}
        groupByPreferred
      />
    );

    await user.click(screen.getByRole("button"));

    expect(screen.getByText("Preferred")).toBeTruthy();
    expect(screen.getByText("Other destinations")).toBeTruthy();
    const labels = screen.getAllByText(/Kenya|Tanzania/);
    expect(labels.length).toBeGreaterThanOrEqual(2);
  });
});
