importScripts('helpers.js')

postMessage(['sliders', [
  {label: 'Divisions', value: 5, min: 1, max: 40},
  {label: 'Smoothing', value: 10, min: 0, max: 25},
  {label: 'Smoothing Method', type:'select', value:'Cosine', options:['Linear', 'Cosine']},
  {label: 'Fill Boundary', type:'checkbox'},
  {label: 'Order', value: 5, min: 0, max: 10},
  {label: 'Left Right', type:'checkbox'},
  {label: 'Join Ends', type:'checkbox'},
]]);


onmessage = function(e) {
  const [ config, pixData ] = e.data;
  const getPixel = pixelProcessor(config, pixData)


  function combine(listA, listB, smoothing, cosine) {
    if (smoothing) {
      smoothing += 1; // value of 1 uses the same point twice, same result as 0
      const listAstrip = listA.slice(0,-smoothing)
      const listBstrip = listB.slice(smoothing)
      const listAtoMerge = listA.slice(-smoothing)
      const listBtoMerge = listB.slice(0,smoothing)
      let middlePart = [];
      for (let i = 0; i < smoothing; i++){
        const xA = listAtoMerge[i][0]
        const xB = listBtoMerge[i][0]
        const yA = listAtoMerge[i][1]
        const yB = listBtoMerge[i][1]
        let a = (smoothing-i-1)/(smoothing-1)
        let b = i/(smoothing-1)
        if (cosine) { // change linear value to cosine
          a = 0.5-0.5*Math.cos(Math.PI*a)
          b = 0.5-0.5*Math.cos(Math.PI*b)
        }
        const x = a*xA + b*xB
        const y = a*yA + b*yB
        middlePart.push([x,y])
      }
      return [].concat(listAstrip,middlePart,listBstrip)
    } else {
      return [].concat(listA,listB);
    }
  }

  function makeBlock(blockXoffset, blockYoffset, order, blockXsize, blockYsize) {
    let block = []; // create block with given center location
    const numSteps = subSteps*(order+1) // longer line needs more steps (also helps balance smoothing)
    const alpha = order%2?order+2:order+1; // odd
    const beta = order%2?order+1:order+2; // even
    for (let step = 0; step <= numSteps; step++) { // genarate the curve in a block
      const t = step*Math.PI/numSteps // phase on lissajous curve
      const x = -blockXsize/2*Math.cos(t*alpha)+blockXoffset
      const y = -blockYsize/2*Math.cos(t*beta)+blockYoffset
      block.push([x,y]);
    }
    return block
  }

  function findLineLength(line) { // determine the length of a path
    let length = 0;
    for (let i = 1; i < line.length; i++) {
      const d = Math.sqrt(Math.pow(line[i-1][0]-line[i][0],2)+Math.pow(line[i-1][1]-line[i][1],2))
      length += d // add distance of segment to total
    }
    return length
  }

  const divisions = config.Divisions;
  const subSteps = 50; // base number of sample per block
  const smoothing = config.Smoothing;
  const boundary = config['Fill Boundary'] | (divisions == 1); // single row has only edge
  const maxOrder = config.Order;
  const cosine = config['Smoothing Method'] == 'Cosine'
  const leftright = config['Left Right']
  const joined = config['Join Ends']

  const blockXsize = config.width/divisions;
  const blockYsize = config.height/divisions;

  let lengthMap = [] // create a list of the path for every posible curve order
  for (let order = 0; order <= maxOrder; order++) {
    const block = makeBlock(0,0,order,blockXsize,blockYsize)
    const length = findLineLength(block)
    lengthMap.push(length)
  }

  function pixelToOrder(z, lengthMap) {
    if (lengthMap.length == 1) {
      return 0; // only available option
    } else {
      const scaleMax = lengthMap[lengthMap.length-1]+(lengthMap[lengthMap.length-1]-lengthMap[lengthMap.length-2])/2
      const scale = scaleMax/255
      z *= scale // map pixel value to target line length
      let bestFit = Infinity
      let bestIndex // I think it is safe to leave uninitialised
      for (let i = 0; i < lengthMap.length; i++) {
        const error = Math.abs(z - lengthMap[i])
        if (error < bestFit) { // find the option closest to the target value
          bestIndex = i;
          bestFit = error;
        }
      }
      return bestIndex
    }
  }

  let drawing = [];
  if (joined) drawing[0]=[]

  for (let l = 0; l < (divisions-1); l++) { // run for every line
    let blocks = [];
    for (let k = 0; k < divisions; k++) { // run for every block on a line
      const blockXoffset = blockXsize*(0.5+k)
      const blockYoffset = blockYsize*(0.5+l+k%2)
      const z = getPixel(blockXoffset, blockYoffset)
      const order = pixelToOrder(z, lengthMap)
      const block = makeBlock(blockXoffset, blockYoffset, order, blockXsize, blockYsize*(k%2?1:-1))
      blocks.push(block);
    }
    while (blocks.length > 1) { // merge blocks into single line with smoothing
      const listB = blocks.pop();
      const listA = blocks.pop();
      blocks.push(combine(listA, listB, smoothing, cosine))
    }
    if (leftright && l % 2 == 1) {
      blocks[0].reverse()
    }
    if (joined) {
      drawing[0]=drawing[0].concat(blocks[0]);
    } else {
      drawing.push(blocks[0])
    }
  }

  if (boundary) { // add the missing blocks on the top and bottom lines
    let topRow = []
    if (joined) {
      topRow[0] = [[0,0]] // add top left corner
    }
    for (let k = 1; k < divisions; k += 2) { // fill the top row
      const blockXoffset = blockXsize*(0.5+k);
      const blockYoffset = blockYsize*0.5
      const z = getPixel(blockXoffset, blockYoffset);
      const order = pixelToOrder(getPixel(blockXoffset, blockYoffset), lengthMap)
      const block = makeBlock(blockXoffset, blockYoffset, order, blockXsize, blockYsize)
      if (joined) {
        topRow[0] = topRow[0].concat(block)
      } else {
        topRow.push(block)
      }
    }
    if (joined) {
      topRow[0].push([config.width,0]) // add top right corner
    }
    if (leftright) {
      topRow.map(item => item.reverse()).reverse() // invert direction
    }
    if (joined) {
      drawing[0] = topRow[0].concat(drawing[0])
    } else {
      drawing = topRow.concat(drawing)
    }

    let botRow = []
    if (joined) {
      botRow[0] = []
    }
    for (let k = 0; k < divisions; k += 2) { // fill the bottom row
      const blockXoffset = blockXsize*(0.5+k);
      const blockYoffset = blockYsize*(divisions-0.5)
      const z = getPixel(blockXoffset, blockYoffset);
      const order = pixelToOrder(getPixel(blockXoffset, blockYoffset), lengthMap)
      const block = makeBlock(blockXoffset, blockYoffset, order, blockXsize, -blockYsize)
      if (joined) {
        botRow[0] = botRow[0].concat(block)
      } else {
        botRow.push(block)
      }
    }
    if (joined) {
      botRow[0].push([config.width,config.height]) // add bottom right corner
    }
    if (leftright && divisions % 2 == 0) {
      botRow.map(item => item.reverse()).reverse() // invert direction
    }
    if (joined) {
      drawing[0] = drawing[0].concat(botRow[0])
    } else {
      drawing = drawing.concat(botRow)
    }
  }

  postLines(drawing);
}
