import type { Meta, StoryObj } from "@storybook/react";

import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@sol/ui";

const meta = {
  title: "Overlay/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tooltip defaultOpen>
      <TooltipTrigger asChild>
        <Button variant="secondary">Hover target</Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        Additional supporting context
      </TooltipContent>
    </Tooltip>
  ),
};
