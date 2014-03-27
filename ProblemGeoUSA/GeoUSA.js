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

var detailVis = d3.select("#detailVis").append("svg").attr({
    width:350,
    height:200
})

var canvas = d3.select("#vis").append("svg").attr({
    width: width + margin.left + margin.right,
    height: height + margin.top + margin.bottom
    })

var svg = canvas.append("g").attr({
        transform: "translate(" + 0 + "," + 0 + ")"
});

var detailSVG = detailVis.append("g").attr({
    transform: "translate(" + 100 + "," + 100 + ")"
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



function loadStations(completeData) {
    d3.csv("../data/NSRDB_StationsMeta.csv",function(error,data){

        // first, filter the data for the null-projection values
        var filtered_data = data.filter(function (d, i) {
            return projection([parseInt(d["ISH_LON(dd)"]), parseInt(d["ISH_LAT (dd)"])]);
        });

        // we must create scale for the total sums
        var total_sums = {};

        // this gets each station_id
        for (var key in completeData) {
            
            if (!(key in total_sums)) {
                total_sums[key] = 0;
            }

            total_sums[key] += completeData[key]["sum"];
            
        }

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

        // create scale for radius
        var radius_scale = d3.scale.linear().domain([min_sum, max_sum]).range([2, 3.5]);

        filtered_data.forEach(function (d, i) {

            var station_id = d["USAF"];
            var station_name = d["STATION"];

            // grab the total sum
            var sum = total_sums[station_id];

            var c = svg.append("circle")
            .attr("class", function (d, i) {
                if (sum) {
                    return "station hasData";
                }
                else {
                    return "station";
                }
            })
            .attr("cx", projection([d["ISH_LON(dd)"], d["ISH_LAT (dd)"]])[0])
            .attr("cy", projection([d["ISH_LON(dd)"], d["ISH_LAT (dd)"]])[1])
            .attr("r", function (d, i) {
                if (!sum) {
                    return radius_scale(0);
                } else {
                    return radius_scale(sum);
                }
            })
            .on("mouseover", function (d, i) {

                // if it has a data, then display the data, else just display the name
                if (sum) {
                    tooltip.html("<b>" + station_name + " (" + station_id + ")</b><br>Value: " + sum);
                }
                else {
                    tooltip.html("<b>" + station_name + " (" + station_id + ")</b>");
                }
                return tooltip.style("visibility", "visible");

            })
	        .on("mousemove", function (d) { return tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px"); })
	        .on("mouseout", function (d) { return tooltip.style("visibility", "hidden"); })
            .on("click", function (d1) {
                updateDetailVis(completeData[station_id], station_name);
            });
        });
        
    });

    createDetailVis();
}


function loadStats() {

    d3.json("../data/reducedMonthStationHour2003_2004.json", function (error, data) {
        completeDataSet = data;
		
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

    xScale = d3.scale.linear().domain([1, 11]).range([0, 200]);
    xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(10);

    // define the scale and axis for y
    yScale = d3.scale.linear().domain([0, 10]).range([0, 350]);
    yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(5);

    // Add the X Axis for Overview
    detailVis.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + 100 + ")")
        .call(xAxis);

    // Add the Y Axis for the Overview
    detailVis.selectAll("g")
        .append("g")
        .attr("class", "y axis")
        .call(yAxis);

}


var updateDetailVis = function (data, name) {
    
    // if we have data, update the DetailVis
    if (data) {

        // calculate min and max years for the scales and axis
        var min_val = 99999999999;
        var max_val = 0;

        for (key in data["hourly"]) {
            if (data["hourly"][key] < min_val) {
                min_val = data["hourly"][key];
            }
            if (data["hourly"][key] > max_val) {
                max_val = data["hourly"][key];
            }
        }
        console.log(min_val + ", " + max_val);

        //// define the scale and axis for x
        //xScale = d3.time.scale().domain([1, 11]).range([0, 200]);
        xScale = d3.scale.linear().domain([1, 11]).range([0, 200]);
        xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(10);

        // define the scale and axis for y
        yScale = d3.scale.linear().domain([min_val, max_val]).range([0, 350]);
        yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(5);

        // Add the X Axis for Overview
        detailVis.selectAll(".x")
            .call(xAxis);

        // Add the Y Axis for the Overview
        detailVis.selectAll(".y")
            .call(yAxis);
    }
    else {

        // else, we should just clear the graph
        console.log("lol");
        return;
    }

    

}



// ZOOMING
function zoomToBB() {


}

function resetZoom() {
    
}

