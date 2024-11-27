import React, { useState, useEffect } from 'react';
import './CadastroClinicas.css';


interface RegionalData {
  municipio: string;
  regional: string;
}

const CadastroClinicas: React.FC = () => {
  const [clinicasData, setClinicasData] = useState<string[][]>([['', '', '', '', '', '', '']]);
  const [regionais, setRegionais] = useState<RegionalData[]>([]);
  const [columnWidths, setColumnWidths] = useState<number[]>(new Array(7).fill(150));
  const [isLoading, setIsLoading] = useState<boolean>(true); // Adicionado estado de carregamento

  const fetchClinicasData = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/obter-planilha?aba=Cadastro Clínicas");
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

  const fetchRegionais = async () => {
    try {
      const response = await fetch(
        "https://docs.google.com/spreadsheets/d/1L1uxINmH3tK8KK1W7VAoBP11bYd4ry_pPqj7xp2ImU8/export?format=csv&gid=75694551"
      );
      const csvText = await response.text();
      const rows = csvText.split("\n").slice(1);
      const parsedData: RegionalData[] = rows.map((row) => {
        const [municipio, regional] = row.split(",");
        return { municipio: municipio.trim(), regional: regional.trim() };
      });
      setRegionais(parsedData);
    } catch (error) {
      console.error("Erro ao carregar regionais:", error);
    }
  };

  const handleInputChange = (rowIndex: number, cellIndex: number, value: string) => {
    const newData = [...clinicasData];
    newData[rowIndex][cellIndex] = value;

    if (cellIndex === 5) {
      const selectedRegional = regionais.find((r) => r.municipio === value)?.regional || '';
      newData[rowIndex][6] = selectedRegional;
    }

    setClinicasData(newData);
  };

  const addNewRow = () => {
    setClinicasData([...clinicasData, ['', '', '', '', '', '', '']]);
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/atualizar-planilha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aba: "Cadastro Clínicas",
          valores: clinicasData,
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
  };

  const handleResize = (index: number, e: React.MouseEvent) => {
    const startX = e.clientX;
    const startWidth = columnWidths[index];

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = startWidth + (moveEvent.clientX - startX);
      const updatedWidths = [...columnWidths];
      updatedWidths[index] = newWidth > 50 ? newWidth : 50;
      setColumnWidths(updatedWidths);
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true); // Inicia o carregamento
      await fetchClinicasData();
      await fetchRegionais();
      setIsLoading(false); // Finaliza o carregamento
    };

    fetchData();
  }, []);

  return (
    <div className="cadastro-clinicas-container">
      {isLoading ? ( // Exibe o círculo de carregamento se os dados estiverem sendo carregados
        <div className="loading-container">
          <div className="loading-circle"></div>
        </div>
      ) : (
        <>
          <table className="base-dados-table">
            <thead>
              <tr>
                {['Nome da Clínica', 'Endereço', 'Telefone', 'Email', 'CNPJ', 'Município', 'Regional'].map((header, index) => (
                  <th key={index} style={{ width: columnWidths[index] + 'px' }}>
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
              {clinicasData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>
                      {cellIndex === 5 ? (
                        <select
                          value={cell}
                          onChange={(e) =>
                            handleInputChange(rowIndex, cellIndex, e.target.value)
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
                            handleInputChange(rowIndex, cellIndex, e.target.value)
                          }
                          placeholder={["Nome", "Endereço", "Telefone", "Email", "CNPJ", "Município", "Regional"][cellIndex]}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="button-container">
            <button className="btn salvar" onClick={handleSubmit}>
              Salvar Alterações
            </button>
            <button className="btn adicionar" onClick={addNewRow}>
              Adicionar Linha em Branco
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CadastroClinicas;
