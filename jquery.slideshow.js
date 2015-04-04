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
		showFirst:			1,
		keyboard:			true,
		loop:				false,
		classSelected:		'selected',
		classTransition:	'transitioning',
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
			
			// Restore objects
			element.removeClass( settings.classTransition );
			slides.removeClass( settings.classSelected ).removeAttr( 'aria-live' ).removeAttr( 'aria-hidden' );
			
			// Delete properties and methods
			delete Plugin.slides;
			delete Plugin.data;
			delete Plugin.showSlide;
			delete Plugin.showPrevious;
			delete Plugin.showNext;
			
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
			
			// Select slides
			var currentSlide = slides.eq( data.current );
			var otherSlides = slides.not( currentSlide );
			
			// Update classes
			otherSlides.removeClass( settings.classSelected );
			currentSlide.addClass( settings.classSelected );
			otherSlides.removeAttr( 'aria-live' ).attr( 'aria-hidden', 'true' );
			currentSlide.attr( 'aria-live', 'polite' ).removeAttr( 'aria-hidden' );
			element.addClass( settings.classTransition );
			
			// Trigger events
			data.timerChangeF = function(){
				data.isChanging = false;
				data.timerChangeF = $.noop;
				element.removeClass( settings.classTransition );
			};
			data.timerChange = setTimeout( data.timerChangeF, data.speed );
			
			return Plugin;
		}
		
		
		// Previous, Next
		// ------------------------------
		var showPrevious = function() {
			showSlide( data.current - 1 );
			return Plugin;
		};
		var showNext = function() {
			showSlide( data.current + 1 );
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
