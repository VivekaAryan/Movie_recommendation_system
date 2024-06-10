import streamlit as st
import pandas as pd
import weaviate
from weaviate.auth import AuthApiKey
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_weaviate.vectorstores import WeaviateVectorStore

from utils.movie_reco_sims import MovieRecommender
from utils.constants import WEAVIATE_API_KEY, WEAVIATE_INDEX_NAME, WEAVIATE_URL

import warnings
warnings.filterwarnings("ignore")

# Creating soups
df = pd.read_csv('Data/final_metadata.csv')
df['soup'] = df.apply(lambda row: f"Title: {row['title']}. Genres: {row['genres']}. Keywords: {row['keywords']}. Cast: {row['cast']}. Director: {row['director']}.", axis=1)

soups = pd.Series(df['soup'].values, index=df['title'])

# Connecting to Weaviate Cloud
client = weaviate.connect_to_weaviate_cloud(
    cluster_url=WEAVIATE_URL,                       
    auth_credentials=AuthApiKey(WEAVIATE_API_KEY),      
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

st.title('Movie Recommender System')

movie_title = st.text_input('Enter a movie title:', '')

## Last good method
if st.button('Get Recommendations'):
    if movie_title:
        try:
            similarities, df_top_ten = recommender.get_recommendations(movie_title)

            st.subheader('Top 10 similar movies')
            
            # Create a grid with Streamlit's columns
            num_cols = 3  # Number of columns in the grid
            rows = len(similarities) // num_cols + (len(similarities) % num_cols > 0)
            cols = st.columns(num_cols)

            for i, row in df_top_ten.iterrows():
                with cols[i % num_cols]:
                    st.markdown(f"""
                    <div style="
                        background-color: #f8f8f8;
                        border: 1px solid #ddd;
                        border-radius: 10px;
                        padding: 20px;
                        width: 100%;
                        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                        text-align: center;
                        margin: 10px;">
                        <img src="{row['poster_path']}" alt="{row['movie']} poster">
                        <h4 style="margin: 0; font-size: 1.5em; color: #333;">{row['movie']}</h4>
                        <p style="margin: 10px 0 0; font-size: 1em; color: #666;">{row['language']} ({row['year']}) | Score: {row['score']}</p>
                    </div>
                    """, unsafe_allow_html=True)

        except ValueError as e:
            st.error(str(e))
    else:
        st.error('Please enter a movie title.')

# if st.button('Get Recommendations'):
#     if movie_title:
#         try:
#             similarities, df_top_ten = recommender.get_recommendations(movie_title)

#             # Generate HTML for the grid items
#             grid_items = ""
#             for index, row in similarities.iterrows():
#                 grid_items += f"""
#                 <div class="grid-item">
#                     <h3>{row['movie']}</h3>
#                     <p>{row['language']} ({row['year']}) | Score: {row['score']}</p>
#                 </div>
#                 """

#             # Read the HTML template
#             with open("templates/index.html", "r") as file:
#                 html_template = file.read()

#             # Replace the placeholder with the generated grid items
#             html_content = html_template.replace("{{ recommendations }}", grid_items)

#             # Render the HTML content
#             st.markdown(html_content, unsafe_allow_html=True)

#         except ValueError as e:
#             st.error(str(e))
#     else:
#         st.error('Please enter a movie title.')