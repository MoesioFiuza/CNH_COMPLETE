import React, { useState, useEffect } from 'react';
import './Contratacao.css';

interface ContratacaoData {
  contrato: string;
  suite: string;
  municipio: string;
  categoria: string;
  status: Record<string, boolean>;
}

interface BaseRow {
  [key: number]: string; // Representa cada índice como string
}

const Contratacao: React.FC = () => {
  const [contratacaoData, setContratacaoData] = useState<ContratacaoData[]>([]);
  const [filteredData, setFilteredData] = useState<ContratacaoData[]>([]);
  const [municipios, setMunicipios] = useState<string[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [selectedMunicipio, setSelectedMunicipio] = useState<string>('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const statusList = [
    'PROCESSO ABERTO (DIHAB)',
    'AUTORIZADO (SUPER)',
    'INFOS ORÇAMENTÁRIAS (NEXEC)',
    'DECLARAÇÃO DE ORDENADOR REALIZADA (DIAF)',
    'CONTRATO ELABORADO (NUCON)',
    'CERTIDÃO LICITAWEB (LICIT)',
    'MAPA DE PREÇOS LICITAWEB ASSINADO (DIAF)',
    'CONTRATO ENVIADO À EMPRESA',
    'CONTRATO ASSINADO DEVOLVIDO AO DETRAN',
    'PARECER JURÍDICO ELABORADO (NUCON)',
    'PARECER ASSINADO (ADV NUCON)',
    'PARECER ASSINADO (DIJUR)',
    'CONTRATO ASSINADO (SUPER)',
    'CADASTRADO NO SISTEMA SACC',
    'EDOWEB OK',
    'OFÍCIO OK',
    'EDOWEB ASSINADO (DIJUR)',
    'OFÍCIO ASSINADO (SUPER)',
    'ENVIADO À CASA CIVIL',
    'CONTRATO PUBLICADO',
    'CLÍNICA COM CRÉDITO A UTILIZAR',
  ];

  const fetchContratacaoData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://127.0.0.1:8000/obter-planilha?aba=Base de Dados');
      const baseData = (await response.json()) as { valores: BaseRow[] };

      // Filtrar apenas os contratos e suítes válidos
      const fetchedData = baseData.valores
        .filter((row: BaseRow) => row[6] && row[8]) // Contrato e Suite
        .map((row: BaseRow) => ({
          contrato: row[6],
          suite: row[8],
          municipio: row[1], // Supondo que o município está na coluna 1
          categoria: row[0], // Supondo que a categoria está na coluna 0
          status: statusList.reduce((acc, status) => {
            acc[status] = false;
            return acc;
          }, {} as Record<string, boolean>),
        }));

      setContratacaoData(fetchedData);
      setFilteredData(fetchedData);

      // Extraindo municípios e categorias únicos
      const uniqueMunicipios = Array.from(new Set(fetchedData.map((row) => row.municipio)));
      const uniqueCategorias = Array.from(new Set(fetchedData.map((row) => row.categoria)));
      setMunicipios(uniqueMunicipios);
      setCategorias(uniqueCategorias);
    } catch (error) {
      console.error('Erro ao carregar os dados de Contratação:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setIsLoading(true);

      const valores = contratacaoData.map((row) => [
        row.contrato,
        row.suite,
        row.municipio,
        row.categoria,
        ...statusList.map((status) => (row.status[status] ? 'Sim' : 'Não')),
      ]);

      const response = await fetch('http://127.0.0.1:8000/atualizar-planilha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aba: 'Contratação!A1:Z10000',
          valores,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar os dados na planilha.');
      }

      const result = await response.json();
      console.log('Dados salvos com sucesso:', result);
      alert('Alterações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar os dados:', error);
      alert('Erro ao salvar os dados na planilha.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilter = () => {
    let filtered = contratacaoData;

    if (selectedMunicipio) {
      filtered = filtered.filter((row) => row.municipio === selectedMunicipio);
    }

    if (selectedCategoria) {
      filtered = filtered.filter((row) => row.categoria === selectedCategoria);
    }

    setFilteredData(filtered);
  };

  useEffect(() => {
    fetchContratacaoData();
  }, []);

  useEffect(() => {
    handleFilter();
  }, [selectedMunicipio, selectedCategoria]);

  return (
    <div className="contratacao-container">
      <div className="filters">
        <select
          value={selectedMunicipio}
          onChange={(e) => setSelectedMunicipio(e.target.value)}
        >
          <option value="">Todos os Municípios</option>
          {municipios.map((municipio, index) => (
            <option key={index} value={municipio}>
              {municipio}
            </option>
          ))}
        </select>

        <select
          value={selectedCategoria}
          onChange={(e) => setSelectedCategoria(e.target.value)}
        >
          <option value="">Todas as Categorias</option>
          {categorias.map((categoria, index) => (
            <option key={index} value={categoria}>
              {categoria}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="loading-container">Carregando...</div>
      ) : (
        filteredData.map((row, rowIndex) => (
          <div key={rowIndex} className="contratacao-row">
            <h3>
              Contrato: {row.contrato} | Suite: {row.suite}
            </h3>
            <div className="checkboxes">
              {statusList.map((status, statusIndex) => (
                <label key={statusIndex} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={row.status[status]}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFilteredData((prev) => {
                        const newData = [...prev];
                        newData[rowIndex].status[status] = checked;
                        return newData;
                      });
                    }}
                  />
                  {status}
                </label>
              ))}
            </div>
          </div>
        ))
      )}
      <div className="btn-container">
        <button className="btn salvar" onClick={handleSaveChanges}>
          Salvar Alterações
        </button>
      </div>
    </div>
  );
};

export default Contratacao;
