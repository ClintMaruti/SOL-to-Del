import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { ItinerariesPage } from "../ItinerariesPage";

vi.mock("@/widgets/itineraries-list", () => ({
  ItinerariesList: ({ onCreate }: { onCreate: () => void }) => (
    <button type="button" onClick={onCreate}>
      Mock create
    </button>
  ),
}));

vi.mock("@/features/create-itinerary", () => ({
  CreateItineraryModal: ({
    open,
    onOpenChange,
    onSuccess,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (itinerary: { id: string }) => void;
  }) =>
    open ? (
      <div role="dialog" aria-label="Create Itinerary">
        <button type="button" onClick={() => onOpenChange(false)}>
          Cancel modal
        </button>
        <button
          type="button"
          onClick={() => onSuccess({ id: "created-itinerary-1" })}
        >
          Succeed modal
        </button>
      </div>
    ) : null,
}));

function LocationProbe() {
  const location = useLocation();
  return (
    <output aria-label="location">
      {location.pathname}
      {location.search}
    </output>
  );
}

function renderPage(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/itinerary/itineraries"
          element={
            <>
              <ItinerariesPage />
              <LocationProbe />
            </>
          }
        />
        <Route
          path="/itinerary/itineraries/:innerPageId"
          element={
            <>
              <ItinerariesPage />
              <LocationProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("ItinerariesPage", () => {
  it("opens and closes the create modal through the create route", async () => {
    const user = userEvent.setup();

    renderPage("/itinerary/itineraries/itineraries");

    await user.click(screen.getByRole("button", { name: /mock create/i }));

    expect(
      screen.getByRole("dialog", { name: /create itinerary/i })
    ).toBeTruthy();
    expect(screen.getByLabelText("location").textContent).toBe(
      "/itinerary/itineraries/create"
    );

    await user.click(screen.getByRole("button", { name: /cancel modal/i }));

    expect(
      screen.queryByRole("dialog", { name: /create itinerary/i })
    ).toBeNull();
    expect(screen.getByLabelText("location").textContent).toBe(
      "/itinerary/itineraries/itineraries"
    );
  });

  it("returns to the plain itinerary list after create success", async () => {
    const user = userEvent.setup();

    renderPage("/itinerary/itineraries/create");

    await user.click(screen.getByRole("button", { name: /succeed modal/i }));

    expect(screen.getByLabelText("location").textContent).toBe(
      "/itinerary/itineraries/itineraries"
    );
  });
});
