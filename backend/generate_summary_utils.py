import pandas as pd

class GenerateSummaries:
    def __init__(self, llm):
        self.llm = llm

    def get_summary(self, movie: str, language: str, score: str, synopsis: str, year: str):
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
        response = self.llm(prompt)        
        # Extract the response part without unwanted tags
        if 'Summary:' in response:
            response = response.split('Summary:')[1].strip()
        
        for tag in ["- [response]:", "Explanation:", "[response]:"]:
            response = response.split(tag, 1)[-1].strip() if tag in response else response
        
        return response