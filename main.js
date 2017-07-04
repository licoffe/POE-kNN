var async       = require( "async" );
var mongoClient = require( "mongodb" ).MongoClient;
var Logger      = require( "./modules/logger.js" );
var logger      = new Logger();
logger.set_use_timestamp( true );
logger.set_file_path( "./log.txt" );
var Currency    = require( "./modules/currency.js" );
var Node        = require( "./modules/node.js" );
var NodeList    = require( "./modules/nodeList.js" );
var scriptName  = "KNN";

// Settings ====================================================================
var neighborsAmount = 4;        // Neighbor amount
var league          = "Legacy"; // Main league
// =============================================================================

// Example objects
// =============================================================================

var objects = [
    {
        name: "Sadima's Touch",
        type: "Wool Gloves",
        frameType: 9,
        features: {
            "Adds # to # Fire Damage to Attacks": [4, 8],
            "Adds # to # Lightning Damage to Attacks": [1, 13],
            "+# to maximum Energy Shield": [18],
            "#% increased Quantity of Items found": [24],
            "price": false
        }
    },
    {
        name: "Random onyx amulet",
        type: "Onyx Amulet",
        frameType: 2,
        features: {
            // "Enemies can have 1 additional Curse": [],
            "+# to Dexterity": [42],
            "+#% to Global Critical Strike Multiplier": [28],
            "+# to maximum Mana": [39],
            "+# to maximum Energy Shield": [49],
            // "#% of Physical Attack Damage Leeched as Life": [0.36],
            "price": false
        }
    },
    {
        name: "Eagle Keep",
        type: "Vaal Regalia",
        frameType: 2,
        features: {
            // "# Life Regenerated per second": [4.1],
            // "+# to maximum Mana": [28],
            "#% increased Energy Shield": [130],
            "+# to maximum Energy Shield": [136],
            "+#% to Fire Resistance": [29],
            "+#% to Lightning Resistance": [30],
            "price": false
        }
    },
    {
        name: "Pandemonium Blunt",
        type: "Crimson Jewel",
        frameType: 2,
        features: {
            // "#% increased Damage over Time": [12],
            "#% increased Attack Speed": [3],
            "#% increased Attack Speed while holding a Shield": [4],
            "#% increased Attack Speed with Maces": [8],
            "price": false
        }
    },
    {
        name: "Shade of Solaris",
        type: "Sage Wand",
        frameType: 3,
        features: {
            // "#% increased Spell Damage": [21],
            // "Gain #% of Elemental Damage as extra Chaos Damage": [14],
            "Gain #% of Elemental Damage as Extra Chaos Damage": [21],
            "price": false
        }
    }
];
var objectToPrice = objects[4];

// =============================================================================

var connectToDB = function( callback ) {

    // Read config file
    logger.log( "Reading config file", scriptName );
    var config = require( "./config.json" );

    // Connect to the db
    mongoClient.connect( "mongodb://" + config.dbAddress + ":" + config.dbPort + "/" + config.dbName,
                         function( err, db ) {
        if ( err ) {
            logger.log( err, scriptName, "e" );
            logger.log( "Make sure MongoDB has been started", scriptName, "e" );
            process.exit(0);
        }
        logger.log( "Connected to MongoDB", scriptName );
        if ( config.authenticate ) {
            db.authenticate( config.user, config.pass, function( err, res ) {
                if ( err ) {
                    logger.log( err, scriptName, "e" );
                    process.exit(0);
                }
                logger.log( "Logged in " + config.dbName, scriptName );
                callback( db );
            });
        } else {
            logger.log( "Logged in " + config.dbName, scriptName );
            callback( db );
        }
    });
}

/**
 * Query DB for items matching the object mods. For each item found, its price
 * is converted to chaos based on the latest currency rates.
 *
 * @params db, query, current rates and callback
 * @return DB entries through callback
 */
