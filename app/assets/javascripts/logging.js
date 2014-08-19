Logging = {}

Logging.log = function(message) {

  message.page = window.location.toString();

  $.ajax({   
    url: "/logs", 
    type: "POST",
    async: false,
    data: {message: message}, 
    success: function() {
      console.log("Success");
    }
  });

}
