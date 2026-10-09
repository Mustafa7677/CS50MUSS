<!-- https://cs50.harvard.edu/sql/psets/0/views/ -->
# 36 Views

![Fine Wind, Clear Morning](https://cs50.harvard.edu/sql/psets/0/views/2.jpeg)  
_Fine Wind, Clear Morning by Katsushika Hokusai_

## Problem to Solve

From 1830 to 1832, the Japanese artist Katsushika Hokusai created [36 woodblock prints](https://en.wikipedia.org/wiki/Thirty-six_Views_of_Mount_Fuji) depicting 36 different views of [Mount Fuji](https://en.wikipedia.org/wiki/Mount_Fuji), a volcano on the [Honshū island](https://en.wikipedia.org/wiki/Honshu) of Japan. Among the series’ most famous works are [_Fine Wind, Clear Morning_](https://en.wikipedia.org/wiki/Fine_Wind,_Clear_Morning) and [_The Great Wave off Kanagawa_](https://en.wikipedia.org/wiki/The_Great_Wave_off_Kanagawa). The prints became so influential that another Japanese artist of the time period—Utagawa Hiroshige—created [his own series of 36 prints](https://en.wikipedia.org/wiki/Thirty-six_Views_of_Mount_Fuji_\(Hiroshige\)), each depicting a new view of Fuji.

In `views.db`, you’ll find details on the 36 prints created, respectively, by Hokusai and Hiroshige. In total, you’ll have data on 72 prints. Prints like these tend to be appreciated for their aesthetics, not their statistics, but computer science now helps create additional _numeric_ insights about artwork. In addition to each print’s title and author, you’ll find some statistics commonly used in [computational image analysis](https://en.wikipedia.org/wiki/Computer_vision): the print’s _average color_ , its _brightness_ , its _contrast_ , and its _entropy_. In the accompanying `.sql` files, write SQL queries to answer questions about this database of 72 prints and the statistics about their composition.

Curious about average color, brightness, contrast, or entropy?

  * _Average color_ is the color created by summing the values for the red, green, and blue channels in each pixel, then dividing each sum by the number of pixels in the image.
  * _Brightness_ is defined as an image’s lightness or darkness, on a scale of 0 to 1. A white image would measure a 1, while a black image would measure a 0.
  * _Contrast_ is defined as the extent to which an image has _differences_ in brightness throughout, on a scale of 0 to 1. Higher contrast (higher differences in brightness) enable objects to stand out. Lower contrast (lower differences in brightness) means objects don’t stand out as much.
  * [_Entropy_](https://en.wikipedia.org/wiki/Entropy_\(information_theory\)) is a measure of an image’s randomness, often used to characterize the complexity of artwork. A 10, for our sake, is pretty high—whereas a 0 is very low.



## Demo

## Distribution Code

For this problem, you’ll need to download `views.db`, along with several `.sql` files in which you’ll write your queries.

Download the distribution code

Log into [cs50.dev](https://cs50.dev/), click on your terminal window, and execute `cd` by itself. You should find that your terminal window’s prompt resembles the below:
    
    
    $
    

Next execute
    
    
    wget https://cdn.cs50.net/sql/2024/x/psets/0/views.zip
    

in order to download a ZIP called `views.zip` into your codespace.

Then execute
    
    
    unzip views.zip
    

to create a folder called `views`. You no longer need the ZIP file, so you can execute
    
    
    rm views.zip
    

and respond with “y” followed by Enter at the prompt to remove the ZIP file you downloaded.

Now type
    
    
    cd views
    

followed by Enter to move yourself into (i.e., open) that directory. Your prompt should now resemble the below.
    
    
    views/ $
    

If all was successful, you should execute
    
    
    ls
    

and see a database named `views.db` alongside several `.sql` files. Executing `sqlite3 views.db` should open the database in `sqlite3`, via which you’ll execute SQL queries. If not, retrace your steps and see if you can determine where you went wrong!

## Schema

In `views.db` you’ll find a single table, `views`. In the `views` table, you’ll find the following columns:

  * `id`, which uniquely identifies each row (print) in the table
  * `print_number`, which identifies the number of the print in either Hokusai’s or Hiroshige’s series
  * `english_title`, which is the English title of the print
  * `japanese_title`, which is the Japanese title of the print
  * `artist`, which is the last name of the print’s artist
  * `average_color`, which is the [hexadecimal representation](https://www.pluralsight.com/blog/tutorials/understanding-hexadecimal-colors-simple) of the color found by averaging the colors of each pixel in the image
  * `brightness`, which is a number corresponding to the overall lightness or darkness of the image
  * `contrast`, which is a number representing the extent of the difference between light and dark areas of the image
  * `entropy`, which is a measure used to quantify the complexity of the artwork



## Specification

For each of the following questions, you should write a single SQL query that outputs the results specified by each problem. Your response must take the form of a single SQL query. You **should not** assume anything about the `id`s of any particular observations: your queries should be accurate even if the `id` of any particular observation were different. Finally, each query should return only the data necessary to answer the question.

  1. In `1.sql`, write a SQL query that a translator might take interest in: list, side by side, the Japanese title and the English title for each print. Ensure the Japanese title is the first column, followed by the English title.
  2. In `2.sql`, write a SQL query to list the average colors of prints by _Hokusai_ that include “river” in the English title. (As an aside, do they have any hint of blue?)
  3. In `3.sql`, write a SQL query to count how many prints by _Hokusai_ include “Fuji” in the English title. Though all of Hokusai’s prints focused on Mt. Fuji, in how many did “Fuji” make it into the title?
  4. In `4.sql`, write a SQL query to count how many prints by _Hiroshige_ have English titles that refer to the “Eastern Capital”. Hiroshige’s prints were created in Japan’s “Edo period,” referencing the eastern capital city of [Edo](https://en.wikipedia.org/wiki/Edo), now Tokyo.
  5. In `5.sql`, write a SQL query to find the highest contrast value of prints by _Hokusai_. Name the column “Maximum Contrast”. Does Hokusai’s prints most contrasting print actually have much contrast?
  6. In `6.sql`, write a SQL query to find the average entropy of prints by _Hiroshige_ , rounded to two decimal places. Call the resulting column “Hiroshige Average Entropy”.
  7. In `7.sql`, write a SQL query to list the English titles of the 5 brightest prints by _Hiroshige_ , from most to least bright. Compare them to this [list on Wikipedia](https://en.wikipedia.org/wiki/Thirty-six_Views_of_Mount_Fuji_\(Hiroshige\)) to see if your results match the print’s aesthetics.
  8. In `8.sql`, write a SQL query to list the English titles of the 5 prints with the least contrast by _Hokusai_ , from least to highest contrast. Compare them to this [list on Wikipedia](https://en.wikipedia.org/wiki/Thirty-six_Views_of_Mount_Fuji) to see if your results match the print’s aesthetics.
  9. In `9.sql`, write a SQL query to find the English title and artist of the print with the highest brightness.
  10. In `10.sql`, write a SQL query to answer a question of your choice about the prints. The query should: 
     * Make use of `AS` to rename a column
     * Involve at least one condition, using `WHERE`
     * Sort by at least one column, using `ORDER BY`



## Usage

To test your queries as you write them in your `.sql` files, you can query the database by running
    
    
    .read FILENAME
    

where `FILENAME` is the name of the file containing your SQL query. For example,
    
    
    .read 1.sql
    

You can also run
    
    
    $ cat FILENAME | sqlite3 views.db > output.txt
    

to redirect the output of the query to a text file called `output.txt`. (This can be useful for checking how many rows are returned by your query!)

## How to Test

While `check50` is available for this problem, you’re encouraged to instead test your code on your own for each of the following. If you’re using the `views.db` database provided in this problem’s distribution, you should find that…

  * Executing `1.sql` results in a table with 2 columns and 72 rows.
  * Executing `2.sql` results in a table with 1 column and 3 rows.
  * Executing `3.sql` results in a table with 1 column and 1 row.
  * Executing `4.sql` results in a table with 1 column and 1 row.
  * Executing `5.sql` results in a table with 1 column and 1 row.
  * Executing `6.sql` results in a table with 1 column and 1 row.
  * Executing `7.sql` results in a table with 1 column and 5 rows.
  * Executing `8.sql` results in a table with 1 column and 5 rows.
  * Executing `9.sql` results in a table with 2 columns and 1 row.



`10.sql` is up to you!

Note that row counts do not include header rows that only show column names.

### Correctness
    
    
    check50 cs50/problems/2024/sql/views
    

## How to Submit

In your terminal, execute the below to submit your work.
    
    
    submit50 cs50/problems/2024/sql/views
    

## Acknowledgements

Images and titles of prints retrieved from [en.wikipedia.org/wiki/Thirty-six_Views_of_Mount_Fuji](https://en.wikipedia.org/wiki/Thirty-six_Views_of_Mount_Fuji) and [en.wikipedia.org/wiki/Thirty-six_Views_of_Mount_Fuji_(Hiroshige)](https://en.wikipedia.org/wiki/Thirty-six_Views_of_Mount_Fuji_\(Hiroshige\)).
