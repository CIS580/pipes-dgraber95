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