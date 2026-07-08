import{a as t}from"./index-4ewCJrNr.js";import{u as e}from"./error-utils-q4z9blzD.js";function n(r){return e({queryKey:r?["agents",r]:["agents"],queryFn:async()=>{const a=await t.get(`/catalog/agents${r?`?agencyId=${r}`:""}`);return Array.isArray(a)?a:[]}})}export{n as u};
//# sourceMappingURL=useAgents-B0WcRnfU.js.map
