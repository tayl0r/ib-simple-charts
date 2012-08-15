ib-simple-charts
================

Simple Charts for your Interactive Brokers account.

See demo here: http://www.taylorsteil.com/ib-simple-charts-demo/

Why?
====
I wanted a very simple way to get the important stats from my IB account.
I care about account value, dividend payments, interest paid, and commissions.
Looking at the official IB reports to get this data is painful.

How?
====
IB lets you run and download flex reports via their API. You just need to enable it, get your API key, and setup the flex reports.

One problem with IB's API is that they don't set the 'Access-Control-Allow-Origin' header on the API response, so the browser will not let you access it via client side javascript. I had to put a simple php script in place that does the communication with IB.

There could be a better way to do this but I am not an expert at this and the php script was the easiest way I could figure out a way to do it. If you're using Apache it would probably be easier to setup a ProxyPass url but I am not using Apache so that method was out.

The php script is pretty basic, but it does add a server language to the requirements of running the app, which I was trying to avoid.


Requirements
============
* web server with php support and the pecl_http php module
* html5 capable browser
* IB account with API key and proper flex reports


Setup
=====

Step 0
------
Before we actually try to configure this with your IB data, let's just make sure it works in demo mode.
You can't run this from a local file:// url, you actually have to host it on a web server.
So, copy it to your web server and then hit the ib-simple-charts/ url.
It should come up with the demo data. If you see any errors in the console or the reports don't work, stop here and try to resolve them. The errors are probably from your web server configuration, php config, or something like that.

If you don't have the pecl_http module installed, you will see this error:

    Parse error: syntax error, unexpected T_OBJECT_OPERATOR in IB-getter.php on line 20

Install the module via "pecl install pecl_http" or see [here](http://www.php.net/manual/en/http.install.php).

Once the demo works, we can configure it with your IB data.

Step 1
------
First, let's setup the flex reports at IB.
Go to the Flex Queries section of Activity Statements.

![ib1](ib-simple-charts/raw/master/docs/ib1.png)

We're going to want to setup 3 flex queries that are identical with the exception of the time frame.
I used these three time frames: 1 year back, year to date, and 1 month back.

In the flex report, here are the options I selected and the fields I included:

*	Name

		I used something like "flexReport-<dateRange>", where <dateRange> is 1m, 12m, YTD, etc

*   Display Account Alias in Place of Account ID

    	checked this so I don't display the real account id in the report (for security)

*	Date Configuration

		Period: (make a report for each period)
		  - last 365 calendar days
		  - year to date
		  - last 30 calendar days

*	Net Asset Value (NAV) in base:

		Report Date
    	Dividend Accruals
    	Total
    	Cash

*	Mark-to-Market Performance Summary in base:

		Symbol
		Dividends
		Commission
		Total

*	Cash Report
		
		Commissions
		Dividends
		Broker Interest

Then click Save Query at the bottom.

Do this 3 times, for each date range. Now go back to the main flex query screen and you should see the IDs of your flex queries.

![ib2](ib-simple-charts/raw/master/docs/ib2.png)


Step 2
------
Now you want to take those IDs and update index.html with them.

	// index.html line 91
	var reportId_1m = 75212;
	var reportId_ytd = 75123;
	var reportId_12m = 75211;


Step 3
------
We also need to setup our IB API key and put that into IB-getter.php

Go back to IB and go to Delivery Settings -> Flex Web Service.
We need to generate a new token if you don't already have one so click the Generate New Token button.

**You should probably change the "Will Expire After" dropdown to 1 year.**

![ib3](ib-simple-charts/raw/master/docs/ib3.png)

**You should probably change the "Will Expire After" dropdown to 1 year.**

Now just copy the current token ID and put that into IB-getter.php 

	$apiKey = 000000000000000;	// put your token id here instead of the zeroes
	$demo = true;				// and change this to false so we aren't in demo mode anymore


Step 4
------
That's it! You should now be able to hit the ib-simple-reports url and it *should* show your data.



Todo
====

*	**Make it more data driven.** My javascript is pretty rusty and I didn't want to spend the additional time making it data driven so you could have an arbitrary number of reports, the html is auto-generated, the report getting methods are data driven, etc. It would not be **that** hard and I expect that if I want to make this any more complicated, I will have to make it more data driven first.


Known Quirks
============

*	After the report data is fetched, it has to switch to that tab or the chart throws errors when it is created. It's weird but I couldn't figure out another way for the charting library to not complain.
*	The timeseries data is showing the number of days since the report start instead of the actual date. This is because I couldn't get the charting library to cooperate with me when I gave it dates.
