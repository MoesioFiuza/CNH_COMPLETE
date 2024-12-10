import React, { useState, useEffect } from 'react';
import './BaseDeDados.css';

interface BaseDeDadosData {
  categoria: string;
  municipio: string;
  nome: string;
  cnpj: string;
  adesao: string;
  Contrato: string;
  dataDeAbertura: string;
  suite: string;
}

const BaseDeDados: React.FC = () => {
  const [baseData, setBaseData] = useState<BaseDeDadosData[]>([]);
  const [cfcData, setCfcData] = useState<{ municipio: string; nome: string; cnpj: string }[]>([]);
  const [clinicaData, setClinicaData] = useState<{ municipio: string; nome: string; cnpj: string }[]>([]);
  const [regionais, setRegionais] = useState<string[]>([]);

  // Função para carregar os municípios da aba Regionais
  const fetchRegionaisData = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/obter-planilha?aba=Regionais');
      const regionaisData = await response.json();

      const uniqueMunicipios = Array.from(
        new Set(regionaisData.valores.map((row: string[]) => row[0]))
      ) as string[];
      setRegionais(uniqueMunicipios);
    } catch (error) {
      console.error('Erro ao carregar os dados de Regionais:', error);
    }
  };

  // Função para carregar os dados das abas CFC e Clínicas
  const fetchCadastroData = async () => {
    try {
      const cfcResponse = await fetch('http://127.0.0.1:8000/obter-planilha?aba=Cadastro CFC');
      const cfcData = await cfcResponse.json();
      setCfcData(
        cfcData.valores.map((row: string[]) => ({
          municipio: row[5],
          nome: row[0],
          cnpj: row[4],
        }))
      );

      const clinicaResponse = await fetch('http://127.0.0.1:8000/obter-planilha?aba=Cadastro Clínicas');
      const clinicaData = await clinicaResponse.json();
      setClinicaData(
        clinicaData.valores.map((row: string[]) => ({
          municipio: row[5],
          nome: row[0],
          cnpj: row[4],
        }))
      );
    } catch (error) {
      console.error('Erro ao carregar os dados de cadastro:', error);
    }
  };

  // Função para carregar os dados da aba "Base de Dados"
  const fetchBaseData = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/obter-planilha?aba=Base de Dados');
      const baseDataJson = await response.json();

      const baseDataList = baseDataJson.valores.map((row: string[]) => ({
        categoria: row[0] || '',
        municipio: row[1] || '',
        nome: row[2] || '',
        cnpj: row[3] || '',
        adesao: row[4] || '',
        Contrato: row[5] || '',
        dataDeAbertura: row[6] || '',
        suite: row[7] || '',
      }));
      setBaseData(baseDataList);
    } catch (error) {
      console.error('Erro ao carregar os dados da Base de Dados:', error);
    }
  };

  // Função para salvar alterações
  const handleSaveChanges = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/atualizar-planilha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aba: 'Base de Dados',
          valores: baseData.map((row) => [
            row.categoria,
            row.municipio,
            row.nome,
            row.cnpj,
            row.adesao,
            row.Contrato,
            row.dataDeAbertura,
            row.suite,
          ]),
        }),
      });

      const data = await response.json();

      if (data.status === 'sucesso') {
        alert('Alterações salvas com sucesso!');
      } else {
        alert('Erro ao salvar as alterações!');
      }
    } catch (error) {
      console.error('Erro ao salvar as alterações:', error);
      alert('Erro ao salvar as alterações!');
    }
  };

  // Função para adicionar nova linha
  const addNewRow = () => {
    setBaseData([
      ...baseData,
      {
        categoria: '',
        municipio: '',
        nome: '',
        cnpj: '',
        adesao: '',
        Contrato: '',
        dataDeAbertura: '',
        suite: '',
      },
    ]);
  };

  // Função para estilizar dinamicamente o campo Adesão
  const getAdesaoStyle = (adesao: string) => {
    switch (adesao) {
      case 'Aguardando Adesão':
        return { backgroundColor: '#f3e56d', color: '#000' };
      case 'Aderiu':
        return { backgroundColor: '#90ee90', color: '#000' };
      case 'Não aderiu':
        return { backgroundColor: '#ff6b6b', color: '#fff' };
      default:
        return {};
    }
  };

  useEffect(() => {
    fetchRegionaisData();
    fetchCadastroData();
    fetchBaseData();
  }, []);

  return (
    <div className="base-de-dados-container">
      <table className="base-dados-table">
        <thead>
          <tr>
            <th>CATEGORIA</th>
            <th>MUNICÍPIO</th>
            <th>NOME</th>
            <th>CNPJ</th>
            <th>ADESÃO</th>
            <th>CONTRATO</th>
            <th>DATA DE ABERTURA</th>
            <th>SUITE</th>
          </tr>
        </thead>
        <tbody>
          {baseData.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <td>
                <select
                  value={row.categoria}
                  onChange={(e) => {
                    const categoria = e.target.value;
                    setBaseData((prev) => {
                      const newData = [...prev];
                      newData[rowIndex].categoria = categoria;
                      newData[rowIndex].nome = '';
                      newData[rowIndex].cnpj = '';
                      return newData;
                    });
                  }}
                >
                  <option value="">Selecione</option>
                  <option value="CFC">CFC</option>
                  <option value="Clínica">Clínica</option>
                </select>
              </td>
              <td>
                <select
                  value={row.municipio}
                  onChange={(e) => {
                    const municipio = e.target.value;
                    setBaseData((prev) => {
                      const newData = [...prev];
                      newData[rowIndex].municipio = municipio;
                      return newData;
                    });
                  }}
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
                  onChange={(e) => {
                    const nome = e.target.value;
                    const cnpj =
                      row.categoria === 'CFC'
                        ? cfcData.find((item) => item.nome === nome)?.cnpj || ''
                        : clinicaData.find((item) => item.nome === nome)?.cnpj || '';
                    setBaseData((prev) => {
                      const newData = [...prev];
                      newData[rowIndex].nome = nome;
                      newData[rowIndex].cnpj = cnpj;
                      return newData;
                    });
                  }}
                >
                  <option value="">Selecione o Nome</option>
                  {row.categoria === 'CFC'
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
                <input type="text" value={row.cnpj} readOnly />
              </td>
              <td>
                <select
                  value={row.adesao}
                  onChange={(e) => {
                    const adesao = e.target.value;
                    setBaseData((prev) => {
                      const newData = [...prev];
                      newData[rowIndex].adesao = adesao;
                      return newData;
                    });
                  }}
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
                  onChange={(e) =>
                    setBaseData((prev) => {
                      const newData = [...prev];
                      newData[rowIndex].Contrato = e.target.value;
                      return newData;
                    })
                  }
                />
              </td>
              <td>
                <input
                  type="text"
                  value={row.dataDeAbertura}
                  onChange={(e) =>
                    setBaseData((prev) => {
                      const newData = [...prev];
                      newData[rowIndex].dataDeAbertura = e.target.value;
                      return newData;
                    })
                  }
                />
              </td>
              <td>
                <input
                  type="text"
                  value={row.suite}
                  onChange={(e) =>
                    setBaseData((prev) => {
                      const newData = [...prev];
                      newData[rowIndex].suite = e.target.value;
                      return newData;
                    })
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="button-container">
        <button className="btn salvar" onClick={handleSaveChanges}>
          Salvar Alterações
        </button>
        <button className="btn adicionar" onClick={addNewRow}>
          Adicionar Linha em Branco
        </button>
      </div>
    </div>
  );
};

export default BaseDeDados;
