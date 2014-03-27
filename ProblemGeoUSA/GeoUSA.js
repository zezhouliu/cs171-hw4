 /**
 * Created by hen on 3/8/14.
 */

var margin = {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50
};

var centered;

var width = 1060 - margin.left - margin.right;
var height = 800 - margin.bottom - margin.top;

var bbVis = {
    x: 100,
    y: 10,
    w: width - 100,
    h: 300
};

var bbDetail = {
    
    x: 100,
    y: 10,
    w: 450,
    h: 300
}

var detailVis = d3.select("#detailVis").append("svg").attr({
    width:550,
    height:400
})

var canvas = d3.select("#vis").append("svg").attr({
    width: width + margin.left + margin.right,
    height: height + margin.top + margin.bottom
    })

var svg = canvas.append("g").attr({
        transform: "translate(" + 0 + "," + 0 + ")"
});

var detailSVG = detailVis.append("g").attr({
    transform: "translate(" + 0 + "," + 0 + ")"
});

var projection = d3.geo.albersUsa().translate([width / 2, height / 2]);//.precision(.1);
var path = d3.geo.path().projection(projection);

svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    .on("click", clicked);

var g = svg.append("g");

//// store the detail axis/scales
var xAxis, xScale, yAxis, yScale;
var completeData = {};
var hourly_aggregate = {};

function clicked(d) {

    var x, y, k;

    if (d && centered !== d) {
        var centroid = path.centroid(d);
        x = centroid[0];
        y = centroid[1];
        k = 4;
        centered = d;
    } else {
        x = width / 2;
        y = height / 2;
        k = 1;
        centered = null;
    }

    svg.selectAll("path")
        .classed("active", centered && function (d) { return d === centered; });

    svg.transition()
        .duration(750)
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
        .style("stroke-width", 1.5 / k + "px");
}

var dataSet = {};

