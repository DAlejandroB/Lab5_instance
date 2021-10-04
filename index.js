const express = require('express');
const exec = require('child_process').exec;
const readLastLines = require('read-last-lines');
const axios = require('axios');
const app = express();
app.use(express.json());
const ip = "127.0.0.1"

const port = process.env.PORT || 4001;
const id = port - 4000;
let leader_id = 1;
let instances = [];

const server = app.listen(port, ()=>{
    instances.push({
        id: id,
        port: port,
        status: "OK"
    });
    console.log(`App is listening at port: ${port}`);
});

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
                    axios.post(`http://${ip}:${inst.port}/add_instance`,instances).then(response =>{
                        console.log(response.data);
                    }).catch(function (error){
                        console.error("Fallo " + error);
                    });
                }    
                });
            console.log(instances);
            setTimeout(()=>{
                axios.post(`http://${ip}:${inst_port}/set_leader`, {id:id}).catch(e =>{
                    console.error(e);
                });
                axios.post(`http://${ip}:${inst_port}/add_instance`, instances);
            },5000);
        }
    });
}
//Codigo de prueba para comprobar el funcionamiento del metodo setLeader
/* setTimeout(()=>{
    console.log("changing leader");
    instances.forEach(inst => {
        axios.post(`http://${ip}:${inst.port}/set_leader`, {id:2});
    });
},25000); */

app.post('/set_leader', (req, res)=>{
    leader_id = req.body.id;
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
        res.send({message: `instance ${instances.at(-1).id} added succesfully in ${id}`});
    }
});
app.get('/', (req, res)=>{
    res.send("Hello World!")
});
app.get('/status', (req, res) => { 
    res.send("OK")
})
setInterval(()=>{
    if(leader_id != id){
        
    }else{
        instances.forEach(instance => {
            if(instance.id != id){
                console.log("pinging " + instance.port);
                exec(`sh watch.sh ${ip} ${instance.port}`, (error, stout, stderr) => {
                    if (error !== null) {
                        console.log(`exec error: ${error}`);
                    }
                })
            }
        });
    }
}, getRandom(1000,2000));

function getRandom(min, max){
    return Math.round(Math.random()*(max-min) + min);
}