import os
from contextlib import asynccontextmanager
from aiohttp import request
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

from embed_schema import embed_schema
from rag import generate_sql, run_query, preprocess
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    embed_schema()
    yield  #before this, the server starts, lifespan context manager runs, after this, fastapi takes over and starts accepting requests, when server shuts down, it comes back here and runs any code after yield, which is useful for cleanup if you need to do any
    # So anything you want to run at startup, put before yield, anything you want to run at shutdown, put after yield
app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class QueryRequest(BaseModel):
    question: str

class QueryResponse(BaseModel):
    question: str
    sql: str
    result: dict
#these are, Pydantic models that define what the request and response should look like. 
#They're not connected to any logic yet.

@app.post("/query", response_model=QueryResponse)
async def query(request: QueryRequest):
    try:
         
        # input guardrail
        dangerous = ["delete", "drop", "truncate", "insert", "update", "alter"]
        if any(word in request.question.lower() for word in dangerous):
            raise HTTPException(
            status_code=400,
            detail="Only data retrieval questions are allowed"
    ) 
         # preprocessor
        question = preprocess(request.question)
        sql = generate_sql(question)
            # output guardrail
        if not sql.strip().upper().startswith("SELECT"):
            raise HTTPException(
                status_code=400,
                detail="Only SELECT queries are allowed"
            )
        
        result = run_query(sql)
        return QueryResponse(
            question=request.question,
            sql=sql,
            result=result
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

#FastAPI receives the POST, validates it against QueryRequest — extracts request.question
#generate_sql(request.question) — goes to rag.py, turns the question into SQL
#run_query(sql) — also in rag.py, actually executes that SQL against the database
#packages everything into QueryResponse and returns it
@app.get("/health")
async def health():
    return {"status": "ok"}