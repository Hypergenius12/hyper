import re

with open('/Users/2013mbp4gb128gb/Downloads/hypergenius12/excavator/js/engine.js', 'r') as f:
    content = f.read()

# 1. Add prestigeShards to gameState
content = content.replace("currentBiomeIndex: 0,", "currentBiomeIndex: 0,\n      prestigeShards: 0,")

# 2. Add Audio SFX functions
audio_logic = """  initAudio() {
    if (this.audioCtx) return;
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio not supported");
    }
  }

  playSFX(type) {
    if (!this.audioCtx) return;
    const sfxToggle = document.getElementById('setting-sfx');
    if (sfxToggle && !sfxToggle.checked) return;

    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);
    const now = this.audioCtx.currentTime;
    
    if (type === 'mine') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(150 + Math.random() * 50, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
      gainNode.gain.setValueAtTime(0.05, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'crit') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300 + Math.random() * 100, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
      gainNode.gain.setValueAtTime(0.08, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'collapse') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.linearRampToValueAtTime(20, now + 0.4);
      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  }

  // ========== EVENTS =========="""
content = content.replace("  // ========== EVENTS ==========", audio_logic)

# 3. Apply multipliers in _tryMine
content = content.replace("const power = 1 + (this.gameState.upgrades.miningPower || 0);", "const prestigeMulti = 1 + (this.gameState.prestigeShards || 0) * 0.25;\n    const power = Math.max(1, Math.floor((1 + (this.gameState.upgrades.miningPower || 0)) * prestigeMulti));")

# 4. Add SFX for mining
mine_logic = """    if (isCrit) {
      block.hp -= power * 3;
      this.playSFX('crit');
    } else {
      block.hp -= power;
      this.playSFX('mine');
    }"""
content = content.replace("""    if (isCrit) {
      block.hp -= power * 3;
    } else {
      block.hp -= power;
    }""", mine_logic)

# 5. Bandwidth multiplier fix
bw_logic = """      const multi = 1 + (this.gameState.upgrades.bandwidthMulti || 0) * 0.5;
      const prestigeMulti = 1 + (this.gameState.prestigeShards || 0) * 0.25;
      let earned = Math.max(1, Math.floor(biome.bandwidthDrop * multi * prestigeMulti));"""
content = content.replace("""      const multi = 1 + (this.gameState.upgrades.bandwidthMulti || 0) * 0.5;
      let earned = Math.floor(biome.bandwidthDrop * multi);""", bw_logic)

# 6. AutoMiner multiplier fix
auto_logic = """      const speedLv = this.gameState.upgrades.autoSpeed || 0;
      const prestigeMulti = 1 + (this.gameState.prestigeShards || 0) * 0.25;
      let autoDmg = autoMiners * speedLv * 0.5 * prestigeMulti;
      autoDmg += (this.gameState.upgrades.miningPower || 0) * 0.1 * autoMiners * prestigeMulti;"""
content = content.replace("""      const speedLv = this.gameState.upgrades.autoSpeed || 0;
      let autoDmg = autoMiners * speedLv * 0.5;
      // Also apply click power to auto miners (10% of click damage per miner level)
      autoDmg += (this.gameState.upgrades.miningPower || 0) * 0.1 * autoMiners;""", auto_logic)

# 7. Add Collapse sound
collapse_logic = """    this.blocks.shift();
    this.activeRow++;
    this.playSFX('collapse');"""
content = content.replace("""    this.blocks.shift();
    this.activeRow++;""", collapse_logic)

# 8. Firewall logic in `_generateNextRow`
fw_logic = """      let hp = biome.blockHardness;
      let isFirewall = false;
      
      // If we are within 3 rows of the end of the biome
      if ((row - SKY_ROWS) >= (biome.depthEnd - 3)) {
        hp *= 5;
        isFirewall = true;
      }
      
      const block = {
        hp: hp,
        maxHp: hp,
        alive: true,
        isFirewall: isFirewall,
        style: biome.blockStyle || 'solid',
        color: biome.blockColors[Math.floor(Math.random() * biome.blockColors.length)],"""
content = re.sub(r'      const block = \{\s+hp: biome\.blockHardness,\s+maxHp: biome\.blockHardness,\s+alive: true,\s+style: biome\.blockStyle \|\| \'solid\',\s+color: biome\.blockColors\[Math\.floor\(Math\.random\(\) \* biome\.blockColors\.length\)\],', fw_logic, content)

with open('/Users/2013mbp4gb128gb/Downloads/hypergenius12/excavator/js/engine.js', 'w') as f:
    f.write(content)

