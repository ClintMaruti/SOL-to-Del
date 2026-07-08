import type { SectionAnchorItem } from "@/shared/ui";

/** Section ids must match Card ids (general-information, contacts-address, other). */
export const AGENT_FORM_ANCHOR_SECTIONS: readonly SectionAnchorItem[] = [
  { id: "general-information", label: "General" },
  { id: "contacts-address", label: "Contacts & Address" },
  { id: "other", label: "Other" },
];
