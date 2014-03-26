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


var projection = d3.geo.albersUsa().translate([width / 2, height / 2]);//.precision(.1);
var path = d3.geo.path().projection(projection);

svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    .on("click", clicked);

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

        console.log(completeData);

        // we must create scale for the total sums
        var total_sums = {};
        // this gets each month
        for (var key in completeData) {
            
            // this gets each station id
            for (var station in completeData[key]) {

                if (!(station in total_sums)) {
                    total_sums[station] = 0;
                }

                total_sums[station] += completeData[key][station]["sum"];
            }
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
        var radius_scale = d3.scale.linear().domain([min_sum, max_sum]).range([1.5, 3.5]);

        filtered_data.forEach (function (d, i) {

            var station_id = d["USAF"];

            // calculate the total sum
            var total_sum = 0;

            for (var key in completeData) {

                if (completeData[key][station_id]) {
                    total_sum += completeData[key][station_id]["sum"];
                }
            }

            //var c = svg.append("circle")
            //.attr("class", "station-circle")
            //.attr("cx", projection([d["ISH_LON(dd)"], d["ISH_LAT (dd)"]])[0])
            //.attr("cy", projection([d["ISH_LON(dd)"], d["ISH_LAT (dd)"]])[1])
            //.attr("r", radius_scale(total_sum))
            //.attr("fill", function (d, i) {

            //    if (total_sum > 0) {
            //        return "#34DDDD";
            //    }
            //    else {
            //        return "gray";
            //    }
            //})
            //.on("mouseover", function (d, i) {
            //    console.log(d);
            //    console.log(i);
            //    return tooltip.style("visibility", "visible");

            //})
	        //.on("mousemove", function (d) { return tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px"); })
	        //.on("mouseout", function (d) { return tooltip.style("visibility", "hidden"); });

            //c.data(d);
        });

        svg.selectAll("circle")
        .data(completeData)
        .enter()
        .append("circle")
        .attr("cy", 90)
        .attr("cx", String)
        .attr("r", Math.sqrt);
        
    });
}


function loadStats() {

    d3.json("../data/reducedMonthStationHour2003_2004.json", function (error, data) {
        completeDataSet = data;
		
        loadStations(data);
    })

}


d3.json("../data/us-named.json", function(error, data) {

    var usMap = topojson.feature(data,data.objects.states).features
    //console.log(usMap);

    svg.selectAll(".country")
        .data(usMap)
        .enter()
        .append("path")
        .attr("class", "map")
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
var createDetailVis = function(){

}


var updateDetailVis = function(data, name){
  
}



// ZOOMING
function zoomToBB() {


}

function resetZoom() {
    
}


