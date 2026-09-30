// Donut chart: total estimated annual energy use by screen technology.
(() => {
  const container = d3.select("#donut");
  const dataUrl = "data/Ex5_TV_energy.csv";
  const allSizesUrl = "data/Ex5_TV_energy_Allsizes_byScreenType.csv";
  // Keep colors stable across charts; the source labels LCD (LED) and LED share a category color.
  const technologyColors = {
    LCD: d3.schemeTableau10[0],
    LED: d3.schemeTableau10[1],
    "LCD (LED)": d3.schemeTableau10[1],
    OLED: d3.schemeTableau10[2]
  };
  const colorForTechnology = (technology) =>
    technologyColors[technology] ?? d3.schemeTableau10[3];
  const margin = { top: 12, right: 12, bottom: 12, left: 12 };
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

  // Multiply each grouped model's use by its count to estimate combined use.
  Promise.all([
    d3.csv(dataUrl, (row) => ({
      technology: row.screen_tech,
      energy: +row.energy_consumpt,
      count: +row.count
    })),
    d3.csv(allSizesUrl, (row) => ({
      technology: row.Screen_Tech,
      meanEnergy: +row["Mean(Labelled energy consumption (kWh/year))"]
    }))
  ]).then(([rows, allSizeMeans]) => {
    const meanEnergyByTechnology = new Map(
      allSizeMeans.map((d) => [d.technology, d.meanEnergy])
    );
    const totals = d3.rollups(
      rows.filter((d) => Number.isFinite(d.energy) && Number.isFinite(d.count)),
      (group) => d3.sum(group, (d) => d.energy * d.count),
      (d) => d.technology
    ).map(([technology, value]) => ({ technology, value }))
      .sort((a, b) => d3.descending(a.value, b.value));

    // Redraw the chart and its legend at the current container width.
    function draw() {
      container.selectAll("*").remove();
      const width = container.node().clientWidth;
      if (!width) return;

      const height = Math.max(270, Math.min(360, width * 0.62));
      const legendWidth = Math.min(145, width * 0.34);
      const chartWidth = width - legendWidth;
      const radius = Math.max(45, Math.min(chartWidth, height) / 2 - 12);
      const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("role", "img")
        .attr("aria-label", "Total estimated energy consumption by screen technology");
      const pie = d3.pie().sort(null).value((d) => d.value);
      const arc = d3.arc().innerRadius(radius * 0.56).outerRadius(radius);
      const slices = pie(totals);
      const chart = svg.append("g")
        .attr("transform", `translate(${chartWidth / 2},${height / 2})`);

      chart.selectAll("path")
        .data(slices)
        .join("path")
        .attr("d", arc)
        .attr("fill", (d) => colorForTechnology(d.data.technology))
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 2)
        .on("pointerenter", (event, d) => {
          const share = d.value / d3.sum(totals, (item) => item.value);
          const meanTechnology = d.data.technology === "LCD (LED)"
            ? "LED"
            : d.data.technology;
          const meanEnergy = meanEnergyByTechnology.get(meanTechnology);
          tooltip.style("opacity", 1).html(
            `<strong>${d.data.technology}</strong><br>` +
            `${Math.round(d.value).toLocaleString()} kWh/year total<br>` +
            `${d3.format(".1%") (share)}` +
            (Number.isFinite(meanEnergy)
              ? `<br>Mean per TV: ${meanEnergy.toFixed(1)} kWh/year`
              : "")
          );
        })
        .on("pointermove", (event) => tooltip
          .style("left", `${event.pageX + 12}px`)
          .style("top", `${event.pageY + 12}px`))
        .on("pointerleave", () => tooltip.style("opacity", 0));

      // A compact legend maps each screen technology to its donut color.
      const legend = svg.append("g")
        .attr("transform", `translate(${chartWidth + 8},${Math.max(22, height / 2 - totals.length * 14)})`);
      const item = legend.selectAll("g")
        .data(totals)
        .join("g")
        .attr("transform", (d, i) => `translate(0,${i * 28})`);
      item.append("circle")
        .attr("r", 5)
        .attr("cx", 5)
        .attr("cy", 0)
        .attr("fill", (d) => colorForTechnology(d.technology));
      item.append("text")
        .attr("x", 15)
        .attr("y", 4)
        .attr("font-size", 12)
        .attr("fill", "currentColor")
        .text((d) => d.technology);
    }

    draw();
    window.addEventListener("resize", draw);
  }).catch((error) => {
    console.error("Could not load donut-chart data:", error);
    container.text("Unable to load TV energy data.");
  });
})();