import React, { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, PlusCircle, ArrowLeft, RefreshCw, Filter, FileSpreadsheet } from "lucide-react"; // Added icons
import { useNavigate } from 'react-router-dom';
import { db, collection, getDocs } from "../firebase"; // Import Firebase functions (removed unused serverTimestamp)
import { query, orderBy, where, Timestamp } from "firebase/firestore"; // Added Timestamp
import '../styles/AppConfiguracoesDashboard.css';
import '../styles/indexConfiguracoesDashboard.css';
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // Added Table components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"; // Added Dialog components
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet"; // Added Sheet components
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Added Select components
import { ScrollArea } from '@/components/ui/scroll-area'; // Added ScrollArea for dialog
import { useToast } from "@/components/ui/use-toast";
import { CheckedState } from "@radix-ui/react-checkbox"; // Importa tipo para estado do checkbox
import * as XLSX from 'xlsx'; // Importa a biblioteca para manipulação de arquivos Excel
import * as FileSaver from 'file-saver'; // Importa a biblioteca para salvar arquivos no cliente

// Interface for Municipio data structure from Firebase
interface MunicipioData {
  id: string; // Firebase document ID
  ID_Municipio: string;
  ID_IBGE: string;
  Municipio: string; // Nome original do SICOM/SharePoint
  Municipio_IBGE: string; // Nome do IBGE para exibição
  // Adicionar outros campos se necessário (ex: CNPJ)
}

// Interface para dados de Leis (baseado em Fixacao.tsx e outras necessidades da consulta)
interface LeiGenerica {
  id: string; // ID do documento Firebase
  ID_Migracao?: string; // ID original do SharePoint (se migrado)
  ID?: string;
  ID_Espelho?: string;
  ID_Municipio: string; // Used for filtering
  Municipio?: string;
  Num_Lei?: number;
  Ano_Lei?: number;
  Mes_Data_Base?: string;
  Indice_Correcao?: string;
  Num_Processo?: number;
  Ano_Processo?: number;
  Data_Inicial?: string | Timestamp; // ISO string or Firestore Timestamp
  Data_Final?: string | Timestamp; // ISO string or Firestore Timestamp
  Anotacao?: string;
  Situacao?: string;
  Conclusao?: string;
  Historico_Atualizacao?: string;
  Criado_por?: string;
  Modificado?: Timestamp; // Timestamp do Firestore
  Modificado_por?: string;
  Legislatura?: string; // Adicionado para leis de fixação/revisão
  Cargo?: string; // Adicionado para leis de fixação/revisão
  Subsidio?: number; // Adicionado para leis de fixação/revisão (valor numérico)
}

// Helper: Formata Timestamp do Firestore ou string de data para DD/MM/YYYY
const formatDate = (dateInput: string | Timestamp | undefined | null): string => {
  if (!dateInput) return '-'; // Retorna '-' se a entrada for nula ou indefinida
  let date: Date | null = null;

  // Se for um Timestamp do Firestore, converte para Date
  if (dateInput instanceof Timestamp) {
    date = dateInput.toDate();
  // Se for uma string, tenta converter para Date
  } else if (typeof dateInput === 'string') {
    try {
      date = new Date(dateInput); // Tenta parsear como ISO 8601 ou formato reconhecido pelo JS
      // Verifica se a data resultante é válida
      if (isNaN(date.getTime())) {
        // Se inválida, tenta parsear como DD/MM/YYYY (formato comum de entrada manual)
        const parts = dateInput.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // Mês é 0-indexado no objeto Date
          const year = parseInt(parts[2], 10);
          // Verifica se as partes são números válidos
          if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            date = new Date(Date.UTC(year, month, day)); // Usa UTC para evitar problemas de fuso horário na data
            if (isNaN(date.getTime())) date = null; // Ainda inválida após tentativa DD/MM/YYYY
          } else {
             date = null; // Partes inválidas
          }
        } else {
           date = null; // Não está no formato DD/MM/YYYY
        }
      }
    } catch (e) {
      console.error("Erro ao parsear string de data:", dateInput, e);
      date = null; // Erro durante o parse
    }
  }

  // Se a data é válida, formata para DD/MM/YYYY
  if (date && !isNaN(date.getTime())) {
    // Usa métodos UTC para garantir que a data não seja alterada pelo fuso horário local
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Adiciona 1 ao mês (0-indexado)
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }
  return '-'; // Retorna '-' se a data for inválida ou nula
};

// --- Funções Auxiliares para Exportação Excel ---

// Converte um array de dados (objetos) em uma planilha Excel (Worksheet)
const dataToWorksheet = (data: any[], header?: string[]): XLSX.WorkSheet => {
  // Garante que 'data' seja um array antes de processar
  const dataArray = Array.isArray(data) ? data : [];
  // Define o cabeçalho: usa o header fornecido ou extrai as chaves do primeiro objeto
  const headerRow = header ?? (dataArray.length > 0 && typeof dataArray[0] === 'object' && dataArray[0] !== null ? Object.keys(dataArray[0]) : []);

  // Mapeia os dados para um formato de Array de Arrays (AoA), necessário pelo xlsx.utils.aoa_to_sheet
  const aoaData = dataArray.map(item => {
    if (typeof item === 'object' && item !== null) {
      // Se um cabeçalho foi fornecido, mapeia os valores na ordem do cabeçalho
      if (header) {
        return header.map(key => {
          const value = item[key];
          // Formata valores de data (Timestamp ou Date) usando a função formatDate
          if (value instanceof Timestamp) {
            return formatDate(value);
          } else if (value instanceof Date) {
            return formatDate(value.toISOString()); // Converte Date para string ISO antes de formatar
          }
          return value ?? ''; // Retorna string vazia para valores nulos/indefinidos
        });
      } else {
        // Se não houver cabeçalho, mapeia os valores na ordem das chaves do objeto
        return Object.values(item).map(value => {
           if (value instanceof Timestamp) {
             return formatDate(value);
           } else if (value instanceof Date) {
             return formatDate(value.toISOString());
           }
           return value ?? '';
        });
      }
    }
    return [item]; // Trata itens que não são objetos (caso ocorra)
  });

  // Cria a planilha usando aoa_to_sheet, incluindo a linha de cabeçalho
  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...aoaData]);

  // Opcional: Ajusta automaticamente a largura das colunas (implementação básica)
  const colWidths = headerRow.map((_, i) => ({
    wch: Math.max(
      headerRow[i]?.length || 0, // Comprimento do cabeçalho
      ...aoaData.map(row => String(row[i] ?? '').length) // Comprimento máximo dos dados na coluna
    ) + 2 // Adiciona um pequeno espaçamento
  }));
  ws['!cols'] = colWidths; // Define as larguras das colunas na planilha

  return ws; // Retorna a planilha criada
};

