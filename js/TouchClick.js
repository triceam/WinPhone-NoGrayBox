var _Element = HTMLElement || Element;

if ( _Element ){
	_Element.prototype.__addEventListener = _Element.prototype.addEventListener;
	_Element.prototype.addEventListener = function(type, listener, useCapture)
	{
		if (type && type.toLowerCase() == "click") {
			new TouchClick( $(this), listener);
		}
		else
			this.__addEventListener(type, listener, useCapture);
	};
}
catch(e){
	console.log(e);
}

var silencer = function (event) {
	event.preventDefault();
	event.stopImmediatePropagation();
	return false;
}

function TouchClick( target, handler, highlight, silenceable ) {
	var self = this;
	this.target = target;
	this.handler = handler;
	this.highlight = !(highlight === false)
	this.silenceable = true;//(silenceable == true);
	this.silenced = false;

	if ( this.silenceable ) {
		this.target.addClass( "TouchClick" );
	}

	this.touchSupported = false;//'ontouchstart' in window;
	this.START = this.touchSupported ? "touchstart" : "mousedown";
	this.END = this.touchSupported ? "touchend" : "mouseup";
	this.TOUCH_PROXIMITY_TOLERANCE = 15;
	this.TOUCH_DELAY_TOLERANCE = 1000;
	
	//console.log( "TouchClick" + target.attr("id") );
	
	this.touchStart = function( event ) {
		self.touchStartHander( event );
		event.preventDefault();
		return false;
	}
	this.touchEnd = function( event ) {
		if ( !self.touchEndHander( event ) ) {
			event.preventDefault();
			event.stopImmediatePropagation();
			return false;
		}
	}
	
	this.restore();
}

TouchClick.prototype.touchStartHander = function (event) {
	var rawTarget = this.target.get()[0];
	rawTarget.removeEventListener( this.START, this.touchStart, false );
	window.addEventListener( this.END, this.touchEnd, true );

	console.log( "touchStartHander: " + this.target.html());
	this.startTime = new Date().getTime();
	this.startPosition = {x:event.pageX, y:event.pageY}
	
	if ( this.highlight ) {
		this.target.addClass("active");
	}
	//console.log(this.target);
	return false;
}

TouchClick.prototype.touchEndHander = function (event) {
	try{
		console.log( "touchEndHander");
		window.removeEventListener( this.END, this.touchEnd, true );
		var self = this;
	
		var totalTime = new Date().getTime() - this.startTime;
		this.startTime = 0;

		//console.log( totalTime );
		if ( totalTime <= this.TOUCH_DELAY_TOLERANCE ) {
			var diff = {
				x: (this.startPosition.x - event.pageX),
				y: (this.startPosition.y - event.pageY)
			}

			this.startPosition.x = this.startPosition.y = -99
			//console.log( diff );

			if ( Math.abs(diff.x) <= this.TOUCH_PROXIMITY_TOLERANCE && 
				 Math.abs(diff.y) <= this.TOUCH_PROXIMITY_TOLERANCE )  {

				 //console.log("CLICK!!!!!!!!!!!!!!!!!!11");
				 if (this.handler) {
					this.silence();

					//win phone fires duplicate events for some reason, this mitigates it
					clearTimeout( this.handlerTimeout );
					this.handlerTimeout = setTimeout( function() {
						try {
							self.handler( event );
							clearTimeout( self.restoreTimeout );
							self.restoreTimeout = setTimeout( function() {
								try {
									self.restore();
								}
								catch(e) {
									//console.log(e);
								}
							},500 );
						}
						catch(e) {
							//console.log(e);
						}
					},10 );
					event.preventDefault();
					event.stopPropagation();
					return false;
				 }
			}
		}
	
		clearTimeout( this.restoreTimeout );
		this.restoreTimeout = setTimeout( function() {
			try {
				self.restore();
			}
			catch(e) {
				//console.log(e);
			}
		},300 );
	
	}
	catch(e){ console.log(e) }
	return true;
}

var silenced = [];
TouchClick.prototype.silence = function () {
	
	var self = this;
	try {
		$(".TouchClick").each( function(index) {
			if ( this != self.target.get()[0] ) {
				this.addEventListener( "mousedown", silencer, true );
				//console.log( "silence: " + $(this).html() );
				silenced.push( {target:this, silencer:silencer} );
			}
		});
	}catch(e) {
		console.log( "silence" );
		console.log(e);
	}
	this.silenced = true;
}

TouchClick.prototype.unsilence = function () {
	//if ( !this.silenced ) return;
	//console.log( "unsilence" );
	var self = this;
	var item = undefined;
	try {
		while( silenced.length > 0 ) {
			item = silenced.pop();
			//console.log( silenced.length + ": " + $(target).html() );
			item.target.removeEventListener( "mousedown", item.silencer, true );

		}
	}catch(e) {
		console.log( "unsilence" );
		console.log(item);
		console.log(e);
	}
	this.silenced = false;
}

TouchClick.prototype.restore = function () {
	try{
		var rawTarget = this.target.get()[0];
		rawTarget.removeEventListener( this.START, this.touchStart, false );
		rawTarget.addEventListener( this.START, this.touchStart, false );
		window.removeEventListener( this.END, this.touchEnd, true );
		this.unsilence();
		if ( this.highlight ) {
			this.target.removeClass("active");
		}
	
	}
	catch(e){ console.log(e) }
}

TouchClick.prototype.destroy = function () {
	var rawTarget = this.target.get()[0];
	rawTarget.removeEventListener( this.START, this.touchStart, false );
	window.removeEventListener( this.END, this.touchEnd, true );
	this.target.removeClass( "TouchClick" );
	this.target = undefined;
	this.handler = undefined;
}
