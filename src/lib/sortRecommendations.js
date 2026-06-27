export const DEFAULT_SORT = "best-match";

export const SORT_OPTIONS = [
  { value: "best-match", label: "Best match", group: "Recommended" },
  { value: "rating-desc", label: "Rating (high to low)", group: "Rating" },
  { value: "rating-asc", label: "Rating (low to high)", group: "Rating" },
  { value: "popularity-desc", label: "Popularity (high to low)", group: "Popularity" },
  { value: "popularity-asc", label: "Popularity (low to high)", group: "Popularity" },
  { value: "year-desc", label: "Release year (newest)", group: "Release year" },
  { value: "year-asc", label: "Release year (oldest)", group: "Release year" },
];

const SORT_GROUPS = SORT_OPTIONS.reduce((groups, option) => {
  if (!groups.includes(option.group)) groups.push(option.group);
  return groups;
}, []);

export { SORT_GROUPS };

function compareNumber(a, b, direction) {
  const left = Number(a) || 0;
  const right = Number(b) || 0;
  return direction === "asc" ? left - right : right - left;
}

function compareString(a, b, direction) {
  const result = String(a ?? "").localeCompare(String(b ?? ""), undefined, {
    sensitivity: "base",
  });
  return direction === "asc" ? result : -result;
}

function tieBreak(a, b) {
  return compareString(a.movie, b.movie, "asc");
}

const SORT_COMPARATORS = {
  "best-match": (a, b) => compareNumber(a.final_score, b.final_score, "desc") || tieBreak(a, b),
  "rating-desc": (a, b) => compareNumber(a.score, b.score, "desc") || tieBreak(a, b),
  "rating-asc": (a, b) => compareNumber(a.score, b.score, "asc") || tieBreak(a, b),
  "popularity-desc": (a, b) => compareNumber(a.popularity, b.popularity, "desc") || tieBreak(a, b),
  "popularity-asc": (a, b) => compareNumber(a.popularity, b.popularity, "asc") || tieBreak(a, b),
  "year-desc": (a, b) => compareNumber(a.year, b.year, "desc") || tieBreak(a, b),
  "year-asc": (a, b) => compareNumber(a.year, b.year, "asc") || tieBreak(a, b),
};

export function sortRecommendations(recommendations, sortBy = DEFAULT_SORT) {
  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    return [];
  }

  const compare = SORT_COMPARATORS[sortBy] ?? SORT_COMPARATORS[DEFAULT_SORT];
  return [...recommendations].sort(compare);
}
