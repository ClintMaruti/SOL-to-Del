// Reusable form (create + edit)
export { AgentForm } from "./ui/AgentForm";
export { AgentDetailSkeleton } from "./ui/AgentDetailSkeleton";
export { AGENT_FORM_ANCHOR_SECTIONS } from "./constants";
export type {
  AgentFormDataMinimal,
  AgentFormErrorsMinimal,
  AgentFormProps,
} from "./types";

// Header
export { AgentDetailsHeader } from "./ui/AgentDetailsHeader";
export type { AgentDetailsHeaderProps } from "./ui/AgentDetailsHeader";

// Footer
export {
  AgentDetailsFooter,
  AGENT_DETAILS_FOOTER_HEIGHT,
} from "./ui/AgentDetailsFooter";
export type { AgentDetailsFooterProps } from "./ui/AgentDetailsFooter";

// Form card components
export { GeneralInformationCard } from "./ui/GeneralInformationCard";
export { ContactsAddressCard } from "./ui/ContactsAddressCard";
export { OtherCard } from "./ui/OtherCard";

// Re-export shared components
export { SectionAnchorMenu, type SectionAnchorItem } from "@/shared/ui";
