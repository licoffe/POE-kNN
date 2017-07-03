"use strict";

var Logger      = require( "./logger.js" );
var logger      = new Logger();
logger.set_use_timestamp( true );
logger.set_file_path( "./log.txt" );
var scriptName  = "NodeList";
var Node        = require( "./node.js" );

class NodeList {
    constructor( k, meaningfulFeatures ) {
        this.nodes              = [];
        this.k                  = k;
        this.meaningfulFeatures = meaningfulFeatures;
    }

    // Add new node
    add( node ) {
        this.nodes.push( node );
    }

    /**
     * Compute feature value range for normalization
     *
     * @params Nothing
     * @return Nothing
     */
    computeRange() {
        this.ranges = {};
        // For each node
        for ( var i in this.nodes ) {
            var node = this.nodes[i];
            // For each feature, compute range
            for ( var j in this.meaningfulFeatures ) {
                var feature = node.features[this.meaningfulFeatures[j]];
                if ( feature ) {
                    if ( feature.length > 1 ) {
                        feature = ( feature[0] + feature[1] ) / 2;
                    } else {
                        feature = feature[0];
                    }
                    // If this feature range has not been initialized
                    if ( !this.ranges[this.meaningfulFeatures[j]]) {
                        this.ranges[this.meaningfulFeatures[j]] = { min: 10000000, max: 0 };
                    }
                    // If value is inferior to current min range, set new min
                    if ( feature < this.ranges[this.meaningfulFeatures[j]].min ) {
                        this.ranges[this.meaningfulFeatures[j]].min = feature;
                    }
                    // If value is superior to current max range, set new max
                    if ( feature > this.ranges[this.meaningfulFeatures[j]].max ) {
                        this.ranges[this.meaningfulFeatures[j]].max = feature;
                    }
                }
            }
        }
        console.log( this.ranges );
    }

    /**
     * Attempt to guess the price for each priceless nodes
     *
     * @params Nothing
     * @return Nothing
     */
    determineUnknownPrice() {
        logger.log( "Computing ranges", scriptName );
        this.computeRange();
        logger.log( "Ranges\n=====================================" );
        console.log( this.ranges );
        // For each node, if the price is unknown
        for ( var i in this.nodes ) {
            var node = this.nodes[i];
            if ( !node.features.price ) {
                this.nodes[i].neighbors = [];
                // console.log( this.nodes[i] );
                for ( var j in this.nodes ) {
                    var neighbor = this.nodes[j];
                    if ( !neighbor.features.price ) {
                        continue;
                    }
                    this.nodes[i].neighbors.push( new Node( this.nodes[j]));
                }

                this.nodes[i].measureDistances( this.ranges );
                this.nodes[i].sortByDistance();
                // console.log( this.nodes[i].neighbors );
                // console.log(  this.nodes[i]);
                var prices = this.nodes[i].guess( this.k );
                logger.log( "Prices\n=====================================" );
                console.log( prices );
                logger.log( "Proposed price\n=====================================" );
                logger.log( this.nodes[i].name + ": " + this.nodes[i].guess.price + " c" );
                if ( this.nodes[i].guess.avgDistance > 0.5 ) {
                    logger.log( "Average distance > 0.5: " + Math.round( this.nodes[i].guess.avgDistance * 1000 ) / 1000, "", "e" );
                }
                // console.log( this.nodes[i].priceList );
            }
        }
    }
}

module.exports = NodeList;