import { Button } from "@sol/ui";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { ItineraryListItem } from "@/entities/itinerary";
import {
  type CopySource,
  CreateItineraryModal,
} from "@/features/create-itinerary";
import { buildPath, ROUTES } from "@/shared/lib/paths";
import { ItinerariesList } from "@/widgets/itineraries-list";

export function ItinerariesPage() {
  const navigate = useNavigate();
  const { innerPageId } = useParams<{ innerPageId?: string }>();
  const isCreateOpen = innerPageId === "create";

  const [copySource, setCopySource] = useState<CopySource | null>(null);
  const [isCopyOpen, setIsCopyOpen] = useState(false);

  const handleCreate = () => {
    setCopySource(null);
    navigate(ROUTES.ITINERARIES_CREATE);
  };

  const handleCopy = (item: ItineraryListItem) => {
    setCopySource({
      reference: item.reference,
      agencyId: null,
      agentId: null,
      title: item.title,
      travelDateFrom: item.travelDateFrom,
      travelDateTo: item.travelDateTo,
      adultsCount: 2,
      childrenCount: 0,
      infantsCount: 0,
      childrenAges: [],
    });
    setIsCopyOpen(true);
  };

  const showList =
    !innerPageId || innerPageId === "itineraries" || isCreateOpen;

  if (!showList) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">Page: {innerPageId}</p>
      </div>
    );
  }

  return (
    <div className="box-border flex min-h-[calc(100dvh-4rem)] flex-1 flex-col p-4">
      <div className="mb-4 flex shrink-0 items-start justify-between">
        <div className="flex-1">
          <h1 className="leading-10 text-neutral-900">Itineraries</h1>
          <p className="max-w-2xl text-sm font-medium leading-6 text-neutral-600">
            View and manage all itineraries here.
          </p>
        </div>
        <Button onClick={handleCreate} variant="primary" className="shrink-0">
          <Plus />
          Create
        </Button>
      </div>

      <ItinerariesList onCreate={handleCreate} onCopy={handleCopy} />

      {/* New / Existing flow */}
      <CreateItineraryModal
        key={isCreateOpen ? "open" : "closed"}
        open={isCreateOpen}
        onOpenChange={(open) => {
          if (!open) navigate(ROUTES.ITINERARY_ITINERARIES_LIST);
        }}
        onSuccess={(itinerary) => {
          navigate(buildPath(ROUTES.ITINERARY_DETAIL, { id: itinerary.id }));
        }}
      />

      {/* Copy flow */}
      <CreateItineraryModal
        key={isCopyOpen ? `copy-${copySource?.reference}` : "copy-closed"}
        open={isCopyOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCopyOpen(false);
            setCopySource(null);
          }
        }}
        onSuccess={() => {
          setIsCopyOpen(false);
          setCopySource(null);
          navigate(ROUTES.ITINERARY_ITINERARIES_LIST);
        }}
        copySource={copySource ?? undefined}
      />
    </div>
  );
}
