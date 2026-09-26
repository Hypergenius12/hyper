// Caves are now integrated directly into the terrain mesh via 3D noise!
// This file is kept to prevent undefined errors if anything calls CaveManager.
class CaveManager {
    constructor(scene) { this.scene = scene; }
    checkEntrance() {}
}
window.CaveManager = CaveManager;
