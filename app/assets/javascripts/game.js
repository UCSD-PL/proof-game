/**************************************************/
//
// Globals
//
/**************************************************/

Globals = {

    VarToShape : { a: "wedge", 
                   b: "tee",
                   c: "sqcap", 
                   empty: "sqcap",
                   imp: "cup", 
                   and: "vee"},
    LeftColor: "rgb(255,255,200)",
    LeftColorSelected: "rgb(130,130,130)",
    RightColor: "rgb(255,230,255)",
    RightColorSelected: "rgb(130,130,130)",
    FormulaWidth: 200,
    JudgementHeight: 50,
    XSpaceBetweenJudgements: 20,
    YTopBufferSpace: 40,
    YBottomBufferSpace: 20,
    MaxSingleVarWidth: 50
}

/**************************************************/
//
// Inference rule
//
/**************************************************/

function InferenceRule(top, bottom) {
    this.top = top;
    this.bottom = bottom;
    for (var i = 0; i < top.length; i++) {
        top[i].set_inference_rule(this);
    }
    bottom.set_inference_rule(this);
}

InferenceRule.prototype.place = function(x,y) {
    var top = this.top;
    var bottom = this.bottom;
    var curr_x = x;
    for (var i = 0; i < top.length; i++) {
        top[i].set_orientation(true);
        top[i].place(curr_x, y);
        curr_x = curr_x + top[i].judgement.get_width() + Globals.XSpaceBetweenJudgements;
    }
    var top_w = top.length == 0 ? 0 : (curr_x - Globals.XSpaceBetweenJudgements - x);
    var bottom_w = bottom.judgement.get_width();
    bottom.set_orientation(false);
    var bottom_x = x + (top_w - bottom_w)/2;
    bottom.place(bottom_x > x ? bottom_x : x , y + Globals.JudgementHeight+ Globals.YTopBufferSpace);
}

InferenceRule.prototype.make_fresh = function() {
    MetaVarManager.start_fresh();
    this.top.map(function (e) { e.make_fresh() });
    this.bottom.make_fresh();
}

InferenceRule.prototype.apply = function(s) {
    this.top.map(function (e) { e.apply(s) });
    this.bottom.apply(s);
}

InferenceRule.prototype.destroy = function() {
    this.top.map(function (e) { e.destroy() });
    this.bottom.destroy();
}

InferenceRule.prototype.foreach_piece = function(f) {
    this.top.map(function (e) { f(e) });
    f(this.bottom);
}
// InferenceRule.prototype.get_top_width = function() {
//     var top = this.top;
//     if (top.length == 0) { return 0 }
//     var result = 0;
//     for (var i = 0; i < top.length; i++) {
//         result = result + top[i].get_width() + Globals.XSpaceBetweenJudgements;
//     }
//     return result - Globals.XSpaceBetweenJudgements;
// }

// InferenceRule.prototype.get_bottom_width = function() {
//     if (this.bottom == null) {
//         return 0;
//     } else {
//         return this.bottom.get_width();
//     }
// }

// InferenceRule.prototype.get_width = function() {
//     var top_w = this.get_top_width();
//     var bottom_w = this.get_bottom_width();
//     return (top_w > bottom_w) ? top_w : bottom_w;
// }

// InferenceRule.prototype.get_height = function() {
//     var result = 0;
//     if (this.top.length != 0) {
//         result = result + Globals.JudgementHeight;
//     }
//     if (this.bottom != null) {
//         result = result + Globals.JudgementHeight;
//     }
//     return result;
// }

// InferenceRule.prototype.draw = function(t, x, y) {
//     var top = this.top;
//     var bottom = this.bottom;
//     var top_w = this.get_top_width();
//     var bottom_w = this.get_bottom_width();
//     var w = (top_w > bottom_w) ? top_w : bottom_w;
//     var curr_x = x + (w-top_w)/2;
//     t.inference_rule = this;
//     this.clear_meta_var_locs();
//     for (var i = 0; i < this.top.length; i++) {
//         top[i].draw_on_top(t, curr_x, y);
//         curr_x = curr_x + top[i].get_width() + Globals.XSpaceBetweenJudgements;
//     }
//     if (bottom != null) {
//         curr_x = x + (w-bottom_w)/2;
//         bottom.draw_on_bottom(t, curr_x, y + Globals.JudgementHeight);
//     }
//     for (var i = 0; i < this.meta_var_locs.length; i++) {
//         var meta_var_loc = this.meta_var_locs[i];
//         var c = t.c;
//         c.lineWidth = 5;
//         c.strokeStyle = Globals.MetaVarToColor[meta_var_loc.n];
//         c.beginPath();
//         t.move_to(meta_var_loc.x, meta_var_loc.y);
//         t.up(15);
//         t.right(meta_var_loc.w);
//         t.down(15);
//         c.stroke();
//     }
// }


/**************************************************/
//
// Judgement
//
/**************************************************/

function Judgement(left, right) {
    this.left = left;
    this.right = right;
}

Judgement.prototype.get_width = function() {
    return this.get_left_width()+ this.get_right_width();
}

Judgement.prototype.get_left_width = function () {
    return this.left.length * Globals.FormulaWidth;
}

Judgement.prototype.get_right_width = function () {
    return Globals.FormulaWidth;
}

