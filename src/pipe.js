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
  this.placeSound = new Audio('sounds/place_pipe.wav');
  this.placeSound.play();
  this.rotateSound = new Audio('sounds/rotate_pipe.wav');
  this.waterImg = new Image();
  this.waterImg.src = '';
  this.x_cell = x_cell;
  this.y_cell = y_cell;
  this.width  = 86;
  this.height = 86;
  this.waterlevel = -3;
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
  if(this.waterlevel >= -2 && this.waterlevel < 10){
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
  if(this.waterlevel >= 0){
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
    this.waterlevel = -2;
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
    this.rotateSound.play();
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