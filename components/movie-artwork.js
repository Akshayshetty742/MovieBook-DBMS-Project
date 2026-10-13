export function formatMovieDuration(value) {
  const minutes = Number(value);
  if (!minutes) return null;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function getArtworkTheme(genre) {
  const normalized = String(genre || "").toLocaleLowerCase();
  if (normalized.includes("action")) return "action";
  if (normalized.includes("romance")) return "romance";
  if (normalized.includes("thriller")) return "thriller";
  if (normalized.includes("science fiction") || normalized.includes("sci-fi")) return "science-fiction";
  return "cinema";
}

export default function MovieArtwork({ movie, index = 0, compact = false }) {
  return (
    <div
      className={`film-art film-art-${index % 6}${compact ? " film-art-compact" : ""}`}
      data-theme={getArtworkTheme(movie.genre)}
      role="img"
      aria-label={`Original decorative poster artwork for ${movie.title}`}
    >
      <span className="film-art-orbit" />
      <span className="film-art-shape film-art-shape-one" />
      <span className="film-art-shape film-art-shape-two" />
      <span className="film-art-accent" />
      <span className="film-art-kicker">{movie.genre || "MOVIEBOOK SELECTION"}</span>
      <span className="film-art-title">{movie.title}</span>
      {movie.duration && <span className="film-art-footer">{formatMovieDuration(movie.duration)}</span>}
    </div>
  );
}
