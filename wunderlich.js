/**
 * Algorithm by j-waal
 */
importScripts('helpers.js')

postMessage(['sliders', defaultControls.concat([
  {label: 'Order', value: 5, min: 1, max: 6},
])]);
 

function addlevel(order, line, dir){
  let x;
  let y;
  [x,y] = line[(line.length - 1)];
  // dir table
  // 0 left to right
  // 1 bottom to top
  // 2 right to left
  // 3 top to bottom
  if (order == 1){
    c = Math.pow(3,order);
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
      addlevel(order-1, line, 1);
      addlevel(order-1, line, 1);
      addlevel(order-1, line, 0);
      addlevel(order-1, line, 0);
      addlevel(order-1, line, 0);
      addlevel(order-1, line, 2);
      addlevel(order-1, line, 3);
      addlevel(order-1, line, 3);
      addlevel(order-1, line, 0);
    }
    if (dir == 1){
      // make the pattern up = rruuudllu
      addlevel(order-1, line, 0);
      addlevel(order-1, line, 0);
      addlevel(order-1, line, 1);
      addlevel(order-1, line, 1);
      addlevel(order-1, line, 1);
      addlevel(order-1, line, 3);
      addlevel(order-1, line, 2);
      addlevel(order-1, line, 2);
      addlevel(order-1, line, 1);
    }
    if (dir == 2){
      // make the pattern left = ddlllruul
      addlevel(order-1, line, 3);
      addlevel(order-1, line, 3);
      addlevel(order-1, line, 2);
      addlevel(order-1, line, 2);
      addlevel(order-1, line, 2);
      addlevel(order-1, line, 0);
      addlevel(order-1, line, 1);
      addlevel(order-1, line, 1);
      addlevel(order-1, line, 2);
    }
    if (dir == 3){
      // make the pattern down = lldddurrd
      addlevel(order-1, line, 2);
      addlevel(order-1, line, 2);
      addlevel(order-1, line, 3);
      addlevel(order-1, line, 3);
      addlevel(order-1, line, 3);
      addlevel(order-1, line, 1);
      addlevel(order-1, line, 0);
      addlevel(order-1, line, 0);
      addlevel(order-1, line, 3);
    }
  }
}


// pattern = uurrrlddr

onmessage = function(e) {
  const [ config, pixData ] = e.data;
  getPixel = pixelProcessor(config, pixData)
  const order = config.Order;

  maxsize = Math.pow(3,order)
  hscale = config.width/(maxsize)
  vscale = config.height/(maxsize)
  scale = [hscale,vscale] // scale represents mismatch between pixels and line units

  line = [[0,maxsize]] // add first point
  //console.log(line)
  
  addlevel(order, line, 0);


  var newline = [];

  line.forEach(function (item, index) {
    // scale to fit the canvas
    line[index] = [item[0]*scale[0],item[1]*scale[1]];
  });

  postLines(line);
}
 