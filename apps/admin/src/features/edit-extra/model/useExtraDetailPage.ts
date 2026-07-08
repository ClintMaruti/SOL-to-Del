import { getErrorMessage } from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";
import { useStore } from "@tanstack/react-form";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  useCatalogExtra,
  useContractedExtraForExtra,
  useToggleExtraStatus,
  useUpdateCatalogExtra,
} from "@/entities/catalog-extra";

import { contractValidityFromCatalog } from "../lib/contract-validity-from-catalog";
import { travelDatesHaveZeroPrice } from "../lib/travel-dates-has-zero-price";
import { buildCatalogExtraPutBody } from "./build-catalog-extra-put-body";
import { useContracts } from "@/entities/supplier-service-options";
import { useActiveSection, useUnsavedChangesBlocker } from "@/shared/hooks";
import { generateRoutePath, scrollToSection } from "@/shared/lib";
import { getFieldNamesFromZodError } from "@/shared/lib/form";
import {
  supplierDetailPath,
  supplierServiceDetailPath,
} from "@/shared/lib/paths";

import { EXTRA_DETAIL_SECTION_IDS } from "./constants";
import {
  catalogContractedExtraDetailToFormContracted,
  emptyEditExtraFormValues,
  extraDetailToFormValues,
  extraDetailToFormValuesAfterPut,
  type EditExtraFormValues,
  type EditExtraSubmitValues,
} from "./schema";
import {
  parseEditExtraSubmitValues,
  useEditExtraForm,
} from "./useEditExtraForm";
import type { AnyFormApi } from "@/shared/ui/form";

function getFirstSectionWithError(fieldKeys: string[]): string | null {
  const general = ["title", "serviceIds", "description"];
  if (fieldKeys.some((f) => general.includes(f))) {
    return "extra-general-information";
  }
  if (
    fieldKeys.some(
      (f) =>
        f.includes("contracted") ||
        f.includes("contract") ||
        f.includes("travel") ||
        f.includes("valid")
    )
  ) {
    return "extra-contracted-extra";
  }
  if (fieldKeys.some((f) => f.includes("notes"))) {
    return "extra-notes";
  }
  return null;
}

export interface UseExtraDetailPageParams {
  supplierId: string | undefined;
  extraId: string | undefined;
}

