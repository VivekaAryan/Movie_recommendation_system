from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import weaviate
from weaviate.auth import AuthApiKey
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_weaviate.vectorstores import WeaviateVectorStore
from src.utils.constants import WEAVIATE_API_KEY, WEAVIATE_INDEX_NAME, WEAVIATE_URL
from fastapi.responses import JSONResponse
from backend.movie_reco_sims import MovieRecommender

app = FastAPI()

# Initialize your recommender system here
# Creating soups
df = pd.read_csv('Data/final_metadata.csv')
df['soup'] = df.apply(lambda row: f"Title: {row['title']}. Genres: {row['genres']}. Keywords: {row['keywords']}. Cast: {row['cast']}. Director: {row['director']}.", axis=1)

soups = pd.Series(df['soup'].values, index=df['title'])

# Connecting to Weaviate Cloud
client = weaviate.connect_to_weaviate_cloud(
    cluster_url=WEAVIATE_URL,                       
    auth_credentials=AuthApiKey(WEAVIATE_API_KEY),  
    skip_init_checks=True    
)

embedding_model_name = "sentence-transformers/all-MiniLM-L6-v2"
model_kwargs = {"device": "cuda"}
embeddings = HuggingFaceEmbeddings(
  model_name=embedding_model_name, 
  model_kwargs=model_kwargs
)

vector_db = WeaviateVectorStore(
    client=client,
    index_name=WEAVIATE_INDEX_NAME,
    text_key="text",
    embedding=embeddings
)

recommender = MovieRecommender(soups, vector_db)

class RecommendationRequest(BaseModel):
    title: str

class SummaryRequest(BaseModel):
    movie: str
    language: str
    score: str
    synopsis: str
    year: str

@app.get("/")
async def read_root():
    return {"message": "Welcome to the Movie Recommender API"}

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return JSONResponse(content=None)

@app.post("/recommendations")
async def get_recommendations(request: RecommendationRequest):
    try:
        recommendations = recommender.get_recommendations(request.title)
        return recommendations
    except ValueError as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Unexpected Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.post("/summary")
async def get_summary(request: SummaryRequest):
    try:
        summary = recommender.generate_summaries(
            movie=request.movie,
            language=request.language,
            score=request.score,
            synopsis=request.synopsis,
            year=request.year
        )
        return {"summary": summary}
    except Exception as e:
        print(f"Unexpected Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
