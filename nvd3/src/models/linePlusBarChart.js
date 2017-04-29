
nv.models.linePlusBarChart = () => {
  var margin = {top: 30, right: 60, bottom: 50, left: 60};
  var width = null;
  var height = null;
  var getX = d => d.x;
  var getY = d => d.y;
  var color = nv.utils.defaultColor();
  var showLegend = true;
  var tooltips = true;

  var tooltip = (key, x, y, e, graph) => '<h3>' + key + '</h3>' +
         '<p>' +  y + ' at ' + x + '</p>';

  var noData = "No Data Available.";
  var lines = nv.models.line();
  var bars = nv.models.historicalBar();

  var // needs to be both line and historicalBar x Axis
  x = d3.scale.linear();

  var y1 = bars.yScale();
  var y2 = lines.yScale();
  var xAxis = nv.models.axis().scale(x).orient('bottom').tickPadding(5);
  var yAxis1 = nv.models.axis().scale(y1).orient('left');
  var yAxis2 = nv.models.axis().scale(y2).orient('right');
  var legend = nv.models.legend().height(30);
  var dispatch = d3.dispatch('tooltipShow', 'tooltipHide');

  var showTooltip = (e, offsetElement) => {
    var left = e.pos[0] + ( offsetElement.offsetLeft || 0 );
    var top = e.pos[1] + ( offsetElement.offsetTop || 0);
    var x = xAxis.tickFormat()(lines.x()(e.point, e.pointIndex));
    var y = (e.series.bar ? yAxis1 : yAxis2).tickFormat()(lines.y()(e.point, e.pointIndex));
    var content = tooltip(e.series.key, x, y, e, chart);

    nv.tooltip.show([left, top], content, e.value < 0 ? 'n' : 's');
  };



  function chart(selection) {
    selection.each(function(data) {
      var container = d3.select(this);
      var that = this;

      var availableWidth = (width  || parseInt(container.style('width')) || 960)
                             - margin.left - margin.right;

      var availableHeight = (height || parseInt(container.style('height')) || 400)
                         - margin.top - margin.bottom;


      //------------------------------------------------------------
      // Display No Data message if there's nothing to show.

      if (!data || !data.length || !data.filter(d => d.values.length).length) {
        container.append('text')
          .attr('class', 'nvd3 nv-noData')
          .attr('x', availableWidth / 2)
          .attr('y', availableHeight / 2)
          .attr('dy', '-.7em')
          .style('text-anchor', 'middle')
          .text(noData);
          return chart;
      } else {
        container.select('.nv-noData').remove();
      }

      //------------------------------------------------------------




      var dataBars = data.filter(d => !d.disabled && d.bar);

      var dataLines = data.filter(d => !d.disabled && !d.bar);



      //TODO: try to remove x scale computation from this layer

      var series1 = data.filter(d => !d.disabled && d.bar)
            .map(d => d.values.map((d, i) => ({
        x: getX(d,i),
        y: getY(d,i)
      })));

      var series2 = data.filter(d => !d.disabled && !d.bar)
            .map(d => d.values.map((d, i) => ({
        x: getX(d,i),
        y: getY(d,i)
      })));

      x   .domain(d3.extent(d3.merge(series1.concat(series2)), d => d.x ))
          .range([0, availableWidth]);



      /*
  x   .domain(d3.extent(d3.merge(data.map(function(d) { return d.values })), getX ))
      .range([0, availableWidth]);

  y1  .domain(d3.extent(d3.merge(dataBars), function(d) { return d.y } ))
      .range([availableHeight, 0]);

  y2  .domain(d3.extent(d3.merge(dataLines), function(d) { return d.y } ))
      .range([availableHeight, 0]);
     */



      var wrap = d3.select(this).selectAll('g.nv-wrap.nv-linePlusBar').data([data]);
      var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-linePlusBar').append('g');

      gEnter.append('g').attr('class', 'nv-x nv-axis');
      gEnter.append('g').attr('class', 'nv-y1 nv-axis');
      gEnter.append('g').attr('class', 'nv-y2 nv-axis');
      gEnter.append('g').attr('class', 'nv-barsWrap');
      gEnter.append('g').attr('class', 'nv-linesWrap');
      gEnter.append('g').attr('class', 'nv-legendWrap');



      var g = wrap.select('g');


      if (showLegend) {
        legend.width( availableWidth / 2 );

        g.select('.nv-legendWrap')
            .datum(data.map(series => {
              series.originalKey = series.originalKey === undefined ? series.key : series.originalKey;
              series.key = series.originalKey + (series.bar ? ' (left axis)' : ' (right axis)');
              return series;
            }))
          .call(legend);

        if ( margin.top != legend.height()) {
          margin.top = legend.height();
          availableHeight = (height || parseInt(container.style('height')) || 400)
                             - margin.top - margin.bottom;
        }

        g.select('.nv-legendWrap')
            .attr('transform', 'translate(' + ( availableWidth / 2 ) + ',' + (-margin.top) +')');
      }




      lines
        .width(availableWidth)
        .height(availableHeight)
        .color(data.map((d, i) => d.color || color(d, i)).filter((d, i) => !data[i].disabled && !data[i].bar))

      bars
        .width(availableWidth)
        .height(availableHeight)
        .color(data.map((d, i) => d.color || color(d, i)).filter((d, i) => !data[i].disabled && data[i].bar))



      var barsWrap = g.select('.nv-barsWrap')
          .datum(dataBars.length ? dataBars : [{values:[]}])

      var linesWrap = g.select('.nv-linesWrap')
          .datum(dataLines.length ? dataLines : [{values:[]}])


      d3.transition(barsWrap).call(bars);
      d3.transition(linesWrap).call(lines);


      g.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


      xAxis
        .ticks( availableWidth / 100 )
        .tickSize(-availableHeight, 0);

      g.select('.nv-x.nv-axis')
          .attr('transform', 'translate(0,' + y1.range()[0] + ')');
      d3.transition(g.select('.nv-x.nv-axis'))
          .call(xAxis);


      yAxis1
        .ticks( availableHeight / 36 )
        .tickSize(-availableWidth, 0);

      d3.transition(g.select('.nv-y1.nv-axis'))
          .style('opacity', dataBars.length ? 1 : 0)
          .call(yAxis1);


      yAxis2
        .ticks( availableHeight / 36 )
        .tickSize(dataBars.length ? 0 : -availableWidth, 0); // Show the y2 rules only if y1 has none

      g.select('.nv-y2.nv-axis')
          .style('opacity', dataLines.length ? 1 : 0)
          .attr('transform', 'translate(' + x.range()[1] + ',0)');

      d3.transition(g.select('.nv-y2.nv-axis'))
          .call(yAxis2);



      legend.dispatch.on('legendClick', (d, i) => { 
        d.disabled = !d.disabled;

        if (!data.filter(d => !d.disabled).length) {
          data.map(d => {
            d.disabled = false;
            wrap.selectAll('.nv-series').classed('disabled', false);
            return d;
          });
        }

        selection.transition().call(chart);
      });


      lines.dispatch.on('elementMouseover.tooltip', e => {
        e.pos = [e.pos[0] +  margin.left, e.pos[1] + margin.top];
        dispatch.tooltipShow(e);
      });
      if (tooltips) dispatch.on('tooltipShow', e => { showTooltip(e, that.parentNode) } ); // TODO: maybe merge with above?

      lines.dispatch.on('elementMouseout.tooltip', e => {
        dispatch.tooltipHide(e);
      });
      if (tooltips) dispatch.on('tooltipHide', nv.tooltip.cleanup);


      bars.dispatch.on('elementMouseover.tooltip', e => {
        e.pos = [e.pos[0] +  margin.left, e.pos[1] + margin.top];
        dispatch.tooltipShow(e);
      });
      if (tooltips) dispatch.on('tooltipShow', e => { showTooltip(e, that.parentNode) } ); // TODO: maybe merge with above?

      bars.dispatch.on('elementMouseout.tooltip', e => {
        dispatch.tooltipHide(e);
      });
      if (tooltips) dispatch.on('tooltipHide', nv.tooltip.cleanup);


      chart.update = () => { selection.transition().call(chart) };
      chart.container = this; // I need a reference to the container in order to have outside code check if the chart is visible or not
    });

    return chart;
  }

  chart.dispatch = dispatch;
  chart.legend = legend;
  chart.lines = lines;
  chart.bars = bars;
  chart.xAxis = xAxis;
  chart.yAxis1 = yAxis1;
  chart.yAxis2 = yAxis2;

  d3.rebind(chart, lines, 'defined', 'size', 'clipVoronoi', 'interpolate');
  //TODO: consider rebinding x, y and some other stuff, and simply do soemthign lile bars.x(lines.x()), etc.
  //d3.rebind(chart, lines, 'x', 'y', 'size', 'xDomain', 'yDomain', 'forceX', 'forceY', 'interactive', 'clipEdge', 'clipVoronoi', 'id');

  //d3.rebind(chart, lines, 'interactive');
  //consider rebinding x and y as well

  chart.x = function(_) {
    if (!arguments.length) return getX;
    getX = _;
    lines.x(_);
    bars.x(_);
    return chart;
  };

  chart.y = function(_) {
    if (!arguments.length) return getY;
    getY = _;
    lines.y(_);
    bars.y(_);
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

  chart.color = function(_) {
    if (!arguments.length) return color;
    color = nv.utils.getColor(_);
    legend.color(color);
    return chart;
  };

  chart.showLegend = function(_) {
    if (!arguments.length) return showLegend;
    showLegend = _;
    return chart;
  };

  chart.tooltips = function(_) {
    if (!arguments.length) return tooltips;
    tooltips = _;
    return chart;
  };

  chart.tooltipContent = function(_) {
    if (!arguments.length) return tooltip;
    tooltip = _;
    return chart;
  };

  chart.noData = function(_) {
    if (!arguments.length) return noData;
    noData = _;
    return chart;
  };


  return chart;
}
