"use strict";

const COUNTDOWN = 2400;
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 10;
const CELL_SIZE = 86;
const SPEEDUP_COUNT = 10;


/* Classes */
const Game = require('./game');
const Pipe = require('./pipe.js');
const StartPipe = require('./start_pipe.js');
const EndPipe = require('./end_pipe.js');

/* Global variables */
var canvas = document.getElementById('screen');
var game = new Game(canvas, update, render);
var startPipe = new StartPipe();  // Pipe where water starts
var endPipe = new EndPipe(startPipe.x_cell, startPipe.y_cell);  // Destination pipe
var cur_pipe_image = new Image(); // Image of next pipe to be placed
var background = new Image();     // Background image
background.src = 'assets/pipes_background.jpg'; // Background image source
var currentPipe = Math.floor(Math.random()*6);  // Next pipe to be placed
updatePipeImgSource();      // Update the image source of the next pipe to be placed
var cursor_x = -80;         // Mouse x location in canvas
var cursor_y = -80;         // Mouse x location in canvas
var water_cell = startPipe; // Set reference of cell with water flow to the starting pipe
var direction = -1;         // Direction water is flowing (0, 1, 2, 3 = down, right, up, left)
var next_cell = [-1, -1];   // Cell the water is flowing towards
var pipes_used = 0;         // Pipes used in the path of the water (used to find score)
var count = 300;            // Milliseconds between water flow increments
var speedup = false;        // Set to true when spacebar is held down, speeds up water flow drastically
var level = 1;              // Level counter
var score = 0;              // Score counter
var state = 'ready';        // State of the game (initally ready)
var countDown = COUNTDOWN;  // Countdown for ready screen
var p_key = false;          // Used for pausing/unpausing

/*  Sounds  */
var gameoverSound = new Audio('sounds/gameover.wav');
gameoverSound.volume = 0.5;
var backgroundSound = new Audio('sounds/we_can_do_it.mp3');
backgroundSound.volume = 0.5;
backgroundSound.addEventListener('ended', function() {
    this.currentTime = 0;
    this.play();
}, false);
var newgameSound = new Audio('sounds/newgame.wav');
newgameSound.volume = 0.5;

/* Create board and add stationary pipes */
var cells = new Array(BOARD_HEIGHT);
for (var i = 0; i < BOARD_HEIGHT; i++) {
  cells[i] = new Array(BOARD_WIDTH);
}
cells[startPipe.x_cell][startPipe.y_cell] = startPipe;
cells[endPipe.x_cell][endPipe.y_cell] = endPipe;

/**
 * Mouse click event. Handles left and right click events
 * within the canvas
 */
window.onmousedown = function(event) {
  var button = event.button;
  event.preventDefault();

  getMousePos(event);
  // x and y of cursor are offset by 8 and 79 respectively for some reason
  var x_cell = Math.floor(cursor_x/CELL_SIZE);
  var y_cell = Math.floor(cursor_y/CELL_SIZE);

  if(x_cell < BOARD_WIDTH && x_cell >= 0 && y_cell < BOARD_HEIGHT && y_cell >= 0){  
    var thisPipe = cells[x_cell][y_cell];
    switch(button){
      // Left click
      case 0:
        if(state == 'running' && !thisPipe){
          cells[x_cell][y_cell] = new Pipe(x_cell, y_cell, currentPipe);
          currentPipe = Math.floor(Math.random()*6);
          updatePipeImgSource();
        }
        break;

      // Right click
      case 2:
        if(state == 'running' || state == 'ready'){
          // Rotate already placed pipe
          if(thisPipe && thisPipe.rotatable){
            thisPipe.rotate();
          }
          // Rotate next pipe to be placed
          else{
            if(currentPipe == 3){
              currentPipe = 0;
            }
            else if(currentPipe == 5) { 
              currentPipe = 4;
            }
            else {
              currentPipe ++;
            }
            cur_pipe_image.src = 'assets/pipes/pipe_' + currentPipe + '/pipe_' + currentPipe + '.png';
          }
        }
        break;
    }
  }
}


/** 
 * Updates cursor position whenever mouse moves
 */
window.onmousemove = function(event) {
  getMousePos(event);
}


