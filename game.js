let isCountdownActive = true;
let countdownTime = 3;

let animationId = null;
let cloudInterval;

// board
let board;
let boardWidth = window.innerWidth;
let boardHeight = window.innerHeight;
let context;

// witch
let witchWidth = boardWidth * 0.05; // 5% of screen width
let witchHeight = boardHeight * 0.1;

let witchX = boardWidth / 8;
let witchY = boardHeight / 2;

let witch = {
    x: witchX,
    y: witchY,
    width: witchWidth,
    height: witchHeight
};

// clouds
let cloudArray = [];
let cloudWidth = 227;
let cloudHeight = 147;
let cloudX = boardWidth;

let topCloudImg;
let bottomCloudImg;
let witchImg;

// physics
let velocityX = -2;
let velocityY = 0;
let gravity = 0.4;

let gameOver = false;
let score = 0;

let bgs = new Audio("./backsound.mp3");

// Offscreen canvases
let witchCanvas = document.createElement("canvas");
witchCanvas.width = witchWidth;
witchCanvas.height = witchHeight;
let witchCtx = witchCanvas.getContext("2d");

let cloudCanvas = document.createElement("canvas");
cloudCanvas.width = cloudWidth;
cloudCanvas.height = cloudHeight;
let cloudCtx = cloudCanvas.getContext("2d");

window.onload = function () {
    board = document.getElementById("board"); // make sure board is assigned
    board.width = boardWidth;
    board.height = boardHeight;
    context = board.getContext("2d");

    // Handle window resizing
    window.addEventListener("resize", () => {
        boardWidth = window.innerWidth;
        boardHeight = window.innerHeight;
        board.width = boardWidth;
        board.height = boardHeight;
    });

    // load images
    witchImg = new Image();
    witchImg.src = "./img/witch.png";

    topCloudImg = new Image();
    topCloudImg.src = "./img/cloud1.png";

    bottomCloudImg = new Image();
    bottomCloudImg.src = "./img/cloud2.png";

    let imagesLoaded = 0;

    function onImageLoad() {
        imagesLoaded++;
        if (imagesLoaded === 3) {
            startCountdown(); // ⬅️ Start countdown before gameplay
        }

        bgs.play();
    }

    witchImg.onload = onImageLoad;
    topCloudImg.onload = onImageLoad;
    bottomCloudImg.onload = onImageLoad;

    document.addEventListener("keydown", (e) => {
        if (e.code === "Escape") {
            window.location.href = "menu.html";
        }
    });
};


function update() {
    context.clearRect(0, 0, board.width, board.height);

    if (isCountdownActive) {
        // Redraw witch standing still during countdown
        context.drawImage(witchImg, witch.x, witch.y, witch.width, witch.height);
        return; // Skip game logic until countdown finishes
    }
    
    // Schedule next frame only if game not over
    animationId = requestAnimationFrame(update);
    
    // Witch physics
    velocityY += gravity;
    witch.y = Math.max(witch.y + velocityY, 0);
    context.drawImage(witchImg, witch.x, witch.y, witch.width, witch.height);
    
    if (witch.y + witch.height >= boardHeight) {
        gameOver = true;
        cancelAnimationFrame(animationId);
        clearInterval(cloudInterval);

        setTimeout(() => {
            window.location.href = "gameover.html?score=" + score;
        }, 50);

        return;
    }

    
    
    // Clouds
    for (let i = 0; i < cloudArray.length; i++) {
        let cloud = cloudArray[i];
        cloud.x += velocityX;
        context.drawImage(cloud.img, cloud.x, cloud.y, cloud.width, cloud.height);

        if (cloud.isTop && !cloud.passed && witch.x > cloud.x + cloud.width) {
            score += 1;
            cloud.passed = true;
        }


        if (pixelPerfectCollision(witch, cloud)) {
            console.log("Pixel-perfect collision detected");
            
            cancelAnimationFrame(animationId);
            clearInterval(cloudInterval);

            setTimeout(() => {
                window.location.href = "gameover.html?score=" + score;
            }, 50);

            return;
        }


    }

    
    // Score display
    context.fillStyle = "white";
    context.font = "45px sans-serif";
    context.fillText(score, 5, 45);
    
    if (gameOver) {
        drawGameOver();

        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        if (cloudInterval) {
            clearInterval(cloudInterval);
            cloudInterval = null;
        }

        return;
    }
}



