const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/textures.js', 'utf8');

const regex = /const MC_ITEM_MAP = \{([\s\S]*?)cooked_beef': 'cooked_beef'/;
const replacement = `const MC_ITEM_MAP = {
$1cooked_beef': 'cooked_beef',
    'sword_wood': 'wooden_sword',
    'sword_stone': 'stone_sword',
    'sword_iron': 'iron_sword',
    'sword_gold': 'golden_sword',
    'sword_diamond': 'diamond_sword',
    'pickaxe_wood': 'wooden_pickaxe',
    'pickaxe_stone': 'stone_pickaxe',
    'pickaxe_iron': 'iron_pickaxe',
    'pickaxe_gold': 'golden_pickaxe',
    'pickaxe_diamond': 'diamond_pickaxe',
    'axe_wood': 'wooden_axe',
    'axe_stone': 'stone_axe',
    'axe_iron': 'iron_axe',
    'axe_gold': 'golden_axe',
    'axe_diamond': 'diamond_axe',
    'helmet_iron': 'iron_helmet',
    'chest_iron': 'iron_chestplate',
    'legs_iron': 'iron_leggings',
    'boots_iron': 'iron_boots',
    'helmet_gold': 'golden_helmet',
    'chest_gold': 'golden_chestplate',
    'legs_gold': 'golden_leggings',
    'boots_gold': 'golden_boots',
    'helmet_diamond': 'diamond_helmet',
    'chest_diamond': 'diamond_chestplate',
    'legs_diamond': 'diamond_leggings',
    'boots_diamond': 'diamond_boots',
    'flint_and_steel': 'flint_and_steel'`;

code = code.replace(regex, replacement);
fs.writeFileSync('slopcraft 3D/js/textures.js', code);
