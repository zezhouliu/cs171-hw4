### HW 2 Answers  

1.  Look at the data given in the Wiki table. Describe the data types. What is different from the datasets you've used before?  
  The data types for this data set are most large integers and a few ranges of integers (low - high).  This is different from previous datasets because previous we had consistent data types for the entire data set, as in everything of the same category was the same type.  However, this time, we see that we have both integer values as well as integer ranges.

2.  Take a look at the DOM tree for the Wikipedia table. Formulate in jQuery selector syntax the selection that would give you the DOM element for the second row in the Wikipedia table. Write down in selection syntax how you would get all table rows that are not the header row.  
  To get row 2: $('.wikitable tr').eq(2)  
  To get every row except header row, we can do: $('.wikitable tr').not('tr:first')
