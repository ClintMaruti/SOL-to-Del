import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { Agency } from "@/entities/agency";
import type { Agent } from "@/entities/agent";

export interface AgencyTreeSelectValue {
  agencyId: string | null;
  agentId: string | null;
}

interface AgencyTreeSelectProps {
  agencies: Agency[];
  agents: Agent[];
  value: AgencyTreeSelectValue;
  onSelect: (value: AgencyTreeSelectValue) => void;
  placeholder?: string;
}

function getInitialExpanded(agencies: Agency[]): Set<string> {
  return new Set(agencies.map((a) => a.id));
}

export function AgencyTreeSelect({
  agencies,
  agents,
  value,
  onSelect,
  placeholder = "All",
}: AgencyTreeSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() =>
    getInitialExpanded(agencies)
  );
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setExpandedIds(getInitialExpanded(agencies));
  }, [agencies]);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [open]);

  const activeAgencies = useMemo(
    () =>
      agencies
        .filter((a) => a.isActive)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [agencies]
  );

  const agentsByAgency = useMemo(() => {
    const map = new Map<string, Agent[]>();
    for (const agent of agents) {
      if (!agent.isActive) continue;
      const list = map.get(agent.agencyId) ?? [];
      list.push(agent);
      map.set(agent.agencyId, list);
    }
    // Sort agents within each agency
    for (const [id, list] of map) {
      map.set(
        id,
        list.sort((a, b) =>
          `${a.firstName} ${a.lastName}`.localeCompare(
            `${b.firstName} ${b.lastName}`
          )
        )
      );
    }
    return map;
  }, [agents]);

  const q = query.toLowerCase();

  const filteredAgencies = useMemo(() => {
    if (!q) return activeAgencies;
    return activeAgencies.filter((agency) => {
      const agencyMatch = agency.name.toLowerCase().includes(q);
      const agentMatch = (agentsByAgency.get(agency.id) ?? []).some((ag) =>
        `${ag.firstName} ${ag.lastName}`.toLowerCase().includes(q)
      );
      return agencyMatch || agentMatch;
    });
  }, [activeAgencies, agentsByAgency, q]);

  const handleToggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAgency = (agencyId: string) => {
    onSelect({ agencyId, agentId: null });
    setOpen(false);
    setQuery("");
  };

  const handleSelectAgent = (agent: Agent) => {
    onSelect({ agencyId: agent.agencyId, agentId: agent.id });
    setOpen(false);
    setQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect({ agencyId: null, agentId: null });
  };

  const triggerLabel = useMemo(() => {
    if (value.agentId) {
      const agent = agents.find((a) => a.id === value.agentId);
      return agent ? `${agent.firstName} ${agent.lastName}` : placeholder;
    }
    if (value.agencyId) {
      const agency = agencies.find((a) => a.id === value.agencyId);
      return agency?.name ?? placeholder;
    }
    return null;
  }, [value, agencies, agents, placeholder]);

  const hasValue = value.agencyId !== null || value.agentId !== null;

  function highlightMatch(text: string) {
    if (!q) return <>{text}</>;
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return <>{text}</>;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-yellow-100 text-inherit">
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    );
  }

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
          className={`flex-1 truncate text-left ${triggerLabel ? "text-text-primary" : "text-text-tertiary"}`}
        >
          {triggerLabel ?? placeholder}
        </span>
        <span className="flex shrink-0 items-center gap-0.5 text-text-tertiary">
          {hasValue && (
            <span
              role="button"
              onClick={handleClear}
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

      {/* Inline expanding panel — no absolute so it's not clipped by overflow-y-auto containers */}
      {open && (
        <div className="mt-1 rounded-md border border-input bg-white shadow-sm">
          {/* Search */}
          <div className="flex items-center gap-2 border-b border-border-tertiary px-3 py-2">
            <Search className="size-3.5 shrink-0 text-text-tertiary" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search agency or agent..."
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
          <div className="max-h-[260px] overflow-y-auto p-1">
            {/* "All" option */}
            {!q && (
              <div
                className={`flex cursor-pointer items-center gap-1.5 rounded px-2 py-1.5 text-sm transition-colors ${
                  !hasValue ? "bg-gray-100" : "hover:bg-gray-50"
                }`}
                onClick={() => {
                  onSelect({ agencyId: null, agentId: null });
                  setOpen(false);
                }}
              >
                <span className="size-3.5 inline-block" />
                <span className="flex-1 text-text-primary">All</span>
                {!hasValue && <Check className="size-3.5 text-[#8B1515]" />}
              </div>
            )}

            {filteredAgencies.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-text-tertiary">
                No agencies found
              </p>
            )}

            {filteredAgencies.map((agency) => {
              const agencyAgents = (agentsByAgency.get(agency.id) ?? []).filter(
                (ag) =>
                  !q ||
                  `${ag.firstName} ${ag.lastName}`.toLowerCase().includes(q)
              );
              const isExpanded = expandedIds.has(agency.id);
              const isAgencySelected =
                value.agencyId === agency.id && !value.agentId;
              const hasAgents =
                (agentsByAgency.get(agency.id)?.length ?? 0) > 0;

              return (
                <div key={agency.id}>
                  {/* Agency row */}
                  <div
                    className={`flex cursor-pointer items-start gap-1.5 rounded px-2 py-1.5 text-sm transition-colors ${
                      isAgencySelected ? "bg-gray-100" : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleSelectAgency(agency.id)}
                  >
                    <span
                      className="mt-0.5 shrink-0 text-text-tertiary"
                      onClick={(e) => {
                        if (hasAgents) {
                          e.stopPropagation();
                          handleToggle(agency.id);
                        }
                      }}
                    >
                      {hasAgents ? (
                        isExpanded ? (
                          <ChevronDown className="size-3.5" />
                        ) : (
                          <ChevronRight className="size-3.5" />
                        )
                      ) : (
                        <span className="size-3.5 inline-block" />
                      )}
                    </span>
                    <span className="flex-1 leading-none">
                      <span className="font-medium text-text-primary">
                        {highlightMatch(agency.name)}
                      </span>
                      <span className="block text-[10px] text-text-tertiary leading-none mt-0.5">
                        Agency
                      </span>
                    </span>
                    {isAgencySelected && (
                      <Check className="mt-0.5 size-3.5 shrink-0 text-[#8B1515]" />
                    )}
                  </div>

                  {/* Agent rows */}
                  {hasAgents &&
                    isExpanded &&
                    agencyAgents.map((agent) => {
                      const agentName = `${agent.firstName} ${agent.lastName}`;
                      const isAgentSelected = value.agentId === agent.id;
                      return (
                        <div
                          key={agent.id}
                          className={`flex cursor-pointer items-start gap-1.5 rounded py-1.5 text-sm transition-colors ${
                            isAgentSelected ? "bg-gray-100" : "hover:bg-gray-50"
                          }`}
                          style={{ paddingLeft: "20px" }}
                          onClick={() => handleSelectAgent(agent)}
                        >
                          <span className="size-3.5 mt-0.5 shrink-0 inline-block" />
                          <span className="flex-1 leading-none">
                            <span className="text-text-primary">
                              {highlightMatch(agentName)}
                            </span>
                            <span className="block text-[10px] text-text-tertiary leading-none mt-0.5">
                              Agent
                            </span>
                          </span>
                          {isAgentSelected && (
                            <Check className="mt-0.5 size-3.5 shrink-0 text-[#8B1515]" />
                          )}
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