Judgement.prototype.draw_on_top = function(t, x, y, selected) {
    var c = t.c;
    var left = this.left;
    var right = this.right;
    var left_w = this.get_left_width();
    var right_w = this.get_right_width();
    var h = Globals.JudgementHeight;
    // var right_w = w / (left.length + 1);
    // var left_w = w - right_w;

    t.judgement = this;
    this.clear_meta_var_locs();

    c.lineWidth = 2;
    c.strokeStyle = "rgb(0,0,0)";

    // left
    c.fillStyle = selected ? Globals.LeftColorSelected : Globals.LeftColor;
    c.beginPath();
    t.move_to(x, y);
    for (var i = 0; i < left.length; i++) {
        var item_width = left_w / left.length;
        if (i == 0) {
            item_width = left_w - (item_width * (left.length-1));
        }
        left[i].draw(t, item_width, true);
    }
    t.down(h);
    t.line_to_x(x);
    t.up(h);
    c.fill()
    c.stroke();

    // right
    c.fillStyle = selected ? Globals.RightColorSelected : Globals.RightColor;
    c.beginPath();
    t.move_to(x + left_w, y);
    right.draw(t, right_w, true);
    t.down(h);
    t.line_to_x(x + left_w);
    t.up(h);
    c.fill()
    c.stroke();

    for (var i = 0; i < this.meta_var_locs.length; i++) {
        var meta_var_loc = this.meta_var_locs[i];
        var c = t.c;
        c.lineWidth = 5;
        c.strokeStyle = MetaVarManager.get_meta_var_color(meta_var_loc.n);
        c.beginPath();
        t.move_to(meta_var_loc.x, meta_var_loc.y);
        t.up(15);
        t.right(meta_var_loc.w);
        t.down(15);
        c.stroke();
    }
}

Judgement.prototype.draw_on_bottom = function(t, x, y, selected) {
    var c = t.c;
    var left = this.left;
    var right = this.right;
    var left_w = this.get_left_width();
    var right_w = this.get_right_width();
    var h = Globals.JudgementHeight;
    // var right_w = w / (left.length + 1)
    // var left_w = w - right_w;

    t.judgement = this;
    this.clear_meta_var_locs();

    c.lineWidth = 2;
    c.strokeStyle = "rgb(0,0,0)";

    // left
    c.fillStyle = selected ? Globals.LeftColorSelected : Globals.LeftColor;
    c.beginPath();
    t.move_to(x, y);
    t.down(h);
    for (var i = 0; i < left.length; i++) {
        var item_width = left_w / left.length;
        if (i == 0) {
            item_width = left_w - (item_width * (left.length-1));
        }
        left[i].draw(t, item_width, false);
    }
    t.up(h);
    t.line_to_x(x);
    c.fill()
    c.stroke();

    // right
    c.fillStyle = selected ? Globals.RightColorSelected : Globals.RightColor;
    c.beginPath();
    t.move_to(x + left_w, y);
    t.down(h);
    right.draw(t, right_w, false);
    t.up(h);
    t.line_to_x(x + left_w);
    c.fill()
    c.stroke();

    for (var i = 0; i < this.meta_var_locs.length; i++) {
        var meta_var_loc = this.meta_var_locs[i];
        var c = t.c;
        c.lineWidth = 5;
        c.strokeStyle = MetaVarManager.get_meta_var_color(meta_var_loc.n);
        c.beginPath();
        t.move_to(meta_var_loc.x, meta_var_loc.y);
        t.up(15);
        t.right(meta_var_loc.w);
        t.down(15);
        c.stroke();
    }
}

Judgement.prototype.clear_meta_var_locs = function () {
    this.meta_var_locs = [];
}

Judgement.prototype.add_meta_var_loc = function (n, x, y, w, on_top) {
    this.meta_var_locs.push({n: n, x: x, y: y, w: w, on_top: on_top});
}

Judgement.prototype.make_fresh = function() {
    this.left = this.left.map(function (e) { return MetaVarManager.fresh_tree(e) });
    this.right = MetaVarManager.fresh_tree(this.right);
}

Judgement.prototype.apply = function(s) {
    this.left = this.left.map(function (e) { return apply_to_tree(e, s) });
    this.right = apply_to_tree(this.right, s);
}

Judgement.prototype.unify = function(other) {
    if (this.left.length != other.left.length)  return false;
    var s = unify_trees(this.right, other.right, {});
    if (s === false) return false;
    for (var i = 0; i < this.left.length; i++) {
        s = unify_trees(this.left[i], other.left[i], s);
        if (s === false) return false;
    }
    return s
}

Judgement.prototype.add_live_vars = function(live_vars) {
    this.left.map(function (e) { add_live_vars(e, live_vars) });
    add_live_vars(this.right, live_vars);
}
/**************************************************/
//
// Tree
//
/**************************************************/

function Tree(n, left, right) {
    this.n = n;
    this.left = left;
    this.right = right;
}

function Var(n) {
    return new Tree(n, null, null);
}

function BinExpr(n, left, right) {
    return new Tree(n, left, right);
}

Tree.prototype.is_meta_var = function() {
    if (this.left != null || this.right != null) { return false; }
    var c = this.n[0];
    return c.toUpperCase() == c;
}

Tree.prototype.toString = function() {
    if (this.left == null && this.right == null) {
        return this.n
    }
    if (this.left != null && this.right == null) {
        return this.n + "(" + this.left.toString() + ")"
    }
    if (this.left == null && this.right != null) {
        return this.n + "(" + this.right.toString() + ")"
    }
    return this.n + "(" + this.left.toString() + ", " + this.right.toString() + ")"
}

