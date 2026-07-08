import { ApiError } from "@sol/api-client";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAgencyCommissions } from "@/entities/commission";
import { createCommission } from "@/entities/commission/testing/factories";

import { useCreateCommission } from "../api/useCreateCommission";
import { useUpdateCommission } from "../api/useUpdateCommission";
import { CommissionModal } from "../ui/CommissionModal";

vi.mock("@/entities/commission", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/commission")>();
  return {
    ...actual,
    useAgencyCommissions: vi.fn(),
  };
});

vi.mock("../api/useCreateCommission", () => ({
  useCreateCommission: vi.fn(),
}));

vi.mock("../api/useUpdateCommission", () => ({
  useUpdateCommission: vi.fn(),
}));

vi.mock("@/shared/ui", () => ({
  DatePickerGridInput: ({
    className,
    hasError,
    id,
    isDateDisabled,
    onChange,
    placeholder,
    value,
  }: {
    className?: string;
    hasError?: boolean;
    id?: string;
    isDateDisabled?: (date: Date) => boolean;
    onChange?: (value: string) => void;
    placeholder?: string;
    value?: string;
  }) => (
    <input
      id={id}
      data-testid="effective-from-input"
      data-class={className}
      data-error={hasError ? "true" : "false"}
      data-today-disabled={
        isDateDisabled?.(new Date("2026-04-15T00:00:00")) ? "true" : "false"
      }
      data-tomorrow-disabled={
        isDateDisabled?.(new Date("2026-04-16T00:00:00")) ? "true" : "false"
      }
      data-duplicate-disabled={
        isDateDisabled?.(new Date("2026-04-18T00:00:00")) ? "true" : "false"
      }
      placeholder={placeholder}
      value={value ?? ""}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
}));

const mockUseCreateCommission = vi.mocked(useCreateCommission);
const mockUseUpdateCommission = vi.mocked(useUpdateCommission);
const mockUseAgencyCommissions = vi.mocked(useAgencyCommissions);

function createCreateMutationResult(
  mutate: ReturnType<typeof vi.fn> = vi.fn()
): ReturnType<typeof useCreateCommission> {
  return {
    mutate,
    isPending: false,
    reset: vi.fn(),
  } as unknown as ReturnType<typeof useCreateCommission>;
}

function createUpdateMutationResult(
  mutate: ReturnType<typeof vi.fn> = vi.fn()
): ReturnType<typeof useUpdateCommission> {
  return {
    mutate,
    isPending: false,
    reset: vi.fn(),
  } as unknown as ReturnType<typeof useUpdateCommission>;
}

describe("CommissionModal", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-04-15T12:00:00"));
    vi.clearAllMocks();
    mockUseCreateCommission.mockReturnValue(createCreateMutationResult());
    mockUseUpdateCommission.mockReturnValue(createUpdateMutationResult());
    mockUseAgencyCommissions.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useAgencyCommissions>);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

  it("submits the create payload for a new commission", async () => {
    const createMutate = vi.fn();
    mockUseCreateCommission.mockReturnValue(
      createCreateMutationResult(createMutate)
    );

    render(
      <CommissionModal agencyId="agency-1" open={true} onOpenChange={vi.fn()} />
    );

    await user.type(screen.getByTestId("effective-from-input"), "2026-04-16");
    await user.type(screen.getByRole("spinbutton"), "7.5");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(createMutate).toHaveBeenCalledWith(
      {
        agencyId: "agency-1",
        payload: {
          effectiveFrom: "2026-04-16",
          commissionPercent: 7.5,
        },
      },
      expect.objectContaining({
        onError: expect.any(Function),
        onSuccess: expect.any(Function),
      })
    );
  });

  it("blocks commission percentages greater than 100", async () => {
    const createMutate = vi.fn();
    mockUseCreateCommission.mockReturnValue(
      createCreateMutationResult(createMutate)
    );

    render(
      <CommissionModal agencyId="agency-1" open={true} onOpenChange={vi.fn()} />
    );

    await user.type(screen.getByTestId("effective-from-input"), "2026-04-16");
    await user.type(screen.getByRole("spinbutton"), "100.1");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(createMutate).not.toHaveBeenCalled();
    expect(screen.getByText("Must be between 0 and 100")).toBeDefined();
    expect(screen.getByRole("spinbutton").getAttribute("aria-invalid")).toBe(
      "true"
    );
  });

  it("disables today in the picker rule and blocks same-day submissions", async () => {
    const createMutate = vi.fn();
    mockUseCreateCommission.mockReturnValue(
      createCreateMutationResult(createMutate)
    );

    render(
      <CommissionModal agencyId="agency-1" open={true} onOpenChange={vi.fn()} />
    );

    expect(
      screen.getByTestId("effective-from-input").dataset.todayDisabled
    ).toBe("true");
    expect(
      screen.getByTestId("effective-from-input").dataset.tomorrowDisabled
    ).toBe("false");

    await user.type(screen.getByTestId("effective-from-input"), "2026-04-15");
    await user.type(screen.getByRole("spinbutton"), "7");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(createMutate).not.toHaveBeenCalled();
    expect(
      screen.getByText("Effective date can not be set as today or a past date")
    ).toBeDefined();
    expect(
      screen.getByText("Select a date starting from tomorrow to proceed.")
    ).toBeDefined();
    expect(screen.getByTestId("effective-from-input").dataset.error).toBe(
      "true"
    );
  });

  it("prefills edit values and submits the update payload with version", async () => {
    const updateMutate = vi.fn();
    mockUseUpdateCommission.mockReturnValue(
      createUpdateMutationResult(updateMutate)
    );

    render(
      <CommissionModal
        agencyId="agency-1"
        commission={createCommission("commission-1", "2026-04-16", {
          agencyId: "agency-1",
          commissionPercent: 7,
          version: 12,
        })}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(
      (screen.getByTestId("effective-from-input") as HTMLInputElement).value
    ).toBe("2026-04-16");
    expect((screen.getByRole("spinbutton") as HTMLInputElement).value).toBe(
      "7"
    );

    await user.clear(screen.getByTestId("effective-from-input"));
    await user.type(screen.getByTestId("effective-from-input"), "2026-04-20");
    await user.clear(screen.getByRole("spinbutton"));
    await user.type(screen.getByRole("spinbutton"), "7.5");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(updateMutate).toHaveBeenCalledWith(
      {
        commissionId: "commission-1",
        payload: {
          effectiveFrom: "2026-04-20",
          commissionPercent: 7.5,
          version: 12,
        },
      },
      expect.objectContaining({
        onError: expect.any(Function),
        onSuccess: expect.any(Function),
      })
    );
  });

  it("blocks duplicate effective dates for the same agency", async () => {
    const createMutate = vi.fn();
    mockUseCreateCommission.mockReturnValue(
      createCreateMutationResult(createMutate)
    );
    mockUseAgencyCommissions.mockReturnValue({
      data: [
        createCommission("commission-1", "2026-04-18", {
          agencyId: "agency-1",
          commissionPercent: 7,
        }),
      ],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useAgencyCommissions>);

    render(
      <CommissionModal agencyId="agency-1" open={true} onOpenChange={vi.fn()} />
    );

    expect(
      screen.getByTestId("effective-from-input").dataset.duplicateDisabled
    ).toBe("true");

    await user.type(screen.getByTestId("effective-from-input"), "2026-04-18");
    await user.type(screen.getByRole("spinbutton"), "7");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(createMutate).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        "A commission with this effective date already exists for this agency."
      )
    ).toBeDefined();
    expect(screen.getByTestId("effective-from-input").dataset.error).toBe(
      "true"
    );
    expect(
      screen.queryByText("Select a date starting from tomorrow to proceed.")
    ).toBeNull();
  });

  it("maps API validation errors back into the modal alert state", async () => {
    const updateMutate = vi.fn((_variables, options) => {
      options?.onError?.(
        new ApiError(
          "Effective date can not be set as today or a past date",
          422,
          "Unprocessable Entity",
          undefined,
          {
            effectiveFrom: [
              "Effective date can not be set as today or a past date",
            ],
          }
        )
      );
    });
    mockUseUpdateCommission.mockReturnValue(
      createUpdateMutationResult(updateMutate)
    );

    render(
      <CommissionModal
        agencyId="agency-1"
        commission={createCommission("commission-1", "2026-04-16", {
          agencyId: "agency-1",
          commissionPercent: 7,
          version: 12,
        })}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      screen.getByText("Effective date can not be set as today or a past date")
    ).toBeDefined();
    expect(
      screen.getByText("Select a date starting from tomorrow to proceed.")
    ).toBeDefined();
    expect(screen.getByTestId("effective-from-input").dataset.error).toBe(
      "true"
    );
  });
});
