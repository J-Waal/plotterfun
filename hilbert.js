/**
 * Algorithm by j-waal
 */
importScripts('helpers.js')

postMessage(['sliders', defaultControls.concat([
  {label: 'Order', value: 5, min: 1, max: 10},
  {label: 'Fill', type:'select', value:'off', options:['off', '1', '2', 'dynamic']}
])]);
 

function addlevel(order, line, dir, fill, table){
  let x;
  let y;
  [x,y] = line[(line.length - 1)];
  // dir table
  // 0 left to right
  // 1 bottom to top
  // 2 right to left
  // 3 top to bottom
  if (order == 1 || decideIteration(table,x,y,order,dir)){
    const c = Math.pow(2,order);
    addFill(fill, line, dir, x, y, c, table); // add optional fill 
    // add last point
    if (dir == 0){
      line.push([x+c,y]);
    }
    if (dir == 1){
      line.push([x,y-c]);
    }
    if (dir == 2){
      line.push([x-c,y]);
    }
    if (dir == 3){
      line.push([x,y+c]);
    }
  } else {
    addOrder(dir, order, line, fill, table)
  }
}
function decideIteration(table,x,y,order,dir){
  const size = Math.pow(2,order);
  const c = (dir<2 ? 1 : -1)*size;
  const x2 = x+c;
  const y2 = y-c;
  return (findSum(table,x,x2,y2,y) < 510*size)
}
function addOrder(dir, order, line, fill, table){
  if (dir == 0){
    // make the pattern right = urrd
    addlevel(order-1, line, 1, fill, table);
    addlevel(order-1, line, 0, fill, table);
    addlevel(order-1, line, 0, fill, table);
    addlevel(order-1, line, 3, fill, table);
  }
  if (dir == 1){
    // make the pattern up = ruul
    addlevel(order-1, line, 0, fill, table);
    addlevel(order-1, line, 1, fill, table);
    addlevel(order-1, line, 1, fill, table);
    addlevel(order-1, line, 2, fill, table);
  }
  if (dir == 2){
    // make the pattern left = dllu
    addlevel(order-1, line, 3, fill, table);
    addlevel(order-1, line, 2, fill, table);
    addlevel(order-1, line, 2, fill, table);
    addlevel(order-1, line, 1, fill, table);
  }
  if (dir == 3){
    // make the pattern down = lddr
    addlevel(order-1, line, 2, fill, table);
    addlevel(order-1, line, 3, fill, table);
    addlevel(order-1, line, 3, fill, table);
    addlevel(order-1, line, 0, fill, table);
  }
}
function addFill(fill, line, dir, x, y, c, table){
  function fill1(){
    // add extra point
    if (dir == 0){
      line.push([x+c/2,y-c]);
    }
    if (dir == 1){
      line.push([x+c,y-c/2]);
    }
    if (dir == 2){
      line.push([x-c/2,y+c]);
    }
    if (dir == 3){
      line.push([x-c,y+c/2]);
    }
  }
  function fill2(){
    // add 3 extra points
    if (dir == 0){
      line.push([x+c,y-c/3*2]);
      line.push([x+c/2,y-c]);
      line.push([x,y-c/3*2]);
    }
    if (dir == 1){
      line.push([x+c/3*2,y-c]);
      line.push([x+c,y-2*c/4]);
      line.push([x+c/3*2,y]);
    }
    if (dir == 2){
      line.push([x-c,y+c/3*2]);
      line.push([x-c/2,y+c]);
      line.push([x,y+c/3*2]);
    }
    if (dir == 3){
      line.push([x-c/3*2,y+c]);
      line.push([x-c,y+2*c/4]);
      line.push([x-c/3*2,y]);
    }
  }
  if (fill == '1'){
    fill1()
  } else if (fill == '2'){
    fill2()
  } else if (fill == 'dynamic'){
    const d = (dir<2 ? 1 : -1)*c;
    const x2 = x+d;
    const y2 = y-d;
    //console.log(findSum(table,x,x2,y2,y))
    if (findSum(table,x,x2,y2,y) < 340*c){
      fill1()
    } else {
      fill2()
    }
  }
}
function transformToMatrix(getPixel, scale, maxsize){
  // by first calculating this intergral matrix we can find the
  // sum of over an arbitrary rectangle by only looking at the corners.
  // F. Crow. Summed-area tables for texture mapping (1984)
  function transformPixel(x,y){
    // use the nearest available pixel
    return getPixel(Math.round(x*scale[0]),Math.round(y*scale[1]))
  }
  var a = [], b;
  a.push(Array(maxsize+1).fill(0))
  function findSum(x,y,a){
    return transformPixel(x-1,y-1)-a[x-1][y-1]+a[x-1][y]+a[x][y-1];
  }
  while (a.length <= maxsize){
    a.push(b = [0])
    while (b.push(findSum(a.length-1,b.length,a)) <= maxsize);
  }
  return a;
}
// find the sum using the intergral matrix
function findSum(table,xl,xr,yt,yb){
  //console.log(xl,xr,yt,yb)
  //return table[xr+1][yb+1]+table[xl][yt]-table[xl][yb+1]-table[xr+1][yt]
  return table[xr][yb]+table[xl][yt]-table[xl][yb]-table[xr][yt]
}



onmessage = function(e) {
  const [ config, pixData ] = e.data;
  const getPixel = pixelProcessor(config, pixData)
  const order = config.Order;

  const fill = config.Fill

  const maxsize = Math.pow(2,order)
  const hscale = config.width/(maxsize)
  const vscale = config.height/(maxsize)
  const scale = [hscale,vscale] // scale represents mismatch between pixels and line units

  // step 1: transform image to fit square matrix size 3**order
  let table = transformToMatrix(getPixel,scale,maxsize);

  // step 2: genarate using this matrix
  let line = [[0,maxsize]] // add first point
  addlevel(order, line, 0, fill, table);

  // step 3: scale output to fit the canvas dimensions
  line.forEach(function (item, index) {
    line[index] = [item[0]*scale[0],item[1]*scale[1]];
  });
  

  postLines(line);
}
