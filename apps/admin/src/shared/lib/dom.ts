export interface ScrollToSectionOptions {
  /** Vertical alignment: "start" (default) or "center". Use "center" for spy-nav so the section lands in the active zone. */
  block?: "start" | "center";
}

export function scrollToSection(
  sectionId: string,
  options: ScrollToSectionOptions = {}
) {
  const { block = "start" } = options;
  const el = document.getElementById(sectionId);
  if (el?.scrollIntoView) {
    el.scrollIntoView({ behavior: "smooth", block });
  }
}
