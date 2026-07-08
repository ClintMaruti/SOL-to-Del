import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { Checkbox, CheckboxGroup } from "@sol/ui";

type CheckboxStoryArgs = {
  checked: boolean;
  disabled: boolean;
  invalid: boolean;
  size: "sm" | "md" | "lg";
  label: string;
};

const meta = {
  title: "Controls/Checkbox",
  component: CheckboxGroup,
  tags: ["autodocs"],
  args: {
    checked: false,
    disabled: false,
    invalid: false,
    size: "sm",
    label: "Checkbox label",
  },
  argTypes: {
    checked: { control: "boolean" },
    disabled: { control: "boolean" },
    invalid: { control: "boolean" },
    size: {
      control: "inline-radio",
      options: ["sm", "md", "lg"],
    },
    label: { control: "text" },
  },
} satisfies Meta<CheckboxStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: ({ checked, label, ...args }) => {
    const [isChecked, setIsChecked] = useState(checked);

    return (
      <CheckboxGroup
        {...args}
        checked={isChecked}
        onCheckedChange={(value) => setIsChecked(value === true)}
        label={label}
      />
    );
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Checkbox size="sm" defaultChecked aria-label="Small checkbox" />
      <Checkbox size="md" defaultChecked aria-label="Medium checkbox" />
      <Checkbox size="lg" defaultChecked aria-label="Large checkbox" />
    </div>
  ),
};

export const Grouped: Story = {
  render: () => {
    const [checked, setChecked] = useState(true);

    return (
      <div className="grid gap-4">
        <CheckboxGroup
          checked={checked}
          onCheckedChange={(value) => setChecked(value === true)}
          label="Accept terms and conditions"
        />
        <CheckboxGroup
          defaultChecked={false}
          invalid
          label="Invalid checkbox"
        />
        <CheckboxGroup disabled label="Disabled checkbox" />
      </div>
    );
  },
};
