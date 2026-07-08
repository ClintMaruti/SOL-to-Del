import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TagInput } from "../TagInput";

describe("TagInput", () => {
  it("renders checkbox-style dropdown items and toggles selections", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <TagInput
        id="tags"
        value={["Families"]}
        onChange={onChange}
        placeholder="Select tags"
        suggestions={["Families", "Adventure"]}
      />
    );

    await user.click(screen.getByRole("combobox"));

    expect(
      screen
        .getByRole("checkbox", { name: "Families" })
        .getAttribute("aria-checked")
    ).toBe("true");
    expect(
      screen
        .getByRole("checkbox", { name: "Adventure" })
        .getAttribute("aria-checked")
    ).toBe("false");

    const adventureRow = screen
      .getByRole("checkbox", { name: "Adventure" })
      .closest("[cmdk-item]");

    expect(adventureRow).not.toBeNull();
    await user.click(adventureRow!);

    expect(onChange).toHaveBeenCalledWith(["Families", "Adventure"]);
  });

  it("includes selected custom tags in the dropdown list", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <TagInput
        id="tags"
        value={["Custom Tag"]}
        onChange={onChange}
        placeholder="Select tags"
        suggestions={["Adventure"]}
      />
    );

    await user.click(screen.getByRole("combobox"));

    expect(
      screen
        .getByRole("checkbox", { name: "Custom Tag" })
        .getAttribute("aria-checked")
    ).toBe("true");

    const customTagRow = screen
      .getByRole("checkbox", { name: "Custom Tag" })
      .closest("[cmdk-item]");

    expect(customTagRow).not.toBeNull();
    await user.click(customTagRow!);

    expect(onChange).toHaveBeenCalledWith([]);
  });
});
