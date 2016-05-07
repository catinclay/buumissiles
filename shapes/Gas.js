// Simple class example

function Medal(posX, posY, image) {
		this.image = image;
		var offsetX = 10 + theCanvasWidth/2 + this.image.width/2;
		var offsetY = 10 +theCanvasHeight/2 + this.image.height/2;
		if(Math.random() > 0.5){
			this.x = Math.random()*250 + offsetX;
			if(Math.random() > 0.5){ this.x *= -1; }
			this.y = Math.random()*theCanvasHeight - theCanvasHeight/2;
		}else{
			this.y = Math.random()*250 + offsetY;
			if(Math.random() > 0.5){ this.y *= -1;}
			this.x = Math.random()*theCanvasWidth - theCanvasWidth/2;
		}
		this.radius = this.image.width;
		this.theCanvasWidth  = theCanvasWidth;
		this.theCanvasHeight = theCanvasHeight;
}



//The function below returns a Boolean value representing whether the point with the coordinates supplied "hits" the particle.

//A function for drawing the particle.




Medal.prototype.drawToContext = function(theContext) {
	  	theContext.drawImage(this.image
	  						, this.x, this.y
							, -this.image.width/2
							, -this.image.height/2);
}