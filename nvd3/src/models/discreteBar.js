
nv.models.discreteBar = () => {
  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var margin = {top: 0, right: 0, bottom: 0, left: 0};

  var width = 960;
  var height = 500;

  var //Create semi-unique ID in case user doesn't select one
  id = Math.floor(Math.random() * 10000);

  var x = d3.scale.ordinal();
  var y = d3.scale.linear();
  var getX = d => d.x;
  var getY = d => d.y;

  var // 0 is forced by default.. this makes sense for the majority of bar graphs... user can always do chart.forceY([]) to remove
  forceY = [0];

  var color = nv.utils.defaultColor();
  var showValues = false;
  var valueFormat = d3.format(',.2f');
  var xDomain;
  var yDomain;

  //============================================================
  // Private Variables
  //------------------------------------------------------------

  var dispatch = d3.dispatch('chartClick', 'elementClick', 'elementDblClick', 'elementMouseover', 'elementMouseout');

  var x0;
  var y0;


  function chart(selection) {
    selection.each(function(data) {
      var availableWidth = width - margin.left - margin.right;
      var availableHeight = height - margin.top - margin.bottom;


      //add series index to each data point for reference
      data = data.map((series, i) => {
        series.values = series.values.map(point => {
          point.series = i;
          return point;
        });
        return series;
      });


      var seriesData = (xDomain && yDomain) ? [] : // if we know xDomain and yDomain, no need to calculate
            data.map(d => d.values.map((d, i) => ({
              x: getX(d,i),
              y: getY(d,i),
              y0: d.y0
            })));

      x   .domain(xDomain || d3.merge(seriesData).map(d => d.x))
          .rangeBands([0, availableWidth], .1);

      y   .domain(yDomain || d3.extent(d3.merge(seriesData).map(d => d.y).concat(forceY)));


      // If showValues, pad the Y axis range to account for label height
      if (showValues) y.range([availableHeight - (y.domain()[0] < 0 ? 12 : 0), y.domain()[1] > 0 ? 12 : 0]);
      else y.range([availableHeight, 0]);

      //store old scales if they exist
      x0 = x0 || x;
      y0 = y0 || y.copy().range([y(0),y(0)]);


      var wrap = d3.select(this).selectAll('g.nv-wrap.nv-discretebar').data([data]);
      var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-discretebar');
      var gEnter = wrapEnter.append('g');

      gEnter.append('g').attr('class', 'nv-groups');

      var g = wrap.select('g')
      wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');



      //TODO: by definition, the discrete bar should not have multiple groups, will modify/remove later
      var groups = wrap.select('.nv-groups').selectAll('.nv-group')
          .data(d => d, d => d.key);
      groups.enter().append('g')
          .style('stroke-opacity', 1e-6)
          .style('fill-opacity', 1e-6);
      d3.transition(groups.exit())
          .style('stroke-opacity', 1e-6)
          .style('fill-opacity', 1e-6)
          .remove();
      groups
          .attr('class', (d, i) => 'nv-group nv-series-' + i)
          .classed('hover', d => d.hover);
      d3.transition(groups)
          .style('stroke-opacity', 1)
          .style('fill-opacity', .75);


      var bars = groups.selectAll('g.nv-bar')
          .data(d => d.values);

      bars.exit().remove();


      var barsEnter = bars.enter().append('g')
          .attr('transform', (d, i, j) => 'translate(' + x(getX(d,i)) + ', ' + y(0) + ')')
          .on('mouseover', function(d,i) { //TODO: figure out why j works above, but not here
            d3.select(this).classed('hover', true);
            dispatch.elementMouseover({
              value: getY(d,i),
              point: d,
              series: data[d.series],
              pos: [x(getX(d,i)) + (x.rangeBand() * (d.series + .5) / data.length), y(getY(d,i))],  // TODO: Figure out why the value appears to be shifted
              pointIndex: i,
              seriesIndex: d.series,
              e: d3.event
            });
          })
          .on('mouseout', function(d,i) {
            d3.select(this).classed('hover', false);
            dispatch.elementMouseout({
              value: getY(d,i),
              point: d,
              series: data[d.series],
              pointIndex: i,
              seriesIndex: d.series,
              e: d3.event
            });
          })
          .on('click', (d, i) => {
            dispatch.elementClick({
              value: getY(d,i),
              point: d,
              series: data[d.series],
              pos: [x(getX(d,i)) + (x.rangeBand() * (d.series + .5) / data.length), y(getY(d,i))],  // TODO: Figure out why the value appears to be shifted
              pointIndex: i,
              seriesIndex: d.series,
              e: d3.event
            });
            d3.event.stopPropagation();
          })
          .on('dblclick', (d, i) => {
            dispatch.elementDblClick({
              value: getY(d,i),
              point: d,
              series: data[d.series],
              pos: [x(getX(d,i)) + (x.rangeBand() * (d.series + .5) / data.length), y(getY(d,i))],  // TODO: Figure out why the value appears to be shifted
              pointIndex: i,
              seriesIndex: d.series,
              e: d3.event
            });
            d3.event.stopPropagation();
          });

      barsEnter.append('rect')
          .attr('height', 0)
          .attr('width', x.rangeBand() / data.length )
          .style('fill', (d, i) => d.color || color(d, i)) 
          .style('stroke', (d, i) => d.color || color(d, i));

      if (showValues) {
        barsEnter.append('text')
          .attr('text-anchor', 'middle')
        bars.selectAll('text')
          .attr('x', x.rangeBand() / 2)
          .attr('y', (d, i) => getY(d,i) < 0 ? y(getY(d,i)) - y(0) + 12 : -4)
          .text((d, i) => valueFormat(getY(d,i)));
      } else {
        bars.selectAll('text').remove();
      }

      bars
          .attr('class', (d, i) => getY(d,i) < 0 ? 'nv-bar negative' : 'nv-bar positive')
          //.attr('transform', function(d,i) { return 'translate(' + x(getX(d,i)) + ',0)'; })
          .attr('transform', (d, i) => 'translate(' + x(getX(d,i)) + ', ' + (getY(d,i) < 0 ? y0(0) : y0(getY(d,i))) + ')')
        .selectAll('rect')
          .attr('width', x.rangeBand() / data.length);
      d3.transition(bars)
        //.delay(function(d,i) { return i * 1200 / data[0].values.length })
          .attr('transform', (d, i) => 'translate(' + x(getX(d,i)) + ', ' + (getY(d,i) < 0 ? y(0) : y(getY(d,i))) + ')')
        .selectAll('rect')
          .attr('height', (d, i) => Math.abs(y(getY(d,i)) - y(0)));



      //TODO: decide if this makes sense to add into all the models for ease of updating (updating without needing the selection)
      chart.update = () => { chart(selection) };

      //store old scales for use in transitions on update, to animate from old to new positions, and sizes
      x0 = x.copy();
      y0 = y.copy();
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

  chart.forceY = function(_) {
    if (!arguments.length) return forceY;
    forceY = _;
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

  chart.showValues = function(_) {
    if (!arguments.length) return showValues;
    showValues = _;
    return chart;
  };

  chart.valueFormat= function(_) {
    if (!arguments.length) return valueFormat;
    valueFormat = _;
    return chart;
  };


  return chart;
}
