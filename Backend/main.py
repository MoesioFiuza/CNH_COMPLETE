from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google.oauth2 import service_account
from googleapiclient.discovery import build
from typing import Optional, List
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

app = FastAPI()

origins = [
    "http://localhost:3000",  
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ARQUIVO_CREDENCIAIS = r'C:\Users\moesios\planilha-app\Backend\credentials.json'
ESCOPO = ['https://www.googleapis.com/auth/spreadsheets']

credenciais = service_account.Credentials.from_service_account_file(
    ARQUIVO_CREDENCIAIS, scopes=ESCOPO
)
ID_PLANILHA = '1L1uxINmH3tK8KK1W7VAoBP11bYd4ry_pPqj7xp2ImU8'


class DadosPlanilha(BaseModel):
    aba: str
    valores: List[List[str]]


class LoginData(BaseModel):
    email: str
    password: str
    role: Optional[str] = None  


class SolicitacaoAcesso(BaseModel):
    departamento: str
    email: str
    senha: str


@app.get("/")
def read_root():
    return {"message": "Bem-vindo à API de atualização de planilhas!"}


@app.get("/obter-planilha")
def obter_planilha(aba: str):
    try:
        servico = build('sheets', 'v4', credentials=credenciais)
        planilha = servico.spreadsheets()
        resultado = planilha.values().get(
            spreadsheetId=ID_PLANILHA,
            range=aba
        ).execute()
        valores = resultado.get('values', [])
        return {"status": "sucesso", "valores": valores}
    except Exception as e:
        logging.error(f"Erro ao obter a planilha: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/atualizar-planilha")
def atualizar_planilha(dados: DadosPlanilha):
    try:
        logging.info(f"Dados recebidos: {dados}")
        servico = build('sheets', 'v4', credentials=credenciais)
        planilha = servico.spreadsheets()

        corpo = {
            'values': dados.valores
        }
         
        resultado = planilha.values().update(
            spreadsheetId=ID_PLANILHA,
            range=dados.aba,
            valueInputOption='RAW',
            body=corpo
        ).execute()

        logging.info(f"Resultado da atualização: {resultado}")

        return {"status": "sucesso", "celulasAtualizadas": resultado.get('updatedCells')}
    except Exception as e:
        logging.error(f"Erro ao atualizar a planilha: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login")
def login(data: LoginData):
    """
    Verifica credenciais de login armazenadas na aba 'Usuários' e retorna o tipo de usuário.
    """
    try:
        servico = build('sheets', 'v4', credentials=credenciais)
        planilha = servico.spreadsheets()

        resultado = planilha.values().get(
            spreadsheetId=ID_PLANILHA,
            range="Usuários!A2:Z1000"
        ).execute()
        valores = resultado.get('values', [])
 
        for linha in valores:
            if len(linha) >= 3 and linha[0] == data.email and linha[1] == data.password:
                role = linha[2]  
                email = linha[0]  
                return {"status": "sucesso", "role": role, "email": email}

        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao realizar login: {str(e)}")

@app.post("/solicitacao-acesso")
def solicitacao_acesso(dados: SolicitacaoAcesso):
    try:
        logging.info(f"Solicitação de acesso recebida: {dados}")
        servico = build('sheets', 'v4', credentials=credenciais)
        planilha = servico.spreadsheets()

        corpo = {
            'values': [
                ["Solicitação de Acesso", dados.departamento, dados.email, dados.senha]
            ]
        }
        
        resultado = planilha.values().append(
            spreadsheetId=ID_PLANILHA,
            range="Solicitacoes!A1",  
            valueInputOption='RAW',
            insertDataOption='INSERT_ROWS',
            body=corpo
        ).execute()

        logging.info(f"Resultado da solicitação de acesso: {resultado}")

        return {"status": "sucesso", "linhasAdicionadas": resultado.get('updates').get('updatedRows')}
    except Exception as e:
        logging.error(f"Erro ao processar a solicitação de acesso: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/deletar-linha")
def deletar_linha(aba: str, linha: int):
    try:
        servico = build('sheets', 'v4', credentials=credenciais)
        planilha = servico.spreadsheets()

        # Obter os dados atuais da planilha
        resultado = planilha.values().get(
            spreadsheetId=ID_PLANILHA,
            range=f"{aba}!A1:Z1000"
        ).execute()
        valores = resultado.get('values', [])

        # Remover a linha especificada
        if 0 <= linha < len(valores):
            valores.pop(linha)
        else:
            raise HTTPException(status_code=404, detail="Linha não encontrada")

        # Atualizar a planilha com os dados restantes
        corpo = {
            'values': valores
        }
        resultado = planilha.values().update(
            spreadsheetId=ID_PLANILHA,
            range=f"{aba}!A1",
            valueInputOption='RAW',
            body=corpo
        ).execute()

        return {"status": "sucesso", "linhasAtualizadas": resultado.get('updatedRows')}
    except Exception as e:
        logging.error(f"Erro ao deletar a linha: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)