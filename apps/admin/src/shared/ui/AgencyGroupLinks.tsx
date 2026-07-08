import { Fragment, useMemo } from "react";
import { Link } from "react-router-dom";

import { useHighlightMatch } from "@/shared/hooks";
import { sortAgencyGroupsByName, type NamedAgencyGroup } from "@/shared/lib";
import { ROUTES } from "@/shared/lib/paths";

interface AgencyGroupNameLinkProps {
  name: string;
  searchQuery: string;
  className?: string;
}

function AgencyGroupNameLink({
  name,
  searchQuery,
  className,
}: AgencyGroupNameLinkProps) {
  const highlightedName = useHighlightMatch(name, searchQuery);

  return (
    <Link
      to={`${ROUTES.AGENCY_GROUPS}?search=${encodeURIComponent(name)}`}
      className={className}
    >
      {highlightedName}
    </Link>
  );
}

interface AgencyGroupLinksProps {
  groups: readonly NamedAgencyGroup[] | null | undefined;
  searchQuery: string;
  fallback?: string;
  linkClassName?: string;
}

export function AgencyGroupLinks({
  groups,
  searchQuery,
  fallback = "",
  linkClassName = "text-blue-500 hover:underline font-medium text-left text-sm",
}: AgencyGroupLinksProps) {
  const fallbackText = useHighlightMatch(fallback, searchQuery);
  const visibleGroups = useMemo(
    () =>
      sortAgencyGroupsByName(groups)
        .map((group) => ({
          id: group.id?.trim(),
          name: group.name?.trim(),
        }))
        .filter(
          (group): group is { id: string | undefined; name: string } =>
            typeof group.name === "string" && group.name.length > 0
        ),
    [groups]
  );

  if (!visibleGroups.length) {
    return <>{fallbackText}</>;
  }

  return (
    <>
      {visibleGroups.map((group, index) => (
        <Fragment key={group.id ?? group.name}>
          {index > 0 ? ", " : null}
          <AgencyGroupNameLink
            name={group.name}
            searchQuery={searchQuery}
            className={linkClassName}
          />
        </Fragment>
      ))}
    </>
  );
}
