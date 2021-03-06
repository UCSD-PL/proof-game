/**************************************************/
//
// Globals
//
/**************************************************/

Globals = {

    VarToShape : {
        a: "wedge", 
        b: "tee",
        c: "left_l", 
        x: "wedge", 
        y: "tee",
        z: "left_l", 
        zero: "left_l",
        imp: "cup", 
        and: "vee",
        sum: "cup",
        s: "inward_trapezoid",
        equal: "vee"
    },
    VarToLogicRep : {
        // imp: "\u2192", 
        imp: "\u21D2", 
        and: "\u2227",
        turnstile: "\u22A2",
        equal: "=",
        sum: "+",
        zero: "0"
    },
    LeftFillColor: "rgb(255,255,200)",
    LeftFillColorSelected: "rgb(130,130,130)",
    RightFillColor: "rgb(255,230,255)",
    RightFillColorSelected: "rgb(130,130,130)",
    FillColorGreyedOut: "rgb(255,255,255)",
    StrokeColorGreyedOut: "rgb(230,230,230)",
    RewriteFillColor: "rgb(200,255,200)",
    FormulaWidth: 200,
    JudgementHeight: 50,
    XSpaceBetweenJudgements: 20,
    YTopBufferSpace: 50,
    YBottomBufferSpace: 20,
    MaxSingleVarWidth: 50
}

/**************************************************/
//
// Overview of Architecture
//
/**************************************************/

//
// InferenceRule: Javascript object
//   top: list of JudgementPuzzlePiece (Crafty component)
//   bottom: JudgementPuzzlePiece (Crafy component)
//
// JudgementPuzzlePiece: Crafty Component
//   judgement: Judgement
//   inference_rule: InferenceRule (Javascript object)
//   connected: JudgementPuzzlePiece (Crafty Component)
//   
// Judgement: Javascript object
//   left: list of Tree (Javascript object)
//   right: Tree (Javascript object)
//   meta_var_info: stores informations about meta vars during Judgement drawing
//
// Tree: Javascript object
//   n: string
//   left: Tree
//   right: Tree

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
    this.is_rewrite = false;
}

InferenceRule.prototype.make_into_rewrite = function() {
    if (this.bottom.judgement.left.length == 0 &&
        this.top.length == 1 &&
        this.top[0].judgement.left.length == 0) {
        this.is_rewrite = true;
    } else {
        console.log("InferenceRule.make_into_rewrite(): Rewrite invariant does not hold")
        this.is_rewrite = false;
    }
}

