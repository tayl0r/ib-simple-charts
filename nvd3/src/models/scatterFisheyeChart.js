
nv.models.scatterFisheyeChart = () => {
  var margin = {top: 30, right: 20, bottom: 50, left: 60};
  var width = null;
  var height = null;
  var color = nv.utils.defaultColor();
  var showDistX = false;
  var showDistY = false;
  var showLegend = true;
  var showControls = true;
  var fisheye = 0;
  var tooltips = true;
  var tooltipX = (key, x, y) => '<strong>' + x + '</strong>';
  var tooltipY = (key, x, y) => '<strong>' + y + '</strong>';

  var tooltip = (key, x, y, e, graph) => '<h3>' + key + '</h3>' +
         '<p>' +  y + ' at ' + x + '</p>';

  var noData = "No Data Available.";
  var x = d3.fisheye.scale(d3.scale.linear).distortion(0);
  var y = d3.fisheye.scale(d3.scale.linear).distortion(0);
  var scatter = nv.models.scatter().xScale(x).yScale(y); //TODO: abstract distribution component and have old scales stored there

  var //x = scatter.xScale(),
  //y = scatter.yScale(),
  xAxis = nv.models.axis().orient('bottom').scale(x).tickPadding(10);

  var yAxis = nv.models.axis().orient('left').scale(y).tickPadding(10);
  var legend = nv.models.legend().height(30);
  var controls = nv.models.legend().height(30);
  var dispatch = d3.dispatch('tooltipShow', 'tooltipHide');
  var x0;
  var y0;

  var showTooltip = (e, offsetElement) => {
    //TODO: make tooltip style an option between single or dual on axes (maybe on all charts with axes?)

    //var left = e.pos[0] + ( offsetElement.offsetLeft || 0 ),
    //top = e.pos[1] + ( offsetElement.offsetTop || 0),
    var leftX = e.pos[0] + ( offsetElement.offsetLeft || 0 );
    //content = tooltip(e.series.key, xVal, yVal, e, chart);

    var topX = y.range()[0] + margin.top + ( offsetElement.offsetTop || 0);
    var leftY = x.range()[0] + margin.left + ( offsetElement.offsetLeft || 0 );
    var topY = e.pos[1] + ( offsetElement.offsetTop || 0);
    var xVal = xAxis.tickFormat()(scatter.x()(e.point, e.pointIndex));
    var yVal = yAxis.tickFormat()(scatter.y()(e.point, e.pointIndex));
    var contentX = tooltipX(e.series.key, xVal, yVal, e, chart);
    var contentY = tooltipY(e.series.key, xVal, yVal, e, chart);

    nv.tooltip.show([leftX, topX], contentX, 'n', 1);
    nv.tooltip.show([leftY, topY], contentY, 'e', 1);
    //nv.tooltip.show([left, top], content, e.value < 0 ? 'n' : 's');
  };

  var controlsData = [
    { key: 'Magnify', disabled: true }
  ];

  function chart(selection) {
    selection.each(function(data) {
      var container = d3.select(this);
      var that = this;

      //TODO: decide if this makes sense to add into all the models for ease of updating (updating without needing the selection)
      chart.update = () => { selection.transition().call(chart) };


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



      x0 = x0 || scatter.xScale();
      y0 = y0 || scatter.yScale();


      var wrap = container.selectAll('g.nv-wrap.nv-scatterChart').data([data]);
      var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-scatterChart nv-chart-' + scatter.id()).append('g');


      gEnter.append('rect')
          .attr('class', 'nvd3 nv-background')
          .attr('width', availableWidth)
          .attr('height', availableHeight);


      gEnter.append('g').attr('class', 'nv-legendWrap');
      gEnter.append('g').attr('class', 'nv-x nv-axis');
      gEnter.append('g').attr('class', 'nv-y nv-axis');
      gEnter.append('g').attr('class', 'nv-scatterWrap');
      gEnter.append('g').attr('class', 'nv-controlsWrap');
      //gEnter.append('g').attr('class', 'nv-distWrap');

      var g = wrap.select('g')

      if (showLegend) {
        legend.width( availableWidth / 2 );

        wrap.select('.nv-legendWrap')
            .datum(data)
            .call(legend);

        if ( margin.top != legend.height()) {
          margin.top = legend.height();
          availableHeight = (height || parseInt(container.style('height')) || 400)
                             - margin.top - margin.bottom;
        }

        wrap.select('.nv-legendWrap')
            .attr('transform', 'translate(' + (availableWidth / 2) + ',' + (-margin.top) +')');
      }


      scatter
        .width(availableWidth)
        .height(availableHeight)
        .color(data.map((d, i) => d.color || color(d, i)).filter((d, i) => !data[i].disabled))


      if (showControls) {
        controls.width(180).color(['#444']);
        g.select('.nv-controlsWrap')
            .datum(controlsData)
            .attr('transform', 'translate(0,' + (-margin.top) +')')
            .call(controls);
      }


      g.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


      var scatterWrap = wrap.select('.nv-scatterWrap')
          .datum(data.filter(d => !d.disabled));
      d3.transition(scatterWrap).call(scatter);


      xAxis
        .ticks( availableWidth / 100 )
        .tickSize( -availableHeight , 0);

      g.select('.nv-x.nv-axis')
          .attr('transform', 'translate(0,' + y.range()[0] + ')');
      d3.transition(g.select('.nv-x.nv-axis'))
          .call(xAxis);


      yAxis
        .ticks( availableHeight / 36 )
        .tickSize( -availableWidth, 0);

      d3.transition(g.select('.nv-y.nv-axis'))
          .call(yAxis);




      //TODO abstract Distribution into its own component
      if ( showDistX || showDistY) {
        var distWrap = scatterWrap.selectAll('g.nv-distribution')
            .data(d => d, d => d.key);

        distWrap.enter().append('g').attr('class', (d, i) => 'nv-distribution nv-series-' + i)

        distWrap.style('stroke', (d, i) => color.filter((d, i) => data[i] && !data[i].disabled)[i % color.length])
      }

      if (showDistX) {
        var distX = distWrap.selectAll('line.nv-distX')
              .data(d => d.values)
        distX.enter().append('line')
            .attr('x1', (d, i) => x0(scatter.x()(d,i)))
            .attr('x2', (d, i) => x0(scatter.x()(d,i)))
        //d3.transition(distX.exit())
        d3.transition(distWrap.exit().selectAll('line.nv-distX'))
            .attr('x1', (d, i) => x(scatter.x()(d,i)))
            .attr('x2', (d, i) => x(scatter.x()(d,i)))
            .remove();
        distX
            .attr('class', (d, i) => 'nv-distX nv-distX-' + i)
            .attr('y1', y.range()[0])
            .attr('y2', y.range()[0] + 8);
        d3.transition(distX)
            .attr('x1', (d, i) => x(scatter.x()(d,i)))
            .attr('x2', (d, i) => x(scatter.x()(d,i)))
      }


      if (showDistY) {
        var distY = distWrap.selectAll('line.nv-distY')
            .data(d => d.values)
        distY.enter().append('line')
            .attr('y1', (d, i) => y0(scatter.y()(d,i)))
            .attr('y2', (d, i) => y0(scatter.y()(d,i)));
        //d3.transition(distY.exit())
        d3.transition(distWrap.exit().selectAll('line.nv-distY'))
            .attr('y1', (d, i) => y(scatter.y()(d,i)))
            .attr('y2', (d, i) => y(scatter.y()(d,i)))
            .remove();
        distY
            .attr('class', (d, i) => 'nv-distY nv-distY-' + i)
            .attr('x1', x.range()[0])
            .attr('x2', x.range()[0] - 8)
        d3.transition(distY)
            .attr('y1', (d, i) => y(scatter.y()(d,i)))
            .attr('y2', (d, i) => y(scatter.y()(d,i)));
      }




      legend.dispatch.on('legendClick', (d, i, that) => {
        d.disabled = !d.disabled;

        if (!data.filter(d => !d.disabled).length) {
          data.map(d => {
            d.disabled = false;
            wrap.selectAll('.nv-series').classed('disabled', false);
            return d;
          });
        }

        selection.transition().call(chart)
      });

      controls.dispatch.on('legendClick', (d, i) => { 
        d.disabled = !d.disabled;

        fisheye = d.disabled ? 0 : 2.5;
        g.select('.nv-background').style('pointer-events', d.disabled ? 'none' : 'all');
        scatter.interactive(d.disabled);
        tooltips = d.disabled;

        if (d.disabled) {
          x.distortion(fisheye).focus(0);
          y.distortion(fisheye).focus(0);

          scatterWrap.call(scatter);
          g.select('.nv-x.nv-axis').call(xAxis);
          g.select('.nv-y.nv-axis').call(yAxis);
        }

        selection.transition().call(chart);
      });

      /*
      legend.dispatch.on('legendMouseover', function(d, i) {
        d.hover = true;
        selection.transition().call(chart)
      });

      legend.dispatch.on('legendMouseout', function(d, i) {
        d.hover = false;
        selection.transition().call(chart)
      });
      */


      scatter.dispatch.on('elementMouseover.tooltip', e => {
        //scatterWrap.select('.series-' + e.seriesIndex + ' .distX-' + e.pointIndex)
        d3.select('.nv-chart-' + scatter.id() + ' .nv-series-' + e.seriesIndex + ' .nv-distX-' + e.pointIndex)
            .attr('y1', e.pos[1]);
        //scatterWrap.select('.series-' + e.seriesIndex + ' .distY-' + e.pointIndex)
        d3.select('.nv-chart-' + scatter.id() + ' .nv-series-' + e.seriesIndex + ' .nv-distY-' + e.pointIndex)
            .attr('x1', e.pos[0]);

        e.pos = [e.pos[0] + margin.left, e.pos[1] + margin.top];
        dispatch.tooltipShow(e);
      });
      //if (tooltips) dispatch.on('tooltipShow', function(e) { showTooltip(e, container[0][0].parentNode) } ); // TODO: maybe merge with above?
      dispatch.on('tooltipShow', e => {
        if (tooltips) showTooltip(e, that.parentNode);
      });

      scatter.dispatch.on('elementMouseout.tooltip', e => {
        dispatch.tooltipHide(e);

        //scatterWrap.select('.series-' + e.seriesIndex + ' .distX-' + e.pointIndex)
        d3.select('.nv-chart-' + scatter.id() + ' .nv-series-' + e.seriesIndex + ' .nv-distX-' + e.pointIndex)
            .attr('y1', y.range()[0]);
        //scatterWrap.select('.series-' + e.seriesIndex + ' .distY-' + e.pointIndex)
        d3.select('.nv-chart-' + scatter.id() + ' .nv-series-' + e.seriesIndex + ' .nv-distY-' + e.pointIndex)
            .attr('x1', x.range()[0]);
      });
      dispatch.on('tooltipHide', nv.tooltip.cleanup);



      //TODO: get distributions to work with fisheye
      g.select('.nv-background').on('mousemove', updateFisheye);
      g.select('.nv-point-paths').on('mousemove', updateFisheye);

      function updateFisheye() {
        var mouse = d3.mouse(this);
        x.distortion(fisheye).focus(mouse[0]);
        y.distortion(fisheye).focus(mouse[1]);

        scatterWrap.call(scatter);
        g.select('.nv-x.nv-axis').call(xAxis);
        g.select('.nv-y.nv-axis').call(yAxis);
      }

      //store old scales for use in transitions on update, to animate from old to new positions, and sizes
      x0 = x.copy();
      y0 = y.copy();
    });

    return chart;
  }


  chart.dispatch = dispatch;
  chart.legend = legend;
  chart.xAxis = xAxis;
  chart.yAxis = yAxis;

  d3.rebind(chart, scatter, 'interactive', 'shape', 'size', 'xScale', 'yScale', 'zScale', 'xDomain', 'yDomain', 'sizeDomain', 'forceX', 'forceY', 'forceSize', 'clipVoronoi', 'clipRadius', 'fisheye', 'fisheyeRadius');


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

  chart.showDistX = function(_) {
    if (!arguments.length) return showDistX;
    showDistX = _;
    return chart;
  };

  chart.showDistY = function(_) {
    if (!arguments.length) return showDistY;
    showDistY = _;
    return chart;
  };

  chart.showControls = function(_) {
    if (!arguments.length) return showControls;
    showControls = _;
    return chart;
  };

  chart.showLegend = function(_) {
    if (!arguments.length) return showLegend;
    showLegend = _;
    return chart;
  };

  chart.fisheye = function(_) {
    if (!arguments.length) return fisheye;
    fisheye = _;
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
