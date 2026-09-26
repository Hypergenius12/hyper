function generateNetherChunk() {
  const CHUNK_SIZE = 16;
  const CHUNK_HEIGHT = 128;
  // Create coarse noise grid
  const gridX = 5; // 0, 4, 8, 12, 16
  const gridZ = 5;
  const gridY = 9; // 0, 16, 32, 48, 64, 80, 96, 112, 128
  
  const noiseGrid = new Float32Array(gridX * gridY * gridZ);
  
  // fill noiseGrid ...
}
