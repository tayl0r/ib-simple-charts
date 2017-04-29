/*!
 * jQuery UI Effects Fade 1.8.22
 *
 * Copyright 2012, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Effects/Fade
 *
 * Depends:
 *	jquery.effects.core.js
 */
((($, undefined) => {

$.effects.fade = function(o) {
	return this.queue(function() {
        var elem = $(this);
        var mode = $.effects.setMode(elem, o.options.mode || 'hide');

        elem.animate({ opacity: mode }, {
			queue: false,
			duration: o.duration,
			easing: o.options.easing,
			complete(...args) {
				(o.callback && o.callback.apply(this, args));
				elem.dequeue();
			}
		});
    });
};

}))(jQuery);
