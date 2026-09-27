const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/engine.js', 'utf8');

// Replace array allocations
code = code.replace(/        const _glowOpaqueIndices = new Uint32Array\(3000\);/g, '        const _glowOpaqueIndices = new Uint32Array(3000);\n        const _slightGlowOpaqueIndices = new Uint32Array(5000);');
code = code.replace(/        const _glowTransparentIndices = new Uint32Array\(1000\);/g, '        const _glowTransparentIndices = new Uint32Array(1000);\n        const _slightGlowTransparentIndices = new Uint32Array(1000);');

// Replace the sorting logic inside the loop
const sortLogicOld = `                            // Add indices — use currentProps/currentBlockType so waterlogged blocks sort as water
                            if (currentProps.transparent) {
                                if (currentBlockType === BLOCKS.WATER || currentBlockType === BLOCKS.SWAMP_WATER || currentBlockType === BLOCKS.LAVA) {
                                    _waterIndices[waterIndexCount++] = vertexCount; _waterIndices[waterIndexCount++] = vertexCount + 1; _waterIndices[waterIndexCount++] = vertexCount + 2;
                                    _waterIndices[waterIndexCount++] = vertexCount; _waterIndices[waterIndexCount++] = vertexCount + 2; _waterIndices[waterIndexCount++] = vertexCount + 3;
                                } else if (currentProps.emissive > 0) {
                                    _glowTransparentIndices[glowTransparentIndexCount++] = vertexCount; _glowTransparentIndices[glowTransparentIndexCount++] = vertexCount + 1; _glowTransparentIndices[glowTransparentIndexCount++] = vertexCount + 2;
                                    _glowTransparentIndices[glowTransparentIndexCount++] = vertexCount; _glowTransparentIndices[glowTransparentIndexCount++] = vertexCount + 2; _glowTransparentIndices[glowTransparentIndexCount++] = vertexCount + 3;
                                } else {
                                    _transparentIndices[transparentIndexCount++] = vertexCount; _transparentIndices[transparentIndexCount++] = vertexCount + 1; _transparentIndices[transparentIndexCount++] = vertexCount + 2;
                                    _transparentIndices[transparentIndexCount++] = vertexCount; _transparentIndices[transparentIndexCount++] = vertexCount + 2; _transparentIndices[transparentIndexCount++] = vertexCount + 3;
                                }
                            } else {
                                if (currentProps.emissive > 0) {
                                    _glowOpaqueIndices[glowOpaqueIndexCount++] = vertexCount; _glowOpaqueIndices[glowOpaqueIndexCount++] = vertexCount + 1; _glowOpaqueIndices[glowOpaqueIndexCount++] = vertexCount + 2;
                                    _glowOpaqueIndices[glowOpaqueIndexCount++] = vertexCount; _glowOpaqueIndices[glowOpaqueIndexCount++] = vertexCount + 2; _glowOpaqueIndices[glowOpaqueIndexCount++] = vertexCount + 3;
                                } else {
                                    _opaqueIndices[opaqueIndexCount++] = vertexCount; _opaqueIndices[opaqueIndexCount++] = vertexCount + 1; _opaqueIndices[opaqueIndexCount++] = vertexCount + 2;
                                    _opaqueIndices[opaqueIndexCount++] = vertexCount; _opaqueIndices[opaqueIndexCount++] = vertexCount + 2; _opaqueIndices[opaqueIndexCount++] = vertexCount + 3;
                                }
                            }`;

