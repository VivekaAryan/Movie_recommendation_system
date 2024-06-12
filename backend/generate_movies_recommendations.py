class MovieRecommender:
    """
    To provide movie recommendations based on the provided movie title using a Weaviate vector database.

    Attributes:
        soups (pd.Series): A series containing concatenated movie features used for querying.
        vector_db (object): Weaviate vector database used for similarity searches.

    Methods:
        get_recommendations(title: str) -> list:
            Retrieves the top ten movie recommendations based on the provided movie title.
    """

    def __init__(self, soups, vector_db):
        self.soups = soups
        self.vector_db = vector_db

    def get_recommendations(self, title):
        """
        Retrieves the top ten movie recommendations based on the provided movie title.

        Args:
            title (str): The title of the movie for which recommendations are to be retrieved.

        Returns:
            list: A list of dictionaries containing metadata for the top ten recommended movies.

        Raises:
            ValueError: If the provided movie title is not found in the soups.
        """
        
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
                'year': x.metadata['year'],
                'poster_path': x.metadata['poster_path']
            }
            top_ten.append(movie_metadata)

        top_ten.sort(key=lambda x: (-x['score'], -x['popularity']))

        return top_ten