Tree.prototype.draw = function(t, w, on_top) {
    if (this.left == null && this.right == null) {
        var token_width = w * 0.60;
        if (token_width > Globals.MaxSingleVarWidth && !this.is_meta_var()) {
            token_width = Globals.MaxSingleVarWidth
        }
        var space_width = (w - token_width)/2;
        var space1 = space_width;
        var space2 = w - token_width - space1;
        t.right(space1);
        if (this.is_meta_var()) {
            t.judgement.add_meta_var_loc(this.n, t.x, t.y, token_width, on_top);
            t.flatsqcap(token_width);
        } else {
            t[Globals.VarToShape[this.n]](token_width);
        }
        t.right(space2);
    } else if (this.left == null) {
    } else {
        var bin_op_width = w * 0.15;
        var space_width = w * 0.15;
        var sub_expr_space = (w - bin_op_width - (space_width * 2))/2;
        var space1 = space_width;
        var space2 = w - space_width - bin_op_width - (sub_expr_space*2);
        t.right(space1);
        t.up(space_width/2);
        this.left.draw(t, sub_expr_space, on_top);
        t[Globals.VarToShape[this.n]](bin_op_width);
        this.right.draw(t, sub_expr_space, on_top);
        t.down(space_width/2);
        t.right(space2);

        if (on_top) {
            t.left(space2);
            t.down(space_width);
            t.left(bin_op_width + (sub_expr_space*2));
            t.up(space_width);
            t.down(space_width);
            t.right(bin_op_width + (sub_expr_space*2));
            t.up(space_width);
            t.right(space2);
        }
    }
}

function apply_to_tree(t, s) {
    if (t == null) 
        return null;
    if (!t.is_meta_var()) 
        return new Tree(t.n, apply_to_tree(t.left, s), apply_to_tree(t.right, s));
    if (t.n in s) 
        return apply_to_tree(s[t.n], s);
    return Var(t.n);
}

function unify_trees(a, b, s) {
    if (a == null && b == null) return s;
    else if (a != null && b == null) return false;
    else if (a == null && b != null) return false;
    var a = apply_to_tree(a, s);
    var b = apply_to_tree(b, s);
    var result = {};
    for (var attr in s) { result[attr] = s[attr] }
    if (a.is_meta_var() && b.is_meta_var())
      result[a.n] = b;
    else if (a.is_meta_var() && !b.is_meta_var())
      if (a.n in result)
         result = unify_trees(result[a.n], b, result);
      else
         result[a.n] = b;
    else if (!a.is_meta_var() && b.is_meta_var())
      return unify_trees(b,a,s);
    else if (!a.is_meta_var() && !b.is_meta_var()) {
        if (a.n != b.n) return false;
        result = unify_trees(a.left, b.left, result);
        if (result === false) return false;
        result = unify_trees(a.right, b.right, result);
    }
    return result;
}

function add_live_vars(t, live_vars) {
    if (t == null) return;
    if (t.is_meta_var()) {
        live_vars[t.n] = true;
        return;
    }
    add_live_vars(t.left, live_vars);
    add_live_vars(t.right, live_vars);
}

// sorin1 = BinExpr("imp", Var("A"), Var("B"));
// sorin2 = {A: BinExpr("imp", Var("a"), Var("b")), B: Var("c")};
// sorin3 = apply_subst(sorin1, sorin2);
// sorin4 = unify_trees(sorin1, sorin3, {});
// sorin5 = BinExpr("imp", Var("A"), BinExpr("imp", Var("a"), Var("b")));
// sorin6 = BinExpr("imp", BinExpr("and", Var("x"), Var("y")), Var("C"));
// sorin7 = unify_trees(sorin5, sorin6, {});

// Tree.prototype.draw = function(t, w) {
//     if (this.left == null && this.right == null) {
//         t[VarToShape[this.n]](w);
//     } else if (this.left == null) {
//     } else {
//         var token_width = w * 0.20;
//         var space_width = (w - (token_width*3))/4;
//         var space1 = space_width;
//         var space2 = space_width;
//         var space3 = space_width;
//         var space4 = w - (token_width*3) - space1 - space2 - space3;
//         t.up(10);
//         t.right(space1);
//         this.left.draw(t, token_width);
//         t.right(space2);
//         t[VarToShape[this.n]](token_width);
//         t.right(space3);
//         this.right.draw(t, token_width);
//         t.right(space4);
//         t.down(10);
//     }
// }

/**************************************************/
//
// Turtle
//
/**************************************************/

function Turtle(c) {
    this.c = c;
    this.x = 0;
    this.y = 0;
}
    
