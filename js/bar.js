// Bar chart: mean annual energy use for 55-inch TVs by screen technology.
(() => {
  const container = d3.select("#bar");
  const dataUrl = "data/Ex5_TV_energy_55inchtv_byScreenType.csv";
  // Match the donut chart's colors, including the source alias LCD (LED) for LED.
  const technologyColors = {
    LCD: d3.schemeTableau10[0],
    LED: d3.schemeTableau10[1],
    "LCD (LED)": d3.schemeTableau10[1],
    OLED: d3.schemeTableau10[2]
  };
  const colorForTechnology = (technology) =>
    technologyColors[technology] ?? d3.schemeTableau10[3];
  const margin = { top: 18, right: 18, bottom: 62, left: 68 };
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

  // The supplied summary already contains the mean for each technology.
  d3.csv(dataUrl, (row) => ({
    technology: row.Screen_Tech,
    meanEnergy: +row["Mean(Labelled energy consumption (kWh/year))"]
  })).then((data) => {
    const validData = data.filter((d) => Number.isFinite(d.meanEnergy))
      .sort((a, b) => d3.descending(a.meanEnergy, b.meanEnergy));

    // Rebuild the bars and axes to fit the chart container at each width.
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
        .attr("aria-label", "Mean annual energy consumption for 55-inch TVs by screen technology");
      const x = d3.scaleBand()
        .domain(validData.map((d) => d.technology))
        .range([0, innerWidth])
        .padding(0.24);
      const y = d3.scaleLinear()
        .domain([0, d3.max(validData, (d) => d.meanEnergy)]).nice()
        .range([innerHeight, 0]);
      const plot = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      plot.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x));
      plot.append("g")
        .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format("~g")));
      plot.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 46)
        .attr("text-anchor", "middle")
        .attr("fill", "currentColor")
        .text("Screen technology");
      plot.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -48)
        .attr("text-anchor", "middle")
        .attr("fill", "currentColor")
        .text("Mean energy consumption (kWh/year)");

      plot.selectAll("rect")
        .data(validData)
        .join("rect")
        .attr("x", (d) => x(d.technology))
        .attr("y", (d) => y(d.meanEnergy))
        .attr("width", x.bandwidth())
        .attr("height", (d) => innerHeight - y(d.meanEnergy))
        .attr("fill", (d) => colorForTechnology(d.technology))
        .on("pointerenter", (event, d) => tooltip.style("opacity", 1).html(
          `<strong>${d.technology}</strong><br>${d.meanEnergy.toFixed(1)} kWh/year (mean)`
        ))
        .on("pointermove", (event) => tooltip
          .style("left", `${event.pageX + 12}px`)
          .style("top", `${event.pageY + 12}px`))
        .on("pointerleave", () => tooltip.style("opacity", 0));
    }

    draw();
    window.addEventListener("resize", draw);
  }).catch((error) => {
    console.error("Could not load bar-chart data:", error);
    container.text("Unable to load 55-inch TV energy data.");
  });
})();