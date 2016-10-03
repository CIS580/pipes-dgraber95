/**
 * @module exports the pipe class
 */
module.exports = exports = Pipe;

var BOTTOM = 0;
var RIGHT = 1;
var TOP = 2;
var LEFT = 3;

/**
 * @constructor Pipe
 * Creates a new pipe object
 * @param {int} lane - pipe lane number the pipe belongs in (0 - 3, left to right)
 */
function Pipe(x_cell, y_cell, pipenum) {
  this.spritesheet  = new Image();
  this.spritesheet.src = 'assets/pipes/pipe_' + this.pipenum + '/pipe_' + this.pipenum + '.png';
  this.waterImg = new Image();
  this.waterImg.src = '';
  this.pipenum = pipenum;
  this.x_cell = x_cell;
  this.y_cell = y_cell;
  this.width  = 86;
  this.height = 86;
  this.waterlevel = -1;
  this.count = 0;

  /* bottom, right, top, left */
  this.entries = [false, false, false, false];
  this.updateEntries();
}

/**
 * @function updates the pipe object
 */
Pipe.prototype.update = function(elapsedTime, speed) {
  if(this.waterlevel >= 0 && this.waterlevel <= 11){
    this.count += elapsedTime;
    if(count > 300){
        waterlevel += 1;
        this.count = 0;
    }
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
 * @function begins liquid flow in pipe
 * {int} waterDirection - direction water is flowing in
 * return: direction water will flow out
 */
Pipe.prototype.beginFlow = function(waterDirection) {
    this.waterlevel = 0;
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

      //2
        //bottom: water source  = 0
            //  new direction = 1
        //right : water source  = 1
            //  new direction = 0

      //3
        //bottom: water source  = 0
            //  new direction = 3
        //left : water source  = 1
            //  new direction = 0

      //4
        //left: water source  = 0
            //  new direction = 2
        //top : water source  = 1
            //  new direction = 3

      //5
        //left: water source  = 0
            //  new direction = 2
        //top : water source  = 1
            //  new direction = 3


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