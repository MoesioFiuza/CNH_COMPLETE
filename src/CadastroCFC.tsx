import React, { useState, useEffect, useCallback, useMemo } from "react";
import "./CadastroCFC.css";
import * as XLSX from "xlsx";
import { debounce } from 'lodash';

// Define a interface para os dados regionais
interface RegionalData {
  municipio: string;
  regional: string;
}

// Componente principal
/**
 * O componente CadastroClinicas é responsável por renderizar e gerenciar os dados das clínicas.
 * Inclui funcionalidades para buscar dados, filtrar, paginação e exportação de dados.
 *
 * @component
 * @returns {JSX.Element} O componente renderizado.
 *
 * @example
 * <CadastroClinicas />
 *
 * @typedef {Object} RegionalData
 * @property {string} municipio - O nome do município.
 * @property {string} regional - O nome da regional.
 *
 * @typedef {Object} ClinicData
 * @property {string} nome - O nome da clínica.
 * @property {string} endereco - O endereço da clínica.
 * @property {string} telefone - O número de telefone da clínica.
 * @property {string} email - O email da clínica.
 * @property {string} cnpj - O CNPJ da clínica.
 * @property {string} municipio - O município da clínica.
 * @property {string} regional - A regional da clínica.
 *
 * @state {string[][]} clinicasData - Os dados das clínicas.
 * @state {RegionalData[]} regionais - Os dados das regionais.
 * @state {number[]} columnWidths - As larguras das colunas.
 * @state {boolean} isLoading - O estado de carregamento.
 * @state {string} selectedCity - A cidade selecionada para filtragem.
 * @state {string} selectedRegional - A regional selecionada para filtragem.
 * @state {number} currentPage - O número da página atual para paginação.
 *
 * @constant {number} rowsPerPage - O número de linhas por página.
 *
 * @function fetchClinicasData - Busca os dados das clínicas do servidor.
 * @async
 * @throws {Error} Se houver um erro ao buscar os dados.
 *
 * @function fetchRegionais - Busca os dados das regionais do servidor.
 * @async
 * @throws {Error} Se houver um erro ao buscar os dados.
 *
 * @function handleInputChange - Lida com a mudança nos campos de entrada.
 * @param {number} rowIndex - O índice da linha que está sendo editada.
 * @param {number} cellIndex - O índice da célula que está sendo editada.
 * @param {string} value - O novo valor da célula.
 *
 * @function addNewRow - Adiciona uma nova linha aos dados.
 *
 * @function handleSubmit - Envia os dados para o servidor.
 * @async
 * @throws {Error} Se houver um erro ao enviar os dados.
 *
 * @function handleExport - Exporta os dados para um arquivo Excel.
 *
 * @function handleResize - Lida com o redimensionamento das colunas.
 * @param {number} index - O índice da coluna que está sendo redimensionada.
 * @param {React.MouseEvent} e - O evento do mouse.
 *
 * @function goToNextPage - Navega para a próxima página.
 *
 * @function goToPreviousPage - Navega para a página anterior.
 *
 * @function goToPage - Navega para uma página específica.
 * @param {number} page - O número da página para navegar.
 *
 * @function handleCityChange - Lida com a mudança na cidade selecionada.
 * @param {React.ChangeEvent<HTMLSelectElement>} e - O evento de mudança.
 *
 * @function handleRegionalChange - Lida com a mudança na regional selecionada.
 * @param {React.ChangeEvent<HTMLSelectElement>} e - O evento de mudança.
 *
 * @function Pagination - Renderiza os controles de paginação.
 *
 * @useEffect Busca os dados quando o componente é montado.
 */
