import type { Meta, StoryObj } from "@storybook/react";

import { Button, toast } from "@sol/ui";

const meta = {
  title: "Feedback/Toast",
  tags: ["autodocs"],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="secondary"
        onClick={() =>
          toast("Basic toast message", {
            title: "Saved",
          })
        }
      >
        Default toast
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast.success("Supplier created successfully", {
            title: "Success",
          })
        }
      >
        Success toast
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast.error("We could not save that change", {
            title: "Error",
          })
        }
      >
        Error toast
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast.warning("Some fields still need attention", {
            title: "Warning",
          })
        }
      >
        Warning toast
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast.info("New inventory sync completed", {
            title: "Info",
          })
        }
      >
        Info toast
      </Button>
    </div>
  ),
};
