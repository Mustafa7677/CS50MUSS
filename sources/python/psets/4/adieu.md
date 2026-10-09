<!-- https://cs50.harvard.edu/python/psets/4/adieu/ -->
# Adieu, Adieu

In [The Sound of Music](https://en.wikipedia.org/wiki/The_Sound_of_Music_\(film\)), there’s a song sung largely in English, [So Long, Farewell](https://www.youtube.com/watch?v=Qy9_lfjQopU), with these [lyrics](https://www.lyrics.com/lyric/3998488/Julie+Andrews/So+Long%2C+Farewell), wherein “adieu” means “goodbye” in French:

> Adieu, adieu, to yieu and yieu and yieu

Of course, the line isn’t grammatically correct, since it would typically be written (with an [Oxford comma](https://en.wikipedia.org/wiki/Serial_comma)) as:

> Adieu, adieu, to yieu, yieu, and yieu

To be fair, “yieu” isn’t even a word; it just rhymes with “you”!

In a file called `adieu.py`, implement a program that prompts the user for names, one per line, until the user inputs control-d. Assume that the user will input at least one name. Then bid adieu to those names, separating two names with one `and`, three names with two commas and one `and`, and \\(n\\) names with \\(n-1\\) commas and one `and`, as in the below:

> Adieu, adieu, to Liesl  
>  Adieu, adieu, to Liesl and Friedrich  
>  Adieu, adieu, to Liesl, Friedrich, and Louisa  
>  Adieu, adieu, to Liesl, Friedrich, Louisa, and Kurt  
>  Adieu, adieu, to Liesl, Friedrich, Louisa, Kurt, and Brigitta  
>  Adieu, adieu, to Liesl, Friedrich, Louisa, Kurt, Brigitta, and Marta  
>  Adieu, adieu, to Liesl, Friedrich, Louisa, Kurt, Brigitta, Marta, and Gretl

Hints

  * Note that the `inflect` module comes with quite a few methods, per [pypi.org/project/inflect](https://pypi.org/project/inflect/). You can install it with: 
        
        pip install inflect
        




## Demo

## Before You Begin

Log into [cs50.dev](https://cs50.dev/), click on your terminal window, and execute `cd` by itself. You should find that your terminal window’s prompt resembles the below:
    
    
    $
    

Next execute
    
    
    mkdir adieu
    

to make a folder called `adieu` in your codespace.

Then execute
    
    
    cd adieu
    

to change directories into that folder. You should now see your terminal prompt as `adieu/ $`. You can now execute
    
    
    code adieu.py
    

to make a file called `adieu.py` where you’ll write your program.

## How to Test

Here’s how to test your code manually:

  * Run your program with `python adieu.py`. Type `Liesl` and press Enter, followed by control-d. Your program should output: 
        
        Adieu, adieu, to Liesl 
        

  * Run your program with `python adieu.py`. Type `Liesl` and press Enter, then type `Friedrich` and press Enter, followed by control-d. Your program should output: 
        
        Adieu, adieu, to Liesl and Friedrich
        

  * Run your program with `python adieu.py`. Type `Liesl` and press Enter, then type `Friedrich` and press Enter. Now type `Louisa` and press Enter, followed by control-d. Your program should output: 
        
        Adieu, adieu, to Liesl, Friedrich, and Louisa
        




You can execute the below to check your code using `check50`, a program that CS50 will use to test your code when you submit. But be sure to test it yourself as well!
    
    
    check50 cs50/problems/2022/python/adieu
    

Green smilies mean your program has passed a test! Red frownies will indicate your program output something unexpected. Visit the URL that `check50` outputs to see the input `check50` handed to your program, what output it expected, and what output your program actually gave.

## How to Submit

In your terminal, execute the below to submit your work.
    
    
    submit50 cs50/problems/2022/python/adieu
