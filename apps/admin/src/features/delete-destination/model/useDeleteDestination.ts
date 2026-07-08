import { useCallback } from "react";

import { useDeleteDestination as useDeleteDestinationApi } from "../api/useDeleteDestination";

import type { Destination } from "@/entities/destination/model/types";

export interface UseDeleteDestinationOptions {
  destination: Destination | null;
  onSuccess?: () => void;
}

export function useDeleteDestinationForm({
  destination,
  onSuccess,
}: UseDeleteDestinationOptions) {
  const {
    mutate: deleteDestination,
    isPending,
    error,
    reset: resetMutation,
  } = useDeleteDestinationApi();

  const handleDelete = useCallback(() => {
    if (!destination) return;

    deleteDestination(destination.id, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  }, [destination, deleteDestination, onSuccess]);

  const canDelete = destination !== null && !isPending;

  return {
    handleDelete,
    isPending,
    error,
    canDelete,
    resetError: resetMutation,
  };
}
