/*
 * slideshow v0.6
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
		pauseOnFocus:		false,
		loop:				false,
		useTouch:			true,
		controlsPrev:		'',
		controlsNext:		'',
		controlsPlay:		'',
		textPrev:			'«<span class="visuallyhidden"> Previous slide</span>',
		textNext:			'<span class="visuallyhidden">Next slide </span>»',
		textPlay:			'<span class="visuallyhidden">Play Animation </span>▶',
		textStop:			'<span class="visuallyhidden">Stop Animation </span>￭',
		classSelected:		'selected',
		classTransition:	'transitioning',
		classPlaying:		'playing',
		classDisabled:		'disabled',
	};
	var initialData = name+'-initial-data';
	
	
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
		var controls = {};
		
		
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
			data.usingTouch		= ( settings.useTouch && ( 'ontouchstart' in window || navigator.msMaxTouchPoints > 0 ) );
			
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
			
			// Pause on hover/focus
			if( settings.pauseOnFocus ) {
				
				// Init vars
				var wasPlaying = data.isPlaying;
				var focused = false;
				var hovered = false;
				
				// On mouseenter / focusin
				element
				.on( 'mouseenter.'+name+' focusin.'+name, function(e){
					if( !hovered && !focused )		wasPlaying = data.isPlaying;
					if( e.type == 'mouseenter' )	hovered = true;
					else if( e.type == 'focusin' )	focused = true;
					stop();
				})
				
				// On mouseleave / focusout
				.on( 'mouseleave.'+name+' focusout.'+name, function(e){
					if( e.type == 'mouseleave' )	hovered = false;
					else if( e.type == 'focusout' )	focused = false;
					if( !hovered && !focused && wasPlaying )
						play();
				});
			}
			
			// Create controls
			createControls();
			
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
			
			// Remove event handlers
			$(document).off( '.'+name );
			element.off( '.'+name );
			
			// Clear timers
			clearTimeout( data.timerChange );
			data.timerChangeF();
			clearTimeout( data.timerPlay );
			
			// Restore objects
			element.removeClass( settings.classTransition+' '+settings.classPlaying );
			slides.removeClass( settings.classSelected ).removeAttr( 'aria-live' ).removeAttr( 'aria-hidden' );
			if( controls.prev )
				controls.prev.html( controls.prev.data( initialData ) );
			if( controls.next )
				controls.next.html( controls.next.data( initialData ) );
			if( controls.play )
				controls.play.html( controls.play.data( initialData ) );
			
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
		
		
		// Show Slide
		// ------------------------------
		var showSlide = function( newSlide, speed, direction ) {
			
			// Check arguments
			newSlide = parseInt( newSlide );
			if( isNaN( newSlide ) ) throw Error( 'showSlide() requires a number as the first argument' );
			if( typeof speed == 'undefined' ) speed = settings.speed;
			
			// Restrict newSlide
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
			data.previous	= ( typeof data.current != 'undefined' && data.current != newSlide ) ? data.current : undefined;
			data.current	= newSlide;
			data.speed		= speed;
			clearTimeout( data.timerChange );
			
			// Determine direction
			if( !direction )
				direction = ( data.current - !!data.previous >= 0 ) ? 1 : -1;
			data.isChanging	= direction;
			
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
		};
		
		
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
			
			// Trigger event
			element.trigger( 'slideshowupdate' );
			
		};
		
		
		// Previous, Next, Play, Stop
		// ------------------------------
		var showPrevious = function() {
			showSlide( data.current - 1, undefined, -1 );
			return Plugin;
		};
		var showNext = function() {
			showSlide( data.current + 1, undefined, 1 );
			return Plugin;
		};
		var play = function() {
			
			// Update data
			data.isPlaying = true;
			clearTimeout( data.timerPlay );
			data.timerPlayF = function(){
				data.timerPlayF = $.noop;
				var nextSlide = ( data.current+1 > data.total-1 ) ? 0 : data.current+1;
				showSlide( nextSlide, undefined, 1 );
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
		
		
		// Create Controls
		// ------------------------------
		function createControls() {
			
			// Button template
			var btn = $('<a>',{ href:'#', role:'button' });
			
			// Create prev/next
			controls.prev		= $( settings.controlsPrev );
			controls.prev.data( initialData, controls.prev.html() ).empty();
			controls.next		= $( settings.controlsNext );
			controls.next.data( initialData, controls.next.html() ).empty();
			controls.prevBtn	= btn.clone().html( settings.textPrev ).appendTo( controls.prev );
			controls.nextBtn	= btn.clone().html( settings.textNext ).appendTo( controls.next );
			controls.prevBtn.on( 'click.'+name, function(e){
				showPrevious();
				e.preventDefault();
			});
			controls.nextBtn.on( 'click.'+name, function(e){
				showNext();
				e.preventDefault();
			});
			
			// Create play/stop
			controls.play		= $( settings.controlsPlay );
			controls.play.data( initialData, controls.play.html() ).empty();
			controls.playBtn	= btn.clone().html( settings.textPlay ).appendTo( controls.play );
			controls.playBtn.on( 'click.'+name, function(e){
				if( data.isPlaying )
					stop();
				else
					play();
				e.preventDefault();
			});
			
			// Bind event handler
			element.on( 'slideshowupdate.'+name, updateControls );
			
			// Return
			return Plugin;
		};
		
		
		// Update Controls
		// ------------------------------
		var updateControls = function() {
			
			// Update prev
			if( settings.loop || data.current > 0 ) {
				controls.prev.removeClass( settings.classDisabled );
				controls.prevBtn.removeAttr( 'tabindex' );
			} else {
				controls.prev.addClass( settings.classDisabled );
				controls.prevBtn.attr( 'tabindex', -1 );
			}
			
			// Update next
			if( settings.loop || data.current < data.total-1 ) {
				controls.next.removeClass( settings.classDisabled );
				controls.nextBtn.removeAttr( 'tabindex' );
			} else {
				controls.next.addClass( settings.classDisabled );
				controls.nextBtn.attr( 'tabindex', -1 );
			}
			
			// Update play/stop
			if( data.isPlaying ) {
				controls.playBtn.html( settings.textStop );
			} else {
				controls.playBtn.html( settings.textPlay );
			}
			
			// Return
			return Plugin;
		};
		
		
		// Init and Return
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
