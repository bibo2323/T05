// Chart 4: yearly spot power prices by state and the supplied regional average.
(() => {
	// Select the chart's HTML mount point and reserve space for labels and legend.
	const container = d3.select("#line");
	const margin = { top: 18, right: 18, bottom: 88, left: 76 };
	// Each CSV column becomes a named, consistently colored line series.
	const columns = [
		{ key: "Queensland ($ per megawatt hour)", name: "Queensland" },
		{ key: "New South Wales ($ per megawatt hour)", name: "New South Wales" },
		{ key: "Victoria ($ per megawatt hour)", name: "Victoria" },
		{ key: "South Australia ($ per megawatt hour)", name: "South Australia" },
		{ key: "Tasmania ($ per megawatt hour)", name: "Tasmania" },
		{ key: "Snowy ($ per megawatt hour)", name: "Snowy" },
		{ key: "Average Price (notTas-Snowy)", name: "Regional average" }
	].map((series, index) => ({
		...series,
		color: d3.schemeTableau10[index]
	}));
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

	// Blank CSV cells become null so missing observations are drawn as gaps, not zeroes.
	const parsePrice = (value) => value.trim() === "" ? null : +value;
	d3.csv("data/Ex5_ARE_Spot_Prices.csv", (row) => {
		const values = {
			year: +row.Year
		};
		columns.forEach((series) => {
			values[series.key] = parsePrice(row[series.key]);
		});
		return values;
	}).then((rows) => {
		// Keep the requested years and put them in chronological order.
		const data = rows.filter((row) =>
			Number.isFinite(row.year) && row.year >= 1998 && row.year <= 2024
		).sort((a, b) => d3.ascending(a.year, b.year));

		// Draw all price series with shared year and price axes.
		function draw() {
			container.selectAll("*").remove();
			const width = container.node().clientWidth;
			if (!width) return;

			const height = Math.max(330, Math.min(430, width * 0.82));
			const innerWidth = width - margin.left - margin.right;
			const innerHeight = height - margin.top - margin.bottom;
			const maxPrice = d3.max(data, (row) => d3.max(
				columns,
				(series) => row[series.key]
			));
			const svg = container.append("svg")
				.attr("viewBox", `0 0 ${width} ${height}`)
				.attr("role", "img")
				.attr("aria-label", "Annual spot power prices by Australian state from 1998 to 2024");
			// Both axes use numeric scales: years horizontally and prices vertically.
			const x = d3.scaleLinear()
				.domain([1998, 2024])
				.range([0, innerWidth]);
			const y = d3.scaleLinear()
				.domain([0, maxPrice]).nice()
				.range([innerHeight, 0]);
			const plot = svg.append("g")
				.attr("transform", `translate(${margin.left},${margin.top})`);

			plot.append("g")
				.attr("transform", `translate(0,${innerHeight})`)
				.call(d3.axisBottom(x).ticks(6).tickFormat(d3.format("d")).tickSizeOuter(0));
			plot.append("g").call(d3.axisLeft(y).ticks(5));
			plot.append("text")
				.attr("x", innerWidth / 2)
				.attr("y", innerHeight + 42)
				.attr("text-anchor", "middle")
				.attr("fill", "currentColor")
				.text("Year");
			plot.append("text")
				.attr("transform", "rotate(-90)")
				.attr("x", -innerHeight / 2)
				.attr("y", -54)
				.attr("text-anchor", "middle")
				.attr("fill", "currentColor")
				.text("Spot power price ($/MWh)");

			// Each series uses its own color; .defined leaves breaks where values are missing.
			// Draw one line per region; .defined breaks lines across missing values.
			columns.forEach((series) => {
				const line = d3.line()
					.defined((row) => Number.isFinite(row[series.key]))
					.x((row) => x(row.year))
					.y((row) => y(row[series.key]));
				plot.append("path")
					.datum(data)
					.attr("fill", "none")
					.attr("stroke", series.color)
					.attr("stroke-width", 2)
					.attr("d", line);
			});

			// Small points provide exact yearly values on hover without obscuring lines.
			// Make a hoverable point for each available year and series value.
			const points = data.flatMap((row) => columns
				.filter((series) => Number.isFinite(row[series.key]))
				.map((series) => ({
					year: row.year,
					price: row[series.key],
					name: series.name,
					color: series.color
				})));
			plot.selectAll("circle")
				.data(points)
				.join("circle")
				.attr("cx", (point) => x(point.year))
				.attr("cy", (point) => y(point.price))
				.attr("r", 2.5)
				.attr("fill", (point) => point.color)
				.on("pointerenter", (event, point) => tooltip.style("opacity", 1).html(
					`<strong>${point.name}</strong><br>${point.year}: $${point.price.toFixed(2)} per MWh`
				))
				.on("pointermove", (event) => tooltip
					.style("left", `${event.pageX + 12}px`)
					.style("top", `${event.pageY + 12}px`))
				.on("pointerleave", () => tooltip.style("opacity", 0));

			// Two-row legend identifies the series using matching line colors.
			// Use fewer legend columns on narrow screens to avoid cramped labels.
			const legendColumns = width < 500 ? 2 : 4;
			const legendItemWidth = innerWidth / legendColumns;
			const legend = svg.append("g")
				.attr("transform", `translate(${margin.left},${height - 34})`);
			const items = legend.selectAll("g")
				.data(columns)
				.join("g")
				.attr("transform", (series, index) =>
					`translate(${(index % legendColumns) * legendItemWidth},${Math.floor(index / legendColumns) * 20})`
				);
			items.append("line")
				.attr("x1", 0)
				.attr("x2", 16)
				.attr("y1", 0)
				.attr("y2", 0)
				.attr("stroke", (series) => series.color)
				.attr("stroke-width", 2.5);
			items.append("text")
				.attr("x", 21)
				.attr("y", 4)
				.attr("font-size", 11)
				.attr("fill", "currentColor")
				.text((series) => series.name);
		}

		draw();
		// Recalculate chart dimensions when the browser width changes.
		window.addEventListener("resize", draw);
	}).catch((error) => {
		// Display a message if the source CSV cannot be loaded.
		console.error("Could not load spot-price data:", error);
		container.text("Unable to load spot-price data.");
	});
})();
