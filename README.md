# CNote Database Design Challenge

Prototyping a DB design schema for client balance management, and a couple functions for transformation/calculation.

## **Comments on Basic Proposed Architecture:**
### ERD
* The [ERD](https://lucid.app/lucidchart/94330414-661f-4af5-9749-26b64debed3b/edit?viewport_loc=-232%2C-157%2C3072%2C1619%2C0_0&invitationId=inv_e727416b-5368-424a-b4fb-92d23fb59975) shows the proposed tables and relationships within our database. It's probably best to take a look at this first to see how I've planned things:

![Image](/images/ERD.png)

### Navigating the Repo
* The `/src/main.ts` and `/src/demoData.md` files the only important ones. With more time, I would mock the data as JSON as well (or, better, just set it up in an actual DB) and have the functions run against real data. The data should be 100% correct (data is included for test cases 1 and 2...enough to get the idea) and the functions in `main.ts` are 95% functional code and 5% pseudocode (they won't run since they don't have real data to run against, but you should be able to see that the logic is basically correct).

### Installation
* Not necessary unless you're trying to read this in your code editor and want the squiggly red linting lines to go away :) in which case you'll probably have to install the packages so that Typescript stops complaining:
```
$ git clone git@github.com:bistacos/db-design-challenge.git
$ cd db-design-challenge
$ npm i
```

### Constraints
A couple constraints were added to the main logic section of the "application" in order to minimize installation, bootstrapping, and middleware configuration that would entend the scope of the project well beyond the proposed two hours without adding much in the way of demonstrated knowledge:
  1. The main calculation function, which would normally take place in the context of an actual server connecting to a running DB (as this "app" written that could be, say, Express + NodeJS + Postgres) is simply given in isolation and commented for clarity.
  1. Queries to our "Database" are faked--this obviates the need for Database installation, server connection, and data population, all of which is significant overkill for a 2-ish hour project. Instead, some example mock data is provided in `demoData.ts` to show how calculations would be made to create daily interest accrual data and perform calculaitons with it.
