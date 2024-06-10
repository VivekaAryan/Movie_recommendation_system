import configparser
import os

parser = configparser.ConfigParser()
parser.read(os.path.join(os.path.dirname(__file__), '../config/config.conf'))

#TMDB
TMDB_API_ID = parser.get('TMDB', 'tmdb_api_key')

#Weaviate
WEAVIATE_URL = parser.get('Weaviate', 'weaviate_url')
WEAVIATE_API_KEY = parser.get('Weaviate', 'weaviate_api_key')
WEAVIATE_INDEX_NAME = parser.get('Weaviate', 'weaviate_index_name')