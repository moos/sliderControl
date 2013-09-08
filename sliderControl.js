/*!
* sliderControl
*
*     touch slider input control for mobile WebKit
*     (also works on desktop webkit browsers for testing/dev purposes)
*
* Copyright (c) 2011
* http://42at.com/lab/sliderControl
* Released under MIT license
*
* Version 0.3 - Last updated: 2013.08.01
*/

/**
* sliderControl:
* @param {String} el -- selector of slider div
* @param {Mixed} args -- <none> | max | min,max | min,max,step | values[]
* @param {Object} options -- hash of options
* @usage:
* 		new sliderControl('#sliderDiv');
*
* 				default slider with values 0-100
*
* 		new sliderControl('#sliderDiv', 10)		// max
* 		new sliderControl('#sliderDiv', 1,10)	// min,max
* 		new sliderControl('#sliderDiv', 1,10,1)	// min,max,step
*
* 				slider with values 1-10, step 1
*
* 		new sliderControl('#sliderDiv', ['a','b','c'], {easingDuration: 100})
*
*  				slider with values ['a','b','c'] and modified easing Duration (ms)
*
* 		new sliderControl('#sliderDiv', function(index){ ... })
*
* 				values are determined by return value of function
*
*  NOTE: slider element (and it's parents!) must be visible (display != 'none')
*  to get proper dimensions
*
*
*  CHANGES:
*
* Version 0.1 - 2010.01.20
* 	- initial version
*
* Version 0.1a - 2010.03.11
* 	- updated slideToAction look & feel
*
* Version 0.2 - 2011.03.11
* 	- fixed thumb width/styling for iOS > 4.0
*
* Version 0.3 - 2013.08.01
*   - fixed touch vs. mouse events (support for both)
*/

