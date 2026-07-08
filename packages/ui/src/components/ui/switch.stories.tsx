import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { Switch } from "@sol/ui";

type SwitchStoryArgs = {
  checked: boolean;
  disabled: boolean;
  loading: boolean;
  size: "sm" | "md" | "lg";
  variant: "solid" | "outline";
};

const meta = {
  title: "Controls/Switch",
  component: Switch,
  tags: ["autodocs"],
  args: {
    checked: false,
    disabled: false,
    loading: false,
    variant: "solid",
    size: "sm",
  },
  argTypes: {
    checked: { control: "boolean" },
    disabled: { control: "boolean" },
    loading: { control: "boolean" },
    variant: {
      control: "inline-radio",
      options: ["solid", "outline"],
    },
    size: {
      control: "inline-radio",
      options: ["sm", "md", "lg"],
    },
  },
} satisfies Meta<SwitchStoryArgs>;

export default meta;

type Story = StoryObj<SwitchStoryArgs>;

export const Playground: Story = {
  render: ({ checked, ...args }) => {
    const [isChecked, setIsChecked] = useState(checked);

    return (
      <Switch
        {...args}
        checked={isChecked}
        onCheckedChange={setIsChecked}
        aria-label="Switch playground"
      />
    );
  },
};

export const VariantsAndStates: Story = {
  render: () => {
    const [solidChecked, setSolidChecked] = useState(true);
    const [outlineChecked, setOutlineChecked] = useState(false);

    return (
      <div className="grid gap-4">
        <div className="flex items-center gap-4">
          <Switch
            checked={solidChecked}
            onCheckedChange={setSolidChecked}
            aria-label="Solid switch"
          />
          <Switch
            variant="outline"
            checked={outlineChecked}
            onCheckedChange={setOutlineChecked}
            aria-label="Outline switch"
          />
        </div>
        <div className="flex items-center gap-4">
          <Switch size="sm" defaultChecked aria-label="Small switch" />
          <Switch size="md" defaultChecked aria-label="Medium switch" />
          <Switch size="lg" defaultChecked aria-label="Large switch" />
        </div>
        <div className="flex items-center gap-4">
          <Switch disabled defaultChecked aria-label="Disabled switch" />
          <Switch loading checked aria-label="Loading switch" />
        </div>
      </div>
    );
  },
};
