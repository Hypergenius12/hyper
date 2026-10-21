const RARITIES = {
    'common': { id: 0, color: '#7eef6d', next: 'unusual', chance: 0.64 },
    'unusual': { id: 1, color: '#ffe65d', next: 'rare', chance: 0.32 },
    'rare': { id: 2, color: '#4d52e3', next: 'epic', chance: 0.16 },
    'epic': { id: 3, color: '#861fde', next: 'legendary', chance: 0.08 },
    'legendary': { id: 4, color: '#de1f1f', next: 'mythic', chance: 0.04 },
    'mythic': { id: 5, color: '#1fdbde', next: 'ultra', chance: 0.02 },
    'ultra': { id: 6, color: '#ff2b75', next: 'super', chance: 0.01 },
    'super': { id: 7, color: '#2bffa3', next: 'eternal', chance: 0.001 },
    'eternal': { id: 8, color: '#ffffff', next: null, chance: 0 },
    'unique': { id: 9, color: '#aaaaaa', next: null, chance: 0 }
};

const KNOWN_PETALS = {
    "basic": 1,
    "light": 2,
    "rock": 3,
    "square": 4,
    "rose": 5,
    "stinger": 6,
    "iris": 7,
    "wing": 8,
    "missile": 9,
    "grapes": 10,
    "cactus": 11,
    "faster": 12,
    "bubble": 13,
    "pollen": 14,
    "dandelion": 15,
    "beetle_egg": 16,
    "antennae": 17,
    "heavy": 18,
    "yin_yang": 19,
    "web": 20,
    "honey": 21,
    "leaf": 22,
    "salt": 23,
    "rice": 24,
    "corn": 25,
    "sand": 26,
    "pincer": 27,
    "yucca": 28,
    "magnet": 29,
    "yggdrasil": 30,
    "starfish": 31,
    "pearl": 32,
    "lightning": 33,
    "jelly": 34,
    "claw": 35,
    "shell": 36,
    "cutter": 37,
    "dahlia": 38,
    "uranium": 39,
    "sponge": 40,
    "soil": 41,
    "fang": 42,
    "third_eye": 43,
    "peas": 44,
    "stick": 45,
    "clover": 46,
    "powder": 47,
    "air": 48,
    "basil": 49,
    "orange": 50,
    "ant_egg": 51,
    "poo": 52,
    "relic": 53,
    "lotus": 54,
    "bulb": 55,
    "cotton": 56,
    "carrot": 57,
    "bone": 58,
    "plank": 59,
    "tomato": 60,
    "mark": 61,
    "rubber": 62,
    "blood_stinger": 63,
    "bur": 64,
    "root": 65,
    "ankh": 66,
    "dice": 67,
    "talisman": 68,
    "battery": 69,
    "amulet": 70,
    "compass": 71,
    "disc": 72,
    "shovel": 73,
    "coin": 74,
    "chip": 75,
    "card": 76,
    "moon": 77,
    "privet": 78,
    "glass": 79,
    "corruption": 80,
    "orb": 81,
    "blueberries": 82,
    "magic_cotton": 83,
    "magic_stinger": 84,
    "magic_leaf": 85,
    "magic_cactus": 86,
    "magic_eye": 87,
    "magic_missile": 88,
    "magic_stick": 89,
    "coral": 90,
    "magic_bubble": 91,
    "nazar": 92,
    "mimic": 93,
    "mjolnir": 94,
    "mecha_missile": 95,
    "wax": 96,
    "golden_leaf": 97,
    "cog": 98,
    "monstera": 99,
    "mecha_antennae": 100,
    "laser": 101,
    "domino": 102,
    "bandage": 103,
    "pharaoh_crown": 104,
    "totem": 105,
    "triangle": 106,
    "electric_web": 107,
    "sacrifice": 108,
    "sawblade": 109,
    "clay": 110,
    "dust": 111,
    "broccoli": 112,
    "lentil": 113,
    "dead_leaf": 114,
    "splitter": 115,
    "goggles": 116,
    "bean": 117,
    "champion_crown": 118,
};

function getPetalId(name) {
    const lower = name.toLowerCase().trim();
    if (lower === "ygg") return KNOWN_PETALS["yggdrasil"];
    if (KNOWN_PETALS[lower]) return KNOWN_PETALS[lower];
    return null;
}

let inventory = []; // { rarity, id, name, count }
let craftingSlots = [null, null, null, null, null]; // { itemRef, count }
let currentMode = 'craft';
let forgeCosts = {};
let craftResultShowing = false;

