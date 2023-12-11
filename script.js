const 
  hMargin = 70,       // Horizontal margin - Compare with "width" and "container".
  vMargin = 40,       // Vertical margin - compare with "height" and "container".
  cellWidth = 4,      // Width of each individual cell.
  cellHeight = 40,    // Height of each individual cell.
  tipHeight = 50,     // Tooltip box size.
  xLabel = "Year",    // Horizontal Axis label.
  yLabel = "Month",   // Vertical Axis label.
  legendLabel = "Temperature color code";

// =====================
// Define Palette colors and size.
// color source: https://colorbrewer2.org/#type=diverging&scheme=Spectral&n=10
// =====================
const colors = ['#9e0142','#d53e4f','#f46d43','#fdae61','#fee08b','#e6f598','#abdda4','#66c2a5','#3288bd','#5e4fa2'].reverse(),
  paletteHeight = 20,   // Height of the color palette.
  paletteWidth = 25 ;   // Width of the color palette. 

// Other options to explore:
// const 
//   colorContin = d3.scaleSequential(d3.interpolateRdYlBu),
//   colorDiscrete = d3.scaleOrdinal(d3.schemeRdYlBu);

// =====================
// File with source data
// =====================
const dataFile = 'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json'; // Option for web file.
// const dataFile = 'data.json'; // Option for local file.

// =====================
// Function to get month long name from month number (-1)
// =====================
function getMonth(num) {
  let date = new Date();    // Create a new variable of type "date".
  date.setMonth(num);       // Assign the month entered as parameter.
  return date.toLocaleString('en-US', { month: 'long' });   // Return the month in long format.
}

// =====================
// Create color palette (static)
// =====================
const palette = d3.select('#palette');
palette
  .selectAll('rect')
  .data(colors)
  .enter()
  .append('rect')
  .attr('x', (d, i) => ( 1 + i) * paletteWidth)
  .attr('width', paletteWidth)
  .attr('height', paletteHeight)
  .style('fill', (d) => d);

// =====================
// Assign name to the Tooltip
// =====================    
const tip = d3.select('#tooltip');

