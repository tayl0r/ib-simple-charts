
// Chart design based on the recommendations of Stephen Few. Implementation
// based on the work of Clint Ivy, Jamie Love, and Jason Davies.
// http://projects.instantcognition.com/protovis/bulletchart/
nv.models.bullet = () => {
    var // TODO top & bottom
    orient = 'left';

    var reverse = false;
    var margin = {top: 0, right: 0, bottom: 0, left: 0};
    var ranges = d => d.ranges;
    var markers = d => d.markers;
    var measures = d => d.measures;
    var width = 380;
    var height = 30;
    var tickFormat = null;

    var dispatch = d3.dispatch('elementMouseover', 'elementMouseout');

    // For each small multipleâ€¦
    function chart(g) {
      g.each(function(d, i) {
          var availableWidth = width - margin.left - margin.right;
          var availableHeight = height - margin.top - margin.bottom;
          var rangez = ranges.call(this, d, i).slice().sort(d3.descending);
          var markerz = markers.call(this, d, i).slice().sort(d3.descending);
          var measurez = measures.call(this, d, i).slice().sort(d3.descending);


          var wrap = d3.select(this).selectAll('g.nv-wrap.nv-bullet').data([d]);
          var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-bullet');
          var gEnter = wrapEnter.append('g');

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


          // Update the range rects.
          var range = g.selectAll('rect.nv-range')
              .data(rangez);

          range.enter().append('rect')
              .attr('class', (d, i) => 'nv-range nv-s' + i)
              .attr('width', w0)
              .attr('height', availableHeight)
              .attr('x', reverse ? x0 : 0)
              .on('mouseover', (d, i) => { 
                  dispatch.elementMouseover({
                    value: d,
                    label: (i <= 0) ? 'Maximum' : (i > 1) ? 'Minimum' : 'Mean', //TODO: make these labels a variable
                    pos: [x1(d), availableHeight/2]
                  })
              })
              .on('mouseout', (d, i) => { 
                  dispatch.elementMouseout({
                    value: d,
                    label: (i <= 0) ? 'Minimum' : (i >=1) ? 'Maximum' : 'Mean', //TODO: make these labels a variable
                  })
              })

          d3.transition(range)
              .attr('x', reverse ? x1 : 0)
              .attr('width', w1)
              .attr('height', availableHeight);


          // Update the measure rects.
          var measure = g.selectAll('rect.nv-measure')
              .data(measurez);

          measure.enter().append('rect')
              .attr('class', (d, i) => 'nv-measure nv-s' + i)
              .attr('width', w0)
              .attr('height', availableHeight / 3)
              .attr('x', reverse ? x0 : 0)
              .attr('y', availableHeight / 3)
              .on('mouseover', d => { 
                  dispatch.elementMouseover({
                    value: d,
                    label: 'Current', //TODO: make these labels a variable
                    pos: [x1(d), availableHeight/2]
                  })
              })
              .on('mouseout', d => { 
                  dispatch.elementMouseout({
                    value: d,
                    label: 'Current' //TODO: make these labels a variable
                  })
              })

          d3.transition(measure)
              .attr('width', w1)
              .attr('height', availableHeight / 3)
              .attr('x', reverse ? x1 : 0)
              .attr('y', availableHeight / 3);



          // Update the marker lines.
          var marker = g.selectAll('path.nv-markerTriangle')
              .data(markerz);

          var h3 =  availableHeight / 6;
          marker.enter().append('path')
              .attr('class', 'nv-markerTriangle')
              .attr('transform', d => 'translate(' + x0(d) + ',' + (availableHeight / 2) + ')')
              .attr('d', 'M0,' + h3 + 'L' + h3 + ',' + (-h3) + ' ' + (-h3) + ',' + (-h3) + 'Z')
              .on('mouseover', (d, i) => {
                  dispatch.elementMouseover({
                    value: d,
                    label: 'Previous',
                    pos: [x1(d), availableHeight/2]
                  })
              })
              .on('mouseout', (d, i) => {
                  dispatch.elementMouseout({
                    value: d,
                    label: 'Previous'
                  })
              });

          d3.transition(marker)
              .attr('transform', d => 'translate(' + x1(d) + ',' + (availableHeight / 2) + ')');

          marker.exit().remove();
      });
      d3.timer.flush();
    }


    chart.dispatch = dispatch;

    // left, right, top, bottom
    chart.orient = function(_) {
      if (!arguments.length) return orient;
      orient = _;
      reverse = orient == 'right' || orient == 'bottom';
      return chart;
    };

    // ranges (bad, satisfactory, good)
    chart.ranges = function(_) {
      if (!arguments.length) return ranges;
      ranges = _;
      return chart;
    };

    // markers (previous, goal)
    chart.markers = function(_) {
      if (!arguments.length) return markers;
      markers = _;
      return chart;
    };

    // measures (actual, forecast)
    chart.measures = function(_) {
      if (!arguments.length) return measures;
      measures = _;
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

    chart.margin = function(_) {
      if (!arguments.length) return margin;
      margin = _;
      return chart;
    };

    chart.tickFormat = function(_) {
      if (!arguments.length) return tickFormat;
      tickFormat = _;
      return chart;
    };

    return chart;
};


