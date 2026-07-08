import type { Meta, StoryObj } from "@storybook/react";

import { FieldGroup, Input, Textarea } from "@sol/ui";

const meta = {
  title: "Forms/FieldGroup",
  component: FieldGroup,
  tags: ["autodocs"],
} satisfies Meta<typeof FieldGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TextField: Story = {
  render: () => (
    <div className="max-w-md">
      <FieldGroup
        htmlFor="story-field"
        label="Service Name"
        required
        topRightLabel="Required"
        bottomLeftLabel="Use a short, readable name"
      >
        <Input id="story-field" placeholder="Enter service name" />
      </FieldGroup>
    </div>
  ),
};

export const ErrorState: Story = {
  render: () => (
    <div className="max-w-md">
      <FieldGroup
        htmlFor="story-error-field"
        label="Description"
        error="Description is required"
      >
        <Textarea id="story-error-field" aria-invalid="true" />
      </FieldGroup>
    </div>
  ),
};
