/*!
 * jQuery UI Effects Highlight 1.8.22
 *
 * Copyright 2012, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Effects/Highlight
 *
 * Depends:
 *	jquery.effects.core.js
 */
((($, undefined) => {

$.effects.highlight = function(o) {
	return this.queue(function() {
        var elem = $(this);
        var props = ['backgroundImage', 'backgroundColor', 'opacity'];
        var mode = $.effects.setMode(elem, o.options.mode || 'show');

        var animation = {
            backgroundColor: elem.css('backgroundColor')
        };

        if (mode == 'hide') {
			animation.opacity = 0;
		}

        $.effects.save(elem, props);
        elem
			.show()
			.css({
				backgroundImage: 'none',
				backgroundColor: o.options.color || '#ffff99'
			})
			.animate(animation, {
				queue: false,
				duration: o.duration,
				easing: o.options.easing,
				complete(...args) {
					(mode == 'hide' && elem.hide());
					$.effects.restore(elem, props);
					(mode == 'show' && !$.support.opacity && this.style.removeAttribute('filter'));
					(o.callback && o.callback.apply(this, args));
					elem.dequeue();
				}
			});
    });
};

}))(jQuery);