;(function(){

// expose!!
window.sliderControl = sliderControl;
window.slideToAction = slideToAction;

sliderControl.version = slideToAction.version = '0.3';

var
  disableMouse = false,
  moveEventName, endEventName;


function sliderControl (el, args, options){

  var self = this,
    opt = options || {},
    l = arguments.length;

  this.valuesFnc = null;

    // (el, [])
  if (args instanceof Array) {
    this.values = args;
  // (el,10,options) ==> 1->10, step=1
  // (el,1,10)

  // (el,1,10,1,options)
  } else if ( l > 4) {
    opt = arguments[4];
    this.values = range(arguments[1], arguments[2], arguments[3]);
  // (el,1,10,1)
  // (el,1,10,options)
  } else if (l == 4) {
    opt = typeof arguments[3] == 'object' ? arguments[3] : null;
    this.values = range(arguments[1], arguments[2], opt?1:arguments[3]);
  // (el,1,10)
  // (el,10,options)
  } else if (l == 3) {
    opt = typeof arguments[2] == 'object' ? arguments[2] : null;
    if (opt) {
      //this.values = range(1, arguments[1], 1);
      if (typeof arguments[1] != 'function')
        this.values = range(1, arguments[1], 1);
      else {
        this.valuesFnc = arguments[1];
        this.values = range(0, 100, 1);
      }
    }
    else
      this.values = range(arguments[1], arguments[2], 1);
  // (el,10)
  // (el,options)
  } else if (l == 2) {
    opt = typeof arguments[1] == 'object' ? arguments[1] : null;
    if (opt || typeof arguments[1] == 'function')
      this.values = range(0, 100, 1);
    else {
      if (typeof arguments[1] != 'function')
        this.values = range(1, arguments[1], 1);
      else
        this.valuesFnc = arguments[1];
    }
  } else
    this.values =  range(0, 100, 1);

  // parse options
  this.options = opt || {};
    for (var key in sliderControl.options.defaults) {
      if (this.options[key] === undefined)
        this.options[key] = sliderControl.options.defaults[key];
    }

    // split hints on | if string
    if (this.options.hints && typeof this.options.hints == 'string'){
      this.options.hints = this.options.hints.split('|');
    }

  this.wrapper = document.querySelector(el);
  this.thumb = null; //this.wrapper.querySelector(this.options.thumbSelector);
  this.$value = document.querySelector(this.options.valueSelector);
  this.labelsDiv = null;

  this.valueIndex = 0;
  this.startIndex = -1;
  this.moving = false;
  this.value = this.values ? this.values[this.valueIndex] : null;
  this.percent = 0;

  if (!this.thumb) {// add thumb
    var thumb = document.createElement('div');
    thumb.className = this.options.thumbClass;
    this.thumb = this.wrapper.appendChild(thumb);
  }

  // apply slider CSS
  this.wrapper.className += ' ' + this.options.sliderClass;
  for(var s in this.options.sliderCss) {
    this.wrapper.style[s] = this.options.sliderCss[s];
  }

  // apply thumb CSS
  for(var s in this.options.thumbCss) {
    this.thumb.style[s] = this.options.thumbCss[s];
  }

  // Init transform
  this.thumb.webkitTransitionProperty = '-webkit-transform';
  this.thumb.style.webkitTransitionTimingFunction = this.options.easing;
  this.thumb.style.webkitTransform = 'translate3d(0, 0, 0)';

  // listen to both touch & mouse, then disable one!
  this.thumb.addEventListener('touchstart', this, true);
  this.thumb.addEventListener('mousedown', this, true);
  this.numberOfTouches = 1;

  if (this.options.labels) makeLabels(this);

  if (this.options.slideToClick || this.options.enableToggle)
    this.wrapper.addEventListener('click', this, true);

  if (typeof window.orientation != 'undefined')
    document.body.addEventListener('orientationchange', this, true);

  this.refresh();
  if (typeof this.options.initialValue != 'undefined'){
    if (this.options.initialValue !== null) {
      this.valueIndex = -1;
      this.setValue(this.options.initialValue);
    }
  }
  else
    this.setIndex(0);

  if (this.options.disabled)
    this.disable();
}

sliderControl.options = {
  defaults:{
    // functionality
    easing			: 'ease-out',
    easingDuration	: 150,
    labels			: false,	// show labels within slider: true/false, labels[], or "|" separated string
    slideToClick	: true,		// slide to clicks anywhere on slider
    enableSnap 		: true,		// snap to value after user finishes sliding
    enableToggle	: false,	// for binary states, click on thumb
    hints			: null,		// text message to show in place of value, null or hints[]
    //initialValue	: null,		// set initial value or null to not set it (if undefined, set to index 0)
    disabled		: false,	// initial disable/enable state

    // styling
    valueSelector	: '.sliderValue',	// selector for place to show value on slide
    sliderClass		: 'slider',			// CSS class for thumb
    thumbClass		: 'sliderThumb',	// CSS class for thumb
    labelClass		: 'sliderLabel',	// CSS class for labels
    selectedClass	: 'selected',		// CSS class for the selected value
    labelsDivClass	: 'sliderLabelsDiv',// CSS class for styling the labels DIV
    disabledClass	: 'sliderDisabled',	// CSS class for a disabled slider
    sliderCss		: {},				// runtime CSS attributes for slider
    thumbCss		: {},				// runtime CSS attributes for thumb
    labelWidthAdjust: 1,				// adjust to make labels fit if styling changes (border, etc.)

    // event callbacks
    onslidebegin	: null,		// called once on slide begin (manual only)
    onslide			: null,		// called while user is sliding or just once if slide programmatically.
                  //		args:
                  //		delta - pixels moved since last call
                  //		changed - true/false if the value has changed
    onslideend		: null,		// called after the slide (transition) ends
    onchange		: null,		// called once at end of slide if the value has changed.
                  // 		this.value is the new value
    onclick			: null,		// called if user clicks on slider (incl. thumb). arg: (event)
                  // 		return false to prevent default slider action
    // ignore me!
    dummy			: null
  }
};

sliderControl.prototype = {

  /* callbacks */

  slide: function(delta, changed){
    if (typeof this.options.onslide == 'function')
      return this.options.onslide.apply(this, arguments);

    if (changed && this.$value)
      this.$value.innerHTML = this.options.hints ? this.options.hints[this.valueIndex] : this.value;
  },

  change: function(){
    if (typeof this.options.onchange == 'function')
      return this.options.onchange.apply(this, arguments);
    //console.log(['change',this.value]);
  },

  slideend: function(){
    if (typeof this.options.onslideend == 'function')
      return this.options.onslideend.apply(this, arguments);
  },

  slidebegin: function(){
    if (typeof this.options.onslidebegin == 'function')
      return this.options.onslidebegin.apply(this, arguments);
  },

  click: function(){
    if (typeof this.options.onclick == 'function')
      return this.options.onclick.apply(this, arguments);
    return true;
  },

  /* operations */

  getValue: function(){
    return this.value;
  },

  getIndex: function(){
    return this.valueIndex;
  },

  setValue: function(value){
    if (typeof value != 'undefined' && this.values) {
      for (var j in this.values) {
        if (value == this.values[j]) {
          this.setIndex(j);
          break;
        }
      }
    }
    return this.value;
  },

  // set 0-based index
  setIndex: function(i){
    if (typeof i != 'undefined' && this.values
      && i >= 0 && i < this.values.length) {
      var percent = this.percentAtIndex(i),
        pos = Math.floor(this.maxSlide * percent/100);
      if (i != this.valueIndex) {
        var oldPos = this.position();
        this.valueIndex = i >> 0;
        this.value = this.values[i];
        this.triggerCallback('slide', pos - oldPos, true);
        this.change();
        // slide end is called after transition
      }
      this.slideTo(percent);
    }
    return this.valueIndex;
  },

  toggle: function(){
    var i = this.valueIndex;
    if (i < this.values.length-1) i++;
    else i=0;
    this.setIndex(i);
    return this.value;
  },

  next: function(n){
    n = typeof n=='undefined' ? 1 : n;
    var i = this.valueIndex,
      imax = this.values.length-1;
    if (i+n > imax || i+n < 0) return null;
    this.setIndex(i+n);
    return this.value;
  },

  prev: function(n){
    n = typeof n=='undefined' ? 1 : n;
    return this.next(-n);
  },

  first: function(){
    this.setIndex(0);
    return this.value;
  },

  last: function(){
    this.setIndex(this.values.length-1);
    return this.value;
  },

  disable: function(){
    this.disabled = true;
    this.wrapper.className += ' ' + this.options.disabledClass;
  },

  enable: function(){
    this.disabled = false;
    this.wrapper.className = this.wrapper.className.replace(new RegExp("\\b"+this.options.disabledClass+"\\b",'g'),'');
  },

  destroy: function(){
    this.destroyLabels();
    if (this.thumb){
      this.thumb.removeEventListener('touchstart', this, true);
      this.thumb.removeEventListener('mousedown', this, true);
      this.wrapper.removeChild(this.thumb);
      this.thumb = null;
    }
    // remove events
    if (this.options.slideToClick || this.options.enableToggle)
      this.wrapper.removeEventListener('click', this, true);
    if (typeof window.orientation != 'undefined')
      document.body.removeEventListener('orientationchange', this, true);
    // remove slider CSS
    for(var s in this.options.sliderCss) {
      this.wrapper.style[s] = '';		// @TODO: safe!
    }
    if (this.$value) this.$value.innerHTML = '';
    this.wrapper = null;
    this.$value = null;
  },

  /* internal */

  percentAtIndex: function(i){
    if (!this.values) return 0;
    var n = this.values.length;
    var p = Math.floor(i * (100/(n-1 || 1)));
    return p;
  },

  indexFromPos: function(p){
    if (!this.values) return 0;
    if (p<0) p=0;
    var n = this.values.length;
    var i = Math.round((n-1) * p / this.maxSlide);
    return i;
  },

  triggerCallback: function(callbackName /*, args */ ) {
    var that = this,
      args = [].slice.call(arguments);
    args.shift(); // drop callback name
    setTimeout(function(){
      that[callbackName].apply(that, args);
    },0);
  },

  handleEvent: function (e) {
//    console.log(['handle event', e.type]);
    if (this.disabled) return;
    if (disableMouse && e.type.indexOf('mouse') == 0) return;
    switch (e.type) {
      case 'touchstart':
      case 'mousedown':
        disableMouse = e.type === 'touchstart';
        this.onTouchStart(e);
        break;
      case 'touchmove':
      case 'mousemove':
        this.onTouchMove(e);
        break;
      case 'touchend':
      case 'mouseup':
        this.onTouchEnd(e);
        break;
      case 'click':
        // call user click handler first
        if (!this.click(e)) return;

        if (!this.moving && this.options.slideToClick && e.target != this.thumb)
          this.onClick(e);
        else if (this.options.enableToggle)
          this.toggleOnClick(e);
        this.moving = false;
        break;
      case 'orientationchange':
        this.onOrientation(e);
        break;
      case 'webkitTransitionEnd':
        this.onTransitionEnd(e);
        break;
    }
  },

  position: function (pos) {
    if (typeof pos != 'undefined'){
      this._position = pos;
      this.percent = Math.floor(pos / this.maxSlide * 100);
      this.thumb.style.webkitTransform = 'translate3d(' + pos + 'px, 0, 0)';
    }
    return this._position;
  },

  refresh: function() {
    this.thumb.style.webkitTransitionDuration = '0';
    this.wrapperWidth = this.wrapper.clientWidth;
    this.maxSlide = this.wrapper.clientWidth
              - this.thumb.offsetWidth
              - parseInt(getComputedStyle(this.wrapper,null).getPropertyValue('padding-left'))
              - parseInt(getComputedStyle(this.wrapper,null).getPropertyValue('padding-right'));
    //console.log(['min' , this.maxSlide]);
  },

  onClick: function(e) {
    var x =  e.clientX;
    x -= this.wrapper.offsetLeft + this.thumb.offsetWidth/2 ;
    var i = this.indexFromPos(x);
    this.startIndex = this.valueIndex;
    //console.log(['click', x,i, this.valueIndex]);
    if (i != this.valueIndex)
      this.setIndex(i);
  },

  toggleOnClick: function(e) {
    //console.log(['bbb', this.moving, e.target.className,  this.thumb.className]);
    if (this.moving || e.target != this.thumb) return false;
    this.toggle();
  },

  destroyLabels: function() {
    if (!this.labelsDiv) return;
    var d = this.labelsDiv;
    while (d.firstChild) {
      d.removeChild(d.firstChild);
    }
    d.parentNode.removeChild(d);
  },

  onOrientation: function(e) {
    // remake labels if wrapper size changed
    if (this.wrapperWidth != this.wrapper.clientWidth) {
      this.destroyLabels();
      makeLabels(this);
      this.setIndex(this.valueIndex);
    } else
      this.refresh();
  },

  onTouchStart: function(e) {
    moveEventName = disableMouse ? 'touchmove' : 'mousemove',
    endEventName = disableMouse ? 'touchend' : 'mouseup';

    if (e.targetTouches && e.targetTouches.length != this.numberOfTouches )
      return;

    //e.preventDefault(); // no preventDefault to allow clicks on thumb
    this.moving = false;
    if (this.values)
      this.startIndex = this.valueIndex;

    this.startX = e.targetTouches ? e.targetTouches[0].clientX : e.clientX;
    this.thumb.addEventListener(moveEventName, this, false);
    this.thumb.addEventListener(endEventName, this, false);
    this.triggerCallback('slidebegin');
    return false;
  },

  onTouchMove: function(e) {
    if (e.targetTouches && e.targetTouches.length != this.numberOfTouches )
      return;
    e.preventDefault();
    var x =  e.targetTouches ? e.targetTouches[0].clientX : e.clientX;
    var theTransform = window.getComputedStyle(this.thumb, null).webkitTransform;
    theTransform = new WebKitCSSMatrix(theTransform).m41;

    var delta =  x - this.startX;
    if (delta == 0
      || (theTransform < 0 && delta < 0)
      || (theTransform > this.maxSlide && delta > 0)
      ) return false;
    this.moving = true;
    var pos = this.position(),
      newPos = Math.min(this.maxSlide, Math.max(pos + delta, 0));
    this.position(newPos);
    this.startX = x;
    var changed = true;
    if (this.values) {
      var i = this.indexFromPos(newPos);
      if ((changed = i != this.valueIndex)) {
        this.value = this.valuesFnc ? this.valuesFnc(i) : this.values[i];
        this.valueIndex = i;
      }
    }
    this.triggerCallback('slide', delta, changed);
    return false;
  },

  onTouchEnd: function(e) {
    //e.preventDefault(); // no preventDefault to allow clicks on thumb
    this.thumb.removeEventListener(moveEventName, this, false);
    this.thumb.removeEventListener(endEventName, this, false);

    var that = this;
    if (this.valueIndex != this.startIndex
      || (this.values.length == 1 && this.percent > 99)
      ) {
      this.triggerCallback('change');
    }

    // callback here if moved & no transition
    if (this.moving && (!this.options.enableSnap || this.options.easingDuration == 0)) {
      this.triggerCallback('slideend');
    }
    if (!this.moving || !this.options.enableSnap) {
      this.updateSelected();
    }
    else {
      var pos = this.position();
      if (this.values) {
        var i = this.indexFromPos(pos);
        var p = this.percentAtIndex(i);
        this.slideTo(p);
      }
    }
    return false;
  },

  onTransitionEnd: function() {
    this.thumb.style.webkitTransitionDuration = '0';
    this.thumb.removeEventListener('webkitTransitionEnd', this, false);
    this.triggerCallback('slideend');
  },

  slideTo: function(percent) {
    this.thumb.style.webkitTransitionTimingFunction = this.options.easing;
    this.thumb.style.webkitTransitionDuration = this.options.easingDuration + 'ms';
    this.thumb.addEventListener('webkitTransitionEnd', this, false);

    var pos = Math.floor(this.maxSlide * percent / 100);
    this.position(pos);
    this.updateSelected();
    return;
  },

  updateSelected: function(){
    // change selected class
    if (this.startIndex != this.valueIndex && this.options.selectedClass && this.labelsDiv) {
      var sel = this.labelsDiv.querySelector('.'+this.options.selectedClass);
      if (sel) sel.className = sel.className.replace(new RegExp("\\b"+this.options.selectedClass+"\\b",'g'),'');
      if (this.labelsDiv.childNodes.length > this.valueIndex)
        this.labelsDiv.childNodes[this.valueIndex].className += ' ' +this.options.selectedClass;
    }
  }

};

// returns [start,end] (inclusive) range
sliderControl.range = range; // expose!
function range(start, end, step) {
  var l = arguments.length;
  if (l == 0) return [];
  if (l == 1) return arguments.callee(0, start, 1);
  if (l == 2) return arguments.callee(start, end, 1);
  var temp = [];
  if (step == 0) return [];
  if ((start <= end && step < 0) || (start >= end && step > 0)){
    step = -step;
  }
  var n=-1;
  // correct for Javascript float precision error
  var floaty = step.toString().indexOf('.');
  if (floaty != -1) {
    n = step.toString().length - (1 + floaty);
    floaty = true;
  }
  else {
    start >>= 0; end >>=0; step >>=0; // make int
    floaty = false;
  }

  for (; step > 0 ? start <= end : start >= end; start += step) {
    temp.push(floaty ? parseFloat(start.toFixed(n)) : start);
  }
  return temp;
}

function makeLabels(self){
  var labels = self.options.labels;
  switch (typeof labels) {
    case 'boolean':
    case 'number':
      labels = self.values;
      break;
    case 'string':
      labels = labels.split(/\|/);
      if (labels.length != self.values.length) {
        // repeat pattern
        labels = new Array(self.values.length+1).join(labels+'\u0000').split('\u0000', self.values.length);
      }
      break;
  }
  if (!labels.length) return;

  // create a div to hold the labels
  var div = document.createElement('div');
  div.className = self.options.labelsDivClass;
  self.labelsDiv = self.wrapper.appendChild(div);

  var str = '',
    n = self.values.length > 1 ? self.values.length : labels.length,
    w = Math.floor(self.wrapper.clientWidth / self.values.length)
        - /* label border with */ self.options.labelWidthAdjust;

  // adjust width of thumb to fit labels
  if (self.values.length > 1) self.thumb.style.width = w+'px';
  self.refresh();

  // create the labels html (faster!)
  for (var j in labels) {
    str += '<span class="'+self.options.labelClass+'" style="width:'+ w +'px;">'+ labels[j] +'</span>';
  }
  self.labelsDiv.innerHTML = str;
}

/**
 * single value slider
 * sliding to end will cause change event
 * mimics iPhones 'slide to unluck' behavior
 */
function slideToAction (el, text, opt){
  var options = {
    labels: true,
    selectedClass : '',
    sliderClass: 'sliderAction',
    thumbCss : {width:'60px'},
    onslide: function(delta){
      var el = this.labelsDiv;
      el.style.webkitTransitionProperty = 'opacity';
      el.style.webkitTransitionDuration = '50ms';
      el.style.opacity = Math.max(0,1 - this.percent/50);
    },
    onchange: function(){
      alert('override onchange callback to do something semi-useful!');
    },
    onslideend: function(){
      var el = this.labelsDiv;
      el.style.opacity = 1;
    },
    thumbLabel:  ''  // '\u21E8'
  };
  for (var i in opt){
    options[i] = opt[i];
  }
  var slider = new sliderControl(el, [text], options);
  slider.thumb.innerHTML = options.thumbLabel;
  return slider;
};


})();
