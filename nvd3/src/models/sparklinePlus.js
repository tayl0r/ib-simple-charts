
nv.models.sparklinePlus = () => {
    var margin = {top: 15, right: 40, bottom: 3, left: 40};
    var width = 400;
    var height = 50;
    var animate = true;
    var getX = d => d.x;
    var getY = d => d.y;
    var color = nv.utils.defaultColor();

    var //Create semi-unique ID incase user doesn't selet one
    id = Math.floor(Math.random() * 100000);

    var xTickFormat = d3.format(',r');
    var yTickFormat = d3.format(',.2f');
    var noData = "No Data Available.";
    var x = d3.scale.linear();
    var y = d3.scale.linear();
    var sparkline = nv.models.sparkline();

    function chart(selection) {
      selection.each(function(data) {
          var availableWidth = width - margin.left - margin.right;
          var availableHeight = height - margin.top - margin.bottom;


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



          x   .domain(d3.extent(data, getX ))
              .range([0, availableWidth]);

          y   .domain(d3.extent(data, getY ))
              .range([availableHeight, 0]);


          var wrap = d3.select(this).selectAll('g.nv-wrap.nv-sparklineplus').data([data]);


          var gEnter = wrap.enter().append('g')
          //var gEnter = svg.enter().append('svg').append('g');
          var sparklineWrap = gEnter.append('g').attr('class', 'nvd3 nv-wrap nv-sparklineplus')
              .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
              .style('stroke', (d, i) => d.color || color(d, i));

          sparkline
            .xDomain(x.domain())
            .yDomain(y.domain());


          sparklineWrap
              //.attr('width', width)
              //.attr('height', height)
              .call(sparkline);

          var hoverValue = sparklineWrap.append('g').attr('class', 'nv-hoverValue');
          var hoverArea = sparklineWrap.append('g').attr('class', 'nv-hoverArea');


          hoverValue.attr('transform', d => 'translate(' + x(d) + ',0)');

          var hoverLine = hoverValue.append('line')
              .attr('x1', x.range()[1])
              .attr('y1', -margin.top)
              .attr('x2', x.range()[1])
              .attr('y2', height)

          var hoverX = hoverValue.append('text').attr('class', 'nv-xValue')
               .attr('text-anchor', 'end')
               .attr('dy', '.9em')

          var hoverY = hoverValue.append('text').attr('class', 'nv-yValue')
               //.attr('transform', function(d) { return 'translate(' + x(d) + ',0)' })
               .attr('text-anchor', 'start')
               .attr('dy', '.9em')


          hoverArea.append('rect')
              .attr('width', availableWidth)
              .attr('height', availableHeight)
              .on('mousemove', sparklineHover);



          function sparklineHover() {
            var pos = d3.event.offsetX - margin.left;

            hoverLine
                .attr('x1', pos)
                .attr('x2', pos);

            hoverX
                .attr('transform', d => 'translate(' + (pos - 6) + ',' + (-margin.top) + ')')
                //.text(xTickFormat(pos));
                .text(xTickFormat(Math.round(x.invert(pos)))); //TODO: refactor this line
            var f = (data, x) => {
                var distance = Math.abs(getX(data[0]) - x) ;
                var closestIndex = 0;
                for (var i = 0; i < data.length; i++){
                    if (Math.abs(getX(data[i]) - x) < distance) {
                        distance = Math.abs(getX(data[i]) -x);
                        closestIndex = i;
                    }
                }
                return closestIndex;
            }

            hoverY
                .attr('transform', d => 'translate(' + (pos + 6) + ',' + (-margin.top) + ')')
                //.text(data[pos] && yTickFormat(data[pos].y));
                .text(yTickFormat(getY(data[f(data, Math.round(x.invert(pos)))]))); //TODO: refactor this line
          }
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
      sparkline.width(_ - margin.left - margin.right);
      return chart;
    };

    chart.height = function(_) {
      if (!arguments.length) return height;
      height = _;
      sparkline.height(_ - margin.top - margin.bottom);
      return chart;
    };

    chart.x = function(_) {
      if (!arguments.length) return getX;
      getX = d3.functor(_);
      sparkline.x(_);
      return chart;
    };

    chart.y = function(_) {
      if (!arguments.length) return getY;
      getY = d3.functor(_);
      sparkline.y(_);
      return chart;
    };

    chart.id = function(_) {
      if (!arguments.length) return id;
      id = _;
      return chart;
    };

    chart.animate = function(_) {
      if (!arguments.length) return animate;
      animate = _;
      return chart;
    };

    chart.noData = function(_) {
      if (!arguments.length) return noData;
      noData = _;
      return chart;
    };


    return chart;
}
