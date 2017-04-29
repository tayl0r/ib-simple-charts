/*!
 * jQuery UI Effects Transfer 1.8.22
 *
 * Copyright 2012, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Effects/Transfer
 *
 * Depends:
 *	jquery.effects.core.js
 */
((($, undefined) => {

$.effects.transfer = function(o) {
	return this.queue(function() {
        var elem = $(this);
        var target = $(o.options.to);
        var endPosition = target.offset();

        var animation = {
            top: endPosition.top,
            left: endPosition.left,
            height: target.innerHeight(),
            width: target.innerWidth()
        };

        var startPosition = elem.offset();

        var transfer = $('<div class="ui-effects-transfer"></div>')
            .appendTo(document.body)
            .addClass(o.options.className)
            .css({
                top: startPosition.top,
                left: startPosition.left,
                height: elem.innerHeight(),
                width: elem.innerWidth(),
                position: 'absolute'
            })
            .animate(animation, o.duration, o.options.easing, function(...args) {
                transfer.remove();
                (o.callback && o.callback.apply(elem[0], args));
                elem.dequeue();
            });
    });
};

}))(jQuery);
