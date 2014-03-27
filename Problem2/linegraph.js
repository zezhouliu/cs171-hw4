/**
 * Created by hen on 2/20/14.
 */
var bbVis, brush, createVis, dataSet, handle, height, margin, svg, svg2, width;

margin = {
    top: 50,
    right: 50,
    bottom: 50,
    left: 150
};

width = 960 - margin.left - margin.right;

height = 300 - margin.bottom - margin.top;

bbVis = {
    x: 0 + 100,
    y: 10,
    w: width - 100,
    h: 100
};

dataSet = [];

svg = d3.select("#vis").append("svg").attr({
    width: width + margin.left + margin.right,
    height: height + margin.top + margin.bottom
}).append("g").attr({
    transform: "translate(" + margin.left + "," + margin.top + ")"
});

var color = d3.scale.category10();

d3.csv("timeline.csv", function (data) {

    // convert your csv data and add it to dataSet
    return createVis(data);
});

createVis = function (data) {

    var convertToInt = function (s) {
        return parseInt(s.replace(/,/g, ""), 10);
    };

    color.domain(d3.keys(data[0]).filter(function (key) { return key !== "year"; }));

    var estimates = color.domain().map(function (name) {
        return {
            name: name,
            values: data.map(function (d) {
                return { year: d.year, value: +d[name], estimated: 0 };
            })
        };
    });

    estimates.forEach(function (d, i) {

        d.years = [];
        d.estimate = [];

        d.values.map(function (d1, i1) {
            if (d1.value) {
                d.years.push(d1.year);
                d.estimate.push(d1.value);
            }
        });

        var year_extent = d3.extent(d.years);
        var interpolate = d3.scale.linear().domain(year_extent).range(d.estimate);

        d.values.forEach(function (d1, i1) {

            if (d1.year < year_extent[1] && d1.year > year_extent[0] && d1.value == 0) {
                d1.value = interpolate(d1.year);
            }

            d.values = d.values.filter(function (d1, i1) {
                return d1.value != 0;
            });

        });

    });

    var xAxis, xScale, yAxis, yScale;

    // define the scale and axis for x
    xScale = d3.scale.linear().domain(d3.extent(data, function (d, i) { return d.year; })).range([0, bbVis.w]);
    xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(5);

    var min_value = 0;
    var max_value = d3.max(estimates, function (c) { return d3.max(c.values, function (v) { return v.value; }); });

    // define the scale and axis for y
    yScale = d3.scale.linear().domain([max_value, min_value]).range([0, height]);
    yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(7);


    // Add the X Axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Add the Y Axis
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    var line = d3.svg.line()
        .interpolate("basis")
        .x(function (d) { return xScale(d.year); })
        .y(function (d) { return yScale(d.value); });

    var estimate = svg.selectAll(".estimate")
        .data(estimates)
        .enter()
        .append("g")
        .attr("class", "estimate");

    estimate.append("path")
        .attr("class", "line")
        .attr("d", function (d) { return line(d.values); })
        .style("stroke", function (d) { return color(d.name); });

    var point = estimate.append("g")
        .attr("class", "line-point");

    point.selectAll("circle")
        .data(function (d) { return d.values; })
        .enter()
        .append("svg:circle")
        .attr("cx", function (d) { return xScale(d.year); })
        .attr("cy", function (d) { return yScale(d.value); })
        .attr("year", function (d) { return d.year; })
        .attr("r", 2)
        .attr("fill", function (d) { return color(this.parentNode.__data__.name); })
        .attr("stroke", function (d) { return color(this.parentNode.__data__.name); });


    var legend = svg.selectAll(".legend")
        .data(color.domain())
        .enter().append("g")
        .attr("class", "legend")
       .attr("transform", function (d, i) { return "translate(0," + i * 20 + ")"; });

    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .attr("font-size", "10px")
        .style("text-anchor", "end")
        .text(function (d) { return d; });

    var std_dev = function (d, i) {

    }


};
