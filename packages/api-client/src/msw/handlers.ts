import { http, HttpResponse } from "msw";
import type { ValidationError } from "../api-client";
import {
  activateAgency,
  createAgency,
  deactivateAgency,
  deleteAgency,
  getAgencies,
  getAgencyByIdData,
  putUpdateAgency,
  updateAgency,
} from "./controllers/agencies";
import { agencyGroupRoutes } from "./controllers/agency-groups";
import { agentRoutes, getAgentsByAgencyName } from "./controllers/agents";
import { catalogExtrasRoutes } from "./controllers/catalog-extras";
import { commissionRoutes } from "./controllers/commissions";
import { contentBlocksRoutes } from "./controllers/content-blocks";
import { documentTemplatesRoutes } from "./controllers/document-templates";
import { futureUpliftRoutes } from "./controllers/future-uplift";
import { itinerariesRoutes } from "./controllers/itineraries";
import { marginRulesRoutes } from "./controllers/margin-rules";
import { promotionRoutes } from "./controllers/promotions";
import { safariPlannerRoutes } from "./controllers/safari-planners";
import { serviceOptionRatePlansRoutes } from "./controllers/service-option-rate-plans";
import { serviceOptionRatesRoutes } from "./controllers/service-option-rates";
import { serviceRatesRoutes } from "./controllers/service-rates";
import { serviceOptionsRoutes } from "./controllers/service-options";
import { serviceEligibilityRoutes } from "./controllers/service-eligibilities";
import { supplierContractRoutes } from "./controllers/supplier-contracts";
import { supplierHeadOfficeRoutes } from "./controllers/supplier-head-offices";
import { supplierPaxTypeScheduleRoutes } from "./controllers/supplier-pax-type-schedules";
import { supplierServicesRoutes } from "./controllers/supplier-services";
import {
  getActiveMockSupplierCountryNamesLowercase,
  supplierRoutes,
} from "./controllers/suppliers";
import { filterFlatLocationsToEligibleSupplierCountries } from "./catalogLocationTree";

// MSW handlers always use "/api" as base URL since api-client uses
// baseURL="/api" when MSW is enabled (to allow service worker interception)
const API_BASE_URL = "/api";

// Type for destination items matching new API format
type MockDestination = {
  id: string;
  parentId: string | null;
  name: string;
  type: string;
  code: string;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  version: number;
  isPreferred?: boolean;
  deletedBy?: string;
  deletedAt?: string;
};

// Mock destinations data (shared between handlers)
// Using let instead of const to allow mutations for stateful operations
let mockDestinations: MockDestination[] = [
  {
    id: "kenya",
    parentId: null,
    name: "Kenya",
    type: "Country",
    code: "KEN4",
    latitude: -0.0236,
    longitude: 37.9062,
    isActive: true,
    version: 1,
  },
  {
    id: "southern-kenya",
    parentId: "kenya",
    name: "Southern Kenya",
    type: "Region",
    code: "SKE5",
    latitude: -1.2921,
    longitude: 36.8219,
    isActive: true,
    version: 1,
  },
  {
    id: "amboseli",
    parentId: "southern-kenya",
    name: "Amboseli",
    type: "City",
    code: "AM6",
    latitude: -2.6531,
    longitude: 37.2631,
    isActive: true,
    version: 1,
  },
  {
    id: "amboseli-national-park",
    parentId: "amboseli",
    name: "Amboseli National Park",
    type: "Area",
    code: "ANP",
    latitude: -2.6531,
    longitude: 37.2631,
    isActive: true,
    version: 1,
  },
  {
    id: "amboseli-airstrip",
    parentId: "amboseli-national-park",
    name: "Amboseli Airstrip",
    type: "Airport",
    code: "ASV",
    latitude: -2.6453,
    longitude: 37.2531,
    isActive: true,
    version: 1,
  },
  {
    id: "central-kenya",
    parentId: "kenya",
    name: "Central Kenya",
    type: "Region",
    code: "CKE5",
    latitude: null,
    longitude: null,
    isActive: true,
    version: 1,
  },
  {
    id: "western-kenya",
    parentId: "kenya",
    name: "Western Kenya",
    type: "Region",
    code: "WKE5",
    latitude: null,
    longitude: null,
    isActive: true,
    version: 1,
  },
];

// Mock user data for auth (Dev/QA/UAT only)
// Using let instead of const to allow mutations for stateful operations
let mockUsers = [
  {
    id: "1",
    email: "dev@test.com",
    name: "Dev User",
    avatar: undefined,
  },
  {
    id: "2",
    email: "qa@test.com",
    name: "QA User",
    avatar: undefined,
  },
];

