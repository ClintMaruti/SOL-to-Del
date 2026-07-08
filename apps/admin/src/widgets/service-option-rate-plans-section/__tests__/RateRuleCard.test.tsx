import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { createComponent, createRateRule } from "../lib/defaults";
import { RateRuleCard } from "../ui/RateRuleCard";

describe("RateRuleCard", () => {
  it("expands the section when the name is edited while collapsed so Save is reachable", async () => {
    const user = userEvent.setup();
    const rule = createRateRule("crp-1");
    const { container } = render(
      <RateRuleCard
        rateRule={rule}
        rates={[]}
        onChange={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onSave={vi.fn()}
        canSave
        defaultOpen={false}
      />
    );

    const bodyPanel = container.querySelector(
      ".border-t.border-border.bg-white.px-4.py-3"
    );
    expect(bodyPanel).toBeTruthy();
    expect(bodyPanel?.className.includes("hidden")).toBe(true);

    const nameInput = container.querySelector(
      'input[name$="__name"]'
    ) as HTMLInputElement;
    expect(nameInput).toBeTruthy();
    await user.clear(nameInput);
    await user.type(nameInput, "Updated name");

    expect(bodyPanel?.className.includes("hidden")).toBe(false);
    const save = screen.getByRole("button", { name: /^save$/i });
    expect((save as HTMLButtonElement).disabled).toBe(false);
  });

  it("enables Save for a tmp id rule without edits so duplicated rules can be POSTed", () => {
    const rule = createRateRule("crp-1");
    expect(rule.id.startsWith("tmp-")).toBe(true);
    render(
      <RateRuleCard
        rateRule={rule}
        rates={[]}
        onChange={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onSave={vi.fn()}
        canSave
        defaultOpen
      />
    );
    const save = screen.getByRole("button", { name: /^save$/i });
    expect((save as HTMLButtonElement).disabled).toBe(false);
  });

  it("disables Save when validation error is passed from parent", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const rule = createRateRule("crp-1");
    render(
      <QueryClientProvider client={queryClient}>
        <RateRuleCard
          rateRule={rule}
          rates={[]}
          onChange={vi.fn()}
          onDuplicate={vi.fn()}
          onDelete={vi.fn()}
          onSave={vi.fn()}
          canSave={false}
          saveValidationError="rateRuleConditionBoundsRequired"
          defaultOpen
        />
      </QueryClientProvider>
    );
    const save = screen.getByRole("button", { name: /^save$/i });
    expect((save as HTMLButtonElement).disabled).toBe(true);
  });

  it("allows Save when two components share priority but different pax types", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const a = createComponent();
    const b = createComponent();
    const rule = {
      ...createRateRule("crp-1"),
      components: [
        { ...a, priority: 42, paxType: "ADT" as const },
        { ...b, priority: 42, paxType: "CHD" as const },
      ],
    };
    render(
      <QueryClientProvider client={queryClient}>
        <RateRuleCard
          rateRule={rule}
          rates={[]}
          onChange={vi.fn()}
          onDuplicate={vi.fn()}
          onDelete={vi.fn()}
          onSave={vi.fn()}
          canSave
          defaultOpen
        />
      </QueryClientProvider>
    );
    const save = screen.getByRole("button", { name: /^save$/i });
    expect((save as HTMLButtonElement).disabled).toBe(false);
  });

  it("keeps Save disabled for a persisted rule when nothing changed", () => {
    const rule = {
      ...createRateRule("crp-1"),
      id: "019d909d-2451-7755-a253-3e1fca5b506d",
    };
    render(
      <RateRuleCard
        rateRule={rule}
        rates={[]}
        onChange={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onSave={vi.fn()}
        canSave
        defaultOpen
      />
    );
    const save = screen.getByRole("button", { name: /^save$/i });
    expect((save as HTMLButtonElement).disabled).toBe(true);
  });
});
