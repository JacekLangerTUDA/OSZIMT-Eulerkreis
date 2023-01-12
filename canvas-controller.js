/* Canvas Controller for Eulercircle. 
 Create and design an interactive gridarea where Nodes/ Cells can be set and connected. 
 Run Checks if Eulercirle is possible and or calculate all possible circles.

autors: Jacek Langer, Nils Jürgensen, Thorsten Grave
 */

// --------------------------------
//  Consts
// --------------------------------

const size = 600;	// size of the canvas 
let cells = getCells()	// the amount of cells in a single row, total cell count is cells squared
const gridcolor = "#2D1F45";
const activeCellColor = "#FFE200";
const highlightCellColor = "#9D7E00";
const clearColor = "#1B0B36";
const radius = 7;	// corner radius of for the cells
const margin = 10;	// margin at wich cells are placed
const table = document.querySelector("#node-table");	// the table of existing nodes
const canvas = document.querySelector("#routeCanvas");	// canvas
const ctx = canvas.getContext("2d");	// 2d context
// event names
const enter = "mouseenter";
const move = "mousemove";
const leave = "mouseleave";
const down = "mousedown";
const up = "mouseup";
const click = "click";

// global variables
let grid
let step	// the step size at which a single cell is placed
let offset  // the offset at which the line begins
let rect = canvas.getBoundingClientRect();		// bounding rect for the canvas to get the offset resulting from padding
let isDebug = false
let possibleStartpoints = [];	// list of possible start points. this points will be shown in a highlighted color

// --------------------------------
//  setup
// --------------------------------
canvas.style.background = clearColor;
canvas.width = size;
canvas.height = size;
// update the canvas size according to the screen and update the cell size
updateCanvasSize()
updateTableSize()
let cellOpts = getCellOpts()
// register window on resize event
window.onresize = ()=>{
	updateCanvasSize()
	updateTableSize()
	setStepsize()
	cellOpts = getCellOpts()
}

function setStepsize(){
	step = size / cells;
	offset = step /2
	
}

// generate a map of cells that are initialized with null.
grid = Array(cells)
	.fill(null)
	.map(() => Array(cells).fill(null));

function reset(){
	cells = getCells();
	grid = Array(cells)
		.fill(null)
		.map(() => Array(cells).fill(null));
	
	clearTable();
	setStepsize()
	cellOpts = getCellOpts()
	updateCanvas()
}

function getCells(){
	return parseInt(document.querySelector('[name="number"]').value);
}

/**
 * Resize the canvas in a fashion so it consumes half the screen area.
 */
function updateCanvasSize(){
	
	canvas.width = window.innerWidth * 0.4;
	canvas.height = window.innerHeight * 0.8;
}
/**
 * Resize the table so it takes half the screen area.
 */
function updateTableSize(){
	table.width = window.innerWidth *.4
	table.height = window.innerHeight *.7
}

/**
 * Returns an cell object. 
 * 
 * todo: create a class.
 * @param {int} x array index for x
 * @param {int} y array index for y 
 * @param {int} i index
 * @returns 
 */
function cell(x, y,i) {
	return {
		index: i,
		x: x,
		y: y,
		bottom: y * step + step,
		isActive: false,
		center: {
			x: x*cellOpts.width + cellOpts.width / 2,
			y: y*cellOpts.height+ cellOpts.height / 2,
		},
		edges: new Set(),
		deactivate() {
			this.isActive = false;
			this.clear();
			updateTable()
		},
		activate: function activate() {
			this.isActive = true;
			this.highlight()
			updateTable()
		},
		connect(other) {
			if (!this.isActive) return;
			// handle edges
			if(this.edges.has(other)){
				// delete the edges
				this.edges.delete(other)
				other.edges.delete(this)
				return;	// exit we dont need to draw the connecting line
			}else{	// add the edges
				this.edges.add(other)
				other.edges.add(this)
			}

			center = {
				x: this.left + step / 2,
				y: this.top + step / 2,
			};
			target_center = {
				x: other.left + step / 2,
				y: other.top + step / 2,
			};

			gradientLine(this.center, other.center, offset);
		},
		lineTo(x, y) {
			center = {
				x: this.left + step / 2,
				y: this.top + step / 2,
			};
			line(center.x, center.y, x, y);
		},
		/**
		 * Highlight the cell to make it distinct from other cells.
		 */
		highlight() {
			if(!this.isActive){
				drawCell(cellOpts.width * this.x, cellOpts.height * this.y, cellOpts.glow, cellOpts.glow);
				// drawIndex(this);
				if (possibleStartpoints.includes(this)) {
					possibleStartpoints.pop(this);
				}
			} else {
				
				drawCell(
					cellOpts.width * this.x,
					cellOpts.height * this.y,
					cellOpts.activeColor,
					cellOpts.activeGlow
					);
				drawIndex(this, cellOpts.bg, cellOpts.bg);
					
				} 
				// drawIndex(this);
				ctx.fill()
			},
		/**
		 * Highlight the cell as a possible startpoint.
		 */
		setStartpoint(){
				drawCell(
					cellOpts.width * this.x,
					cellOpts.height * this.y,
					cellOpts.activeColor,
					cellOpts.activeGlow
				);
				
				drawIndex(this, cellOpts.start, cellOpts.startGlow);
				possibleStartpoints.push(this)			
			},
		/**
		 * remove this cell as a startpoint
		 */
		removeStartpoint(){
			if (possibleStartpoints.includes(this)) {
				possibleStartpoints.pop(this);
			}
		},
		/**
		 * Clear the cell and reset the cell to original state
		 */
		clear() {
			this.edges.forEach((e) => {
				let x = e.x;
				let y = e.y;
				grid[x][y].edges.delete(this);
			});
			this.edges = new Set();
			ctx.fillStyle = clearColor;
			ctx.fillRect(this.left + margin, this.top + margin, step - 2 * margin, step - 2 * margin);
			this.removeStartpoint();
		},
	};
}


