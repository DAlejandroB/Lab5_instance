const express = require('express');
const exec = require('child_process').exec;
const readLastLines = require('read-last-lines');
const axios = require('axios');
const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
const ip = "172.17.0.";

const port = process.env.PORT || 4001;
const id = port - 4000;
let leader_id = 1;
let instances = [];
let isInElection = false;

const server = app.listen(port, ()=>{
    console.log(`App is listening at port: ${port}`);
    instances.push({
        id: id,
        port: port,
        status: "OK"
    });
    io.emit("info", instances);
});

const SocketIO = require('socket.io');
const io = SocketIO(server);

function addInstance(){
    inst_port = instances.length+4001;
    exec(`sh add-server.sh ${inst_port} ${"instance"+ (instances.length+1)}`, (error, stout, stderr)=>{
        if(error !== null){
            console.log(error);
        }
        else{
            new_instance = {
                id: instances.length+1,
                port: 4000 + instances.length+1,
                status:'OK'
            }
            instances.push(new_instance);
            instances.forEach(inst => {
                if(inst.id != new_instance.id && inst.id != id){
                    axios.post(`http://${ip}${inst.id+1}:${inst.port}/add_instance`,instances).then(response =>{
                        console.log(response.data);
                    }).catch(function (error){
                        console.error("Fallo " + error);
                    });
                }    
                });
            console.log(instances);
            setTimeout(()=>{
                axios.post(`http://${ip}${new_instance.id+1}:${inst_port}/set_leader`, {id:id}).catch(e =>{
                    console.error(e);
                });
                axios.post(`http://${ip}${new_instance.id+1}:${inst_port}/add_instance`, instances);
            },5000);
        }
    });
}

app.post('/set_leader', (req, res)=>{
    leader_id = req.body.id;
    isInElection = false;
    res.send({message:"leader acknowledged"});
});
app.post('/add_instance', (req, res)=>{
    if(leader_id == id){
        addInstance();
        res.send({message : `instance created succesfully`})
    }
    else{
        console.log(req.body);
        instances = req.body;
        res.send({message: `instance ${instances.length} added succesfully in ${id}`});
    }
});

app.get('/', (req, res)=>{
    res.sendFile(__dirname + '/public/index.html');
    io.emit("info", instances);
});

app.get('/status', (req, res) => { 
    res.send("OK")
});

app.post('/stop_instance', (req, res) =>{
    tostop_id = req.body.id;
    exec(`sh kill-server.sh instance${tostop_id}`);
    res.send({message:`The instance ${tostop_id} has been stopped succesfully`})
});
app.post('/init_election', (req, res) =>{
    isInElection = true;
    if(req.body.isCandidate){
        initElection();
    }
    res.send({message:"OK"});
});
function initElection(){
    isInElection = true;
    console.log("Starting a new election");
    responded = false;
    if(!isInElection){
        instances.forEach(instance => {
            let is_candidate = false;
            if(instance.id > id)
                is_candidate = true;
            axios.post(`http://${ip}${instance.id+1}:${instance.port}/init_election`, {isCandidate:is_candidate}).then(response => {
                if(response.data.message === 'OK' && is_candidate) responded = true;
            }); 
        });
    }else{
        instances.forEach(instance => {
            if(instance.id > id){
                axios.post(`http://${ip}${instance.id+1}:${instance.port}/init_election`, {isCandidate:true});
            }
        });
    }
    if(!responded){
        instances.forEach(instance => {
            axios.post(`http://${ip}${instance.id+1}:${instance.port}/set_leader`, {id:id});
        });
    }
}

interval = 2000;
setInterval(()=>{
    io.emit("info", instances);
    io.emit("port", port);
    if(!isInElection){
        if(leader_id != id){
            interval = getRandom(1000,2000)
            console.log(`addressing http://${ip}${leader_id+1}:400${leader_id}/status`)
            axios.get(`http://${ip}${leader_id+1}:400${leader_id}/status`).then(response => console.log(response.data)).catch(error => console.log("Error"));
            /* console.log(`attempting communication at http://${ip}:${instances[instances.findIndex(inst => inst.id =leader_id)].port}/status`);
            axios.get(`http://${ip}:${instances[instances.findIndex(inst => inst.id =leader_id)].port}/status`).then(response => 
            console.log(response.data)).catch(error => console.error()); */
        }else{
            instances.forEach(instance => {
                interval = 2000;
                if(instance.id != id){
                    console.log(`addressing ${ip}${instances.length+1} ${instance.port}`)
                    exec(`sh watch.sh ${ip}${leader_id+1} ${instance.port}`, (error, stout, stderr) => {
                        if (error !== null) {
                            //console.log(`exec error: ${error}`);
                            console.error("There has been an error")
                        }
                    })
                }
            });

            readLastLines.read('log.txt', instances.length-1).then((text) => {
                let lines = text.split('\n');
                lines.splice(lines.length - 1)
                for(i = 0; i < lines.length; i++){
                    let port = parseInt(lines[i].substring(0,4));
                    let status = lines[i].substring(5,lines[i].length);
                    inst_index = instances.findIndex(ss => ss.port == port);
                    if(instances[inst_index] != undefined)
                        instances[inst_index].status = status=="OK"? "OK":"FAIL";
                }
                console.log(instances);
                console.log();
            });
        }
    }
}, interval);

function getRandom(min, max){
    return Math.round(Math.random()*(max-min) + min);
}