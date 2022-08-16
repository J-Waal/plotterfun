/**
 * Algorithm by j-waal
 */
importScripts('helpers.js')

postMessage(['sliders', defaultControls.concat([
  {label: 'Order', value: 5, min: 1, max: 6},
  {label: 'Fill', type:'checkbox'},
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
  s = decideIteration(table,x,y,order,dir);
  if (order == 1 || s){
    c = Math.pow(3,order);
    if (fill){
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
    if (dir == 0){
      // make the pattern right = uurrrlddr
      addlevel(order-1, line, 1, fill, table);
      addlevel(order-1, line, 1, fill, table);
      addlevel(order-1, line, 0, fill, table);
      addlevel(order-1, line, 0, fill, table);
      addlevel(order-1, line, 0, fill, table);
      addlevel(order-1, line, 2, fill, table);
      addlevel(order-1, line, 3, fill, table);
      addlevel(order-1, line, 3, fill, table);
      addlevel(order-1, line, 0, fill, table);
    }
    if (dir == 1){
      // make the pattern up = rruuudllu
      addlevel(order-1, line, 0, fill, table);
      addlevel(order-1, line, 0, fill, table);
      addlevel(order-1, line, 1, fill, table);
      addlevel(order-1, line, 1, fill, table);
      addlevel(order-1, line, 1, fill, table);
      addlevel(order-1, line, 3, fill, table);
      addlevel(order-1, line, 2, fill, table);
      addlevel(order-1, line, 2, fill, table);
      addlevel(order-1, line, 1, fill, table);
    }
    if (dir == 2){
      // make the pattern left = ddlllruul
      addlevel(order-1, line, 3, fill, table);
      addlevel(order-1, line, 3, fill, table);
      addlevel(order-1, line, 2, fill, table);
      addlevel(order-1, line, 2, fill, table);
      addlevel(order-1, line, 2, fill, table);
      addlevel(order-1, line, 0, fill, table);
      addlevel(order-1, line, 1, fill, table);
      addlevel(order-1, line, 1, fill, table);
      addlevel(order-1, line, 2, fill, table);
    }
    if (dir == 3){
      // make the pattern down = lldddurrd
      addlevel(order-1, line, 2, fill, table);
      addlevel(order-1, line, 2, fill, table);
      addlevel(order-1, line, 3, fill, table);
      addlevel(order-1, line, 3, fill, table);
      addlevel(order-1, line, 3, fill, table);
      addlevel(order-1, line, 1, fill, table);
      addlevel(order-1, line, 0, fill, table);
      addlevel(order-1, line, 0, fill, table);
      addlevel(order-1, line, 3, fill, table);
    }
  }
}
function decideIteration(table,x,y,order,dir){
  size = Math.pow(3,order);
  c = (dir<2 ? 1 : -1)*size;
  x2 = x+c;
  y2 = y-c;
  //console.log(findSum(table,x,x2,y2,y))
  return (findSum(table,x,x2,y2,y) < 1530*size)
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
  //return table[xr+1][yb+1]+table[xl][yt]-table[xl][yb+1]-table[xr+1][yt]
  return table[xr][yb]+table[xl][yt]-table[xl][yb]-table[xr][yt]
}

onmessage = function(e) {
  const [ config, pixData ] = e.data;
  getPixel = pixelProcessor(config, pixData)
  const order = config.Order;
  const fill = config.Fill;

  maxsize = Math.pow(3,order)
  hscale = config.width/(maxsize)
  vscale = config.height/(maxsize)
  scale = [hscale,vscale] // scale represents mismatch between pixels and line units

  // step 1: transform image to fit square matrix size 3**order
  table = transformToMatrix(getPixel,scale,maxsize);
  
  // step 2: genarate using this matrix
  line = [[0,maxsize]] // add first point
  addlevel(order, line, 0, fill, table);

  // step 3: scale output to fit the canvas dimensions
  line.forEach(function (item, index) {
    line[index] = [item[0]*scale[0],item[1]*scale[1]];
  });

  postLines(line);
}