/**
 * Return a cellSize object that is dependend of the current canvas size and amount of cells.
 * todo: create class
 * @returns cellSize object with width and height size
 */
function getCellOpts(){
	return {
		width: (canvas.width - margin) / cells,
		height: (canvas.height - margin) / cells,
		color: "#2D0734",
		glow: "#592861",
		bg: "#2D1F45",
		shadow: "#0C000F",
		start: "#4A6B1E",
		activeColor: "#651D3A",
		activeGlow: "#440A21",
		startGlow: "#2C480B",
	};
}

// ------------------------------------------
//	Canvas Drawing
// ------------------------------------------


// init grid once.
drawGrid();

function highlightStartPoints(){
	exitCode = canStart();
	if (exitCode > 0) {
		if (exitCode == 1) {
			highlightAllActiveCells();
			enableStart()
		} else {
			selectAllPossibleStartPointsWithUnevenEdges()
			enableStart();
		}
	} else {
		disableStart();
	}
}

function selectAllPossibleStartPointsWithUnevenEdges(){
	let active = getAllActiveCells();
	active.forEach((a) => {
		if(a.edges.size % 2 != 0)
			a.setStartpoint();
	});
}

function highlightAllActiveCells(){
	let active = getAllActiveCells()
	active.forEach(a =>{
		if(a.edges.size > 0)
		a.setStartpoint()
	})
}
/**
 * Draws a grid and regigesters every field in the grid in a multidimensional array of grids.
 */
function drawGrid() {
	
ctx.closePath();
ctx.fillStyle = cellOpts.bg;
ctx.strokeStyle= gridcolor
let index = 0
for (let i = 0; i < cells; i++) {
	for (let j = 0; j < cells; j++) {
		let currentX = cellOpts.width * i;
		let currentY = cellOpts.height * j;
		drawCell(currentX, currentY, cellOpts.bg, cellOpts.shadow);
		if (grid[i][j] == null) {
			grid[i][j] = cell(i, j,index++);
		}
	}
}   
}

/**
 * Draws the index of the cell in the center of a highlighted cell.
 * @param {cell} cell the cell object
 */
function drawIndex(cell, color = cellOpts.bg, glow = cellOpts.shadow) {
	ctx.closePath()
	ctx.beginPath()
	ctx.font =  cellOpts.width/3+"px arial";
	ctx.fillStyle = color;

	ctx.shadowColor = glow;
	ctx.shadowBlur = radius;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(cell.index, cell.center.x, cell.center.y, cellOpts.width);
	ctx.closePath();
}


/**
 * Draws a gradientline from one point to the other
 * @param {position} start start position x y
 * @param {position} end end poisition x y
 * @param {int} offset offset from x and y
 */
