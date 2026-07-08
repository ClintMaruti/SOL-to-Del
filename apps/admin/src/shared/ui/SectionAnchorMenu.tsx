import { cn } from "@sol/ui";
import { useTranslation } from "react-i18next";

import { scrollToSection } from "@/shared/lib";

export interface SectionAnchorItem {
  id: string;
  label: string;
}

interface SectionAnchorMenuProps {
  sections: readonly SectionAnchorItem[];
  activeSectionId: string | null;
  /** Called when a section link is clicked. Use to highlight that section immediately (e.g. when form is short and section can't reach the active zone). */
  onSectionClick?: (sectionId: string) => void;
  className?: string;
}

export function SectionAnchorMenu({
  sections,
  activeSectionId,
  onSectionClick,
  className,
}: SectionAnchorMenuProps) {
  const { t } = useTranslation("common");

  if (sections.length === 0) return null;

  const handleSectionClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string
  ) => {
    e.preventDefault();
    scrollToSection(id, { block: "center" });
    window.history.replaceState(null, "", `#${id}`);
    onSectionClick?.(id);
  };

  return (
    <aside
      className={cn(
        "hidden xl:block w-[360px] h-[calc(100vh-10rem)] max-h-[766px] shrink-0 rounded-md bg-background-secondary p-6 self-start sticky top-24",
        className
      )}
    >
      <nav aria-label={t("aria.pageSections")}>
        <ul className="space-y-4">
          {sections.map(({ id, label }) => {
            const isActive = activeSectionId === id;
            return (
              <li key={id}>
                <a
                  href={`#${id}`}
                  onClick={(e) => handleSectionClick(e, id)}
                  className={cn(
                    "text-base transition-colors leading-6 block",
                    isActive
                      ? "font-semibold text-text-primary"
                      : "font-normal text-text-secondary hover:text-text-primary"
                  )}
                  aria-current={isActive ? "location" : undefined}
                >
                  {label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
