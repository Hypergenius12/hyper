const fs = require('fs');

let mainPath = '/Users/2013mbp4gb128gb/Downloads/hypergenius12/excavator/js/main.js';
let main = fs.readFileSync(mainPath, 'utf8');

const wirePrestige = `
  document.getElementById('prestige-btn').addEventListener('click', () => {
    const shardsEarned = Math.floor(engine.gameState.depth / 1000);
    if (shardsEarned < 1) {
      alert("You need to reach at least 1000m to Format the Drive!");
      return;
    }
    if (confirm("Format the Drive? You will gain " + shardsEarned + " Quantum Shards, but lose all depth and upgrades!")) {
      engine.gameState.prestigeShards += shardsEarned;
      engine.gameState.depth = 0;
      engine.gameState.bandwidth = 400;
      engine.gameState.upgrades = {};
      saveState();
      location.reload();
    }
  });

  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  settingsBtn.addEventListener('click', () => {
    settingsModal.style.display = settingsModal.style.display === 'none' ? 'block' : 'none';
  });
  
  const bgm = document.getElementById('bgm');
  const bgmToggle = document.getElementById('setting-bgm');
  bgmToggle.addEventListener('change', () => {
    if (bgmToggle.checked) bgm.play().catch(e => console.log("Audio play failed"));
    else bgm.pause();
  });
  
  // Try to start BGM on first interaction
  document.body.addEventListener('click', () => {
    if (bgmToggle.checked && bgm.paused) {
      bgm.volume = 0.4;
      bgm.play().catch(e => console.log("Audio play failed"));
    }
  }, { once: true });
`;

main = main.replace("document.getElementById('reset-btn').addEventListener('click', () => {", wirePrestige + "\n  document.getElementById('reset-btn').addEventListener('click', () => {");

fs.writeFileSync(mainPath, main);
