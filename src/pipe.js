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