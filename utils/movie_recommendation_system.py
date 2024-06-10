import pandas as pd

class MovieRecommender:
    def __init__(self, soups, vector_db, llm):
        self.soups = soups
        self.vector_db = vector_db
        self.llm = llm

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

    def _get_summary(self, movie: str, language: str, score: str, synopsis: str, year: str):
        # Define a prompt template
        prompt_template = """
        Write a brief summary based on the providedinformation. Do not repeat the question in the output.
        Movie: {movie}
        Language: {language}
        Weighted score: {score}
        Plot Overview: {synopsis}
        Year: {year}
        Summary: 
        """
        
        prompt = prompt_template.format(movie=movie, 
                                        language=language, 
                                        score=score,
                                        synopsis=synopsis,
                                        year=year
                                        )
        response = self.llm(prompt)        
        # Extract the response part without unwanted tags
        if 'Summary:' in response:
            response = response.split('Summary:')[1].strip()
        
        # Remove specific response tags like "- [response]:"
        response = response.split("Explanation:")[-1].strip()
        
        return response
    
    def generate_summaries(self, df_top_ten):
        """
        Generate summaries for each row in the provided DataFrame.
        """
        summaries = []
        for _, row in df_top_ten.iterrows():
            summary = self._get_summary(
                row['movie'], row['language'], row['score'], row['synopsis'], row['year']
            )
            summaries.append(summary)
        return summaries