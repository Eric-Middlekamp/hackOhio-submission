var express = require('express');
var mongoose = require('mongoose');
var fileRouter = require('./routes/file-upload');
var fileUpload = require('express-fileupload');
var dormAPI = require('./api/dormAPI');
var nonDormAPI = require('./api/nonDormApi');
var bodyParser = require('body-parser');
const cors = require('cors');
const PORT = 8080;

var app = express();

app.use(cors({
  origin: '*'
}));

app.use(bodyParser.urlencoded({extended: false}))
app.use(fileRouter);
app.use('/dorm/api', dormAPI);
app.use('/non-dorm/api', nonDormAPI);
app.use(express.json());
app.use(fileUpload({
  createParentPath: true
}));

app.get('/', (req, res)=>{
  res.send('I hope so');
})

mongoose.connect('mongodb://localhost:27017/hackOHIO').then(() =>{
  console.log("Connection opened to mongoDB")}).catch(err =>{
    console.error(err);
})

app.listen(PORT || process.env.PORT, (error) =>{
  if(error){
    console.error(error);
  }
  else{
    console.log("Server opened");
  }
})
