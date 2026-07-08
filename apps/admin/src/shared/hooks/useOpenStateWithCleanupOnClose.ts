import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Boolean state (e.g. modal/dialog open) with a cleanup that runs when the
 * value is set to false. Use for "open + related state" patterns so that
 * closing always clears the related state (e.g. item to edit, item to delete).
 *
 * @param initialOpen - Initial value for the open state (default false)
 * @param onClose - Called when the setter is invoked with false, before updating state
 * @returns [open, setOpen] - Same shape as useState(boolean)
 */
export function useOpenStateWithCleanupOnClose(
  initialOpen = false,
  onClose: () => void = () => {}
): [boolean, (open: boolean) => void] {
  const [open, setOpenState] = useState(initialOpen);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const setOpen = useCallback((value: boolean) => {
    if (!value) {
      onCloseRef.current();
    }
    setOpenState(value);
  }, []);

  return [open, setOpen];
}
