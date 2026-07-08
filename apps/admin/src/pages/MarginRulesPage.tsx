import { Button } from "@sol/ui";
import { Plus } from "lucide-react";
import type { MouseEvent } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { MarginRule, MarginRuleModalMode } from "@/entities/margin-rule";
import { DeleteMarginRuleDialog } from "@/features/delete-margin-rule";
import { MarginRuleModal } from "@/features/manage-margin-rule";
import { MarginRulesList } from "@/widgets/margin-rules-list";

function preventAction(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
}

export function MarginRulesPage() {
  const { t } = useTranslation(["admin", "common"]);
  const pageHeight =
    "calc(100vh - 64px - var(--layout-reserved-footer-height, 0px))";
  const [modalMode, setModalMode] = useState<MarginRuleModalMode>("create");
  const [selectedRule, setSelectedRule] = useState<MarginRule | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<MarginRule | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleCreateAction = (event: MouseEvent<HTMLButtonElement>) => {
    preventAction(event);
    setModalMode("create");
    setSelectedRule(null);
    setIsModalOpen(true);
  };

  const openRuleModal = (
    mode: Exclude<MarginRuleModalMode, "create">,
    rule: MarginRule
  ) => {
    setModalMode(mode);
    setSelectedRule(rule);
    setIsModalOpen(true);
  };

  const handleSaveAndCreateSuccess = () => {
    setModalMode("create");
    setSelectedRule(null);
    setIsModalOpen(true);
  };

  return (
    <>
      <div
        className="box-border flex h-full min-h-0 flex-1 flex-col overflow-hidden px-4 pb-8 pt-4"
        style={{ height: pageHeight, maxHeight: pageHeight }}
      >
        <div className="mb-4 flex shrink-0 items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold leading-10 text-text-primary">
              {t("pageTitles.marginRules")}
            </h1>
            <p className="max-w-2xl text-sm font-medium leading-6 text-text-secondary">
              {t("pageTitles.marginRulesDescription")}
            </p>
          </div>

          <Button variant="primary" onClick={handleCreateAction}>
            <Plus className="size-4" />
            {t("common:buttons.create")}
          </Button>
        </div>

        <MarginRulesList
          onCreateAction={handleCreateAction}
          onDuplicateRule={(rule) => openRuleModal("duplicate", rule)}
          onEditRule={(rule) => openRuleModal("edit", rule)}
          onDeleteRule={(rule) => {
            setRuleToDelete(rule);
            setIsDeleteDialogOpen(true);
          }}
        />
      </div>

      <MarginRuleModal
        open={isModalOpen}
        mode={modalMode}
        rule={selectedRule}
        onOpenChange={setIsModalOpen}
        onSaveAndCreateSuccess={handleSaveAndCreateSuccess}
      />

      <DeleteMarginRuleDialog
        rule={ruleToDelete}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />
    </>
  );
}
