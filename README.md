# sliderControl

sliderControl is a stand-alone slider control optimized for touch-enabnled Webkit-based browsers, such as on the iPad, iPhone, and iPod touch.

[Demo](http://42at.com/lab/sliderControl) (best viewed on desktop Safari/Chrome or iPhone/iPod Touch).

Although the demo uses [jQTouch](http://www.jqtouch.com/) & [jQuery](http://jquery.com/), neither is required to run sliderControl.

## Features

* kinetic snap to value
* optimized CSS animation
* full range of slider values supported
* customizable with extensive options
* fully programmable
* event callbacks
* adjusts on orientation change
* works on desktop webkit browser (for testing)
* theme to taste!

## Releases

v0.3 - 2013.08.01
 * handle both touch and mouse events

v0.2 - March 11, 2011
 * fix thumb size problem with iOS 4.x
 * added minified css

v0.1a - March 11, 2010 
 * updated slideToAction look and feel

v0.1 - January 20, 2010
 * initial release

## Usage:

	new sliderControl('#sliderDiv');

		* Slider control with values 0-100 (%).

	new sliderControl('#sliderDiv', min, max, step);

		* Slider control with values 'min' to 'max' in increments 'step'.

	new sliderControl('#sliderDiv',['yes','no','maybe']);

		* Slider control with text values.

	new sliderControl('#sliderDiv', 1,10, options);

		* Slider control with values 1-10 (step 1) and given options.

## Markup

	<div id="sliderDiv"></div>

To show the slider value, include this div anywhere:

	<div class="sliderValue"></div>

## Options

default:

	{
	 // functionality
	 easing           : 'ease-out', // any CSS3 easing function
	 easingDuration   : 150,      // in msec, set to 0 to disable animation
	 labels           : false,    // show labels within slider: true/false, labels[], or "|" separated string
	 slideToClick     : true,     // slide to clicks anywhere on slider
	 enableSnap       : true,     // snap to value after user finishes sliding
	 enableToggle     : false,    // toggles if click on thumb (for binary states)
	 hints            : null,     // text message to show in place of value, null or hints[]
	 //initialValue   : null,     // set initial value or null to not set it (if undefined, set to index 0)
	 disabled         : false,    // initial disable/enable state

	 // styling
	 valueSelector    : '.sliderValue',   // selector for place to show value on slide
	 sliderClass      : 'slider',         // CSS class for thumb
	 thumbClass       : 'sliderThumb',    // CSS class for thumb
	 labelClass       : 'sliderLabel',    // CSS class for labels
	 selectedClass    : 'selected',       // CSS class for the selected value
	 labelsDivClass   : 'sliderLabelsDiv',// CSS class for styling the labels DIV
	 disabledClass    : 'sliderDisabled', // CSS class for a disabled slider
	 sliderCss        : {},               // runtime CSS attributes for slider
	 thumbCss         : {},               // runtime CSS attributes for thumb
	 labelWidthAdjust : 1,                // adjust to make labels fit if styling changes (border, etc.)

	 // event callbacks
	 onslidebegin     : null,        // called once on slide begin (touch-initiated only)
	 onslide          : null,        // called while user is sliding or just once if slide programmatically.
									 //     args:
									 //        delta - pixels moved since last call
									 //        changed - true/false if the value has changed
	 onslideend       : null,        // called after the slide (transition) ends
	 onchange         : null,        // called once at end of slide if the value has changed.
									 //         this.value is the new value
	 onclick          : null,        // called if user clicks on slider (incl. thumb). arg: (event)
									 //         return false to prevent default slider action
	}

## Methods

	getValue()       returns current slider value
	getIndex()       returns current slider index (0-based index in values array)
	setValue(value)  set slider to value
	setIndex(index)  set slider to 0-based index in values array
	toggle()         toggle slider position (for binary values)
	next(n)          move slider forward n positions (default n=1)
	prev(n)          move slider backward n positions (default n=1)
	first()          move slider to first position
	last()           move slider to last position
	disable()        disable user interaction with slider
	enable()         re-enabled user interaction with slider
	destroy()        removed added DOM elements and events from original markup
				  (useful for reusing a given slider markup)

## Properties

Some useful object properties include:

**Elements**

	this.wrapper      the main slider element node (#sliderDiv)
	this.thumb        thumb element node
	this.labelsDiv    container for the slider labels (if have labels)
	this.$value       container to show value (if any, see valueSelector option)

**Variables**

	this.options      user-selected + default options
	this.value        current value of slider
	this.valueIndex   current index in values array
	this.percent      current percent (0-100%) of slider position
	this.values       array of values

## Utility

	sliderControl.options.defaults

		* can be used to change default options for all new control objects.

	sliderControl.range(start,end,step)

		* can be used to generate a range of values

# Single Value Slider

A special case of the slider is the single value slider. This mimics iPhone's 'slide to unlock' functionality.

Usage:

	mySlider = new slideToAction('#slider6', ['slide to unlock'], {
	 onchange: function(){
	   alert('unlocked');
	 },
	 //thumbLabel : '-->' // optional label for thumb element
	 });

Sliding to the end fires the onchange() event.  So it's important to set it to do the proper action.

The spotlight animation works on Safari 4.x & Chrome 4.x which support animation of the -webkit-mask-position property.
It isn't supported on iPhone OS 3.1.2 browser.  Works fine  on iOS 4.x!

## License

Released under MIT license.  Free to use.