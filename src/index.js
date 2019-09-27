const canvas = document.getElementById("cnvs");

const gameState = {};

const PI2 = Math.PI * 2;
const GREY = "#888888", YELLOW = "#FFFF00", RED = "#FF0000";
const CIRCLE = 'CIRCLE', TRIANGLE = 'TRIANGLE', HEXAGON = 'HEXAGON'

const sim_settings =
{
    circleSize: 5, 
    triangleSize: 5,
    hexagonSize: 5,
    gridSize : 50,
    circlesCount : 300,
    trianglesCount : 400,
    hexagonsCount : 300,
    triangleRotation: Math.PI/2,
    hexRotation : Math.PI/2
}

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

function isEdgesIntersect(ax, ay, bx, by, cx, cy, dx, dy)
{
    const r = ((ay-cy)*(dx-cx)-(ax-cx)*(dy-cy)) / ((bx-ax)*(dy-cy)-(by-ay)*(dx-cx))
    const s = ((ay-cy)*(bx-ax)-(ax-cx)*(by-ay)) / ((bx-ax)*(dy-cy)-(by-ay)*(dx-cx))
    return (r >= 0 && r <= 1 && s >= 0 && s <= 1)
}

function isCollision(fig1, fig2)
{
    x1 = fig1.x; y1 = fig1.y; p1 = fig1.points;
    x2 = fig2.x; y2 = fig2.y; p2 = fig2.points;

    for(let i = 0; i < p1.length-1; i++)
    {
        for(let j = 0; j < p2.length-1; j++)
        {
            if(isEdgesIntersect(p1[i].x+x1, p1[i].y+y1, p1[i+1].x+x1, p1[i+1].y+y1,
                p2[j].x+x2, p2[j].y+y2, p2[j+1].x+x2, p2[j+1].y+y2))
            return true;
        }
    }
    return false;
}

function update(tick) {
    if(gameState.figures.length === 0)
        stopGame(gameState.stopCycle)

    const figures = gameState.figures

    for(let i = 0; i < figures.length; i++)
        for(let j = i+1; j < figures.length; j++)
        {
            if( figures[i].size + figures[j].size >= 
                Math.sqrt(Math.pow(figures[i].x-figures[j].x, 2) +  Math.pow(figures[i].y-figures[j].y, 2) )
            && isCollision(figures[i], figures[j]))
            {
                [figures[i].vx, figures[j].vx] = [figures[j].vx, figures[i].vx];
                [figures[i].vy, figures[j].vy] = [figures[j].vy, figures[i].vy];
                figures[i].state++;
                figures[j].state++;
            }
        }

    gameState.figures.forEach(f => 
        {   // wall collision
            if(f.x+f.box.right >= canvas.width || f.x+f.box.left <= 0)
                f.vx *= -1;
            if(f.y+f.box.top >= canvas.height || f.y+f.box.bottom <= 0)
                f.vy *= -1;
            f.x += f.vx;
            f.y += f.vy;
        })
    changeColor();
    gameState.figures = gameState.figures.filter(f => f.state < 3);
}

function changeColor()
{
    gameState.figures.forEach(f => 
    {
        switch(f.state){
            case 1:
                f.color = YELLOW;
                break;
            case 2:
                f.color = RED;
                break;
        }
    });
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
    
    gameState.isLose = false
    gameState.startCount = sim_settings.circlesCount 
        + sim_settings.trianglesCount + sim_settings.hexagonsCount;
    generateFigures(gameState.startCount)

    gameState.lastTick = performance.now();
    gameState.lastRender = gameState.lastTick;
    gameState.tickLength = 15; //ms
    canvas.addEventListener('click', onRestart, false)

}

class Figure{
    constructor(type, x, y, size, vx, vy, draw, numEdges, angle = 0)
    {
        this.type = type;
        this.x = x;
        this.y = y;
        this.size = size;
        this.vx = vx;
        this.vy = vy;
        this.color = GREY;
        this.draw = draw;
        this.state = 0;
        this.angle = angle;
        generatePoints(this, numEdges, size, angle);
    }
    draw(context) {}
}

function generateFigures(count)
{
    const figures = [];
    let variant = 0;
    let newFigure = null;
    let vx = 0, vy = 0, x = 0, y = sim_settings.gridSize;

    let figCounts = [sim_settings.circlesCount, sim_settings.trianglesCount, sim_settings.hexagonsCount];

    for(let i = 0; i < count; i++)
    {
        x += sim_settings.gridSize;
        if(x > canvas.width - sim_settings.gridSize) // placing figures in the nodes of grid to avoid intersections
        {
            x = sim_settings.gridSize;
            y += sim_settings.gridSize;
        }
        do {
            variant = Math.round(Math.random()*2 + 1);
        }
        while(figCounts[variant-1] <= 0)
        figCounts[variant-1] -= 1;

        vx = (Math.random() < 0.5 ? -1 : 1) * Math.random() * 1;
        vy = (Math.random() < 0.5 ? -1 : 1) * Math.random() * 1;
        switch(variant)
        {
            case 1:
                newFigure = new Figure(CIRCLE, x, y, sim_settings.circleSize, vx, vy, drawCircle, 12);
                break;
            case 2:
                newFigure = new Figure(TRIANGLE, x, y, sim_settings.triangleSize, vx, vy, drawPolygon, 3, sim_settings.triangleRotation);
                break;
            case 3:
                newFigure = new Figure(HEXAGON, x, y, sim_settings.hexagonSize, vx, vy, drawPolygon, 6, sim_settings.hexRotation);
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
    context.moveTo(this.x+this.points[0].x, this.y+this.points[0].y);
    for(let i = 1; i < this.points.length-1; i++)
        context.lineTo(this.x+this.points[i].x, this.y+this.points[i].y)
    context.fillStyle = this.color;
    context.fill();
    context.closePath();
}

function generatePoints(figure, number, size, startAngle=0) 
{
    figure.points = [];
    figure.box = {left : 0, right: 0, top: 0, bottom: 0}
    for(let angle = startAngle; angle <= PI2+startAngle; angle+= PI2/number)
    {   
        let px = Math.cos(angle)*size;
        let py = Math.sin(angle)*size;
        if(figure.box.left > px)
            figure.box.left = px;
        else if (figure.box.right < px)
            figure.box.right = px

        if(figure.box.top < py)
            figure.box.top = py;
        else if (figure.box.bottom > py)
            figure.box.bottom = py
        figure.points.push({x:px, y:py})
    }
}

function onRestart(e){startGame()}

function startGame()
{
    setup();
    run();
}

startGame()