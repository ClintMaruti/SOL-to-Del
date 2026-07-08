import { toast } from "@sol/ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ServiceEligibility } from "@/entities/service-eligibility";
import {
  useCreateServiceEligibility,
  useDeleteServiceEligibility,
  useServiceEligibilities,
  useUpdateServiceEligibility,
} from "@/entities/service-eligibility";

import {
  buildServiceEligibilityPayload,
  createDefaultEligibilityDraft,
  duplicateEligibilityDraft,
  LOCAL_ELIG_PREFIX,
} from "./eligibility-drafts";
import type {
  ServiceEligibilityActionHandlers,
  ServiceEligibilityItemHandlers,
  ServiceEligibilitySaveHandler,
  ServiceEligibilitySectionActions,
} from "./serviceEligibilitySectionTypes";
import type { DateEntry } from "./validity-dates-store";
import { useValidityDatesStore } from "./validity-dates-store";

const EMPTY_SERVICE_ELIGIBILITIES: ServiceEligibility[] = [];

interface UseServiceEligibilitySectionParams {
  serviceId: string | null;
  serviceName: string;
  onActionsChange?: (actions: ServiceEligibilitySectionActions | null) => void;
  onUnsavedChange?: (hasUnsaved: boolean) => void;
}

export function useServiceEligibilitySection({
  serviceId,
  serviceName,
  onActionsChange,
  onUnsavedChange,
}: UseServiceEligibilitySectionParams) {
  const { t } = useTranslation("admin");
  const replaceForService = useValidityDatesStore((s) => s.replaceForService);
  const removeDatesByEligibilityId = useValidityDatesStore(
    (s) => s.removeDatesByEligibilityId
  );

  const {
    data: serverEligibilities = EMPTY_SERVICE_ELIGIBILITIES,
    isPending,
    isFetching,
    error,
  } = useServiceEligibilities(serviceId);

  const [localEligibilities, setLocalEligibilities] = useState<
    ServiceEligibility[]
  >([]);
  const [savingEligibilityId, setSavingEligibilityId] = useState<string | null>(
    null
  );
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [eligibilityToDelete, setEligibilityToDelete] =
    useState<ServiceEligibility | null>(null);
  const [recentlyCreatedEligibilityIds, setRecentlyCreatedEligibilityIds] =
    useState<Set<string>>(new Set());
  const [dirtyEligibilityIds, setDirtyEligibilityIds] = useState<Set<string>>(
    new Set()
  );
  const itemHandlersRef = useRef<Map<string, ServiceEligibilityItemHandlers>>(
    new Map()
  );

  const { mutateAsync: createEligibilityAsync } = useCreateServiceEligibility();
  const { mutateAsync: updateEligibilityAsync } = useUpdateServiceEligibility();
  const {
    mutate: deleteEligibility,
    isPending: isDeletingEligibility,
    error: deleteEligibilityError,
    reset: resetDeleteEligibility,
  } = useDeleteServiceEligibility();

  const allEligibilities = useMemo(
    () => [...serverEligibilities, ...localEligibilities],
    [serverEligibilities, localEligibilities]
  );

  const isLoading =
    Boolean(serviceId) &&
    serverEligibilities.length === 0 &&
    (isPending || isFetching);
  const canCreateEligibility = Boolean(serviceId) && !isLoading && !error;

  useEffect(() => {
    if (!serviceId) return;

    const entries: Record<string, DateEntry> = {};
    for (const eligibility of allEligibilities) {
      for (const validityDate of eligibility.validityDates) {
        entries[validityDate.id] = {
          from: validityDate.from,
          to: validityDate.to,
          eligibilityId: eligibility.id,
          serviceId: eligibility.serviceId,
        };
      }
    }
    replaceForService(serviceId, entries);
  }, [allEligibilities, serviceId, replaceForService]);

  const handleRegisterHandlers = useCallback(
    (id: string, handlers: ServiceEligibilityItemHandlers | null) => {
      if (handlers) {
        itemHandlersRef.current.set(id, handlers);
      } else {
        itemHandlersRef.current.delete(id);
      }
    },
    []
  );

  const handleEligibilityDirtyChange = useCallback(
    (eligibilityId: string, isDirty: boolean) => {
      setDirtyEligibilityIds((prev) => {
        const next = new Set(prev);
        if (isDirty) next.add(eligibilityId);
        else next.delete(eligibilityId);
        return next;
      });
    },
    []
  );

  const hasUnsavedChanges =
    localEligibilities.length > 0 || dirtyEligibilityIds.size > 0;

  useEffect(() => {
    onUnsavedChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onUnsavedChange]);

  useEffect(() => {
    return () => onUnsavedChange?.(false);
  }, [onUnsavedChange]);

  useEffect(() => {
    if (!eligibilityToDelete) {
      resetDeleteEligibility();
    }
  }, [eligibilityToDelete, resetDeleteEligibility]);

  const handleAddEligibility = useCallback(() => {
    if (!serviceId) return;
    const sequence = allEligibilities.length + 1;
    const newEligibility = createDefaultEligibilityDraft(
      serviceId,
      serviceName,
      sequence,
      t("labels.eligibilityName", { sequence })
    );
    setLocalEligibilities((prev) => [...prev, newEligibility]);
  }, [allEligibilities.length, serviceId, serviceName, t]);

  const handleSaveEligibility = useCallback<ServiceEligibilitySaveHandler>(
    async (id, values, version) => {
      if (!serviceId) return undefined;
      setSavingEligibilityId(id);

      const payload = buildServiceEligibilityPayload(
        serviceId,
        id,
        values,
        version
      );

      try {
        if (id.startsWith(LOCAL_ELIG_PREFIX)) {
          const created = await createEligibilityAsync({
            serviceId,
            payload,
            onCreated: (savedEligibility) => {
              setRecentlyCreatedEligibilityIds((prev) => {
                const next = new Set(prev);
                next.add(savedEligibility.id);
                return next;
              });
              removeDatesByEligibilityId(id);
              setLocalEligibilities((prev) => prev.filter((e) => e.id !== id));
            },
          });
          toast.success(t("modals.eligibilityCreatedSuccess"));
          return created;
        }

        return await updateEligibilityAsync({
          eligibilityId: id,
          serviceId,
          payload,
        });
      } finally {
        setSavingEligibilityId(null);
      }
    },
    [
      serviceId,
      createEligibilityAsync,
      updateEligibilityAsync,
      removeDatesByEligibilityId,
      t,
    ]
  );

  const handleDeleteEligibility = useCallback(
    (id: string) => {
      const eligibility = allEligibilities.find((item) => item.id === id);
      if (!eligibility) return;

      if (id.startsWith(LOCAL_ELIG_PREFIX)) {
        removeDatesByEligibilityId(id);
        setLocalEligibilities((prev) => prev.filter((e) => e.id !== id));
      } else {
        setEligibilityToDelete(eligibility);
      }
    },
    [allEligibilities, removeDatesByEligibilityId]
  );

  const handleConfirmDeleteEligibility = useCallback(() => {
    if (!eligibilityToDelete || !serviceId) return;

    deleteEligibility(
      {
        eligibilityId: eligibilityToDelete.id,
        serviceId,
      },
      {
        onSuccess: () => {
          setEligibilityToDelete(null);
        },
      }
    );
  }, [deleteEligibility, eligibilityToDelete, serviceId]);

  const handleCloseDeleteDialog = useCallback((open: boolean) => {
    if (!open) setEligibilityToDelete(null);
  }, []);

  const handleDuplicateEligibility = useCallback(
    (id: string) => {
      const source = allEligibilities.find((e) => e.id === id);
      if (!source || !serviceId) return;

      const sequence = allEligibilities.length + 1;
      const duplicate = duplicateEligibilityDraft(
        source,
        serviceId,
        serviceName,
        sequence,
        t("labels.eligibilityName", { sequence })
      );
      setLocalEligibilities((prev) => [...prev, duplicate]);
      toast.success(t("modals.eligibilityDuplicatedSuccess"));
    },
    [allEligibilities, serviceId, serviceName, t]
  );

  const handleSaveAll = useCallback(async () => {
    const entries = allEligibilities
      .map(
        (eligibility) =>
          [eligibility.id, itemHandlersRef.current.get(eligibility.id)] as const
      )
      .filter(
        (entry): entry is readonly [string, ServiceEligibilityItemHandlers] =>
          Boolean(entry[1]) &&
          (entry[0].startsWith(LOCAL_ELIG_PREFIX) || entry[1]!.isDirty())
      );

    if (entries.length === 0) return true;

    const validationResults = await Promise.all(
      entries.map(([, handlers]) => handlers.validate())
    );
    if (!validationResults.every(Boolean)) return false;

    setIsSavingAll(true);
    try {
      const results = await Promise.allSettled(
        entries.map(([, handlers]) => handlers.saveAsync())
      );
      const failedCount = results.filter(
        (result) => result.status === "rejected"
      ).length;

      if (failedCount === 0) {
        toast.success(t("modals.eligibilitiesSavedSuccess"));
        return true;
      }

      toast.error(t("modals.someEligibilitiesSaveFailed"));
      return false;
    } finally {
      setIsSavingAll(false);
    }
  }, [allEligibilities, t]);

  const handleSaveAllClick = useCallback(() => {
    void handleSaveAll();
  }, [handleSaveAll]);

  const handleSaveAndCreateNew = useCallback(() => {
    const run = async () => {
      const saved = await handleSaveAll();
      if (saved) handleAddEligibility();
    };
    void run();
  }, [handleAddEligibility, handleSaveAll]);

  const handleDiscardAll = useCallback(() => {
    for (const handlers of itemHandlersRef.current.values()) {
      handlers.cancel();
    }
    for (const localEligibility of localEligibilities) {
      removeDatesByEligibilityId(localEligibility.id);
    }
    setLocalEligibilities([]);
    setDirtyEligibilityIds(new Set());
  }, [localEligibilities, removeDatesByEligibilityId]);

  const disableSave = !hasUnsavedChanges || isSavingAll;
  const saveButtonLabel = t("buttons.save");

  const latestActionHandlersRef = useRef<ServiceEligibilityActionHandlers>({
    onCreateEligibility: handleAddEligibility,
    onSave: handleSaveAllClick,
    onSaveAndCreateNew: handleSaveAndCreateNew,
    onDiscard: handleDiscardAll,
  });

  latestActionHandlersRef.current = {
    onCreateEligibility: handleAddEligibility,
    onSave: handleSaveAllClick,
    onSaveAndCreateNew: handleSaveAndCreateNew,
    onDiscard: handleDiscardAll,
  };

  const publishCreateEligibility = useCallback(() => {
    latestActionHandlersRef.current.onCreateEligibility();
  }, []);

  const publishSave = useCallback(() => {
    latestActionHandlersRef.current.onSave();
  }, []);

  const publishSaveAndCreateNew = useCallback(() => {
    latestActionHandlersRef.current.onSaveAndCreateNew();
  }, []);

  const publishDiscard = useCallback(() => {
    latestActionHandlersRef.current.onDiscard();
  }, []);

  const sectionActions = useMemo<ServiceEligibilitySectionActions>(
    () => ({
      submitButtonLabel: saveButtonLabel,
      onCreateEligibility: publishCreateEligibility,
      onSave: publishSave,
      onSaveAndCreateNew: publishSaveAndCreateNew,
      onDiscard: publishDiscard,
      isPending: isSavingAll,
      disableSave,
      hasUnsavedChanges,
    }),
    [
      disableSave,
      hasUnsavedChanges,
      isSavingAll,
      publishCreateEligibility,
      publishDiscard,
      publishSave,
      publishSaveAndCreateNew,
      saveButtonLabel,
    ]
  );

  useEffect(() => {
    onActionsChange?.(sectionActions);
  }, [onActionsChange, sectionActions]);

  useEffect(() => {
    return () => onActionsChange?.(null);
  }, [onActionsChange]);

  return {
    allEligibilities,
    canCreateEligibility,
    deleteEligibilityError,
    eligibilityToDelete,
    error,
    handleAddEligibility,
    handleCloseDeleteDialog,
    handleConfirmDeleteEligibility,
    handleDeleteEligibility,
    handleDuplicateEligibility,
    handleEligibilityDirtyChange,
    handleRegisterHandlers,
    handleSaveEligibility,
    isDeletingEligibility,
    isLoading,
    isSavingAll,
    recentlyCreatedEligibilityIds,
    savingEligibilityId,
  };
}