const PETAL_DATA = {
    "monstera": {
        "desc": "Passively heals the user and nearby players.",
        "stats": {
            "common": {
                "health": "75",
                "reload": "2.5s",
                "special": "Heal Rate: 1.4/s"
            },
            "unusual": {
                "health": "225",
                "reload": "2.5s",
                "special": "Heal Rate: 4.2/s"
            },
            "rare": {
                "health": "675",
                "reload": "2.5s",
                "special": "Heal Rate: 12.6/s"
            },
            "epic": {
                "health": "2025",
                "reload": "2.5s",
                "special": "Heal Rate: 37.8/s"
            },
            "legendary": {
                "health": "6075",
                "reload": "2.5s",
                "special": "Heal Rate: 113.4/s"
            },
            "mythic": {
                "health": "18225",
                "reload": "2.5s",
                "special": "Heal Rate: 340.2/s"
            },
            "ultra": {
                "health": "54675",
                "reload": "2.5s",
                "special": "Heal Rate: 1020.6/s"
            },
            "super": {
                "health": "164025",
                "reload": "2.5s",
                "special": "Heal Rate: 3061.8/s"
            },
            "unique": {
                "health": "492075",
                "reload": "2.5s",
                "special": "Heal Rate: 9185.4/s"
            },
            "eternal": {
                "health": "492075",
                "reload": "2.5s",
                "special": "Heal Rate: 9185.4/s"
            }
        }
    },
    "totem": {
        "desc": "A utility item that warps the player to a different biome.",
        "stats": {
            "common": {
                "special": "3s Immunity"
            }
        }
    },
    "sacrifice": {
        "desc": "A unique petal that triggers on death.",
        "stats": {
            "common": {
                "special": "On death, spawns a mob of the same rarity."
            }
        }
    },
    "sawblade": {
        "desc": "Extremely high damage and health, but very short reach.",
        "stats": {
            "common": {
                "damage": "40",
                "health": "25",
                "reload": "2.5s"
            },
            "unusual": {
                "damage": "120",
                "health": "75",
                "reload": "2.5s"
            },
            "rare": {
                "damage": "360",
                "health": "225",
                "reload": "2.5s"
            },
            "epic": {
                "damage": "1080",
                "health": "675",
                "reload": "2.5s"
            },
            "legendary": {
                "damage": "3240",
                "health": "2025",
                "reload": "2.5s"
            },
            "mythic": {
                "damage": "9720",
                "health": "6075",
                "reload": "2.5s"
            },
            "ultra": {
                "damage": "29160",
                "health": "18225",
                "reload": "2.5s"
            },
            "super": {
                "damage": "87480",
                "health": "54675",
                "reload": "2.5s"
            },
            "unique": {
                "damage": "262440",
                "health": "164025",
                "reload": "2.5s"
            },
            "eternal": {
                "damage": "262440",
                "health": "164025",
                "reload": "2.5s"
            }
        }
    },
    "clay": {
        "desc": "Utility item.",
        "stats": {
            "common": {
                "special": "Utility petal (no combat stats)."
            }
        }
    },
    "dust": {
        "desc": "Behaves similarly to Sand and Light.",
        "stats": {
            "common": {
                "damage": "13",
                "health": "5",
                "reload": "0.8s",
                "special": "Stuns mobs"
            },
            "unusual": {
                "damage": "39",
                "health": "15",
                "reload": "0.8s",
                "special": "Stuns mobs"
            },
            "rare": {
                "damage": "117",
                "health": "45",
                "reload": "0.8s",
                "special": "Stuns mobs"
            },
            "epic": {
                "damage": "351",
                "health": "135",
                "reload": "0.8s",
                "special": "Stuns mobs"
            },
            "legendary": {
                "damage": "1053",
                "health": "405",
                "reload": "0.8s",
                "special": "Stuns mobs"
            },
            "mythic": {
                "damage": "3159",
                "health": "1215",
                "reload": "0.8s",
                "special": "Stuns mobs"
            },
            "ultra": {
                "damage": "9477",
                "health": "3645",
                "reload": "0.8s",
                "special": "Stuns mobs"
            },
            "super": {
                "damage": "28431",
                "health": "10935",
                "reload": "0.8s",
                "special": "Stuns mobs"
            },
            "unique": {
                "damage": "85293",
                "health": "32805",
                "reload": "0.8s",
                "special": "Stuns mobs"
            },
            "eternal": {
                "damage": "85293",
                "health": "32805",
                "reload": "0.8s",
                "special": "Stuns mobs"
            }
        }
    },
    "broccoli": {
        "desc": "Deals damage until depleted, then explodes into 3 projectiles.",
        "stats": {
            "common": {
                "damage": "15",
                "health": "10",
                "reload": "2.8s",
                "special": "Explodes into 3 missiles"
            },
            "unusual": {
                "damage": "45",
                "health": "30",
                "reload": "2.8s",
                "special": "Explodes into 3 missiles"
            },
            "rare": {
                "damage": "135",
                "health": "90",
                "reload": "2.8s",
                "special": "Explodes into 3 missiles"
            },
            "epic": {
                "damage": "405",
                "health": "270",
                "reload": "2.8s",
                "special": "Explodes into 3 missiles"
            },
            "legendary": {
                "damage": "1215",
                "health": "810",
                "reload": "2.8s",
                "special": "Explodes into 3 missiles"
            },
            "mythic": {
                "damage": "3645",
                "health": "2430",
                "reload": "2.8s",
                "special": "Explodes into 3 missiles"
            },
            "ultra": {
                "damage": "10935",
                "health": "7290",
                "reload": "2.8s",
                "special": "Explodes into 3 missiles"
            },
            "super": {
                "damage": "32805",
                "health": "21870",
                "reload": "2.8s",
                "special": "Explodes into 3 missiles"
            },
            "unique": {
                "damage": "98415",
                "health": "65610",
                "reload": "2.8s",
                "special": "Explodes into 3 missiles"
            },
            "eternal": {
                "damage": "98415",
                "health": "65610",
                "reload": "2.8s",
                "special": "Explodes into 3 missiles"
            }
        }
    },
    "lentil": {
        "desc": "Increases the attraction range of your other petals.",
        "stats": {
            "common": {
                "damage": "13",
                "health": "12",
                "reload": "2s",
                "special": "Attraction: +8"
            },
            "unusual": {
                "damage": "39",
                "health": "36",
                "reload": "2s",
                "special": "Attraction: +16"
            },
            "rare": {
                "damage": "117",
                "health": "108",
                "reload": "2s",
                "special": "Attraction: +24"
            },
            "epic": {
                "damage": "351",
                "health": "324",
                "reload": "2s",
                "special": "Attraction: +32"
            },
            "legendary": {
                "damage": "1053",
                "health": "972",
                "reload": "2s",
                "special": "Attraction: +40"
            },
            "mythic": {
                "damage": "3159",
                "health": "2916",
                "reload": "2s",
                "special": "Attraction: +48"
            },
            "ultra": {
                "damage": "9477",
                "health": "8748",
                "reload": "2s",
                "special": "Attraction: +56"
            },
            "super": {
                "damage": "28431",
                "health": "26244",
                "reload": "2s",
                "special": "Attraction: +64"
            },
            "unique": {
                "damage": "85293",
                "health": "78732",
                "reload": "2s",
                "special": "Attraction: +72"
            },
            "eternal": {
                "damage": "85293",
                "health": "78732",
                "reload": "2s",
                "special": "Attraction: +72"
            }
        }
    },
    "dead_leaf": {
        "desc": "Increases health of equipped petals, but increases reload time by 5%.",
        "stats": {
            "common": {
                "special": "+5% Reload Time"
            }
        }
    },
    "goggles": {
        "desc": "Allows you to see and damage Ghosts up to the rarity of the Goggles.",
        "stats": {
            "common": {
                "special": "-20% Vision"
            }
        }
    },
    "champion_crown": {
        "desc": "Temporarily grants Super Basics to nearby players.",
        "stats": {
            "unique": {
                "special": "Grants Super Basics to up to 25 players"
            },
            "eternal": {
                "special": "Grants Super Basics to up to 25 players"
            }
        }
    },
    "wax": {
        "desc": "A defensive petal that drops a large block to physically obstruct mobs.",
        "stats": {
            "common": {
                "health": "1000",
                "reload": "30s"
            },
            "unusual": {
                "health": "3000",
                "reload": "30s"
            },
            "rare": {
                "health": "9000",
                "reload": "30s"
            },
            "epic": {
                "health": "27000",
                "reload": "30s"
            },
            "legendary": {
                "health": "81000",
                "reload": "30s"
            },
            "mythic": {
                "health": "243000",
                "reload": "30s"
            },
            "ultra": {
                "health": "729000",
                "reload": "30s"
            },
            "super": {
                "health": "2187000",
                "reload": "30s"
            },
            "unique": {
                "health": "6561000",
                "reload": "30s"
            },
            "eternal": {
                "health": "6561000",
                "reload": "30s"
            }
        }
    },
    "bean": {
        "desc": "Deals 1.5x damage when no allied flowers (players) are nearby.",
        "stats": {
            "common": {
                "damage": "10",
                "health": "12",
                "reload": "2s"
            },
            "unusual": {
                "damage": "30",
                "health": "36",
                "reload": "2s"
            },
            "rare": {
                "damage": "90",
                "health": "108",
                "reload": "2s"
            },
            "epic": {
                "damage": "270",
                "health": "324",
                "reload": "2s"
            },
            "legendary": {
                "damage": "810",
                "health": "972",
                "reload": "2s"
            },
            "mythic": {
                "damage": "2430",
                "health": "2916",
                "reload": "2s"
            },
            "ultra": {
                "damage": "7290",
                "health": "8748",
                "reload": "2s"
            },
            "super": {
                "damage": "21870",
                "health": "26244",
                "reload": "2s"
            },
            "unique": {
                "damage": "65610",
                "health": "78732",
                "reload": "2s"
            },
            "eternal": {
                "damage": "65610",
                "health": "78732",
                "reload": "2s"
            }
        }
    },
    "air": {
        "desc": "It's literally nothing.",
        "stats": {
            "common": {
                "special": "Extra Radius: 8"
            },
            "unusual": {
                "special": "Extra Radius: 16"
            },
            "rare": {
                "special": "Extra Radius: 24"
            },
            "epic": {
                "special": "Extra Radius: 32"
            },
            "legendary": {
                "special": "Extra Radius: 40"
            },
            "mythic": {
                "special": "Extra Radius: 48"
            },
            "ultra": {
                "special": "Extra Radius: 56"
            },
            "super": {
                "special": "Extra Radius: 64"
            },
            "unique": {
                "special": "Extra Radius: 72"
            },
            "eternal": {
                "special": "Extra Radius: 72"
            }
        }
    },
    "amulet": {
        "desc": "Converts a percentage of overheal into shields.",
        "stats": {
            "common": {
                "damage": "0",
                "health": "10",
                "reload": "2s",
                "special": "Overheal Conversion: 5%"
            },
            "unusual": {
                "damage": "0",
                "health": "30",
                "reload": "2s",
                "special": "Overheal Conversion: 10%"
            },
            "rare": {
                "damage": "0",
                "health": "90",
                "reload": "2s",
                "special": "Overheal Conversion: 15%"
            },
            "epic": {
                "damage": "0",
                "health": "270",
                "reload": "2s",
                "special": "Overheal Conversion: 20%"
            },
            "legendary": {
                "damage": "0",
                "health": "810",
                "reload": "2s",
                "special": "Overheal Conversion: 25%"
            },
            "mythic": {
                "damage": "0",
                "health": "2430",
                "reload": "2s",
                "special": "Overheal Conversion: 30%"
            },
            "ultra": {
                "damage": "0",
                "health": "7290",
                "reload": "2s",
                "special": "Overheal Conversion: 35%"
            },
            "super": {
                "damage": "0",
                "health": "21870",
                "reload": "2s",
                "special": "Overheal Conversion: 40%"
            },
            "unique": {
                "damage": "0",
                "health": "65610",
                "reload": "2s",
                "special": "Overheal Conversion: 45%"
            },
            "eternal": {
                "damage": "0",
                "health": "65610",
                "reload": "2s",
                "special": "Overheal Conversion: 45%"
            }
        }
    },
    "ankh": {
        "desc": "Upon being destroyed, teleports the flower back to where it was.",
        "stats": {
            "common": {
                "damage": "0",
                "health": "10",
                "reload": "0s",
                "usage_reload": "0.5s"
            },
            "unusual": {
                "damage": "0",
                "health": "30",
                "reload": "0s",
                "usage_reload": "0.5s"
            },
            "rare": {
                "damage": "0",
                "health": "90",
                "reload": "0s",
                "usage_reload": "0.5s"
            },
            "epic": {
                "damage": "0",
                "health": "270",
                "reload": "0s",
                "usage_reload": "0.5s"
            },
            "legendary": {
                "damage": "0",
                "health": "810",
                "reload": "0s",
                "usage_reload": "0.5s"
            },
            "mythic": {
                "damage": "0",
                "health": "2430",
                "reload": "0s",
                "usage_reload": "0.5s"
            },
            "ultra": {
                "damage": "0",
                "health": "7290",
                "reload": "0s",
                "usage_reload": "0.5s"
            },
            "super": {
                "damage": "0",
                "health": "21870",
                "reload": "0s",
                "usage_reload": "0.5s"
            },
            "unique": {
                "damage": "0",
                "health": "65610",
                "reload": "0s",
                "usage_reload": "0.5s"
            },
            "eternal": {
                "damage": "0",
                "health": "65610",
                "reload": "0s",
                "usage_reload": "0.5s"
            }
        }
    },
    "ant_egg": {
        "desc": "Something interesting might pop out of this.",
        "stats": {
            "common": {
                "damage": "0",
                "health": "25",
                "reload": "30s",
                "special": "Contents: x4 Soldier Ant (Common)"
            },
            "unusual": {
                "damage": "0",
                "health": "75",
                "reload": "38s",
                "special": "Contents: x4 Soldier Ant (Unusual)"
            },
            "rare": {
                "damage": "0",
                "health": "225",
                "reload": "2.4m",
                "special": "Contents: x4 Soldier Ant (Rare)"
            },
            "epic": {
                "damage": "0",
                "health": "675",
                "reload": "3.3m",
                "special": "Contents: x4 Soldier Ant (Epic)"
            },
            "legendary": {
                "damage": "0",
                "health": "2025",
                "reload": "5.1m",
                "special": "Contents: x4 Soldier Ant (Legendary)"
            },
            "mythic": {
                "damage": "0",
                "health": "6075",
                "reload": "15.8m",
                "special": "Contents: x4 Soldier Ant (Mythic)"
            },
            "ultra": {
                "damage": "0",
                "health": "18225",
                "reload": "33.6m",
                "special": "Contents: x4 Soldier Ant (Ultra)"
            },
            "super": {
                "damage": "0",
                "health": "54675",
                "reload": "140.2m",
                "special": "Contents: x4 Soldier Ant (Super)"
            },
            "unique": {
                "damage": "0",
                "health": "164025",
                "reload": "13.8h",
                "special": "Contents: x4 Soldier Ant (Unique)"
            },
            "eternal": {
                "damage": "0",
                "health": "164025",
                "reload": "13.8h",
                "special": "Contents: x4 Soldier Ant (Unique)"
            }
        }
    },
    "antennae": {
        "desc": "Allows your flower to sense foes farther away.",
        "stats": {
            "common": {
                "special": "Extra Vision: 11.1%"
            },
            "unusual": {
                "special": "Extra Vision: 17.6%"
            },
            "rare": {
                "special": "Extra Vision: 25.0%"
            },
            "epic": {
                "special": "Extra Vision: 33.3%"
            },
            "legendary": {
                "special": "Extra Vision: 42.9%"
            },
            "mythic": {
                "special": "Extra Vision: 100.0%"
            },
            "ultra": {
                "special": "Extra Vision: 185.7%"
            },
            "super": {
                "special": "Extra Vision: 400.0%"
            },
            "unique": {
                "special": "Extra Vision: 900.0%"
            },
            "eternal": {
                "special": "Extra Vision: 900.0%"
            }
        }
    },
    "bandage": {
        "desc": "Turns the flower Undead for a limited time on death.",
        "stats": {
            "common": {
                "special": "Resurrection Duration (s): 1"
            },
            "unusual": {
                "special": "Resurrection Duration (s): 1.4"
            },
            "rare": {
                "special": "Resurrection Duration (s): 2.0"
            },
            "epic": {
                "special": "Resurrection Duration (s): 2.7"
            },
            "legendary": {
                "special": "Resurrection Duration (s): 3.8"
            },
            "mythic": {
                "special": "Resurrection Duration (s): 5.4"
            },
            "ultra": {
                "special": "Resurrection Duration (s): 7.5"
            },
            "super": {
                "special": "Resurrection Duration (s): 10.5"
            },
            "unique": {
                "special": "Resurrection Duration (s): 14.8"
            },
            "eternal": {
                "special": "Resurrection Duration (s): 14.8"
            }
        }
    },
    "basic": {
        "desc": "A nice petal, not too strong but not too weak.",
        "stats": {
            "common": {
                "damage": "10",
                "health": "10",
                "reload": "2.5s"
            },
            "unusual": {
                "damage": "30",
                "health": "30",
                "reload": "2.5s"
            },
            "rare": {
                "damage": "90",
                "health": "90",
                "reload": "2.5s"
            },
            "epic": {
                "damage": "270",
                "health": "270",
                "reload": "2.5s"
            },
            "legendary": {
                "damage": "810",
                "health": "810",
                "reload": "2.5s"
            },
            "mythic": {
                "damage": "2430",
                "health": "2430",
                "reload": "2.5s"
            },
            "ultra": {
                "damage": "7290",
                "health": "7290",
                "reload": "2.5s"
            },
            "super": {
                "damage": "21870",
                "health": "21870",
                "reload": "2.5s"
            },
            "unique": {
                "damage": "65610",
                "health": "65610",
                "reload": "2.5s"
            },
            "eternal": {
                "damage": "65610",
                "health": "65610",
                "reload": "2.5s"
            }
        }
    },
    "basil": {
        "desc": "Increases all healing received.",
        "stats": {
            "common": {
                "reload": "1s",
                "special": "Healing Bonus: 20%"
            },
            "unusual": {
                "reload": "1s",
                "special": "Healing Bonus: 25%"
            },
            "rare": {
                "reload": "1s",
                "special": "Healing Bonus: 30%"
            },
            "epic": {
                "reload": "1s",
                "special": "Healing Bonus: 35%"
            },
            "legendary": {
                "reload": "1s",
                "special": "Healing Bonus: 40%"
            },
            "mythic": {
                "reload": "1s",
                "special": "Healing Bonus: 45%"
            },
            "ultra": {
                "reload": "1s",
                "special": "Healing Bonus: 50%"
            },
            "super": {
                "reload": "1s",
                "special": "Healing Bonus: 55%"
            },
            "unique": {
                "reload": "1s",
                "special": "Healing Bonus: 60%"
            },
            "eternal": {
                "reload": "1s",
                "special": "Healing Bonus: 60%"
            }
        }
    },
    "battery": {
        "desc": "Discharges electricity whenever the flower gets hit.",
        "stats": {
            "common": {
                "reload": "2.5s",
                "special": "Lightning: 12",
                "special2": "Bounces: 2",
                "special3": "Charges: 3"
            },
            "unusual": {
                "reload": "2.5s",
                "special": "Lightning: 36",
                "special2": "Bounces: 3",
                "special3": "Charges: 3"
            },
            "rare": {
                "reload": "2.5s",
                "special": "Lightning: 108",
                "special2": "Bounces: 4",
                "special3": "Charges: 3"
            },
            "epic": {
                "reload": "2.5s",
                "special": "Lightning: 324",
                "special2": "Bounces: 5",
                "special3": "Charges: 3"
            },
            "legendary": {
                "reload": "2.5s",
                "special": "Lightning: 972",
                "special2": "Bounces: 6",
                "special3": "Charges: 3"
            },
            "mythic": {
                "reload": "2.5s",
                "special": "Lightning: 2916",
                "special2": "Bounces: 7",
                "special3": "Charges: 3"
            },
            "ultra": {
                "reload": "2.5s",
                "special": "Lightning: 8748",
                "special2": "Bounces: 8",
                "special3": "Charges: 3"
            },
            "super": {
                "reload": "2.5s",
                "special": "Lightning: 26244",
                "special2": "Bounces: 9",
                "special3": "Charges: 3"
            },
            "unique": {
                "reload": "2.5s",
                "special": "Lightning: 78732",
                "special2": "Bounces: 10",
                "special3": "Charges: 3"
            },
            "eternal": {
                "reload": "2.5s",
                "special": "Lightning: 78732",
                "special2": "Bounces: 10",
                "special3": "Charges: 3"
            }
        }
    },
    "beetle_egg": {
        "desc": "Something interesting might pop out of this.",
        "stats": {
            "common": {
                "damage": "0",
                "health": "1",
                "reload": "17s",
                "special": "Contents: Beetle (Common)"
            },
            "unusual": {
                "damage": "0",
                "health": "1",
                "reload": "21.8s",
                "special": "Contents: Beetle (Unusual)"
            },
            "rare": {
                "damage": "0",
                "health": "1",
                "reload": "26.5s",
                "special": "Contents: Beetle (Rare)"
            },
            "epic": {
                "damage": "0",
                "health": "1",
                "reload": "36s",
                "special": "Contents: Beetle (Epic)"
            },
            "legendary": {
                "damage": "0",
                "health": "1",
                "reload": "2.2m",
                "special": "Contents: Beetle (Legendary)"
            },
            "mythic": {
                "damage": "0",
                "health": "1",
                "reload": "8.6m",
                "special": "Contents: Beetle (Mythic)"
            },
            "ultra": {
                "damage": "0",
                "health": "1",
                "reload": "19.1m",
                "special": "Contents: Beetle (Ultra)"
            },
            "super": {
                "damage": "0",
                "health": "1",
                "reload": "82.4m",
                "special": "Contents: Beetle (Super)"
            },
            "unique": {
                "damage": "0",
                "health": "1",
                "reload": "7.4h",
                "special": "Contents: Beetle (Unique)"
            },
            "eternal": {
                "damage": "0",
                "health": "1",
                "reload": "7.4h",
                "special": "Contents: Beetle (Unique)"
            }
        }
    },
    "blood_stinger": {
        "desc": "It really hurts, but it's very fragile.<br>Deals damage to self when spawned.",
        "stats": {
            "common": {
                "damage": "100",
                "health": "2",
                "reload": "7.5s",
                "special": "Self Damage: 5"
            },
            "unusual": {
                "damage": "300",
                "health": "6",
                "reload": "7.5s",
                "special": "Self Damage: 15"
            },
            "rare": {
                "damage": "900",
                "health": "18",
                "reload": "7.5s",
                "special": "Self Damage: 45"
            },
            "epic": {
                "damage": "2700",
                "health": "54",
                "reload": "7.5s",
                "special": "Self Damage: 135"
            },
            "legendary": {
                "damage": "8100",
                "health": "162",
                "reload": "7.5s",
                "special": "Self Damage: 405"
            },
            "mythic": {
                "damage": "8100",
                "health": "162",
                "reload": "7.5s",
                "special": "Self Damage: 405"
            },
            "ultra": {
                "damage": "14580",
                "health": "292",
                "reload": "7.5s",
                "special": "Self Damage: 421"
            },
            "super": {
                "damage": "43740",
                "health": "875",
                "reload": "7.5s",
                "special": "Self Damage: 729"
            },
            "unique": {
                "damage": "131220",
                "health": "2624",
                "reload": "7.5s",
                "special": "Self Damage: 1263"
            },
            "eternal": {
                "damage": "131220",
                "health": "2624",
                "reload": "7.5s",
                "special": "Self Damage: 1263"
            }
        }
    },
    "blueberries": {
        "desc": "It goes poof. Now with the extra secret ingredient: lightning.",
        "stats": {
            "common": {
                "damage": "0",
                "health": "5",
                "reload": "1.5s",
                "special": "Lightning: 30"
            },
            "unusual": {
                "damage": "0",
                "health": "15",
                "reload": "3s",
                "special": "Lightning: 90"
            },
            "rare": {
                "damage": "0",
                "health": "45",
                "reload": "6s",
                "special": "Lightning: 270"
            },
            "epic": {
                "damage": "0",
                "health": "135",
                "reload": "12s",
                "special": "Lightning: 810"
            },
            "legendary": {
                "damage": "0",
                "health": "405",
                "reload": "24s",
                "special": "Lightning: 2430"
            },
            "mythic": {
                "damage": "0",
                "health": "1215",
                "reload": "48s",
                "special": "Lightning: 7290"
            },
            "ultra": {
                "damage": "0",
                "health": "3645",
                "reload": "96s",
                "special": "Lightning: 21870"
            },
            "super": {
                "damage": "0",
                "health": "10935",
                "reload": "192s",
                "special": "Lightning: 65610"
            },
            "unique": {
                "damage": "0",
                "health": "32805",
                "reload": "384s",
                "special": "Lightning: 196830"
            },
            "eternal": {
                "damage": "0",
                "health": "32805",
                "reload": "384s",
                "special": "Lightning: 196830"
            }
        }
    },
    "bone": {
        "desc": "Sturdy. Loses half of its armor each hit.",
        "stats": {
            "common": {
                "damage": "15",
                "health": "10",
                "reload": "2.5s",
                "special": "Armor: 3"
            },
            "unusual": {
                "damage": "45",
                "health": "30",
                "reload": "2.5s",
                "special": "Armor: 9"
            },
            "rare": {
                "damage": "135",
                "health": "90",
                "reload": "2.5s",
                "special": "Armor: 27"
            },
            "epic": {
                "damage": "405",
                "health": "270",
                "reload": "2.5s",
                "special": "Armor: 81"
            },
            "legendary": {
                "damage": "1215",
                "health": "810",
                "reload": "2.5s",
                "special": "Armor: 243"
            },
            "mythic": {
                "damage": "3645",
                "health": "2430",
                "reload": "2.5s",
                "special": "Armor: 729"
            },
            "ultra": {
                "damage": "10935",
                "health": "7290",
                "reload": "2.5s",
                "special": "Armor: 2187"
            },
            "super": {
                "damage": "32805",
                "health": "21870",
                "reload": "2.5s",
                "special": "Armor: 6561"
            },
            "unique": {
                "damage": "98415",
                "health": "65610",
                "reload": "2.5s",
                "special": "Armor: 19683"
            },
            "eternal": {
                "damage": "98415",
                "health": "65610",
                "reload": "2.5s",
                "special": "Armor: 19683"
            }
        }
    },
    "bubble": {
        "desc": "Physics are for the weak.",
        "stats": {
            "common": {
                "damage": "0",
                "health": "1",
                "reload": "2s",
                "usage_reload": "0.7s"
            },
            "unusual": {
                "damage": "0",
                "health": "1",
                "reload": "1.8s",
                "usage_reload": "0.6s"
            },
            "rare": {
                "damage": "0",
                "health": "1",
                "reload": "1.5s",
                "usage_reload": "0.5s"
            },
            "epic": {
                "damage": "0",
                "health": "1",
                "reload": "1.2s",
                "usage_reload": "0.4s"
            },
            "legendary": {
                "damage": "0",
                "health": "1",
                "reload": "1s",
                "usage_reload": "0.3s"
            },
            "mythic": {
                "damage": "0",
                "health": "1",
                "reload": "0.8s",
                "usage_reload": "0.2s"
            },
            "ultra": {
                "damage": "0",
                "health": "1",
                "reload": "0.5s",
                "usage_reload": "0.1s"
            },
            "super": {
                "damage": "0",
                "health": "1",
                "reload": "0.2s",
                "usage_reload": "0.1s"
            },
            "unique": {
                "damage": "0",
                "health": "1",
                "reload": "0.1s",
                "usage_reload": "0s"
            },
            "eternal": {
                "damage": "0",
                "health": "1",
                "reload": "0.1s",
                "usage_reload": "0s"
            }
        }
    },
    "bulb": {
        "desc": "A shiny lightbulb. Draws aggro from mobs.",
        "stats": {
            "common": {
                "damage": "5",
                "health": "10",
                "reload": "1s",
                "special": "Aggro Radius: 300"
            },
            "unusual": {
                "damage": "15",
                "health": "30",
                "reload": "1s",
                "special": "Aggro Radius: 600"
            },
            "rare": {
                "damage": "45",
                "health": "90",
                "reload": "1s",
                "special": "Aggro Radius: 900"
            },
            "epic": {
                "damage": "135",
                "health": "270",
                "reload": "1s",
                "special": "Aggro Radius: 1200"
            },
            "legendary": {
                "damage": "405",
                "health": "810",
                "reload": "1s",
                "special": "Aggro Radius: 1500"
            },
            "mythic": {
                "damage": "1215",
                "health": "2430",
                "reload": "1s",
                "special": "Aggro Radius: 1800"
            },
            "ultra": {
                "damage": "3645",
                "health": "7290",
                "reload": "1s",
                "special": "Aggro Radius: 2100"
            },
            "super": {
                "damage": "10935",
                "health": "21870",
                "reload": "1s",
                "special": "Aggro Radius: 2400"
            },
            "unique": {
                "damage": "32805",
                "health": "65610",
                "reload": "1s",
                "special": "Aggro Radius: 2700"
            },
            "eternal": {
                "damage": "32805",
                "health": "65610",
                "reload": "1s",
                "special": "Aggro Radius: 2700"
            }
        }
    },
    "bur": {
        "desc": "Decreases armor of affected unit. Does not stack with itself.",
        "stats": {
            "common": {
                "damage": "5",
                "health": "5",
                "reload": "2s",
                "special": "Armor Debuff: 1.5",
                "special2": "Duration: 3"
            },
            "unusual": {
                "damage": "15",
                "health": "15",
                "reload": "2s",
                "special": "Armor Debuff: 4.5",
                "special2": "Duration: 3"
            },
            "rare": {
                "damage": "45",
                "health": "45",
                "reload": "2s",
                "special": "Armor Debuff: 13.5",
                "special2": "Duration: 3"
            },
            "epic": {
                "damage": "135",
                "health": "135",
                "reload": "2s",
                "special": "Armor Debuff: 40.5",
                "special2": "Duration: 3"
            },
            "legendary": {
                "damage": "405",
                "health": "405",
                "reload": "2s",
                "special": "Armor Debuff: 121.5",
                "special2": "Duration: 3"
            },
            "mythic": {
                "damage": "1215",
                "health": "1215",
                "reload": "2s",
                "special": "Armor Debuff: 364.5",
                "special2": "Duration: 3"
            },
            "ultra": {
                "damage": "3645",
                "health": "3645",
                "reload": "2s",
                "special": "Armor Debuff: 1093.5",
                "special2": "Duration: 3"
            },
            "super": {
                "damage": "10935",
                "health": "10935",
                "reload": "2s",
                "special": "Armor Debuff: 3280.5",
                "special2": "Duration: 3"
            },
            "unique": {
                "damage": "32805",
                "health": "32805",
                "reload": "2s",
                "special": "Armor Debuff: 9841.5",
                "special2": "Duration: 3"
            },
            "eternal": {
                "damage": "32805",
                "health": "32805",
                "reload": "2s",
                "special": "Armor Debuff: 9841.5",
                "special2": "Duration: 3"
            }
        }
    },
    "cactus": {
        "desc": "Not very strong, but somehow increases your maximum health.",
        "stats": {
            "common": {
                "damage": "5",
                "health": "15",
                "reload": "1s",
                "special": "Flower Health: 30"
            },
            "unusual": {
                "damage": "15",
                "health": "45",
                "reload": "1s",
                "special": "Flower Health: 90"
            },
            "rare": {
                "damage": "45",
                "health": "135",
                "reload": "1s",
                "special": "Flower Health: 270"
            },
            "epic": {
                "damage": "135",
                "health": "405",
                "reload": "1s",
                "special": "Flower Health: 810"
            },
            "legendary": {
                "damage": "405",
                "health": "1215",
                "reload": "1s",
                "special": "Flower Health: 2430"
            },
            "mythic": {
                "damage": "1215",
                "health": "3645",
                "reload": "1s",
                "special": "Flower Health: 7290"
            },
            "ultra": {
                "damage": "3645",
                "health": "10935",
                "reload": "1s",
                "special": "Flower Health: 21870"
            },
            "super": {
                "damage": "10935",
                "health": "32805",
                "reload": "1s",
                "special": "Flower Health: 65610"
            },
            "unique": {
                "damage": "32805",
                "health": "98415",
                "reload": "1s",
                "special": "Flower Health: 196830"
            },
            "eternal": {
                "damage": "32805",
                "health": "98415",
                "reload": "1s",
                "special": "Flower Health: 196830"
            }
        }
    },
    "card": {
        "desc": "A playing card. Likely marked.",
        "stats": {
            "common": {
                "damage": "5/10/15/20",
                "health": "30/25/20/15",
                "reload": "2.5s"
            },
            "unusual": {
                "damage": "15/30/45/60",
                "health": "90/75/60/45",
                "reload": "2.5s"
            },
            "rare": {
                "damage": "45/90/135/180",
                "health": "270/225/180/135",
                "reload": "2.5s"
            },
            "epic": {
                "damage": "135/270/405/540",
                "health": "810/675/540/405",
                "reload": "2.5s"
            },
            "legendary": {
                "damage": "405/810/1215/1620",
                "health": "2430/2025/1620/1215",
                "reload": "2.5s"
            },
            "mythic": {
                "damage": "1215/2430/3645/4860",
                "health": "7290/6075/4860/3645",
                "reload": "2.5s"
            },
            "ultra": {
                "damage": "3645/7290/10935/14580",
                "health": "21870/18225/14580/10935",
                "reload": "2.5s"
            },
            "super": {
                "damage": "10935/21870/32805/43740",
                "health": "65610/54675/43740/32805",
                "reload": "2.5s"
            },
            "unique": {
                "damage": "32805/65610/98415/131220",
                "health": "196830/164025/131220/98415",
                "reload": "2.5s"
            },
            "eternal": {
                "damage": "32805/65610/98415/131220",
                "health": "196830/164025/131220/98415",
                "reload": "2.5s"
            }
        }
    },
    "carrot": {
        "desc": "Sturdy and reliable. Can be shot and bounces off walls.",
        "stats": {
            "common": {
                "damage": "10",
                "health": "10",
                "reload": "2.5s"
            },
            "unusual": {
                "damage": "30",
                "health": "30",
                "reload": "2.5s"
            },
            "rare": {
                "damage": "90",
                "health": "90",
                "reload": "2.5s"
            },
            "epic": {
                "damage": "270",
                "health": "270",
                "reload": "2.5s"
            },
            "legendary": {
                "damage": "810",
                "health": "810",
                "reload": "2.5s"
            },
            "mythic": {
                "damage": "2430",
                "health": "2430",
                "reload": "2.5s"
            },
            "ultra": {
                "damage": "7290",
                "health": "7290",
                "reload": "2.5s"
            },
            "super": {
                "damage": "21870",
                "health": "21870",
                "reload": "2.5s"
            },
            "unique": {
                "damage": "65610",
                "health": "65610",
                "reload": "2.5s"
            },
            "eternal": {
                "damage": "65610",
                "health": "65610",
                "reload": "2.5s"
            }
        }
    },
    "chip": {
        "desc": "ALL IN.<br>Petal has a 90% chance of evading incoming damage.",
        "stats": {
            "common": {
                "damage": "5",
                "health": "1",
                "reload": "2.5s",
                "special": "Petal Evasion: 90%"
            },
            "unusual": {
                "damage": "15",
                "health": "3",
                "reload": "2.5s",
                "special": "Petal Evasion: 90%"
            },
            "rare": {
                "damage": "45",
                "health": "9",
                "reload": "2.5s",
                "special": "Petal Evasion: 90%"
            },
            "epic": {
                "damage": "135",
                "health": "27",
                "reload": "2.5s",
                "special": "Petal Evasion: 90%"
            },
            "legendary": {
                "damage": "405",
                "health": "81",
                "reload": "2.5s",
                "special": "Petal Evasion: 90%"
            },
            "mythic": {
                "damage": "1215",
                "health": "243",
                "reload": "2.5s",
                "special": "Petal Evasion: 90%"
            },
            "ultra": {
                "damage": "3645",
                "health": "729",
                "reload": "2.5s",
                "special": "Petal Evasion: 90%"
            },
            "super": {
                "damage": "10935",
                "health": "2187",
                "reload": "2.5s",
                "special": "Petal Evasion: 90%"
            },
            "unique": {
                "damage": "32805",
                "health": "6561",
                "reload": "2.5s",
                "special": "Petal Evasion: 90%"
            },
            "eternal": {
                "damage": "32805",
                "health": "6561",
                "reload": "2.5s",
                "special": "Petal Evasion: 90%"
            }
        }
    },
    "claw": {
        "desc": "Deals extra damage if the victim is above 80% health.<br>-50% damage vs other flowers.",
        "stats": {
            "common": {
                "damage": "5",
                "health": "10",
                "reload": "3.5s",
                "special": "Extra Damage (>80% HP): 100"
            },
            "unusual": {
                "damage": "15",
                "health": "30",
                "reload": "3.5s",
                "special": "Extra Damage (>80% HP): 300"
            },
            "rare": {
                "damage": "45",
                "health": "90",
                "reload": "3.5s",
                "special": "Extra Damage (>80% HP): 900"
            },
            "epic": {
                "damage": "135",
                "health": "270",
                "reload": "3.5s",
                "special": "Extra Damage (>80% HP): 2700"
            },
            "legendary": {
                "damage": "405",
                "health": "810",
                "reload": "3.5s",
                "special": "Extra Damage (>80% HP): 8100"
            },
            "mythic": {
                "damage": "1215",
                "health": "2430",
                "reload": "3.5s",
                "special": "Extra Damage (>80% HP): 24300"
            },
            "ultra": {
                "damage": "3645",
                "health": "7290",
                "reload": "3.5s",
                "special": "Extra Damage (>80% HP): 72900"
            },
            "super": {
                "damage": "10935",
                "health": "21870",
                "reload": "3.5s",
                "special": "Extra Damage (>80% HP): 218700"
            },
            "unique": {
                "damage": "32805",
                "health": "65610",
                "reload": "3.5s",
                "special": "Extra Damage (>80% HP): 656100"
            },
            "eternal": {
                "damage": "32805",
                "health": "65610",
                "reload": "3.5s",
                "special": "Extra Damage (>80% HP): 656100"
            }
        }
    },
    "clover": {
        "desc": "Increases your luck.",
        "stats": {
            "common": {
                "damage": "10",
                "health": "10",
                "reload": "2.5s",
                "special": "Luck: 0.1"
            },
            "unusual": {
                "damage": "30",
                "health": "30",
                "reload": "2.5s",
                "special": "Luck: 0.2"
            },
            "rare": {
                "damage": "90",
                "health": "90",
                "reload": "2.5s",
                "special": "Luck: 0.3"
            },
            "epic": {
                "damage": "270",
                "health": "270",
                "reload": "2.5s",
                "special": "Luck: 0.4"
            },
            "legendary": {
                "damage": "810",
                "health": "810",
                "reload": "2.5s",
                "special": "Luck: 0.5"
            },
            "mythic": {
                "damage": "2430",
                "health": "2430",
                "reload": "2.5s",
                "special": "Luck: 0.6"
            },
            "ultra": {
                "damage": "7290",
                "health": "7290",
                "reload": "2.5s",
                "special": "Luck: 0.7"
            },
            "super": {
                "damage": "21870",
                "health": "21870",
                "reload": "2.5s",
                "special": "Luck: 0.8"
            },
            "unique": {
                "damage": "65610",
                "health": "65610",
                "reload": "2.5s",
                "special": "Luck: 0.9"
            },
            "eternal": {
                "damage": "65610",
                "health": "65610",
                "reload": "2.5s",
                "special": "Luck: 0.9"
            }
        }
    },
    "cog": {
        "desc": "Makes all of your petals move in cycles.",
        "stats": {
            "common": {
                "damage": "13",
                "health": "13",
                "reload": "2.5s"
            },
            "unusual": {
                "damage": "39",
                "health": "39",
                "reload": "2.5s"
            },
            "rare": {
                "damage": "117",
                "health": "117",
                "reload": "2.5s"
            },
            "epic": {
                "damage": "351",
                "health": "351",
                "reload": "2.5s"
            },
            "legendary": {
                "damage": "1053",
                "health": "1053",
                "reload": "2.5s"
            },
            "mythic": {
                "damage": "3159",
                "health": "3159",
                "reload": "2.5s"
            },
            "ultra": {
                "damage": "9477",
                "health": "9477",
                "reload": "2.5s"
            },
            "super": {
                "damage": "28431",
                "health": "28431",
                "reload": "2.5s"
            },
            "unique": {
                "damage": "85293",
                "health": "85293",
                "reload": "2.5s"
            },
            "eternal": {
                "damage": "85293",
                "health": "85293",
                "reload": "2.5s"
            }
        }
    },
    "coin": {
        "desc": "The power of capitalism compels you!",
        "stats": {
            "common": {
                "damage": "15",
                "health": "10",
                "reload": "2.5s"
            },
            "unusual": {
                "damage": "45",
                "health": "30",
                "reload": "2.5s"
            },
            "rare": {
                "damage": "135",
                "health": "90",
                "reload": "2.5s"
            },
            "epic": {
                "damage": "405",
                "health": "270",
                "reload": "2.5s"
            },
            "legendary": {
                "damage": "1215",
                "health": "810",
                "reload": "2.5s"
            },
            "mythic": {
                "damage": "3645",
                "health": "2430",
                "reload": "2.5s"
            },
            "ultra": {
                "damage": "10935",
                "health": "7290",
                "reload": "2.5s"
            },
            "super": {
                "damage": "32805",
                "health": "21870",
                "reload": "2.5s"
            },
            "unique": {
                "damage": "98415",
                "health": "65610",
                "reload": "2.5s"
            },
            "eternal": {
                "damage": "98415",
                "health": "65610",
                "reload": "2.5s"
            }
        }
    },
    "compass": {
        "desc": "Points to the nearest super mob.",
        "stats": {
            "common": {
                "damage": "1",
                "health": "40",
                "reload": "2.5s"
            },
            "unusual": {
                "damage": "3",
                "health": "120",
                "reload": "2.5s"
            },
            "rare": {
                "damage": "9",
                "health": "360",
                "reload": "2.5s"
            },
            "epic": {
                "damage": "27",
                "health": "1080",
                "reload": "2.5s"
            },
            "legendary": {
                "damage": "81",
                "health": "3240",
                "reload": "2.5s"
            },
            "mythic": {
                "damage": "243",
                "health": "9720",
                "reload": "2.5s"
            },
            "ultra": {
                "damage": "729",
                "health": "29160",
                "reload": "2.5s"
            },
            "super": {
                "damage": "2187",
                "health": "87480",
                "reload": "2.5s"
            },
            "unique": {
                "damage": "6561",
                "health": "262440",
                "reload": "2.5s"
            },
            "eternal": {
                "damage": "6561",
                "health": "262440",
                "reload": "2.5s"
            }
        }
    },
    "coral": {
        "desc": "Breaks apart on impact.<br>Each piece has 50% of the stats of the predecessor.",
        "stats": {
            "common": {
                "damage": "11",
                "health": "1",
                "reload": "1.5s"
            },
            "unusual": {
                "damage": "33",
                "health": "1",
                "reload": "1.5s"
            },
            "rare": {
                "damage": "99",
                "health": "1",
                "reload": "1.5s"
            },
            "epic": {
                "damage": "297",
                "health": "1",
                "reload": "1.5s"
            },
            "legendary": {
                "damage": "891",
                "health": "1",
                "reload": "1.5s"
            },
            "mythic": {
                "damage": "2673",
                "health": "1",
                "reload": "1.5s"
            },
            "ultra": {
                "damage": "8019",
                "health": "1",
                "reload": "1.5s"
            },
            "super": {
                "damage": "24057",
                "health": "1",
                "reload": "1.5s"
            },
            "unique": {
                "damage": "72171",
                "health": "1",
                "reload": "1.5s"
            },
            "eternal": {
                "damage": "72171",
                "health": "1",
                "reload": "1.5s"
            }
        }
    },
    "corn": {
        "desc": "Takes a long time to spawn, but has a lot of health.",
        "stats": {
            "common": {
                "damage": "5",
                "health": "300",
                "reload": "7s"
            },
            "unusual": {
                "damage": "15",
                "health": "900",
                "reload": "7s"
            },
            "rare": {
                "damage": "45",
                "health": "2700",
                "reload": "7s"
            },
            "epic": {
                "damage": "135",
                "health": "8100",
                "reload": "7s"
            },
            "legendary": {
                "damage": "405",
                "health": "24300",
                "reload": "7s"
            },
            "mythic": {
                "damage": "1215",
                "health": "72900",
                "reload": "7s"
            },
            "ultra": {
                "damage": "3645",
                "health": "218700",
                "reload": "7s"
            },
            "super": {
                "damage": "10935",
                "health": "656100",
                "reload": "7s"
            },
            "unique": {
                "damage": "32805",
                "health": "1968300",
                "reload": "7s"
            },
            "eternal": {
                "damage": "32805",
                "health": "1968300",
                "reload": "7s"
            }
        }
    },
    "corruption": {
        "desc": {
            "default": "Corrupts one's soul, turning them against their own kind.<br>Cannot be unequipped. Lost on death.",
            "super": "Corrupts one's soul, turning them against their own kind.<br>Cannot be unequipped.",
            "eternal": "Corrupts one's soul, turning them against their own kind.<br>Cannot be unequipped.",
            "unique": "Corrupts one's soul, turning them against their own kind.<br>Cannot be unequipped."
        },
        "stats": {
            "common": {},
            "unusual": {},
            "rare": {},
            "epic": {},
            "legendary": {},
            "mythic": {},
            "ultra": {},
            "super": {},
            "unique": {},
            "eternal": {}
        }
    },
    "cotton": {
        "desc": "Negates all incoming damage, causing damage to go to the petal instead.",
        "stats": {
            "common": {
                "damage": "0",
                "health": "6",
                "reload": "1.5s"
            },
            "unusual": {
                "damage": "0",
                "health": "18",
                "reload": "1.5s"
            },
            "rare": {
                "damage": "0",
                "health": "54",
                "reload": "1.5s"
            },
            "epic": {
                "damage": "0",
                "health": "162",
                "reload": "1.5s"
            },
            "legendary": {
                "damage": "0",
                "health": "486",
                "reload": "1.5s"
            },
            "mythic": {
                "damage": "0",
                "health": "1458",
                "reload": "1.5s"
            },
            "ultra": {
                "damage": "0",
                "health": "2525",
                "reload": "1.5s"
            },
            "super": {
                "damage": "0",
                "health": "4374",
                "reload": "1.5s"
            },
            "unique": {
                "damage": "0",
                "health": "7576",
                "reload": "1.5s"
            },
            "eternal": {
                "damage": "0",
                "health": "7576",
                "reload": "1.5s"
            }
        }
    },
    "cutter": {
        "desc": "Increases body damage.",
        "stats": {
            "common": {
                "special": "Extra Body Damage: 27"
            },
            "unusual": {
                "special": "Extra Body Damage: 81"
            },
            "rare": {
                "special": "Extra Body Damage: 243"
            },
            "epic": {
                "special": "Extra Body Damage: 729"
            },
            "legendary": {
                "special": "Extra Body Damage: 2187"
            },
            "mythic": {
                "special": "Extra Body Damage: 6561"
            },
            "ultra": {
                "special": "Extra Body Damage: 11364"
            },
            "super": {
                "special": "Extra Body Damage: 19683"
            },
            "unique": {
                "special": "Extra Body Damage: 34092"
            },
            "eternal": {
                "special": "Extra Body Damage: 34092"
            }
        }
    },
    "dahlia": {
        "desc": "A small amount of heal but fairly consistent.",
        "stats": {
            "common": {
                "damage": "1.7",
                "health": "1.7",
                "reload": "1.5s",
                "special": "Heal: 1"
            },
            "unusual": {
                "damage": "5",
                "health": "5",
                "reload": "1.5s",
                "special": "Heal: 4"
            },
            "rare": {
                "damage": "15",
                "health": "15",
                "reload": "1.5s",
                "special": "Heal: 11"
            },
            "epic": {
                "damage": "45",
                "health": "45",
                "reload": "1.5s",
                "special": "Heal: 34"
            },
            "legendary": {
                "damage": "135",
                "health": "135",
                "reload": "1.5s",
                "special": "Heal: 101"
            },
            "mythic": {
                "damage": "405",
                "health": "405",
                "reload": "1.5s",
                "special": "Heal: 304"
            },
            "ultra": {
                "damage": "1215",
                "health": "1215",
                "reload": "1.5s",
                "special": "Heal: 526"
            },
            "super": {
                "damage": "3645",
                "health": "3645",
                "reload": "1.5s",
                "special": "Heal: 911"
            },
            "unique": {
                "damage": "10935",
                "health": "10935",
                "reload": "1.5s",
                "special": "Heal: 1578"
            },
            "eternal": {
                "damage": "10935",
                "health": "10935",
                "reload": "1.5s",
                "special": "Heal: 1578"
            }
        }
    },
    "dandelion": {
        "desc": "Enemies hit have healing reduced by 20%. Stacks multiplicatively.",
        "stats": {
            "common": {
                "damage": "8",
                "health": "8",
                "reload": "1s",
                "special": "Duration: 30s"
            },
            "unusual": {
                "damage": "24",
                "health": "24",
                "reload": "1s",
                "special": "Duration: 30s"
            },
            "rare": {
                "damage": "72",
                "health": "72",
                "reload": "1s",
                "special": "Duration: 30s"
            },
            "epic": {
                "damage": "216",
                "health": "216",
                "reload": "1s",
                "special": "Duration: 30s"
            },
            "legendary": {
                "damage": "648",
                "health": "648",
                "reload": "1s",
                "special": "Duration: 30s"
            },
            "mythic": {
                "damage": "972",
                "health": "972",
                "reload": "1s",
                "special": "Duration: 30s"
            },
            "ultra": {
                "damage": "1944",
                "health": "1944",
                "reload": "1s",
                "special": "Duration: 30s"
            },
            "super": {
                "damage": "5832",
                "health": "5832",
                "reload": "1s",
                "special": "Duration: 30s"
            },
            "unique": {
                "damage": "17496",
                "health": "17496",
                "reload": "1s",
                "special": "Duration: 30s"
            },
            "eternal": {
                "damage": "17496",
                "health": "17496",
                "reload": "1s",
                "special": "Duration: 30s"
            }
        }
    },
    "dice": {
        "desc": "Has a 5% chance of dealing 35x damage.<br>Chance increases by 4% per point in luck.",
        "stats": {
            "common": {
                "damage": "10",
                "health": "10",
                "reload": "2.5s",
                "special": "Critical Hit Damage: 350"
            },
            "unusual": {
                "damage": "30",
                "health": "30",
                "reload": "2.5s",
                "special": "Critical Hit Damage: 1050"
            },
            "rare": {
                "damage": "90",
                "health": "90",
                "reload": "2.5s",
                "special": "Critical Hit Damage: 3150"
            },
            "epic": {
                "damage": "270",
                "health": "270",
                "reload": "2.5s",
                "special": "Critical Hit Damage: 9450"
            },
            "legendary": {
                "damage": "810",
                "health": "810",
                "reload": "2.5s",
                "special": "Critical Hit Damage: 28350"
            },
            "mythic": {
                "damage": "2430",
                "health": "2430",
                "reload": "2.5s",
                "special": "Critical Hit Damage: 85050"
            },
            "ultra": {
                "damage": "7290",
                "health": "7290",
                "reload": "2.5s",
                "special": "Critical Hit Damage: 255150"
            },
            "super": {
                "damage": "21870",
                "health": "21870",
                "reload": "2.5s",
                "special": "Critical Hit Damage: 765450"
            },
            "unique": {
                "damage": "65610",
                "health": "65610",
                "reload": "2.5s",
                "special": "Critical Hit Damage: 2296350"
            },
            "eternal": {
                "damage": "65610",
                "health": "65610",
                "reload": "2.5s",
                "special": "Critical Hit Damage: 2296350"
            }
        }
    },
    "disc": {
        "desc": "Reduces damage taken from collisions with mobs and flowers.",
        "stats": {
            "common": {
                "special": "Collision Dmg Resistance: 10.0%"
            },
            "unusual": {
                "special": "Collision Dmg Resistance: 19.0%"
            },
            "rare": {
                "special": "Collision Dmg Resistance: 27.1%"
            },
            "epic": {
                "special": "Collision Dmg Resistance: 34.4%"
            },
            "legendary": {
                "special": "Collision Dmg Resistance: 41.0%"
            },
            "mythic": {
                "special": "Collision Dmg Resistance: 46.9%"
            },
            "ultra": {
                "special": "Collision Dmg Resistance: 52.2%"
            },
            "super": {
                "special": "Collision Dmg Resistance: 57.0%"
            },
            "unique": {
                "special": "Collision Dmg Resistance: 61.3%"
            },
            "eternal": {
                "special": "Collision Dmg Resistance: 61.3%"
            }
        }
    },
    "domino": {
        "desc": "Damage depends on how many dots it has.",
        "stats": {
            "common": {
                "damage": "0~36",
                "health": "10",
                "reload": "0.4s",
                "special": "Average Damage: 9.85"
            },
            "unusual": {
                "damage": "0~108",
                "health": "30",
                "reload": "0.4s",
                "special": "Average Damage: 29.56"
            },
            "rare": {
                "damage": "0~324",
                "health": "90",
                "reload": "0.4s",
                "special": "Average Damage: 88.67"
            },
            "epic": {
                "damage": "0~972",
                "health": "270",
                "reload": "0.4s",
                "special": "Average Damage: 266"
            },
            "legendary": {
                "damage": "0~2916",
                "health": "810",
                "reload": "0.4s",
                "special": "Average Damage: 798"
            },
            "mythic": {
                "damage": "0~8748",
                "health": "2430",
                "reload": "0.4s",
                "special": "Average Damage: 2394"
            },
            "ultra": {
                "damage": "0~26244",
                "health": "7290",
                "reload": "0.4s",
                "special": "Average Damage: 7182"
            },
            "super": {
                "damage": "0~78732",
                "health": "21870",
                "reload": "0.4s",
                "special": "Average Damage: 21546"
            },
            "unique": {
                "damage": "0~236196",
                "health": "65610",
                "reload": "0.4s",
                "special": "Average Damage: 64638"
            },
            "eternal": {
                "damage": "0~236196",
                "health": "65610",
                "reload": "0.4s",
                "special": "Average Damage: 64638"
            }
        }
    },
    "electric_web": {
        "desc": "It's a little less sticky, but a bit more shocking.",
        "stats": {
            "common": {
                "damage": "5",
                "health": "10",
                "reload": "4s",
                "special": "Duration: 10s",
                "special2": "Radius: 50",
                "special3": "Lightning: 5"
            },
            "unusual": {
                "damage": "15",
                "health": "30",
                "reload": "4s",
                "special": "Duration: 10s",
                "special2": "Radius: 60",
                "special3": "Lightning: 15"
            },
            "rare": {
                "damage": "45",
                "health": "90",
                "reload": "4s",
                "special": "Duration: 10s",
                "special2": "Radius: 70",
                "special3": "Lightning: 45"
            },
            "epic": {
                "damage": "135",
                "health": "270",
                "reload": "4s",
                "special": "Duration: 10s",
                "special2": "Radius: 80",
                "special3": "Lightning: 135"
            },
            "legendary": {
                "damage": "405",
                "health": "810",
                "reload": "4s",
                "special": "Duration: 10s",
                "special2": "Radius: 100",
                "special3": "Lightning: 405"
            },
            "mythic": {
                "damage": "1215",
                "health": "2430",
                "reload": "4s",
                "special": "Duration: 10s",
                "special2": "Radius: 150",
                "special3": "Lightning: 1215"
            },
            "ultra": {
                "damage": "3645",
                "health": "7290",
                "reload": "4s",
                "special": "Duration: 10s",
                "special2": "Radius: 200",
                "special3": "Lightning: 3645"
            },
            "super": {
                "damage": "10935",
                "health": "21870",
                "reload": "4s",
                "special": "Duration: 10s",
                "special2": "Radius: 250",
                "special3": "Lightning: 10935"
            },
            "unique": {
                "damage": "32805",
                "health": "65610",
                "reload": "4s",
                "special": "Duration: 10s",
                "special2": "Radius: 300",
                "special3": "Lightning: 32805"
            },
            "eternal": {
                "damage": "32805",
                "health": "65610",
                "reload": "4s",
                "special": "Duration: 10s",
                "special2": "Radius: 300",
                "special3": "Lightning: 32805"
            }
        }
    },
    "fang": {
        "desc": "Heals based on damage dealt by this petal.",
        "stats": {
            "common": {
                "damage": "15",
                "health": "10",
                "reload": "3.5s",
                "special": "Damage Healed: 35%"
            },
            "unusual": {
                "damage": "45",
                "health": "30",
                "reload": "3.5s",
                "special": "Damage Healed: 35%"
            },
            "rare": {
                "damage": "135",
                "health": "90",
                "reload": "3.5s",
                "special": "Damage Healed: 35%"
            },
            "epic": {
                "damage": "405",
                "health": "270",
                "reload": "3.5s",
                "special": "Damage Healed: 35%"
            },
            "legendary": {
                "damage": "1215",
                "health": "810",
                "reload": "3.5s",
                "special": "Damage Healed: 35%"
            },
            "mythic": {
                "damage": "3645",
                "health": "2430",
                "reload": "3.5s",
                "special": "Damage Healed: 35%"
            },
            "ultra": {
                "damage": "10935",
                "health": "7290",
                "reload": "3.5s",
                "special": "Damage Healed: 20.2%"
            },
            "super": {
                "damage": "32805",
                "health": "21870",
                "reload": "3.5s",
                "special": "Damage Healed: 11.7%"
            },
            "unique": {
                "damage": "98415",
                "health": "65610",
                "reload": "3.5s",
                "special": "Damage Healed: 6.7%"
            },
            "eternal": {
                "damage": "98415",
                "health": "65610",
                "reload": "3.5s",
                "special": "Damage Healed: 6.7%"
            }
        }
    },
    "faster": {
        "desc": "It's so light it makes your other petals spin faster.",
        "stats": {
            "common": {
                "damage": "12",
                "health": "5",
                "reload": "2.5s",
                "special": "Rotation Speed (rad/s): 0.5"
            },
            "unusual": {
                "damage": "36",
                "health": "15",
                "reload": "2.5s",
                "special": "Rotation Speed (rad/s): 0.7"
            },
            "rare": {
                "damage": "108",
                "health": "45",
                "reload": "2.5s",
                "special": "Rotation Speed (rad/s): 0.9"
            },
            "epic": {
                "damage": "324",
                "health": "135",
                "reload": "2.5s",
                "special": "Rotation Speed (rad/s): 1.1"
            },
            "legendary": {
                "damage": "972",
                "health": "405",
                "reload": "2.5s",
                "special": "Rotation Speed (rad/s): 1.3"
            },
            "mythic": {
                "damage": "2916",
                "health": "1215",
                "reload": "2.5s",
                "special": "Rotation Speed (rad/s): 1.5"
            },
            "ultra": {
                "damage": "8748",
                "health": "3645",
                "reload": "2.5s",
                "special": "Rotation Speed (rad/s): 1.7"
            },
            "super": {
                "damage": "26244",
                "health": "10935",
                "reload": "2.5s",
                "special": "Rotation Speed (rad/s): 1.9"
            },
            "unique": {
                "damage": "78732",
                "health": "32805",
                "reload": "2.5s",
                "special": "Rotation Speed (rad/s): 2.1"
            },
            "eternal": {
                "damage": "78732",
                "health": "32805",
                "reload": "2.5s",
                "special": "Rotation Speed (rad/s): 2.1"
            }
        }
    },
    "glass": {
        "desc": "Phases through enemies.<br>Cannot damage enemies more often than a certain interval.",
        "stats": {
            "common": {
                "damage": "15",
                "reload": "2.5s",
                "special": "Interval (s): 1"
            },
            "unusual": {
                "damage": "45",
                "reload": "2.5s",
                "special": "Interval (s): 1"
            },
            "rare": {
                "damage": "135",
                "reload": "2.5s",
                "special": "Interval (s): 1"
            },
            "epic": {
                "damage": "405",
                "reload": "2.5s",
                "special": "Interval (s): 1"
            },
            "legendary": {
                "damage": "1215",
                "reload": "2.5s",
                "special": "Interval (s): 1"
            },
            "mythic": {
                "damage": "3645",
                "reload": "2.5s",
                "special": "Interval (s): 1"
            },
            "ultra": {
                "damage": "10935",
                "reload": "2.5s",
                "special": "Interval (s): 1"
            },
            "super": {
                "damage": "32805",
                "reload": "2.5s",
                "special": "Interval (s): 1"
            },
            "unique": {
                "damage": "98415",
                "reload": "2.5s",
                "special": "Interval (s): 1"
            },
            "eternal": {
                "damage": "98415",
                "reload": "2.5s",
                "special": "Interval (s): 1"
            }
        }
    },
    "golden_leaf": {
        "desc": "A very special leaf that reduces reload time of all petals.",
        "stats": {
            "common": {
                "damage": "13",
                "health": "12",
                "reload": "1.8s",
                "special": "Reload Reduction: 0.00%"
            },
            "unusual": {
                "damage": "39",
                "health": "36",
                "reload": "1.8s",
                "special": "Reload Reduction: 0.00%"
            },
            "rare": {
                "damage": "117",
                "health": "108",
                "reload": "1.8s",
                "special": "Reload Reduction: 0.00%"
            },
            "epic": {
                "damage": "351",
                "health": "324",
                "reload": "1.8s",
                "special": "Reload Reduction: 0.00%"
            },
            "legendary": {
                "damage": "1053",
                "health": "972",
                "reload": "1.8s",
                "special": "Reload Reduction: 0.00%"
            },
            "mythic": {
                "damage": "3159",
                "health": "2916",
                "reload": "1.8s",
                "special": "Reload Reduction: 0.00%"
            },
            "ultra": {
                "damage": "9477",
                "health": "8748",
                "reload": "1.8s",
                "special": "Reload Reduction: -19.20%"
            },
            "super": {
                "damage": "28431",
                "health": "26244",
                "reload": "1.8s",
                "special": "Reload Reduction: -21.60%"
            },
            "unique": {
                "damage": "85293",
                "health": "78732",
                "reload": "1.8s",
                "special": "Reload Reduction: -24.00%"
            },
            "eternal": {
                "damage": "85293",
                "health": "78732",
                "reload": "1.8s",
                "special": "Reload Reduction: -24.00%"
            }
        }
    },
    "grapes": {
        "desc": "It goes poof. Now with a secret ingredient: poison.",
        "stats": {
            "common": {
                "damage": "3",
                "health": "5",
                "reload": "1.5s",
                "special": "Poison: 17",
                "special2": "Poison DPS: 24.3"
            },
            "unusual": {
                "damage": "9",
                "health": "15",
                "reload": "1.5s",
                "special": "Poison: 51",
                "special2": "Poison DPS: 72.9"
            },
            "rare": {
                "damage": "27",
                "health": "45",
                "reload": "1.5s",
                "special": "Poison: 153",
                "special2": "Poison DPS: 218.6"
            },
            "epic": {
                "damage": "81",
                "health": "135",
                "reload": "1.5s",
                "special": "Poison: 459",
                "special2": "Poison DPS: 655.7"
            },
            "legendary": {
                "damage": "243",
                "health": "405",
                "reload": "1.5s",
                "special": "Poison: 1377",
                "special2": "Poison DPS: 1967.1"
            },
            "mythic": {
                "damage": "729",
                "health": "1215",
                "reload": "1.5s",
                "special": "Poison: 4131",
                "special2": "Poison DPS: 5901.4"
            },
            "ultra": {
                "damage": "2187",
                "health": "3645",
                "reload": "1.5s",
                "special": "Poison: 12393",
                "special2": "Poison DPS: 17704.3"
            },
            "super": {
                "damage": "6561",
                "health": "10935",
                "reload": "1.5s",
                "special": "Poison: 37179",
                "special2": "Poison DPS: 53112.9"
            },
            "unique": {
                "damage": "19683",
                "health": "32805",
                "reload": "1.5s",
                "special": "Poison: 111537",
                "special2": "Poison DPS: 159338.6"
            },
            "eternal": {
                "damage": "19683",
                "health": "32805",
                "reload": "1.5s",
                "special": "Poison: 111537",
                "special2": "Poison DPS: 159338.6"
            }
        }
    },
    "heavy": {
        "desc": "This thing is so heavy that nothing gets in the way.<br>Slows down petal rotation speed when equipped.",
        "stats": {
            "common": {
                "damage": "9",
                "health": "150",
                "reload": "10s"
            },
            "unusual": {
                "damage": "27",
                "health": "450",
                "reload": "10s"
            },
            "rare": {
                "damage": "81",
                "health": "1350",
                "reload": "10s"
            },
            "epic": {
                "damage": "243",
                "health": "4050",
                "reload": "10s"
            },
            "legendary": {
                "damage": "729",
                "health": "12150",
                "reload": "10s"
            },
            "mythic": {
                "damage": "2187",
                "health": "36450",
                "reload": "10s"
            },
            "ultra": {
                "damage": "6561",
                "health": "109350",
                "reload": "10s"
            },
            "super": {
                "damage": "19683",
                "health": "328050",
                "reload": "10s"
            },
            "unique": {
                "damage": "59049",
                "health": "984150",
                "reload": "10s"
            },
            "eternal": {
                "damage": "59049",
                "health": "984150",
                "reload": "10s"
            }
        }
    },
    "honey": {
        "desc": "Mobs love this. Attracts them in a large radius.",
        "stats": {
            "common": {
                "damage": "0",
                "health": "50",
                "reload": "2s",
                "special": "Max Mob Rarity: Common"
            },
            "unusual": {
                "damage": "0",
                "health": "150",
                "reload": "2s",
                "special": "Max Mob Rarity: Common"
            },
            "rare": {
                "damage": "0",
                "health": "450",
                "reload": "2s",
                "special": "Max Mob Rarity: Unusual"
            },
            "epic": {
                "damage": "0",
                "health": "1350",
                "reload": "2s",
                "special": "Max Mob Rarity: Rare"
            },
            "legendary": {
                "damage": "0",
                "health": "4050",
                "reload": "2s",
                "special": "Max Mob Rarity: Epic"
            },
            "mythic": {
                "damage": "0",
                "health": "12150",
                "reload": "2s",
                "special": "Max Mob Rarity: Legendary"
            },
            "ultra": {
                "damage": "0",
                "health": "36450",
                "reload": "2s",
                "special": "Max Mob Rarity: Mythic"
            },
            "super": {
                "damage": "0",
                "health": "109350",
                "reload": "2s",
                "special": "Max Mob Rarity: Ultra"
            },
            "unique": {
                "damage": "0",
                "health": "328050",
                "reload": "2s",
                "special": "Max Mob Rarity: Super"
            },
            "eternal": {
                "damage": "0",
                "health": "328050",
                "reload": "2s",
                "special": "Max Mob Rarity: Super"
            }
        }
    },
    "iris": {
        "desc": "Very poisonous, but takes a little while to do its work.<br>-50% damage vs other flowers.",
        "stats": {
            "common": {
                "damage": "5",
                "health": "5",
                "reload": "4s",
                "special": "Poison: 70",
                "special2": "Poison DPS: 23.3"
            },
            "unusual": {
                "damage": "15",
                "health": "15",
                "reload": "4s",
                "special": "Poison: 210",
                "special2": "Poison DPS: 70"
            },
            "rare": {
                "damage": "45",
                "health": "45",
                "reload": "4s",
                "special": "Poison: 630",
                "special2": "Poison DPS: 210"
            },
            "epic": {
                "damage": "135",
                "health": "135",
                "reload": "4s",
                "special": "Poison: 1890",
                "special2": "Poison DPS: 630"
            },
            "legendary": {
                "damage": "405",
                "health": "405",
                "reload": "4s",
                "special": "Poison: 5670",
                "special2": "Poison DPS: 1890"
            },
            "mythic": {
                "damage": "1215",
                "health": "1215",
                "reload": "4s",
                "special": "Poison: 17010",
                "special2": "Poison DPS: 5670"
            },
            "ultra": {
                "damage": "3645",
                "health": "3645",
                "reload": "4s",
                "special": "Poison: 51030",
                "special2": "Poison DPS: 17010"
            },
            "super": {
                "damage": "10935",
                "health": "10935",
                "reload": "4s",
                "special": "Poison: 153090",
                "special2": "Poison DPS: 51030"
            },
            "unique": {
                "damage": "32805",
                "health": "32805",
                "reload": "4s",
                "special": "Poison: 459270",
                "special2": "Poison DPS: 153090"
            },
            "eternal": {
                "damage": "32805",
                "health": "32805",
                "reload": "4s",
                "special": "Poison: 459270",
                "special2": "Poison DPS: 153090"
            }
        }
    },
    "jelly": {
        "desc": "No one likes touching this.",
        "stats": {
            "common": {
                "damage": "10",
                "health": "10",
                "reload": "2.5s",
                "special": "Knockback: 300"
            },
            "unusual": {
                "damage": "30",
                "health": "30",
                "reload": "2.5s",
                "special": "Knockback: 432"
            },
            "rare": {
                "damage": "90",
                "health": "90",
                "reload": "2.5s",
                "special": "Knockback: 675"
            },
            "epic": {
                "damage": "270",
                "health": "270",
                "reload": "2.5s",
                "special": "Knockback: 1100"
            },
            "legendary": {
                "damage": "810",
                "health": "810",
                "reload": "2.5s",
                "special": "Knockback: 2700"
            },
            "mythic": {
                "damage": "2430",
                "health": "2430",
                "reload": "2.5s",
                "special": "Knockback: 7500"
            },
            "ultra": {
                "damage": "7290",
                "health": "7290",
                "reload": "2.5s",
                "special": "Knockback: 19200"
            },
            "super": {
                "damage": "21870",
                "health": "21870",
                "reload": "2.5s",
                "special": "Knockback: 50700"
            },
            "unique": {
                "damage": "65610",
                "health": "65610",
                "reload": "2.5s",
                "special": "Knockback: 120000"
            },
            "eternal": {
                "damage": "65610",
                "health": "65610",
                "reload": "2.5s",
                "special": "Knockback: 120000"
            }
        }
    },
    "laser": {
        "desc": "Pew pew. Shoots a constant beam of lightning damage.",
        "stats": {
            "common": {
                "damage": "5",
                "health": "12",
                "reload": "5s"
            },
            "unusual": {
                "damage": "15",
                "health": "36",
                "reload": "1.8s"
            },
            "rare": {
                "damage": "45",
                "health": "108",
                "reload": "1.8s"
            },
            "epic": {
                "damage": "135",
                "health": "324",
                "reload": "1.8s"
            },
            "legendary": {
                "damage": "405",
                "health": "972",
                "reload": "1.8s"
            },
            "mythic": {
                "damage": "1215",
                "health": "2916",
                "reload": "1.8s"
            },
            "ultra": {
                "damage": "3645",
                "health": "8748",
                "reload": "1.8s"
            },
            "super": {
                "damage": "10935",
                "health": "26244",
                "reload": "1.8s"
            },
            "unique": {
                "damage": "32805",
                "health": "78732",
                "reload": "1.8s"
            },
            "eternal": {
                "damage": "32805",
                "health": "78732",
                "reload": "1.8s"
            }
        }
    },
    "leaf": {
        "desc": "Gathers energy from the sun to heal your flower passively.",
        "stats": {
            "common": {
                "damage": "13",
                "health": "12",
                "reload": "1.8s",
                "special": "Heal (Per sec): 1"
            },
            "unusual": {
                "damage": "39",
                "health": "36",
                "reload": "1.8s",
                "special": "Heal (Per sec): 3"
            },
            "rare": {
                "damage": "117",
                "health": "108",
                "reload": "1.8s",
                "special": "Heal (Per sec): 9"
            },
            "epic": {
                "damage": "351",
                "health": "324",
                "reload": "1.8s",
                "special": "Heal (Per sec): 27"
            },
            "legendary": {
                "damage": "1053",
                "health": "972",
                "reload": "1.8s",
                "special": "Heal (Per sec): 81"
            },
            "mythic": {
                "damage": "3159",
                "health": "2916",
                "reload": "1.8s",
                "special": "Heal (Per sec): 243"
            },
            "ultra": {
                "damage": "9477",
                "health": "8748",
                "reload": "1.8s",
                "special": "Heal (Per sec): 421"
            },
            "super": {
                "damage": "28431",
                "health": "26244",
                "reload": "1.8s",
                "special": "Heal (Per sec): 729"
            },
            "unique": {
                "damage": "85293",
                "health": "78732",
                "reload": "1.8s",
                "special": "Heal (Per sec): 1262.7"
            },
            "eternal": {
                "damage": "85293",
                "health": "78732",
                "reload": "1.8s",
                "special": "Heal (Per sec): 1262.7"
            }
        }
    },
    "light": {
        "desc": "Weaker than most petals, but recharges very quickly.",
        "stats": {
            "common": {
                "damage": "13",
                "health": "5",
                "reload": "0.8s"
            },
            "unusual": {
                "damage": "20",
                "health": "8",
                "reload": "0.8s"
            },
            "rare": {
                "damage": "59",
                "health": "23",
                "reload": "0.8s"
            },
            "epic": {
                "damage": "117",
                "health": "45",
                "reload": "0.8s"
            },
            "legendary": {
                "damage": "351",
                "health": "135",
                "reload": "0.8s"
            },
            "mythic": {
                "damage": "632",
                "health": "243",
                "reload": "0.8s"
            },
            "ultra": {
                "damage": "1895",
                "health": "729",
                "reload": "0.8s"
            },
            "super": {
                "damage": "5686",
                "health": "2187",
                "reload": "0.8s"
            },
            "unique": {
                "damage": "17059",
                "health": "6561",
                "reload": "0.8s"
            },
            "eternal": {
                "damage": "17059",
                "health": "6561",
                "reload": "0.8s"
            }
        }
    },
    "lightning": {
        "desc": "Strikes several nearby enemies.",
        "stats": {
            "common": {
                "damage": "0",
                "health": "20",
                "reload": "2.5s",
                "special": "Lightning: 12",
                "special2": "Bounces: 2"
            },
            "unusual": {
                "damage": "0",
                "health": "60",
                "reload": "2.5s",
                "special": "Lightning: 36",
                "special2": "Bounces: 3"
            },
            "rare": {
                "damage": "0",
                "health": "180",
                "reload": "2.5s",
                "special": "Lightning: 108",
                "special2": "Bounces: 4"
            },
            "epic": {
                "damage": "0",
                "health": "540",
                "reload": "2.5s",
                "special": "Lightning: 324",
                "special2": "Bounces: 5"
            },
            "legendary": {
                "damage": "0",
                "health": "1620",
                "reload": "2.5s",
                "special": "Lightning: 972",
                "special2": "Bounces: 6"
            },
            "mythic": {
                "damage": "0",
                "health": "4860",
                "reload": "2.5s",
                "special": "Lightning: 2916",
                "special2": "Bounces: 7"
            },
            "ultra": {
                "damage": "0",
                "health": "14580",
                "reload": "2.5s",
                "special": "Lightning: 8748",
                "special2": "Bounces: 8"
            },
            "super": {
                "damage": "0",
                "health": "43740",
                "reload": "2.5s",
                "special": "Lightning: 26244",
                "special2": "Bounces: 9"
            },
            "unique": {
                "damage": "0",
                "health": "131220",
                "reload": "2.5s",
                "special": "Lightning: 78732",
                "special2": "Bounces: 10"
            },
            "eternal": {
                "damage": "0",
                "health": "131220",
                "reload": "2.5s",
                "special": "Lightning: 78732",
                "special2": "Bounces: 10"
            }
        }
    },
    "lotus": {
        "desc": "Absorbs poison damage taken by the flower.",
        "stats": {
            "common": {
                "health": "0",
                "reload": "2.5s",
                "special": "Poison Resistance/s: 14"
            },
            "unusual": {
                "health": "0",
                "reload": "2.5s",
                "special": "Poison Resistance/s: 42"
            },
            "rare": {
                "health": "0",
                "reload": "2.5s",
                "special": "Poison Resistance/s: 126"
            },
            "epic": {
                "health": "0",
                "reload": "2.5s",
                "special": "Poison Resistance/s: 378"
            },
            "legendary": {
                "health": "0",
                "reload": "2.5s",
                "special": "Poison Resistance/s: 1134"
            },
            "mythic": {
                "health": "0",
                "reload": "2.5s",
                "special": "Poison Resistance/s: 3402"
            },
            "ultra": {
                "health": "0",
                "reload": "2.5s",
                "special": "Poison Resistance/s: 10206"
            },
            "super": {
                "health": "0",
                "reload": "2.5s",
                "special": "Poison Resistance/s: 30618"
            },
            "unique": {
                "health": "0",
                "reload": "2.5s",
                "special": "Poison Resistance/s: 91854"
            },
            "eternal": {
                "health": "0",
                "reload": "2.5s",
                "special": "Poison Resistance/s: 91854"
            }
        }
    },
    "magic_bubble": {
        "desc": "Physics are for the magicless.",
        "stats": {
            "common": {
                "damage": "0",
                "health": "1",
                "reload": "2s",
                "usage_reload": "0.7s",
                "special": "Mana Respawn (Mana needed): 5"
            },
            "unusual": {
                "damage": "0",
                "health": "1",
                "reload": "1.8s",
                "usage_reload": "0.6s",
                "special": "Mana Respawn (Mana needed): 10"
            },
            "rare": {
                "damage": "0",
                "health": "1",
                "reload": "1.5s",
                "usage_reload": "0.5s",
                "special": "Mana Respawn (Mana needed): 20"
            },
            "epic": {
                "damage": "0",
                "health": "1",
                "reload": "1.2s",
                "usage_reload": "0.4s",
                "special": "Mana Respawn (Mana needed): 40"
            },
            "legendary": {
                "damage": "0",
                "health": "1",
                "reload": "1s",
                "usage_reload": "0.3s",
                "special": "Mana Respawn (Mana needed): 80"
            },
            "mythic": {
                "damage": "0",
                "health": "1",
                "reload": "0.8s",
                "usage_reload": "0.2s",
                "special": "Mana Respawn (Mana needed): 160"
            },
            "ultra": {
                "damage": "0",
                "health": "1",
                "reload": "0.5s",
                "usage_reload": "0.1s",
                "special": "Mana Respawn (Mana needed): 320"
            },
            "super": {
                "damage": "0",
                "health": "1",
                "reload": "0.2s",
                "usage_reload": "0.1s",
                "special": "Mana Respawn (Mana needed): 640"
            },
            "unique": {
                "damage": "0",
                "health": "1",
                "reload": "0.1s",
                "usage_reload": "0.1s",
                "special": "Mana Respawn (Mana needed): 1280"
            },
            "eternal": {
                "damage": "0",
                "health": "1",
                "reload": "0.1s",
                "usage_reload": "0.1s",
                "special": "Mana Respawn (Mana needed): 1280"
            }
        }
    },
    "magic_cactus": {
        "desc": "Increases maximum mana capacity.",
        "stats": {
            "common": {
                "damage": "5",
                "health": "15",
                "reload": "1s",
                "special": "Max Mana: 247.5"
            },
            "unusual": {
                "damage": "15",
                "health": "45",
                "reload": "1s",
                "special": "Max Mana: 495"
            },
            "rare": {
                "damage": "45",
                "health": "135",
                "reload": "1s",
                "special": "Max Mana: 990"
            },
            "epic": {
                "damage": "135",
                "health": "405",
                "reload": "1s",
                "special": "Max Mana: 1980"
            },
            "legendary": {
                "damage": "405",
                "health": "1215",
                "reload": "1s",
                "special": "Max Mana: 3960"
            },
            "mythic": {
                "damage": "1215",
                "health": "3645",
                "reload": "1s",
                "special": "Max Mana: 7920"
            },
            "ultra": {
                "damage": "3645",
                "health": "10935",
                "reload": "1s",
                "special": "Max Mana: 15840"
            },
            "super": {
                "damage": "10935",
                "health": "32805",
                "reload": "1s",
                "special": "Max Mana: 31680"
            },
            "unique": {
                "damage": "32805",
                "health": "98415",
                "reload": "1s",
                "special": "Max Mana: 63360"
            },
            "eternal": {
                "damage": "32805",
                "health": "98415",
                "reload": "1s",
                "special": "Max Mana: 63360"
            }
        }
    },
    "magic_cotton": {
        "desc": "Negates 98% of incoming damage based on total mana.",
        "stats": {
            "common": {
                "reload": "1.5s",
                "special": "Damage Absorption (per mana): 0.25"
            },
            "unusual": {
                "reload": "1.5s",
                "special": "Damage Absorption (per mana): 0.5"
            },
            "rare": {
                "reload": "1.5s",
                "special": "Damage Absorption (per mana): 0.75"
            },
            "epic": {
                "reload": "1.5s",
                "special": "Damage Absorption (per mana): 1"
            },
            "legendary": {
                "reload": "1.5s",
                "special": "Damage Absorption (per mana): 1.25"
            },
            "mythic": {
                "reload": "1.5s",
                "special": "Damage Absorption (per mana): 1.5"
            },
            "ultra": {
                "reload": "1.5s",
                "special": "Damage Absorption (per mana): 1.75"
            },
            "super": {
                "reload": "1.5s",
                "special": "Damage Absorption (per mana): 2"
            },
            "unique": {
                "reload": "1.5s",
                "special": "Damage Absorption (per mana): 2.25"
            },
            "eternal": {
                "reload": "1.5s",
                "special": "Damage Absorption (per mana): 2.25"
            }
        }
    },
    "magic_eye": {
        "desc": "Consumes half the current mana and deals damage based on that value.",
        "stats": {
            "common": {
                "reload": "2s",
                "special": "Lightning/mana: 3.3",
                "special2": "Bounces: 7"
            },
            "unusual": {
                "reload": "2s",
                "special": "Lightning/mana: 5",
                "special2": "Bounces: 7"
            },
            "rare": {
                "reload": "2s",
                "special": "Lightning/mana: 7.4",
                "special2": "Bounces: 7"
            },
            "epic": {
                "reload": "2s",
                "special": "Lightning/mana: 11.1",
                "special2": "Bounces: 7"
            },
            "legendary": {
                "reload": "2s",
                "special": "Lightning/mana: 16.7",
                "special2": "Bounces: 7"
            },
            "mythic": {
                "reload": "2s",
                "special": "Lightning/mana: 25.1",
                "special2": "Bounces: 7"
            },
            "ultra": {
                "reload": "2s",
                "special": "Lightning/mana: 37.6",
                "special2": "Bounces: 7"
            },
            "super": {
                "reload": "2s",
                "special": "Lightning/mana: 56.4",
                "special2": "Bounces: 7"
            },
            "unique": {
                "reload": "2s",
                "special": "Lightning/mana: 84.6",
                "special2": "Bounces: 7"
            },
            "eternal": {
                "reload": "2s",
                "special": "Lightning/mana: 84.6",
                "special2": "Bounces: 7"
            }
        }
    },
    "magic_leaf": {
        "desc": "Gathers mana from the environment passively.",
        "stats": {
            "common": {
                "damage": "13",
                "health": "12",
                "reload": "1.8s",
                "special": "Mana/s: 2.1",
                "special2": "Base Max Mana: 82.5"
            },
            "unusual": {
                "damage": "39",
                "health": "36",
                "reload": "1.8s",
                "special": "Mana/s: 4.2",
                "special2": "Base Max Mana: 165"
            },
            "rare": {
                "damage": "117",
                "health": "108",
                "reload": "1.8s",
                "special": "Mana/s: 6.3",
                "special2": "Base Max Mana: 247.5"
            },
            "epic": {
                "damage": "351",
                "health": "324",
                "reload": "1.8s",
                "special": "Mana/s: 8.4",
                "special2": "Base Max Mana: 330"
            },
            "legendary": {
                "damage": "1053",
                "health": "972",
                "reload": "1.8s",
                "special": "Mana/s: 10.5",
                "special2": "Base Max Mana: 412.5"
            },
            "mythic": {
                "damage": "3159",
                "health": "2916",
                "reload": "1.8s",
                "special": "Mana/s: 12.6",
                "special2": "Base Max Mana: 495"
            },
            "ultra": {
                "damage": "9477",
                "health": "8748",
                "reload": "1.8s",
                "special": "Mana/s: 14.7",
                "special2": "Base Max Mana: 577.5"
            },
            "super": {
                "damage": "28431",
                "health": "26244",
                "reload": "1.8s",
                "special": "Mana/s: 16.8",
                "special2": "Base Max Mana: 660"
            },
            "unique": {
                "damage": "85293",
                "health": "78732",
                "reload": "1.8s",
                "special": "Mana/s: 18.9",
                "special2": "Base Max Mana: 742.5"
            },
            "eternal": {
                "damage": "85293",
                "health": "78732",
                "reload": "1.8s",
                "special": "Mana/s: 18.9",
                "special2": "Base Max Mana: 742.5"
            }
        }
    },
    "magic_missile": {
        "desc": "You can actually shoot this one... with magic.",
        "stats": {
            "common": {
                "damage": "25",
                "health": "2",
                "reload": "5.4s"
            },
            "unusual": {
                "damage": "75",
                "health": "6",
                "reload": "10.8s"
            },
            "rare": {
                "damage": "225",
                "health": "18",
                "reload": "21.6s"
            },
            "epic": {
                "damage": "675",
                "health": "54",
                "reload": "43.2s"
            },
            "legendary": {
                "damage": "2025",
                "health": "162",
                "reload": "86.4s"
            },
            "mythic": {
                "damage": "6075",
                "health": "486",
                "reload": "172.8s"
            },
            "ultra": {
                "damage": "18225",
                "health": "1458",
                "reload": "345.6s"
            },
            "super": {
                "damage": "54675",
                "health": "4374",
                "reload": "691.2s"
            },
            "unique": {
                "damage": "164025",
                "health": "13122",
                "reload": "1382.4s"
            },
            "eternal": {
                "damage": "164025",
                "health": "13122",
                "reload": "1382.4s"
            }
        }
    },
    "magic_stick": {
        "desc": "A mysterious stick that summons the forces of the wind... with magic.",
        "stats": {
            "common": {
                "damage": "1",
                "health": "10",
                "reload": "4s",
                "special": "Spawn: Sandstorm (Common)",
                "special2": "Spawn Cost (mana): 23",
                "special3": "Maint. Cost (mana/s): 1.5"
            },
            "unusual": {
                "damage": "3",
                "health": "30",
                "reload": "4s",
                "special": "Spawn: Sandstorm (Unusual)",
                "special2": "Spawn Cost (mana): 46",
                "special3": "Maint. Cost (mana/s): 3"
            },
            "rare": {
                "damage": "9",
                "health": "90",
                "reload": "4s",
                "special": "Spawn: Sandstorm (Rare)",
                "special2": "Spawn Cost (mana): 92",
                "special3": "Maint. Cost (mana/s): 6"
            },
            "epic": {
                "damage": "27",
                "health": "270",
                "reload": "4s",
                "special": "Spawn: Sandstorm (Rare)",
                "special2": "Spawn Cost (mana): 184",
                "special3": "Maint. Cost (mana/s): 12"
            },
            "legendary": {
                "damage": "81",
                "health": "810",
                "reload": "4s",
                "special": "Spawn: Sandstorm (Epic)",
                "special2": "Spawn Cost (mana): 368",
                "special3": "Maint. Cost (mana/s): 24"
            },
            "mythic": {
                "damage": "243",
                "health": "2430",
                "reload": "4s",
                "special": "Spawn: Sandstorm (Legendary)",
                "special2": "Spawn Cost (mana): 736",
                "special3": "Maint. Cost (mana/s): 48"
            },
            "ultra": {
                "damage": "729",
                "health": "7290",
                "reload": "4s",
                "special": "Spawn: Sandstorm (Mythic)",
                "special2": "Spawn Cost (mana): 1472",
                "special3": "Maint. Cost (mana/s): 96"
            },
            "super": {
                "damage": "2187",
                "health": "21870",
                "reload": "4s",
                "special": "Spawn: Sandstorm (Ultra)",
                "special2": "Spawn Cost (mana): 2944",
                "special3": "Maint. Cost (mana/s): 192"
            },
            "unique": {
                "damage": "6561",
                "health": "65610",
                "reload": "4s",
                "special": "Spawn: Sandstorm (Ultra)",
                "special2": "Spawn Cost (mana): 5888",
                "special3": "Maint. Cost (mana/s): 384"
            },
            "eternal": {
                "damage": "6561",
                "health": "65610",
                "reload": "4s",
                "special": "Spawn: Sandstorm (Ultra)",
                "special2": "Spawn Cost (mana): 5888",
                "special3": "Maint. Cost (mana/s): 384"
            }
        }
    },
    "magic_stinger": {
        "desc": "It really hurts, but it's very fragile.",
        "stats": {
            "common": {
                "damage": "250",
                "health": "1",
                "reload": "27s"
            },
            "unusual": {
                "damage": "750",
                "health": "3",
                "reload": "54s"
            },
            "rare": {
                "damage": "2250",
                "health": "9",
                "reload": "108s"
            },
            "epic": {
                "damage": "6750",
                "health": "27",
                "reload": "216s"
            },
            "legendary": {
                "damage": "20250",
                "health": "81",
                "reload": "432s"
            },
            "mythic": {
                "damage": "60750",
                "health": "243",
                "reload": "864s"
            },
            "ultra": {
                "damage": "182250",
                "health": "729",
                "reload": "1728s"
            },
            "super": {
                "damage": "546750",
                "health": "2187",
                "reload": "3456s"
            },
            "unique": {
                "damage": "1640250",
                "health": "6561",
                "reload": "6912s"
            },
            "eternal": {
                "damage": "1640250",
                "health": "6561",
                "reload": "6912s"
            }
        }
    },
    "magnet": {
        "desc": "Increases drop pick up range.",
        "stats": {
            "common": {
                "damage": "1",
                "health": "30",
                "reload": "1.5s",
                "special": "Pickup Range: -120"
            },
            "unusual": {
                "damage": "3",
                "health": "90",
                "reload": "1.5s",
                "special": "Pickup Range: 60"
            },
            "rare": {
                "damage": "9",
                "health": "270",
                "reload": "1.5s",
                "special": "Pickup Range: 240"
            },
            "epic": {
                "damage": "27",
                "health": "810",
                "reload": "1.5s",
                "special": "Pickup Range: 420"
            },
            "legendary": {
                "damage": "81",
                "health": "2430",
                "reload": "1.5s",
                "special": "Pickup Range: 600"
            },
            "mythic": {
                "damage": "243",
                "health": "7290",
                "reload": "1.5s",
                "special": "Pickup Range: 780"
            },
            "ultra": {
                "damage": "729",
                "health": "21870",
                "reload": "1.5s",
                "special": "Pickup Range: 960"
            },
            "super": {
                "damage": "2187",
                "health": "65610",
                "reload": "1.5s",
                "special": "Pickup Range: 1140"
            },
            "unique": {
                "damage": "6561",
                "health": "196830",
                "reload": "1.5s",
                "special": "Pickup Range: 1320"
            },
            "eternal": {
                "damage": "6561",
                "health": "196830",
                "reload": "1.5s",
                "special": "Pickup Range: 1320"
            }
        }
    },
    "mark": {
        "desc": "A dark mark that binds itself to a fallen soul.",
        "stats": {
            "common": {
                "damage": "0",
                "health": "10",
                "reload": "1s",
                "usage_reload": "960s"
            },
            "unusual": {
                "damage": "0",
                "health": "30",
                "reload": "1s",
                "usage_reload": "480s"
            },
            "rare": {
                "damage": "0",
                "health": "90",
                "reload": "1s",
                "usage_reload": "240s"
            },
            "epic": {
                "damage": "0",
                "health": "270",
                "reload": "1s",
                "usage_reload": "120s"
            },
            "legendary": {
                "damage": "0",
                "health": "810",
                "reload": "1s",
                "usage_reload": "60s"
            },
            "mythic": {
                "damage": "0",
                "health": "2430",
                "reload": "1s",
                "usage_reload": "30s"
            },
            "ultra": {
                "damage": "0",
                "health": "7290",
                "reload": "1s",
                "usage_reload": "10s"
            },
            "super": {
                "damage": "0",
                "health": "21870",
                "reload": "1s",
                "usage_reload": "4s"
            },
            "unique": {
                "damage": "0",
                "health": "65610",
                "reload": "1s",
                "usage_reload": "4s"
            },
            "eternal": {
                "damage": "0",
                "health": "65610",
                "reload": "1s",
                "usage_reload": "4s"
            }
        }
    },
    "mecha_antennae": {
        "desc": "Allows your flower to sense foes farther away.<br>Allows Mecha Missiles of the same rarity to home.",
        "stats": {
            "common": {
                "special": "Extra Vision: 7.8%",
                "special2": "Mecha Missile Homing: Common"
            },
            "unusual": {
                "special": "Extra Vision: 12.4%",
                "special2": "Mecha Missile Homing: Unusual"
            },
            "rare": {
                "special": "Extra Vision: 17.5%",
                "special2": "Mecha Missile Homing: Rare"
            },
            "epic": {
                "special": "Extra Vision: 23.3%",
                "special2": "Mecha Missile Homing: Epic"
            },
            "legendary": {
                "special": "Extra Vision: 30.0%",
                "special2": "Mecha Missile Homing: Legendary"
            },
            "mythic": {
                "special": "Extra Vision: 70.0%",
                "special2": "Mecha Missile Homing: Mythic"
            },
            "ultra": {
                "special": "Extra Vision: 130.0%",
                "special2": "Mecha Missile Homing: Ultra"
            },
            "super": {
                "special": "Extra Vision: 280.0%",
                "special2": "Mecha Missile Homing: Super"
            },
            "unique": {
                "special": "Extra Vision: 630.0%",
                "special2": "Mecha Missile Homing: Unique"
            },
            "eternal": {
                "special": "Extra Vision: 630.0%",
                "special2": "Mecha Missile Homing: Unique"
            }
        }
    },
    "mecha_missile": {
        "desc": "Locked on.",
        "stats": {
            "common": {
                "damage": "25",
                "health": "2",
                "reload": "1.5s"
            },
            "unusual": {
                "damage": "75",
                "health": "6",
                "reload": "1.5s"
            },
            "rare": {
                "damage": "225",
                "health": "18",
                "reload": "1.5s"
            },
            "epic": {
                "damage": "675",
                "health": "54",
                "reload": "1.5s"
            },
            "legendary": {
                "damage": "2025",
                "health": "162",
                "reload": "1.5s"
            },
            "mythic": {
                "damage": "6075",
                "health": "486",
                "reload": "1.5s"
            },
            "ultra": {
                "damage": "18225",
                "health": "1458",
                "reload": "1.5s"
            },
            "super": {
                "damage": "54675",
                "health": "4374",
                "reload": "1.5s"
            },
            "unique": {
                "damage": "164025",
                "health": "13122",
                "reload": "1.5s"
            },
            "eternal": {
                "damage": "164025",
                "health": "13122",
                "reload": "1.5s"
            }
        }
    },
    "mimic": {
        "desc": "Copies the petal to the left of this, with the same rarity as this.",
        "stats": {
            "common": {},
            "unusual": {},
            "rare": {},
            "epic": {},
            "legendary": {},
            "mythic": {},
            "ultra": {},
            "super": {},
            "unique": {},
            "eternal": {}
        }
    },
    "missile": {
        "desc": "You can actually shoot this one.",
        "stats": {
            "common": {
                "damage": "25",
                "health": "2",
                "reload": "1.5s"
            },
            "unusual": {
                "damage": "75",
                "health": "6",
                "reload": "1.5s"
            },
            "rare": {
                "damage": "225",
                "health": "18",
                "reload": "1.5s"
            },
            "epic": {
                "damage": "675",
                "health": "54",
                "reload": "1.5s"
            },
            "legendary": {
                "damage": "2025",
                "health": "162",
                "reload": "1.5s"
            },
            "mythic": {
                "damage": "6075",
                "health": "486",
                "reload": "1.5s"
            },
            "ultra": {
                "damage": "18225",
                "health": "1458",
                "reload": "1.5s"
            },
            "super": {
                "damage": "54675",
                "health": "4374",
                "reload": "1.5s"
            },
            "unique": {
                "damage": "164025",
                "health": "13122",
                "reload": "1.5s"
            },
            "eternal": {
                "damage": "164025",
                "health": "13122",
                "reload": "1.5s"
            }
        }
    },
    "mjolnir": {
        "desc": {
            "default": "Perhaps this could be used to forge something great?",
            "unique": "Only the most powerful hammer in the universe."
        },
        "stats": {
            "common": {
                "damage": "1",
                "health": "1",
                "reload": "10s"
            },
            "unusual": {
                "damage": "3",
                "health": "3",
                "reload": "10s"
            },
            "rare": {
                "damage": "9",
                "health": "9",
                "reload": "10s"
            },
            "epic": {
                "damage": "27",
                "health": "27",
                "reload": "10s"
            },
            "legendary": {
                "damage": "81",
                "health": "81",
                "reload": "10s"
            },
            "mythic": {
                "damage": "243",
                "health": "243",
                "reload": "10s"
            },
            "ultra": {
                "damage": "729",
                "health": "729",
                "reload": "10s"
            },
            "super": {
                "damage": "729",
                "health": "729",
                "reload": "10s"
            },
            "unique": {
                "damage": "2187",
                "health": "328050",
                "reload": "10s",
                "special": "Lightning (unique): 196830"
            },
            "eternal": {
                "damage": "6561",
                "health": "328050",
                "reload": "10s",
                "special": "Lightning (unique): 196830"
            }
        }
    },
    "moon": {
        "desc": "This thing is so big your petals orbit it instead.<br>Where did you find this anyway?",
        "stats": {
            "common": {
                "damage": "5",
                "health": "5000",
                "reload": "60s"
            },
            "unusual": {
                "damage": "15",
                "health": "15000",
                "reload": "60s"
            },
            "rare": {
                "damage": "45",
                "health": "45000",
                "reload": "60s"
            },
            "epic": {
                "damage": "135",
                "health": "135000",
                "reload": "60s"
            },
            "legendary": {
                "damage": "405",
                "health": "405000",
                "reload": "60s"
            },
            "mythic": {
                "damage": "1215",
                "health": "1215000",
                "reload": "60s"
            },
            "ultra": {
                "damage": "3645",
                "health": "3645000",
                "reload": "60s"
            },
            "super": {
                "damage": "10935",
                "health": "10935000",
                "reload": "60s"
            },
            "unique": {
                "damage": "32805",
                "health": "32805000",
                "reload": "60s"
            },
            "eternal": {
                "damage": "32805",
                "health": "32805000",
                "reload": "60s"
            }
        }
    },
    "nazar": {
        "desc": "Reduces incoming damage by 98% and consumes a charge.",
        "stats": {
            "common": {
                "reload": "60s",
                "special": "Charges: 3",
                "special2": "Damage Reduction: 98%"
            },
            "unusual": {
                "reload": "42s",
                "special": "Charges: 3",
                "special2": "Damage Reduction: 98%"
            },
            "rare": {
                "reload": "29.4s",
                "special": "Charges: 3",
                "special2": "Damage Reduction: 98%"
            },
            "epic": {
                "reload": "20.58s",
                "special": "Charges: 3",
                "special2": "Damage Reduction: 98%"
            },
            "legendary": {
                "reload": "14.406s",
                "special": "Charges: 3",
                "special2": "Damage Reduction: 98%"
            },
            "mythic": {
                "reload": "10.08s",
                "special": "Charges: 3",
                "special2": "Damage Reduction: 98%"
            },
            "ultra": {
                "reload": "7.06s",
                "special": "Charges: 3",
                "special2": "Damage Reduction: 98%"
            },
            "super": {
                "reload": "4.94s",
                "special": "Charges: 3",
                "special2": "Damage Reduction: 98%"
            },
            "unique": {
                "reload": "3.46s",
                "special": "Charges: 3",
                "special2": "Damage Reduction: 98%"
            },
            "eternal": {
                "reload": "3.46s",
                "special": "Charges: 3",
                "special2": "Damage Reduction: 98%"
            }
        }
    },
    "orange": {
        "desc": "A sweet citrus fruit.",
        "stats": {
            "common": {
                "damage": "6.7",
                "health": "6.7",
                "reload": "3.5s"
            },
            "unusual": {
                "damage": "20",
                "health": "20",
                "reload": "3.5s"
            },
            "rare": {
                "damage": "60",
                "health": "60",
                "reload": "3.5s"
            },
            "epic": {
                "damage": "180",
                "health": "180",
                "reload": "3.5s"
            },
            "legendary": {
                "damage": "540",
                "health": "540",
                "reload": "3.5s"
            },
            "mythic": {
                "damage": "1620",
                "health": "1620",
                "reload": "3.5s"
            },
            "ultra": {
                "damage": "4860",
                "health": "4860",
                "reload": "3.5s"
            },
            "super": {
                "damage": "14580",
                "health": "14580",
                "reload": "3.5s"
            },
            "unique": {
                "damage": "43740",
                "health": "43740",
                "reload": "3.5s"
            },
            "eternal": {
                "damage": "43740",
                "health": "43740",
                "reload": "3.5s"
            }
        }
    },
    "orb": {
        "desc": "Creates mana. Allows finding magic petals.",
        "stats": {
            "common": {
                "damage": "0",
                "health": "25",
                "reload": "2.5s",
                "special": "Mana: 8",
                "special2": "Base Max Mana: 82.5"
            },
            "unusual": {
                "damage": "0",
                "health": "75",
                "reload": "2.5s",
                "special": "Mana: 17",
                "special2": "Base Max Mana: 165"
            },
            "rare": {
                "damage": "0",
                "health": "225",
                "reload": "2.5s",
                "special": "Mana: 33",
                "special2": "Base Max Mana: 330"
            },
            "epic": {
                "damage": "0",
                "health": "675",
                "reload": "2.5s",
                "special": "Mana: 66",
                "special2": "Base Max Mana: 660"
            },
            "legendary": {
                "damage": "0",
                "health": "2025",
                "reload": "2.5s",
                "special": "Mana: 132",
                "special2": "Base Max Mana: 1320"
            },
            "mythic": {
                "damage": "0",
                "health": "6075",
                "reload": "2.5s",
                "special": "Mana: 264",
                "special2": "Base Max Mana: 2640"
            },
            "ultra": {
                "damage": "0",
                "health": "18225",
                "reload": "2.5s",
                "special": "Mana: 528",
                "special2": "Base Max Mana: 5280"
            },
            "super": {
                "damage": "0",
                "health": "54675",
                "reload": "2.5s",
                "special": "Mana: 1056",
                "special2": "Base Max Mana: 10560"
            },
            "unique": {
                "damage": "0",
                "health": "164025",
                "reload": "2.5s",
                "special": "Mana: 2112",
                "special2": "Base Max Mana: 21120"
            },
            "eternal": {
                "damage": "0",
                "health": "164025",
                "reload": "2.5s",
                "special": "Mana: 2112",
                "special2": "Base Max Mana: 21120"
            }
        }
    },
    "pearl": {
        "desc": "Just drop it off somewhere and use your kinetic powers.",
        "stats": {
            "common": {
                "damage": "15",
                "health": "50",
                "reload": "4s"
            },
            "unusual": {
                "damage": "45",
                "health": "150",
                "reload": "4s"
            },
            "rare": {
                "damage": "135",
                "health": "450",
                "reload": "4s"
            },
            "epic": {
                "damage": "405",
                "health": "1350",
                "reload": "4s"
            },
            "legendary": {
                "damage": "1215",
                "health": "4050",
                "reload": "4s"
            },
            "mythic": {
                "damage": "3645",
                "health": "12150",
                "reload": "4s"
            },
            "ultra": {
                "damage": "10935",
                "health": "36450",
                "reload": "4s"
            },
            "super": {
                "damage": "32805",
                "health": "109350",
                "reload": "4s"
            },
            "unique": {
                "damage": "98415",
                "health": "328050",
                "reload": "4s"
            },
            "eternal": {
                "damage": "98415",
                "health": "328050",
                "reload": "4s"
            }
        }
    },
    "peas": {
        "desc": "It goes poof.",
        "stats": {
            "common": {
                "damage": "13",
                "health": "5",
                "reload": "1.5s"
            },
            "unusual": {
                "damage": "39",
                "health": "15",
                "reload": "1.5s"
            },
            "rare": {
                "damage": "117",
                "health": "45",
                "reload": "1.5s"
            },
            "epic": {
                "damage": "351",
                "health": "135",
                "reload": "1.5s"
            },
            "legendary": {
                "damage": "1053",
                "health": "405",
                "reload": "1.5s"
            },
            "mythic": {
                "damage": "3159",
                "health": "1215",
                "reload": "1.5s"
            },
            "ultra": {
                "damage": "9477",
                "health": "3645",
                "reload": "1.5s"
            },
            "super": {
                "damage": "28431",
                "health": "10935",
                "reload": "1.5s"
            },
            "unique": {
                "damage": "85293",
                "health": "32805",
                "reload": "1.5s"
            },
            "eternal": {
                "damage": "85293",
                "health": "32805",
                "reload": "1.5s"
            }
        }
    },
    "pharaoh_crown": {
        "desc": "Spawns Undead Beetles to fight at your side.",
        "stats": {
            "common": {
                "reload": "2s",
                "special": "Spawn Rarity: Mythic",
                "special2": "Lifespan: 7s"
            },
            "unusual": {
                "reload": "2s",
                "special": "Spawn Rarity: Mythic",
                "special2": "Lifespan: 7s"
            },
            "rare": {
                "reload": "2s",
                "special": "Spawn Rarity: Mythic",
                "special2": "Lifespan: 7s"
            },
            "epic": {
                "reload": "2s",
                "special": "Spawn Rarity: Mythic",
                "special2": "Lifespan: 7s"
            },
            "legendary": {
                "reload": "2s",
                "special": "Spawn Rarity: Mythic",
                "special2": "Lifespan: 7s"
            },
            "mythic": {
                "reload": "2s",
                "special": "Spawn Rarity: Mythic",
                "special2": "Lifespan: 7s"
            },
            "ultra": {
                "reload": "2s",
                "special": "Spawn Rarity: Mythic",
                "special2": "Lifespan: 7s"
            },
            "super": {
                "reload": "2s",
                "special": "Spawn Rarity: Mythic",
                "special2": "Lifespan: 7s"
            },
            "unique": {
                "reload": "2s",
                "special": "Spawn Rarity: Mythic",
                "special2": "Lifespan: 7s"
            },
            "eternal": {
                "reload": "2s",
                "special": "Spawn Rarity: Mythic",
                "special2": "Lifespan: 7s"
            }
        }
    },
    "pincer": {
        "desc": "Debilitates enemies temporarily, reducing their movement speed.",
        "stats": {
            "common": {
                "damage": "5",
                "health": "5",
                "reload": "2.5s",
                "special": "Poison: 15",
                "special2": "Poison DPS: 19",
                "special3": "Slow Duration: 0.8s"
            },
            "unusual": {
                "damage": "15",
                "health": "15",
                "reload": "2.5s",
                "special": "Poison: 45",
                "special2": "Poison DPS: 56",
                "special3": "Slow Duration: 0.8s"
            },
            "rare": {
                "damage": "45",
                "health": "45",
                "reload": "2.5s",
                "special": "Poison: 135",
                "special2": "Poison DPS: 169",
                "special3": "Slow Duration: 0.8s"
            },
            "epic": {
                "damage": "135",
                "health": "135",
                "reload": "2.5s",
                "special": "Poison: 405",
                "special2": "Poison DPS: 506",
                "special3": "Slow Duration: 0.8s"
            },
            "legendary": {
                "damage": "405",
                "health": "405",
                "reload": "2.5s",
                "special": "Poison: 1215",
                "special2": "Poison DPS: 1519",
                "special3": "Slow Duration: 0.8s"
            },
            "mythic": {
                "damage": "1215",
                "health": "1215",
                "reload": "2.5s",
                "special": "Poison: 3645",
                "special2": "Poison DPS: 4556",
                "special3": "Slow Duration: 0.8s"
            },
            "ultra": {
                "damage": "3645",
                "health": "3645",
                "reload": "2.5s",
                "special": "Poison: 10935",
                "special2": "Poison DPS: 13669",
                "special3": "Slow Duration: 0.8s"
            },
            "super": {
                "damage": "10935",
                "health": "10935",
                "reload": "2.5s",
                "special": "Poison: 32805",
                "special2": "Poison DPS: 41006",
                "special3": "Slow Duration: 0.8s"
            },
            "unique": {
                "damage": "32805",
                "health": "32805",
                "reload": "2.5s",
                "special": "Poison: 98415",
                "special2": "Poison DPS: 123019",
                "special3": "Slow Duration: 0.8s"
            },
            "eternal": {
                "damage": "32805",
                "health": "32805",
                "reload": "2.5s",
                "special": "Poison: 98415",
                "special2": "Poison DPS: 123019",
                "special3": "Slow Duration: 0.8s"
            }
        }
    },
    "plank": {
        "desc": "Does 20x damage vs projectiles and petals.",
        "stats": {
            "common": {
                "damage": "10",
                "health": "15",
                "reload": "2.5s",
                "special": "Dmg vs Projectiles (20x): 200"
            },
            "unusual": {
                "damage": "30",
                "health": "45",
                "reload": "2.5s",
                "special": "Dmg vs Projectiles (20x): 600"
            },
            "rare": {
                "damage": "90",
                "health": "135",
                "reload": "2.5s",
                "special": "Dmg vs Projectiles (20x): 1800"
            },
            "epic": {
                "damage": "270",
                "health": "405",
                "reload": "2.5s",
                "special": "Dmg vs Projectiles (20x): 5400"
            },
            "legendary": {
                "damage": "810",
                "health": "1215",
                "reload": "2.5s",
                "special": "Dmg vs Projectiles (20x): 16200"
            },
            "mythic": {
                "damage": "2430",
                "health": "3645",
                "reload": "2.5s",
                "special": "Dmg vs Projectiles (20x): 48600"
            },
            "ultra": {
                "damage": "7290",
                "health": "10935",
                "reload": "2.5s",
                "special": "Dmg vs Projectiles (20x): 145800"
            },
            "super": {
                "damage": "21870",
                "health": "32805",
                "reload": "2.5s",
                "special": "Dmg vs Projectiles (20x): 437400"
            },
            "unique": {
                "damage": "65610",
                "health": "98415",
                "reload": "2.5s",
                "special": "Dmg vs Projectiles (20x): 1312200"
            },
            "eternal": {
                "damage": "65610",
                "health": "98415",
                "reload": "2.5s",
                "special": "Dmg vs Projectiles (20x): 1312200"
            }
        }
    },
    "pollen": {
        "desc": "Asthmatics beware.",
        "stats": {
            "common": {
                "damage": "19",
                "health": "5",
                "reload": "1s"
            },
            "unusual": {
                "damage": "57",
                "health": "15",
                "reload": "1s"
            },
            "rare": {
                "damage": "171",
                "health": "45",
                "reload": "1s"
            },
            "epic": {
                "damage": "513",
                "health": "135",
                "reload": "1s"
            },
            "legendary": {
                "damage": "1539",
                "health": "405",
                "reload": "1s"
            },
            "mythic": {
                "damage": "4617",
                "health": "1215",
                "reload": "1s"
            },
            "ultra": {
                "damage": "13851",
                "health": "3645",
                "reload": "1s"
            },
            "super": {
                "damage": "41553",
                "health": "10935",
                "reload": "1s"
            },
            "unique": {
                "damage": "124659",
                "health": "32805",
                "reload": "1s"
            },
            "eternal": {
                "damage": "124659",
                "health": "32805",
                "reload": "1s"
            }
        }
    },
    "poo": {
        "desc": "Makes mobs less likely to want to attack you.",
        "stats": {
            "common": {
                "damage": "5",
                "health": "5",
                "reload": "2.5s",
                "special": "Mob Aggro Range: -20.0%"
            },
            "unusual": {
                "damage": "15",
                "health": "15",
                "reload": "2.5s",
                "special": "Mob Aggro Range: -36.0%"
            },
            "rare": {
                "damage": "45",
                "health": "45",
                "reload": "2.5s",
                "special": "Mob Aggro Range: -48.8%"
            },
            "epic": {
                "damage": "135",
                "health": "135",
                "reload": "2.5s",
                "special": "Mob Aggro Range: -59.0%"
            },
            "legendary": {
                "damage": "405",
                "health": "405",
                "reload": "2.5s",
                "special": "Mob Aggro Range: -67.2%"
            },
            "mythic": {
                "damage": "1215",
                "health": "1215",
                "reload": "2.5s",
                "special": "Mob Aggro Range: -73.8%"
            },
            "ultra": {
                "damage": "3645",
                "health": "3645",
                "reload": "2.5s",
                "special": "Mob Aggro Range: -79.0%"
            },
            "super": {
                "damage": "10935",
                "health": "10935",
                "reload": "2.5s",
                "special": "Mob Aggro Range: -83.2%"
            },
            "unique": {
                "damage": "32805",
                "health": "32805",
                "reload": "2.5s",
                "special": "Mob Aggro Range: -86.6%"
            },
            "eternal": {
                "damage": "32805",
                "health": "32805",
                "reload": "2.5s",
                "special": "Mob Aggro Range: -86.6%"
            }
        }
    },
    "powder": {
        "desc": "Increases movement speed.<br>Disabled if flower takes damage or if near a high rarity mob.",
        "stats": {
            "common": {
                "damage": "0",
                "health": "10",
                "reload": "4s",
                "special": "Movement Speed: 25%",
                "special2": "Max Mob Rarity: Common"
            },
            "unusual": {
                "damage": "0",
                "health": "30",
                "reload": "4s",
                "special": "Movement Speed: 50%",
                "special2": "Max Mob Rarity: Common"
            },
            "rare": {
                "damage": "0",
                "health": "90",
                "reload": "4s",
                "special": "Movement Speed: 75%",
                "special2": "Max Mob Rarity: Common"
            },
            "epic": {
                "damage": "0",
                "health": "270",
                "reload": "4s",
                "special": "Movement Speed: 100%",
                "special2": "Max Mob Rarity: Unusual"
            },
            "legendary": {
                "damage": "0",
                "health": "810",
                "reload": "4s",
                "special": "Movement Speed: 125%",
                "special2": "Max Mob Rarity: Rare"
            },
            "mythic": {
                "damage": "0",
                "health": "2430",
                "reload": "4s",
                "special": "Movement Speed: 150%",
                "special2": "Max Mob Rarity: Epic"
            },
            "ultra": {
                "damage": "0",
                "health": "7290",
                "reload": "4s",
                "special": "Movement Speed: 175%",
                "special2": "Max Mob Rarity: Legendary"
            },
            "super": {
                "damage": "0",
                "health": "21870",
                "reload": "4s",
                "special": "Movement Speed: 200%",
                "special2": "Max Mob Rarity: Mythic"
            },
            "unique": {
                "damage": "0",
                "health": "65610",
                "reload": "4s",
                "special": "Movement Speed: 225%",
                "special2": "Max Mob Rarity: Mythic"
            },
            "eternal": {
                "damage": "0",
                "health": "65610",
                "reload": "4s",
                "special": "Movement Speed: 225%",
                "special2": "Max Mob Rarity: Mythic"
            }
        }
    },
    "privet": {
        "desc": "Deals extra Poison damage based on the existing Poison DPS.",
        "stats": {
            "common": {
                "reload": "4s",
                "special": "Extra Poison (s): 0.2"
            },
            "unusual": {
                "reload": "2.8s",
                "special": "Extra Poison (s): 0.2"
            },
            "rare": {
                "reload": "1.96s",
                "special": "Extra Poison (s): 0.2"
            },
            "epic": {
                "reload": "1.37s",
                "special": "Extra Poison (s): 0.2"
            },
            "legendary": {
                "reload": "0.96s",
                "special": "Extra Poison (s): 0.2"
            },
            "mythic": {
                "reload": "0.67s",
                "special": "Extra Poison (s): 0.2"
            },
            "ultra": {
                "reload": "0.47s",
                "special": "Extra Poison (s): 0.2"
            },
            "super": {
                "reload": "0.33s",
                "special": "Extra Poison (s): 0.2"
            },
            "unique": {
                "reload": "0.23s",
                "special": "Extra Poison (s): 0.2"
            },
            "eternal": {
                "reload": "0.23s",
                "special": "Extra Poison (s): 0.2"
            }
        }
    },
    "relic": {
        "desc": "A strange relic. Significantly increases maximum health.<br>Damage taken is spread among other wearers.",
        "stats": {
            "common": {
                "special": "Flower Health: 10%"
            },
            "unusual": {
                "special": "Flower Health: 20%"
            },
            "rare": {
                "special": "Flower Health: 30%"
            },
            "epic": {
                "special": "Flower Health: 40%"
            },
            "legendary": {
                "special": "Flower Health: 50%"
            },
            "mythic": {
                "special": "Flower Health: 60%"
            },
            "ultra": {
                "special": "Flower Health: 70%"
            },
            "super": {
                "special": "Flower Health: 80%"
            },
            "unique": {
                "special": "Flower Health: 90%"
            },
            "eternal": {
                "special": "Flower Health: 90%"
            }
        }
    },
    "rice": {
        "desc": "Spawns very quickly, but not very strong.",
        "stats": {
            "common": {
                "damage": "4",
                "health": "1",
                "reload": "0.1s"
            },
            "unusual": {
                "damage": "12",
                "health": "3",
                "reload": "0.1s"
            },
            "rare": {
                "damage": "36",
                "health": "9",
                "reload": "0.1s"
            },
            "epic": {
                "damage": "108",
                "health": "27",
                "reload": "0.1s"
            },
            "legendary": {
                "damage": "324",
                "health": "81",
                "reload": "0.1s"
            },
            "mythic": {
                "damage": "972",
                "health": "243",
                "reload": "0.1s"
            },
            "ultra": {
                "damage": "2916",
                "health": "729",
                "reload": "0.1s"
            },
            "super": {
                "damage": "8748",
                "health": "2187",
                "reload": "0.1s"
            },
            "unique": {
                "damage": "26244",
                "health": "6561",
                "reload": "0.1s"
            },
            "eternal": {
                "damage": "26244",
                "health": "6561",
                "reload": "0.1s"
            }
        }
    },
    "rock": {
        "desc": "Extremely durable, but takes a bit longer to recharge.",
        "stats": {
            "common": {
                "damage": "15",
                "health": "45",
                "reload": "4s"
            },
            "unusual": {
                "damage": "45",
                "health": "135",
                "reload": "4s"
            },
            "rare": {
                "damage": "135",
                "health": "405",
                "reload": "4s"
            },
            "epic": {
                "damage": "405",
                "health": "1215",
                "reload": "4s"
            },
            "legendary": {
                "damage": "1215",
                "health": "3645",
                "reload": "4s"
            },
            "mythic": {
                "damage": "3645",
                "health": "10935",
                "reload": "4s"
            },
            "ultra": {
                "damage": "10935",
                "health": "32805",
                "reload": "4s"
            },
            "super": {
                "damage": "32805",
                "health": "98415",
                "reload": "4s"
            },
            "unique": {
                "damage": "98415",
                "health": "295245",
                "reload": "4s"
            },
            "eternal": {
                "damage": "98415",
                "health": "295245",
                "reload": "4s"
            }
        }
    },
    "root": {
        "desc": "Provides a layer of additional armor every interval while defending.",
        "stats": {
            "common": {
                "reload": "5s",
                "special": "Armor: 2.5"
            },
            "unusual": {
                "reload": "5s",
                "special": "Armor: 7.5"
            },
            "rare": {
                "reload": "5s",
                "special": "Armor: 22.5"
            },
            "epic": {
                "reload": "5s",
                "special": "Armor: 67.5"
            },
            "legendary": {
                "reload": "5s",
                "special": "Armor: 202.5"
            },
            "mythic": {
                "reload": "5s",
                "special": "Armor: 607.5"
            },
            "ultra": {
                "reload": "5s",
                "special": "Armor: 1052.2"
            },
            "super": {
                "reload": "5s",
                "special": "Armor: 1822.5"
            },
            "unique": {
                "reload": "5s",
                "special": "Armor: 3156.7"
            },
            "eternal": {
                "reload": "5s",
                "special": "Armor: 3156.7"
            }
        }
    },
    "rose": {
        "desc": "Its healing properties are amazing. Not so good at combat though.",
        "stats": {
            "common": {
                "damage": "5",
                "health": "5",
                "reload": "3.5s",
                "special": "Heal: 8"
            },
            "unusual": {
                "damage": "15",
                "health": "15",
                "reload": "3.5s",
                "special": "Heal: 23"
            },
            "rare": {
                "damage": "45",
                "health": "45",
                "reload": "3.5s",
                "special": "Heal: 68"
            },
            "epic": {
                "damage": "135",
                "health": "135",
                "reload": "3.5s",
                "special": "Heal: 203"
            },
            "legendary": {
                "damage": "405",
                "health": "405",
                "reload": "3.5s",
                "special": "Heal: 608"
            },
            "mythic": {
                "damage": "1215",
                "health": "1215",
                "reload": "3.5s",
                "special": "Heal: 1823"
            },
            "ultra": {
                "damage": "3645",
                "health": "3645",
                "reload": "3.5s",
                "special": "Heal: 3157"
            },
            "super": {
                "damage": "10935",
                "health": "10935",
                "reload": "3.5s",
                "special": "Heal: 5468"
            },
            "unique": {
                "damage": "32805",
                "health": "32805",
                "reload": "3.5s",
                "special": "Heal: 9470"
            },
            "eternal": {
                "damage": "32805",
                "health": "32805",
                "reload": "3.5s",
                "special": "Heal: 9470"
            }
        }
    },
    "rubber": {
        "desc": "Increases knockback received. Also absorbs lightning damage dealt to the flower.",
        "stats": {
            "common": {
                "damage": "1",
                "health": "30",
                "reload": "2.5s",
                "special": "Knockback: 0.3"
            },
            "unusual": {
                "damage": "3",
                "health": "90",
                "reload": "2.5s",
                "special": "Knockback: 0.6"
            },
            "rare": {
                "damage": "9",
                "health": "270",
                "reload": "2.5s",
                "special": "Knockback: 0.9"
            },
            "epic": {
                "damage": "27",
                "health": "810",
                "reload": "2.5s",
                "special": "Knockback: 1.2"
            },
            "legendary": {
                "damage": "81",
                "health": "2430",
                "reload": "2.5s",
                "special": "Knockback: 1.5"
            },
            "mythic": {
                "damage": "243",
                "health": "7290",
                "reload": "2.5s",
                "special": "Knockback: 1.8"
            },
            "ultra": {
                "damage": "729",
                "health": "21870",
                "reload": "2.5s",
                "special": "Knockback: 2.1"
            },
            "super": {
                "damage": "2187",
                "health": "65610",
                "reload": "2.5s",
                "special": "Knockback: 2.4"
            },
            "unique": {
                "damage": "6561",
                "health": "196830",
                "reload": "2.5s",
                "special": "Knockback: 2.7"
            },
            "eternal": {
                "damage": "6561",
                "health": "196830",
                "reload": "2.5s",
                "special": "Knockback: 2.7"
            }
        }
    },
    "salt": {
        "desc": "Reflects some of the damage you take back to the enemy that dealt it.",
        "stats": {
            "common": {
                "damage": "10",
                "health": "10",
                "reload": "2.5s",
                "special": "Damage Reflection: 50% (same rarity)"
            },
            "unusual": {
                "damage": "30",
                "health": "30",
                "reload": "2.5s",
                "special": "Damage Reflection: 50% (same rarity)"
            },
            "rare": {
                "damage": "90",
                "health": "90",
                "reload": "2.5s",
                "special": "Damage Reflection: 50% (same rarity)"
            },
            "epic": {
                "damage": "270",
                "health": "270",
                "reload": "2.5s",
                "special": "Damage Reflection: 50% (same rarity)"
            },
            "legendary": {
                "damage": "810",
                "health": "810",
                "reload": "2.5s",
                "special": "Damage Reflection: 50% (same rarity)"
            },
            "mythic": {
                "damage": "2430",
                "health": "2430",
                "reload": "2.5s",
                "special": "Damage Reflection: 50% (same rarity)"
            },
            "ultra": {
                "damage": "7290",
                "health": "7290",
                "reload": "2.5s",
                "special": "Damage Reflection: 50% (same rarity)"
            },
            "super": {
                "damage": "21870",
                "health": "21870",
                "reload": "2.5s",
                "special": "Damage Reflection: 50% (same rarity)"
            },
            "unique": {
                "damage": "65610",
                "health": "65610",
                "reload": "2.5s",
                "special": "Damage Reflection: 50% (same rarity)"
            },
            "eternal": {
                "damage": "65610",
                "health": "65610",
                "reload": "2.5s",
                "special": "Damage Reflection: 50% (same rarity)"
            }
        }
    },
    "sand": {
        "desc": "A bunch of sand particles.",
        "stats": {
            "common": {
                "damage": "5",
                "health": "1.2",
                "reload": "1.5s"
            },
            "unusual": {
                "damage": "15",
                "health": "3.8",
                "reload": "1.5s"
            },
            "rare": {
                "damage": "45",
                "health": "11.3",
                "reload": "1.5s"
            },
            "epic": {
                "damage": "135",
                "health": "33.8",
                "reload": "1.5s"
            },
            "legendary": {
                "damage": "405",
                "health": "101.3",
                "reload": "1.5s"
            },
            "mythic": {
                "damage": "1215",
                "health": "303.8",
                "reload": "1.5s"
            },
            "ultra": {
                "damage": "3645",
                "health": "911.3",
                "reload": "1.5s"
            },
            "super": {
                "damage": "10935",
                "health": "2733.8",
                "reload": "1.5s"
            },
            "unique": {
                "damage": "32805",
                "health": "8201.3",
                "reload": "1.5s"
            },
            "eternal": {
                "damage": "32805",
                "health": "8201.3",
                "reload": "1.5s"
            }
        }
    },
    "shell": {
        "desc": "Adds a temporary shield to yourself or allies.",
        "stats": {
            "common": {
                "damage": "5",
                "health": "25",
                "reload": "3.5s",
                "special": "Shield: 7"
            },
            "unusual": {
                "damage": "15",
                "health": "75",
                "reload": "3.5s",
                "special": "Shield: 21"
            },
            "rare": {
                "damage": "45",
                "health": "225",
                "reload": "3.5s",
                "special": "Shield: 63"
            },
            "epic": {
                "damage": "135",
                "health": "675",
                "reload": "3.5s",
                "special": "Shield: 189"
            },
            "legendary": {
                "damage": "405",
                "health": "2025",
                "reload": "3.5s",
                "special": "Shield: 567"
            },
            "mythic": {
                "damage": "1215",
                "health": "6075",
                "reload": "3.5s",
                "special": "Shield: 1701"
            },
            "ultra": {
                "damage": "3645",
                "health": "18225",
                "reload": "3.5s",
                "special": "Shield: 2946"
            },
            "super": {
                "damage": "10935",
                "health": "54675",
                "reload": "3.5s",
                "special": "Shield: 5103"
            },
            "unique": {
                "damage": "32805",
                "health": "164025",
                "reload": "3.5s",
                "special": "Shield: 8839"
            },
            "eternal": {
                "damage": "32805",
                "health": "164025",
                "reload": "3.5s",
                "special": "Shield: 8839"
            }
        }
    },
    "shovel": {
        "desc": "Becomes untargetable but unable to use petals for a limited time.",
        "stats": {
            "common": {
                "reload": "15s",
                "usage_reload": "2s"
            },
            "unusual": {
                "reload": "13.4s",
                "usage_reload": "2s"
            },
            "rare": {
                "reload": "11.8s",
                "usage_reload": "2s"
            },
            "epic": {
                "reload": "10.1s",
                "usage_reload": "2s"
            },
            "legendary": {
                "reload": "8.5s",
                "usage_reload": "2s"
            },
            "mythic": {
                "reload": "6.9s",
                "usage_reload": "2s"
            },
            "ultra": {
                "reload": "5.2s",
                "usage_reload": "2s"
            },
            "super": {
                "reload": "3.6s",
                "usage_reload": "2s"
            },
            "unique": {
                "reload": "2s",
                "usage_reload": "2s"
            },
            "eternal": {
                "reload": "2s",
                "usage_reload": "2s"
            }
        }
    },
    "soil": {
        "desc": "Increases health, but also increases flower size and decreases movement speed.",
        "stats": {
            "common": {
                "damage": "10",
                "health": "10",
                "reload": "2.5s",
                "special": "Flower Health: 50",
                "special2": "Extra Radius: 10"
            },
            "unusual": {
                "damage": "30",
                "health": "30",
                "reload": "2.5s",
                "special": "Flower Health: 150",
                "special2": "Extra Radius: 10"
            },
            "rare": {
                "damage": "90",
                "health": "90",
                "reload": "2.5s",
                "special": "Flower Health: 450",
                "special2": "Extra Radius: 10"
            },
            "epic": {
                "damage": "270",
                "health": "270",
                "reload": "2.5s",
                "special": "Flower Health: 1350",
                "special2": "Extra Radius: 10"
            },
            "legendary": {
                "damage": "810",
                "health": "810",
                "reload": "2.5s",
                "special": "Flower Health: 4050",
                "special2": "Extra Radius: 10"
            },
            "mythic": {
                "damage": "2430",
                "health": "2430",
                "reload": "2.5s",
                "special": "Flower Health: 12150",
                "special2": "Extra Radius: 10"
            },
            "ultra": {
                "damage": "7290",
                "health": "7290",
                "reload": "2.5s",
                "special": "Flower Health: 36450",
                "special2": "Extra Radius: 10"
            },
            "super": {
                "damage": "21870",
                "health": "21870",
                "reload": "2.5s",
                "special": "Flower Health: 109350",
                "special2": "Extra Radius: 10"
            },
            "unique": {
                "damage": "65610",
                "health": "65610",
                "reload": "2.5s",
                "special": "Flower Health: 328050",
                "special2": "Extra Radius: 10"
            },
            "eternal": {
                "damage": "65610",
                "health": "65610",
                "reload": "2.5s",
                "special": "Flower Health: 328050",
                "special2": "Extra Radius: 10"
            }
        }
    },
    "splitter": {
        "desc": {
            "default": "Fractures your soul into two.<br><br><span style='color:#aaa'>Select this petal again to control the other half.</span>",
            "eternal": "Fractures your soul into three.<br><br><span style='color:#aaa'>Select this petal again to control a different third.</span>",
            "unique": "Fractures your soul into three.<br><br><span style='color:#aaa'>Select this petal again to control a different third.</span>"
        }
    },
    "sponge": {
        "desc": "Spreads damage taken by the flower over a period of time.",
        "stats": {
            "common": {
                "reload": "2.5s",
                "special": "Period (sec): 4.5"
            },
            "unusual": {
                "reload": "2.5s",
                "special": "Period (sec): 8.4"
            },
            "rare": {
                "reload": "2.5s",
                "special": "Period (sec): 12.1"
            },
            "epic": {
                "reload": "2.5s",
                "special": "Period (sec): 15.7"
            },
            "legendary": {
                "reload": "2.5s",
                "special": "Period (sec): 19.2"
            },
            "mythic": {
                "reload": "2.5s",
                "special": "Period (sec): 22.6"
            },
            "ultra": {
                "reload": "2.5s",
                "special": "Period (sec): 25.9"
            },
            "super": {
                "reload": "2.5s",
                "special": "Period (sec): 29.2"
            },
            "unique": {
                "reload": "2.5s",
                "special": "Period (sec): 32.5"
            },
            "eternal": {
                "reload": "2.5s",
                "special": "Period (sec): 32.5"
            }
        }
    },
    "square": {
        "desc": "This shape... it looks familiar...",
        "stats": {
            "common": {
                "damage": "0",
                "health": "0",
                "reload": "60s"
            },
            "unusual": {
                "damage": "0",
                "health": "0",
                "reload": "60s"
            },
            "rare": {
                "damage": "0",
                "health": "0",
                "reload": "60s"
            },
            "epic": {
                "damage": "0",
                "health": "0",
                "reload": "60s"
            },
            "legendary": {
                "damage": "0",
                "health": "0",
                "reload": "60s"
            },
            "mythic": {
                "damage": "0",
                "health": "0",
                "reload": "60s"
            },
            "ultra": {
                "damage": "0",
                "health": "0",
                "reload": "120s"
            },
            "super": {
                "damage": "0",
                "health": "0",
                "reload": "600s"
            },
            "unique": {
                "damage": "0",
                "health": "0",
                "reload": "3600s"
            },
            "eternal": {
                "damage": "0",
                "health": "0",
                "reload": "3600s"
            }
        }
    },
    "starfish": {
        "desc": "Increases health regen while below 75% health.",
        "stats": {
            "common": {
                "damage": "5",
                "health": "7",
                "reload": "1.5s",
                "special": "Heal/s (<75% HP): 2"
            },
            "unusual": {
                "damage": "15",
                "health": "21",
                "reload": "1.5s",
                "special": "Heal/s (<75% HP): 7"
            },
            "rare": {
                "damage": "45",
                "health": "63",
                "reload": "1.5s",
                "special": "Heal/s (<75% HP): 20"
            },
            "epic": {
                "damage": "135",
                "health": "189",
                "reload": "1.5s",
                "special": "Heal/s (<75% HP): 61"
            },
            "legendary": {
                "damage": "405",
                "health": "567",
                "reload": "1.5s",
                "special": "Heal/s (<75% HP): 182"
            },
            "mythic": {
                "damage": "1215",
                "health": "1701",
                "reload": "1.5s",
                "special": "Heal/s (<75% HP): 547"
            },
            "ultra": {
                "damage": "3645",
                "health": "5103",
                "reload": "1.5s",
                "special": "Heal/s (<75% HP): 947"
            },
            "super": {
                "damage": "10935",
                "health": "15309",
                "reload": "1.5s",
                "special": "Heal/s (<75% HP): 1640"
            },
            "unique": {
                "damage": "32805",
                "health": "45927",
                "reload": "1.5s",
                "special": "Heal/s (<75% HP): 2841"
            },
            "eternal": {
                "damage": "32805",
                "health": "45927",
                "reload": "1.5s",
                "special": "Heal/s (<75% HP): 2841"
            }
        }
    },
    "stick": {
        "desc": "A mysterious stick that summons the forces of the wind.",
        "stats": {
            "common": {
                "damage": "1",
                "health": "10",
                "reload": "4s",
                "special": "Spawn: x2 Sandstorm (Common)"
            },
            "unusual": {
                "damage": "3",
                "health": "30",
                "reload": "4s",
                "special": "Spawn: x2 Sandstorm (Unusual)"
            },
            "rare": {
                "damage": "9",
                "health": "90",
                "reload": "4s",
                "special": "Spawn: x2 Sandstorm (Rare)"
            },
            "epic": {
                "damage": "27",
                "health": "270",
                "reload": "4s",
                "special": "Spawn: x2 Sandstorm (Rare)"
            },
            "legendary": {
                "damage": "81",
                "health": "810",
                "reload": "4s",
                "special": "Spawn: x2 Sandstorm (Epic)"
            },
            "mythic": {
                "damage": "243",
                "health": "2430",
                "reload": "4s",
                "special": "Spawn: x2 Sandstorm (Legendary)"
            },
            "ultra": {
                "damage": "729",
                "health": "7290",
                "reload": "4s",
                "special": "Spawn: x2 Sandstorm (Mythic)"
            },
            "super": {
                "damage": "2187",
                "health": "21870",
                "reload": "4s",
                "special": "Spawn: x2 Sandstorm (Ultra)"
            },
            "unique": {
                "damage": "6561",
                "health": "65610",
                "reload": "4s",
                "special": "Spawn: x2 Sandstorm (Ultra)"
            },
            "eternal": {
                "damage": "6561",
                "health": "65610",
                "reload": "4s",
                "special": "Spawn: x2 Sandstorm (Ultra)"
            }
        }
    },
    "stinger": {
        "desc": "It really hurts, but it's very fragile.",
        "stats": {
            "common": {
                "damage": "100",
                "health": "2",
                "reload": "10s"
            },
            "unusual": {
                "damage": "300",
                "health": "6",
                "reload": "10s"
            },
            "rare": {
                "damage": "900",
                "health": "18",
                "reload": "10s"
            },
            "epic": {
                "damage": "2700",
                "health": "54",
                "reload": "10s"
            },
            "legendary": {
                "damage": "8100",
                "health": "162",
                "reload": "10s"
            },
            "mythic": {
                "damage": "8100",
                "health": "162",
                "reload": "10s"
            },
            "ultra": {
                "damage": "14580",
                "health": "291.6",
                "reload": "10s"
            },
            "super": {
                "damage": "43740",
                "health": "874.8",
                "reload": "10s"
            },
            "unique": {
                "damage": "131220",
                "health": "2624.4",
                "reload": "10s"
            },
            "eternal": {
                "damage": "393660",
                "health": "2624.4",
                "reload": "10s"
            }
        }
    },
    "talisman": {
        "desc": "A necklace that allows the wearer to anticipate enemy attacks.",
        "stats": {
            "common": {
                "damage": "10",
                "health": "10",
                "reload": "2.5s",
                "special": "Evasion: 3%"
            },
            "unusual": {
                "damage": "30",
                "health": "30",
                "reload": "2.5s",
                "special": "Evasion: 6%"
            },
            "rare": {
                "damage": "90",
                "health": "90",
                "reload": "2.5s",
                "special": "Evasion: 9%"
            },
            "epic": {
                "damage": "270",
                "health": "270",
                "reload": "2.5s",
                "special": "Evasion: 12%"
            },
            "legendary": {
                "damage": "810",
                "health": "810",
                "reload": "2.5s",
                "special": "Evasion: 15%"
            },
            "mythic": {
                "damage": "2430",
                "health": "2430",
                "reload": "2.5s",
                "special": "Evasion: 18%"
            },
            "ultra": {
                "damage": "7290",
                "health": "7290",
                "reload": "2.5s",
                "special": "Evasion: 21%"
            },
            "super": {
                "damage": "21870",
                "health": "21870",
                "reload": "2.5s",
                "special": "Evasion: 24%"
            },
            "unique": {
                "damage": "65610",
                "health": "65610",
                "reload": "2.5s",
                "special": "Evasion: 27%"
            },
            "eternal": {
                "damage": "65610",
                "health": "65610",
                "reload": "2.5s",
                "special": "Evasion: 27%"
            }
        }
    },
    "third_eye": {
        "desc": "Allows your flower to expand your petals further out.",
        "stats": {
            "common": {
                "special": "Extra Range: 0"
            },
            "unusual": {
                "special": "Extra Range: 0"
            },
            "rare": {
                "special": "Extra Range: 0"
            },
            "epic": {
                "special": "Extra Range: 0"
            },
            "legendary": {
                "special": "Extra Range: 40"
            },
            "mythic": {
                "special": "Extra Range: 90"
            },
            "ultra": {
                "special": "Extra Range: 140"
            },
            "super": {
                "special": "Extra Range: 190"
            },
            "unique": {
                "special": "Extra Range: 240"
            },
            "eternal": {
                "special": "Extra Range: 240"
            }
        }
    },
    "tomato": {
        "desc": "Gets stronger over time.",
        "stats": {
            "common": {
                "damage": "5~70",
                "health": "10",
                "reload": "2.5s",
                "special": "Min Damage: 5",
                "special2": "Max Damage: 70"
            },
            "unusual": {
                "damage": "15~210",
                "health": "30",
                "reload": "2.5s",
                "special": "Min Damage: 15",
                "special2": "Max Damage: 210"
            },
            "rare": {
                "damage": "45~630",
                "health": "90",
                "reload": "2.5s",
                "special": "Min Damage: 45",
                "special2": "Max Damage: 630"
            },
            "epic": {
                "damage": "135~1890",
                "health": "270",
                "reload": "2.5s",
                "special": "Min Damage: 135",
                "special2": "Max Damage: 1890"
            },
            "legendary": {
                "damage": "405~5670",
                "health": "810",
                "reload": "2.5s",
                "special": "Min Damage: 405",
                "special2": "Max Damage: 5670"
            },
            "mythic": {
                "damage": "1215~17010",
                "health": "2430",
                "reload": "2.5s",
                "special": "Min Damage: 1215",
                "special2": "Max Damage: 17010"
            },
            "ultra": {
                "damage": "3645~51030",
                "health": "7290",
                "reload": "2.5s",
                "special": "Min Damage: 3645",
                "special2": "Max Damage: 51030"
            },
            "super": {
                "damage": "10935~153090",
                "health": "21870",
                "reload": "2.5s",
                "special": "Min Damage: 10935",
                "special2": "Max Damage: 153090"
            },
            "unique": {
                "damage": "0~459270",
                "health": "65610",
                "reload": "2.5s",
                "special": "Min Damage: 0",
                "special2": "Max Damage: 459270"
            },
            "eternal": {
                "damage": "0~459270",
                "health": "65610",
                "reload": "2.5s",
                "special": "Min Damage: 0",
                "special2": "Max Damage: 459270"
            }
        }
    },
    "triangle": {
        "desc": "Each copy of this petal equipped grants additional damage to it.",
        "stats": {
            "common": {
                "damage": "4",
                "health": "10",
                "reload": "2.5s"
            },
            "unusual": {
                "damage": "12",
                "health": "30",
                "reload": "2.5s"
            },
            "rare": {
                "damage": "36",
                "health": "90",
                "reload": "2.5s"
            },
            "epic": {
                "damage": "108",
                "health": "270",
                "reload": "2.5s"
            },
            "legendary": {
                "damage": "324",
                "health": "810",
                "reload": "2.5s"
            },
            "mythic": {
                "damage": "972",
                "health": "2430",
                "reload": "2.5s"
            },
            "ultra": {
                "damage": "2916",
                "health": "7290",
                "reload": "2.5s"
            },
            "super": {
                "damage": "4096",
                "health": "21870",
                "reload": "2.5s"
            },
            "unique": {
                "damage": "8748",
                "health": "65610",
                "reload": "2.5s"
            },
            "eternal": {
                "damage": "8748",
                "health": "65610",
                "reload": "2.5s"
            }
        }
    },
    "uranium": {
        "desc": "Periodically releases radiation.<br>-75% damage versus other flowers.",
        "stats": {
            "common": {
                "damage": "0",
                "health": "75",
                "reload": "2.5s",
                "special": "Poison: 50"
            },
            "unusual": {
                "damage": "0",
                "health": "225",
                "reload": "2.5s",
                "special": "Poison: 150"
            },
            "rare": {
                "damage": "0",
                "health": "675",
                "reload": "2.5s",
                "special": "Poison: 450"
            },
            "epic": {
                "damage": "0",
                "health": "2025",
                "reload": "2.5s",
                "special": "Poison: 1350"
            },
            "legendary": {
                "damage": "0",
                "health": "6075",
                "reload": "2.5s",
                "special": "Poison: 4050"
            },
            "mythic": {
                "damage": "0",
                "health": "18225",
                "reload": "2.5s",
                "special": "Poison: 12150"
            },
            "ultra": {
                "damage": "0",
                "health": "54675",
                "reload": "2.5s",
                "special": "Poison: 36450"
            },
            "super": {
                "damage": "0",
                "health": "164025",
                "reload": "2.5s",
                "special": "Poison: 109350"
            },
            "unique": {
                "damage": "0",
                "health": "492075",
                "reload": "2.5s",
                "special": "Poison: 328050"
            },
            "eternal": {
                "damage": "0",
                "health": "492075",
                "reload": "2.5s",
                "special": "Poison: 328050"
            }
        }
    },
    "web": {
        "desc": "It's really sticky.",
        "stats": {
            "common": {
                "damage": "5",
                "health": "5",
                "reload": "3s",
                "special": "Duration: 10s",
                "special2": "Radius: 50"
            },
            "unusual": {
                "damage": "15",
                "health": "15",
                "reload": "3s",
                "special": "Duration: 10s",
                "special2": "Radius: 60"
            },
            "rare": {
                "damage": "45",
                "health": "45",
                "reload": "3s",
                "special": "Duration: 10s",
                "special2": "Radius: 70"
            },
            "epic": {
                "damage": "135",
                "health": "135",
                "reload": "3s",
                "special": "Duration: 10s",
                "special2": "Radius: 80"
            },
            "legendary": {
                "damage": "405",
                "health": "405",
                "reload": "3s",
                "special": "Duration: 10s",
                "special2": "Radius: 100"
            },
            "mythic": {
                "damage": "1215",
                "health": "1215",
                "reload": "3s",
                "special": "Duration: 10s",
                "special2": "Radius: 150"
            },
            "ultra": {
                "damage": "3645",
                "health": "3645",
                "reload": "3s",
                "special": "Duration: 10s",
                "special2": "Radius: 200"
            },
            "super": {
                "damage": "10935",
                "health": "10935",
                "reload": "3s",
                "special": "Duration: 10s",
                "special2": "Radius: 250"
            },
            "unique": {
                "damage": "32805",
                "health": "32805",
                "reload": "3s",
                "special": "Duration: 10s",
                "special2": "Radius: 300"
            },
            "eternal": {
                "damage": "32805",
                "health": "32805",
                "reload": "3s",
                "special": "Duration: 10s",
                "special2": "Radius: 300"
            }
        }
    },
    "wing": {
        "desc": "It comes and goes.",
        "stats": {
            "common": {
                "damage": "20",
                "health": "10",
                "reload": "2.5s"
            },
            "unusual": {
                "damage": "60",
                "health": "30",
                "reload": "2.5s"
            },
            "rare": {
                "damage": "180",
                "health": "90",
                "reload": "2.5s"
            },
            "epic": {
                "damage": "540",
                "health": "270",
                "reload": "2.5s"
            },
            "legendary": {
                "damage": "1620",
                "health": "810",
                "reload": "2.5s"
            },
            "mythic": {
                "damage": "4860",
                "health": "2430",
                "reload": "2.5s"
            },
            "ultra": {
                "damage": "14580",
                "health": "7290",
                "reload": "2.5s"
            },
            "super": {
                "damage": "43740",
                "health": "21870",
                "reload": "2.5s"
            },
            "unique": {
                "damage": "131220",
                "health": "65610",
                "reload": "2.5s"
            },
            "eternal": {
                "damage": "131220",
                "health": "65610",
                "reload": "2.5s"
            }
        }
    },
    "yggdrasil": {
        "desc": "A dried leaf from the Yggdrasil tree.<br>Rumored to be able to bring the fallen back to life.",
        "stats": {
            "common": {
                "damage": "0",
                "health": "10",
                "reload": "320s",
                "special": "Revive Heal: 20%"
            },
            "unusual": {
                "damage": "0",
                "health": "30",
                "reload": "160s",
                "special": "Revive Heal: 20%"
            },
            "rare": {
                "damage": "0",
                "health": "90",
                "reload": "80s",
                "special": "Revive Heal: 20%"
            },
            "epic": {
                "damage": "0",
                "health": "270",
                "reload": "40s",
                "special": "Revive Heal: 20%"
            },
            "legendary": {
                "damage": "0",
                "health": "810",
                "reload": "20s",
                "special": "Revive Heal: 20%"
            },
            "mythic": {
                "damage": "0",
                "health": "2430",
                "reload": "7.5s",
                "special": "Revive Heal: 20%"
            },
            "ultra": {
                "damage": "0",
                "health": "7290",
                "reload": "2.5s",
                "special": "Revive Heal: 20%"
            },
            "super": {
                "damage": "0",
                "health": "21870",
                "reload": "1s",
                "special": "Revive Heal: 20%"
            },
            "unique": {
                "damage": "0",
                "health": "65610",
                "reload": "0.5s",
                "special": "Revive Heal: 20%"
            },
            "eternal": {
                "damage": "0",
                "health": "65610",
                "reload": "0.5s",
                "special": "Revive Heal: 20%"
            }
        }
    },
    "yin_yang": {
        "desc": "This mysterious petal affects the rotation of your petals in unpredictable ways.",
        "stats": {
            "common": {
                "damage": "10",
                "health": "10",
                "reload": "2s"
            },
            "unusual": {
                "damage": "30",
                "health": "30",
                "reload": "2s"
            },
            "rare": {
                "damage": "90",
                "health": "90",
                "reload": "2s"
            },
            "epic": {
                "damage": "270",
                "health": "270",
                "reload": "2s"
            },
            "legendary": {
                "damage": "810",
                "health": "810",
                "reload": "2s"
            },
            "mythic": {
                "damage": "2430",
                "health": "2430",
                "reload": "2s"
            },
            "ultra": {
                "damage": "7290",
                "health": "7290",
                "reload": "2s"
            },
            "super": {
                "damage": "21870",
                "health": "21870",
                "reload": "2s"
            },
            "unique": {
                "damage": "65610",
                "health": "65610",
                "reload": "2s"
            },
            "eternal": {
                "damage": "65610",
                "health": "65610",
                "reload": "2s"
            }
        }
    },
    "yucca": {
        "desc": "Heals your flower but only while in the defensive position.",
        "stats": {
            "common": {
                "damage": "5",
                "health": "10",
                "reload": "2.5s",
                "special": "Heal/s (defending): 2"
            },
            "unusual": {
                "damage": "15",
                "health": "30",
                "reload": "2.5s",
                "special": "Heal/s (defending): 7"
            },
            "rare": {
                "damage": "45",
                "health": "90",
                "reload": "2.5s",
                "special": "Heal/s (defending): 20"
            },
            "epic": {
                "damage": "135",
                "health": "270",
                "reload": "2.5s",
                "special": "Heal/s (defending): 61"
            },
            "legendary": {
                "damage": "405",
                "health": "810",
                "reload": "2.5s",
                "special": "Heal/s (defending): 182"
            },
            "mythic": {
                "damage": "1215",
                "health": "2430",
                "reload": "2.5s",
                "special": "Heal/s (defending): 547"
            },
            "ultra": {
                "damage": "3645",
                "health": "7290",
                "reload": "2.5s",
                "special": "Heal/s (defending): 947"
            },
            "super": {
                "damage": "10935",
                "health": "21870",
                "reload": "2.5s",
                "special": "Heal/s (defending): 1640"
            },
            "unique": {
                "damage": "32805",
                "health": "65610",
                "reload": "2.5s",
                "special": "Heal/s (defending): 2841"
            },
            "eternal": {
                "damage": "32805",
                "health": "65610",
                "reload": "2.5s",
                "special": "Heal/s (defending): 2841"
            }
        }
    }
};