Turtle.prototype.line_to_x = function (x) {
    this.c.lineTo(x, this.y);
    this.x = x;
}
Turtle.prototype.right = function (dx) {
    this.line_to_x(this.x + dx);
}
Turtle.prototype.left = function (dx) {
    this.line_to_x(this.x - dx);
}
Turtle.prototype.line_to_y = function (y) {
    this.c.lineTo(this.x, y);
    this.y = y;
}
Turtle.prototype.down = function (dy) {
    this.line_to_y(this.y + dy);
}
Turtle.prototype.up = function (dy) {
    this.line_to_y(this.y - dy);
}
Turtle.prototype.cup = function (w) {
    var r = w/2;
    var c = this.c;
    var x = this.x;
    var y = this.y;
    var endx = x + w;
    c.arcTo(x+r, y + (20*r), endx, y, r);
    c.lineTo(endx, y);
    this.x = endx;
}
Turtle.prototype.cap = function (w) {
    var r = w/2;
    var c = this.c;
    var x = this.x;
    var y = this.y;
    var endx = x + w;
    c.arcTo(x+r, y - (20*r), endx, y, r);
    c.lineTo(endx, y);
    this.x = endx;
}
Turtle.prototype.wedge = function (w) {
    var c = this.c;
    var x = this.x;
    var y = this.y;
    var endx = x + w;
    c.lineTo(x+(w/2), y - (w*0.75));
    c.lineTo(endx, y);
    this.x = endx;
}
Turtle.prototype.vee = function (w) {
    var c = this.c;
    var x = this.x;
    var y = this.y;
    var endx = x + w;
    c.lineTo(x+(w/2), y + (w*0.75));
    c.lineTo(endx, y);
    this.x = endx;
}
Turtle.prototype.tee = function (w) {
    var c = this.c;
    var x = this.x;
    var y = this.y;
    var endx = x + w;
    var lower_w = w * 0.40;
    var lower_l = x + (w/2) - (lower_w/2);
    var lower_r = x + (w/2) + (lower_w/2);
    var upper_w = w;
    var upper_l = x + (w/2) - (upper_w/2);
    var upper_r = x + (w/2) + (upper_w/2);
    var upper_h = w*0.75;
    var lower_h = w*0.40;
    c.lineTo(lower_l, y);
    c.lineTo(lower_l, y - lower_h);
    c.lineTo(upper_l, y - lower_h);
    c.lineTo(upper_l, y - upper_h);
    c.lineTo(upper_r, y - upper_h);
    c.lineTo(upper_r, y - lower_h);
    c.lineTo(lower_r, y - lower_h);
    c.lineTo(lower_r, y);
    c.lineTo(endx, y);
    this.x = endx;
}
Turtle.prototype.sqcap = function (w) {
    var h = 0.75*w;
    this.up(h);
    this.right(w);
    this.down(h);
}
Turtle.prototype.sqcup = function (w) {
    var h = 0.75*w;
    this.down(h);
    this.right(w);
    this.up(h);
}
Turtle.prototype.flatsqcap = function (w) {
    var h = 15;
    this.up(h);
    this.right(w);
    this.down(h);
}
Turtle.prototype.move_to = function(x,y) {
    this.c.moveTo(x,y);
    this.x = x;
    this.y = y;
}


// function draw_upper_triangle(c, x, y, w) {
//     c.lineTo(x+(w/2), y+w);
//     c.lineTo(x+w, y);
// }

// function draw_lower_circle(c, x, y, w) {
//     var r = w/2;
//     c.arcTo(x+(w/2), y + (20*r), x+w, y, r);
//     c.lineTo(x+w, y);
// }


