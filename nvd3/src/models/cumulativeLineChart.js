
nv.models.cumulativeLineChart = () => {
  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var margin = {top: 30, right: 30, bottom: 50, left: 60};

  var color = nv.utils.getColor();
  var width = null;
  var height = null;
  var showLegend = true;
  var tooltips = true;

  var //TODO: get rescale y functionality back (need to calculate exten of y for ALL possible re-zero points
  showRescaleToggle = true;

  var rescaleY = true;

  var tooltip = (key, x, y, e, graph) => '<h3>' + key + '</h3>' +
         '<p>' +  y + ' at ' + x + '</p>';

  var x;

  var //can be accessed via chart.lines.[x/y]Scale()
  y;

  var noData = "No Data Available.";

  //============================================================
  // Private Variables
  //------------------------------------------------------------

  var lines = nv.models.line();

  var dx = d3.scale.linear();
  var id = lines.id();
  var xAxis = nv.models.axis().orient('bottom').tickPadding(5);
  var yAxis = nv.models.axis().orient('left');
  var legend = nv.models.legend().height(30);
  var controls = nv.models.legend().height(30);
  var dispatch = d3.dispatch('tooltipShow', 'tooltipHide');
  var index = {i: 0, x: 0};

  //TODO: let user select default
  var controlsData = [
    { key: 'Re-scale y-axis' }
  ];

  var showTooltip = (e, offsetElement) => {
    var left = e.pos[0] + ( offsetElement.offsetLeft || 0 );
    var top = e.pos[1] + ( offsetElement.offsetTop || 0);
    var x = xAxis.tickFormat()(lines.x()(e.point, e.pointIndex));
    var y = yAxis.tickFormat()(lines.y()(e.point, e.pointIndex));
    var content = tooltip(e.series.key, x, y, e, chart);

    nv.tooltip.show([left, top], content);
  };


  var indexDrag = d3.behavior.drag()
                    .on('dragstart', dragStart)
                    .on('drag', dragMove)
                    .on('dragend', dragEnd);

  function dragStart(d,i) {}

  function dragMove(d,i) {
    d.x += d3.event.dx;
    d.i = Math.round(dx.invert(d.x));

    //d3.transition(d3.select('.chart-' + id)).call(chart);
    d3.select(this).attr('transform', 'translate(' + dx(d.i) + ',0)');
  }

  function dragEnd(d,i) {
    //d3.transition(d3.select('.chart-' + id)).call(chart);
    chart.update();
  }



  function chart(selection) {
    selection.each(function(data) {
      var container = d3.select(this).classed('nv-chart-' + id, true);
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



      x = lines.xScale();
      y = lines.yScale();

      if (!rescaleY) {
        var seriesDomains = data
          .filter(series => !series.disabled)
          .map((series, i) => {
            var initialDomain = d3.extent(series.values, lines.y());

            return [
              (initialDomain[0] - initialDomain[1]) / (1 + initialDomain[1]),
              (initialDomain[1] - initialDomain[0]) / (1 + initialDomain[0])
            ];
          });

        var completeDomain = [
          d3.min(seriesDomains, d => d[0]),
          d3.max(seriesDomains, d => d[1])
        ]

        lines.yDomain(completeDomain);
      } else {
        lines.yDomain(null);
      }


      dx  .domain([0, data[0].values.length - 1]) //Assumes all series have same length
          .range([0, availableWidth])
          .clamp(true);


      var data = indexify(index.i, data);


      var wrap = container.selectAll('g.nv-wrap.nv-cumulativeLine').data([data]);
      var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-cumulativeLine').append('g');

      gEnter.append('g').attr('class', 'nv-x nv-axis');
      gEnter.append('g').attr('class', 'nv-y nv-axis');
      gEnter.append('g').attr('class', 'nv-linesWrap');
      gEnter.append('g').attr('class', 'nv-legendWrap');
      gEnter.append('g').attr('class', 'nv-controlsWrap');


      var g = wrap.select('g');


      if (showLegend) {
        legend.width(availableWidth);

        g.select('.nv-legendWrap')
            .datum(data)
            .call(legend);

        if ( margin.top != legend.height()) {
          margin.top = legend.height();
          availableHeight = (height || parseInt(container.style('height')) || 400)
                             - margin.top - margin.bottom;
        }

        g.select('.nv-legendWrap')
            .attr('transform', 'translate(0,' + (-margin.top) +')')
      }


      if (showRescaleToggle) {
        controls.width(140).color(['#444', '#444', '#444']);
        g.select('.nv-controlsWrap')
            .datum(controlsData)
            .attr('transform', 'translate(0,' + (-margin.top) +')')
            .call(controls);
      }



      lines
        //.x(function(d) { return d.x })
        .y(d => d.display.y)
        .width(availableWidth)
        .height(availableHeight)
        .color(data.map((d, i) => d.color || color(d, i)).filter((d, i) => !data[i].disabled));



      g.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


      var linesWrap = g.select('.nv-linesWrap')
          .datum(data.filter(d => !d.disabled))

      d3.transition(linesWrap).call(lines);


      var indexLine = linesWrap.selectAll('.nv-indexLine')
          .data([index]);
      indexLine.enter().append('rect').attr('class', 'nv-indexLine')
          .attr('width', 3)
          .attr('x', -2)
          .attr('fill', 'red')
          .attr('fill-opacity', .5)
          .call(indexDrag)

      indexLine
          .attr('transform', d => 'translate(' + dx(d.i) + ',0)')
          .attr('height', availableHeight)



      xAxis
        .scale(x)
        .ticks( availableWidth / 100 )
        .tickSize(-availableHeight, 0);

      g.select('.nv-x.nv-axis')
          .attr('transform', 'translate(0,' + y.range()[0] + ')');
      d3.transition(g.select('.nv-x.nv-axis'))
          .call(xAxis);


      yAxis
        .scale(y)
        .ticks( availableHeight / 36 )
        .tickSize( -availableWidth, 0);

      d3.transition(g.select('.nv-y.nv-axis'))
          .call(yAxis);



      //============================================================
      // Event Handling/Dispatching (in chart's scope)
      //------------------------------------------------------------

      controls.dispatch.on('legendClick', (d, i) => { 
        d.disabled = !d.disabled;
        rescaleY = !d.disabled;

        //console.log(d,i,arguments);

        selection.transition().call(chart);
      });


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

      /*
            //
            legend.dispatch.on('legendMouseover', function(d, i) {
              d.hover = true;
              selection.transition().call(chart)
            });

            legend.dispatch.on('legendMouseout', function(d, i) {
              d.hover = false;
              selection.transition().call(chart)
            });
      */

      dispatch.on('tooltipShow', e => {
        if (tooltips) showTooltip(e, that.parentNode);
      });
    });


    //TODO: decide if this is a good idea, and if it should be in all models
    chart.update = () => { chart(selection) };
    chart.container = this; // I need a reference to the container in order to have outside code check if the chart is visible or not


    return chart;
  }


  //============================================================
  // Event Handling/Dispatching (out of chart's scope)
  //------------------------------------------------------------

  lines.dispatch.on('elementMouseover.tooltip', e => {
    e.pos = [e.pos[0] +  margin.left, e.pos[1] + margin.top];
    dispatch.tooltipShow(e);
  });

  lines.dispatch.on('elementMouseout.tooltip', e => {
    dispatch.tooltipHide(e);
  });

  dispatch.on('tooltipHide', () => {
    if (tooltips) nv.tooltip.cleanup();
  });


  //============================================================
  // Global getters and setters
  //------------------------------------------------------------

  chart.dispatch = dispatch;
  chart.legend = legend;
  chart.xAxis = xAxis;
  chart.yAxis = yAxis;

  d3.rebind(chart, lines, 'defined', 'isArea', 'x', 'y', 'size', 'xDomain', 'yDomain', 'forceX', 'forceY', 'interactive', 'clipEdge', 'clipVoronoi', 'id');


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



  //============================================================
  // Functions
  //------------------------------------------------------------

  /* Normalize the data according to an index point. */
  function indexify(idx, data) {
    return data.map((line, i) => {
      var v = lines.y()(line.values[idx], idx);

      line.values = line.values.map((point, pointIndex) => {
        point.display = {'y': (lines.y()(point, pointIndex) - v) / (1 + v) };
        return point;
      })
      /*
      if (v < -.9) {
        //if a series loses more than 100%, calculations fail.. anything close can cause major distortion (but is mathematically currect till it hits 100)
      }
      */
      return line;
    });
  }


  return chart;
}
