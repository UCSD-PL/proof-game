
Exercises = { }

Exercises.start = function(range_name) {
  Game.init_puzzle_db();
  Exercises.puzzle_range = Game.puzzle_ranges[range_name];
  Crafty.init(1300, 600);
  Crafty.background('rgb(240,240,240)');

  Crafty.e("Keyboard").bind("KeyDown", function(e) {
    if(this.isDown(Crafty.keys.P) && 
       this.isDown(Crafty.keys.L) &&
       this.isDown(Crafty.keys.K)) {
      Exercises.solved_puzzle(false);
    }
  });

  // Exercises.problems = [];
  
  // Exercises.set_1 = Exercises.mark_puzzle_index();
  // Exercises.add_puzzle("|- imp(y,y)"); // puzzle 14 in game
  // Exercises.add_puzzle("y |- imp(x,y)");
  // Exercises.add_puzzle("imp(x,imp(y,x))");
  // Exercises.add_puzzle("x, y |- imp(y,x)");

  // // Transition problem to learn new rule: "y |- and(y, y)", puzzle 18 in game
  // Exercises.set_2 = Exercises.mark_puzzle_index();
  // Exercises.add_puzzle("x, y |- and(x, y)"); // puzzle 19 in game
  // Exercises.add_puzzle("z, x |- imp(y, z)");
  // Exercises.add_puzzle("z |- imp(y, and(y, z))");
  // Exercises.add_puzzle("z |- and(imp(x, x), z)");
  // Exercises.add_puzzle("|- imp(z, and(z, imp(x, x)))");

  // // Transition problem to learn new rule: and(y, x) |- y, puzzle 24
  // Exercises.set_3 = Exercises.mark_puzzle_index();
  // Exercises.add_puzzle("|- imp(and(z, y), z)"); // puzzle 25 in game
  // Exercises.add_puzzle("and(z,y), x |- and(x, z)");

  // // Transition problem to learn new rule: and(x, z) |- z, puzzle 27 in game
  // Exercises.set_4 = Exercises.mark_puzzle_index();
  // Exercises.add_puzzle("and(z,y) |- z"); // puzzle 28 in game
  // Exercises.add_puzzle("and(y,x) |- x");
  // Exercises.add_puzzle("and(x,y) |- and(y, x)");

  Exercises.current_puzzle = Exercises.puzzle_range.start;
  Exercises.start_current_puzzle();
};

Exercises.confirm = function(prompt_str, confirm_str) {
  var str =
    'Please type "' + confirm_str + '" ' + 
    'and click OK to confirm that ' + prompt_str + ', ' +
    'or click Cancel to return.';
  var str_long = 'You typed the wrong string. ' + str;
  while (true) {
    response = window.prompt(str, '');
    if (response === null)
      return false;
    if (response === confirm_str)
      return true;
    str = str_long;
  }
}

Exercises.solved_puzzle = function(do_confirm) {
  if (Exercises.current_puzzle < Exercises.puzzle_range.end) {
    if (do_confirm && !Exercises.confirm("you solved this problem", "I solved it!")) {
      return;
    }
    console.log("Solved puzzle " + Exercises.current_puzzle);
    Logging.log({ name: "PuzzleSolved", puzzle_id: Exercises.current_puzzle });
    Exercises.current_puzzle++;
    Exercises.text.destroy();
    setTimeout(Exercises.start_current_puzzle, 1000);
  }
};

Exercises.skip_puzzle = function() {
  if (Exercises.current_puzzle < Exercises.puzzle_range.end) {
    if (!Exercises.confirm("you want to skip this problem", "I want to skip it!")) {
      return;
    }
    console.log("Skipped puzzle " + Exercises.current_puzzle);
    Logging.log({ name: "PuzzleSkip", puzzle_id: Exercises.current_puzzle });
    Exercises.current_puzzle++;
    Exercises.text.destroy();
    setTimeout(Exercises.start_current_puzzle, 1000);
  }
};

// Exercises.prev_puzzle = function() {
//     if (Exercises.current_puzzle > Exercises.puzzle_range.start)
//         Exercises.current_puzzle--;
//     Exercises.start_current_puzzle();
// };

Exercises.judgement_to_str = function(j) {
  return j.left.map(function (e) { return e.to_string(); }).join(", ") +
    " " + Globals.VarToLogicRep.turnstile + " " + j.right.to_string();
};

Exercises.start_current_puzzle = function() {
  var display_str;
  if (Exercises.current_puzzle >= Exercises.puzzle_range.start &&
      Exercises.current_puzzle < Exercises.puzzle_range.end) {
    console.log("Starting puzzle " + Exercises.current_puzzle);
    Logging.log({ name: "PuzzleStart", puzzle_id: Exercises.current_puzzle });
    var j = build_judgement(Game.puzzles[Exercises.current_puzzle].goal);
    display_str = Exercises.judgement_to_str(j);
  }
  else {
    display_str = "You finished the puzzles in this session!";
  }
  Exercises.text = 
    Crafty.e("2D, DOM, Text")
    .attr({ x: 100, y: 100, w: 800 })
    .text(display_str)
    .textFont({ size: '50px' });

}
