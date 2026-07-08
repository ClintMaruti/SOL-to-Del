import type { Meta, StoryObj } from "@storybook/react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@sol/ui";

const meta = {
  title: "Navigation/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  args: {
    defaultValue: "details",
  },
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="details" className="max-w-xl">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="pricing">Pricing</TabsTrigger>
        <TabsTrigger value="rules">Rules</TabsTrigger>
      </TabsList>
      <TabsContent value="details" className="rounded-md border p-4 text-sm">
        General content for the selected tab.
      </TabsContent>
      <TabsContent value="pricing" className="rounded-md border p-4 text-sm">
        Pricing settings and rate information.
      </TabsContent>
      <TabsContent value="rules" className="rounded-md border p-4 text-sm">
        Availability and restriction rules.
      </TabsContent>
    </Tabs>
  ),
};
