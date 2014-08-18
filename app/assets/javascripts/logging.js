Logging = {}

Logging.log = function(message) {

  message.page = window.location.toString();

  $.ajax({   
    url: "/logs", 
    type: "POST",
    data: {message: message}, 
    success: function() {
      console.log("Success");
    }
  });

}
