from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google.oauth2 import service_account
from googleapiclient.discovery import build
import logging
from typing import List


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

ARQUIVO_CREDENCIAIS = 'c:/Users/moesios/planilha-app/Backend/credentials.json'
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
        
        # Aqui pode ser necessário usar o método clear() se for uma exclusão
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
    Verifica credenciais de login armazenadas na aba 'Usuários'.
    """
    try:
        logging.info(f"Tentando login com o email: {data.email}")
        servico = build('sheets', 'v4', credentials=credenciais)
        planilha = servico.spreadsheets()
        
        
        resultado = planilha.values().get(
            spreadsheetId=ID_PLANILHA,
            range="Usuários!A2:Z1000"  
        ).execute()
        valores = resultado.get('values', [])

        
        for linha in valores:
            if len(linha) >= 2 and linha[0] == data.email and linha[1] == data.password:
                logging.info(f"Login bem-sucedido para o email: {data.email}")
                return {"status": "sucesso"}

        logging.warning(f"Credenciais inválidas para o email: {data.email}")
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    except Exception as e:
        logging.error(f"Erro ao realizar login: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao realizar login: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
