import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeAll, describe, expect, it } from "vitest";

import { DropdownSelect } from "../DropdownSelect";

describe("DropdownSelect", () => {
  beforeAll(() => {
    HTMLElement.prototype.hasPointerCapture ??= () => false;
    HTMLElement.prototype.setPointerCapture ??= () => {};
    HTMLElement.prototype.releasePointerCapture ??= () => {};
  });

  it("keeps the search input focused while typing", async () => {
    const user = userEvent.setup();

    render(
      <DropdownSelect
        value={undefined}
        onValueChange={() => {}}
        isSearchable
        searchAriaLabel="Search options"
        options={[
          { value: "camp", label: "Camp" },
          { value: "drive", label: "Game Drive" },
        ]}
      />
    );

    await user.click(screen.getByRole("combobox"));

    const searchInput = await screen.findByRole("textbox", {
      name: "Search options",
    });
    await user.type(searchInput, "ca");

    expect(document.activeElement).toBe(searchInput);
    expect(screen.getByRole("option", { name: "Camp" })).toBeDefined();
  });

  it("returns to the placeholder when the controlled value is cleared", async () => {
    const user = userEvent.setup();

    function TestDropdown() {
      const [value, setValue] = useState<string | undefined>("camp");

      return (
        <div>
          <DropdownSelect
            value={value}
            onValueChange={setValue}
            placeholder="Select service"
            options={[
              { value: "camp", label: "Camp" },
              { value: "drive", label: "Game Drive" },
            ]}
          />
          <button type="button" onClick={() => setValue("")}>
            Clear
          </button>
        </div>
      );
    }

    render(<TestDropdown />);

    expect(screen.getByRole("combobox").textContent).toContain("Camp");

    await user.click(screen.getByRole("button", { name: "Clear" }));

    expect(screen.getByRole("combobox").textContent).toContain(
      "Select service"
    );
  });
});
