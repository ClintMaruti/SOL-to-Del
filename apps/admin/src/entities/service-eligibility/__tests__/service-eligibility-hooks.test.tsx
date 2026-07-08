import { QueryClient, QueryClientProvider, api } from "@sol/api-client";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { serviceEligibilitiesQueryKey } from "../api/eligibility-cache";
import type { ServiceEligibilityPayload } from "../api/eligibility-payload";
import { useCreateServiceEligibility } from "../api/useCreateServiceEligibility";
import { useDeleteServiceEligibility } from "../api/useDeleteServiceEligibility";
import { useServiceEligibilities } from "../api/useServiceEligibilities";
import { useUpdateServiceEligibility } from "../api/useUpdateServiceEligibility";
import type { ServiceEligibility } from "../model/types";

vi.mock("@sol/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sol/api-client")>();
  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

const mockPost = vi.mocked(api.post);
const mockPut = vi.mocked(api.put);
const mockDelete = vi.mocked(api.delete);
const mockGet = vi.mocked(api.get);

function createWrapper(queryClient: QueryClient) {
  return {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 60_000 },
      mutations: { retry: false },
    },
  });
}

function eligibilityFixture(
  overrides: Partial<ServiceEligibility> = {}
): ServiceEligibility {
  return {
    id: "eligibility-1",
    sequence: 1,
    name: "Eligibility 1",
    serviceId: "service-1",
    serviceName: "Service 1",
    isActive: true,
    validFrom: "",
    validTo: "",
    minAge: 12,
    totalPaxMin: 1,
    totalPaxMax: 4,
    unitsMin: null,
    unitsMax: null,
    nightsMin: null,
    nightsMax: null,
    validityDates: [],
    paxCompositionGroups: [],
    version: 1,
    ...overrides,
  };
}

const validPayload: ServiceEligibilityPayload = {
  serviceId: "service-1",
  version: 1,
  isActive: true,
  minAge: 12,
  totalPaxMin: 1,
  totalPaxMax: 4,
  unitsMin: null,
  unitsMax: null,
  nightsMin: null,
  nightsMax: null,
  validityDates: [],
  paxCompositionGroups: [],
};

describe("service eligibility hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes list rows that omit validity dates", async () => {
    const queryClient = createQueryClient();
    mockGet.mockResolvedValueOnce([
      {
        id: "eligibility-1",
        sequence: 1,
        name: "Block 1",
        serviceId: "service-1",
        serviceName: "Service 1",
        isActive: false,
        totalPaxMin: 1,
        totalPaxMax: null,
        unitsMin: 1,
        unitsMax: null,
        nightsMin: 1,
        nightsMax: null,
        validFrom: null,
        validTo: null,
        minAge: null,
        paxCompositionGroups: [],
        version: 1655,
      },
    ]);

    const { wrapper } = createWrapper(queryClient);
    const { result } = renderHook(() => useServiceEligibilities("service-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.[0]).toMatchObject({
      id: "eligibility-1",
      minAge: null,
      validFrom: "",
      validTo: "",
      validityDates: [],
      paxCompositionGroups: [],
    });
  });

  it("creates under the service route and appends to the service cache", async () => {
    const queryClient = createQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const existing = eligibilityFixture();
    const created = eligibilityFixture({
      id: "eligibility-2",
      sequence: 2,
      name: "Eligibility 2",
      version: 2,
    });
    const createdResponse = {
      ...created,
      validFrom: null,
      validTo: null,
      validityDates: undefined,
    };

    queryClient.setQueryData<ServiceEligibility[]>(
      serviceEligibilitiesQueryKey("service-1"),
      [existing]
    );
    mockPost.mockResolvedValueOnce(createdResponse);

    const onCreated = vi.fn(() => {
      expect(
        queryClient.getQueryData<ServiceEligibility[]>(
          serviceEligibilitiesQueryKey("service-1")
        )
      ).toEqual([existing]);
    });

    const { wrapper } = createWrapper(queryClient);
    const { result } = renderHook(() => useCreateServiceEligibility(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        serviceId: "service-1",
        payload: validPayload,
        onCreated,
      });
    });

    expect(mockPost).toHaveBeenCalledWith(
      "/catalog/services/service-1/eligibilities",
      validPayload
    );
    expect(onCreated).toHaveBeenCalledWith(created);

    await waitFor(() => {
      expect(
        queryClient.getQueryData<ServiceEligibility[]>(
          serviceEligibilitiesQueryKey("service-1")
        )
      ).toEqual([existing, created]);
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: serviceEligibilitiesQueryKey("service-1"),
    });
  });

  it("updates through the eligibility route and replaces the cached row", async () => {
    const queryClient = createQueryClient();
    const existing = eligibilityFixture({ name: "Old name" });
    const other = eligibilityFixture({
      id: "eligibility-2",
      sequence: 2,
      name: "Other",
    });
    const updated = eligibilityFixture({ name: "Updated", version: 2 });

    queryClient.setQueryData<ServiceEligibility[]>(
      serviceEligibilitiesQueryKey("service-1"),
      [existing, other]
    );
    mockPut.mockResolvedValueOnce(updated);

    const { wrapper } = createWrapper(queryClient);
    const { result } = renderHook(() => useUpdateServiceEligibility(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        eligibilityId: "eligibility-1",
        serviceId: "service-1",
        payload: validPayload,
      });
    });

    expect(mockPut).toHaveBeenCalledWith(
      "/catalog/eligibilities/eligibility-1",
      validPayload
    );
    expect(
      queryClient.getQueryData<ServiceEligibility[]>(
        serviceEligibilitiesQueryKey("service-1")
      )
    ).toEqual([updated, other]);
  });

  it("optimistically removes deleted rows and rolls back on failure", async () => {
    const queryClient = createQueryClient();
    const first = eligibilityFixture();
    const second = eligibilityFixture({
      id: "eligibility-2",
      sequence: 2,
      name: "Eligibility 2",
    });

    queryClient.setQueryData<ServiceEligibility[]>(
      serviceEligibilitiesQueryKey("service-1"),
      [first, second]
    );
    mockDelete.mockRejectedValueOnce(new Error("Delete blocked"));

    const { wrapper } = createWrapper(queryClient);
    const { result } = renderHook(() => useDeleteServiceEligibility(), {
      wrapper,
    });

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          eligibilityId: "eligibility-1",
          serviceId: "service-1",
        })
      ).rejects.toThrow("Delete blocked");
    });

    expect(mockDelete).toHaveBeenCalledWith(
      "/catalog/eligibilities/eligibility-1"
    );
    expect(
      queryClient.getQueryData<ServiceEligibility[]>(
        serviceEligibilitiesQueryKey("service-1")
      )
    ).toEqual([first, second]);
  });
});
