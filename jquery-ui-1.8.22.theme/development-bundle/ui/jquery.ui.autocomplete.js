/*!
 * jQuery UI Autocomplete 1.8.22
 *
 * Copyright 2012, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Autocomplete
 *
 * Depends:
 *	jquery.ui.core.js
 *	jquery.ui.widget.js
 *	jquery.ui.position.js
 */
((($, undefined) => {

// used to prevent race conditions with remote data sources
var requestIndex = 0;

$.widget( "ui.autocomplete", {
	options: {
		appendTo: "body",
		autoFocus: false,
		delay: 300,
		minLength: 1,
		position: {
			my: "left top",
			at: "left bottom",
			collision: "none"
		},
		source: null
	},

	pending: 0,

	_create() {
        var self = this;
        var doc = this.element[ 0 ].ownerDocument;
        var suppressKeyPress;
        this.isMultiLine = this.element.is( "textarea" );

        this.element
			.addClass( "ui-autocomplete-input" )
			.attr( "autocomplete", "off" )
			// TODO verify these actually work as intended
			.attr({
				role: "textbox",
				"aria-autocomplete": "list",
				"aria-haspopup": "true"
			})
			.bind( "keydown.autocomplete", event => {
				if ( self.options.disabled || self.element.propAttr( "readOnly" ) ) {
					return;
				}

				suppressKeyPress = false;
				var keyCode = $.ui.keyCode;
				switch( event.keyCode ) {
				case keyCode.PAGE_UP:
					self._move( "previousPage", event );
					break;
				case keyCode.PAGE_DOWN:
					self._move( "nextPage", event );
					break;
				case keyCode.UP:
					self._keyEvent( "previous", event );
					break;
				case keyCode.DOWN:
					self._keyEvent( "next", event );
					break;
				case keyCode.ENTER:
				case keyCode.NUMPAD_ENTER:
					// when menu is open and has focus
					if ( self.menu.active ) {
						// #6055 - Opera still allows the keypress to occur
						// which causes forms to submit
						suppressKeyPress = true;
						event.preventDefault();
					}
					//passthrough - ENTER and TAB both select the current element
				case keyCode.TAB:
					if ( !self.menu.active ) {
						return;
					}
					self.menu.select( event );
					break;
				case keyCode.ESCAPE:
					self.element.val( self.term );
					self.close( event );
					break;
				default:
					// keypress is triggered before the input value is changed
					clearTimeout( self.searching );
					self.searching = setTimeout(() => {
						// only search if the value has changed
						if ( self.term != self.element.val() ) {
							self.selectedItem = null;
							self.search( null, event );
						}
					}, self.options.delay );
					break;
				}
			})
			.bind( "keypress.autocomplete", event => {
				if ( suppressKeyPress ) {
					suppressKeyPress = false;
					event.preventDefault();
				}
			})
			.bind( "focus.autocomplete", () => {
				if ( self.options.disabled ) {
					return;
				}

				self.selectedItem = null;
				self.previous = self.element.val();
			})
			.bind( "blur.autocomplete", event => {
				if ( self.options.disabled ) {
					return;
				}

				clearTimeout( self.searching );
				// clicks on the menu (or a button to trigger a search) will cause a blur event
				self.closing = setTimeout(() => {
					self.close( event );
					self._change( event );
				}, 150 );
			});
        this._initSource();
        this.menu = $( "<ul></ul>" )
			.addClass( "ui-autocomplete" )
			.appendTo( $( this.options.appendTo || "body", doc )[0] )
			// prevent the close-on-blur in case of a "slow" click on the menu (long mousedown)
			.mousedown(event => {
				// clicking on the scrollbar causes focus to shift to the body
				// but we can't detect a mouseup or a click immediately afterward
				// so we have to track the next mousedown and close the menu if
				// the user clicks somewhere outside of the autocomplete
				var menuElement = self.menu.element[ 0 ];
				if ( !$( event.target ).closest( ".ui-menu-item" ).length ) {
					setTimeout(() => {
						$( document ).one( 'mousedown', event => {
							if ( event.target !== self.element[ 0 ] &&
								event.target !== menuElement &&
								!$.ui.contains( menuElement, event.target ) ) {
								self.close();
							}
						});
					}, 1 );
				}

				// use another timeout to make sure the blur-event-handler on the input was already triggered
				setTimeout(() => {
					clearTimeout( self.closing );
				}, 13);
			})
			.menu({
				focus(event, ui) {
					var item = ui.item.data( "item.autocomplete" );
					if ( false !== self._trigger( "focus", event, { item } ) ) {
						// use value to match what will end up in the input, if it was a key event
						if ( /^key/.test(event.originalEvent.type) ) {
							self.element.val( item.value );
						}
					}
				},
				selected(event, ui) {
                    var item = ui.item.data( "item.autocomplete" );
                    var previous = self.previous;

                    // only trigger when focus was lost (click on menu)
                    if ( self.element[0] !== doc.activeElement ) {
						self.element.focus();
						self.previous = previous;
						// #6109 - IE triggers two focus events and the second
						// is asynchronous, so we need to reset the previous
						// term synchronously and asynchronously :-(
						setTimeout(() => {
							self.previous = previous;
							self.selectedItem = item;
						}, 1);
					}

                    if ( false !== self._trigger( "select", event, { item } ) ) {
						self.element.val( item.value );
					}
                    // reset the term after the select event
                    // this allows custom select handling to work properly
                    self.term = self.element.val();

                    self.close( event );
                    self.selectedItem = item;
                },
				blur(event, ui) {
					// don't set the value of the text field if it's already correct
					// this prevents moving the cursor unnecessarily
					if ( self.menu.element.is(":visible") &&
						( self.element.val() !== self.term ) ) {
						self.element.val( self.term );
					}
				}
			})
			.zIndex( this.element.zIndex() + 1 )
			// workaround for jQuery bug #5781 http://dev.jquery.com/ticket/5781
			.css({ top: 0, left: 0 })
			.hide()
			.data( "menu" );
        if ( $.fn.bgiframe ) {
			 this.menu.element.bgiframe();
		}
        // turning off autocomplete prevents the browser from remembering the
        // value when navigating through history, so we re-enable autocomplete
        // if the page is unloaded before the widget is destroyed. #7790
        self.beforeunloadHandler = () => {
			self.element.removeAttr( "autocomplete" );
		};
        $( window ).bind( "beforeunload", self.beforeunloadHandler );
    },

	destroy() {
		this.element
			.removeClass( "ui-autocomplete-input" )
			.removeAttr( "autocomplete" )
			.removeAttr( "role" )
			.removeAttr( "aria-autocomplete" )
			.removeAttr( "aria-haspopup" );
		this.menu.element.remove();
		$( window ).unbind( "beforeunload", this.beforeunloadHandler );
		$.Widget.prototype.destroy.call( this );
	},

	_setOption(key, value) {
		$.Widget.prototype._setOption.apply( this, arguments );
		if ( key === "source" ) {
			this._initSource();
		}
		if ( key === "appendTo" ) {
			this.menu.element.appendTo( $( value || "body", this.element[0].ownerDocument )[0] )
		}
		if ( key === "disabled" && value && this.xhr ) {
			this.xhr.abort();
		}
	},

	_initSource() {
        var self = this;
        var array;
        var url;
        if ( $.isArray(this.options.source) ) {
			array = this.options.source;
			this.source = (request, response) => {
				response( $.ui.autocomplete.filter(array, request.term) );
			};
		} else if ( typeof this.options.source === "string" ) {
			url = this.options.source;
			this.source = (request, response) => {
				if ( self.xhr ) {
					self.xhr.abort();
				}
				self.xhr = $.ajax({
					url,
					data: request,
					dataType: "json",
					success(data, status) {
						response( data );
					},
					error() {
						response( [] );
					}
				});
			};
		} else {
			this.source = this.options.source;
		}
    },

	search(value, event) {
		value = value != null ? value : this.element.val();

		// always save the actual value, not the one passed as an argument
		this.term = this.element.val();

		if ( value.length < this.options.minLength ) {
			return this.close( event );
		}

		clearTimeout( this.closing );
		if ( this._trigger( "search", event ) === false ) {
			return;
		}

		return this._search( value );
	},

	_search(value) {
		this.pending++;
		this.element.addClass( "ui-autocomplete-loading" );

		this.source( { term: value }, this._response() );
	},

	_response() {
        var that = this;
        var index = ++requestIndex;

        return content => {
			if ( index === requestIndex ) {
				that.__response( content );
			}

			that.pending--;
			if ( !that.pending ) {
				that.element.removeClass( "ui-autocomplete-loading" );
			}
		};
    },

	__response(content) {
		if ( !this.options.disabled && content && content.length ) {
			content = this._normalize( content );
			this._suggest( content );
			this._trigger( "open" );
		} else {
			this.close();
		}
	},

	close(event) {
		clearTimeout( this.closing );
		if ( this.menu.element.is(":visible") ) {
			this.menu.element.hide();
			this.menu.deactivate();
			this._trigger( "close", event );
		}
	},
	
	_change(event) {
		if ( this.previous !== this.element.val() ) {
			this._trigger( "change", event, { item: this.selectedItem } );
		}
	},

	_normalize(items) {
		// assume all items have the right format when the first item is complete
		if ( items.length && items[0].label && items[0].value ) {
			return items;
		}
		return $.map( items, item => {
			if ( typeof item === "string" ) {
				return {
					label: item,
					value: item
				};
			}
			return $.extend({
				label: item.label || item.value,
				value: item.value || item.label
			}, item );
		});
	},

	_suggest(items) {
		var ul = this.menu.element
			.empty()
			.zIndex( this.element.zIndex() + 1 );
		this._renderMenu( ul, items );
		// TODO refresh should check if the active item is still in the dom, removing the need for a manual deactivate
		this.menu.deactivate();
		this.menu.refresh();

		// size and position menu
		ul.show();
		this._resizeMenu();
		ul.position( $.extend({
			of: this.element
		}, this.options.position ));

		if ( this.options.autoFocus ) {
			this.menu.next( new $.Event("mouseover") );
		}
	},

	_resizeMenu() {
		var ul = this.menu.element;
		ul.outerWidth( Math.max(
			// Firefox wraps long text (possibly a rounding bug)
			// so we add 1px to avoid the wrapping (#7513)
			ul.width( "" ).outerWidth() + 1,
			this.element.outerWidth()
		) );
	},

	_renderMenu(ul, items) {
		var self = this;
		$.each( items, (index, item) => {
			self._renderItem( ul, item );
		});
	},

	_renderItem(ul, item) {
		return $( "<li></li>" )
			.data( "item.autocomplete", item )
			.append( $( "<a></a>" ).text( item.label ) )
			.appendTo( ul );
	},

	_move(direction, event) {
		if ( !this.menu.element.is(":visible") ) {
			this.search( null, event );
			return;
		}
		if ( this.menu.first() && /^previous/.test(direction) ||
				this.menu.last() && /^next/.test(direction) ) {
			this.element.val( this.term );
			this.menu.deactivate();
			return;
		}
		this.menu[ direction ]( event );
	},

	widget() {
		return this.menu.element;
	},
	_keyEvent(keyEvent, event) {
		if ( !this.isMultiLine || this.menu.element.is( ":visible" ) ) {
			this._move( keyEvent, event );

			// prevents moving cursor to beginning/end of the text field in some browsers
			event.preventDefault();
		}
	}
});

$.extend( $.ui.autocomplete, {
	escapeRegex(value) {
		return value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
	},
	filter(array, term) {
		var matcher = new RegExp( $.ui.autocomplete.escapeRegex(term), "i" );
		return $.grep( array, value => matcher.test( value.label || value.value || value ));
	}
});

})( jQuery ));