/**
 * CadastroClinicas Component
 * 
 * Este componente é responsável por gerenciar o cadastro de clínicas, permitindo a visualização,
 * edição, adição e exportação de dados. Ele também oferece funcionalidades de paginação e filtragem
 * por cidade e regional.
 * 
 * @component
 * @example
 * return (
 *   <CadastroClinicas />
 * )
 * 
 * @returns {JSX.Element} O componente de cadastro de clínicas.
 * 
 * @typedef {Object} RegionalData
 * @property {string} municipio - O nome do município.
 * @property {string} regional - O nome da regional.
 * 
 * @typedef {Object} ClinicaData
 * @property {string} nome - O nome da clínica.
 * @property {string} endereco - O endereço da clínica.
 * @property {string} telefone - O telefone da clínica.
 * @property {string} email - O email da clínica.
 * @property {string} cnpj - O CNPJ da clínica.
 * @property {string} municipio - O município da clínica.
 * @property {string} regional - A regional da clínica.
 * 
 * @state {string[][]} clinicasData - Os dados das clínicas.
 * @state {RegionalData[]} regionais - Os dados das regionais.
 * @state {number[]} columnWidths - As larguras das colunas da tabela.
 * @state {boolean} isLoading - Indica se os dados estão sendo carregados.
 * @state {string} selectedCity - A cidade selecionada para filtragem.
 * @state {string} selectedRegional - A regional selecionada para filtragem.
 * @state {number} currentPage - A página atual da tabela.
 * 
 * @function fetchClinicasData - Carrega os dados das clínicas da planilha.
 * @function fetchRegionais - Carrega os dados das regionais da planilha.
 * @function handleInputChange - Lida com mudanças nos inputs da tabela.
 * @function addNewRow - Adiciona uma nova linha à tabela.
 * @function handleSubmit - Envia os dados das clínicas para o servidor.
 * @function handleExport - Exporta os dados das clínicas para um arquivo Excel.
 * @function handleResize - Lida com o redimensionamento das colunas da tabela.
 * @function goToNextPage - Navega para a próxima página da tabela.
 * @function goToPreviousPage - Navega para a página anterior da tabela.
 * @function goToPage - Navega para uma página específica da tabela.
 * @function handleCityChange - Lida com a mudança de cidade selecionada.
 * @function handleRegionalChange - Lida com a mudança de regional selecionada.
 * 
 * @hook useEffect - Carrega os dados das clínicas e regionais quando o componente é montado.
 * @hook useState - Gerencia os estados do componente.
 * @hook useCallback - Memoriza funções para evitar recriações desnecessárias.
 * @hook useMemo - Memoriza valores calculados para otimização de desempenho.
 */
