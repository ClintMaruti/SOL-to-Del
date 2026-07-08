import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Build rootMargin in pixels. Using percentages can be unreliable in Safari
 * (IntersectionObserver rootMargin percentage handling differs from Chrome).
 * Shrinks root to active zone: 20%–60% of viewport (40% band).
 */
function getRootMarginPx(): string {
  if (typeof window === "undefined") return "-20% 0px -40% 0px";
  const topPx = Math.round(window.innerHeight * 0.2);
  const bottomPx = Math.round(window.innerHeight * 0.4);
  return `-${topPx}px 0px -${bottomPx}px 0px`;
}

const MAX_RETRIES = 30;
const RETRY_DELAY_MS = 100;
/** When user scrolls within this distance of the top, highlight the first section. */
const TOP_THRESHOLD_PX = 10;
/** When user scrolls within this distance of the bottom, highlight the last section. */
const BOTTOM_THRESHOLD_PX = 10;
/** Debounce scroll handler to reduce active-section thrashing at zone boundaries. */
const SCROLL_DEBOUNCE_MS = 40;

/** Active zone = 20%–60% of viewport (40% band). Sections in this zone get highlighted. */
function getActiveZoneBounds() {
  if (typeof window === "undefined") return { top: 0, bottom: 0 };
  const h = window.innerHeight;
  return { top: h * 0.2, bottom: h * 0.6 };
}

/**
 * Returns which section id is in the active zone (middle of viewport),
 * first section if scrolled to top, or last section if scrolled to bottom.
 * Used on scroll so we don't rely on observer entries (which only include changed elements).
 */
function getActiveSectionFromViewport(
  ids: readonly string[],
  firstSectionId: string | null,
  lastSectionId: string | null
): string | null {
  if (typeof window === "undefined" || ids.length === 0) return null;
  const { scrollTop, clientHeight, scrollHeight } = document.documentElement;
  const hasScrollableContent =
    scrollHeight > clientHeight + BOTTOM_THRESHOLD_PX;
  // When scrolled to top, highlight first section
  if (firstSectionId && hasScrollableContent && scrollTop <= TOP_THRESHOLD_PX) {
    return firstSectionId;
  }
  // When scrolled to bottom, highlight last section
  if (
    lastSectionId &&
    hasScrollableContent &&
    scrollTop + clientHeight >= scrollHeight - BOTTOM_THRESHOLD_PX
  ) {
    return lastSectionId;
  }
  const { top: zoneTop, bottom: zoneBottom } = getActiveZoneBounds();
  const activeEl = document.activeElement;
  let focusSectionId: string | null = null;
  if (activeEl && activeEl instanceof HTMLElement) {
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el?.contains(activeEl)) {
        focusSectionId = id;
        break;
      }
    }
  }
  const viewportCenter = window.innerHeight / 2;
  let closestId: string | null = null;
  let closestDistance = Infinity;
  let focusSectionIsIntersecting = false;

  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    const sectionCenter = rect.top + rect.height / 2;
    // Only consider sections whose center is within the active zone (not just intersection)
    if (sectionCenter >= zoneTop && sectionCenter <= zoneBottom) {
      if (id === focusSectionId) {
        focusSectionIsIntersecting = true;
      }
      const distance = Math.abs(sectionCenter - viewportCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestId = id;
      }
    }
  }

  if (closestId === null) return null;
  if (focusSectionId && focusSectionIsIntersecting) {
    return focusSectionId;
  }
  return closestId;
}

/**
 * Returns the section id that contains the given element, or null.
 */
function getSectionIdContainingElement(
  element: Element | null,
  sectionIds: readonly string[]
): string | null {
  if (!element || !(element instanceof HTMLElement)) return null;
  for (const id of sectionIds) {
    const sectionEl = document.getElementById(id);
    if (sectionEl?.contains(element)) return id;
  }
  return null;
}

export interface UseActiveSectionReturn {
  activeSectionId: string | null;
  onSectionClick: (sectionId: string) => void;
}

/**
 * Tracks which section (by id) is currently in view using IntersectionObserver.
 * When the user focuses a form field, the section containing that field is
 * highlighted so the spy scroll stays in sync (e.g. "Other" when editing Notes).
 * Uses pixel-based rootMargin for reliable behavior in Safari (percentage rootMargin is buggy).
 * Retries when section elements are not yet in the DOM (e.g. edit pages that mount the form after loading).
 *
 * Also handles click-to-highlight: when a user clicks a section link in the
 * anchor menu, that section is highlighted immediately even if it can't reach
 * the IntersectionObserver active zone. The override is cleared once the
 * observer catches up to the clicked section.
 */
