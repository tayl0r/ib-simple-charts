/*!
 * jQuery UI Effects 1.8.22
 *
 * Copyright 2012, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Effects/
 */
;jQuery.effects || ((($, undefined) => {
    $.effects = {};



    /******************************************************************************/
    /****************************** COLOR ANIMATIONS ******************************/
    /******************************************************************************/

    // override the animation for color styles
    $.each(['backgroundColor', 'borderBottomColor', 'borderLeftColor',
        'borderRightColor', 'borderTopColor', 'borderColor', 'color', 'outlineColor'],
    (i, attr) => {
        $.fx.step[attr] = fx => {
            if (!fx.colorInit) {
                fx.start = getColor(fx.elem, attr);
                fx.end = getRGB(fx.end);
                fx.colorInit = true;
            }

            fx.elem.style[attr] = 'rgb(' +
                Math.max(Math.min(parseInt((fx.pos * (fx.end[0] - fx.start[0])) + fx.start[0], 10), 255), 0) + ',' +
                Math.max(Math.min(parseInt((fx.pos * (fx.end[1] - fx.start[1])) + fx.start[1], 10), 255), 0) + ',' +
                Math.max(Math.min(parseInt((fx.pos * (fx.end[2] - fx.start[2])) + fx.start[2], 10), 255), 0) + ')';
        };
    });

    // Color Conversion functions from highlightFade
    // By Blair Mitchelmore
    // http://jquery.offput.ca/highlightFade/

    // Parse strings looking for color tuples [255,255,255]
    function getRGB(color) {
            var result;

            // Check if we're already dealing with an array of colors
            if ( color && color.constructor == Array && color.length == 3 )
                    return color;

            // Look for rgb(num,num,num)
            if (result = /rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(color))
                    return [parseInt(result[1],10), parseInt(result[2],10), parseInt(result[3],10)];

            // Look for rgb(num%,num%,num%)
            if (result = /rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)/.exec(color))
                    return [parseFloat(result[1])*2.55, parseFloat(result[2])*2.55, parseFloat(result[3])*2.55];

            // Look for #a0b1c2
            if (result = /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(color))
                    return [parseInt(result[1],16), parseInt(result[2],16), parseInt(result[3],16)];

            // Look for #fff
            if (result = /#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(color))
                    return [parseInt(result[1]+result[1],16), parseInt(result[2]+result[2],16), parseInt(result[3]+result[3],16)];

            // Look for rgba(0, 0, 0, 0) == transparent in Safari 3
            if (result = /rgba\(0, 0, 0, 0\)/.exec(color))
                    return colors['transparent'];

            // Otherwise, we're most likely dealing with a named color
            return colors[$.trim(color).toLowerCase()];
    }

    function getColor(elem, attr) {
            var color;

            do {
                    // jQuery <1.4.3 uses curCSS, in 1.4.3 - 1.7.2 curCSS = css, 1.8+ only has css
                    color = ($.curCSS || $.css)(elem, attr);

                    // Keep going until we find an element that has color, or we hit the body
                    if ( color != '' && color != 'transparent' || $.nodeName(elem, "body") )
                            break;

                    attr = "backgroundColor";
            } while ( elem = elem.parentNode );

            return getRGB(color);
    }

    // Some named colors to work with
    // From Interface by Stefan Petre
    // http://interface.eyecon.ro/

    var colors = {
        aqua:[0,255,255],
        azure:[240,255,255],
        beige:[245,245,220],
        black:[0,0,0],
        blue:[0,0,255],
        brown:[165,42,42],
        cyan:[0,255,255],
        darkblue:[0,0,139],
        darkcyan:[0,139,139],
        darkgrey:[169,169,169],
        darkgreen:[0,100,0],
        darkkhaki:[189,183,107],
        darkmagenta:[139,0,139],
        darkolivegreen:[85,107,47],
        darkorange:[255,140,0],
        darkorchid:[153,50,204],
        darkred:[139,0,0],
        darksalmon:[233,150,122],
        darkviolet:[148,0,211],
        fuchsia:[255,0,255],
        gold:[255,215,0],
        green:[0,128,0],
        indigo:[75,0,130],
        khaki:[240,230,140],
        lightblue:[173,216,230],
        lightcyan:[224,255,255],
        lightgreen:[144,238,144],
        lightgrey:[211,211,211],
        lightpink:[255,182,193],
        lightyellow:[255,255,224],
        lime:[0,255,0],
        magenta:[255,0,255],
        maroon:[128,0,0],
        navy:[0,0,128],
        olive:[128,128,0],
        orange:[255,165,0],
        pink:[255,192,203],
        purple:[128,0,128],
        violet:[128,0,128],
        red:[255,0,0],
        silver:[192,192,192],
        white:[255,255,255],
        yellow:[255,255,0],
        transparent: [255,255,255]
    };



    /******************************************************************************/
    /****************************** CLASS ANIMATIONS ******************************/
    /******************************************************************************/

    var classAnimationActions = ['add', 'remove', 'toggle'];

    var shorthandStyles = {
		border: 1,
		borderBottom: 1,
		borderColor: 1,
		borderLeft: 1,
		borderRight: 1,
		borderTop: 1,
		borderWidth: 1,
		margin: 1,
		padding: 1
	};

    function getElementStyles() {
        var style = document.defaultView
                ? document.defaultView.getComputedStyle(this, null)
                : this.currentStyle;

        var newStyle = {};
        var key;
        var camelCase;

        // webkit enumerates style porperties
        if (style && style.length && style[0] && style[style[0]]) {
            var len = style.length;
            while (len--) {
                key = style[len];
                if (typeof style[key] == 'string') {
                    camelCase = key.replace(/\-(\w)/g, (all, letter) => letter.toUpperCase());
                    newStyle[camelCase] = style[key];
                }
            }
        } else {
            for (key in style) {
                if (typeof style[key] === 'string') {
                    newStyle[key] = style[key];
                }
            }
        }

        return newStyle;
    }

    function filterStyles(styles) {
        var name;
        var value;
        for (name in styles) {
            value = styles[name];
            if (
                // ignore null and undefined values
                value == null ||
                // ignore functions (when does this occur?)
                $.isFunction(value) ||
                // shorthand styles that need to be expanded
                name in shorthandStyles ||
                // ignore scrollbars (break in IE)
                (/scrollbar/).test(name) ||

                // only colors or values that can be converted to numbers
                (!(/color/i).test(name) && isNaN(parseFloat(value)))
            ) {
                delete styles[name];
            }
        }

        return styles;
    }

    function styleDifference(oldStyle, newStyle) {
        var // http://dev.jquery.com/ticket/5459
        diff = { _: 0 };

        var name;

        for (name in newStyle) {
            if (oldStyle[name] != newStyle[name]) {
                diff[name] = newStyle[name];
            }
        }

        return diff;
    }

    $.effects.animateClass = function(value, duration, easing, callback) {
        if ($.isFunction(easing)) {
            callback = easing;
            easing = null;
        }

        return this.queue(function() {
            var that = $(this);
            var originalStyleAttr = that.attr('style') || ' ';
            var originalStyle = filterStyles(getElementStyles.call(this));
            var newStyle;
            var className = that.attr('class') || "";

            $.each(classAnimationActions, (i, action) => {
                if (value[action]) {
                    that[action + 'Class'](value[action]);
                }
            });
            newStyle = filterStyles(getElementStyles.call(this));
            that.attr('class', className);

            that.animate(styleDifference(originalStyle, newStyle), {
                queue: false,
                duration,
                easing,
                complete(...args) {
                    $.each(classAnimationActions, (i, action) => {
                        if (value[action]) { that[action + 'Class'](value[action]); }
                    });
                    // work around bug in IE by clearing the cssText before setting it
                    if (typeof that.attr('style') == 'object') {
                        that.attr('style').cssText = '';
                        that.attr('style').cssText = originalStyleAttr;
                    } else {
                        that.attr('style', originalStyleAttr);
                    }
                    if (callback) { callback.apply(this, args); }
                    $.dequeue( this );
                }
            });
        });
    };

    $.fn.extend({
        _addClass: $.fn.addClass,
        addClass(classNames, speed, easing, callback) {
            return speed ? $.effects.animateClass.apply(this, [{ add: classNames },speed,easing,callback]) : this._addClass(classNames);
        },

        _removeClass: $.fn.removeClass,
        removeClass(classNames, speed, easing, callback) {
            return speed ? $.effects.animateClass.apply(this, [{ remove: classNames },speed,easing,callback]) : this._removeClass(classNames);
        },

        _toggleClass: $.fn.toggleClass,
        toggleClass(classNames, force, speed, easing, callback) {
            if ( typeof force == "boolean" || force === undefined ) {
                if ( !speed ) {
                    // without speed parameter;
                    return this._toggleClass(classNames, force);
                } else {
                    return $.effects.animateClass.apply(this, [(force?{add:classNames}:{remove:classNames}),speed,easing,callback]);
                }
            } else {
                // without switch parameter;
                return $.effects.animateClass.apply(this, [{ toggle: classNames },force,speed,easing]);
            }
        },

        switchClass(remove, add, speed, easing, callback) {
            return $.effects.animateClass.apply(this, [{ add, remove },speed,easing,callback]);
        }
    });



    /******************************************************************************/
    /*********************************** EFFECTS **********************************/
    /******************************************************************************/

    $.extend($.effects, {
        version: "1.8.22",

        // Saves a set of properties in a data storage
        save(element, set) {
            for(var i=0; i < set.length; i++) {
                if(set[i] !== null) element.data("ec.storage."+set[i], element[0].style[set[i]]);
            }
        },

        // Restores a set of previously saved properties from a data storage
        restore(element, set) {
            for(var i=0; i < set.length; i++) {
                if(set[i] !== null) element.css(set[i], element.data("ec.storage."+set[i]));
            }
        },

        setMode(el, mode) {
            if (mode == 'toggle') mode = el.is(':hidden') ? 'show' : 'hide'; // Set for toggle
            return mode;
        },

        getBaseline(origin, original) {
            // Translates a [top,left] array into a baseline value
            // this should be a little more flexible in the future to handle a string & hash
            var y;

            var x;
            switch (origin[0]) {
                case 'top': y = 0; break;
                case 'middle': y = 0.5; break;
                case 'bottom': y = 1; break;
                default: y = origin[0] / original.height;
            }
            switch (origin[1]) {
                case 'left': x = 0; break;
                case 'center': x = 0.5; break;
                case 'right': x = 1; break;
                default: x = origin[1] / original.width;
            }
            return {x, y};
        },

        // Wraps the element around a wrapper that copies position properties
        createWrapper(element) {
            // if the element is already wrapped, return it
            if (element.parent().is('.ui-effects-wrapper')) {
                return element.parent();
            }

            // wrap the element
            var props = {
                    width: element.outerWidth(true),
                    height: element.outerHeight(true),
                    'float': element.css('float')
                };

            var wrapper = $('<div></div>')
				.addClass('ui-effects-wrapper')
				.css({
					fontSize: '100%',
					background: 'transparent',
					border: 'none',
					margin: 0,
					padding: 0
				});

            var active = document.activeElement;

            // support: Firefox
            // Firefox incorrectly exposes anonymous content
            // https://bugzilla.mozilla.org/show_bug.cgi?id=561664
            try {
                active.id;
            } catch( e ) {
                active = document.body;
            }

            element.wrap( wrapper );

            // Fixes #7595 - Elements lose focus when wrapped.
            if ( element[ 0 ] === active || $.contains( element[ 0 ], active ) ) {
                $( active ).focus();
            }

            wrapper = element.parent(); //Hotfix for jQuery 1.4 since some change in wrap() seems to actually loose the reference to the wrapped element

            // transfer positioning properties to the wrapper
            if (element.css('position') == 'static') {
                wrapper.css({ position: 'relative' });
                element.css({ position: 'relative' });
            } else {
                $.extend(props, {
                    position: element.css('position'),
                    zIndex: element.css('z-index')
                });
                $.each(['top', 'left', 'bottom', 'right'], (i, pos) => {
                    props[pos] = element.css(pos);
                    if (isNaN(parseInt(props[pos], 10))) {
                        props[pos] = 'auto';
                    }
                });
                element.css({position: 'relative', top: 0, left: 0, right: 'auto', bottom: 'auto' });
            }

            return wrapper.css(props).show();
        },

        removeWrapper(element) {
            var parent;
            var active = document.activeElement;

            if (element.parent().is('.ui-effects-wrapper')) {
                parent = element.parent().replaceWith(element);
                // Fixes #7595 - Elements lose focus when wrapped.
                if ( element[ 0 ] === active || $.contains( element[ 0 ], active ) ) {
                    $( active ).focus();
                }
                return parent;
            }

            return element;
        },

        setTransition(element, list, factor, value) {
            value = value || {};
            $.each(list, (i, x) => {
                var unit = element.cssUnit(x);
                if (unit[0] > 0) value[x] = unit[0] * factor + unit[1];
            });
            return value;
        }
    });


    function _normalizeArguments(effect, options, speed, callback) {
        // shift params for method overloading
        if (typeof effect == 'object') {
            callback = options;
            speed = null;
            options = effect;
            effect = options.effect;
        }
        if ($.isFunction(options)) {
            callback = options;
            speed = null;
            options = {};
        }
            if (typeof options == 'number' || $.fx.speeds[options]) {
            callback = speed;
            speed = options;
            options = {};
        }
        if ($.isFunction(speed)) {
            callback = speed;
            speed = null;
        }

        options = options || {};

        speed = speed || options.duration;
        speed = $.fx.off ? 0 : typeof speed == 'number'
            ? speed : speed in $.fx.speeds ? $.fx.speeds[speed] : $.fx.speeds._default;

        callback = callback || options.complete;

        return [effect, options, speed, callback];
    }

    function standardSpeed( speed ) {
        // valid standard speeds
        if ( !speed || typeof speed === "number" || $.fx.speeds[ speed ] ) {
            return true;
        }
        
        // invalid strings - treat as "normal" speed
        if ( typeof speed === "string" && !$.effects[ speed ] ) {
            return true;
        }
        
        return false;
    }

    $.fn.extend({
        effect(effect, options, speed, callback) {
            var args = _normalizeArguments.apply(this, arguments);

            var // TODO: make effects take actual parameters instead of a hash
            args2 = {
				options: args[1],
				duration: args[2],
				callback: args[3]
			};

            var mode = args2.options.mode;
            var effectMethod = $.effects[effect];

            if ( $.fx.off || !effectMethod ) {
                // delegate to the original method (e.g., .show()) if possible
                if ( mode ) {
                    return this[ mode ]( args2.duration, args2.callback );
                } else {
                    return this.each(function() {
                        if ( args2.callback ) {
                            args2.callback.call( this );
                        }
                    });
                }
            }

            return effectMethod.call(this, args2);
        },

        _show: $.fn.show,
        show(speed) {
            if ( standardSpeed( speed ) ) {
                return this._show(...arguments);
            } else {
                var args = _normalizeArguments.apply(this, arguments);
                args[1].mode = 'show';
                return this.effect(...args);
            }
        },

        _hide: $.fn.hide,
        hide(speed) {
            if ( standardSpeed( speed ) ) {
                return this._hide(...arguments);
            } else {
                var args = _normalizeArguments.apply(this, arguments);
                args[1].mode = 'hide';
                return this.effect(...args);
            }
        },

        // jQuery core overloads toggle and creates _toggle
        __toggle: $.fn.toggle,
        toggle(speed) {
            if ( standardSpeed( speed ) || typeof speed === "boolean" || $.isFunction( speed ) ) {
                return this.__toggle(...arguments);
            } else {
                var args = _normalizeArguments.apply(this, arguments);
                args[1].mode = 'toggle';
                return this.effect(...args);
            }
        },

        // helper functions
        cssUnit(key) {
            var style = this.css(key);
            var val = [];
            $.each( ['em','px','%','pt'], (i, unit) => {
                if(style.indexOf(unit) > 0)
                    val = [parseFloat(style), unit];
            });
            return val;
        }
    });



    /******************************************************************************/
    /*********************************** EASING ***********************************/
    /******************************************************************************/

    /*
     * jQuery Easing v1.3 - http://gsgd.co.uk/sandbox/jquery/easing/
     *
     * Uses the built in easing capabilities added In jQuery 1.1
     * to offer multiple easing options
     *
     * TERMS OF USE - jQuery Easing
     *
     * Open source under the BSD License.
     *
     * Copyright 2008 George McGinley Smith
     * All rights reserved.
     *
     * Redistribution and use in source and binary forms, with or without modification,
     * are permitted provided that the following conditions are met:
     *
     * Redistributions of source code must retain the above copyright notice, this list of
     * conditions and the following disclaimer.
     * Redistributions in binary form must reproduce the above copyright notice, this list
     * of conditions and the following disclaimer in the documentation and/or other materials
     * provided with the distribution.
     *
     * Neither the name of the author nor the names of contributors may be used to endorse
     * or promote products derived from this software without specific prior written permission.
     *
     * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
     * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
     * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
     * COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
     * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
     * GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED
     * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
     * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
     * OF THE POSSIBILITY OF SUCH DAMAGE.
     *
    */

    // t: current time, b: begInnIng value, c: change In value, d: duration
    $.easing.jswing = $.easing.swing;

    $.extend($.easing,
    {
        def: 'easeOutQuad',
        swing(x, t, b, c, d) {
            //alert($.easing.default);
            return $.easing[$.easing.def](x, t, b, c, d);
        },
        easeInQuad(x, t, b, c, d) {
            return c*(t/=d)*t + b;
        },
        easeOutQuad(x, t, b, c, d) {
            return -c *(t/=d)*(t-2) + b;
        },
        easeInOutQuad(x, t, b, c, d) {
            if ((t/=d/2) < 1) return c/2*t*t + b;
            return -c/2 * ((--t)*(t-2) - 1) + b;
        },
        easeInCubic(x, t, b, c, d) {
            return c*(t/=d)*t*t + b;
        },
        easeOutCubic(x, t, b, c, d) {
            return c*((t=t/d-1)*t*t + 1) + b;
        },
        easeInOutCubic(x, t, b, c, d) {
            if ((t/=d/2) < 1) return c/2*t*t*t + b;
            return c/2*((t-=2)*t*t + 2) + b;
        },
        easeInQuart(x, t, b, c, d) {
            return c*(t/=d)*t*t*t + b;
        },
        easeOutQuart(x, t, b, c, d) {
            return -c * ((t=t/d-1)*t*t*t - 1) + b;
        },
        easeInOutQuart(x, t, b, c, d) {
            if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
            return -c/2 * ((t-=2)*t*t*t - 2) + b;
        },
        easeInQuint(x, t, b, c, d) {
            return c*(t/=d)*t*t*t*t + b;
        },
        easeOutQuint(x, t, b, c, d) {
            return c*((t=t/d-1)*t*t*t*t + 1) + b;
        },
        easeInOutQuint(x, t, b, c, d) {
            if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
            return c/2*((t-=2)*t*t*t*t + 2) + b;
        },
        easeInSine(x, t, b, c, d) {
            return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
        },
        easeOutSine(x, t, b, c, d) {
            return c * Math.sin(t/d * (Math.PI/2)) + b;
        },
        easeInOutSine(x, t, b, c, d) {
            return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
        },
        easeInExpo(x, t, b, c, d) {
            return (t==0) ? b : c * (2 ** (10 * (t/d - 1))) + b;
        },
        easeOutExpo(x, t, b, c, d) {
            return (t==d) ? b+c : c * (-(2 ** (-10 * t / d)) + 1) + b;
        },
        easeInOutExpo(x, t, b, c, d) {
            if (t==0) return b;
            if (t==d) return b+c;
            if ((t/=d/2) < 1) return c/2 * (2 ** (10 * (t - 1))) + b;
            return c/2 * (-(2 ** (-10 * --t)) + 2) + b;
        },
        easeInCirc(x, t, b, c, d) {
            return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
        },
        easeOutCirc(x, t, b, c, d) {
            return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
        },
        easeInOutCirc(x, t, b, c, d) {
            if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
            return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
        },
        easeInElastic(x, t, b, c, d) {
            var s=1.70158;var p=0;var a=c;
            if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
            if (a < Math.abs(c)) { a=c; var s=p/4; }
            else var s = p/(2*Math.PI) * Math.asin (c/a);
            return -(a*(2 ** (10 * (t -= 1))) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
        },
        easeOutElastic(x, t, b, c, d) {
            var s=1.70158;var p=0;var a=c;
            if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
            if (a < Math.abs(c)) { a=c; var s=p/4; }
            else var s = p/(2*Math.PI) * Math.asin (c/a);
            return a*(2 ** (-10 * t)) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
        },
        easeInOutElastic(x, t, b, c, d) {
            var s=1.70158;var p=0;var a=c;
            if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
            if (a < Math.abs(c)) { a=c; var s=p/4; }
            else var s = p/(2*Math.PI) * Math.asin (c/a);
            if (t < 1) return -.5*(a*(2 ** (10 * (t -= 1))) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
            return a*(2 ** (-10 * (t -= 1))) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
        },
        easeInBack(x, t, b, c, d, s) {
            if (s == undefined) s = 1.70158;
            return c*(t/=d)*t*((s+1)*t - s) + b;
        },
        easeOutBack(x, t, b, c, d, s) {
            if (s == undefined) s = 1.70158;
            return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
        },
        easeInOutBack(x, t, b, c, d, s) {
            if (s == undefined) s = 1.70158;
            if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
            return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
        },
        easeInBounce(x, t, b, c, d) {
            return c - $.easing.easeOutBounce (x, d-t, 0, c, d) + b;
        },
        easeOutBounce(x, t, b, c, d) {
            if ((t/=d) < (1/2.75)) {
                return c*(7.5625*t*t) + b;
            } else if (t < (2/2.75)) {
                return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
            } else if (t < (2.5/2.75)) {
                return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
            } else {
                return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
            }
        },
        easeInOutBounce(x, t, b, c, d) {
            if (t < d/2) return $.easing.easeInBounce (x, t*2, 0, c, d) * .5 + b;
            return $.easing.easeOutBounce (x, t*2-d, 0, c, d) * .5 + c*.5 + b;
        }
    });

    /*
     *
     * TERMS OF USE - EASING EQUATIONS
     *
     * Open source under the BSD License.
     *
     * Copyright 2001 Robert Penner
     * All rights reserved.
     *
     * Redistribution and use in source and binary forms, with or without modification,
     * are permitted provided that the following conditions are met:
     *
     * Redistributions of source code must retain the above copyright notice, this list of
     * conditions and the following disclaimer.
     * Redistributions in binary form must reproduce the above copyright notice, this list
     * of conditions and the following disclaimer in the documentation and/or other materials
     * provided with the distribution.
     *
     * Neither the name of the author nor the names of contributors may be used to endorse
     * or promote products derived from this software without specific prior written permission.
     *
     * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
     * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
     * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
     * COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
     * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
     * GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED
     * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
     * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
     * OF THE POSSIBILITY OF SUCH DAMAGE.
     *
     */
}))(jQuery);
