import streamlit as st
import pandas as pd
import weaviate
from weaviate.auth import AuthApiKey
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_weaviate.vectorstores import WeaviateVectorStore
from langchain_community.llms import HuggingFacePipeline
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    pipeline,
)

from movie_recommendation_system import MovieRecommender

import warnings
warnings.filterwarnings("ignore")

# Creating soups
df = pd.read_csv('Data/final_metadata.csv')
df['soup'] = df.apply(lambda row: f"Title: {row['title']}. Genres: {row['genres']}. Keywords: {row['keywords']}. Cast: {row['cast']}. Director: {row['director']}.", axis=1)

soups = pd.Series(df['soup'].values, index=df['title'])

# Connecting to Weaviate Could
client = weaviate.connect_to_weaviate_cloud(
    cluster_url="https://movie-recommend-system-final-c4nbzi5z.weaviate.network",                       # `weaviate_url`: your Weaviate URL
    auth_credentials=AuthApiKey("mjJgO65kU2npQjuk7UE9y2k6LxPGrqjIlbpV"),      # `weaviate_key`: your Weaviate API key
)

embedding_model_name = "sentence-transformers/all-MiniLM-L6-v2"
model_kwargs = {"device": "cuda"}
embeddings = HuggingFaceEmbeddings(
  model_name=embedding_model_name, 
  model_kwargs=model_kwargs
)

vector_db = WeaviateVectorStore(
    client = client,
    index_name = "LangChain_2adbdf1cd46e49c0ae3561cd1aa07cbe",
    text_key = "text",
    embedding = embeddings
)

# Getting the LLM
model = AutoModelForCausalLM.from_pretrained("saved-model/quantized_model")
tokenizer = AutoTokenizer.from_pretrained("saved-model/quantized_tokenizer")

# specify stop token ids
stop_token_ids = [0]

tokenizer.model_max_length = 2048

# build huggingface pipeline for using zephyr-7b-alpha
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

recommender = MovieRecommender(soups, vector_db, llm)

st.title('Movie Recommender System')

movie_title = st.text_input('Enter a movie title:', '')

if st.button('Get Recommendations'):
    if movie_title:
        try:
            _, df_top_ten = recommender.get_recommendations(movie_title)
            summaries = recommender.generate_summaries(df_top_ten)

            st.subheader('Recommendations')
            for row, summary in zip(df_top_ten.to_dict('records'), summaries):
                st.markdown(f"### {row['movie']}")
                st.markdown(f"**Language:** {row['language']}")
                st.markdown(f"**Score:** {row['score']}")
                st.markdown(f"**Year:** {row['year']}")
                st.markdown(summary)
        except ValueError as e:
            st.error(str(e))
    else:
        st.error('Please enter a movie title.')

# Run the Streamlit app using the following command in the terminal
# streamlit run app.py
