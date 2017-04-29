//TODO: eitehr drastically clean up or deprecate this model
nv.models.ohlcBar = () => {
  var margin = {top: 0, right: 0, bottom: 0, left: 0};
  var width = 960;
  var height = 500;

  var //Create semi-unique ID in case user doesn't select one
  id = Math.floor(Math.random() * 10000);

  var getX = d => d.x;
  var getY = d => d.y;
  var getOpen = d => d.open;
  var getClose = d => d.close;
  var getHigh = d => d.high;
  var getLow = d => d.low;
  var forceX = [];
  var forceY = [];
  var clipEdge = true;
  var color = nv.utils.defaultColor();
  var xDomain;
  var yDomain;
  var x = d3.scale.linear();
  var y = d3.scale.linear();
  var xAxis = d3.svg.axis().scale(x).orient('bottom');
  var yAxis = d3.svg.axis().scale(y).orient('left');
  var dispatch = d3.dispatch('chartClick', 'elementClick', 'elementDblClick', 'elementMouseover', 'elementMouseout');


  function chart(selection) {
    selection.each(function(data) {
      var availableWidth = width - margin.left - margin.right;
      var availableHeight = height - margin.top - margin.bottom;


      x   .domain(xDomain || d3.extent(data[0].values.map(getX).concat(forceX) ))
          .range([0, availableWidth]);

      //y   .domain(yDomain || d3.extent(data[0].values.map(getY).concat(forceY) ))
      y   .domain(yDomain || [
            d3.min(data[0].values.map(getLow).concat(forceY)),
            d3.max(data[0].values.map(getHigh).concat(forceY))
          ])
          .range([availableHeight, 0]);

      // If scale's domain don't have a range, slightly adjust to make one... so a chart can show a single data point
      if (x.domain()[0] === x.domain()[1] || y.domain()[0] === y.domain()[1]) singlePoint = true;
      if (x.domain()[0] === x.domain()[1])
        x.domain()[0] ?
            x.domain([x.domain()[0] - x.domain()[0] * 0.01, x.domain()[1] + x.domain()[1] * 0.01])
          : x.domain([-1,1]);

      if (y.domain()[0] === y.domain()[1])
        y.domain()[0] ?
            y.domain([y.domain()[0] + y.domain()[0] * 0.01, y.domain()[1] - y.domain()[1] * 0.01])
          : y.domain([-1,1]);


      var parent = d3.select(this)
          .on('click', (d, i) => {
            dispatch.chartClick({
                data: d,
                index: i,
                pos: d3.event,
                id
            });
          });


      var wrap = d3.select(this).selectAll('g.nv-wrap.nv-ohlcBar').data([data[0].values]);
      var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-ohlcBar');
      var gEnter = wrapEnter.append('g');

      gEnter.append('g').attr('class', 'nv-ticks');


      wrap.attr('width', width)
          .attr('height', height);

      var g = wrap.select('g')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


      wrapEnter.append('defs').append('clipPath')
          .attr('id', 'nv-chart-clip-path-' + id)
        .append('rect');
      wrap.select('#nv-chart-clip-path-' + id + ' rect')
          .attr('width', availableWidth)
          .attr('height', availableHeight);

      gEnter
          .attr('clip-path', clipEdge ? 'url(#nv-chart-clip-path-' + id + ')' : '');

      var shiftWrap = gEnter.append('g').attr('class', 'nv-shiftWrap');



      var ticks = wrap.select('.nv-ticks').selectAll('.nv-tick')
          .data(d => d);

      ticks.exit().remove();


      var ticksEnter = ticks.enter().append('path')
          .attr('class', (d, i, j) => (getOpen(d,i) > getClose(d,i) ? 'nv-tick negative' : 'nv-tick positive') + ' nv-tick-' + j + '-' + i)
          .attr('d', (d, i) => {
            var w = (availableWidth / data[0].values.length) * .9;
            return 'm0,0l0,' 
                 + (y(getOpen(d,i))
                 - y(getHigh(d,i)))
                 + 'l'
                 + (-w/2)
                 + ',0l'
                 + (w/2)
                 + ',0l0,'
                 + (y(getLow(d,i)) - y(getOpen(d,i)))
                 + 'l0,'
                 + (y(getClose(d,i))
                 - y(getLow(d,i)))
                 + 'l'
                 + (w/2)
                 + ',0l'
                 + (-w/2)
                 + ',0z';
          })
          .attr('transform', (d, i) => 'translate(' + x(getX(d,i)) + ',' + y(getHigh(d,i)) + ')')
          //.attr('fill', function(d,i) { return color[0]; })
          //.attr('stroke', function(d,i) { return color[0]; })
          //.attr('x', 0 )
          //.attr('y', function(d,i) {  return y(Math.max(0, getY(d,i))) })
          //.attr('height', function(d,i) { return Math.abs(y(getY(d,i)) - y(0)) })
          .on('mouseover', function(d,i) {
            d3.select(this).classed('hover', true);
            dispatch.elementMouseover({
                point: d,
                series: data[0],
                pos: [x(getX(d,i)), y(getY(d,i))],  // TODO: Figure out why the value appears to be shifted
                pointIndex: i,
                seriesIndex: 0,
                e: d3.event
            });

          })
          .on('mouseout', function(d,i) {
                d3.select(this).classed('hover', false);
                dispatch.elementMouseout({
                    point: d,
                    series: data[0],
                    pointIndex: i,
                    seriesIndex: 0,
                    e: d3.event
                });
          })
          .on('click', (d, i) => {
                dispatch.elementClick({
                    //label: d[label],
                    value: getY(d,i),
                    data: d,
                    index: i,
                    pos: [x(getX(d,i)), y(getY(d,i))],
                    e: d3.event,
                    id
                });
              d3.event.stopPropagation();
          })
          .on('dblclick', (d, i) => {
              dispatch.elementDblClick({
                  //label: d[label],
                  value: getY(d,i),
                  data: d,
                  index: i,
                  pos: [x(getX(d,i)), y(getY(d,i))],
                  e: d3.event,
                  id
              });
              d3.event.stopPropagation();
          });

      ticks
          .attr('class', (d, i, j) => (getOpen(d,i) > getClose(d,i) ? 'nv-tick negative' : 'nv-tick positive') + ' nv-tick-' + j + '-' + i)
      d3.transition(ticks)
          .attr('transform', (d, i) => 'translate(' + x(getX(d,i)) + ',' + y(getHigh(d,i)) + ')')
          .attr('d', (d, i) => {
            var w = (availableWidth / data[0].values.length) * .9;
            return 'm0,0l0,'
                 + (y(getOpen(d,i))
                 - y(getHigh(d,i)))
                 + 'l'
                 + (-w/2)
                 + ',0l'
                 + (w/2)
                 + ',0l0,'
                 + (y(getLow(d,i))
                 - y(getOpen(d,i)))
                 + 'l0,'
                 + (y(getClose(d,i))
                 - y(getLow(d,i)))
                 + 'l'
                 + (w/2)
                 + ',0l'
                 + (-w/2)
                 + ',0z';
          })
      //.attr('width', (availableWidth / data[0].values.length) * .9 )


      //d3.transition(ticks)
      //.attr('y', function(d,i) {  return y(Math.max(0, getY(d,i))) })
      //.attr('height', function(d,i) { return Math.abs(y(getY(d,i)) - y(0)) });
      //.order();  // not sure if this makes any sense for this model
    });

    return chart;
  }


  chart.dispatch = dispatch;

  chart.x = function(_) {
    if (!arguments.length) return getX;
    getX = _;
    return chart;
  };

  chart.y = function(_) {
    if (!arguments.length) return getY;
    getY = _;
    return chart;
  };

  chart.open = function(_) {
    if (!arguments.length) return getOpen;
    getOpen = _;
    return chart;
  };

  chart.close = function(_) {
    if (!arguments.length) return getClose;
    getClose = _;
    return chart;
  };

  chart.high = function(_) {
    if (!arguments.length) return getHigh;
    getHigh = _;
    return chart;
  };

  chart.low = function(_) {
    if (!arguments.length) return getLow;
    getLow = _;
    return chart;
  };

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

  chart.xScale = function(_) {
    if (!arguments.length) return x;
    x = _;
    return chart;
  };

  chart.yScale = function(_) {
    if (!arguments.length) return y;
    y = _;
    return chart;
  };

  chart.xDomain = function(_) {
    if (!arguments.length) return xDomain;
    xDomain = _;
    return chart;
  };

  chart.yDomain = function(_) {
    if (!arguments.length) return yDomain;
    yDomain = _;
    return chart;
  };

  chart.forceX = function(_) {
    if (!arguments.length) return forceX;
    forceX = _;
    return chart;
  };

  chart.forceY = function(_) {
    if (!arguments.length) return forceY;
    forceY = _;
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

  chart.id = function(_) {
    if (!arguments.length) return id;
    id = _;
    return chart;
  };



  return chart;
}