Crafty.c('JudgementPuzzlePiece', {
    ready: true,
    /*
     * Initialize the component.
     */
    init: function() {
        this.requires("2D, Canvas, Mouse, Draggable");
        //this.addComponent("2D, Canvas, Fourway, Mouse, Tween, Draggable");

        this.judgement = null;
        this.inference_rule = null;
        this.connected = null;
        this.selected = false;
        this.on_top = true;

        var self = this;
        this.bind("StartDrag", function(e) {
            self.drag_x = e.clientX;
            self.drag_y = e.clientY;
            self.open_on_bottom = [];
            Game.foreach_piece(function(p) { 
                if (p.connected == null && !p.on_top) 
                    self.open_on_bottom.push(p);
            });
            self.open_on_top = [];
            Game.foreach_piece(function(p) { 
                if (p.connected == null && p.on_top) 
                    self.open_on_top.push(p);
            });
        });
        this.bind("StopDrag", function(e) {
            var selected_bottom = null;
            var selected_top = null;
            for (var i = 0; i < self.open_on_bottom.length; i++) {
                var bottom = self.open_on_bottom[i];
                if (bottom.selected) 
                    selected_bottom = selected_bottom == null ? bottom : "more than one";
                bottom.set_selected(false);
            }
            for (var i = 0; i < self.open_on_top.length; i++) {
                var top = self.open_on_top[i];
                if (top.selected) 
                    selected_top = selected_top == null ? top : "more than one";
                top.set_selected(false);
            }
            if (selected_bottom != null && selected_bottom != "more than one" &&
                selected_top != null && selected_top != "more than one") {
                selected_bottom.connect_if_match(selected_top)
            };
            // if (!self.selected) 
            //     Game.foreach_piece(function(p) { p.set_selected(false) });
            // var other = null;
            // Game.foreach_piece(function(p) { 
            //     if (p != self && p.selected)
            //         other = other == null ? p : "more than one"
            //     p.set_selected(false)
            // });
            // if (other != null && other != "more than one") {
            //     self.connect_if_match(other)
            // }
        });
        this.bind("Dragging", function(e) {
            var dx = (e.clientX - self.drag_x) / Crafty.viewport._zoom;
            var dy = (e.clientY - self.drag_y) / Crafty.viewport._zoom;

            if (self.on_top) {
                if (self.connected != null) {
                    self.connected.move_from_bottom(dx, dy);
                }
                if (self.inference_rule != null) {
                    //self.inference_rule.bottom.move_from_top(0, dy);
                    self.inference_rule.bottom.move_from_top(dx, dy);
                    for (var i = 0; i < this.inference_rule.top.length; i++) {
                        var other = self.inference_rule.top[i];
                        if (other != self) {
                            //other.move_from_bottom(0, dy);
                            other.move_from_bottom(dx, dy);
                        }
                    }
                }
            } else {
                if (self.connected != null) {
                    //self.connected.move_from_top_adjusted(dx, dy);
                    self.connected.move_from_top(dx, dy);
                }
                if (self.inference_rule != null) {
                    for (var i = 0; i < this.inference_rule.top.length; i++) {
                        self.inference_rule.top[i].move_from_bottom(dx, dy);
                    }
                }
                
            }

            for (var i = 0; i < self.open_on_bottom.length; i++) {
                var bottom = self.open_on_bottom[i];
                bottom.set_selected(false);
                for (var j = 0; j < self.open_on_top.length; j++) {
                    var top = self.open_on_top[j];
                    top.set_selected(false);
                    if (top.superficial_match(bottom)) {
                        var delta = top.distance_from_other(bottom);
                        if (Math.abs(delta.x) < 30 && Math.abs(delta.y) < 30) {
                            top.set_selected(true);
                            bottom.set_selected(true);
                        }
                    }
                }
            }
            
            // var selected_some = false;
            // Game.foreach_piece(function(other) { 
            //     if (self != other) { 
            //         var delta = self.distance_from_other(other);
            //         if (Math.abs(delta.x) < 30 && Math.abs(delta.y) < 30) {
            //             if (self.superficial_match(other)) {
            //                 other.set_selected(true);
            //                 selected_some = true;
            //             }
            //         } else {
            //             other.set_selected(false);
            //         }
            //     }
            // });
            // self.set_selected(selected_some);

            // ids = Crafty("JudgementPuzzlePiece");
            // for (var i = 0; i < ids.length; i++) {
            //     Crafty(ids[i]).visited = false;
            // }
            // this.visited = true;
            // if (this.inference_rule != null) {
            //     //var adjusted_dx = this.on_top && (!this.inference_rule.visited)? 0 : dx;
            //     var adjusted_dx = dx;
            //     this.inference_rule.bottom.visit_and_move(adjusted_dx,dy);
            //     for (var i = 0; i < this.inference_rule.top.length; i++) {
            //         this.inference_rule.top[i].visit_and_move(adjusted_dx,dy);
            //     }
            // }
            // if (this.connected != null) {
            //     this.connected.visit_and_move(dx, dy)
            // }

            self.drag_x = e.clientX;
            self.drag_y = e.clientY;
        });

        // self.dragging = false;
        // this.bind("MouseDown", function(e) {
        //     self.dragging = true;
        //     self.drag_x = e.x;
        //     self.drag_y = e.y
        //     console.log("MouseDown");
        // });
        // this.bind("MouseMove", function(e) {
        //     if (self.dragging) {
        //         var delta_x = e.x - self.drag_x;
        //         var delta_y = e.y - self.drag_y;
        //         self.connected_move(delta_x, delta_y);
        //         // self.x = self.x + delta_x;
        //         // self.y = self.y + delta_y;
        //         self.drag_x = e.x;
        //         self.drag_y = e.y;
        //         console.log("Drag");
        //     }
        // });
        // this.bind("MouseUp", function(e) {
        //     self.dragging = false;
        //     console.log("MouseUp");
        // });
        // this.bind("Click", function(e) {
        //     console.log("Click");
        //     console.log(e);
        // });
        this.bind("Draw", function(obj) {
            // Pass the Canvas context and the drawing region.
            this._draw(obj.ctx, obj.pos);
        });
    },
    _draw: function(c, pos) {
        var x = pos._x + 1;
        var y = pos._y + 1;
        var w = pos._w - 2;
        var h = pos._h - 2;
        
        t = new Turtle(c);
        if (this.on_top) {
            this.judgement.draw_on_top(t, x, y+Globals.YTopBufferSpace, this.selected);
        } else {
            this.judgement.draw_on_bottom(t, x, y, this.selected);
        }
    },

    set_judgement: function(j) {
        this.judgement = j;
        return this;
    },

    set_inference_rule: function(i) {
        this.inference_rule = i;
        return this;
    },

    set_orientation: function(on_top) {
        this.on_top = on_top;
        return this;
    },

    set_connected: function(connected) {
        this.connected = connected;
        connected.connected = this;
        return this;
    },

    place: function(x, y) {
        j = this.judgement;
        this.attr({ x: x, 
                    y: y, 
                    w: j.get_width()+2, 
                    h: Globals.JudgementHeight + 2 + (this.on_top? Globals.YTopBufferSpace:Globals.YBottomBufferSpace) });
        return this;
    },

    set_selected: function(s) {
        if (this.selected != s) {
            this.selected = s;
            this.trigger("Change");
        }
    },

    connected_move: function(dx, dy) {
        Game.foreach_piece(function(p) { p.visited = false });
        this.visit_and_move(dx, dy);
    },

    visit_and_move: function(dx, dy) {
        if (!this.visited) {
            this.x = this.x + dx;
            this.y = this.y + dy;
            this.visited = true;
            if (this.inference_rule != null) {
                this.inference_rule.bottom.visit_and_move(dx,dy);
                for (var i = 0; i < this.inference_rule.top.length; i++) {
                    this.inference_rule.top[i].visit_and_move(dx,dy);
                }
            }
            if (this.connected != null) {
                this.connected.visit_and_move(dx, dy)
            }
        }
    },

    move_from_top: function(dx, dy) {
        this.trigger("Change");
        this.x = this.x + dx;
        this.y = this.y + dy;
        if (this.on_top) {
            if (this.inference_rule != null) {
                this.inference_rule.bottom.move_from_top(dx, dy);
                for (var i = 0; i < this.inference_rule.top.length; i++) {
                    var other = this.inference_rule.top[i];
                    if (other != this) {
                        other.move_from_bottom(dx, dy);
                    }
                }
            }
        } else {
            if (this.connected != null) {
                this.connected.move_from_top(dx, dy);
            }
        }
    },

    move_from_top_adjusted: function(dx, dy) {
        this.trigger("Change");
        this.x = this.x + dx;
        this.y = this.y + dy;
        if (!this.on_top) { throw "Must be a top piece for this"; }

        if (this.inference_rule != null) {
            this.inference_rule.bottom.move_from_top(0, dy);
            for (var i = 0; i < this.inference_rule.top.length; i++) {
                var other = this.inference_rule.top[i];
                if (other != this) {
                    other.move_from_bottom(0, dy);
                }
            }
        }
    },

    move_from_bottom: function(dx, dy) {
        this.trigger("Change");
        this.x = this.x + dx;
        this.y = this.y + dy;
        if (this.on_top) {
            if (this.connected != null) {
                this.connected.move_from_bottom(dx, dy);
            }
        } else {
            if (this.inference_rule != null) {
                for (var i = 0; i < this.inference_rule.top.length; i++) {
                    this.inference_rule.top[i].move_from_bottom(dx, dy);
                }
            }
        }
    },

    connect_to: function(other) {
        var delta = this.distance_to_other(other)
        this.connected_move(delta.x, delta.y);
        other.connected = this;
        this.connected = other;
    },

    superficial_match: function(other) {
        return (this.connected == null && 
                other.connected == null && 
                this.on_top == !other.on_top &&
                this.judgement.get_width() == other.judgement.get_width())
    },

    connect_if_match: function(other) {
        if (this.superficial_match(other)) {
            s = this.judgement.unify(other.judgement);
            if (s === false) return;
            this.connect_to(other);
            if (this.inference_rule != null)
                this.inference_rule.apply(s)
            else
                this.apply(s);
            if (other.inference_rule != null)
                other.inference_rule.apply(s)
            else
                other.apply(s);
            MetaVarManager.garbage_collect();
            Game.current_rule = null;
            Game.check_if_solved();
        }
    },

    make_fresh: function() {
        this.judgement.make_fresh();
        this.trigger("Change");
    },

    apply: function(s) {
        this.judgement.apply(s);
        this.trigger("Change");
    },

    distance_from_other: function(other) {
        return {x: this.x - other.x,
                y: this.y - other.y + (this.on_top? -10:10) }
    },

    distance_to_other: function(other) {
        return {x: other.x - this.x,
                y: other.y - this.y - (this.on_top? -10:10) }
    },

    add_live_vars: function(live_vars) {
        this.judgement.add_live_vars(live_vars);
    }

})


