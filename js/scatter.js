// Scatter plot: energy use by star rating for each TV model/size record.
(() => {
  const container = d3.select("#scatter");
  const dataUrl = "data/Ex5_TV_energy.csv";
  const color = d3.schemeTableau10[0];
  const margin = { top: 18, right: 20, bottom: 58, left: 68 };
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

  // Read numeric columns explicitly and ignore incomplete records.
  d3.csv(dataUrl, (row) => ({
    brand: row.brand,
    technology: row.screen_tech,
    screenSize: +row.screensize,
    energy: +row.energy_consumpt,
    starRating: +row.star2,
    count: +row.count
  })).then((rows) => {
    const data = rows.filter((d) =>
      Number.isFinite(d.energy) && Number.isFinite(d.starRating)
    );

    // Rebuild the SVG using the container's current width.
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
        .attr("aria-label", "Energy consumption by energy star rating");
      const x = d3.scaleLinear()
        .domain(d3.extent(data, (d) => d.starRating)).nice()
        .range([0, innerWidth]);
      const y = d3.scaleLinear()
        .domain([0, d3.max(data, (d) => d.energy)]).nice()
        .range([innerHeight, 0]);
      const plot = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      plot.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).ticks(Math.max(3, Math.floor(innerWidth / 70))));
      plot.append("g").call(d3.axisLeft(y));
      plot.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 44)
        .attr("text-anchor", "middle")
        .attr("fill", "currentColor")
        .text("Energy star rating");
      plot.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -48)
        .attr("text-anchor", "middle")
        .attr("fill", "currentColor")
        .text("Energy consumption (kWh/year)");

      // Lightly transparent dots make overlapping model records easier to see.
      plot.selectAll("circle")
        .data(data)
        .join("circle")
        .attr("cx", (d) => x(d.starRating))
        .attr("cy", (d) => y(d.energy))
        .attr("r", (d) => d.count > 1 ? 4 : 3)
        .attr("fill", color)
        .attr("fill-opacity", 0.62)
        .on("pointerenter", (event, d) => {
          tooltip.style("opacity", 1).html(
            `<strong>${d.brand}</strong><br>${d.technology}, ${d.screenSize} in<br>` +
            `${d.energy.toLocaleString()} kWh/year; rating ${d.starRating}<br>` +
            `Model count: ${d.count}`
          );
        })
        .on("pointermove", (event) => tooltip
          .style("left", `${event.pageX + 12}px`)
          .style("top", `${event.pageY + 12}px`))
        .on("pointerleave", () => tooltip.style("opacity", 0));
    }

    draw();
    window.addEventListener("resize", draw);
  }).catch((error) => {
    console.error("Could not load scatter-plot data:", error);
    container.text("Unable to load TV energy data.");
  });
})();