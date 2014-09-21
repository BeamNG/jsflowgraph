function FGNodeProperty(parent, isInput, name) {
    this.parent = parent;
    this.isInput = isInput;
    this.name = name;
    this.row = this.parent.rowCount++;
    
    this.container = new createjs.Container();
    parent.container.addChild(this.container);
    this.container.x = 0;
    this.container.y = rowHeight * this.row;
    this.container.width = parent.container.width;
    this.container.height = rowHeight;

    //this._draw();
}


FGNodeProperty.prototype._draw = function() {
    this._drawBackground();
    this._drawTitle();
    this._drawDock();
}

FGNodeProperty.prototype._drawValue = function() {
    if(this.value) {
        var bgColorSel2 = lightUpRGBA(this.parent.color, 200)
        var val = this.value;
        if(val < -1) val = -1;
        if(val > 1) val = 1;
        var l = (this.container.width - 18) * 0.5 + 9;
        var w = ((this.container.width - 18) * 0.5) * val;

        
        this.bg.graphics
            .beginFill(toRGBA(bgColorSel2))
            .beginStroke('#888')
            .rect(l, 3, w, this.container.height-6)
            .endFill()
            .endStroke();
    
        if(!this.valueText) {
            this.valueText = new createjs.Text(this.name, "12px Verdana", "#000");
            this.container.addChild(this.valueText);
        }
        var txt = " " + Math.round(this.value*100,2)/100;
        this.valueText.x = !this.isInput ? 10 : this.container.width - 10;
        this.valueText.y = 2;
        this.valueText.textAlign = !this.isInput ? 'left' : 'right';
        this.valueText.text = txt;
    }
}

FGNodeProperty.prototype.__drawBackground = function() {
    var bgColor = lightUpRGBA(this.parent.color, 10)
    var bgColorSel = lightUpRGBA(this.parent.color, 50)
    if(!this.bg) {
        this.bg = new createjs.Shape();
        this.container.addChild(this.bg);
    }
    this.bg.graphics.clear();

    if(this.bgState == 0) {
        this.bg.graphics.beginFill(toRGBA(bgColor)).rect(1,0,this.container.width - 2, this.container.height).endFill();
    } else {
        this.bg.graphics.beginFill(toRGBA(bgColorSel)).rect(1,0,this.container.width - 2, this.container.height).endFill();
    }
    this._drawValue();
    this.parent._paint();
}

FGNodeProperty.prototype._drawBackground = function() {
    if(!this.bg) {
        this.bg = new createjs.Shape();
        this.container.addChild(this.bg);
        this.bgState = 0;

        var self = this;
        this.container.on('mouseover', function() {
            self.bgState = 1;
            self.__drawBackground();
        });
        
        this.container.on('mouseout', function() {
            self.bgState = 0;
            self.__drawBackground();
        });
    }
    this.__drawBackground();
}

FGNodeProperty.prototype._drawTitle = function() {
    if(!this.titleText) {
        this.titleText = new createjs.Text(this.name, "12px Verdana", "#000");
        this.container.addChild(this.titleText);
    }
    var txt = this.name;
    this.titleText.x = this.isInput ? 10 : this.container.width - 10;
    this.titleText.y = 2;
    this.titleText.textAlign = this.isInput ? 'left' : 'right';
    this.titleText.text = txt;
}

FGNodeProperty.prototype._drawDock = function() {
    var piFrom = Math.PI * (this.isInput?-0.5: 0.5);
    var piTo   = Math.PI * (this.isInput? 0.5:-0.5);
    var x = this.isInput ? 0 : this.container.width;
    var borderColor = lightUpRGBA(this.parent.color,-80);
    var dockShape = new createjs.Shape();
    dockShape.graphics.beginStroke(toRGBA(borderColor)).arc(x, 10, 7, piFrom, piTo, false);
    this.container.addChild(dockShape);

    // the mash for the docking
    var dockMaskShape = new createjs.Shape();
    dockMaskShape.graphics
        .beginFill('#000')
        .arc(x, 10, 7, piFrom, piTo, false)
        .lineTo(this.isInput?-1:this.container.width+1, this.isInput?17:3)
        .lineTo(this.isInput?-1:this.container.width+1, this.isInput?3:17)
        .closePath();    
    this.container.addChild(dockMaskShape);
    dockMaskShape.compositeOperation='destination-out';
}

