/**
 * Currency class
 *
 * Translate long currency names to trade symbol and look up last rates
 * @params Leagues
 * @return Currency object
 */

"use strict"

var async   = require( "async" );
var request = require( "request" );
var config  = require( "../config.json" );
var leagues = config.leagues;

class Currency {

    /**
     * Fetch last currency rates from poe-rates.com API
     *
     * Fetch currency rates in chaos for each leagues from
     * the poe-rates API.
     * @params callback
     * @return return rates through callback
     */
    static getLastRates( callback ) {
        var shortRates = {};
        // For each league
        async.each( leagues, function( league, cbLeague ) {
            request({ "url": "http://poe-rates.com/actions/getLastRates.php?league=" + league, "gzip": true },
                function( error, response, body ) {
                shortRates[league] = {};
                var parsed = JSON.parse( body );
                var rates  = parsed.rates;
                // Change long rate name to short one using lookup table
                for ( var rate in rates ) {
                    if ( rates.hasOwnProperty( rate )) {
                        shortRates[league][Currency.currencyLookupTable[rate]] = parseFloat( rates[rate]);
                    }
                }
                shortRates[league].chaos = 1.0;
                cbLeague();
            });
        }, function( err ) {
            if ( err ) {
                console.log( err );
            }
            callback( shortRates );
        });
    }
}

Currency.currencyLookupTable = {
    "Exalted Orb":           "exa",
    "Chaos Orb":             "chaos",
    "Orb of Alchemy":        "alch", 
    "Orb of Alteration":     "alt", 
    "Orb of Fusing":         "fuse", 
    "Divine Orb":            "divine",
    "Orb of Chance":         "chance", 
    "Jeweller's Orb":        "jew", 
    "Cartographer's Chisel": "chisel", 
    "Vaal Orb":              "vaal", 
    "Orb of Regret":         "regret", 
    "Regal Orb":             "regal",
    "Gemcutter's Prism":     "gcp",
    "Chromatic Orb":         "chrome",
    "Orb of Scouring":       "scour",
    "Blessed Orb":           "bless"
};

module.exports = Currency;