JudgementConstruction = {
    A: Var("A"),
    B: Var("B"),
    C: Var("C"),
    D: Var("D"),
    G: Var("G"),
    G1: Var("G1"),
    G2: Var("G2"),
    a: Var("a"),
    b: Var("b"),
    c: Var("c"),
    d: Var("d"),
    imp: function(e1,e2) {
        return BinExpr("imp", e1, e2);
    },
    and: function(e1, e2) {
        return BinExpr("and", e1, e2);
    },
    or: function(e1, e1) {
        return BinExpr("or", e1, e2);
    }
}

function build_judgement(s) {
    var arr = s.split("|-");
    var left = null;
    var right = null;
    if (arr.length == 1) { // did not find "|-"
        left = ""
        right = arr[0]
    } else {
        left = arr[0]
        right = arr[1]
    }
    with (JudgementConstruction) {
        return new Judgement(eval("[" + left + "]"), eval(right));
    }
    
}

function build_judgement_piece(s) {
    var j = build_judgement(s);
    var p = Crafty.e('JudgementPuzzlePiece').set_judgement(j);
    if (arguments.length == 3)
        p.place(arguments[1],arguments[2]);
    return p;
}

function build_inference_rule_piece(top, bottom, x, y) {
    var r = new InferenceRule(top.map(function (s) { return build_judgement_piece(s) }), 
                              build_judgement_piece(bottom));
    r.make_fresh()
    r.place(x, y);
    return r;
}

ColorManager = {
    init: function() {
        ColorManager.colors = {};

        ColorManager.add_color("Red");
        ColorManager.add_color("Blue");
        ColorManager.add_color("Green");
        ColorManager.add_color("Cyan");
        ColorManager.add_color("Magenta");
        ColorManager.add_color("Lime");
        ColorManager.add_color("Yellow");
        //ColorManager.add_color("Silver");
        //ColorManager.add_color("Gray");
        ColorManager.add_color("Maroon");
        ColorManager.add_color("Olive");
        ColorManager.add_color("Purple");
        ColorManager.add_color("Teal");
        ColorManager.add_color("Navy");
        ColorManager.add_color("Pink");
    },
    add_color: function(color) {
        ColorManager.colors[color] = false;
    },
    release_color: function(color) {
        ColorManager.colors[color] = false;
    },
    get_unused_color: function() {
        for (color in ColorManager.colors) {
            if (!ColorManager.colors[color]) {
                ColorManager.colors[color] = true;
                return color;
            }
        }
        throw "Could not find color"
    }
}

