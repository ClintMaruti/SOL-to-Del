import type { Meta, StoryObj } from "@storybook/react";

import { Textarea } from "@sol/ui";

const meta = {
  title: "Controls/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  args: {
    placeholder: "Add a longer description",
    disabled: false,
    readOnly: false,
    "aria-invalid": false,
    defaultValue: "",
    rows: 4,
  },
  argTypes: {
    disabled: { control: "boolean" },
    readOnly: { control: "boolean" },
    "aria-invalid": { control: "boolean" },
    defaultValue: { control: "text" },
    placeholder: { control: "text" },
    rows: { control: "number" },
    onChange: { action: "changed" },
  },
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div className="max-w-lg">
      <Textarea {...args} />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="grid max-w-lg gap-3">
      <Textarea placeholder="Empty" />
      <Textarea defaultValue="Filled value" />
      <Textarea defaultValue="Invalid value" aria-invalid="true" />
      <Textarea defaultValue="Read only value" readOnly />
      <Textarea placeholder="Disabled" disabled />
    </div>
  ),
};
