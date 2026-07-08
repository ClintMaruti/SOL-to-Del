import { MainSidebar } from "./MainSidebar";
import { PageSidebar } from "./PageSidebar";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <>
      <MainSidebar className={className} />
      <PageSidebar className={className} />
    </>
  );
}
