import { useForm } from "@tanstack/react-form";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { CreateAgencyGroupFormData } from "@/features/create-agency-group/model/useCreateAgencyGroupForm";

import { GeneralInformationCard } from "../ui/GeneralInformationCard";

function CreateTestWrapper({
  initialData,
}: {
  initialData?: CreateAgencyGroupFormData;
}) {
  const form = useForm({
    defaultValues: initialData ?? { name: "", description: "", agencies: [] },
  });
  return <GeneralInformationCard form={form} />;
}

describe("GeneralInformationCard", () => {
  describe("Rendering", () => {
    it("should render card with General Information title", () => {
      render(<CreateTestWrapper />);

      expect(screen.getByText("General Information")).toBeDefined();
    });

    it("should render Group Name input with placeholder", () => {
      render(<CreateTestWrapper />);

      const nameInput = screen.getByLabelText(/group name/i);
      expect(nameInput).toBeDefined();
      expect(nameInput.getAttribute("placeholder")).toBe("Enter group title");
    });

    it("should render Group Name with required indicator", () => {
      render(<CreateTestWrapper />);

      const label = screen.getByText(/group name/i);
      expect(label.parentElement?.textContent).toContain("*");
    });

    it("should render Description textarea with placeholder", () => {
      render(<CreateTestWrapper />);

      const descInput = screen.getByLabelText(/description/i);
      expect(descInput).toBeDefined();
      expect(descInput.getAttribute("placeholder")).toBe(
        "Enter group description"
      );
    });

    it("should display initial values when provided", () => {
      render(
        <CreateTestWrapper
          initialData={{
            name: "Test Group",
            description: "Test description",
            agencies: [],
          }}
        />
      );

      expect(
        (screen.getByLabelText(/group name/i) as HTMLInputElement).value
      ).toBe("Test Group");
      expect(
        (screen.getByLabelText(/description/i) as HTMLTextAreaElement).value
      ).toBe("Test description");
    });
  });

  describe("User Interactions", () => {
    it("should allow typing in Group Name field", () => {
      render(<CreateTestWrapper />);

      const nameInput = screen.getByLabelText(
        /group name/i
      ) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: "New Agency Group" } });

      expect(nameInput.value).toBe("New Agency Group");
    });

    it("should allow typing in Description field", () => {
      render(<CreateTestWrapper />);

      const descInput = screen.getByLabelText(
        /description/i
      ) as HTMLTextAreaElement;
      fireEvent.change(descInput, { target: { value: "A group for testing" } });

      expect(descInput.value).toBe("A group for testing");
    });
  });

  describe("Structure", () => {
    it("should have id attribute for name input", () => {
      render(<CreateTestWrapper />);

      expect(screen.getByLabelText(/group name/i).getAttribute("id")).toBe(
        "name"
      );
    });

    it("should have id attribute for description textarea", () => {
      render(<CreateTestWrapper />);

      expect(screen.getByLabelText(/description/i).getAttribute("id")).toBe(
        "description"
      );
    });
  });

  describe("Accessibility", () => {
    it("should have proper label association for Group Name", () => {
      render(<CreateTestWrapper />);

      const nameInput = screen.getByLabelText(/group name/i);
      expect(nameInput).toBeDefined();
    });

    it("should have proper label association for Description", () => {
      render(<CreateTestWrapper />);

      const descInput = screen.getByLabelText(/description/i);
      expect(descInput).toBeDefined();
    });
  });
});
