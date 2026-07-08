import type { Meta, StoryObj } from "@storybook/react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@sol/ui";

const meta = {
  title: "Display/Card",
  component: Card,
  tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
    <div className="max-w-md">
      <Card>
        <CardHeader className="gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>Safari Service</CardTitle>
              <CardDescription>
                Shared card layout for summary and action blocks.
              </CardDescription>
            </div>
            <Badge variant="secondary">Draft</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Use cards for grouped content, preview panels, and detail layouts.
          </p>
          <p>
            Header, content, and footer spacing come from the shared primitive.
          </p>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button variant="secondary">Cancel</Button>
          <Button>Save</Button>
        </CardFooter>
      </Card>
    </div>
  ),
};
