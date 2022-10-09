var express = require('express');
var NonDormAverageDay = require('../models/NonDormAverageDay');
var router = express.Router();


router.get('/days', (req, res) =>{
    let documents = [];
    NonDormAverageDay.find({}, (err, result) =>{
        if(err){
            console.error(err);
            res.status(500).json({error: err});
        }
        else{
            res.status(200).json(JSON.parse(JSON.stringify(result)));
        }
    });
})


module.exports = router;