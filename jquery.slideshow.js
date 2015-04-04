/*
 * slideshow v0.5
 * http://github.com/romanmz/slideshow
 * By Roman Martinez - http://romanmz.com
 */

;( function( $, window, document, undefined ){
	
	
	// Private Shared Data
	// ------------------------------
	var name = 'slideshow';
	var settingsName = name+'-settings';
	var defaults = {
		slides:				'.slide',
		speed:				500,
		timer:				8000,
		showFirst:			1,
		autoplay:			false,
		keyboard:			true,
		loop:				false,
		classSelected:		'selected',
		classTransition:	'transitioning',
		classPlaying:		'playing',
	};
	
	
	// Public Shared Data
	// ------------------------------
	var publicData = {
		defaults: function( settings ){
			$.extend( defaults, settings );
		},
	}
	
	
	// Instance Data
	// ------------------------------
	$[name] = function( element, settings ) {
		
		// Convert $.function() to new $.function()
		if( typeof this == 'function' ) {
			return new $[name]( element, settings );
		}
		
		// Init vars
		var Plugin = this;
		element = $(element).first();
		settings = $.extend( {}, defaults, settings, element.data( settingsName ) );
		
		// More vars
		var slides = $();
		var data = {};
		
		
		// Init
		// ------------------------------
		var init = function( newSettings ) {

			// Instantiate only once
			if( element.data( name ) )
				return element.data( name );
			element.data( name, Plugin );

			// Update settings
			$.extend( settings, newSettings );
			
			// Get slides
			slides = element.find( settings.slides );
			
			// Init data
			data.total			= slides.length;
			data.current		= undefined;
			data.previous		= undefined;
			data.isChanging		= false;
			data.timerChange	= false;
			data.timerChangeF	= $.noop;
			data.isPlaying		= settings.autoplay;
			data.timerPlay		= false;
			data.timerPlayF		= $.noop;
			data.speed			= settings.speed;
			
			// Add public data
			$.extend( Plugin, {
				element: element,
				slides: slides,
				settings: settings,
				data: data,

				init: init,
				destroy: destroy,
				showSlide: showSlide,
				showPrevious: showPrevious,
				showNext: showNext,
				play: play,
				stop: stop,
			} );
			
			// Continue only if there's 2 slides or more
			if( data.total < 2 ) {
				return Plugin;
			}
			
			// Add keyboard events
			if( settings.keyboard ) {
				$(document).on( 'keydown.'+name, function(e){
					var key = e.keyCode || e.which;
					if( key==37 )		showPrevious();
					else if( key==39 )	showNext();
				});
			}
			
			// Trigger event
			element.trigger( 'slideshowinit' );
			
			// Show first slide
			if( settings.showFirst == 'random' ) {
				var firstSlide = Math.floor( Math.random() * data.total );
			} else {
				var firstSlide = settings.showFirst - 1;
			}
			showSlide( firstSlide, 0 );
			
			// Return
			return Plugin;
		};
		
		
		// Destroy
		// ------------------------------
		var destroy = function() {
			
			// Detach events
			$(document).off( 'keydown.'+name );
			
			// Clear timers
			clearTimeout( data.timerChange );
			data.timerChangeF();
			clearTimeout( data.timerPlay );
			
			// Restore objects
			element.removeClass( settings.classTransition+' '+settings.classPlaying );
			slides.removeClass( settings.classSelected ).removeAttr( 'aria-live' ).removeAttr( 'aria-hidden' );
			
			// Delete properties and methods
			delete Plugin.slides;
			delete Plugin.data;
			delete Plugin.showSlide;
			delete Plugin.showPrevious;
			delete Plugin.showNext;
			delete Plugin.play;
			delete Plugin.stop;
			
			// Remove instance and return
			element.removeData( name );
			return Plugin;
		};
		
		
		// ShowSlide
		// ------------------------------
		var showSlide = function( newSlide, speed ) {
			
			// Check arguments
			newSlide = parseInt( newSlide );
			if( isNaN( newSlide ) ) throw Error( 'showSlide() requires a number as the first argument' );
			if( typeof speed == 'undefined' ) speed = settings.speed;
			
			// Restrict newSlide
			newSlide = parseInt( newSlide );
			var lastSlide = data.total-1;
			if( newSlide > lastSlide ) {
				newSlide = settings.loop ? 0 : lastSlide;
			} else if( newSlide < 0 ) {
				newSlide = settings.loop ? lastSlide : 0;
			}
			
			// Check status
			if( data.isChanging || newSlide == data.current ) {
				return Plugin;
			}
			
			// Update data
			data.isChanging	= true;
			data.previous	= ( typeof data.current != 'undefined' && data.current != newSlide ) ? data.current : undefined;
			data.current	= newSlide;
			data.speed		= speed;
			clearTimeout( data.timerChange );
			
			// Set timer
			data.timerChangeF = function(){
				
				// Update data
				data.isChanging = false;
				data.timerChangeF = $.noop;
				
				// Trigger event
				updateAttributes();
				element.trigger( 'slideshowchangeend' );
				
				// Continue autoplay
				if( data.isPlaying ) {
					play();
				}
			};
			data.timerChange = setTimeout( data.timerChangeF, data.speed );
			
			// Trigger event
			updateAttributes();
			element.trigger( 'slideshowchangestart' );
			
			return Plugin;
		}
		
		
		// Update Attributes
		// ------------------------------
		var updateAttributes = function(){
			
			// Select objects
			var currentSlide = slides.eq( data.current );
			var otherSlides = slides.not( currentSlide );
			
			// Update element
			element[ data.isChanging ? 'addClass' : 'removeClass' ]( settings.classTransition );
			element[ data.isPlaying ? 'addClass' : 'removeClass' ]( settings.classPlaying );
			
			// Update slides
			otherSlides.removeClass( settings.classSelected ).removeAttr( 'aria-live' ).attr( 'aria-hidden', 'true' );
			currentSlide.addClass( settings.classSelected ).attr( 'aria-live', 'polite' ).removeAttr( 'aria-hidden' );
			
		}
		
		
		// Previous, Next, Play, Stop
		// ------------------------------
		var showPrevious = function() {
			showSlide( data.current - 1 );
			return Plugin;
		};
		var showNext = function() {
			showSlide( data.current + 1 );
			return Plugin;
		};
		var play = function() {
			
			// Update data
			data.isPlaying = true;
			clearTimeout( data.timerPlay );
			data.timerPlayF = function(){
				data.timerPlayF = $.noop;
				var nextSlide = ( data.current+1 > data.total-1 ) ? 0 : data.current+1;
				showSlide( nextSlide );
			};
			data.timerPlay = setTimeout( data.timerPlayF, settings.timer );
			
			// Trigger event
			updateAttributes();
			element.trigger( 'slideshowplay' );
			
			// Return
			return Plugin;
			
		};
		var stop = function() {
			
			// Update data
			data.isPlaying = false;
			clearTimeout( data.timerPlay );
			data.timerPlayF = $.noop;
			
			// Trigger event
			updateAttributes();
			element.trigger( 'slideshowstop' );
			
			// Return
			return Plugin;
			
		};
		
		
		// Init and return
		// ------------------------------
		return init();
	}
	
	
	// Add Public Data and jQuery Constructor
	// ------------------------------
	$.extend( $[name].prototype, publicData );
	$.fn[name] = function( settings ) {
		return this.each(function(){
			new $[name]( this, settings )
		});
	};
	
	
} )( jQuery, window, document );
