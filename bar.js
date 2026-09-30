// Chart 3: mean annual energy consumption by technology for 55-inch TVs.
(() => {
	// Select the chart's HTML mount point and set space for axes.
	const container = d3.select("#bar");
	const margin = { top: 18, right: 18, bottom: 62, left: 68 };
	// Use the same technology colors as the donut chart.
	const technologyColors = {
		LCD: d3.schemeTableau10[0],
		LED: d3.schemeTableau10[1],
		"LCD (LED)": d3.schemeTableau10[1],
		OLED: d3.schemeTableau10[2]
	};
	const colorForTechnology = (technology) =>
		technologyColors[technology] ?? d3.schemeTableau10[3];
	// The tooltip reports the exact mean value for a bar.
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

	// Load the precomputed mean annual energy values for 55-inch TVs.
	d3.csv("data/Ex5_TV_energy_55inchtv_byScreenType.csv", (row) => ({
		technology: row.Screen_Tech,
		meanEnergy: +row["Mean(Labelled energy consumption (kWh/year))"]
	})).then((rows) => {
		// Ignore incomplete rows and sort from highest mean to lowest.
		const byTechnology = rows.filter((row) =>
			row.technology && Number.isFinite(row.meanEnergy)
		).sort((a, b) => d3.descending(a.meanEnergy, b.meanEnergy));

		// Redraw the bars to fit the current container width.
		function draw() {
			container.selectAll("*").remove();
			const width = container.node().clientWidth;
			if (!width) return;

			const height = Math.max(270, Math.min(360, width * 0.62));
			const innerWidth = width - margin.left - margin.right;
			const innerHeight = height - margin.top - margin.bottom;
			// A band scale spaces the named categories; a linear scale positions numeric values.
			const svg = container.append("svg")
				.attr("viewBox", `0 0 ${width} ${height}`)
				.attr("role", "img")
				.attr("aria-label", "Mean energy consumption for 55-inch TVs by screen technology");
			const x = d3.scaleBand()
				.domain(byTechnology.map((row) => row.technology))
				.range([0, innerWidth])
				.padding(0.24);
			const y = d3.scaleLinear()
				.domain([0, d3.max(byTechnology, (row) => row.meanEnergy)]).nice()
				.range([innerHeight, 0]);
			const plot = svg.append("g")
				.attr("transform", `translate(${margin.left},${margin.top})`);

			// Draw bottom category and left value axes before the bars.
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

			// Each bar's height represents the mean annual kWh value.
			plot.selectAll("rect")
				.data(byTechnology)
				.join("rect")
				.attr("x", (row) => x(row.technology))
				.attr("y", (row) => y(row.meanEnergy))
				.attr("width", x.bandwidth())
				.attr("height", (row) => innerHeight - y(row.meanEnergy))
				.attr("fill", (row) => colorForTechnology(row.technology))
				.on("pointerenter", (event, row) => tooltip.style("opacity", 1).html(
					`<strong>${row.technology}</strong><br>` +
					`${row.meanEnergy.toFixed(1)} kWh/year mean`
				))
				.on("pointermove", (event) => tooltip
					.style("left", `${event.pageX + 12}px`)
					.style("top", `${event.pageY + 12}px`))
				.on("pointerleave", () => tooltip.style("opacity", 0));
		}

		draw();
		// Redraw the bars and axes if the browser width changes.
		window.addEventListener("resize", draw);
	}).catch((error) => {
		// Display an error in the chart area if the CSV request fails.
		console.error("Could not load 55-inch TV data:", error);
		container.text("Unable to load 55-inch TV energy data.");
	});
})();
