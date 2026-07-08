import{d as i,l as e,s}from"./FormMessage-OCeNgdDp.js";function o(r){const t=r.trim();if(!t)return!0;try{const n=t.includes("://")?t:`https://${t}`;return new URL(n),!0}catch{return!1}}function u(r){return i([e(""),s().trim().refine(t=>!t||o(t),{message:r})])}export{o as i,u as o};
//# sourceMappingURL=url-C52k2b8O.js.map
