
// Chart design based on the recommendations of Stephen Few. Implementation
// based on the work of Clint Ivy, Jamie Love, and Jason Davies.
// http://projects.instantcognition.com/protovis/bulletchart/
nv.models.bulletChart = () => {
  var // TODO top & bottom
  orient = 'left';

  var reverse = false;
  var margin = {top: 5, right: 40, bottom: 20, left: 120};
  var ranges = d => d.ranges;
  var markers = d => d.markers;
  var measures = d => d.measures;
  var width = null;
  var height = 55;
  var tickFormat = null;
  var tooltips = true;

  var tooltip = (key, x, y, e, graph) => '<h3>' + e.label + '</h3>' +
         '<p>' +  e.value + '</p>';

  var noData = "No Data Available.";
  var dispatch = d3.dispatch('tooltipShow', 'tooltipHide');
  var bullet = nv.models.bullet();


  var showTooltip = (e, offsetElement) => {
    var offsetElement = document.getElementById("chart");
    var left = e.pos[0] + offsetElement.offsetLeft + margin.left;
    var top = e.pos[1] + offsetElement.offsetTop + margin.top;

    var content = '<h3>' + e.label + '</h3>' +
            '<p>' + e.value + '</p>';

    nv.tooltip.show([left, top], content, e.value < 0 ? 'e' : 'w');
  };


  // For each small multipleâ€¦
  function chart(g) {
    g.each(function(d, i) {
      var container = d3.select(this);

      var availableWidth = (width  || parseInt(container.style('width')) || 960)
                             - margin.left - margin.right;

      var availableHeight = height - margin.top - margin.bottom;
      var that = this;


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



      var rangez = ranges.call(this, d, i).slice().sort(d3.descending);

      var markerz = markers.call(this, d, i).slice().sort(d3.descending);
      var measurez = measures.call(this, d, i).slice().sort(d3.descending);

      var wrap = container.selectAll('g.nv-wrap.nv-bulletChart').data([d]);
      var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-bulletChart');
      var gEnter = wrapEnter.append('g');

      gEnter.append('g').attr('class', 'nv-bulletWrap');
      gEnter.append('g').attr('class', 'nv-titles');

      var g = wrap.select('g')
      wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


      // Compute the new x-scale.
      var x1 = d3.scale.linear()
          .domain([0, Math.max(rangez[0], markerz[0], measurez[0])])  // TODO: need to allow forceX and forceY, and xDomain, yDomain
          .range(reverse ? [availableWidth, 0] : [0, availableWidth]);

      // Retrieve the old x-scale, if this is an update.
      var x0 = this.__chart__ || d3.scale.linear()
          .domain([0, Infinity])
          .range(x1.range());

      // Stash the new scale.
      this.__chart__ = x1;

      /*
      // Derive width-scales from the x-scales.
      var w0 = bulletWidth(x0),
          w1 = bulletWidth(x1);

      function bulletWidth(x) {
        var x0 = x(0);
        return function(d) {
          return Math.abs(x(d) - x(0));
        };
      }

      function bulletTranslate(x) {
        return function(d) {
          return 'translate(' + x(d) + ',0)';
        };
      }
      */

      var // TODO: could optimize by precalculating x0(0) and x1(0)
      w0 = d => Math.abs(x0(d) - x0(0));

      var w1 = d => Math.abs(x1(d) - x1(0));


      var title = g.select('.nv-titles').append("g")
          .attr("text-anchor", "end")
          .attr("transform", "translate(-6," + (height - margin.top - margin.bottom) / 2 + ")");
      title.append("text")
          .attr("class", "nv-title")
          .text(d => d.title);

      title.append("text")
          .attr("class", "nv-subtitle")
          .attr("dy", "1em")
          .text(d => d.subtitle);



      bullet
        .width(availableWidth)
        .height(availableHeight)

      var bulletWrap = g.select('.nv-bulletWrap')
      //.datum(data);

      d3.transition(bulletWrap).call(bullet);



      // Compute the tick format.
      var format = tickFormat || x1.tickFormat(8);

      // Update the tick groups.
      var tick = g.selectAll('g.nv-tick')
          .data(x1.ticks(8), function(d) {
            return this.textContent || format(d);
          });

      // Initialize the ticks with the old scale, x0.
      var tickEnter = tick.enter().append('g')
          .attr('class', 'nv-tick')
          .attr('transform', d => 'translate(' + x0(d) + ',0)')
          .style('opacity', 1e-6);

      tickEnter.append('line')
          .attr('y1', availableHeight)
          .attr('y2', availableHeight * 7 / 6);

      tickEnter.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '1em')
          .attr('y', availableHeight * 7 / 6)
          .text(format);

      // Transition the entering ticks to the new scale, x1.
      d3.transition(tickEnter)
          .attr('transform', d => 'translate(' + x1(d) + ',0)')
          .style('opacity', 1);

      // Transition the updating ticks to the new scale, x1.
      var tickUpdate = d3.transition(tick)
          .attr('transform', d => 'translate(' + x1(d) + ',0)')
          .style('opacity', 1);

      tickUpdate.select('line')
          .attr('y1', availableHeight)
          .attr('y2', availableHeight * 7 / 6);

      tickUpdate.select('text')
          .attr('y', availableHeight * 7 / 6);

      // Transition the exiting ticks to the new scale, x1.
      d3.transition(tick.exit())
          .attr('transform', d => 'translate(' + x1(d) + ',0)')
          .style('opacity', 1e-6)
          .remove();

      /*
            bullet.dispatch.on('elementMouseover', function(e) {
                var offsetElement = document.getElementById("chart"),
                    left = e.pos[0] + offsetElement.offsetLeft + margin.left,
                    top = e.pos[1] + offsetElement.offsetTop + margin.top;

                var content = '<h3>' + e.label + '</h3>' +
                        '<p>' +
                        e.value +
                        '</p>';

                nv.tooltip.show([left, top], content, e.value < 0 ? 'e' : 'w');
            });


            bullet.dispatch.on('elementMouseout', function(e) {
                nv.tooltip.cleanup();
            });
      */

      bullet.dispatch.on('elementMouseover.tooltip', e => {
        //e.pos = [e.pos[0] +  margin.left, e.pos[1] + margin.top];
        dispatch.tooltipShow(e);
      });
      if (tooltips) dispatch.on('tooltipShow', e => { showTooltip(e, that.parentNode) } ); // TODO: maybe merge with above?

      bullet.dispatch.on('elementMouseout.tooltip', e => {
        dispatch.tooltipHide(e);
      });
      if (tooltips) dispatch.on('tooltipHide', nv.tooltip.cleanup);
    });
    d3.timer.flush();
  }


  chart.dispatch = dispatch;
  chart.bullet = bullet;

  // left, right, top, bottom
  chart.orient = function(x) {
    if (!arguments.length) return orient;
    orient = x;
    reverse = orient == 'right' || orient == 'bottom';
    return chart;
  };

  // ranges (bad, satisfactory, good)
  chart.ranges = function(x) {
    if (!arguments.length) return ranges;
    ranges = x;
    return chart;
  };

  // markers (previous, goal)
  chart.markers = function(x) {
    if (!arguments.length) return markers;
    markers = x;
    return chart;
  };

  // measures (actual, forecast)
  chart.measures = function(x) {
    if (!arguments.length) return measures;
    measures = x;
    return chart;
  };

  chart.width = function(x) {
    if (!arguments.length) return width;
    width = x;
    return chart;
  };

  chart.height = function(x) {
    if (!arguments.length) return height;
    height = x;
    return chart;
  };

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin = _;
    return chart;
  };

  chart.tickFormat = function(x) {
    if (!arguments.length) return tickFormat;
    tickFormat = x;
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
};