function gradientLine(start, end, offset = 0){

	const gradient = ctx.createLinearGradient(
		start.x,
		start.y,
		end.x,
		end.y
	);
		// calculate the offset from the center if the offset is not set to default 0
	let p1 = {x:start.x, y:start.y}
	let p2 = {x:end.x, y:end.y}

	if(offset > 0){

		dy = p2.y - p1.y
		dx = p2.x - p1.x
		let alpha = Math.atan2(dy,dx) 
		debug(alpha)
		
		let xr,yr
		xr = Math.cos(alpha)*offset
		yr = Math.sin(alpha)*offset
		// console.log("xr:",xr,"yr:", yr,"alpha:",alpha);
		
		p1.x += xr
		p1.y += yr
		p2.x -= xr
		p2.y -= yr
	}

	gradient.addColorStop(0, gridcolor);
	gradient.addColorStop(0.50, activeCellColor);
	gradient.addColorStop(1, gridcolor);

	ctx.strokeStyle = gradient;
	ctx.lineWidth = 1;
	// todo: set offset according to target location in a given radius arround the center .
	line(
		p1.x,
		p1.y, 
		p2.x,
		p2.y 
	)
}

/**
 * Draws a cell at a given position color and with a given glow. 
 * The size is dependen on the amount of cells set globaly as well as the current canvas size.
 * 
 * @param {int} currentX x position of the cell left corner
 * @param {int} currentY y position for the cell top corner
 * @param {string} color color for the cell it self
 * @param {string} glow color for the cell glow
 */
function drawCell(currentX, currentY, color=cellOpts.bg, glow=cellOpts.shadow) {
	ctx.beginPath();
		ctx.fillStyle = color;

		ctx.shadowColor = glow;
		ctx.shadowBlur = radius;

	ctx.beginPath();
	ctx.roundRect(
		currentX + margin,
		currentY + margin,
		cellOpts.width - margin,
		cellOpts.height - margin,
		radius
	);
	ctx.stroke();
	ctx.fill();
}

function updateCanvas(){
	//Clear the canvas.
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = gridcolor
	drawGrid();
	drawAllActiveCells();
	highlightStartPoints();
}

/**
 * Draws a line from coordinates to coordinates
 * @param {int} fromX start x
 * @param {int} fromY start y
 * @param {int} toX target x value
 * @param {int} toY target y value
 */
function line(fromX, fromY, toX, toY) {
	ctx.beginPath();
	ctx.moveTo(fromX, fromY);
	ctx.lineTo(toX, toY);
	ctx.stroke();
	ctx.closePath();
}

/**
 * Draw all active cells.
 */
function drawAllActiveCells() {

	let edges=[]
	grid.forEach((row) => {
		row.forEach(c=>{

			if (c.isActive) {
				debug(c)
				c.highlight()
				c.edges.forEach((e) => {
					
						gradientLine(c.center, e.center, offset);
						edges.push();
					
				});
			}
		})
	});
}

/**
 * Debug information if debugging is set to on
 * @param {*} o 
 */
function debug(...o){
	if (isDebug) {
		o.forEach(arg=>{

			console.log(arg)
		});
}}


function disableStart(){
	const btn = document.querySelector('#btn-start');
	btn.disabled = true;
}

function enableStart(){
	const btn = document.querySelector("#btn-start");
	btn.disabled = false;
}


/**
 * Check all active nodes and count the edges. If all edges are equal or a maximum of 2 edges is dividable by 2 an euler circle is possible.
 * @returns 
 */
function canStart(){
	let active = getAllActiveCells()
	
	let equalEdges = 0
	let edges = new Set()
	active.forEach(c=>{
		if(c.edges.size == 0)	// a cell has no edges and can not be visited
			return 0
		c.edges.forEach(e=>{
			edges.add(e.index)
		})
		if(c.edges.size > 0 && c.edges.size % 2 == 0 ){
			equalEdges++
		}
	})
	// 1 best case all nodes are start points 2 only certain nodes are start points 0 no start points no circle possible
	let exitCode
	if (edges.size > 0 && equalEdges == edges.size){	// all edges are equal
		exitCode = 1
	}
	else if (edges.size > 0 &&  equalEdges >= 2 ){
		exitCode = 2
	}
	else {
		exitCode = 0
	}
		// either all edges are equal or a max of 2 edges is equal to achive a valid euler circle
	return exitCode		
}

/**
 * Return all cells that are set to active.
 * @returns array of cells
 */
function getAllActiveCells(){
	let active =[];
	grid.forEach((row) => {
		row.forEach((c) => {
			if (c.isActive) active.push(c);
		});
	});
	return active
}

// ------------------------------------------
// CANVAS EVENTS: THIS IS THE FUNCTIONALITY
// OF SETTING AND UNSETTING NODES AS WELL AS
// CONNECTING NODES TO CREATE EDGES
// ------------------------------------------

/*
 Handle Mouse move events
 */
