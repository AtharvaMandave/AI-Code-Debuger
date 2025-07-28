import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function D3Visualizer({ data, type, currentStep = 0 }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 600;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };

    svg.attr('width', width).attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    switch (type) {
      case 'tree':
        renderTree(g, data, chartWidth, chartHeight);
        break;
      case 'graph':
        renderGraph(g, data, chartWidth, chartHeight);
        break;
      case 'array':
        renderArray(g, data, chartWidth, chartHeight);
        break;
      case 'linked_list':
        renderLinkedList(g, data, chartWidth, chartHeight);
        break;
      default:
        renderGeneric(g, data, chartWidth, chartHeight);
    }
  }, [data, type, currentStep]);

  const renderTree = (g, data, width, height) => {
    // Create hierarchical data structure
    const root = d3.stratify()
      .id(d => d.id)
      .parentId(d => d.parent)
      (data.nodes || []);

    // Create tree layout
    const treeLayout = d3.tree().size([width - 100, height - 100]);
    const treeData = treeLayout(root);

    // Create links
    const links = g.selectAll('.link')
      .data(treeData.links())
      .enter().append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#999')
      .attr('stroke-width', 2)
      .attr('d', d3.linkVertical()
        .x(d => d.x)
        .y(d => d.y));

    // Create nodes
    const nodes = g.selectAll('.node')
      .data(treeData.descendants())
      .enter().append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`);

    // Add circles to nodes
    nodes.append('circle')
      .attr('r', 25)
      .attr('fill', d => {
        if (data.highlighted?.includes(d.data.id)) return '#fbbf24';
        if (data.visited?.includes(d.data.id)) return '#3b82f6';
        return '#10b981';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)
      .transition()
      .duration(500)
      .ease(d3.easeElastic);

    // Add main value text to nodes
    nodes.append('text')
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-weight', 'bold')
      .attr('font-size', '14px')
      .text(d => d.data.value || d.data.id);

    // Add index text below main value
    nodes.append('text')
      .attr('dy', '1.5em')
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '10px')
      .attr('opacity', '0.8')
      .text(d => `[${d.data.id}]`);

    // Add labels
    nodes.append('text')
      .attr('dy', '3em')
      .attr('text-anchor', 'middle')
      .attr('fill', '#666')
      .attr('font-size', '12px')
      .text(d => d.data.id);
  };

  const renderGraph = (g, data, width, height) => {
    // Create force simulation
    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.edges || []).id(d => d.id))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    // Create links
    const links = g.selectAll('.link')
      .data(data.edges || [])
      .enter().append('line')
      .attr('class', 'link')
      .attr('stroke', '#999')
      .attr('stroke-width', 2);

    // Create nodes
    const nodes = g.selectAll('.node')
      .data(data.nodes || [])
      .enter().append('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add circles to nodes
    nodes.append('circle')
      .attr('r', 20)
      .attr('fill', d => {
        if (data.highlighted?.includes(d.id)) return '#fbbf24';
        if (data.visited?.includes(d.id)) return '#3b82f6';
        return '#8b5cf6';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add main value text to nodes
    nodes.append('text')
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-weight', 'bold')
      .attr('font-size', '12px')
      .text(d => d.value || d.id);

    // Add index text below main value
    nodes.append('text')
      .attr('dy', '1.2em')
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '8px')
      .attr('opacity', '0.8')
      .text(d => `[${d.id}]`);

    // Update positions on tick
    simulation.on('tick', () => {
      links
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      nodes.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  };

  const renderArray = (g, data, width, height) => {
    const array = data.array || [];
    const barWidth = Math.min(50, (width - 100) / array.length);
    const maxValue = Math.max(...array);

    // Create bars
    const bars = g.selectAll('.bar')
      .data(array)
      .enter().append('g')
      .attr('class', 'bar')
      .attr('transform', (d, i) => `translate(${i * (barWidth + 15) + 50},${height - 80})`);

    // Add rectangles
    bars.append('rect')
      .attr('width', barWidth)
      .attr('height', d => Math.max((d / maxValue) * (height - 120), 20))
      .attr('fill', (d, i) => {
        if (data.highlighted?.includes(i)) return '#fbbf24';
        if (data.comparisons?.includes(i)) return '#ef4444';
        return '#3b82f6';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('rx', 3)
      .transition()
      .duration(500)
      .ease(d3.easeElastic);

    // Add values on top of bars
    bars.append('text')
      .attr('x', barWidth / 2)
      .attr('y', d => -(d / maxValue) * (height - 120) - 10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#374151')
      .attr('font-weight', 'bold')
      .attr('font-size', '12px')
      .text(d => d);

    // Add indices below bars
    bars.append('text')
      .attr('x', barWidth / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('fill', '#6b7280')
      .attr('font-size', '10px')
      .text((d, i) => `[${i}]`);

    // Add array summary
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height - 10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#6b7280')
      .attr('font-size', '12px')
      .text(`Array: [${array.join(', ')}]`);
  };

  const renderLinkedList = (g, data, width, height) => {
    const nodes = data.nodes || [];
    const nodeRadius = 30;
    const spacing = 140;

    // Create nodes
    const nodeGroups = g.selectAll('.node')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'node')
      .attr('transform', (d, i) => `translate(${50 + i * spacing},${height / 2})`);

    // Add circles
    nodeGroups.append('circle')
      .attr('r', nodeRadius)
      .attr('fill', (d, i) => {
        if (data.highlighted?.includes(i)) return '#fbbf24';
        if (data.current === i) return '#10b981';
        return '#3b82f6';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)
      .transition()
      .duration(500)
      .ease(d3.easeElastic);

    // Add main values
    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', 'white')
      .attr('font-weight', 'bold')
      .attr('font-size', '14px')
      .text(d => d.value || d.id);

    // Add indices below values
    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.5em')
      .attr('fill', 'white')
      .attr('font-size', '10px')
      .attr('opacity', '0.8')
      .text((d, i) => `[${i}]`);

    // Add arrows between nodes
    for (let i = 0; i < nodes.length - 1; i++) {
      g.append('path')
        .attr('d', `M ${50 + i * spacing + nodeRadius} ${height / 2} L ${50 + (i + 1) * spacing - nodeRadius} ${height / 2}`)
        .attr('stroke', '#6b7280')
        .attr('stroke-width', 3)
        .attr('fill', 'none')
        .attr('marker-end', 'url(#arrowhead)');
    }

    // Define arrow marker
    g.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#6b7280');

    // Add linked list summary
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height - 20)
      .attr('text-anchor', 'middle')
      .attr('fill', '#6b7280')
      .attr('font-size', '12px')
      .text(`Values: [${nodes.map(n => n.value || n.id).join(' → ')}]`);
  };

  const renderGeneric = (g, data, width, height) => {
    // Generic visualization for other data types
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#6b7280')
      .attr('font-size', '16px')
      .text('Visualization not available for this data type');
  };

  return (
    <div className="w-full overflow-x-auto">
      <svg ref={svgRef} className="w-full max-w-4xl mx-auto"></svg>
    </div>
  );
} 