// SETUP
let GRID_WIDTH;
const INTERVAL_LENGTH = 150;
let MAX_WALLS; // SET TO ZERO IF INF WALLS
const canvas = document.getElementById("game");
const timeObj = document.getElementById("time");
const ctx = canvas.getContext("2d");
const gameDiv = document.getElementById("game-container");
const homeDiv = document.getElementById("home");
const creditsDiv = document.getElementById("credits");
const settingsDiv = document.getElementById("settings");
const helpDiv = document.getElementById("help");
const wallLengthText = document.getElementById("wall-length-text");
const wallLengthSlider = document.getElementById("wall-length");
const gridSizeText = document.getElementById("grid-size-text");
const gridSizeSlider = document.getElementById("grid-size");


var player;
let time = 0.0;
let dead = false;
let started = false;
var interval;

// CONFIG COOKIES
if (getCookie("highscore") === undefined || getCookie("highscore") === ""){
    setCookie("highscore",0);
}
if (getCookie("walllength") == undefined || getCookie("walllength") === ""){
    setCookie("walllength",0);
    MAX_WALLS = 0;
}
else{
    MAX_WALLS = parseInt(getCookie("walllength"));
    wallLengthSlider.value = parseInt(getCookie("walllength"));
}
if (getCookie("gridsize") === undefined || getCookie("gridsize") === null || getCookie("gridsize") === "") {
    setCookie("gridsize", 2);
    GRID_WIDTH = 10;
} else {
    let cookieGridSize = getCookie("gridsize");
    if (parseInt(cookieGridSize) == 3){
        GRID_WIDTH = 20;
    }
    else if (parseInt(cookieGridSize) == 4){
        GRID_WIDTH = 25;
    }
    else{
        GRID_WIDTH = parseInt(cookieGridSize) * 5;
    }
    
    gridSizeSlider.value = parseInt(cookieGridSize);
}
wallLengthText.innerText = "Current: " + wallLengthSlider.value;
gridSizeText.innerText = "Current: " + gridSizeSlider.value;

// SET UP WALL LENGTH SETTING
wallLengthSlider.oninput = function() {
    wallLengthText.innerText = "Current: " + wallLengthSlider.value;
    MAX_WALLS = wallLengthSlider.value;
    setCookie("walllength",wallLengthSlider.value);
}
// SET UP GRID SIZE

gridSizeSlider.oninput = function() {
    gridSizeText.innerText = "Current: " + gridSizeSlider.value;
    GRID_WIDTH = 5 * gridSizeSlider.value;
    setCookie("gridsize",gridSizeSlider.value);
}
    

// INITIALLY TURN OFF GAME
gameDiv.style.display = 'none';

