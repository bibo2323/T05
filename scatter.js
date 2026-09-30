// Chart 1: TV energy consumption (y) against energy star rating (x).
(() => {
	// Select the HTML element where this chart will be drawn.
	const container = d3.select("#scatter");
	// Margins reserve room for the axes and their labels.
	const margin = { top: 18, right: 20, bottom: 58, left: 68 };
	// A floating tooltip shows the detailed record when a point is hovered.
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

	// Read the two requested numeric columns from the real TV dataset.
	d3.csv("data/Ex5_TV_energy.csv", (row) => ({
		brand: row.brand,
		technology: row.screen_tech,
		screenSize: +row.screensize,
		energy: +row.energy_consumpt,
		starRating: +row.star2,
		count: +row.count
	})).then((rows) => {
		// Skip rows with missing or non-numeric values needed by the axes.
		const data = rows.filter((row) =>
			Number.isFinite(row.energy) && Number.isFinite(row.starRating)
		);

		// Draw the plot at the container's current width.
		function draw() {
			container.selectAll("*").remove();
			const width = container.node().clientWidth;
			if (!width) return;

			const height = Math.max(270, Math.min(360, width * 0.62));
			const innerWidth = width - margin.left - margin.right;
			const innerHeight = height - margin.top - margin.bottom;
			// viewBox lets the SVG scale to the available container width.
			const svg = container.append("svg")
				.attr("viewBox", `0 0 ${width} ${height}`)
				.attr("role", "img")
				.attr("aria-label", "Energy consumption by energy star rating");
			// Scales translate CSV values into positions inside the plotting area.
			const x = d3.scaleLinear()
				.domain(d3.extent(data, (row) => row.starRating)).nice()
				.range([0, innerWidth]);
			const y = d3.scaleLinear()
				.domain([0, d3.max(data, (row) => row.energy)]).nice()
				.range([innerHeight, 0]);
			const plot = svg.append("g")
				.attr("transform", `translate(${margin.left},${margin.top})`);

			// Axes show the numeric values represented by each position.
			plot.append("g")
				.attr("transform", `translate(0,${innerHeight})`)
				.call(d3.axisBottom(x).ticks(Math.max(3, Math.floor(innerWidth / 70))));
			plot.append("g").call(d3.axisLeft(y));
			plot.append("text")
				.attr("x", innerWidth / 2)
				.attr("y", innerHeight + 44)
				.attr("text-anchor", "middle")
				.attr("fill", "currentColor")
				.text("Star rating (stars)");
			plot.append("text")
				.attr("transform", "rotate(-90)")
				.attr("x", -innerHeight / 2)
				.attr("y", -48)
				.attr("text-anchor", "middle")
				.attr("fill", "currentColor")
				.text("Energy consumption (kWh/year)");

			// Slight transparency helps reveal points that overlap.
			plot.selectAll("circle")
				.data(data)
				.join("circle")
				.attr("cx", (row) => x(row.starRating))
				.attr("cy", (row) => y(row.energy))
				.attr("r", (row) => row.count > 1 ? 4 : 3)
				.attr("fill", d3.schemeTableau10[0])
				.attr("fill-opacity", 0.62)
				.on("pointerenter", (event, row) => {
					tooltip.style("opacity", 1).html(
						`<strong>${row.brand}</strong><br>${row.technology}, ${row.screenSize} in<br>` +
						`${row.energy.toLocaleString()} kWh/year; rating ${row.starRating}<br>` +
						`Model count: ${row.count}`
					);
				})
				.on("pointermove", (event) => tooltip
					.style("left", `${event.pageX + 12}px`)
					.style("top", `${event.pageY + 12}px`))
				.on("pointerleave", () => tooltip.style("opacity", 0));
		}

		draw();
		// Recalculate the chart when the browser or layout width changes.
		window.addEventListener("resize", draw);
	}).catch((error) => {
		// Report loading problems in the console and inside the chart area.
		console.error("Could not load scatter-plot data:", error);
		container.text("Unable to load TV energy data.");
	});
})();
