import type { Meta, StoryObj } from "@storybook/react";

import { Separator } from "@sol/ui";

const meta = {
  title: "Display/Separator",
  component: Separator,
  tags: ["autodocs"],
} satisfies Meta<typeof Separator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: () => (
    <div className="max-w-xl space-y-4">
      <p className="text-sm text-muted-foreground">Section above</p>
      <Separator />
      <p className="text-sm text-muted-foreground">Section below</p>
    </div>
  ),
};

export const WithText: Story = {
  render: () => (
    <div className="max-w-xl">
      <Separator text="OR" />
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-16 items-center gap-4">
      <span className="text-sm text-muted-foreground">Left</span>
      <Separator orientation="vertical" />
      <span className="text-sm text-muted-foreground">Right</span>
    </div>
  ),
};
