
LogProcessor = {};

LogProcessor.start_experiment = function() {
  var experiment_name = document.getElementById("experiment_name").value;
  Logging.log({ name: "ExperimentStart", experiment_name: experiment_name}); 
}

LogProcessor.stop_experiment = function() {
  var experiment_name = document.getElementById("experiment_name").value;
  Logging.log({ name: "ExperimentStop", experiment_name: experiment_name }); 
}

LogProcessor.show_experiment_results = function() {
  var experiment_name = document.getElementById("experiment_name").value;
  LogProcessor.parse(experiment_name);
  LogProcessor.add_plots();
  // LogProcessor.plot_all_time_entries();
}

LogProcessor.process = function() {
  LogProcessor.parse();
  // LogProcessor.plot_all_time_entries();
  // LogProcessor.compute_time_averages_by_group(["lerner"], ["lerner2"]);
  LogProcessor.add_plots();
}

LogProcessor.parse = function(experiment_name) {
  var start_times = {};
  LogProcessor.time_entries_by_user = {};
  LogProcessor.all_time_entries = [];
  var time_entries_by_user = LogProcessor.time_entries_by_user;
  var all_time_entries = LogProcessor.all_time_entries;
  var in_experiment = false;
  entries = document.getElementsByClassName("log_entry");
  var prev_time;
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
    if (experiment_name === "") {
      in_experiment = true;
    } else if (in_experiment) {
      if (msg_name === "ExperimentStop" && msg.experiment_name === experiment_name)
        in_experiment = false;
    } else {
      if (msg_name === "ExperimentStart" && msg.experiment_name === experiment_name)
        in_experiment = true;
    }
    if (!in_experiment) {
      continue;
    }
    if (msg_name === "PuzzleStart") {
      var puzzle_id = parseInt(msg.puzzle_id);
      if (start_times[user] === undefined) {
        start_times[user] = {}
      }
      if (start_times[user][puzzle_id] !== undefined) {
        console.log("NOTE: user " + user + " did not solve " + puzzle_id);
      } 
      start_times[user][puzzle_id] = time;
    }
    if (msg_name === "PuzzleSolved") {
      var puzzle_id = parseInt(msg.puzzle_id)
      if (start_times[user] === undefined || start_times[user][puzzle_id] === undefined) {
        alert("ERROR: PuzzleSolved without a PuzzleStart; " + 
              "user: " + user + "; " +
              "puzzle: " + puzzle_id);
      } else {
        var start = start_times[user][puzzle_id];
        var end = time;
        if (time_entries_by_user[user] === undefined) {
          time_entries_by_user[user] = [];
        }
        var user_time_entries = time_entries_by_user[user];
        var time_delta = (end-start)/1000;
        if (time_delta < 100) {
          user_time_entries.push({ puzzle_id: puzzle_id, time_delta: time_delta });
          all_time_entries.push({ user: user, puzzle_id: puzzle_id, time_delta: time_delta });
        }
        delete start_times[user][puzzle_id];
      }
    }
  }
  for (var user in start_times) {
    for (var puzzle_id in start_times[user]) {
      console.log("NOTE: user " + user + " did not solve " + puzzle_id);
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

LogProcessor.add_plots = function() {

  if (LogProcessor.user_names.length == 0) {
    return;
  }

  if (LogProcessor.chart_ui) {
    LogProcessor.chart_ui.remove()
  }

  var div = d3.select("body").append("div");
  LogProcessor.chart_ui = div;

  var u = div.append("div");

  u.selectAll("input")
    .data(LogProcessor.user_names)
    .enter()
    .append('label')
      .attr('for',function(d) { d })
      .text(function(d) { return d; })
    .append("input")
      .attr("type", "checkbox")
      .attr("id", function(d) { return d; });
      // .attr("onClick", "LogProcessor.plot_selected()");

  u.append("button")
    .text("Plot users")
    .attr("onClick", "LogProcessor.plot_users()");

  var a = div.append("div").text("A: ");

  a.selectAll("input")
    .data(LogProcessor.user_names)
    .enter()
    .append('label')
      .attr('for',function(d) { d + "-a"; })
      .text(function(d) { return d; })
    .append("input")
      .attr("type", "checkbox")
      .attr("id", function(d) { return d + "-a"; });
      // .attr("onClick", "LogProcessor.plot_selected()");

  a.append("button")
    .text("Plot Groups")
    .attr("onClick", "LogProcessor.plot_groups()");

  var b = div.append("div").text("B: ");

  b.selectAll("input")
    .data(LogProcessor.user_names)
    .enter()
    .append('label')
      .attr('for',function(d) { d + "-b"; })
      .text(function(d) { return d; })
    .append("input")
      .attr("type", "checkbox")
      .attr("id", function(d) { return d + "-b"; });
      // .attr("onClick", "LogProcessor.plot_selected()");

  document.getElementById(LogProcessor.user_names[0]).checked = true;

  // div.append("button")
  //   .text("Show All Entires")
  //   .attr("onClick", "LogProcessor.show_all_entries()");

  // LogProcessor.plot_selected();

}

LogProcessor.plot_users = function() {
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

LogProcessor.plot_groups = function() {
  var group_a = [];
  var group_b = [];
  LogProcessor.user_names.forEach(function (user) {
    if (document.getElementById(user + "-a").checked) {
      group_a.push(user)
    }
    if (document.getElementById(user + "-b").checked) {
      group_b.push(user)
    }
  });
  var data_a = LogProcessor.compute_time_averages_for_group(group_a, "Group A");
  var data_b = LogProcessor.compute_time_averages_for_group(group_b, "Group B");
  var data = LogProcessor.merge(data_a, data_b);
  LogProcessor.plot(data, "puzzle_id", "Time (s)");
}

LogProcessor.compute_time_averages_for_group = function(group, name) {
  var data  = [];
  var is_in_group = {};
  group.forEach(function (x) { is_in_group[x] = true });
  LogProcessor.all_time_entries.forEach(function (entry) {
    if (is_in_group[entry.user]) {
      var puzzle_id = entry.puzzle_id;
      var x = data[puzzle_id];
      if (x === undefined) {
        x = { puzzle_id: puzzle_id, sum: 0, count: 0};
        data[puzzle_id] = x;
      }
      x.count++;
      x.sum += entry.time_delta;
    }
  });
  for (var i = 0; i < data.length; i++) {
    var x = data[i];
    if (x === undefined) {
      x = { puzzle_id: i };
      x[name] = 0;
      data[i] = x;
    } else {
      var avg = x.sum / x.count;
      delete x.sum;
      delete x.count;
      x[name] = avg;
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

LogProcessor.plot = function(data, x_key, y_axis_label) {
  var margin = {top: 20, right: 20, bottom: 30, left: 40},
      width = document.body.clientWidth - margin.left - margin.right,
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
      .attr("width", x1.rangeBand())
      .attr("x", function(d) { return x1(d.name); })
      .attr("y", function(d) { return y(d.value); })
      .attr("height", function(d) { return height - y(d.value); })
      .style("fill", function(d) { return color(d.name); });

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

