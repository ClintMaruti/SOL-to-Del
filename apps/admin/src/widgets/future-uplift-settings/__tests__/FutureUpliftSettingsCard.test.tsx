import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";

import type {
  FutureUpliftConfigDto,
  FutureUpliftPatchPayload,
} from "@/entities/future-uplift";
import * as futureUpliftFeature from "@/features/update-future-uplift";

import { FutureUpliftSettingsCard } from "../ui/FutureUpliftSettingsCard";

vi.mock("@/features/update-future-uplift", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/update-future-uplift")>();
  return {
    ...actual,
    useFutureUpliftConfig: vi.fn(),
    useUpdateFutureUplift: vi.fn(),
  };
});

const mockUseFutureUpliftConfig = vi.mocked(
  futureUpliftFeature.useFutureUpliftConfig
);
const mockUseUpdateFutureUplift = vi.mocked(
  futureUpliftFeature.useUpdateFutureUplift
);

function queryResult(
  partial: Partial<UseQueryResult<FutureUpliftConfigDto, Error>>
): UseQueryResult<FutureUpliftConfigDto, Error> {
  return {
    data: undefined,
    error: null,
    isError: false,
    isLoading: false,
    isPending: false,
    isSuccess: false,
    status: "pending",
    refetch: vi.fn(),
    ...partial,
  } as UseQueryResult<FutureUpliftConfigDto, Error>;
}

function mutationResult(): UseMutationResult<
  FutureUpliftConfigDto,
  Error,
  FutureUpliftPatchPayload,
  unknown
> {
  return {
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    isSuccess: false,
    reset: vi.fn(),
    status: "idle",
  } as unknown as UseMutationResult<
    FutureUpliftConfigDto,
    Error,
    FutureUpliftPatchPayload,
    unknown
  >;
}

describe("FutureUpliftSettingsCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUpdateFutureUplift.mockReturnValue(mutationResult());
  });

  it("shows header label, save, and empty input when never configured", () => {
    mockUseFutureUpliftConfig.mockReturnValue(
      queryResult({
        data: { futureUpliftPercent: null, version: 1 },
        isSuccess: true,
        status: "success",
      })
    );

    render(<FutureUpliftSettingsCard />);

    expect(screen.getByText("Future Uplift,%")).toBeTruthy();
    expect(screen.getByRole("button", { name: /save/i })).toBeTruthy();
    expect(
      (screen.getByPlaceholderText("Type here") as HTMLInputElement).value
    ).toBe("");
    expect(
      screen.getByText(/Used when no contracted rate is available/i)
    ).toBeTruthy();
  });

  it("shows info explainer when persisted value exists", () => {
    mockUseFutureUpliftConfig.mockReturnValue(
      queryResult({
        data: { futureUpliftPercent: 15, version: 12 },
        isSuccess: true,
        status: "success",
      })
    );

    render(<FutureUpliftSettingsCard />);

    expect(
      screen.getByText(/Used when no contracted rate is available/i)
    ).toBeTruthy();
  });

  it("has no delete control", () => {
    mockUseFutureUpliftConfig.mockReturnValue(
      queryResult({
        data: { futureUpliftPercent: 15, version: 12 },
        isSuccess: true,
        status: "success",
      })
    );

    render(<FutureUpliftSettingsCard />);

    expect(screen.queryByRole("button", { name: /delete/i })).toBeNull();
  });

  it("blocks save for invalid input", async () => {
    const user = userEvent.setup();
    mockUseFutureUpliftConfig.mockReturnValue(
      queryResult({
        data: { futureUpliftPercent: null, version: 1 },
        isSuccess: true,
        status: "success",
      })
    );

    render(<FutureUpliftSettingsCard />);

    const input = screen.getByPlaceholderText("Type here");
    await user.clear(input);
    await user.type(input, "0");

    const save = screen.getByRole("button", { name: /save/i });
    expect(save.hasAttribute("disabled")).toBe(true);
  });

  it("disables save when a persisted percentage is cleared", async () => {
    const user = userEvent.setup();
    mockUseFutureUpliftConfig.mockReturnValue(
      queryResult({
        data: { futureUpliftPercent: 15, version: 1 },
        isSuccess: true,
        status: "success",
      })
    );

    render(<FutureUpliftSettingsCard />);

    const input = screen.getByPlaceholderText("Type here");
    await user.clear(input);

    const save = screen.getByRole("button", { name: /save/i });
    expect(save.hasAttribute("disabled")).toBe(true);
  });

  it("shows required validation immediately when persisted value is cleared before blur", async () => {
    const user = userEvent.setup();
    mockUseFutureUpliftConfig.mockReturnValue(
      queryResult({
        data: { futureUpliftPercent: 15, version: 1 },
        isSuccess: true,
        status: "success",
      })
    );

    render(<FutureUpliftSettingsCard />);

    const input = screen.getByPlaceholderText("Type here");
    await user.clear(input);

    expect(screen.getByText(/Enter a Future Uplift percentage/i)).toBeTruthy();
  });

  it("shows Saved with confirmation state after successful save", async () => {
    const user = userEvent.setup();
    let serverData: FutureUpliftConfigDto = {
      futureUpliftPercent: 10,
      version: 2,
    };

    mockUseFutureUpliftConfig.mockImplementation(() =>
      queryResult({
        data: serverData,
        isSuccess: true,
        status: "success",
      })
    );

    const mutate = vi.fn(
      (
        payload: FutureUpliftPatchPayload,
        opts?: { onSuccess?: () => void }
      ) => {
        serverData = {
          futureUpliftPercent: payload.futureUpliftPercent,
          version: payload.version + 1,
        };
        opts?.onSuccess?.();
      }
    );

    mockUseUpdateFutureUplift.mockReturnValue({
      ...mutationResult(),
      mutate: mutate as UseMutationResult<
        FutureUpliftConfigDto,
        Error,
        FutureUpliftPatchPayload,
        unknown
      >["mutate"],
    });

    render(<FutureUpliftSettingsCard />);

    const input = screen.getByPlaceholderText("Type here");
    await user.clear(input);
    await user.type(input, "12");

    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(mutate).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /^saved$/i })).toBeTruthy();
  });
});
