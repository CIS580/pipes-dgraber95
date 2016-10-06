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
var startPipe = new StartPipe();
var endPipe = new EndPipe(startPipe.x_cell, startPipe.y_cell);
var cur_pipe_image = new Image();
var background = new Image();
background.src = 'assets/pipes_background.jpg';
var currentPipe = Math.floor(Math.random()*6);
updatePipeImgSource();
var cursor_x = -80;
var cursor_y = -80;
var water_cell = startPipe;
var direction = -1;
var next_cell = [-1, -1];
var cells = new Array(BOARD_HEIGHT);
var pipes_used = 0;
var count = 300;
var speedup = false;
var level = 1;
var score = 0;
var state = 'ready';
var countDown = COUNTDOWN;
var p_key = false;

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
          if(thisPipe && thisPipe.rotatable){
            thisPipe.rotate();
          }
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
 * space = speed up liquid
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
        if(state == 'paused') state = 'running';
        else if(state == 'running') state = 'paused';
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
  if(state == 'running' || state == 'ready')
  state = 'paused';
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
 * @function masterLoop
 * Advances the game in sync with the refresh rate of the screen
 * @param {DOMHighResTimeStamp} timestamp the current time
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

      exit: // break out if game over or new level
      if(water_cell.waterlevel == 10)
      {

        // Get the next cell water is going in to
        water_cell = cells[next_cell[0]][next_cell[1]];

        // Game over if there is no pipe, or if the pipe has no entry
        // facing the current direction
        if(!water_cell || !water_cell.entries[oppDirection]){
          state = 'gameover';
          break exit;
        }

        // New level
        if(water_cell.endpipe){
          new_level();
          break exit;
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

  if(state == 'running' || state == 'ready'){
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
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.font = "40px Lucida Console";
    ctx.fillText("Score: " + score, canvas.width - 150, canvas.height - 40);      
    ctx.strokeText("Score: " + score, canvas.width - 150, canvas.height - 40);  
  }
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
  else if(state == 'paused'){
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
    ctx.font = "50px Lucida Console";
		ctx.fillStyle = "black";
		ctx.textAlign = "center";
		ctx.fillText("PAUSED", canvas.width/2, canvas.height/2); 
		ctx.font = "25px Lucida Console";
		ctx.fillStyle = "black";
		ctx.fillText("Score: " + score, canvas.width/2, canvas.height/2 + 30);
  }
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

function updatePipeImgSource(){
  cur_pipe_image.src = 'assets/pipes/pipe_' + currentPipe + '/pipe_' + currentPipe + '.png';
}


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


function new_level(){
  state = 'ready';
  level += 1;
  count -= 30;
  score += 10 * pipes_used;
  pipes_used = 0;

  startPipe = new StartPipe();
  endPipe = new EndPipe(startPipe.x_cell, startPipe.y_cell);
  cells = new Array(BOARD_WIDTH);
  for (var i = 0; i < BOARD_WIDTH; i++) {
    cells[i] = new Array(BOARD_HEIGHT);
  }
  cells[startPipe.x_cell][startPipe.y_cell] = startPipe;
  cells[endPipe.x_cell][endPipe.y_cell] = endPipe; 

  currentPipe = Math.floor(Math.random()*6);
  updatePipeImgSource();

  water_cell = startPipe;
  direction = startPipe.beginFlow();
  updateNextCell()
}