export function useExtraDetailPage({
  supplierId,
  extraId,
}: UseExtraDetailPageParams) {
  const [searchParams] = useSearchParams();
  const isServiceContext = searchParams.get("context") === "service";

  const [schemaError, setSchemaError] = useState<string | undefined>();
  const [zeroPriceConfirmOpen, setZeroPriceConfirmOpen] = useState(false);
  const pendingSaveValuesRef = useRef<EditExtraSubmitValues | null>(null);

  const { activeSectionId, onSectionClick } = useActiveSection(
    EXTRA_DETAIL_SECTION_IDS
  );

  const { data: extra, isLoading, error } = useCatalogExtra(extraId ?? null);

  /**
   * Must stay in lockstep with every `form.reset(...)`.
   * TanStack Form calls `formApi.update({ defaultValues })` each layout pass; if this
   * object differs from the form's internal defaults while untouched, values reset —
   * that was wiping contracted-extra hydration after merge.
   */
  const [formDefaultSnapshot, setFormDefaultSnapshot] =
    useState<EditExtraFormValues>(() => emptyEditExtraFormValues());

  const { data: contracts = [] } = useContracts(supplierId ?? null);

  const { mutate: updateExtra, isPending } = useUpdateCatalogExtra();
  const { mutate: toggleStatus } = useToggleExtraStatus();

  const exitPath = useMemo(() => {
    if (!supplierId) {
      return generateRoutePath("database", "destinations", "suppliers");
    }
    if (isServiceContext && extra?.serviceId) {
      return `${supplierServiceDetailPath(supplierId, extra.serviceId)}?tab=extras`;
    }
    return `${supplierDetailPath(supplierId)}?tab=extras`;
  }, [supplierId, isServiceContext, extra?.serviceId]);

  const saveExtra = (values: EditExtraSubmitValues) => {
    if (!extraId || !supplierId || !extra) return;
    const body = buildCatalogExtraPutBody({ extra, values });
    updateExtra(
      {
        extraId,
        supplierId,
        body,
      },
      {
        onSuccess: (data) => {
          toast.success(i18n.t("extraDetail.toast.saved", { ns: "admin" }));
          const nextForm = extraDetailToFormValuesAfterPut(data);
          form.reset(nextForm);
          setFormDefaultSnapshot(nextForm);
        },
        onError: (err) => {
          toast.error(
            getErrorMessage(
              err,
              i18n.t("extraDetail.errors.saveFailed", { ns: "admin" })
            )
          );
        },
      }
    );
  };

  const { form } = useEditExtraForm(
    formDefaultSnapshot,
    saveExtra,
    setSchemaError,
    (zodError) => {
      const names = getFieldNamesFromZodError(zodError);
      const first = getFirstSectionWithError(names);
      if (first) scrollToSection(first);
    }
  );

  const selectedContractId = useStore(
    form.store,
    (s) => s.values.contracted.contractId
  );

  const contractedExtraForSelectionQuery = useContractedExtraForExtra(
    extraId,
    selectedContractId?.trim() ? selectedContractId : null
  );

  const lastContractedFetchHydrationKeyRef = useRef<string>("");
  const prevSyncedExtraIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!extra) {
      prevSyncedExtraIdRef.current = undefined;
      return;
    }
    const idChanged = prevSyncedExtraIdRef.current !== extra.id;
    prevSyncedExtraIdRef.current = extra.id;
    lastContractedFetchHydrationKeyRef.current = "";

    if (idChanged) {
      const next = extraDetailToFormValues(extra);
      form.reset(next);
      setFormDefaultSnapshot(next);
      return;
    }

    const current = form.store.state.values;
    const base = extraDetailToFormValues(extra);
    const next: EditExtraFormValues = {
      ...base,
      contracted: current.contracted,
    };
    form.reset(next);
    setFormDefaultSnapshot(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extra?.id, extra?.version]);

  useEffect(() => {
    if (!extraId?.trim() || !selectedContractId?.trim()) {
      lastContractedFetchHydrationKeyRef.current = "";
      return;
    }
    const q = contractedExtraForSelectionQuery;
    if (q.isPending || q.isFetching) {
      return;
    }
    if (!q.isSuccess) {
      return;
    }

    const fetchKey = `${extraId}:${selectedContractId}:${q.dataUpdatedAt}`;
    if (lastContractedFetchHydrationKeyRef.current === fetchKey) {
      return;
    }

    const current = form.store.state.values;
    if (current.contracted.contractId.trim() !== selectedContractId.trim()) {
      return;
    }

    if (q.data) {
      const mapped = catalogContractedExtraDetailToFormContracted(q.data);
      if (mapped.contractId !== selectedContractId) {
        return;
      }
      const catalogValidity = contractValidityFromCatalog(
        contracts,
        selectedContractId
      );
      const contracted: EditExtraFormValues["contracted"] = {
        ...mapped,
        validFrom: mapped.validFrom.trim() || catalogValidity.validFrom,
        validTo: mapped.validTo.trim() || catalogValidity.validTo,
      };
      const next: EditExtraFormValues = { ...current, contracted };
      form.reset(next);
      setFormDefaultSnapshot(next);
      lastContractedFetchHydrationKeyRef.current = fetchKey;
      return;
    }

    const defaults = emptyEditExtraFormValues().contracted;
    const catalogValidity = contractValidityFromCatalog(
      contracts,
      selectedContractId
    );
    const next: EditExtraFormValues = {
      ...current,
      contracted: {
        ...defaults,
        contractId: selectedContractId,
        validFrom: catalogValidity.validFrom,
        validTo: catalogValidity.validTo,
      },
    };
    form.reset(next);
    setFormDefaultSnapshot(next);
    lastContractedFetchHydrationKeyRef.current = fetchKey;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- form.reset is stable on the form instance
  }, [
    extraId,
    selectedContractId,
    contractedExtraForSelectionQuery.isPending,
    contractedExtraForSelectionQuery.isFetching,
    contractedExtraForSelectionQuery.isSuccess,
    contractedExtraForSelectionQuery.data,
    contractedExtraForSelectionQuery.dataUpdatedAt,
    contracts,
  ]);

  const formIsDirty = useStore(form.store, (s) => s.isDirty);

  const {
    showUnsavedDialog,
    handleCancel,
    handleUnsavedDiscard,
    handleUnsavedStay,
  } = useUnsavedChangesBlocker({
    isDirty: formIsDirty,
    exitPath,
    onPrepareDiscard: () => {
      if (!extra) return;
      const nextForm = extraDetailToFormValues(extra);
      form.reset(nextForm);
      setFormDefaultSnapshot(nextForm);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSchemaError(undefined);

    await form.validateAllFields("submit");

    if (!extraId || !supplierId) {
      return;
    }

    const parsed = parseEditExtraSubmitValues(
      form as unknown as AnyFormApi,
      form.state.values
    );
    if (!parsed) {
      const fieldMeta = form.state.fieldMeta as Record<
        string,
        { errors?: string[] } | undefined
      >;
      const errorFieldNames = Object.keys(fieldMeta).filter(
        (key) => (fieldMeta[key]?.errors?.length ?? 0) > 0
      );
      const first = getFirstSectionWithError(errorFieldNames);
      if (first) scrollToSection(first);
      return;
    }

    if (travelDatesHaveZeroPrice(parsed.contracted)) {
      pendingSaveValuesRef.current = parsed;
      setZeroPriceConfirmOpen(true);
      return;
    }

    saveExtra(parsed);
  };

  const handleZeroPriceConfirm = () => {
    const values = pendingSaveValuesRef.current;
    pendingSaveValuesRef.current = null;
    setZeroPriceConfirmOpen(false);
    if (values) {
      saveExtra(values);
    }
  };

  const handleZeroPriceConfirmOpenChange = (open: boolean) => {
    setZeroPriceConfirmOpen(open);
    if (!open) {
      pendingSaveValuesRef.current = null;
    }
  };

  const handleToggleActive = (checked: boolean) => {
    if (!extraId || !extra) return;
    toggleStatus({
      extraId,
      supplierId,
      serviceId: extra.serviceId,
      activate: checked,
    });
  };

  return {
    extra,
    isLoading,
    error,
    form,
    isPending,
    schemaError,
    activeSectionId,
    onSectionClick,
    showUnsavedDialog,
    handleCancel,
    handleUnsavedDiscard,
    handleUnsavedStay,
    handleSubmit,
    handleToggleActive,
    isServiceContext,
    exitPath,
    contracts,
    zeroPriceConfirmOpen,
    onZeroPriceConfirmOpenChange: handleZeroPriceConfirmOpenChange,
    onZeroPriceConfirm: handleZeroPriceConfirm,
  };
}
