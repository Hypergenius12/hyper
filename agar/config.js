const Config = {
    MAP_WIDTH: 40000,
    MAP_HEIGHT: 40000,
    MAX_FOOD: 6000,
    MAX_VIRUSES: 120,
    MAX_MOTHER_CELLS: 150,
    MAX_BOTS: 200,
    
    // Mechanics
    FOOD_MASS: 1,
    EJECTED_MASS: 14, // Mass of W pellet
    VIRUS_MASS: 100, // Starting mass of a virus
    VIRUS_MAX_MASS: 180, // Virus splits when it hits this mass
    MOTHER_CELL_MASS: 250,
    MOTHER_CELL_MAX_MASS: 800,
    START_MASS: 10,
    BASE_SPEED: 28,
    SPEED_SCALE: 0.25, // Lowered from 0.44 so players keep more speed when huge
    
    // Speeds
    EJECT_SPEED: 35,
    SPLIT_SPEED: 50,
    
    // Sizes
    MIN_EJECT_MASS: 35, // Minimum mass to press W
    MIN_SPLIT_MASS: 35, // Minimum mass to split
    
    // Physics decay
    SPEED_DECAY: 0.85,
    
    // Merging
    MERGE_TIME_BASE: 10, // seconds
    MERGE_TIME_SCALE: 0.01, // seconds per mass
    
    // Bot configs (Easy-Medium)
    BOT_VISION_RADIUS: 1500,
    BOT_UPDATE_INTERVAL: 5 // ticks between thinking
};
