# embed_schema.py
# What changed from your original:
#   - Wrapped everything inside a function: embed_schema()
#   - No code runs at the top level on import
#   - main.py will call this function once at startup

import os
import psycopg2
from chromadb import EmbeddingFunction, Documents, Embeddings
from dotenv import load_dotenv
from google import genai as google_genai
import chromadb

load_dotenv()

def embed_schema():
    # Connect to Supabase
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cursor = conn.cursor()

     # Pull schema from information_schema
    cursor.execute("""
        SELECT 
            table_name,
            column_name,
            data_type,
            is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position;
    """)    

    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    # Group columns by table
    #essentially converting to dictionary, 
    # where key is table name and value is list of columns with their data types and null
    #same thing
    tables = {}
    for table_name, column_name, data_type, is_nullable in rows:
        if table_name not in tables:
            tables[table_name] = []
        tables[table_name].append(f"{column_name} ({data_type}, nullable={is_nullable})")
    
    #converting dictionary to text
    documents = []
    ids = []
    for table_name, columns in tables.items():
        doc = f"Table: {table_name}\nColumns:\n" + "\n".join(f"  - {col}" for col in columns)
        documents.append(doc)
        ids.append(table_name)
        print(doc)
        print()

     # Connect to ChromaDB - connecting to dockerized ChromaDB server instead of in-process client
    #chroma_client = chromadb.HttpClient(host ="chromadb", port=8000) # Use HttpClient to connect to the ChromaDB server
    chroma_client = chromadb.CloudClient(
    api_key=os.getenv("CHROMA_API_KEY"),
  tenant='49699ce8-8229-488c-8535-c4e1fec73e06',
  database='rag-nl-sql'
)
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

   
    # Only embed if empty — same logic as before
    if collection.count() == 0:
        collection.add(documents=documents, ids=ids)
        print(f"Embedded {len(documents)} tables into ChromaDB")
    else:
        print(f"Schema already embedded ({collection.count()} tables). Skipping.")

    
    # Still runnable manually if you want to force a re-embed
    """if __name__ == "__main__":
        embed_schema()"""

#when main.py does from embed_schema import embed_schema, nothing executes on import. The function only runs when main.py explicitly calls it during startup. Your original script would have connected to Supabase and 
#ChromaDB the moment it was imported — that's the problem this fixes.
"""Connect to Supabase
Pull schema via information_schema
Convert rows → dictionary (grouped by table)
Convert dictionary → text documents (one per table)
Connect to ChromaDB
Embed and store (or skip if already done)

That's the complete embed_schema() function top to bottom."""