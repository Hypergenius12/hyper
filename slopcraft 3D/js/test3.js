import { BLOCKS, getBlockProperties } from './textures.js';

let props = getBlockProperties(BLOCKS.KELP);
console.log("Kelp isWaterlogged:", props.isWaterlogged);
console.log("Kelp transparent:", props.transparent);
console.log("Kelp isCross:", props.isCross);
