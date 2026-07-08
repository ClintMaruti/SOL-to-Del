import { getErrorMessage } from "@sol/api-client";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sol/ui";
import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";

import {
  type Promotion,
  usePromotions,
  useTogglePromotionStatus,
} from "@/entities/promotion";
import {
  formatDate,
  headOfficePromotionCreatePath,
  headOfficePromotionDetailPath,
} from "@/shared/lib";
import { useLoadingStates } from "@/shared/stores/loadingStates";
import {
  ConfirmDialog,
  SortableHeader,
  TableLoadingSkeleton,
} from "@/shared/ui";

import {
  type PromotionsListSortField,
  usePromotionsListSort,
} from "../model/usePromotionsListSort";

interface PromotionsListProps {
  headOfficeId: string;
}

function BookingWindowCell({ value }: { value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm font-medium leading-6 text-text-primary">
        {formatDate(value)}
      </span>
      <CalendarDays
        className="size-5 text-border-secondary"
        aria-hidden="true"
      />
    </div>
  );
}

export function PromotionsList({ headOfficeId }: PromotionsListProps) {
  const { t } = useTranslation("admin");
  const [promotionToDeactivate, setPromotionToDeactivate] =
    useState<Promotion | null>(null);
  const {
    data: promotions = [],
    isLoading,
    error,
    refetch,
  } = usePromotions(headOfficeId);
  const { mutate: togglePromotionStatus, isPending: isToggling } =
    useTogglePromotionStatus();
  const { promotionsStatus } = useLoadingStates(
    useShallow((state) => ({
      promotionsStatus: state.promotionsStatus,
    }))
  );
  const { sortState, toggleSort, sortedPromotions } =
    usePromotionsListSort(promotions);

  const canRenderList = !isLoading && !error && promotions.length > 0;
  const createPath = headOfficePromotionCreatePath(headOfficeId);

  const handleToggleChange = (promotion: Promotion, nextChecked: boolean) => {
    if (nextChecked) {
      togglePromotionStatus({
        headOfficeId,
        promotionId: promotion.id,
        activate: true,
      });
      return;
    }

    setPromotionToDeactivate(promotion);
  };

  return (
    <>
      <Card
        id="promotions"
        className="border-border-tertiary bg-white shadow-none"
      >
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold leading-6 text-neutral-900">
                {t("sections.promotions")}
              </CardTitle>
              <p className="mt-1 text-sm font-medium leading-6 text-neutral-600 max-w-[450px]">
                {t("sections.promotionsDescription")}
              </p>
            </div>

            <Button asChild variant="tertiary">
              <Link to={createPath}>{t("buttons.createPromotion")}</Link>
            </Button>
          </div>
        </CardHeader>

        {isLoading ? (
          <CardContent>
            <TableLoadingSkeleton columns={["42", "24", "22", "12"]} rows={4} />
          </CardContent>
        ) : null}

        {error ? (
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <p className="text-sm text-destructive">
                {getErrorMessage(error, t("errors.failedToLoadPromotions"))}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => refetch()}
              >
                {t("buttons.retry")}
              </Button>
            </div>
          </CardContent>
        ) : null}

        {canRenderList ? (
          <CardContent>
            <div className="overflow-hidden rounded-md border border-border-tertiary">
              <Table>
                <TableHeader>
                  <TableRow className="bg-background-primary">
                    <TableHead className="w-[42%] border-r border-border-tertiary pl-4 pr-2">
                      <SortableHeader<PromotionsListSortField>
                        label={t("tableHeaders.promotionName")}
                        field="name"
                        currentField={sortState.field}
                        currentDirection={sortState.direction}
                        onSort={toggleSort}
                      />
                    </TableHead>
                    <TableHead className="w-[24%] border-r border-border-tertiary">
                      <SortableHeader<PromotionsListSortField>
                        label={t("tableHeaders.bookingWindowFrom")}
                        field="bookingWindowFrom"
                        currentField={sortState.field}
                        currentDirection={sortState.direction}
                        onSort={toggleSort}
                      />
                    </TableHead>
                    <TableHead className="w-[22%] border-r border-border-tertiary">
                      <SortableHeader<PromotionsListSortField>
                        label={t("tableHeaders.bookingWindowTo")}
                        field="bookingWindowTo"
                        currentField={sortState.field}
                        currentDirection={sortState.direction}
                        onSort={toggleSort}
                      />
                    </TableHead>
                    <TableHead className="w-[12%] pr-2 text-right">
                      <SortableHeader<PromotionsListSortField>
                        label={t("tableHeaders.status")}
                        field="isActive"
                        currentField={sortState.field}
                        currentDirection={sortState.direction}
                        onSort={toggleSort}
                        className="w-full justify-end"
                      />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPromotions.map((promotion) => (
                    <TableRow key={promotion.id} className="bg-white">
                      <TableCell className="border-r border-border-tertiary pl-4 pr-2 py-2">
                        <Link
                          to={headOfficePromotionDetailPath(
                            headOfficeId,
                            promotion.id
                          )}
                          className="text-sm font-medium leading-6 text-link hover:underline"
                        >
                          {promotion.name}
                        </Link>
                      </TableCell>
                      <TableCell className="border-r border-border-tertiary p-2">
                        <BookingWindowCell
                          value={promotion.bookingWindowFrom}
                        />
                      </TableCell>
                      <TableCell className="border-r border-border-tertiary p-2">
                        <BookingWindowCell value={promotion.bookingWindowTo} />
                      </TableCell>
                      <TableCell className="p-2">
                        <div className="flex items-center justify-end">
                          <Switch
                            checked={promotion.isActive}
                            onCheckedChange={(checked) =>
                              handleToggleChange(promotion, checked)
                            }
                            aria-label={t("aria.togglePromotionStatus", {
                              name: promotion.name,
                            })}
                            loading={promotionsStatus[promotion.id]}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        ) : null}
      </Card>
      <ConfirmDialog
        open={promotionToDeactivate !== null}
        onOpenChange={(open) => !open && setPromotionToDeactivate(null)}
        title={t("modals.confirmDeactivatePromotion")}
        description={t("modals.confirmDeactivatePromotionDescription", {
          name: promotionToDeactivate?.name ?? "",
        })}
        confirmLabel={t("buttons.deactivate")}
        isPending={isToggling}
        onConfirm={() => {
          if (!promotionToDeactivate) return;

          togglePromotionStatus(
            {
              headOfficeId,
              promotionId: promotionToDeactivate.id,
              activate: false,
            },
            {
              onSuccess: () => setPromotionToDeactivate(null),
            }
          );
        }}
      />
    </>
  );
}
