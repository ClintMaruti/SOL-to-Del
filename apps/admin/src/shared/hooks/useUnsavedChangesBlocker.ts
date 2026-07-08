import { useEffect, useRef, useState } from "react";
import type { Location } from "react-router-dom";
import { useBlocker, useNavigate } from "react-router-dom";

export interface UseUnsavedChangesBlockerOptions {
  /** When true, navigation is blocked and the unsaved dialog can be shown. */
  isDirty: boolean;
  /** Path to navigate to when leaving (e.g. list page). */
  exitPath: string;
  /** Called when user confirms "Leave without saving". Should reset form and clear local state; the hook handles deferred navigation. */
  onPrepareDiscard: () => void;
  /** When provided, navigation to locations where this returns true will not be blocked (e.g. create agency page when coming from create agency group). */
  allowNavigationTo?: (location: Location) => boolean;
}

export interface UseUnsavedChangesBlockerResult {
  /** True when the unsaved changes dialog should be visible. */
  showUnsavedDialog: boolean;
  /** Call when user clicks Cancel on the form. */
  handleCancel: () => void;
  /** Call when user clicks "Leave without saving" in the dialog. */
  handleUnsavedDiscard: () => void;
  /** Call when user clicks "Cancel" / "Stay" in the dialog. */
  handleUnsavedStay: () => void;
  /** Schedule navigation to run once isDirty becomes false (e.g. after save). Use to avoid blocker re-opening the dialog. */
  scheduleNavigateAfterSave: (path: string) => void;
}

/**
 * Shared logic for blocking navigation when the form is dirty and showing
 * an unsaved-changes dialog. Handles deferred navigation so the blocker
 * doesn't re-open the dialog after discard/save.
 */
export function useUnsavedChangesBlocker({
  isDirty,
  exitPath,
  onPrepareDiscard,
  allowNavigationTo,
}: UseUnsavedChangesBlockerOptions): UseUnsavedChangesBlockerResult {
  const navigate = useNavigate();
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const [navigateAfterSaveTrigger, setNavigateAfterSaveTrigger] = useState(0);
  const unsavedDiscardRef = useRef<(() => void) | null>(null);
  const pendingNavigateAfterDiscardRef = useRef(false);
  const pendingNavigateAfterSaveRef = useRef<string | null>(null);

  const shouldBlock = ({ nextLocation }: { nextLocation: Location }) =>
    isDirty &&
    !pendingNavigateAfterSaveRef.current &&
    !(allowNavigationTo?.(nextLocation) ?? false);

  const blocker = useBlocker(
    allowNavigationTo
      ? shouldBlock
      : () => isDirty && !pendingNavigateAfterSaveRef.current
  );
  const showUnsavedDialog = unsavedDialogOpen || blocker.state === "blocked";

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  /**
   * When the form is not dirty, perform any pending navigation (after discard or after save).
   * We include `navigateAfterSaveTrigger` in deps as a hack: scheduleNavigateAfterSave only
   * triggers navigation when isDirty becomes false, but if the form was never dirty (e.g.
   * restored from draft and submitted without edits), isDirty stays false and this effect
   * would never re-run. Bumping the trigger in scheduleNavigateAfterSave forces a re-run.
   */
  useEffect(() => {
    if (!isDirty) {
      if (pendingNavigateAfterDiscardRef.current) {
        pendingNavigateAfterDiscardRef.current = false;
        navigate(exitPath);
      } else if (pendingNavigateAfterSaveRef.current) {
        const targetPath = pendingNavigateAfterSaveRef.current;
        pendingNavigateAfterSaveRef.current = null;
        navigate(targetPath);
      }
    }
  }, [isDirty, exitPath, navigate, navigateAfterSaveTrigger]);

  const handleCancel = () => {
    if (isDirty) {
      unsavedDiscardRef.current = () => {
        onPrepareDiscard();
        setUnsavedDialogOpen(false);
        pendingNavigateAfterDiscardRef.current = true;
      };
      setUnsavedDialogOpen(true);
    } else {
      navigate(exitPath);
    }
  };

  const handleUnsavedDiscard = () => {
    setUnsavedDialogOpen(false);
    if (blocker.state === "blocked") {
      onPrepareDiscard();
      blocker.proceed();
    } else {
      unsavedDiscardRef.current?.();
    }
    unsavedDiscardRef.current = null;
  };

  const handleUnsavedStay = () => {
    setUnsavedDialogOpen(false);
    if (blocker.state === "blocked") {
      blocker.reset();
    }
    unsavedDiscardRef.current = null;
  };

  const scheduleNavigateAfterSave = (path: string) => {
    pendingNavigateAfterSaveRef.current = path;
    setNavigateAfterSaveTrigger((t) => t + 1);
  };

  return {
    showUnsavedDialog,
    handleCancel,
    handleUnsavedDiscard,
    handleUnsavedStay,
    scheduleNavigateAfterSave,
  };
}
