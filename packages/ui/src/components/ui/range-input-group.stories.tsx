import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";

import { RangeInputGroup } from "@sol/ui";

function ExampleRangeInputGroup({
  invalid = false,
  minLabel = "min",
  maxLabel = "max",
}: {
  invalid?: boolean;
  minLabel?: string;
  maxLabel?: string;
}) {
  const [min, setMin] = React.useState("1");
  const [max, setMax] = React.useState("");

  return (
    <RangeInputGroup
      invalid={invalid}
      minLabel={minLabel}
      maxLabel={maxLabel}
      minInputProps={{
        type: "number",
        value: min,
        onChange: (event) => setMin(event.target.value),
        placeholder: "-",
        "aria-label": `${minLabel} value`,
      }}
      maxInputProps={{
        type: "number",
        value: max,
        onChange: (event) => setMax(event.target.value),
        placeholder: "-",
        "aria-label": `${maxLabel} value`,
      }}
      inputClassName="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
    />
  );
}

const meta = {
  title: "Controls/RangeInputGroup",
  component: ExampleRangeInputGroup,
  tags: ["autodocs"],
  render: (args) => (
    <div className="max-w-md">
      <ExampleRangeInputGroup {...args} />
    </div>
  ),
  args: {
    invalid: false,
    minLabel: "min",
    maxLabel: "max",
  },
} satisfies Meta<typeof ExampleRangeInputGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    invalid: false,
    minLabel: "min",
    maxLabel: "max",
  },
};

export const Error: Story = {
  args: {
    invalid: true,
    minLabel: "min",
    maxLabel: "max",
  },
};

export const AgeRange: Story = {
  args: {
    invalid: false,
    minLabel: "min age",
    maxLabel: "max age",
  },
};
