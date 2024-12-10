from google.oauth2 import service_account
from googleapiclient.discovery import build
from fastapi import HTTPException
import logging
from typing import Dict, List

# Caminho para o arquivo de credenciais e ID da planilha
ARQUIVO_CREDENCIAIS = 'c:/Users/moesios/planilha-app/Backend/credentials.json'
ESCOPO = ['https://www.googleapis.com/auth/spreadsheets']
ID_PLANILHA = '1L1uxINmH3tK8KK1W7VAoBP11bYd4ry_pPqj7xp2ImU8'

# Credenciais
credenciais = service_account.Credentials.from_service_account_file(
    ARQUIVO_CREDENCIAIS, scopes=ESCOPO)

def get_municipio_to_grupo_map() -> Dict[str, str]:
    """Função para obter o mapeamento de municípios para grupos."""
    try:
        servico = build('sheets', 'v4', credentials=credenciais)
        planilha = servico.spreadsheets()
        resultado = planilha.values().get(
            spreadsheetId=ID_PLANILHA,
            range="Base Municípios!A1:Z10000"
        ).execute()
        valores = resultado.get('values', [])
        
        municipio_to_grupo = {}
        headers = valores[0]
        municipio_index = headers.index("MUNICÍPIO")
        grupo_index = headers.index("GRUPO")

        for row in valores[1:]:
            municipio = row[municipio_index]
            grupo = row[grupo_index]
            municipio_to_grupo[municipio] = grupo

        return municipio_to_grupo
    except Exception as e:
        logging.error(f"Erro ao obter mapeamento de municípios: {e}")
        raise HTTPException(status_code=500, detail="Erro ao carregar dados de municípios")

def preencher_grupo_na_base_de_dados():
    """Função para preencher a coluna Grupo na aba Base de Dados com base no município."""
    try:
        municipio_to_grupo = get_municipio_to_grupo_map()

        servico = build('sheets', 'v4', credentials=credenciais)
        planilha = servico.spreadsheets()
        resultado = planilha.values().get(
            spreadsheetId=ID_PLANILHA,
            range="Base de dados!A1:Z10000"
        ).execute()
        valores = resultado.get('values', [])

        headers = valores[0]
        municipio_index = headers.index("MUNICÍPIO")
        grupo_column = "GRUPO"

        
        if grupo_column not in headers:
            headers.append(grupo_column)

        
        updated_values = [headers]
        for row in valores[1:]:
            municipio = row[municipio_index]
            grupo = municipio_to_grupo.get(municipio, "")
            if len(row) < len(headers):
                row.extend([""] * (len(headers) - len(row)))
            row[headers.index(grupo_column)] = grupo
            updated_values.append(row)

        
        planilha.values().update(
            spreadsheetId=ID_PLANILHA,
            range="Base de Dados!A1",
            valueInputOption="RAW",
            body={"values": updated_values}
        ).execute()

        logging.info("Coluna Grupo atualizada na aba Base de Dados")
        return {"status": "sucesso", "mensagem": "Coluna Grupo atualizada na aba Base de Dados"}
    except Exception as e:
        logging.error(f"Erro ao preencher a coluna Grupo na Base de Dados: {e}")
        raise HTTPException(status_code=500, detail="Erro ao preencher coluna Grupo na Base de Dados")
