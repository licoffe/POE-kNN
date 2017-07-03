"use strict";

var Logger = require( "./logger.js" );
var logger = new Logger();
logger.set_use_timestamp( true );
logger.set_file_path( "./log.txt" );

class Node {

    constructor( object, meaningfulFeatures ) {
        for ( var key in object ) {
            this[key] = object[key];
        }
        this.meaningfulFeatures = meaningfulFeatures;
    }

    /**
     * Compute feature euclidean distances between this node and its neighbors
     *
     * @params params
     * @return return
     */
    measureDistances( featureRanges ) {
        var ranges = {};
        // For each feature, compute the distance between min and max for 
        // normalization
        for ( var i in featureRanges ) {
            ranges[i] = featureRanges[i].max - featureRanges[i].min;
            if ( ranges[i] === 0 ) {
                ranges[i] = 1;
            }
        }

        // For each neighbor
        for ( var i in this.neighbors ) {
            var neighbor = this.neighbors[i];
            var delta    = [];
            var mul      = 0;
            // console.log( neighbor.name );
            // For each feature
            for ( var j in this.meaningfulFeatures ) {
                if ( !neighbor.features[this.meaningfulFeatures[j]]) {
                    neighbor.features[this.meaningfulFeatures[j]] = [featureRanges[this.meaningfulFeatures[j]].min];
                }
                if ( !this.features[this.meaningfulFeatures[j]]) {
                    this.features[this.meaningfulFeatures[j]] = [featureRanges[this.meaningfulFeatures[j]].min];
                }
                    var diff = 0;
                    if ( neighbor.features[this.meaningfulFeatures[j]].length > 1 ) {
                        diff = ( neighbor.features[this.meaningfulFeatures[j]][0] +
                                 neighbor.features[this.meaningfulFeatures[j]][1]) / 2 -
                               ( this.features[this.meaningfulFeatures[j]][0] + this.features[this.meaningfulFeatures[j]][1]) / 2;
                    } else {
                        diff = neighbor.features[this.meaningfulFeatures[j]][0] - 
                               this.features[this.meaningfulFeatures[j]][0];
                    }
                    // var diff  = neighbor.features[meaningfulFeatures[j]] - 
                    //             this.features[meaningfulFeatures[j]];
                    // console.log( diff );
                    var delta = diff / ranges[this.meaningfulFeatures[j]];
                    // console.log( diff + " / " + ranges[meaningfulFeatures[j]] );
                    mul += ( delta * delta );
                    // console.log( mul );
                // } else {
                //     mul += 0.01;
                // }
            }

            neighbor.distance = Math.sqrt( mul );
            // console.log( neighbor.distance );
        }
    }

    sortByDistance() {
        this.neighbors.sort( function( a, b ) {
            return a.distance - b.distance;
        });
    }

    /**
     * Return k-NN classification
     *
     * @params Number of neighbours to use
     * @return classification
     */
    guess( k ) {
        var prices = {};
        this.priceList = [];
        logger.log( "Neighbors\n=====================================" );
        var avgDistance = 0;
        // For the first k neighbors of this node, count each prices
        for ( var i in this.neighbors.slice( 0, k )) {
            var neighbor = this.neighbors[i];
            if ( neighbor.features.price && neighbor.distance < 1 ) {
                avgDistance += neighbor.distance;
                console.log( neighbor );
                logger.log( "-------------------------------------" );
                // If we haven't found this neighbor price, set amount to 0
                if ( !prices[neighbor.features.price] ) {
                    prices[neighbor.features.price] = 0;
                }
                this.priceList.push( neighbor.features.price );
                prices[neighbor.features.price] += 1;
            }
        }

        var guess = { price: false, count: 0 };

        // Find the dominant price
        // for ( var price in prices ) {
        //     if ( prices[price] > guess.count ) {
        //         guess.price = price;
        //         guess.count = prices[price];
        //     }
        // }

        // Compute average price
        var sum = 0;
        for ( var price in prices ) {
            sum += parseInt( price );
        }
        guess.price = sum / Object.keys( prices ).length;
        guess.avgDistance = avgDistance / Object.keys( prices ).length;

        this.guess = guess;


        return prices;
    }
}

module.exports = Node;