// Essential Functions 
function roundDecimal(number){
    return Math.round((number + Number.EPSILON) * 100) / 100
}
function constructGrid(){
    ctx.fillStyle = "black";
    ctx.fillRect(0,0,501,501);
    for (var i = 0; i <= 500; i+=GRID_WIDTH){
        ctx.fillStyle = "aqua";
        ctx.fillRect(i, 0, 1, 500);
        ctx.fillRect(0, i, 500, 1);
    }

}
function lightBike(color, speed, team, x, y, direction){
    // Sets actual size on canvas
    this.width = GRID_WIDTH;
    this.height = GRID_WIDTH;
    // Sets position, rounded to the nearest grid
    this.x = Math.round(x / GRID_WIDTH) * GRID_WIDTH;
    this.y = Math.round(y / GRID_WIDTH) * GRID_WIDTH;
    this.direction = direction;
    // Keep track of walls, and of whom
    this.currentWallLength = 0;
    this.walls = [];
    // Team + Speed
    this.speed = speed;
    this.team = team;
    this.color = color;
    // Functions
    this.load = function(){
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    this.updatePosition  = function(x, y){
        this.x = Math.round(x / GRID_WIDTH) * GRID_WIDTH;
        this.y = Math.round(y / GRID_WIDTH) * GRID_WIDTH;
    }
    this.updateDirection = function(direction){
        this.direction = direction;
    }
    this.update = function(){
        let normalizedDirection = ((this.direction % 360) + 360) % 360;
        this.walls.push([Math.round(this.x / GRID_WIDTH), Math.round(this.y / GRID_WIDTH)]);
        if (normalizedDirection == 0){
            this.y += GRID_WIDTH;
        }
        else if (normalizedDirection == 180){
            this.y -= GRID_WIDTH;
        }
        else if (normalizedDirection == 270){
            this.x += GRID_WIDTH;
        }
        else{
            this.x -= GRID_WIDTH;
        }
        // Keep positions aligned to the grid
        this.x = Math.round(this.x / GRID_WIDTH) * GRID_WIDTH;
        this.y = Math.round(this.y / GRID_WIDTH) * GRID_WIDTH;
    }
    this.checkCollision = function(wallsList){
        let currentPos = [Math.round(this.x / GRID_WIDTH), Math.round(this.y / GRID_WIDTH)];
        for (var i = 0; i < wallsList.length; i++){
            if (currentPos[0] == wallsList[i][0] && currentPos[1] == wallsList[i][1]){
                return true;
            }
        }
        if (this.x < 0 || this.x >= 500 || this.y >= 500 || this.y < 0){
            return true;
        }
        return false;
    }
}

function clearCanvas(){
    ctx.clearRect(0, 0, 501, 501);
}
function generateWalls(playerSelected){
    let walls = playerSelected.walls;
    for (let i = 0; i < walls.length; i++){
        ctx.fillStyle = playerSelected.color;
        ctx.fillRect(walls[i][0] * GRID_WIDTH, walls[i][1] * GRID_WIDTH, GRID_WIDTH, GRID_WIDTH);
    }
    if (MAX_WALLS > 0 && walls.length >= MAX_WALLS){
        playerSelected.walls.shift();
    }
}
function updateTime(){
    
    time += (INTERVAL_LENGTH / 1000.0);
    let timeText = roundDecimal(time)
    timeObj.innerText = "Time: " + timeText.toString() + "s";
}
function gameOver(teamColor, tied){
    ctx.font = "30px 'Press Start 2P'";
    ctx.fillStyle = "black";
    ctx.fillRect(50,100,400,200);

    ctx.fillStyle = "white";
    ctx.textAlign = "center";

    if (tied){
        ctx.fillText("TIE GAME!",250,150);
    }
    else{
        ctx.fillText(teamColor + " wins!",250,150);
    }
    ctx.font = "20px 'Press Start 2P'";
    ctx.fillText("Total time: " + roundDecimal(time).toString(), 250, 200);
    ctx.fillText("Record time: " + getCookie("highscore").toString(), 250,250);

    // Show buttons container
    document.getElementById('buttons-container').style.display = 'block';
}

document.getElementById('restart-button').addEventListener('click', function() {
    restart();
    document.getElementById('buttons-container').style.display = 'none';
});

document.getElementById('home-button').addEventListener('click', function() {
    goHome();
    document.getElementById('buttons-container').style.display = 'none';
});

function button(color, x, y, text){
    ctx.fillStyle = color;
    ctx.fillRect(x-50,y-25,100,50);
    ctx.font = "10px 'Press Start 2P'";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(text, x, y);
}
function restart(){
    dead = false;
    time = 0;
    clearInterval(interval);
    interval = setInterval(update, INTERVAL_LENGTH);
    player = new lightBike("yellow", 10, 0, 240, 0, 0);
    playerTwo = new lightBike("blue", 10, 1, 240, 490, 180);
    playerTwo.load();
    player.load();
}
function start(){
    started = true;
    homeDiv.style.display = "none";
    gameDiv.style.display = "block";
    creditsDiv.style.display = "none";
    settingsDiv.style.display = "none";
    restart();
}
function goHome(){
    homeDiv.style.display = "block";
    gameDiv.style.display = "none";
    creditsDiv.style.display = "none";
    settingsDiv.style.display = "none";
    helpDiv.style.display = "none";
    started = false;
}

function showCredits(){
    homeDiv.style.display = "none";
    gameDiv.style.display = "none";
    creditsDiv.style.display = "block";
    settingsDiv.style.display = "none";
    helpDiv.style.display = "none";
}
function openSettings(){
    homeDiv.style.display = "none";
    gameDiv.style.display = "none";
    creditsDiv.style.display = "none";
    settingsDiv.style.display = "block";
    helpDiv.style.display = "none";
}
function displayHelp(){
    homeDiv.style.display = "none";
    gameDiv.style.display = "none";
    creditsDiv.style.display = "none";
    settingsDiv.style.display = "none";
    helpDiv.style.display = "block";
}
function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
}
function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}


// ON LOAD

constructGrid();
player = new lightBike("yellow", 10, 0, 240, 0, 0);
playerTwo = new lightBike("blue", 10, 1, 240, 500, 180);
player.load();
playerTwo.load();

// UPDATER

