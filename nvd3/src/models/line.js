
nv.models.line = () => {
    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var margin = {top: 0, right: 0, bottom: 0, left: 0}; // controls the line interpolation

    var width = 960;
    var height = 500;

    var // a function that returns a color
    color = nv.utils.defaultColor();

    var //Create semi-unique ID incase user doesn't select one
    id = Math.floor(Math.random() * 10000);

    var // accessor to get the x value from a data point
    getX = d => d.x;

    var // accessor to get the y value from a data point
    getY = d => d.y;

    var // allows a line to be not continous when it is not defined
    defined = (d, i) => !isNaN(getY(d,i)) && getY(d,i) !== null;

    var // decides if a line is an area or just a line
    isArea = d => d.area;

    var // if true, masks lines within x and y scale
    clipEdge = false;

    var x;

    var //can be accessed via chart.scatter.[x/y]Scale()
    y;

    var interpolate = "linear";

    //============================================================
    // Private Variables
    //------------------------------------------------------------

    var //set to speed up calculation, needs to be unset if there is a cstom size accessor
    scatter = nv.models.scatter()
                    .id(id)
                    .size(16) // default size
                    .sizeDomain([16,256]);

    var x0;
    var y0;
    var timeoutID;


    function chart(selection) {
      selection.each(function(data) {
          var availableWidth = width - margin.left - margin.right;
          var availableHeight = height - margin.top - margin.bottom;
          var container = d3.select(this);

          x = scatter.xScale();
          y = scatter.yScale();

          x0 = x0 || x;
          y0 = y0 || y;


          var wrap = container.selectAll('g.nv-wrap.nv-line').data([data]);
          var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-line');
          var defsEnter = wrapEnter.append('defs');
          var gEnter = wrapEnter.append('g');
          var g = wrap.select('g')

          gEnter.append('g').attr('class', 'nv-groups');
          gEnter.append('g').attr('class', 'nv-scatterWrap');

          var scatterWrap = wrap.select('.nv-scatterWrap');//.datum(data);


          scatter
            .width(availableWidth)
            .height(availableHeight)

          d3.transition(scatterWrap).call(scatter);



          wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


          defsEnter.append('clipPath')
              .attr('id', 'nv-edge-clip-' + id)
            .append('rect');

          wrap.select('#nv-edge-clip-' + id + ' rect')
              .attr('width', availableWidth)
              .attr('height', availableHeight);

          g   .attr('clip-path', clipEdge ? 'url(#nv-edge-clip-' + id + ')' : '');
          scatterWrap
              .attr('clip-path', clipEdge ? 'url(#nv-edge-clip-' + id + ')' : '');




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
              .classed('hover', d => d.hover)
              .style('fill', (d, i) => color(d, i))
              .style('stroke', (d, i) => color(d, i));
          d3.transition(groups)
              .style('stroke-opacity', 1)
              .style('fill-opacity', .5);



          var areaPaths = groups.selectAll('path.nv-area')
              .data(d => [d]); // this is done differently than lines because I need to check if series is an area
          areaPaths.enter().append('path')
              .filter(isArea)
              .attr('class', 'nv-area')
              .attr('d', function(d) {
                return d3.svg.area()
                    .interpolate(interpolate)
                    .defined(defined)
                    .x((d, i) => x0(getX(d,i)))
                    .y0((d, i) => y0(getY(d,i)))
                    .y1((d, i) => y0( y.domain()[0] <= 0 ? y.domain()[1] >= 0 ? 0 : y.domain()[1] : y.domain()[0] ))
                    //.y1(function(d,i) { return y0(0) }) //assuming 0 is within y domain.. may need to tweak this
                    .apply(this, [d.values]);
              });
          d3.transition(groups.exit().selectAll('path.nv-area'))
              .attr('d', function(d) {
                return d3.svg.area()
                    .interpolate(interpolate)
                    .defined(defined)
                    .x((d, i) => x0(getX(d,i)))
                    .y0((d, i) => y0(getY(d,i)))
                    .y1((d, i) => y0( y.domain()[0] <= 0 ? y.domain()[1] >= 0 ? 0 : y.domain()[1] : y.domain()[0] ))
                    //.y1(function(d,i) { return y0(0) }) //assuming 0 is within y domain.. may need to tweak this
                    .apply(this, [d.values]);
              });
          d3.transition(areaPaths.filter(isArea))
              .attr('d', function(d) {
                return d3.svg.area()
                    .interpolate(interpolate)
                    .defined(defined)
                    .x((d, i) => x0(getX(d,i)))
                    .y0((d, i) => y0(getY(d,i)))
                    .y1((d, i) => y0( y.domain()[0] <= 0 ? y.domain()[1] >= 0 ? 0 : y.domain()[1] : y.domain()[0] ))
                    //.y1(function(d,i) { return y0(0) }) //assuming 0 is within y domain.. may need to tweak this
                    .apply(this, [d.values]);
              });



          var linePaths = groups.selectAll('path.nv-line')
              .data(d => [d.values]);
          linePaths.enter().append('path')
              .attr('class', d => 'nv-line')
              .attr('d',
                d3.svg.line()
                  .interpolate(interpolate)
                  .defined(defined)
                  .x((d, i) => x0(getX(d,i)))
                  .y((d, i) => y0(getY(d,i)))
              );
          d3.transition(groups.exit().selectAll('path.nv-line'))
              .attr('d',
                d3.svg.line()
                  .interpolate(interpolate)
                  .defined(defined)
                  .x((d, i) => x(getX(d,i)))
                  .y((d, i) => y(getY(d,i)))
              );
          d3.transition(linePaths)
              .attr('d',
                d3.svg.line()
                  .interpolate(interpolate)
                  .defined(defined)
                  .x((d, i) => x(getX(d,i)))
                  .y((d, i) => y(getY(d,i)))
              );



          //store old scales for use in transitions on update
          x0 = x.copy();
          y0 = y.copy();
      });

      return chart;
    }


    //============================================================
    // Global getters and setters
    //------------------------------------------------------------

    chart.dispatch = scatter.dispatch;

    d3.rebind(chart, scatter, 'interactive', 'size', 'xScale', 'yScale', 'zScale', 'xDomain', 'yDomain', 'sizeDomain', 'forceX', 'forceY', 'forceSize', 'clipVoronoi', 'clipRadius');

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
      getX = _;
      scatter.x(_);
      return chart;
    };

    chart.y = function(_) {
      if (!arguments.length) return getY;
      getY = _;
      scatter.y(_);
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
      scatter.color(color);
      return chart;
    };

    chart.id = function(_) {
      if (!arguments.length) return id;
      id = _;
      return chart;
    };

    chart.interpolate = function(_) {
      if (!arguments.length) return interpolate;
      interpolate = _;
      return chart;
    };

    chart.defined = function(_) {
      if (!arguments.length) return defined;
      defined = _;
      return chart;
    };

    chart.isArea = function(_) {
      if (!arguments.length) return isArea;
      isArea = d3.functor(_);
      return chart;
    };

    return chart;
}
