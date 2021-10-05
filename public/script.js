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
        url:`http://127.0.0.1:${port}/add_instance`
    })
})
function timechange(time){
    $.ajax({
        url:`http://localhost:${port}/timechange`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(time)
    }).then(res=> console.log(res))
}