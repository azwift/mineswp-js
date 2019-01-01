/*Ali Bitar
minesweeper implemented in js
September 2017
*/

"use strict";

(function(){
    window.addEventListener("load", init);

    const config = {
        minesLeft: null,
        token: null,
        trackMines : {},
        numberedTiles : {},
        trackFlags : {},
        firstClick : null,
        timeValue: null,
        elements: {}
    }

    function init(){
        config.elements.smileyBtn = document.querySelector("#smiley");
        config.elements.difficultyBtn = document.querySelector("#difficulty");
        config.elements.grid = document.querySelector("#minefield");
        config.elements.timer = document.querySelector("#timer");
        config.elements.flagCountBtn = document.querySelector("#flagCount");
        if(!config.elements.smileyBtn || !config.elements.difficultyBtn || !config.elements.grid 
            || !config.elements.timer || !config.elements.flagCountBtn){
            console.error("DOM not rendered correctly");
            return null;
        }

        config.elements.smileyBtn.addEventListener("click", startGame);
        config.elements.smileyBtn.addEventListener("mouseup", smileyUp);
        config.elements.smileyBtn.addEventListener("mousedown", smileyDown);

        config.elements.difficultyBtn.addEventListener("change", setDifficulty);

        document.body.addEventListener("mouseup", smileyUp);
    }

    function startGame() {
        window.clearInterval(config.token);
        resetGlobalVariables();
        buildGrid();
        startTimer();
    }

    function smileyDown() {
        clearWinLoseSmiley();
        config.elements.smileyBtn.classList.add("face_down");
    }

    function smileyUp() {
        config.elements.smileyBtn.classList.remove("face_limbo");
        config.elements.smileyBtn.classList.remove("face_down");
    }

    function clearWinLoseSmiley(){
        config.elements.smileyBtn.classList.remove("face_lose");
        config.elements.smileyBtn.classList.remove("face_win");

    }

    function smileyLimbo(){
        config.elements.smileyBtn.classList.add("face_limbo");
    }

    function smileyLose(){
        config.elements.smileyBtn.classList.add("face_lose");
    }

    function smileyWin() {
        config.elements.smileyBtn.classList.add("face_win");
    }

    function handleMouseDown(e){
        if(e.button === 0 || e.button === 1){
            smileyLimbo();
        }
    }
    function createTile(x,y) {
        const tile = document.createElement("div");

        tile.setAttribute("data-x", x) ;
        tile.setAttribute("data-y", y) ;
        tile.classList.add("tile");
        tile.classList.add("hidden");
        
        tile.addEventListener("mousedown",handleMouseDown);
        tile.addEventListener("auxclick", function(e) { e.preventDefault(); }); // Middle Click
        tile.addEventListener("contextmenu", function(e) { e.preventDefault(); }); // Right Click
        tile.addEventListener("mouseup", handleTileClick ); // All Clicks

        return tile;
    }

    function buildGrid() {

        // Fetch grid and clear out old elements.
        const grid = config.elements.grid;
        grid.innerHTML = "";

        const columns = grid.getAttribute("gridX");
        const rows = grid.getAttribute("gridY");
        const mines = grid.getAttribute("mines");
        config.minesLeft = mines;
        updateMinesLeft();

        //randomise mine locations
        for(var i = 0; i < mines; i++){
            let random = parseInt(Math.random() * rows * columns); 
            while(random in config.trackMines){
                random = parseInt(Math.random() * rows * columns); 
            }
            config.trackMines[random] = true;
        }

        // Build DOM Grid
        let tile;
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < columns; x++) {
                tile = createTile(x,y);
                grid.appendChild(tile);

                //if tile is numbered (exclude mines)
                const pos = y * columns + x;
                if(!(pos in config.trackMines)){
                    let adjacentMines = getAdjacentProperty(x,y,columns,rows,"mine");
                    let index = y * columns + x;
                    if(adjacentMines != 0 ){
                        config.numberedTiles[pos] = adjacentMines;
                    }
                }
                
            }
        }
        const style = window.getComputedStyle(tile);
        const width = parseInt(style.width.slice(0, -2));
        const height = parseInt(style.height.slice(0, -2));
        grid.style.width = (columns * width) + "px";
        grid.style.height = (rows * height) + "px";
    }

    function handleTileClick(event) {
        smileyUp();
        const grid = config.elements.grid;
        const columns = grid.getAttribute("gridX");
        const rows = grid.getAttribute("gridY");
        const y = parseInt(event.target.getAttribute("data-y"));
        const x = parseInt(event.target.getAttribute("data-x"));
        const pos = y * columns + x;

        // Left Click
        if (event.which === 1) {
            if(!event.target.classList.contains("flag") && event.target.classList.contains("hidden")){
                if(pos in config.trackMines){
                    if(config.firstClick){
                        randomizeMines();
                        handleTileClick(event);
                        return;
                    }
                    smileyLose();
                    event.target.classList.add("mine_hit");
                    window.clearInterval(config.token);

                    for(var i in config.trackMines){
                        grid.children[i].classList.add("mine");
                    }
                    for(var i = 0; i < grid.children.length; i++){
                        grid.children[i].removeEventListener("mouseup",handleTileClick);
                        grid.children[i].removeEventListener("mousedown",handleMouseDown);
                    }
                    window.setTimeout(() => {
                        alert("You stepped on a mine :(");
                    },200); 

                    return;
                }
                else if(pos in config.numberedTiles){
                    if(config.firstClick){
                        randomizeMines();
                        handleTileClick(event);
                        return;
                    }
                    event.target.classList.add("tile_"+config.numberedTiles[pos]);
                }
                else {
                    config.firstClick = false;
                    recurseOnAdjacentTiles(x,y,columns,rows);
                }
            }
        }

        // Middle Click
        else if (event.which === 2) {
            //TODO try to reveal adjacent tiles
            if(pos in config.numberedTiles ){
                var flags = getAdjacentProperty(x,y,columns,rows,"flag");
                if(flags === config.numberedTiles[pos] && event.target.classList.contains("tile_"+config.numberedTiles[pos])){
                    revealAdjacentTiles(x,y,columns,rows);
                }
            }
        }

        // Right Click
        else if (event.which === 3) {
            //return if empty or numbered and revealed
            if(!event.target.classList.contains("hidden") || 
                (pos in config.numberedTiles && event.target.classList.contains("tile_"+config.numberedTiles[pos]))){

                return;
            }
            if(event.target.classList.contains("flag")){
                event.target.classList.remove("flag");
                config.minesLeft += 1;
                updateMinesLeft();
                delete config.trackFlags[pos];
            }
            else{
                event.target.classList.add("flag");
                config.minesLeft -= 1;
                updateMinesLeft();
                config.trackFlags[pos] = true;
            }
        }

        checkIfWon();
    }

    function recurseOnAdjacentTiles(x,y,columns,rows){
        if(x < 0 || y < 0 || x >= columns || y >= rows){
            return;
        }
        const pos = y * columns + x;
        const grid = config.elements.grid;

        //recursion will only occur on "empty" tiles
        if(pos in config.trackMines || grid.children[pos].classList.contains("flag")
         || !grid.children[pos].classList.contains("hidden")){
            return;
        }
        else if(pos in config.numberedTiles){
            grid.children[pos].classList.add("tile_" + config.numberedTiles[pos]);
            return;
        }
        else{
            grid.children[pos].classList.remove("hidden");
            recurseOnAdjacentTiles(x-1,y-1,columns,rows);
            recurseOnAdjacentTiles(x,y-1,columns,rows);
            recurseOnAdjacentTiles(x+1,y-1,columns,rows);
            recurseOnAdjacentTiles(x-1,y,columns,rows);
            recurseOnAdjacentTiles(x+1,y,columns,rows);
            recurseOnAdjacentTiles(x-1,y+1,columns,rows);
            recurseOnAdjacentTiles(x,y+1,columns,rows);
            recurseOnAdjacentTiles(x+1,y+1,columns,rows);
        }
    }

    //reveals adjacent tiles recursively
    function revealAdjacentTiles(x,y,columns,rows){
        const grid = config.elements.grid;
        const adjPos = returnAdjPos(x,y,columns,rows);

        for(let i = 0; i < adjPos.length; i++){
            //if a mine or a number, simulate a click, ignore flagged
            if(adjPos[i] in config.trackMines && !(adjPos[i] in config.trackFlags)) {
                grid.children[adjPos[i]].dispatchEvent(new MouseEvent("mouseup"));
                break;
            }
            else if(adjPos[i] in config.numberedTiles && !(adjPos[i] in config.trackFlags)){
                grid.children[adjPos[i]].dispatchEvent(new MouseEvent("mouseup"));
            }
            else if(adjPos[i] >= 0 && grid.children[adjPos[i]].classList.contains("hidden")){
                recurseOnAdjacentTiles(x,y,columns,rows);
            }
        }
    }

    //returns number of adjacent 'mine' or 'flag'
    function getAdjacentProperty(x,y,columns,rows,propertyName){
        let adjacentproperty = 0;
        const adjPos = returnAdjPos(x,y,columns,rows);

        if(propertyName === "flag"){
            for(var i = 0; i < adjPos.length; i++){
                if(adjPos[i] in config.trackFlags){
                    adjacentproperty++;
                }
            }
        }
        else if(propertyName === "mine"){
            for(var i = 0; i < adjPos.length; i++){
                if(adjPos[i] in config.trackMines){
                    adjacentproperty++;
                }
            }
        }
        return adjacentproperty;
    }

    function returnAdjPos(x,y,columns,rows){
        const xMinus = x - 1;
        const xPlus = x + 1;
        const yMinus = y - 1;
        const yPlus = y + 1;
        const adjPos = 
        [yMinus * columns + xMinus, yMinus * columns + x, yMinus * columns + xPlus,
        y * columns + xMinus, y * columns + xPlus,
        yPlus * columns + xMinus, yPlus * columns + x, yPlus * columns + xPlus];

        if(xMinus < 0){
            adjPos[0] = -1;
            adjPos[3] = -1;
            adjPos[5] = -1;
        }
        if(yMinus < 0){
            adjPos[0] = -1;
            adjPos[1] = -1;
            adjPos[2] = -1;
        }
        if(xPlus >= columns){
            adjPos[2] = -1;
            adjPos[4] = -1;
            adjPos[7] = -1;
        }
        if(yPlus >= rows){
            adjPos[5] = -1;
            adjPos[5] = -1;
            adjPos[7] = -1;
        }
        return adjPos;
    }

    function randomizeMines(){
        config.trackMines = {};
        config.numberedTiles = {};
        const grid = config.elements.grid;
        const columns = grid.getAttribute("gridX");
        const rows = grid.getAttribute("gridY");
        const mines = grid.getAttribute("mines");

        for(let i = 0; i < mines; i++){
            let random = parseInt(Math.random() * rows * columns); 
            while(random in config.trackMines){
                random = parseInt(Math.random() * rows * columns); 
            }
            config.trackMines[random] = true;
        }

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < columns; x++) {
                //if tile is numbered (exclude mines)
                const pos = y * columns + x;
                if(!(pos in config.trackMines)){
                    const adjacentMines = getAdjacentProperty(x,y,columns,rows,"mine");
                    const index = y * columns + x;
                    if(adjacentMines != 0 ){
                        config.numberedTiles[pos] = adjacentMines;
                    }
                }
            }
        }
    }

    function checkIfWon(){
        const grid = config.elements.grid;
        let countNumberedTiles = 0;
        const numOfNumberedTiles = Object.keys(config.numberedTiles).length;
        for(let pos in  config.numberedTiles){
            if (grid.children[pos].classList.contains("tile_" + config.numberedTiles[pos])){
                countNumberedTiles++;
            }
        }
        if(countNumberedTiles !== numOfNumberedTiles){
           return;
        }
        //check if the rest of the tiles are cleared
        for(let i = 0; i < grid.children.length; i++){
            if(!(i in numberedTiles) && !(i in config.trackMines) && grid.children[i].classList.contains("hidden")){
                return;
            }
        }

        window.clearInterval(config.token);
        smileyWin();
        for(let i = 0; i < grid.children.length; i++){
            grid.children[i].removeEventListener("mouseup",handleTileClick);
            grid.children[i].removeEventListener("mousedown",handleMouseDown);
        }
        window.setTimeout(() => {
            alert("You won! Score : "+ config.timeValue);
        },200); 
    }

    function setDifficulty() {
        const difficultySelector = config.elements.difficultyBtn;
        const difficulty = difficultySelector.selectedIndex;
        //Easy
        if(difficulty === 0){
            setGridSize(10,10,10);
        }
        //Medium
        else if (difficulty === 1){
            setGridSize(16,16,40);
        }
        //Hard
        else if (difficulty === 2){
            setGridSize(30,16,99);
        }
    }

    function startTimer() {
        config.timeValue = 0;
        config.token = window.setInterval(onTimerTick, 1000);
    }

    function onTimerTick() {
        config.timeValue++;
        updateTimer();
    }

    function updateTimer() {
        config.elements.timer.innerHTML = config.timeValue;
    }

    function updateMinesLeft(){
        config.elements.flagCountBtn.innerHTML = config.minesLeft;
    }

    function setGridSize(col,row,mines){
        const grid = config.elements.grid;
        grid.setAttribute("gridY",row);
        grid.setAttribute("gridX",col);
        grid.setAttribute("mines",mines);
    }

    function resetGlobalVariables(){
        config.elements.timer.innerHTML = 0;
        config.trackMines = {};
        config.numberedTiles = {};
        config.trackFlags = {};
        config.firstClick = true;
    }

})();

