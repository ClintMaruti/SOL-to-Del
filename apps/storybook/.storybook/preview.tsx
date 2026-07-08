import type { Preview } from "@storybook/react";

import "@sol/ui/styles";
import "@sol/i18n";
import { Toaster, TooltipProvider } from "@sol/ui";
import { MemoryRouter } from "react-router-dom";

const preview: Preview = {
  parameters: {
    layout: "padded",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <TooltipProvider delayDuration={200}>
          <Story />
          <Toaster position="bottom-right" />
        </TooltipProvider>
      </MemoryRouter>
    ),
  ],
};

export default preview;
