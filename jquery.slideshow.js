/*
 * slideshow v0.3
 * http://github.com/romanmz/slideshow
 * By Roman Martinez - http://romanmz.com
 */

;( function( $, window, document, undefined ){
	
	
	// Private Shared Data
	// ------------------------------
	var name = 'slideshow';
	var settingsName = name+'-settings';
	var defaults = {
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
		
		// Private
		var Plugin = this;
		element = $(element).first();
		settings = $.extend( {}, defaults, settings, element.data( settingsName ) );
		
		
		// Init
		// ------------------------------
		var init = function( newSettings ) {

			// Instantiate only once
			if( element.data( name ) )
				return element.data( name );
			element.data( name, Plugin );

			// Update settings
			$.extend( settings, newSettings );

			// Return
			return Plugin;
		};
		
		
		// Destroy
		// ------------------------------
		var destroy = function() {
			// Revert everything except element and settings
			
			// Remove instance and return
			element.removeData( name );
			return Plugin;
		}
		
		
		// Return Public Data
		// ------------------------------
		$.extend( Plugin, {
			element: element,
			settings: settings,
			
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
