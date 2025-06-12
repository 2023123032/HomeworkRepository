const express = require('express');
const fs = require('fs').promises; // fs.promises 사용
const path = require('path');
const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

// 데이터베이스 연결 함수(에러 체크)
const dbPath = path.join(__dirname, "product.db");
async function getDBConnection() {
    try {
        const db = await sqlite.open({
            filename: dbPath, 
            driver: sqlite3.Database
        });
        console.log("DB connection attempt successful."); 
        return db;
    } catch (error) {
        console.error("DB Connection Error:", error);
        throw error;
    }
}


// 정적 파일 제공 (public, images 폴더)
app.use(express.static(path.join(__dirname, 'public'), { index: false }));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//메인 페이지
app.get('/', async (req, res) => {
    try {
        const { search, sort } = req.query;
        const db = await getDBConnection();

        let sql = `SELECT * FROM movies`;
        const params = [];

        if (search) {
            sql += ` WHERE movie_title LIKE ?`;
            params.push(`%${search}%`);
        }

        switch (sort) {
            case 'rating-desc':
                sql += ` ORDER BY movie_rate DESC`;
                break;
            case 'rating-asc':
                sql += ` ORDER BY movie_rate ASC`;
                break;
            case 'runtime-desc':
                sql += ` ORDER BY runtime DESC`;
                break;
            case 'runtime-asc':
                sql += ` ORDER BY runtime ASC`;
                break;
        }

        // db받고 닫기
        const movies = await db.all(sql, params);
        await db.close();

        const indexPath = path.join(__dirname, 'public', 'index.html');
        let htmlData = await fs.readFile(indexPath, 'utf8');

        // 영화 카드 HTML 생성
        const movieCards = movies.map(movie => `
            <div class="movie">
                <a href="/movie.html?id=${movie.movie_id}" style="text-decoration: none; color: inherit;">
                    <div class="poster">
                        <img src="${movie.movie_image}" alt="${movie.movie_title}">
                        <div class="plot">
                            <p>${movie.movie_overview}</p>
                        </div>
                    </div>
                    <h2>${movie.movie_title}</h2>
                    <p>평점: ${movie.movie_rate} / 10</p>
                    <p>상영시간: ${movie.runtime}분</p>
                </a>
            </div>
        `).join('');

        const finalHtml = htmlData.replace(
            '<div class="movie-list" id="movie-list">',
            `<div class="movie-list" id="movie-list">${movieCards}`
        );
        res.send(finalHtml);

    } catch (err) {
        console.error(err);
        res.status(500).send('서버 오류가 발생했습니다.');
    }
});

// 2. 영화 상세 페이지(html로 하는게 맞는지는 모르겠지만 동영상에 이렇게 하셔서 이렇게 구성했습니다)
app.get('/movie.html', async (req, res) => {
    try {
        const movieId = req.query.id;
        if (!movieId) {
            return res.status(400).send('영화 ID가 필요합니다.');
        }

        const db = await getDBConnection();
        const movie = await db.get(`SELECT * FROM movies WHERE movie_id = ?`, [movieId]);
        await db.close();
        if (!movie) {
            return res.status(404).send('해당 영화를 찾을 수 없습니다.');
        }

        // 댓글 읽기
        const commentsPath = path.join(__dirname, 'public', 'comments.json');
        let movieComments = [];
        try {
            const commentsData = await fs.readFile(commentsPath, 'utf8');
            const allComments = JSON.parse(commentsData);
            movieComments = allComments[movieId] || [];
        } catch (readErr) {
            //에러시?
        }

        //이쪽에 문제있었음(체크 필요)
        const detailTemplatePath = path.join(__dirname, 'public', 'movie_temp.html'); 
        let detailHtml = await fs.readFile(detailTemplatePath, 'utf8');

        detailHtml = detailHtml.replace(/{{movie_title}}/g, movie.movie_title)
                               .replace(/{{movie_id}}/g, movie.movie_id)
                               .replace('{{movie_image_src}}', `${movie.movie_image}`)
                               .replace('{{movie_release_date}}', movie.movie_release_date)
                               .replace('{{movie_rate}}', movie.movie_rate)
                               .replace('{{movie_overview}}', movie.movie_overview);

        const commentsHtml = movieComments.length > 0 ? movieComments.map(comment => `
            <div class="comment">
                <p>${comment.content}</p>
            </div>
        `).join('') : '<p>아직 작성된 후기가 없습니다.</p>';

        detailHtml = detailHtml.replace('{{comments_section}}', commentsHtml);
        res.send(detailHtml);

    } catch (err) {
        console.error(err);
        res.status(500).send('서버 오류가 발생했습니다.');
    }
});


// 코멘트 작성
app.post('/comments', async (req, res) => {
    try {
        const { content, movieId } = req.body;
        if (!content || !movieId) {
            return res.status(400).send('내용과 영화 ID가 모두 필요합니다.');
        }

        const newComment = { content };
        const commentsPath = path.join(__dirname, 'public', 'comments.json');

        let allComments = {};
        try {
            const data = await fs.readFile(commentsPath, 'utf8');
            allComments = JSON.parse(data);
        } catch (readErr) {
            //에러시?
        }

        if (!allComments[movieId]) {
            allComments[movieId] = [];
        }
        allComments[movieId].push(newComment);

        await fs.writeFile(commentsPath, JSON.stringify(allComments, null, 2), 'utf8');
        
        //코멘트 올리면 페이지 리프레시
        res.redirect(`/movie.html?id=${movieId}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('새 후기를 저장하는 중 오류가 발생했습니다.');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});