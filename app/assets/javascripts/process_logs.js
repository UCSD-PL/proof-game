
LogProcessor = {};

LogProcessor.start_experiment = function() {
  var experiment_name = document.getElementById("experiment_name").value;
  Logging.log({ name: "ExperimentStart", experiment_name: experiment_name}); 
}

LogProcessor.stop_experiment = function() {
  var experiment_name = document.getElementById("experiment_name").value;
  Logging.log({ name: "ExperimentStop", experiment_name: experiment_name }); 
}

LogProcessor.show_experiment_results_from_ui = function() {
  var experiment_name = document.getElementById("experiment_name").value;
  var show_server_timings = document.getElementById("show_server_timings").checked;
  LogProcessor.show_experiment_results(experiment_name, show_server_timings);
}

LogProcessor.show_experiment_results = function(name, show_server_timings) {
  var experiment_name;
  if (arguments.length == 0) {
    experiment_name = document.getElementById("experiment_name").value;
  } else {
    experiment_name = name;
  }
  LogProcessor.parse(experiment_name, show_server_timings);
  LogProcessor.add_ui();
  // LogProcessor.plot_all_time_entries();
}

// LogProcessor.process = function() {
//   LogProcessor.parse();
//   LogProcessor.add_ui();
// }

LogProcessor.parse = function(experiment_name, show_server_timings) {
  function err_str(header, msg, user, puzzle_id) {
    var str = (header + ": " + msg + "; " +
               "user: " + user + "; " +
               "puzzle: " + puzzle_id);
    return str;
  };
  var start_times = {};
  LogProcessor.time_entries_by_user = {};
  LogProcessor.all_time_entries = [];
  LogProcessor.piece_connection_data = [];
  LogProcessor.double_click_data = [];
  LogProcessor.piece_connection_attempts = 0;
  LogProcessor.piece_connection_failed = 0;
  LogProcessor.double_click_attempts = 0;
  LogProcessor.double_click_failed = 0;

  var time_entries_by_user = LogProcessor.time_entries_by_user;
  var all_time_entries = LogProcessor.all_time_entries;
  var experiment_names = experiment_name.split(",").map(function (x) { return x.trim(); });
  var curr_experiment = "";
  entries = document.getElementsByClassName("log_entry");
  var prev_time;

  function add_time_entry(user, puzzle_id, time_delta) {
    if (time_entries_by_user[user] === undefined) {
      time_entries_by_user[user] = [];
    }
    var user_time_entries = time_entries_by_user[user];
    user_time_entries.push({ puzzle_id: puzzle_id, time_delta: time_delta });
    all_time_entries.push({ user: user, puzzle_id: puzzle_id, time_delta: time_delta });
  }

  for (var i = 0; i < entries.length; i++)  {
    entries[i].style.display = "none";
    var entry = entries[i].innerHTML;
    entry = entry.replace(/=&gt;/g, ":");
    entry = JSON.parse(entry);
    var msg = entry.message;
    var msg_name = msg.name;
    var user = entry.user;
    var time = Date.parse(entry.time);
    if (prev_time) {
      if (time-prev_time < 0) {
        alert("Time entries are not sorted. Results cannot be trusted. Aborting.");
        return;
      }
    }
    prev_time = time;
    if (experiment_names.length == 0) {
      curr_experiment = "All";
    } else if (msg_name === "ExperimentStart" && experiment_names.indexOf(msg.experiment_name) != -1) {
      if (curr_experiment !== "") {
        alert("ERROR: ExperimentStart " + curr_experiment + " followed by ExperimentStart " + msg.experiment_name);
        return;
      }
      curr_experiment = msg.experiment_name;
    } else if (msg_name === "ExperimentStop" && experiment_names.indexOf(msg.experiment_name) != -1) {
      if (curr_experiment !== msg.experiment_name) {
        alert("ERROR: ExperimentStart " + curr_experiment + " followed by ExperimentStop " + msg.experiment_name);
        return;
      }
      curr_experiment = "";
    }
    if (curr_experiment === "") {
      continue;
    }
    user = curr_experiment + "." + user;
    if (user.indexOf("gomez") === -1) {
      function get(arr, id) {
        if (arr[id] === undefined) {
          arr[id] = { puzzle_id: puzzle_id, failed: 0, attempts: 0}
        }
        return arr[id];
      }
      if (msg_name === "PieceConnectionFailed") {
        var puzzle_id = parseInt(msg.puzzle_id);
        var x = get(LogProcessor.piece_connection_data, puzzle_id);
        x.failed++;
        x.attempts++;
        if (puzzle_id > 13 && puzzle_id != 14 && puzzle_id != 17 && puzzle_id != 23 && puzzle_id != 26 && puzzle_id != 42) {
          LogProcessor.piece_connection_attempts++;
          LogProcessor.piece_connection_failed++;
        }
      } else if (msg_name === "PieceConnected") {
        var puzzle_id = parseInt(msg.puzzle_id);
        var x = get(LogProcessor.piece_connection_data, puzzle_id);
        x.attempts++;
        if (puzzle_id > 13 && puzzle_id != 14 && puzzle_id != 17 && puzzle_id != 23 && puzzle_id != 26 && puzzle_id != 42) {
          LogProcessor.piece_connection_attempts++;
        }
      } else if (msg_name === "FailedDoubleClickMatch") {
        var puzzle_id = parseInt(msg.puzzle_id);
        var x = get(LogProcessor.double_click_data, puzzle_id);
        x.failed++;
        if (puzzle_id > 13 && puzzle_id != 14 && puzzle_id != 17 && puzzle_id != 23 && puzzle_id != 26 && puzzle_id != 42 &&
            puzzle_id != 15 && puzzle_id != 16 && puzzle_id != 18 && puzzle_id != 19 && puzzle_id != 24 &&
            puzzle_id != 25 && puzzle_id != 27 && puzzle_id != 28 && puzzle_id != 43 && puzzle_id != 44) {
          LogProcessor.double_click_failed++;
        }
      } else if (msg_name === "DoubleClickShape_2") {
        var puzzle_id = parseInt(msg.puzzle_id);
        var x = get(LogProcessor.double_click_data, puzzle_id);
        x.attempts++;
        if (puzzle_id > 13 && puzzle_id != 14 && puzzle_id != 17 && puzzle_id != 23 && puzzle_id != 26 && puzzle_id != 42 &&
            puzzle_id != 15 && puzzle_id != 16 && puzzle_id != 18 && puzzle_id != 19 && puzzle_id != 24 &&
            puzzle_id != 25 && puzzle_id != 27 && puzzle_id != 28 && puzzle_id != 43 && puzzle_id != 44) {
          LogProcessor.double_click_attempts++;
        }
      }
    }

    if (msg_name === "PuzzleStart") {
      var puzzle_id = parseInt(msg.puzzle_id);
      // console.log(err_str("LOG", "PuzzleStart", user, puzzle_id));
      if (start_times[user] === undefined) {
        start_times[user] = {}
      }
      if (start_times[user][puzzle_id] !== undefined) {
        console.log(err_str("NOTE", "Two consecutive PuzzleStart", user, puzzle_id));
      } 
      start_times[user][puzzle_id] = time;
    }
    if (msg_name === "PuzzleSolved") {
      var puzzle_id = parseInt(msg.puzzle_id);
      // console.log(err_str("LOG", "PuzzleSolved", user, puzzle_id));

      // client-side
      if (msg.time_delta === undefined) {
        console.log(err_str("WARNING", "No client time_delta", user, puzzle_id));
      } else {
        add_time_entry(user, puzzle_id, msg.time_delta/1000);
      }

      // server-side
      if (start_times[user] === undefined || start_times[user][puzzle_id] === undefined) {
        alert(err_str("ERROR", "PuzzleSolved without a PuzzleStart", user, puzzle_id));
      } else {
        if (show_server_timings) {
          add_time_entry(user + "_s", puzzle_id, (time-start_times[user][puzzle_id])/1000);
        }
        delete start_times[user][puzzle_id];
      }
    }
  }
  for (var user in start_times) {
    for (var puzzle_id in start_times[user]) {
      console.log(err_str("NOTE", "PuzzleStart without PuzzleSolved", user, puzzle_id));
    }
  }
  LogProcessor.user_names = Object.keys(LogProcessor.time_entries_by_user);
  // for (user in time_entries_by_user) {
  //   time_entries_by_user[user].forEach(function (x) {
  //     console.log(x);
  //   });
  // }
}

