### Disclaimer
This tool is made for education only and should not be regarded as a finished product of any kind, nor should the price estimations given by the program trusted blindly. 

### Introduction

This tools is an attempt to leverage the kNN classification approach to price poe items, including rare or unique objects.

The project contains two main programs :

* An indexer to pull data from the API and store them into a local MongoDB installation, `indexer.js`
* A kNN classifier to compare item features and attempt to deduce price, `main.js`

### Installation
To get this tool running you will need to:
* Install NodeJS from https://nodejs.org/en/ or your repo management tool
* Install MongoDB
* Finally, you'll need to open a terminal if not already done, change directory to the project folder and install the project dependencies by doing `npm install`

### Running

To run the indexer, type `node ./indexer.js`. 
To run the classifier, type `node ./main.js`.

To specify the league, the properties of the object or the amount of neighbors to use, you can tweak the code of the classifier.