var queryData = function( db, query, rates, cb ) {
    var entries  = [];
    var features = [];
    var priceReg = /[^0-9]*([0-9.]+).*(chaos|exa|alch|alt|fuse|divine|chance|jew|chisel|vaal|regret|regal|gcp|chrom|scour|blessed)/;
    db.collection('stashes').find( query, { 
        ilvl: 1, 
        stashName: 1, 
        note: 1, 
        parsedImplicitMods: 1, 
        frameType: 1,
        parsedExplicitMods: 1, 
        parsedCraftedMods: 1, 
        parsedEnchantedMods: 1, 
        name: 1, 
        typeLine: 1
    }).toArray( function( err, cursor ) {
        if ( err ) {
            logger.log( err, scriptName, "e" );
        }
        async.each( cursor, function( doc, cb ) {
            var entry = { "features": { }};
            // Cleanup name and typeline
            if ( doc.name ) {
                entry.name = doc.name.replace( "<<set:MS>><<set:M>><<set:S>>", "" );
            } else {
                entry.name = doc.typeLine.replace( "<<set:MS>><<set:M>><<set:S>>", "" );
            }
            priceReg.lastIndex = 0;
            // Extract price
            if ( doc.note ) {
                var matches = priceReg.exec( doc.note );
                if ( !matches ) {
                    entry.features.price = 0;
                } else {
                    entry.features.price = matches[1] * rates[matches[2]];
                }
            } else {
                var matches = priceReg.exec( doc.stashName );
                if ( !matches ) {
                    entry.features.price = 0;
                } else {
                    entry.features.price = matches[1] * rates[matches[2]];
                }
            }
            if ( entry.features.price !== 0 ) {
                async.each( doc.parsedImplicitMods, function( mod, cbMod ) {
                    if ( features.indexOf( mod.mod ) === -1 ) {
                        features.push( mod.mod );
                    }
                    entry.features[mod.mod] = mod.values;
                    cbMod();
                }, function( err ) {
                    async.each( doc.parsedExplicitMods, function( mod, cbMod ) {
                        if ( features.indexOf( mod.mod ) === -1 ) {
                            features.push( mod.mod );
                        }
                        entry.features[mod.mod] = mod.values;
                        cbMod();
                    }, function( err ) {
                        async.each( doc.parsedCraftedMods, function( mod, cbMod ) {
                            if ( features.indexOf( mod.mod ) === -1 ) {
                                features.push( mod.mod );
                            }
                            entry.features[mod.mod] = mod.values;
                            cbMod();
                        }, function( err ) {
                            async.each( doc.parsedEnchantedMods, function( mod, cbMod ) {
                                if ( features.indexOf( mod.mod ) === -1 ) {
                                    features.push( mod.mod );
                                }
                                entry.features[mod.mod] = mod.values;
                                cbMod();
                            }, function( err ) {
                                entries.push( entry );
                                cb();
                            });
                        });
                    });
                });
            } else {
                cb();
            }
        }, function( err ) {
            cb( entries, features );
        });
    });
};

// Gather object features
var meaningfulFeatures = [];
for ( var feature in objectToPrice.features ) {
    if ( feature !== "price" ) {
        meaningfulFeatures.push( feature );
    }
}

// Fetch last rates for all leagues
Currency.getLastRates( function( rates ) {
    // Start search with rates for current league
    run( rates[league]);
});

// Run price estimation
var run = function( rates ) {  
    // Build query string out of feature list
    var mods = [];
    async.each( meaningfulFeatures, function( feature, cbFeature ) {
        var mod = { "$elemMatch" : { "mod": feature }};
        mods.push( mod );
        cbFeature();
    }, function( err ) {
        if ( err ) {
            logger.log( err, scriptName, "e" );
        }
        connectToDB( function( db ) {
            queryData( db, { 
                league: league, 
                typeLine: objectToPrice.type, 
                frameType: objectToPrice.frameType, 
                parsedExplicitMods: { $all: mods }, 
                $or: [{ stashName: /([0-9.]+).*chaos|exa|alch|alt|fuse|divine|chance|jew|chisel|vaal|regret|regal|gcp|chrom|scour|blessed/ }, { note: /([0-9.]+).*chaos|exa|alch|alt|fuse|divine|chance|jew|chisel|vaal|regret|regal|gcp|chrom|scour|blessed/ }]}, rates,
                function( entries, features ) {
                    logger.log( "Found " + entries.length + " entries" );
                    if ( entries.length > 0 ) {
                        // Create a new node list and add all entries to it
                        var nodes = new NodeList( neighborsAmount, meaningfulFeatures );
                        var data = entries;
                        for ( var i in data ) {
                            nodes.add( new Node( data[i], meaningfulFeatures ));
                        }
                        // Add the object to price to the node list
                        nodes.add( new Node( objectToPrice, meaningfulFeatures ));

                        nodes.determineUnknownPrice();
                    }

                    // Close db and program
                    db.close();
                    process.exit(0);
                }
            );
        });
    });
};