LogProcessor.show_all_entries = function() {
  entries = document.getElementsByClassName("log_entry");
  for (var i = 0; i < entries.length; i++)  {
    entries[i].style.display = "";
  }
}  

// LogProcessor.compute_time_averages_by_group = function(group_a, group_b) {
//   LogProcessor.group_a_data = [];
//   LogProcessor.group_b_data = [];
//   var is_in_group_a = {};
//   group_a.forEach(function (x) { is_in_group_a[x] = true });
//   group_b.forEach(function (x) { is_in_group_a[x] = false });
//   var group_a_data = LogProcessor.group_a_data;
//   var group_b_data = LogProcessor.group_b_data;
//   LogProcessor.all_time_entries.forEach(function (entry) {
//     var data = is_in_group_a[entry.user] ? group_a_data : group_b_data;
//     var puzzle_id = entry.puzzle_id;
//     if (data[puzzle_id] === undefined) {
//       data[puzzle_id] = { sum: 0, count: 0};
//     }
//     data[puzzle_id].count++;
//     data[puzzle_id].sum += entry.time_delta;
//   });
//   group_a_data.forEach(function (x) { x.avg = x.sum / x.count });
//   group_b_data.forEach(function (x) { x.avg = x.sum / x.count });
//   console.log(group_a_data);
//   console.log(group_b_data);
// }