MetaVarManager = {
    init: function() {
        MetaVarManager.vars = {}
        MetaVarManager.var_counts = {}
    },
    next_var: function(n) {
        if (!(n in MetaVarManager.var_counts)) {
            MetaVarManager.var_counts[n] = 0;
        }
        var id = MetaVarManager.var_counts[n]++;
        var name = n + id;
        MetaVarManager.vars[name] = ColorManager.get_unused_color();
        return name;
    },
    get_meta_var_color: function(n) {
        return MetaVarManager.vars[n];
    },
    start_fresh: function () {
        MetaVarManager.fresh_vars = {};
    },
    fresh_var: function(n) {
        if (!(n in MetaVarManager.fresh_vars)) {
            MetaVarManager.fresh_vars[n] = MetaVarManager.next_var(n);
        }
        return MetaVarManager.fresh_vars[n]
    },
    fresh_tree: function(t) {
        if (t == null)
            return null;
        if (t.is_meta_var()) 
            return Var(MetaVarManager.fresh_var(t.n))
        return new Tree(t.n,
                        MetaVarManager.fresh_tree(t.left),
                        MetaVarManager.fresh_tree(t.right));
    },
    garbage_collect: function() {
        var live_vars = {};
        Game.foreach_piece(function(p) { p.add_live_vars(live_vars) });
        for (var v in MetaVarManager.vars) {
            if (!(v in live_vars)) {
                var color = MetaVarManager.vars[v];
                ColorManager.release_color(color);
                delete MetaVarManager.vars[v];
            }
        }
    }
}

function qs(key) {
    key = key.replace(/[*+?^$.\[\]{}()|\\\/]/g, "\\$&"); // escape RegEx meta chars
    var match = location.search.match(new RegExp("[?&]"+key+"=([^&]+)(&|$)"));
    return match && decodeURIComponent(match[1].replace(/\+/g, " "));
}

