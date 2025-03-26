import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import * as XLSX from 'xlsx';
import './Dashboard.css';

interface Municipio {
  nome: string;
  fase: string;
}

interface Processo {
  contrato: string;
  suite: string;
  cidade: string;
  categoria: string;
  status: string;
}

/**
 * Componente Dashboard que busca e exibe dados de várias fontes CSV.
 * Fornece funcionalidades de filtragem e exportação para diferentes visualizações de dados.
 *
 * @componente
 * @retorna {JSX.Element} O componente renderizado.
 *
 * @typedef {Object} Municipio
 * @propriedade {string} nome - O nome do município.
 * @propriedade {string} fase - A fase do município.
 *
 * @typedef {Object} Processo
 * @propriedade {string} contrato - O identificador do contrato.
 * @propriedade {string} suite - O identificador da suíte.
 * @propriedade {string} cidade - O nome da cidade.
 * @propriedade {string} categoria - A categoria do processo.
 * @propriedade {string} status - O status do processo.
 *
 * @typedef {Object} StatusContratacao
 * @propriedade {string} municipio - O nome do município.
 * @propriedade {string} tipo - O tipo do status.
 * @propriedade {string} status - A descrição do status.
 * @propriedade {number} finalizadas - A contagem de status finalizados.
 * @propriedade {number} naoFinalizadas - A contagem de status não finalizados.
 *
 * @function parseCSV
 * @async
 * @param {string} url - A URL do arquivo CSV a ser analisado.
 * @retorna {Promise<any[]>} Os dados CSV analisados.
 *
 * @function determinarFase
 * @param {string} municipio - O nome do município.
 * @param {any[]} cfcData - Os dados do CFC.
 * @param {any[]} clinicasData - Os dados das clínicas.
 * @param {any[]} postoDetranData - Os dados do posto do Detran.
 * @retorna {string} A fase determinada para o município.
 *
 * @function handleFilter
 * @param {string} fase - A fase para filtrar.
 *
 * @function clearFilter
 * Limpa o filtro de fase e redefine os municípios filtrados.
 *
 * @function handleStatusFilter
 * @retorna {Municipio[]} Os municípios filtrados com base nos filtros selecionados.
 *
 * @function handleMunicipioFilter
 * @param {string} municipio - O município para filtrar.
 *
 * @function handleCategoriaFilter
 * @param {string} categoria - A categoria para filtrar.
 *
 * @function clearProcessoFilter
 * Limpa os filtros de processo e redefine os processos filtrados.
 *
 * @function exportToXLSX
 * Exporta os dados da visualização atual para um arquivo XLSX.
 *
 * @function getBarColor
 * @param {number} percentual - A porcentagem para determinar a cor da barra.
 * @retorna {string} A cor para a barra de porcentagem.
 *
 * @function getStatusByCount
 * @param {number} count - A contagem para determinar o status.
 * @retorna {string} A descrição do status com base na contagem.
 *
 * @function calcularPercentualFiltrado
 * @retorna {number} A porcentagem calculada dos dados filtrados.
 */
