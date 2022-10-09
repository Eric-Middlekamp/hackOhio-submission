var mongoose = require('mongoose');
var Utility = require('./Utility').schema;

var Building = new mongoose.Schema({
    Name:String,
    Values: [Utility],
    _id: String
},{
    versionKey: false
});

module.exports = mongoose.model('Building', Building);
