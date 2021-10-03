const express = require('express')
const exec = require('child_process').exec;
const readLastLines = require('read-last-lines');
const axios = require('axios');
const app = express();
const ip = "localhost"

const port = process.env.PORT || 4001;
const id = port - 4000;
let leader_id = id;
let instances = [];

const server = app.listen(port, ()=>{
    console.log(`App is listening at port: ${port}`);
});

function addInstance(){
    inst_port = instances.length+4002;
    exec(`sh add-server.sh ${inst_port}`, (error, stout, stderr)=>{
        if(error !== null){
            console.log(error);
        }
        else{
            instances.forEach(inst => {
                axios.post(`http://${ip}:${inst_port}/add_instance`,new_instance).then(response =>{
                    console.log(response.body);
                }).catch(function (error){
                    console.error(error);
                });
            });
            axios.post(`http://${ip}:${inst_port}/set_leader`, id).then(response =>{            
                console.log(response.body);    
            }).catch(e =>{
                //console.error(e);
            });
        }
    });
}

app.post('/set_leader', (req, res)=>{
    leader_id = req.body.id;
    res.send({message:"leader acknowledged"});
});
app.post('/add_instance', (req, res)=>{
    if(leader_id == id){
        new_instance = {
            id: instances.length+2,
            port: 4000 + instances.length+2,
            status:'OK'
        }
        addInstance();
        instances.push(new_instance);
        res.send({message : `instance created succesfully`})
    }
    else{
        console.log(req.body);
        /*instances.push(req.body);*/
        res.send({message : `instance ${req.body.id} added succesfully in ${id}`})
    }
});
app.get('/', (req, res)=>{
    res.send("Hello World!")
});
setInterval(()=>{

}, 1000);