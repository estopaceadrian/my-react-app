import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import c3 from 'c3';
import { fetchStockDataLimited } from '../services/api';
import './chart.css';

export default function Chart({ width, height }) {
  const chartRef = useRef(null);
  const [metaData, setMetaData] = useState(null);
  const [chartRendered, setChartRendered] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Add isLoading state

  const fetchData = async () => {
    try {
      const stockData = await fetchStockDataLimited();
      setMetaData(stockData.metaData);
      if (!chartRendered) {
        renderChart(stockData);
        setChartRendered(true);
      }
      setIsLoading(false); // Set isLoading to false when data is fetched
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const renderChart = ({ metaData, timeSeriesData }) => {
    if (chartRef.current) {
      // Remove the existing SVG element
      d3.select(chartRef.current).select('svg').remove();
      // Declare and select the tooltip element
      const tooltip = d3
        .select(chartRef.current)
        .append('div')
        .attr('id', 'tooltip');

      const margin = { top: 20, right: 30, bottom: 30, left: 60 };
      const chartWidth = width - margin.left - margin.right;
      const chartHeight = height - margin.top - margin.bottom;

      const svg = d3
        .select(chartRef.current)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const parseDate = d3.timeParse('%Y-%m-%d %H:%M:%S');

      const data = Object.entries(timeSeriesData).map(([timestamp, values]) => {
        const date = parseDate(timestamp);
        const open = parseFloat(values['1. open']);
        const high = parseFloat(values['2. high']);
        const low = parseFloat(values['3. low']);
        const close = parseFloat(values['4. close']);
        const volume = parseFloat(values['5. volume']);

        return { timestamp: date, open, high, low, close, volume };
      });

      const xScale = d3
        .scaleTime()
        .domain(d3.extent(data, (d) => d.timestamp))
        .range([0, chartWidth]);

      const yScale = d3
        .scaleLinear()
        .domain([d3.min(data, (d) => d.low), d3.max(data, (d) => d.high)])
        .range([chartHeight, 0]);

      svg
        .append('g')
        .attr('transform', `translate(0, ${chartHeight})`)
        .call(d3.axisBottom(xScale).ticks(10))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end');

      svg.append('g').call(d3.axisLeft(yScale));
      // Add lines for open, high, low, and close data
      const openLine = d3
        .line()
        .x((d) => xScale(d.timestamp))
        .y((d) => yScale(d.open))
        .curve(d3.curveMonotoneX);

      const highLine = d3
        .line()
        .x((d) => xScale(d.timestamp))
        .y((d) => yScale(d.high));

      const lowLine = d3
        .line()
        .x((d) => xScale(d.timestamp))
        .y((d) => yScale(d.low));

      const closeLine = d3
        .line()
        .x((d) => xScale(d.timestamp))
        .y((d) => yScale(d.close));

      const legend = svg
        .append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${chartWidth - 100}, ${margin.top})`);

      const legendItems = [
        { color: 'green', label: 'Open', line: openLine },
        { color: 'red', label: 'High', line: highLine },
        { color: 'blue', label: 'Low', line: lowLine },
        { color: 'orange', label: 'Close', line: closeLine },
      ];

      const legendItem = legend
        .selectAll('.legend-item')
        .data(legendItems)
        .enter()
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => `translate(0, ${i * 20})`)
        .on('mouseover', function () {
          d3.select(this).style('cursor', 'pointer');
        })
        .on('mouseout', function () {
          d3.select(this).style('cursor', 'default');
        })
        .on('click', (event, d) => {
          // Toggle visibility of the selected line
          const lineSelection = svg.select(`.${d.label.toLowerCase()}-line`);
          const isLineVisible = lineSelection.style('display') !== 'none';
          lineSelection.style('display', isLineVisible ? 'none' : 'initial');
        });
      legendItem
        .append('line')
        .attr('x1', 0)
        .attr('y1', 5)
        .attr('x2', 15)
        .attr('y2', 5)
        .attr('stroke', (d) => d.color)
        .attr('stroke-width', 1.5);

      legendItem
        .append('text')
        .attr('x', 20)
        .attr('y', 10)
        .text((d) => d.label);

      // Append lines for open, high, low, and close data
      svg
        .append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', 'green')
        .attr('stroke-width', 1.5)
        .attr('class', 'open-line')
        .attr('d', openLine);

      svg
        .append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', 'red')
        .attr('stroke-width', 1.5)
        .attr('class', 'high-line')
        .attr('d', highLine);

      svg
        .append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', 'blue')
        .attr('stroke-width', 1.5)
        .attr('class', 'low-line')
        .attr('d', lowLine);

      svg
        .append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', 'orange')
        .attr('stroke-width', 1.5)
        .attr('class', 'close-line')
        .attr('d', closeLine);

      svg
        .append('text')
        .attr('x', chartWidth / 2)
        .attr('y', -margin.top / 2)
        .attr('text-anchor', 'middle')
        .attr('font-weight', 'bold')
        .text(metaData ? metaData['1. Information'] : '');

      svg
        .append('text')
        .attr('x', chartWidth / 2)
        .attr('y', -margin.top / 2 + 20)
        .attr('text-anchor', 'middle')
        .text(metaData ? `Symbol: ${metaData['2. Symbol']}` : '');

      svg
        .append('text')
        .attr('x', chartWidth / 2)
        .attr('y', -margin.top / 2 + 40)
        .attr('text-anchor', 'middle')
        .text(
          metaData ? `Last Refreshed: ${metaData['3. Last Refreshed']}` : ''
        );

      svg
        .append('text')
        .attr('x', chartWidth / 2)
        .attr('y', -margin.top / 2 + 60)
        .attr('text-anchor', 'middle')
        .text(metaData ? `Interval: ${metaData['4. Interval']}` : '');
      let dataPoints; // Declare dataPoints variable
      // Add the data points
      dataPoints = svg
        .selectAll('.data-point')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'data-point')
        .attr('cx', (d) => xScale(d.timestamp))
        .attr('cy', (d) => yScale(d.high))
        .attr('r', 3)
        .attr('fill', 'red')
        .style('visibility', 'hidden')
        .on('mouseover', (event, d) => {
          // Show all the data when hovering over a data point
          tooltip.html(`
            <div>Date: ${d.timestamp}</div>
            <div>Open: ${d.open}</div>
            <div>High: ${d.high}</div>
            <div>Low: ${d.low}</div>
            <div>Close: ${d.close}</div>
            <div>Volume: ${d.volume}</div>
          `);
          tooltip.style('display', 'block');
        })
        .on('mouseout', () => {
          // Hide the tooltip when not hovering over a data point
          tooltip.style('display', 'none');
        })
        .on('mousemove', (event) => {
          // Position the tooltip relative to the mouse cursor
          const tooltipWidth = parseInt(tooltip.style('width'));
          const tooltipHeight = parseInt(tooltip.style('height'));
          const x = event.pageX - tooltipWidth / 2;
          const y = event.pageY - tooltipHeight - 10;
          tooltip.style('left', `${x}px`);
          tooltip.style('top', `${y}px`);
        });
      // Handle mouse events
      svg
        .on('mouseover', () => {
          dataPoints.style('visibility', 'visible'); // Show data points on mouseover
        })
        .on('mouseout', () => {
          dataPoints.style('visibility', 'hidden'); // Hide data points on mouseout
          tooltip.style('display', 'none'); // Hide tooltip on mouseout
        });
      // Cleanup on component unmount
      return () => svg.remove();
    }
  };

  return (
    <div className="flex flex-col items-center mt-9">
      {isLoading ? ( // Show the loading image while isLoading is true
        <>
          <div className="sm:animate-spin lg:animate-spin">
            <span className="text-5xl">🌎 </span>
          </div>
          <span className="text-2xl">Processing . . .</span>
        </>
      ) : (
        <div
          ref={chartRef}
          style={{ width: `${width}px`, height: `${height}px` }}
        />
      )}
    </div>
  );
}
