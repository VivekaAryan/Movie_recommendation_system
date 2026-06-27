import pandas as pd

from backend.config import EMBEDDING_MODEL, FAISS_INDEX_PATH, METADATA_CSV


def build_soup(row: pd.Series) -> str:
    overview = row["overview"]
    if pd.isna(overview):
        overview = ""
    else:
        overview = str(overview)[:500]
    return (
        f"Title: {row['title']}. Overview: {overview}. "
        f"Genres: {row['genres']}. Keywords: {row['keywords']}. "
        f"Cast: {row['cast']}. Director: {row['director']}."
    )


def load_movies_df(csv_path: str = METADATA_CSV) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    df["soup"] = df.apply(build_soup, axis=1)
    return df
