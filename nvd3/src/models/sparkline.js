
nv.models.sparkline = () => {
  var margin = {top: 0, right: 0, bottom: 0, left: 0};
  var width = 400;
  var height = 32;
  var animate = true;
  var getX = d => d.x;
  var getY = d => d.y;
  var color = nv.utils.defaultColor();
  var xDomain;
  var yDomain;
  var x = d3.scale.linear();
  var y = d3.scale.linear();

  function chart(selection) {
    selection.each(function(data) {
      var availableWidth = width - margin.left - margin.right;
      var availableHeight = height - margin.top - margin.bottom;


      x   .domain(xDomain || d3.extent(data, getX ))
          .range([0, availableWidth]);

      y   .domain(yDomain || d3.extent(data,getY ))
          .range([availableHeight, 0]);


      var wrap = d3.select(this).selectAll('g.nv-wrap.nv-sparkline').data([data]);

      var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-sparkline');
      //var gEnter = svg.enter().append('svg').append('g');
      //gEnter.append('g').attr('class', 'sparkline')
      gEnter
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
          .style('stroke', (d, i) => d.color || color(d, i));

      /*
            d3.select(this)
                .attr('width', width)
                .attr('height', height);
               */


      //var paths = gEnter.select('.sparkline').selectAll('path')
      var paths = gEnter.selectAll('path')
          .data(d => [d]);
      paths.enter().append('path');
      paths.exit().remove();
      paths
          .attr('d', d3.svg.line()
            .x((d, i) => x(getX(d,i)))
            .y((d, i) => y(getY(d,i)))
          );


      // TODO: Add CURRENT data point (Need Min, Mac, Current / Most recent)
      var points = gEnter.selectAll('circle.nv-point')
          .data(d => d.filter((p, i) => y.domain().indexOf(getY(p,i)) != -1 || getX(p,i) == x.domain()[1]));
      points.enter().append('circle').attr('class', 'nv-point');
      points.exit().remove();
      points
          .attr('cx', (d, i) => x(getX(d,i)))
          .attr('cy', (d, i) => y(getY(d,i)))
          .attr('r', 2)
          .style('stroke', (d, i) => d.x == x.domain()[1] ? '#444' : d.y == y.domain()[0] ? '#d62728' : '#2ca02c')
          .style('fill', (d, i) => d.x == x.domain()[1] ? '#444' : d.y == y.domain()[0] ? '#d62728' : '#2ca02c');
    });

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

  chart.x = function(_) {
    if (!arguments.length) return getX;
    getX = d3.functor(_);
    return chart;
  };

  chart.y = function(_) {
    if (!arguments.length) return getY;
    getY = d3.functor(_);
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

  chart.animate = function(_) {
    if (!arguments.length) return animate;
    animate = _;
    return chart;
  };

  return chart;
}
