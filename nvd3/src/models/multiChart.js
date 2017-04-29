nv.models.multiChart = () => {
  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var margin = {top: 30, right: 20, bottom: 50, left: 60}; //can be accessed via chart.lines.[x/y]Scale()

  var color = d3.scale.category20().range();
  var width = null;
  var height = null;
  var showLegend = true;
  var tooltips = true;

  var tooltip = (key, x, y, e, graph) => '<h3>' + key + '</h3>' +
         '<p>' +  y + ' at ' + x + '</p>';

  var x;
  var y;

  //============================================================
  // Private Variables
  //------------------------------------------------------------

  var x = d3.scale.linear();

  var yScale1 = d3.scale.linear();
  var yScale2 = d3.scale.linear();
  var lines1 = nv.models.line().yScale(yScale1);
  var lines2 = nv.models.line().yScale(yScale2);
  var bars1 = nv.models.multiBar().stacked(false).yScale(yScale1);
  var bars2 = nv.models.multiBar().stacked(false).yScale(yScale2);
  var stack1 = nv.models.stackedArea().yScale(yScale1);
  var stack2 = nv.models.stackedArea().yScale(yScale2);
  var xAxis = nv.models.axis().scale(x).orient('bottom').tickPadding(5);
  var yAxis1 = nv.models.axis().scale(yScale1).orient('left');
  var yAxis2 = nv.models.axis().scale(yScale2).orient('right');
  var legend = nv.models.legend().height(30);
  var dispatch = d3.dispatch('tooltipShow', 'tooltipHide');

  var showTooltip = (e, offsetElement) => {
    var left = e.pos[0] + ( offsetElement.offsetLeft || 0 );
    var top = e.pos[1] + ( offsetElement.offsetTop || 0);
    var x = xAxis.tickFormat()(lines1.x()(e.point, e.pointIndex));
    var y = (e.series.bar ? yAxis1 : yAxis2).tickFormat()(lines1.y()(e.point, e.pointIndex));
    var content = tooltip(e.series.key, x, y, e, chart);

    nv.tooltip.show([left, top], content, undefined, undefined, offsetElement.offsetParent);
  };

  function chart(selection) {
    selection.each(function(data) {
      var container = d3.select(this);
      var that = this;

      var availableWidth = (width  || parseInt(container.style('width')) || 960)
                             - margin.left - margin.right;

      var availableHeight = (height || parseInt(container.style('height')) || 400)
                         - margin.top - margin.bottom;

      var dataLines1 = data.filter(d => !d.disabled && d.type == 'line' && d.yAxis == 1)
      var dataLines2 = data.filter(d => !d.disabled && d.type == 'line' && d.yAxis == 2)
      var dataBars1 = data.filter(d => !d.disabled && d.type == 'bar' && d.yAxis == 1)
      var dataBars2 = data.filter(d => !d.disabled && d.type == 'bar' && d.yAxis == 2)
      var dataStack1 = data.filter(d => !d.disabled && d.type == 'area' && d.yAxis == 1)
      var dataStack2 = data.filter(d => !d.disabled && d.type == 'area' && d.yAxis == 2)

      var series1 = data.filter(d => !d.disabled && d.yAxis == 1)
            .map(d => d.values.map((d, i) => ({
        x: d.x,
        y: d.y
      })))

      var series2 = data.filter(d => !d.disabled && d.yAxis == 2)
            .map(d => d.values.map((d, i) => ({
        x: d.x,
        y: d.y
      })))

      x   .domain(d3.extent(d3.merge(series1.concat(series2)), d => d.x ))
          .range([0, availableWidth]);

      var wrap = container.selectAll('g.wrap.multiChart').data([data]);
      var gEnter = wrap.enter().append('g').attr('class', 'wrap nvd3 multiChart').append('g');

      gEnter.append('g').attr('class', 'x axis');
      gEnter.append('g').attr('class', 'y1 axis');
      gEnter.append('g').attr('class', 'y2 axis');
      gEnter.append('g').attr('class', 'lines1Wrap');
      gEnter.append('g').attr('class', 'lines2Wrap');
      gEnter.append('g').attr('class', 'bars1Wrap');
      gEnter.append('g').attr('class', 'bars2Wrap');
      gEnter.append('g').attr('class', 'stack1Wrap');
      gEnter.append('g').attr('class', 'stack2Wrap');
      gEnter.append('g').attr('class', 'legendWrap');

      var g = wrap.select('g');

      if (showLegend) {
        legend.width( availableWidth / 2 );

        g.select('.legendWrap')
            .datum(data.map(series => { 
              series.originalKey = series.originalKey === undefined ? series.key : series.originalKey;
              series.key = series.originalKey + (series.yAxis == 1 ? '' : ' (right axis)');
              return series;
            }))
          .call(legend);

        if ( margin.top != legend.height()) {
          margin.top = legend.height();
          availableHeight = (height || parseInt(container.style('height')) || 400)
                             - margin.top - margin.bottom;
        }

        g.select('.legendWrap')
            .attr('transform', 'translate(' + ( availableWidth / 2 ) + ',' + (-margin.top) +')');
      }


      lines1
        .width(availableWidth)
        .height(availableHeight)
        .interpolate("monotone")
        .color(data.map((d, i) => d.color || color[i % color.length]).filter((d, i) => !data[i].disabled && data[i].yAxis == 1 && data[i].type == 'line'));

      lines2
        .width(availableWidth)
        .height(availableHeight)
        .interpolate("monotone")
        .color(data.map((d, i) => d.color || color[i % color.length]).filter((d, i) => !data[i].disabled && data[i].yAxis == 2 && data[i].type == 'line'));

      bars1
        .width(availableWidth)
        .height(availableHeight)
        .color(data.map((d, i) => d.color || color[i % color.length]).filter((d, i) => !data[i].disabled && data[i].yAxis == 1 && data[i].type == 'bar'));

      bars2
        .width(availableWidth)
        .height(availableHeight)
        .color(data.map((d, i) => d.color || color[i % color.length]).filter((d, i) => !data[i].disabled && data[i].yAxis == 2 && data[i].type == 'bar'));

      stack1
        .width(availableWidth)
        .height(availableHeight)
        .color(data.map((d, i) => d.color || color[i % color.length]).filter((d, i) => !data[i].disabled && data[i].yAxis == 1 && data[i].type == 'area'));

      stack2
        .width(availableWidth)
        .height(availableHeight)
        .color(data.map((d, i) => d.color || color[i % color.length]).filter((d, i) => !data[i].disabled && data[i].yAxis == 2 && data[i].type == 'area'));

      g.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


      var lines1Wrap = g.select('.lines1Wrap')
          .datum(dataLines1)
      var bars1Wrap = g.select('.bars1Wrap')
          .datum(dataBars1)
      var stack1Wrap = g.select('.stack1Wrap')
          .datum(dataStack1)

      var lines2Wrap = g.select('.lines2Wrap')
          .datum(dataLines2)
      var bars2Wrap = g.select('.bars2Wrap')
          .datum(dataBars2)
      var stack2Wrap = g.select('.stack2Wrap')
          .datum(dataStack2)

      var extraValue1 = dataStack1.length ? dataStack1.map(a => a.values).reduce((a, b) => a.map((aVal, i) => ({
        x: aVal.x,
        y: aVal.y + b[i].y
      }))).concat([{x:0, y:0}]) : []
      var extraValue2 = dataStack2.length ? dataStack2.map(a => a.values).reduce((a, b) => a.map((aVal, i) => ({
        x: aVal.x,
        y: aVal.y + b[i].y
      }))).concat([{x:0, y:0}]) : []

      yScale1 .domain(d3.extent(d3.merge(series1).concat(extraValue1), d => d.y ))
              .range([0, availableHeight])

      yScale2 .domain(d3.extent(d3.merge(series2).concat(extraValue2), d => d.y ))
              .range([0, availableHeight])

      lines1.yDomain(yScale1.domain())
      bars1.yDomain(yScale1.domain())
      stack1.yDomain(yScale1.domain())

      lines2.yDomain(yScale2.domain())
      bars2.yDomain(yScale2.domain())
      stack2.yDomain(yScale2.domain())

      if(dataStack1.length){d3.transition(stack1Wrap).call(stack1);}
      if(dataStack2.length){d3.transition(stack2Wrap).call(stack2);}

      if(dataBars1.length){d3.transition(bars1Wrap).call(bars1);}
      if(dataBars2.length){d3.transition(bars2Wrap).call(bars2);}

      if(dataLines1.length){d3.transition(lines1Wrap).call(lines1);}
      if(dataLines2.length){d3.transition(lines2Wrap).call(lines2);}



      xAxis
        .ticks( availableWidth / 100 )
        .tickSize(-availableHeight, 0);

      g.select('.x.axis')
          .attr('transform', 'translate(0,' + availableHeight + ')');
      d3.transition(g.select('.x.axis'))
          .call(xAxis);

      yAxis1
        .ticks( availableHeight / 36 )
        .tickSize( -availableWidth, 0);


      d3.transition(g.select('.y1.axis'))
          .call(yAxis1);

      yAxis2
        .ticks( availableHeight / 36 )
        .tickSize( -availableWidth, 0);

      d3.transition(g.select('.y2.axis'))
          .call(yAxis2);

      g.select('.y2.axis')
          .style('opacity', series2.length ? 1 : 0)
          .attr('transform', 'translate(' + x.range()[1] + ',0)');

      legend.dispatch.on('legendClick', (d, i) => { 
        d.disabled = !d.disabled;

        if (!data.filter(d => !d.disabled).length) {
          data.map(d => {
            d.disabled = false;
            wrap.selectAll('.series').classed('disabled', false);
            return d;
          });
        }
        selection.transition().call(chart);
      });

      dispatch.on('tooltipShow', e => {
        if (tooltips) showTooltip(e, that.parentNode);
      });
    });

    chart.update = () => { chart(selection) };
    chart.container = this;

    return chart;
  }


  //============================================================
  // Event Handling/Dispatching (out of chart's scope)
  //------------------------------------------------------------

  lines1.dispatch.on('elementMouseover.tooltip', e => {
    e.pos = [e.pos[0] +  margin.left, e.pos[1] + margin.top];
    dispatch.tooltipShow(e);
  });

  lines1.dispatch.on('elementMouseout.tooltip', e => {
    dispatch.tooltipHide(e);
  });

  lines2.dispatch.on('elementMouseover.tooltip', e => {
    e.pos = [e.pos[0] +  margin.left, e.pos[1] + margin.top];
    dispatch.tooltipShow(e);
  });

  lines2.dispatch.on('elementMouseout.tooltip', e => {
    dispatch.tooltipHide(e);
  });

  bars1.dispatch.on('elementMouseover.tooltip', e => {
    e.pos = [e.pos[0] +  margin.left, e.pos[1] + margin.top];
    dispatch.tooltipShow(e);
  });

  bars1.dispatch.on('elementMouseout.tooltip', e => {
    dispatch.tooltipHide(e);
  });

  bars2.dispatch.on('elementMouseover.tooltip', e => {
    e.pos = [e.pos[0] +  margin.left, e.pos[1] + margin.top];
    dispatch.tooltipShow(e);
  });

  bars2.dispatch.on('elementMouseout.tooltip', e => {
    dispatch.tooltipHide(e);
  });

  stack1.dispatch.on('tooltipShow', e => {
    //disable tooltips when value ~= 0
    //// TODO: consider removing points from voronoi that have 0 value instead of this hack
    if (!Math.round(stack1.y()(e.point) * 100)) {  // 100 will not be good for very small numbers... will have to think about making this valu dynamic, based on data range
      setTimeout(() => { d3.selectAll('.point.hover').classed('hover', false) }, 0);
      return false;
    }

    e.pos = [e.pos[0] + margin.left, e.pos[1] + margin.top],
    dispatch.tooltipShow(e);
  });

  stack1.dispatch.on('tooltipHide', e => {
    dispatch.tooltipHide(e);
  });

  stack2.dispatch.on('tooltipShow', e => {
    //disable tooltips when value ~= 0
    //// TODO: consider removing points from voronoi that have 0 value instead of this hack
    if (!Math.round(stack2.y()(e.point) * 100)) {  // 100 will not be good for very small numbers... will have to think about making this valu dynamic, based on data range
      setTimeout(() => { d3.selectAll('.point.hover').classed('hover', false) }, 0);
      return false;
    }

    e.pos = [e.pos[0] + margin.left, e.pos[1] + margin.top],
    dispatch.tooltipShow(e);
  });

  stack2.dispatch.on('tooltipHide', e => {
    dispatch.tooltipHide(e);
  });

  lines1.dispatch.on('elementMouseover.tooltip', e => {
  e.pos = [e.pos[0] +  margin.left, e.pos[1] + margin.top];
  dispatch.tooltipShow(e);
});

  lines1.dispatch.on('elementMouseout.tooltip', e => {
    dispatch.tooltipHide(e);
  });

  lines2.dispatch.on('elementMouseover.tooltip', e => {
    e.pos = [e.pos[0] +  margin.left, e.pos[1] + margin.top];
    dispatch.tooltipShow(e);
  });

  lines2.dispatch.on('elementMouseout.tooltip', e => {
    dispatch.tooltipHide(e);
  });

  dispatch.on('tooltipHide', () => {
    if (tooltips) nv.tooltip.cleanup();
  });



  //============================================================
  // Global getters and setters
  //------------------------------------------------------------

  chart.dispatch = dispatch;
  chart.lines1 = lines1;
  chart.lines2 = lines2;
  chart.bars1 = bars1;
  chart.bars2 = bars2;
  chart.stack1 = stack1;
  chart.stack2 = stack2;
  chart.xAxis = xAxis;
  chart.yAxis1 = yAxis1;
  chart.yAxis2 = yAxis2;

  chart.x = function(_) {
    if (!arguments.length) return getX;
    getX = _;
    lines1.x(_);
    bars1.x(_);
    return chart;
  };

  chart.y = function(_) {
    if (!arguments.length) return getY;
    getY = _;
    lines1.y(_);
    bars1.y(_);
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
    color = _;
    legend.color(_);
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

  return chart;
}

