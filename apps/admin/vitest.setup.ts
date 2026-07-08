import { i18n } from "@sol/i18n";

// Force English in tests for consistent assertions (CI may detect different locale)
i18n.changeLanguage("en");

// cmdk uses ResizeObserver (not in jsdom by default)
globalThis.ResizeObserver = class ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
};

Element.prototype.scrollIntoView = function scrollIntoView() {};