// =====================
// Dynamic operations with data from file
// =====================
fetch(dataFile)                    // Retrieve the remote file.
  .then(file => file.json())       // Create a JSON object with the response.
  .then(json => {
    const baseTemp = json.baseTemperature;  // Variable to store base temperature.    
    const data = json.monthlyVariance;      // Array to store historic data.
    data.forEach(d => {
      d.month -= 1;                         // Change months [1. 12] to [0, 11] !!!
      d.temp = baseTemp + d.variance;       // Add property 'temp'.
    });    

    // =====================
    // Create text in "description" from the json file.
    // =====================
    d3.select('#description')
      .html( data[0].year + ' - ' + data[data.length - 1].year + ': base temperature ' + baseTemp +  '&#8451;' );   

    // =====================
    // SVG Chart: dynamic dimensions and position.
    // =====================
    const                        
      svgWidth = hMargin + cellWidth * data.length / 12,
      svgHeight = vMargin + cellHeight * 12;

    const chart = d3.select('#chart')  // Assign name and dimensions to SVG chart.
      .attr('width', svgWidth)
      .attr('height', svgHeight);

    chart.append('text')        // Add X-axis label (dynamic position).
      .text(xLabel)
      .attr('class', 'Label')
      .attr('id', 'x-Label')
      .attr('x', svgWidth / 2) 
      .attr('y', svgHeight);
  
    chart.append('text')        // Add Y-axis label (dynamic position).
      .attr('transform', 'rotate(-90)')
      .text(yLabel)
      .attr('class', 'Label')
      .attr('id', 'y-Label')
      .attr('x', -svgHeight / 2 )
      .attr('y', hMargin / 3);

    // =====================
    // --- X Axis
    // =====================  
    // Define domain/range/scaling for X-axis
    const                 
      yearExtent = d3.extent(data.map(d => d.year)),        //-> [1753,2015]
      xDomain = d3.range(yearExtent[0], yearExtent[1] + 1), // Domain of Values for band scale [1753, 1754, 1755 .... 2015]
      xTicks = xDomain.filter(i => i % 10 == 0),            // Filtered ticks to display [1760, 1770, 1780 .... 2010]
      xRange  = [0, svgWidth - hMargin],                    // Range of coordinates.
      xScale = d3.scaleBand(xDomain, xRange),               // Scale values <-> coordinates.
      x_axis = d3.axisBottom(xScale).tickValues(xTicks);    // X-axis definition.

    chart.append('g')     // Create X-axis
      .call(x_axis)
      .attr('id', 'x-axis')
      .attr('transform', 'translate(' + hMargin + ',' + (svgHeight - vMargin) + ')')
      .selectAll('text');

    // =====================
    // --- Y Axis
    // =====================  
    // Define domain/range/scaling for Y-axis
    const                 
      monthExtent = d3.extent(data.map(d => d.month)),          //-> [0,11]
      monthRange = d3.range(monthExtent[0], monthExtent[1]+1),  //-> [0,1,2,3,4,5,6,7,8,9,10,11]
      yDomain = monthRange.map(d => getMonth(d)),   // Domain of Values for band scale ["January","February"...,"December"]
      yRange = [svgHeight - vMargin, 0],            // Range of coordinates.
      yScale = d3.scaleBand(yDomain, yRange),       // Scale values <-> coordinates.
      y_axis = d3.axisLeft(yScale);                 // Y-axis definition.
 
    chart.append('g')     // Create X-axis
      .call(y_axis)
      .attr('id', 'y-axis')
      .attr('transform', 'translate(' + hMargin + ', 0 )')
      .selectAll('text');

    // =====================
    // --- Z Axis (temperature <=> color)
    // =====================    
    // Define boundaries and step for Z scaling.    
    const               
      zMin = Math.floor(Math.min(...data.map(d => d.temp))),
      zMax = Math.ceil(Math.max(...data.map(d=> d.temp))),
      step = (zMax - zMin) / colors.length;

    // Assign color from palette to each element in data array
    for(let i = 0; i < colors.length; i++) {      // Loop through colors.
      data.forEach( (item) => {                   // Loop through data items. 
        if (zMin + i * step < item.temp && item.temp <= zMin + (i + 1) * step) {item.color = colors[i];}
      } );
    }

    // Scale the color codes in palette
    const
      zDomain = [zMin, zMax],                       // Domain values for linear scale [1, 14]
      zRange  = [0, colors.length * paletteWidth],  // Range of coordinates.
      zScale = d3.scaleLinear(zDomain, zRange),     // Scale values <-> coordinates.
      zTicks = d3.range(colors.length + 1).map((i) => zMin + step * i),    
      z_axis = d3.axisBottom()                      // Z-axis definition.
        .scale(zScale)
        .tickValues(zTicks)
        .tickFormat(d3.format(".1f"));

    palette.append('g')       // Create Z-axis
      .call(z_axis)
      .attr('id', 'z-axis')  
      .attr('transform', 'translate(' + paletteWidth + ', ' + paletteHeight + ')');
  
    // =====================
    // Create cells as rect elements.
    // =====================      
    chart
      .selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'cell')
      .attr('x', (d, i) => hMargin + (d.year - 1753) * cellWidth)
      .attr('y', (d, i) => svgHeight - vMargin - (d.month + 1) * cellHeight)
      .attr('data-month', d => d.month)
      .attr('data-year', d => d.year)
      .attr('data-temp', d => d.temp)
      .attr('width', cellWidth)
      .attr('height', cellHeight)
      .style('fill', (d) => d.color)
      // =============================================================
      // Show/hide tooltip
      // =============================================================          
      .on('mouseover', function (event, d) { 
        tip.attr('data-year', d.year);
        tip
          .style('opacity', 0.8)
          .html(getMonth(d.month) + ', ' + d.year + ':<br />' + 
                'Temp: ' + d3.format('.2f')(d.temp) + '&degC / var = ' 
                + d3.format('.2f')(d.variance) + '&degC'  )
          .style('left', event.pageX + 'px')
          .style('top', event.pageY - 40  + 'px');
      })
      .on('mouseout', function () { tip.style('opacity', 0);  }
      );
});
