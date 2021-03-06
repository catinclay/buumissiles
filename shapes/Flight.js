// Simple class example

function Flight(posX, posY, image, angle, hp, username, score) {
		this.x = posX;
		this.y = posY;
		this.image = image;
		this.angle = angle;
		this.rotateRate = 0.15;
		this.targetDegree = 0;
		this.radius = this.image.width/2*1.2;
		this.hp = hp;
		this.username = username;
		this.score = score;
}

//The function below returns a Boolean value representing whether the point with the coordinates supplied "hits" the particle.
// SimpleSquareParticle.prototype.hitTest = function(hitX,hitY) {
// 	return((hitX > this.x - this.radius)&&(hitX < this.x + this.radius)&&(hitY > this.y - this.radius)&&(hitY < this.y + this.radius));
// }

//A function for drawing the particle.
Flight.prototype.drawToContext = function(theContext, hp, score) {
	this.hp = hp;
	this.score = score;
	//theContext.rotate(this.angle*Math.PI/180);
	if(this.hp > 0){
		// console.log(this.hp);
	    theContext.save();

	    // move to the center of the canvas
	    theContext.translate(this.x,this.y);

	    // rotate the canvas to the specified degrees
	    theContext.rotate(-this.angle);

	    // draw the image
	    // since the context is rotated, the image will be rotated also
	  	theContext.drawImage(this.image
							, -this.image.width/2
							, -this.image.height/2);

	    // we’re done with the rotating so restore the unrotated context
	    
		theContext.restore();

		theContext.strokeStyle = "rgba(" + Math.floor(255*(80-this.hp)/100) + "," + Math.floor(255*((this.hp-20)/100)) + ",0,0.8)";
	    theContext.beginPath();
	    theContext.lineWidth = 3;
	    theContext.arc(this.x,this.y,this.radius,1.5 * Math.PI, (1.5 - 2 * this.hp/100) * Math.PI, true);
	    theContext.stroke();

		
	    theContext.font = "15px Comic Sans MS";
		theContext.fillStyle = "red";
		theContext.textAlign = "center";
		theContext.fillText(this.username, this.x , this.y-this.image.width*0.75);

		theContext.font = "10px Comic Sans MS";
		theContext.fillStyle = "red";
		theContext.textAlign = "center";
		theContext.fillText(this.score, this.x , this.y+this.image.width);
    }

}

Flight.prototype.rotateToward = function(posX, posY) {
	this.targetDegree = Math.atan2(posX, posY);

	var tempTD = this.targetDegree > 0 ? this.targetDegree : 2 * Math.PI + this.targetDegree;
	var tempCD = this.angle > 0 ? this.angle : 2 * Math.PI + this.angle;
	// console.log(this.angle);
	if(Math.abs(tempTD - tempCD) < this.rotateRate || Math.abs(tempTD - (tempCD+2*Math.PI)) < this.rotateRate
		|| Math.abs(tempTD - tempCD+2*Math.PI) < this.rotateRate){
		this.angle = this.targetDegree;
		return;
	}

	if(tempCD > tempTD){
		tempTD = tempTD + 2 * Math.PI;
	}

	if(tempTD - tempCD < Math.PI){
		this.angle += this.rotateRate;
	} else {
		this.angle -= this.rotateRate;
	}


	if(this.angle > 2 * Math.PI){
		this.angle -= 2 * Math.PI;
	}else if(this.angle < 0){
		this.angle += 2 * Math.PI;
	}
	
}

Flight.prototype.getDegree = function() {
	return this.angle;
}

Flight.prototype.setDegree = function(angle) {
	this.angle = angle;
}

Flight.prototype.printSomething = function() {
	console.log(this.targetDegree - this.angle);
}