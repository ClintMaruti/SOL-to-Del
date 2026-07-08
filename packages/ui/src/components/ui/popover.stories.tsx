import type { Meta, StoryObj } from "@storybook/react";
import { CalendarDays } from "lucide-react";

import {
  Button,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@sol/ui";

const meta = {
  title: "Overlay/Popover",
  component: Popover,
  tags: ["autodocs"],
} satisfies Meta<typeof Popover>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary">
          <CalendarDays />
          Open popover
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <PopoverHeader>
          <PopoverTitle>Date range</PopoverTitle>
          <PopoverDescription>
            Popovers work well for lightweight detail, filters, and supporting
            controls.
          </PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  ),
};