LogProcessor.add_ui = function() {

  if (LogProcessor.user_names.length == 0) {
    return;
  }

  if (LogProcessor.chart_ui) {
    LogProcessor.chart_ui.remove()
  }

  var chart_ui = d3.select("body").append("div");
  LogProcessor.chart_ui = chart_ui;

  chart_ui.append("div")
    .selectAll("input")
    .data(LogProcessor.user_names)
    .enter()
    .append('label')
      .attr('for',function(d) { d })
      .text(function(d) { return d; })
    .append("input")
      .attr("type", "checkbox")
      .attr("id", function(d) { return d; });
      // .attr("onClick", "LogProcessor.plot_selected()");

  var div = chart_ui.append("div");

  div.append("input")
    .attr("type", "text")
    .attr("id", "group-a");

  div.append("input")
    .attr("type", "text")
    .attr("id", "group-b");

  div.append("button")
    .text("Plot times")
    .attr("onClick", "LogProcessor.plot_group_times()");

  div.append("button")
    .text("Plot completion counts by problem")
    .attr("onClick", "LogProcessor.plot_group_counts()");

  // var a = div.append("div").text("A: ");

  // a.selectAll("input")
  //   .data(LogProcessor.user_names)
  //   .enter()
  //   .append('label')
  //     .attr('for',function(d) { d + "-a"; })
  //     .text(function(d) { return d; })
  //   .append("input")
  //     .attr("type", "checkbox")
  //     .attr("id", function(d) { return d + "-a"; });

  // a.append("button")
  //   .text("Plot Groups")
  //   .attr("onClick", "LogProcessor.plot_groups()");

  // var b = div.append("div").text("B: ");

  // b.selectAll("input")
  //   .data(LogProcessor.user_names)
  //   .enter()
  //   .append('label')
  //     .attr('for',function(d) { d + "-b"; })
  //     .text(function(d) { return d; })
  //   .append("input")
  //     .attr("type", "checkbox")
  //     .attr("id", function(d) { return d + "-b"; });

  LogProcessor.user_names.forEach(function(n) {
    document.getElementById(n).checked = true;
  });

  // document.getElementById("elizabeth_gomez").checked = false;

  // div.append("button")
  //   .text("Show All Entires")
  //   .attr("onClick", "LogProcessor.show_all_entries()");

  // LogProcessor.plot_selected();

}

LogProcessor.compute_groups = function(name_a, name_b) {
  var group_a = [];
  var group_b = [];
  LogProcessor.user_names.forEach(function (user) {
    if (document.getElementById(user).checked) {
      if (user.indexOf(name_a) != -1) {
        group_a.push(user);
      }
      if (user.indexOf(name_b) != -1) {
        group_b.push(user);
      }
    }
  });
  return {a: group_a, b: group_b };
}

LogProcessor.plot_counts = function() {
  var users = [];
  LogProcessor.user_names.forEach(function (user) { 
    if (document.getElementById(user).checked) {
      users.push(user)
    }  
  });
  var data = LogProcessor.compute_counts_for_group(users, "# groups completed");
  LogProcessor.plot(data, "puzzle_id", "# groups who completed");
}

