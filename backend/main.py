# from fastapi import FastAPI, HTTPException
# from pydantic import BaseModel
# import pandas as pd
# import weaviate
# from weaviate.auth import AuthApiKey
# from langchain_huggingface import HuggingFaceEmbeddings
# from langchain_weaviate.vectorstores import WeaviateVectorStore
# from src.utils.constants import WEAVIATE_API_KEY, WEAVIATE_INDEX_NAME, WEAVIATE_URL
# from fastapi.responses import JSONResponse
# from backend.generate_movies_recommendations import MovieRecommender
# from backend.generate_summary_utils import GenerateSummaries
# from typing import List
# from fastapi.middleware.cors import CORSMiddleware

# import logging

# logging.basicConfig(level=logging.INFO)

# import torch
# from transformers import (
#     AutoModelForCausalLM,
#     AutoTokenizer,
#     pipeline,
# )
# from langchain.llms import HuggingFacePipeline

# app = FastAPI()

# # Configure CORS

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # Adjust this to the specific origin of your frontend
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Initialize your recommender system here
# # Creating soups
# df = pd.read_csv('Data/final_metadata.csv')
# df['soup'] = df.apply(lambda row: f"Title: {row['title']}. Genres: {row['genres']}. Keywords: {row['keywords']}. Cast: {row['cast']}. Director: {row['director']}.", axis=1)

# movies_list = [{'title': title} for title in df['title']]
# soups = pd.Series(df['soup'].values, index=df['title'])

# # Connecting to Weaviate Cloud
# client = weaviate.connect_to_weaviate_cloud(
#     cluster_url=WEAVIATE_URL,                       
#     auth_credentials=AuthApiKey(WEAVIATE_API_KEY),  
#     skip_init_checks=True    
# )

# embedding_model_name = "sentence-transformers/all-MiniLM-L6-v2"
# model_kwargs = {"device": "cuda"}
# embeddings = HuggingFaceEmbeddings(
#   model_name=embedding_model_name, 
#   model_kwargs=model_kwargs
# )

# vector_db = WeaviateVectorStore(
#     client=client,
#     index_name=WEAVIATE_INDEX_NAME,
#     text_key="text",
#     embedding=embeddings
# )

# model = AutoModelForCausalLM.from_pretrained("./saved-model/quantized_model")
# tokenizer = AutoTokenizer.from_pretrained("./saved-model/quantized_tokenizer")

# stop_token_ids = [0]

# tokenizer.model_max_length = 2048

# # build huggingface pipeline for using Phi-3
# pipeline = pipeline(
#     "text-generation",
#     model=model,
#     tokenizer=tokenizer,
#     use_cache=True,
#     device_map="auto",
#     max_length=2048,
#     do_sample=True,
#     top_k=1,
#     num_return_sequences=1,
#     eos_token_id=tokenizer.eos_token_id,
#     pad_token_id=tokenizer.eos_token_id,
#     truncation=True
# )

# llm = HuggingFacePipeline(pipeline=pipeline)

# #Initializing the Recommender and Summarizer
# recommender = MovieRecommender(soups, vector_db)
# summarizer = GenerateSummaries(llm)


# class RecommendationRequest(BaseModel):
#     title: str

# class SummaryRequest(BaseModel):
#     movie: str
#     language: str
#     score: str
#     synopsis: str
#     year: str


# class Movie(BaseModel):
#     title: str

# @app.get("/api/movies", response_model=List[Movie])
# async def get_movies():
#     return movies_list

# @app.get("/")
# async def read_root():
#     return {"message": "Welcome to the Movie Recommender API"}

# @app.get("/favicon.ico", include_in_schema=False)
# async def favicon():
#     return JSONResponse(content=None)

# @app.post("/recommendations")
# async def get_recommendations(request: RecommendationRequest):
#     try:
#         recommendations = recommender.get_recommendations(request.title)
#         return recommendations
#     except ValueError as e:
#         print(f"Error: {str(e)}")
#         raise HTTPException(status_code=400, detail=str(e))
#     except Exception as e:
#         print(f"Unexpected Error: {str(e)}")
#         raise HTTPException(status_code=500, detail="Internal Server Error")

# @app.post("/summary")
# async def get_summary(request: SummaryRequest):
#     logging.info(f"Received summary request: {request}")
#     try:
#         summary = summarizer.get_summary(
#             movie=request.movie,
#             language=request.language,
#             score=request.score,
#             synopsis=request.synopsis,
#             year=request.year
#         )
#         return {"summary": summary}
#     except Exception as e:
#         logging.error(f"Unexpected Error: {str(e)}")
#         raise HTTPException(status_code=500, detail="Internal Server Error")

from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
import pandas as pd
import weaviate
from weaviate.auth import AuthApiKey
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_weaviate.vectorstores import WeaviateVectorStore
from src.utils.constants import WEAVIATE_API_KEY, WEAVIATE_INDEX_NAME, WEAVIATE_URL
from fastapi.responses import JSONResponse
from backend.generate_movies_recommendations import MovieRecommender
from backend.generate_summary_utils import GenerateSummaries
from typing import List
from fastapi.middleware.cors import CORSMiddleware

import logging

logging.basicConfig(level=logging.INFO)

import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    pipeline,
)
from langchain_huggingface.llms import HuggingFacePipeline

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to the specific origin of your frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize your recommender system here
# Creating soups
df = pd.read_csv('Data/final_metadata.csv')
df['soup'] = df.apply(lambda row: f"Title: {row['title']}. Genres: {row['genres']}. Keywords: {row['keywords']}. Cast: {row['cast']}. Director: {row['director']}.", axis=1)

movies_list = [{'title': title} for title in df['title']]
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

model = AutoModelForCausalLM.from_pretrained("./saved-model/quantized_model")
tokenizer = AutoTokenizer.from_pretrained("./saved-model/quantized_tokenizer")

stop_token_ids = [0]

tokenizer.model_max_length = 2048

# build huggingface pipeline for using Phi-3
pipeline = pipeline(
    "text-generation",
    model=model,
    tokenizer=tokenizer,
    use_cache=True,
    device_map="auto",
    max_length=2048,
    do_sample=True,
    top_k=1,
    num_return_sequences=1,
    eos_token_id=tokenizer.eos_token_id,
    pad_token_id=tokenizer.eos_token_id,
    truncation=True
)

llm = HuggingFacePipeline(pipeline=pipeline)

# Initializing the Recommender and Summarizer
recommender = MovieRecommender(soups, vector_db)
summarizer = GenerateSummaries(llm)

class RecommendationRequest(BaseModel):
    title: str

class SummaryRequest(BaseModel):
    movie: str
    language: str
    score: str
    synopsis: str
    year: str

class Movie(BaseModel):
    title: str

@app.get("/api/movies", response_model=List[Movie])
async def get_movies():
    return movies_list

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
        logging.error(f"Error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logging.error(f"Unexpected Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.post("/summary")
async def get_summary(request: Request):
    try:
        data = await request.json()
        logging.info(f"Received summary request: {data}")
        
        summary_request = SummaryRequest(**data)
        
        summary = summarizer.get_summary(
            movie=summary_request.movie,
            language=summary_request.language,
            score=summary_request.score,
            synopsis=summary_request.synopsis,
            year=summary_request.year
        )
        return {"summary": summary}
    except Exception as e:
        logging.error(f"Unexpected Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
