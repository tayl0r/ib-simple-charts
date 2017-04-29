/*!
 * jQuery UI Position 1.8.22
 *
 * Copyright 2012, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Position
 */
((($, undefined) => {
    $.ui = $.ui || {};

    var horizontalPositions = /left|center|right/;
    var verticalPositions = /top|center|bottom/;
    var center = "center";
    var support = {};
    var _position = $.fn.position;
    var _offset = $.fn.offset;

    $.fn.position = function( options ) {
        if ( !options || !options.of ) {
            return _position.apply( this, arguments );
        }

        // make a copy, we don't want to modify arguments
        options = $.extend( {}, options );

        var target = $( options.of );
        var targetElem = target[0];
        var collision = ( options.collision || "flip" ).split( " " );
        var offset = options.offset ? options.offset.split( " " ) : [ 0, 0 ];
        var targetWidth;
        var targetHeight;
        var basePosition;

        if ( targetElem.nodeType === 9 ) {
            targetWidth = target.width();
            targetHeight = target.height();
            basePosition = { top: 0, left: 0 };
        // TODO: use $.isWindow() in 1.9
        } else if ( targetElem.setTimeout ) {
            targetWidth = target.width();
            targetHeight = target.height();
            basePosition = { top: target.scrollTop(), left: target.scrollLeft() };
        } else if ( targetElem.preventDefault ) {
            // force left top to allow flipping
            options.at = "left top";
            targetWidth = targetHeight = 0;
            basePosition = { top: options.of.pageY, left: options.of.pageX };
        } else {
            targetWidth = target.outerWidth();
            targetHeight = target.outerHeight();
            basePosition = target.offset();
        }

        // force my and at to have valid horizontal and veritcal positions
        // if a value is missing or invalid, it will be converted to center 
        $.each( [ "my", "at" ], function() {
            var pos = ( options[this] || "" ).split( " " );
            if ( pos.length === 1) {
                pos = horizontalPositions.test( pos[0] ) ?
                    pos.concat( [center] ) :
                    verticalPositions.test( pos[0] ) ?
                        [ center ].concat( pos ) :
                        [ center, center ];
            }
            pos[ 0 ] = horizontalPositions.test( pos[0] ) ? pos[ 0 ] : center;
            pos[ 1 ] = verticalPositions.test( pos[1] ) ? pos[ 1 ] : center;
            options[ this ] = pos;
        });

        // normalize collision option
        if ( collision.length === 1 ) {
            collision[ 1 ] = collision[ 0 ];
        }

        // normalize offset option
        offset[ 0 ] = parseInt( offset[0], 10 ) || 0;
        if ( offset.length === 1 ) {
            offset[ 1 ] = offset[ 0 ];
        }
        offset[ 1 ] = parseInt( offset[1], 10 ) || 0;

        if ( options.at[0] === "right" ) {
            basePosition.left += targetWidth;
        } else if ( options.at[0] === center ) {
            basePosition.left += targetWidth / 2;
        }

        if ( options.at[1] === "bottom" ) {
            basePosition.top += targetHeight;
        } else if ( options.at[1] === center ) {
            basePosition.top += targetHeight / 2;
        }

        basePosition.left += offset[ 0 ];
        basePosition.top += offset[ 1 ];

        return this.each(function() {
            var elem = $( this );
            var elemWidth = elem.outerWidth();
            var elemHeight = elem.outerHeight();
            var marginLeft = parseInt( $.curCSS( this, "marginLeft", true ) ) || 0;
            var marginTop = parseInt( $.curCSS( this, "marginTop", true ) ) || 0;

            var collisionWidth = elemWidth + marginLeft +
				( parseInt( $.curCSS( this, "marginRight", true ) ) || 0 );

            var collisionHeight = elemHeight + marginTop +
				( parseInt( $.curCSS( this, "marginBottom", true ) ) || 0 );

            var position = $.extend( {}, basePosition );
            var collisionPosition;

            if ( options.my[0] === "right" ) {
                position.left -= elemWidth;
            } else if ( options.my[0] === center ) {
                position.left -= elemWidth / 2;
            }

            if ( options.my[1] === "bottom" ) {
                position.top -= elemHeight;
            } else if ( options.my[1] === center ) {
                position.top -= elemHeight / 2;
            }

            // prevent fractions if jQuery version doesn't support them (see #5280)
            if ( !support.fractions ) {
                position.left = Math.round( position.left );
                position.top = Math.round( position.top );
            }

            collisionPosition = {
                left: position.left - marginLeft,
                top: position.top - marginTop
            };

            $.each( [ "left", "top" ], (i, dir) => {
                if ( $.ui.position[ collision[i] ] ) {
                    $.ui.position[ collision[i] ][ dir ]( position, {
                        targetWidth,
                        targetHeight,
                        elemWidth,
                        elemHeight,
                        collisionPosition,
                        collisionWidth,
                        collisionHeight,
                        offset,
                        my: options.my,
                        at: options.at
                    });
                }
            });

            if ( $.fn.bgiframe ) {
                elem.bgiframe();
            }
            elem.offset( $.extend( position, { using: options.using } ) );
        });
    };

    $.ui.position = {
        fit: {
            left(position, data) {
                var win = $( window );
                var over = data.collisionPosition.left + data.collisionWidth - win.width() - win.scrollLeft();
                position.left = over > 0 ? position.left - over : Math.max( position.left - data.collisionPosition.left, position.left );
            },
            top(position, data) {
                var win = $( window );
                var over = data.collisionPosition.top + data.collisionHeight - win.height() - win.scrollTop();
                position.top = over > 0 ? position.top - over : Math.max( position.top - data.collisionPosition.top, position.top );
            }
        },

        flip: {
            left(position, data) {
                if ( data.at[0] === center ) {
                    return;
                }
                var win = $( window );
                var over = data.collisionPosition.left + data.collisionWidth - win.width() - win.scrollLeft();

                var myOffset = data.my[ 0 ] === "left" ?
					-data.elemWidth :
					data.my[ 0 ] === "right" ?
						data.elemWidth :
						0;

                var atOffset = data.at[ 0 ] === "left" ?
					data.targetWidth :
					-data.targetWidth;

                var offset = -2 * data.offset[ 0 ];
                position.left += data.collisionPosition.left < 0 ?
                    myOffset + atOffset + offset :
                    over > 0 ?
                        myOffset + atOffset + offset :
                        0;
            },
            top(position, data) {
                if ( data.at[1] === center ) {
                    return;
                }
                var win = $( window );
                var over = data.collisionPosition.top + data.collisionHeight - win.height() - win.scrollTop();

                var myOffset = data.my[ 1 ] === "top" ?
					-data.elemHeight :
					data.my[ 1 ] === "bottom" ?
						data.elemHeight :
						0;

                var atOffset = data.at[ 1 ] === "top" ?
					data.targetHeight :
					-data.targetHeight;

                var offset = -2 * data.offset[ 1 ];
                position.top += data.collisionPosition.top < 0 ?
                    myOffset + atOffset + offset :
                    over > 0 ?
                        myOffset + atOffset + offset :
                        0;
            }
        }
    };

    // offset setter from jQuery 1.4
    if ( !$.offset.setOffset ) {
        $.offset.setOffset = (elem, options) => {
            // set position first, in-case top/left are set even on static elem
            if ( /static/.test( $.curCSS( elem, "position" ) ) ) {
                elem.style.position = "relative";
            }
            var curElem   = $( elem );
            var curOffset = curElem.offset();
            var curTop    = parseInt( $.curCSS( elem, "top",  true ), 10 ) || 0;
            var curLeft   = parseInt( $.curCSS( elem, "left", true ), 10)  || 0;

            var props     = {
				top:  (options.top  - curOffset.top)  + curTop,
				left: (options.left - curOffset.left) + curLeft
			};

            if ( 'using' in options ) {
                options.using.call( elem, props );
            } else {
                curElem.css( props );
            }
        };

        $.fn.offset = function( options ) {
            var elem = this[ 0 ];
            if ( !elem || !elem.ownerDocument ) { return null; }
            if ( options ) {
                if ( $.isFunction( options ) ) {
                    return this.each(function( i ) {
                        $( this ).offset( options.call( this, i, $( this ).offset() ) );
                    });
                }
                return this.each(function() {
                    $.offset.setOffset( this, options );
                });
            }
            return _offset.call( this );
        };
    }

    // fraction support test (older versions of jQuery don't support fractions)
    ((() => {
        var body = document.getElementsByTagName( "body" )[ 0 ];
        var div = document.createElement( "div" );
        var testElement;
        var testElementParent;
        var testElementStyle;
        var offset;
        var offsetTotal;

        //Create a "fake body" for testing based on method used in jQuery.support
        testElement = document.createElement( body ? "div" : "body" );
        testElementStyle = {
            visibility: "hidden",
            width: 0,
            height: 0,
            border: 0,
            margin: 0,
            background: "none"
        };
        if ( body ) {
            $.extend( testElementStyle, {
                position: "absolute",
                left: "-1000px",
                top: "-1000px"
            });
        }
        for ( var i in testElementStyle ) {
            testElement.style[ i ] = testElementStyle[ i ];
        }
        testElement.appendChild( div );
        testElementParent = body || document.documentElement;
        testElementParent.insertBefore( testElement, testElementParent.firstChild );

        div.style.cssText = "position: absolute; left: 10.7432222px; top: 10.432325px; height: 30px; width: 201px;";

        offset = $( div ).offset( (_, offset) => offset).offset();

        testElement.innerHTML = "";
        testElementParent.removeChild( testElement );

        offsetTotal = offset.top + offset.left + ( body ? 2000 : 0 );
        support.fractions = offsetTotal > 21 && offsetTotal < 22;
    }))();
})( jQuery ));
