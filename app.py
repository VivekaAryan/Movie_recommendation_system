import streamlit as st
from st_keyup import st_keyup
import pandas as pd
import weaviate
from weaviate.auth import AuthApiKey
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_weaviate.vectorstores import WeaviateVectorStore

from utils.movie_reco_sims import MovieRecommender
from utils.constants import WEAVIATE_API_KEY, WEAVIATE_INDEX_NAME, WEAVIATE_URL

import warnings
warnings.filterwarnings("ignore")

# Define the base URL for poster images
BASE_POSTER_URL = "https://image.tmdb.org/t/p/w500"

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

# Reference the external CSS file
# Load CSS file content
def load_css(file_path ='static/styles.css'):
    with open(file_path) as f:
        return f.read()

css = load_css("static/styles.css")

# Inject CSS into the app
st.markdown(f"<style>{css}</style>", unsafe_allow_html=True)

st.title('Movie Recommender System')

## Select Movies
movie_list = df['title'].values
movie_title = st.selectbox('Select a movie title:', options=movie_list)

# ## Last good method
# if movie_title != "Select a movie" and st.button('Get Recommendations'):
#     if movie_title:
#         try:
#             df_top_ten = recommender.get_recommendations(movie_title)

#             st.subheader(f'Top 10 similar movies to "{movie_title}"')
            
#             # Create a grid with Streamlit's columns
#             num_cols = 3  # Number of columns in the grid
#             rows = len(df_top_ten) // num_cols + (len(df_top_ten) % num_cols > 0)
#             cols = st.columns(num_cols)

#             for i, row in df_top_ten.iterrows():
#                 with cols[i % num_cols]:
#                     poster_url = BASE_POSTER_URL + row['poster_path']
#                     st.markdown(f"""
#                     <div style="
#                         background-color: #f8f8f8;
#                         border: 1px solid #ddd;
#                         border-radius: 10px;
#                         padding: 20px;
#                         width: 100%;
#                         box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
#                         text-align: center;
#                         margin: 10px;">
#                         <img src="{poster_url}" alt="{row['movie']} poster" style="width: 175px; height: auto; border-radius: 5px; margin-bottom: 5px;">
#                         <h4 style="margin: 0; font-size: 1.5em; color: #333; text-align: center;">{row['movie']}</h4>
#                         <p style="margin: 5px 0 0; font-size: 1em; color: #666; text-align: center;">{row['language']} ({int(row['year'])}) | Score: {row['score']}</p>
#                     </div>
#                     """, unsafe_allow_html=True)

#         except ValueError as e:
#             st.error(str(e))
#     else:
#         st.error('Please enter a movie title.')

## Last good method
if movie_title and st.button('Get Recommendations'):
    try:
        df_top_ten = recommender.get_recommendations(movie_title)

        st.subheader(f'Top 10 similar movies to "{movie_title}"')
        
        # Create a grid with Streamlit's columns
        num_cols = 3  # Number of columns in the grid
        rows = len(df_top_ten) // num_cols + (len(df_top_ten) % num_cols > 0)
        cols = st.columns(num_cols)

        for i, row in df_top_ten.iterrows():
            with cols[i % num_cols]:
                poster_url = BASE_POSTER_URL + row['poster_path']
                st.markdown(f"""
                <div class="grid-item">
                    <img src="{poster_url}" alt="{row['movie']} poster">
                    <h4>{row['movie']}</h4>
                    <p>{row['language']} ({int(row['year'])}) | Score: {row['score']}</p>
                </div>
                """, unsafe_allow_html=True)

    except ValueError as e:
        st.error(str(e))
    else:
        # st.error('Please enter a movie title.')
        None