/**
 * Handles key press down events 
 * p = pause/unpause
 * space = speed up water
 */
window.onkeydown = function(event) {
  switch(event.keyCode) {
    // Hold space to speed up
    case 32:
      event.preventDefault();
      speedup = true;
      break;

    // P to pause
    case 80:
      event.preventDefault();
      if(!p_key){
        p_key = true;
        if(state == 'paused'){
          state = 'running';
          backgroundSound.play();
        }
        else if(state == 'running'){
          state = 'paused';
          backgroundSound.pause();          
        }
      }
      break;
  }
}


/**
 * Handles key up events 
 * space = slow down liquid
 */
window.onkeyup = function(event) {
  switch(event.keyCode) {
    // Space
    case 32:
      event.preventDefault();
      speedup = false;
      break;

    // P
    case 80:
      event.preventDefault();
      p_key = false;
      break;      
  }
}


/**
 * Pause game if window loses focus
 */
window.onblur = function(){
  if(state == 'running' || state == 'ready'){
    state = 'paused';
    backgroundSound.pause();
  }
}

/**
 * @function masterLoop
 * Advances the game in sync with the refresh rate of the screen
 * @param {DOMHighResTimeStamp} timestamp the current time
 */
var masterLoop = function(timestamp) {
  game.loop(timestamp);
  window.requestAnimationFrame(masterLoop);
}
masterLoop(performance.now());


/**
 * @function getMousePos
 * Gets mouse position relative to the top left corner of the canvas
 */
function getMousePos(event) {
  var rect = canvas.getBoundingClientRect();
  // x and y of cursor are offset by 8 and 79 respectively for some reason  
  cursor_x = event.clientX - rect.left;
  cursor_y = event.clientY - rect.top;  
}


/**
 * @function update
 * Updates the game state, moving
 * game objects and handling interactions
 * between them.
 * @param {DOMHighResTimeStamp} elapsedTime indicates
 * the number of milliseconds passed since the last frame.
 */
function update(elapsedTime) {
  switch(state) {
    case 'ready': 
      countDown -= elapsedTime;
      if(countDown <= 0){
        countDown = COUNTDOWN;
        direction = startPipe.beginFlow();
        updateNextCell();
        state = 'running';
        backgroundSound.play();
      }
      break;

    case 'running':
      // Direction points to where water is going, we
      // need to determine where water is coming from
      var oppDirection;
      switch(direction){
        case 0: // down
        case 1: // right
          oppDirection = direction + 2;
          break;
        case 2: // up
        case 3: // left
          oppDirection = direction - 2;
          break;
      }

      if(water_cell.waterlevel == 10)
      {
        // Get the next cell water is going in to
        water_cell = cells[next_cell[0]][next_cell[1]];

        // Game over if there is no pipe, or if the pipe has no entry
        // facing the current direction
        if(!water_cell || !water_cell.entries[oppDirection]){
          backgroundSound.pause();
          gameoverSound.play();
          state = 'gameover';
          return;
        }

        // New level
        if(water_cell.endpipe){
          new_level();
          return;
        }

        // Increment number of pipes used
        pipes_used += 1;

        // Start water flow and get new direction
        direction = water_cell.beginFlow(oppDirection);    
        updateNextCell();
      }

      // Update all pipes
      for(var i = 0; i < BOARD_WIDTH; i ++)
      {
        for(var j = 0; j < BOARD_HEIGHT; j++)
        {
          if(cells[i][j]){
            if(speedup) cells[i][j].update(elapsedTime, 0);
            else cells[i][j].update(elapsedTime, count);
          }
        }
      }
      break;
    
    // Update nothing if gameover or paused
    case 'gameover':
    case 'paused':
      break;
  }
}

/**
  * @function render
  * Renders the current game state into a back buffer.
  * @param {DOMHighResTimeStamp} elapsedTime indicates
  * the number of milliseconds passed since the last frame.
  * @param {CanvasRenderingContext2D} ctx the context to render to
  */
