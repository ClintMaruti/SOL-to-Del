import { render, screen } from "@testing-library/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@sol/ui";
import { describe, expect, it } from "vitest";

describe("DropdownMenu", () => {
  it("renders the shared content shell and item states", () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const content = screen.getByRole("menu");
    const editItem = screen.getByRole("menuitem", { name: "Edit" });
    const deleteItem = screen.getByRole("menuitem", { name: "Delete" });

    expect(content.className).toContain(
      "rounded-[var(--dropdown-menu-content-radius)]"
    );
    expect(editItem.className).toContain(
      "data-[highlighted]:bg-[color:var(--dropdown-menu-item-bg-hover)]"
    );
    expect(deleteItem.getAttribute("data-variant")).toBe("destructive");
  });
});
