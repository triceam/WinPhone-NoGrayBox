var _Element = HTMLElement || Element;

if ( _Element ){
	_Element.prototype.__addEventListener = _Element.prototype.addEventListener;
	_Element.prototype.addEventListener = function(type, listener, useCapture)
	{
		if (type && type.toLowerCase() === "click" && !TouchClick.overrideDefault === false) {
			new TouchClick( $(this), listener );
		}
		else
			this.__addEventListener(type, listener, useCapture);
	};
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
	
	var regexp = new RegExp("Windows Phone OS");	
	this.winPhone = (navigator.userAgent.search(regexp) >= 0);


	if ( this.silenceable ) {
		this.target.addClass( "TouchClick" );
	}

	this.touchSupported = 'ontouchstart' in window;
	this.START = this.touchSupported ? "touchstart" : "mousedown";
	this.END = this.touchSupported ? "touchend" : "mouseup";
	this.TOUCH_PROXIMITY_TOLERANCE = 15;
	this.TOUCH_DELAY_TOLERANCE = 1000;
	
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
	
	this.restore(false);
}
TouchClick.overrideDefault = true;

TouchClick.prototype.touchStartHander = function (event) {
	var rawTarget = this.target.get()[0];
	rawTarget.removeEventListener( this.START, this.touchStart, false );
	window.addEventListener( this.END, this.touchEnd, true );

	this.startTime = new Date().getTime();
	this.startPosition = {x:event.pageX, y:event.pageY}
	
	if ( this.highlight ) {
		this.target.addClass("active");
	}

	return false;
}

TouchClick.prototype.touchEndHander = function (event) {
	try{
		window.removeEventListener( this.END, this.touchEnd, true );
		var self = this;
	
		var totalTime = new Date().getTime() - this.startTime;
		this.startTime = 0;

		if ( totalTime <= this.TOUCH_DELAY_TOLERANCE ) {
			var diff = {
				x: (this.startPosition.x - event.pageX),
				y: (this.startPosition.y - event.pageY)
			}

			this.startPosition.x = this.startPosition.y = -99

			if ( Math.abs(diff.x) <= this.TOUCH_PROXIMITY_TOLERANCE && 
				 Math.abs(diff.y) <= this.TOUCH_PROXIMITY_TOLERANCE )  {
				 
				 if (this.handler) {
					this.silence();

					//win phone fires duplicate events for some reason, this mitigates it
					clearTimeout( this.handlerTimeout );
					this.handlerTimeout = setTimeout( function() {
						try {
							
							var evt = document.createEvent("MouseEvents");
							evt.initMouseEvent("click", true, true, window,
								0, 0, 0, 0, 0, false, false, false, false, 0, self.target.get()[0]);
							
							self.handler( evt );
							clearTimeout( self.restoreTimeout );
							self.restoreTimeout = setTimeout( function() {
								try {
									self.restore(true);
								}
								catch(e) {
									console.log(e);
								}
							},500 );
						}
						catch(e) {
							console.log(e);
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
				self.restore(true);
			}
			catch(e) {
				console.log(e);
			}
		},300 );
	
	}
	catch(e){ console.log(e) }
	return true;
}

var silenced = [];
TouchClick.prototype.silence = function () {
	if ( !this.winPhone ) return;
	var self = this;
	try {
		window.addEventListener( "mousedown", silencer, true );
		$(".TouchClick").each( function(index) {
			if ( this != self.target.get()[0] ) {
				this.addEventListener( "mousedown", silencer, true );
				silenced.push( {target:this, silencer:silencer} );
			}
		});
	}catch(e) {
		console.log(e);
	}
}

TouchClick.prototype.unsilence = function () {
	if ( !this.winPhone ) return;
	var self = this;
	var item = undefined;
	try {
		while( silenced.length > 0 ) {
			item = silenced.pop();
			item.target.removeEventListener( "mousedown", item.silencer, true );

		}
		window.removeEventListener( "mousedown", silencer, true );
	}catch(e) {
		console.log(item);
		console.log(e);
	}
}

TouchClick.prototype.restore = function (unsilence) {
	try{
		var rawTarget = this.target.get()[0];
		rawTarget.removeEventListener( this.START, this.touchStart, false );
		rawTarget.addEventListener( this.START, this.touchStart, false );
		window.removeEventListener( this.END, this.touchEnd, true );
		
		if ( unsilence == true ) {
			this.unsilence();
		}

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