export function useActiveSection(
  sectionIds: readonly string[]
): UseActiveSectionReturn {
  const [observerActiveId, setObserverActiveId] = useState<string | null>(null);
  const [clickedSectionId, setClickedSectionId] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const sectionIdsRef = useRef(sectionIds);
  const observerActiveIdRef = useRef<string | null>(null);

  useEffect(() => {
    sectionIdsRef.current = sectionIds;
  }, [sectionIds]);

  useEffect(() => {
    observerActiveIdRef.current = observerActiveId;
  }, [observerActiveId]);

  // Clear click override only when observer has caught up to the clicked section.
  // Otherwise when two sections are in view (e.g. small General + Contacts), the observer
  // can report the wrong one and we must keep highlighting the section the user clicked.
  useEffect(() => {
    if (observerActiveId != null && observerActiveId === clickedSectionId) {
      const id = requestAnimationFrame(() => setClickedSectionId(null));
      return () => cancelAnimationFrame(id);
    }
  }, [observerActiveId, clickedSectionId]);

  useEffect(() => {
    const ids = [...sectionIdsRef.current];
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el != null);

    if (elements.length === 0) {
      if (retry < MAX_RETRIES) {
        const timeoutId = setTimeout(
          () => setRetry((r) => r + 1),
          RETRY_DELAY_MS
        );
        return () => clearTimeout(timeoutId);
      }
      return;
    }

    function isScrolledToBottom(): boolean {
      if (typeof window === "undefined") return false;
      const { scrollTop, clientHeight, scrollHeight } =
        document.documentElement;
      const hasScrollableContent =
        scrollHeight > clientHeight + BOTTOM_THRESHOLD_PX;
      return (
        hasScrollableContent &&
        scrollTop + clientHeight >= scrollHeight - BOTTOM_THRESHOLD_PX
      );
    }

    const firstSectionId = ids.length > 0 ? ids[0] : null;
    const lastSectionId = ids.length > 0 ? ids[ids.length - 1] : null;

    const { top: zoneTop, bottom: zoneBottom } = getActiveZoneBounds();

    const observer = new IntersectionObserver(
      (entries) => {
        if (lastSectionId && isScrolledToBottom()) {
          setObserverActiveId(lastSectionId);
          return;
        }

        const activeEl = document.activeElement;
        const focusSectionId = getSectionIdContainingElement(activeEl, ids);

        const intersecting = entries
          .filter((e) => {
            if (!e.isIntersecting) return false;
            const rect = e.boundingClientRect;
            const sectionCenter = rect.top + rect.height / 2;
            return sectionCenter >= zoneTop && sectionCenter <= zoneBottom;
          })
          .sort((a, b) => {
            const topA = a.boundingClientRect.top;
            const topB = b.boundingClientRect.top;
            return topA - topB;
          });

        if (intersecting.length > 0) {
          const focusSectionIsIntersecting =
            focusSectionId &&
            intersecting.some(
              (e) => (e.target as HTMLElement).id === focusSectionId
            );
          const idToSet = focusSectionIsIntersecting
            ? focusSectionId
            : (intersecting[0].target as HTMLElement).id;
          if (!ids.includes(idToSet)) return;
          if (idToSet === observerActiveIdRef.current) return;
          observerActiveIdRef.current = idToSet;
          setObserverActiveId(idToSet);
        }
      },
      {
        root: null,
        rootMargin: getRootMarginPx(),
        threshold: 0,
      }
    );

    const handleFocusIn = () => {
      const focusSectionId = getSectionIdContainingElement(
        document.activeElement,
        ids
      );
      if (focusSectionId) setObserverActiveId(focusSectionId);
    };

    let scrollTimeoutId: ReturnType<typeof setTimeout> | null = null;
    const handleScroll = () => {
      if (scrollTimeoutId != null) clearTimeout(scrollTimeoutId);
      scrollTimeoutId = setTimeout(() => {
        scrollTimeoutId = null;
        const next =
          getActiveSectionFromViewport(ids, firstSectionId, lastSectionId) ??
          observerActiveIdRef.current;
        if (next === observerActiveIdRef.current) return;
        observerActiveIdRef.current = next;
        setObserverActiveId(next);
      }, SCROLL_DEBOUNCE_MS);
    };

    elements.forEach((el) => observer.observe(el));
    document.addEventListener("focusin", handleFocusIn);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (scrollTimeoutId != null) clearTimeout(scrollTimeoutId);
      observer.disconnect();
      document.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [sectionIds, retry]);

  const onSectionClick = useCallback((sectionId: string) => {
    setClickedSectionId(sectionId);
  }, []);

  const activeSectionId = clickedSectionId ?? observerActiveId;

  return { activeSectionId, onSectionClick };
}
