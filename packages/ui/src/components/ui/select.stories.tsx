import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sol/ui";

type SelectStoryArgs = {
  disabled: boolean;
  filled: boolean;
  invalid: boolean;
  placeholder: string;
  size: "xs" | "sm" | "md" | "lg";
  value: string;
};

const meta = {
  title: "Controls/Select",
  component: SelectTrigger,
  tags: ["autodocs"],
  args: {
    disabled: false,
    filled: true,
    invalid: false,
    placeholder: "Select service type",
    size: "md",
    value: "accommodation",
  },
  argTypes: {
    disabled: { control: "boolean" },
    filled: { control: "boolean" },
    invalid: { control: "boolean" },
    placeholder: { control: "text" },
    size: {
      control: "inline-radio",
      options: ["xs", "sm", "md", "lg"],
    },
    value: {
      control: "select",
      options: ["", "accommodation", "activity", "transport"],
    },
  },
} satisfies Meta<SelectStoryArgs>;

export default meta;

type Story = StoryObj<SelectStoryArgs>;

export const Playground: Story = {
  render: ({ invalid, placeholder, value, filled, ...args }) => {
    const [selectedValue, setSelectedValue] = useState(value);

    return (
      <div className="max-w-md">
        <Select value={selectedValue} onValueChange={setSelectedValue}>
          <SelectTrigger
            {...args}
            className="w-full"
            filled={filled && Boolean(selectedValue)}
            aria-invalid={invalid}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="accommodation">Accommodation</SelectItem>
            <SelectItem value="activity">Activity</SelectItem>
            <SelectItem value="transport">Transport</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  },
};

export const SizesAndStates: Story = {
  render: () => {
    const [value, setValue] = useState("accommodation");

    return (
      <div className="grid max-w-md gap-3">
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger className="w-full" filled={Boolean(value)}>
            <SelectValue placeholder="Select service type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="accommodation">Accommodation</SelectItem>
            <SelectItem value="activity">Activity</SelectItem>
            <SelectItem value="transport">Transport</SelectItem>
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger className="w-full" aria-invalid="true">
            <SelectValue placeholder="Invalid state" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="one">One</SelectItem>
          </SelectContent>
        </Select>

        <div className="grid gap-3">
          {(["xs", "sm", "md", "lg"] as const).map((size) => (
            <Select key={size} defaultValue="one">
              <SelectTrigger className="w-full" size={size}>
                <SelectValue placeholder={`${size} select`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one">Selected item</SelectItem>
              </SelectContent>
            </Select>
          ))}
        </div>
      </div>
    );
  },
};
