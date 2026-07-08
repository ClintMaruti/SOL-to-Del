import type { Meta, StoryObj } from "@storybook/react";
import { Plus } from "lucide-react";

import { Button } from "@sol/ui";

const meta = {
  title: "Controls/Button",
  component: Button,
  tags: ["autodocs"],
  args: {
    children: "Button",
    variant: "primary",
    size: "md",
    disabled: false,
    isLoading: false,
    fullWidth: false,
  },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "primary",
        "secondary",
        "tertiary",
        "outline",
        "outline-secondary",
        "ghost",
        "danger",
        "link",
      ],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "icon-sm", "icon-md", "icon-lg"],
    },
    disabled: { control: "boolean" },
    isLoading: { control: "boolean" },
    fullWidth: { control: "boolean" },
    onClick: { action: "clicked" },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: ({ children, fullWidth, ...args }) => (
    <div className={fullWidth ? "max-w-sm" : undefined}>
      <Button {...args} fullWidth={fullWidth}>
        {children}
      </Button>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="tertiary">Tertiary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="outline-secondary">Outline Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button>
        <Plus />
        Create
      </Button>
      <Button isLoading>Save</Button>
      <Button disabled>Disabled</Button>
      <Button fullWidth className="max-w-xs">
        Full Width
      </Button>
    </div>
  ),
};
