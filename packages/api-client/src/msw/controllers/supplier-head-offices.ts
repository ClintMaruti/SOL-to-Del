import { http, HttpResponse } from "msw";

type MockSupplierHeadOffice = {
  id: string;
  name: string;
  email: string;
  phone: string;
  additionalEmail: string | null;
  website: string | null;
  country: string | null;
  city: string | null;
  postalCode: string | null;
  streetAddress: string | null;
  isActive: boolean;
  suppliersCount: number;
};

const mockSupplierHeadOffices: MockSupplierHeadOffice[] = [
  {
    id: "sho-1",
    name: "Elewana Collection",
    email: "info.elewana@elewana.com",
    phone: "+1 23-555-901-2345",
    additionalEmail: "reservations@elewana.com",
    website: "https://www.elewanacollection.com",
    country: "Tanzania",
    city: "Arusha",
    postalCode: "23100",
    streetAddress: "Plot 45, Serengeti Road",
    isActive: true,
    suppliersCount: 12,
  },
  {
    id: "sho-2",
    name: "Serengeti Safari",
    email: "info.serengeti@serengeti.com",
    phone: "+1 23-555-123-4567",
    additionalEmail: null,
    website: "https://www.serengetisafari.com",
    country: "Tanzania",
    city: "Arusha",
    postalCode: "23101",
    streetAddress: "12 Safari Avenue",
    isActive: true,
    suppliersCount: 0,
  },
  {
    id: "sho-3",
    name: "Kilimanjaro Treks",
    email: "info.kilimanjaro@kilimanjaro.com",
    phone: "+1 23-555-234-5678",
    additionalEmail: "bookings@kilimanjaro.com",
    website: "https://www.kilimanjarotreks.com",
    country: "Tanzania",
    city: "Moshi",
    postalCode: null,
    streetAddress: "8 Uhuru Street",
    isActive: true,
    suppliersCount: 2,
  },
  {
    id: "sho-4",
    name: "Ngorongoro Adventures",
    email: "info.ngorongoro@ngorongoro.com",
    phone: "+1 23-555-345-6789",
    additionalEmail: null,
    website: "https://www.ngorongoroadventures.com",
    country: "Tanzania",
    city: "Karatu",
    postalCode: null,
    streetAddress: "Crater Road",
    isActive: true,
    suppliersCount: 3,
  },
  {
    id: "sho-5",
    name: "Tarangire Escapes",
    email: "info.tarangire@tarangire.com",
    phone: "+1 23-555-456-7890",
    additionalEmail: "sales@tarangire.com",
    website: "https://www.tarangireescapes.com",
    country: "Tanzania",
    city: "Arusha",
    postalCode: "23102",
    streetAddress: "15 Tarangire Lane",
    isActive: true,
    suppliersCount: 7,
  },
  {
    id: "sho-6",
    name: "Lake Manyara Tours",
    email: "info.manyara@manyara.com",
    phone: "+1 23-555-567-8901",
    additionalEmail: null,
    website: null,
    country: "Tanzania",
    city: "Mto wa Mbu",
    postalCode: null,
    streetAddress: null,
    isActive: false,
    suppliersCount: 1,
  },
  {
    id: "sho-7",
    name: "Ruaha Expeditions",
    email: "info.ruaha@ruaha.com",
    phone: "+1 23-555-678-9012",
    additionalEmail: null,
    website: "https://www.ruahaexpeditions.com",
    country: "Tanzania",
    city: "Iringa",
    postalCode: null,
    streetAddress: "22 Iringa Road",
    isActive: false,
    suppliersCount: 4,
  },
  {
    id: "sho-8",
    name: "Katavi Safaris",
    email: "info.katavi@katavi.com",
    phone: "+1 23-555-789-0123",
    additionalEmail: "tours@katavi.com",
    website: null,
    country: "Tanzania",
    city: "Mpanda",
    postalCode: null,
    streetAddress: null,
    isActive: false,
    suppliersCount: 9,
  },
  {
    id: "sho-9",
    name: "Mikumi Adventures",
    email: "info.mikumi@mikumi.com",
    phone: "+1 23-555-890-1234",
    additionalEmail: null,
    website: "https://www.mikumiadventures.com",
    country: "Tanzania",
    city: "Morogoro",
    postalCode: "67100",
    streetAddress: "5 Mikumi Drive",
    isActive: false,
    suppliersCount: 6,
  },
  {
    id: "sho-10",
    name: "Gombe Chimpanzee Treks",
    email: "info.gombe@gombe.com",
    phone: "+1 23-555-901-2345",
    additionalEmail: null,
    website: "https://www.gombechimptreks.com",
    country: "Tanzania",
    city: "Kigoma",
    postalCode: null,
    streetAddress: "Lake Tanganyika Road",
    isActive: false,
    suppliersCount: 10,
  },
];

