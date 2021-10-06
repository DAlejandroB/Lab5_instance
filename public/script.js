const socket = io();
var h, m, s;
let port = 0000;
socket.on("port", (arg)=>{
    port = arg;
});

/* document.getElementById("kill-instance").addEventListener("click", function(){

}); */
document.getElementById("add-instance").addEventListener("click", function(){
    $.ajax({
        url:`http://172.17.0.${port-3999}:${port}/add_instance`
    })
})