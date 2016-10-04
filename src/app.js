"use strict";

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
var cells = new Array(10);
var pipes_used = 0;
var count = 300;
var level = 1;
var score = 0;

for (var i = 0; i < 10; i++) {
  cells[i] = new Array(10);
}
cells[startPipe.x_cell][startPipe.y_cell] = startPipe;
cells[endPipe.x_cell][endPipe.y_cell] = endPipe;


window.onmousedown = function(event) {
  var button = event.button;
  event.preventDefault();
  var x_cell = Math.floor((event.clientX - 8)/86);
  var y_cell = Math.floor((event.clientY - 79)/86);

  if(x_cell < 10 && x_cell >= 0 && y_cell < 10 && y_cell >= 0){  
    var thisPipe = cells[x_cell][y_cell];
    switch(button){
      // Left click
      case 0:
        if(!thisPipe){
          cells[x_cell][y_cell] = new Pipe(x_cell, y_cell, currentPipe);
          currentPipe = Math.floor(Math.random()*6);
          updatePipeImgSource();
        }
        break;

      // Right click
      case 2:
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
        break;
    }
  }
  
  // TODO: Place or rotate pipe tile
}

window.onmousemove = function(event) {
  cursor_x = event.clientX - 8;
  cursor_y = event.clientY - 79;
}



window.onkeydown = function(event) {
  switch(event.keyCode) {
    case 32:
      count = 10;
      break;
  }
}

window.onkeyup = function(event) {
  switch(event.keyCode) {
    case 32:
      count = 300;
      break;
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
direction = startPipe.beginFlow();
updateNextCell()
masterLoop(performance.now());


/**
 * @function update
 * Updates the game state, moving
 * game objects and handling interactions
 * between them.
 * @param {DOMHighResTimeStamp} elapsedTime indicates
 * the number of milliseconds passed since the last frame.
 */
function update(elapsedTime) {
    var oppDirection;
    switch(direction){
      case 0:
      case 1:
        oppDirection = direction + 2;
        break;
      case 2:
      case 3:
        oppDirection = direction - 2;
        break;
    }

  finish:
  if(water_cell.waterlevel == 10)
  {
    water_cell = cells[next_cell[0]][next_cell[1]];

    // Game over
    if(!water_cell || !water_cell.entries[oppDirection]){
      game.pause(true);
      break finish;
    }

    pipes_used += 1;

    // New game
    if(water_cell.endpipe){
      new_level();
      break finish;
    }

    direction = water_cell.beginFlow(oppDirection);    
    updateNextCell();
  }

  for(var i = 0; i < 10; i ++)
  {
    for(var j = 0; j < 10; j++)
    {
      if(cells[i][j]){
        cells[i][j].update(elapsedTime, count);
      }
    }
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
  ctx.drawImage(background, 0, 0, 860, 860, 0, 0, canvas.width, canvas.height);



  for(var i = 0; i < 10; i ++)
  {
    for(var j = 0; j < 10; j++)
    {
      if(cells[i][j]){
        cells[i][j].render(ctx);
      }
    }
  }


  ctx.globalAlpha = 0.4;
  ctx.drawImage(
    //image
    cur_pipe_image,
    //source rectangle
    0, 0, 128, 128,
    //destination rectangle
    cursor_x - 52, cursor_y - 41, 86, 86
  );
  ctx.globalAlpha = 1.0;
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
  level += 1;
  score += 10 * pipes_used;
  pipes_used = 0;

  startPipe = new StartPipe();
  endPipe = new EndPipe(startPipe.x_cell, startPipe.y_cell);
  cells = new Array(10);
  for (var i = 0; i < 10; i++) {
    cells[i] = new Array(10);
  }
  cells[startPipe.x_cell][startPipe.y_cell] = startPipe;
  cells[endPipe.x_cell][endPipe.y_cell] = endPipe; 

  currentPipe = Math.floor(Math.random()*6);
  updatePipeImgSource();

  water_cell = startPipe;
  direction = startPipe.beginFlow();
  updateNextCell()
}