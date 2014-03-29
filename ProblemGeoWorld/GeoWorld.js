/**
 * Created by hen on 3/8/14.
 * Used several guides and sources as inspiration; some code was adapted in this solution:
 *      http://bost.ocks.org/mike/map/
 *      http://techslides.com/countries-and-capitals-with-d3-and-natural-earth/
 *      http://bl.ocks.org/mbostock/5925375
 *      http://viewer.phildow.net/world-gdp-growth/#
 */

var margin = {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50
};

var width = 980 - margin.left - margin.right;
var height = 700 - margin.bottom - margin.top;

/* Timeline variables for size/axis/etc */
var timeline_margin_x = 40;
var timeline_margin_y = 30;
// only present data from 1960->2010 (easier)
var xScale = d3.scale.linear().domain([1960, 2010]).range([timeline_margin_x, width - timeline_margin_x]);
var xAxis = d3.svg.axis()
			.scale(xScale)
			.orient("bottom");

var tline = d3.svg.line()
    .x(function (d) { return xScale(d); })
    .y(function (d) { return height - timeline_margin_y; });



// create variables
var timeline;
var selected_year = 1985;
var selected_country;
var centered;

var timeRange = [];

var bbVis = {
    x: 100,
    y: 10,
    w: width - 100,
    h: 300
};

var dataSet = {};

var svg = d3.select("#vis").append("svg").attr({
    width: width + margin.left + margin.right,
    height: height + margin.top + margin.bottom
}).append("g").attr({
        transform: "translate(" + margin.left + "," + margin.top + ")"
    });

// --- this is just for fun.. play arround with it iof you like :)
var projectionMethods = [
    {
        name:"mercator",
        method: d3.geo.mercator().translate([width / 2, height / 2])//.precision(.1);
    },{
        name:"equiRect",
        method: d3.geo.equirectangular().translate([width / 2, height / 2])//.precision(.1);
    },{
        name:"stereo",
        method: d3.geo.stereographic().translate([width / 2, height / 2])//.precision(.1);
    }
];
// --- this is just for fun.. play arround with it iof you like :)

// color scale
var color = d3.scale.linear()
  .domain([-8, 0, 8])
  .range(["#de1f2e", "#e4e4e4", "#0ca454"]);

var actualProjectionMethod = 0;
var colorMin = colorbrewer.Greens[3][0];
var colorMax = colorbrewer.Greens[3][2];

var path = d3.geo.path().projection(projectionMethods[0].method);

var tooltip = d3.select("body")
	.append("div")
    .attr("id", "tooltip")
	.style("position", "absolute")
	.style("z-index", "10")
    .style("background", "steelblue")
    .style("padding", "5px")
    .style("border-radius", "8px")
	.style("visibility", "hidden");

function runAQueryOn(indicatorString) {
    $.ajax({
        url: "http://api.worldbank.org/countries/all?format=jsonP&prefix=Getdata&per_page=500&date=2000", //do something here
        jsonpCallback:'getdata',
        dataType:'jsonp',
        success: function (data, status){
           

        }

    });


}

// helper function to remove everything from the map
function clear() {
    d3.selectAll("path").remove();
    d3.selectAll("circle").remove();
    d3.selectAll("text").remove();
    d3.select("#info").html("");
}

