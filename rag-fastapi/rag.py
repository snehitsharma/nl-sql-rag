
#literally same to query.py 
#we are not generating sql here, we are declaring functions, all the control runs to main.py

import os
import psycopg2
import chromadb
from chromadb import EmbeddingFunction, Documents, Embeddings
from google import genai as google_genai
from dotenv import load_dotenv

load_dotenv()

# --- Module level init --- runs once when FastAPI imports this file ---

gemini_client = google_genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

chroma_client = chromadb.HttpClient(host="chromadb", port=8000) # Connect to the ChromaDB server using HttpClient

class GeminiEmbeddingFunction(EmbeddingFunction):
    def __call__(self, input: Documents) -> Embeddings:
        client = google_genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        result = client.models.embed_content(
            model="models/gemini-embedding-001",
            contents=input
        )
        return [e.values for e in result.embeddings]

ef = GeminiEmbeddingFunction()

collection = chroma_client.get_or_create_collection(
    name="schema_store",
    embedding_function=ef
)

# --- Functions ---

def get_relevant_schema(question: str, n_results: int = 3) -> str:
    results = collection.query(query_texts=[question], n_results=n_results)
    return "\n\n".join(results["documents"][0])


def generate_sql(question: str) -> str:
    schema_context = get_relevant_schema(question)

    prompt = f"""You are a PostgreSQL expert. Given the schema below, write a SQL query for the question.
    Return ONLY the SQL query, nothing else.

Schema:
{schema_context}

Question: {question}

SQL:"""

    response = gemini_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    sql = response.text.strip()
    sql = sql.replace("```sql", "").replace("```", "").strip()
    return sql

def run_query(sql: str) -> dict:
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cursor = conn.cursor()
    try:
        cursor.execute(sql)
        rows = cursor.fetchall()
        col_names = [desc[0] for desc in cursor.description]
        return {
            "columns": col_names,
            "rows": [list(row) for row in rows]
        }
    except Exception as e:
        raise RuntimeError(f"SQL Error: {e}")
    finally:
        cursor.close()
        conn.close()

"""run_query returns a dict instead of printing
No if __name__ == "__main__" block — no loop, no input()"""
