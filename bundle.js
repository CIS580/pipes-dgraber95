(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

const COUNTDOWN = 1800;
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
  //state = 'paused';
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
          game.pause(true);
          state = 'gameover';
          break exit;
        }

        // Increment number of pipes used
        pipes_used += 1;

        // New level
        if(water_cell.endpipe){
          new_level();
          break exit;
        }

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
  }
  if(state == 'gameover'){
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
    ctx.font = "50px Lucida Console";
		ctx.fillStyle = "red";
		ctx.textAlign = "center";
		ctx.fillText("GAME OVER", canvas.width/2, canvas.height/2); 
		ctx.font = "25px Lucida Console";
		ctx.fillStyle = "black";
		ctx.fillText("Final Score: " + score, canvas.width/2, canvas.height/2 + 30);
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
    ctx.font = "50px Lucida Console";
		ctx.fillStyle = "black";
		ctx.textAlign = "center";
		ctx.fillText(Math.ceil(countDown/600),  canvas.width/2, canvas.height/2); 
		ctx.font = "25px Lucida Console";
		ctx.fillStyle = "black";
		ctx.fillText("Level: " + level, canvas.width/2, canvas.height/2 + 30);
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
},{"./end_pipe.js":2,"./game":3,"./pipe.js":4,"./start_pipe.js":5}],2:[function(require,module,exports){
/**
 * @module exports the end pipe class
 */
module.exports = exports = EndPipe;

/**
 * @constructor EndPipe
 * Creates a new EndPipe object
 * {int} start_x - x cell of start pipe (cannot overlap)
 * {int} start_y - y cell of start pipe (cannot overlap)
 */
function EndPipe(start_x, start_y) {
  this.direction = Math.floor(Math.random() * 4);
  this.spritesheet  = new Image();
  this.spritesheet.src = 'assets/pipes/pipe_end/pipe_end_' + this.direction + '.png';
  do{
    this.x_cell = Math.floor(Math.random() * 8) + 1;
    this.y_cell = Math.floor(Math.random() * 8) + 1;
  }
  /* ensure no overlap */
  while(Math.abs(this.x_cell - start_x) < 2 || Math.abs(this.y_cell - start_y) < 2)
  this.width  = 86;
  this.height = 86;
  this.entries = [false, false, false, false];
  this.entries[this.direction] = true;
  this.rotatable = false;
  this.endpipe = true;
}

/**
 * @function updates the end pipe object
 */
EndPipe.prototype.update = function(elapsedTime) {
    // end pipe will not need to update
}

/**
 * @function renders the pipe into the provided context
 * {CanvasRenderingContext2D} ctx - the context to render into
 */
EndPipe.prototype.render = function(ctx) {
    ctx.drawImage(
        //image
        this.spritesheet,
        //source rectangle
        0, 0, 128, 128,
        //destination rectangle
        this.x_cell * 86, this.y_cell * 86, this.width, this.height
    );
}
},{}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
/**
 * @module exports the pipe class
 */
module.exports = exports = Pipe;

const BOTTOM = 0;
const RIGHT = 1;
const TOP = 2;
const LEFT = 3;

/**
 * @constructor Pipe
 * Creates a new pipe object
 * @param {int} x_cell - x cell the pipe is in 
 * @param {int} y_cell - y cell the pipe is in 
 * @param {int} pipenum - number of the pipe (0 through 5, see assets for images)
 */
function Pipe(x_cell, y_cell, pipenum) {
  this.pipenum = pipenum;
  this.spritesheet  = new Image();
  this.spritesheet.src = 'assets/pipes/pipe_' + this.pipenum + '/pipe_' + this.pipenum + '.png';
  this.waterImg = new Image();
  this.waterImg.src = '';
  this.x_cell = x_cell;
  this.y_cell = y_cell;
  this.width  = 86;
  this.height = 86;
  this.waterlevel = -1;
  this.count = 0;
  this.rotatable = true;

  /* bottom, right, top, left */
  this.entries = [false, false, false, false];
  this.updateEntries();
}

/**
 * @function updates the pipe object
 */
Pipe.prototype.update = function(elapsedTime, count) {
  if(this.waterlevel >= 0 && this.waterlevel < 10){
    this.count += elapsedTime;
    if(this.count > count){
        this.waterlevel += 1;
        this.count = 0;
    }
  }
}

/**
 * @function renders the pipe into the provided context
 * {CanvasRenderingContext2D} ctx - the context to render into
 */
Pipe.prototype.render = function(ctx) {
  if(this.waterlevel > 0){
    ctx.drawImage(
      //image
      this.waterImg,
      //source rectangle
      128*this.waterlevel, 0, 128, 128,
      //destination rectangle
      this.x_cell * 86, this.y_cell * 86, this.width, this.height
    );
  }

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
 * @function begins liquid flow in pipe
 * {int} waterDirection - direction water is flowing in
 * return: direction water will flow out
 */
Pipe.prototype.beginFlow = function(waterDirection) {
    this.waterlevel = 0;
    this.rotatable = false;
    switch(this.pipenum){
      case 0:
        if(waterDirection == LEFT){
          this.waterImg.src = 'assets/pipes/pipe_0/water_0_0.png';
          return TOP;
        }
        else if(waterDirection == TOP){
          this.waterImg.src = 'assets/pipes/pipe_0/water_0_1.png';
          return LEFT;
        }
        break;

      case 1:
        if(waterDirection == RIGHT){
          this.waterImg.src = 'assets/pipes/pipe_1/water_1_0.png';
          return TOP;
        }
        else if(waterDirection == TOP){
          this.waterImg.src = 'assets/pipes/pipe_1/water_1_1.png';
          return RIGHT;          
        }
        break;        

      case 2:
        if(waterDirection == BOTTOM){
          this.waterImg.src = 'assets/pipes/pipe_2/water_2_0.png';
          return RIGHT;
        }
        else if(waterDirection == RIGHT){
          this.waterImg.src = 'assets/pipes/pipe_2/water_2_1.png';
          return BOTTOM;          
        }
        break;

      case 3:
        if(waterDirection == BOTTOM){
          this.waterImg.src = 'assets/pipes/pipe_3/water_3_0.png';
          return LEFT;
        }
        else if(waterDirection == LEFT){
          this.waterImg.src = 'assets/pipes/pipe_3/water_3_1.png';
          return BOTTOM;          
        }
        break;

      case 4:
        if(waterDirection == BOTTOM){
          this.waterImg.src = 'assets/pipes/pipe_4/water_4_0.png';
          return TOP;
        }
        else if(waterDirection == TOP){
          this.waterImg.src = 'assets/pipes/pipe_4/water_4_1.png';
          return BOTTOM;          
        }
        break;  

      case 5:
        if(waterDirection == LEFT){
          this.waterImg.src = 'assets/pipes/pipe_5/water_5_0.png';
          return RIGHT;
        }
        else if(waterDirection == RIGHT){
          this.waterImg.src = 'assets/pipes/pipe_5/water_5_1.png';
          return LEFT;
        }
        break;
    }
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
    this.updateEntries();
}

/**
 * @function updates the pipe entry ways
 */
Pipe.prototype.updateEntries = function() {
    switch(this.pipenum){
      case 0:
        this.entries = [false, false, true, true];
        break;
      case 1:
        this.entries = [false, true, true, false];
        break;
      case 2:
        this.entries = [true, true, false, false];
        break;
      case 3:
        this.entries = [true, false, false, true];
        break;
      case 4:
        this.entries = [true, false, true, false];
        break;
      case 5:
        this.entries = [false, true, false, true];
        break;                                        
    }
}
},{}],5:[function(require,module,exports){
/**
 * @module exports the start pipe class
 */
module.exports = exports = StartPipe;

/**
 * @constructor StartPipe
 * Creates a new StartPipe object
 */
function StartPipe() {
  this.direction = Math.floor(Math.random() * 4);
  this.spritesheet  = new Image();
  this.spritesheet.src = 'assets/pipes/pipe_start/pipe_start_' + this.direction + '.png';
  this.x_cell = Math.floor(Math.random() * 8) + 1;
  this.y_cell = Math.floor(Math.random() * 8) + 1;
  this.width  = 86;
  this.height = 86;
  this.waterlevel = -1;
  this.count = 0;
  this.entries = [false, false, false, false];
  this.rotatable = false;

}

/**
 * @function updates the start pipe object
 */
StartPipe.prototype.update = function(elapsedTime) {
  if(this.waterlevel >= 0 && this.waterlevel < 10){
    this.count += elapsedTime;
    if(this.count > 1000){
        this.waterlevel += 1;
        this.count = 0;
    }
  }
}

/**
 * @function renders the pipe into the provided context
 * {CanvasRenderingContext2D} ctx - the context to render into
 */
StartPipe.prototype.render = function(ctx) {
  if(this.waterlevel > 0){
    ctx.drawImage(
      //image
      this.spritesheet,
      //source rectangle
      128*this.waterlevel, 0, 128, 128,
      //destination rectangle
      this.x_cell * 86, this.y_cell * 86, this.width, this.height
    );
  }
  else{
    ctx.drawImage(
      //image
      this.spritesheet,
      //source rectangle
      0, 0, 128, 128,
      //destination rectangle
      this.x_cell * 86, this.y_cell * 86, this.width, this.height
    );
  }

}


/**
 * @function begins liquid flow in start pipe
 * return: direction water will flow out
 */
StartPipe.prototype.beginFlow = function() {
    this.waterlevel = 0;
    return this.direction;
}
},{}]},{},[1]);