LogProcessor.plot_group_counts = function(name_a, name_b) {
  name_a = name_a || document.getElementById("group-a").value;
  name_b = name_b || document.getElementById("group-b").value;
  var groups = LogProcessor.compute_groups(name_a, name_b);
  var data_a = LogProcessor.compute_counts_for_group(groups.a, name_a);
  var data_b = LogProcessor.compute_counts_for_group(groups.b, name_b);
  var data = LogProcessor.merge(data_a, data_b);
  LogProcessor.plot(data, "puzzle_id", "# groups who completed");
}

LogProcessor.plot_user_times = function() {
  var all_data;
  LogProcessor.user_names.forEach(function (user) {
    if (document.getElementById(user).checked) {
      var data = LogProcessor.compute_time_averages_for_group([user], user);
      if (all_data === undefined) {
        all_data = data;
      } else {
        all_data = LogProcessor.merge(all_data, data);
      }
    }
  });
  LogProcessor.plot(all_data, "puzzle_id", "Time (s)");
}

LogProcessor.plot_group_times = function(name_a,name_b) {
  name_a = name_a || document.getElementById("group-a").value;
  name_b = name_b || document.getElementById("group-b").value;
  var groups = LogProcessor.compute_groups(name_a, name_b);
  var data_a = LogProcessor.compute_time_averages_for_group(groups.a, name_a);
  var data_b = LogProcessor.compute_time_averages_for_group(groups.b, name_b);
  var data = LogProcessor.merge(data_a, data_b);
  LogProcessor.plot(data, "puzzle_id", "Time (s)");
}

// LogProcessor.compute_time_averages_for_group = function(group, name) {
//   var data  = [];
//   var is_in_group = {};
//   group.forEach(function (x) { is_in_group[x] = true });
//   LogProcessor.all_time_entries.forEach(function (entry) {
//     if (is_in_group[entry.user]) {
//       var puzzle_id = entry.puzzle_id;
//       var x = data[puzzle_id];
//       if (x === undefined) {
//         x = { puzzle_id: puzzle_id, sum: 0, count: 0};
//         data[puzzle_id] = x;
//       }
//       x.count++;
//       x.sum += entry.time_delta;
//     }
//   });
//   // for (var i = 0; i < data.length; i++) {
//   for (var i = 0; i < 45; i++) {
//     var x = data[i];
//     if (x === undefined) {
//       x = { puzzle_id: i };
//       x[name] = 0;
//       data[i] = x;
//     } else {
//       var avg = x.sum / x.count;
//       delete x.sum;
//       delete x.count;
//       x[name] = avg;
//     }
//   }
//   return data;
// }

LogProcessor.compute_time_averages_for_group = function(group, name) {
  return LogProcessor.compute_data_for_group(group, name, function(arr) {
    var i;
    while ((i = arr.indexOf(0)) !== -1) {
      console.log("NOTE: Removing zero entry from average (zero means DID NOT COMPLETE)");
      arr.splice(i, 1);
    }
    return arr.reduce(function(a, b) { return a + b }) / arr.length;
  });
}

LogProcessor.compute_counts_for_group = function(group, name) {
  return LogProcessor.compute_data_for_group(group, name, function(arr) {
    return arr.length/group.length;
  });
}

LogProcessor.compute_data_for_group = function(group, name, fold) {
  var data  = [];
  var is_in_group = {};
  group.forEach(function (x) { is_in_group[x] = true });
  LogProcessor.all_time_entries.forEach(function (entry) {
    if (is_in_group[entry.user]) {
      var puzzle_id = entry.puzzle_id;
      var time_delta = entry.time_delta;
      if (time_delta > 0) {
        var x = data[puzzle_id];
        if (x === undefined) {
          x = { puzzle_id: puzzle_id, time_deltas: [] };
          data[puzzle_id] = x;
        }
        x.time_deltas.push(time_delta);
      }
    }
  });
  // for (var i = 0; i < data.length; i++) {
  for (var i = 0; i < 45; i++) {
    var x = data[i];
    if (x === undefined) {
      x = { puzzle_id: i };
      x[name] = 0;
      data[i] = x;
    } else {
      var time_deltas = x.time_deltas;
      delete x.time_deltas;
      x[name] = fold(time_deltas);
    }
  }
  return data;
}