// Salva os dados (organizados por nome de planilha) como um arquivo Excel (.xlsx)
const saveAsExcelFile = (data: {[key: string]: any[]}, filename: string) => {
  try {
    // Cria um novo Workbook (arquivo Excel)
    const wb = XLSX.utils.book_new();

    // Itera sobre cada entrada no objeto 'data' (cada chave é um nome de planilha)
    for (const sheetName in data) {
      // Verifica se os dados para a planilha são válidos (array não vazio)
      if (Array.isArray(data[sheetName]) && data[sheetName].length > 0) {
        // Define cabeçalhos mais amigáveis com base no nome da planilha (ajuste conforme necessário)
        let headers: string[] = [];
        if (sheetName === 'Leis Inflacionárias') {
          headers = ['Número da Lei', 'Ano da Lei', 'Índice de Correção', 'Mês Data Base', 'Data Inicial', 'Data Final', 'Anotação'];
        } else if (sheetName === 'Leis de Fixação' || sheetName === 'Leis de Revisão') {
          // Cabeçalhos para leis de fixação e revisão
          headers = ['Legislatura', 'Número da Lei', 'Ano da Lei', 'Cargo', 'Subsídio', 'Número Processo', 'Ano Processo', 'Situação', 'Conclusão', 'Anotação'];
        } else {
          // Fallback: Usa as chaves do primeiro objeto se os cabeçalhos não estiverem predefinidos
          headers = Object.keys(data[sheetName][0] || {});
        }

        // Mapeia os dados para garantir que as chaves correspondam aos cabeçalhos definidos
        const dataForSheet = data[sheetName].map(item => {
          const mappedItem: { [key: string]: any } = {};
          headers.forEach(header => {
            // Encontra a chave correspondente no item original (tratando variações como Num_Lei/Número da Lei)
            let itemKey = '';
            if (header === 'Número da Lei') itemKey = 'Num_Lei';
            else if (header === 'Ano da Lei') itemKey = 'Ano_Lei';
            else if (header === 'Índice de Correção') itemKey = 'Indice_Correcao';
            else if (header === 'Mês Data Base') itemKey = 'Mes_Data_Base';
            else if (header === 'Data Inicial') itemKey = 'Data_Inicial';
            else if (header === 'Data Final') itemKey = 'Data_Final';
            else if (header === 'Número Processo') itemKey = 'Num_Processo';
            else if (header === 'Ano Processo') itemKey = 'Ano_Processo';
            else itemKey = header; // Assume correspondência direta para outros (Legislatura, Cargo, etc.)

            // Tenta obter o valor usando a chave mapeada, a chave do cabeçalho ou uma versão com underscores
            mappedItem[header] = item[itemKey] ?? item[header.replace(/ /g, '_')] ?? ''; // Fallback para string vazia
          });
          return mappedItem;
        });

        // Cria a planilha (Worksheet) com os dados mapeados e cabeçalhos
        const ws = dataToWorksheet(dataForSheet, headers);
        // Adiciona a planilha ao Workbook
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      } else {
         console.warn(`Pulando planilha vazia ou com dados inválidos: ${sheetName}`);
         // Opcional: Criar uma planilha vazia indicando a ausência de dados
         // const ws = XLSX.utils.aoa_to_sheet([[`Dados para ${sheetName} não disponíveis`]]);
         // XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }
    }

    // Verifica se alguma planilha foi adicionada antes de tentar salvar
    if (wb.SheetNames.length === 0) {
       console.error("Nenhuma planilha foi adicionada ao arquivo Excel. Verifique os dados de entrada.");
       return; // Impede o salvamento de um arquivo vazio
    }

    // Gera o output do Workbook como um array de bytes
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    // Cria um Blob (objeto binário) a partir do array de bytes
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    // Usa FileSaver para iniciar o download do arquivo no navegador do usuário
    FileSaver.saveAs(blob, filename + '.xlsx');
  } catch (error) {
     console.error("Erro ao gerar arquivo Excel:", error);
  }
};


// --- Componente Principal ---

const ConsultaAnotacao = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast(); // Hook para exibir notificações

  // Estado local para a busca de municípios
  const [searchInput, setSearchInput] = useState<string>(''); // Input de busca
  const [selectedMunicipio, setSelectedMunicipio] = useState<MunicipioData | null>(null); // Município selecionado
  const [municipioList, setMunicipioList] = useState<MunicipioData[]>([]); // Lista de municípios carregada
  const [loadingMunicipios, setLoadingMunicipios] = useState(false); // Estado de carregamento da lista de municípios
  const [municipioError, setMunicipioError] = useState<string | null>(null); // Estado de erro ao buscar municípios

  // Estado para visibilidade das tabelas (checkboxes)
  const [showLeisInflacionarias, setShowLeisInflacionarias] = useState<boolean>(false);
  const [showLeisFixacao, setShowLeisFixacao] = useState<boolean>(false);
  const [showLeisRevisao, setShowLeisRevisao] = useState<boolean>(false);

  // Estado para as leis buscadas
  const [leisInflacionarias, setLeisInflacionarias] = useState<LeiGenerica[]>([]);
  const [leisFixacao, setLeisFixacao] = useState<LeiGenerica[]>([]);
  const [leisRevisao, setLeisRevisao] = useState<LeiGenerica[]>([]);
  const [loadingLeis, setLoadingLeis] = useState<boolean>(false); // Estado de carregamento das leis
  const [leisError, setLeisError] = useState<string | null>(null); // Estado de erro ao buscar leis

  // Estado para o diálogo de detalhes da lei
  const [isLawDetailOpen, setIsLawDetailOpen] = useState<boolean>(false);
  const [selectedLawDetail, setSelectedLawDetail] = useState<LeiGenerica | null>(null);

  // Estado para a barra lateral (Sheet) de filtros
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false); // Visibilidade da Sheet
  // Estados para os valores dos filtros
  const [filterNumeroLei, setFilterNumeroLei] = useState<string>('');
  const [filterNumeroProcesso, setFilterNumeroProcesso] = useState<string>('');
  const [filterAnotacao, setFilterAnotacao] = useState<string>('');
  const [filterIndiceCorrecao, setFilterIndiceCorrecao] = useState<string>('');
  const [filterMesDataBase, setFilterMesDataBase] = useState<string>('');


  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // --- Funções de Ação da UI ---

  // Recarrega os dados das leis visíveis ou a página inteira
  const handleRefresh = () => {
    // Opção 1: Recarregar a página inteira (simples, mas menos eficiente)
    // window.location.reload();

    // Opção 2: Recarregar apenas os dados necessários (mais controlado)
    if (selectedMunicipio) {
      // Refaz a busca para cada tipo de lei que está visível
      if (showLeisInflacionarias) fetchLaws('inflacionaria');
      if (showLeisFixacao) fetchLaws('fixacao');
      if (showLeisRevisao) fetchLaws('revisao');
      toast({ title: "Dados Atualizados", description: "As informações das leis foram recarregadas." });
    } else {
      // Se nenhum município estiver selecionado, apenas informa
      toast({ title: "Atualizado", description: "Selecione um município para carregar os dados." });
    }
  };

  // Aplica os filtros definidos na Sheet (atualmente apenas loga e fecha)
  const handleApplyFilters = () => {
    // TODO: Implementar a lógica de filtragem real.
    // Isso pode envolver:
    // 1. Refazer a busca no Firebase com cláusulas 'where' adicionais (mais complexo com múltiplos filtros opcionais).
    // 2. Filtrar os arrays 'leis*' já carregados no cliente (mais simples para poucos dados, mas menos eficiente para muitos).
    console.log("Aplicando filtros (lógica pendente):", {
      numeroLei: filterNumeroLei,
      numeroProcesso: filterNumeroProcesso,
      anotacao: filterAnotacao,
      indiceCorrecao: filterIndiceCorrecao,
      mesDataBase: filterMesDataBase,
    });
    setIsFilterOpen(false); // Fecha a Sheet após aplicar
    toast({ title: "Filtros Aplicados", description: "A visualização foi atualizada (lógica de filtro pendente)." }); // Placeholder
  };

  // Limpa os campos de filtro e reseta a visualização
  const handleClearFilters = () => {
    setFilterNumeroLei('');
    setFilterNumeroProcesso('');
    setFilterAnotacao('');
    setFilterIndiceCorrecao('');
    setFilterMesDataBase('');
    // TODO: Resetar a filtragem (rebuscar dados originais ou limpar filtro client-side)
    console.log("Limpando filtros (lógica pendente)");
    // Opcional: Rebuscar os dados sem filtros aqui
    if (selectedMunicipio) {
      if (showLeisInflacionarias) fetchLaws('inflacionaria');
      if (showLeisFixacao) fetchLaws('fixacao');
      if (showLeisRevisao) fetchLaws('revisao');
    }
    toast({ title: "Filtros Removidos", description: "A visualização foi redefinida." }); // Placeholder
  };

  // Exporta os dados das tabelas visíveis para um arquivo Excel
  const handleExportExcel = () => {
    // Verifica se há dados para exportar
    const hasDataToExport = leisInflacionarias.length > 0 || leisFixacao.length > 0 || leisRevisao.length > 0;

    if (!hasDataToExport) {
      toast({
        title: "Exportar para Excel",
        description: "Não há dados carregados nas tabelas para exportar.",
        variant: "destructive"
      });
      return; // Interrompe se não houver dados
    }

    console.log("Iniciando exportação para Excel...");
    const exportData: { [key: string]: any[] } = {}; // Objeto para armazenar dados por planilha

    // Adiciona os dados ao objeto apenas se a respectiva tabela estiver visível e tiver dados
    if (showLeisInflacionarias && leisInflacionarias.length > 0) {
      exportData['Leis Inflacionárias'] = leisInflacionarias;
    }
    if (showLeisFixacao && leisFixacao.length > 0) {
      exportData['Leis de Fixação'] = leisFixacao;
    }
    if (showLeisRevisao && leisRevisao.length > 0) {
      exportData['Leis de Revisão'] = leisRevisao;
    }

    // Verifica novamente se há dados após considerar a visibilidade
     if (Object.keys(exportData).length === 0) {
      toast({
        title: "Exportar para Excel",
        description: "Nenhuma das tabelas visíveis contém dados para exportar.",
        variant: "destructive"
      });
      return;
    }


    // Gera o nome do arquivo
    const municipioIdentifier = selectedMunicipio?.Municipio_IBGE?.replace(/ /g, '_') || 'municipio_nao_selecionado';
    const timestamp = new Date().toISOString().slice(0, 10); // Formato YYYY-MM-DD
    const filename = `consulta_anotacoes_${municipioIdentifier}_${timestamp}`;

    // Chama a função auxiliar para criar e salvar o arquivo
    saveAsExcelFile(exportData, filename);

    toast({
      title: "Exportação Iniciada",
      description: "O arquivo Excel está sendo gerado para download."
    });
  };


  // Função para buscar leis no Firebase com base no tipo e município selecionado
  // Usa useCallback para evitar recriações desnecessárias em re-renderizações
  const fetchLaws = useCallback(async (tipoLei: 'inflacionaria' | 'fixacao' | 'revisao') => {
    // Se nenhum município estiver selecionado, limpa o estado do tipo de lei correspondente e retorna
    if (!selectedMunicipio) {
      if (tipoLei === 'inflacionaria') setLeisInflacionarias([]);
      if (tipoLei === 'fixacao') setLeisFixacao([]);
      if (tipoLei === 'revisao') setLeisRevisao([]);
      return;
    }

    setLoadingLeis(true); // Ativa o indicador de carregamento
    setLeisError(null); // Limpa erros anteriores
    console.log(`Buscando leis do tipo '${tipoLei}' para o município ID: ${selectedMunicipio.ID_Municipio}`);

    try {
      const leisCollectionRef = collection(db, 'leis'); // Referência da coleção 'leis'
      let q; // Variável para a query do Firestore

      // Query base: filtra pelo ID_Municipio selecionado
      const baseQuery = query(leisCollectionRef, where("ID_Municipio", "==", selectedMunicipio.ID_Municipio));

      // Adiciona filtros específicos com base no tipo de lei
      if (tipoLei === 'inflacionaria') {
        // Para leis inflacionárias, busca todas do município e filtra no cliente,
        // pois o Firestore não suporta OR em campos diferentes (Indice_Correcao OU Mes_Data_Base).
        // Poderia também fazer duas queries separadas e juntar os resultados, mas pode ser mais complexo.
        // Assumindo que 'TipoLei' não existe ou não é confiável para inflacionária.
        q = baseQuery; // Busca todas do município
        console.log("Query para inflacionária (filtragem client-side):", selectedMunicipio.ID_Municipio);
      } else if (tipoLei === 'fixacao') {
        // Define critérios para leis de 'fixacao' (exemplo: campo 'TipoLei' == 'Fixacao')
        // **Ajuste esta condição conforme a estrutura real dos seus dados**
        q = query(baseQuery, where("TipoLei", "==", "Fixacao")); // Assumindo campo 'TipoLei'
        console.log("Query para fixacao:", selectedMunicipio.ID_Municipio);
      } else if (tipoLei === 'revisao') {
        // Define critérios para leis de 'revisao'
        q = query(baseQuery, where("TipoLei", "==", "Revisao")); // Assumindo campo 'TipoLei'
        console.log("Query para revisao:", selectedMunicipio.ID_Municipio);
      } else {
        // Fallback ou tratamento de erro se tipoLei for inválido
        console.error("Tipo de lei inválido:", tipoLei);
        q = baseQuery; // Busca todas como fallback
      }

      // Executa a query
      const querySnapshot = await getDocs(q);
      const fetchedLeis: LeiGenerica[] = [];

      // Processa os resultados
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<LeiGenerica, 'id'>; // Pega os dados do documento
        let include = false; // Flag para incluir a lei nos resultados

        // Aplica filtro client-side para 'inflacionaria' (se necessário)
        if (tipoLei === 'inflacionaria') {
          // Inclui se tiver Índice de Correção OU Mês Data Base preenchidos
          if (data.Indice_Correcao || data.Mes_Data_Base) {
            include = true;
          }
        } else {
          // Para outros tipos, a query do Firestore já deve ter filtrado.
          // Pode adicionar verificações extras aqui se necessário.
          include = true;
        }

        // Se a lei passar no filtro, adiciona ao array de resultados
        if (include) {
          fetchedLeis.push({ id: doc.id, ...data }); // Adiciona o ID do documento aos dados
        }
      });

      console.log(`Busca concluída: ${fetchedLeis.length} leis do tipo '${tipoLei}' encontradas.`);

      // Atualiza o estado correto com base no tipo de lei buscado
      if (tipoLei === 'inflacionaria') setLeisInflacionarias(fetchedLeis);
      if (tipoLei === 'fixacao') setLeisFixacao(fetchedLeis);
      if (tipoLei === 'revisao') setLeisRevisao(fetchedLeis);

    } catch (error) {
      console.error(`Erro ao buscar leis (${tipoLei}) do Firebase:`, error);
      const errorMsg = error instanceof Error ? error.message : "Erro desconhecido.";
      setLeisError(`Falha ao buscar leis (${tipoLei}): ${errorMsg}`); // Define a mensagem de erro
      // Limpa o estado correspondente em caso de erro
      if (tipoLei === 'inflacionaria') setLeisInflacionarias([]);
      if (tipoLei === 'fixacao') setLeisFixacao([]);
      if (tipoLei === 'revisao') setLeisRevisao([]);
      toast({
        title: `Erro ao Carregar Leis (${tipoLei})`,
        description: `Não foi possível buscar as leis: ${errorMsg}`,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoadingLeis(false); // Desativa o indicador de carregamento
    }
  }, [selectedMunicipio, toast]); // Dependências: busca é refeita se o município selecionado mudar

  // Efeito que dispara a busca de leis quando um município é selecionado
  // ou quando a visibilidade de uma tabela (checkbox) é alterada.
  useEffect(() => {
    if (selectedMunicipio) {
      // Se um município está selecionado, busca os tipos de lei marcados
      if (showLeisInflacionarias) fetchLaws('inflacionaria'); else setLeisInflacionarias([]); // Busca ou limpa
      if (showLeisFixacao) fetchLaws('fixacao'); else setLeisFixacao([]); // Busca ou limpa
      if (showLeisRevisao) fetchLaws('revisao'); else setLeisRevisao([]); // Busca ou limpa
    } else {
      // Se nenhum município está selecionado, limpa todas as listas de leis
      setLeisInflacionarias([]);
      setLeisFixacao([]);
      setLeisRevisao([]);
    }
    // A dependência fetchLaws garante que a versão mais recente da função (com o selectedMunicipio correto) seja usada.
  }, [selectedMunicipio, showLeisInflacionarias, showLeisFixacao, showLeisRevisao, fetchLaws]);


  // Função para buscar a lista de municípios no Firebase
  // Usa useCallback para memorização
  const fetchMunicipios = useCallback(async () => {
    setLoadingMunicipios(true); // Ativa carregamento
    setMunicipioError(null); // Limpa erros
    try {
      const municipiosCollectionRef = collection(db, 'municipios');
      // Cria a query para buscar municípios, ordenando pelo nome de exibição (Municipio_IBGE)
      const q = query(municipiosCollectionRef, orderBy('Municipio_IBGE'));
      const querySnapshot = await getDocs(q); // Executa a query

      // Mapeia os documentos retornados para o formato da interface MunicipioData
      const fetchedMunicipios: MunicipioData[] = querySnapshot.docs.map(doc => ({
        id: doc.id, // ID do documento Firebase
        ...(doc.data() as Omit<MunicipioData, 'id'>) // Dados do documento, tipados
      }));

      console.log(`Buscados ${fetchedMunicipios.length} municípios do Firebase.`);
      setMunicipioList(fetchedMunicipios); // Atualiza o estado com a lista

    } catch (error) {
      console.error("Erro ao buscar lista de municípios do Firebase:", error);
      const errorMsg = error instanceof Error ? error.message : "Erro desconhecido.";
      setMunicipioError(`Falha ao buscar municípios: ${errorMsg}`); // Define erro
      toast({
        title: "Erro ao Carregar Municípios",
        description: `Não foi possível buscar a lista de municípios: ${errorMsg}`,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoadingMunicipios(false); // Desativa carregamento
    }
  }, [toast]); // Dependência do toast para exibir mensagens de erro

  // Efeito para buscar a lista de municípios quando o componente é montado
  useEffect(() => {
    fetchMunicipios();
  }, [fetchMunicipios]); // A dependência fetchMunicipios garante que a função memorizada seja usada

  // Manipulador para atualizar o estado dos checkboxes de forma segura
  const handleCheckboxChange = (setter: React.Dispatch<React.SetStateAction<boolean>>, checked: CheckedState) => {
    // Atualiza o estado para true apenas se 'checked' for explicitamente true (ignora 'indeterminate')
    setter(checked === true);
  };

  return (
    <div className="dashboard-theme min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <Header toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-6">
            {/* Cabeçalho da Página */}
            <div className="flex items-center justify-between mb-6">
              {/* Título e Botão Voltar */}
              <div className="flex items-center cursor-pointer" onClick={() => navigate('/telaInicial')}>
                <ArrowLeft className="mr-2 text-tribunal-blue" size={24} />
                <h1 className="text-3xl font-bold text-tribunal-blue">Consulta de Anotações</h1>
              </div>
              {/* Ícones de Ação (Direita) */}
              <div className="flex items-center space-x-3">
                 {/* Botão Atualizar */}
                 <Button variant="ghost" size="icon" onClick={handleRefresh} title="Atualizar Dados">
                   <RefreshCw className="h-5 w-5 text-gray-600 hover:text-tribunal-blue" />
                 </Button>
                 {/* Botão Filtros (abre Sheet) */}
                 <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" title="Filtrar Dados">
                        <Filter className="h-5 w-5 text-gray-600 hover:text-tribunal-blue" />
                      </Button>
                    </SheetTrigger>
                    {/* Conteúdo da Sheet de Filtros */}
                    <SheetContent className="w-[400px] sm:w-[540px]" side="right">
                      <SheetHeader>
                        <SheetTitle>Filtrar Leis</SheetTitle>
                        <SheetDescription>
                          Refine a busca por leis aplicando os filtros abaixo (funcionalidade pendente).
                        </SheetDescription>
                      </SheetHeader>
                      {/* Campos de Filtro */}
                      <div className="grid gap-4 py-4">
                        {/* Filtro Número da Lei */}
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="filterNumeroLei" className="text-right">
                            Número da Lei
                          </Label>
                          <Input
                            id="filterNumeroLei"
                            value={filterNumeroLei}
                            onChange={(e) => setFilterNumeroLei(e.target.value)}
                            className="col-span-3"
                            placeholder="Ex: 123/2023"
                          />
                        </div>
                        {/* Filtro Número do Processo */}
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="filterNumeroProcesso" className="text-right">
                            Número Processo
                          </Label>
                          <Input
                            id="filterNumeroProcesso"
                            value={filterNumeroProcesso}
                            onChange={(e) => setFilterNumeroProcesso(e.target.value)}
                            className="col-span-3"
                            placeholder="Ex: 456/2024"
                          />
                        </div>
                        {/* Filtro Anotação */}
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="filterAnotacao" className="text-right">
                            Anotação
                          </Label>
                          <Input
                            id="filterAnotacao"
                            value={filterAnotacao}
                            onChange={(e) => setFilterAnotacao(e.target.value)}
                            className="col-span-3"
                            placeholder="Buscar em anotações..."
                          />
                        </div>
                        {/* Filtro Índice de Correção */}
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="filterIndiceCorrecao" className="text-right">
                            Índice Correção
                          </Label>
                           <Select value={filterIndiceCorrecao} onValueChange={setFilterIndiceCorrecao}>
                              <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecione um índice" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="IPCA">IPCA</SelectItem>
                                <SelectItem value="IGP-M">IGP-M</SelectItem>
                                <SelectItem value="INPC">INPC</SelectItem>
                                <SelectItem value="Selic">Selic</SelectItem>
                                <SelectItem value="all">Todos</SelectItem> {/* Valor para limpar/ignorar filtro */}
                              </SelectContent>
                            </Select>
                        </div>
                        {/* Filtro Mês Data Base */}
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="filterMesDataBase" className="text-right">
                            Mês Data Base
                          </Label>
                          <Select value={filterMesDataBase} onValueChange={setFilterMesDataBase}>
                              <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecione um mês" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Janeiro">Janeiro</SelectItem>
                                <SelectItem value="Fevereiro">Fevereiro</SelectItem>
                                <SelectItem value="Março">Março</SelectItem>
                                <SelectItem value="Abril">Abril</SelectItem>
                                <SelectItem value="Maio">Maio</SelectItem>
                                <SelectItem value="Junho">Junho</SelectItem>
                                <SelectItem value="Julho">Julho</SelectItem>
                                <SelectItem value="Agosto">Agosto</SelectItem>
                                <SelectItem value="Setembro">Setembro</SelectItem>
                                <SelectItem value="Outubro">Outubro</SelectItem>
                                <SelectItem value="Novembro">Novembro</SelectItem>
                                <SelectItem value="Dezembro">Dezembro</SelectItem>
                                <SelectItem value="all">Todos</SelectItem> {/* Valor para limpar/ignorar filtro */}
                              </SelectContent>
                            </Select>
                        </div>
                      </div>
                      {/* Rodapé da Sheet com Botões */}
                      <SheetFooter>
                        <Button variant="outline" onClick={handleClearFilters}>Limpar Filtros</Button>
                        <SheetClose asChild>
                           <Button type="button" onClick={handleApplyFilters}>Aplicar Filtros</Button>
                        </SheetClose>
                      </SheetFooter>
                    </SheetContent>
                  </Sheet>
                 {/* Botão Exportar Excel */}
                 <Button variant="ghost" size="icon" onClick={handleExportExcel} title="Exportar para Excel">
                   <FileSpreadsheet className="h-5 w-5 text-gray-600 hover:text-tribunal-blue" />
                 </Button>
              </div>
            </div>

            {/* Seleção de Município */}
            <div className="relative mb-8 text-primary text-center">
              <h2 className="text-xl font-bold text-center mb-4">Município</h2>
              {/* Input de Busca com Dropdown */}
              <div className="relative w-full md:w-1/2 mx-auto">
                <Input
                  id="municipio"
                  placeholder="Digite para buscar um município..."
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    // Limpa o município selecionado se o texto de busca mudar e não corresponder mais
                    if (selectedMunicipio && e.target.value !== selectedMunicipio.Municipio_IBGE) {
                      setSelectedMunicipio(null);
                    }
                  }}
                  className="pl-10 border-gray-300"
                  aria-label="Buscar município"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                {/* Dropdown com resultados da busca */}
                {searchInput && !selectedMunicipio && municipioList.length > 0 && !loadingMunicipios && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {municipioList
                      .filter(m => m.Municipio_IBGE.toLowerCase().includes(searchInput.toLowerCase())) // Filtra a lista localmente
                      .map((m) => (
                      <div
                        key={m.id} // Usa ID do documento Firebase como chave
                        className="px-4 py-2 hover:bg-gray-100 text-gray-800 cursor-pointer"
                        onClick={() => {
                          setSelectedMunicipio(m); // Define o município selecionado
                          setSearchInput(m.Municipio_IBGE); // Atualiza o input com o nome selecionado
                        }}
                      >
                        {m.Municipio_IBGE} {/* Exibe o nome IBGE */}
                      </div>
                    ))}
                  </div>
                )}
                {/* Indicador de Carregamento */}
                {loadingMunicipios && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <RefreshCw className="animate-spin h-5 w-5 text-primary" />
                  </div>
                )}
                {/* Mensagem de Erro */}
                {municipioError && <p className="text-red-500 text-xs mt-1 text-left">{municipioError}</p>}
              </div>
            </div>

            {/* Checkboxes para Visibilidade das Tabelas */}
            <div className="mb-6 flex flex-wrap justify-center items-center gap-x-6 gap-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="visualizarInflacionaria"
                  checked={showLeisInflacionarias}
                  onCheckedChange={(checked) => handleCheckboxChange(setShowLeisInflacionarias, checked)}
                />
                <Label htmlFor="visualizarInflacionaria" className="text-sm font-medium text-gray-700 cursor-pointer">Leis de Política Inflacionária</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="visualizarFixacao"
                  checked={showLeisFixacao}
                  onCheckedChange={(checked) => handleCheckboxChange(setShowLeisFixacao, checked)}
                />
                <Label htmlFor="visualizarFixacao" className="text-sm font-medium text-gray-700 cursor-pointer">Leis de Fixação</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="visualizarRevisao"
                  checked={showLeisRevisao}
                  onCheckedChange={(checked) => handleCheckboxChange(setShowLeisRevisao, checked)}
                />
                <Label htmlFor="visualizarRevisao" className="text-sm font-medium text-gray-700 cursor-pointer">Leis de Revisão Geral Anual</Label>
              </div>
            </div>

            {/* Tabela 1: Política Inflacionária */}
            {showLeisInflacionarias && (
              <div className="mb-8 bg-white p-4 rounded-lg shadow border">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">
                  Leis de Política Inflacionária - {selectedMunicipio?.Municipio_IBGE || 'Nenhum município selecionado'}
                </h3>
                {loadingLeis && <p className="text-sm text-gray-500 italic">Carregando leis...</p>}
                {leisError && <p className="text-sm text-red-500">{leisError}</p>}
                {!loadingLeis && !leisError && (
                  <Table className="border-collapse border border-gray-300">
                    <TableHeader>
                      <TableRow className="bg-gray-100">
                        <TableHead className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-600">Número da Lei</TableHead>
                        <TableHead className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-600">Índice de Correção</TableHead>
                        <TableHead className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-600">Mês Data Base</TableHead>
                        <TableHead className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-600">Data Inicial</TableHead>
                        <TableHead className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-600">Data Final</TableHead>
                        <TableHead className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-600">Detalhes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leisInflacionarias.length > 0 ? (
                        leisInflacionarias.map((lei) => (
                          <TableRow key={lei.id} className="hover:bg-gray-50">
                            <TableCell className="border border-gray-300 px-3 py-2 text-center text-sm">{lei.Num_Lei || '-'}/{lei.Ano_Lei || '-'}</TableCell>
                            <TableCell className="border border-gray-300 px-3 py-2 text-center text-sm">{lei.Indice_Correcao || '-'}</TableCell>
                            <TableCell className="border border-gray-300 px-3 py-2 text-center text-sm">{lei.Mes_Data_Base || '-'}</TableCell>
                            <TableCell className="border border-gray-300 px-3 py-2 text-center text-sm">{formatDate(lei.Data_Inicial)}</TableCell>
                            <TableCell className="border border-gray-300 px-3 py-2 text-center text-sm">{formatDate(lei.Data_Final)}</TableCell>
                            <TableCell className="border border-gray-300 px-3 py-2 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedLawDetail(lei); // Define a lei selecionada para o diálogo
                                  setIsLawDetailOpen(true); // Abre o diálogo
                                }}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="Ver Detalhes"
                              >
                                <PlusCircle className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="border border-gray-300 px-3 py-2 text-center text-gray-500 italic">
                            {selectedMunicipio ? 'Nenhuma lei de política inflacionária encontrada para este município.' : 'Selecione um município para ver os dados.'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}

            {/* Tabela 2: Fixação */}
            {showLeisFixacao && (
              <div className="mb-8 bg-white p-4 rounded-lg shadow border">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">
                  Leis de Fixação de Subsídios - {selectedMunicipio?.Municipio_IBGE || 'Nenhum município selecionado'}
                </h3>
                {loadingLeis && <p className="text-sm text-gray-500 italic">Carregando leis...</p>}
                {leisError && <p className="text-sm text-red-500">{leisError}</p>}
                {!loadingLeis && !leisError && (
                  <Table className="border-collapse border border-gray-300">
                    <TableHeader>
                      <TableRow className="bg-gray-100">
                        <TableHead className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-600">Legislatura</TableHead>
                        <TableHead className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-600">Número da Lei</TableHead>
                        <TableHead className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-600">Cargo</TableHead>
                        <TableHead className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-600">Subsídio (R$)</TableHead>
                        <TableHead className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-600">Nº Processo</TableHead>
                        <TableHead className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-600">Situação</TableHead>
                        <TableHead className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-600">Conclusão</TableHead>
                        <TableHead className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-600">Detalhes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leisFixacao.length > 0 ? (
                         leisFixacao.map((lei) => (
                          <TableRow key={lei.id} className="hover:bg-gray-50">
                            <TableCell className="border border-gray-300 px-3 py-2 text-center text-sm">{lei.Legislatura || '-'}</TableCell>
                            <TableCell className="border border-gray-300 px-3 py-2 text-center text-sm">{lei.Num_Lei || '-'}/{lei.Ano_Lei || '-'}</TableCell>
                            <TableCell className="border border-gray-300 px-3 py-2 text-center text-sm">{lei.Cargo || '-'}</TableCell>
                            <TableCell className="border border-gray-300 px-3 py-2 text-center text-sm">{lei.Subsidio?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}</TableCell>
                            <TableCell className="border border-gray-300 px-3 py-2 text-center text-sm">{lei.Num_Processo || '-'}/{lei.Ano_Processo || '-'}</TableCell>
                            <TableCell className="border border-gray-300 px-3 py-2 text-center text-sm">{lei.Situacao || '-'}</TableCell>
                            <TableCell className="border border-gray-300 px-3 py-2 text-center text-sm">{lei.Conclusao || '-'}</TableCell>
                            <TableCell className="border border-gray-300 px-3 py-2 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedLawDetail(lei);
                                  setIsLawDetailOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="Ver Detalhes"
                              >
                                <PlusCircle className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                         ))
                       ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="border border-gray-300 px-3 py-2 text-center text-gray-500 italic">
                             {selectedMunicipio ? 'Nenhuma lei de fixação encontrada para este município.' : 'Selecione um município para ver os dados.'}
                          </TableCell>
                        </TableRow>
                       )}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}

            {/* Tabela 3: Revisão Geral Anual */}
            {showLeisRevisao && (
              <div className="mb-8 bg-white p-4 rounded-lg shadow border">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">
                  Leis de Revisão Geral Anual - {selectedMunicipio?.Municipio_IBGE || 'Nenhum município selecionado'}
                </h3>
                {loadingLeis && <p className="text-sm text-gray-500 italic">Carregando leis...</p>}
                {leisError && <p className="text-sm text-red-500">{leisError}</p>}
                {!loadingLeis && !leisError && (
                  <Table className="border-collapse border border-gray-300">
                    <TableHeader>
                      <TableRow className="bg-gray-100">
                        <TableHead className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-600">Legislatura</TableHead>
                        <TableHead className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-600">Número da Lei</TableHead>
                        <TableHead className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-600">Cargo</TableHead>
                        <TableHead className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-600">Subsídio (R$)</TableHead>
                        <TableHead className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-600">Nº Processo</TableHead>
                        <TableHead className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-600">Situação</TableHead>
                        <TableHead className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-600">Conclusão</TableHead>
                        <TableHead className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-600">Detalhes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leisRevisao.length > 0 ? (
                         leisRevisao.map((lei) => (
                          <TableRow key={lei.id} className="hover:bg-gray-50">
                            <TableCell className="border border-gray-300 px-3 py-2 text-center text-sm">{lei.Legislatura || '-'}</TableCell>
                            <TableCell className="border border-gray-300 px-3 py-2 text-center text-sm">{lei.Num_Lei || '-'}/{lei.Ano_Lei || '-'}</TableCell>
                            <TableCell className="border border-gray-300 px-3 py-2 text-center text-sm">{lei.Cargo || '-'}</TableCell>
                            <TableCell className="border border-gray-300 px-3 py-2 text-center text-sm">{lei.Subsidio?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}</TableCell>
                            <TableCell className="border border-gray-300 px-3 py-2 text-center text-sm">{lei.Num_Processo || '-'}/{lei.Ano_Processo || '-'}</TableCell>
                            <TableCell className="border border-gray-300 px-3 py-2 text-center text-sm">{lei.Situacao || '-'}</TableCell>
                            <TableCell className="border border-gray-300 px-3 py-2 text-center text-sm">{lei.Conclusao || '-'}</TableCell>
                            <TableCell className="border border-gray-300 px-3 py-2 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedLawDetail(lei);
                                  setIsLawDetailOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="Ver Detalhes"
                              >
                                <PlusCircle className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                         ))
                       ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="border border-gray-300 px-3 py-2 text-center text-gray-500 italic">
                            {selectedMunicipio ? 'Nenhuma lei de revisão geral anual encontrada para este município.' : 'Selecione um município para ver os dados.'}
                          </TableCell>
                        </TableRow>
                       )}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}

            {/* Diálogo de Detalhes da Lei */}
            <Dialog open={isLawDetailOpen} onOpenChange={setIsLawDetailOpen}>
              <DialogContent className="sm:max-w-[600px] bg-white">
                <DialogHeader>
                  <DialogTitle className="text-center text-lg font-semibold text-gray-800">
                    Detalhes da Lei {selectedLawDetail?.Num_Lei || '-'}/{selectedLawDetail?.Ano_Lei || '-'}
                  </DialogTitle>
                  <DialogDescription className="text-center text-sm text-gray-500">
                    Município: {selectedLawDetail?.Municipio || selectedMunicipio?.Municipio_IBGE || 'N/A'}
                  </DialogDescription>
                </DialogHeader>
                {selectedLawDetail ? (
                  // Área rolável para os detalhes
                  <ScrollArea className="max-h-[60vh] p-4 border rounded-md bg-gray-50">
                    <div className="space-y-2 text-sm">
                      {/* Mapeia as entradas (chave/valor) do objeto da lei selecionada */}
                      {Object.entries(selectedLawDetail).map(([key, value]) => {
                        // Pula campos internos ou vazios para uma exibição mais limpa
                        if (key === 'id' || key === 'ID_Migracao' || key === 'TipoLei' || value === null || value === undefined || value === '') return null;

                        let displayValue = value;
                        // Formata campos específicos
                        if (key === 'Modificado' && value instanceof Timestamp) {
                          displayValue = formatDate(value); // Formata Timestamp
                        } else if ((key === 'Data_Inicial' || key === 'Data_Final') && (typeof value === 'string' || value instanceof Timestamp)) {
                          displayValue = formatDate(value); // Formata data (string ou Timestamp)
                        } else if (key === 'Subsidio' && typeof value === 'number') {
                           displayValue = `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; // Formata como moeda
                        } else if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
                           // Pula objetos/arrays complexos se não houver tratamento específico
                           // console.log(`Pulando chave não tratada: ${key}`);
                           return null;
                        }

                        // Formata a chave para exibição (remove underscores, capitaliza)
                        const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                        // Renderiza a linha de detalhe
                        return (
                          <div key={key} className="grid grid-cols-3 gap-2 border-b pb-1 last:border-b-0">
                            <span className="font-medium text-gray-600 col-span-1">{displayKey}:</span>
                            <span className="text-gray-800 col-span-2 break-words">{String(displayValue)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-center text-gray-500 italic">Nenhum detalhe de lei selecionado.</p>
                )}
                {/* Botão Fechar do Diálogo */}
                <div className="flex justify-end mt-4">
                   <Button variant="outline" onClick={() => setIsLawDetailOpen(false)}>Fechar</Button>
                </div>
              </DialogContent>
            </Dialog>
            {/* Fim do Diálogo de Detalhes da Lei */}

        </main>
      </div>
    </div>
  );
};

export default ConsultaAnotacao;