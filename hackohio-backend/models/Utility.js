var mongoose = require('mongoose');

var Utility = new mongoose.Schema({
    Name:String,
    Value: Number
}, {
    versionKey: false
});

module.exports = mongoose.model('Utility', Utility);