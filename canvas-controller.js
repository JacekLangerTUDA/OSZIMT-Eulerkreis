/* Canvas Controller for Eulercircle. 
 Create and design an interactive gridarea where Nodes/ Cells can be set and connected. 
 Run Checks if Eulercirle is possible and or calculate all possible circles.

autors: Jacek Langer, Nils Jürgensen, Thorsten Grave
 */

// --------------------------------
//  Consts
// --------------------------------

const cells = 10;
const size = 600;
const step = size / cells;
const gridLineWidth = 0.2;
const gridcolor = "#2D1F45";
const activeCellColor = "#FFE200";
const highlightCellColor = "#9D7E00";
const clearColor = "#1B0B36";
const radius = 7;
const margin = 5;
const table = document.querySelector("#node-table");
const canvas = document.querySelector("#routeCanvas");
const ctx = canvas.getContext("2d");
// event names
const enter = "mouseenter";
const move = "mousemove";
const leave = "mouseleave";
const down = "mousedown";
const up = "mouseup";
const click = "click";

// global variables
let rect = canvas.getBoundingClientRect();
let isDebug = false
let possibleStartpoints = [];

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
	cellOpts = getCellOpts()
}


// generate a map of cells that are initialized with null.

let grid = Array(cells)
.fill(null)
.map(() => Array(cells).fill(null));

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


function cell(x, y) {
	return {
		index: x*y +x,
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
				if(canStart){
					enableStart();
				}else{
					disableStart();
				}
			}

			center = {
				x: this.left + step / 2,
				y: this.top + step / 2,
			};
			target_center = {
				x: other.left + step / 2,
				y: other.top + step / 2,
			};

			gradientLine(this.center,other.center)
		},
		lineTo(x, y) {
			center = {
				x: this.left + step / 2,
				y: this.top + step / 2,
			};
			line(center.x, center.y, x, y);
		},
		highlight() {
			if(!this.isActive)
				drawCell(cellOpts.width * this.x, cellOpts.height * this.y, cellOpts.glow, cellOpts.glow);
			else
				drawCell(
					cellOpts.width * this.x,
					cellOpts.height * this.y,
					cellOpts.activeColor,
					cellOpts.activeGlow
				);
			ctx.fill()
		},
		clear() {
			this.edges.forEach((e) => {
				let x = e.x;
				let y = e.y;
				grid[x][y].edges.delete(this);
			});
			this.edges = new Set();
			ctx.fillStyle = clearColor;
			ctx.fillRect(this.left + margin, this.top + margin, step - 2 * margin, step - 2 * margin);
		},
	};
}


/**
 * Return a cellSize object that is dependend of the current canvas size and amount of cells.
 * @returns cellSize object with width and height size
 */
function getCellOpts(){
	return {
		width: (canvas.width - margin) / cells,
		height: (canvas.height - margin) / cells,
		color: "#2D0734",
		glow: "#592861",
		activeColor: "#651D3A",
		activeGlow: "#440A21",
		bg: "#2D1F45",
		shadow: "#0C000F",
		start: "#4A6B1E",
	};
}

// ------------------------------------------
//	Canvas Drawing
// ------------------------------------------


// init grid once.
drawGrid();

/**
 * Draws a grid and regigesters every field in the grid in a multidimensional array of grids.
 */
function drawGrid() {
	
ctx.closePath();
ctx.fillStyle = cellOpts.bg;
ctx.strokeStyle= gridcolor
for (let i = 0; i < cells; i++) {
	for (let j = 0; j < cells; j++) {
		let currentX = cellOpts.width * i;
		let currentY = cellOpts.height * j;
		drawCell(currentX, currentY, cellOpts.bg, cellOpts.shadow);
		if (grid[i][j] == null) {
			grid[i][j] = cell(i, j);
		}
	}
}   
}


function gradientLine(start, end){

	const gradient = ctx.createLinearGradient(
		start.x,
		start.y,
		end.x,
		end.y
	);
	gradient.addColorStop(0, gridcolor);
	gradient.addColorStop(0.50, activeCellColor);
	gradient.addColorStop(1, gridcolor);

	ctx.strokeStyle = gradient;
	ctx.lineWidth = 2;
	
	line(
		start.x,
		start.y , 
		end.x ,
		end.y 
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
	grid.forEach((row) => {
		row.forEach(c=>{

			if (c.isActive) {
				debug(c)
				c.highlight()
				c.edges.forEach((e) => {
					gradientLine(c.center,e.center);
				});
			}
		})
	});
}

/**
 * Debug information if debugging is set to on
 * @param {*} o 
 */
function debug(o){
	if (isDebug) console.log(o);
}


function disableStart(){
	const btn = document.querySelector('#btn-start');
	btn.disabled = true;
}

function enableStart(){
	const btn = document.querySelector("#btn-start");
	btn.disabled = false;
}

function canStart(){
	let active = []
	grid.forEach(row=>{
		row.forEach(c=>{
			if (c.isActive)
				active.push(c)
		})
	})

	let maxEdgesEqual = 0
	active.forEach(c=>{
		if(c.edges.length % 2 == 0){
			maxEdgesEqual++
		}else{
			possibleStartpoints.push(c)
		}
		if(maxEdgesEqual >2)
		possibleStartpoints = []
		return false
	})
	return true
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

function preview(e){
	updateCanvas()
	ctx.beginPath();
	let pos = { x: e.x - rect.x, y: e.y - rect.y };
	gradientLine(start, pos);
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
function updateTable() {
	cellsForTable = [];

	for (let i = 0; i < cells; i++) {
		for (let j = 0; j < cells; j++) {
			const cell = grid[i][j];
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

function clearTable() {
	var rows = table.rows;
	var i = rows.length;
	while (--i) {
		rows[i].parentNode.removeChild(rows[i]);
		// or
		// table.deleteRow(i);
	}
}

function stringFromSet(edges) {
	let arr = []
	edges.forEach(e=>{
		arr.push(e.index)
	})
	return "{"+arr.join(",") + "}";
}
