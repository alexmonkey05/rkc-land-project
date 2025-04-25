const express = require('express');
const fs = require('fs/promises');
const { spawn } = require('child_process');
const cors = require('cors')
const logger = require("./logger");
const { features } = require('process');

logger.info("server on!");

var app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname));
app.use(cors({
    origin: '*',
    optionsSuccessStatus: 200,
    Credentials: true,// 응답 헤더에 Access-Control-Allow-Credentials 추가
  }));


const AREA_DIR = "./data/area.json"
const REQ_DIR = "./data/req.json"
const OWNER_DIR = "./data/owner.json"
const COOLTIME = 86400000 // 24h = 86400000ms

var is_done = true
app.post('/update', (req, res) => {
    logger.info("trying to update map");
    if(!is_done){
        res.status(200).send('{"response":"이미 업데이트 하는 중입니다"}').end()
        return;
    }
    is_done = false
    const python = spawn('python3', ['./generate_area.py']);
    python.stdout.on("data", (data) => {
        console.log(`stdoud: ${data}`);
    });
    python.on('close', () => {
        is_done = true
        if(is_done){
            logger.info("successfully updated");
            res.status(200).send('{"response":"성공적으로 업데이트 했습니다"}').end()
        } else {
            logger.error("unexpected error while running generate_area.py");
            res.status(400).end()
        }
    })
})

app.get('/area', (req,res)=>{ // area getter
    const idx = req.query.idx
    console.log(req.query.idx)
    fs.readFile(AREA_DIR, 'utf8').then((file_data) => {
        const data = JSON.parse(file_data);
        res.status(200).send(data.features[idx]);
    }).catch((error) => {
        logger.error(error)
        console.error(error)
        res.status(400).end();
    });
});

app.post('/area', (req,res)=>{ // area setter
    logger.info("set area data");
    const idx = req.body.idx
    if(idx == undefined){ logger.warn("idx is missing", req.body); }
    const owner = req.body.owner
    if(owner == undefined){ logger.warn("owner is missing", req.body); }
    fs.readFile(AREA_DIR, 'utf8').then((file_data) => {
        var data = JSON.parse(file_data)
        data.features[idx].properties.OWNER = owner
        // 땅 쿨타임 24시간 세팅
        fs.writeFile(AREA_DIR, JSON.stringify(data), {encoding:"utf-8", flag: "w"});
        logger.info(`${owner} got land no.${idx + 1}`);
        res.status(200).send(data.features[idx]);
    }).catch((error) => {
        logger.error(error)
        console.error(error);
        res.status(400).end();
    });
});
app.post('/area/del', (req,res)=>{ // area 삭제
    logger.info("del area data");
    const idx = req.body.idx
    fs.readFile(AREA_DIR, 'utf8').then((file_data) => {
        var data = JSON.parse(file_data)
        deleted_area = data.features.splice(idx, 1)
        fs.writeFile(AREA_DIR, JSON.stringify(data), {encoding:"utf-8", flag: "w"});
        logger.info(`land no.${idx + 1} was deleted. the start coordinate is ${deleted_area[0].coordinates}`);
        res.status(200).send('{"response":"성공적으로 삭제했습니다"}').end();
    }).catch((error) => {
        logger.error(error)
        console.error(error);
        res.status(400).end();
    });
});
app.post('/area/add', (req,res)=>{ // area 추가
    logger.info("add area data");
    fs.readFile(AREA_DIR, 'utf8').then((file_data) => {
        var data = JSON.parse(file_data)
        var input_features = req.body.features
        var input_features_len = input_features.length
        for(let i = 0; i < input_features_len; i++){
            data.features.push(req.body.features[i])
            logger.info(`land no.${data.features.length} was added. the start coordinate is [${req.body.features[i].coordinates[0]}]`);
        }
        fs.writeFile(AREA_DIR, JSON.stringify(data), {encoding:"utf-8", flag: "w"});
        res.status(200).send({"success":true});
    }).catch((error) => {
        logger.error(error)
        console.error(error);
        res.status(400).end();
    });
});

