importScripts('helpers.js')

postMessage(['sliders', [
  {label: 'Divisions', value: 5, min: 1, max: 20},
  //{label: 'SubSteps', value: 50, min: 10, max: 500},
]]);


onmessage = function(e) {
  const [ config, pixData ] = e.data;
  const getPixel = pixelProcessor(config, pixData)

  let drawing = [];

  

  const divisions = config.Divisions;
  const subSteps = 50; //config.SubSteps;

  const blockXsize = config.width/divisions;
  const blockYsize = config.height/divisions;
  //console.log(blockXsize,blockYsize,subSteps)

  for (let l = 0; l < (divisions-1); l++) { // run for every line
    let line = [];
    for (let k = 0; k < divisions; k++) { // run for every block on a line
      const blockXoffset = blockXsize*(0.5+k)
      const blockYoffset = blockYsize*(0.5+l+k%2)
      const z = getPixel(blockXoffset, blockYoffset);
      const order = Math.floor(z/20)
      const alpha = order%2?order+2:order+1; // odd
      const beta = order%2?order+1:order+2; // even
      
      for (let t = 0; t <= Math.PI; t += Math.PI/(subSteps*(order+1))) { // genarate the curve in a block
        line.push([-blockXsize/2*Math.cos(t*alpha)+blockXoffset,-blockYsize*(k%2?1:-1)/2*Math.cos(t*beta)+blockYoffset]);
        //console.log(t);
      }
      //console.log(k);
    }
    drawing.push(line);
  }

  
  postLines(drawing);
}