const sortLogicNew = `                            // Add indices — use currentProps/currentBlockType so waterlogged blocks sort as water
                            if (currentProps.transparent) {
                                if (currentBlockType === BLOCKS.WATER || currentBlockType === BLOCKS.SWAMP_WATER || currentBlockType === BLOCKS.LAVA) {
                                    _waterIndices[waterIndexCount++] = vertexCount; _waterIndices[waterIndexCount++] = vertexCount + 1; _waterIndices[waterIndexCount++] = vertexCount + 2;
                                    _waterIndices[waterIndexCount++] = vertexCount; _waterIndices[waterIndexCount++] = vertexCount + 2; _waterIndices[waterIndexCount++] = vertexCount + 3;
                                } else if (currentProps.emissive >= 0.8) {
                                    _glowTransparentIndices[glowTransparentIndexCount++] = vertexCount; _glowTransparentIndices[glowTransparentIndexCount++] = vertexCount + 1; _glowTransparentIndices[glowTransparentIndexCount++] = vertexCount + 2;
                                    _glowTransparentIndices[glowTransparentIndexCount++] = vertexCount; _glowTransparentIndices[glowTransparentIndexCount++] = vertexCount + 2; _glowTransparentIndices[glowTransparentIndexCount++] = vertexCount + 3;
                                } else if (currentProps.emissive > 0) {
                                    _slightGlowTransparentIndices[slightGlowTransparentIndexCount++] = vertexCount; _slightGlowTransparentIndices[slightGlowTransparentIndexCount++] = vertexCount + 1; _slightGlowTransparentIndices[slightGlowTransparentIndexCount++] = vertexCount + 2;
                                    _slightGlowTransparentIndices[slightGlowTransparentIndexCount++] = vertexCount; _slightGlowTransparentIndices[slightGlowTransparentIndexCount++] = vertexCount + 2; _slightGlowTransparentIndices[slightGlowTransparentIndexCount++] = vertexCount + 3;
                                } else {
                                    _transparentIndices[transparentIndexCount++] = vertexCount; _transparentIndices[transparentIndexCount++] = vertexCount + 1; _transparentIndices[transparentIndexCount++] = vertexCount + 2;
                                    _transparentIndices[transparentIndexCount++] = vertexCount; _transparentIndices[transparentIndexCount++] = vertexCount + 2; _transparentIndices[transparentIndexCount++] = vertexCount + 3;
                                }
                            } else {
                                if (currentProps.emissive >= 0.8) {
                                    _glowOpaqueIndices[glowOpaqueIndexCount++] = vertexCount; _glowOpaqueIndices[glowOpaqueIndexCount++] = vertexCount + 1; _glowOpaqueIndices[glowOpaqueIndexCount++] = vertexCount + 2;
                                    _glowOpaqueIndices[glowOpaqueIndexCount++] = vertexCount; _glowOpaqueIndices[glowOpaqueIndexCount++] = vertexCount + 2; _glowOpaqueIndices[glowOpaqueIndexCount++] = vertexCount + 3;
                                } else if (currentProps.emissive > 0) {
                                    _slightGlowOpaqueIndices[slightGlowOpaqueIndexCount++] = vertexCount; _slightGlowOpaqueIndices[slightGlowOpaqueIndexCount++] = vertexCount + 1; _slightGlowOpaqueIndices[slightGlowOpaqueIndexCount++] = vertexCount + 2;
                                    _slightGlowOpaqueIndices[slightGlowOpaqueIndexCount++] = vertexCount; _slightGlowOpaqueIndices[slightGlowOpaqueIndexCount++] = vertexCount + 2; _slightGlowOpaqueIndices[slightGlowOpaqueIndexCount++] = vertexCount + 3;
                                } else {
                                    _opaqueIndices[opaqueIndexCount++] = vertexCount; _opaqueIndices[opaqueIndexCount++] = vertexCount + 1; _opaqueIndices[opaqueIndexCount++] = vertexCount + 2;
                                    _opaqueIndices[opaqueIndexCount++] = vertexCount; _opaqueIndices[opaqueIndexCount++] = vertexCount + 2; _opaqueIndices[opaqueIndexCount++] = vertexCount + 3;
                                }
                            }`;

code = code.replace(sortLogicOld, sortLogicNew);

// And combine indices properly
const mergeOld = `        allIndices.set(_opaqueIndices.subarray(0, opaqueIndexCount), offset); offset += opaqueIndexCount;
        allIndices.set(_crossIndices.subarray(0, crossIndexCount), offset); offset += crossIndexCount;
        allIndices.set(_glowCrossIndices.subarray(0, glowCrossIndexCount), offset); offset += glowCrossIndexCount;
        allIndices.set(_waterIndices.subarray(0, waterIndexCount), offset); offset += waterIndexCount;
        allIndices.set(_transparentIndices.subarray(0, transparentIndexCount), offset); offset += transparentIndexCount;
        allIndices.set(_glowOpaqueIndices.subarray(0, glowOpaqueIndexCount), offset); offset += glowOpaqueIndexCount;
        allIndices.set(_glowTransparentIndices.subarray(0, glowTransparentIndexCount), offset); offset += glowTransparentIndexCount;`;

const mergeNew = `        allIndices.set(_opaqueIndices.subarray(0, opaqueIndexCount), offset); offset += opaqueIndexCount;
        allIndices.set(_crossIndices.subarray(0, crossIndexCount), offset); offset += crossIndexCount;
        allIndices.set(_glowCrossIndices.subarray(0, glowCrossIndexCount), offset); offset += glowCrossIndexCount;
        allIndices.set(_waterIndices.subarray(0, waterIndexCount), offset); offset += waterIndexCount;
        allIndices.set(_transparentIndices.subarray(0, transparentIndexCount), offset); offset += transparentIndexCount;
        allIndices.set(_glowOpaqueIndices.subarray(0, glowOpaqueIndexCount), offset); offset += glowOpaqueIndexCount;
        allIndices.set(_glowTransparentIndices.subarray(0, glowTransparentIndexCount), offset); offset += glowTransparentIndexCount;
        allIndices.set(_slightGlowOpaqueIndices.subarray(0, slightGlowOpaqueIndexCount), offset); offset += slightGlowOpaqueIndexCount;
        allIndices.set(_slightGlowTransparentIndices.subarray(0, slightGlowTransparentIndexCount), offset); offset += slightGlowTransparentIndexCount;`;

code = code.replace(mergeOld, mergeNew);

fs.writeFileSync('slopcraft 3D/js/engine.js', code);