app.post('/req/del', (req, res) => { // 신청 제거
    logger.info("del request data");
    const idx = req.body.idx
    fs.readFile(REQ_DIR, 'utf8').then((file_data) => {
        var data = JSON.parse(file_data)
        deleted_req = data.features.splice(idx, 1);
        fs.writeFile(REQ_DIR, JSON.stringify(data), {encoding:"utf-8", flag: "w"});
        logger.info(`${deleted_req[0].owner}'s request was deleted`);
        res.status(200).send(data.features);
    }).catch((error) => {
        logger.error(error)
        console.error(error);
        res.status(400).end();
    });
});

app.post('/req/cooltime', (req, res) => {
    logger.info("reset cooltime")
    
    fs.readFile(OWNER_DIR, 'utf8').then((file_data) => {
        var data = JSON.parse(file_data);
        data[req.body.owner].recent_time = Date.now() - COOLTIME
        fs.writeFile(OWNER_DIR, JSON.stringify(data), {encoding:"utf-8", flag: "w"});
        logger.info(`someone reset ${req.body.owner}'s request cooltime`);
        res.status(200).send({"success":true,"result":`성공적으로 ${req.body.owner}의 쿨타임을 초기화 했습니다`})
    }).catch((error) => {
        logger.error(error)
        console.error(error);
        res.status(400).end();
    });;
})

app.post('/req/add', (req, res) => { // 신청 추가
    logger.info("add request");
    // 이전 신청으로부터 24시간이 지났는지 판별
    fs.readFile(OWNER_DIR, 'utf8').then((file_data) => {
        var data = JSON.parse(file_data);
        var now_date = Date.now()
        var recent_date = 0;
        if(data[req.body.owner] != undefined){
            recent_date = new Date(data[req.body.owner].recent_time);
        }
        else{
            data[req.body.owner] = {
                recent_time:0
            }
        }

        if(now_date - recent_date < COOLTIME){
            logger.info(`${req.body.owner}'s request was failed by 24 hour rule. land no.${req.body.idx + 1}`);
            res.status(200).send({"success":false,"result":"신청한지 24시간이 지나지 않았습니다"});
            return;
        }
        
        data[req.body.owner].recent_time = Date.now()
        fs.writeFile(OWNER_DIR, JSON.stringify(data), {encoding:"utf-8", flag: "w"});
        fs.readFile(REQ_DIR, 'utf8').then((file_data) => {
            var data = JSON.parse(file_data)
            data.features.push(req.body)
            fs.writeFile(REQ_DIR, JSON.stringify(data), {encoding:"utf-8", flag: "w"});
            logger.info(`${req.body.owner}'s request was added. land no.${req.body.idx + 1}`);
            res.status(200).send({"success":true,"result":data.features});
        }).catch((error) => {
            logger.error(error)
            res.status(400).end();
        });
    }).catch((error) => {
        logger.error(error)
        console.error(error);
        res.status(400).end();
    });
});

app.get('/req', (req, res) => { // 신청 getter
    fs.readFile(REQ_DIR, 'utf8').then((file_data) => {
        var data = JSON.parse(file_data)
        fs.readFile(AREA_DIR, 'utf8').then((file_data) => {
            const area_data = JSON.parse(file_data);
            for(let i = 0; i < data.features.length; i++){
                data.features[i].area = area_data.features[data.features[i].idx];
            }
            res.status(200).send(data.features);
        }).catch((error) => {
            logger.error(error)
            console.error(error);
            res.status(400).end();
        });
    }).catch((error) => {
        logger.error(error)
        console.error(error);
        res.status(400).end();
    });
});

const PORT = 8081
app.listen(PORT, () => {
    console.log(`Server listen at ${PORT}!`);
});