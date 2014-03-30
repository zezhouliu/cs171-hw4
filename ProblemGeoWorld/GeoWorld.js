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
var selected_year = 1985; // default
var selected_country;
var selected_indicator;
var centered;
var current_data;
var country_hash = {};
var yearly_data;
var total_data;

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
  .domain([0, 8])
  .range(["#DB7093", "#45232e"]);

var actualProjectionMethod = 0;
var colorMin = colorbrewer.Greens[3][0];
var colorMax = colorbrewer.Greens[3][2];

var path = d3.geo.path().projection(projectionMethods[0].method);

var tooltip = d3.select("body")
	.append("div")
    .attr("id", "tooltip")
	.style("position", "absolute")
	.style("z-index", "10")
    .style("background", "white")
    .style("padding", "5px")
    .style("border-radius", "8px")
	.style("visibility", "hidden");

// make request per indicator string, and we can parse out ourselves for the years
function runAQueryOn(indicatorString) {
    $.ajax({
        url: "http://api.worldbank.org/countries/all/indicators/" + indicatorString + "?format=jsonP&prefix=Getdata&per_page=500", //do something here
        async: false,
        jsonpCallback: 'getdata',
        dataType:'jsonp',
        success: function (data, status) {

            // check status, then update data if status == success 200
            if (status == "success") {
                current_data = data[1].filter(function (d, i) {
                    return d.value
                });

                // update the available dates here
                loadavailabledates();
            }
            
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

var showDetails = function (d) {
    // work with the d.id
    for (var i in yearly_data) {
        if (country_hash[d.id] == yearly_data[i].country.id) {
            d3.select("#textLabel")
            .html("<h3>" + yearly_data[i].country.value + "</h3><br><b>" + selected_indicator.IndicatorName + "(" + selected_indicator.IndicatorCode + ")" + "</b><br>" + yearly_data[i].value);
            return;
        }
    }

    // if there is no data
            d3.select("#textLabel")
            .html("<h3>" + selected_indicator.IndicatorCode + "</h3><br><b>" + selected_indicator.IndicatorName + "(" + selected_indicator.IndicatorCode + ")" + "</b><br> NO DATA AVAILABLE");
            return;

    
};

var initVis = function(error, indicators, world, wbc){

    // create a hash from code3 -> code2
    for (var key in wbc) {
        country_hash[wbc[key].code3] = wbc[key].code2;
    }


    var countries = world.features;

    var country = svg.selectAll(".country")
        .data(world.features)
        .enter()
        .insert("path")
        .attr("class", "country")
        .attr("id", function (d, i) { return d.id; })
        .attr("title", function (d, i) { return d.id; })
        .attr("d", path)
        .attr("fill", "lightgray")
        .on("mouseover", function (d, i) {

            tooltip.html("<b>" + d.id + "</b>");
            return tooltip.style("visibility", "visible");

        })
        .on("mousemove", function (d) { return tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px"); })
        .on("mouseout", function (d) { return tooltip.style("visibility", "hidden"); })
        .on("click", function (d) { showDetails(d); });


    /* TEACHING STAFF:  Play with this, I think it's pretty cool!  I didn't manage to figure out
    how to rescale this timeline after I get a new set of data, but definitely on my to-do :) 
    loadtimeline();
    */

    // load stuff
    loaddropdown(indicators);
    makeRequest();

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

    selected_year = d;

    // Update the data when the year is selected
    // XXX No longer make another request
    transitionToYear(selected_year);
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

    function colorCheck() {
        if (d3.select(this).attr('fill') == 'url(#undefined)') {
            d3.select(this).attr('fill', '#e4e4e4');
        }
    }
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

}

var loaddropdown = function (data) {

    // dropdown for selecting indicator
    var options = '';
    data.forEach(function (d) {
        options += '<option value="' + d.IndicatorCode + '">' + d.IndicatorName + '</option>';
    });

    d3.select("#indicator").html(options)
      .on("change", function () {
          var sel = this.value;
          selected_indicator = data.filter(function (d) { return d.IndicatorCode == sel })[0];

          // Make AJAX request here when selected to get valid ddate
          runAQueryOn(selected_indicator.IndicatorCode);
      });

    selected_indicator = data[0];
    runAQueryOn(selected_indicator.IndicatorCode);
}

var loadyeardropdown = function () {

    // dropdown for selecting indicator
    var options = '';
    timeRange.forEach(function (d) {
        options += '<option value="' + d + '">' + d + '</option>';
    });

    d3.select("#year").html(options)
      .on("change", function () {
          var sel = this.value;
          selected_year = sel;
      });

    selected_year = timeRange[0];
    makeRequest();
}

var loadavailabledates = function () {

    // time range
    var range = d3.extent(current_data, function (d, i) {
        return (d.date);
    });

    timeRange = [];

    // create a valid time-range with range
    for (var i = range[0]; i <= range[1]; ++i) {
        timeRange.push(i);
    }

    loadyeardropdown();
}

var colorcodemap = function () {

    // time range
    var range = d3.extent(current_data, function (d, i) {
        return (d.date);
    });
    
    // if there is no range, or if our selected year is not in the range, then just blank out the map
    if (!range[0] || range[0] > selected_year || range[1] < selected_year) {
        svg.selectAll(".country")
        .attr("fill", function (d, i) {
            return "lightgray";
        });
    }

    // if it exists in the range, we should filter out the specific data we need
    yearly_data = current_data.filter(function (d, i) {
        return (d.date == selected_year);
    });

    // update the scale to map values to data
    color.domain(d3.extent(yearly_data, function (d, i) {
        if (d.value) {
            return parseFloat(d.value);
        }
    }));

    var data_range = d3.extent(yearly_data, function (d, i) {
        if (d.value) {
            return d.value;
        }
    });

    // update the colors
    svg.selectAll(".country")
        .attr("fill", function (d, i) {

            // convert from code3 -> code 2
            var code2 = country_hash[d.id];

            // d.id is the id name
            for (d1 in yearly_data) {

                if (code2 == yearly_data[d1].country.id) {
                    return color(yearly_data[d1].value);
                }
            }

            return "lightgray";
        });

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


var makeRequest = function () {

    $.ajax({
        url: "http://api.worldbank.org/countries/all/indicators/" + selected_indicator.IndicatorCode + "?format=jsonP&prefix=Getdata&per_page=500&date=" + selected_year, //do something here
        async: false,
        jsonpCallback: 'getdata',
        dataType: 'jsonp',
        success: function (data, status) {

            // check status, then update data if status == success 200
            if (status == "success") {

                total_data = data;
                // only use data values that exist
                current_data = data[1].filter(function (d, i) {
                    return d.value
                });

                // update the map here
                colorcodemap();
            }

        }

    });
};

d3.select("body").append("button").text("changePro").on({
    "click": changePro
});

d3.select("#goButton").on({
    "click": makeRequest
});
