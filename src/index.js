const canvas = document.getElementById("cnvs");

const gameState = {};

const PI2 = 6.28
const Grey = "#888888", Yellow = "#FFFF00", Red = "#FF0000";
const Circle = 'circle', Triangle = 'triangle', Hexagon = 'hexagon'
const circleSize = 20, triangleSize = 30, hexagonSize = 30;
const maxSizeOfObject = 80;
const startCount = 100;

// предварительная проверка столкновений по описанным сферам
// выводить FPS
// сетка? квадродерево?

function queueUpdates(numTicks) {
    for (let i = 0; i < numTicks; i++) {
        gameState.lastTick = gameState.lastTick + gameState.tickLength;
        update(gameState.lastTick);
    }
}

function draw(tFrame) {
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    gameState.figures.forEach(x => x.draw(context));
    drawTextInfo(context)
}

function update(tick) {
    if(gameState.count === 0)
        stopGame(gameState.stopCycle)

    gameState.figures.forEach(f => 
        {
            f.dx = f.x + f.vx;
            f.dy = f.y + f.vy;

            // wall collision
            if(f.x+f.right >= canvas.width || f.x+f.left <= 0)
                f.vx *= -1;
            if(f.y+f.top >= canvas.height || f.y+f.bottom <= 0)
                f.vy *= -1;
            f.x += f.vx;
            f.y += f.vy;

            if(f.dx != f.x || f.dy != f.y)
                f.state++;
        })
    changeColor();
    clear();
}

function changeColor()
{
    gameState.figures.forEach(f => 
    {
        switch(f.state){
            case 1:
                f.color = Yellow;
                break;
            case 2:
                f.color = Red;
                break;
        }
    })
}

function clear()
{
    let i = 0;
    while(i < gameState.figures.length)
    {
        if(gameState.figures[i].state > 2)
            gameState.figures.splice(i, 1);
        else
            i++;
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

function drawTextInfo(context)
{
    context.fillStyle = "#FF800F"
    context.font = "48px serif"
    context.fillText("COUNT: " 
    + gameState.figures.length +"/" + gameState.startCount, 
    canvas.width/20, canvas.height*9/10)
}

function setup() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    gameState.lastTick = performance.now();
    gameState.lastRender = gameState.lastTick;
    gameState.tickLength = 15; //ms
    canvas.addEventListener('click', onRestart, false)

    gameState.isLose = false
    gameState.startCount = startCount
    generateFigures(gameState.startCount)
}

class Figure{
    constructor(type, x, y, size, vx, vy, draw)
    {
        this.type = type;
        this.x = x;
        this.y = y;
        this.size = size;
        this.vx = vx;
        this.vy = vy;
        this.color = Grey;
        this.draw = draw;
        this.state = 0;
        this.dx = x;
        this.dy = y;
    }
    draw(context) {
    }
}

function generateFigures(count)
{
    const figures = [];
    let variant = 0;
    let newFigure = null;
    let vx = 0, vy = 0, x = 0;
    let y = maxSizeOfObject;
    for(let i = 0; i < count; i++)
    {
        x += maxSizeOfObject;
        
        if(x > canvas.width - maxSizeOfObject)
        {
            x = maxSizeOfObject;
            y += maxSizeOfObject;
        }
        variant = Math.round(Math.random()*2 + 1);
        vx = (Math.random() < 0.5 ? -1 : 1) * Math.random() * 1;
        vy = (Math.random() < 0.5 ? -1 : 1) * Math.random() * 1;
        switch(variant)
        {
            case 1:
                newFigure = new Figure(Circle, x, y, circleSize, vx, vy, drawCircle);
                newFigure.left = -circleSize;
                newFigure.right = circleSize;
                newFigure.top = circleSize;
                newFigure.bottom = -circleSize;
                break;
            case 2:
                newFigure = new Figure(Triangle, x, y, triangleSize, vx, vy, drawPolygon);
                generatePoints(newFigure, 3, triangleSize, -Math.PI/2);
                break;
            case 3:
                newFigure = new Figure(Hexagon, x, y, hexagonSize, vx, vy, drawPolygon);
                generatePoints(newFigure, 6, hexagonSize);
                break;
        }
        figures.push(newFigure)
    }
    gameState.figures = figures;
}

function drawCircle(context) 
{
    context.beginPath();
    context.arc(this.x, this.y, this.size, 0, PI2);
    context.fillStyle = this.color;
    context.fill();
    context.closePath();
}

function drawPolygon(context) 
{
    context.beginPath();
    context.moveTo(this.x, this.y);
    this.points.forEach(p => {
        context.lineTo(this.x+p[0], this.y+p[1])
    })
    context.fillStyle = this.color;
    context.fill();
    context.closePath();
}

function generatePoints(figure, number, size, startAngle=0) 
{
    figure.points = [];
    figure.left = 0;
    figure.right = 0;
    figure.top = 0;
    figure.bottom = 0;
    for(let angle = startAngle; angle <= PI2+startAngle; angle+= PI2/number)
    {   
        let px = Math.cos(angle)*size;
        let py = Math.sin(angle)*size;
        if(figure.left > px)
            figure.left = px;
        else if (figure.right < px)
            figure.right = px

        if(figure.top < py)
            figure.top = py;
        else if (figure.bottom > py)
            figure.bottom = py
        figure.points.push([px, py])
    }
}

function onRestart(e)
{
    startGame()
}

function startGame()
{
    setup();
    run();
}

startGame()