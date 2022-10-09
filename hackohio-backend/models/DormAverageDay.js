let mongoose = require('mongoose')
var Building = require('./Building').schema;

var AverageDaySchema = new mongoose.Schema({
    Date:String,
    Data:[Building],
    _id: String
},{
    versionKey: false
});

//Object ID of date is just Date

//Object ID of Building is Building-Date

module.exports = mongoose.model('DormAverageDay', AverageDaySchema);

