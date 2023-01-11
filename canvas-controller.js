const cells = 10
const size = 600
const step = size / cells;
const gridLineWidth = .2
const gridcolor = "#2D1F45";
const activeCellColor = "#FFE200";
const highlightCellColor = "#9D7E00";
const clearColor = "#1B0B36";
let canvas = document.querySelector("#routeCanvas");
let ctx = canvas.getContext("2d");

canvas.style.background = clearColor;

let rect = canvas.getBoundingClientRect();

canvas.width = size;
canvas.height = size;


let grid = Array(cells)
	.fill(null)
	.map(() => Array(cells));

const margin = 5
function cell(x,y,i) {
    return {
        index:i,
			x: x,
			y: y,
			left: x * step,
			right: x * step + step ,
			top: y * step,
			bottom: y * step + step,
			isActive: false,
            center:{
                x: x *step+ (step/2),
                y: y *step+ (step/2)
            },
            edges:new Set(),
			deactivate() {
				this.isActive = false;
				this.clear();
			},
			activate: function activate() {
                this.isActive = true
                fillRadialGradient(this, activeCellColor, clearColor);
                ctx.font = (step / 2)+"px arial";
                ctx.fillStyle = activeCellColor
                ctx.fillText(this.index,rect.x , rect.y )
			},
            connect(other){
                if(!this.isActive) return
                center = {
                    x: this.left + step/2,
                    y: this.top + step/2
                }
                target_center = {
									x: other.left + step / 2,
									y: other.top + step / 2,
								};
                ctx.strokeStyle = highlightCellColor
                ctx.lineWidth = 1
                line(center.x,center.y,target_center.x,target_center.y)
            },

            lineTo(x,y){
                center = {
									x: this.left + step / 2,
									y: this.top + step / 2,
								};
                line(center.x, center.y, x,y);
            },
			highlight() {
                fillRadialGradient(this, highlightCellColor, clearColor);
			},
			clear() {
                this.edges.forEach(e => {
                    let x = e.x
                    let y = e.y
                    grid[x][y].edges.delete(this)
                });
                this.edges = new Set();
				ctx.fillStyle = clearColor;
				ctx.fillRect(
					this.left + margin,
					this.top + margin,
					step - 2 * margin,
					step - 2 * margin
				);
			},
		};
} 

drawGrid();


function fillRadialGradient(cell,color1,color2){
    let center = {
			x: cell.left + step / 2,
			y: cell.top + step / 2,
		};
		ctx.moveTo(center.x, center.y);
		ctx.fillStyle = color1;
		let innerRad = step; // inner radius overlapping outer radius creates more diffusion
		let outerRad = step / 2 - margin;

		// takes the position for the circles and its radius first center radius than second center and radius
		const gradient = ctx.createRadialGradient(
			center.x,
			center.y,
			step / innerRad,
			center.x,
			center.y,
			outerRad
		);

		// const gradient = ctx.createRadialGradient(100,100,70,100,100,120)

		gradient.addColorStop(0, color1);
		// gradient.addColorStop(0.4, highlightCellColor);
		gradient.addColorStop(1, color2);
		ctx.fillStyle = gradient;

		ctx.fillRect(cell.left + margin, cell.top + margin, step - 2 * margin, step - 2 * margin);
}

/**
 * Draws a line from coordinates to coordinates
 * @param {int} fromX start x
 * @param {int} fromY start y
 * @param {int} toX target x value
 * @param {int} toY target y value
 */
function line(fromX, fromY, toX,toY){
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX,toY);
	ctx.stroke();
}


/**
 * Draws a grid and regigesters every field in the grid in a multidimensional array of grids.
 */
function drawGrid() {
    
    clearCanvas();
	ctx.lineWidth = gridLineWidth;
    ctx.strokeStyle = gridcolor
    let index = 0
    for (let i = 0; i < cells; i ++) {
        for (let j = 0; j < cells; j ++) {
            const si = i * step;
            const sj = j * step;
			// vertical lines
			line(si, 0, si, canvas.height);
			// horizontal line
			line(0, sj, canvas.width, sj);
			// add gridcells to the array
            grid[i][j] = cell(i, j,index++)  // populate by row
		}
	}
    drawAllActiveCells()
}


function drawAllActiveCells(){
    grid.forEach(c=>{
        if (c.isActive){
            c.activate()
            c.edges.forEach(e=>{
                c.connect(e)
            })
        }
    })
}

const enter = "mouseenter"
const move = "mousemove";
const leave = "mouseleave";
const down = "mousedown";
const up = "mouseup";
const click = "click";

/*
 Handle Mouse move events
 */
canvas.addEventListener(enter,function onEnter(e){

    canvas.removeEventListener(move,onEnter);
    canvas.addEventListener(move,onMove)
    canvas.addEventListener(leave, function exit(e) {
			canvas.removeEventListener(leave, exit);
            // console.log("exit")
		});
})

function clearCanvas(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function onMove(e){
        clearAllInactive();
        drawAllActiveCells();
        // drawGrid();
        // fetch the current cell and highlight
        c = getGridCell(e);
        if(!c.isActive)
            c.highlight();
        // unsubscribe from the events.
        canvas.addEventListener(leave, function exit(e){
            canvas.removeEventListener(leave,exit);
            canvas.removeEventListener(move,onMove);
        })        
    }

/*
 Handle drag events and activating of grid cells to build the graph
*/
canvas.addEventListener(down,function connect(e){
	const c = getGridCell(e);
	canvas.removeEventListener(move, onMove);
	canvas.addEventListener(up, function activate(e) {
		const current = getGridCell(e);
		// console.log(c, current);
		if (c === current) {
			if (!c.isActive) c.activate();
			else c.deactivate();
		} else {
			if (current.isActive) {
				current.edges.add(c);
				c.edges.add(current);
				c.connect(current);
                updateTable();
			}
		}
		canvas.removeEventListener(up, activate);
        canvas.addEventListener(move,onMove)
	});
})

function previewLine(e, start){
	center = { x: c.left + step / 2, y: c.top + step / 2 };
	ctx.strokeStyle = activeCellColor;
	line(start.x, start.y, e.x, e.y);
}

/**
 * Returns the cell at the current mouse position grid cell
 * @param {Event} e the mouseevent to retrive the current mouse position
 * @returns  the cell at the current mouse position
 */
function getGridCell(e,logging = false){
    canvaspos = { x: e.x - rect.x, y: e.y - rect.y/2 };     // there is a offset of half the y value for the rect.
    let x = Math.max(Math.floor(canvaspos.x / step), 0);
    let y = Math.max(Math.floor(canvaspos.y / step), 0);
    if(logging)
        console.log(x,y, canvaspos)
    return grid[x][y]
}

/**
 * clears all cells that are set as inactive.
 */
function clearAllInactive(){
    for (let w = 0; w < grid.length; w++) {
			for (let h = 0; h < grid.length; h++) {
				const c = grid[w][h];
				if (!c.isActive) c.deactivate();
			}
		}
}

function updateTable(){
    const table = document.querySelector("#node-table");
    cellsForTable = []

    for (let i = 0; i < cells; i++) {
        for (let j = 0; j < cells; j++) {
            const cell = grid[i][j];
            if(cell.isActive){
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
    
    clearTable(table)
    cellsForTable.forEach(cell=> appendRow(cell,table))
}

function appendRow(cell,table){
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

function clearTable(table) {
	var rows = table.rows;
	var i = rows.length;
	while (--i) {
		rows[i].parentNode.removeChild(rows[i]);
		// or
		// table.deleteRow(i);
	}
}

function stringFromSet(cell){
    return {}
}