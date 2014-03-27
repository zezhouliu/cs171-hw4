## Design Studio  

==================

Implemented in differenceGraph.js

One of the designs (the one I implemented) was to show the standard deviation in as an additional graph.  I calculated the standard deviations for each valid year using the estimated data and the interpolations.  Then, I plotted this other data using another scatter plot.  I used the same technique as in problem 3 to create brushes so that you can zoom into the data to see what is going on.  I also plotted the standard deviation proportionate to the average to show relative terms.

The other design that I chose (but didn't implement) was to do bar-graphs.  For each year, it would show groups of bar-graphs that represented the number of standard deviations from average for each source.  For example, for the year 1950, there would be 5 bars side-by-side that each showed the number of standard deviations each of them were from the average.  I ended up not choosing this option because it would be too cluttered, and that the first option gives a better way to see both the larger picture (since there aren't too many bars cluttered together), as well as see the closer picture by using the brush and zooming in.

See uploaded images for sample designs.  

==================

Implementation details:
  - Additional Graph: scatter plot to show absolute difference using the standard deviation in each year  
  - Additional Graph: scatter plot showing the relative terms by taking the ratio of std dev / average.  
  - Brush to zoom in to specific areas.  
  
