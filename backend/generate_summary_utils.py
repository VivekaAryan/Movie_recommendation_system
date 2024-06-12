import pandas as pd

class GenerateSummaries:
    """
    To generate summaries for movies using a language model.

    Attributes:
        llm (object): The language model used for generating summaries.

    Methods:
        get_summary(movie: str, language: str, score: str, synopsis: str, year: str) -> str:
            Generates a summary for a given movie based on the provided information.
    """

    def __init__(self, llm):
        self.llm = llm

    def get_summary(self, movie: str, language: str, score: str, synopsis: str, year: str):
        """
        Generates a summary for a given movie based on the provided information.

        Args:
            movie (str): The title of the movie.
            language (str): The language of the movie.
            score (str): The weighted score of the movie.
            synopsis (str): The plot overview of the movie.
            year (str): The release year of the movie.

        Returns:
            str: The generated summary of the movie.
        """
        
        # Define a prompt template
        prompt_template = """
        Write a brief summary based on the provided information. Do not repeat the question in the output.
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
        # Get the response from the language model
        response = self.llm(prompt)        

        # Extract the response part without unwanted tags
        if 'Summary:' in response:
            response = response.split('Summary:')[1].strip()
        
        for tag in ["- [response]:", "Explanation:", "Response:", "- [Response]:"]:
            response = response.split(tag, 1)[-1].strip() if tag in response else response
        
        return response