
nv.models.legend = () => {
  var margin = {top: 5, right: 0, bottom: 5, left: 0};
  var width = 400;
  var height = 20;
  var getKey = d => d.key;
  var color = nv.utils.defaultColor();
  var align = true;

  var dispatch = d3.dispatch('legendClick', 'legendDblclick', 'legendMouseover', 'legendMouseout'); //TODO: theres are really element or series events, there are currently no 'LEGEND' events (as in entire legend)... decide if they are needed

  function chart(selection) {
    selection.each(function(data) {
      var availableWidth = width - margin.left - margin.right;

      var wrap = d3.select(this).selectAll('g.nv-legend').data([data]);
      var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-legend').append('g');


      var g = wrap.select('g')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


      var series = g.selectAll('.nv-series')
          .data(d => d);
      var seriesEnter = series.enter().append('g').attr('class', 'nv-series')
          .on('mouseover', (d, i) => {
            dispatch.legendMouseover(d,i);  //TODO: Make consistent with other event objects
          })
          .on('mouseout', (d, i) => {
            dispatch.legendMouseout(d,i);
          })
          .on('click', (d, i) => {
            dispatch.legendClick(d,i);
          })
          .on('dblclick', (d, i) => {
            dispatch.legendDblclick(d,i);
          });
      seriesEnter.append('circle')
          .style('fill', (d, i) => d.color || color(d,i))
          .style('stroke', (d, i) => d.color || color(d, i))
          .style('stroke-width', 2)
          .attr('r', 5);
      seriesEnter.append('text')
          .text(getKey)
          .attr('text-anchor', 'start')
          .attr('dy', '.32em')
          .attr('dx', '8');
      series.classed('disabled', d => d.disabled);
      series.exit().remove();


      //TODO: implement fixed-width and max-width options (max-width is especially useful with the align option)


      // NEW ALIGNING CODE, TODO: drastically clean up ... this is just the ugly initial code to make sure the math is right
      if (align) {
        var seriesWidths = [];
        series.each(function(d,i) {
              seriesWidths.push(d3.select(this).select('text').node().getComputedTextLength() + 28); // 28 is ~ the width of the circle plus some padding
            });

        //console.log('Series Widths: ', JSON.stringify(seriesWidths));

        var seriesPerRow = 0;
        var legendWidth = 0;
        var columnWidths = [];

        while ( legendWidth < availableWidth && seriesPerRow < seriesWidths.length) {
          columnWidths[seriesPerRow] = seriesWidths[seriesPerRow];
          legendWidth += seriesWidths[seriesPerRow++];
        }


        while ( legendWidth > availableWidth && seriesPerRow > 1 ) {
          columnWidths = [];
          seriesPerRow--;

          for (k = 0; k < seriesWidths.length; k++) {
            if (seriesWidths[k] > (columnWidths[k % seriesPerRow] || 0) )
              columnWidths[k % seriesPerRow] = seriesWidths[k];
          }

          legendWidth = columnWidths.reduce((prev, cur, index, array) => prev + cur);
        }
        //console.log(columnWidths, legendWidth, seriesPerRow);

        var xPositions = [];
        for (var i = 0, curX = 0; i < seriesPerRow; i++) {
            xPositions[i] = curX;
            curX += columnWidths[i];
        }

        series
            .attr('transform', (d, i) => 'translate(' + xPositions[i % seriesPerRow] + ',' + (5 + Math.floor(i / seriesPerRow) * 20) + ')');

        //position legend as far right as possible within the total width
        g.attr('transform', 'translate(' + (width - margin.right - legendWidth) + ',' + margin.top + ')');

        height = margin.top + margin.bottom + (Math.ceil(seriesWidths.length / seriesPerRow) * 20);
      } else {
        var ypos = 5;
        var newxpos = 5;
        var maxwidth = 0;
        var xpos;
        series
            .attr('transform', function(d, i) {
              var length = d3.select(this).select('text').node().getComputedTextLength() + 28;
              xpos = newxpos;

              if (width < margin.left + margin.right + xpos + length) {
                newxpos = xpos = 5;
                ypos += 20;
              }

              newxpos += length;
              if (newxpos > maxwidth) maxwidth = newxpos;

              return 'translate(' + xpos + ',' + ypos + ')';
            });

        //position legend as far right as possible within the total width
        g.attr('transform', 'translate(' + (width - margin.right - maxwidth) + ',' + margin.top + ')');

        height = margin.top + margin.bottom + ypos + 15;
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

  chart.key = function(_) {
    if (!arguments.length) return getKey;
    getKey = _;
    return chart;
  };

  chart.color = function(_) {
    if (!arguments.length) return color;
    color = nv.utils.getColor(_);
    return chart;
  };

  chart.align = function(_) {
    if (!arguments.length) return align;
    align = _;
    return chart;
  };

  return chart;
}
