document.addEventListener("DOMContentLoaded", () => {
  fetch("./product.json")
    .then(response => response.json())
    .then(data => {
      const movieList = document.getElementById("movie-list");

      Object.values(data).forEach(movie => {
        const genreList = movie.genre.map(g => g.name).join(", ");

        const movieDiv = document.createElement("div");
        movieDiv.className = "movie-card";
        movieDiv.innerHTML = `
          <img src="${movie.poster_path}" alt="${movie.name}" class="movie-img">
          <h2>${movie.name}</h2>
          <p><strong>Language:</strong> ${movie.lang}</p>
          <p><strong>Rating:</strong> ${movie.vote_average} / 10 (${movie.vote_count} votes)</p>
          <p><strong>Runtime:</strong> ${movie.runtime} minutes</p>
          <p><strong>Genres:</strong> ${genreList}</p>
          <p><strong>Plot:</strong> ${movie.plot}</p>
        `;
        movieList.appendChild(movieDiv);
      });
    })
    .catch(error => {
      console.error("Failed to load movie data:", error);
    });
});
