import {
  FileText,
  BarChart,
  Settings,
  Folder,
  Users,
  Link as LinkIcon,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface NavItem {
  id: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    id: "itineraries",
    labelKey: "sidebar.itineraries",
    icon: FileText,
  },
  {
    id: "reports",
    labelKey: "sidebar.reports",
    icon: BarChart,
  },
  {
    id: "system-configuration",
    labelKey: "sidebar.systemConfig",
    icon: Settings,
    children: [
      { id: "agents", labelKey: "sidebar.agents", icon: Users },
      { id: "users", labelKey: "sidebar.users", icon: Users },
    ],
  },
  {
    id: "database",
    labelKey: "sidebar.database",
    icon: Folder,
    children: [
      { id: "destination", labelKey: "sidebar.destination", icon: Folder },
      { id: "service-types", labelKey: "sidebar.serviceTypes", icon: Folder },
      { id: "rate-types", labelKey: "sidebar.rateTypes", icon: Folder },
      { id: "source-market", labelKey: "sidebar.sourceMarket", icon: Folder },
      { id: "documents", labelKey: "sidebar.documents", icon: Folder },
      { id: "log", labelKey: "sidebar.log", icon: Folder },
    ],
  },
  {
    id: "suppliers",
    labelKey: "sidebar.suppliers",
    icon: Users,
  },
  {
    id: "rules",
    labelKey: "sidebar.rules",
    icon: LinkIcon,
    children: [
      { id: "markups", labelKey: "sidebar.markups", icon: LinkIcon },
      {
        id: "circuit-discounts",
        labelKey: "sidebar.circuitDiscounts",
        icon: LinkIcon,
      },
      { id: "commissions", labelKey: "sidebar.commissions", icon: LinkIcon },
    ],
  },
];

interface NavItemComponentProps {
  item: NavItem;
  isCollapsed: boolean;
}

function NavItemComponent({ item, isCollapsed }: NavItemComponentProps) {
  const { t } = useTranslation("admin");
  const [isOpen, setIsOpen] = useState(false);
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;
  const children = item.children ?? [];

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) {
            setIsOpen(!isOpen);
          }
        }}
        className={`
          w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-md transition-colors
          ${
            isCollapsed
              ? "text-white/90 hover:bg-white/10 justify-center"
              : "text-foreground hover:bg-accent font-semibold"
          }
        `}
      >
        <Icon
          className={`h-5 w-5 shrink-0 ${isCollapsed ? "text-white" : "text-muted-foreground"}`}
        />
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left font-semibold">
              {t(item.labelKey)}
            </span>
            {hasChildren &&
              (isOpen ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              ))}
          </>
        )}
      </button>
      {hasChildren && isOpen && !isCollapsed && (
        <div className="ml-4 mt-1 space-y-1">
          {children.map((child) => {
            const ChildIcon = child.icon;
            return (
              <button
                key={child.id}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors font-normal"
              >
                <ChildIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 text-left">{t(child.labelKey)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface SidebarNavProps {
  isCollapsed?: boolean;
}

export function SidebarNav({ isCollapsed = false }: SidebarNavProps) {
  return (
    <nav className={`flex flex-col gap-1 ${isCollapsed ? "p-2" : "p-2"}`}>
      {navItems.map((item) => (
        <NavItemComponent key={item.id} item={item} isCollapsed={isCollapsed} />
      ))}
    </nav>
  );
}
