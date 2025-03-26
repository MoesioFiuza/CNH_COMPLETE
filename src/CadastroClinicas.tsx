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
 * O componente CadastroClinicas é responsável por gerenciar o cadastro de clínicas.
 * Ele permite que os usuários visualizem, filtrem, editem e salvem dados das clínicas, 
 * bem como exportem os dados para um arquivo Excel.
 * 
 * @component
 * @returns {JSX.Element} O componente renderizado.
 * 
 * @typedef {Object} RegionalData
 * @property {string} municipio - O nome do município.
 * @property {string} regional - O nome da regional.
 * 
 * @typedef {Object} ClinicData
 * @property {string} nome - O nome da clínica.
 * @property {string} endereco - O endereço da clínica.
 * @property {string} telefone - O número de telefone da clínica.
 * @property {string} email - O endereço de email da clínica.
 * @property {string} cnpj - O CNPJ da clínica.
 * @property {string} municipio - O município da clínica.
 * @property {string} regional - A regional da clínica.
 * 
 * @typedef {Object} FetchResponse
 * @property {string} status - O status da resposta.
 * @property {string[][]} valores - Os valores retornados da busca.
 * 
 * @typedef {Object} PaginationProps
 * @property {number} currentPage - O número da página atual.
 * @property {number} totalPages - O número total de páginas.
 * @property {Function} goToPreviousPage - Função para navegar para a página anterior.
 * @property {Function} goToNextPage - Função para navegar para a próxima página.
 * @property {Function} goToPage - Função para navegar para uma página específica.
 * 
 * @typedef {Object} FilterProps
 * @property {string} selectedCity - A cidade selecionada para filtragem.
 * @property {string} selectedRegional - A regional selecionada para filtragem.
 * @property {Function} handleCityChange - Função para lidar com mudanças no filtro de cidade.
 * @property {Function} handleRegionalChange - Função para lidar com mudanças no filtro de regional.
 * 
 * @typedef {Object} TableProps
 * @property {string[][]} currentPageData - Os dados a serem exibidos na página atual.
 * @property {number[]} columnWidths - As larguras das colunas da tabela.
 * @property {Function} handleInputChange - Função para lidar com mudanças nos inputs da tabela.
 * @property {Function} handleResize - Função para lidar com o redimensionamento das colunas da tabela.
 * 
 * @typedef {Object} ButtonProps
 * @property {Function} handleSubmit - Função para lidar com a submissão do formulário.
 * @property {Function} handleExport - Função para lidar com a exportação dos dados.
 * @property {Function} addNewRow - Função para adicionar uma nova linha à tabela.
 * 
 * @typedef {Object} LoadingProps
 * @property {boolean} isLoading - Indica se os dados estão sendo carregados.
 * 
 * @typedef {Object} DataProps
 * @property {string[][]} clinicasData - Os dados das clínicas.
 * @property {RegionalData[]} regionais - Os dados das regionais.
 * 
 * @typedef {Object} StateProps
 * @property {boolean} isLoading - Indica se os dados estão sendo carregados.
 * @property {string} selectedCity - A cidade selecionada para filtragem.
 * @property {string} selectedRegional - A regional selecionada para filtragem.
 * @property {number} currentPage - O número da página atual.
 * @property {number[]} columnWidths - As larguras das colunas da tabela.
 * @property {string[][]} clinicasData - Os dados das clínicas.
 * @property {RegionalData[]} regionais - Os dados das regionais.
 * 
 * @typedef {Object} FetchProps
 * @property {Function} fetchClinicasData - Função para buscar os dados das clínicas.
 * @property {Function} fetchRegionais - Função para buscar os dados das regionais.
 * 
 * @typedef {Object} MemoProps
 * @property {Function} filteredData - Função para filtrar os dados das clínicas com base nos filtros selecionados.
 * @property {Function} totalPages - Função para calcular o número total de páginas.
 * @property {Function} currentPageData - Função para obter os dados da página atual.
 * 
 * @typedef {Object} CallbackProps
 * @property {Function} handleInputChange - Função para lidar com mudanças nos inputs da tabela.
 * @property {Function} addNewRow - Função para adicionar uma nova linha à tabela.
 * @property {Function} handleSubmit - Função para lidar com a submissão do formulário.
 * @property {Function} handleExport - Função para lidar com a exportação dos dados.
 * @property {Function} handleResize - Função para lidar com o redimensionamento das colunas da tabela.
 * @property {Function} goToNextPage - Função para navegar para a próxima página.
 * @property {Function} goToPreviousPage - Função para navegar para a página anterior.
 * @property {Function} goToPage - Função para navegar para uma página específica.
 * @property {Function} handleCityChange - Função para lidar com mudanças no filtro de cidade.
 * @property {Function} handleRegionalChange - Função para lidar com mudanças no filtro de regional.
 * 
 * @typedef {Object} EffectProps
 * @property {Function} fetchData - Função para buscar os dados quando o componente é montado.
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
  /**
   * Lida com o evento de mudança de entrada para uma célula específica na tabela.
   * Atualiza o estado com o novo valor e, se a célula sendo editada for a 6ª coluna,
   * também atualiza a 7ª coluna com o valor regional correspondente com base no município selecionado.
   *
   * @param rowIndex - O índice da linha que está sendo editada.
   * @param cellIndex - O índice da célula que está sendo editada.
   * @param value - O novo valor a ser definido na célula.
   */
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