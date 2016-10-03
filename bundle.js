(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{"./game":2,"./pipe.js":3}],2:[function(require,module,exports){
"use strict";

/**
 * @module exports the Game class
 */
module.exports = exports = Game;

/**
 * @constructor Game
 * Creates a new game object
 * @param {canvasDOMElement} screen canvas object to draw into
 * @param {function} updateFunction function to update the game
 * @param {function} renderFunction function to render the game
 */
function Game(screen, updateFunction, renderFunction) {
  this.update = updateFunction;
  this.render = renderFunction;

  // Set up buffers
  this.frontBuffer = screen;
  this.frontCtx = screen.getContext('2d');
  this.backBuffer = document.createElement('canvas');
  this.backBuffer.width = screen.width;
  this.backBuffer.height = screen.height;
  this.backCtx = this.backBuffer.getContext('2d');

  // Start the game loop
  this.oldTime = performance.now();
  this.paused = false;
}

/**
 * @function pause
 * Pause or unpause the game
 * @param {bool} pause true to pause, false to start
 */
Game.prototype.pause = function(flag) {
  this.paused = (flag == true);
}

/**
 * @function loop
 * The main game loop.
 * @param{time} the current time as a DOMHighResTimeStamp
 */
Game.prototype.loop = function(newTime) {
  var game = this;
  var elapsedTime = newTime - this.oldTime;
  this.oldTime = newTime;

  if(!this.paused) this.update(elapsedTime);
  this.render(elapsedTime, this.frontCtx);

  // Flip the back buffer
  this.frontCtx.drawImage(this.backBuffer, 0, 0);
}

},{}],3:[function(require,module,exports){
/**
 * @module exports the pipe class
 */
module.exports = exports = Pipe;


/**
 * @constructor Pipe
 * Creates a new pipe object
 * @param {int} lane - pipe lane number the pipe belongs in (0 - 3, left to right)
 */
function Pipe(x_cell, y_cell, pipenum) {
  this.spritesheet  = new Image();
  this.pipenum = pipenum;
  this.spritesheet.src = 'assets/pipes/pipe_' + this.pipenum + '/pipe_' + this.pipenum + '.png';
  this.x_cell = x_cell;
  this.y_cell = y_cell;
  this.width  = 86;
  this.height = 86;
  this.waterlevel = 0;
  this.count = 0;
}

/**
 * @function updates the pipe object
 */
Pipe.prototype.update = function(elapsedTime, speed) {
    this.count += elapsedTime;
    if(count > 300){
        waterlevel += 1;
        this.count = 0;
    }
}

/**
 * @function renders the pipe into the provided context
 * {CanvasRenderingContext2D} ctx - the context to render into
 */
Pipe.prototype.render = function(ctx) {
  ctx.drawImage(
    //image
    this.spritesheet,
    //source rectangle
    0, 0, 128, 128,
    //destination rectangle
    this.x_cell * 86, this.y_cell * 86, this.width, this.height
  );
}

/**
 * @function rotates the pipe object
 */
Pipe.prototype.rotate = function() {
    if(this.pipenum == 3){
    this.pipenum = 0;
    }
    else if(this.pipenum == 5) { 
    this.pipenum = 4;
    }
    else {
    this.pipenum ++;
    }
    this.spritesheet.src = 'assets/pipes/pipe_' + this.pipenum + '/pipe_' + this.pipenum + '.png';
}
},{}]},{},[1]);