LogProcessor.merge = function(data1, data2) {
  data = [];
  for (i = 0; i < Math.min(data1.length, data2.length); i++) {
    var d1 = data1[i];
    var d2 = data2[i];
    var d = {};
    for (n in d1) {
      d[n] = d1[n];
    }
    for (n in d2) {
      if (n in d && d[n] !== d2[n]) {
        console.log("WARNING: common field in merge doesn't have same value")
        console.log(n);
        console.log(d[n]);
        console.log(d2[n]);
      }
      d[n] = d2[n];
    }
    data[i] = d;
  }
  return data;
}

LogProcessor.plot_all_time_entries = function() {

  var data = LogProcessor.all_time_entries;

  var x = d3.scale.linear()
    .domain([0, d3.max(data, function(d) { return d.time_delta })])
    .range([0, 800]);

  var all_colors = ["red", "steelblue"];
  var user_colors = {};
  var curr_color = 0;
  LogProcessor.all_time_entries.forEach(function (d) {
    if (!(d.user in user_colors)) {
      user_colors[d.user] = all_colors[curr_color];
      curr_color = (curr_color + 1) % all_colors.length;
    }
  });

  d3.select("body")
    .append("div")
    .selectAll(".bar")
      .data(data)
    .enter().append("div")
      .attr("class", "horizontal-bar")
      .style("background-color", function(d) { return user_colors[d.user]; })
      .style("width", function(d) { return x(d.time_delta) + "px"; })
      .text(function(d) { return d.user + ": #" + d.puzzle_id + " in " + d.time_delta + "s"; });

}

LogProcessor.print_data = function(data) {
  var keys = d3.keys(data[0]);
  console.log(keys.join(" ") + "\n" + 
              data.map(function(d) {
                return keys.map(function(name) { return String(d[name]) }).join(" ");
              }).join("\n"));
}
LogProcessor.plot = function(data, x_key, y_axis_label) {
  LogProcessor.print_data(data);

  var margin = {top: 20, right: 20, bottom: 30, left: 40},
      width = (document.body.clientWidth*1.0) - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

  var x0 = d3.scale.ordinal()
      .rangeRoundBands([0, width], .3);

  var x1 = d3.scale.ordinal();

  var y = d3.scale.linear()
      .range([height, 0]);

  var color = d3.scale.ordinal()
      .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

  var xAxis = d3.svg.axis()
      .scale(x0)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .tickFormat(d3.format(".2s"));

  if (LogProcessor.chart_svg) {
    LogProcessor.chart_svg.remove();
  }
  
  LogProcessor.chart_svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  
  var svg = LogProcessor.chart_svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var y_keys = d3.keys(data[0]).filter(function(key) { return key !== x_key; });

  data.forEach(function(d) {
    d.y_values = y_keys.map(function(name) { return {name: name, value: +d[name]}; });
  });

  x0.domain(data.map(function(d) { return d[x_key]; }));
  x1.domain(y_keys).rangeRoundBands([0, x0.rangeBand()]);
  y.domain([0, d3.max(data, function(d) { return d3.max(d.y_values, function(d) { return d.value; }); })]);

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text(y_axis_label);

  var plot = svg.selectAll(".plot")
      .data(data)
    .enter().append("g")
      .attr("class", "g")
      .attr("transform", function(d) { return "translate(" + x0(d[x_key]) + ",0)"; });

  plot.selectAll("rect")
      .data(function(d) { return d.y_values; })
    .enter().append("rect")
      .attr("class", "bar")
      .attr("width", x1.rangeBand())
      .attr("x", function(d) { return x1(d.name); })
      .attr("y", function(d) { return y(d.value); })
      .attr("height", function(d) { return height - y(d.value); })
      .style("fill", function(d) { return color(d.name); })
      .append("svg:title")
        .text(function (d) { return d.name + ": " + Math.round(d.value) ; });

  var legend = svg.selectAll(".legend")
      .data(y_keys.slice())
    .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

  legend.append("rect")
      .attr("x", width - 18)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", color);

  legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(function(d) { return d; });

  data.forEach(function(d) {
    delete d.y_values;
  });

}