/**
 * O componente Dashboard é um componente funcional do React que gerencia e exibe dados relacionados a municípios,
 * suas fases, status de contratos e processos abertos. Ele busca dados de várias fontes CSV, processa-os e fornece
 * funcionalidades de filtragem e exportação.
 *
 * @componente
 * @exemplo
 * return (
 *   <Dashboard />
 * )
 *
 * @retorna {JSX.Element} O componente renderizado.
 *
 * @typedef {Object} Municipio
 * @propriedade {string} nome - O nome do município.
 * @propriedade {string} fase - A fase do município.
 *
 * @typedef {Object} Processo
 * @propriedade {string} contrato - O identificador do contrato.
 * @propriedade {string} suite - O identificador da suíte.
 * @propriedade {string} cidade - O nome da cidade.
 * @propriedade {string} categoria - A categoria do processo.
 * @propriedade {string} status - O status do processo.
 *
 * @typedef {Object} StatusContratacao
 * @propriedade {string} municipio - O nome do município.
 * @propriedade {string} tipo - O tipo da entidade (ex.: CFC, Clínica).
 * @propriedade {string} status - O status normalizado.
 * @propriedade {number} finalizadas - Indicador se o status é "Sim" (1 se verdadeiro, 0 caso contrário).
 * @propriedade {number} naoFinalizadas - Indicador se o status é "Nao" ou "Não" (1 se verdadeiro, 0 caso contrário).
 *
 * @function parseCSV
 * @async
 * @param {string} url - A URL do arquivo CSV a ser analisado.
 * @retorna {Promise<any[]>} Os dados CSV analisados.
 *
 * @function determinarFase
 * @param {string} municipio - O nome do município a ser verificado.
 * @param {any[]} cfcData - Um array de dados de CFC onde cada item é um array e o nome do município está no índice 5.
 * @param {any[]} clinicasData - Um array de dados de clínicas onde cada item é um array e o nome do município está no índice 5.
 * @param {any[]} postoDetranData - Um array de dados de postos do Detran onde cada item é um array e o nome do município está no índice 0.
 * @retorna {string} A fase do município: "Fase 1", "Fase 2" ou "Fase 3".
 *
 * @function handleFilter
 * @param {string} fase - A fase para filtrar os municípios.
 *
 * @function clearFilter
 * Limpa o filtro de fase e redefine os municípios filtrados para a lista original.
 *
 * @function handleStatusFilter
 * Filtra os municípios com base na fase, município e categoria selecionados.
 * @retorna {Municipio[]} A lista filtrada de municípios.
 *
 * @function handleMunicipioFilter
 * @param {string} municipio - O município para filtrar os processos.
 *
 * @function handleCategoriaFilter
 * @param {string} categoria - A categoria para filtrar os processos.
 *
 * @function clearProcessoFilter
 * Limpa os filtros de município e categoria e redefine os processos filtrados para a lista original.
 *
 * @function exportToXLSX
 * Exporta os dados da tabela atualmente exibida para um arquivo XLSX.
 *
 * @function getBarColor
 * @param {number} percentual - A porcentagem para determinar a cor da barra.
 * @retorna {string} A cor correspondente à porcentagem fornecida.
 *
 * @function getStatusByCount
 * @param {number} count - A contagem representando o status.
 * @retorna {string} A descrição do status correspondente à contagem fornecida.
 *
 * @function calcularPercentualFiltrado
 * Calcula a porcentagem de contratos finalizados para os municípios e categoria filtrados.
 * @retorna {number} A porcentagem calculada.
 */
