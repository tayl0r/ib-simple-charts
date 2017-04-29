
//TODO: Finish merging this chart into the NVD3 style!
nv.models.indentedTree = () => {
  //Default Settings
  var //TODO: implement, maybe as margin on the containing div
  margin = {top: 0, right: 0, bottom: 0, left: 0};

  var width = 960;
  var height = 500;
  var color = nv.utils.defaultColor();
  var id = Math.floor(Math.random() * 10000);
  var header = true;
  var noResultsText = 'No Results found.';
  childIndent = 20,
  columns = [{key:'key', label: 'Name', type:'text'}], //TODO: consider functions like chart.addColumn, chart.removeColumn, instead of a block like this
  tableClass = null,
  iconOpen = 'images/grey-plus.png', //TODO: consider removing this and replacing with a '+' or '-' unless user defines images
  iconClose = 'images/grey-minus.png';


  var dispatch = d3.dispatch('elementClick', 'elementDblclick', 'elementMouseover', 'elementMouseout');


  function chart(selection) {
    selection.each(function(data) {
      var //TODO: decide if there is any use for these
      availableWidth = width - margin.left - margin.right;

      var availableHeight = height - margin.top - margin.bottom;


      chart.update = () => { selection.transition().call(chart) };

      var i = 0;
      var depth = 1;

      var tree = d3.layout.tree()
          .children(d => d.values)
          .size([height, childIndent]); //Not sure if this is needed now that the result is HTML


      if (!data[0].key) data[0].key = noResultsText;

      var nodes = tree.nodes(data[0]);


      var wrap = d3.select(this).selectAll('div').data([[nodes]]);
      var wrapEnter = wrap.enter().append('div').attr('class', 'nvd3 nv-wrap nv-indentedtree');
      var tableEnter = wrapEnter.append('table');
      var table = wrap.select('table').attr('width', '100%').attr('class', tableClass);



      if (header) {
        var thead = tableEnter.append('thead');

        var theadRow1 = thead.append('tr');

        columns.forEach(column => {
          theadRow1
            .append('th')
              .attr('width', column.width ? column.width : '10%')
              .style('text-align', column.type == 'numeric' ? 'right' : 'left')
            .append('span')
              .text(column.label);
        });
      }


      var tbody = table.selectAll('tbody')
                    .data(d => d);
      tbody.enter().append('tbody');



      //compute max generations
      depth = d3.max(nodes, node => node.depth);
      tree.size([height, depth * childIndent]); //TODO: see if this is necessary at all


      // Update the nodes…
      var node = tbody.selectAll('tr')
          .data(d => d, d => d.id || (d.id == ++i));
      //.style('display', 'table-row'); //TODO: see if this does anything

      node.exit().remove();


      node.select('img.nv-treeicon')
          .attr('src', icon)
          .classed('folded', folded);

      var nodeEnter = node.enter().append('tr');


      columns.forEach((column, index) => {

        var nodeName = nodeEnter.append('td')
            .style('padding-left', d => (index ? 0 : d.depth * childIndent + 12 + (icon(d) ? 0 : 16)) + 'px', 'important') //TODO: check why I did the ternary here
            .style('text-align', column.type == 'numeric' ? 'right' : 'left');


        if (index == 0) {
          nodeName.append('img')
              .classed('nv-treeicon', true)
              .classed('nv-folded', folded)
              .attr('src', icon)
              .style('width', '14px')
              .style('height', '14px')
              .style('padding', '0 1px')
              .style('display', d => icon(d) ? 'inline-block' : 'none')
              .on('click', click);
        }


        nodeName.append('span')
            .attr('class', d3.functor(column.classes) )
            .text(d => column.format ? column.format(d) :
                                        (d[column.key] || '-'));

        if  (column.showCount)
          nodeName.append('span')
              .attr('class', 'nv-childrenCount')
              .text(d => ((d.values && d.values.length) || (d._values && d._values.length)) ?
              '(' + ((d.values && d.values.length) || (d._values && d._values.length)) + ')'
            : '');


        if (column.click)
          nodeName.select('span').on('click', column.click);

      });


      node
        .order()
        .on('click', function(d) { 
          dispatch.elementClick({
            row: this, //TODO: decide whether or not this should be consistent with scatter/line events
            data: d,
            pos: [d.x, d.y]
          });
        })
        .on('dblclick', function(d) { 
          dispatch.elementDblclick({
            row: this,
            data: d,
            pos: [d.x, d.y]
          });
        })
        .on('mouseover', function(d) { 
          dispatch.elementMouseover({
            row: this,
            data: d,
            pos: [d.x, d.y]
          });
        })
        .on('mouseout', function(d) { 
          dispatch.elementMouseout({
            row: this,
            data: d,
            pos: [d.x, d.y]
          });
        });




      // Toggle children on click.
      function click(d, _, unshift) {
        d3.event.stopPropagation();

        if(d3.event.shiftKey && !unshift) {
          //If you shift-click, it'll toggle fold all the children, instead of itself
          d3.event.shiftKey = false;
          d.values && d.values.forEach(node => {
            if (node.values || node._values) {
              click(node, 0, true);
            }
          });
          return true;
        }
        if(!hasChildren(d)) {
          //download file
          //window.location.href = d.url;
          return true;
        }
        if (d.values) {
          d._values = d.values;
          d.values = null;
        } else {
          d.values = d._values;
          d._values = null;
        }
        chart.update();
      }


      function icon(d) {
        return (d._values && d._values.length) ? iconOpen : (d.values && d.values.length) ? iconClose : '';
      }

      function folded(d) {
        return (d._values && d._values.length);
      }

      function hasChildren(d) {
        var values = d.values || d._values;

        return (values && values.length);
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
    scatter.color(color);
    return chart;
  };

  chart.id = function(_) {
    if (!arguments.length) return id;
    id = _;
    return chart;
  };

  chart.header = function(_) {
    if (!arguments.length) return header;
    header = _;
    return chart;
  };

  chart.noResultsText = function(_) {
    if (!arguments.length) return noResultsText;
    noResultsText = _;
    return chart;
  };

  chart.columns = function(_) {
    if (!arguments.length) return columns;
    columns = _;
    return chart;
  };

  chart.tableClass = function(_) {
    if (!arguments.length) return tableClass;
    tableClass = _;
    return chart;
  };

  chart.iconOpen = function(_){
     if (!arguments.length) return iconOpen;
    iconOpen = _;
    return chart;
  }

  chart.iconClose = function(_){
     if (!arguments.length) return iconClose;
    iconClose = _;
    return chart;
  }

  return chart;
}
