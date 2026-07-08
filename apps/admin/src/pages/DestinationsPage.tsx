import { getErrorMessage } from "@sol/api-client";
import { Button } from "@sol/ui";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { useDestinations } from "@/entities/destination/api/useDestinations";
import { getAllDestinationTypes } from "@/entities/destination/lib/destination-utils";
import type { Destination } from "@/entities/destination/model/types";
import { CreateDestinationModal } from "@/features/create-destination";
import { DeleteDestinationModal } from "@/features/delete-destination";
import { EditDestinationModal } from "@/features/edit-destination";
import { PageLoader } from "@/shared/ui";
import { DestinationTree } from "@/widgets/destination-tree";

type modalType = "editDestination" | "createDestination" | "deleteDestination";

export function DestinationsPage() {
  const { innerPageId } = useParams<{ innerPageId?: string }>();
  const { t } = useTranslation(["admin", "common"]);
  const { data: destinations, isLoading, error } = useDestinations();
  const [editingDestination, setEditingDestination] =
    useState<Destination | null>(null);
  const [currentModal, setCurrentModal] = useState<modalType | null>(null);

  // using a generic mutating destination since the assumption is we can only perform
  // one mutation (delete/edit/create child destination) at once
  const [mutatingDestination, setMutatingDestination] =
    useState<Destination | null>(null);

  const toggleCreateDestinationModal = () => {
    if (currentModal) {
      handleCloseModal();
    } else {
      setCurrentModal("createDestination");
    }
  };

  const destinationTypes = getAllDestinationTypes();

  const handleEdit = (destination: Destination) => {
    setEditingDestination(destination);
    setCurrentModal("editDestination");
  };

  const handleDelete = (destination: Destination) => {
    setMutatingDestination(destination);
    setCurrentModal("deleteDestination");
  };

  const handleAdd = (destination: Destination) => {
    setMutatingDestination(destination);
    setCurrentModal("createDestination");
  };

  const handleCloseModal = () => {
    setCurrentModal(null);
    setMutatingDestination(null);
  };

  // Show main destinations content when innerPageId is "destinations" or undefined
  const showMainContent = !innerPageId || innerPageId === "destinations";

  return (
    <div className="p-4 flex flex-col min-h-0 flex-1">
      {showMainContent ? (
        <>
          <div className="flex items-start justify-between mb-4 shrink-0">
            <div className="flex-1">
              <h1 className="leading-10">{t("pageTitles.destinations")}</h1>
              <p className="mb-3 max-w-2xl leading-6">
                {t("pageTitles.destinationsDescription")}
              </p>
              <div className="flex flex-wrap gap-4">
                {destinationTypes.map(({ type, label, icon: Icon, color }) => (
                  <div
                    key={type}
                    className="flex items-center gap-2 text-xs font-semibold text-text-primary"
                  >
                    <Icon size={14} className={color} />
                    {label}
                  </div>
                ))}
              </div>
            </div>
            <Button
              onClick={toggleCreateDestinationModal}
              variant="primary"
              className="shrink-0"
            >
              <Plus />
              {t("common:buttons.create")}
            </Button>
          </div>
          {isLoading ? (
            <div
              className="shrink-0 flex items-center justify-center py-8"
              aria-label={t("aria.loadingDestinations")}
            >
              <PageLoader variant="inline" />
            </div>
          ) : error ? (
            <div className="text-destructive shrink-0">
              {getErrorMessage(error, t("errors.failedToLoadDestinations"))}
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col">
              <DestinationTree
                destinations={destinations ?? []}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAdd={handleAdd}
                onCreate={toggleCreateDestinationModal}
              />
            </div>
          )}
        </>
      ) : (
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            {t("admin:pages.innerPage", { id: innerPageId })}
          </h2>
        </div>
      )}

      {/* Create Destination Modal */}
      <CreateDestinationModal
        open={currentModal === "createDestination"}
        onOpenChange={handleCloseModal}
        destinations={destinations}
        parentDestination={mutatingDestination}
      />

      {/* Edit Destination Modal */}
      <EditDestinationModal
        destination={editingDestination}
        destinations={destinations ?? []}
        open={currentModal === "editDestination"}
        onOpenChange={handleCloseModal}
      />

      <DeleteDestinationModal
        destination={mutatingDestination}
        open={currentModal === "deleteDestination"}
        onOpenChange={handleCloseModal}
      />
    </div>
  );
}
