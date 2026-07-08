import { create } from "zustand";

interface LoadingStates {
  agentsStatus: {
    [key: string]: boolean;
  };
  agenciesStatus: {
    [key: string]: boolean;
  };
  suppliersStatus: {
    [key: string]: boolean;
  };
  supplierHeadOfficesStatus: {
    [key: string]: boolean;
  };
  supplierContractsStatus: {
    [key: string]: boolean;
  };
  supplierServicesStatus: {
    [key: string]: boolean;
  };
  promotionsStatus: {
    [key: string]: boolean;
  };
  closeoutsStatus: {
    [key: string]: boolean;
  };
  policiesStatus: {
    [key: string]: boolean;
  };
  extrasStatus: {
    [key: string]: boolean;
  };
  setAgentsStatus: (key: string, value: boolean) => void;
  setAgenciesStatus: (key: string, value: boolean) => void;
  setSuppliersStatus: (key: string, value: boolean) => void;
  setSupplierHeadOfficesStatus: (key: string, value: boolean) => void;
  setSupplierContractsStatus: (key: string, value: boolean) => void;
  setSupplierServicesStatus: (key: string, value: boolean) => void;
  setPromotionsStatus: (key: string, value: boolean) => void;
  setCloseoutsStatus: (key: string, value: boolean) => void;
  setPoliciesStatus: (key: string, value: boolean) => void;
  setExtrasStatus: (key: string, value: boolean) => void;
}

export const useLoadingStates = create<LoadingStates>((set) => ({
  agentsStatus: {},
  agenciesStatus: {},
  suppliersStatus: {},
  supplierHeadOfficesStatus: {},
  supplierContractsStatus: {},
  supplierServicesStatus: {},
  promotionsStatus: {},
  closeoutsStatus: {},
  policiesStatus: {},
  extrasStatus: {},
  setAgentsStatus: (key: string, value: boolean) => {
    set((state) => ({
      agentsStatus: { ...state.agentsStatus, [key]: value },
    }));
  },
  setAgenciesStatus: (key: string, value: boolean) => {
    set((state) => ({
      agenciesStatus: { ...state.agenciesStatus, [key]: value },
    }));
  },
  setSuppliersStatus: (key: string, value: boolean) => {
    set((state) => ({
      suppliersStatus: { ...state.suppliersStatus, [key]: value },
    }));
  },
  setSupplierHeadOfficesStatus: (key: string, value: boolean) => {
    set((state) => ({
      supplierHeadOfficesStatus: {
        ...state.supplierHeadOfficesStatus,
        [key]: value,
      },
    }));
  },
  setSupplierContractsStatus: (key: string, value: boolean) => {
    set((state) => ({
      supplierContractsStatus: {
        ...state.supplierContractsStatus,
        [key]: value,
      },
    }));
  },
  setSupplierServicesStatus: (key: string, value: boolean) => {
    set((state) => ({
      supplierServicesStatus: {
        ...state.supplierServicesStatus,
        [key]: value,
      },
    }));
  },
  setPromotionsStatus: (key: string, value: boolean) => {
    set((state) => ({
      promotionsStatus: {
        ...state.promotionsStatus,
        [key]: value,
      },
    }));
  },
  setCloseoutsStatus: (key: string, value: boolean) => {
    set((state) => ({
      closeoutsStatus: {
        ...state.closeoutsStatus,
        [key]: value,
      },
    }));
  },
  setPoliciesStatus: (key: string, value: boolean) => {
    set((state) => ({
      policiesStatus: {
        ...state.policiesStatus,
        [key]: value,
      },
    }));
  },
  setExtrasStatus: (key: string, value: boolean) => {
    set((state) => ({
      extrasStatus: {
        ...state.extrasStatus,
        [key]: value,
      },
    }));
  },
}));
