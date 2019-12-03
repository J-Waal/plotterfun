importScripts('helpers.js')

postMessage(['sliders', [
  {label: 'Inverted', type:'checkbox'},
  {label: 'Brightness', value: 0, min: -100, max: 100},
  {label: 'Contrast', value: 0, min: -100, max: 100},
  {label: 'Min brightness', value: 0, min: 0, max: 255},
  {label: 'Max brightness', value: 255, min: 0, max: 255},
  {label: 'Frequency', value: 150, min: 5, max: 256},
  {label: 'Line Count', value: 50, min: 10, max: 200},
  {label: 'Amplitude', value: 1, min: 0.1, max: 5, step: 0.1},
  {label: 'Sampling', value: 1, min: 0.5, max: 2.9, step: 0.1},
]]);


onmessage = function(e) {
  const [ config, pixData ] = e.data;
  const getPixel = pixelProcessor(config, pixData)

  const lineCount = config['Line Count'];
  const amplitude = config.Amplitude;
  const frequency = config.Frequency;
  const incr_x = config.Sampling;
  const incr_y = Math.floor(config.height / lineCount);
  let squiggleData = [];

  for (let y = 0; y < config.height; y += incr_y) {
    let a = 0;
    let line = [];

    for (let x = 0; x <= config.width; x += incr_x) {
      let z = getPixel(x, y)
      let r = amplitude * z / lineCount;
      a += z / frequency;
      line.push([x, y + Math.sin(a)*r]);
    }
    squiggleData.push(line)
  }

  postMessage(['points', squiggleData]);
}
