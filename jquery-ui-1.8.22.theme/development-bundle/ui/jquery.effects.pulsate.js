/*!
 * jQuery UI Effects Pulsate 1.8.22
 *
 * Copyright 2012, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Effects/Pulsate
 *
 * Depends:
 *	jquery.effects.core.js
 */
((($, undefined) => {

$.effects.pulsate = function(o) {
	return this.queue(function() {
        var elem = $(this);
        var mode = $.effects.setMode(elem, o.options.mode || 'show');
        var times = ((o.options.times || 5) * 2) - 1;
        var duration = o.duration ? o.duration / 2 : $.fx.speeds._default / 2;
        var isVisible = elem.is(':visible');
        var animateTo = 0;

        if (!isVisible) {
			elem.css('opacity', 0).show();
			animateTo = 1;
		}

        if ((mode == 'hide' && isVisible) || (mode == 'show' && !isVisible)) {
			times--;
		}

        for (var i = 0; i < times; i++) {
			elem.animate({ opacity: animateTo }, duration, o.options.easing);
			animateTo = (animateTo + 1) % 2;
		}

        elem.animate({ opacity: animateTo }, duration, o.options.easing, function(...args) {
			if (animateTo == 0) {
				elem.hide();
			}
			(o.callback && o.callback.apply(this, args));
		});

        elem
			.queue('fx', () => { elem.dequeue(); })
			.dequeue();
    });
};

}))(jQuery);