const Dashboard: React.FC = () => {
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [showTable, setShowTable] = useState<boolean>(false);
  const [showStatusTable, setShowStatusTable] = useState<boolean>(false);
  const [showProcessosAbertos, setShowProcessosAbertos] = useState<boolean>(false);
  const [filteredMunicipios, setFilteredMunicipios] = useState<Municipio[]>([]);
  const [selectedFase, setSelectedFase] = useState<string | null>(null);
  const [statusContratacao, setStatusContratacao] = useState<any[]>([]);
  const [processosAbertos, setProcessosAbertos] = useState<Processo[]>([]);
  const [filteredProcessos, setFilteredProcessos] = useState<Processo[]>([]);
  const [selectedMunicipio, setSelectedMunicipio] = useState<string | null>(null);
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);

  const parseCSV = async (url: string): Promise<any[]> => {
    const response = await fetch(url);
    const csvText = await response.text();
    const { data } = Papa.parse(csvText, { header: false });
    return data;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cfcData = await parseCSV(
          "https://docs.google.com/spreadsheets/d/1L1uxINmH3tK8KK1W7VAoBP11bYd4ry_pPqj7xp2ImU8/export?format=csv&gid=426264755"
        );
        const clinicasData = await parseCSV(
          "https://docs.google.com/spreadsheets/d/1L1uxINmH3tK8KK1W7VAoBP11bYd4ry_pPqj7xp2ImU8/export?format=csv&gid=75694551"
        );
        const postoDetranData = await parseCSV(
          "https://docs.google.com/spreadsheets/d/1L1uxINmH3tK8KK1W7VAoBP11bYd4ry_pPqj7xp2ImU8/export?format=csv&gid=1219973305"
        );

        const statusContratacaoData = await parseCSV(
          "https://docs.google.com/spreadsheets/d/1L1uxINmH3tK8KK1W7VAoBP11bYd4ry_pPqj7xp2ImU8/export?format=csv&gid=874746158"
        );

        /**
         * Mapeia o array `statusContratacaoData` para um novo array de objetos com status calculado.
         * Cada objeto contém as seguintes propriedades:
         * - `municipio`: O nome do município a partir do 3º elemento do array do item.
         * - `tipo`: O tipo a partir do 4º elemento do array do item.
         * - `status`: O status normalizado a partir do 24º elemento do array do item, com diacríticos removidos.
         * - `finalizadas`: Um indicador se o status é "Sim" (1 se verdadeiro, 0 caso contrário).
         * - `naoFinalizadas`: Um indicador se o status é "Nao" ou "Não" (1 se verdadeiro, 0 caso contrário).
         *
         * @param {any[]} statusContratacaoData - O array de dados a ser mapeado.
         * @returns {Array<{ municipio: string, tipo: string, status: string, finalizadas: number, naoFinalizadas: number }>} O array mapeado de objetos com status calculado.
         */
        const statusContratacaoCalculado = statusContratacaoData.map((item: any) => ({
          municipio: item[2],
          tipo: item[3],
          status: item[23].normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
          finalizadas: item[23] === "Sim" ? 1 : 0,
          naoFinalizadas: (item[23] === "Nao" || item[23] === "Não") ? 1 : 0
        }));

        setStatusContratacao(statusContratacaoCalculado);

        const uniqueMunicipios = Array.from(
          new Set([
            ...postoDetranData.map((item: any) => item[0]),
            ...clinicasData.map((item: any) => item[5]),
            ...cfcData.map((item: any) => item[5]),
          ])
        )
          .filter((municipio) => municipio)
          .map((municipio) => ({
            nome: municipio,
            fase: determinarFase(
              municipio,
              cfcData,
              clinicasData,
              postoDetranData
            ),
          }));

        setMunicipios(uniqueMunicipios);
        setFilteredMunicipios(uniqueMunicipios);

        const processosAbertosData = statusContratacaoData
          .filter((item: any) => item[23] === "Não")
          .map((item: any) => {
            const simCount = item.slice(4, 25).filter((col: string) => col === "Sim").length;
            const status = getStatusByCount(simCount);
            return {
              contrato: item[0],
              suite: item[1],
              cidade: item[2],
              categoria: item[3],
              status: status,
            };
          });

        setProcessosAbertos(processosAbertosData);
        setFilteredProcessos(processosAbertosData);
      } catch (error) {
        console.error("Erro ao carregar os dados:", error);
      }
    };

    fetchData();
  }, []);

  /**
   * Determina a fase de um município com base na presença de clínicas, CFCs e postos do Detran.
   *
   * @param municipio - O nome do município a ser verificado.
   * @param cfcData - Um array de dados de CFC onde cada item é um array e o nome do município está no índice 5.
   * @param clinicasData - Um array de dados de clínicas onde cada item é um array e o nome do município está no índice 5.
   * @param postoDetranData - Um array de dados de postos do Detran onde cada item é um array e o nome do município está no índice 0.
   * @returns Uma string representando a fase do município:
   * - "Fase 1" se o município tiver pelo menos duas das três entidades (clínicas, CFCs, postos do Detran).
   * - "Fase 2" se o município tiver exatamente uma das três entidades.
   * - "Fase 3" se o município não tiver nenhuma das três entidades.
   */
  const determinarFase = (
    municipio: string,
    cfcData: any[],
    clinicasData: any[],
    postoDetranData: any[]
  ) => {
    const hasClinica = clinicasData.some((item) => item[5] === municipio);
    const hasCFC = cfcData.some((item) => item[5] === municipio);
    const hasPostoDetran = postoDetranData.some((item) => item[0] === municipio);

    const count = [hasClinica, hasCFC, hasPostoDetran].filter(Boolean).length;

    if (count >= 2) {
      return "Fase 1";
    } else if (count === 1) {
      return "Fase 2";
    } else {
      return "Fase 3";
    }
  };

  const handleFilter = (fase: string) => {
    setSelectedFase(fase);
    const filtered = municipios.filter((municipio) => municipio.fase === fase);
    setFilteredMunicipios(filtered);
  };

  const clearFilter = () => {
    setSelectedFase(null);
    setFilteredMunicipios(municipios);
  };

  const handleStatusFilter = () => {
    let filtered = municipios;

    if (selectedFase) {
      filtered = filtered.filter(municipio => municipio.fase === selectedFase);
    }

    if (selectedMunicipio) {
      filtered = filtered.filter(municipio => municipio.nome === selectedMunicipio);
    }

    if (selectedCategoria) {
      const municipiosComCategoria = statusContratacao
        .filter(status => status.tipo === selectedCategoria)
        .map(status => status.municipio);
      filtered = filtered.filter(municipio => municipiosComCategoria.includes(municipio.nome));
    }

    return filtered;
  };

  const handleMunicipioFilter = (municipio: string) => {
    setSelectedMunicipio(municipio);
    const filtered = processosAbertos.filter((processo) => 
      processo.cidade === municipio &&
      (!selectedCategoria || processo.categoria === selectedCategoria)
    );
    setFilteredProcessos(filtered);
  };

  const handleCategoriaFilter = (categoria: string) => {
    setSelectedCategoria(categoria);
    const filtered = processosAbertos.filter((processo) => 
      processo.categoria === categoria &&
      (!selectedMunicipio || processo.cidade === selectedMunicipio)
    );
    setFilteredProcessos(filtered);
  };

  const clearProcessoFilter = () => {
    setSelectedMunicipio(null);
    setSelectedCategoria(null);
    setFilteredProcessos(processosAbertos);
  };

  const exportToXLSX = () => {
    let worksheet;
    let workbook = XLSX.utils.book_new();

    if (showTable) {
      worksheet = XLSX.utils.json_to_sheet(filteredMunicipios);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Fases do Município");
    } else if (showStatusTable) {
      worksheet = XLSX.utils.json_to_sheet(statusContratacao);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Status da Contratação");
    } else if (showProcessosAbertos) {
      worksheet = XLSX.utils.json_to_sheet(filteredProcessos);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Processos em Abertos");
    }

    XLSX.writeFile(workbook, showTable ? "fases_do_municipio.xlsx" : showStatusTable ? "status_contratacao.xlsx" : "processos_em_abertos.xlsx");
  };

  const getBarColor = (percentual: number) => {
    if (percentual < 40) {
      return "#ff6b6b";
    } else if (percentual < 90) {
      return "#f3e56d";
    } else {
      return "#90ee90";
    }
  };

  /**
   * Returns the status description based on the provided count.
   *
   * @param {number} count - The count representing the status.
   * @returns {string} The status description corresponding to the given count.
   * If the count does not match any predefined status, "Status Desconhecido" is returned.
   */
  const getStatusByCount = (count: number) => {
    const statusMap: { [key: number]: string } = {
      1: "PROCESSO ABERTO (DIHAB)",
      2: "AUTORIZADO (SUPER)",
      3: "INFOS ORÇAMENTÁRIAS (NEXEC)",
      4: "DECLARAÇÃO DE ORDENADOR REALIZADA (DIAF)",
      5: "CONTRATO ELABORADO (NUCON)",
      6: "CERTIDÃO LICITAWEB (LICIT)",
      7: "MAPA DE PREÇOS LICITAWEB ASSINADO (DIAF)",
      8: "CONTRATO ENVIADO À EMPRESA",
      9: "CONTRATO ASSINADO DEVOLVIDO AO DETRAN",
      10: "PARECER JURÍDICO ELABORADO (NUCON)",
      11: "PARECER ASSINADO (ADV NUCON)",
      12: "PARECER ASSINADO (DIJUR)",
      13: "CONTRATO ASSINADO (SUPER)",
      14: "CADASTRADO NO SISTEMA SACC",
      15: "EDOWEB OK",
      16: "OFÍCIO OK",
      17: "EDOWEB ASSINADO (DIJUR)",
      18: "OFÍCIO ASSINADO (SUPER)",
      19: "ENVIADO À CASA CIVIL",
      20: "CONTRATO PUBLICADO",
      21: "CLÍNICA COM CRÉDITO A UTILIZAR",
    };
    return statusMap[count] || "Status Desconhecido";
  };

  const calcularPercentualFiltrado = () => {
    const municipiosFiltrados = handleStatusFilter();
    
    const statusFiltrado = statusContratacao.filter(status => 
      municipiosFiltrados.some(m => m.nome === status.municipio) &&
      (!selectedCategoria || status.tipo === selectedCategoria)
    );

    const totalFinalizadas = statusFiltrado.reduce((acc, curr) => acc + curr.finalizadas, 0);
    const totalNaoFinalizadas = statusFiltrado.reduce((acc, curr) => acc + curr.naoFinalizadas, 0);
    const total = totalFinalizadas + totalNaoFinalizadas;
    
    return total > 0 ? (totalFinalizadas / total) * 100 : 0;
  };

  const percentualFiltrado = calcularPercentualFiltrado();
  const barColorFiltrado = getBarColor(percentualFiltrado);

  return (
    <div className="dashboard-container">
      <div className="button-container">
        {showTable || showStatusTable || showProcessosAbertos ? (
          <button className="toggle-table-button" onClick={exportToXLSX}>
            Exportar
          </button>
        ) : null}
        <button
          className={`toggle-table-button ${showTable ? "selected-button" : ""}`}
          onClick={() => {
            setShowTable(true);
            setShowStatusTable(false);
            setShowProcessosAbertos(false);
          }}
        >
          Fases do Município
        </button>
        <button
          className={`toggle-table-button ${showStatusTable ? "selected-button" : ""}`}
          onClick={() => {
            setShowTable(false);
            setShowStatusTable(true);
            setShowProcessosAbertos(false);
          }}
        >
          Status da Contratação
        </button>
        <button
          className={`toggle-table-button ${showProcessosAbertos ? "selected-button" : ""}`}
          onClick={() => {
            setShowTable(false);
            setShowStatusTable(false);
            setShowProcessosAbertos(true);
          }}
        >
          Processos em Abertos
        </button>
      </div>

      {showTable && (
        <>
          {selectedFase && (
            <div className="count-text">
              Total de municípios na {selectedFase}: {filteredMunicipios.length}
            </div>
          )}
          <div className="filter-buttons">
            <button
              className={`toggle-table-button ${selectedFase === "Fase 1" ? "selected" : ""}`}
              onClick={() => handleFilter("Fase 1")}
            >
              Fase 1
            </button>
            <button
              className={`toggle-table-button ${selectedFase === "Fase 2" ? "selected" : ""}`}
              onClick={() => handleFilter("Fase 2")}
            >
              Fase 2
            </button>
            <button
              className={`toggle-table-button ${selectedFase === "Fase 3" ? "selected" : ""}`}
              onClick={() => handleFilter("Fase 3")}
            >
              Fase 3
            </button>
            <button className="toggle-table-button" onClick={clearFilter}>
              Limpar Filtro
            </button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Município</th>
                  <th>Fase</th>
                </tr>
              </thead>
              <tbody>
                {filteredMunicipios.map((municipio, index) => (
                  <tr key={index}>
                    <td>{municipio.nome}</td>
                    <td>{municipio.fase}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showStatusTable && (
        <>
          <div className="filter-buttons">
            <select 
              onChange={(e) => setSelectedFase(e.target.value)} 
              value={selectedFase || ""}
              style={{ color: 'white', backgroundColor: '#333', padding: '8px', borderRadius: '4px', border: '1px solid #555' }}
                >
              <option value="">Todas as Fases</option>
              <option value="Fase 1">Fase 1</option>
              <option value="Fase 2">Fase 2</option>
              <option value="Fase 3">Fase 3</option>
            </select>
            <select onChange={(e) => setSelectedMunicipio(e.target.value)} value={selectedMunicipio || ""}>
              <option value="">Todos os Municípios</option>
              {municipios.map((municipio, index) => (
                <option key={index} value={municipio.nome}>{municipio.nome}</option>
              ))}
            </select>
            <select onChange={(e) => setSelectedCategoria(e.target.value)} value={selectedCategoria || ""}>
              <option value="">Todas as Categorias</option>
              {Array.from(new Set(statusContratacao.map(status => status.tipo))).map((categoria, index) => (
                <option key={index} value={categoria}>{categoria}</option>
              ))}
            </select>
            <button 
              className="toggle-table-button" 
              onClick={() => {
                setSelectedFase(null);
                setSelectedMunicipio(null);
                setSelectedCategoria(null);
              }}
            >
              Limpar Filtros
            </button>
          </div>
          <div className="percent-bar-container">
            <h3>Porcentagem geral de Contratação</h3>
            <div 
              className="percent-bar" 
              style={{ 
                width: `${percentualFiltrado}%`, 
                backgroundColor: barColorFiltrado 
              }}
            >
              {percentualFiltrado.toFixed(2)}%
            </div>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Fase</th>
                  <th>Município</th>
                  <th>CFC</th>
                  <th>Clínica</th>
                  <th>Percentual Contratação</th>
                </tr>
              </thead>
              <tbody>
                {handleStatusFilter().map((municipio, index) => {
                  const cfcSimCount = statusContratacao
                    .filter(status => status.municipio === municipio.nome && status.tipo === "CFC")
                    .reduce((acc, curr) => acc + curr.finalizadas, 0);
                  const clinicaSimCount = statusContratacao
                    .filter(status => status.municipio === municipio.nome && status.tipo === "Clínica")
                    .reduce((acc, curr) => acc + curr.finalizadas, 0);
                  const cfcNaoCount = statusContratacao
                    .filter(status => status.municipio === municipio.nome && status.tipo === "CFC")
                    .reduce((acc, curr) => acc + curr.naoFinalizadas, 0);
                  const clinicaNaoCount = statusContratacao
                    .filter(status => status.municipio === municipio.nome && status.tipo === "Clínica")
                    .reduce((acc, curr) => acc + curr.naoFinalizadas, 0);
                  const totalFinalizadas = cfcSimCount + clinicaSimCount;
                  const totalNaoFinalizadas = cfcNaoCount + clinicaNaoCount;
                  const percentualContratacao = (totalFinalizadas + totalNaoFinalizadas) > 0 
                    ? (totalFinalizadas / (totalFinalizadas + totalNaoFinalizadas)) * 100 
                    : 0;
                  const barColor = getBarColor(percentualContratacao);
                  
                  return (
                    <tr key={index}>
                      <td>{municipio.fase}</td>
                      <td>{municipio.nome}</td>
                      <td>{cfcSimCount} / {cfcNaoCount}</td>
                      <td>{clinicaSimCount} / {clinicaNaoCount}</td>
                      <td>
                        {percentualContratacao === 0 ? (
                          <div style={{ 
                            backgroundColor: "#ff6b6b", 
                            color: "#fff", 
                            padding: "5px", 
                            borderRadius: "5px" 
                          }}>
                            0%
                          </div>
                        ) : (
                          <div className="percent-bar-container">
                            <div 
                              className="percent-bar" 
                              style={{ 
                                width: `${percentualContratacao}%`, 
                                backgroundColor: barColor 
                              }}
                            >
                              {percentualContratacao.toFixed(2)}%
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showProcessosAbertos && (
        <>
          <div className="filter-buttons">
            <select onChange={(e) => handleMunicipioFilter(e.target.value)} value={selectedMunicipio || ""}>
              <option value="">Todos os Municípios</option>
              {municipios.map((municipio, index) => (
                <option key={index} value={municipio.nome}>{municipio.nome}</option>
              ))}
            </select>
            <select onChange={(e) => handleCategoriaFilter(e.target.value)} value={selectedCategoria || ""}>
              <option value="">Todas as Categorias</option>
              {Array.from(new Set(processosAbertos.map(processo => processo.categoria))).map((categoria, index) => (
                <option key={index} value={categoria}>{categoria}</option>
              ))}
            </select>
            <button className="toggle-table-button" onClick={clearProcessoFilter}>
              Limpar Filtros
            </button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Contrato</th>
                  <th>Suite</th>
                  <th>Cidade</th>
                  <th>Categoria</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredProcessos.map((processo, index) => (
                  <tr key={index}>
                    <td>{processo.contrato}</td>
                    <td>{processo.suite}</td>
                    <td>{processo.cidade}</td>
                    <td>{processo.categoria}</td>
                    <td>{processo.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;

