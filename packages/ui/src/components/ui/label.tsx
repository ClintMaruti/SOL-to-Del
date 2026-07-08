import * as LabelPrimitive from "@radix-ui/react-label";
import * as React from "react";

import { cn } from "../../lib/utils";

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center text-sm leading-none font-semibold select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 text-neutral-900",
        className
      )}
      {...props}
    />
  );
}

export { Label };