const CadastroClinicas: React.FC = () => {
  const [clinicasData, setClinicasData] = useState<string[][]>([
    ["", "", "", "", "", "", ""],
  ]);
  const [regionais, setRegionais] = useState<RegionalData[]>([]);
  const [columnWidths, setColumnWidths] = useState<number[]>(
    new Array(7).fill(120)
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedRegional, setSelectedRegional] = useState<string>("");
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 20; // Número de linhas por página

  // Função para carregar os dados da planilha
  const fetchClinicasData = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/obter-planilha?aba=Cadastro Clínicas"
      );
      if (!response.ok) {
        throw new Error("Erro ao obter dados da planilha.");
      }
      const data = await response.json();
      if (data.status === "sucesso") {
        setClinicasData(data.valores);
      }
    } catch (error) {
      console.error("Erro ao carregar os dados:", error);
    }
  };

  // Função para buscar dados regionais na planilha
  const fetchRegionais = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/obter-planilha?aba=Regionais"
      );
      if (!response.ok) {
        throw new Error("Erro ao obter dados de regionais.");
      }
      const data = await response.json();
      
      if (data.status === "sucesso") {
        const parsedData: RegionalData[] = data.valores.map(
          (row: string[]) => ({
            municipio: row[0] || "",
            regional: row[1] || ""
          })
        );
        setRegionais(parsedData);
      }
    } catch (error) {
      console.error("Erro ao carregar regionais:", error);
    }
  };

  // Função otimizada para lidar com mudanças nos inputs
  const handleInputChange = useCallback((
    rowIndex: number,
    cellIndex: number,
    value: string
  ) => {
    setClinicasData(prevData => {
      const newData = [...prevData];
      if (!newData[rowIndex]) {
        newData[rowIndex] = ["", "", "", "", "", "", ""];
      }
      
      // Crie uma nova referência para a linha que está sendo editada
      newData[rowIndex] = [...newData[rowIndex]];
      newData[rowIndex][cellIndex] = value;

      if (cellIndex === 5) {
        const selectedRegional =
          regionais.find((r) => r.municipio === value)?.regional || "";
        newData[rowIndex][6] = selectedRegional;
      }

      return newData;
    });
  }, [regionais]);

  // Função para adicionar uma nova linha
  const addNewRow = useCallback(() => {
    setClinicasData(prevData => [...prevData, ["", "", "", "", "", "", ""]]);
    // Ir para a última página quando adicionar uma nova linha
    setCurrentPage(Math.ceil((clinicasData.length + 1) / rowsPerPage));
  }, [clinicasData.length, rowsPerPage]);

  /**
   * Lida com o envio dos dados das clínicas para o servidor.
   * 
   * Esta função envia uma requisição POST para o servidor com os dados das clínicas
   * para atualizar a planilha. Ela usa o estado `clinicasData` como payload.
   * 
   * @async
   * @function handleSubmit
   * @returns {Promise<void>} - Uma promessa que é resolvida quando os dados são salvos com sucesso.
   * 
   * @throws {Error} Lança um erro se a requisição falhar ou se o servidor responder com um status não OK.
   * 
   * @example
   * handleSubmit();
   */
  const handleSubmit = useCallback(async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/atualizar-planilha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aba: "Cadastro Clínicas",
          valores: clinicasData,  // Envia todos os dados, não apenas a página atual
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar os dados na planilha.");
      }

      const result = await response.json();
      console.log("Dados salvos com sucesso:", result);
      alert("Cadastro salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar os dados:", error);
      alert("Erro ao salvar os dados na planilha.");
    }
  }, [clinicasData]);

  const handleExport = useCallback(() => {
    const headers = [
      ["Nome da Clínica", "Endereço", "Telefone", "Email", "CNPJ", "Município", "Regional"]
    ];

    const sheetData = [
      ...headers,
      ...clinicasData
    ];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cadastro CFCs");
    XLSX.writeFile(wb, "cadastro-CFC.xlsx");
  }, [clinicasData]);

  // Filtra os dados com base nos seletores de filtro
  const filteredData = useMemo(() => {
    return clinicasData.filter((row) => {
      if (!row) return false;
      
      const cityMatches = !selectedCity || row[5] === selectedCity;
      const regionalMatches = !selectedRegional || 
        regionais.find((regional) => regional.municipio === row[5])?.regional === selectedRegional;
      
      return cityMatches && regionalMatches;
    });
  }, [clinicasData, selectedCity, selectedRegional, regionais]);

  // Calcula o número total de páginas
  const totalPages = useMemo(() => {
    return Math.ceil(filteredData.length / rowsPerPage);
  }, [filteredData, rowsPerPage]);

  // Obtém os dados para a página atual
  const currentPageData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  // Função para lidar com o redimensionamento das colunas
  const handleResize = useCallback((index: number, e: React.MouseEvent) => {
    const startX = e.clientX;
    const startWidth = columnWidths[index];

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = startWidth + (moveEvent.clientX - startX);
      setColumnWidths(prevWidths => {
        const updatedWidths = [...prevWidths];
        updatedWidths[index] = Math.max(newWidth, 50);
        return updatedWidths;
      });
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [columnWidths]);

  // Funções de navegação de páginas
  const goToNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const goToPreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  // Função para lidar com a mudança de cidade selecionada
  const handleCityChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCity(e.target.value);
    setSelectedRegional("");
    setCurrentPage(1); // Voltar para a primeira página ao filtrar
  }, []);

  const handleRegionalChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRegional(e.target.value);
    setSelectedCity("");
    setCurrentPage(1); // Voltar para a primeira página ao filtrar
  }, []);

  // Carrega os dados quando o componente é montado
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([fetchClinicasData(), fetchRegionais()]);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  // Componente para renderização das páginas
  const Pagination = () => (
    <div className="pagination">
      <button 
        onClick={goToPreviousPage} 
        disabled={currentPage === 1}
        className="pagination-button"
      >
        &laquo; Anterior
      </button>
      <span className="pagination-info">
        Página {currentPage} de {totalPages || 1}
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
        >
          {[...Array(totalPages)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div className="cadastro-clinicas-container">
      {isLoading ? (
        <div className="loading-container">
          <div className="loading-circle"></div>
        </div>
      ) : (
        <>
          <div className="filters">
            <select value={selectedCity} onChange={handleCityChange}>
              <option value="">Filtre por Cidade</option>
              {Array.from(new Set(clinicasData.map((row) => row?.[5] || "")))
                .filter(Boolean)
                .sort()
                .map((city, index) => (
                  <option key={index} value={city}>
                    {city}
                  </option>
                ))}
            </select>
            <select value={selectedRegional} onChange={handleRegionalChange}>
              <option value="">Filtre por Regional</option>
              {Array.from(
                new Set(regionais.map((regional) => regional.regional))
              )
                .filter(Boolean)
                .sort()
                .map((regional, index) => (
                  <option key={index} value={regional}>
                    {regional}
                  </option>
                ))}
            </select>
          </div>
          
          <div className="row-count">
            Total de CFCs Cadastradas: {filteredData.length}
          </div>
          
          <div className="button-container">
            <button className="btn salvar" onClick={handleSubmit}>
              Salvar Alterações
            </button>
            <button className="btn exportar" onClick={handleExport}>
              Exportar
            </button>
          </div>
          
          {/* Controles de paginação superior */}
          <Pagination />
          
          <table className="base-dados-table">
            <thead>
              <tr>
                {[
                  "Nome da Clínica",
                  "Endereço",
                  "Telefone",
                  "Email",
                  "CNPJ",
                  "Município",
                  "Regional",
                ].map((header, index) => (
                  <th key={index} style={{ width: columnWidths[index] + "px" }}>
                    {header}
                    <div
                      className="resizer"
                      onMouseDown={(e) => handleResize(index, e)}
                    ></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentPageData.map((row, rowIndex) => {
                // Calcule o índice real no conjunto de dados completo
                const realIndex = (currentPage - 1) * rowsPerPage + rowIndex;
                
                return (
                  <tr key={realIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>
                        {cellIndex === 5 ? (
                          <select
                            value={cell}
                            onChange={(e) =>
                              handleInputChange(
                                realIndex,
                                cellIndex,
                                e.target.value
                              )
                            }
                          >
                            <option value="">Selecione um município</option>
                            {regionais.map((item, index) => (
                              <option key={index} value={item.municipio}>
                                {item.municipio}
                              </option>
                            ))}
                          </select>
                        ) : cellIndex === 6 ? (
                          <input type="text" value={cell} readOnly />
                        ) : (
                          <input
                            type="text"
                            value={cell}
                            onChange={(e) =>
                              handleInputChange(
                                realIndex,
                                cellIndex,
                                e.target.value
                              )
                            }
                            placeholder={
                              [
                                "Nome",
                                "Endereço",
                                "Telefone",
                                "Email",
                                "CNPJ",
                                "Município",
                                "Regional",
                              ][cellIndex]
                            }
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {/* Controles de paginação inferior */}
          <Pagination />
          
          <button className="add-row-button" onClick={addNewRow}>
            +
          </button>
        </>
      )}
    </div>
  );
};

export default CadastroClinicas;