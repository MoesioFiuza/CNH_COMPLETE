import React, { useState, useEffect } from 'react';
import './BaseDeDados.css';

interface BaseDeDadosData {
  categoria: string;
  municipio: string;
  nome: string;
  cnpj: string;
  adesao: string;
  tipo: string;
  Contrato: string;
  dataDeAbertura: string;
  suite: string;
  numeroContrato: string;
}

const BaseDeDados: React.FC = () => {
  const [baseData, setBaseData] = useState<BaseDeDadosData[]>([{ categoria: '', municipio: '', nome: '', cnpj: '', adesao: '', tipo: '', Contrato: '', dataDeAbertura: '', suite: '', numeroContrato: '' }]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]); // Para controlar quais linhas estão selecionadas para exclusão
  const [showCheckboxes, setShowCheckboxes] = useState<boolean>(false); // Para exibir as caixas de seleção
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<boolean>(false); // Para mostrar o pop-up de confirmação de exclusão

  const [cfcMunicipios, setCfcMunicipios] = useState<string[]>([]);
  const [clinicaMunicipios, setClinicaMunicipios] = useState<string[]>([]);
  const [cfcNames, setCfcNames] = useState<string[]>([]);
  const [clinicaNames, setClinicaNames] = useState<string[]>([]);

  const [municipioCfcNames, setMunicipioCfcNames] = useState<Record<string, string[]>>({});
  const [municipioClinicaNames, setMunicipioClinicaNames] = useState<Record<string, string[]>>({});
  
  const [municipioCfcCnpj, setMunicipioCfcCnpj] = useState<Record<string, Record<string, string>>>({});
  const [municipioClinicaCnpj, setMunicipioClinicaCnpj] = useState<Record<string, Record<string, string>>>({});

  // Função para salvar alterações
  const handleSaveChanges = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/atualizar-planilha", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aba: "Base de Dados",  
          valores: baseData.map(row => [
            row.categoria,
            row.municipio,
            row.nome,
            row.cnpj,
            row.adesao,
            row.tipo,
            row.Contrato,
            row.dataDeAbertura,
            row.suite,
            row.numeroContrato,
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
      console.error("Erro ao salvar as alterações:", error);
      alert('Erro ao salvar as alterações!');
    }
  };

  
  const createMunicipioMapping = (municipiosList: string[], namesList: string[]) => {
    return municipiosList.reduce((acc, municipio, index) => {
      if (!acc[municipio]) acc[municipio] = [];
      acc[municipio].push(namesList[index]);
      return acc;
    }, {} as Record<string, string[]>);
  };

  
  const createMunicipioCnpjMapping = (municipiosList: string[], namesList: string[], cnpjList: string[]) => {
    return municipiosList.reduce((acc, municipio, index) => {
      if (!acc[municipio]) acc[municipio] = {};
      acc[municipio][namesList[index]] = cnpjList[index];
      return acc;
    }, {} as Record<string, Record<string, string>>);
  };

  // Carregar dados de "Base de Dados", "Cadastro CFC" e "Cadastro Clínicas"
  const fetchNamesData = async () => {
    try {
      // Obter dados de CFC
      const cfcResponse = await fetch("http://127.0.0.1:8000/obter-planilha?aba=Cadastro CFC");
      const cfcData = await cfcResponse.json();
      const cfcMunicipiosList = cfcData.valores.map((row: any) => row[5]);
      const cfcNamesList = cfcData.valores.map((row: any) => row[0]);
      const cfcCnpjList = cfcData.valores.map((row: any) => row[4]);  // Coluna 5 (índice 4)

      setCfcMunicipios(cfcMunicipiosList);
      setCfcNames(cfcNamesList);
      setMunicipioCfcNames(createMunicipioMapping(cfcMunicipiosList, cfcNamesList));
      setMunicipioCfcCnpj(createMunicipioCnpjMapping(cfcMunicipiosList, cfcNamesList, cfcCnpjList));

      // Obter dados de Clínicas
      const clinicaResponse = await fetch("http://127.0.0.1:8000/obter-planilha?aba=Cadastro Clínicas");
      const clinicaData = await clinicaResponse.json();
      const clinicaMunicipiosList = clinicaData.valores.map((row: any) => row[5]);
      const clinicaNamesList = clinicaData.valores.map((row: any) => row[0]);
      const clinicaCnpjList = clinicaData.valores.map((row: any) => row[4]);  // Coluna 5 (índice 4)

      setClinicaMunicipios(clinicaMunicipiosList);
      setClinicaNames(clinicaNamesList);
      setMunicipioClinicaNames(createMunicipioMapping(clinicaMunicipiosList, clinicaNamesList));
      setMunicipioClinicaCnpj(createMunicipioCnpjMapping(clinicaMunicipiosList, clinicaNamesList, clinicaCnpjList));

      // Carregar dados da "Base de Dados"
      const baseDataResponse = await fetch("http://127.0.0.1:8000/obter-planilha?aba=Base de Dados");
      const baseData = await baseDataResponse.json();
      const baseDataList = baseData.valores.map((row: any) => ({
        categoria: row[0] || '',
        municipio: row[1] || '',
        nome: row[2] || '',
        cnpj: row[3] || '',
        adesao: row[4] || '',
        tipo: row[5] || '',
        Contrato: row[6] || '',
        dataDeAbertura: row[7] || '',
        suite: row[8] || '',
        numeroContrato: row[9] || '',
      }));
      setBaseData(baseDataList);

    } catch (error) {
      console.error("Erro ao carregar os dados:", error);
    }
  };

  // Função para lidar com a alteração nos campos
  const handleInputChange = (rowIndex: number, field: string, value: string) => {
    const newData = [...baseData];
    newData[rowIndex][field as keyof BaseDeDadosData] = value;

    // Preencher o CNPJ automaticamente baseado no nome selecionado
    if (field === 'nome') {
      const categoria = newData[rowIndex].categoria;
      const municipio = newData[rowIndex].municipio;

      if (categoria === 'CFC') {
        newData[rowIndex].cnpj = municipioCfcCnpj[municipio]?.[value] || '';
      } else if (categoria === 'Clínica') {
        newData[rowIndex].cnpj = municipioClinicaCnpj[municipio]?.[value] || '';
      }
    }

    setBaseData(newData);
  };

  // Função para adicionar nova linha
  const addNewRow = () => {
    setBaseData([...baseData, { categoria: '', municipio: '', nome: '', cnpj: '', adesao: '', tipo: '', Contrato: '', dataDeAbertura: '', suite: '', numeroContrato: '' }]);
  };

  // Função para filtrar municípios conforme categoria selecionada
  const getMunicipiosOptions = (categoria: string) => {
    return categoria === 'CFC' ? cfcMunicipios : categoria === 'Clínica' ? clinicaMunicipios : [];
  };

  // Função para filtrar nomes conforme categoria e município selecionados
  const getNamesOptions = (categoria: string, municipio: string) => {
    if (categoria === 'CFC') {
      return municipioCfcNames[municipio] || [];
    } else if (categoria === 'Clínica') {
      return municipioClinicaNames[municipio] || [];
    }
    return [];
  };

  // Função para lidar com a seleção para exclusão
  const handleRowSelection = (rowIndex: number) => {
    const selectedIndex = selectedRows.indexOf(rowIndex);
    if (selectedIndex > -1) {
      setSelectedRows(selectedRows.filter(index => index !== rowIndex));
    } else {
      setSelectedRows([...selectedRows, rowIndex]);
    }
  };

  // Função para deletar as linhas selecionadas
  const handleDeleteRows = async () => {
    if (selectedRows.length === 0) return;

    if (window.confirm('Tem certeza que deseja excluir as linhas selecionadas?')) {
        const newData = baseData.filter((_, index) => !selectedRows.includes(index));

        // Atualizar a planilha com os dados restantes
        const response = await fetch("http://127.0.0.1:8000/atualizar-planilha", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                aba: "Base de Dados",
                valores: newData.map(row => [
                    row.categoria,
                    row.municipio,
                    row.nome,
                    row.cnpj,
                    row.adesao,
                    row.tipo,
                    row.Contrato,
                    row.dataDeAbertura,
                    row.suite,
                    row.numeroContrato,
                ]),
            }),
        });

        const data = await response.json();

        if (data.status === 'sucesso') {
            alert('Linhas excluídas com sucesso!');
            setBaseData(newData);
            setSelectedRows([]);  // Limpar seleção
        } else {
            alert('Erro ao excluir as linhas!');
        }
    }
  };


  useEffect(() => {
    fetchNamesData(); // Carregar os dados de nomes de CFC, Clínicas e Base de Dados
  }, []);

  return (
    <div className="base-de-dados-container">
      <table className="base-dados-table">
        <thead>
          <tr>
            <th>
              <input type="checkbox" onChange={() => setShowCheckboxes(!showCheckboxes)} />
            </th>
            <th>ID</th>
            <th>CATEGORIA</th>
            <th>MUNICÍPIO</th>
            <th>NOME</th>
            <th>CNPJ</th>
            <th>ADESÃO</th>
            <th>TIPO</th>
            <th>Contrato</th>
            <th>DATA DE ABERTURA</th>
            <th>SUITE</th>
            <th>N° do Contrato</th>
            <th style={{ minWidth: "150px" }}>Nº CONTRATO</th>
          </tr>
        </thead>
        <tbody>
          {baseData.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <td>
                {showCheckboxes && (
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(rowIndex)}
                    onChange={() => handleRowSelection(rowIndex)}
                  />
                )}
              </td>
              <td>{rowIndex + 1}</td>
              <td>
                <select
                  value={row.categoria}
                  onChange={(e) => handleInputChange(rowIndex, 'categoria', e.target.value)}
                >
                  <option value="CFC">CFC</option>
                  <option value="Clínica">Clínica</option>
                </select>
              </td>
              <td>
                <select
                  value={row.municipio}
                  onChange={(e) => handleInputChange(rowIndex, 'municipio', e.target.value)}
                >
                  <option value="">Selecione o Município</option>
                  {getMunicipiosOptions(row.categoria).map((municipio, index) => (
                    <option key={index} value={municipio}>
                      {municipio}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <select
                  value={row.nome}
                  onChange={(e) => handleInputChange(rowIndex, 'nome', e.target.value)}
                >
                  <option value="">Selecione o Nome</option>
                  {getNamesOptions(row.categoria, row.municipio).map((name, index) => (
                    <option key={index} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  type="text"
                  value={row.cnpj}
                  onChange={(e) => handleInputChange(rowIndex, 'cnpj', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={row.adesao}
                  onChange={(e) => handleInputChange(rowIndex, 'adesao', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={row.tipo}
                  onChange={(e) => handleInputChange(rowIndex, 'tipo', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={row.Contrato}
                  onChange={(e) => handleInputChange(rowIndex, 'Contrato', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={row.dataDeAbertura}
                  onChange={(e) => handleInputChange(rowIndex, 'dataDeAbertura', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={row.suite}
                  onChange={(e) => handleInputChange(rowIndex, 'suite', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={row.numeroContrato}
                  onChange={(e) => handleInputChange(rowIndex, 'numeroContrato', e.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="button-container">
        <button className="btn salvar" onClick={handleSaveChanges}>Salvar Alterações</button>
        <button className="btn adicionar" onClick={addNewRow}>Adicionar Linha em Branco</button>
        <button className="btn excluir" onClick={handleDeleteRows}>Excluir</button>
      </div>
    </div>
  );
};

export default BaseDeDados;
