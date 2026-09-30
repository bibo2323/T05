// Line chart: yearly average Australian spot price from 1998 through 2024.
(() => {
  const container = d3.select("#line");
  const dataUrl = "data/Ex5_ARE_Spot_Prices.csv";
  const color = d3.schemeTableau10[1];
  const margin = { top: 18, right: 20, bottom: 58, left: 74 };
  const tooltip = d3.select("body").append("div")
    .attr("class", "chart-tooltip")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("background", "#30242a")
    .style("color", "#ffffff")
    .style("padding", "0.5rem 0.65rem")
    .style("border-radius", "4px")
    .style("font-size", "0.85rem");

  // Use the dataset's precomputed average, excluding blank years/values.
  d3.csv(dataUrl, (row) => ({
    year: +row.Year,
    averagePrice: +row["Average Price (notTas-Snowy)"]
  })).then((rows) => {
    const data = rows.filter((d) =>
      Number.isFinite(d.year) && Number.isFinite(d.averagePrice) &&
      d.year >= 1998 && d.year <= 2024
    ).sort((a, b) => d3.ascending(a.year, b.year));

    // Redraw the line and axes so the time series stays legible at narrow widths.
    function draw() {
      container.selectAll("*").remove();
      const width = container.node().clientWidth;
      if (!width) return;

      const height = Math.max(270, Math.min(360, width * 0.62));
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;
      const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("role", "img")
        .attr("aria-label", "Average annual Australian spot power prices from 1998 to 2024");
      const x = d3.scaleLinear()
        .domain(d3.extent(data, (d) => d.year))
        .range([0, innerWidth]);
      const y = d3.scaleLinear()
        .domain([0, d3.max(data, (d) => d.averagePrice)]).nice()
        .range([innerHeight, 0]);
      const plot = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      plot.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(6).tickSizeOuter(0));
      plot.append("g").call(d3.axisLeft(y).ticks(5));
      plot.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 44)
        .attr("text-anchor", "middle")
        .attr("fill", "currentColor")
        .text("Year");
      plot.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -54)
        .attr("text-anchor", "middle")
        .attr("fill", "currentColor")
        .text("Average spot price ($/MWh)");

      // A single average line avoids a crowded multi-state plot.
      const line = d3.line()
        .x((d) => x(d.year))
        .y((d) => y(d.averagePrice));
      plot.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 2.5)
        .attr("d", line);

      plot.selectAll("circle")
        .data(data)
        .join("circle")
        .attr("cx", (d) => x(d.year))
        .attr("cy", (d) => y(d.averagePrice))
        .attr("r", 3.5)
        .attr("fill", color)
        .on("pointerenter", (event, d) => tooltip.style("opacity", 1).html(
          `<strong>${d.year}</strong><br>$${d.averagePrice.toFixed(2)} per MWh`
        ))
        .on("pointermove", (event) => tooltip
          .style("left", `${event.pageX + 12}px`)
          .style("top", `${event.pageY + 12}px`))
        .on("pointerleave", () => tooltip.style("opacity", 0));
    }

    draw();
    window.addEventListener("resize", draw);
  }).catch((error) => {
    console.error("Could not load spot-price data:", error);
    container.text("Unable to load spot-price data.");
  });
})();