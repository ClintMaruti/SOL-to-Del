import { useForm } from "@tanstack/react-form";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { createEmptyOperatingDaySelection } from "../model/operating-days";
import { INITIAL_OPTION_FORM } from "../model/useOptionForm";
import { OperationDaysField } from "../ui/OperationDaysField";

function Wrapper() {
  const form = useForm({
    defaultValues: {
      ...INITIAL_OPTION_FORM,
      operatingDaySelected: createEmptyOperatingDaySelection(),
    },
  });
  return (
    <OperationDaysField
      form={form}
      requireAtLeastOne={false}
      disabledWhenAllSelected
    />
  );
}

describe("OperationDaysField", () => {
  it('checks every day when "All days" is checked', async () => {
    const user = userEvent.setup();
    render(<Wrapper />);

    await user.click(screen.getByRole("checkbox", { name: /^All days$/i }));

    const toggles = screen.getAllByRole("button", {
      name: /^(MON|TUE|WED|THU|FRI|SAT|SUN)$/,
    });
    expect(toggles).toHaveLength(7);
    for (const btn of toggles) {
      expect(btn.getAttribute("data-state")).toBe("on");
    }
  });

  it("disables day toggles while All days is checked", async () => {
    const user = userEvent.setup();
    render(<Wrapper />);

    await user.click(screen.getByRole("checkbox", { name: /^All days$/i }));

    const toggles = screen.getAllByRole("button", {
      name: /^(MON|TUE|WED|THU|FRI|SAT|SUN)$/,
    });
    for (const btn of toggles) {
      expect(btn.getAttribute("disabled")).not.toBeNull();
    }
  });

  it("clears every day and enables toggles when All days is unchecked", async () => {
    const user = userEvent.setup();
    render(<Wrapper />);

    const allDays = screen.getByRole("checkbox", { name: /^All days$/i });
    await user.click(allDays);
    await user.click(allDays);

    const toggles = screen.getAllByRole("button", {
      name: /^(MON|TUE|WED|THU|FRI|SAT|SUN)$/,
    });
    for (const btn of toggles) {
      expect(btn.getAttribute("data-state")).toBe("off");
      expect(btn.getAttribute("disabled")).toBeNull();
    }
  });
});
