
nv.models.multiBarChart = () => {
  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var margin = {top: 30, right: 20, bottom: 50, left: 60};

  var width = null;
  var height = null;
  var color = nv.utils.defaultColor();
  var showControls = true;
  var showLegend = true;

  var // if false a tick will show for every data point
  reduceXTicks = true;

  var rotateLabels = 0;
  var tooltips = true;

  var tooltip = (key, x, y, e, graph) => '<h3>' + key + '</h3>' +
         '<p>' +  y + ' on ' + x + '</p>';

  var x;

  var //can be accessed via chart.multibar.[x/y]Scale()
  y;

  var noData = "No Data Available.";

  //============================================================
  // Private Variables
  //------------------------------------------------------------

  var multibar = nv.models.multiBar().stacked(false);

  var //TODO: see why showMaxMin(false) causes no ticks to be shown on x axis
  xAxis = nv.models.axis().orient('bottom').highlightZero(false).showMaxMin(false);

  var yAxis = nv.models.axis().orient('left');
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

    nv.tooltip.show([left, top], content, e.value < 0 ? 'n' : 's');
  };


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



      x = multibar.xScale();
      y = multibar.yScale();


      var wrap = container.selectAll('g.nv-wrap.nv-multiBarWithLegend').data([data]);
      var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-multiBarWithLegend').append('g');

      gEnter.append('g').attr('class', 'nv-x nv-axis');
      gEnter.append('g').attr('class', 'nv-y nv-axis');
      gEnter.append('g').attr('class', 'nv-barsWrap');
      gEnter.append('g').attr('class', 'nv-legendWrap');
      gEnter.append('g').attr('class', 'nv-controlsWrap');



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
            .attr('transform', 'translate(' + (availableWidth / 2) + ',' + (-margin.top) +')');
      }


      multibar
        .width(availableWidth)
        .height(availableHeight)
        .color(data.map((d, i) => d.color || color(d, i)).filter((d, i) => !data[i].disabled))



      if (showControls) {
        var controlsData = [
          { key: 'Grouped', disabled: multibar.stacked() },
          { key: 'Stacked', disabled: !multibar.stacked() }
        ];

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
        .scale(x)
        .ticks( availableWidth / 100 )
        .tickSize(-availableHeight, 0);

      g.select('.nv-x.nv-axis')
          .attr('transform', 'translate(0,' + y.range()[0] + ')');
      d3.transition(g.select('.nv-x.nv-axis'))
          .call(xAxis);

      var xTicks = g.select('.nv-x.nv-axis > g').selectAll('g');

      xTicks
          .selectAll('line, text')
          .style('opacity', 1)

      if (reduceXTicks)
        xTicks
          .filter((d, i) => i % Math.ceil(data[0].values.length / (availableWidth / 100)) !== 0)
          .selectAll('text, line')
          .style('opacity', 0);

      if(rotateLabels)
        xTicks
            .selectAll('text')
            .attr('transform', (d, i, j) => 'rotate('+rotateLabels+' 0,0)')
            .attr('text-transform', rotateLabels > 0 ? 'start' : 'end');

      yAxis
        .scale(y)
        .ticks( availableHeight / 36 )
        .tickSize( -availableWidth, 0);

      d3.transition(g.select('.nv-y.nv-axis'))
          .call(yAxis);



      //============================================================
      // Event Handling/Dispatching (in chart's scope)
      //------------------------------------------------------------

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

      dispatch.on('tooltipShow', e => { 
        if (tooltips) showTooltip(e, that.parentNode) 
      });


      chart.update = () => { selection.transition().call(chart) };
      chart.container = this; // I need a reference to the container in order to have outside code check if the chart is visible or not
    });

    return chart;
  }


  //============================================================
  // Event Handling/Dispatching (out of chart's scope)
  //------------------------------------------------------------

  multibar.dispatch.on('elementMouseover.tooltip2', e => {
    e.pos = [e.pos[0] +  margin.left, e.pos[1] + margin.top];
    dispatch.tooltipShow(e);
  });

  multibar.dispatch.on('elementMouseout.tooltip', e => {
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

  d3.rebind(chart, multibar, 'x', 'y', 'xDomain', 'yDomain', 'forceX', 'forceY', 'clipEdge', 'id', 'stacked', 'delay');


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

  chart.reduceXTicks= function(_) {
    if (!arguments.length) return reduceXTicks;
    reduceXTicks = _;
    return chart;
  };

  chart.rotateLabels = function(_) {
    if (!arguments.length) return rotateLabels;
    rotateLabels = _;
    return chart;
  }

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