var initVis = function(error, indicators, world, wbc){
    console.log(indicators);
    console.log(world);
    console.log(wbc);

    var countries = world.features;

    var country = svg.selectAll(".country")
        .data(world.features)
        .enter()
        .insert("path")
        .attr("class", "country")
        .attr("id", function (d, i) { return d.id; })
        .attr("title", function (d, i) { return d.id; })
        .attr("d", path)
        .attr("fill", "lightsteelblue")
        .on("mouseover", function (d, i) {
            tooltip.html("<b>" + d.id + "</b>");
            return tooltip.style("visibility", "visible");

        })
        .on("mousemove", function (d) { return tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px"); })
        .on("mouseout", function (d) { return tooltip.style("visibility", "hidden"); })

    loadtimeline();

}

function navigatePrevious() {
    if (selected_year - 1 < timeRange[0]) return;
    transitionToYear(--selected_year);
    return false;
}

function navigateNext() {
    if (selected_year + 1 > timeRange[timeRange.length - 1]) return;
    transitionToYear(++selected_year);
    return false;
}

function timeclick(d) {
    transitionToYear(selected_year = d);
    return false;
}

var loadtimeline = function () {

    // create a valid time-range from 1960-2010
    for (var i = 1960; i <= 2010; i++) {
        timeRange.push(i);
    }

    timeline = svg.append('g')
			    .attr('id', 'timeline')
			    .attr('style', 'z-index:99;');

    timeline.append('rect')
            .attr('x', 0)
            .attr('y', height - timeline_margin_y)
            .attr('width', width)
            .attr('height', timeline_margin_y);

    timeline.append('path')
            .attr('d', tline(timeRange));

    var tgs = timeline.selectAll('.year-marker')
            .data(timeRange)
            .enter().append('g')
                .attr('class', 'year-group')
                .attr('id', function (d) { return 'year' + String(d); })
                .on("click", timeclick);

    tgs.append("circle")
            .attr('class', 'year-marker')
            .attr("cx", function (d) { return xScale(d); })
            .attr("cy", function (d) { return height - timeline_margin_y; })
            .attr("r", 4);

    tgs.filter(function (d, i) { return (d % 5); })
            .append('circle')
                .attr('class', 'year-tick')
                .attr("cx", function (d) { return xScale(d); })
                .attr("cy", function (d) { return height - timeline_margin_y; })
                .attr("r", 2);

    timeline.selectAll('.year-tick-label')
            .data(timeRange.filter(function (d) { return !(d % 5) && !(d == 1985); }))
            .enter().append("text")
                .attr('class', 'year-tick-label')
                .attr('text-anchor', 'middle')
                .attr("x", function (d) { return xScale(d); })
                .attr("y", function (d) { return height - timeline_margin_y + 20; })
                .on("click", timeclick)
                .text(function (d) {
                    if (d % 100 == 0) return String(d);
                    return "'" + String(d).slice(2);
                });

    timeline.selectAll(".year-group")
            .on("mouseover", function (d) {
                d3.select(this).select('.year-marker')
                    .transition()
                    .attr("r", 6);
            })
            .on("mouseout", function (d) {
                var r = d3.select(this).classed('selected') ? 6 : 4;
                d3.select(this).select('.year-marker')
                    .transition()
                    .attr("r", r);
            });

    timeline.select('#year' + String(selected_year))
            .classed('selected', true)
            .select('.year-marker')
                .style('fill', '#2e5270')
                .attr('r', 6);

    timeline.append('text')
            .text(String(selected_year))
            .attr('class', 'year-label')
            .attr("text-anchor", "middle")
            .attr('x', width / 2)
            .attr('y', height - 50);

    // would be lovely to know the length of the strings in advance

    timeline.append('a')
            .attr('xlink:href', '#')
            .attr('id', 'previous-year')
            .attr('class', 'year-nav')
            .on('click', navigatePrevious)
            .append('text')
                .attr("text-anchor", "end")
                .text('Previous')
                .attr('x', width / 2 + 5)
                .attr('y', height - 10);

    timeline.append('a')
            .attr('xlink:href', '#')
            .attr('id', 'next-year')
            .attr('class', 'year-nav')
            .on('click', navigateNext)
            .append('text')
                .attr("text-anchor", "start")
                .text('Next')
                .attr('x', width / 2 + 15)
                .attr('y', height - 10);
}

function transitionToYear(y) {
    // delay the map transition to set a starting value for undefined
    // fills. otherwise the pattern is replaced by black first
    // webkit flickers when transitioning from pattern to pattern

    function colorCheck() {
        if (d3.select(this).attr('fill') == 'url(#undefined)') {
            d3.select(this).attr('fill', '#e4e4e4');
        }
    }

    /* Updates go here
    svg.selectAll('.gdp')
        .transition().delay(1).duration(1000)
        .each("start", colorCheck)
        .attr('fill', function (d) { return growthColor(d, y); });
    svg.selectAll('.gdp')
        .select('title')
        .text(function (d) { return growthLabel(d, y); });
    
    */

    timeline.select('.selected')
        .classed('selected', false)
        .select('.year-marker')
            .transition().delay(1).duration(600)
            .style('fill', 'steelBlue')
            .attr('r', 5);
    timeline.select('#year' + String(y))
        .classed('selected', true)
        .transition().delay(1).duration(600)
        .select('.year-marker')
            .style('fill', '#2e5270')
            .attr('r', 7);
    timeline.select('.year-label')
        .transition()
        .duration(600)
        .text(String(selected_year));

    /* Update the info here 
    updateGlobalInfo(y);
    updateCountryInfo(selected_country, y);

    */
}

// very cool queue function to make multiple calls.. 
// see 
queue()
    .defer(d3.csv,"../data/worldBank_indicators.csv")
    .defer(d3.json,"../data/world_data.json")
    .defer(d3.json,"../data/WorldBankCountries.json")
    .await(initVis);




// just for fun 
var textLabel = svg.append("text").text(projectionMethods[actualProjectionMethod].name).attr({
    "transform":"translate(-40,-30)"
})

var changePro = function(){
    actualProjectionMethod = (actualProjectionMethod+1) % (projectionMethods.length);

    textLabel.text(projectionMethods[actualProjectionMethod].name);
    path= d3.geo.path().projection(projectionMethods[actualProjectionMethod].method);
    //svg.selectAll(".country").transition().duration(750).attr("d",path);
};

d3.select("body").append("button").text("changePro").on({
    "click":changePro
})

