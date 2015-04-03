/*
 * slideshow v0.4
 * http://github.com/romanmz/slideshow
 * By Roman Martinez - http://romanmz.com
 */

;( function( $, window, document, undefined ){
	
	
	// Private Shared Data
	// ------------------------------
	var name = 'slideshow';
	var settingsName = name+'-settings';
	var defaults = {
		slides:	'.slide',
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
			Plugin.slides = slides = element.find( settings.slides );
			if( slides.length < 2 ) {
				return Plugin;
			}
			
			// Init data
			data.total			= slides.length;
			data.current		= undefined;
			data.previous		= undefined;
			
			// Return
			return Plugin;
		};
		
		
		// Destroy
		// ------------------------------
		var destroy = function() {
			// Revert everything except element and settings
			delete Plugin.slides;
			delete Plugin.data;
			
			// Remove instance and return
			element.removeData( name );
			return Plugin;
		};
		
		
		// Return Public Data
		// ------------------------------
		$.extend( Plugin, {
			element: element,
			slides: slides,
			settings: settings,
			data: data,
			
			init: init,
			destroy: destroy,
		} );
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