function showTooltip(el, item, totalOwned) {
    const tt = document.getElementById('tooltip');
    if (!tt) return;
    const nameStr = item.name.replace(/_/g, ' ');
    document.getElementById('tt-name').innerText = nameStr;
    document.getElementById('tt-count').innerText = `x${formatNumber(totalOwned)}`;
    document.getElementById('tt-rarity').innerText = item.rarity;
    document.getElementById('tt-rarity').style.color = RARITIES[item.rarity].color;
    document.getElementById('tt-name').style.color = '#fff';
    
    const data = PETAL_DATA[item.name.toLowerCase()];
    if (data) {
        let descHtml = "";
        if (typeof data.desc === 'string') {
            descHtml = data.desc;
        } else if (data.desc) {
            descHtml = data.desc[item.rarity] || data.desc['default'] || "";
        }
        document.getElementById('tt-desc').innerHTML = descHtml;
        
        function formatStatNumber(val) {
            if (!val) return val;
            let numStr = val.toString().replace(/,/g, '');
            let num = Number(numStr);
            if (!isNaN(num) && val.toString().trim() !== '') {
                if (num >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, '') + 'b';
                if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'm';
                if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
                return num.toString();
            }
            if (typeof val === 'string' && val.includes('-')) {
                let parts = val.split('-');
                if (parts.length === 2) {
                    let p1 = Number(parts[0].replace(/,/g, ''));
                    let p2 = Number(parts[1].replace(/,/g, ''));
                    if (!isNaN(p1) && !isNaN(p2) && parts[0].trim() !== '' && parts[1].trim() !== '') {
                        return formatStatNumber(p1) + '-' + formatStatNumber(p2);
                    }
                }
            }
            return val;
        }

        let statHtml = '';
        let stats = data.stats?.[item.rarity];
        if (!stats && data.stats) {
            stats = Object.values(data.stats)[0];
        }
        stats = stats || {};
        if (stats.damage) statHtml += `<div style="color:#f66">Damage: ${formatStatNumber(stats.damage)}</div>`;
        if (stats.health) statHtml += `<div style="color:#5f5">Health: ${formatStatNumber(stats.health)}</div>`;
        if (stats.usage_reload) statHtml += `<div style="color:#5df">Use Reload: ${stats.usage_reload}</div>`;
        
        const petalName = Object.keys(KNOWN_PETALS).find(k => KNOWN_PETALS[k] === item.id);
        const isLightningPetal = petalName === 'lightning';

        function formatSpecial(text) {
            if (!text) return "";
            if (text.startsWith("Mana") || text.startsWith("Base Max Mana") || text.startsWith("Spawn Cost (mana)") || text.startsWith("Maint. Cost (mana") || text.startsWith("Lightning")) {
                return `<div style="color:#5df">${text}</div>`;
            } else if (text.startsWith("Poison")) {
                return `<div style="color:#a5f">${text}</div>`;
            } else if (isLightningPetal && text.startsWith("Bounces")) {
                return `<div style="color:#5df">${text}</div>`;
            } else {
                return `<div style="color:#fd5">${text}</div>`;
            }
        }
        
        if (stats.special) statHtml += formatSpecial(stats.special);
        if (stats.special2) statHtml += formatSpecial(stats.special2);
        if (stats.special3) statHtml += formatSpecial(stats.special3);
        
        document.getElementById('tt-stats').innerHTML = statHtml;
        if (stats.reload) {
            document.getElementById('tt-cooldown').innerHTML = stats.reload + ' <span style="display:inline-block; transform: rotate(90deg); font-size: 1.15em;">\u21BB</span>';
        } else {
            document.getElementById('tt-cooldown').innerText = '';
        }
    } else {
        document.getElementById('tt-desc').innerHTML = "<em>(Stats coming soon)</em>";
        document.getElementById('tt-stats').innerHTML = '';
        document.getElementById('tt-cooldown').innerText = '';
    }
    
    tt.style.display = 'block';
    const rect = el.getBoundingClientRect();
    tt.style.left = (rect.left + rect.width/2) + 'px';
    tt.style.top = rect.top + 'px';
}