/*
 * jQuery UI Menu (not officially released)
 * 
 * This widget isn't yet finished and the API is subject to change. We plan to finish
 * it for the next release. You're welcome to give it a try anyway and give us feedback,
 * as long as you're okay with migrating your code later on. We can help with that, too.
 *
 * Copyright 2010, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Menu
 *
 * Depends:
 *	jquery.ui.core.js
 *  jquery.ui.widget.js
 */
(($ => {

$.widget("ui.menu", {
	_create() {
		var self = this;
		this.element
			.addClass("ui-menu ui-widget ui-widget-content ui-corner-all")
			.attr({
				role: "listbox",
				"aria-activedescendant": "ui-active-menuitem"
			})
			.click(event => {
				if ( !$( event.target ).closest( ".ui-menu-item a" ).length ) {
					return;
				}
				// temporary
				event.preventDefault();
				self.select( event );
			});
		this.refresh();
	},
	
	refresh() {
		var self = this;

		// don't refresh list items that are already adapted
		var items = this.element.children("li:not(.ui-menu-item):has(a)")
			.addClass("ui-menu-item")
			.attr("role", "menuitem");
		
		items.children("a")
			.addClass("ui-corner-all")
			.attr("tabindex", -1)
			// mouseenter doesn't work with event delegation
			.mouseenter(function( event ) {
				self.activate( event, $(this).parent() );
			})
			.mouseleave(() => {
				self.deactivate();
			});
	},

	activate(event, item) {
		this.deactivate();
		if (this.hasScroll()) {
            var offset = item.offset().top - this.element.offset().top;
            var scroll = this.element.scrollTop();
            var elementHeight = this.element.height();
            if (offset < 0) {
				this.element.scrollTop( scroll + offset);
			} else if (offset >= elementHeight) {
				this.element.scrollTop( scroll + offset - elementHeight + item.height());
			}
        }
		this.active = item.eq(0)
			.children("a")
				.addClass("ui-state-hover")
				.attr("id", "ui-active-menuitem")
			.end();
		this._trigger("focus", event, { item });
	},

	deactivate() {
		if (!this.active) { return; }

		this.active.children("a")
			.removeClass("ui-state-hover")
			.removeAttr("id");
		this._trigger("blur");
		this.active = null;
	},

	next(event) {
		this.move("next", ".ui-menu-item:first", event);
	},

	previous(event) {
		this.move("prev", ".ui-menu-item:last", event);
	},

	first() {
		return this.active && !this.active.prevAll(".ui-menu-item").length;
	},

	last() {
		return this.active && !this.active.nextAll(".ui-menu-item").length;
	},

	move(direction, edge, event) {
		if (!this.active) {
			this.activate(event, this.element.children(edge));
			return;
		}
		var next = this.active[direction + "All"](".ui-menu-item").eq(0);
		if (next.length) {
			this.activate(event, next);
		} else {
			this.activate(event, this.element.children(edge));
		}
	},

	// TODO merge with previousPage
	nextPage(event) {
		if (this.hasScroll()) {
            // TODO merge with no-scroll-else
            if (!this.active || this.last()) {
				this.activate(event, this.element.children(".ui-menu-item:first"));
				return;
			}
            var base = this.active.offset().top;
            var height = this.element.height();

            var result = this.element.children(".ui-menu-item").filter(function() {
                var close = $(this).offset().top - base - height + $(this).height();
                // TODO improve approximation
                return close < 10 && close > -10;
            });

            // TODO try to catch this earlier when scrollTop indicates the last page anyway
            if (!result.length) {
				result = this.element.children(".ui-menu-item:last");
			}
            this.activate(event, result);
        } else {
			this.activate(event, this.element.children(".ui-menu-item")
				.filter(!this.active || this.last() ? ":first" : ":last"));
		}
	},

	// TODO merge with nextPage
	previousPage(event) {
		if (this.hasScroll()) {
            // TODO merge with no-scroll-else
            if (!this.active || this.first()) {
				this.activate(event, this.element.children(".ui-menu-item:last"));
				return;
			}

            var base = this.active.offset().top;
            var height = this.element.height();

            var result = this.element.children(".ui-menu-item").filter(function() {
                var close = $(this).offset().top - base + height - $(this).height();
                // TODO improve approximation
                return close < 10 && close > -10;
            });

            // TODO try to catch this earlier when scrollTop indicates the last page anyway
            if (!result.length) {
				result = this.element.children(".ui-menu-item:first");
			}
            this.activate(event, result);
        } else {
			this.activate(event, this.element.children(".ui-menu-item")
				.filter(!this.active || this.first() ? ":last" : ":first"));
		}
	},

	hasScroll() {
		return this.element.height() < this.element[ $.fn.prop ? "prop" : "attr" ]("scrollHeight");
	},

	select(event) {
		this._trigger("selected", event, { item: this.active });
	}
});

})(jQuery));
