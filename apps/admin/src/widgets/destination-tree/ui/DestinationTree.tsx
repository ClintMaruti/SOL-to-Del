import { useEffect } from "react";

import { flattenDestinations } from "@/entities/destination/lib/destination-utils";
import type { Destination } from "@/entities/destination/model/types";
import {
  DestinationSearchInput,
  useDestinationSearch,
} from "@/features/destination-search";

import { useDestinationTree } from "../model/useDestinationTree";

import { DestinationTreeEmpty } from "./DestinationTreeEmpty";
import { DestinationTreeRow } from "./DestinationTreeRow";

interface DestinationTreeProps {
  destinations: Destination[];
  onEdit?: (destination: Destination) => void;
  onDelete?: (destination: Destination) => void;
  onAdd?: (destination: Destination) => void;
  /** Called when empty state "+ Create" is clicked (no destinations yet) */
  onCreate?: () => void;
}

export function DestinationTree({
  destinations,
  onEdit,
  onDelete,
  onAdd,
  onCreate,
}: DestinationTreeProps) {
  const { searchQuery, setSearchQuery, filteredDestinations } =
    useDestinationSearch(destinations);

  const { expandedIds, toggleNode, expandAll } = useDestinationTree();

  // Auto-expand all nodes when searching to show results
  useEffect(() => {
    if (searchQuery.trim().length >= 3) {
      const allIds = new Set<string>();
      const collectIds = (dests: Destination[]) => {
        dests.forEach((dest) => {
          if (dest.children && dest.children.length > 0) {
            allIds.add(dest.id);
            collectIds(dest.children);
          }
        });
      };
      collectIds(filteredDestinations);
      expandAll(Array.from(allIds));
    }
  }, [searchQuery, filteredDestinations, expandAll]);

  const flattenedDestinations = flattenDestinations(
    filteredDestinations,
    expandedIds
  );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <DestinationSearchInput value={searchQuery} onChange={setSearchQuery} />
      <div className="bg-background border border-border rounded-md overflow-hidden flex-1 min-h-0 mb-2">
        {flattenedDestinations.length === 0 ? (
          <DestinationTreeEmpty searchQuery={searchQuery} onCreate={onCreate} />
        ) : (
          flattenedDestinations.map((destination) => (
            <DestinationTreeRow
              key={destination.id}
              destination={destination}
              depth={destination.depth}
              preferredStar={destination.preferredStar}
              isExpanded={expandedIds.has(destination.id)}
              onToggle={() => toggleNode(destination.id)}
              onEdit={onEdit}
              onDelete={onDelete}
              onAdd={onAdd}
              searchQuery={searchQuery}
            />
          ))
        )}
      </div>
    </div>
  );
}