function hideTooltip() {
    const tt = document.getElementById('tooltip');
    if (tt) tt.style.display = 'none';
}

function initForgeCosts() {
    const saved = localStorage.getItem('florr_forge_costs');
    if (saved) {
        try { forgeCosts = JSON.parse(saved); } catch(e) { forgeCosts = {}; }
    }
    for (const petal in KNOWN_PETALS) {
        if (!forgeCosts[petal]) forgeCosts[petal] = 5;
    }
}
initForgeCosts();

const modeToggleBtn = document.getElementById('mode-toggle');
const topBarTitle = document.getElementById('top-bar-title');

function updateModeUI() {
    if (currentMode === 'craft') {
        document.body.classList.remove('forge-mode');
        topBarTitle.innerText = 'Craft';
        modeToggleBtn.querySelector('.bg-img').src = 'https://florr.io/mobs/0_9.svg'; // Titan bg
        modeToggleBtn.querySelector('.petal-img').src = 'titan.png'; // Titan face
        btnCraft.innerText = 'Craft';
        const helper = document.getElementById('forge-helper-text');
        if (helper) helper.style.display = 'none';
        const craftHelper = document.getElementById('craft-helper-text');
        if (craftHelper) craftHelper.style.display = 'block';
    } else {
        document.body.classList.add('forge-mode');
        topBarTitle.innerText = 'Forge';
        modeToggleBtn.querySelector('.bg-img').src = 'https://florr.io/mobs/0_0.svg'; // Trader bg
        modeToggleBtn.querySelector('.petal-img').src = 'trader.png'; // Trader face
        btnCraft.innerText = 'Forge';
        const helper = document.getElementById('forge-helper-text');
        if (helper) helper.style.display = 'block';
        const craftHelper = document.getElementById('craft-helper-text');
        if (craftHelper) craftHelper.style.display = 'none';
    }
    // Return all items from slots back to inventory
    for (let i = 0; i < 5; i++) {
        if (craftingSlots[i]) {
            let slot = craftingSlots[i];
            let existing = inventory.find(x => x.rarity === slot.itemRef.rarity && x.id === slot.itemRef.id);
            if (existing) existing.count += slot.count;
            else inventory.push({ rarity: slot.itemRef.rarity, id: slot.itemRef.id, name: slot.itemRef.name, count: slot.count });
            craftingSlots[i] = null;
        }
    }
    renderCrafting();
    renderInventory();
}

