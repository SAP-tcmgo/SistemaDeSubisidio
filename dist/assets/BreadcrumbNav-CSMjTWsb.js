import{j as e,u as g,r as c,ai as u,aj as j,S as v,L as m}from"./vendor-others-Di0KkQDI.js";import{c as o}from"./main-Csx-NwpM.js";import{H as y,j as N,k,l as C,m as w,f as B,n as I}from"./vendor-lucide-DmcWVqu_.js";const R=({icon:a,label:r,onClick:s,className:n,variant:t="primary",size:i=20})=>{const b={primary:"text-[#004B8D] hover:text-[#004B8D]/80",secondary:"text-[#C9991F] hover:text-[#C9991F]/80"};return e.jsxs("div",{className:"flex flex-col items-center gap-2 hover-pulse transition-all duration-300",onClick:s,children:[e.jsx("div",{className:o("glass-icon icon-glow flex items-center justify-center p-3 w-12 h-12",b[t],n),children:e.jsx(a,{size:i,className:"cursor-pointer mr-[-15px] transition-transform duration-300 ease-in-out"})}),r&&e.jsx("span",{className:"mt-[-15px] mr-[-15px] text-xs font-medium text-muted-foreground",children:r})]})},L=({icons:a,className:r,size:s})=>e.jsx("div",{className:o("flex justify-end gap-4",r),children:a.map((n,t)=>e.jsx(R,{icon:n.icon,label:n.label,onClick:n.onClick,variant:n.variant||(t%2===0?"primary":"secondary"),size:s},t))}),D=({onEraseClick:a,onSaveClick:r,onBackClick:s,onNextClick:n})=>{const t=g();return e.jsx("div",{className:"Icons=theme flex flex-col mb-6",children:e.jsx(L,{icons:[{icon:y,label:"Início",variant:"primary",onClick:()=>t("/telaInicial")},{icon:N,label:"Apagar",variant:"secondary",onClick:a},{icon:k,label:"Salvar",variant:"primary",onClick:r},{icon:C,label:"Anterior",variant:"secondary",onClick:s},{icon:w,label:"Próximo",variant:"primary",onClick:n}],className:"self-end text-xs"})})},S=c.forwardRef(({className:a,...r},s)=>e.jsx(u,{ref:s,className:o("peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",a),...r,children:e.jsx(j,{className:o("flex items-center justify-center text-current"),children:e.jsx(B,{className:"h-4 w-4"})})}));S.displayName=u.displayName;const x=c.forwardRef(({...a},r)=>e.jsx("nav",{ref:r,"aria-label":"breadcrumb",...a}));x.displayName="Breadcrumb";const p=c.forwardRef(({className:a,children:r,...s},n)=>e.jsx("ol",{ref:n,className:o("flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",a),children:r}));p.displayName="BreadcrumbList";const f=c.forwardRef(({className:a,...r},s)=>e.jsx("li",{ref:s,className:o("inline-flex items-center gap-1.5",a),...r}));f.displayName="BreadcrumbItem";const d=c.forwardRef(({asChild:a,className:r,...s},n)=>{const t=a?v:"a";return e.jsx(t,{ref:n,className:o("transition-colors hover:text-foreground",r),...s})});d.displayName="BreadcrumbLink";const A=c.forwardRef(({className:a,...r},s)=>e.jsx("span",{ref:s,role:"link","aria-disabled":"true","aria-current":"page",className:o("font-normal text-foreground",a),...r}));A.displayName="BreadcrumbPage";const h=({children:a,className:r,...s})=>e.jsx("span",{role:"presentation","aria-hidden":"true",className:o("inline-block [&>svg]:size-3.5",r),...s,children:a??e.jsx(I,{})});h.displayName="BreadcrumbSeparator";const l=[{name:"Município e Responsáveis",path:"/MunicipioEResponsaveis"},{name:"Tratamento Leis",path:"/TratamentoLeis"},{name:"Fixação",path:"/Fixacao"}],G=({currentPage:a,sidebarOpen:r,...s})=>{const n=l.findIndex(t=>t.name===a);return e.jsx("div",{className:o("flex justify-center px-4 py-3 transition-all duration-300"),children:e.jsx(x,{children:e.jsx(p,{children:l.map((t,i)=>e.jsxs(f,{children:[i<n?e.jsx(d,{asChild:!0,children:e.jsx(m,{to:t.path,className:"text-muted-foreground hover:text-foreground",children:t.name})}):e.jsx(d,{asChild:!0,children:e.jsx(m,{to:t.path,className:o("hover:text-foreground",i===n?"font-semibold text-foreground":"text-muted-foreground"),"aria-current":i===n?"page":void 0,children:t.name})}),i<l.length-1&&e.jsx(h,{})]},i))})})})};export{G as B,S as C,D as I};