// Helper to generate mock token
const generateMockToken = (userId: string) =>
  `mock_token_${userId}_${Date.now()}`;

export const handlers = [
  // Health check endpoint
  http.get(`${API_BASE_URL}/health`, () => {
    return HttpResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      },
      { status: 200 }
    );
  }),

  // Get all locations (destinations) - new endpoint /api/catalog/locations
  // Filter out soft-deleted destinations (those with deletedAt set)
  // Returns direct array (no wrapper)
  http.get(`${API_BASE_URL}/catalog/locations`, () => {
    const activeDestinations = mockDestinations.filter((d) => !d.deletedAt);
    return HttpResponse.json(activeDestinations, { status: 200 });
  }),

  // Eligible location tree for itineraries (countries with ≥1 active supplier — MSW)
  http.get(`${API_BASE_URL}/catalog/locations/eligible`, () => {
    const activeDestinations = mockDestinations.filter((d) => !d.deletedAt);
    const supplierCountries = getActiveMockSupplierCountryNamesLowercase();
    const eligible = filterFlatLocationsToEligibleSupplierCountries(
      activeDestinations,
      supplierCountries
    );
    return HttpResponse.json(eligible, { status: 200 });
  }),

  // Get single location by ID - GET /api/catalog/locations/{id}
  // Returns direct DestinationApiItem on success, validation error array on 404
  http.get(`${API_BASE_URL}/catalog/locations/:id`, ({ params }) => {
    const id = params.id as string;

    if (!id) {
      return HttpResponse.json(
        [
          {
            propertyName: "location",
            errorMessage: "The location with the given Id doesn't exist.",
          },
        ],
        { status: 404 }
      );
    }

    const destination = mockDestinations.find(
      (d) => d.id === id && !d.deletedAt
    );

    if (!destination) {
      return HttpResponse.json(
        [
          {
            propertyName: "location",
            errorMessage: "The location with the given Id doesn't exist.",
          },
        ],
        { status: 404 }
      );
    }

    // Return direct response (no wrapper)
    return HttpResponse.json(destination, { status: 200 });
  }),

  // Update location - PUT /api/catalog/locations
  http.put(`${API_BASE_URL}/catalog/locations`, async ({ request }) => {
    const body = (await request.json()) as {
      id: string;
      name: string;
      type: string;
      code: string;
      parentId: string | null;
      latitude: number | null;
      longitude: number | null;
      isPreferred?: boolean;
    };

    const validationErrors: ValidationError[] = [];

    // Validate required fields
    if (!body.id) {
      validationErrors.push({
        propertyName: "id",
        errorMessage: "ID is required",
      });
    }
    if (!body.name || !body.name.trim()) {
      validationErrors.push({
        propertyName: "name",
        errorMessage: "Name is required",
      });
    }
    if (!body.type) {
      validationErrors.push({
        propertyName: "type",
        errorMessage: "Type is required",
      });
    }
    if (!body.code || !body.code.trim()) {
      validationErrors.push({
        propertyName: "code",
        errorMessage: "Code is required",
      });
    }

    // If basic validation fails, return early
    if (validationErrors.length > 0) {
      return HttpResponse.json(validationErrors, { status: 422 });
    }

    // Find existing destination index (exclude deleted destinations)
    const index = mockDestinations.findIndex(
      (d) => d.id === body.id && !d.deletedAt
    );

    // Check if location exists
    if (index === -1) {
      return HttpResponse.json(
        [
          {
            propertyName: "id",
            errorMessage: "Location with provided ID does not exist",
          },
        ],
        { status: 422 }
      );
    }

    const validTypes = ["Country", "Region", "City", "Area", "Airport"];
    if (!validTypes.includes(body.type)) {
      validationErrors.push({
        propertyName: "type",
        errorMessage: `Type must be one of: ${validTypes.join(", ")}`,
      });
    }

    // Validate unique name (check against other locations, excluding current)
    const nameExists = mockDestinations.some(
      (d) =>
        d.id !== body.id &&
        !d.deletedAt &&
        d.name?.toLowerCase().trim() === body.name?.toLowerCase().trim()
    );
    if (nameExists) {
      validationErrors.push({
        propertyName: "name",
        errorMessage: "A location with this name already exists.",
      });
    }

    // Validate unique code (check against other locations, excluding current)
    const codeExists = mockDestinations.some(
      (d) =>
        d.id !== body.id &&
        !d.deletedAt &&
        d.code.toLowerCase().trim() === body.code.toLowerCase().trim()
    );
    if (codeExists) {
      validationErrors.push({
        propertyName: "code",
        errorMessage: "A location with this code already exists.",
      });
    }

    // Validate parentId if provided
    if (body.parentId !== null && body.parentId !== undefined) {
      // Check if parent exists
      const parentExists = mockDestinations.some(
        (d) => d.id === body.parentId && !d.deletedAt
      );
      if (!parentExists) {
        validationErrors.push({
          propertyName: "parentId",
          errorMessage: "Parent location does not exist",
        });
      } else {
        // Check for circular parent-child relationship
        const hasCircularParent = (
          locationId: string,
          parentId: string
        ): boolean => {
          if (parentId === locationId) {
            return true;
          }

          const parent = mockDestinations.find(
            (d) => d.id === parentId && !d.deletedAt
          );
          if (!parent) {
            return false;
          }

          // Check if parent's parent chain includes locationId
          if (parent.parentId === null) {
            return false;
          }

          return hasCircularParent(locationId, parent.parentId);
        };

        if (hasCircularParent(body.id, body.parentId)) {
          validationErrors.push({
            propertyName: "parentId",
            errorMessage:
              "Circular parent-child relationship detected. A location cannot be its own ancestor.",
          });
        }
      }
    }

    // If validation errors exist, return 422
    if (validationErrors.length > 0) {
      return HttpResponse.json(validationErrors, { status: 422 });
    }

    // Update location in the array
    const existing = mockDestinations[index];
    const preferredFlag = body.type === "Country" ? !!body.isPreferred : false;
    const updated: MockDestination = {
      ...existing,
      name: body.name.trim(),
      type: body.type,
      code: body.code.trim(),
      parentId: body.parentId,
      latitude: body.latitude,
      longitude: body.longitude,
      isPreferred: preferredFlag,
      // Preserve isActive and version from existing
      isActive: existing.isActive,
      version: existing.version,
    };

    mockDestinations[index] = updated;

    // Return 200 OK with updated location
    return HttpResponse.json(updated, { status: 200 });
  }),

  // Update destination by ID (legacy endpoint - kept for backward compatibility)
  http.put(`${API_BASE_URL}/destinations/:id`, async ({ request, params }) => {
    const { id } = params;
    const body = (await request.json()) as {
      parentId: string | null; // null for top-level locations
      name: string;
      type: string;
      code?: string;
      latitude?: number;
      longitude?: number;
    };

    // Find existing destination index (exclude deleted destinations)
    const index = mockDestinations.findIndex(
      (d) => d.id === id && !d.deletedAt
    );

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          data: null,
          error: "Destination not found",
        },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!body.name || !body.type) {
      return HttpResponse.json(
        {
          success: false,
          data: null,
          error: "Name and type are required",
        },
        { status: 400 }
      );
    }

    const updated: MockDestination = {
      ...mockDestinations[index],
      name: body.name,
      parentId: body.parentId,
      type: body.type,
    };
    if (body.code !== undefined) {
      updated.code = body.code;
    }
    if (body.latitude !== undefined) {
      updated.latitude = body.latitude;
    }
    if (body.longitude !== undefined) {
      updated.longitude = body.longitude;
    }
    mockDestinations[index] = updated;

    return HttpResponse.json(
      {
        success: true,
        data: mockDestinations[index],
        error: null,
      },
      { status: 200 }
    );
  }),

  // Create a new destination
  http.post(`${API_BASE_URL}/catalog/locations`, async ({ request }) => {
    const body = (await request.json()) as {
      type: string;
      name: string;
      parentId: string | null;
      code?: string;
      latitude?: number | string | null;
      longitude?: number | string | null;
      isPreferred?: boolean;
    };

    const lat =
      body.latitude === undefined || body.latitude === null
        ? null
        : typeof body.latitude === "string"
          ? body.latitude.trim()
            ? parseFloat(body.latitude)
            : null
          : body.latitude;
    const lng =
      body.longitude === undefined || body.longitude === null
        ? null
        : typeof body.longitude === "string"
          ? body.longitude.trim()
            ? parseFloat(body.longitude)
            : null
          : body.longitude;

    const preferredFlag = body.type === "Country" ? !!body.isPreferred : false;

    const newDestination: MockDestination = {
      id: `dest-${Date.now()}`,
      parentId: body.parentId === "root_id" ? null : body.parentId,
      name: body.name,
      type: body.type,
      code: typeof body.code === "string" ? body.code : "",
      latitude: lat,
      longitude: lng,
      isActive: true,
      version: 1,
      ...(body.type === "Country" ? { isPreferred: preferredFlag } : {}),
    };

    // Actually add the destination to the array
    mockDestinations.push(newDestination);

    return HttpResponse.json(
      {
        success: true,
        data: newDestination,
        error: null,
      },
      { status: 201 } // Use 201 Created for new resources
    );
  }),

  // Soft delete destination by ID
  // DELETE /api/destinations/:id
  // Sets DeletedBy and DeletedAt fields, entity will no longer appear in UI
  http.delete(
    `${API_BASE_URL}/catalog/locations/:id`,
    ({ params, cookies }) => {
      const { id } = params;

      // Check authentication
      const token = (cookies as Record<string, string>).auth_token;
      if (!token) {
        return HttpResponse.json(
          {
            success: false,
            data: null,
            error: "Unauthorized",
          },
          { status: 401 }
        );
      }

      // Extract user ID from token (format: mock_token_userId_timestamp)
      const tokenParts = token.split("_");
      if (tokenParts.length < 3) {
        return HttpResponse.json(
          {
            success: false,
            data: null,
            error: "Invalid token",
          },
          { status: 401 }
        );
      }
      const userId = tokenParts[2];

      // Find destination
      const index = mockDestinations.findIndex((d) => d.id === id);

      if (index === -1) {
        return HttpResponse.json(
          {
            success: false,
            data: null,
            error: "Destination not found",
          },
          { status: 404 }
        );
      }

      const destination = mockDestinations[index];

      // Check if already deleted
      if (destination.deletedAt) {
        return HttpResponse.json(
          {
            success: false,
            data: null,
            error: "Destination not found",
          },
          { status: 404 }
        );
      }

      // Business rule: Check if destination has child destinations
      const hasChildren = mockDestinations.some(
        (d) => d.parentId === id && !d.deletedAt
      );

      if (hasChildren) {
        return HttpResponse.json(
          {
            success: false,
            data: null,
            error: "Cannot delete destination with active child destinations",
          },
          { status: 409 }
        );
      }

      // Perform soft delete by setting DeletedBy and DeletedAt
      mockDestinations[index] = {
        ...destination,
        deletedBy: userId,
        deletedAt: new Date().toISOString(),
      };

      // Return 204 No Content on success
      return new HttpResponse(null, { status: 204 });
    }
  ),

  // Auth handlers for Dev/QA/UAT
  // POST /api/auth/login - Email/password authentication (legacy, not used in current flow)
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as {
      email: string;
      password: string;
    };

    // Mock validation: accept any valid email + password
    // In real implementation, this would validate against database
    if (!body.email || !body.password) {
      return HttpResponse.json(
        {
          success: false,
          data: null,
          error: "Email and password are required",
        },
        { status: 400 }
      );
    }

    // Find or create mock user
    let user = mockUsers.find((u) => u.email === body.email);
    if (!user) {
      // Create new mock user for any email
      user = {
        id: `user_${Date.now()}`,
        email: body.email,
        name: body.email.split("@")[0],
        avatar: undefined,
      };
      mockUsers.push(user);
    }

    const token = generateMockToken(user.id);

    // Set httpOnly cookie via Set-Cookie header
    // httpOnly prevents JavaScript access, protecting against XSS attacks
    const maxAge = 60 * 60 * 24 * 7; // 7 days
    // For localhost, Domain attribute is not needed (cookies work natively)
    // SameSite=None and Secure are required for cross-origin requests (different ports)
    const cookieOptions = [
      `auth_token=${token}`,
      `Max-Age=${maxAge}`,
      "Path=/",
      "HttpOnly", // Prevents JavaScript access to cookie
      "Secure", // Required for SameSite=None and HTTPS
      "SameSite=None", // Required for cross-origin requests (different ports)
    ].join("; ");

    return HttpResponse.json(
      {
        success: true,
        data: {
          user,
          // Token is not returned in response body for security
          // It's stored in httpOnly cookie only
        },
        error: null,
      },
      {
        status: 200,
        headers: {
          "Set-Cookie": cookieOptions,
        },
      }
    );
  }),

  // POST /api/auth/google - Google OAuth authentication
  http.post(`${API_BASE_URL}/auth/google`, async ({ request }) => {
    const body = (await request.json()) as {
      idToken?: string;
      code?: string;
    };

    if (!body.idToken && !body.code) {
      return HttpResponse.json(
        {
          success: false,
          data: null,
          error: "Google ID token or authorization code is required",
        },
        { status: 400 }
      );
    }

    // Mock Google user extraction
    // In real implementation, this would verify the Google ID token
    const mockGoogleUser = {
      id: `google_user_${Date.now()}`,
      email: "google.user@example.com",
      name: "Google User",
      avatar: undefined,
    };

    const token = generateMockToken(mockGoogleUser.id);

    // Set httpOnly cookie via Set-Cookie header
    // httpOnly prevents JavaScript access, protecting against XSS attacks
    const maxAge = 60 * 60 * 24 * 7; // 7 days
    // For localhost, Domain attribute is not needed (cookies work natively)
    // SameSite=None and Secure are required for cross-origin requests (different ports)
    const cookieOptions = [
      `auth_token=${token}`,
      `Max-Age=${maxAge}`,
      "Path=/",
      "HttpOnly", // Prevents JavaScript access to cookie
      "Secure", // Required for SameSite=None and HTTPS
      "SameSite=None", // Required for cross-origin requests (different ports)
    ].join("; ");

    return HttpResponse.json(
      {
        success: true,
        data: {
          user: mockGoogleUser,
          // Token is not returned in response body for security
          // It's stored in httpOnly cookie only
        },
        error: null,
      },
      {
        status: 200,
        headers: {
          "Set-Cookie": cookieOptions,
        },
      }
    );
  }),

  // POST /api/auth/logout - Logout endpoint
  http.post(`${API_BASE_URL}/auth/logout`, () => {
    // Clear httpOnly cookie by setting it with Max-Age=0
    // Must include all flags to match the original cookie
    const cookieOptions = [
      "auth_token=",
      "Max-Age=0",
      "Path=/",
      "HttpOnly",
      "Secure",
      "SameSite=None",
    ].join("; ");

    return HttpResponse.json(
      {
        success: true,
        data: null,
        error: null,
      },
      {
        status: 200,
        headers: {
          "Set-Cookie": cookieOptions,
        },
      }
    );
  }),

  // GET /api/auth/me - Get current user
  // In MSW mode, always return an authenticated user (simplified for development/testing)
  // Returns new format: { isAuthenticated: boolean, userId?, email?, roles? }
  // Also sets auth_token cookie so subsequent requests (e.g. DELETE locations) are authorized
  http.get(`${API_BASE_URL}/auth/me`, () => {
    const userId = "msw_user_1";
    const token = generateMockToken(userId);
    const maxAge = 60 * 60 * 24 * 7; // 7 days
    const cookieOptions = [
      `auth_token=${token}`,
      `Max-Age=${maxAge}`,
      "Path=/",
      "HttpOnly",
      "Secure",
      "SameSite=None",
    ].join("; ");

    return HttpResponse.json(
      {
        isAuthenticated: true,
        userId,
        email: "msw@test.com",
        roles: ["SuperUser", "Admin"], // Mock roles - in real implementation, this comes from Cognito groups
      },
      {
        status: 200,
        headers: {
          "Set-Cookie": cookieOptions,
        },
      }
    );
  }),

  // GET /catalog/service-types - list service types for supplier form
  http.get(`${API_BASE_URL}/catalog/service-types`, () => {
    const mockServiceTypes = [
      {
        id: "14eeea9e-603e-41da-b77d-3c745e1e5da9",
        code: 1,
        name: "ACCOMMODATION",
        displayName: "Accommodation",
        description: "Lodging and accommodation services",
      },
      {
        id: "047a5ae2-c3ed-4d6e-9f93-d42e1ff57f7a",
        code: 2,
        name: "ACTIVITY",
        displayName: "Activity",
        description: "Tours, activities and experiences",
      },
      {
        id: "a5d4151d-d125-4fca-af9d-3e05f5699d5c",
        code: 5,
        name: "FLIGHT",
        displayName: "Flight",
        description: "Air travel and flight services",
      },
      {
        id: "ad54d130-a599-4cef-8602-2f6ab1cb6322",
        code: 3,
        name: "OTHER",
        displayName: "Other",
        description: "Other service types",
      },
      {
        id: "aff9c2d3-cdf2-4100-b9d2-dcf238265c96",
        code: 4,
        name: "TRANSPORTATION",
        displayName: "Transportation",
        description: "Ground and other transport services",
      },
      {
        id: "c7b8a9d0-e1f2-3456-7890-abcdef123456",
        code: 6,
        name: "FEE",
        displayName: "Fee",
        description: "Fee-based services",
      },
    ];
    return HttpResponse.json(mockServiceTypes, { status: 200 });
  }),

  // GET /catalog/source-markets - list source markets for agency form
  http.get(`${API_BASE_URL}/catalog/source-markets`, () => {
    const mockSourceMarkets = [
      { id: "uk", name: "UK", taxCode: "GB-VAT", code: "UK", isActive: true },
      { id: "fit", name: "FIT", taxCode: "FIT", code: "FIT", isActive: true },
      { id: "af", name: "AF", taxCode: "AF", code: "AF", isActive: true },
      { id: "as", name: "AS", taxCode: "AS", code: "AS", isActive: true },
    ];
    return HttpResponse.json(mockSourceMarkets, { status: 200 });
  }),

  http.get(`${API_BASE_URL}/catalog/agencies`, getAgencies),
  http.post(`${API_BASE_URL}/catalog/agencies`, createAgency),
  http.get(`${API_BASE_URL}/catalog/agencies/:id`, ({ params }) => {
    const id = typeof params.id === "string" ? params.id : params.id?.[0];
    if (!id) {
      return HttpResponse.json(
        { success: false, data: null, error: "Agency not found" },
        { status: 404 }
      );
    }
    const agency = getAgencyByIdData(id);
    if (!agency) {
      return HttpResponse.json(
        { success: false, data: null, error: "Agency not found" },
        { status: 404 }
      );
    }
    const catalogAgents = getAgentsByAgencyName(agency.name);
    const agents = catalogAgents.map((a) => ({
      id: a.id,
      firstName: a.firstName,
      lastName: a.lastName,
      primaryEmail: a.primaryEmail,
      phoneNumber: a.phone,
      agencyId: a.agencyId,
      agencyName: a.agencyName,
      agencyGroups: agency.agencyGroups ?? [],
      assignedSafariPlannerId: a.assignedSafariPlannerId ?? "",
      assignedSafariPlannerName: a.assignedSafariPlannerName ?? "",
      isActive: a.status === "Active",
      alternateEmail: a.alternateEmail,
      language: a.language,
      notes: a.notes,
      currency: a.currency,
    }));
    return HttpResponse.json(
      { success: true, data: { ...agency, agents }, error: null },
      { status: 200 }
    );
  }),
  http.put(`${API_BASE_URL}/catalog/agencies`, ({ request }) =>
    putUpdateAgency({ request })
  ),
  http.patch(`${API_BASE_URL}/catalog/agencies/:id`, (info) =>
    updateAgency({
      params: { id: String(info.params.id ?? info.params["id"]) },
      request: info.request,
    })
  ),
  http.patch(`${API_BASE_URL}/catalog/agencies/:id/activate`, activateAgency),
  http.patch(
    `${API_BASE_URL}/catalog/agencies/:id/deactivate`,
    deactivateAgency
  ),
  http.delete(`${API_BASE_URL}/catalog/agencies/:id`, deleteAgency),
  ...agentRoutes(API_BASE_URL),
  ...supplierRoutes(API_BASE_URL),
  ...supplierHeadOfficeRoutes(API_BASE_URL),
  ...agencyGroupRoutes(API_BASE_URL),
  ...contentBlocksRoutes(API_BASE_URL),
  ...documentTemplatesRoutes(API_BASE_URL),
  ...safariPlannerRoutes(API_BASE_URL),
  ...promotionRoutes(API_BASE_URL),
  ...supplierServicesRoutes(API_BASE_URL),
  ...catalogExtrasRoutes(API_BASE_URL),
  ...commissionRoutes(API_BASE_URL),
  ...marginRulesRoutes(API_BASE_URL),
  ...futureUpliftRoutes(API_BASE_URL),
  ...supplierContractRoutes(API_BASE_URL),
  ...supplierPaxTypeScheduleRoutes(API_BASE_URL),
  ...serviceEligibilityRoutes(API_BASE_URL),
  ...serviceOptionRatePlansRoutes(API_BASE_URL),
  ...serviceOptionRatesRoutes(API_BASE_URL),
  ...serviceRatesRoutes(API_BASE_URL),
  ...serviceOptionsRoutes(API_BASE_URL),
  ...itinerariesRoutes(API_BASE_URL),
];
