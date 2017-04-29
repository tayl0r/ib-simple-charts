
nv.models.distribution = () => {
    var margin = {top: 0, right: 0, bottom: 0, left: 0};

    var //technically width or height depending on x or y....
    width = 400;

    var size = 8;

    var // 'x' or 'y'... horizontal or vertical
    axis = 'x';

    var // defaults d.x or d.y
    getData = d => d[axis];

    var color = nv.utils.defaultColor();
    var domain;
    var scale = d3.scale.linear();
    var scale0;

    function chart(selection) {
      selection.each(function(data) {
          var availableLength = width - (axis === 'x' ? margin.left + margin.right : margin.top + margin.bottom);
          var naxis = axis == 'x' ? 'y' : 'x';


          //store old scales if they exist
          scale0 = scale0 || scale;

          /*
                scale
                    .domain(domain || d3.extent(data, getData))
                    .range(axis == 'x' ? [0, availableLength] : [availableLength,0]);
          */


          var wrap = d3.select(this).selectAll('g.nv-distribution').data([data]);
          var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-distribution');
          var gEnter = wrapEnter.append('g');
          var g = wrap.select('g');

          wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

          var distWrap = g.selectAll('g.nv-dist')
              .data(d => d, d => d.key);

          distWrap.enter().append('g')
          distWrap
              .attr('class', (d, i) => 'nv-dist nv-series-' + i)
              .style('stroke', (d, i) => color(d, i));
          //.style('stroke', function(d,i) { return color.filter(function(d,i) { return data[i] && !data[i].disabled })[i % color.length] });

          var dist = distWrap.selectAll('line.nv-dist' + axis)
              .data(d => d.values)
          dist.enter().append('line')
              .attr(axis + '1', (d, i) => scale0(getData(d,i)))
              .attr(axis + '2', (d, i) => scale0(getData(d,i)))
          d3.transition(distWrap.exit().selectAll('line.nv-dist' + axis))
              .attr(axis + '1', (d, i) => scale(getData(d,i)))
              .attr(axis + '2', (d, i) => scale(getData(d,i)))
              .style('stroke-opacity', 0)
              .remove();
          dist
          //distWrap.selectAll('line.dist' + axis)
              .attr('class', (d, i) => 'nv-dist' + axis + ' nv-dist' + axis + '-' + i)
              .attr(naxis + '1', 0)
              .attr(naxis + '2', size);
          d3.transition(dist)
          //d3.transition(distWrap.selectAll('line.dist' + axis))
              .attr(axis + '1', (d, i) => scale(getData(d,i)))
              .attr(axis + '2', (d, i) => scale(getData(d,i)))


          scale0 = scale.copy();
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

    chart.axis = function(_) {
      if (!arguments.length) return axis;
      axis = _;
      return chart;
    };

    chart.size = function(_) {
      if (!arguments.length) return size;
      size = _;
      return chart;
    };

    chart.getData = function(_) {
      if (!arguments.length) return getData;
      getData = d3.functor(_);
      return chart;
    };

    chart.scale = function(_) {
      if (!arguments.length) return scale;
      scale = _;
      return chart;
    };

    chart.color = function(_) {
      if (!arguments.length) return color;
      color = nv.utils.getColor(_);
      return chart;
    };

    return chart;
}
