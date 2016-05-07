// Simple class example

function Medal(posX, posY, image) {
	this.x = posX;
	this.y = posY;
	this.image = image;
}


Medal.prototype.set = function(posX, posY){
	this.x = posX;
	this.y = posY;
}



Medal.prototype.drawToContext = function(theContext) {
	  	theContext.drawImage(this.image
	  						, this.x - this.image.width/2
	  						, this.y - this.image.height/2
							, this.image.width
							, this.image.height);
}