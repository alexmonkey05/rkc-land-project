var express = require('express');

var app = express();

app.use(express.static(__dirname))

app.post('/',(req,res)=>{
    console.log('루트에 대한 요청');
    res.sendFile(__dirname+'/index.html');

})

app.listen(60720, () => {
    console.log("Server on!");
});