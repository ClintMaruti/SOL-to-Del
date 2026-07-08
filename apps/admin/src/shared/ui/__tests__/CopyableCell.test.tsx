import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CopyableCell } from "../CopyableCell";

describe("CopyableCell", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("copies when the visible cell content is clicked", async () => {
    const user = userEvent.setup();
    const writeTextSpy = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);

    render(<CopyableCell value="contact@acme.test" cellId="email-cell" />);

    await user.click(screen.getByText("contact@acme.test"));

    expect(writeTextSpy).toHaveBeenCalledWith("contact@acme.test");
    expect(
      screen.getByRole("button", { name: "Copy contact@acme.test" })
    ).toBeDefined();
  });
});
