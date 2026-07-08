import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createRateRule } from "../lib/defaults";
import { RateRuleCard } from "../ui/RateRuleCard";

describe("RateRuleCard travel overlap lock", () => {
  it("disables duplicate, delete, add-condition, add-component, and save when actionsLocked", () => {
    const rule = createRateRule("crp-1");
    render(
      <RateRuleCard
        rateRule={rule}
        rates={[]}
        onChange={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onSave={vi.fn()}
        canSave
        actionsLocked
        actionsLockedTitle="Resolve overlapping travel dates first."
      />
    );

    const duplicateBtn = screen.getByRole("button", {
      name: /duplicate rate rule/i,
    });
    expect((duplicateBtn as HTMLButtonElement).disabled).toBe(true);

    expect(
      (screen.getByRole("button", { name: /delete/i }) as HTMLButtonElement)
        .disabled
    ).toBe(true);

    expect(
      (
        screen.getByRole("button", {
          name: /add condition/i,
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);
    expect(
      (
        screen.getByRole("button", {
          name: /add component/i,
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: /^save$/i }) as HTMLButtonElement)
        .disabled
    ).toBe(true);
  });

  it("keeps controls enabled when actionsLocked is false", () => {
    const rule = createRateRule("crp-1");
    render(
      <RateRuleCard
        rateRule={rule}
        rates={[]}
        onChange={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        canSave
      />
    );

    expect(
      (
        screen.getByRole("button", {
          name: /duplicate rate rule/i,
        }) as HTMLButtonElement
      ).disabled
    ).toBe(false);
    expect(
      (
        screen.getByRole("button", {
          name: /add condition/i,
        }) as HTMLButtonElement
      ).disabled
    ).toBe(false);
  });
});
