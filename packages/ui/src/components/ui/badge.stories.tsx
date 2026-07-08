import type { Meta, StoryObj } from "@storybook/react";
import { CircleAlert, Sparkles } from "lucide-react";

import { Badge } from "@sol/ui";

const meta = {
  title: "Display/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: {
    children: "Badge",
    variant: "default",
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="destructive">Destructive</Badge>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge>
        <Sparkles />
        Featured
      </Badge>
      <Badge variant="destructive">
        <CircleAlert />
        Needs review
      </Badge>
    </div>
  ),
};
