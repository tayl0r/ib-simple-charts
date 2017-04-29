
nv.models.stackedArea = () => {
  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var margin = {top: 0, right: 0, bottom: 0, left: 0}; //can be accessed via chart.scatter.[x/y]Scale()

  var width = 960;
  var height = 500;

  var // a function that computes the color 
  color = nv.utils.defaultColor();

  var //Create semi-unique ID incase user doesn't selet one
  id = Math.floor(Math.random() * 100000);

  var // accessor to get the x value from a data point
  getX = d => d.x;

  var // accessor to get the y value from a data point
  getY = d => d.y;

  var style = 'stack';
  var offset = 'zero';
  var order = 'default';

  var // if true, masks lines within x and y scale
  clipEdge = false;

  var x;
  var y;

  /************************************
   * offset:
   *   'wiggle' (stream)
   *   'zero' (stacked)
   *   'expand' (normalize to 100%)
   *   'silhouette' (simple centered)
   *
   * order:
   *   'inside-out' (stream)
   *   'default' (input order)
   ************************************/


  //============================================================
  // Private Variables
  //------------------------------------------------------------

  var stacked = d3.layout.stack()
                 //.offset('zero')
                 .values(d => d.values)  //TODO: make values customizeable in EVERY model in this fashion
                 .x(getX)
                 .y(d => d.stackedY)
                 .out((d, y0, y) => {
                    d.display = {
                      y,
                     y0
                    };
                  });

  var scatter = nv.models.scatter()
              .size(2.2) // default size
              .sizeDomain([2.5]);

  var dispatch =  d3.dispatch('tooltipShow', 'tooltipHide', 'areaClick', 'areaMouseover', 'areaMouseout');

  function chart(selection) {
    selection.each(function(data) {
      var availableWidth = width - margin.left - margin.right;
      var availableHeight = height - margin.top - margin.bottom;

      x = scatter.xScale();
      y = scatter.yScale();

      // Injecting point index into each point because d3.layout.stack().out does not give index
      // ***Also storing getY(d,i) as yStacked so that it can be set to 0 if series is disabled
      // TODO: see if theres a way to deal with disabled series more consistent with the other models
      data = data.map((aseries, i) => {
               aseries.values = aseries.values.map((d, j) => {
                 d.index = j;
                 d.stackedY = aseries.disabled ? 0 : getY(d,j);
                 return d;
               })
               return aseries;
             });

      /*
              //TODO: Figure out why stream mode is broken with this
              data = stacked
                      .order(order)
                      .offset(offset)
                      (data);
      */

      data = d3.layout.stack()
               .order(order)
               .offset(offset)
               .values(d => d.values)  //TODO: make values customizeable in EVERY model in this fashion
               .x(getX)
               .y(d => d.stackedY)
               .out((d, y0, y) => {
                  d.display = {
                    y,
                   y0
                  };
                })
              (data);


      var wrap = d3.select(this).selectAll('g.nv-wrap.nv-stackedarea').data([data]);
      var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-stackedarea');
      var defsEnter = wrapEnter.append('defs');
      var gEnter = wrapEnter.append('g');
      var g = wrap.select('g');

      gEnter.append('g').attr('class', 'nv-areaWrap');


      scatter
        .width(availableWidth)
        .height(availableHeight)
        .x(getX)
        .y(d => d.display.y + d.display.y0)
        .forceY([0])
        .color(data.map((d, i) => d.color || color(d, i)).filter((d, i) => !data[i].disabled));


      gEnter.append('g').attr('class', 'nv-scatterWrap');
      var scatterWrap = g.select('.nv-scatterWrap')
          .datum(data.filter(d => !d.disabled))

      d3.transition(scatterWrap).call(scatter);



      wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


      defsEnter.append('clipPath')
          .attr('id', 'nv-edge-clip-' + id)
        .append('rect');

      wrap.select('#nv-edge-clip-' + id + ' rect')
          .attr('width', availableWidth)
          .attr('height', availableHeight);

      g   .attr('clip-path', clipEdge ? 'url(#nv-edge-clip-' + id + ')' : '');




      var area = d3.svg.area()
          .x((d, i) => x(getX(d,i)))
          .y0(d => y(d.display.y0))
          .y1(d => y(d.display.y + d.display.y0));

      var zeroArea = d3.svg.area()
          .x((d, i) => x(getX(d,i)))
          .y0(d => y(d.display.y0))
          .y1(d => y(d.display.y0));


      var path = g.select('.nv-areaWrap').selectAll('path.nv-area')
          .data(d => d);
      //.data(function(d) { return d }, function(d) { return d.key });
      path.enter().append('path').attr('class', (d, i) => 'nv-area nv-area-' + i)
          .on('mouseover', function(d,i) {
            d3.select(this).classed('hover', true);
            dispatch.areaMouseover({
              point: d,
              series: d.key,
              pos: [d3.event.pageX, d3.event.pageY],
              seriesIndex: i
            });
          })
          .on('mouseout', function(d,i) {
            d3.select(this).classed('hover', false);
            dispatch.areaMouseout({
              point: d,
              series: d.key,
              pos: [d3.event.pageX, d3.event.pageY],
              seriesIndex: i
            });
          })
          .on('click', function(d,i) {
            d3.select(this).classed('hover', false);
            dispatch.areaClick({
              point: d,
              series: d.key,
              pos: [d3.event.pageX, d3.event.pageY],
              seriesIndex: i
            });
          })
      d3.transition(path.exit())
          .attr('d', (d, i) => zeroArea(d.values,i))
          .remove();
      path
          .style('fill', (d, i) => d.color || color(d, i))
          .style('stroke', (d, i) => d.color || color(d, i));
      d3.transition(path)
          .attr('d', (d, i) => area(d.values,i))


      //============================================================
      // Event Handling/Dispatching (in chart's scope)
      //------------------------------------------------------------

      scatter.dispatch.on('elementMouseover.area', e => {
        g.select('.nv-chart-' + id + ' .nv-area-' + e.seriesIndex).classed('hover', true);
      });
      scatter.dispatch.on('elementMouseout.area', e => {
        g.select('.nv-chart-' + id + ' .nv-area-' + e.seriesIndex).classed('hover', false);
      });
    });


    return chart;
  }


  //============================================================
  // Event Handling/Dispatching (out of chart's scope)
  //------------------------------------------------------------

  scatter.dispatch.on('elementClick.area', e => {
    dispatch.areaClick(e);
  })
  scatter.dispatch.on('elementMouseover.tooltip', e => {
        e.pos = [e.pos[0] + margin.left, e.pos[1] + margin.top],
        dispatch.tooltipShow(e);
  });
  scatter.dispatch.on('elementMouseout.tooltip', e => {
        dispatch.tooltipHide(e);
  });



  //============================================================
  // Global getters and setters
  //------------------------------------------------------------

  chart.dispatch = dispatch;
  chart.scatter = scatter;

  d3.rebind(chart, scatter, 'interactive', 'size', 'xScale', 'yScale', 'zScale', 'xDomain', 'yDomain', 'sizeDomain', 'forceX', 'forceY', 'forceSize', 'clipVoronoi', 'clipRadius');

  chart.x = function(_) {
    if (!arguments.length) return getX;
    getX = d3.functor(_);
    return chart;
  };

  chart.y = function(_) {
    if (!arguments.length) return getY;
    getY = d3.functor(_);
    return chart;
  }

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin = _;
    return chart;
  };

  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };

  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };

  chart.clipEdge = function(_) {
    if (!arguments.length) return clipEdge;
    clipEdge = _;
    return chart;
  };

  chart.color = function(_) {
    if (!arguments.length) return color;
    color = nv.utils.getColor(_);
    return chart;
  };

  chart.offset = function(_) {
    if (!arguments.length) return offset;
    offset = _;
    return chart;
  };

  chart.order = function(_) {
    if (!arguments.length) return order;
    order = _;
    return chart;
  };

  //shortcut for offset + order
  chart.style = function(_) {
    if (!arguments.length) return style;
    style = _;

    switch (style) {
      case 'stack':
        chart.offset('zero');
        chart.order('default');
        break;
      case 'stream':
        chart.offset('wiggle');
        chart.order('inside-out');
        break;
      case 'expand':
        chart.offset('expand');
        chart.order('default');
        break;
    }

    return chart;
  };


  return chart;
}
