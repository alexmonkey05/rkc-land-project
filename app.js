const express = require('express');
const fs = require('fs/promises');
const { spawn } = require('child_process');

var app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname));


const AREA_DIR = "./data/area.json"
const REQ_DIR = "./data/req.json"

app.post('/update', (req, res) => {
    const python = spawn('python', ['./generate_area.py']);
    python.stdout.on("data", (data) => {
        console.log(`stdoud: ${data}`);
    });
    python.on('close', () => {
        console.log("done!");
        res.status(200).end()
    })
})

app.get('/area', (req,res)=>{ // area getter
    const idx = req.body.idx
    fs.readFile(AREA_DIR, 'utf8').then((file_data) => {
        const data = JSON.parse(file_data);
        res.status(200).send(data.features[idx]);
    }).catch((error) => {
        console.error(error)
        res.status(400).end();
    });
});

app.post('/area', (req,res)=>{ // area setter
    const idx = req.body.idx
    const owner = req.body.owner
    fs.readFile(AREA_DIR, 'utf8').then((file_data) => {
        var data = JSON.parse(file_data)
        data.features[idx].properties.OWNER = owner
        fs.writeFile(AREA_DIR, JSON.stringify(data), {encoding:"utf-8", flag: "w"});
        res.status(200).send(data.features[idx]);
    }).catch((error) => {
        console.error(error);
        res.status(400).end();
    });
});
app.post('/area/del', (req,res)=>{ // area 삭제
    const idx = req.body.idx
    fs.readFile(AREA_DIR, 'utf8').then((file_data) => {
        var data = JSON.parse(file_data)
        data.features.splice(idx, 1)
        fs.writeFile(AREA_DIR, JSON.stringify(data), {encoding:"utf-8", flag: "w"});
        res.status(200).end();
    }).catch((error) => {
        console.error(error);
        res.status(400).end();
    });
});
app.post('/area/add', (req,res)=>{ // area 추가
    fs.readFile(AREA_DIR, 'utf8').then((file_data) => {
        var data = JSON.parse(file_data)
        data.features.push(req.body)
        fs.writeFile(AREA_DIR, JSON.stringify(data), {encoding:"utf-8", flag: "w"});
        res.status(200).end();
    }).catch((error) => {
        console.error(error);
        res.status(400).end();
    });
});

app.post('/req/del', (req, res) => { // 신청 제거
    const idx = req.body.idx
    fs.readFile(REQ_DIR, 'utf8').then((file_data) => {
        var data = JSON.parse(file_data)
        data.features.splice(idx, 1);
        fs.writeFile(REQ_DIR, JSON.stringify(data), {encoding:"utf-8", flag: "w"});
        res.status(200).send(data.features);
    }).catch((error) => {
        console.error(error);
        res.status(400).end();
    });
});

app.post('/req/add', (req, res) => { // 신청 추가
    fs.readFile(REQ_DIR, 'utf8').then((file_data) => {
        var data = JSON.parse(file_data)
        data.features.push(req.body)
        fs.writeFile(REQ_DIR, JSON.stringify(data), {encoding:"utf-8", flag: "w"});
        res.status(200).send(data.features);
    }).catch((error) => {
        console.error(error);
        res.status(400).end();
    });
});

app.get('/req', (req, res) => { // 신청 getter
    fs.readFile(REQ_DIR, 'utf8').then((file_data) => {
        var data = JSON.parse(file_data)
        fs.readFile(AREA_DIR, 'utf8').then((file_data) => {
            const area_data = JSON.parse(file_data);
            for(let i = 0; i < data.features.length; i++)
                data.features[i].area = area_data.features[data.features[i].idx];
            res.status(200).send(data.features);
        }).catch((error) => {
            console.error(error);
            res.status(400).end();
        });
    }).catch((error) => {
        console.error(error);
        res.status(400).end();
    });
});

app.listen(8080, () => {
    console.log("Server on!");
});