function placeClouds() {
    if (gameOver) return;

    let openingSpace = board.height / 4;
    let minTopY = 0;
    let maxTopY = boardHeight - (2 * cloudHeight + openingSpace);
    let randomCloudY = minTopY + Math.random() * (maxTopY - minTopY);

    let topCloud = {
        img: topCloudImg,
        x: cloudX,
        y: randomCloudY,
        width: cloudWidth,
        height: cloudHeight,
        passed: false,
        isTop: true // Mark only the top one for scoring
    };

    let bottomCloud = {
        img: bottomCloudImg,
        x: cloudX,
        y: randomCloudY + cloudHeight + openingSpace,
        width: cloudWidth,
        height: cloudHeight,
        passed: false,
        isTop: false
    };


    cloudArray.push(topCloud);
    cloudArray.push(bottomCloud);
}

function moveWitch(e) {
    if (gameOver) return;
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyX") {
        velocityY = -6;
    }
}


function detectCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

function pixelPerfectCollision(a, b) {
    let overlapX = Math.max(a.x, b.x);
    let overlapY = Math.max(a.y, b.y);
    let overlapWidth = Math.min(a.x + a.width, b.x + b.width) - overlapX;
    let overlapHeight = Math.min(a.y + a.height, b.y + b.height) - overlapY;

    if (overlapWidth <= 0 || overlapHeight <= 0) return false;

    // Resize canvas to match overlap
    witchCanvas.width = overlapWidth;
    witchCanvas.height = overlapHeight;
    cloudCanvas.width = overlapWidth;
    cloudCanvas.height = overlapHeight;

    // Clear offscreen
    witchCtx.clearRect(0, 0, overlapWidth, overlapHeight);
    cloudCtx.clearRect(0, 0, overlapWidth, overlapHeight);

    // Draw only overlapping regions
    witchCtx.drawImage(witchImg, a.x - overlapX, a.y - overlapY);
    cloudCtx.drawImage(b.img, b.x - overlapX, b.y - overlapY);

    let witchData = witchCtx.getImageData(0, 0, overlapWidth, overlapHeight).data;
    let cloudData = cloudCtx.getImageData(0, 0, overlapWidth, overlapHeight).data;

    for (let i = 0; i < witchData.length; i += 4) {
        if (witchData[i + 3] > 10 && cloudData[i + 3] > 10) {
            return true;
        }
    }
    return false;
}

function startCountdown() {
    let countdownInterval = setInterval(() => {
        context.clearRect(0, 0, board.width, board.height);
        context.drawImage(witchImg, witch.x, witch.y, witch.width, witch.height);

        context.fillStyle = "white";
        context.font = "100px Courier New bold";
        context.textAlign = "center";

        if (countdownTime > 0) {
            context.fillText(countdownTime, board.width / 2, board.height / 2);
        } else {
            context.fillText("Go!", board.width / 2, board.height / 2);
        }

        countdownTime--;

        if (countdownTime < -1) {
            clearInterval(countdownInterval);
            isCountdownActive = false;

            // Start main loop
            animationId = requestAnimationFrame(update);
            cloudInterval = setInterval(placeClouds, 4000);

            document.addEventListener("keydown", moveWitch);
        }
    }, 1000);
}



// function drawGameOver() {
//     context.fillStyle = "rgba(0, 0, 0, 0.5)";
//     context.fillRect(0, 0, board.width, board.height);

//     context.fillStyle = "white";
//     context.font = "70px sans-serif";
//     context.textAlign = "center";
//     context.fillText("Game Over", board.width / 2, board.height / 2);
//     context.font = "40px sans-serif";
//     context.fillText("Score: " + score, board.width / 2, board.height / 2 + 60);
// }