const canvas = document.getElementById("cnvs");

const gameState = {};

function onMouseMove(e) {
    gameState.pointer.x = e.pageX;
    gameState.pointer.y = e.pageY
}

function queueUpdates(numTicks) {
    for (let i = 0; i < numTicks; i++) {
        gameState.lastTick = gameState.lastTick + gameState.tickLength;
        update(gameState.lastTick);
    }
}

function draw(tFrame) {
    const context = canvas.getContext('2d');

    // clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    drawPlatform(context)
    drawBall(context)
    drawTextInfo(context)
    if(gameState.bonus.isActive)
        drawBonus(context)
}

function platformCollision()
{
ball = gameState.ball;
player = gameState.player;

 if(ball.x+ball.radius >= canvas.width || ball.x-ball.radius <= 0)
        ball.vx *= -1
    if(ball.y+ball.radius >= canvas.height || ball.y-ball.radius <= 0)
        ball.vy *= -1
    
    // ball-platform vertical collision
    if( (ball.x-ball.radius+ball.vy >= player.x-player.width/2 &&
        ball.x+ball.radius <= player.x+player.width/2) &&
        (ball.y+ball.radius >= player.y-player.height/2) &&
        ball.vy > 0)
            {
                ball.vy *= -1
            }

    // ball-platform horizontal collision
    else if(ball.y+ball.radius >= player.y-player.height/2 &&
    (
        (ball.x+ball.radius >= player.x-player.width/2 && 
            ball.x+ball.radius <= player.x+player.width/2) ||
        (ball.x-ball.radius >= player.x-player.width/2 && 
            ball.x-ball.radius <= player.x+player.width/2) 
    ) && Math.sign(ball.vx) === Math.sign(player.vx))
    {
        ball.vx *= -1
    }
        
    ball.x += ball.vx
    ball.y += ball.vy
}

function bonusCollision()
{
    const bonus = gameState.bonus;

    if(gameState.bonus.isActive)
    {
        if(bonus.top + bonus.height >= player.y-player.height/2 &&
            (
                (bonus.left+bonus.width >= player.x-player.width/2 && 
                    bonus.left+bonus.width <= player.x+player.width/2) ||
                (bonus.left >= player.x-player.width/2 && 
                    bonus.left <= player.x+player.width/2) 
            ))
            {
                bonus.isActive = false;
                gameState.score += 15
                player.width+=15
            }
        gameState.bonus.left += gameState.bonus.vx
        gameState.bonus.top += 5
    }
}

function update(tick) {

    if(gameState.isLose)
        stopGame(gameState.stopCycle)
    const vx = (gameState.pointer.x - gameState.player.x) / 10
    gameState.player.x += vx

    const ball = gameState.ball;
    
    platformCollision();
    bonusCollision();
    
    if(ball.y+ball.radius >= canvas.height)
    {
       clearInterval(gameState.timerScore)
       clearInterval(gameState.timerSpeed)
       clearInterval(gameState.timerBonus)
       gameState.isLose = true;
    }
}

function run(tFrame) {
    gameState.stopCycle = window.requestAnimationFrame(run);

    const nextTick = gameState.lastTick + gameState.tickLength;
    let numTicks = 0;

    if (tFrame > nextTick) {
        const timeSinceTick = tFrame - gameState.lastTick;
        numTicks = Math.floor(timeSinceTick / gameState.tickLength);
    }
    queueUpdates(numTicks);
    draw(tFrame);
    gameState.lastRender = tFrame;
}

function stopGame(handle) {
    window.cancelAnimationFrame(handle);
}

function drawPlatform(context) {
    const {x, y, width, height} = gameState.player;
    context.beginPath();
    context.rect(x - width / 2, y - height / 2, width, height);
    context.fillStyle = "#FF0000";
    context.fill();
    context.closePath();
}

function drawBall(context) {
    const {x, y, radius} = gameState.ball;
    context.beginPath();
    context.arc(x, y, radius, 0, 2 * Math.PI);
    context.fillStyle = "#0000FF";
    context.fill();
    context.closePath();
}

function drawBonus(context)
{
    const {left, top, width, height} = gameState.bonus
    const coordsArray = [
        [left+width/3, top],
        [left+width*2/3, top],
        [left+width*2/3, top+height/3],
        [left+width, top+height/3],
        [left+width, top+height*2/3],
        [left+width*2/3, top+height*2/3],
        [left+width*2/3, top+height],
        [left+width/3, top+height],
        [left+width/3, top+height*2/3],
        [left, top+height*2/3],
        [left, top+height/3],
        [left+width/3, top+height/3],
    ]
    context.beginPath();
    context.moveTo(left+width/3, top)
    coordsArray.forEach(point => {
        context.lineTo(point[0], point[1])
    });
    context.fillStyle = "#00F00F";
    context.fill();
    context.closePath();
}

function generateBonusParams()
{
    gameState.bonus.left = Math.random() * (canvas.width - gameState.bonus.width)
    gameState.bonus.top = Math.random() * (canvas.height/2 - gameState.bonus.height)
}

function drawTextInfo(context)
{
    if(gameState.isLose)
    {
        context.fillStyle = "#FF0000"
        context.font = "48px serif"
        context.fillText("You lose", canvas.width*5/12, canvas.height/2)
    }
    context.fillStyle = "#FF00FF"
    context.font = "48px serif"
    context.fillText("SCORE: " + gameState.score, canvas.width/10, canvas.height/10)
}

function setup() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    canvas.addEventListener('mousemove', onMouseMove, false);

    gameState.lastTick = performance.now();
    gameState.lastRender = gameState.lastTick;
    gameState.tickLength = 15; //ms
    canvas.addEventListener('click', onRestart, false)

    const platform = {
        width: 400,
        height: 50,
    };

    gameState.player = {
        x: 100,
        y: canvas.height - platform.height / 2,
        width: platform.width,
        height: platform.height
    };
    gameState.pointer = {
        x: 0,
        y: 0,
    };
    gameState.ball = {
        x: canvas.width / 2,
        y: 26,
        radius: 25,
        vx: (Math.random() < 0.5 ? -1 : 1) * Math.random() * 10,
        vy: 7
    }
    gameState.bonus = {
        top: 0,
        left: 0,
        width: 30,
        height: 30,
        vx: 0,
        vy: 0,
        angle:0,
        t: 0,
        isActive: false
    }

    gameState.isLose = false
    gameState.score = 0

    gameState.timerScore = setInterval(function()
    {
         if(gameState.player.width > gameState.ball.radius*2)
             gameState.player.width-=1
    }, 
    350);
    gameState.timerScore = setInterval(function()
    {
        gameState.score++;
    }, 
    1000);
    gameState.timerSpeed = setInterval(function()
    {
        if(gameState.player.width > 200)
            gameState.player.width-=10
        gameState.ball.vx *= 1.1
        gameState.ball.vy *= 1.1
    }, 
    30000);
    gameState.timerBonus = setInterval(function()
    {   
        gameState.bonus.isActive = true;
        generateBonusParams()
    }, 
    15000);
}

function onRestart(e)
{
    if(gameState.isLose)
        startGame()
}

function startGame()
{
    setup();
    run();
}

startGame()