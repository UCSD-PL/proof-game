

$(document).ready(function(){
  var user_id = qs("test_number")  
  if(user_id == undefined)
  {
    window.location = window.location.toString() + "&test_number="+guid()
  }

  log({name: "Page Load"})
});

function S4() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}
function guid() {
       return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}


function log(message){
    // message.page = window.location.toString()

    // $.ajax(
    //    {   
    //        url: "/logs", 
    //        type: "POST",
    //        data: {message: message}, 
    //        success:function(){
    //           console.log("Success");
    //        }
    //    }
    // );
}

function qs(key) {
    key = key.replace(/[*+?^$.\[\]{}()|\\\/]/g, "\\$&"); // escape RegEx meta chars
    var match = location.search.match(new RegExp("[?&]"+key+"=([^&]+)(&|$)"));
    return match && decodeURIComponent(match[1].replace(/\+/g, " "));
}