function render(elapsedTime, ctx) {
  // Render background
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);

  // Render pipes
  for(var i = 0; i < BOARD_WIDTH; i ++)
  {
    for(var j = 0; j < BOARD_HEIGHT; j++)
    {
      if(cells[i][j]){
        cells[i][j].render(ctx);
      }
    }
  }

  if(state != 'gameover'){
    // Render transparent pipe that follows the cursor
    ctx.globalAlpha = 0.4;
    ctx.drawImage(
      //image
      cur_pipe_image,
      //source rectangle
      0, 0, 128, 128,
      //destination rectangle
      cursor_x - 52, cursor_y - 41, CELL_SIZE, CELL_SIZE
    );

    // Render score
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.font = "40px Lucida Console";
    ctx.fillText("Score: " + score, canvas.width - 150, canvas.height - 40);      
    ctx.strokeText("Score: " + score, canvas.width - 150, canvas.height - 40);  
  }

  // Game over screen
  if(state == 'gameover'){
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
    ctx.font = "60px Lucida Console";
		ctx.fillStyle = "red";
    ctx.strokeStyle = 'black';
		ctx.textAlign = "center";
		ctx.fillText("GAME OVER", canvas.width/2, canvas.height/2); 
		ctx.strokeText("GAME OVER", canvas.width/2, canvas.height/2); 
		ctx.font = "35px Lucida Console";
		ctx.fillStyle = "black";
		ctx.fillText("Final Score: " + score, canvas.width/2, canvas.height/2 + 35);
  }

  // Pause screen
  else if(state == 'paused'){
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
    ctx.font = "50px Lucida Console";
		ctx.fillStyle = "black";
		ctx.textAlign = "center";
		ctx.fillText("PAUSED", canvas.width/2, canvas.height/2); 
  }

  // Ready screen (level + countdown)
  else if(state == 'ready'){
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
    ctx.font = "75px Lucida Console";
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
		ctx.textAlign = "center";
		ctx.fillText(Math.ceil(countDown/(COUNTDOWN/3)),  canvas.width/2, canvas.height/2); 
		ctx.strokeText(Math.ceil(countDown/(COUNTDOWN/3)),  canvas.width/2, canvas.height/2); 
		ctx.font = "40px Lucida Console";
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
		ctx.fillText("Level: " + level, canvas.width/2, canvas.height/2 + 60);
		ctx.strokeText("Level: " + level, canvas.width/2, canvas.height/2 + 60);
  }  
}

/**
 * @function updatePipeImgSource
 * Updates the image source of the current (unplaced) pipe
 */
function updatePipeImgSource(){
  cur_pipe_image.src = 'assets/pipes/pipe_' + currentPipe + '/pipe_' + currentPipe + '.png';
}


/**
 * @function updateNextCell
 * Determines the next cell for water to flow into, depending on the current
 * water flow direction
 */
function updateNextCell(){
  switch(direction){
    // Down
    case 0:
      next_cell = [water_cell.x_cell, water_cell.y_cell + 1];
      break;
    // Right
    case 1:
      next_cell = [water_cell.x_cell + 1, water_cell.y_cell];
      break;
    // Up
    case 2:
      next_cell = [water_cell.x_cell, water_cell.y_cell - 1];
      break;
    // Left
    case 3:
      next_cell = [water_cell.x_cell - 1, water_cell.y_cell];
      break;
  }
}


/**
 * @function new_level
 * Resets board with new start and end pipe and adds to score
 */
function new_level(){
  // Play sound, set state, increment level, speed up flow, and update score
  newgameSound.play();
  state = 'ready';
  level += 1;
  count -= 30;
  score += 10 * pipes_used;
  pipes_used = 0;

  // Reset board
  startPipe = new StartPipe();
  endPipe = new EndPipe(startPipe.x_cell, startPipe.y_cell);
  cells = new Array(BOARD_WIDTH);
  for (var i = 0; i < BOARD_WIDTH; i++) {
    cells[i] = new Array(BOARD_HEIGHT);
  }
  cells[startPipe.x_cell][startPipe.y_cell] = startPipe;
  cells[endPipe.x_cell][endPipe.y_cell] = endPipe; 

  // Get new current pipe
  currentPipe = Math.floor(Math.random()*6);
  updatePipeImgSource();

  // Start water flow
  water_cell = startPipe;
  direction = startPipe.beginFlow();
  updateNextCell()
}