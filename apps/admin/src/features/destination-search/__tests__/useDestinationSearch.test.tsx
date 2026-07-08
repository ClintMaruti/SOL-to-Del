import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Destination } from "@/entities/destination/model/types";

import { useDestinationSearch } from "../model/useDestinationSearch";

const DEBOUNCE_MS = 300;

// Helper to create test destinations
const createDestination = (
  id: string,
  name: string,
  options?: {
    code?: string;
    coordinates?: { lat: number; lng: number };
    children?: Destination[];
    type?: Destination["type"];
  }
): Destination => ({
  id,
  name,
  type: options?.type || "Country",
  code: options?.code,
  coordinates: options?.coordinates,
  children: options?.children,
});

const advanceDebounce = () => {
  act(() => {
    vi.advanceTimersByTime(DEBOUNCE_MS);
  });
};

describe("useDestinationSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("State Management", () => {
    it("should initialize with empty search query", () => {
      const destinations: Destination[] = [createDestination("kenya", "Kenya")];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      expect(result.current.searchQuery).toBe("");
    });

    it("should update search query when setSearchQuery is called", () => {
      const destinations: Destination[] = [createDestination("kenya", "Kenya")];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("kenya");
      });

      expect(result.current.searchQuery).toBe("kenya");
    });

    it("should update search query multiple times", () => {
      const destinations: Destination[] = [createDestination("kenya", "Kenya")];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("ken");
      });
      expect(result.current.searchQuery).toBe("ken");

      act(() => {
        result.current.setSearchQuery("kenya");
      });
      expect(result.current.searchQuery).toBe("kenya");

      act(() => {
        result.current.setSearchQuery("");
      });
      expect(result.current.searchQuery).toBe("");
    });
  });

  describe("Empty Query Handling", () => {
    it("should return all destinations when query is empty string", () => {
      const destinations: Destination[] = [
        createDestination("kenya", "Kenya"),
        createDestination("uganda", "Uganda"),
      ];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      expect(result.current.filteredDestinations).toEqual(destinations);
      expect(result.current.hasResults).toBe(true);
    });

    it("should return all destinations when query is only whitespace", () => {
      const destinations: Destination[] = [createDestination("kenya", "Kenya")];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("   ");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toEqual(destinations);
      expect(result.current.hasResults).toBe(true);
    });

    it("should return empty array when destinations array is empty", () => {
      const destinations: Destination[] = [];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      expect(result.current.filteredDestinations).toEqual([]);
      expect(result.current.hasResults).toBe(false);
    });

    it("should return empty array and hasResults false when no destinations", () => {
      const destinations: Destination[] = [];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("test");
      });

      expect(result.current.filteredDestinations).toEqual([]);
      expect(result.current.hasResults).toBe(false);
    });
  });

  describe("Name Matching", () => {
    it("should match destination by exact name (case-insensitive)", () => {
      const destinations: Destination[] = [
        createDestination("kenya", "Kenya"),
        createDestination("uganda", "Uganda"),
      ];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("kenya");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toHaveLength(1);
      expect(result.current.filteredDestinations[0].id).toBe("kenya");
      expect(result.current.hasResults).toBe(true);
    });

    it("should match destination by partial name", () => {
      const destinations: Destination[] = [
        createDestination("kenya", "Kenya"),
        createDestination("uganda", "Uganda"),
      ];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("ken");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toHaveLength(1);
      expect(result.current.filteredDestinations[0].id).toBe("kenya");
    });

    it("should match multiple destinations by name", () => {
      const destinations: Destination[] = [
        createDestination("kenya", "Kenya"),
        createDestination("kenya-region", "Kenya Region"),
        createDestination("uganda", "Uganda"),
      ];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("kenya");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toHaveLength(2);
      expect(result.current.filteredDestinations[0].id).toBe("kenya");
      expect(result.current.filteredDestinations[1].id).toBe("kenya-region");
    });

    it("should match nested children by name", () => {
      const destinations: Destination[] = [
        createDestination("kenya", "Kenya", {
          children: [
            createDestination("southern-kenya", "Southern Kenya"),
            createDestination("northern-kenya", "Northern Kenya"),
          ],
        }),
      ];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("southern");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toHaveLength(1);
      expect(result.current.filteredDestinations[0].id).toBe("kenya");
      expect(result.current.filteredDestinations[0].children).toHaveLength(1);
      expect(result.current.filteredDestinations[0].children![0].id).toBe(
        "southern-kenya"
      );
    });

    it("should return empty array when no name matches", () => {
      const destinations: Destination[] = [
        createDestination("kenya", "Kenya"),
        createDestination("uganda", "Uganda"),
      ];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("tanzania");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toEqual([]);
      expect(result.current.hasResults).toBe(false);
    });

    it("should handle case-insensitive matching", () => {
      const destinations: Destination[] = [createDestination("kenya", "Kenya")];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("KENYA");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toHaveLength(1);
      expect(result.current.filteredDestinations[0].id).toBe("kenya");
    });
  });

  describe("Code Matching", () => {
    it("should match destination by exact code (case-insensitive)", () => {
      const destinations: Destination[] = [
        createDestination("kenya", "Kenya", { code: "KEN" }),
        createDestination("uganda", "Uganda", { code: "UGA" }),
      ];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("KEN");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toHaveLength(1);
      expect(result.current.filteredDestinations[0].id).toBe("kenya");
    });

    it("should match destination by partial code", () => {
      const destinations: Destination[] = [
        createDestination("kenya", "Kenya", { code: "KENT" }),
        createDestination("uganda", "Uganda", { code: "UGA" }),
      ];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("KEN");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toHaveLength(1);
      expect(result.current.filteredDestinations[0].id).toBe("kenya");
    });

    it("should match nested children by code", () => {
      const destinations: Destination[] = [
        createDestination("kenya", "Kenya", {
          children: [
            createDestination("southern-kenya", "Southern Kenya", {
              code: "SKE",
            }),
            createDestination("northern-kenya", "Northern Kenya", {
              code: "NKE",
            }),
          ],
        }),
      ];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("SKE");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toHaveLength(1);
      expect(result.current.filteredDestinations[0].children).toHaveLength(1);
      expect(result.current.filteredDestinations[0].children![0].code).toBe(
        "SKE"
      );
    });

    it("should handle destinations without code", () => {
      const destinations: Destination[] = [
        createDestination("kenya", "Kenya"), // no code
        createDestination("uganda", "Uganda", { code: "UGA" }),
      ];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("UGA");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toHaveLength(1);
      expect(result.current.filteredDestinations[0].id).toBe("uganda");
    });

    it("should match by code when name doesn't match", () => {
      const destinations: Destination[] = [
        createDestination("kenya", "Kenya", { code: "KEN" }),
      ];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("KEN");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toHaveLength(1);
      expect(result.current.filteredDestinations[0].id).toBe("kenya");
    });
  });

  describe("Coordinate Matching", () => {
    it("should match destination by exact coordinates", () => {
      const destinations: Destination[] = [
        createDestination("kenya", "Kenya", {
          coordinates: { lat: -0.0236, lng: 37.9062 },
        }),
      ];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("-0.0236, 37.9062");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toHaveLength(1);
      expect(result.current.filteredDestinations[0].id).toBe("kenya");
    });

    it("should match destination by partial latitude", () => {
      const destinations: Destination[] = [
        createDestination("kenya", "Kenya", {
          coordinates: { lat: -0.0236, lng: 37.9062 },
        }),
      ];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("-0.0236");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toHaveLength(1);
      expect(result.current.filteredDestinations[0].id).toBe("kenya");
    });

    it("should match destination by partial longitude", () => {
      const destinations: Destination[] = [
        createDestination("kenya", "Kenya", {
          coordinates: { lat: -0.0236, lng: 37.9062 },
        }),
      ];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("37.9062");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toHaveLength(1);
      expect(result.current.filteredDestinations[0].id).toBe("kenya");
    });

    it("should match nested children by coordinates", () => {
      const destinations: Destination[] = [
        createDestination("kenya", "Kenya", {
          children: [
            createDestination("southern-kenya", "Southern Kenya", {
              coordinates: { lat: -1.2921, lng: 36.8219 },
            }),
          ],
        }),
      ];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("-1.2921");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toHaveLength(1);
      expect(result.current.filteredDestinations[0].children).toHaveLength(1);
      expect(
        result.current.filteredDestinations[0].children![0].coordinates
      ).toEqual({ lat: -1.2921, lng: 36.8219 });
    });

    it("should handle destinations without coordinates", () => {
      const destinations: Destination[] = [
        createDestination("kenya", "Kenya"), // no coordinates
        createDestination("uganda", "Uganda", {
          coordinates: { lat: 0.3476, lng: 32.5825 },
        }),
      ];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("0.3476");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toHaveLength(1);
      expect(result.current.filteredDestinations[0].id).toBe("uganda");
    });

    it("should handle negative coordinates", () => {
      const destinations: Destination[] = [
        createDestination("kenya", "Kenya", {
          coordinates: { lat: -2.6531, lng: -37.2631 },
        }),
      ];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("-2.6531");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toHaveLength(1);
    });

    it("should handle zero coordinates", () => {
      const destinations: Destination[] = [
        createDestination("equator", "Equator", {
          coordinates: { lat: 0, lng: 0 },
        }),
      ];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("0, 0");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toHaveLength(1);
    });
  });

  describe("Recursive Filtering", () => {
    it("should include parent when child matches (even if parent doesn't match)", () => {
      const destinations: Destination[] = [
        createDestination("kenya", "Kenya", {
          children: [
            createDestination("southern-kenya", "Southern Kenya"),
            createDestination("northern-kenya", "Northern Kenya"),
          ],
        }),
      ];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("southern");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toHaveLength(1);
      expect(result.current.filteredDestinations[0].id).toBe("kenya");
      expect(result.current.filteredDestinations[0].children).toHaveLength(1);
      expect(result.current.filteredDestinations[0].children![0].id).toBe(
        "southern-kenya"
      );
    });

    it("should exclude parent when no children match", () => {
      const destinations: Destination[] = [
        createDestination("kenya", "Kenya", {
          children: [
            createDestination("southern-kenya", "Southern Kenya"),
            createDestination("northern-kenya", "Northern Kenya"),
          ],
        }),
      ];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("tanzania");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toEqual([]);
    });

    it("should handle deep nesting (3+ levels)", () => {
      const destinations: Destination[] = [
        createDestination("kenya", "Kenya", {
          children: [
            createDestination("southern-kenya", "Southern Kenya", {
              children: [
                createDestination("amboseli", "Amboseli", {
                  children: [
                    createDestination("amboseli-park", "Amboseli Park"),
                  ],
                }),
              ],
            }),
          ],
        }),
      ];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("amboseli");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toHaveLength(1);
      expect(result.current.filteredDestinations[0].id).toBe("kenya");
      expect(result.current.filteredDestinations[0].children![0].id).toBe(
        "southern-kenya"
      );
      expect(
        result.current.filteredDestinations[0].children![0].children![0].id
      ).toBe("amboseli");
    });

    it("should handle multiple children with some matching", () => {
      const destinations: Destination[] = [
        createDestination("kenya", "Kenya", {
          children: [
            createDestination("southern-kenya", "Southern Kenya"),
            createDestination("northern-kenya", "Northern Kenya"),
            createDestination("eastern-kenya", "Eastern Kenya"),
          ],
        }),
      ];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("southern");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toHaveLength(1);
      expect(result.current.filteredDestinations[0].children).toHaveLength(1);
      expect(result.current.filteredDestinations[0].children![0].id).toBe(
        "southern-kenya"
      );
    });

    it("should handle sibling nodes with different match status", () => {
      const destinations: Destination[] = [
        createDestination("kenya", "Kenya", {
          children: [createDestination("southern-kenya", "Southern Kenya")],
        }),
        createDestination("uganda", "Uganda", {
          children: [createDestination("northern-uganda", "Northern Uganda")],
        }),
      ];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("southern");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toHaveLength(1);
      expect(result.current.filteredDestinations[0].id).toBe("kenya");
    });
  });

  describe("Children Preservation Logic", () => {
    it("should preserve all children when parent matches", () => {
      const destinations: Destination[] = [
        createDestination("kenya", "Kenya", {
          children: [
            createDestination("southern-kenya", "Southern Kenya"),
            createDestination("northern-kenya", "Northern Kenya"),
          ],
        }),
      ];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("kenya");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toHaveLength(1);
      expect(result.current.filteredDestinations[0].children).toHaveLength(2);
    });

    it("should include only matching children when only children match", () => {
      const destinations: Destination[] = [
        createDestination("kenya", "Kenya", {
          children: [
            createDestination("southern-kenya", "Southern Kenya"),
            createDestination("northern-kenya", "Northern Kenya"),
          ],
        }),
      ];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("southern");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toHaveLength(1);
      expect(result.current.filteredDestinations[0].children).toHaveLength(1);
      expect(result.current.filteredDestinations[0].children![0].id).toBe(
        "southern-kenya"
      );
    });

    it("should preserve all children when both parent and children match", () => {
      const destinations: Destination[] = [
        createDestination("kenya", "Kenya", {
          children: [
            createDestination("southern-kenya", "Southern Kenya"),
            createDestination("northern-kenya", "Northern Kenya"),
          ],
        }),
      ];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("kenya");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toHaveLength(1);
      expect(result.current.filteredDestinations[0].children).toHaveLength(2);
    });

    it("should handle empty children arrays", () => {
      const destinations: Destination[] = [
        createDestination("kenya", "Kenya", { children: [] }),
      ];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("kenya");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toHaveLength(1);
      expect(result.current.filteredDestinations[0].children).toEqual([]);
    });
  });

  describe("hasResults", () => {
    it("should return true when results exist", () => {
      const destinations: Destination[] = [createDestination("kenya", "Kenya")];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("kenya");
      });
      advanceDebounce();

      expect(result.current.hasResults).toBe(true);
    });

    it("should return false when no results", () => {
      const destinations: Destination[] = [createDestination("kenya", "Kenya")];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("tanzania");
      });
      advanceDebounce();

      expect(result.current.hasResults).toBe(false);
    });

    it("should update correctly when query changes", () => {
      const destinations: Destination[] = [createDestination("kenya", "Kenya")];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("kenya");
      });
      advanceDebounce();
      expect(result.current.hasResults).toBe(true);

      act(() => {
        result.current.setSearchQuery("tanzania");
      });
      advanceDebounce();
      expect(result.current.hasResults).toBe(false);

      act(() => {
        result.current.setSearchQuery("");
      });
      advanceDebounce();
      expect(result.current.hasResults).toBe(true);
    });

    it("should return false for empty destinations array", () => {
      const destinations: Destination[] = [];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      expect(result.current.hasResults).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should handle special characters in search query", () => {
      const destinations: Destination[] = [
        createDestination("test", "Test & More"),
      ];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("& M");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toHaveLength(1);
    });

    it("should handle very long search queries", () => {
      const destinations: Destination[] = [createDestination("kenya", "Kenya")];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      const longQuery = "a".repeat(1000);
      act(() => {
        result.current.setSearchQuery(longQuery);
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toEqual([]);
    });

    it("should handle unicode characters in names", () => {
      const destinations: Destination[] = [createDestination("café", "Café")];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("café");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toHaveLength(1);
    });

    it("should handle destinations with all optional fields missing", () => {
      const destinations: Destination[] = [
        {
          id: "test",
          name: "Test",
          type: "Country",
        },
      ];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("test");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toHaveLength(1);
    });

    it("should handle destinations with same name but different IDs", () => {
      const destinations: Destination[] = [
        createDestination("kenya-1", "Kenya"),
        createDestination("kenya-2", "Kenya"),
      ];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("kenya");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toHaveLength(2);
    });

    it("should trim whitespace from query", () => {
      const destinations: Destination[] = [createDestination("kenya", "Kenya")];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("  kenya  ");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toHaveLength(1);
    });

    it("should handle multiple spaces in query", () => {
      const destinations: Destination[] = [
        createDestination("kenya", "Kenya"),
        createDestination("southern-kenya", "Southern Kenya"),
      ];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      // Query with multiple spaces won't match because includes() checks for exact substring
      // "ken  ya" (with double space) won't match "kenya" (single word)
      act(() => {
        result.current.setSearchQuery("ken  ya");
      });
      advanceDebounce();
      expect(result.current.filteredDestinations).toHaveLength(0);

      // Similarly, "southern  kenya" (double space) won't match "southern kenya" (single space)
      act(() => {
        result.current.setSearchQuery("southern  kenya");
      });
      advanceDebounce();
      expect(result.current.filteredDestinations).toHaveLength(0);
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle search across multiple root nodes", () => {
      const destinations: Destination[] = [
        createDestination("kenya", "Kenya", {
          children: [createDestination("southern-kenya", "Southern Kenya")],
        }),
        createDestination("uganda", "Uganda", {
          children: [createDestination("northern-uganda", "Northern Uganda")],
        }),
      ];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("southern");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toHaveLength(1);
      expect(result.current.filteredDestinations[0].id).toBe("kenya");
    });

    it("should handle mixed matching (name, code, coordinates)", () => {
      const destinations: Destination[] = [
        createDestination("kenya", "Kenya", {
          code: "KEN",
          coordinates: { lat: -0.0236, lng: 37.9062 },
        }),
      ];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      // Match by name
      act(() => {
        result.current.setSearchQuery("kenya");
      });
      advanceDebounce();
      expect(result.current.filteredDestinations).toHaveLength(1);

      // Match by code
      act(() => {
        result.current.setSearchQuery("KEN");
      });
      advanceDebounce();
      expect(result.current.filteredDestinations).toHaveLength(1);

      // Match by coordinates
      act(() => {
        result.current.setSearchQuery("-0.0236");
      });
      advanceDebounce();
      expect(result.current.filteredDestinations).toHaveLength(1);
    });

    it("should handle deeply nested matching", () => {
      const destinations: Destination[] = [
        createDestination("kenya", "Kenya", {
          children: [
            createDestination("southern-kenya", "Southern Kenya", {
              children: [
                createDestination("amboseli", "Amboseli", {
                  children: [
                    createDestination("park", "Amboseli Park", {
                      children: [
                        createDestination("airstrip", "Airstrip", {
                          code: "ASV",
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ];

      const { result } = renderHook(() => useDestinationSearch(destinations));

      act(() => {
        result.current.setSearchQuery("ASV");
      });
      advanceDebounce();

      expect(result.current.filteredDestinations).toHaveLength(1);
      // Verify the entire path is preserved
      expect(result.current.filteredDestinations[0].id).toBe("kenya");
      expect(result.current.filteredDestinations[0].children![0].id).toBe(
        "southern-kenya"
      );
    });
  });
});
