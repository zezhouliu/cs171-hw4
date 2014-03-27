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

    height = 1300 - margin.bottom - margin.top;

    bbVis = {
        x: 0 + 100,
        y: 10,
        w: width - 100,
        h: 200
    };

    // container for the std dev
    bbSTDDev = {
        x: 0,
        y: bbVis.y + 100,
        w: width,
        h: 500
    };

    // container for the std dev
    bbSTDDevAve = {
        x: 0,
        y: bbSTDDev.y + bbSTDDev.h,
        w: width,
        h: 1000
    };

    dataSet = [];

    svg = d3.select("#vis").append("svg").attr({
        width: width + margin.left + margin.right,
        height: height + margin.top + margin.bottom
    }).append("g").attr({
            transform: "translate(" + margin.left + "," + margin.top + ")"
    });

    // Set up the area for the detailed graph, also make sure its clipped
    svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);


    var color = d3.scale.category10();

    d3.csv("timeline.csv", function(data) {

        // convert your csv data and add it to dataSet
        return createVis(data);
    });

    var std_dev = function (arr) {

        // std_dev = 0 if only one element
        if (arr.length == 1) {
            return 0;
        }

        // sum
        var sum = 0;
        arr.forEach(function (d, i) {
            sum += d;
        });

        // ave
        var ave = sum / arr.length;

        // variance
        var variance = 0;
        arr.forEach(function (d, i) {
            variance += Math.pow(d - ave, 2);
        });

        variance = variance / (arr.length - 1);

        // std dev
        return Math.sqrt(variance);

    };

    createVis = function (data) {

        var convertToInt = function (s) {
            return parseInt(s.replace(/,/g, ""), 10);
        };

        color.domain(d3.keys(data[0]).filter(function (key) { return key !== "year"; }));

        var stats = new Object;
        stats.ave = [];
        stats.years = [];
        stats.numbers = [];
        stats.count = [];
        stats.sum = [];
        stats.stddev = [];
        stats.stddevave = [];

        // grab elements_array
        data.forEach(function (d, i) {
            stats.years.push(d.year);
            stats.numbers.push([]);
            stats.count.push(0);
            stats.sum.push(0);
            stats.stddev.push(0);
            stats.stddevave.push(0);
        });

        var estimates = color.domain().map(function (name) {
            return {
                name: name,
                values: data.map(function (d) {
                    return { year: d.year, value: +d[name], estimated:0};
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

                if (d1.year < year_extent[1] && d1.year > year_extent[0] && d1.value  == 0) {
                    d1.value = interpolate(d1.year);
                }

                d.values = d.values.filter(function (d1, i1) {
                    return d1.value != 0;
                });

            });

        });
        
        // get the data values for each year
        estimates.forEach(function (d, i) {

            // get each of the values
            d.values.forEach(function (d1, i1) {
                var index = stats.years.indexOf(d.years[i1]);
                stats.numbers[index].push(d1.value);
                ++stats.count[index];

            });
        });

        // calculate the averages and std_dev
        stats.numbers.forEach(function (d, i) {

            // sum up all stats together
            d.forEach(function (d1, i1) {
                stats.sum[i] += d1;
            });

            // calculate average of the stats
            stats.ave[i] = stats.sum[i] / stats.count[i];

            // calculate std dev
            stats.stddev[i] = std_dev(d);

            stats.stddevave[i] = stats.stddev[i] / stats.ave[i];
        });

        var xAxis, xScale, yAxis, yScale, ySTDScale, ySTDAxis;

        // define the scale and axis for x
        xScale = d3.scale.linear().domain(d3.extent(data, function (d, i) { return d.year; })).range([0, bbVis.w]);
        xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(5);

        // define the scale and axis for x
        xSTDScale = d3.scale.linear().domain(d3.extent(data, function (d, i) { return d.year; })).range([0, bbVis.w]);
        xSTDAxis = d3.svg.axis().scale(xSTDScale).orient("bottom").ticks(5);

        // define the scale and axis for x
        xSTDAveScale = d3.scale.linear().domain(d3.extent(data, function (d, i) { return d.year; })).range([0, bbVis.w]);
        xSTDAveAxis = d3.svg.axis().scale(xSTDScale).orient("bottom").ticks(5);

        var min_value = 0;
        var max_value = d3.max(estimates, function (c) { return d3.max(c.values, function (v) { return v.value; }); });

        // define the scale and axis for y
        yScale = d3.scale.linear().domain([max_value, min_value]).range([0, bbVis.h]);
        yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(7);

        // define the scale and axis for std dev
        ySTDScale = d3.scale.linear().domain(d3.extent(stats.stddev)).range([bbSTDDev.h, bbSTDDev.y]);
        ySTDAxis = d3.svg.axis().scale(ySTDScale).orient("left").ticks(7);

        // define the scale and axis for std dev
        ySTDAveScale = d3.scale.linear().domain(d3.extent(stats.stddevave)).range([bbSTDDevAve.h, bbSTDDevAve.y]);
        ySTDAveAxis = d3.svg.axis().scale(ySTDAveScale).orient("left").ticks(7);


        // Add the X Axis
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + bbVis.h + ")")
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

        point.selectAll(".circle .data")
            .data(function (d) { return d.values; })
            .enter()
            .append("circle")
            .attr("class", "circle data")
            .attr("cx", function (d) { return xScale(d.year); })
            .attr("cy", function (d) { return yScale(d.value); })
            .attr("r", 2)
            .attr("fill", function (d) { return color(this.parentNode.__data__.name); })
            .attr("stroke", function (d) { return color(this.parentNode.__data__.name);});


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

        var std = svg.append("g")
            .attr("class", "std-point");

        std.selectAll(".circle.std")
            .data(stats.stddev)
            .enter()
            .append("circle")
            .attr("class", "circle std")
            .attr("cx", function (d) { return xScale(stats.years[stats.stddev.indexOf(d)]); })
            .attr("cy", function (d, i) { return ySTDScale(d); })
            .attr("year", 1994)
            .attr("r", 2)
            .attr("fill", "black")
            .attr("stroke", "steelblue");

        var std = svg.append("g")
            .attr("class", "std-p");

        std.selectAll(".circle.ave")
            .data(stats.stddevave)
            .enter()
            .append("circle")
            .attr("class", "circle ave")
            .attr("cx", function (d) { console.log(d); return xScale(stats.years[stats.stddevave.indexOf(d)]); })
            .attr("cy", function (d, i) { return ySTDAveScale(d); })
            .attr("year", 1994)
            .attr("r", 2)
            .attr("fill", "black")
            .attr("stroke", "steelblue");

        // STD Deviation Graph
        // Add the X Axis for STD Dev
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + bbSTDDev.h + ")")
            .call(xSTDAxis);
        // Add the Y Axis
        svg.append("g")
            .attr("class", "y axis")
            .call(ySTDAxis);

        // STD Deviation Graph
        // Add the X Axis for STD Dev
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + bbSTDDevAve.h + ")")
            .call(xSTDAveAxis);
        // Add the Y Axis
        svg.append("g")
            .attr("class", "y axis")
            .call(ySTDAveAxis);


        // function when brushed is selected
        var brushed = function (d, i) {
            xSTDScale.domain(brush.empty() ? xScale.domain() : brush.extent());
            std.selectAll(".circle.std").attr("cx", function (d1) { return xSTDScale(stats.years[stats.stddev.indexOf(d1)]); })
                .attr("cy", function (d1) { return ySTDScale(d1); });
            svg.select(".x.detailed.axis").call(xSTDAxis);
        };

        brush = d3.svg.brush().x(xScale).on("brush", brushed);

        svg.append("g").attr("class", "brush").call(brush)
          .selectAll("rect").attr({
              y: -10,
              height: bbVis.h - bbVis.y + 10,
              transform: "translate(0," + bbVis.y + ")"
          });


    };