// GET /catalog/head-offices - Fetch all supplier head offices
export const getSupplierHeadOffices = () => {
  return HttpResponse.json(mockSupplierHeadOffices, { status: 200 });
};

// GET /catalog/head-offices/:id - Fetch a single supplier head office
const getSupplierHeadOfficeById = ({ params }: { params: { id: string } }) => {
  const { id } = params;
  const headOffice = mockSupplierHeadOffices.find((s) => s.id === id);
  if (!headOffice) {
    return HttpResponse.json(
      { success: false, data: null, error: "Supplier head office not found" },
      { status: 404 }
    );
  }
  return HttpResponse.json(headOffice, { status: 200 });
};

const activateSupplierHeadOffice = ({ params }: { params: { id: string } }) => {
  const { id } = params;
  const supplierHeadOfficeIndex = mockSupplierHeadOffices.findIndex(
    (s) => s.id === id
  );
  if (supplierHeadOfficeIndex === -1) {
    return HttpResponse.json(
      { success: false, data: null, error: "Supplier head office not found" },
      { status: 404 }
    );
  }
  mockSupplierHeadOffices[supplierHeadOfficeIndex].isActive = true;
  return HttpResponse.json(
    {
      success: true,
      data: mockSupplierHeadOffices[supplierHeadOfficeIndex],
      error: null,
    },
    { status: 200 }
  );
};

const deactivateSupplierHeadOffice = ({
  params,
}: {
  params: { id: string };
}) => {
  const { id } = params;
  const supplierHeadOfficeIndex = mockSupplierHeadOffices.findIndex(
    (s) => s.id === id
  );
  if (supplierHeadOfficeIndex === -1) {
    return HttpResponse.json(
      { success: false, data: null, error: "Supplier head office not found" },
      { status: 404 }
    );
  }
  mockSupplierHeadOffices[supplierHeadOfficeIndex].isActive = false;
  return HttpResponse.json(
    {
      success: true,
      data: mockSupplierHeadOffices[supplierHeadOfficeIndex],
      error: null,
    },
    { status: 200 }
  );
};

const updateSupplierHeadOffice = async (info: {
  params: { id?: string };
  request: Request;
}) => {
  const id = String(info.params.id ?? info.params["id"] ?? "");
  const index = mockSupplierHeadOffices.findIndex((s) => s.id === id);
  if (index === -1) {
    return HttpResponse.json(
      { success: false, data: null, error: "Supplier head office not found" },
      { status: 404 }
    );
  }
  const body = (await info.request.json()) as Partial<MockSupplierHeadOffice>;
  const updated = {
    ...mockSupplierHeadOffices[index],
    ...body,
    id: mockSupplierHeadOffices[index].id,
    isActive:
      body.isActive !== undefined
        ? body.isActive
        : mockSupplierHeadOffices[index].isActive,
    suppliersCount: mockSupplierHeadOffices[index].suppliersCount,
  };
  mockSupplierHeadOffices[index] = updated;
  return HttpResponse.json(updated, { status: 200 });
};

const deleteSupplierHeadOffice = ({ params }: { params: { id: string } }) => {
  const { id } = params;
  const supplierHeadOfficeIndex = mockSupplierHeadOffices.findIndex(
    (s) => s.id === id
  );
  if (supplierHeadOfficeIndex === -1) {
    return HttpResponse.json(
      { success: false, data: null, error: "Supplier head office not found" },
      { status: 404 }
    );
  }
  mockSupplierHeadOffices.splice(supplierHeadOfficeIndex, 1);
  return HttpResponse.json(
    { success: true, data: null, error: null },
    { status: 200 }
  );
};

/** All supplier-head-office MSW route handlers. Use in handlers.ts: ...supplierHeadOfficeRoutes(API_BASE_URL) */
export const supplierHeadOfficeRoutes = (API_BASE_URL: string) => [
  http.get(`${API_BASE_URL}/catalog/head-offices`, getSupplierHeadOffices),
  http.get(
    `${API_BASE_URL}/catalog/head-offices/:id`,
    getSupplierHeadOfficeById
  ),
  http.patch(
    `${API_BASE_URL}/catalog/head-offices/:id`,
    updateSupplierHeadOffice
  ),
  http.patch(
    `${API_BASE_URL}/catalog/head-offices/:id/deactivate`,
    deactivateSupplierHeadOffice
  ),
  http.patch(
    `${API_BASE_URL}/catalog/head-offices/:id/activate`,
    activateSupplierHeadOffice
  ),
  http.delete(
    `${API_BASE_URL}/catalog/head-offices/:id`,
    deleteSupplierHeadOffice
  ),
];
