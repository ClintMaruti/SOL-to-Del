import { useForm } from "@tanstack/react-form";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { INITIAL_OPTION_FORM } from "../model/useOptionForm";
import { OptionForm } from "../ui/OptionForm";

function TestHarness() {
  const form = useForm({
    defaultValues: INITIAL_OPTION_FORM,
  });

  return (
    <OptionForm
      form={form}
      htmlIdPrefix="option-form-test"
      serviceType={undefined}
    />
  );
}

function FlightSheetHarness() {
  const form = useForm({
    defaultValues: INITIAL_OPTION_FORM,
  });

  return (
    <OptionForm
      form={form}
      htmlIdPrefix="flight-option-form-test"
      serviceType="flight"
      variant="sheet"
    />
  );
}

describe("OptionForm", () => {
  it("renders includes and excludes as growable textareas", () => {
    render(<TestHarness />);

    const includes = screen.getByRole("textbox", {
      name: /includes/i,
    }) as HTMLTextAreaElement;
    const excludes = screen.getByRole("textbox", {
      name: /excludes/i,
    }) as HTMLTextAreaElement;

    expect(includes.rows).toBe(1);
    expect(excludes.rows).toBe(1);
    expect(includes.className).toContain("[field-sizing:content]");
    expect(excludes.className).toContain("[field-sizing:content]");
  });

  it("selects flight time values from a picker while preserving the input design", async () => {
    const user = userEvent.setup();
    render(<FlightSheetHarness />);

    const timeFrom = screen.getByRole("textbox", {
      name: /time from/i,
    }) as HTMLInputElement;

    expect(timeFrom.placeholder).toBe("e.g. 9:00 AM");

    await user.click(timeFrom);
    await user.click(await screen.findByRole("button", { name: "10 hour" }));
    await user.click(screen.getByRole("button", { name: "25 minute" }));

    expect(timeFrom.value).toBe("10:25 AM");

    await user.click(screen.getByRole("button", { name: "PM" }));

    expect(timeFrom.value).toBe("10:25 PM");
  });

  it("opens the time picker on click without opening on focus first", async () => {
    const user = userEvent.setup();
    render(<FlightSheetHarness />);

    const timeFrom = screen.getByRole("textbox", {
      name: /time from/i,
    }) as HTMLInputElement;

    timeFrom.focus();
    expect(screen.queryByRole("button", { name: "10 hour" })).toBeNull();

    await user.click(timeFrom);

    expect(
      await screen.findByRole("button", { name: "10 hour" })
    ).toBeDefined();
  });

  it("scrolls time picker hour and minute panes with mouse interactions", async () => {
    const user = userEvent.setup();
    render(<FlightSheetHarness />);

    await user.click(screen.getByRole("textbox", { name: /time from/i }));

    const hourGroup = await screen.findByRole("group", {
      name: /time from hour/i,
    });
    const minuteGroup = screen.getByRole("group", {
      name: /time from minute/i,
    });
    const hourPane = hourGroup.querySelector(
      "[data-time-picker-scroll='hour']"
    ) as HTMLDivElement;
    const minutePane = minuteGroup.querySelector(
      "[data-time-picker-scroll='minute']"
    ) as HTMLDivElement;

    fireEvent.wheel(hourPane, { deltaY: 32 });
    fireEvent.wheel(minutePane, { deltaY: 48 });

    expect(hourPane.scrollTop).toBe(32);
    expect(minutePane.scrollTop).toBe(48);

    fireEvent.pointerDown(minutePane, {
      button: 0,
      clientY: 120,
      pointerId: 1,
    });
    fireEvent.pointerMove(minutePane, {
      clientY: 90,
      pointerId: 1,
    });
    fireEvent.pointerUp(minutePane, {
      pointerId: 1,
    });

    expect(minutePane.scrollTop).toBe(78);

    await user.click(screen.getByRole("button", { name: "30 minute" }));

    expect(
      (screen.getByRole("textbox", { name: /time from/i }) as HTMLInputElement)
        .value
    ).toBe("12:30 AM");
  });
});
