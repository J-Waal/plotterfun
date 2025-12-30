importScripts('helpers.js')

postMessage(['sliders', [
  {label: 'Divisions', value: 5, min: 1, max: 20},
  //{label: 'SubSteps', value: 50, min: 10, max: 500},
  {label: 'Smoothing', value: 10, min: 0, max: 50},
]]);


onmessage = function(e) {
  const [ config, pixData ] = e.data;
  const getPixel = pixelProcessor(config, pixData)

  let drawing = [];


  function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

  function combine(listA, listB, smoothing) {
    listAstrip = listA.slice(0,-smoothing)
    listBstrip = listB.slice(smoothing)
    listAtoMerge = listA.slice(-smoothing)
    listBtoMerge = listB.slice(0,smoothing)
    let middlePart = [];
    for (let i = 0; i < smoothing; i++){
      xA = listAtoMerge[i][0]
      xB = listBtoMerge[i][0]
      yA = listAtoMerge[i][1]
      yB = listBtoMerge[i][1]
      a = (smoothing-i-1)/(smoothing-1)
      b = i/(smoothing-1)
      //console.log(a,b,a+b)
      x = a*xA + b*xB
      y = a*yA + b*yB
      middlePart.push([x,y])
    }
    return [].concat(listAstrip,middlePart,listBstrip)
  }

  const divisions = config.Divisions;
  const subSteps = 50; //config.SubSteps;
  const smoothing = config.Smoothing;

  const blockXsize = config.width/divisions;
  const blockYsize = config.height/divisions;
  //console.log(blockXsize,blockYsize,subSteps)

  for (let l = 0; l < (divisions-1); l++) { // run for every line
    let blocks = [];
    for (let k = 0; k < divisions; k++) { // run for every block on a line
      const blockXoffset = blockXsize*(0.5+k)
      const blockYoffset = blockYsize*(0.5+l+k%2)
      const z = getPixel(blockXoffset, blockYoffset);
      const order = Math.floor(z/20) // need to find good function
      const alpha = order%2?order+2:order+1; // odd
      const beta = order%2?order+1:order+2; // even
      let block = [];
      const numSteps = subSteps*(order+1)
      for (let step = 0; step <= numSteps; step++) { // genarate the curve in a block
        const t = step*Math.PI/numSteps
        block.push([-blockXsize/2*Math.cos(t*alpha)+blockXoffset,-blockYsize*(k%2?1:-1)/2*Math.cos(t*beta)+blockYoffset]);
      }
      blocks.push(block);
    }
    //console.log(blocks)
    // merge blocks into single line with smoothing
    while (blocks.length > 1) {
      listB = blocks.pop();
      listA = blocks.pop();
      blocks.push(combine(listA,listB,smoothing))
    }
    drawing.push(blocks[0])
  }

  
  postLines(drawing);
}