FGNodeProperty.prototype.setValue = function(value, calculated) {
    // update our display
    this.value = value;
    this._drawTitle();
    this._drawBackground();
    // then any connected values
    if(this.targetProperty) {
        this.targetProperty.setValue(value);
    }

    if(!calculated)
        this.parent._inputChanged();
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

function FGNodePropertyIn(parent, name) {
    var res = new FGNodeProperty(parent, true, name);
    return res;
}
function FGNodePropertyOut(parent, name) {
    var res = new FGNodeProperty(parent, false, name);
    return res;
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

function FGNode(parent, x, y, name, color) {
    this.ins = [];
    this.outs = [];
    this.color = color;
    this.parent = parent;
    this.name = name;
    this.rowCount = 1; // title = row 0
    this.container = new createjs.Container();
    parent.container.addChild(this.container);

    this.shape = new createjs.Shape();
    this.container.addChild(this.shape);

    this.container.x = x;
    this.container.y = y;
    this.container.width = 120;
    this.container.height = rowHeight * this.rowCount;



    var self = this;
    (function(target) {
        var offset = null;
        self.shape.on('mousedown', function(evt) {
            offset = {x:target.x-evt.stageX, y:target.y-evt.stageY};
            //target.shadow = new createjs.Shadow("#000", 0, 0, 5);
            self.parent._paint();
            self.parent._startDrag();
        });
        
        self.shape.on('pressmove', function(evt) {
            var gridsize = 20;
            target.x = Math.round((evt.stageX + offset.x)/gridsize)*gridsize;
            target.y = Math.round((evt.stageY + offset.y)/gridsize)*gridsize;
            self.parent._paint();
        });
        self.shape.on('pressup', function(evt) {
            //target.shadow = null;
            self.parent._paint();
            self.parent._endDrag();
        });
        self.shape.on('mouseover', function(e) {
            //currentNode = self;
        });
        self.shape.on('mouseout', function(e) {
            //currentNode = undefined;
        });
    })(this.container);

    // example properties
    /*
    this.ins['in1'] = new FGNodePropertyIn(this, 'in1');
    this.ins['in2'] = new FGNodePropertyIn(this, 'in2');
    
    this.outs['out1'] = new FGNodePropertyOut(this, 'out1');
    this.outs['out2'] = new FGNodePropertyOut(this, 'out2');
    */

    this._redraw();
}

FGNode.prototype._redraw = function() {
    // fix the height: depending on the row count
    this.container.height = rowHeight * this.rowCount + 20;
    // then draw the rest
    this.shape.graphics.clear();
    this._drawBackground();
    this._drawTitle();
    for(var k in this.ins) {
        this.ins[k]._draw();
    }
    for(var k in this.outs) {
        this.outs[k]._draw();
    }
}

FGNode.prototype._drawTitle = function() {
    if(!this.titleText) {
        this.titleText = new createjs.Text(this.name, "12px Verdana Bold", "#000");        
        this.container.addChild(this.titleText);
    }
    this.titleText.x = 2;
    this.titleText.y = 2;
    this.titleText.textAlign = "left";
    this.titleText.text = this.name;
}

FGNode.prototype._drawBackground = function() {
    this.container.height

    var borderColor = lightUpRGBA(this.color,-100);
    this.shape.graphics
        .beginStroke(toRGBA(borderColor))
        .beginFill(toRGBA(this.color))
        .drawRoundRect(0, 0, this.container.width, this.container.height, 8)
        //.moveTo(-1,30)
        //.arc(-1, 30, 8, Math.PI * 0.5, Math.PI * -0.5, true)
        .closePath();

    this.shape.graphics.beginStroke(toRGBA(borderColor)).moveTo(0,rowHeight).lineTo(this.container.width,rowHeight);
}

FGNode.prototype.addInput = function(name) {
    this.ins[name] = new FGNodePropertyIn(this, name);
    this._redraw();
}

FGNode.prototype.addOutput = function(name) {
    this.outs[name] = new FGNodePropertyOut(this, name);
    this._redraw();
}

FGNode.prototype.connect = function(outProperty, targetNode, inProperty) {
    if(this.outs[outProperty] === undefined) {
        console.log("tried to connect unknown out property: " + outProperty);
        return false;
    }
    if(targetNode.ins[inProperty] === undefined) {
        console.log("tried to connect unknown in property: " + inProperty);
        return false;
    }
    
    //outs[outProperty].targetNode = targetNode;
    this.outs[outProperty].targetProperty = targetNode.ins[inProperty];
    this._paint();
}

FGNode.prototype._paint = function() {
    this.parent._paint();
}

FGNode.prototype.setOutputValue = function(name, value, calculated) {
    if(this.outs[name] === undefined) {
        console.log("tried to set unknown out value: " + name);
        return false;
    }
    this.outs[name].setValue(value, calculated);

    //this._paint();
}

FGNode.prototype._inputChanged = function() {
    // evaluate any functions
    if(this.fct) {
        var res = this.fct(this.ins);
        for(var k in res) {
            //console.log("eval from node " + this.name + " = ");
            //console.log(res);
            this.setOutputValue(k, res[k], true);
        }
        
    }
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

function FGraph(stage) {
    this.nodes = [];
    this.buildstate = 0
    this.stage = stage;
    this.t = 0;


    this.container = new createjs.Container();
    this.stage.addChild(this.container);
}

FGraph.prototype.testSetup = function() {
    this.joy = new FGNode(this, 60, 60, 'Joystick', [130,159,114,0.5]);
    this.joy.addOutput('axis1');
    this.joy.addOutput('axis2');
    this.joy.addOutput('button0');
    this.joy.addOutput('button1');
    this.nodes.push(this.joy);

    var axisSplit = new FGNode(this, 260, 60, 'Axis Split', [114,159,130,0.5]);
    axisSplit.addInput('in');
    axisSplit.addOutput('positive');
    axisSplit.addOutput('negative');
    axisSplit.fct = function(i) { return {negative:(i.in.value<0?Math.abs(i.in.value):0),positive:(i.in.value>0?i.in.value:0)}; };
    this.nodes.push(axisSplit);

    var deadzone = new FGNode(this, 660, 150, 'Deadzone', [159,114,130,0.5]);
    deadzone.addInput('in');
    deadzone.addOutput('out');
    var deadZoneSize = 0.1;
    deadzone.fct = function(i) { return {
        out:(Math.abs(i.in.value) < deadZoneSize ? 0 : (i.in.value) * ((i.in.value - deadZoneSize) * (1/ (1-deadZoneSize))))
    };};
    this.nodes.push(deadzone);

    var invert = new FGNode(this, 460, 180, 'Invert', [159,150,130,0.5]);
    invert.addInput('in');
    invert.addOutput('out');
    invert.fct = function(i) { return {out:i.in.value * -1}; };
    this.nodes.push(invert);

    var linearity = new FGNode(this, 860, 150, 'Linearity', [159,150,130,0.5]);
    linearity.addInput('in');
    linearity.addOutput('out');
    linearity.fct = function(i) { return {out:((i.in.value<0 ? -1 : 1) * Math.pow(Math.abs(i.in.value), 2.7182818284590452353602874)) }; };
    this.nodes.push(linearity);

    var vehicle = new FGNode(this, 1060, 60, 'Current Vehicle', [130,114,159,0.5]);
    vehicle.addInput('steering');
    vehicle.addInput('brake');
    vehicle.addInput('throttle');
    this.nodes.push(vehicle);

    this.joy.connect('axis1', axisSplit, 'in');
    //this.joy.connect('axis2', deadzone, 'in');
    axisSplit.connect('negative', deadzone, 'in');
    axisSplit.connect('positive', vehicle, 'brake');

    deadzone.connect('out', linearity, 'in');
    linearity.connect('out', vehicle, 'throttle');
}

FGraph.prototype.update = function() {
    //for(var i=0; i < this.nodes.length; i++) {
    //    this.nodes[i].update();
    //}

    this.t++;
    if(this.t > 1000) this.t = 0;

    var val = Math.sin((this.t/1000) * Math.PI * 2);

    if(this.joy) {
        this.joy.setOutputValue('axis1', val);
        this.joy.setOutputValue('axis2', -val);
    }
}

FGraph.prototype._paint = function() {
    this._drawNoodles();
    this.stage.update();
}

FGraph.prototype._startDrag = function() {
    this.savedCursor = document.body.style.cursor;
    if(this.savedCursor == 'move') this.savedCursor = 'auto'; // fixes infinite move cursor :|
    document.body.style.cursor = 'move';
}

FGraph.prototype._endDrag = function() {
    document.body.style.cursor = this.savedCursor;
}

FGraph.prototype._drawNoodles = function() {
    if(!this.noodle) {
        this.noodle = new createjs.Shape();
        this.stage.addChild(this.noodle);
    }
    this.noodle.graphics.clear();
    for(var nodeID in this.nodes) {
        var node = this.nodes[nodeID];
        for(var outKey in node.outs) {
            var out = node.outs[outKey];            
            if(out.targetProperty !== undefined) {
                //console.log("connection: " + out.name);
                
                var pos1 = out.container.localToGlobal(0,0);
                pos1.x += out.container.width;
                pos1.y += 10;
                
                var pos2 = out.targetProperty.container.localToGlobal(0,0);
                pos2.y += 10;
                
                var val = Math.abs(out.value ? out.value : 0) / 0.8 + 0.2;

                this._drawNoodle(pos1, pos2, this.noodle, [200,100,100,val]);
            }
        }

    }
    //drawNoodle({x:220,y:170},{x:460,y:130}, noodle, [200,100,100,0.9]);
}

FGraph.prototype._drawNoodle = function(pt0, pt1, noodle, color) {
    var midPoint = {
        x: pt0.x + ((pt1.x - pt0.x) / 2)|0,
        y: pt0.y + ((pt1.y - pt0.y) / 2)|0
    }
    var borderColor = lightUpRGBA(color,-100);
    var points = [midPoint.x, pt0.y, midPoint.x, pt1.y, pt1.x, pt1.y];
    if (noodle) {
        noodle.graphics

            .beginStroke(toRGBA(borderColor))
            .setStrokeStyle(2)
            .moveTo(pt0.x, pt0.y)
            .bezierCurveTo(
                points[0],
                points[1],
                points[2],
                points[3],
                points[4],
                points[5]
            )
            .endStroke()

            .beginFill(toRGBA(color))
            .beginStroke(toRGBA(borderColor))
            .setStrokeStyle(1)
            .drawCircle(pt0.x, pt0.y, 5)
            .endFill()
            .endStroke()

            .beginStroke(toRGBA(borderColor))
            .setStrokeStyle(1)
            .beginFill(toRGBA(color))
            .drawCircle(pt1.x, pt1.y, 5)
            .endFill()
            .endStroke();
    }

    return points;
};

var rowHeight = 20;
function toRGBA(rgba) {
    return createjs.Graphics.getRGB(rgba[0], rgba[1], rgba[2], rgba[3])
}


// ideally, we would do a RGB -> HSV -> RGB conversion instead ...
function lightUpRGBA(rgba, v) {
    var res = rgba.slice(0);
    res[0] += v
    res[1] += v
    res[2] += v
    return res
}
