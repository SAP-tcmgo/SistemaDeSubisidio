import{j as e,n as o,r,u as h,F as b}from"./vendor-others-Di0KkQDI.js";import{S as j,H as N}from"./Sidebar-BZGUXzy7.js";/* empty css                                    */import{b as y}from"./main-ByvVTPME.js";import"./vendor-firebase-DUe4cX6Q.js";import"./vendor-lucide-DmcWVqu_.js";import"./vendor-react-query-De-ebuA0.js";const f=()=>e.jsx("div",{className:"mb-8",children:e.jsx(o.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{duration:.5},className:"tribunal-card bg-gradient-to-r from-tribunal-blue to-tribunal-blue/90 text-white",children:e.jsxs("div",{className:"flex flex-col md:flex-row items-start md:items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold mb-2",children:"Bem-vindo ao SIAAP Subsídios"}),e.jsx("p",{className:"text-blue-100",children:"Tribunal de Contas dos Municípios do Estado de Goiás"})]}),e.jsx("button",{className:"tribunal-button mt-4 md:mt-0",children:"Acessar painel"})]})})}),E=()=>{const[a,t]=r.useState(!1),[s,l]=r.useState(""),{setNumeroProcesso:c,loadAnaliseData:d}=y(),i=h(),m=p=>{l(p.target.value)},n=async()=>{s?(c(s),await d(s),i(`/MunicipioEResponsaveis?NrProcesso=${s}`)):console.warn("Número do processo não inserido.")},u=async()=>{i("/CadastroADM")},x=()=>{t(!a)};return e.jsx("div",{className:"dashboard-theme",children:e.jsxs("div",{className:"min-h-screen bg-gray-50",children:[e.jsx(j,{isOpen:a,setIsOpen:t}),e.jsxs("div",{className:`transition-all duration-300 ${a?"ml-64":"ml-0"}`,children:[e.jsx(N,{toggleSidebar:x}),e.jsxs("main",{className:"p-4 md:p-6",children:[e.jsx(f,{}),e.jsx(o.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{duration:.5,delay:.5},className:"flex items-center justify-center mx-auto !important",children:e.jsxs("div",{className:"tribunal-card",children:[e.jsx("h2",{className:"text-xl font-bold text-gray-800 mb-6 text-center",children:"Processos"}),e.jsxs("div",{className:"flex",children:[e.jsxs("div",{className:"w-1/2 pr-4",children:[e.jsxs("div",{className:"mb-4 relative",children:[e.jsx("input",{type:"text",placeholder:"Número do Processo (nnnnn/aa)",value:s,onChange:m,className:"w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"}),e.jsx("div",{className:"absolute inset-y-0 right-3 flex items-center",children:e.jsx(b,{className:"h-5 w-5 text-gray-400 opacity-70"})})]}),e.jsx("a",{href:"#",className:"mt-3 block text-sm text-blue-600 hover:underline",children:"Processo não analisado pela SECEX Pessoal"})]}),e.jsx("div",{className:"w-1/2 pl-4",children:e.jsxs("div",{className:"space-y-3",children:[e.jsx("button",{className:"tribunal-button w-full justify-center",onClick:n,children:"Iniciar ou Editar"}),e.jsx("button",{className:"tribunal-button-secondary w-full justify-center",onClick:n,children:"Consultar"}),e.jsx("button",{className:"bg-white border border-gray-200 text-gray-700 font-medium py-2 px-6 rounded-md w-full transition-all duration-300 hover:bg-gray-50",onClick:u,children:"Administrador"})]})})]})]})}),e.jsx("footer",{className:"mt-8 text-center text-gray-500 text-sm py-4",children:e.jsx("p",{children:"Secretaria de Atos de Pessoal © 2025"})})]})]})]})})};export{E as default};
