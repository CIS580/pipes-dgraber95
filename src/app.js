"use strict";

/* Classes */
const Game = require('./game');
const Pipe = require('./pipe.js');

/* Global variables */
var canvas = document.getElementById('screen');
var game = new Game(canvas, update, render);
var cur_pipe_image = new Image();
var background = new Image();
background.src = 'assets/pipes_background.jpg';
var currentPipe = Math.floor(Math.random()*6);
updatePipeImgSource();
var cursor_x = -80;
var cursor_y = -80;
var water_cell = [-1, -1];
var cells = new Array(10);
for (var i = 0; i < 10; i++) {
  cells[i] = new Array(10);
}


window.onmousedown = function(event) {
  var button = event.button;
  event.preventDefault();
  var x_cell = Math.floor((event.clientX - 8)/86);
  var y_cell = Math.floor((event.clientY - 79)/86);

  if(x_cell < 10 && x_cell >= 0 && y_cell < 10 && y_cell >= 0){  
    switch(button){
      // Left click
      case 0:
        if(!cells[x_cell][y_cell]){
          cells[x_cell][y_cell] = new Pipe(x_cell, y_cell, currentPipe);
          currentPipe = Math.floor(Math.random()*6);
          updatePipeImgSource();
        }
        break;

      // Right click
      case 2:
        if(cells[x_cell][y_cell]){
          cells[x_cell][y_cell].rotate();
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

canvas.onmousemove = function(event) {
  cursor_x = event.clientX - 8;
  cursor_y = event.clientY - 79;
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
 * @function update
 * Updates the game state, moving
 * game objects and handling interactions
 * between them.
 * @param {DOMHighResTimeStamp} elapsedTime indicates
 * the number of milliseconds passed since the last frame.
 */
function update(elapsedTime) {

  // TODO: Advance the fluid
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