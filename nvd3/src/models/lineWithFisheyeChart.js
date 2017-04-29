
nv.models.lineChart = () => {
  var margin = {top: 30, right: 20, bottom: 50, left: 60};
  var color = nv.utils.defaultColor();
  var width = null;
  var height = null;
  var showLegend = true;
  var showControls = true;
  var fisheye = 0;
  var pauseFisheye = false;
  var tooltips = true;

  var tooltip = (key, x, y, e, graph) => '<h3>' + key + '</h3>' +
         '<p>' +  y + ' at ' + x + '</p>';

  var noData = "No Data Available.";


  var x = d3.fisheye.scale(d3.scale.linear).distortion(0);

  var lines = nv.models.line().xScale(x);

  var //x = lines.xScale(),
  y = lines.yScale();

  var xAxis = nv.models.axis().scale(x).orient('bottom').tickPadding(5);
  var yAxis = nv.models.axis().scale(y).orient('left');
  var legend = nv.models.legend().height(30);
  var controls = nv.models.legend().height(30);
  var dispatch = d3.dispatch('tooltipShow', 'tooltipHide');


  var showTooltip = (e, offsetElement) => {
    var left = e.pos[0] + ( offsetElement.offsetLeft || 0 );
    var top = e.pos[1] + ( offsetElement.offsetTop || 0);
    var x = xAxis.tickFormat()(lines.x()(e.point, e.pointIndex));
    var y = yAxis.tickFormat()(lines.y()(e.point, e.pointIndex));
    var content = tooltip(e.series.key, x, y, e, chart);

    nv.tooltip.show([left, top], content);
  };


  var controlsData = [
    { key: 'Magnify', disabled: true }
  ];


  function chart(selection) {
    selection.each(function(data) {
      var container = d3.select(this);
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



      var wrap = container.selectAll('g.nv-wrap.nv-lineChart').data([data]);
      var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-lineChart').append('g');


      gEnter.append('rect')
          .attr('class', 'nvd3 nv-background')
          .attr('width', availableWidth)
          .attr('height', availableHeight);


      gEnter.append('g').attr('class', 'nv-x nv-axis');
      gEnter.append('g').attr('class', 'nv-y nv-axis');
      gEnter.append('g').attr('class', 'nv-linesWrap');
      gEnter.append('g').attr('class', 'nv-legendWrap');
      gEnter.append('g').attr('class', 'nv-controlsWrap');
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

      if (showControls) {
        controls.width(180).color(['#444']);
        g.select('.nv-controlsWrap')
            .datum(controlsData)
            .attr('transform', 'translate(0,' + (-margin.top) +')')
            .call(controls);
      }



      lines
        .width(availableWidth)
        .height(availableHeight)
        .color(data.map((d, i) => d.color || color(d, i)).filter((d, i) => !data[i].disabled));



      g.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


      var linesWrap = g.select('.nv-linesWrap')
          .datum(data.filter(d => !d.disabled))

      d3.transition(linesWrap).call(lines);



      xAxis
        //.scale(x)
        .ticks( availableWidth / 100 )
        .tickSize(-availableHeight, 0);

      g.select('.nv-x.nv-axis')
          .attr('transform', 'translate(0,' + y.range()[0] + ')');
      d3.transition(g.select('.nv-x.nv-axis'))
          .call(xAxis);


      yAxis
        //.scale(y)
        .ticks( availableHeight / 36 )
        .tickSize( -availableWidth, 0);

      d3.transition(g.select('.nv-y.nv-axis'))
          .call(yAxis);



      g.select('.nv-background').on('mousemove', updateFisheye);
      g.select('.nv-background').on('click', () => { pauseFisheye = !pauseFisheye; });
      //g.select('.point-paths').on('mousemove', updateFisheye);


      function updateFisheye() {
        if (pauseFisheye) {
          //g.select('.background') .style('pointer-events', 'none');
          g.select('.nv-point-paths').style('pointer-events', 'all');
          return false;
        }

        g.select('.nv-background') .style('pointer-events', 'all');
        g.select('.nv-point-paths').style('pointer-events', 'none' );

        var mouse = d3.mouse(this);
        linesWrap.call(lines);
        g.select('.nv-x.nv-axis').call(xAxis);
        x.distortion(fisheye).focus(mouse[0]);
      }


      controls.dispatch.on('legendClick', (d, i) => { 
        d.disabled = !d.disabled;

        fisheye = d.disabled ? 0 : 5;
        g.select('.nv-background') .style('pointer-events', d.disabled ? 'none' : 'all');
        g.select('.nv-point-paths').style('pointer-events', d.disabled ? 'all' : 'none' );

        //scatter.interactive(d.disabled);
        //tooltips = d.disabled;

        if (d.disabled) {
          x.distortion(fisheye).focus(0);

          linesWrap.call(lines);
          g.select('.nv-x.nv-axis').call(xAxis);
        } else {
          pauseFisheye = false;
        }

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

      lines.dispatch.on('elementMouseover.tooltip', e => {
        e.pos = [e.pos[0] +  margin.left, e.pos[1] + margin.top];
        dispatch.tooltipShow(e);
      });
      if (tooltips) dispatch.on('tooltipShow', e => { showTooltip(e, that.parentNode) } ); // TODO: maybe merge with above?

      lines.dispatch.on('elementMouseout.tooltip', e => {
        dispatch.tooltipHide(e);
      });
      if (tooltips) dispatch.on('tooltipHide', nv.tooltip.cleanup);
    });


    //TODO: decide if this is a good idea, and if it should be in all models
    chart.update = () => { chart(selection) };
    chart.container = this; // I need a reference to the container in order to have outside code check if the chart is visible or not


    return chart;
  }


  chart.dispatch = dispatch;
  chart.legend = legend;
  chart.xAxis = xAxis;
  chart.yAxis = yAxis;

  d3.rebind(chart, lines, 'defined', 'x', 'y', 'size', 'xDomain', 'yDomain', 'forceX', 'forceY', 'interactive', 'clipEdge', 'clipVoronoi', 'id', 'interpolate');


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


  return chart;
}
