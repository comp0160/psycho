/* shared drawing functions used by multiple experiments */
export function filled_circle (canvas, x, y, radius, color)
{
    var ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
}

export function canvas_background ( canvas, col )
{
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = col;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export function set_page_background ( col )
{
    document.body.style.background = col; 
}

export function clear_page_background ()
{
    set_page_background(null);
}

export function grey_colour ( n ) { return `rgb(${n}, ${n}, ${n})`; }

export function show_spot ( canvas, col, frac )
{
    var ctx = canvas.getContext("2d");
    var height = ctx.canvas.height;
    var width = ctx.canvas.width;
    filled_circle ( canvas, width/2, height/2, height/frac, grey_colour(col) );
}
