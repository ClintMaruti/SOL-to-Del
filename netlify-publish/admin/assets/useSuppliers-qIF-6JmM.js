import{a as u}from"./index-4ewCJrNr.js";import{u as a}from"./error-utils-q4z9blzD.js";function e(r){return a({queryKey:r?["suppliers",r]:["suppliers"],queryFn:async()=>{const s=await u.get(`/catalog/suppliers${r?`?headOfficeId=${r}`:""}`);return Array.isArray(s)?s:[]}})}export{e as u};
//# sourceMappingURL=useSuppliers-qIF-6JmM.js.map
