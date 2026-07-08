import { Input, Popover, PopoverContent, PopoverTrigger, cn } from "@sol/ui";
import { Check, ChevronDown, ChevronUp, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Agency } from "@/entities/agency";
import type { Agent } from "@/entities/agent";
import {
  agencySelectionValue,
  parseAgencySelection,
} from "@/features/create-itinerary/model/validation";

import { isCreateItineraryAgentActive } from "../model/agentStatus";

interface AgencyAgentSelectProps {
  agencies: Agency[];
  agents: Agent[];
  value: string;
  onValueChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  hasError?: boolean;
}

interface AgencyTreeItem {
  agency: Agency;
  value: string;
  agents: AgentTreeItem[];
  searchText: string;
}

interface AgentTreeItem {
  agent: Agent;
  value: string;
  label: string;
  searchText: string;
}

function getAgentName(agent: Agent) {
  return `${agent.firstName} ${agent.lastName}`.trim();
}

export function AgencyAgentSelect({
  agencies,
  agents,
  value,
  onValueChange,
  id,
  disabled,
  hasError,
}: AgencyAgentSelectProps) {
  const { t } = useTranslation(["admin", "common"]);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedAgencyValues, setExpandedAgencyValues] = useState<Set<string>>(
    new Set()
  );
  const [collapsedAgencyValues, setCollapsedAgencyValues] = useState<
    Set<string>
  >(new Set());

  const tree = useMemo(() => {
    const activeAgencies = [...agencies]
      .filter((agency) => agency.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
    const activeAgencyIds = new Set(activeAgencies.map((agency) => agency.id));
    const activeAgentsByAgencyId = new Map<string, Agent[]>();

    for (const agent of agents) {
      if (
        !isCreateItineraryAgentActive(agent) ||
        !activeAgencyIds.has(agent.agencyId)
      ) {
        continue;
      }

      const current = activeAgentsByAgencyId.get(agent.agencyId) ?? [];
      current.push(agent);
      activeAgentsByAgencyId.set(agent.agencyId, current);
    }

    return activeAgencies.map<AgencyTreeItem>((agency) => {
      const agencyValue = agencySelectionValue({
        type: "agency",
        id: agency.id,
      });
      const agentItems = [...(activeAgentsByAgencyId.get(agency.id) ?? [])]
        .sort((a, b) => getAgentName(a).localeCompare(getAgentName(b)))
        .map<AgentTreeItem>((agent) => {
          const label = getAgentName(agent);
          return {
            agent,
            label,
            value: agencySelectionValue({ type: "agent", id: agent.id }),
            searchText: `${label} ${agency.name}`.toLowerCase(),
          };
        });

      return {
        agency,
        value: agencyValue,
        agents: agentItems,
        searchText: `${agency.name} ${agentItems
          .map((agent) => agent.label)
          .join(" ")}`.toLowerCase(),
      };
    });
  }, [agencies, agents]);

  const selectedAgencyValue = useMemo(() => {
    const selection = parseAgencySelection(value);
    if (selection?.type !== "agent") {
      return null;
    }

    return (
      tree.find((agencyItem) =>
        agencyItem.agents.some(
          (agentItem) => agentItem.agent.id === selection.id
        )
      )?.value ?? null
    );
  }, [tree, value]);

  const selectedLabel = useMemo(() => {
    for (const agencyItem of tree) {
      if (agencyItem.value === value) {
        return agencyItem.agency.name;
      }

      const agent = agencyItem.agents.find((item) => item.value === value);
      if (agent) {
        return agent.label;
      }
    }

    return "";
  }, [tree, value]);

  const filteredTree = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return tree.map((agencyItem) => ({
        ...agencyItem,
        agents: agencyItem.agents,
      }));
    }

    return tree
      .map((agencyItem) => {
        const agencyMatches = agencyItem.searchText.includes(query);
        const matchingAgents = agencyItem.agents.filter((agentItem) =>
          agentItem.searchText.includes(query)
        );
        if (!agencyMatches && matchingAgents.length === 0) {
          return null;
        }

        return {
          ...agencyItem,
          agents: agencyMatches ? agencyItem.agents : matchingAgents,
        };
      })
      .filter((item): item is AgencyTreeItem => Boolean(item));
  }, [searchQuery, tree]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearchQuery("");
    }
  };

  const handleSelect = (nextValue: string) => {
    const selection = parseAgencySelection(nextValue);
    if (selection?.type === "agent") {
      const parentAgencyValue = tree.find((agencyItem) =>
        agencyItem.agents.some(
          (agentItem) => agentItem.agent.id === selection.id
        )
      )?.value;

      if (parentAgencyValue) {
        setExpandedAgencyValues((previous) => {
          const next = new Set(previous);
          next.add(parentAgencyValue);
          return next;
        });
        setCollapsedAgencyValues((previous) => {
          const next = new Set(previous);
          next.delete(parentAgencyValue);
          return next;
        });
      }
    }

    onValueChange(nextValue);
    setOpen(false);
    setSearchQuery("");
  };

  const toggleAgency = (agencyValue: string, isExpanded: boolean) => {
    setExpandedAgencyValues((previous) => {
      const next = new Set(previous);
      if (isExpanded) {
        next.delete(agencyValue);
      } else {
        next.add(agencyValue);
      }
      return next;
    });
    setCollapsedAgencyValues((previous) => {
      const next = new Set(previous);
      if (isExpanded) {
        next.add(agencyValue);
      } else {
        next.delete(agencyValue);
      }
      return next;
    });
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          id={id}
          type="button"
          className={cn(
            "border-input flex h-9 w-full items-center gap-2 rounded-md border bg-white px-3 py-1 text-sm font-medium shadow-none outline-none transition-[color,box-shadow]",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            selectedLabel ? "text-text-primary" : "text-muted-foreground",
            hasError && "border-destructive ring-destructive/20 ring-1"
          )}
          aria-invalid={hasError ? "true" : undefined}
        >
          <span className="min-w-0 flex-1 truncate text-left">
            {selectedLabel || t("admin:itineraries.create.placeholders.agency")}
          </span>
          {open ? (
            <ChevronUp className="size-4 shrink-0 text-neutral-400" />
          ) : (
            <ChevronDown className="size-4 shrink-0 text-neutral-400" />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-md border border-border-tertiary bg-white p-0 shadow-sm"
      >
        <div className="border-b border-border-tertiary px-3">
          <div className="flex items-center gap-2 py-3">
            <Search className="size-4 shrink-0 text-text-tertiary" />
            <Input
              aria-label={t("admin:itineraries.create.aria.searchAgencies")}
              size="sm"
              placeholder={t(
                "admin:itineraries.create.placeholders.agencySearch"
              )}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-auto! border-0! bg-transparent! px-0! py-0 text-sm shadow-none focus-visible:border-0! focus-visible:shadow-none"
            />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto p-1">
          {filteredTree.length === 0 ? (
            <div className="px-2 py-2 text-center text-sm text-muted-foreground">
              {t("admin:itineraries.create.empty.agencies")}
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {filteredTree.map((agencyItem) => {
                const hasAgents = agencyItem.agents.length > 0;
                const isExpanded =
                  searchQuery.trim().length > 0 ||
                  expandedAgencyValues.has(agencyItem.value) ||
                  (selectedAgencyValue === agencyItem.value &&
                    !collapsedAgencyValues.has(agencyItem.value));
                const agencySelected = value === agencyItem.value;

                return (
                  <div key={agencyItem.value} className="flex flex-col gap-0.5">
                    <div
                      className={cn(
                        "flex min-h-[50px] items-start gap-2 rounded-[6px] bg-background-primary px-2 py-1.5",
                        agencySelected &&
                          "bg-[color:var(--select-item-bg-selected)]"
                      )}
                    >
                      {hasAgents ? (
                        <button
                          type="button"
                          className="mt-1 inline-flex size-4 shrink-0 items-center justify-center text-text-primary outline-none"
                          aria-label={
                            isExpanded
                              ? t(
                                  "admin:itineraries.create.aria.collapseAgency",
                                  {
                                    agency: agencyItem.agency.name,
                                  }
                                )
                              : t(
                                  "admin:itineraries.create.aria.expandAgency",
                                  {
                                    agency: agencyItem.agency.name,
                                  }
                                )
                          }
                          onClick={() =>
                            toggleAgency(agencyItem.value, isExpanded)
                          }
                        >
                          {isExpanded ? (
                            <ChevronUp className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )}
                        </button>
                      ) : (
                        <span className="mt-1 size-4 shrink-0" aria-hidden />
                      )}

                      <button
                        type="button"
                        className="flex min-w-0 flex-1 items-start gap-2 text-left outline-none"
                        onClick={() => handleSelect(agencyItem.value)}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm leading-6 font-medium text-text-primary">
                            {agencyItem.agency.name}
                          </span>
                          <span className="block truncate text-xs leading-[14px] font-medium text-text-tertiary">
                            {t("admin:itineraries.create.selectors.agencyNode")}
                          </span>
                        </span>
                        {agencySelected ? (
                          <Check className="mt-1 size-4 shrink-0 text-brand-red" />
                        ) : null}
                      </button>
                    </div>

                    {isExpanded
                      ? agencyItem.agents.map((agentItem) => {
                          const agentSelected = value === agentItem.value;
                          return (
                            <button
                              key={agentItem.value}
                              type="button"
                              className={cn(
                                "ml-4 flex min-h-9 items-center gap-2 rounded-[6px] px-2 py-1.5 text-left outline-none hover:bg-muted/60",
                                agentSelected
                                  ? "bg-[color:var(--select-item-bg-selected)]"
                                  : "bg-background-primary"
                              )}
                              onClick={() => handleSelect(agentItem.value)}
                            >
                              <span className="min-w-0 flex-1 truncate text-sm leading-6 font-medium text-text-primary">
                                {agentItem.label}
                              </span>
                              {agentSelected ? (
                                <Check className="size-4 shrink-0 text-brand-red" />
                              ) : null}
                            </button>
                          );
                        })
                      : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