document.addEventListener('keydown', event => {
    let normalizedDirection = ((player.direction % 360) + 360) % 360;
    let normalizedDirectionTwo = ((playerTwo.direction % 360) + 360) % 360;
    /*
    if (event.key === 'ArrowRight') {
        if (normalizedDirection == 0){
            player.updateDirection(player.direction - 90);
        }
        else{
            player.updateDirection(player.direction + 90);
        }
    }
    else if (event.key === 'ArrowLeft') {
        if (normalizedDirection == 0){
            player.updateDirection(player.direction + 90);
        }
        else{
            player.updateDirection(player.direction - 90);
        }
    }
    if (event.key === 'd') {
      
        if (normalizedDirection == 180){
            playerTwo.updateDirection(playerTwo.direction - 90);
        }
        else{
            playerTwo.updateDirection(playerTwo.direction + 90);
        }
    }
    else if (event.key === 'a') {
        if (normalizedDirection == 180){
            playerTwo.updateDirection(playerTwo.direction + 90);
        }
        else{
            playerTwo.updateDirection(playerTwo.direction - 90);
        }
    }
    */
    // Player One
    if (event.key === 'ArrowRight') {
        if (normalizedDirection != 90){
            player.updateDirection(270);
        }   
    }
    else if (event.key === 'ArrowLeft') {
        if (normalizedDirection != 270){
            player.updateDirection(90);
        }    
    }
    else if (event.key === 'ArrowDown'){
        if (normalizedDirection != 180){
            player.updateDirection(0);
        }   
    }
    else if (event.key === 'ArrowUp'){
        if (normalizedDirection != 0){
            player.updateDirection(180);
        }   
    }
    // Player Two
    if (event.key === 'd') {
        if (normalizedDirectionTwo != 90){
            playerTwo.updateDirection(270);
        }   
    }
    else if (event.key === 'a') {
        if (normalizedDirectionTwo != 270){
            playerTwo.updateDirection(90);
        }    
    }
    else if (event.key === 's'){
        if (normalizedDirectionTwo != 180){
            playerTwo.updateDirection(0);
        }   
    }
    else if (event.key === 'w'){
        if (normalizedDirectionTwo != 0){
            playerTwo.updateDirection(180);
        }   
    }


});
/*
canvas.addEventListener('click', (event) => {
    let x = event.pageX - 8;
    let y = event.pageY - 122;
    if (dead){
        
        if ((x >= 682 && x <= 782) && (y >= 326 && y <= 376)){
            restart();
        }
        if ((x >= 682 && x <= 782) && (y >= 396 && y <= 446)){
            goHome();
        }
    }
    //console.log(x +"," + y);
});
*/

interval = setInterval(update, INTERVAL_LENGTH);
function update(){
    if (started == true){
        clearCanvas();
        constructGrid();
        player.update();
        playerTwo.update();
        player.load();
        playerTwo.load();
        generateWalls(player);
        generateWalls(playerTwo);
        updateTime();
        if (
            (player.checkCollision(player.walls) && playerTwo.checkCollision(playerTwo.walls)) ||
            (player.checkCollision(playerTwo.walls) && playerTwo.checkCollision(playerTwo.walls)) ||
            (player.checkCollision(player.walls) && playerTwo.checkCollision(player.walls)) ||
            (player.checkCollision(playerTwo.walls) && playerTwo.checkCollision(player.walls))
        ){
            // TIE
            clearInterval(interval);
            //button("teal",250,350,"Restart");
            //button("orange",250,420,"Home");
            if (roundDecimal(time) > getCookie("highscore")){   
                setCookie("highscore",roundDecimal(time),9001);
            }
            gameOver("None", true);
            dead = true;
        }
        else if (player.checkCollision(player.walls) || player.checkCollision(playerTwo.walls)){
            clearInterval(interval); 
            //button("teal",250,350,"Restart");
            //button("orange",250,420,"Home");
            if (roundDecimal(time) > getCookie("highscore")){   
                setCookie("highscore",roundDecimal(time),9001);
            }
            gameOver("Blue", false);
            dead = true;
        }
        else if (playerTwo.checkCollision(player.walls) || playerTwo.checkCollision(playerTwo.walls)){
            clearInterval(interval); 
            //button("teal",250,350,"Restart");
            //button("orange",250,420,"Home");
            if (roundDecimal(time) > getCookie("highscore")){   
                setCookie("highscore",roundDecimal(time),9001);
            }
            gameOver("Yellow", false);
            dead = true;
        }
    }
}