canvas.addEventListener(enter, function onEnter(e) {
	canvas.removeEventListener(enter, onEnter);
	canvas.addEventListener(move, onMove);
	canvas.addEventListener(leave, function exit(e) {
		canvas.addEventListener(enter, onEnter)
		canvas.removeEventListener(move, onMove);
		canvas.removeEventListener(leave, exit);
	});
});

/**
 * Move Callback. Highlight the cell where the mouse entered.
 * @param {event} e 
 */
function onMove(e) {
	updateCanvas();
	// fetch the current cell and highlight
	c = getGridCell(e);
	if (!c.isActive) c.highlight();
	// unsubscribe from the events.
	canvas.addEventListener(leave, function exit(e) {
		canvas.removeEventListener(leave, exit);
		canvas.removeEventListener(move, onMove);
	});
}

// global start for preview to be overridden
let start = {
	x: 0,
	y: 0
}

/*
 Handle drag events and activating of grid cells to build the graph
*/
canvas.addEventListener(down, function connect(e) {
	const c = getGridCell(e);
	canvas.removeEventListener(move, onMove);
	debug(c)
	start = c.center
	canvas.addEventListener(move, preview)
	canvas.addEventListener(up, function activate(e) {
		let currentCell = getGridCell(e);
		// handle click!
		if(currentCell == c){
			if(!c.isActive)
				c.activate()
			else 
				c.deactivate()
		}else{
			if(currentCell.isActive){
				c.connect(currentCell)
				updateTable()
			}
		}
		canvas.removeEventListener(up, activate);
		canvas.addEventListener(move, onMove);
	});
});

/**
 * Draw a preview line on the canvas.
 * @param {event} e 
 */
function preview(e){
	updateCanvas()
	ctx.beginPath();
	// let pos = getGridCell(e).center
	let pos = { x: e.x - rect.x, y: e.y - rect.y };
	gradientLine(start, pos,offset);
	ctx.closePath();
}


/**
 * Returns the cell at the current mouse position grid cell
 * @param {Event} e the mouseevent to retrive the current mouse position
 * @returns  the cell at the current mouse position
 */
function getGridCell(e) {
	// todo: this seems still slow and sluggish needs improvement
	let rect = canvas.getBoundingClientRect();
	let inGridPos = { x: e.x - rect.x, y: e.y - rect.y };

	let x = Math.floor((inGridPos.x + margin) / cellOpts.width);
	let y = Math.floor((inGridPos.y + margin) / cellOpts.height);

	return grid[x][y];
}

/**
 * Clear the whole canvas to start over.
 */
document.querySelector("#btn-clear").onclick = function onClearBtnPress() {
	grid.forEach((row) => {
		row.forEach((c) => {
			c.deactivate();
		});
	});
	updateCanvas();
};

// ----------------------------------------
//	TABLE OPTIONS
// ----------------------------------------

/**
 * Update the table data.
 */
function updateTable() {
	cellsForTable = [];

	for (let i = 0; i < cells; i++) {
		for (let j = 0; j < cells; j++) {
			const cell = grid[i][j];
			if (cell == null)
				return
			if (cell.isActive) {
				let cellinfo = {
					index: cell.index,
					x: cell.x,
					y: cell.y,
					edges: cell.edges,
				};

				cellsForTable.push(cellinfo);
			}
		}
	}

	clearTable();
	cellsForTable.forEach((cell) => appendRow(cell));
}
/**
 * Appends a row with cell information to the table.
 * @param {cell} cell 
 */
function appendRow(cell) {
	let end = table.childNodes.length - 1;
	let row = table.insertRow(end);
	let indexCell = row.insertCell(0);
	let xCell = row.insertCell(1);
	let yCell = row.insertCell(2);
	let edgeListCell = row.insertCell(3);

	let edges = stringFromSet(cell.edges);

	indexCell.innerHTML = cell.index;
	xCell.innerHTML = cell.x;
	yCell.innerHTML = cell.y;
	edgeListCell.innerHTML = edges;
}

/**
 * Clear all entries in the table but the header.
 */
function clearTable() {
	var rows = table.rows;
	var i = rows.length;
	while (--i) {
		rows[i].parentNode.removeChild(rows[i]);
	}
}

/**
 * Convert the edges of the current cell to a string array.
 * @param {*} edges the edges 
 * @returns string of edges in form of {1,2,3}
 */
function stringFromSet(edges) {
	let arr = []
	edges.forEach(e=>{
		arr.push(e.index)
	})
	return "{"+arr.join(",") + "}";
}
