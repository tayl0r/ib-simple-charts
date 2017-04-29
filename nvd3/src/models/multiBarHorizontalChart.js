
nv.models.multiBarHorizontalChart = () => {
  var margin = {top: 30, right: 20, bottom: 50, left: 60};
  var width = null;
  var height = null;
  var color = nv.utils.defaultColor();
  var showControls = true;
  var showLegend = true;
  var stacked = false;
  var tooltips = true;

  var tooltip = (key, x, y, e, graph) => '<h3>' + key + " - " + x + '</h3>' +
         '<p>' +  y + '</p>';

  var noData = "No Data Available.";
  var multibar = nv.models.multiBarHorizontal().stacked(stacked);
  var x = multibar.xScale();
  var y = multibar.yScale();
  var xAxis = nv.models.axis().scale(x).orient('left').highlightZero(false).showMaxMin(false);
  var yAxis = nv.models.axis().scale(y).orient('bottom');
  var legend = nv.models.legend().height(30);
  var controls = nv.models.legend().height(30);
  var dispatch = d3.dispatch('tooltipShow', 'tooltipHide');

  xAxis.tickFormat(d => d);
  yAxis.tickFormat(d3.format(',.1f'));

  var showTooltip = (e, offsetElement) => {
    var left = e.pos[0] + ( offsetElement.offsetLeft || 0 );
    var top = e.pos[1] + ( offsetElement.offsetTop || 0);
    var x = xAxis.tickFormat()(multibar.x()(e.point, e.pointIndex));
    var y = yAxis.tickFormat()(multibar.y()(e.point, e.pointIndex));
    var content = tooltip(e.series.key, x, y, e, chart);

    nv.tooltip.show([left, top], content, e.value < 0 ? 'e' : 'w');
  };

  //TODO: let user select default
  var controlsData = [
    { key: 'Grouped' },
    { key: 'Stacked', disabled: true },
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



      var wrap = container.selectAll('g.nv-wrap.nv-multiBarHorizontalChart').data([data]);
      var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-multiBarHorizontalChart').append('g');

      gEnter.append('g').attr('class', 'nv-x nv-axis');
      gEnter.append('g').attr('class', 'nv-y nv-axis');
      gEnter.append('g').attr('class', 'nv-barsWrap');
      gEnter.append('g').attr('class', 'nv-legendWrap');
      gEnter.append('g').attr('class', 'nv-controlsWrap');



      //TODO: margins should be adjusted based on what components are used: axes, axis labels, legend
      margin.top = legend.height();

      var g = wrap.select('g');


      if (showLegend) {
        legend.width(availableWidth / 2);

        g.select('.nv-legendWrap')
            .datum(data)
            .call(legend);

        if ( margin.top != legend.height()) {
          margin.top = legend.height();
          availableHeight = (height || parseInt(container.style('height')) || 400)
                             - margin.top - margin.bottom;
        }

        g.select('.nv-legendWrap')
            .attr('transform', 'translate(' + (availableWidth / 2) + ',' + (-margin.top) +')')
      }


      multibar
        .width(availableWidth)
        .height(availableHeight)
        .color(data.map((d, i) => d.color || color(d, i)).filter((d, i) => !data[i].disabled))



      if (showControls) {
        controls.width(180).color(['#444', '#444', '#444']);
        g.select('.nv-controlsWrap')
            .datum(controlsData)
            .attr('transform', 'translate(0,' + (-margin.top) +')')
            .call(controls);
      }


      g.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


      var barsWrap = g.select('.nv-barsWrap')
          .datum(data.filter(d => !d.disabled))


      d3.transition(barsWrap).call(multibar);


      xAxis
        .ticks( availableHeight / 24 )
        .tickSize(-availableWidth, 0);

      //d3.transition(g.select('.x.axis'))
      g.select('.nv-x.nv-axis').transition().duration(0)
          .call(xAxis);

      var xTicks = g.select('.nv-x.nv-axis').selectAll('g');

      xTicks
          .selectAll('line, text')
          .style('opacity', 1)

      /*
  //I think this was just leaft over from the multiBar chart this was built from.. commented to maek sure
  xTicks.filter(function(d,i) {
        return i % Math.ceil(data[0].values.length / (availableWidth / 100)) !== 0;
      })
      .selectAll('line, text')
      .style('opacity', 0)
      */

      yAxis
        .ticks( availableWidth / 100 )
        .tickSize( -availableHeight, 0);

      g.select('.nv-y.nv-axis')
          .attr('transform', 'translate(0,' + availableHeight + ')');
      d3.transition(g.select('.nv-y.nv-axis'))
      //g.select('.y.axis').transition().duration(0)
          .call(yAxis);




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

      controls.dispatch.on('legendClick', (d, i) => { 
        if (!d.disabled) return;
        controlsData = controlsData.map(s => {
          s.disabled = true;
          return s;
        });
        d.disabled = false;

        switch (d.key) {
          case 'Grouped':
            multibar.stacked(false);
            break;
          case 'Stacked':
            multibar.stacked(true);
            break;
        }

        selection.transition().call(chart);
      });


      multibar.dispatch.on('elementMouseover.tooltip', e => {
        e.pos = [e.pos[0] +  margin.left, e.pos[1] + margin.top];
        dispatch.tooltipShow(e);
      });
      if (tooltips) dispatch.on('tooltipShow', e => { showTooltip(e, that.parentNode) } ); // TODO: maybe merge with above?

      multibar.dispatch.on('elementMouseout.tooltip', e => {
        dispatch.tooltipHide(e);
      });
      if (tooltips) dispatch.on('tooltipHide', nv.tooltip.cleanup);


      //TODO: decide if this makes sense to add into all the models for ease of updating (updating without needing the selection)
      chart.update = () => { selection.transition().call(chart) };
      chart.container = this; // I need a reference to the container in order to have outside code check if the chart is visible or not
    });

    return chart;
  }


  chart.dispatch = dispatch;
  chart.multibar = multibar; // really just makign the accessible for multibar.dispatch, may rethink slightly
  chart.legend = legend;
  chart.xAxis = xAxis;
  chart.yAxis = yAxis;

  d3.rebind(chart, multibar, 'x', 'y', 'xDomain', 'yDomain', 'forceX', 'forceY', 'clipEdge', 'id', 'delay', 'showValues', 'valueFormat', 'stacked');


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

  chart.tooltip = function(_) {
    if (!arguments.length) return tooltip;
    tooltip = _;
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
