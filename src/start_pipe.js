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