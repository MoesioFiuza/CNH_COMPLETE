import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import "./BaseDeDados.css";
import * as XLSX from "xlsx";
import { debounce } from 'lodash';

interface BaseDeDadosData {
  categoria: string;
  municipio: string;
  nome: string;
  cnpj: string;
  adesao: string;
  Contrato: string;
  dataDeAbertura: string;
  suite: string;
  status: string;
}

const BaseDeDados: React.FC = () => {
  const [sheetData, setSheetData] = useState<string[][]>([]);
  const [baseData, setBaseData] = useState<BaseDeDadosData[]>([]);
  const [filteredData, setFilteredData] = useState<BaseDeDadosData[]>([]);
  const [cfcData, setCfcData] = useState<
    { municipio: string; nome: string; cnpj: string }[]
  >([]);
  const [clinicaData, setClinicaData] = useState<
    { municipio: string; nome: string; cnpj: string }[]
  >([]);
  const [regionais, setRegionais] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>("");
  const [filterMunicipio, setFilterMunicipio] = useState<string>("");
  const [role, setRole] = useState<string>("");
  
  // Usa refs para evitar buscas múltiplas e rastrear alterações de dados
  const dataFetchedRef = useRef(false);
  const isEditingRef = useRef(false);
  const filterChangeRef = useRef(false);
  
  // Estado de Paginação
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 25; // Número de linhas a serem exibidas por página

  const statusList = useMemo(() => [
    "PROCESSO ABERTO (DIHAB)",
    "AUTORIZADO (SUPER)",
    "INFOS ORÇAMENTÁRIAS (NEXEC)",
    "DECLARAÇÃO DE ORDENADOR REALIZADA (DIAF)",
    "CONTRATO ELABORADO (NUCON)",
    "CERTIDÃO LICITAWEB (LICIT)",
    "MAPA DE PREÇOS LICITAWEB ASSINADO (DIAF)",
    "CONTRATO ENVIADO À EMPRESA",
    "CONTRATO ASSINADO DEVOLVIDO AO DETRAN",
    "PARECER JURÍDICO ELABORADO (NUCON)",
    "PARECER ASSINADO (ADV NUCON)",
    "PARECER ASSINADO (DIJUR)",
    "CONTRATO ASSINADO (SUPER)",
    "CADASTRADO NO SISTEMA SACC",
    "EDOWEB OK",
    "OFÍCIO OK",
    "EDOWEB ASSINADO (DIJUR)",
    "OFÍCIO ASSINADO (SUPER)",
    "ENVIADO À CASA CIVIL",
    "CONTRATO PUBLICADO",
    "CLÍNICA COM CRÉDITO A UTILIZAR",
  ], []);

  // Função para aplicar filtros sem redefinir a página
  const applyFiltersWithoutPageReset = useCallback((data: BaseDeDadosData[]) => {
    let filtered = [...data];
    if (filterType) {
      filtered = filtered.filter(row => row.categoria === filterType);
    }
    if (filterMunicipio) {
      filtered = filtered.filter(row => row.municipio.includes(filterMunicipio));
    }
    return filtered;
  }, [filterType, filterMunicipio]);

  // Função de busca de dados - chamada apenas uma vez
  const fetchData = async () => {
    try {
      console.log("Buscando dados...");
      setIsLoading(true);
      
      // Buscar todos os dados em paralelo
      const [regionaisResponse, cfcResponse, clinicaResponse, baseResponse, contratacaoResponse] = 
        await Promise.all([
          fetch("http://127.0.0.1:8000/obter-planilha?aba=Regionais"),
          fetch("http://127.0.0.1:8000/obter-planilha?aba=Cadastro CFC"),
          fetch("http://127.0.0.1:8000/obter-planilha?aba=Cadastro Clínicas"),
          fetch("http://127.0.0.1:8000/obter-planilha?aba=Base de Dados"),
          fetch("http://127.0.0.1:8000/obter-planilha?aba=Contratação")
        ]);
      
      // Processar todas as respostas
      const [regionaisData, cfcDataJson, clinicaDataJson, baseDataJson, contratacaoDataJson] = 
        await Promise.all([
          regionaisResponse.json(),
          cfcResponse.json(),
          clinicaResponse.json(),
          baseResponse.json(),
          contratacaoResponse.json()
        ]);

      // Processa regionais
      const uniqueMunicipios = Array.from(
        new Set(regionaisData.valores.map((row: string[]) => row[0]))
      ).sort() as string[];
      
      // Processa CFCs
      const processedCfcData = cfcDataJson.valores.map((row: string[]) => ({
        municipio: row[5],
        nome: row[0],
        cnpj: row[4],
      }));
      
      // Processa Clínicas
      const processedClinicaData = clinicaDataJson.valores.map((row: string[]) => ({
        municipio: row[5],
        nome: row[0],
        cnpj: row[4],
      }));
      
      // Processa status de Contratação
      const contratacaoList = contratacaoDataJson.valores.map(
        (row: string[]) => {
          const lastSimIndex = row.slice(4, 25).lastIndexOf("Sim");
          const status = lastSimIndex !== -1 ? statusList[lastSimIndex] : "";
          return { status };
        }
      );

      // Cria a base de dados final com o status já incluído
      const baseDataList = baseDataJson.valores.map((row: string[], index: number) => ({
        categoria: row[0] || "",
        municipio: row[1] || "",
        nome: row[2] || "",
        cnpj: row[3] || "",
        adesao: row[4] || "",
        Contrato: row[5] || "",
        dataDeAbertura: row[6] || "",
        suite: row[7] || "",
        status: contratacaoList[index]?.status || "",
      }));
      
      // Atualiza todos os estados de uma vez para evitar novas renderizações
      setCfcData(processedCfcData);
      setClinicaData(processedClinicaData);
      setRegionais(uniqueMunicipios);
      setBaseData(baseDataList);
      setFilteredData(baseDataList);
      
      console.log("Data fetched successfully!");
    } catch (error) {
      console.error("Erro ao carregar os dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Chama função de usuário e dados na montagem do componente - SOMENTE UMA VEZ
  useEffect(() => {
    const savedRole = localStorage.getItem("role");
    if (savedRole) {
      setRole(savedRole);
    }
    
    // Pega os dados apenas uma vez
    if (!dataFetchedRef.current) {
      dataFetchedRef.current = true;
      fetchData();
    }
  }, []); // Array vazio para garantir que só seja executado uma vez

  // Atualiar manualmente
  const handleRefresh = () => {
    fetchData();
  };

  // Função para exportar dados em formato XLSX
  const handleExport = useCallback(() => {
    const headers = [
      ["CATEG.", "MUNICÍPIO", "NOME", "CNPJ", "ADESAO", "CONTRATO", "DT. ABERTURA", "SUITE", "STATUS"]
    ];

    const sheetData = [
      ...headers,
      ...baseData.map(item => [
        item.categoria, item.municipio, item.nome, item.cnpj, item.adesao, item.Contrato, item.dataDeAbertura, item.suite, item.status
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Base de Dados");
    XLSX.writeFile(wb, "base-de-dados.xlsx");
  }, [baseData]);

  // Adicionar nova linha
  const addNewRow = useCallback(() => {
    setBaseData(prevData => {
      const newData = [
        ...prevData,
        {
          categoria: "",
          municipio: "",
          nome: "",
          cnpj: "",
          adesao: "",
          Contrato: "",
          dataDeAbertura: "",
          suite: "",
          status: "",
        },
      ];
      
      // Filtro aos novos dados
      const filtered = applyFiltersWithoutPageReset(newData);
      setFilteredData(filtered);
      
      return newData;
    });
    
    // Ir para a última página ao adicionar uma nova linha
    setCurrentPage(prevPage => {
      const newTotalPages = Math.ceil((filteredData.length + 1) / rowsPerPage);
      return newTotalPages;
    });
  }, [filteredData.length, rowsPerPage, applyFiltersWithoutPageReset]);

  // Formatação de cores para a coluna de adesão
  const getAdesaoStyle = useCallback((adesao: string) => {
    switch (adesao) {
      case "Aguardando Adesão":
        return { backgroundColor: "#f3e56d", color: "#000" };
      case "Aderiu":
        return { backgroundColor: "#90ee90", color: "#000" };
      case "Não aderiu":
        return { backgroundColor: "#ff6b6b", color: "#fff" };
      default:
        return {};
    }
  }, []);

  // Salvar alterações
  const handleSaveChanges = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Prepara Dados para "Base de Dados"
      const baseDataToSave = baseData.map((row) => [
        row.categoria,
        row.municipio,
        row.nome,
        row.cnpj,
        row.adesao,
        row.Contrato,
        row.dataDeAbertura,
        row.suite,
      ]);

      // Prepara Dados para "Contratação"
      const contratacaoDataToSave = baseData.map((row) => {
        const statusIndex = statusList.indexOf(row.status);
        return [
          row.Contrato,
          row.suite,
          row.municipio,
          row.categoria,
          ...statusList.map((status, index) =>
            index <= statusIndex ? "Sim" : "Não"
          ),
        ];
      });

      // Atualiza os dados em paralelo
      const [responseBaseData, responseContratacao] = await Promise.all([
        fetch("http://127.0.0.1:8000/atualizar-planilha", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            aba: "Base de Dados",
            valores: baseDataToSave,
          }),
        }),
        fetch("http://127.0.0.1:8000/atualizar-planilha", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            aba: "Contratação!A1:Z10000",
            valores: contratacaoDataToSave,
          }),
        })
      ]);

      if (!responseBaseData.ok || !responseContratacao.ok) {
        throw new Error("Erro ao salvar os dados na planilha.");
      }

      alert("Alterações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar os dados:", error);
      alert("Erro ao salvar os dados na planilha.");
    } finally {
      setIsLoading(false);
    }
  }, [baseData, statusList]);

  // Lidar com alterações de dados em campos de entrada
  const handleDataChange = useCallback((rowIndex: number, field: string, value: string) => {
    // Define sinalizador de edição para evitar redefinição de paginação
    isEditingRef.current = true;
    
    setBaseData(prev => {
      const newData = [...prev];
      newData[rowIndex] = {
        ...newData[rowIndex],
        [field]: value
      };
      
      // Aplica filtros aos dados atualizados
      const filtered = applyFiltersWithoutPageReset(newData);
      setFilteredData(filtered);
      
      return newData;
    });
    
  
    setTimeout(() => {
      isEditingRef.current = false;
    }, 300);
  }, [applyFiltersWithoutPageReset]);

  // Lidar com a mudança do tipo de filtro
  const handleFilterTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    filterChangeRef.current = true;
    setFilterType(e.target.value);
  }, []);

  // Lidar com a mudança do filtro Minicípio
  const handleFilterMunicipioChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    filterChangeRef.current = true;
    setFilterMunicipio(e.target.value);
  }, []);

  // Efeito para alterações de filtro - este redefine a paginação
  useEffect(() => {
    if (filterChangeRef.current) {
      const filtered = applyFiltersWithoutPageReset(baseData);
      setFilteredData(filtered);
      setCurrentPage(1); // Volta para a primeira página quando os filtros mudarem
      filterChangeRef.current = false;
    }
  }, [filterType, filterMunicipio, baseData, applyFiltersWithoutPageReset]);

  // Cálculo de paginação
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  }, [filteredData.length, rowsPerPage]);

  // Assegurar que o número da página é válido
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const currentPageData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  // Navegação de página
  const goToNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const goToPreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  // Memo Tabela 
  const TableRow = React.memo(({ 
    row, 
    rowIndex 
  }: { 
    row: BaseDeDadosData, 
    rowIndex: number 
  }) => (
    <tr>
      <td>
        <select
          value={row.categoria}
          disabled={role === "Dihab"}
          onChange={(e) => handleDataChange(rowIndex, "categoria", e.target.value)}
        >
          <option value="">Selecione</option>
          <option value="CFC">CFC</option>
          <option value="Clínica">Clínica</option>
        </select>
      </td>
      <td>
        <select
          value={row.municipio}
          disabled={role === "Dihab"}
          onChange={(e) => handleDataChange(rowIndex, "municipio", e.target.value)}
        >
          <option value="">Selecione o Município</option>
          {regionais.map((municipio, index) => (
            <option key={index} value={municipio}>
              {municipio}
            </option>
          ))}
        </select>
      </td>
      <td>
        <select
          value={row.nome}
          disabled={role === "Dihab"}
          onChange={(e) => {
            const nome = e.target.value;
            const cnpj =
              row.categoria === "CFC"
                ? cfcData.find((item) => item.nome === nome)?.cnpj || ""
                : clinicaData.find((item) => item.nome === nome)
                    ?.cnpj || "";
            handleDataChange(rowIndex, "nome", nome);
            handleDataChange(rowIndex, "cnpj", cnpj);
          }}
        >
          <option value="">Selecione o Nome</option>
          {row.categoria === "CFC"
            ? cfcData.map((item, index) => (
                <option key={index} value={item.nome}>
                  {item.nome}
                </option>
              ))
            : clinicaData.map((item, index) => (
                <option key={index} value={item.nome}>
                  {item.nome}
                </option>
              ))}
        </select>
      </td>
      <td>
        <input
          type="text"
          value={row.cnpj}
          readOnly
          disabled={role === "Dihab"}
        />
      </td>
      <td>
        <select
          value={row.adesao}
          disabled={role === "Dihab"}
          onChange={(e) => handleDataChange(rowIndex, "adesao", e.target.value)}
          style={getAdesaoStyle(row.adesao)}
        >
          <option value="">Selecione</option>
          <option value="Aguardando Adesão">Aguardando Adesão</option>
          <option value="Aderiu">Aderiu</option>
          <option value="Não aderiu">Não aderiu</option>
        </select>
      </td>
      <td>
        <input
          type="text"
          value={row.Contrato}
          disabled={role === "Dihab"}
          onChange={(e) => handleDataChange(rowIndex, "Contrato", e.target.value)}
        />
      </td>
      <td>
        <input
          type="text"
          value={row.dataDeAbertura}
          disabled={role === "Dihab"}
          onChange={(e) => handleDataChange(rowIndex, "dataDeAbertura", e.target.value)}
        />
      </td>
      <td>
        <input
          type="text"
          value={row.suite}
          disabled={role === "Dihab"}
          onChange={(e) => handleDataChange(rowIndex, "suite", e.target.value)}
        />
      </td>
      <td>
        <select
          value={row.status}
          disabled={role === "Nucon"}
          onChange={(e) => handleDataChange(rowIndex, "status", e.target.value)}
        >
          <option value="">Selecione o Status</option>
          {statusList.map((status, index) => (
            <option key={index} value={status}>
              {status}
            </option>
          ))}
        </select>
      </td>
    </tr>
  ));

  // Memo paginação do componente de paginação
  const Pagination = React.memo(() => (
    <div className="pagination">
      <button 
        onClick={goToPreviousPage} 
        disabled={currentPage === 1}
        className="pagination-button"
      >
        &laquo; Anterior
      </button>
      <span className="pagination-info">
        Página {currentPage} de {totalPages}
      </span>
      <button 
        onClick={goToNextPage} 
        disabled={currentPage >= totalPages}
        className="pagination-button"
      >
        Próxima &raquo;
      </button>
      
      <div className="pagination-goto">
        <span>Ir para: </span>
        <select 
          value={currentPage} 
          onChange={(e) => goToPage(Number(e.target.value))}
          disabled={totalPages <= 1}
        >
          {[...Array(Math.min(totalPages, 100))].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>
      </div>
    </div>
  ));

  return (
    <div className="base-de-dados-container">
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Carregando dados...</p>
        </div>
      )}
      
      <div className="button-container">
        <div className="filters">
          <select 
            onChange={handleFilterTypeChange}
            value={filterType}
          >
            <option value="">Filtre por Clínica ou CFC aqui</option>
            <option value="Clínica">Clínica</option>
            <option value="CFC">CFC</option>
          </select>
          <input
            type="text"
            placeholder="Município"
            value={filterMunicipio}
            onChange={handleFilterMunicipioChange}
          />
        </div>
        <div className="row-count">
          Total de registros: {filteredData.length}
        </div>
        <button className="btn salvar" onClick={handleSaveChanges} disabled={isLoading}>
          Salvar Alterações
        </button>
        <button className="btn adicionar" onClick={addNewRow} disabled={isLoading}>
          Adicionar Linha
        </button>
        <button className="btn exportar" onClick={handleExport} disabled={isLoading}>
          Exportar
        </button>
        <button className="btn atualizar" onClick={handleRefresh} disabled={isLoading}>
          Atualizar
        </button>
      </div>
      
      {/* Controles de paginação - mostraa somente se tiver várias páginas */}
      {filteredData.length > rowsPerPage && <Pagination />}
      
      <table className="base-dados-table">
        <thead>
          <tr>
            <th>CATEG.</th>
            <th>MUNICÍPIO</th>
            <th>NOME</th>
            <th>CNPJ</th>
            <th>ADESÃO</th>
            <th>CONTRATO</th>
            <th>DT. ABERTURA</th>
            <th>SUITE</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {currentPageData.map((row, index) => {
            // Calcular o índice real 
            const realIndex = (currentPage - 1) * rowsPerPage + index;
            return (
              <TableRow 
                key={realIndex} 
                row={row} 
                rowIndex={realIndex} 
              />
            );
          })}
        </tbody>
      </table>
      
      {/* Controles de paginação inferior */}
      {filteredData.length > rowsPerPage && <Pagination />}
      
      <button className="add-row-button" onClick={addNewRow} disabled={isLoading}>
        +
      </button>
    </div>
  );
};

export default BaseDeDados;