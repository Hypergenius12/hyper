const fs = require('fs');

let html = fs.readFileSync('slopcraft 3D/index.html', 'utf8');

// Add start blur toggle
html = html.replace('<input type="checkbox" id="start-mc-textures-toggle"> Use default Minecraft textures\n                </label>', 
`<input type="checkbox" id="start-mc-textures-toggle"> Use default Minecraft textures
                </label>
            </div>
            <div style="margin: 10px 0; display: flex; align-items: center; gap: 10px; justify-content: center;">
                <label style="color: #aa8866; font-family: 'Comic Sans MS'; font-size: 1rem; cursor: pointer;">
                    <input type="checkbox" id="start-blur-toggle" checked> Distance Blur (Depth of Field)
                </label>`);

// Add pause blur toggle
html = html.replace('<input type="checkbox" id="pause-mc-textures-toggle"> Use Minecraft Textures (Requires Restart)\n                    </label>', 
`<input type="checkbox" id="pause-mc-textures-toggle"> Use Minecraft Textures (Requires Restart)
                    </label>
                </div>
                <div style="margin: 10px 0; display: flex; align-items: center; gap: 10px; justify-content: center;">
                    <label style="color: #aa8866; font-family: 'Comic Sans MS'; font-size: 1rem; cursor: pointer;">
                        <input type="checkbox" id="pause-blur-toggle" checked> Distance Blur (Depth of Field)
                    </label>`);

fs.writeFileSync('slopcraft 3D/index.html', html);
