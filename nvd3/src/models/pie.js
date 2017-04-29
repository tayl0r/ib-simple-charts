
nv.models.pie = () => {
  var margin = {top: 0, right: 0, bottom: 0, left: 0};
  var width = 500;
  var height = 500;
  var getValues = d => d.values;
  var getX = d => d.x;
  var getY = d => d.y;

  var //Create semi-unique ID in case user doesn't select one
  id = Math.floor(Math.random() * 10000);

  var color = nv.utils.defaultColor();
  var valueFormat = d3.format(',.2f');
  var showLabels = true;
  var donutLabelsOutside = false;

  var //if slice percentage is under this, don't show label
  labelThreshold = .02;

  var donut = false;

  var  dispatch = d3.dispatch('chartClick', 'elementClick', 'elementDblClick', 'elementMouseover', 'elementMouseout');

  function chart(selection) {
    selection.each(function(data) {
      var availableWidth = width - margin.left - margin.right;
      var availableHeight = height - margin.top - margin.bottom;
      var radius = Math.min(availableWidth, availableHeight) / 2;

      var container = d3.select(this)
          .on('click', (d, i) => {
              dispatch.chartClick({
                  data: d,
                  index: i,
                  pos: d3.event,
                  id
              });
          });


      var wrap = container.selectAll('.nv-wrap.nv-pie').data([getValues(data[0])]);
      var wrapEnter = wrap.enter().append('g').attr('class','nvd3 nv-wrap nv-pie nv-chart-' + id);
      var gEnter = wrapEnter.append('g');
      var g = wrap.select('g')

      gEnter.append('g').attr('class', 'nv-pie');

      wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      g.select('.nv-pie').attr('transform', 'translate(' + availableWidth / 2 + ',' + availableHeight / 2 + ')');



      var arc = d3.svg.arc()
                  .outerRadius((radius-(radius / 5)));

      if (donut) arc.innerRadius(radius / 2);


      // Setup the Pie chart and choose the data element
      var pie = d3.layout.pie()
          .sort(null)
          .value(d => d.disabled ? 0 : getY(d));

      var slices = wrap.select('.nv-pie').selectAll('.nv-slice')
          .data(pie);

      slices.exit().remove();

      var ae = slices.enter().append('g')
              .attr('class', 'nv-slice')
              .on('mouseover', function(d,i){
                d3.select(this).classed('hover', true);
                dispatch.elementMouseover({
                    label: getX(d.data),
                    value: getY(d.data),
                    point: d.data,
                    pointIndex: i,
                    pos: [d3.event.pageX, d3.event.pageY],
                    id
                });
              })
              .on('mouseout', function(d,i){
                d3.select(this).classed('hover', false);
                dispatch.elementMouseout({
                    label: getX(d.data),
                    value: getY(d.data),
                    point: d.data,
                    index: i,
                    id
                });
              })
              .on('click', (d, i) => {
                dispatch.elementClick({
                    label: getX(d.data),
                    value: getY(d.data),
                    point: d.data,
                    index: i,
                    pos: d3.event,
                    id
                });
                d3.event.stopPropagation();
              })
              .on('dblclick', (d, i) => {
                dispatch.elementDblClick({
                    label: getX(d.data),
                    value: getY(d.data),
                    point: d.data,
                    index: i,
                    pos: d3.event,
                    id
                });
                d3.event.stopPropagation();
              });

      slices
          .attr('fill', (d, i) => color(d, i))
          .attr('stroke', (d, i) => color(d, i));

      var paths = ae.append('path')
          .each(function(d) { this._current = d; });
      //.attr('d', arc);

      d3.transition(slices.select('path'))
          .attr('d', arc)
          //.ease('bounce')
          .attrTween('d', arcTween);
      //.attrTween('d', tweenPie);

      if (showLabels) {
        // This does the normal label
        var labelsArc = arc;
        if (donutLabelsOutside) {
          labelsArc = d3.svg.arc().outerRadius(arc.outerRadius())
        }

        ae.append("g").classed("nv-label", true)
          .each(function(d, i) {
            var group = d3.select(this);

            group
              .attr('transform', d => {
                 d.outerRadius = radius + 10; // Set Outer Coordinate
                 d.innerRadius = radius + 15; // Set Inner Coordinate
                 return 'translate(' + labelsArc.centroid(d) + ')'
              });

            group.append('rect')
                .style('stroke', '#fff')
                .style('fill', '#fff')
                .attr("rx", 3)
                .attr("ry", 3);

            group.append('text')
                .style('text-anchor', 'middle') //center the text on it's origin
                .style('fill', '#000')


        });

        slices.select(".nv-label").transition()
          .attr('transform', d => {
              d.outerRadius = radius + 10; // Set Outer Coordinate
              d.innerRadius = radius + 15; // Set Inner Coordinate
              return 'translate(' + labelsArc.centroid(d) + ')';
          });

        slices.each(function(d, i) {
          var slice = d3.select(this);

          slice
            .select(".nv-label text")
              .text((d, i) => {
                var percent = (d.endAngle - d.startAngle) / (2 * Math.PI);
                return (d.value && percent > labelThreshold) ? getX(d.data) : '';
              });

          var textBox = slice.select('text').node().getBBox();
          slice.select(".nv-label rect")
            .attr("width", textBox.width + 10)
            .attr("height", textBox.height + 10)
            .attr("transform", () => "translate(" + [textBox.x - 5, textBox.y - 5] + ")");
        });
      }


      // Computes the angle of an arc, converting from radians to degrees.
      function angle(d) {
        var a = (d.startAngle + d.endAngle) * 90 / Math.PI - 90;
        return a > 90 ? a - 180 : a;
      }

      function arcTween(a) {
        if (!donut) a.innerRadius = 0;
        var i = d3.interpolate(this._current, a);
        this._current = i(0);
        return t => arc(i(t));
      }

      function tweenPie(b) {
        b.innerRadius = 0;
        var i = d3.interpolate({startAngle: 0, endAngle: 0}, b);
        return t => arc(i(t));
      }
    });

    return chart;
  }


  chart.dispatch = dispatch;

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

  chart.values = function(_) {
    if (!arguments.length) return getValues;
    getValues = _;
    return chart;
  };

  chart.x = function(_) {
    if (!arguments.length) return getX;
    getX = _;
    return chart;
  };

  chart.y = function(_) {
    if (!arguments.length) return getY;
    getY = d3.functor(_);
    return chart;
  };

  chart.showLabels = function(_) {
    if (!arguments.length) return showLabels;
    showLabels = _;
    return chart;
  };

  chart.donutLabelsOutside = function(_) {
    if (!arguments.length) return donutLabelsOutside;
    donutLabelsOutside = _;
    return chart;
  };

  chart.donut = function(_) {
    if (!arguments.length) return donut;
    donut = _;
    return chart;
  };

  chart.id = function(_) {
    if (!arguments.length) return id;
    id = _;
    return chart;
  };

  chart.color = function(_) {
    if (!arguments.length) return color;
    color = nv.utils.getColor(_);
    return chart;
  };

  chart.valueFormat = function(_) {
    if (!arguments.length) return valueFormat;
    valueFormat = _;
    return chart;
  };

  chart.labelThreshold = function(_) {
    if (!arguments.length) return labelThreshold;
    labelThreshold = _;
    return chart;
  };


  return chart;
}
