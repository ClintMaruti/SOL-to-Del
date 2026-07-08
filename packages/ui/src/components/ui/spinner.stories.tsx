import type { Meta, StoryObj } from "@storybook/react";

import { Spinner } from "@sol/ui";

const meta = {
  title: "Feedback/Spinner",
  component: Spinner,
  tags: ["autodocs"],
} satisfies Meta<typeof Spinner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4 text-brand-red">
      <Spinner className="size-4" />
      <Spinner className="size-5" />
      <Spinner className="size-6" />
    </div>
  ),
};
