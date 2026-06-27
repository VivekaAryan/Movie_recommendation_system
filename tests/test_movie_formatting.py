from backend.movie_data import format_cast, format_director, format_genres


def test_format_cast_splits_fused_names():
    assert format_cast("ChristianBale HeathLedger MichaelCaine") == (
        "Christian Bale, Heath Ledger, Michael Caine"
    )


def test_format_cast_preserves_already_spaced_name():
    assert format_cast("Christian Bale") == "Christian Bale"


def test_format_cast_handles_unicode_names():
    assert format_cast("RobertPattinson ZoëKravitz PaulDano") == (
        "Robert Pattinson, Zoë Kravitz, Paul Dano"
    )


def test_format_director_preserves_full_name():
    assert format_director("Christopher Nolan") == "Christopher Nolan"


def test_format_genres_splits_tmdb_genres():
    assert format_genres("Drama Action Crime Thriller") == (
        "Drama, Action, Crime, Thriller"
    )


def test_format_genres_handles_science_fiction():
    assert format_genres("Science Fiction Action Adventure") == (
        "Science Fiction, Action, Adventure"
    )