function loadStations(c) {
    d3.csv("../data/NSRDB_StationsMeta.csv",function(error,data){

        console.log(data);

        // first, filter the data for the null-projection values
        var filtered_data = data.filter(function (d, i) {
            return projection([parseInt(d["ISH_LON(dd)"]), parseInt(d["ISH_LAT (dd)"])]);
        });

        console.log(completeData);

        // we must create scale for the total sums
        var total_sums = {};

        // this gets each month
        for (var key in completeData) {
            
            // get each station_id
            for (var station in completeData[key]) {
                // store station in total_sums
                if (!(station in total_sums)) {
                    total_sums[station] = 0;
                }

                total_sums[station] += completeData[key][station]["sum"];
            }
            
        }

        // get max and min sums
        var max_sum = 0;
        var min_sum = 99999999999;
        for (var station_id in total_sums) {
            if (total_sums[station_id] > max_sum) {
                max_sum = total_sums[station_id];
            }
            if (total_sums[station_id] < min_sum) {
                min_sum = total_sums[station_id];
            }
        }

        // aggregate hourly data by station
        for (var month in completeData) {

            // grab each station
            for (var id in completeData[month]) {

                // push station id into hourly aggregate if DNE
                if (!(id in hourly_aggregate)) {
                    hourly_aggregate[id] = [];
                }

                // sum up hourly data
                for (var hr in completeData[month][id]["hourly"]) {

                    var int_hr = parseInt(hr);

                    if (!hourly_aggregate[id][int_hr]) {
                        hourly_aggregate[id][int_hr] = 0;
                    }

                    // include the value
                    hourly_aggregate[id][hr] += completeData[month][id]["hourly"][hr];
                }
            }
        }

        // create scale for radius
        var radius_scale = d3.scale.linear().domain([min_sum, max_sum]).range([2, 3.5]);

        svg.selectAll("circle")
        .data(filtered_data)
        .enter()
        .append("circle")
        .attr("class", function (d, i) {
            var station_id = d["USAF"];
            if (total_sums[station_id]) {
                return "station hasData";
            }
            else {
                return "station";
            }
        })
        .attr("transform", function (d, i) {
            return "translate(" + projection([d["ISH_LON(dd)"], d["ISH_LAT (dd)"]]) + ")";
        })
        .attr("r", function (d, i) {
            var station_id = d["USAF"];
            if (!total_sums[station_id]) {
                return radius_scale(0);
            } else {
                return radius_scale(total_sums[station_id]);
            }
        })
        .on("mouseover", function (d, i) {

            // if it has a data, then display the data, else just display the name
            if (total_sums[d["USAF"]]) {
                tooltip.html("<b>" + d["STATION"] + " (" + d["USAF"] + ")</b><br>Value: " + total_sums[d["USAF"]]);
            }
            else {
                tooltip.html("<b>" + d["STATION"] + " (" + d["USAF"] + ")</b>");
            }
            return tooltip.style("visibility", "visible");

        })
        .on("mousemove", function (d) { return tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px"); })
        .on("mouseout", function (d) { return tooltip.style("visibility", "hidden"); })
        .on("click", function (d) {
            updateDetailVis(d, d["USAF"]);
        });
        
    });

    createDetailVis();
}


function loadStats() {

    d3.json("../data/reducedMonthStationHour2003_2004_byMonth.json", function (error, data) {
        completeData = data;
        console.log(data);
		
        loadStations(data);
    })

}


d3.json("../data/us-named.json", function(error, data) {

    var usMap = topojson.feature(data,data.objects.states).features

    g.selectAll(".country")
        .data(usMap)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", path)
        .on("click", clicked);

    // see also: http://bl.ocks.org/mbostock/4122298

    loadStats();

    
});

var tooltip = d3.select("body")
	.append("div")
    .attr("class", "tooltip")
	.style("position", "absolute")
	.style("z-index", "10")
	.style("visibility", "hidden");


// ALL THESE FUNCTIONS are just a RECOMMENDATION !!!!
var createDetailVis = function () {

    xScale = d3.scale.linear().domain([0, 23]).range([bbDetail.x, bbDetail.w]);
    xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(6);

    // define the scale and axis for y
    yScale = d3.scale.linear().domain([0, 10]).range([bbDetail.y, bbDetail.h]);
    yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(5);

    // Add the X Axis for Overview
    detailVis.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + bbDetail.h + ")")
        //.style("visibility", "hidden")
        .call(xAxis);

    // Add the Y Axis for the Overview
    detailVis.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + bbDetail.x + ",0)")
        //.style("visibility", "hidden")
        .call(yAxis);

}


var updateDetailVis = function (data, station_id) {
    
    if (!hourly_aggregate[station_id]) {
        // Make invisible Y Axis for the Overview
        detailVis.selectAll(".y")
            .style("visibility", "hidden")
            .call(yAxis);
    }
    else {
        console.log(station_id);

        // grab the hourly data for our station_id
        console.log(hourly_aggregate[station_id]);

        var min_val = 99999999999;
        var max_val = 0;

        for (key in hourly_aggregate[station_id]) {
            if (hourly_aggregate[station_id][key] < min_val) {
                min_val = hourly_aggregate[station_id][key];
            }
            if (hourly_aggregate[station_id][key] > max_val) {
                max_val = hourly_aggregate[station_id][key];
            }
        }

        console.log("(" + min_val + "," + max_val + ")");
        yScale.domain([max_val, min_val]);

        // Add the Y Axis for the Overview
        detailVis.selectAll(".y")
            .style("visibility", "visible")
            .call(yAxis);

        var bars = detailVis.selectAll("rect").remove(); 

        bars = detailVis.selectAll("rect")
            .data(hourly_aggregate[station_id])
            .enter()
            .append("rect")
            .attr("x", function (d, i) {
                return ((bbDetail.w - bbDetail.x) / 24) * i + bbDetail.x;
            })
            .attr("y", function (d) { return yScale(d); })
            .attr("width", function (d) { return (bbDetail.w - bbDetail.x) / 24; })
            .attr("height", function (d) { return bbDetail.h - yScale(d); })
            .attr("stroke", "steelblue")
            .attr("fill", function (d) { return "black" });
    }
    

    

}



// ZOOMING
function zoomToBB() {


}

function resetZoom() {
    
}

