import type { Meta, StoryObj } from "@storybook/react";

import { Input } from "@sol/ui";

const meta = {
  title: "Controls/Input",
  component: Input,
  tags: ["autodocs"],
  args: {
    placeholder: "Type something",
    size: "md",
    disabled: false,
    readOnly: false,
    "aria-invalid": false,
    defaultValue: "",
  },
  argTypes: {
    size: {
      control: "inline-radio",
      options: ["xs", "sm", "md", "lg"],
    },
    disabled: { control: "boolean" },
    readOnly: { control: "boolean" },
    "aria-invalid": { control: "boolean" },
    defaultValue: { control: "text" },
    placeholder: { control: "text" },
    type: {
      control: "select",
      options: ["text", "email", "number", "password", "search", "tel"],
    },
    onChange: { action: "changed" },
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div className="max-w-md">
      <Input {...args} />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="grid max-w-md gap-3">
      <Input placeholder="Empty" />
      <Input value="Filled value" readOnly />
      <Input defaultValue="Invalid value" aria-invalid="true" />
      <Input placeholder="Disabled" disabled />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="grid max-w-md gap-3">
      <Input size="xs" placeholder="Extra small" />
      <Input size="sm" placeholder="Small" />
      <Input size="md" placeholder="Medium" />
      <Input size="lg" placeholder="Large" />
    </div>
  ),
};