modeToggleBtn.onclick = () => {
    currentMode = currentMode === 'craft' ? 'forge' : 'craft';
    updateModeUI();
};

function loadInventory() {
    const saved = localStorage.getItem('florr_inventory');
    if (saved) {
        try {
            inventory = JSON.parse(saved);
        } catch (e) {
            inventory = [];
        }
    }
}
loadInventory();

function saveInventory() {
    // Save inventory + whatever is in crafting slots so they aren't lost on reload
    let tempInventory = JSON.parse(JSON.stringify(inventory));
    craftingSlots.forEach(slot => {
        if (slot) {
            let item = tempInventory.find(i => i.id === slot.itemRef.id && i.rarity === slot.itemRef.rarity);
            if (item) {
                item.count += slot.count;
            } else {
                tempInventory.push({ ...slot.itemRef, count: slot.count });
            }
        }
    });
    localStorage.setItem('florr_inventory', JSON.stringify(tempInventory));
}

const uiLog = document.getElementById('console-log');
const uiInput = document.getElementById('console-input');
const uiInventory = document.getElementById('inventory-grid');
const uiSlots = document.querySelectorAll('.pentagon-slot');
const btnCraft = document.getElementById('craft-btn');
const uiChance = document.getElementById('craft-chance');
const uiCenter = document.getElementById('craft-center');
const pentagonContainer = document.getElementById('pentagon-container');

