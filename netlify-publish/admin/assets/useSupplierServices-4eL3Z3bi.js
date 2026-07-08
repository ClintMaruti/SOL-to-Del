import{a}from"./index-4ewCJrNr.js";import{u as s}from"./error-utils-q4z9blzD.js";function i(e){return s({queryKey:["supplier-services",e],queryFn:async()=>{const r=await a.get(`/catalog/suppliers/${e}/services`);return Array.isArray(r)?r:[]},enabled:!!e})}export{i as u};
//# sourceMappingURL=useSupplierServices-4eL3Z3bi.js.map
