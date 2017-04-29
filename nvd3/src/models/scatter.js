
nv.models.scatter = () => {
  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var margin      = {top: 0, right: 0, bottom: 0, left: 0};

  var width       = 960;
  var height      = 500;

  var // chooses color
  color       = nv.utils.defaultColor();

  var //Create semi-unique ID incase user doesn't selet one
  id          = Math.floor(Math.random() * 100000);

  var x           = d3.scale.linear();
  var y           = d3.scale.linear();

  var //linear because d3.svg.shape.size is treated as area
  z           = d3.scale.linear();

  var // accessor to get the x value
  getX        = d => d.x;

  var // accessor to get the y value
  getY        = d => d.y;

  var // accessor to get the point size
  getSize     = d => d.size;

  var // accessor to get point shape
  getShape    = d => d.shape || 'circle';

  var // List of numbers to Force into the X scale (ie. 0, or a max / min, etc.)
  forceX      = [];

  var // List of numbers to Force into the Y scale
  forceY      = [];

  var // List of numbers to Force into the Size scale
  forceSize   = [];

  var // If true, plots a voronoi overlay for advanced point interection
  interactive = true;

  var // any points that return false will be filtered out
  pointActive = d => !d.notActive;

  var // if true, masks points within x and y scale
  clipEdge    = false;

  var // if true, masks each point with a circle... can turn off to slightly increase performance
  clipVoronoi = true;

  var // function to get the radius for voronoi point clips
  clipRadius  = () => 25;

  var // Override x domain (skips the calculation from data)
  xDomain     = null;

  var // Override y domain
  yDomain     = null;

  var // Override point size domain
  sizeDomain  = null;

  var sizeRange   = null;
  var singlePoint = false;
  var dispatch    = d3.dispatch('elementClick', 'elementMouseover', 'elementMouseout');

  //============================================================


  //============================================================
  // Private Variables
  //------------------------------------------------------------

  var x0;

  var y0;

  var // used to store previous scales
  z0;

  var timeoutID;

  //============================================================


  function chart(selection) {
    selection.each(function(data) {
      var availableWidth = width - margin.left - margin.right;
      var availableHeight = height - margin.top - margin.bottom;
      var container = d3.select(this);

      //add series index to each data point for reference
      data = data.map((series, i) => {
        series.values = series.values.map(point => {
          point.series = i;
          return point;
        });
        return series;
      });



      //------------------------------------------------------------
      // Setup Scales

      // remap and flatten the data for use in calculating the scales' domains
      var seriesData = (xDomain && yDomain && sizeDomain) ? [] : // if we know xDomain and yDomain and sizeDomain, no need to calculate.... if Size is constant remember to set sizeDomain to speed up performance
            d3.merge(
              data.map(d => d.values.map((d, i) => ({
                x: getX(d,i),
                y: getY(d,i),
                size: getSize(d,i)
              })))
            );

      x   .domain(xDomain || d3.extent(seriesData.map(d => d.x).concat(forceX)))
          .range([0, availableWidth]);

      y   .domain(yDomain || d3.extent(seriesData.map(d => d.y).concat(forceY)))
          .range([availableHeight, 0]);

      z   .domain(sizeDomain || d3.extent(seriesData.map(d => d.size).concat(forceSize)))
          .range(sizeRange || [16, 256]);

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


      x0 = x0 || x;
      y0 = y0 || y;
      z0 = z0 || z;

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Setup containers and skeleton of chart

      var wrap = container.selectAll('g.nv-wrap.nv-scatter').data([data]);
      var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-scatter nv-chart-' + id + (singlePoint ? ' nv-single-point' : ''));
      var defsEnter = wrapEnter.append('defs');
      var gEnter = wrapEnter.append('g');
      var g = wrap.select('g');

      gEnter.append('g').attr('class', 'nv-groups');
      gEnter.append('g').attr('class', 'nv-point-paths');

      wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      //------------------------------------------------------------


      defsEnter.append('clipPath')
          .attr('id', 'nv-edge-clip-' + id)
        .append('rect');

      wrap.select('#nv-edge-clip-' + id + ' rect')
          .attr('width', availableWidth)
          .attr('height', availableHeight);

      g   .attr('clip-path', clipEdge ? 'url(#nv-edge-clip-' + id + ')' : '');



      function updateInteractiveLayer() {

        if (!interactive) return false;


        var vertices = d3.merge(data.map((group, groupIndex) => group.values
          .filter(pointActive) // remove non-interactive points
          .map((point, pointIndex) => // *Adding noise to make duplicates very unlikely
        // **Injecting series and point index for reference
        //temp hack to add noise untill I think of a better way so there are no duplicates
        [
          x(getX(point,pointIndex)) * (Math.random() / 1e12 + 1),
          y(getY(point,pointIndex)) * (Math.random() / 1e12 + 1),
          groupIndex,
          pointIndex
        ]))
        );


        if (clipVoronoi) {
          defsEnter.append('clipPath').attr('id', 'nv-points-clip-' + id);

          var pointClips = wrap.select('#nv-points-clip-' + id).selectAll('circle')
              .data(vertices);
          pointClips.enter().append('circle')
              .attr('r', clipRadius);
          pointClips.exit().remove();
          pointClips
              .attr('cx', d => d[0])
              .attr('cy', d => d[1]);

          wrap.select('.nv-point-paths')
              .attr('clip-path', 'url(#nv-points-clip-' + id + ')');
        }


        //inject series and point index for reference into voronoi
        var voronoi = d3.geom.voronoi(vertices).map((d, i) => ({
          'data': d,
          'series': vertices[i][2],
          'point': vertices[i][3]
        }));


        var pointPaths = wrap.select('.nv-point-paths').selectAll('path')
            .data(voronoi);
        pointPaths.enter().append('path')
            .attr('class', (d, i) => 'nv-path-'+i);
        pointPaths.exit().remove();
        pointPaths
            .attr('d', d => 'M' + d.data.join(',') + 'Z')
            .on('click', d => {
          var series = data[d.series];
          var point  = series.values[d.point];

          dispatch.elementClick({
            point,
            series,
            pos: [x(getX(point, d.point)) + margin.left, y(getY(point, d.point)) + margin.top],
            seriesIndex: d.series,
            pointIndex: d.point
          });
        })
            .on('mouseover', d => {
          var series = data[d.series];
          var point  = series.values[d.point];

          dispatch.elementMouseover({
            point,
            series,
            pos: [x(getX(point, d.point)) + margin.left, y(getY(point, d.point)) + margin.top],
            seriesIndex: d.series,
            pointIndex: d.point
          });
        })
            .on('mouseout', (d, i) => {
          var series = data[d.series];
          var point  = series.values[d.point];

          dispatch.elementMouseout({
            point,
            series,
            seriesIndex: d.series,
            pointIndex: d.point
          });
        });

      }



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
          .style('fill', (d, i) => color(d, i))
          .style('stroke', (d, i) => color(d, i))
          .style('stroke-opacity', 1)
          .style('fill-opacity', .5);


      var points = groups.selectAll('path.nv-point')
          .data(d => d.values);
      points.enter().append('path')
          .attr('transform', (d, i) => 'translate(' + x0(getX(d,i)) + ',' + y0(getY(d,i)) + ')')
          .attr('d',
            d3.svg.symbol()
              .type(getShape)
              .size((d, i) => z(getSize(d,i)))
          );
      points.exit().remove();
      d3.transition(groups.exit().selectAll('path.nv-point'))
          .attr('transform', (d, i) => 'translate(' + x(getX(d,i)) + ',' + y(getY(d,i)) + ')')
          .remove();
      points.attr('class', (d, i) => 'nv-point nv-point-' + i);
      d3.transition(points)
          .attr('transform', (d, i) => 'translate(' + x(getX(d,i)) + ',' + y(getY(d,i)) + ')')
          .attr('d',
            d3.svg.symbol()
              .type(getShape)
              .size((d, i) => z(getSize(d,i)))
          );


      // Delay updating the invisible interactive layer for smoother animation
      clearTimeout(timeoutID); // stop repeat calls to updateInteractiveLayer
      timeoutID = setTimeout(updateInteractiveLayer, 1000);

      //store old scales for use in transitions on update
      x0 = x.copy();
      y0 = y.copy();
      z0 = z.copy();
    });

    return chart;
  }


  //============================================================
  // Event Handling/Dispatching (out of chart's scope)
  //------------------------------------------------------------

  dispatch.on('elementMouseover.point', d => {
    if (interactive)
      d3.select('.nv-chart-' + id + ' .nv-series-' + d.seriesIndex + ' .nv-point-' + d.pointIndex)
          .classed('hover', true);
  });

  dispatch.on('elementMouseout.point', d => {
    if (interactive)
      d3.select('.nv-chart-' + id + ' .nv-series-' + d.seriesIndex + ' .nv-point-' + d.pointIndex)
          .classed('hover', false);
  });

  //============================================================


  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------

  chart.dispatch = dispatch;

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

  chart.size = function(_) {
    if (!arguments.length) return getSize;
    getSize = d3.functor(_);
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

  chart.zScale = function(_) {
    if (!arguments.length) return z;
    z = _;
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

  chart.sizeDomain = function(_) {
    if (!arguments.length) return sizeDomain;
    sizeDomain = _;
    return chart;
  };

  chart.sizeRange = function(_) {
    if (!arguments.length) return sizeRange;
    sizeRange = _;
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

  chart.forceSize = function(_) {
    if (!arguments.length) return forceSize;
    forceSize = _;
    return chart;
  };

  chart.interactive = function(_) {
    if (!arguments.length) return interactive;
    interactive = _;
    return chart;
  };

  chart.pointActive = function(_) {
    if (!arguments.length) return pointActive;
    pointActive = _;
    return chart;
  };

  chart.clipEdge = function(_) {
    if (!arguments.length) return clipEdge;
    clipEdge = _;
    return chart;
  };

  chart.clipVoronoi= function(_) {
    if (!arguments.length) return clipVoronoi;
    clipVoronoi = _;
    return chart;
  };

  chart.clipRadius = function(_) {
    if (!arguments.length) return clipRadius;
    clipRadius = _;
    return chart;
  };

  chart.color = function(_) {
    if (!arguments.length) return color;
    color = nv.utils.getColor(_);
    return chart;
  };

  chart.shape = function(_) {
    if (!arguments.length) return getShape;
    getShape = _;
    return chart;
  };

  chart.id = function(_) {
    if (!arguments.length) return id;
    id = _;
    return chart;
  };

  chart.singlePoint = function(_) {
    if (!arguments.length) return singlePoint;
    singlePoint = _;
    return chart;
  };

  //============================================================


  return chart;
}