let persistentLogs = [];

function log(msg, color="#fff", persist=false) {
    const el = document.createElement('div');
    el.innerText = msg;
    el.style.color = color;
    uiLog.appendChild(el);
    uiLog.scrollTop = uiLog.scrollHeight;
    
    if (persist) {
        persistentLogs.push(el);
    } else {
        // Remove after 10 seconds
        setTimeout(() => {
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 1000); // Wait for fade out
        }, 10000);
    }
}

function clearPersistentLogs() {
    persistentLogs.forEach(el => el.remove());
    persistentLogs = [];
}

function clearCraftingSlots() {
    for (let i = 0; i < 5; i++) {
        if (craftingSlots[i]) {
            const item = craftingSlots[i].itemRef;
            addInventory(item.rarity, item.id, item.name, craftingSlots[i].count);
            craftingSlots[i] = null;
        }
    }
    renderCrafting();
    renderInventory();
}

uiInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const val = uiInput.value.trim();
        uiInput.value = '';
        if (val) processCommand(val);
    }
});

function parseRarities(rStr) {
    const order = ['common', 'unusual', 'rare', 'epic', 'legendary', 'mythic', 'ultra', 'super', 'eternal', 'unique'];
    
    let match = rStr.match(/^([^\[]+)\[([^\]]+)\]$/);
    let baseStr = rStr;
    let excludes = [];
    if (match) {
        baseStr = match[1];
        // Split by commas or spaces so both 'a,b' and 'a b' work
        excludes = match[2].split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
    }
    
    let result = new Set();
    if (baseStr === 'all') {
        order.forEach(r => result.add(r));
    } else {
        let tokens = baseStr.split(',');
        for (let t of tokens) {
            if (t.includes('-')) {
                let [start, end] = t.split('-');
                let sIdx = order.indexOf(start);
                let eIdx = order.indexOf(end);
                if (sIdx !== -1 && eIdx !== -1) {
                    let min = Math.min(sIdx, eIdx);
                    let max = Math.max(sIdx, eIdx);
                    for (let i = min; i <= max; i++) result.add(order[i]);
                } else return null;
            } else {
                if (order.includes(t)) result.add(t);
                else return null;
            }
        }
    }
    
    for (let ex of excludes) {
        result.delete(ex);
    }
    
    let finalOrder = order.filter(r => result.has(r));
    return finalOrder.length > 0 ? finalOrder : null;
}

