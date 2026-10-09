<!-- https://cs50.harvard.edu/python/psets/5/test_twttr/ -->
# Testing my twttr

In a file called `twttr.py`, reimplement [Setting up my twttr](https://cs50.harvard.edu/python/psets/2/twttr/) from [Problem Set 2](https://cs50.harvard.edu/python/psets/2/), restructuring your code per the below, wherein `shorten` expects a `str` as input and returns that same `str` but with all vowels (A, E, I, O, and U) omitted, whether inputted in uppercase or lowercase.
    
    
    def main():
        ...
    
    
    def shorten(word):
        ...
    
    
    if __name__ == "__main__":
        main()
    

Then, in a file called `test_twttr.py`, implement **one or more** functions that collectively test your implementation of `shorten` thoroughly, each of whose names should begin with `test_` so that you can execute your tests with:
    
    
    pytest test_twttr.py
    

Hints

  * Be sure to include 
        
        import twttr
        

or
        
        from twttr import shorten
        

atop `test_twttr.py` so that you can call `shorten` in your tests.

  * Take care to `return`, not `print`, a `str` in `shorten`. Only `main` should call `print`.



## Before You Begin

Log into [cs50.dev](https://cs50.dev/), click on your terminal window, and execute `cd` by itself. You should find that your terminal window’s prompt resembles the below:
    
    
    $
    

Next execute
    
    
    mkdir test_twttr
    

to make a folder called `test_twttr` in your codespace.

Then execute
    
    
    cd test_twttr
    

to change directories into that folder. You should now see your terminal prompt as `test_twttr/ $`. You can now execute
    
    
    code test_twttr.py
    

to make a file called `test_twttr.py` where you’ll write your tests.

## How to Test

To test your tests, run `pytest test_twttr.py`. Be sure you have a copy of a `twttr.py` file in the same folder. Try to use correct and incorrect versions of `twttr.py` to determine how well your tests spot errors:

  * Ensure you have a correct version of `twttr.py`. Run your tests by executing `pytest test_twttr.py`. `pytest` should show that all of your tests have passed.
  * Modify the correct version of `twttr.py` in such a way as to create a bug. Your program might, for example, mistakenly only omit lowercase vowels! Run your tests by executing `pytest test_twttr.py`. `pytest` should show that at least one of your tests has failed.



You can execute the below to check your tests using `check50`, a program CS50 will use to test your code when you submit. (Now there are tests to test your tests!). Be sure to test your tests yourself and determine which tests are needed to ensure `twttr.py` is checked thoroughly.
    
    
    check50 cs50/problems/2022/python/tests/twttr
    

Green smilies mean your program has passed a test! Red frownies will indicate your program output something unexpected. Visit the URL that `check50` outputs to see the input `check50` handed to your program, what output it expected, and what output your program actually gave.

## How to Submit

In your terminal, execute the below to submit your work.
    
    
    submit50 cs50/problems/2022/python/tests/twttr