InferenceRule.prototype.place = function(x,y) {
    this.x = x
    this.y = y
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

InferenceRule.prototype.make_all_fresh = function() {
    MetaVarManager.start_fresh();
    this.make_fresh();
}

InferenceRule.prototype.make_fresh = function() {
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

InferenceRule.prototype.add_context = function(left) {
    var new_context_var = MetaVarManager.next_var("G");
    this.foreach_piece(function (p) {
        if (left) 
            p.judgement.left.unshift(Var(new_context_var));
        else
            p.judgement.left.push(Var(new_context_var));
        p.trigger("Invalidate");
    });
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
//     this.clear_meta_var_infos();
//     for (var i = 0; i < this.top.length; i++) {
//         top[i].draw_on_top(t, curr_x, y);
//         curr_x = curr_x + top[i].get_width() + Globals.XSpaceBetweenJudgements;
//     }
//     if (bottom != null) {
//         curr_x = x + (w-bottom_w)/2;
//         bottom.draw_on_bottom(t, curr_x, y + Globals.JudgementHeight);
//     }
//     for (var i = 0; i < this.meta_var_infos.length; i++) {
//         var meta_var_info = this.meta_var_infos[i];
//         var c = t.c;
//         c.lineWidth = 5;
//         c.strokeStyle = Globals.MetaVarToColor[meta_var_info.t.n];
//         c.beginPath();
//         t.move_to(meta_var_info.x, meta_var_info.y);
//         t.up(15);
//         t.right(meta_var_info.w);
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

Judgement.prototype.draw = function(judgement_piece, t, x, y, w) {
    var c = t.c;
    var left = this.left;
    var right = this.right;
    var right_w = w / (left.length + 1);
    var left_w = right_w * left.length;
    var h = Globals.JudgementHeight;
    var on_top = judgement_piece.on_top;
    var selected = judgement_piece.selected;
    var greyed_out = judgement_piece.greyed_out;
    var is_rewrite = judgement_piece.is_rewrite();

    t.judgement = this;
    this.clear_all_infos();

    c.lineWidth = 2;
    c.strokeStyle = "rgb(0,0,0)";
    if (greyed_out) c.strokeStyle = Globals.StrokeColorGreyedOut;

    // left
    c.fillStyle = Globals.LeftFillColor;
    if (selected) c.fillStyle = Globals.LeftFillColorSelected;
    if (greyed_out) c.fillStyle = Globals.FillColorGreyedOut;
    if (is_rewrite) c.fillStyle = Globals.RewriteFillColor;
    c.beginPath();
    t.move_to(x, y);
    if (!on_top)
        t.down(h)
    for (var i = 0; i < left.length; i++) {
        var item_width = left_w / left.length;
        if (i == 0) { // TODO: remove this
            item_width = left_w - (item_width * (left.length-1));
        }
        left[i].draw(t, item_width, on_top);
    }
    if (on_top)
        t.down(h);
    else
        t.up(h);
    t.line_to_x(x);
    if (on_top)
        t.up(h);
    c.fill()
    c.stroke();

    // right
    c.fillStyle = Globals.RightFillColor;
    if (selected) c.fillStyle = Globals.RightFillColorSelected;
    if (greyed_out) c.fillStyle = Globals.FillColorGreyedOut;
    if (is_rewrite) c.fillStyle = Globals.RewriteFillColor;
    c.beginPath();
    t.move_to(x + left_w, y);
    if (!on_top)
        t.down(h);
    right.draw(t, right_w, on_top);
    if (on_top)
        t.down(h);
    else
        t.up(h);
    t.line_to_x(x + left_w);
    if (on_top)
        t.up(h);
    c.fill()
    c.stroke();

    for (var i = 0; i < this.meta_var_infos.length; i++) {
        var meta_var_info = this.meta_var_infos[i];
        var c = t.c;
        c.lineWidth = 5;
        c.strokeStyle = MetaVarManager.get_meta_var_color(meta_var_info.t.n);
        if (greyed_out) c.strokeStyle = Globals.StrokeColorGreyedOut;
        c.beginPath();
        t.move_to(meta_var_info.x, meta_var_info.y);

        var height = 20;
        t.up(height);
        t.right(meta_var_info.w);
        t.down(height);

        c.stroke();

        // var grd=c.createLinearGradient(meta_var_info.x,meta_var_info.y,meta_var_info.x,meta_var_info.y-height);
        // grd.addColorStop(0,make_transparent(MetaVarManager.get_meta_var_color(meta_var_info.t.n), .5))
        // grd.addColorStop(1,MetaVarManager.get_meta_var_color(meta_var_info.t.n))

        // c.fillStyle = grd;
        // c.fillRect(meta_var_info.x,meta_var_info.y,meta_var_info.w,-height);
    }

    // for (var i = 0; i < this.spinner_infos.length; i++) {
    //     var spinner_info = this.spinner_infos[i];
    //     var c = t.c;
    //     c.lineWidth = 5;
    //     c.strokeStyle = MetaVarManager.get_meta_var_color(spinner_info.n);
    //     c.beginPath();
    //     t.move_to(spinner_info.x, spinner_info.y);
    //     spinner_info.tree.draw(t, spinner_info.w, false);
    //     c.stroke();
    // }
    if (Game.show_logic) {
        var set_font_size_to_match_width = function (ctx, font, str, width) {
            var size = 1;
            while (true) {
                if (size > 60)
                    return 60
                c.font = size + "px " + font;
                if (c.measureText(str).width > width) {
                    c.font = (size-1) + "px " + font;
                    return (size - 1);
                }
                size = size + 1
            }
        }
        var c = t.c;
        for (var i = 0; i < this.logic_infos.length; i++) {
            var logic_info = this.logic_infos[i];
            c.fillStyle = "rgb(0, 0, 0)";
            var str = logic_info.n;
            if (str in Globals.VarToLogicRep)
                str = Globals.VarToLogicRep[str];
            var width = logic_info.w;
            if (logic_info.n == "imp") 
                width = 1.6 * width;
            var font_size = set_font_size_to_match_width(c, "Arial", str, width)
            var text_width = c.measureText(str).width;
            var text_height = font_size / 2;
            c.fillText(str, logic_info.x+(logic_info.w-text_width)/2, logic_info.y + (text_height/2)); 
        } 

        var font_size = 50;
        c.font = font_size + "px Arial";
        var text_width = c.measureText(Globals.VarToLogicRep.turnstile).width;
        var text_height = font_size / 2;
        c.fillText(Globals.VarToLogicRep.turnstile, x + left_w - (text_width/2), y + (text_height/2) + (on_top ? 0 : h));
        if (judgement_piece.inference_rule) {
            c.lineWidth = 3;
            c.strokeStyle = "rgb(0,0,0)";
            c.beginPath();
            t.move_to(x, on_top ? y + h : y);
            t.right(w);
            c.stroke();
        }
    }
}

Judgement.prototype.clear_all_infos = function() {
    this.clear_position_infos();
    this.clear_meta_var_infos();
    this.clear_logic_infos();
}

Judgement.prototype.clear_position_infos = function () {
    this.position_infos = [];
}

Judgement.prototype.add_position_info = function (t, x, y, w) {
    this.position_infos.push({t: t, x: x, y: y, w: w});
}

Judgement.prototype.clear_meta_var_infos = function () {
    this.meta_var_infos = [];
}

Judgement.prototype.add_meta_var_info = function (t, x, y, w, orig_x, orig_y, full_w) {
    this.meta_var_infos.push({t: t, x: x, y: y, w: w, orig_x: orig_x, orig_y: orig_y, full_w: full_w });
}

Judgement.prototype.clear_spinner_infos = function () {
    this.spinner_infos = [];
}

Judgement.prototype.add_spinner_info = function (n, tree, x, y, w) {
    this.spinner_infos.push({n: n, tree: tree, x: x, y: y, w: w });
}

Judgement.prototype.clear_logic_infos = function () {
    this.logic_infos = [];
}

Judgement.prototype.add_logic_info = function (n, x, y, w) {
    this.logic_infos.push({n: n, x: x, y: y, w: w });
}

Judgement.prototype.make_fresh = function() {
    this.left = this.left.map(function (e) { return MetaVarManager.fresh_tree(e) });
    this.right = MetaVarManager.fresh_tree(this.right);
}

Judgement.prototype.rewrite = function(src, dst) {
    this.left = this.left.map(function(e) { return rewrite_tree(e, src, dst) });
    this.right = rewrite_tree(this.right, src, dst);
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

function UnaryExpr(n, right) {
    return new Tree(n, null, right);
}

function BinExpr(n, left, right) {
    return new Tree(n, left, right);
}

Tree.prototype.is_meta_var = function() {
    if (this.left != null || this.right != null) { return false; }
    var c = this.n[0];
    return c.toUpperCase() === c;
}

Tree.prototype.is_concrete_var = function() {
    if (this.left != null || this.right != null) { return false; }
    // explicitly enumerate constants
    if (this.n === "zero") return false;
    var c = this.n[0];
    return c.toUpperCase() !== c;
}

Tree.prototype.to_string_full_paren = function() {
    var n = this.n;
    if (n in Globals.VarToLogicRep) {
        n = Globals.VarToLogicRep[n]
    }
    if (this.left == null && this.right == null) {
        return n;
    }
    if (this.left != null && this.right == null) {
        return "(" + n + this.left.to_string_full_paren() + ")"
    }
    if (this.left == null && this.right != null) {
        return "(" + n + this.right.to_string_full_paren() + ")"
    }
    return "(" + this.left.to_string_full_paren() + 
           " " + n + " " + 
           this.right.to_string_full_paren() + ")";
}

Tree.prototype.to_string = function() {
    var s = this.to_string_full_paren();
    if (s[0] == "(" && s[s.length-1] == ")") {
        return s.slice(1, s.length-1);
    } else {
        return s;
    }
}

Tree.prototype.to_string_polish = function() {
    var n = this.n;
    if (this.left == null && this.right == null) {
        return n;
    }
    if (this.left != null && this.right == null) {
        return n + "(" + this.left.to_string_polish() + ")"
    }
    if (this.left == null && this.right != null) {
        return n + "(" + this.right.to_string_polish() + ")"
    }
    return n + "(" + this.left.to_string_polish() + 
           ", " + 
           this.right.to_string_polish() + ")";    
}

Tree.prototype.draw = function(t, w, on_top) {
    if (t.judgement) {
        t.judgement.add_position_info(this, t.x, t.y, w);
    }
    if (this.left == null && this.right == null) {
        if (this.is_meta_var() && this.n in Game.spinner.subst) {
            var new_tree = Game.spinner.subst[this.n];
            t.judgement.add_spinner_info(this.n, new_tree, t.x, t.y, w);
            new_tree.draw(t, w, on_top);
            return
        }
        var orig_x = t.x;
        var orig_y = t.y;
        var token_width = this.is_meta_var() ? w * 0.80 : w * .60;
        if (token_width > Globals.MaxSingleVarWidth && !this.is_meta_var()) {
            token_width = Globals.MaxSingleVarWidth
        }
        var space_width = (w - token_width)/2;
        var space1 = space_width;
        var space2 = w - token_width - space1;
        t.right(space1);
        if (t.judgement) {
            if (this.is_meta_var()) {
                var color = MetaVarManager.get_meta_var_color(this.n)
                t.judgement.add_logic_info(ColorManager.get_logic_rep(color), t.x, t.y, token_width);
                t.judgement.add_meta_var_info(this, t.x, t.y, token_width, orig_x, orig_y, w);
            } else {
                t.judgement.add_logic_info(this.n, t.x, t.y, token_width);
            }
        }
        if (this.is_meta_var()) {
            t.flatsqcap(token_width);
        } else {
            t[Globals.VarToShape[this.n]](token_width);
        }
        t.right(space2);
    } else {
        var num_subexpr = this.left === null ? 1 : 2;
        var bin_op_width = w * 0.15;
        var space_width = w * 0.1;
        var sub_expr_space = (w - bin_op_width - (space_width * 2))/num_subexpr;
        var space1 = space_width;
        var space2 = w - space_width - bin_op_width - (sub_expr_space*num_subexpr);
        var height_above = w * 0.15 / 2;
        t.right(space1);
        t.up(height_above);
        if (this.left !== null)
            this.left.draw(t, sub_expr_space, on_top);
        if (t.judgement)
            t.judgement.add_logic_info(this.n, t.x, t.y, bin_op_width);
        t[Globals.VarToShape[this.n]](bin_op_width);
        this.right.draw(t, sub_expr_space, on_top);
        t.down(height_above);
        t.right(space2);

        if (on_top) {
            var height_below = w * 0.15;
            t.left(space2);
            t.down(height_below);
            t.left(bin_op_width + (sub_expr_space*num_subexpr));
            t.up(height_below);
            t.down(height_below);
            t.right(bin_op_width + (sub_expr_space*num_subexpr));
            t.up(height_below);
            t.right(space2);
        }
    }
}

Tree.prototype.copy_from = function(other) {
    this.n = other.n;
    this.right = other.right;
    this.left = other.left;
}

function has_meta_var(t) {
    if (t == null) return false;
    if (t.is_meta_var()) return true;
    if (has_meta_var(t.left)) return true;
    return (has_meta_var(t.right));
}

function rewrite_tree(t, src, dst) {
    if (t == null)
        return null;
    if (t === src)
        return dst;
    return new Tree(t.n,
                    rewrite_tree(t.left, src, dst),
                    rewrite_tree(t.right, src, dst));
}

function apply_to_tree(t, s) {
    if (t == null) 
        return null;
    if (t.left == null && t.right == null && t.n in s)
        //return apply_to_tree(s[t.n], s);
        return s[t.n];
    return new Tree(t.n, apply_to_tree(t.left, s), apply_to_tree(t.right, s));
}

function replace_name(t, name, dst) {
    var s = {};
    s[name] = dst;
    return apply_to_tree(t,s);
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

function add_closed_sub_exprs(t, closed_sub_exprs) {
    if (t == null) return false;
    if (t.is_meta_var()) return true;
    var l = add_closed_sub_exprs(t.left, closed_sub_exprs);
    var r = add_closed_sub_exprs(t.right, closed_sub_exprs);
    if (l) return true;
    if (r) return true;
    closed_sub_exprs[t] = t
    return false;
}

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
Turtle.prototype.inward_trapezoid = function(w) {
    var c = this.c;
    var x = this.x;
    var y = this.y;
    var endx = x + w;
    var h = 0.4 * w;
    var len1 = 0.7 * w;
    var len2 = 1 * w;
    var space1 = (w - len1)/2;
    var space2 = (w - len2)/2;
    c.lineTo(x + space1, y);
    c.lineTo(x + space2, y + h);
    c.lineTo(x + space2 + len2, y + h);
    c.lineTo(x + space1 + len1, y);
    c.lineTo(endx, y);
    this.x = endx;

}
Turtle.prototype.upward_trapezoid = function (w) {
    var c = this.c;
    var x = this.x;
    var y = this.y;
    var endx = x + w;
    c.lineTo(x+(w/4), y - (w*0.433));
    c.lineTo(x+(3*w/4), y - (w*0.433));
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
Turtle.prototype.left_l = function (w) {
    var c = this.c;
    var x = this.x;
    var y = this.y;
    var endx = x + w;
    var lower_w = w * 0.40;
    var upper_w = w;
    var upper_h = w*0.75;
    var lower_h = w*0.40;

    c.lineTo(x, y - upper_h);
    c.lineTo(x + upper_w, y - upper_h);
    c.lineTo(x + upper_w, y - lower_h);
    c.lineTo(x + lower_w, y - lower_h);
    c.lineTo(x + lower_w, y);
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
    var h = 20;
    this.up(h);
    this.right(w);
    this.down(h);
}
Turtle.prototype.move_to = function(x,y) {
    this.c.moveTo(x,y);
    this.x = x;
    this.y = y;
}

Crafty.c('Spinner', {
    init: function() {
        this.requires("Keyboard");
        this.curr_formula_idx = 0;
        this.curr_meta_var_idx = 0;
        this.subst = {};
        this.focus = 0;
        // this.bind("KeyDown", function(e) {
        //     if (e.key == Crafty.keys.UP_ARROW) {
        //         this.curr_formula_idx = this.curr_formula_idx+1;
        //         this.subst[this.get_curr_meta_var()] = this.get_curr_formula();
        //         Game.redraw_all();
        //     }
        //     else if (e.key == Crafty.keys.DOWN_ARROW) {
        //         this.curr_formula_idx = this.curr_formula_idx-1;
        //         this.subst[this.get_curr_meta_var()] = this.get_curr_formula();
        //         Game.redraw_all();
        //     }
        //     else if (e.key == Crafty.keys.RIGHT_ARROW) {
        //         this.curr_meta_var_idx = this.curr_meta_var_idx+1;
        //     }
        //     else if (e.key == Crafty.keys.LEFT_ARROW) {
        //         this.curr_meta_var_idx = this.curr_meta_var_idx-1;
        //     }

        // })

        // this.bind("EnterFrame", function() {
        //     console.log("EnterFrame");
        //     if (this.isDown("RIGHT_ARROW")) {
        //          Crafty.e("2D, Canvas, Color")
        //             .attr({x: this.x, y:100, w:1, h:10})
        //             .color("red");
        //         this.x = this.x+2;
        //     }
        // })
    },

    get_curr_meta_var: function() {
        var all_vars = MetaVarManager.get_all_meta_vars();
        while (this.curr_meta_var_idx < 0)
            this.curr_meta_var_idx = this.curr_meta_var_idx + all_vars.length;
        while (this.curr_meta_var_idx >= all_vars.length)
            this.curr_meta_var_idx = this.curr_meta_var_idx - all_vars.length;
        return all_vars[this.curr_meta_var_idx % all_vars.length]
    },

    get_curr_formula: function() {
        var all_formulas_set = {}
        Game.foreach_piece(function(p) {
            var l = p.judgement.left.concat([p.judgement.right]);
            for (var k = 0; k < l.length; k++) {
                add_closed_sub_exprs(l[k], all_formulas_set)
            }
        })
        var all_formulas = []
        for (var f in all_formulas_set)
            all_formulas.push(all_formulas_set[f])
        while (this.curr_formula_idx < 0)
            this.curr_formula_idx = this.curr_formula_idx + all_formulas.length;
        while (this.curr_formula_idx >= all_formulas.length)
            this.curr_formula_idx = this.curr_formula_idx - all_formulas.length;
        return all_formulas[this.curr_formula_idx % all_formulas.length]
    }
})

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
        this.greyed_out = Game.show_logic;
        this.on_top = true;
        this.history = [];

        var self = this;
        var call_with_coords = function(name, e) {
            // Ideally we would like to pass in a method (eg: self.f)
            // but we haven't been able to get that to work properly with
            // "this", so instead we're passing the name of the method as a
            // string.
            var pos = Crafty.DOM.translate(e.clientX, e.clientY);
            e.cx = pos.x; // cx stands for Crafty X
            e.cy = pos.y; // cy stands for Crafty Y
            self[name](e);
        };
        this.bind("MouseOver", function(e) { this.mouse_over(e) });
        this.bind("MouseOut", function(e) { this.mouse_out(e) });
        this.bind("MouseMove", function(e) { call_with_coords("mouse_move", e) });
        this.bind("MouseDown", function(e) { call_with_coords("mouse_down", e) });
        this.bind("MouseUp", function(e) { call_with_coords("mouse_up", e) });
        this.bind("StartDrag", function(e) { call_with_coords("start_drag", e) });
        this.bind("StopDrag", function(e) { call_with_coords("stop_drag", e) });
        this.bind("Dragging", function(e) { call_with_coords("dragging", e) });
        this.bind("DoubleClick", function(e) { call_with_coords("double_click", e) });
        this.bind("Draw", function(obj) {
            //Game.effects_canvas.clearRect(0,0,Crafty.viewport.width, Crafty.viewport.height);
            self._draw(obj.ctx, obj.pos);
        });

        //this.bind("Click", function(e) { console.log(e) });
    },

    _draw: function(c, pos) {
        var x = pos._x + 1;
        var y = pos._y + 1;
        var w = pos._w - 2;
        var h = pos._h - 2;
        t = new Turtle(c);
        this.judgement.draw(this, t, x, this.on_top? (y+Globals.YTopBufferSpace): y, w);
    },

    mouse_over: function(e) {
        this.induction_var_location = null;
    },

    mouse_out: function(e) {
        this.induction_var_location = null;
        Game.destroy_all_animated_pieces();        
    },

    mouse_move: function(e) {
        this.induction_var_location = null;
        Game.destroy_all_animated_pieces();
        if (!this.on_top) return;
        if (this.connected !== null) return;
        if (this.is_rewrite()) return;
        var idx = this.translate_into_formula_index(e.cx, e.cy);
        if (idx !== this.judgement.left.length) return;
        var best_match = null;
        for (var i = 0; i < this.judgement.position_infos.length; i++) {
            var position_info = this.judgement.position_infos[i];
            if (position_info.t.is_concrete_var() &&
                e.cx >= position_info.x &&
                e.cx <= position_info.x + position_info.w &&
                Math.abs(e.cy - position_info.y) < 20) {
                if (best_match === null ||
                    (position_info.x > best_match.x &&
                     position_info.w < best_match.w)) {
                    best_match = position_info;
                }
            }
        }
        if (best_match !== null) {
            Crafty.e("AnimatedFormula")
            .attr({x: best_match.x,
                   y: best_match.y - Globals.YTopBufferSpace,
                   w: best_match.w,
                   h: 100})
            .set_formula(best_match.t)
            .set_color("green");
            this.induction_var_location = {
                induction_var: best_match.t
            };
        }
    },

    mouse_down: function(e) {
        this.mouse_down_x = e.clientX;
        this.mouse_down_y = e.clientY;
    },

    mouse_up: function(e) {
        if (Math.abs(this.mouse_down_x - e.clientX) < 5 &&
            Math.abs(this.mouse_down_y - e.clientY) < 5) {
            if (this.is_rewrite())
                this.mouse_up_rewrite(e)
            else
                this.mouse_up_regular(e)
        }
    },

    mouse_up_rewrite: function(e) {
        var top_piece = this.inference_rule.top[0];
        var bottom_piece = this.inference_rule.bottom;
        var tmp = top_piece.judgement;
        top_piece.judgement = bottom_piece.judgement;
        bottom_piece.judgement = tmp;
        top_piece.trigger("Invalidate");
        bottom_piece.trigger("Invalidate");
    },

    mouse_up_regular: function(e) {
        if (this.induction_var_location != null) {
            console.log("induction on " + this.induction_var_location.induction_var.to_string());
            var ind_var = this.induction_var_location.induction_var;
            
            var base_case = replace_name(this.judgement.right, ind_var.n, Var("zero"));
            var base_case_judgement = new Judgement(this.judgement.left, base_case);
            var base_case_piece = Crafty.e('JudgementPuzzlePiece').set_judgement(base_case_judgement);

            var ind_assumption = this.judgement.right;
            var ind_case = replace_name(this.judgement.right, ind_var.n, UnaryExpr("s", Var(ind_var.n)));
            var ind_case_judgement = new Judgement(this.judgement.left.concat(ind_assumption), ind_case);
            var ind_case_piece = Crafty.e('JudgementPuzzlePiece').set_judgement(ind_case_judgement);

            var bottom_piece = Crafty.e('JudgementPuzzlePiece').set_judgement(this.judgement);
            var rule = new InferenceRule([base_case_piece, ind_case_piece], bottom_piece);
            Game.remove_current_rule();
            Game.current_rule = rule;
            Game.current_rule.place(150,150);
            var success = Game.current_rule.bottom.connect_if_match(this);
            if (!success) {
                Game.remove_current_rule();
            }
        } else if (this.on_top && this.connected == null) {
            var i = this.translate_into_formula_index(e.cx, e.cy);
            if (i >= 0 && i < this.judgement.left.length) {
                var rewrite_formula = this.judgement.left[i];
                if (rewrite_formula.n == "equal") {
                    var left = rewrite_formula.left.to_string_polish();
                    var right = rewrite_formula.right.to_string_polish();
                    Game.replace_current_rule(["|- " + left], "|- " + right);
                    Game.current_rule.make_into_rewrite();
                }
            }
        }
    },

    start_drag: function(e) {
        this.drag_x = e.cx;
        this.drag_y = e.cy;
        this.open_on_bottom = [];
        var self = this;
        Game.foreach_piece(function(p) { 
            if (p.connected == null && !p.on_top) 
                self.open_on_bottom.push(p);
        });
        this.open_on_top = [];
        Game.foreach_piece(function(p) { 
            if (p.connected == null && p.on_top) 
                self.open_on_top.push(p);
        });
        if (this.is_rewrite()) {
            this.rewrite_location = null;
        }
        Game.trigger_callout_transition({name: "StartDrag"});
    },

    stop_drag: function(e) {
        if (this.is_rewrite())
            this.stop_drag_rewrite(e)
        else
            this.stop_drag_regular(e)
    },
    
    stop_drag_rewrite: function(e) {
        if (this.rewrite_location !== null) {
            var top = this.rewrite_location.top_puzzle_piece;
            var tree = this.rewrite_location.tree_within_puzzle_piece
            top.apply_rewrite_if_match(this.inference_rule, tree);
        }
    },

    stop_drag_regular: function(e) {
        var selected_bottom = null;
        var selected_top = null;
        for (var i = 0; i < this.open_on_bottom.length; i++) {
            var bottom = this.open_on_bottom[i];
            if (bottom.selected) 
                selected_bottom = selected_bottom == null ? bottom : "more than one";
            bottom.set_selected(false);
        }
        for (var i = 0; i < this.open_on_top.length; i++) {
            var top = this.open_on_top[i];
            if (top.selected) 
                selected_top = selected_top == null ? top : "more than one";
            top.set_selected(false);
        }
        if (selected_bottom != null && selected_bottom != "more than one" &&
            selected_top != null && selected_top != "more than one") {
            var success;
            if (Game.show_animations) {
                success = selected_bottom.connect_if_match_with_animation(selected_top);
            } else {
                success = selected_bottom.connect_if_match(selected_top);
            }

            if(!success) {
                Game.trigger_callout_transition({
                    name: "PieceConnectionFailed",
                    current: Game.current_rule
                });
                Logging.log({ name: "PieceConnectionFailed", puzzle_id: Game.current_puzzle })
            }
        }
    },

    dragging: function(e) {
        Game.destroy_all_animated_pieces();

        var dx = e.cx - this.drag_x;
        var dy = e.cy - this.drag_y;

        if (this.on_top) {
            if (this.connected != null) {
                this.connected.move_from_bottom(dx, dy);
            }
            if (this.inference_rule != null) {
                //this.inference_rule.bottom.move_from_top(0, dy);
                this.inference_rule.bottom.move_from_top(dx, dy);
                for (var i = 0; i < this.inference_rule.top.length; i++) {
                    var other = this.inference_rule.top[i];
                    if (other != this) {
                        //other.move_from_bottom(0, dy);
                        other.move_from_bottom(dx, dy);
                    }
                }
            }
        } else {
            if (this.connected != null) {
                //this.connected.move_from_top_adjusted(dx, dy);
                this.connected.move_from_top(dx, dy);
            }
            if (this.inference_rule != null) {
                for (var i = 0; i < this.inference_rule.top.length; i++) {
                    this.inference_rule.top[i].move_from_bottom(dx, dy);
                }
            }
            
        }

        if (this.is_rewrite()) {
            console.log("dragging");
            this.rewrite_location = null;
            var best_match = null;
            var best_top = null;
            var bottom = this.inference_rule.bottom;
            var bottom_x = bottom.x + (bottom.w / 2);
            for (var i = 0; i < this.open_on_top.length; i++) {
                var top = this.open_on_top[i];
                for (var j = 0; j < top.judgement.position_infos.length; j++) {
                    var position_info = top.judgement.position_infos[j];
                    if (bottom_x >= position_info.x &&
                        bottom_x <= position_info.x + position_info.w &&
                        Math.abs(bottom.y+50 - position_info.y) < 60) {
                        if (best_match === null ||
                            (position_info.x > best_match.x &&
                             position_info.w < best_match.w)) {
                            best_match = position_info;
                            best_top = top;
                        }
                    }
                }
            }
            if (best_match !== null) {
                Crafty.e("AnimatedFormula")
                .attr({x: best_match.x,
                       y: best_match.y - Globals.YTopBufferSpace,
                       w: best_match.w,
                       h: 100})
                .set_formula(best_match.t)
                .set_color("green");
                this.rewrite_location = {
                    top_puzzle_piece: best_top,
                    tree_within_puzzle_piece: best_match.t
                };
            }
        } else {
            for (var i = 0; i < this.open_on_bottom.length; i++) {
                var bottom = this.open_on_bottom[i];
                bottom.set_selected(false);
                for (var j = 0; j < this.open_on_top.length; j++) {
                    var top = this.open_on_top[j];
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
        }
        // console.log(Crafty.viewport._scale);
        // Awkward fix to a bug I don't understand. When the canvas is scaled,
        // there is a trace that is left behind during dragging. It's odd because 
        // it only happens only when the canvas is scaled. I don't know if this is a
        // bug in the browser, in Crafty or in the game. It's not fixed by simply
        // invalidating the dragged piece, but invalidating all pieces somehow
        // removes this shadow. However, dragging does become slower.
        if (Crafty.viewport._scale !== 1) {
            Game.redraw_all();
        }

        this.drag_x = e.cx;
        this.drag_y = e.cy;
    },

    translate_into_formula_index: function(x, y) {
        var dy = y - this.y;
        if (dy >= Globals.YTopBufferSpace*2) return -1;
        var dx = x - this.x;
        var i = Math.floor(dx/this.get_formula_width());
        return i;
    },

    get_formula_width: function() {
        return (this.w - 2) / (this.judgement.left.length + 1)
    },

    double_click: function(e) {
        if (this.on_top && this.connected == null) {
            var i = this.translate_into_formula_index(e.cx, e.cy);
            if (i !== -1) {
                if (!Game.double_clicked_piece) {
                    var formula_width = this.get_formula_width();
                    var cube_w = formula_width *0.9;
                    var cube_h = Globals.JudgementHeight*1.5;
                    var marker = 
                        Crafty.e("2D, Canvas, Color")
                        .attr({alpha: 0.2})
                        .attr({
                            x: this.x + (i+0.5) * formula_width-(cube_w/2),
                            y: this.y-10,
                            w: cube_w,
                            h: cube_h })
                        .color("cyan");

                    // var marker = 
                    //     Crafty.e("AnimatedFormula")
                    //     .attr({x: this.x + i * Globals.FormulaWidth,
                    //            y: this.y-10,
                    //            w: Globals.FormulaWidth,
                    //            h: 100})
                    //     .set_formula(formula)
                    //     .set_color("chartreuse");

                    var self = this;
                    Game.double_clicked_piece = {piece:self, i:i, marker: marker};
                    Game.foreach_piece(function(p) { if (p != self) p.set_greyed_out(true) });
                    Game.trigger_callout_transition({
                        name:"DoubleClickShape",
                        puzzle_id: Game.current_puzzle,
                        piece: self,
                        shape_id: i
                    });
                    Logging.log({ name:"DoubleClickShape_1", puzzle_id: Game.current_puzzle });
                } else {
                    if (Game.double_clicked_piece.piece == this) {
                        Game.trigger_callout_transition({
                            name:"DoubleClickShape",
                            puzzle_id: Game.current_puzzle,
                            piece: this,
                            shape_id: i
                        });
                        Logging.log({ name:"DoubleClickShape_2", puzzle_id: Game.current_puzzle });
                        var i1 = Game.double_clicked_piece.i;
                        var i2 = i;
                        var last_pos = this.judgement.left.length;
                        if (i1 != i2 && (i1 == last_pos || i2 == last_pos)) {
                            var i = (i1 == last_pos) ? i2 : i1;
                            Game.create_assumption_piece_for_double_click();
                            for (var k = 0; k < i; k++)
                                Game.add_context_left();
                            for (var k = i+1; k < this.judgement.left.length; k++)
                                Game.add_context_right();
                            var success = Game.current_rule.bottom.connect_if_match(this);
                            if (!success) {
                                Game.remove_current_rule();
                                Game.trigger_callout_transition({
                                    name:"FailedDoubleClickMatch",
                                    puzzle_id: Game.current_puzzle,
                                    piece: this,
                                    shape_id: i2
                                });
                                Logging.log({ name: "FailedDoubleClickMatch", puzzle_id: Game.current_puzzle });
                            }
                        } else {
                            Logging.log({ name: "FailedDoubleClickMatch", puzzle_id: Game.current_puzzle });
                        }
                    }
                    Game.clear_double_clicking();
                }
            }
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

    is_rewrite: function() {
        if (this.inference_rule != null)
            return this.inference_rule.is_rewrite;
        else
            return false;
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
            this.trigger("Invalidate");
        }
    },

    set_greyed_out: function(g) {
        if (this.greyed_out != g) {
            this.greyed_out = g;
            this.trigger("Invalidate");
        }
    },

    push_state: function () {
        var judgement = this.judgement;
        var connected = this.connected;
        this.history.push({j: judgement, c: connected})
    },

    pop_state: function () {
        var state = this.history.pop();
        this.judgement = state.j;
        this.connected = state.c;
        this.trigger("Invalidate");
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
        this.trigger("Invalidate");
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
        this.trigger("Invalidate");
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
        this.trigger("Invalidate");
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

    connect_if_match_with_animation: function(other) {
        if (!this.superficial_match(other)) return false;
        s = this.judgement.unify(other.judgement);
        if (s === false) return false;
        Game.push_history();
        this.connect_to(other);

        var self = this;
        setTimeout(function () {
            var meta_var_infos = [];
            if (self.inference_rule != null)
                self.inference_rule.foreach_piece(function (p) {
                    meta_var_infos = meta_var_infos.concat(p.judgement.meta_var_infos);
                });
            else
                meta_var_infos = meta_var_infos.concat(self.judgement.meta_var_infos);
            if (other.inference_rule != null)
                other.inference_rule.foreach_piece(function (p) {
                    meta_var_infos = meta_var_infos.concat(p.judgement.meta_var_infos)
                });
            else
                meta_var_infos = meta_var_infos.concat(other.judgement.meta_var_infos);
            
            var mv_by_name = [];
            for (var i = 0; i< meta_var_infos.length; i++) {
                var meta_var_info = meta_var_infos[i];
                var n = meta_var_info.t.n;
                if (!(n in s)) continue;
                // if (has_meta_var(s[n])) { 
                //     // don't animate meta-vars that map to other meta-vars
                //     meta_var_info.t.copy_from(s[n]);
                //     continue;
                // }
                if (!(n in mv_by_name)) { mv_by_name[n] = [] };
                mv_by_name[n].push(meta_var_info);
            };
            // redraw so that meta-var to meta-var mapping become visible right away
            //Game.redraw_all(); 
            for (n in mv_by_name) {
                mv_by_name[n].sort(function(a,b) { return b.y - a.y });
            }
            for (n in mv_by_name) {
                var bottom = mv_by_name[n][0];
                bottom.t.copy_from(s[n]);
                Crafty.e("AnimatedFormula")
                    .attr({x: bottom.orig_x, 
                           y: bottom.orig_y - Globals.YTopBufferSpace, 
                           w: bottom.full_w,
                           h: 100})
                    .set_formula(s[n])
                    .set_color(MetaVarManager.get_meta_var_color(n));
                for (var i = 1; i < mv_by_name[n].length; i++) {
                    var cont = eval("(function() {" +
                                    "   mv_by_name['" + n + "']["+i+"].t.copy_from(s['" + n + "']);" + 
                                    "   Game.redraw_all(); " +
                                    "   setTimeout(Game.destroy_all_animated_pieces, 2000);" +
                                    "               MetaVarManager.garbage_collect();"+
                                    " })");
                    Crafty.e("AnimatedFormula")
                        .attr({x: bottom.orig_x, 
                               y: bottom.orig_y - Globals.YTopBufferSpace, 
                               w: bottom.full_w,
                               h: 100})
                        .set_formula(s[n])
                        .set_color(MetaVarManager.get_meta_var_color(n))
                        .animate_to(mv_by_name[n][i].orig_x, 
                                    mv_by_name[n][i].orig_y - Globals.YTopBufferSpace, 
                                    mv_by_name[n][i].full_w, 
                                    100, cont);
                }
            }
            MetaVarManager.garbage_collect();
        }, 50);
        Game.trigger_callout_transition({
            name: "PieceConnected",
            current: Game.current_rule,
            other: other
        });
        Logging.log({ name: "PieceConnected", puzzle_id: Game.current_puzzle });
        MetaVarManager.garbage_collect();
        Game.current_rule = null;
        Game.check_if_solved();
        return true;
    },

    connect_if_match: function(other) {
        if (!this.superficial_match(other)) return false;
        s = this.judgement.unify(other.judgement);
        if (s === false) return false;
        Game.push_history();
        this.connect_to(other);
        Game.foreach_piece(function(p) { p.apply(s) });
        Game.trigger_callout_transition({
            name: "PieceConnected",
            current: Game.current_rule,
            other: other
        });
        Logging.log({name: "PieceConnected", puzzle_id: Game.current_puzzle });
        MetaVarManager.garbage_collect();
        Game.current_rule = null;
        Game.check_if_solved();
        return true;
    },

    make_all_fresh: function() {
        MetaVarManager.start_fresh();
        this.make_fresh();
    },

    make_fresh: function() {
        this.judgement.make_fresh();
        this.trigger("Invalidate");
    },

    apply: function(s) {
        this.judgement.apply(s);
        this.trigger("Invalidate");
    },

    distance_from_other: function(other) {
        return {x: this.x - other.x,
                y: this.y - other.y + (this.on_top? -0:0) }
    },

    distance_to_other: function(other) {
        return {x: other.x - this.x,
                y: other.y - this.y - (this.on_top? -0:0) }
    },

    add_live_vars: function(live_vars) {
        this.judgement.add_live_vars(live_vars);
    },

    apply_rewrite_if_match: function(rewrite, tree) {
        // rewrite: InferenceRule

        if (!rewrite.is_rewrite) {
           return false;
        }
        // bottom must be judgement with no assumptions
        // top must be a single judgement with no assumptions
        var src = rewrite.bottom.judgement.right;
        var dst = rewrite.top[0].judgement.right;
        var s = unify_trees(src, tree, {});
        if (s === false) return false;
        var rewritten_judgement = new Judgement(this.judgement.left, this.judgement.right);
        rewritten_judgement.rewrite(tree, apply_to_tree(dst, s));
        var top_puzzle_piece = Crafty.e('JudgementPuzzlePiece').set_judgement(rewritten_judgement);
        var bottom_puzzle_piece = Crafty.e('JudgementPuzzlePiece').set_judgement(this.judgement);
        var full_rewrite = new InferenceRule([top_puzzle_piece], bottom_puzzle_piece);
        Game.remove_current_rule();
        Game.current_rule = full_rewrite;
        Game.current_rule.place(150,150);
        var success = Game.current_rule.bottom.connect_if_match(this);
        if (!success) {
            Game.remove_current_rule();
        }
        return true;
    }

})

Crafty.c('AnimatedFormula', {
    ready: true,
    /*
     * Initialize the component.
     */
    init: function() {
        this.requires("2D, Canvas");
        this.formula = null;
        this.bind("Draw", function(obj) {
            this._draw(obj.ctx, obj.pos);
        });
    },
    _draw: function(c, pos) {
        var x = pos._x + 1;
        var y = pos._y + 1;
        var w = pos._w - 2;
        var h = pos._h - 2;
        
        t = new Turtle(c);
        // hack: dummy judgement so that we can collect meta var infos
        t.judgement = new Judgement();
        t.judgement.clear_all_infos();
        c.lineWidth = 5;
        c.strokeStyle = this.color;
        c.beginPath();
        t.move_to(x, y+Globals.YTopBufferSpace);
        this.formula.draw(t, w, false);
        c.stroke();

        for (var i = 0; i < t.judgement.meta_var_infos.length; i++) {
            var meta_var_info = t.judgement.meta_var_infos[i];
            var c = t.c;
            c.lineWidth = 5;
            c.strokeStyle = MetaVarManager.get_meta_var_color(meta_var_info.t.n);
            c.beginPath();
            t.move_to(meta_var_info.x, meta_var_info.y);

            var height = 20;
            t.up(height);
            t.right(meta_var_info.w);
            t.down(height);

            c.stroke();

        }

    },

    set_formula: function(f) {
        this.formula = f;
        return this
    },
    set_color: function(c) {
        this.color = c;
        return this
    },
    animate_to: function(x, y, w, steps, cont) { 
        if (this.x == x && this.y == y) return cont();
        this.x = this.x + (x - this.x)/steps;
        this.y = this.y + (y - this.y)/steps;
        this.w = this.w + (w - this.w)/steps;
        this.trigger("Invalidate");
        var self = this;
        setTimeout(function() { self.animate_to(x, y, w, steps-1, cont) }, 10);
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
    x: Var("x"),
    y: Var("y"),
    z: Var("z"),
    zero: Var("zero"),
    imp: function(e1,e2) {
        return BinExpr("imp", e1, e2);
    },
    and: function(e1, e2) {
        return BinExpr("and", e1, e2);
    },
    or: function(e1, e1) {
        return BinExpr("or", e1, e2);
    },
    equal: function(e1,e2) {
        return BinExpr("equal", e1, e2);
    },
    sum: function(e1, e2) {
        return BinExpr("sum", e1, e2);
    },
    s: function(e) {
        return UnaryExpr("s", e);
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

function build_judgement_piece(s, x_opt, y_opt) {
    var j = build_judgement(s);
    var p = Crafty.e('JudgementPuzzlePiece').set_judgement(j);
    if (arguments.length == 3)
        p.place(x_opt, y_opt);
    return p;
}

function build_inference_rule_piece(top, bottom, x, y) {
    var bottom_judgement = build_judgement_piece(bottom);
    var top_judgements = top.map(function (s) { return build_judgement_piece(s) });
    var r = new InferenceRule(top_judgements, bottom_judgement);
    r.make_all_fresh();
    r.place(x, y);
    return r;
}

ColorManager = {
    init: function() {
        ColorManager.colors = {};
        ColorManager.color_to_logic = {};

        ColorManager.add_color("rgba(255,0,0,1)","A");
        ColorManager.add_color("rgba(0,0,255,1)", "B");
        ColorManager.add_color("rgba(0,255,0,1)", "C");
        ColorManager.add_color("rgba(0,255,255,1)", "D");
        ColorManager.add_color("rgba(255,255,0,1)", "E");
        ColorManager.add_color("rgba(0,64,0,1)", "F");
        ColorManager.add_color("rgba(255,0,255,1)", "G");
        ColorManager.add_color("rgba(64,0,0,1)", "H");
        ColorManager.add_color("rgba(64,64,0,1)", "I");
        ColorManager.add_color("rgba(0,64,64,1)", "J");
        ColorManager.add_color("rgba(64,0,64,1)", "K");
        ColorManager.add_color("rgba(0,0,64,1)", "L");
        ColorManager.add_color("rgba(20,20,64,1)", "M");
    },
    add_color: function(color, logic) {
        ColorManager.colors[color] = false;
        ColorManager.color_to_logic[color] = logic
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
    },
    get_logic_rep: function(color) {
        return ColorManager.color_to_logic[color];
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
    // In addition to creating fresh metavars, we also create new nodes for
    // the entire tree. This is needed so that we can use the object reference
    // of a sub- tree as the location where to apply a rewrite.
    fresh_tree: function(t) {
        if (t == null)
            return null;
        if (t.is_meta_var()) 
            return Var(MetaVarManager.fresh_var(t.n));
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
    },
    get_all_meta_vars: function() {
        var all_vars = [];
        for (var v in MetaVarManager.vars) {
            all_vars.push(v)
        }
        return all_vars;
    }
}


Game = {

    init_puzzle_db: function() {

        Crafty.sprite("/assets/DownArrow.gif", {down_arrow:[0,0,128,128]});
        Crafty.sprite("/assets/UpArrow.gif", {up_arrow:[0,0,128,128]});
        Crafty.sprite("/assets/DownBlackArrow.gif", {down_black_arrow:[0,0,64,229]});
        
        var down_arrow = {
          sprite: "down_arrow",
          img_src: "/assets/DownArrow.gif",
          width: 128,
          height: 128
        }

        var up_arrow = {
          sprite: "up_arrow",
          img_src: "/assets/UpArrow.gif",
          width: 128,
          height: 128
        }

        var down_black_arrow = {
          sprite: "down_black_arrow",
          img_src: "/assets/DownBlackArrow.gif",
          width: 64,
          height: 229
        }

        var text = function(s,x,y) {
            return { message: s, x_offset: x, y_offset: y }
        }

        var sprite = function(name, x, y, w, h) {
            return { sprite: name, x_offset: x, y_offset: y, width: w, height: h }
        }

        Game.puzzles = [];

        // Puzzle 0
        Game.puzzle_range_start("game_1");
        Game.add_puzzle_with_tutorial("x,y |- x", [], function() {
            Game.shape_sprite_callout(0,2, down_arrow);
            Game.piece_text_callout(0, text("For each pink shape,<br>find a matching yellow one.<br> Double click the pink shape.", 50, -310))

            var first_double_click = {
                condition: Game.double_click_shape_condition({puzzle_id: 0, piece: Game.piece(0), shape_id: 2}),
                result: function(){
                    Game.clear_callouts();
                    Game.shape_sprite_callout(0,0, down_arrow);
                    Game.piece_text_callout(0, text("Double click the matching yellow shape.", 50, -310))
                }
            }
            Game.callout_transitions.push(first_double_click);
        });

        // Puzzle 1
        Game.add_puzzle_with_tutorial("x,y |- y", [], function() {
            Game.clear_callouts();
            Game.shape_sprite_callout(0, 2, down_arrow);
            Game.piece_text_callout(0, text("Double click the pink shape.", 50, -210));

            Game.callout_transitions.push({
                condition: Game.double_click_shape_condition({puzzle_id: 1, piece: Game.piece(0), shape_id: 2}),
                result: function(){
                    Game.clear_callouts();
                    Game.shape_sprite_callout(0, 1, down_arrow);
                    Game.piece_text_callout(0, text("Double click the matching yellow shape.", 50, -210))
                }
            });
        });

        // Puzzle 2
        Game.add_puzzle_with_tutorial("x,y,z |- x", [], function() {
            Game.clear_callouts();
            Game.shape_sprite_callout(0,3, down_arrow);
            Game.piece_text_callout_static(0, text("Find the matching yellow shape...", 50, -210))
        });

        // Puzzle 3
        Game.add_puzzle_with_tutorial("x,y,z |- y", [], function() {
            Game.clear_callouts();
            Game.piece_text_callout_static(0, text("On your own now!", 50, -210));
        });

        // Puzzle 4
        Game.add_puzzle_with_tutorial("x,y,z |- z", [], function() {
            Game.clear_callouts();
            Game.piece_text_callout_static(0, text("On your own now!", 50, -210));
        });

        // Puzzle 5
        Game.add_puzzle_with_tutorial("and(x,z), imp(x,y), z |- imp(x, y)", [], function(){
            Game.clear_callouts();
            Game.piece_text_callout_static(0, text("More complex shapes.<br>Same idea...", 50, -210))
        });

        // Puzzle 6
        Game.add_puzzle_with_tutorial("and(y,imp(x,z)), imp(x,x), and(z,x) |- and(y, imp(x,z))", [], function(){
            Game.clear_callouts();
            Game.piece_text_callout_static(0, text("More complex shapes.<br>Same idea...", 50, -210))
        });

        // Puzzle 7
        Game.add_puzzle_with_tutorial("imp(a,a) |- imp(a,a)", [], function() {
            Game.clear_callouts();
            Game.piece_text_callout_static(0, text("More complex shapes.<br>Same idea...", 50, -210))
        });

        // Puzzle 8
        Game.add_puzzle_with_tutorial("|- x", [], function() {
            Game.clear_callouts();
            Game.piece_text_callout_static(0, text("Wait, no yellow shapes? <br> What to do!!!", 0, -210))
            setTimeout(function() {
                Game.clear_callouts()
                Game.replace_current_rule(["x |- A"], "|- A", 300, 150);
                Game.piece_text_callout_static(2, text("Here's a special piece.<br>" +
                                                       "Notice the red ports.<br>", 500 , 50));
                Game.shape_sprite_callout(2,1, down_arrow);
                Game.shape_sprite_callout(1,0, up_arrow);
                setTimeout(function() {
                    Game.clear_callouts();
                    Game.piece_text_callout_static(2, text("Drag the piece along arrow<br>" + 
                                                           "and release.<br>" +
                                                           "Then watch the animation!<br>", 500 , 50));
                    var arrow_piece = Game.piece_sprite_callout_static(2, sprite("down_black_arrow", 325, 125, 64, 229));
                    Game.callout_transitions.push({
                        condition: {name: "StartDrag", matches: function(other) {return other.name == this.name} },
                        result: function() {
                            arrow_piece.destroy();
                            Game.callout_transitions.push({
                                condition: Game.piece_connected_condition(),
                                result: function() {
                                    setTimeout(function() {
                                        Game.clear_callouts()
                                        Game.piece_text_callout(2, text("Now match yellow & pink!", 50, -210))
                                        Game.shape_sprite_callout(2,0, down_arrow);
                                        Game.shape_sprite_callout(2,1, down_arrow);
                                    }, 5000);
                                }
                            });
                        }
                    });
                },5000);
            },5000);
        })

        // Puzzle 9
        Game.add_puzzle_with_tutorial("|- imp(x,y)", [], function() {
            Game.clear_callouts();
            Game.replace_current_rule(["imp(x,y) |- A"], "|- A");
            Game.piece_text_callout_static(2, text("Let's try another one.<br>" +
                                                   "Note how colored ports take on<br>" +
                                                   "the shape they are connected to.<br>", 550 , 50));

        })

        // Puzzle 10
        Game.add_puzzle_with_tutorial("|- imp(x,y)", [], function() {
            Game.clear_callouts();
            Game.replace_current_rule(["imp(x,y) |- imp(A,B)"], "|- imp(A,B)");
            Game.piece_text_callout_static(2, text("When a red port is connected<br>to a shape,<br>" +
                                                   "all red ports transform<br>to that shape.<br><br>" +
                                                   "Same for blue.<br> Same for all colored ports.", 550 , 50));

        })

        // Puzzle 11
        Game.add_puzzle_with_tutorial("|- and(x,y)", [], function() {
            Game.clear_callouts();
            Game.replace_current_rule(["and(A,y) |- and(x,B)"], "|- and(A,B)");
            Game.piece_text_callout_static(2, text("Let's try another one!<br>" + 
                                                   "Watch the animation again", 550 , 50));
        })

        // Puzzle 12
        Game.add_puzzle_with_tutorial("|- imp(x,x)", [], function() {
            Game.clear_callouts();
            Game.piece_text_callout_static(0, text("We need a special piece again!<br>" + 
                                                   "But where do we get it from?", 0, -210))
            setTimeout(function() {
                Game.clear_callouts()
                Game.piece_text_callout_static(0, text("Buttons create special pieces.<br>" + 
                                                       "Click the button.",0 , -210));
                Game.make_piece_visible("imp-intro");
                Game.dom_sprite_callout("imp-intro", up_arrow);
            }, 3000);
            Game.callout_transitions.push({
                condition: Game.piece_created_condition(["A |- B"], "|- imp(A,B)"),
                result: function(){
                    Game.clear_callouts()
                    Game.piece_text_callout_static(2, text("Now finish the puzzle!", 100, -110))
                }
            })
        });

        // Puzzle 13
        Game.puzzle_range_start("logic_1");
        Game.add_puzzle_with_tutorial("|- imp(y,y)", ["imp-intro"], function() {});

        // Puzzle 14
        Game.add_puzzle_with_tutorial("y |- imp(x, y)", ["imp-intro"], function() {

            Game.piece_text_callout(0, text("No matching shapes.<br>" + 
                                            "Try double clicking anyway.", 0, -210))
            Game.shape_sprite_callout(0,0, down_arrow);
            Game.shape_sprite_callout(0,1, down_arrow);

            var first_double_click = {
                condition: {name: "DoubleClickShape", matches: function(other){this.shape_id = other.shape_id;  return other.name == this.name}},
                result: function(){
                    Game.clear_callouts();
                    Game.shape_sprite_callout(0,this.condition.shape_id == 1 ? 0 : 1, down_arrow);
                    Game.piece_text_callout_static(0, text("No matching shapes.<br>Try double clicking anyway.", 0, -210));
                }
            }
            Game.callout_transitions.push(first_double_click);

            var second_double_click = {
                condition: {name: "FailedDoubleClickMatch", matches: function(other){return other.name == this.name}}, 
                predecessors: [first_double_click],
                result: function(){
                    Game.clear_callouts()
                    Game.piece_text_callout_static(0, text("It didn't work!<br>Here again, you need use a special piece.", 0, -210))
                    Game.dom_sprite_callout("imp-intro", up_arrow);
                }
            }
            Game.callout_transitions.push(second_double_click);

            var create_piece = {
                condition: Game.piece_created_condition(["A |- B"], "|- imp(A,B)"),
                result: function() {
                    Game.clear_callouts()
                    Game.piece_text_callout_static(0, text("Try to connect the two pieces.", 250, -210))
                    setTimeout(function() {
                        Game.clear_callouts()
                        Game.piece_text_callout_static(0, text("That didn't work!<br>" +
                                                               "The piece is not wide enough<br>" +
                                                               "You have to extend the piece.", 400, -410));
                        Game.make_piece_visible("add-context");
                        Game.dom_sprite_callout("add-context", up_arrow);
                    }, 6000)
                }
            };
            Game.callout_transitions.push(create_piece);

            Game.callout_transitions.push({
                condition: Game.context_added_condition(),
                predecessors: [create_piece],
                result: function(){
                    Game.clear_callouts()
                    Game.piece_text_callout_static(0, text("Now connect and solve the puzzle!<br>" +
                                                           "Keep watching the animations", 0, -400))
                }
            });
        });

        // Puzzle 15
        Game.add_puzzle_with_tutorial("|- imp(x, imp(y,x))", ["imp-intro", "add-context"], function() {
            Game.piece_text_callout_static(0, text("You try it", 50, -310));

            Game.callout_transitions.push({
                condition: Game.piece_created_condition(),
                result: function() {
                    Game.clear_callouts()
                }
            });
        });

        // Puzzle 16
        Game.add_puzzle_with_tutorial("x,y |- imp(x, y)", ["imp-intro", "add-context"], function() {
        });

        Game.puzzle_range_end("logic_1");

        // Puzzle 17, don't include in paper exercises
        Game.add_puzzle_with_tutorial("y |- and(y, y)", ["imp-intro", "add-context"], function() {
            Game.clear_callouts();
            Game.piece_text_callout(0, text("Try to create & connect a piece of the right size", -100, -400));

            Game.callout_transitions.push({
                condition: {name: "PieceConnectionFailed", matches: function(other){return other.name == this.name}},
                result: function() {
                    setTimeout(function() {
                        Game.clear_callouts()
                        Game.piece_text_callout_static(0, text("That didn't work!<br> The semi-circle doesn't fit into the triangle....<br>What to do...", 0, -310));
                        setTimeout(function() {
                            Game.clear_callouts();
                            Game.piece_text_callout_static(1, text("Let's try this other piece with a triangle facing down", 0, -310));
                            Game.make_piece_visible("and-intro");
                            Game.dom_sprite_callout("and-intro", up_arrow);
                        }, 4000)
                    }, 2000)
                }
            });

            Game.callout_transitions.push({
                condition: Game.piece_created_condition(["|- A", "|- B"], "|- and(A,B)"),
                result: function() {
                    Game.clear_callouts();
                    Game.piece_text_callout_static(0, text("Try to finish the puzzle<br>Again look at the animations", 0, -410));
                }
            });
        });

        // Puzzle 18
        Game.puzzle_range_start("logic_2");
        Game.add_puzzle_with_tutorial("x,y |- and(x, y)", ["and-intro", "imp-intro", "add-context"], function() {

            Game.clear_callouts()
            Game.piece_text_callout_static(0, text("On your own!", 50, -310));

            Game.callout_transitions.push({
                condition: Game.piece_created_condition(),
                result: function() {
                    Game.clear_callouts()
                }
            })

        });

        // Puzzle 19
        Game.add_puzzle_with_tutorial("z,x |- imp(y, z)", ["and-intro", "imp-intro", "add-context"], function() {
        });

        // Puzzle 20
        Game.add_puzzle_with_tutorial("z |- imp(y, and(y,z))", ["and-intro", "imp-intro", "add-context"], function() {
        });

        // Puzzle 21
        Game.add_puzzle_with_tutorial("z |- and(imp(x,x), z)", ["and-intro", "imp-intro", "add-context"], function() {
        });

        // Puzzle 22
        Game.add_puzzle_with_tutorial("|- imp(z, and(z, imp(x,x)))", ["and-intro", "imp-intro", "add-context"], function() {
        });

        Game.puzzle_range_end("logic_2");

        // Puzzle 23
        Game.add_puzzle_with_tutorial("and(y,x) |- y", ["and-intro", "imp-intro", "add-context"], function() {

            Game.piece_text_callout(0, text("We will soon need something new.<br>But let's first try this piece.", 150, -400));
            Game.dom_sprite_callout("imp-intro", up_arrow);

            Game.callout_transitions.push({
                condition: Game.piece_created_condition(["A |- B"], "|- imp(A,B)"),
                result: function() {
                    Game.clear_callouts();
                    Game.piece_text_callout_static(0, text("Extend and try to connect", 400, -410));
                    Game.dom_sprite_callout("add-context", up_arrow);
                    Game.callout_transitions.push({
                        condition: Game.context_added_condition(),
                        result: function() {
                            Game.clear_callouts();
                            Game.piece_text_callout_static(0, text("Extend and try to connect", 400, -410));
                            setTimeout(function() {
                                Game.clear_callouts();
                                Game.piece_text_callout(0, text("D'oh! Semi-circle doesn't fit.<br>" +
                                                                "Let's try the other piece.", 50, -400));
                                Game.dom_sprite_callout("and-intro", up_arrow);

                                Game.callout_transitions.push({
                                    condition: Game.piece_created_condition(["|- A", "|- B"], "|- and(A,B)"),
                                    result: function() {
                                        Game.clear_callouts();
                                        Game.piece_text_callout_static(0, text("Extend and try to connect", 400, -410));
                                        Game.dom_sprite_callout("add-context", up_arrow);
                                        Game.callout_transitions.push({
                                            condition: Game.context_added_condition(),
                                            result: function() {
                                                Game.clear_callouts();
                                                Game.piece_text_callout_static(0, text("Extend and try to connect", 400, -410));
                                                setTimeout(function() {
                                                    Game.clear_callouts();
                                                    Game.piece_text_callout(0, text("Downward triangle doesn't fit either.<br>" +
                                                                                    "We need a new piece!", 50, -400));

                                                    setTimeout(function() {
                                                        Game.make_piece_visible("and-elim-1");
                                                        Game.dom_sprite_callout("and-elim-1", up_arrow);

                                                        var create_piece = {
                                                            condition: Game.piece_created_condition(["|- and(A,B)"], "|- A"),
                                                            result: function() {
                                                                Game.clear_callouts()
                                                                Game.piece_text_callout(0, text("Extend, connect, and watch the animation", 0, -400))
                                                            }
                                                        };
                                                        Game.callout_transitions.push(create_piece);

                                                        Game.callout_transitions.push({
                                                            condition: Game.piece_connected_condition(),
                                                            result: function() {
                                                                setTimeout(function() {
                                                                    Game.clear_callouts()
                                                                    Game.piece_text_callout(0, text("The blue port will take on any shape it is connected to.<br>"+
                                                                                                    "Double click the yellow and with pink shapes.", -50, -400));
                                                                    Game.shape_sprite_callout(2,0, down_arrow);
                                                                    Game.shape_sprite_callout(2,1, down_arrow);
                                                                }, 5000);
                                                            }
                                                        });
                                                    }, 2000);
                                                }, 6000);
                                            }
                                        });
                                    }
                                });
                            }, 6000);
                        }
                    });
                }
            });
        });

        // Puzzle 24
        Game.puzzle_range_start("logic_3");
        Game.add_puzzle_with_tutorial("|- imp(and(z,y), z)", ["and-intro", "and-elim-1", "imp-intro", "add-context"], function() {
        })

        // Puzzle 25
        Game.add_puzzle_with_tutorial("and(z,y), x |- and(x,z)", ["and-intro", "and-elim-1", "imp-intro", "add-context"], function() {
        })

        Game.puzzle_range_end("logic_3");

        // Puzzle 26
        Game.add_puzzle_with_tutorial("and(x,z) |- z", ["and-intro", "and-elim-1", "imp-intro", "add-context"], function() {
            Game.piece_text_callout(0, text("For this puzzle, you will need a new kind of piece.", 50, -400))
            Game.make_piece_visible("and-elim-2");
            Game.dom_sprite_callout("and-elim-2", up_arrow);
            var create_piece = {
                condition: Game.piece_created_condition(["|- and(A,B)"], "|- B"),
                result: function() {
                    Game.clear_callouts()
                }
            };
            Game.callout_transitions.push(create_piece);
        });

        // Puzzle 27
        Game.puzzle_range_start("logic_4");
        Game.add_puzzle_with_tutorial("and(z,y) |- z", ["and-intro", "and-elim-1", "and-elim-2", "imp-intro", "add-context", "undo"], function() {
            Game.piece_text_callout_static(0, text("Note the restart and undo buttons,<br>which may come in handy.", 50, -300))
            Game.dom_sprite_callout("restart", up_arrow);
            Game.dom_sprite_callout("undo", up_arrow);
            setTimeout(function() { Game.clear_callouts(); }, 6000);
        });

        // Puzzle 28
        Game.add_puzzle("and(y,x) |- x", ["and-intro", "and-elim-1", "and-elim-2", "imp-intro", "add-context", "undo"]);

        // Puzzle 29
        Game.add_puzzle("and(x,y) |- and(y,x)", ["and-intro", "and-elim-1", "and-elim-2", "imp-intro", "add-context", "undo"]);

        // Session for home
        Game.puzzle_range_switch("logic_4", "logic_5");
        Game.puzzle_range_switch("game_1", "game_2");
        var pieces_for_2nd_session = ["and-intro", "and-elim-1", "and-elim-2", "imp-intro", "add-context", "undo"];
        Game.add_puzzle("|- imp(y,y)", pieces_for_2nd_session); // 30
        Game.add_puzzle("x |- imp(z,x)", pieces_for_2nd_session); // 31
        Game.add_puzzle("|- imp(z,imp(y,z))", pieces_for_2nd_session); // 32
        Game.add_puzzle("z |- and(z,z)", pieces_for_2nd_session); // 33
        Game.add_puzzle("y,x |- and(x,y)", pieces_for_2nd_session); // 34
        Game.add_puzzle("x |- imp(z,and(z,x))", pieces_for_2nd_session); // 35
        Game.add_puzzle("|- imp(z,and(z,z))", pieces_for_2nd_session); // 36
        Game.add_puzzle("|- imp(x, imp(y, and(x,y)))", pieces_for_2nd_session); // 37
        Game.add_puzzle("x,y |- imp(x,y)", pieces_for_2nd_session); // 38
        Game.add_puzzle("and(y,x) |- y", pieces_for_2nd_session); // 39
        Game.add_puzzle("and(y,z) |- z", pieces_for_2nd_session); // 40
        Game.add_puzzle("and(x,y) |- imp(x,y)", pieces_for_2nd_session); // 41
        // Game.add_puzzle("and(and(x,y),z) |- x", pieces_for_2nd_session); 

        Game.add_puzzle_with_tutorial("x, imp(x,y) |- y", pieces_for_2nd_session, function() {
            Game.piece_text_callout(0, text("For this puzzle, you will need a new kind of piece.", 50, -300))
            Game.make_piece_visible("imp-elim");
            Game.dom_sprite_callout("imp-elim", up_arrow);
            Game.callout_transitions.push({
                condition: Game.piece_created_condition(["|- A", "|- imp(A,B)"], "|- B"),
                result: function() {
                    Game.clear_callouts();
                    Game.piece_text_callout(0, text("Extend and connect", 0, -400));
                    Game.callout_transitions.push({
                        condition: Game.piece_connected_condition(),
                        result: function() {
                            setTimeout(function() {
                                Game.clear_callouts();
                                // Game.piece_text_callout(2, text("Note how this will<br>change to a triangle", 400, -225));
                                // Game.shape_sprite_callout(2,2, down_arrow);

                                // Game.piece_text_callout(3, text("Double click these.<br>Red becomes a triangle", 225, -225));
                                // Game.shape_sprite_callout(3,1, down_arrow);
                                // Game.shape_sprite_callout(3,2, down_arrow);

                                Game.piece_text_callout(2, text("Double click these two", 150, -200));
                                Game.shape_sprite_callout(2,0, down_arrow);
                                Game.shape_sprite_callout(2,2, down_arrow);
                                Game.piece_text_callout(3, text("Note how ALL Red ports<br>will change to a triangle", 0, -225));
                                Game.shape_sprite_callout(3,2, down_arrow);

                                var double_click_1 = {
                                    condition: Game.double_click_shape_condition({puzzle_id: 42, piece: Game.piece(2), shape_id: 0}),
                                    result: function() {}
                                }
                                var double_click_2 = {
                                    condition: Game.double_click_shape_condition({puzzle_id: 42, piece: Game.piece(2), shape_id: 2}),
                                    result: function() {}
                                }
                                Game.callout_transitions.push(double_click_1);
                                Game.callout_transitions.push(double_click_2);
                                Game.callout_transitions.push({
                                    condition: Game.piece_connected_condition(),
                                    predecessors: [double_click_1, double_click_2],
                                    result: function() {
                                        setTimeout(function() {
                                            Game.clear_callouts();
                                            Game.piece_text_callout(3, text("Now finish the puzzle", 0, -225));
                                        }, 3000)
                                    }
                                })
                            }, 5000);
                        }
                    });
                }
            });
                    
        }); // 42

        var all_pieces = ["and-intro", "and-elim-1", "and-elim-2", "imp-intro", "imp-elim", "add-context", "undo"];
        Game.add_puzzle_with_tutorial("imp(y,z), y |- z", all_pieces, function(){
            Game.piece_text_callout(0, text("Again, use this piece.", 50, -300))
            Game.dom_sprite_callout("imp-elim", up_arrow);
            Game.callout_transitions.push({
                condition: Game.piece_created_condition(["|- A", "|- imp(A,B)"], "|- B"),
                result: function() {
                    Game.clear_callouts();
                }
            });
        }); // 43

        Game.add_puzzle("|- imp(x, imp(imp(x,y), y))", all_pieces); // 44

        // Game.add_puzzle("and(and(x,y),z) |- y", pieces_for_2nd_session);
        // Game.add_puzzle("and(and(x,y),z) |- z", pieces_for_2nd_session);
        // Game.add_puzzle("and(and(x,y),z) |- and(y,z)", pieces_for_2nd_session);
        // Game.add_puzzle("and(and(x,y),z) |- and(x,z)", pieces_for_2nd_session);

        Game.puzzle_range_end("logic_5");
        Game.puzzle_range_end("game_2");

        // These are puzzles for a quick demo for presentation purposes
        // Game.add_puzzle("x,y |- x", all_pieces); // 45
        // Game.add_puzzle("x,y,z |- z", all_pieces); // 46
        // Game.add_puzzle("|- imp(y,y)", all_pieces); // 47
        // Game.add_puzzle("z |- and(z,z)", all_pieces); // 48

        // Game.add_puzzle("|- equal(sum(zero,zero),zero)", all_pieces);
        // Game.add_puzzle("equal(sum(x,zero),x) |- equal(sum(s(x),zero),s(x))", all_pieces);
        Game.add_puzzle("|- equal(sum(x,zero),x)", all_pieces);
    },

    // Initialize and start our game
    start: function(range_name) {

        Game.init_puzzle_db();

        if (range_name === undefined) {
            Game.puzzle_range = { start: 0, end: Game.puzzles.length }
        } else {
            Game.puzzle_range = Game.puzzle_ranges[range_name];
        }

        ColorManager.init();
        MetaVarManager.init();
        Game.current_rule = null;
        Game.show_logic = false;
        Game.show_animations = true;

        function qs(key) {
            key = key.replace(/[*+?^$.\[\]{}()|\\\/]/g, "\\$&"); // escape RegEx meta chars
            var match = location.search.match(new RegExp("[?&]"+key+"=([^&]+)(&|$)"));
            return match && decodeURIComponent(match[1].replace(/\+/g, " "));
        }

        var current_puzzle = qs("puzzle_id");
        if (current_puzzle == null) {
            if (range_name === undefined) {
                current_puzzle = parseInt(window.saved_current_puzzle);
            } else {
                current_puzzle = Game.puzzle_range.start;
            }
        } else {
            current_puzzle = parseInt(current_puzzle);
            // if (current_puzzle < 0)
            //     current_puzzle = 0;
            // if (current_puzzle > Game.puzzles.length-1)
            //     current_puzzle = Game.puzzles.length-1;
        }
        Game.current_puzzle = current_puzzle;

        Crafty.init(1300, 600);
        Crafty.background('rgb(240,240,240)');
        Game.start_current_puzzle();

        //Crafty.addEvent(this, "mousewheel", Game.mouseWheelDispatch);
        //Game.mouseWheelDispatch({wheelDelta:-120});
        //Game.mouseWheelDispatch({wheelDelta:-120});
        //Game.mouseWheelDispatch({wheelDelta:-120});
        //Game.mouseWheelDispatch({wheelDelta:-120});

        //Create a canvas for special effects.
        var c = document.createElement("canvas");
        c.width = Crafty.viewport.width;
        c.height = Crafty.viewport.height;
        c.style.position = 'absolute';

        Crafty.stage.elem.appendChild(c);

        var ctx = c.getContext('2d');

        Game.effects_canvas = ctx
        Game.effects_image_data = Game.effects_canvas.getImageData(0,0,Crafty.viewport.width,Crafty.viewport.height);

        //Crafty.e("AnimatedFormula").attr({x: 200, y: 200, w:200, h:100}).set_formula("and(a, b)").animate_to(300, 400, 100, 100);
        Game.spinner = Crafty.e("Spinner");
    },

    callouts: [],

    context_added_condition: function(){
       return {name: "ContextAdded",
               matches: function(other){
                 return other.name == this.name  
               }
              }
    },

    piece_created_condition: function(top, bottom){
       return {name: "PieceCreated",
               top: top,
               bottom: bottom,
               matches: function(other){
                 return other.name == this.name &&
                        (JSON.stringify(other.top) == JSON.stringify(this.top) || this.top == undefined )  &&
                        (JSON.stringify(other.bottom) == JSON.stringify(this.bottom) || this.bottom == undefined)
               }
              }
    },

    condition_satisfied: function(){
       return {name: "ConditionSatisfied",
               matches: function(other){
                 return other.name == this.name  
               }
              }
    },

    puzzle_change_condition: function(puzzle_id){
       return {name: "PuzzleStart", 
               puzzle_id: puzzle_id,
               matches: function(other) { return other.name == this.name && other.puzzle_id == this.puzzle_id }
              }
    },

    double_click_shape_condition: function(shape_data){
       return {name: "DoubleClickShape", puzzle_id: shape_data.puzzle_id, piece: shape_data.piece, shape_id: shape_data.shape_id, 
                 matches: function(other){
                             return other.name == this.name && other.piece == this.piece && other.shape_id == this.shape_id
                           }
              }
    },  

    piece_connected_condition: function(){
       return {name: "PieceConnected", 
                 matches: function(other){
                             return other.name == this.name 
                           }
              }
    },

    connection_failed_condition: function(){
       return {name: "PieceConnectionFailed", 
                 matches: function(other){
                             return other.name == this.name 
                           }
              }
    },

    callout_transitions: [],

    trigger_callout_transition: function(condition) {

        for(var i = 0; i < Game.callout_transitions.length; i++) {
            if(Game.callout_transitions[i].predecessors) {
                var satisfactions = Game.callout_transitions[i].predecessors.map(function(p){return p.satisfied})
                if(satisfactions.indexOf(false) >= 0 || satisfactions.indexOf(undefined) >= 0)
                    continue;
            }

            if(Game.callout_transitions[i].condition.matches(condition)) {
                var current = Game.callout_transitions[i]
                if(!current.persist)
                  Game.callout_transitions.splice(i,1)
                current.result()
                current.satisfied = true
                Game.trigger_callout_transition({name: "ConditionSatisfied", condition: current})
                break;
            }
        }
    },

    piece_text_callout_static: function(piece_id, callout_data) {
        var p = Game.piece(piece_id)

        var callout = 
            Crafty.e("2D, DOM, Text")
            .attr({ x: p.x + callout_data.x_offset, y: p.y + callout_data.y_offset, w: 800 })
            .text(callout_data.message)
            .textFont({ size: '30px', weight: 'bold' });

        Game.callouts.push(callout);

        return callout
    },

    piece_sprite_callout_static: function(piece_id, callout_data) {
        var p = Game.piece(piece_id);

        var callout = 
            Crafty.e("2D, DOM, " + callout_data.sprite)
            .attr({ x: p.x + callout_data.x_offset, 
                    y: p.y + callout_data.y_offset, 
                    w: callout_data.width, 
                    h: callout_data.height });

        Game.callouts.push(callout);

        return callout;
    },

    piece_text_callout: function(piece_id, callout_data) {
        var p = Game.piece(piece_id)
        var callout = Game.piece_text_callout_static(piece_id, callout_data)
        //p.attach(callout);
    },

    shape_sprite_callout: function(piece_id, shape_id, callout_data) {
        var p = Game.piece(piece_id);

        var callout = Crafty.e("2D, DOM, " + callout_data.sprite)
            .attr({x: p.x + (shape_id+0.5) * Globals.FormulaWidth-(callout_data.width/2), 
                   y: callout_data.sprite == "down_arrow" ? (p.y-callout_data.height) : (p.y+Globals.JudgementHeight), 
                   w: callout_data.width, 
                   h: callout_data.height});

        p.attach(callout);

        Game.callouts.push(callout);
    },

    dom_sprite_callout: function(dom_id, callout_data){
       var other = $("#"+dom_id);
       var callout = $("<img id='' style='position:absolute; top:"+ (other.position().top + other.height() ) +"px; left:"+ (other.position().left + other.width()/2 - callout_data.width/2) +"px' src='"+callout_data.img_src+"'/>");
       $("body").append(callout)

       Game.callouts.push({destroy: function(){
          callout.remove()             
       }});
               
    },

    clear_callouts: function(){
       for(var i = 0; i < Game.callouts.length; i++) {
          Game.callouts[i].destroy()
       }
       Game.callouts = []
    },

    redraw_all: function() {
        Game.foreach_piece(function(p) { p.trigger("Invalidate") });
    },

    clear: function() {
        Game.current_rule = null;
        Game.foreach_piece(function (p) { p.destroy() });
        Game.clear_callouts();
        MetaVarManager.garbage_collect();
        Game.clear_double_clicking();
        if (Game.finished_text) {
            Game.finished_text.destroy();
            Game.finished_text = null;
        }
        if (Game.puzzle_id_text) {
            Game.puzzle_id_text.destroy();
            Game.puzzle_id_text = null;
        }
    },

    add_puzzle: function(goal, pieces) {
        Game.puzzles.push({goal: goal, pieces: pieces});
    },

    add_puzzle_with_tutorial: function(goal, pieces, tutorial) {
        var i = Game.puzzles.length;
        Game.puzzles.push({goal: goal, pieces:pieces});
        Game.callout_transitions.push({
            condition: Game.puzzle_change_condition(i),
            persist: true,
            result: tutorial
        });
    },

    puzzle_range_start: function(s) {
        if (!Game.puzzle_ranges) {
            Game.puzzle_ranges = {};
        }
        Game.puzzle_ranges[s] = {};
        Game.puzzle_ranges[s].start = Game.puzzles.length;
    },

    puzzle_range_end: function(s) {
        Game.puzzle_ranges[s].end = Game.puzzles.length;
    },

    puzzle_range_switch: function(end, start) {
        Game.puzzle_range_end(end);
        Game.puzzle_range_start(start);
    },

    next_puzzle: function() {
        Game.current_puzzle++;
        Game.start_current_puzzle();
    },

    restart: function(){
        Game.start_current_puzzle(false);
        Logging.log({ name: "PuzzleReStart", puzzle_id: Game.current_puzzle });
    },

    prev_puzzle: function() {
        Game.current_puzzle--;
        Game.start_current_puzzle();
    },

    start_current_puzzle: function(do_log_opt /* = true */) {
        var do_log = true;
        if (arguments.length == 1) {
            do_log = do_log_opt;
        }
        Game.clear();
        var current_puzzle = Game.current_puzzle;
        if (current_puzzle < Game.puzzle_range.start ||
            current_puzzle >= Game.puzzle_range.end) {
            Game.finished_text = 
                Crafty.e("2D, DOM, Text")
                .attr({ x: 100, y: 100, w: 800 })
                .text("You finished the puzzles in this session!")
                .textFont({ size: '50px' });
            return;
        }

        Game.puzzle_id_text = 
            Crafty.e("2D, DOM, Text")
            .attr({ x: 1280, y: 5, w: 20 })
            .text(current_puzzle.toString())
            .textFont({ size: '14x', weight: 'bold' });
        var x = 400;
        var y = 450;
        var goal_str = Game.puzzles[current_puzzle].goal;
        // total hack, need better solution
        if (goal_str === "x, imp(x,y) |- y") { x = 350; }
        else if (goal_str === "imp(y,z), y |- z") { x = 350; }
        else if (goal_str === "|- imp(x, imp(imp(x,y), y))") { x = 550; }
        var goal = build_judgement_piece(goal_str, x, y);
        goal.make_all_fresh();
        var pieces = Game.puzzles[current_puzzle].pieces;
        var all_pieces = ["and-intro",
                          "and-elim-1",
                          "and-elim-2",
                          "imp-intro",
                          "imp-elim", 
                          "add-context",
                          "undo",
                         ];

        Game.history_count = 0;
        goal.push_state();
        if (pieces === "all")
            pieces = all_pieces
        else {
            for (var i = 0; i < all_pieces.length; i++) {
                Game.make_piece_hidden(all_pieces[i]);
            }
        }
        for (var i = 0; i < pieces.length; i++) {
            Game.make_piece_visible(pieces[i]);
        }

        var transitions_to_keep = []
        for(var i = 0; i < Game.callout_transitions.length; i++)  {
          var current = Game.callout_transitions[i]
          if (current.persist)
              transitions_to_keep.push(current)
        }
        Game.callout_transitions = transitions_to_keep;
        Game.trigger_callout_transition({
            name: "PuzzleStart",
            puzzle_id: Game.current_puzzle
        });
        if (do_log) {
            Logging.log({ name: "PuzzleStart", puzzle_id: Game.current_puzzle });
            Game.start_time = new Date().getTime();
        }

        $.ajax({
          type: "PUT",
          url: "/user_infos/"+info_id+".json",
          data: {user_info: {current_puzzle: current_puzzle}}
        });

    },

    make_piece_visible: function(piece_name) {
        document.getElementById(piece_name).style.visibility="visible";
    },

    make_piece_hidden: function(piece_name) {
        document.getElementById(piece_name).style.visibility="hidden";
    },

    remove_current_rule: function(p) {
        if (Game.current_rule != null) {
            Game.current_rule.destroy();
            MetaVarManager.garbage_collect();
            Game.current_rule = null;
        }
    },

    replace_current_rule: function(top, bottom, x_opt /* = 150 */, y_opt /* = 150 */) {
        var x = 150;
        var y = 150;
        if (arguments.length == 4) {
            x = x_opt;
            y = y_opt;
        }
        Game.clear_double_clicking();
        Game.remove_current_rule();
        Game.current_rule = build_inference_rule_piece(top, bottom, x, y);
        Game.trigger_callout_transition({name: "PieceCreated", top:top, bottom:bottom});
        Logging.log({ name: "PieceCreated", puzzle_id: Game.current_puzzle, top:top, bottom:bottom});
    },

    create_assumption_piece_for_double_click: function() {
        Game.remove_current_rule();
        Game.current_rule = build_inference_rule_piece([], "A |- A", 150, 150);
    },

    create_assumption_piece: function() {
        Game.replace_current_rule([], "A |- A");
    },

    create_and_intro_piece: function() {
        Game.replace_current_rule(["|- A", "|- B"], "|- and(A,B)");
    },

    create_and_elim_piece_1: function() {
        Game.replace_current_rule(["|- and(A,B)"], "|- A");
    },

    create_and_elim_piece_2: function() {
        Game.replace_current_rule(["|- and(A,B)"], "|- B");
    },

    create_imp_intro_piece: function() {
        Game.replace_current_rule(["A |- B"], "|- imp(A,B)");
    },

    create_imp_elim_piece: function() {
        Game.replace_current_rule(["|- A", "|- imp(A,B)"], "|- B");
    },

    create_special_piece_1: function() {
        Game.replace_current_rule(["|- A"], "|- sum(zero,A)");
        Game.current_rule.make_into_rewrite();
    },

    create_special_piece_2: function() {
        Game.replace_current_rule(["|- s(sum(A,B))"], "|- sum(s(A),B)");
        Game.current_rule.make_into_rewrite();
    },

    create_special_piece_3: function() {
        Game.replace_current_rule([], "|- equal(A,A)")
    },

    add_context_from_ui: function() {
        Game.add_context_left();
        Game.trigger_callout_transition({name: 'ContextAdded'})
        Logging.log({name: 'ContextAdded', puzzle_id: Game.current_puzzle})
    },

    add_context_left: function() {
        Game.add_context(true);
    },

    add_context_right: function() {
        Game.add_context(false)
    },

    add_context: function(left) {
        Game.clear_double_clicking();
        if (Game.current_rule != null) {
            Game.current_rule.add_context(left);
            Game.current_rule.place(Game.current_rule.x, Game.current_rule.y);
        }
    },

    is_puzzle_solved: function() {
        var solved = true;
        Game.foreach_piece(function (p) {
            if (p.on_top && p.connected == null)
                solved = false;
        });
        return solved;
    },

    check_if_solved: function() {
        if (Game.is_puzzle_solved()) {
            var time_delta = new Date().getTime() - Game.start_time;
            Logging.log({ name: "PuzzleSolved", puzzle_id: Game.current_puzzle, time_delta: time_delta })
            setTimeout(function() {
                alert("Yay, you solved this puzzle!\nOn to the next one!");
                setTimeout(Game.next_puzzle, 250);
                // if (Game.current_puzzle < Game.puzzles.length-1) {
                //     alert("Yay, you solved this puzzle!\nOn to the next one!");
                //     Game.next_puzzle();
                // } else {
                //     alert("Yay, you solved this puzzle!\nCongrats, you solved all the puzzles!");
                //     Game.clear();
                // }
            }, 250);
        }
    },

    foreach_piece: function(f) {
        var ids = Crafty("JudgementPuzzlePiece");
        for (var i = 0; i < ids.length; i++) {
            f(Crafty(ids[i]));
        }
    },

    piece: function(i){
        var ids = Crafty("JudgementPuzzlePiece");
        return Crafty(ids[i])     
    },

    destroy_all_animated_pieces: function() {
        var ids = Crafty("AnimatedFormula");
        for (var i = 0; i < ids.length; i++) {
            Crafty(ids[i]).destroy();
        }
    },

    push_history: function() {
        Game.history_count = Game.history_count + 1;
        Game.foreach_piece(function(p) {
            p.push_state()
        })
    },

    pop_history: function() {
        Game.clear_double_clicking();
        if (Game.history_count > 0) {
            Game.history_count = Game.history_count - 1;
            Game.foreach_piece(function(p) {
                if (p.history.length == 1)
                    p.destroy()
                else {
                    p.pop_state()
                }
            })
        }
    },

    toggle_logic: function() {
        Game.clear_double_clicking();
        Game.show_logic = !Game.show_logic;
        Game.foreach_piece(function(p) {
            p.set_greyed_out(Game.show_logic)
        })
    },

    toggle_animations: function() {
        Game.show_animations = !Game.show_animations;
    },

    zoom_in: function() {
        Crafty.viewport.scale(Crafty.viewport._scale / 0.9);
    },

    zoom_out: function() {
        Crafty.viewport.scale(Crafty.viewport._scale * 0.9);
    },

    mouseWheelDispatch: function(e) {
        console.log(e);
        var delta = (e.wheelDelta? e.wheelDelta/120 : evt.detail)/2;
        console.log(delta);
        Crafty.viewport.zoom(delta < 0 ? 0.9 : 1/0.9, 1300/2, 600/2, 100);
        //Crafty.trigger("Invalidate");
        Crafty.DrawManager.drawAll();
        // Crafty.viewport.zoom(
        // (delta>0)? (delta+1) : 1/(-delta+1)
        // , Crafty.viewport.width/2
        // , Crafty.viewport.height/2
        // , 10);
    },

    clear_double_clicking: function() {
        if (Game.double_clicked_piece) {
            Game.foreach_piece(function(p) { p.set_greyed_out(Game.show_logic) });
            Game.double_clicked_piece.marker.destroy();
            Game.double_clicked_piece = null;
        }
    }

}

// function make_transparent(str, alpha)
// {
//   var split = str.split(",")
//   split[3] = alpha + ")"
//   return split.join(",")
// }

