var express = require('express');
var router = express.Router();
var multer = require('multer');
const csv = require("@fast-csv/parse");
const Utility = require('../models/Utility');
const Building = require('../models/Building');
const DormAverageDay = require('../models/DormAverageDay');
const NonDormAverageDay = require('../models/NonDormAverageDay');
var streamifier = require('streamifier');

let globalCount = 0;

const parseCsv = multer().single("file");

const formatDate = (rawDate) =>{
    let date = new Date(rawDate);
    var month = date.getMonth()+1; //months from 1-12
    var day = date.getDate();
    var year = date.getFullYear();
    return (year + "/" + month + "/" + day);
}

const processHeaders = (headers) =>{
    let result = [];
    for(let i =1; i< headers.length; i++){
        result[i] = headers[i].split(' - ');
    }
    return result;
}

const processBuildingValues = (headers, averageValues, buildingType) =>{
    try{
        console.log("Processing building values");
        for(let i = 0; i< averageValues.length; i++){
            let row = averageValues[i]; //this is 1 day (average)
            let buildings = []; //array of building string names
            let buildingUtilitySchemas = []; //array of utility arrays per building
            for(let j = 1; j< averageValues[i].length; j++){
                let u = new Utility({
                    Name: headers[j][1],
                    Value: averageValues[i][j]
                })
                let index = buildings.indexOf(headers[j][0]); //checks if building exists
                if(index == -1){ //building doesn't exist
                    buildings.push(headers[j][0]); //pushes building
                    buildingUtilitySchemas.push([]); //pushed empty array
                    buildingUtilitySchemas[buildingUtilitySchemas.length-1].push(u); //populates array with utility
                }
                else{ //building exists
                    buildingUtilitySchemas[index].push(u); //adds to existing utility array
                }
            }
            let buildingSchema = [];
            for(let j = 0; j< buildings.length; j++){
              let b = new Building({
                Name: buildings[j],
                Values: buildingUtilitySchemas[j],
                _id: buildings[j]+"-"+averageValues[i][0]
              });
              buildingSchema.push(b);
            }
            let dayAverage;
            if(buildingType.toLowerCase() == "dorm"){
                dayAverage = new DormAverageDay({
                    Date: averageValues[i][0],
                    _id: buildingType +"-"+ averageValues[i][0], //this is the date
                    Data: buildingSchema
                });
            }else{
                dayAverage = new NonDormAverageDay({
                    Date: averageValues[i][0],
                    _id: buildingType +"-"+ averageValues[i][0], //this is the date
                    Data: buildingSchema
                });
            }
            let doc = dayAverage.save();
        }
    }catch(err){
        console.log(err);
    }


    // for(let i =1; i< headers.length; i++){
    //     let building = headers[i][0];
    //     let name = headers[i][1];
    //     let value = averageValue[i];

    //     let u = new Utility({
    //         Name: name,
    //         Value: value
    //     })
    // }

}

const averageRowMatrix = (matrix) =>{

    let numRows = matrix.length
    let numCols = matrix[0].length
    let avgArr = [];
    avgArr.push(formatDate(new Date(matrix[0][0])));

    for(let i =1; i< numCols; i++){
        let currentValue = 0.00;
        let nullValues = 0.00;
        for(let j = 0; j< numRows; j++){
          if (matrix[j][i].toString() !=  "null") {
            if(parseFloat(matrix[j][i]) < 0){
                currentValue += 0;
            }
            else{
                currentValue += parseFloat(matrix[j][i]);
            }
          } else {
            nullValues += 1;
          }
        }
        if(numRows - nullValues == 0){
            avgArr.push(null);
        }else{
            avgArr.push((currentValue/(numRows-nullValues)).toFixed(2));
        }
    }

    //REMEMBER TO COME BACK AND ADDRESS NULL VALUES
    return avgArr;
}

router.post('/dorm/upload', parseCsv, (req, res) =>{
    var {buffer} = req.file;
    let averagedDataFromRows = [];

    var count = 1;
    var currentDate = "";
    var currentRows = [];
    var headers;

    streamifier
      .createReadStream(buffer)
      .pipe(csv.parse({ headers: true, ignoreEmpty: true })) // <== this is @fast-csv/parse!!
      .on("data", (row) => {
        if(count == 1){
            headers = Object.keys(row);
            count++;
        }
        let date = formatDate(row['Series Name']);
        if(date !== currentDate){
            if(currentDate !== ""){
                let averagedRow = averageRowMatrix(currentRows);
                averagedDataFromRows.push(averagedRow);
            }
            currentDate = date;
            currentRows = [];
        }
        currentRows.push(Object.values(row));
      })
      .on("end", async (rowCount) => {
        try {
            startPopulation(res, headers, averagedDataFromRows, "Dorm");
        } catch (error) {
          res.status(400).json({ error});
        }
      });
})

router.post('/non-dorm/upload', parseCsv, (req, res) =>{
    var {buffer} = req.file;
    let averagedDataFromRows = [];

    var count = 1;
    var currentDate = "";
    var currentRows = [];
    var headers;

    streamifier
      .createReadStream(buffer)
      .pipe(csv.parse({ headers: true, ignoreEmpty: true })) // <== this is @fast-csv/parse!!
      .on("data", (row) => {
        if(count == 1){
            headers = Object.keys(row);
            count++;
        }
        let date = formatDate(row['Series Name']);
        if(date !== currentDate){
            if(currentDate !== ""){
                let averagedRow = averageRowMatrix(currentRows);
                averagedDataFromRows.push(averagedRow);
            }
            currentDate = date;
            currentRows = [];
        }
        currentRows.push(Object.values(row));
      })
      .on("end", async (rowCount) => {
        try {
            startPopulation(res, headers, averagedDataFromRows, "Non-Dorm");
        } catch (error) {
          res.status(400).json({ error});
        }
      });
})

const startPopulation = (res, headers, averageValues, buildingType) =>{
    console.log("Starting population");
    var matrixHeaders = processHeaders(headers);
    console.log("Processing");
    processBuildingValues(matrixHeaders, averageValues, buildingType);
    res.status(200).json({status: "good"});
}

module.exports = router;