function processCommand(rawCmd) {
    clearPersistentLogs();
    
    // Custom processing to handle spaces safely inside brackets and remove spaces around commas
    let cmd = rawCmd.toLowerCase().replace(/\s*,\s*/g, ',');
    const parts = cmd.trim().split(/\s+/);
    
    if (parts[0] === 'clear') {
        if (parts.length < 2) {
            log("Format: clear <all|rarity|petal>", "#f44");
            return;
        }
        let target = parts.slice(1).join(' ');
        target = target === 'ygg' ? 'yggdrasil' : target;
        
        let clearedCount = 0;
        let clearAll = false;
        
        if (target === 'all') {
            inventory.length = 0;
            for (let i = 0; i < 5; i++) craftingSlots[i] = null;
            clearAll = true;
        } else {
            const targetRarities = parseRarities(target);
            if (targetRarities) {
                let nameExcludes = [];
                let match = target.match(/\[([^\]]+)\]$/);
                if (match) {
                    // Split by commas or spaces so 'basic air' and 'basic,air' both work
                    let exTokens = match[1].split(/[,\s]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
                    const rOrder = ['common', 'unusual', 'rare', 'epic', 'legendary', 'mythic', 'ultra', 'super', 'eternal', 'unique'];
                    nameExcludes = exTokens.filter(t => !rOrder.includes(t)).map(t => t === 'ygg' ? 'yggdrasil' : t);
                }

                // It's a rarity filter (e.g. 'mythic', 'common,rare', 'unusual-epic')
                for (let i = inventory.length - 1; i >= 0; i--) {
                    if (targetRarities.includes(inventory[i].rarity)) {
                        if (nameExcludes.includes(inventory[i].name)) continue;
                        inventory.splice(i, 1);
                        clearedCount++;
                    }
                }
                for (let i = 0; i < 5; i++) {
                    if (craftingSlots[i] && targetRarities.includes(craftingSlots[i].itemRef.rarity)) {
                        if (nameExcludes.includes(craftingSlots[i].itemRef.name)) continue;
                        craftingSlots[i] = null;
                    }
                }
            } else {
                // Must be a petal name
                let matchNameExclude = target.match(/^([^\[]+)\[([^\]]+)\]$/);
                let baseNameStr = target;
                let rarityExcludes = [];
                if (matchNameExclude) {
                    baseNameStr = matchNameExclude[1];
                    let exTokens = matchNameExclude[2].split(/[,\s]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
                    const rOrder = ['common', 'unusual', 'rare', 'epic', 'legendary', 'mythic', 'ultra', 'super', 'eternal', 'unique'];
                    rarityExcludes = exTokens.filter(t => rOrder.includes(t));
                }

                const targetNames = baseNameStr.split(',').map(s => s.trim().toLowerCase());
                let foundIds = [];
                for (let tName of targetNames) {
                    const normalized = tName === 'ygg' ? 'yggdrasil' : tName.replace(/\s+/g, '_');
                    const pid = getPetalId(normalized);
                    if (pid) foundIds.push(pid);
                }
                
                if (foundIds.length === 0) {
                    log(`Unknown rarity or petal: ${target}`, "#f44");
                    return;
                }
                
                for (let i = inventory.length - 1; i >= 0; i--) {
                    if (foundIds.includes(inventory[i].id)) {
                        if (rarityExcludes.includes(inventory[i].rarity)) continue;
                        inventory.splice(i, 1);
                        clearedCount++;
                    }
                }
                for (let i = 0; i < 5; i++) {
                    if (craftingSlots[i] && foundIds.includes(craftingSlots[i].itemRef.id)) {
                        if (rarityExcludes.includes(craftingSlots[i].itemRef.rarity)) continue;
                        craftingSlots[i] = null;
                    }
                }
            }
        }
        
        renderCrafting();
        renderInventory();
        log(clearAll ? "Inventory cleared." : `Cleared ${clearedCount} item stacks.`, "#7eef6d");
        return;
    }

    if (parts[0] === 'reset' && parts[1] === 'forge') {
        Object.keys(forgeCosts).forEach(k => {
            forgeCosts[k] = 5;
        });
        localStorage.setItem('florr_forge_costs', JSON.stringify(forgeCosts));
        renderInventory();
        log("Forge costs reset to 5.", "#7eef6d");
        return;
    }

    if (parts[0] === 'help') {
        log("=== Commands Help ===", "#7eef6d", true);
        log("Modifiers: ',' (and), '-' (through), '[...]' (exclude)", "#aaa", true);
        log("Targets: 'all', 'owned', or specific names", "#aaa", true);
        log(" ", "#fff", true);
        log("1. Spawn: <rarity> <target> [amount|range]", "#fff", true);
        log("   > unusual-mythic all 10-20", "#ccc", true);
        log("   > all[rare] stinger,glass 50", "#ccc", true);
        log("   > super all[iris, faster] 5", "#ccc", true);
        log("2. Craft: craft <rarity> <target>", "#fff", true);
        log("   > craft common,rare all", "#ccc", true);
        log("   > craft epic-ultra owned[stinger]", "#ccc", true);
        log("3. Forge: forge <target>", "#fff", true);
        log("   > forge all", "#ccc", true);
        log("   > forge all[clover]", "#ccc", true);
        log("4. Clear: clear <rarity|target>", "#fff", true);
        log("   > clear mythic-super", "#ccc", true);
        log("5. Reset Forge: reset forge", "#fff", true);
        log("   > resets all forge costs to 5", "#ccc", true);
        return;
    }

    if (parts[0] === 'craft' || parts[0] === 'forge') {
        let action = parts[0];
        let rarityFilterStr, nameFilter;
        
        if (action === 'forge') {
            if (parts.length < 2) {
                log(`Format: forge <name|all>`, "#f44");
                return;
            }
            rarityFilterStr = 'super';
            nameFilter = parts.slice(1).join(' ');
        } else {
            if (parts.length < 3) {
                log(`Format: craft <rarities> <name|all>`, "#f44");
                return;
            }
            rarityFilterStr = parts[1];
            nameFilter = parts.slice(2).join(' ');
        }
        
        const targetRarities = parseRarities(rarityFilterStr);
        if (!targetRarities) return log(`Unknown rarity format: ${rarityFilterStr}`, "#f44");
        
        let matchNameExclude = nameFilter.match(/^([^\[]+)\[([^\]]+)\]$/);
        let baseNameStr = nameFilter;
        let nameExcludes = [];
        if (matchNameExclude) {
            baseNameStr = matchNameExclude[1];
            nameExcludes = matchNameExclude[2].split(',').map(s => s.replace(/\s+/g, '_'));
        }
        
        const targetNames = baseNameStr.split(',').map(s => s.trim().toLowerCase());
        
        let totalSuccesses = 0;
        let totalFails = 0;
        
        for (let r of targetRarities) {
            if (action === 'forge' && r !== 'super') continue;
            
            let itemsToProcess = [];
            for (let i = 0; i < inventory.length; i++) {
                let item = inventory[i];
                if (item.rarity !== r || item.count <= 0) continue;
                
                let matchName = false;
                if (targetNames.includes('all') || targetNames.includes('owned')) matchName = true;
                else if (targetNames.includes(item.name)) matchName = true;
                else if (targetNames.includes('ygg') && item.name === 'yggdrasil') matchName = true;
                
                for (let tName of targetNames) {
                    if (tName.replace(/\s+/g, '_') === item.name) {
                        matchName = true;
                        break;
                    }
                }
                
                if (matchName) {
                    if (nameExcludes.includes(item.name) || (nameExcludes.includes('ygg') && item.name === 'yggdrasil')) {
                        continue;
                    }
                    itemsToProcess.push(item);
                }
            }
            
            for (const item of itemsToProcess) {
                if (action === 'craft') {
                    if (item.count < 5) continue;
                    const rData = RARITIES[item.rarity];
                    if (!rData || !rData.next) continue;
                    
                    let chance = (item.name.toLowerCase() === 'square') ? 1.0 : rData.chance;
                    let result = simulateCraftingBulk(item.count, chance);
                    
                    totalSuccesses += result.successes;
                    totalFails += result.failures;
                    
                    item.count = result.remaining;
                    if (result.successes > 0) {
                        addInventory(rData.next, item.id, item.name, result.successes);
                    }
                } else if (action === 'forge') {
                    if (item.rarity !== 'super') continue;
                    let req = forgeCosts[item.name] || 5;
                    let forgesDone = 0;
                    
                    while (item.count >= req) {
                        item.count -= req;
                        forgesDone++;
                        req++;
                    }
                    
                    forgeCosts[item.name] = req;
                    if (forgesDone > 0) {
                        totalSuccesses += forgesDone;
                        addInventory('unique', item.id, item.name, forgesDone);
                    }
                }
            }
        }
        
        localStorage.setItem('florr_forge_costs', JSON.stringify(forgeCosts));
        
        if (totalSuccesses === 0 && totalFails === 0) {
            log(`Nothing to ${action}.`, "#aaa");
        } else if (action === 'craft') {
            log(`Batch craft complete: ${totalSuccesses} success, ${totalFails} fails.`, "#7eef6d");
        } else {
            log(`Batch forge complete: Created ${totalSuccesses} unique(s).`, "#7eef6d");
        }
        
        renderInventory();
        renderCrafting();
        return;
    }
    
    if (parts.length < 2) return log("Format: <rarity> <name> [amount]", "#f44");

    const rarities = parseRarities(parts[0]);
    if (!rarities) return log(`Unknown rarity format: ${parts[0]}`, "#f44");

    let amountStr = '1';
    let nameParts = [];
    for (let i = 1; i < parts.length; i++) {
        if (i === parts.length - 1 && (!isNaN(parts[i]) || parts[i].match(/^\d+-\d+$/))) {
            amountStr = parts[i];
        } else {
            nameParts.push(parts[i]);
        }
    }
    
    const getAmount = () => {
        if (!isNaN(amountStr)) return Number(amountStr);
        let [min, max] = amountStr.split('-');
        min = Number(min);
        max = Number(max);
        if (min > max) { let t = min; min = max; max = t; }
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    
    const nameStr = nameParts.join(' ');
    if (!nameStr) return log("Please provide a petal name, 'all', or 'owned'.", "#f44");

    let matchNameExclude = nameStr.match(/^([^\[]+)\[([^\]]+)\]$/);
    let baseNameStr = nameStr;
    let nameExcludes = [];
    if (matchNameExclude) {
        baseNameStr = matchNameExclude[1];
        nameExcludes = matchNameExclude[2].split(',').map(s => s.replace(/\s+/g, '_'));
    }

    const targetNames = baseNameStr.split(',').map(s => s.trim().toLowerCase());

    if (targetNames.includes('owned')) {
        let count = 0;
        inventory.forEach(item => {
            if (item.count > 0 && rarities.includes(item.rarity)) {
                if (nameExcludes.includes(item.name) || (nameExcludes.includes('ygg') && item.name === 'yggdrasil')) return;
                
                addInventory(item.rarity, item.id, item.name, getAmount());
                count++;
            }
        });
        if (count === 0) return log("No owned petals match criteria.", "#aaa");
        log(`Spawned ${amountStr} for ${count} owned petals.`, "#7eef6d");
    } else if (targetNames.includes('all')) {
        const seenIds = new Set();
        for (const [name, id] of Object.entries(KNOWN_PETALS)) {
            if (!seenIds.has(id)) {
                if (nameExcludes.includes(name) || (nameExcludes.includes('ygg') && name === 'yggdrasil')) {
                    // skipped
                } else {
                    rarities.forEach(r => addInventory(r, id, name, getAmount()));
                    seenIds.add(id);
                }
            }
        }
        log(`Spawned ${amountStr} of all petals for ${rarities.length} rarities.`, "#7eef6d");
    } else {
        let spawnedCount = 0;
        targetNames.forEach(tName => {
            const normalizedName = tName === "ygg" ? "yggdrasil" : tName;
            const petalId = getPetalId(normalizedName);
            if (petalId) {
                const storedName = normalizedName.replace(/\s+/g, '_');
                if (nameExcludes.includes(storedName) || (nameExcludes.includes('ygg') && storedName === 'yggdrasil')) return;
                
                rarities.forEach(r => addInventory(r, petalId, storedName, getAmount()));
                spawnedCount++;
            } else {
                log(`Unknown petal: ${tName}`, "#f44");
            }
        });
        if (spawnedCount > 0) {
            log(`Spawned ${amountStr} for ${spawnedCount} petal types in ${rarities.length} rarities.`, "#7eef6d");
        }
    }

    renderInventory();
    renderCrafting();
}

function addInventory(rarity, id, name, amount, skipRender = false) {
    let existing = inventory.find(i => i.rarity === rarity && i.id === id);
    if (existing) existing.count += amount;
    else inventory.push({ rarity, id, name, count: amount });
    if (!skipRender) renderInventory();
}

function renderInventory() {
    if (uiInventory.children.length === 0) {
        // Initialize DOM structure once
        const sortedKeys = Object.keys(KNOWN_PETALS).sort((a, b) => a.localeCompare(b));
        const allIds = Array.from(new Set(sortedKeys.map(k => KNOWN_PETALS[k])));
        allIds.forEach(id => {
            const raritiesArr = Object.keys(RARITIES).map(k => ({ name: k, ...RARITIES[k] })).sort((a, b) => a.id - b.id);
            raritiesArr.forEach(rData => {
                const el = document.createElement('div');
                let hc = el.classList.contains('hide-contents') ? ' hide-contents' : '';
                el.className = 'slot' + hc;
                el.dataset.id = id;
                el.dataset.rarity = rData.name;
                uiInventory.appendChild(el);
            });
        });
    }

    let totalCounts = {};
    for (const item of inventory) {
        totalCounts[`${item.rarity}_${item.id}`] = item.count;
    }
    for (const slot of craftingSlots) {
        if (slot) {
            totalCounts[`${slot.itemRef.rarity}_${slot.itemRef.id}`] = (totalCounts[`${slot.itemRef.rarity}_${slot.itemRef.id}`] || 0) + slot.count;
        }
    }

    // Update existing DOM elements
    Array.from(uiInventory.children).forEach(el => {
        const id = parseInt(el.dataset.id);
        const rarityName = el.dataset.rarity;
        const item = inventory.find(i => i.id === id && i.rarity === rarityName);
        const rData = RARITIES[rarityName];
        const petalName = Object.keys(KNOWN_PETALS).find(k => KNOWN_PETALS[k] === id);
        
        let totalOwned = totalCounts[`${rarityName}_${id}`] || 0;
        
        // Hide non-super rarities in forge mode
        if (currentMode === 'forge' && rarityName !== 'super') {
            el.style.display = 'none';
            return;
        } else {
            el.style.display = 'flex';
        }

        // Hover logic
        el.onmouseenter = () => {
            if (currentMode === 'forge') return;
            if (item && totalOwned > 0) showTooltip(el, item, totalOwned);
        };
        el.onmouseleave = () => {
            hideTooltip();
        };
        
        if (item && item.count > 0) {
            if (!el.classList.contains('filled')) {
                let hc = el.classList.contains('hide-contents') ? ' hide-contents' : '';
                el.className = 'slot filled' + hc;
                el.innerHTML = '';
                
                const bgImg = document.createElement('img');
                bgImg.className = 'bg-img';
                bgImg.src = `img/0_${rData.id}.svg`;
                
                const img = document.createElement('img');
                img.className = 'petal-img';
                img.src = `img/${id}_${rData.id}.svg`;
                img.onerror = function() { 
                    this.onerror = function() {
                        this.onerror = null;
                        this.src = `img/1.svg`;
                    };
                    this.src = `img/${id}.svg`; 
                };
                
                const countDiv = document.createElement('div');
                countDiv.className = 'count';
                
                el.appendChild(bgImg);
                el.appendChild(img);
                el.appendChild(countDiv);
                
                el.onclick = (e) => {
                    if (el.classList.contains('disabled')) return;
                    const currentItem = inventory.find(i => i.id === id && i.rarity === rarityName);
                    if (!currentItem || currentItem.count <= 0) return;
                    let baseItem = craftingSlots.find(x => x !== null);
                    if (baseItem && (baseItem.itemRef.name !== currentItem.name || baseItem.itemRef.rarity !== currentItem.rarity)) {
                        clearCraftingSlots();
                    }
                    if (e.shiftKey) moveAllToCrafting(currentItem, el);
                    else if (e.ctrlKey || e.metaKey) moveMultipleToCrafting(currentItem, 5, el);
                    else moveOneToCrafting(currentItem, el);
                };
            }
            
            const countDiv = el.querySelector('.count');
            const bgImg = el.querySelector('.bg-img');
            if (currentMode === 'forge') {
                let req = forgeCosts[petalName];
                countDiv.innerText = `${formatNumber(item.count)}/${formatNumber(req)}`;
                if (totalOwned < req) {
                    el.classList.add('disabled');
                    if (bgImg) bgImg.src = 'img/0_6.svg';
                } else {
                    el.classList.remove('disabled');
                    if (bgImg) bgImg.src = `img/0_${rData.id}.svg`;
                }
            } else {
                countDiv.innerText = `x${formatNumber(item.count)}`;
                if (!rData.next || totalOwned >= 5) {
                    el.classList.remove('disabled');
                    if (bgImg) bgImg.src = `img/0_${rData.id}.svg`;
                } else {
                    el.classList.add('disabled');
                    if (bgImg) bgImg.src = 'img/0_6.svg';
                }
            }
            
        } else {
            if (el.classList.contains('filled')) {
                let hc = el.classList.contains('hide-contents') ? ' hide-contents' : '';
                el.className = 'slot' + hc;
                el.innerHTML = '';
                el.onclick = null;
            }
        }
    });
    
    saveInventory();
}

function validateCraftingType(item) {
    const existing = craftingSlots.find(s => s !== null);
    if (existing && (existing.itemRef.id !== item.id || existing.itemRef.rarity !== item.rarity)) {
        return false;
    }
    return true;
}

function moveOneToCrafting(item, startEl) {
    if (item.count <= 0) return;
    if (!validateCraftingType(item)) return log("Crafting slots must contain the same petal!", "#f44");

    craftResultShowing = false;

    let targetIndex = 0;
    let minCount = Infinity;
    for (let i = 0; i < 5; i++) {
        if (!craftingSlots[i]) {
            targetIndex = i;
            break;
        } else if (craftingSlots[i].count < minCount) {
            minCount = craftingSlots[i].count;
            targetIndex = i;
        }
    }

    item.count--;
    if (!craftingSlots[targetIndex]) craftingSlots[targetIndex] = { itemRef: item, count: 1 };
    else craftingSlots[targetIndex].count++;
    
    let endRect = uiSlots[targetIndex].getBoundingClientRect();
    if (startEl) playTransferAnimation(startEl, endRect, uiSlots[targetIndex]);
    
    renderInventory();
    renderCrafting();
}

function moveMultipleToCrafting(item, amount, startEl) {
    if (item.count <= 0) return;
    if (!validateCraftingType(item)) return log("Crafting slots must contain the same petal!", "#f44");

    craftResultShowing = false;

    let toMove = Math.min(item.count, amount);
    let targetIndex = 0;
    for (let i = 0; i < toMove; i++) {
        targetIndex = 0;
        let minCount = Infinity;
        for (let j = 0; j < 5; j++) {
            if (!craftingSlots[j]) {
                targetIndex = j;
                break;
            } else if (craftingSlots[j].count < minCount) {
                minCount = craftingSlots[j].count;
                targetIndex = j;
            }
        }
        item.count--;
        if (!craftingSlots[targetIndex]) craftingSlots[targetIndex] = { itemRef: item, count: 1 };
        else craftingSlots[targetIndex].count++;
    }
    
    let endRect = uiSlots[targetIndex].getBoundingClientRect();
    if (startEl) playTransferAnimation(startEl, endRect, uiSlots[targetIndex]);
    
    renderInventory();
    renderCrafting();
}

function moveAllToCrafting(item, startEl) {
    if (item.count <= 0) return;
    if (!validateCraftingType(item)) return log("Crafting slots must contain the same petal!", "#f44");

    craftResultShowing = false;
    
    let startRect = startEl ? startEl.getBoundingClientRect() : null;

    const totalToMove = item.count;
    item.count = 0;
    
    let existingTotal = craftingSlots.reduce((sum, s) => sum + (s ? s.count : 0), 0);
    let totalToDistribute = existingTotal + totalToMove;
    
    let base = Math.floor(totalToDistribute / 5);
    let remainder = totalToDistribute % 5;
    
    let targets = [];
    for (let i = 0; i < 5; i++) {
        let add = base + (i < remainder ? 1 : 0);
        if (add > 0) {
            if (!craftingSlots[i]) craftingSlots[i] = { itemRef: item, count: add };
            else craftingSlots[i].count = add;
            targets.push(i);
        } else {
            craftingSlots[i] = null;
        }
    }
    
    let endRects = targets.map(i => uiSlots[i].getBoundingClientRect());
    
    if (startEl) {
        targets.forEach((i, idx) => {
            playTransferAnimation(startEl, endRects[idx], uiSlots[i]);
        });
    }
    
    renderInventory();
    renderCrafting();
}

function removeFromCrafting(index, shiftKey, startEl) {
    const slot = craftingSlots[index];
    if (!slot) return;

    craftResultShowing = false;

    const item = slot.itemRef;
    if (shiftKey) {
        slot.itemRef.count += slot.count;
        craftingSlots[index] = null;
    } else {
        slot.itemRef.count++;
        slot.count--;
        if (slot.count <= 0) craftingSlots[index] = null;
    }
    renderInventory();
    renderCrafting();
    
    if (startEl) {
        // Find inventory slot to fly back to
        const invEls = Array.from(uiInventory.children);
        const targetEl = invEls.find(el => el.dataset.id == item.id && el.dataset.rarity == item.rarity);
        if (targetEl) playTransferAnimation(item, startEl, targetEl);
    }
}

function renderCrafting(skipCenterClear = false) {
    if (!skipCenterClear && !craftResultShowing) {
        uiCenter.innerHTML = '';
        uiCenter.className = 'craft-center-effect';
        uiCenter.style.backgroundColor = 'transparent';
    }
    let filledCount = 0;
    let minSets = Infinity;
    let baseItem = null;

    craftingSlots.forEach((slot, index) => {
        const slotEl = uiSlots[index];
        
        if (slot) {
            filledCount++;
            baseItem = slot.itemRef;
            if (slot.count < minSets) minSets = slot.count;
            
            const rData = RARITIES[slot.itemRef.rarity];
            
            if (!slotEl.classList.contains('filled')) {
                slotEl.innerHTML = '';
                let hc = slotEl.classList.contains('hide-contents') ? ' hide-contents' : '';
                slotEl.className = 'slot pentagon-slot filled' + hc;
                
                const bgImg = document.createElement('img');
                bgImg.className = 'bg-img';
                bgImg.src = `img/0_${rData.id}.svg`;
                
                const img = document.createElement('img');
                img.className = 'petal-img';
                img.src = `img/${slot.itemRef.id}_${rData.id}.svg`;
                img.onerror = function() { 
                    this.onerror = function() {
                        this.onerror = null;
                        this.src = `img/1.svg`;
                    };
                    this.src = `img/${slot.itemRef.id}.svg`; 
                };
                
                const count = document.createElement('div');
                count.className = 'count';
                count.innerText = `x${slot.count}`;
                
                slotEl.appendChild(bgImg);
                slotEl.appendChild(img);
                slotEl.appendChild(count);
            } else {
                // Just update count
                const countEl = slotEl.querySelector('.count');
                if (countEl) countEl.innerText = `x${slot.count}`;
            }
        } else {
            if (slotEl.classList.contains('filled')) {
                let hc = slotEl.classList.contains('hide-contents') ? ' hide-contents' : '';
                slotEl.className = 'slot pentagon-slot' + hc;
                slotEl.innerHTML = '';
            }
            minSets = 0;
        }
        
        slotEl.onclick = (e) => removeFromCrafting(index, e.shiftKey, slotEl);
    });

    if (currentMode === 'forge') {
        if (baseItem) {
            let req = forgeCosts[baseItem.name];
            let totalInSlots = 0;
            craftingSlots.forEach(s => { if (s && s.itemRef.name === baseItem.name) totalInSlots += s.count; });
            
            btnCraft.style.setProperty('--color-craft-btn', RARITIES['unique'].color);
            btnCraft.style.setProperty('--color-craft-btn-border', darkenHex(RARITIES['unique'].color, 25));
            
            if (totalInSlots >= req) {
                btnCraft.disabled = false;
                uiChance.innerText = `100% success chance`;
            } else {
                btnCraft.disabled = true;
                uiChance.innerText = `Need ${formatNumber(req)} Super petals`;
            }
        } else {
            btnCraft.disabled = true;
            uiChance.innerText = `0% success chance`;
            btnCraft.style.setProperty('--color-craft-btn', '#5ce0d3');
            btnCraft.style.setProperty('--color-craft-btn-border', '#44a89e');
        }
        saveInventory();
        return;
    }

    if (filledCount === 5 && minSets > 0) {
        const rData = RARITIES[baseItem.rarity];
        const nextRarity = rData.next ? RARITIES[rData.next] : rData;
        btnCraft.style.setProperty('--color-craft-btn', nextRarity.color);
        btnCraft.style.setProperty('--color-craft-btn-border', darkenHex(nextRarity.color, 25));
        if (!rData.next) {
            btnCraft.disabled = true;
            uiChance.innerText = `Max tier reached`;
        } else {
            btnCraft.disabled = false;
            let chance = (baseItem.name.toLowerCase() === 'square') ? 1.0 : rData.chance;
            let percent = chance * 100;
            let displayPercent = percent < 1 && percent > 0 ? percent.toFixed(1) : Math.round(percent);
            uiChance.innerText = `${displayPercent}% success chance`;
        }
    } else {
        if (baseItem) {
            const rData = RARITIES[baseItem.rarity];
            const nextRarity = rData.next ? RARITIES[rData.next] : rData;
            btnCraft.style.setProperty('--color-craft-btn', nextRarity.color);
            btnCraft.style.setProperty('--color-craft-btn-border', darkenHex(nextRarity.color, 25));
        } else {
            btnCraft.style.setProperty('--color-craft-btn', '#5ce0d3');
            btnCraft.style.setProperty('--color-craft-btn-border', '#44a89e');
        }
        btnCraft.disabled = true;
        uiChance.innerText = `0% success chance`;
    }
    
    saveInventory();
}

function simulateCraftingBulk(total, chance) {
    if (total < 1000) {
        let successes = 0;
        let failures = 0;
        let remaining = total;
        while (remaining >= 5) {
            if (Math.random() <= chance) {
                remaining -= 5;
                successes++;
            } else {
                let destroyed = Math.floor(Math.random() * 4) + 1;
                remaining -= destroyed;
                failures++;
            }
        }
        return { successes, failures, remaining };
    } else {
        let p = chance;
        let E_cost = 5 * p + 2.5 * (1 - p);
        let expectedAttempts = total / E_cost;
        let E_X2 = 25 * p + 7.5 * (1 - p);
        let Var_X = E_X2 - (E_cost * E_cost);
        
        let u = 0, v = 0;
        while(u === 0) u = Math.random();
        while(v === 0) v = Math.random();
        let z1 = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        
        let attemptsVar = (total * Var_X) / Math.pow(E_cost, 3);
        let attempts = Math.floor(expectedAttempts + z1 * Math.sqrt(attemptsVar));
        
        let z2 = Math.sqrt(-2.0 * Math.log(u)) * Math.sin(2.0 * Math.PI * v);
        let successes = Math.floor(attempts * p + z2 * Math.sqrt(attempts * p * (1 - p)));
        let failures = Math.max(0, attempts - successes);
        
        return { successes, failures, remaining: Math.floor(Math.random() * 5) };
    }
}

btnCraft.onclick = () => {
    if (btnCraft.disabled) return;
    
    const baseItem = craftingSlots.find(x => x !== null)?.itemRef;
    if (!baseItem) return;
    const rData = RARITIES[baseItem.rarity];
    
    if (currentMode === 'forge') {
        let req = forgeCosts[baseItem.name];
        let totalInSlots = 0;
        craftingSlots.forEach(s => { if (s && s.itemRef.name === baseItem.name) totalInSlots += s.count; });
        
        if (totalInSlots < req) return;
        
        btnCraft.disabled = true;
        
        let forgesDone = 0;
        let totalConsumed = 0;
        let originalReq = req;
        while(totalInSlots >= req) {
            totalInSlots -= req;
            totalConsumed += req;
            forgesDone++;
            req++;
        }
        
        forgeCosts[baseItem.name] = req;
        localStorage.setItem('florr_forge_costs', JSON.stringify(forgeCosts));
        
        let remainingToDeduct = totalConsumed;
        for (let i = 0; i < 5; i++) {
            if (craftingSlots[i] && craftingSlots[i].itemRef.name === baseItem.name) {
                if (craftingSlots[i].count <= remainingToDeduct) {
                    remainingToDeduct -= craftingSlots[i].count;
                    craftingSlots[i] = null;
                } else {
                    craftingSlots[i].count -= remainingToDeduct;
                    remainingToDeduct = 0;
                }
            }
        }
        
        playCraftingAnimation(baseItem, true, () => {
            showResult(forgesDone, forgesDone, baseItem, rData, 'unique');
            addInventory('unique', baseItem.id, baseItem.name, forgesDone);
            renderCrafting(true);
            renderInventory();
            btnCraft.disabled = false;
        }, true);
        return;
    }
    
    let totalPetalsInSlots = 0;
    craftingSlots.forEach(s => { if (s) totalPetalsInSlots += s.count; });
    
    if (totalPetalsInSlots < 5) return; // Need at least 5 to start
    
    btnCraft.disabled = true;
    let chance = (baseItem.name.toLowerCase() === 'square') ? 1.0 : rData.chance;

    let result = simulateCraftingBulk(totalPetalsInSlots, chance);
    let successes = result.successes;
    let failures = result.failures;
    let originalTotal = totalPetalsInSlots;
    totalPetalsInSlots = result.remaining;
    
    let isSuccess = successes > 0;

    playCraftingAnimation(baseItem, isSuccess, () => {
        let attempts = successes + failures;
        let destroyed = originalTotal - totalPetalsInSlots - (successes * 5);
        // Visual result in center
        showResult(successes, attempts, baseItem, rData, null, destroyed);
        
        // Add success petals
        if (successes > 0 && rData.next) {
            addInventory(rData.next, baseItem.id, baseItem.name, successes);
        }

        // Return the remaining unused pool to the crafting slots
        let remaining = totalPetalsInSlots;
        for (let i = 0; i < 5; i++) {
            if (craftingSlots[i]) {
                let toKeep = Math.floor(remaining / (5 - i));
                craftingSlots[i].count = toKeep;
                remaining -= toKeep;
                if (craftingSlots[i].count <= 0) craftingSlots[i] = null;
            }
        }

        renderCrafting(true);
        renderInventory();
        btnCraft.disabled = false;
    });
};

function showResult(successes, attempts, baseItem, rData, resultRarity = null, destroyedCount = 0) {
    uiCenter.innerHTML = '';
    
    if (successes > 0) {
        const nextRarity = resultRarity ? RARITIES[resultRarity] : RARITIES[rData.next];
        uiCenter.className = 'craft-center-effect slot filled anim-pop-out';
        
        const bgImg = document.createElement('img');
        bgImg.className = 'bg-img';
        bgImg.src = `img/0_${nextRarity.id}.svg`;
        
        const img = document.createElement('img');
        img.className = 'petal-img';
        img.src = `img/${baseItem.id}_${nextRarity.id}.svg`;
        img.onerror = function() { 
            this.onerror = function() {
                this.onerror = null;
                this.src = `img/1.svg`;
            };
            this.src = `img/${baseItem.id}.svg`; 
        };
        
        const count = document.createElement('div');
        count.className = 'count';
        count.innerText = `x${formatNumber(successes)}`;
        
        uiCenter.appendChild(bgImg);
        uiCenter.appendChild(img);
        uiCenter.appendChild(count);
        craftResultShowing = true;
                uiCenter.style.cursor = 'pointer';
        uiCenter.style.pointerEvents = 'auto';
        uiCenter.title = 'Click to dismiss';
        uiCenter.onclick = () => {
            craftResultShowing = false;
            uiCenter.onclick = null;
            uiCenter.style.cursor = '';
            uiCenter.style.pointerEvents = '';
            uiCenter.className = 'craft-center-effect';
            uiCenter.innerHTML = '';
            clearCraftingSlots();
        };
        log(`Crafted ${formatNumber(attempts)} times: ${formatNumber(successes)} SUCCESS, ${formatNumber(attempts - successes)} FAILED.`, nextRarity.color);
    } else {
        uiCenter.className = 'craft-center-effect anim-shake';
        
        // Spawn square particle burst from each slot
                const rColor = RARITIES[baseItem.rarity]?.color || '#f44';
        let slotsToBreak = [];
        if (attempts === 1 && destroyedCount > 0 && destroyedCount <= 5) {
            let indices = [0, 1, 2, 3, 4];
            indices.sort(() => Math.random() - 0.5);
            for(let i=0; i<destroyedCount; i++) {
                slotsToBreak.push(uiSlots[indices[i]]);
            }
        } else {
            slotsToBreak = Array.from(uiSlots);
        }

        slotsToBreak.forEach(slot => {
            const rect = slot.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const particleCount = 6;
            for (let p = 0; p < particleCount; p++) {
                const particle = document.createElement('div');
                particle.className = 'craft-fail-particle';
                const size = 2.5 + Math.random() * 3.5; // Even smaller size
                const angle = (p / particleCount) * 360 + Math.random() * 60;
                const dist = 30 + Math.random() * 50; // Shorter distance
                const rad = angle * Math.PI / 180;
                const tx = Math.cos(rad) * dist;
                const ty = Math.sin(rad) * dist;
                const rotation = Math.random() * 720 - 360;
                particle.style.cssText = `
                    width:${size}px; height:${size}px;
                    background:${rColor};
                    left:${cx}px; top:${cy}px;
                    --tx:${tx}px; --ty:${ty}px; --rot:${rotation}deg;
                    border-radius: 1px;
                `;
                document.body.appendChild(particle);
                setTimeout(() => particle.remove(), 800);
            }
        });
        log(`Crafted ${attempts} times: All FAILED.`, '#f44');
    }

    setTimeout(() => {
        uiSlots.forEach(slot => slot.classList.remove('anim-spin-in'));
        if (!craftResultShowing) {
            uiCenter.className = 'craft-center-effect';
            uiCenter.innerHTML = '';
        }
        renderInventory();
        renderCrafting();
    }, 1500);
}
renderInventory();

function darkenHex(hex, percent) {
    let r = parseInt(hex.substring(1,3), 16);
    let g = parseInt(hex.substring(3,5), 16);
    let b = parseInt(hex.substring(5,7), 16);

    r = Math.max(0, Math.floor(r * (100 - percent) / 100));
    g = Math.max(0, Math.floor(g * (100 - percent) / 100));
    b = Math.max(0, Math.floor(b * (100 - percent) / 100));

    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function formatNumber(num) {
    if (num < 1000) return Math.floor(num).toString();
    if (num < 1000000) return (num / 1000).toFixed(1) + 'k';
    if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
    if (num < 1000000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (num < 1000000000000000) return (num / 1000000000000).toFixed(1) + 'T';
    if (num < 1000000000000000000) return (num / 1000000000000000).toFixed(1) + 'Qa';
    return num.toExponential(2);
}



let isAnimating = false;

function playTransferAnimation(startEl, endRect, endEl, callback) {
    if (!startEl || !endRect) {
        if (callback) callback();
        return;
    }
    
    let startRect = startEl.getBoundingClientRect();
    endEl.classList.add('hide-contents');
    
    const animEl = document.createElement('div');
    animEl.className = 'transfer-anim';
    animEl.style.width = startRect.width + 'px';
    animEl.style.height = startRect.height + 'px';
    
    const startX = startRect.left;
    const startY = startRect.top;
    
    // Clone images from the source element
    const imgs = startEl.querySelectorAll('img');
    imgs.forEach(img => {
        animEl.appendChild(img.cloneNode(true));
    });
    // Add petal-img class to ensure it spins if it has it
    let pImg = animEl.querySelectorAll('img')[1];
    if (pImg) pImg.classList.add('petal-img');
    
    document.body.appendChild(animEl);
    
    const endX = endRect.left + (endRect.width - startRect.width) / 2;
    const endY = endRect.top + (endRect.height - startRect.height) / 2;
    
    // Use requestAnimationFrame for reliable animation
    let startTime = null;
    function animate(time) {
        if (!startTime) startTime = time;
        let progress = (time - startTime) / 400; // 400ms duration
        if (progress >= 1.0) {
            animEl.style.transform = `translate(${endX}px, ${endY}px)`;
            if (document.body.contains(animEl)) document.body.removeChild(animEl);
            endEl.classList.remove('hide-contents');
            if (callback) callback();
            return;
        }
        // cubic-bezier(0.25, 1, 0.5, 1) approx: ease-out
        let ease = 1 - Math.pow(1 - progress, 3);
        let currentX = startX + (endX - startX) * ease;
        let currentY = startY + (endY - startY) * ease;
        animEl.style.transform = `translate(${currentX}px, ${currentY}px)`;
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
}

function playCraftingAnimation(baseItem, isSuccess, resultCallback, isForge = false) {
    const pentagon = document.getElementById('pentagon-container');
    const rData = RARITIES[baseItem.rarity];
    
    let duration = 2000;
    if (rData.id === 2) duration = 3000; // unusual
    if (rData.id === 3) duration = 4500; // rare
    if (rData.id === 4) duration = 6000; // epic
    if (rData.id >= 5) duration = 8000; // legendary+
    
    if (isForge) duration = 3000;

    const animContainer = document.createElement('div');
    animContainer.className = 'crafting-anim-container';
    pentagon.appendChild(animContainer);
    
    // Hide the actual slots while animating
    uiSlots.forEach(s => {
        s.style.opacity = '0';
    });
    uiCenter.innerHTML = '';
    uiCenter.className = 'craft-center-effect';

    const centerX = pentagon.offsetWidth / 2;
    const centerY = pentagon.offsetHeight / 2;

    const petals = [];
    for (let i = 0; i < 5; i++) {
        const slotEl = uiSlots[i];
        const dx = slotEl.offsetLeft - centerX;
        const dy = slotEl.offsetTop - centerY;
        const initialRadius = Math.sqrt(dx*dx + dy*dy);
        const initialAngle = Math.atan2(dy, dx);

        const petal = document.createElement('div');
        petal.className = 'crafting-anim-petal';
        
        const bgImg = document.createElement('img');
        bgImg.src = `img/0_${rData.id}.svg`;
        
        const img = document.createElement('img');
        img.src = `img/${baseItem.id}_${rData.id}.svg`;
        img.onerror = function() { 
            this.onerror = null; this.src = `img/${baseItem.id}.svg`; 
        };
        
        petal.appendChild(bgImg);
        petal.appendChild(img);
        animContainer.appendChild(petal);
        
        petals.push({
            el: petal,
            initialRadius: initialRadius,
            initialAngle: initialAngle
        });
    }
    
    let startTime = null;
    let animId = null;
    
    function animate(time) {
        if (!startTime) startTime = time;
        const progress = (time - startTime) / duration;
        
        if (progress >= 1.0) {
            cancelAnimationFrame(animId);
            animContainer.remove();
            uiSlots.forEach(s => { s.style.opacity = '1'; });
            resultCallback();
            return;
        }
        
        // Easing function for speed: Starts slow, gets very fast. Use power curve for acceleration.
        const easedProgress = Math.pow(progress, 3); // smoother curve
        
        // Total rotations based on duration.
        const totalRotations = Math.min(25, duration / 400); 
        const currentAngle = easedProgress * totalRotations * Math.PI * 2;
        
        // Pulse frequency increases with progress
        const pulseFreq = 3 + progress * 8; 
        
        // We use a scale factor for the radius. Starts at 1.0.
        // It pulses inwards mostly, so we use negative sin.
        // The pulsing gets more intense (larger amplitude) as progress increases, up to a point.
        let radiusScale = 1.0 - Math.abs(Math.sin(progress * Math.PI * 2 * pulseFreq)) * 0.2 * Math.sin(progress * Math.PI);
        
        if (progress > 0.9 && isSuccess) {
            // Dive into center
            const diveProgress = (progress - 0.9) / 0.1;
            radiusScale = radiusScale * (1 - Math.pow(diveProgress, 3));
        } else if (progress > 0.9 && !isSuccess) {
            // Slight freeze/jitter effect before explosion
            radiusScale += (Math.random() - 0.5) * 0.05;
        }

        petals.forEach((p) => {
            const angle = currentAngle + p.initialAngle;
            const r = p.initialRadius * radiusScale;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            
            p.el.style.transform = `translate(${x}px, ${y}px)`;
        });
        
        animId = requestAnimationFrame(animate);
    }
    
    animId = requestAnimationFrame(animate);
}
