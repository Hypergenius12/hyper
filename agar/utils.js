const MathUtils = {
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },

    distanceSq(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return dx * dx + dy * dy;
    },

    // Convert mass to radius. Standard Agar.io formula is approx sqrt(mass) * constant
    massToRadius(mass) {
        return Math.sqrt(mass * 100);
    },

    // Get random color
    getRandomColor() {
        const colors = [
            '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
            '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
            '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800',
            '#FF5722'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },

    randomRange(min, max) {
        return Math.random() * (max - min) + min;
    },

    lerp(start, end, amt) {
        return (1 - amt) * start + amt * end;
    },
    
    usedBotNames: new Set(),
    generateBotName() {
        const names = [
            "doge", "sir", "sanik", "ayy lmao", "pepe", "wojak",
            "bot", "player", "guest", "pro", "noob", "agar",
            "cell", "blob", "titan", "hunter", "runner", "food",
            "alpha", "beta", "gamma", "delta", "omega", "sigma"
        ];
        
        let attempts = 0;
        let finalName = "";
        do {
            const base = names[Math.floor(Math.random() * names.length)];
            const num = Math.floor(Math.random() * 999) + 1;
            finalName = `${base}${num}`;
            attempts++;
        } while (this.usedBotNames.has(finalName) && attempts < 100);
        
        this.usedBotNames.add(finalName);
        return finalName;
    }
};

if (typeof module !== 'undefined') module.exports = { MathUtils };
