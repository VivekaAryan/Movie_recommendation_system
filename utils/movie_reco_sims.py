import pandas as pd

class MovieRecommender:
    def __init__(self, soups, vector_db):
        self.soups = soups
        self.vector_db = vector_db

    def get_recommendations(self, title):
        
        if title not in self.soups:
            raise ValueError(f"Title '{title}' not found in indices")
        
        query = self.soups.get(title)  
        
        results = self.vector_db.similarity_search(query, k=11)

        top_ten = []

        for x in results[1:]:
            movie_metadata = {
                'movie': x.metadata['movie'],
                'language': x.metadata['language'],
                'popularity': x.metadata['popularity'],
                'score': round(x.metadata['score'],1),
                'synopsis': x.metadata['synopsis'],
                'year': x.metadata['year']
            }
            top_ten.append(movie_metadata)

        df_top_ten = pd.DataFrame(top_ten)
        df_top_ten.sort_values(by=['score', 'popularity'], ascending=[False, False], inplace=True)
        similarities = df_top_ten[['movie', 'language','score','year']]

        return similarities, df_top_ten