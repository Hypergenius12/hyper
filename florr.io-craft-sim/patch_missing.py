import re

with open('script.js', 'r') as f:
    content = f.read()

missing_html = """    "monstera": {
        desc: "Passively heals the user and nearby players.",
        stats: {
            "common": { health: "75", reload: "2.5s", special: "Heal Rate: 1.4/s" },
            "unusual": { health: "225", reload: "2.5s", special: "Heal Rate: 4.2/s" },
            "rare": { health: "675", reload: "2.5s", special: "Heal Rate: 12.6/s" },
            "epic": { health: "2025", reload: "2.5s", special: "Heal Rate: 37.8/s" },
            "legendary": { health: "6075", reload: "2.5s", special: "Heal Rate: 113.4/s" },
            "mythic": { health: "18225", reload: "2.5s", special: "Heal Rate: 340.2/s" },
            "ultra": { health: "54675", reload: "2.5s", special: "Heal Rate: 1020.6/s" },
            "super": { health: "164025", reload: "2.5s", special: "Heal Rate: 3061.8/s" },
            "unique": { health: "492075", reload: "2.5s", special: "Heal Rate: 9185.4/s" },
        },
    },
    "totem": {
        desc: "A utility item that warps the player to a different biome.",
        stats: {
            "common": { special: "Warps player, grants 3s immunity." },
        },
    },
    "sacrifice": {
        desc: "A unique petal that triggers on death.",
        stats: {
            "common": { special: "On death, spawns a mob of the same rarity." },
        },
    },
    "sawblade": {
        desc: "Extremely high damage and health, but very short reach.",
        stats: {
            "common": { damage: "40", health: "25", reload: "2.5s" },
            "unusual": { damage: "120", health: "75", reload: "2.5s" },
            "rare": { damage: "360", health: "225", reload: "2.5s" },
            "epic": { damage: "1080", health: "675", reload: "2.5s" },
            "legendary": { damage: "3240", health: "2025", reload: "2.5s" },
            "mythic": { damage: "9720", health: "6075", reload: "2.5s" },
            "ultra": { damage: "29160", health: "18225", reload: "2.5s" },
            "super": { damage: "87480", health: "54675", reload: "2.5s" },
            "unique": { damage: "262440", health: "164025", reload: "2.5s" },
        },
    },
    "clay": {
        desc: "Utility item.",
        stats: {
            "common": { special: "Utility petal (no combat stats)." },
        },
    },
    "dust": {
        desc: "Behaves similarly to Sand and Light.",
        stats: {
            "common": { damage: "13", health: "5", reload: "0.8s", special: "Stuns mobs" },
            "unusual": { damage: "39", health: "15", reload: "0.8s", special: "Stuns mobs" },
            "rare": { damage: "117", health: "45", reload: "0.8s", special: "Stuns mobs" },
            "epic": { damage: "351", health: "135", reload: "0.8s", special: "Stuns mobs" },
            "legendary": { damage: "1053", health: "405", reload: "0.8s", special: "Stuns mobs" },
            "mythic": { damage: "3159", health: "1215", reload: "0.8s", special: "Stuns mobs" },
            "ultra": { damage: "9477", health: "3645", reload: "0.8s", special: "Stuns mobs" },
            "super": { damage: "28431", health: "10935", reload: "0.8s", special: "Stuns mobs" },
            "unique": { damage: "85293", health: "32805", reload: "0.8s", special: "Stuns mobs" },
        },
    },
    "broccoli": {
        desc: "Deals damage until depleted, then explodes into 3 projectiles.",
        stats: {
            "common": { damage: "15", health: "10", reload: "2.8s", special: "Explodes into 3 missiles" },
            "unusual": { damage: "45", health: "30", reload: "2.8s", special: "Explodes into 3 missiles" },
            "rare": { damage: "135", health: "90", reload: "2.8s", special: "Explodes into 3 missiles" },
            "epic": { damage: "405", health: "270", reload: "2.8s", special: "Explodes into 3 missiles" },
            "legendary": { damage: "1215", health: "810", reload: "2.8s", special: "Explodes into 3 missiles" },
            "mythic": { damage: "3645", health: "2430", reload: "2.8s", special: "Explodes into 3 missiles" },
            "ultra": { damage: "10935", health: "7290", reload: "2.8s", special: "Explodes into 3 missiles" },
            "super": { damage: "32805", health: "21870", reload: "2.8s", special: "Explodes into 3 missiles" },
            "unique": { damage: "98415", health: "65610", reload: "2.8s", special: "Explodes into 3 missiles" },
        },
    },
    "lentil": {
        desc: "Increases the attraction range of your other petals.",
        stats: {
            "common": { damage: "13", health: "12", reload: "2s", special: "Attraction: +8" },
            "unusual": { damage: "39", health: "36", reload: "2s", special: "Attraction: +16" },
            "rare": { damage: "117", health: "108", reload: "2s", special: "Attraction: +24" },
            "epic": { damage: "351", health: "324", reload: "2s", special: "Attraction: +32" },
            "legendary": { damage: "1053", health: "972", reload: "2s", special: "Attraction: +40" },
            "mythic": { damage: "3159", health: "2916", reload: "2s", special: "Attraction: +48" },
            "ultra": { damage: "9477", health: "8748", reload: "2s", special: "Attraction: +56" },
            "super": { damage: "28431", health: "26244", reload: "2s", special: "Attraction: +64" },
            "unique": { damage: "85293", health: "78732", reload: "2s", special: "Attraction: +72" },
        },
    },
    "dead_leaf": {
        desc: "Increases health of equipped petals, but increases reload time by 5%.",
        stats: {
            "common": { special: "+Petal Health, +5% Reload Time" },
        },
    },
    "goggles": {
        desc: "Allows you to see and damage Ghosts up to the rarity of the Goggles.",
        stats: {
            "common": { special: "Can see ghosts. -20% Vision" },
        },
    },
    "champion_crown": {
        desc: "Temporarily grants Super Basics to nearby players.",
        stats: {
            "unique": { special: "Grants Super Basics to up to 25 players" },
        },
    },
"""

content = content.replace('const PETAL_DATA = {', 'const PETAL_DATA = {\n' + missing_html)

with open('script.js', 'w') as f:
    f.write(content)
