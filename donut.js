// Chart 2: mean annual energy use by screen technology across all TV sizes.
(() => {
	// Select the chart's HTML mount point.
	const container = d3.select("#donut");
	const margin = { top: 12, right: 12, bottom: 12, left: 12 };
	// Keep each technology's color consistent with the bar chart.
	const technologyColors = {
		LCD: d3.schemeTableau10[0],
		LED: d3.schemeTableau10[1],
		"LCD (LED)": d3.schemeTableau10[1],
		OLED: d3.schemeTableau10[2]
	};
	const colorForTechnology = (technology) =>
		technologyColors[technology] ?? d3.schemeTableau10[3];
	// The tooltip displays the category value and its share of all displayed means.
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

	// Load the precomputed mean energy consumption for each technology.
	d3.csv("data/Ex5_TV_energy_Allsizes_byScreenType.csv", (row) => ({
		technology: row.Screen_Tech,
		meanEnergy: +row["Mean(Labelled energy consumption (kWh/year))"]
	})).then((rows) => {
		// Remove incomplete rows, then order larger mean values first.
		const data = rows.filter((row) =>
			row.technology && Number.isFinite(row.meanEnergy)
		).sort((a, b) => d3.descending(a.meanEnergy, b.meanEnergy));

		// Redraw the SVG and legend at the current container width.
		function draw() {
			container.selectAll("*").remove();
			const width = container.node().clientWidth;
			if (!width) return;

			const height = Math.max(270, Math.min(360, width * 0.62));
			const legendWidth = Math.min(145, width * 0.34);
			const chartWidth = width - legendWidth;
			const radius = Math.max(45, Math.min(chartWidth, height) / 2 - 12);
			// The pie layout converts each mean value into an angle; the inner radius makes it a donut.
			const svg = container.append("svg")
				.attr("viewBox", `0 0 ${width} ${height}`)
				.attr("role", "img")
				.attr("aria-label", "Mean annual energy consumption per TV by screen technology");
			const pie = d3.pie().sort(null).value((row) => row.meanEnergy);
			const arc = d3.arc().innerRadius(radius * 0.56).outerRadius(radius);
			const slices = pie(data);
			const chart = svg.append("g")
				.attr("transform", `translate(${chartWidth / 2},${height / 2})`);

			// One SVG path is drawn for each technology slice.
			chart.selectAll("path")
				.data(slices)
				.join("path")
				.attr("d", arc)
				.attr("fill", (slice) => colorForTechnology(slice.data.technology))
				.attr("stroke", "#ffffff")
				.attr("stroke-width", 2)
				.on("pointerenter", (event, slice) => {
					const share = slice.value / d3.sum(data, (row) => row.meanEnergy);
					tooltip.style("opacity", 1).html(
						`<strong>${slice.data.technology}</strong><br>` +
						`${slice.value.toFixed(1)} kWh/year mean per TV<br>` +
						`${d3.format(".1%")(share)}`
					);
				})
				.on("pointermove", (event) => tooltip
					.style("left", `${event.pageX + 12}px`)
					.style("top", `${event.pageY + 12}px`))
				.on("pointerleave", () => tooltip.style("opacity", 0));

			// The legend uses the same stable technology colors as the bar chart.
			const legend = svg.append("g")
				.attr("transform", `translate(${chartWidth + 8},${Math.max(22, height / 2 - data.length * 14)})`);
			const items = legend.selectAll("g")
				.data(data)
				.join("g")
				.attr("transform", (row, index) => `translate(0,${index * 28})`);
			items.append("circle")
				.attr("r", 5)
				.attr("cx", 5)
				.attr("fill", (row) => colorForTechnology(row.technology));
			items.append("text")
				.attr("x", 15)
				.attr("y", 4)
				.attr("font-size", 12)
				.attr("fill", "currentColor")
				.text((row) => row.technology);
		}

		draw();
		// Rebuild the chart when its container changes size.
		window.addEventListener("resize", draw);
	}).catch((error) => {
		// Show a readable message if the CSV cannot be loaded.
		console.error("Could not load donut-chart data:", error);
		container.text("Unable to load TV energy data.");
	});
})();
