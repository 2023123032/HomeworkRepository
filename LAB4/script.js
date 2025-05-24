document.addEventListener("DOMContentLoaded", () => {
    const movieListElement = document.getElementById("movie-list");
    const searchInput = document.getElementById("search-input");
    const searchButton = document.getElementById("search-button");
    const sortSelect = document.getElementById("sort-select");

    let allMovies = [];
    let currentMovies = [];
    let displayIndex = 0;
    const moviesPerLoad = 1;
    let isLoading = false;

    // 1. 데이터 로드
    fetch("./product.json")
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        allMovies = Object.values(data);
        currentMovies = [...allMovies];
        displayMovies();
    })
    .catch(error => {
        console.error("Failed to load movie data:", error);
        movieListElement.innerHTML = "<p>영화를 불러오는 데 실패했습니다.</p>";
    });
        
     function displayMovies() {
        if (isLoading) return;
        isLoading = true;

        const moviesToDisplay = currentMovies.slice(displayIndex, displayIndex + moviesPerLoad);

        moviesToDisplay.forEach(movie => {
            const movieDiv = document.createElement("div");
            movieDiv.className = "movie";

            movieDiv.innerHTML = `
                <div class="poster">
                    <img src="${movie.poster_path}" alt="${movie.name}">
                    </div>
                <h2>${movie.name}</h2>
                <p>⭐ ${movie.vote_average.toFixed(1)} (${movie.vote_count} votes)</p>
                <p>🕒 ${movie.runtime} min</p>
            `;

            const posterDiv = movieDiv.querySelector(".poster");

            posterDiv.addEventListener("mouseover", () => {
                // 기존 plot이 있으면 중복 추가 방지
                if (!posterDiv.querySelector(".plot")) {
                    const plotSpan = document.createElement("span");
                    plotSpan.className = "plot";
                    plotSpan.textContent = movie.plot;
                    posterDiv.appendChild(plotSpan);
                }
            });
            posterDiv.addEventListener("mouseout", () => {
                const plotSpan = posterDiv.querySelector(".plot");
                if (plotSpan) {
                    posterDiv.removeChild(plotSpan);
                }
            });

            movieListElement.appendChild(movieDiv);
        });

        displayIndex += moviesPerLoad;
        isLoading = false;

        if (displayIndex >= currentMovies.length) {
            window.removeEventListener("scroll", infiniteScroll);
        }
    }

    function resetAndDisplayMovies() {
        movieListElement.innerHTML = '';
        displayIndex = 0;
        window.addEventListener("scroll", infiniteScroll);
        displayMovies();
    }

    function searchMovies() {
        const searchTerm = searchInput.value.toLowerCase();
        currentMovies = allMovies.filter(movie =>
            movie.name.toLowerCase().includes(searchTerm)
        );
        resetAndDisplayMovies();
    }

    function sortMovies(criteria) {
        switch (criteria) {
            case 'rating-desc':
                currentMovies.sort((a, b) => b.vote_average - a.vote_average);
                break;
            case 'rating-asc':
                currentMovies.sort((a, b) => a.vote_average - b.vote_average);
                break;
            case 'runtime-desc':
                currentMovies.sort((a, b) => b.runtime - a.runtime);
                break;
            case 'runtime-asc':
                currentMovies.sort((a, b) => a.runtime - b.runtime);
                break;
            default:
                currentMovies = [...allMovies.filter(movie =>
                    movie.name.toLowerCase().includes(searchInput.value.toLowerCase())
                )];
        }
        resetAndDisplayMovies();
    }

    function infiniteScroll() {
        // (창 높이 + 스크롤 위치)가 (전체 문서 높이 - 버퍼)보다 크면 로드
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100 && !isLoading) {
             if (displayIndex < currentMovies.length) { // 로드할 영화가 남았는지 확인
                 displayMovies();
             }
        }
    }

    searchButton.addEventListener("click", searchMovies);
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === 'Enter') {
            searchMovies();
        }
    });
    sortSelect.addEventListener("change", (e) => {
        sortMovies(e.target.value);
    });
    window.addEventListener("scroll", infiniteScroll);
});