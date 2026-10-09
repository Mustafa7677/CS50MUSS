<!-- https://cs50.harvard.edu/sql/psets/2/atl/ -->
# ATL

![Aerial view of Hartsfield-Jackson International Airport](https://cs50.harvard.edu/sql/psets/2/atl/atl.jpeg) _An aerial view of Hartsfield-Jackson International Airport, by[Craig Butz](https://en.wikipedia.org/wiki/Hartsfield%E2%80%93Jackson_Atlanta_International_Airport#/media/File:Atlanta_Hartsfield-Jackson_\(cropped\).jpg)_

## Problem to Solve

Hartsfield-Jackson International Airport, perhaps better known as “ATL” for its [IATA airport code](https://en.wikipedia.org/wiki/IATA_airport_code), has been the [busiest airport in the world](https://en.wikipedia.org/wiki/List_of_busiest_airports_by_passenger_traffic) since 1998. Located in Atlanta, Georgia in the United States, ATL served 93.7 million passengers in 2022. Maybe you were one of them!

Suppose you’ve just been hired to help ATL re-design their database system. In a file called `schema.sql` in a folder called `atl`, write a set of SQL statements to design a database with which Hartsfield-Jackson could keep track of its passengers and their flights.

Wondering how to create a folder and file yourself?

Up until now, you’ve been downloading distribution code. In Problem Set 2, you’ll need to make your own folders and files!

If you’ve never created a new folder (“directory”) before, you can do so by learning a new unix (not SQL) command: `mkdir`!

To create a folder called `atl` in the main (“root”) directory of your Codespace, first ensure your terminal looks as such:
    
    
    $
    

Then, type the following in your terminal:
    
    
    mkdir atl
    

Note that the folder `atl` will be created within the “working directory” of your terminal (i.e., the folder on which your terminal is currently focused). If your working directory is already a folder named `pset2`, for instance, `atl` will be created _inside_ the `pset2` folder. (No need to create such a `pset2` folder!)

Once you’ve created the `atl` folder, you can type the following to change your terminal’s working directory to the `atl` folder:
    
    
    cd atl
    

Afterwards, type `code schema.sql` to create a blank `schema.sql` file.

To remember `mkdir` in the future, recall that `mkdir` stands for “**m** a**k** e **dir** ectory!”

## Specification

Your task at hand is to create a SQLite database for ATL from scratch, as by writing a set of `CREATE TABLE` statements in a `schema.sql` file. The implementation details are up to you, though you should minimally ensure your database meets the [airport’s requirements](https://cs50.harvard.edu/sql/psets/2/atl/#requirements) and that it can represent the given [sample data](https://cs50.harvard.edu/sql/psets/2/atl/#sample-data).

### Requirements

To understand ATL’s requirements for their database, you sat down to have a conversation with the Assistant General Manager for IT Operations.

#### Passengers

> When it comes to our passengers, we just need to have the essentials in line: the first name, last name, and age. That’s all we need to know—nothing more.

#### Check-Ins

> When passengers arrive at ATL, they’ll often “check in” to their flights. That’s them telling us they’re here and all set to board. We’d like to keep a tidy log of such moments. And what would we need to log, you ask? Well, here’s what we need:
> 
>   * The exact date and time at which our [passenger](https://cs50.harvard.edu/sql/psets/2/atl/#passengers) checked in
>   * The [flight](https://cs50.harvard.edu/sql/psets/2/atl/#flights) they are checking in for, of course. Can’t lose track of where they’re headed, now can we?
> 


#### Airlines

> ATL’s a hub for many [domestic and international airlines](https://en.wikipedia.org/wiki/Hartsfield%E2%80%93Jackson_Atlanta_International_Airport#Airlines_and_destinations): names like Delta, British Airways, Air France, Korean Air, and Turkish Airlines. The list goes on. So here’s what we track:
> 
>   * The name of the airline
>   * The [“concourse”](https://en.wikipedia.org/wiki/Hartsfield%E2%80%93Jackson_Atlanta_International_Airport#Terminals) or, shall I say, the section of our airport where the airline operates. We have 7 concourses: A, B, C, D, E, F, and T.
> 


#### Flights

> We serve as many as 1,000 flights daily. To ensure that our passengers are never left wondering, we need to give them all the critical details about their flight. Here’s what we’d like to store:
> 
>   * The flight number. For example, “900”. Just know that we sometimes re-use flight numbers.
>   * The [airline](https://cs50.harvard.edu/sql/psets/2/atl/#airlines) operating the flight. You can keep it simple and assume one flight is operated by one airline.
>   * The code of the airport they’re departing from. For example, “ATL” or “BOS”.
>   * The code of the airport they’re heading to
>   * The expected departure date and time (to the minute, of course!)
>   * The expected arrival date and time, to the very same accuracy
> 


### Sample Data

Your database should be able to represent…

  * A passenger, **Amelia Earhart** , who is 39 years old
  * An airline, **Delta** , which operates out of concourses A, B, C, D, and T
  * A flight, **Delta Flight 300** , which is expected to depart from ATL on August 3rd, 2023 at 6:46 PM and arrive at BOS on August 3rd, 2023 at 9:09 PM
  * A **check-in** for Amelia Earhart, for Delta Flight 300, on August 3rd, 2023 at 3:03 PM



## Usage

To create a database from your schema, within your `atl` folder, type
    
    
    sqlite3 atl.db
    

The above will create an empty SQLite database called `atl.db`.

Then, in the `sqlite3` prompt, type
    
    
    .read schema.sql
    

to read the statements from `schema.sql`.

Recall you can use `DROP TABLE tablename`, where `tablename` is the name of your table, to delete a table from your database.

## How to Test

While `check50` exists for this problem, only you can ensure your database meets [ATL’s requirements](https://cs50.harvard.edu/sql/psets/2/atl/#requirements) and that it can store the [sample data](https://cs50.harvard.edu/sql/psets/2/atl/#sample-data) efficiently. Consider whether your database is fully normalized!

### Correctness
    
    
    check50 cs50/problems/2024/sql/atl
    

## How to Submit

In your terminal, execute the below to submit your work.
    
    
    submit50 cs50/problems/2024/sql/atl
