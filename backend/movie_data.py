import re

import pandas as pd

from backend.config import EMBEDDING_MODEL, FAISS_INDEX_PATH, METADATA_CSV

TMDB_GENRES = sorted(
    [
        "Science Fiction",
        "TV Movie",
        "Action",
        "Adventure",
        "Animation",
        "Comedy",
        "Crime",
        "Documentary",
        "Drama",
        "Family",
        "Fantasy",
        "History",
        "Horror",
        "Music",
        "Mystery",
        "Romance",
        "Thriller",
        "War",
        "Western",
    ],
    key=len,
    reverse=True,
)


def _token_has_fused_name(token: str) -> bool:
    return bool(re.search(r"[a-zà-öø-ÿ][A-Z]|[A-Z][a-z]+[A-Z]", token))


def split_camel_case(name: str) -> str:
    if not name:
        return ""
    if " " in name:
        return name
    return re.sub(r"(?<=[a-zà-öø-ÿ])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])", " ", name)


def format_person_token(token: str) -> str:
    return split_camel_case(token.strip())


def format_cast(cast: str) -> str:
    if cast is None or (isinstance(cast, float) and pd.isna(cast)):
        return ""
    cast = str(cast).strip()
    if not cast:
        return ""

    if "," in cast:
        return ", ".join(format_person_token(name) for name in cast.split(",") if name.strip())

    tokens = [token for token in cast.split() if token]
    if any(_token_has_fused_name(token) for token in tokens):
        return ", ".join(format_person_token(token) for token in tokens)

    return cast


def format_director(director: str) -> str:
    if director is None or (isinstance(director, float) and pd.isna(director)):
        return ""
    director = str(director).strip()
    if not director:
        return ""

    if "," in director:
        parts = []
        for name in director.split(","):
            name = name.strip()
            if not name:
                continue
            tokens = name.split()
            if len(tokens) == 1:
                parts.append(format_person_token(tokens[0]))
            elif any(_token_has_fused_name(token) for token in tokens):
                parts.append(", ".join(format_person_token(token) for token in tokens))
            else:
                parts.append(" ".join(tokens))
        return ", ".join(parts)

    tokens = director.split()
    if len(tokens) == 1:
        return format_person_token(tokens[0])
    if any(_token_has_fused_name(token) for token in tokens):
        return ", ".join(format_person_token(token) for token in tokens)
    return " ".join(tokens)


def format_genres(genres: str) -> str:
    if genres is None or (isinstance(genres, float) and pd.isna(genres)):
        return ""
    genres = str(genres).strip()
    if not genres:
        return ""

    if "," in genres:
        return ", ".join(part.strip() for part in genres.split(",") if part.strip())

    remaining = genres
    found: list[str] = []
    while remaining:
        matched = False
        for genre in TMDB_GENRES:
            if remaining.startswith(genre):
                found.append(genre)
                remaining = remaining[len(genre) :].strip()
                matched = True
                break
        if not matched:
            word = remaining.split(" ", 1)[0]
            found.append(word)
            remaining = remaining[len(word) :].strip()

    return ", ".join(found)


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
