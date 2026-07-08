import { http, HttpResponse } from "msw";

type MockSafariPlanner = {
  id: string;
  userName: string;
  email: string;
};

let mockSafariPlanners: MockSafariPlanner[] = [
  {
    id: "sp-1",
    userName: "Erik Karlsson",
    email: "erik@test.com",
  },
  {
    id: "sp-2",
    userName: "Amelia Earhart",
    email: "amelia@test.com",
  },
  {
    id: "sp-3",
    userName: "Amelia Earhart",
    email: "amelia@test.com",
  },
  {
    id: "sp-4",
    userName: "Sofia Rodriguez",
    email: "sofia@test.com",
  },
  {
    id: "sp-5",
    userName: "Linnea Johansson",
    email: "linnea@test.com",
  },
];

// GET /catalog/safari-planners - list safari planners
const getSafariPlanners = () => {
  return HttpResponse.json(
    {
      success: true,
      data: mockSafariPlanners,
      error: null,
    },
    { status: 200 }
  );
};

export const safariPlannerRoutes = (API_BASE_URL: string) => [
  http.get(`${API_BASE_URL}/catalog/safari-planners`, getSafariPlanners),
];