Game = {
    // Initialize and start our game
    start: function() {
        // Start crafty and set a background color so that we can see it's working
        ColorManager.init();
        MetaVarManager.init();
        Game.current_rule = null;
        Game.puzzles = [];
        Game.add_puzzle("a,b |- a", ["assumption", "add-context-left", "add-context-right"]); // 1
        Game.add_puzzle("a,b |- b", ["assumption", "add-context-left", "add-context-right"]); // 2
        Game.add_puzzle("a,b |- and(a, b)", ["assumption", "and-intro", "add-context-left", "add-context-right"]); // 3
        //Game.add_puzzle("and(a,b) |- and(a,B)", ["assumption", "and-elim-2", "add-context-left", "add-context-right"]);
        Game.add_puzzle("and(a,b) |- a", ["assumption", "and-elim-1", "add-context-left", "add-context-right"]); // 4 
        Game.add_puzzle("and(a,b) |- b", ["assumption", "and-elim-2", "add-context-left", "add-context-right"]); // 5
        Game.add_puzzle("|- imp(a, imp(b,a))", []); // 6
        Game.add_puzzle("and(a,b) |- and(b,a)", []); // 7
        Game.add_puzzle("|- imp(a, imp(imp(a,b), b))", []); // 8
        var current_puzzle = qs("puzzle_id");
        if (current_puzzle == null)
            current_puzzle = 0;
        else {
            current_puzzle = parseInt(current_puzzle) - 1;
            if (current_puzzle < 0)
                current_puzzle = 0;
            if (current_puzzle > Game.puzzles.length-1)
                current_puzzle = Game.puzzles.length-1;
        }
        Game.current_puzzle = current_puzzle;

        Crafty.init(1300, 600);
        Crafty.background('rgb(240,240,240)');
        Game.show_current_puzzle();
        //Crafty.addEvent(this, "mousewheel", Game.mouseWheelDispatch);
        //Game.mouseWheelDispatch({wheelDelta:-120});
        //Game.mouseWheelDispatch({wheelDelta:-120});
    },

    clear: function() {
        Game.current_rule = null;
        Game.foreach_piece(function (p) { p.destroy() });
        MetaVarManager.garbage_collect();
    },

    add_puzzle: function(goal, pieces) {
        Game.puzzles.push({goal: goal, pieces:pieces});
    },

    next_puzzle: function() {
        if (Game.current_puzzle < Game.puzzles.length-1)
            Game.current_puzzle++;
        Game.show_current_puzzle();
    },

    prev_puzzle: function() {
        if (Game.current_puzzle > 0)
            Game.current_puzzle--;
        Game.show_current_puzzle();
    },

    show_current_puzzle: function() {
        Game.clear();
        var current_puzzle = Game.current_puzzle;
        build_judgement_piece(Game.puzzles[current_puzzle].goal, 400,450);
        var pieces = Game.puzzles[current_puzzle].pieces;
        var all_pieces = ["assumption",
                          "and-intro",
                          "and-elim-1",
                          "and-elim-2",
                          "imp-intro",
                          "imp-elim",
                          "add-context-left",
                          "add-context-right"];
        if (pieces.length == 0)
            pieces = all_pieces;
        for (var i = 0; i < all_pieces.length; i++) {
            document.getElementById(all_pieces[i]).style.visibility="hidden";
        }
        for (var i = 0; i < pieces.length; i++) {
            document.getElementById(pieces[i]).style.visibility="visible";
        }
    },

    puzzle1: function() {
        Game.clear();
        build_judgement_piece("|- imp(a, imp(b,a))", 400, 450);
        // build_inference_rule_piece(["A |- B"], "|- imp(A,B)", 50, 400);
        // build_inference_rule_piece(["G, A |- B"], "G |- imp(A,B)", 50, 200);
        // build_inference_rule_piece([], "A, B |- A", 450, 20);
    },

    puzzle2: function() {
        Game.clear();
        build_judgement_piece("|- imp(a, imp(imp(a,b), b))", 400, 450);
        // build_inference_rule_piece(["A |- B"], "|- imp(A,B)", 50, 450);
        // build_inference_rule_piece(["G, A |- B"], "G |- imp(A,B)", 50, 250);
        // build_inference_rule_piece(["G1, G2 |- A", "G1, G2 |- imp(A,B)"], "G1, G2 |- B", 50, 50);
        // build_inference_rule_piece([], "A, B |- A", 900, 500);
        // build_inference_rule_piece([], "A, B |- B", 900, 400);
    },

    puzzle3: function() {
        Game.clear();
        build_judgement_piece("and(a,b) |- and(b,a)", 400, 450);
        // build_inference_rule_piece(["G |- A", "G |- B"], "G |- and(A,B)", 50, 450);
        // build_inference_rule_piece(["G |- and(A,B)"], "G |- A", 50, 250);
        // build_inference_rule_piece(["G |- and(A,B)"], "G |- B", 600, 250);
        // build_inference_rule_piece([], "A |- A", 300, 50);
        // build_inference_rule_piece([], "A |- A", 900, 50);
    },
    // puzzle3: function() {
    //     build_judgement_piece("|- imp(a, imp(b,a))", 50, 600);
    //     Crafty.e("2D, Canvas, Color, Draggable")
    //         .attr({x: 100, y: 100, w: 150, h: 200})
    //         .color("red");
    // },

    remove_current_rule: function(p) {
        if (Game.current_rule != null) {
            Game.current_rule.destroy();
            MetaVarManager.garbage_collect();
        }
    },

    set_current_rule: function(top, bottom) {
        Game.remove_current_rule();
        Game.current_rule = build_inference_rule_piece(top, bottom, 50, 50);
    },

    create_assumption_piece: function() {
        Game.set_current_rule([], "A |- A");
    },

    create_and_intro_piece: function() {
        Game.set_current_rule(["|- A", "|- B"], "|- and(A,B)");
    },

    create_and_elim_piece_1: function() {
        Game.set_current_rule(["|- and(A,B)"], "|- A");
    },

    create_and_elim_piece_2: function() {
        Game.set_current_rule(["|- and(A,B)"], "|- B");
    },

    create_imp_intro_piece: function() {
        Game.set_current_rule(["A |- B"], "|- imp(A,B)");
    },

    create_imp_elim_piece: function() {
        Game.set_current_rule(["|- A", "|- imp(A,B)"], "|- B");
    },

    add_context_left: function() {
        Game.add_context(true)
    },

    add_context_right: function() {
        Game.add_context(false)
    },

    add_context: function(left) {
        if (Game.current_rule != null) {
            var new_context_var = MetaVarManager.next_var("G");
            Game.current_rule.foreach_piece(function (p) {
                if (left) 
                    p.judgement.left.unshift(Var(new_context_var));
                else
                    p.judgement.left.push(Var(new_context_var));
                p.trigger("Change");
            });
            Game.current_rule.place(50,50);
        }
    },

    puzzle_solved: function() {
        var solved = true;
        Game.foreach_piece(function (p) {
            if (p.on_top && p.connected == null)
                solved = false;
        });
        return solved;
    },

    check_if_solved: function() {
        if (Game.puzzle_solved()) {
            setTimeout(function(){
                var display_number = Game.current_puzzle + 1;
                if (Game.current_puzzle < Game.puzzles.length-1) {
                    alert("Puzzle " + display_number + " Solved!!!\n On to the next puzzle!");
                    Game.next_puzzle();
                } else {
                    alert("Puzzle " + display_number + " Solved!!!\n Congrats, you solved all the puzzles!");
                    Game.clear();
                }
            }, 250);
        }
    },


    foreach_piece: function(f) {
        ids = Crafty("JudgementPuzzlePiece");
        for (var i = 0; i < ids.length; i++) {
            f(Crafty(ids[i]));
        }
    },

    mouseWheelDispatch: function(e) {
        var delta = (e.wheelDelta? e.wheelDelta/120 : evt.detail)/2;
        console.log(e);
        Crafty.viewport.scale(delta < 0 ? 0.9 : 1/0.9);
        //Crafty.trigger("Change");
        Crafty.DrawManager.drawAll();
        // Crafty.viewport.zoom(
        // (delta>0)? (delta+1) : 1/(-delta+1)
        // , Crafty.viewport.width/2
        // , Crafty.viewport.height/2
        // , 10);
    }
   
}

window.addEventListener('load', Game.start);
