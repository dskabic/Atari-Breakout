var c = document.getElementById("gameCanvas");
var ctx = c.getContext("2d");
let paddleWidth = 80;
let id = null;
let paddleHeight = 10;
let paddleSpeed = 15;
let isGameOver = false;
let win = false;
const startAudio = new Audio('gamestart.mp3');
const endAudio = new Audio('gameover.mp3');
// definiranje paddle objekta, odnosno palice na dnu ekrana (definira se njezina početna točka pomoću x i y koordinata, širina, visina i brzina kretanja)
// paddle je centralno pozicioniran za dnu stranice, to je omogućeno time što je od polovice širine canvasa oduzeta polovica širine paddle-a, a po y je paddle pozicioniran 5 px iznad donjeg ruba canvasa
let paddle = {
    x: (c.width - paddleWidth) / 2,
    y: c.height - paddleHeight - 5,
    width: paddleWidth,
    height: paddleHeight,
    speed: paddleSpeed
}
let ballWidth = 10;
let ballHeight = 10;
const ballSpeed = 1.5;
const accelerationFactor = 1.2;
const angle = 45;
const radians = angle * Math.PI / 180;
//definiranje širine, visine i početka cigli
let bricks = [];
const brickRowCount = 5;
const brickColumnCount = 10;
const brickWidth = 31;
const brickHeight = 18;
const brickX = 10;
const brickY = 40;
let brickCount = 0;
let start = true;
// definiranje ball objekta, odnosno loptice koja se odbija od paddle-a i zidova (definira se njezina početna točka pomoću x i y koordinata, širina, visina i brzina kretanja po x i y osi)
// ball je centralno pozicioniran iznad paddle-a, to je omogućeno time što je od polovice širine canvasa oduzeta polovica širine ball-a, a po y je ball pozicioniran iznad paddle-a za visinu ball-a ( - ballspeed se koristi kako bi u prvoj iteraciji loptica pri prikazu bila točno na središtu paddle-a)
// brzina kretanja loptice je definirana pomoću kosinusa i sinusa kuta od 45 stupnjeva, a smjer kretanja po x osi je nasumično određen (lijevo ili desno)
let ball = {
    x: (c.width - ballWidth) / 2 - ballSpeed,
    y: c.height - paddleHeight - 5 - ballHeight - ballSpeed,
    width: ballWidth,
    height: ballHeight,
    speedX: ballSpeed * Math.cos(radians) * (Math.random() < 0.5 ? -1 : 1),
    speedY: -ballSpeed * Math.sin(radians)
}
tmpx = ball.speedX;
tmpy = ball.speedY;
let score = 0;
let maxHighScore = parseInt(localStorage.getItem("breakoutHighScore")) || 0;
// prilikom učitavanja stranice, ispisuje se naslov igre i upute za početak igre
function loadGame() {
    ctx.fillStyle = "white";
    ctx.font = "bold 36px Helvetica";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("BREAKOUT", c.width/2, c.height/2);
    ctx.font = "bold italic 18px Helvetica";
    const metrics = ctx.measureText("BREAKOUT");
    const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    ctx.fillText("Press SPACE to begin", c.width/2, c.height/2 + textHeight + 10);
    window.addEventListener("keydown", onKey);
    console.log("Game Loaded");
}
// funkcija koja se poziva prilikom pritiska tipke na tipkovnici, služi za početak igre pritiskom na razmaknicu (SPACE)
function onKey(e) {
    if (e.code === "Space") {
        window.removeEventListener("keydown", onKey);
        e.preventDefault();
        startAudio.play();
        requestAnimationFrame(startGame);
        window.addEventListener("keydown", movePaddle);
    }
}
// glavna funkcija igre koja se poziva u svakoj iteraciji animacije
// ako je igra završena (isGameOver je true), funkcija se prekida
// ako je igra tek počela (start je true), kreiraju se cigle pozivom funkcije createBricks i start se postavlja na false
// zatim se ažuriraju pozicije loptice, provjeravaju se sudari s granicama i paddle-om, čisti se canvas i iscrtavaju se paddle, loptica i cigle
// na kraju se ispisuje trenutni rezultat i maksimalni rezultat u gornjem dijelu ekrana
function startGame() {
    if(isGameOver) return;
    if(start) {
        start = false;
        createBricks();
    }
    id = requestAnimationFrame(startGame);
    ball.x += ball.speedX;
    ball.y += ball.speedY;
    if(checkborderCollision()) return;
    checkPaddleCollision();
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = "white";
    ctx.shadowColor = "white";
    ctx.shadowBlur = 8;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.fillRect(ball.x, ball.y, ball.width, ball.height);
    for(let i = 0; i < bricks.length; i++) {
        let b = bricks[i];
        if(!b.destroyed) {
            checkbrickCollision(b);
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, b.y, b.width, b.height);
        }
    }
    const allDestroyed = bricks.every(b => b.destroyed);
    if (allDestroyed) {
        isGameOver = true;
        win = true;
        gameOver();
        return;
    }
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.font = "20px Helvetica";
    ctx.fillStyle = "white";
    ctx.textAlign = 'left';
    ctx.fillText(score, 20, 20);
    ctx.font = "20px Helvetica";
    ctx.fillStyle = "white";
    ctx.textAlign = 'right';
    ctx.fillText(maxHighScore, c.width - 100, 20);
}
// funkcija koja provjerava sudare loptice s granicama canvasa
// ako loptica dotakne gornju granicu, mijenja se smjer kretanja po y osi
// ako loptica dotakne lijevu ili desnu granicu, mijenja se smjer kretanja po x osi
// ako loptica prijeđe donju granicu, igra završava i poziva se funkcija gameOver
function checkborderCollision() {
    if (Math.sign(ball.speedX) === 1) tmpx = Math.abs(tmpx);
    if (Math.sign(ball.speedX) === -1) tmpx = Math.abs(tmpx) * -1;
    if (Math.sign(ball.speedY) === 1) tmpy = Math.abs(tmpy);
    if (Math.sign(ball.speedY) === -1) tmpy = Math.abs(tmpy) * -1;
    if (ball.y < 0) {
        ball.speedY = -tmpy;
        ball.speedX = tmpx;
        ball.y = 0;
    }
    if (ball.x < 0) {
        ball.x = 0;
        ball.speedX = -tmpx;
        ball.speedY = tmpy;
    }
    if(ball.x + ball.width >= c.width) {
        ball.x = c.width - ball.width;
        ball.speedX = -tmpx;
        ball.speedY = tmpy;
    }
    if (ball.y > c.height) {
        if(!isGameOver) {
            isGameOver = true;
            console.log("Ball missed the paddle");
            gameOver();
        }
        return true;
    }
    return false;
}
// funkcija koja provjerava sudare loptice s paddle-om
// provjerava se sudar, prvo za vrhove paddle-a (u smjeru gornji lijevi, gornji desni, donji lijevi, donji desni), zatim za gornju stranu paddle-a, lijevu stranu, donju stranu i desnu stranu
// prilikom sudara, mijenjaju se smjerovi kretanja loptice po x i y osi ovisno o točki sudara, te se loptica pozicionira izvan paddle-a kako ne bi došlo do ponovnog sudara u sljedećoj iteraciji i to narušilo normalno kretanje loptice
function checkPaddleCollision() {
    if (Math.sign(ball.speedX) === 1) tmpx = Math.abs(tmpx);
    if (Math.sign(ball.speedX) === -1) tmpx = Math.abs(tmpx) * -1;
    if (Math.sign(ball.speedY) === 1) tmpy = Math.abs(tmpy);
    if (Math.sign(ball.speedY) === -1) tmpy = Math.abs(tmpy) * -1;
    if (ball.x < paddle.x && ball.x + ball.width > paddle.x && ball.y < paddle.y && ball.y + ball.height > paddle.y) {
        ball.speedY = -tmpy;
        if (Math.sign(ball.speedX) === 1) {
            ball.speedX = -tmpx;
        }
        ball.y = paddle.y - ball.height;
    }
    else if (ball.x < paddle.x + paddle.width && ball.x + ball.width > paddle.x + paddle.width && ball.y < paddle.y && ball.y + ball.height > paddle.y) {
        ball.speedY = -tmpy;
        if (Math.sign(ball.speedX) === -1) {
            ball.speedX = -tmpx;
        }
        ball.y = paddle.y - ball.height;
    }
    else if (ball.x < paddle.x && ball.x + ball.width > paddle.x && ball.y < paddle.y + paddle.height && ball.y + ball.height > paddle.y + paddle.height) {
        ball.speedY = -tmpy;
        if (Math.sign(ball.speedX) === 1) {
            ball.speedX = -tmpx;
        }
        ball.y = paddle.y + paddle.height;
    }
    else if(ball.x < paddle.x + paddle.width && ball.x + ball.width > paddle.x + paddle.width && ball.y < paddle.y + paddle.height && ball.y + ball.height > paddle.y + paddle.height) {
        ball.speedY = -tmpy;
        if (Math.sign(ball.speedX) === -1) {
            ball.speedX = -tmpx;
        }
        ball.y = paddle.y + paddle.height;
    }
    else if (ball.x >= paddle.x && ball.x + ball.width  <= paddle.x + paddle.width && ball.y + ball.height >= paddle.y && ball.y <= paddle.y) {
        ball.speedY = -tmpy;
        ball.y = paddle.y - ball.height;
    }
    else if (ball.x <= paddle.x && ball.x + ball.width  >= paddle.x && ball.y >= paddle.y && ball.y + ball.height <= paddle.y + paddle.height) {
        ball.speedX = -tmpx;
        ball.x = paddle.x - ball.width;
    }
    else if (ball.x >= paddle.x && ball.x + ball.width <= paddle.x + paddle.width && ball.y <= paddle.y + paddle.height && ball.y + ball.height >= paddle.y + paddle.height) {
        ball.speedY = -tmpy;
        ball.y = paddle.y + paddle.height;
    }
    
    else if (ball.x <= paddle.x + paddle.width && ball.x + ball.width >= paddle.x + paddle.width && ball.y >= paddle.y && ball.y + ball.height <= paddle.y + paddle.height) {
        ball.speedX = -tmpx;
        ball.x = paddle.x + paddle.width;
    }
}
function checkbrickCollision(b) {
    if (Math.sign(ball.speedX) === 1) tmpx = Math.abs(tmpx);
    if (Math.sign(ball.speedX) === -1) tmpx = Math.abs(tmpx) * -1;
    if (Math.sign(ball.speedY) === 1) tmpy = Math.abs(tmpy);
    if (Math.sign(ball.speedY) === -1) tmpy = Math.abs(tmpy) * -1;
    if (ball.x < b.x && ball.x + ball.width > b.x && ball.y < b.y && ball.y + ball.height > b.y) {
        ball.speedY = -accelerationFactor * ball.speedY;
        if (Math.sign(ball.speedX) === 1) {
            ball.speedX = -accelerationFactor * ball.speedX;
        }
        else {
            ball.speedX = accelerationFactor * ball.speedX;
        }
        brickCount--;
        score++;
        b.destroyed = true;
    }
    else if (ball.x < b.x + b.width && ball.x + ball.width > b.x + b.width && ball.y < b.y && ball.y + ball.height > b.y) {
        ball.speedY = -accelerationFactor * ball.speedY;
        if (Math.sign(ball.speedX) === -1) {
            ball.speedX = -accelerationFactor * ball.speedX;
        }
        else {
            ball.speedX = accelerationFactor * ball.speedX;
        }
        brickCount--;
        score++;
        b.destroyed = true;
    }
    else if (ball.x < b.x && ball.x + ball.width > b.x && ball.y < b.y + b.height && ball.y + ball.height > b.y + b.height) {
        ball.speedY = -accelerationFactor * ball.speedY;
        if (Math.sign(ball.speedX) === 1) {
            ball.speedX = -accelerationFactor * ball.speedX;
        }
        else {
            ball.speedX = accelerationFactor * ball.speedX;
        }
        brickCount--;
        score++;
        b.destroyed = true;
    }
    else if(ball.x < b.x + b.width && ball.x + ball.width > b.x + b.width && ball.y < b.y + b.height && ball.y + ball.height > b.y + b.height) {
        ball.speedY = -accelerationFactor * ball.speedY;
        if (Math.sign(ball.speedX) === -1) {
            ball.speedX = -accelerationFactor * ball.speedX;
        }
        else {
            ball.speedX = accelerationFactor * ball.speedX;
        }
        brickCount--;
        score++;
        b.destroyed = true;
    }
    else if (ball.x >= b.x && ball.x + ball.width  <= b.x + b.width && ball.y + ball.height >= b.y && ball.y <= b.y) {
        ball.speedY = -tmpy;
        brickCount--;
        score++;
        b.destroyed = true;
    }
    else if (ball.x <= b.x && ball.x + ball.width  >= b.x && ball.y >= b.y && ball.y + ball.height <= b.y + b.height) {
        ball.speedX = -tmpx;
        brickCount--;
        score++;
        b.destroyed = true;
    }
    else if (ball.x >= b.x && ball.x + ball.width <= b.x + b.width && ball.y <= b.y + b.height && ball.y + ball.height >= b.y + b.height) {
        ball.speedY = -tmpy;
        brickCount--;
        score++;
        b.destroyed = true;
    }
    
    else if (ball.x <= b.x + b.width && ball.x + ball.width >= b.x + b.width && ball.y >= b.y && ball.y + ball.height <= b.y + b.height) {
        ball.speedX = -tmpx;
        brickCount--;
        score++;
        b.destroyed = true;
    }
        
}
// funkcija koja se poziva kada igra završi (loptica prijeđe donju granicu canvasa)
// animacija se zaustavlja pozivom cancelAnimationFrame, canvas se čisti, ispisuje se poruka "Game Over" , te se poziva funkcija resetGame koja omogućuje ponovno postavljanje igre
function gameOver() {
    cancelAnimationFrame(id);
    ctx.clearRect(0, 0, c.width, c.height);
    endAudio.play();
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.fillStyle = "yellow";
    ctx.font = "bold 40px Helvetica";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (win) {
        ctx.fillText("YOU WIN!", c.width/2, c.height/2);
        const metrics = ctx.measureText("YOU WIN!");
        const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
        ctx.font = "bold italic 18px Helvetica";
        ctx.fillText("Press SPACE to restart", c.width/2, c.height/2 + textHeight + 10);
    }
    else {
        ctx.fillText("GAME OVER", c.width/2, c.height/2);
        const metrics = ctx.measureText("GAME OVER");
        const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
        ctx.font = "bold italic 18px Helvetica";
        ctx.fillText("Press SPACE to restart", c.width/2, c.height/2 + textHeight + 10);
    }
    resetGame();
    window.addEventListener("keydown", onKey);
    
}
// funkcija koja resetira igru na početne postavke
// omogućuje se ponovno igranje igre bez potrebe za ponovnim učitavanjem stranice
// resetiraju se pozicije paddle-a i ball-a, brzine kretanja ball-a, status igre (isGameOver i start), te se ažurira maksimalni rezultat ako je trenutni rezultat veći od prethodnog maksimalnog
function resetGame() {
    paddle.x = (c.width - paddleWidth) / 2;
    paddle.y = c.height - paddleHeight - 5;
    ball.x = (c.width - ballWidth) / 2 - ballSpeed;
    ball.y = c.height - paddleHeight - 5 - ballHeight - ballSpeed;
    ball.speedX = ballSpeed * Math.cos(radians) * (Math.random() < 0.5 ? -1 : 1);
    ball.speedY = -ballSpeed * Math.sin(radians);
    tmpx = ball.speedX;
    tmpy = ball.speedY;
    isGameOver = false;
    win = false;
    start = true;
    maxHighScore = parseInt(localStorage.getItem("breakoutHighScore")) || 0;
    if (score > maxHighScore) {
        maxHighScore = score;
        localStorage.setItem("breakoutHighScore", maxHighScore);
    }
    score = 0;
}
//pomicanje paddle-a lijevo i desno pomoću strelica na tipkovnici
function movePaddle(e) {
    if (e.code === "ArrowLeft") {
        if (paddle.x - paddle.speed >= 0) {
            paddle.x -= paddle.speed;
        }
    } else if (e.code === "ArrowRight") {
        if (paddle.x + paddle.width + paddle.speed <= c.width) {
            paddle.x += paddle.speed;
        }
    }
}
// definiranje boja za cigle
const brickColors = [
  "rgb(153, 51, 0)",     // 1. red - smeđa
  "rgb(255, 0, 0)",      // 2. red - crvena
  "rgb(255, 153, 204)",  // 3. red - ružičasta
  "rgb(0, 255, 0)",      // 4. red - zelena
  "rgb(255, 255, 153)"   // 5. red - žuta
];
const brickXspacing = 30;
const brickYspacing = 15;
// funkcija koja kreira cigle i postavlja ih na poziciju na canvasu, te se dodaju razmaci između cigli
function createBricks() {
    bricks = [];
    for(let r = 0; r < brickRowCount; r++) {
        for(let c = 0; c < brickColumnCount; c++) {
            let brick = {
                x: brickX + c * (brickWidth + brickXspacing),
                y: brickY + r * (brickHeight + brickYspacing),
                width: brickWidth,
                height: brickHeight,
                color: brickColors[r],
                destroyed: false
            }
            bricks.push(brick);
        }
    }
    brickCount = bricks.length;
    console.log("Bricks created:", brickCount);
}