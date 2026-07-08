import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { Destination } from "@/entities/destination";

interface DestinationTreeSelectProps {
  tree: Destination[];
  value: string | null;
  onValueChange: (id: string | null) => void;
  placeholder?: string;
}

function findNode(nodes: Destination[], id: string): Destination | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children?.length) {
      const found = findNode(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

function getInitialExpanded(nodes: Destination[]): Set<string> {
  // expand all country-level nodes by default
  const ids = new Set<string>();
  for (const n of nodes) {
    if (n.type === "Country") ids.add(n.id);
  }
  return ids;
}

function filterTree(
  nodes: Destination[],
  query: string
): { nodes: Destination[]; matchIds: Set<string> } {
  const q = query.toLowerCase();
  const matchIds = new Set<string>();

  function walk(list: Destination[]): Destination[] {
    const result: Destination[] = [];
    for (const n of list) {
      const childResult = n.children?.length ? walk(n.children) : [];
      const selfMatch = n.name.toLowerCase().includes(q);
      if (selfMatch || childResult.length > 0) {
        result.push({ ...n, children: childResult });
        if (selfMatch) matchIds.add(n.id);
        // if children matched, mark parent as "has match" for expansion
        if (childResult.length > 0) matchIds.add(n.id);
      }
    }
    return result;
  }

  return { nodes: walk(nodes), matchIds };
}

interface TreeNodeProps {
  node: Destination;
  depth: number;
  value: string | null;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  directMatchIds?: Set<string>;
  query: string;
}

function highlightMatch(name: string, query: string) {
  if (!query) return <>{name}</>;
  const idx = name.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{name}</>;
  return (
    <>
      {name.slice(0, idx)}
      <mark className="bg-yellow-100 text-inherit">
        {name.slice(idx, idx + query.length)}
      </mark>
      {name.slice(idx + query.length)}
    </>
  );
}

function TreeNode({
  node,
  depth,
  value,
  expandedIds,
  onToggle,
  onSelect,
  directMatchIds,
  query,
}: TreeNodeProps) {
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = value === node.id;

  const indentPx = depth * 12;

  return (
    <>
      <div
        className={`flex cursor-pointer items-start gap-1.5 rounded px-2 py-1.5 text-sm transition-colors ${
          isSelected ? "bg-gray-100" : "hover:bg-gray-50"
        }`}
        style={{ paddingLeft: `${8 + indentPx}px` }}
        onClick={() => onSelect(node.id)}
      >
        {/* Chevron for expand/collapse — click stops propagation so it doesn't also select */}
        <span
          className="mt-0.5 shrink-0 text-text-tertiary"
          onClick={(e) => {
            if (hasChildren) {
              e.stopPropagation();
              onToggle(node.id);
            }
          }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )
          ) : (
            <span className="size-3.5 inline-block" />
          )}
        </span>

        {/* Name + type */}
        <span className="flex-1 leading-none">
          <span
            className={
              hasChildren
                ? "font-medium text-text-primary"
                : "text-text-primary"
            }
          >
            {highlightMatch(node.name, query)}
          </span>
          <span className="block text-[10px] text-text-tertiary leading-none mt-0.5">
            {node.type}
          </span>
        </span>

        {/* Checkmark for selected */}
        {isSelected && (
          <Check className="mt-0.5 size-3.5 shrink-0 text-[#8B1515]" />
        )}
      </div>

      {/* Children */}
      {hasChildren &&
        isExpanded &&
        node.children!.map((child) => (
          <TreeNode
            key={child.id}
            node={child}
            depth={depth + 1}
            value={value}
            expandedIds={expandedIds}
            onToggle={onToggle}
            onSelect={onSelect}
            directMatchIds={directMatchIds}
            query={query}
          />
        ))}
    </>
  );
}

export function DestinationTreeSelect({
  tree,
  value,
  onValueChange,
  placeholder = "All",
}: DestinationTreeSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() =>
    getInitialExpanded(tree)
  );
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedNode = useMemo(
    () => (value ? findNode(tree, value) : null),
    [tree, value]
  );

  // When tree changes (loaded async), re-init expanded
  useEffect(() => {
    setExpandedIds(getInitialExpanded(tree));
  }, [tree]);

  // Auto-focus search on open
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [open]);

  const { nodes: filteredNodes, matchIds } = useMemo(() => {
    if (!query) return { nodes: tree, matchIds: new Set<string>() };
    return filterTree(tree, query);
  }, [tree, query]);

  // When searching, auto-expand all nodes that have matches
  useEffect(() => {
    if (query && matchIds.size > 0) {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        matchIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [query, matchIds]);

  const handleToggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelect = (id: string) => {
    onValueChange(id);
    setOpen(false);
    setQuery("");
  };

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange(null);
  };

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors ${
          open
            ? "border-ring bg-white ring-1 ring-ring"
            : "border-input bg-white hover:bg-gray-50"
        }`}
      >
        <span
          className={`flex-1 truncate text-left ${selectedNode ? "text-text-primary" : "text-text-tertiary"}`}
        >
          {selectedNode ? selectedNode.name : placeholder}
        </span>
        <span className="flex shrink-0 items-center gap-0.5 text-text-tertiary">
          {selectedNode && (
            <span
              role="button"
              onClick={handleClearSelection}
              className="rounded p-0.5 hover:bg-gray-200 hover:text-text-primary"
            >
              <X className="size-3" />
            </span>
          )}
          {open ? (
            <ChevronUp className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
        </span>
      </button>

      {/* Overlay panel — absolutely positioned so it floats over content below */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-input bg-white shadow-md">
          {/* Search */}
          <div className="flex items-center gap-2 border-b border-border-tertiary px-3 py-2">
            <Search className="size-3.5 shrink-0 text-text-tertiary" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="shrink-0 text-text-tertiary hover:text-text-primary"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Tree */}
          <div className="max-h-[240px] overflow-y-auto p-1">
            {/* "All" option */}
            {!query && (
              <div
                className={`flex cursor-pointer items-center gap-1.5 rounded px-2 py-1.5 text-sm transition-colors ${
                  value === null ? "bg-gray-100" : "hover:bg-gray-50"
                }`}
                onClick={() => {
                  onValueChange(null);
                  setOpen(false);
                }}
              >
                <span className="size-3.5 inline-block" />
                <span className="flex-1 text-text-primary">All</span>
                {value === null && (
                  <Check className="size-3.5 text-[#8B1515]" />
                )}
              </div>
            )}

            {filteredNodes.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-text-tertiary">
                No destinations found
              </p>
            )}

            {filteredNodes.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                depth={0}
                value={value}
                expandedIds={expandedIds}
                onToggle={handleToggle}
                onSelect={handleSelect}
                directMatchIds={matchIds}
                query={query}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
