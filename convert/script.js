/* ==========================================================================
   THEME TOGGLE LOGIC
   ========================================================================== */
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('omniTheme', isDark ? 'dark' : 'light');
}

// Auto-load theme preference
if (localStorage.getItem('omniTheme') === 'dark') {
    document.body.classList.add('dark-mode');
}

/* ==========================================================================
   OMNI-DIMENSIONAL UNIT & ENTITY DATABASE
   ========================================================================== */

const omniDB = {
    // Length
    "Meters": { c: "u", d: "l", val: 1, cat: "Standard Units (Length)" },
    "Centimeters": { c: "u", d: "l", val: 0.01, cat: "Standard Units (Length)" },
    "Millimeters": { c: "u", d: "l", val: 0.001, cat: "Standard Units (Length)" },
    "Micrometers": { c: "u", d: "l", val: 1e-6, cat: "Standard Units (Length)" },
    "Nanometers": { c: "u", d: "l", val: 1e-9, cat: "Standard Units (Length)" },
    "Kilometers": { c: "u", d: "l", val: 1000, cat: "Standard Units (Length)" },
    "Inches": { c: "u", d: "l", val: 0.0254, cat: "Standard Units (Length)" },
    "Feet": { c: "u", d: "l", val: 0.3048, cat: "Standard Units (Length)" },
    "Yards": { c: "u", d: "l", val: 0.9144, cat: "Standard Units (Length)" },
    "Miles": { c: "u", d: "l", val: 1609.34, cat: "Standard Units (Length)" },
    "Light Years": { c: "u", d: "l", val: 9.461e15, cat: "Standard Units (Length)" },
    "Astronomical Units (AU)": { c: "u", d: "l", val: 1.496e11, cat: "Standard Units (Length)" },

    // Mass
    "Kilograms": { c: "u", d: "m", val: 1, cat: "Standard Units (Mass)" },
    "Grams": { c: "u", d: "m", val: 0.001, cat: "Standard Units (Mass)" },
    "Metric Tons (Tonnes)": { c: "u", d: "m", val: 1000, cat: "Standard Units (Mass)" },
    "Pounds": { c: "u", d: "m", val: 0.453592, cat: "Standard Units (Mass)" },
    "Ounces": { c: "u", d: "m", val: 0.0283495, cat: "Standard Units (Mass)" },
    "Solar Masses": { c: "u", d: "m", val: 1.989e30, cat: "Standard Units (Mass)" },
    "Earth Masses": { c: "u", d: "m", val: 5.972e24, cat: "Standard Units (Mass)" },

    // Time
    "Seconds": { c: "u", d: "t", val: 1, cat: "Standard Units (Time)" },
    "Minutes": { c: "u", d: "t", val: 60, cat: "Standard Units (Time)" },
    "Hours": { c: "u", d: "t", val: 3600, cat: "Standard Units (Time)" },
    "Days": { c: "u", d: "t", val: 86400, cat: "Standard Units (Time)" },
    "Years (365 Days)": { c: "u", d: "t", val: 31536000, cat: "Standard Units (Time)" },
    "Centuries": { c: "u", d: "t", val: 3153600000, cat: "Standard Units (Time)" },
    "Keats": { c: "u", d: "t", val: 1, cat: "Standard Units (Time)" },

    // Speed
    "Meters per second": { c: "u", d: "s", val: 1, cat: "Standard Units (Speed)" },
    "Kilometers per hour": { c: "u", d: "s", val: 0.277778, cat: "Standard Units (Speed)" },
    "Miles per hour": { c: "u", d: "s", val: 0.44704, cat: "Standard Units (Speed)" },
    "Speed of Light (Vacuum)": { c: "u", d: "s", val: 299792458, cat: "Standard Units (Speed)" },
    "Speed of Sound (Sea Level)": { c: "u", d: "s", val: 340.29, cat: "Standard Units (Speed)" },

    // Volume
    "Liters": { c: "u", d: "v", val: 1, cat: "Standard Units (Volume)" },
    "Milliliters": { c: "u", d: "v", val: 0.001, cat: "Standard Units (Volume)" },
    "Gallons (US Liquid)": { c: "u", d: "v", val: 3.78541, cat: "Standard Units (Volume)" },
    "Cups (US Legal)": { c: "u", d: "v", val: 0.24, cat: "Standard Units (Volume)" },
    "Fluid Ounces (US)": { c: "u", d: "v", val: 0.0295735, cat: "Standard Units (Volume)" },

    // Data
    "Megabytes (MB)": { c: "u", d: "data", val: 1, cat: "Standard Units (Data)" },
    "Gigabytes (GB)": { c: "u", d: "data", val: 1000, cat: "Standard Units (Data)" },
    "Terabytes (TB)": { c: "u", d: "data", val: 1e6, cat: "Standard Units (Data)" },
    "Petabytes (PB)": { c: "u", d: "data", val: 1e9, cat: "Standard Units (Data)" },
    "Bytes": { c: "u", d: "data", val: 1e-6, cat: "Standard Units (Data)" },

    // Area
    "Sq Meters": { c: "u", d: "a", val: 1, cat: "Standard Units (Area)" },
    "Sq Kilometers": { c: "u", d: "a", val: 1e6, cat: "Standard Units (Area)" },
    "Sq Miles": { c: "u", d: "a", val: 2589988, cat: "Standard Units (Area)" },
    "Acres": { c: "u", d: "a", val: 4046.86, cat: "Standard Units (Area)" },

    // Energy
    "Joules": { c: "u", d: "e", val: 1, cat: "Standard Units (Energy)" },
    "Calories (Science)": { c: "u", d: "e", val: 4.184, cat: "Standard Units (Energy)" },
    "Kilocalories (Food Calories)": { c: "u", d: "e", val: 4184, cat: "Standard Units (Energy)" },
    "Kilowatt-hours": { c: "u", d: "e", val: 3.6e6, cat: "Standard Units (Energy)" },
    "Tons of TNT Equivalent": { c: "u", d: "e", val: 4.184e9, cat: "Standard Units (Energy)" },

    // Pressure
    "Pascals": { c: "u", d: "p", val: 1, cat: "Standard Units (Pressure)" },
    "Atmospheres (Standard)": { c: "u", d: "p", val: 101325, cat: "Standard Units (Pressure)" },
    "PSI (Pounds per Sq Inch)": { c: "u", d: "p", val: 6894.76, cat: "Standard Units (Pressure)" },

    // Pain
    "Dols (Pain Scale)": { c: "u", d: "pain", val: 1, cat: "Standard Units (Pain)" },

    // Price
    "US Dollars (USD)": { c: "u", d: "price", val: 1, cat: "Standard Units (Price)" },
    "Euros (EUR)": { c: "u", d: "price", val: 1.1, cat: "Standard Units (Price)" },
    "British Pounds (GBP)": { c: "u", d: "price", val: 1.25, cat: "Standard Units (Price)" },
    "Japanese Yen (JPY)": { c: "u", d: "price", val: 0.007, cat: "Standard Units (Price)" },
    "Bitcoin (BTC)": { c: "u", d: "price", val: 65000, cat: "Standard Units (Price)" },
    "Gold (1 Troy Ounce)": { c: "u", d: "price", val: 2300, cat: "Standard Units (Price)" },
    "Silver (1 Troy Ounce)": { c: "u", d: "price", val: 30, cat: "Standard Units (Price)" },
    "Barrel of Oil (WTI)": { c: "u", d: "price", val: 80, cat: "Standard Units (Price)" },

    // Temperature (offset relative to Kelvin)
    "Kelvin (K)": { c: "u", d: "temp", val: 1, offset: 0, cat: "Standard Units (Temperature)" },
    "Celsius (°C)": { c: "u", d: "temp", val: 1, offset: 273.15, cat: "Standard Units (Temperature)" },
    "Fahrenheit (°F)": { c: "u", d: "temp", val: 5/9, offset: 459.67, cat: "Standard Units (Temperature)" },

    // Architecture & Landmarks
    "Titanic Ship": { c: "e", l: 269, m: 4.76e7, s: 12.08, v: 1.3e8, t: 3.15e7, data: 1.5e6, e: 4e11, a: 9000, p: 101325, pain: 0, price: 7500000, temp: 275, cat: "Architecture & Landmarks" },
    "Eiffel Tower": { c: "e", l: 330, m: 1.01e7, s: 0, v: 8.5e6, t: 4.2e9, data: 500, e: 5.1e10, a: 15625, p: 101325, pain: 0, price: 1500000, temp: 288, cat: "Architecture & Landmarks" },
    "Burj Khalifa": { c: "e", l: 828, m: 5e8, s: 0, v: 3.3e8, t: 3.1e9, data: 20000, e: 1.6e12, a: 309473, p: 101325, pain: 0, price: 1500000000, temp: 310, cat: "Architecture & Landmarks" },
    "Empire State Building": { c: "e", l: 381, m: 3.3e8, s: 0, v: 1.04e9, t: 2.9e9, data: 10000, e: 6.2e11, a: 208879, p: 101325, pain: 0, price: 40989000, temp: 288, cat: "Architecture & Landmarks" },
    "Mount Everest": { c: "e", l: 8848, m: 1.6e14, s: 0, v: 5.5e13, t: 1.5e15, data: 1e12, e: 6.9e18, a: 4.5e9, p: 33700, pain: 0, price: 0, temp: 240, cat: "Architecture & Landmarks" },
    "Great Pyramid of Giza": { c: "e", l: 138.8, m: 6e9, s: 0, v: 2.58e9, t: 1.4e11, data: 800, e: 4.1e12, a: 52900, p: 101325, pain: 0, price: 1200000000, temp: 315, cat: "Architecture & Landmarks" },
    "Statue of Liberty": { c: "e", l: 93, m: 2.04e5, s: 0, v: 1.5e6, t: 4.2e9, data: 300, e: 8.5e10, a: 2500, p: 101325, pain: 0, price: 500000, temp: 285, cat: "Architecture & Landmarks" },
    "Grand Canyon": { c: "e", l: 446000, m: 1.2e15, s: 0, v: 4.1e15, t: 1.8e14, data: 1e14, e: 0, a: 4.9e9, p: 101325, pain: 0, price: 0, temp: 290, cat: "Architecture & Landmarks" },
    "Burj Al Arab": { c: "e", l: 321, m: 2e8, s: 0, v: 2e7, t: 2e9, data: 5000, e: 1e11, a: 50000, p: 101325, pain: 0, price: 1000000000, temp: 310, cat: "Architecture & Landmarks" },
    "The Great Sphinx": { c: "e", l: 73, m: 2e7, s: 0, v: 5e6, t: 1.4e11, data: 100, e: 0, a: 4000, p: 101325, pain: 0, price: 0, temp: 315, cat: "Architecture & Landmarks" },
    "Average House (US)": { c: "e", l: 15, m: 150000, s: 0, v: 600000, t: 3e9, data: 0, e: 0, a: 200, p: 101325, pain: 0, price: 400000, temp: 295, cat: "Architecture & Landmarks" },

    // Fictional / Sci-Fi Entities
    "The Death Star (Star Wars)": { c: "e", l: 120000, m: 1e15, s: 3e8, v: 9e14, t: 1e8, data: 1e20, e: 1e32, a: 4.5e10, p: 101325, pain: 0, price: 8.5e15, temp: 293, cat: "Fictional / Sci-Fi Entities" },
    "Millennium Falcon": { c: "e", l: 34.75, m: 1e5, s: 3e8, v: 5000, t: 1e9, data: 1e10, e: 1e15, a: 1000, p: 101325, pain: 0, price: 100000000, temp: 293, cat: "Fictional / Sci-Fi Entities" },
    "TARDIS (Doctor Who)": { c: "e", l: 1.3, m: 3000, s: 3e8, v: 1e15, t: 1e15, data: 1e25, e: 1e30, a: 5, p: 101325, pain: 0, price: 1e12, temp: 293, cat: "Fictional / Sci-Fi Entities" },
    "Godzilla": { c: "e", l: 119.8, m: 90000000, s: 40, v: 90000000, t: 2e9, data: 0, e: 1e16, a: 8000, p: 101325, pain: 10, price: 0, temp: 315, cat: "Fictional / Sci-Fi Entities" },
    "King Kong": { c: "e", l: 31.6, m: 1400000, s: 25, v: 1400000, t: 1e9, data: 0, e: 5e10, a: 500, p: 101325, pain: 5, price: 0, temp: 310, cat: "Fictional / Sci-Fi Entities" },
    "A Lightsaber": { c: "e", l: 1.2, m: 1.5, s: 0, v: 0.5, t: 1e9, data: 0, e: 1e9, a: 0.05, p: 101325, pain: 9, price: 150000, temp: 8000, cat: "Fictional / Sci-Fi Entities" },
    "The One Ring": { c: "e", l: 0.02, m: 0.01, s: 0, v: 0.005, t: 1e12, data: 0, e: 1e15, a: 0.0003, p: 101325, pain: 1, price: 1e9, temp: 293, cat: "Fictional / Sci-Fi Entities" },

    // Vehicles & Tech
    "Boeing 747": { c: "e", l: 70.6, m: 183500, s: 255, v: 876000, t: 9.4e8, data: 5000, e: 1.4e10, a: 511, p: 101325, pain: 0, price: 400000000, temp: 293, cat: "Vehicles & Tech" },
    "Space Shuttle": { c: "e", l: 37.2, m: 2.03e6, s: 7850, v: 4.5e6, t: 9.4e8, data: 10240, e: 3.3e13, a: 250, p: 0, pain: 0, price: 1700000000, temp: 293, cat: "Vehicles & Tech" },
    "Tesla Model 3": { c: "e", l: 4.69, m: 1611, s: 61, v: 2800, t: 4.7e8, data: 64000, e: 2.16e8, a: 8.6, p: 101325, pain: 0, price: 40000, temp: 293, cat: "Vehicles & Tech" },
    "Standard iPhone 15": { c: "e", l: 0.147, m: 0.171, s: 0, v: 0.08, t: 1.2e8, data: 128000, e: 46000, a: 0.01, p: 101325, pain: 0, price: 800, temp: 305, cat: "Vehicles & Tech" },
    "A Laptop (MacBook Pro)": { c: "e", l: 0.3, m: 1.6, s: 0, v: 1.5, t: 2e8, data: 512000, e: 350000, a: 0.07, p: 101325, pain: 0, price: 2000, temp: 315, cat: "Vehicles & Tech" },
    "Standard Car": { c: "e", l: 4.5, m: 1400, s: 30, v: 2500, t: 3.8e8, data: 500, e: 1.8e8, a: 8, p: 101325, pain: 0, price: 35000, temp: 293, cat: "Vehicles & Tech" },

    // Biological & Living
    "Danny DeVito": { c: "e", l: 1.47, m: 88, s: 3.5, v: 85, t: 2.556e9, data: 1500, e: 3.7e7, a: 1.8, p: 101325, pain: 1.5, price: 50000000, temp: 310.15, cat: "Biological & Living" },
    "Average Adult Human Male": { c: "e", l: 1.75, m: 85, s: 5.5, v: 80, t: 2.3e9, data: 1500, e: 3.5e7, a: 2.0, p: 101325, pain: 1.5, price: 1000000, temp: 310.15, cat: "Biological & Living" },
    "Blue Whale": { c: "e", l: 24, m: 1.5e5, s: 10.2, v: 1.5e5, t: 2.8e9, data: 8000, e: 6.2e10, a: 300, p: 101325, pain: 0, price: 0, temp: 310, cat: "Biological & Living" },
    "House Cat": { c: "e", l: 0.46, m: 4.5, s: 13.4, v: 4.5, t: 4.7e8, data: 800, e: 1.8e6, a: 0.24, p: 101325, pain: 0, price: 50, temp: 311.65, cat: "Biological & Living" },

    // Everyday Objects
    "A Single Banana": { c: "e", l: 0.18, m: 0.12, s: 0, v: 0.12, t: 1.2e6, data: 0.5, e: 439000, a: 0.03, p: 101325, pain: 0, price: 0.25, temp: 293, cat: "Everyday Objects" },
    "A Slice of Pizza": { c: "e", l: 0.25, m: 0.15, s: 0, v: 0.3, t: 6.0e5, data: 0, e: 1.1e6, a: 0.04, p: 101325, pain: 0, price: 3.50, temp: 330, cat: "Everyday Objects" },
    "A Cup of Coffee": { c: "e", l: 0.1, m: 0.25, s: 0, v: 0.25, t: 7200, data: 0, e: 2000, a: 0.02, p: 101325, pain: 0, price: 4.00, temp: 343, cat: "Everyday Objects" },
    "An Apple": { c: "e", l: 0.08, m: 0.15, s: 0, v: 0.15, t: 1e6, data: 0.5, e: 400000, a: 0.02, p: 101325, pain: 0, price: 0.50, temp: 293, cat: "Everyday Objects" },

    // Cosmic, Geographic & Environmental
    "The Earth": { c: "e", l: 12742000, m: 5.97e24, s: 29780, v: 1.08e24, t: 1.4e17, data: 1e24, e: 2.6e33, a: 5.1e14, p: 101325, pain: 0, price: 5e15, temp: 288, cat: "Cosmic, Geographic & Environmental" },
    "The Sun": { c: "e", l: 1.39e9, m: 1.98e30, s: 220000, v: 1.41e30, t: 1.4e17, data: 1e28, e: 3.8e26, a: 6.09e18, p: 2.6e16, pain: 0, price: 0, temp: 5778, cat: "Cosmic, Geographic & Environmental" },
    "Milky Way Galaxy": { c: "e", l: 1e21, m: 3e42, s: 2.1e6, v: 3e60, t: 4.3e17, data: 1e40, e: 1e50, a: 1e42, p: 1e-15, pain: 0, price: 0, temp: 2.7, cat: "Cosmic, Geographic & Environmental" },

    // Pain Benchmarks
    "Bee Sting (Schmidt Scale)": { c: "e", l: 0.001, m: 0.0001, s: 5, v: 0.0001, t: 3600, data: 0, e: 1, a: 0.00001, p: 200000, pain: 2, price: 0, temp: 310, cat: "Pain Benchmarks" },
    "Childbirth (Average)": { c: "e", l: 0, m: 0, s: 0, v: 0, t: 28800, data: 0, e: 1e6, a: 0, p: 0, pain: 8, price: 10000, temp: 310, cat: "Pain Benchmarks" },
    "Stepping on a Lego": { c: "e", l: 0.03, m: 0.002, s: 0, v: 0.005, t: 1e9, data: 0, e: 0, a: 0.0009, p: 101325, pain: 3, price: 0.10, temp: 293, cat: "Pain Benchmarks" },

    // Extreme Temperatures
    "Absolute Zero": { c: "e", l: 0, m: 0, s: 0, v: 0, t: 0, data: 0, e: 0, a: 0, p: 0, pain: 0, price: 0, temp: 0, cat: "Extreme Temperatures" },
    "Liquid Nitrogen": { c: "e", l: 0, m: 1, s: 0, v: 1, t: 1e6, data: 0, e: 0, a: 0, p: 101325, pain: 5, price: 2, temp: 77, cat: "Extreme Temperatures" },
    "Core of a Microwaveable Hot Pocket": { c: "e", l: 0.1, m: 0.1, s: 0, v: 0.1, t: 3600, data: 0, e: 100000, a: 0.01, p: 101325, pain: 8, price: 2.50, temp: 373e6, cat: "Extreme Temperatures" },

    // Expanded Entities
    "Tardigrade (Water Bear)": { c: "e", l: 0.0005, m: 1e-8, s: 0.0001, v: 1e-8, t: 3.1e7, data: 0.1, e: 0.1, a: 1e-6, p: 6e8, pain: 10, price: 0, temp: 293, cat: "Biological & Living" },
    "Giant Redwood Tree (General Sherman)": { c: "e", l: 83.8, m: 1.9e6, s: 0, v: 1487, t: 7.8e10, data: 0, e: 3.8e10, a: 2500, p: 101325, pain: 0, price: 0, temp: 285, cat: "Biological & Living" },
    "A Hummingbird": { c: "e", l: 0.1, m: 0.004, s: 15, v: 0.004, t: 1.5e8, data: 5, e: 200, a: 0.02, p: 101325, pain: 1, price: 500, temp: 313, cat: "Biological & Living" },

    "A Standard AA Battery": { c: "e", l: 0.05, m: 0.023, s: 0, v: 0.008, t: 1.5e8, data: 0, e: 10000, a: 0.002, p: 101325, pain: 0, price: 1, temp: 293, cat: "Everyday Objects" },
    "A Stick of Dynamite": { c: "e", l: 0.2, m: 0.19, s: 0, v: 0.15, t: 3.1e7, data: 0, e: 1e6, a: 0.01, p: 101325, pain: 10, price: 5, temp: 293, cat: "Everyday Objects" },
    "A Single Grain of Sand": { c: "e", l: 0.001, m: 5e-7, s: 0, v: 5e-7, t: 1e15, data: 0, e: 0, a: 1e-6, p: 101325, pain: 0, price: 0, temp: 293, cat: "Everyday Objects" },
    "A Standard Shipping Container (TEU)": { c: "e", l: 6.1, m: 2200, s: 0, v: 33000, t: 6e8, data: 0, e: 0, a: 15, p: 101325, pain: 0, price: 2000, temp: 293, cat: "Everyday Objects" },

    "The Moon": { c: "e", l: 3474800, m: 7.34e22, s: 1022, v: 2.19e22, t: 1.4e17, data: 0, e: 3.8e28, a: 3.79e13, p: 0, pain: 0, price: 0, temp: 250, cat: "Cosmic, Geographic & Environmental" },
    "Jupiter": { c: "e", l: 139820000, m: 1.89e27, s: 13070, v: 1.43e27, t: 1.4e17, data: 0, e: 1.6e35, a: 6.14e16, p: 1e11, pain: 0, price: 0, temp: 165, cat: "Cosmic, Geographic & Environmental" },
    "Mariana Trench (Deepest Point)": { c: "e", l: 10984, m: 0, s: 0, v: 0, t: 1.4e17, data: 0, e: 0, a: 0, p: 1.08e8, pain: 0, price: 0, temp: 274, cat: "Cosmic, Geographic & Environmental" },
    "A Black Hole (1 Solar Mass)": { c: "e", l: 5900, m: 1.98e30, s: 0, v: 0, t: 1e60, data: 1e77, e: 1.7e47, a: 1.1e8, p: Infinity, pain: Infinity, price: 0, temp: 0, cat: "Cosmic, Geographic & Environmental" },

    "A Minecraft Block": { c: "e", l: 1, m: 1000, s: 0, v: 1000, t: 1e10, data: 4096, e: 0, a: 6, p: 101325, pain: 0, price: 0, temp: 293, cat: "Fictional / Sci-Fi Entities" },
    "The Flash (Barry Allen)": { c: "e", l: 1.8, m: 80, s: 299792458, v: 75, t: 2.5e9, data: 1e9, e: 3.5e18, a: 2, p: 101325, pain: 0.1, price: 0, temp: 310, cat: "Fictional / Sci-Fi Entities" }
};

// Flag biological/cosmic entities as live-aging
for (let key in omniDB) {
    if (omniDB[key].cat === "Biological & Living" || omniDB[key].cat === "Cosmic, Geographic & Environmental") {
        omniDB[key].liveAge = true;
    }
}

/* ==========================================================================
   HUMAN-SCALE UNIVERSAL MATRIX WITH REASONING
   ========================================================================== */
const bridgeRules = {
    'e': {
        toJoules: (val) => val,
        fromJoules: (val) => val,
        reasoning: "Energy is the universal base dimension (already in Joules)."
    },
    'm': {
        toJoules: (val) => val * 4.184e6, 
        fromJoules: (val) => val / 4.184e6,
        reasoning: "Based on human caloric intake: 1 kg of food roughly yields 1,000 kcal (4,184,000 Joules)."
    },
    'l': {
        toJoules: (val) => val * 100, 
        fromJoules: (val) => val / 100,
        reasoning: "Based on physical labor: pushing a 10 kg box 1 meter requires roughly 100 Joules of work."
    },
    't': {
        toJoules: (val) => val * 100, 
        fromJoules: (val) => val / 100,
        reasoning: "Based on resting human metabolism: a typical human burns roughly 100 Joules per second."
    },
    's': {
        toJoules: (val) => 0.5 * 100 * Math.pow(val, 2), 
        fromJoules: (val) => Math.sqrt(Math.max(val / 50, 0)),
        reasoning: "Based on kinetic energy: the energy required to accelerate a 100 kg human to this speed."
    },
    'v': {
        toJoules: (val) => val * 4.184e6, 
        fromJoules: (val) => val / 4.184e6,
        reasoning: "Equating 1 Liter of water to 1 kg of mass, using the food energy equivalent."
    },
    'a': {
        toJoules: (val) => val * 1000, 
        fromJoules: (val) => val / 1000,
        reasoning: "Based on solar energy: 1 square meter receives roughly 1,000 Joules of sunlight per second."
    },
    'data': {
        toJoules: (val) => val * 1, 
        fromJoules: (val) => val / 1,
        reasoning: "Based on modern telecom efficiency: transmitting 1 MB of data uses roughly 1 Joule of energy."
    },
    'p': {
        toJoules: (val) => val * 1, 
        fromJoules: (val) => val / 1,
        reasoning: "Equating 1 Pascal (1 Joule per cubic meter) directly to 1 Joule for simplicity."
    },
    'pain': {
        toJoules: (val) => val * 10, 
        fromJoules: (val) => val / 10,
        reasoning: "Based on nervous system stimulus: 1 Dol of pain correlates to roughly 10 Joules of physical impact."
    },
    'price': {
        toJoules: (val) => val * 20000000,
        fromJoules: (val) => val / 20000000,
        reasoning: "Based on US electricity costs: $1 can buy roughly 20,000,000 Joules (5.5 kWh) of electrical energy."
    },
    'temp': {
        toJoules: (val) => val * 4184,
        fromJoules: (val) => val / 4184,
        reasoning: "Based on thermodynamics: heating 1 Liter of water by 1 Kelvin requires exactly 4,184 Joules."
    }
};

/* ==========================================================================
   LIVE API FETCH ENGINE
   ========================================================================== */
async function fetchLivePrices() {
    const apiStatus = document.getElementById('apiStatus');
    try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        if (data && data.rates) {
            omniDB["Euros (EUR)"].val = 1 / data.rates.EUR;
            omniDB["British Pounds (GBP)"].val = 1 / data.rates.GBP;
            omniDB["Japanese Yen (JPY)"].val = 1 / data.rates.JPY;
        }
        
        const btcRes = await fetch('https://api.coindesk.com/v1/bpi/currentprice.json');
        const btcData = await btcRes.json();
        if (btcData && btcData.bpi && btcData.bpi.USD) {
            omniDB["Bitcoin (BTC)"].val = btcData.bpi.USD.rate_float;
        }

        apiStatus.className = 'api-status live';
        apiStatus.innerHTML = '● Live API Rates Sync Active';
    } catch (err) {
        apiStatus.className = 'api-status offline';
        apiStatus.innerHTML = '● Local Offline Rates Active';
    }
    runOmniConversion(); // Refresh with new prices
}

/* ==========================================================================
   CONVERSION ENGINE
   ========================================================================== */

function swapUnits() {
    const selFrom = document.getElementById('omniFrom');
    const selTo = document.getElementById('omniTo');
    const temp = selFrom.value;
    selFrom.value = selTo.value;
    selTo.value = temp;
    
    // Clear visualizer to reset it correctly
    document.getElementById('omniVisualizer').style.display = 'none';
    runOmniConversion(true);
}

let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playBlip() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

function playTick() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
}

function playError() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
}

let tickAnimation = null;
let conversionStartTime = 0;
let baseInputVal = 1;
let lastTickSec = 0;

function runOmniConversion(resetTime = false) {
    initAudio();
    if (resetTime) {
        conversionStartTime = Date.now();
        baseInputVal = parseFloat(document.getElementById('omniValue').value) || 0;
        lastTickSec = 0;
    }

    if (tickAnimation) cancelAnimationFrame(tickAnimation);
    renderConversionResult(resetTime);
}

function renderConversionResult(isNewConversion = false) {
    const fromKey = document.getElementById('omniFrom').value;
    const toKey = document.getElementById('omniTo').value;
    const fromObj = omniDB[fromKey];
    const toObj = omniDB[toKey];

    // Real-time Existential Ticking
    let elapsedSeconds = (Date.now() - conversionStartTime) / 1000;
    
    let isTicking = false;
    let inputVal = baseInputVal;

    // If converting from Time unit, auto increment input value
    let shouldTickInput = false;
    if (fromObj.c === "u" && fromObj.d === 't') {
        if (toObj.c === "u") {
            shouldTickInput = true;
        } else if (toObj.c === "e" && toObj.liveAge) {
            shouldTickInput = true;
        }
    }

    if (shouldTickInput) {
        inputVal = baseInputVal + (elapsedSeconds / fromObj.val);
        isTicking = true;
    }

    let resultHTML = "";

    function formatVal(num, ticking) {
        if (num === 0) return "0";
        let strNum = num.toString();
        let cls = ticking ? "class='ticking'" : "";
        if (strNum.includes('e') || strNum.length > 15) {
            if (num > 1e12 || num < 1e-6) {
                return `<span ${cls}>${num.toExponential(4)}</span>`;
            } else {
                let fixed = num.toFixed(8);
                return `<span ${cls}>${fixed.replace(/\.?0+$/, "")}</span>`;
            }
        }
        let parsed = parseFloat(num.toPrecision(8));
        return `<span ${cls}>${parsed.toString()}</span>`;
    }

    function getDimName(dimChar) {
        const map = { 'l': "Length", 'm': "Mass", 't': "Time", 's': "Speed", 'v': "Volume", 'data': "Data Storage", 'e': "Energy", 'a': "Surface Area", 'p': "Pressure", 'pain': "Pain (Dols)", 'price': "Price (USD)", 'temp': "Temperature" };
        return map[dimChar] || "Dimension";
    }

    function getBaseValue(obj, dim, val) {
        if (obj.c === "u") {
            return (val + (obj.offset || 0)) * obj.val;
        } else {
            let eVal = obj[dim] || 0;
            if (dim === 't' && obj.liveAge) eVal += elapsedSeconds; // Ticking age of entity!
            return eVal * val;
        }
    }

    function fromBaseValue(obj, baseVal) {
        if (obj.c === "u") {
            return (baseVal / obj.val) - (obj.offset || 0);
        } else {
            return obj[obj.d] || 1; 
        }
    }

    let renderedRatioForVis = null;
    let visItemName = toKey;
    let availableVisDims = [];

    // SCENARIO 1: UNIT to UNIT
    if (fromObj.c === "u" && toObj.c === "u") {
        if (fromObj.d === toObj.d) {
            let baseVal = getBaseValue(fromObj, fromObj.d, inputVal);
            let calculated = fromBaseValue(toObj, baseVal);
            resultHTML = `<b>${formatVal(inputVal, isTicking)} ${fromKey}</b> <br>equals<br> <b style="font-size: 32px;">${formatVal(calculated, isTicking)} ${toKey}</b>`;
            renderedRatioForVis = calculated;
        } else {
            let baseFrom = getBaseValue(fromObj, fromObj.d, inputVal);
            let energyJoules = bridgeRules[fromObj.d].toJoules(baseFrom);
            let targetBaseVal = bridgeRules[toObj.d].fromJoules(energyJoules);
            let finalVal = fromBaseValue(toObj, targetBaseVal);

            resultHTML = `<b>${formatVal(inputVal, isTicking)} ${fromKey}</b> <br>equals<br> <b style="font-size: 32px;">${formatVal(finalVal, isTicking)} ${toKey}</b>
            <br><span class="warning-text">THEORETICAL BRIDGE ACTIVE: Cross-Dimensional Translation.</span>
            <span class="bridge-text">
            <b>Logic Reasoning:</b><br>
            1. Converted ${getDimName(fromObj.d)} to Joules: <i>${bridgeRules[fromObj.d].reasoning}</i><br>
            2. Converted Joules to ${getDimName(toObj.d)}: <i>${bridgeRules[toObj.d].reasoning}</i>
            </span>`;
            renderedRatioForVis = finalVal;
        }
    }
    else if (fromObj.c === "e" && toObj.c === "u") {
        let targetDimension = toObj.d;
        let entityBaseVal = getBaseValue(fromObj, targetDimension, 1);
        if (targetDimension === 't' && fromObj.liveAge) isTicking = true;

        if (targetDimension === 's' && entityBaseVal <= 1e-10) {
            resultHTML = `<b>${inputVal} ${fromKey}</b> <br>equals<br> <b style="font-size: 32px;">0 ${toKey}</b><br><span class="warning-text">Note: ${fromKey} is stationary relative to the Earth's surface. Its speed is 0.</span>`;
            renderedRatioForVis = 0;
        } else {
            let calculated = fromBaseValue(toObj, inputVal * entityBaseVal);
            resultHTML = `<b>${inputVal} ${fromKey}</b> <br>equals<br> <b style="font-size: 32px;">${formatVal(calculated, isTicking)} ${toKey}</b><br><span class="bridge-text">(Extracting the base ${getDimName(targetDimension)} of ${fromKey} to perform the calculation.)</span>`;
            renderedRatioForVis = calculated;
        }
    }
    else if (fromObj.c === "u" && toObj.c === "e") {
        let targetDimension = fromObj.d;
        let entityBaseVal = getBaseValue(toObj, targetDimension, 1);
        if (targetDimension === 't' && toObj.liveAge) isTicking = true;

        if (entityBaseVal <= 1e-10) {
            resultHTML = `<span class="warning-text">Error: Cannot divide by zero.</span><br><span class="bridge-text">The entity <b>"${toKey}"</b> lacks a meaningful measurement for <b>${getDimName(targetDimension)}</b>, making comparison impossible.</span>`;
            renderedRatioForVis = 0;
        } else {
            let baseFrom = getBaseValue(fromObj, targetDimension, inputVal);
            let calculated = baseFrom / entityBaseVal;
            resultHTML = `<b>${formatVal(inputVal, isTicking)} ${fromKey}</b> <br>equals<br> <b style="font-size: 32px;">${formatVal(calculated, isTicking)} ${toKey}s</b><br><span class="bridge-text">(Comparing your input to the standard ${getDimName(targetDimension)} of ${toKey}.)</span>`;
            renderedRatioForVis = calculated;
        }
    }
    // SCENARIO 4: ENTITY to ENTITY
    else if (fromObj.c === "e" && toObj.c === "e") {
        if (fromKey === toKey) {
            resultHTML = `Comparing 1 ${fromKey} to 1 ${toKey} results in a perfect 1:1 existential match.`;
            renderedRatioForVis = 1;
        } else {
            resultHTML = `Comparing <b>${inputVal} ${fromKey}</b> vs <b>1 ${toKey}</b>:<br><br><ul style="text-align:left; font-size:18px; line-height: 1.8; margin: 0 auto; display: inline-block;">`;
            let allDimensions = ['l', 'm', 's', 'v', 't', 'data', 'e', 'a', 'p', 'pain', 'price', 'temp'];
            let warningAdded = false;

            allDimensions.forEach(function(dim) {
                let fromVal = getBaseValue(fromObj, dim, 1);
                let toVal = getBaseValue(toObj, dim, 1);

                if (toVal > 1e-10) {
                    if (dim === 't' && (fromObj.liveAge || toObj.liveAge)) isTicking = true;
                    let calculated = (inputVal * fromVal) / toVal;
                    availableVisDims.push({ dim: dim, ratio: calculated, name: getDimName(dim) });
                    resultHTML += `<li><strong>${getDimName(dim)}:</strong> Equivalent to ${formatVal(calculated, dim==='t')} ${toKey}s.</li>`;
                } else if (fromVal > 1e-10 && toVal <= 1e-10) {
                    warningAdded = true;
                    resultHTML += `<li><strong style="color:#d9534f;">${getDimName(dim)}:</strong> 0 (Cannot compare, ${toKey} lacks this dimension).</li>`;
                }
            });

            if (availableVisDims.length === 0) resultHTML += "<li>No shared physical dimensions found to compare.</li>";
            resultHTML += "</ul>";

            if (warningAdded) {
                resultHTML += `<br><span class="warning-text">Note: Some dimensions yielded a 0 result because ${toKey} lacks a meaningful value.</span>`;
            }
        }
    }

    // Determine SFX to play on new conversion
    if (isNewConversion) {
        if (resultHTML.includes('warning-text') || resultHTML.includes('Error:')) {
            playError();
        } else {
            playBlip();
        }
    }

    document.getElementById('omniResult').innerHTML = resultHTML;

    // INTERACTIVE VISUALIZER RENDERING
    const visContainer = document.getElementById('omniVisualizer');
    
    // Check if we have an active selected dimension from the UI
    const activeVisBtn = document.querySelector('#visControls button.active');
    const requestedVisDim = activeVisBtn ? activeVisBtn.dataset.dim : null;

    if (fromObj.c === "e" && toObj.c === "e" && availableVisDims.length > 0) {
        // Find the selected dim, or default to the first available one
        let selectedDimObj = availableVisDims.find(d => d.dim === requestedVisDim);
        if (!selectedDimObj) selectedDimObj = availableVisDims[0];
        
        renderedRatioForVis = selectedDimObj.ratio;
        visItemName = `${toKey} (${selectedDimObj.name})`;
        
        // Build buttons if not already built with same dims
        const visControls = document.getElementById('visControls');
        if (visControls.children.length === 0) {
            visControls.innerHTML = '';
            availableVisDims.forEach(d => {
                let btn = document.createElement('button');
                btn.innerText = d.name;
                btn.dataset.dim = d.dim;
                if (d.dim === selectedDimObj.dim) btn.classList.add('active');
                btn.onclick = () => {
                    document.querySelectorAll('#visControls button').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    runOmniConversion(false); // Re-render visualizer without resetting time
                };
                visControls.appendChild(btn);
            });
        }
    } else {
        document.getElementById('visControls').innerHTML = ''; // Clear buttons for non e-e
    }

    if (renderedRatioForVis !== null && renderedRatioForVis > 0 && renderedRatioForVis < Infinity) {
        visContainer.style.display = 'block';
        const visGrid = document.getElementById('visGrid');
        
        visGrid.innerHTML = '';
        visGrid.className = 'info-panel';
        
        let dim = requestedVisDim;
        if (!dim && availableVisDims.length > 0) dim = availableVisDims[0].dim;
        if (!dim) dim = toObj.d;

        let ratio = renderedRatioForVis;
        let html = '';
        
        if (dim === 'temp') {
            let fillHeight = Math.min(Math.max(ratio / 10, 5), 100);
            html = `<div class="thermometer-wrap"><div class="thermometer-fill" style="height:${fillHeight}%"></div><div class="thermometer-bulb"></div></div>
                    <div class="info-col"><div class="info-label">Temperature Scale</div></div>`;
        } else if (dim === 'l' || dim === 'v' || dim === 'm') {
            let scale1 = 40;
            let scale2 = Math.min(40 * ratio, 120);
            if (ratio < 1) { scale1 = Math.min(40 / ratio, 120); scale2 = 40; }
            html = `<div class="sphere-wrap">
                        <div class="info-col"><div class="sphere" style="width:${scale1}px; height:${scale1}px;"></div><div class="info-label">${fromKey}</div></div>
                        <div class="info-col"><div class="sphere" style="width:${scale2}px; height:${scale2}px;"></div><div class="info-label">${toKey}</div></div>
                    </div>`;
        } else if (dim === 'a') {
            let scale1 = 120;
            let scale2 = Math.min(120 * Math.sqrt(ratio), 120);
            if (ratio < 1) { scale1 = Math.min(120 / Math.sqrt(ratio), 120); scale2 = 120; }
            html = `<div class="area-wrap">
                        <div class="area-box" style="width:${scale1}px; height:${scale1}px; border-color:#999; background:transparent;"></div>
                        <div class="area-box" style="width:${scale2}px; height:${scale2}px;"></div>
                    </div>`;
        } else if (dim === 't') {
            let w1 = 100; let w2 = Math.min(ratio * 100, 100);
            if (ratio < 1) { w1 = Math.min((1/ratio)*100, 100); w2 = 100; }
            html = `<div class="timeline-wrap">
                        <div class="timeline-bar-bg"><div class="timeline-bar-fill" style="width:${w1}%; background:#999;"></div></div>
                        <div class="info-label">${fromKey}</div>
                        <div class="timeline-bar-bg"><div class="timeline-bar-fill" style="width:${w2}%"></div></div>
                        <div class="info-label">${toKey}</div>
                    </div>`;
        } else if (dim === 'price') {
            let h1 = 50; let h2 = Math.min(ratio * 50, 130);
            if (ratio < 1) { h1 = Math.min((1/ratio)*50, 130); h2 = 50; }
            html = `<div class="finance-wrap">
                        <div class="info-col"><div class="finance-bar" style="height:${h1}px; background:#999;"></div><div class="info-label">${fromKey}</div></div>
                        <div class="info-col"><div class="finance-bar" style="height:${h2}px;"></div><div class="info-label">${toKey}</div></div>
                    </div>`;
        } else if (dim === 's') {
            let w1 = 50; let w2 = Math.min(ratio * 50, 100);
            if (ratio < 1) { w1 = Math.min((1/ratio)*50, 100); w2 = 50; }
            html = `<div class="speed-wrap">
                        <div class="speed-line" style="width:${w1}%; background:#999;"></div>
                        <div class="speed-line" style="width:${w2}%;"></div>
                    </div>`;
        } else {
            let w2 = Math.min(ratio * 10, 100);
            html = `<div class="gauge-wrap">
                        <div class="info-label">Capacity / Intensity</div>
                        <div class="gauge-bar-bg"><div class="gauge-bar-fill" style="width:${w2}%"></div></div>
                    </div>`;
        }
        
        visGrid.innerHTML = html;

        const visCaption = document.getElementById('visCaption');
        visCaption.innerHTML = `Infographic: <b>${formatVal(renderedRatioForVis, isTicking)}</b> ${visItemName}s equivalent.`;
    } else {
        visContainer.style.display = 'none';
    }

    if (isTicking) {
        if (Math.floor(elapsedSeconds) > lastTickSec) {
            playTick();
            lastTickSec = Math.floor(elapsedSeconds);
        }
        tickAnimation = requestAnimationFrame(() => renderConversionResult(false));
    }
}

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */
function initOmniDropdowns() {
    const selFrom = document.getElementById('omniFrom');
    const selTo = document.getElementById('omniTo');
    
    if (!selFrom || !selTo) return;

    const categories = {};
    for (const key in omniDB) {
        const cat = omniDB[key].cat || "Other";
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(key);
    }

    const sortedCats = Object.keys(categories).sort();
    
    let optionsHTML = "";
    sortedCats.forEach(cat => {
        optionsHTML += `<optgroup label="${cat}">`;
        categories[cat].sort().forEach(key => {
            optionsHTML += `<option value="${key}">${key}</option>`;
        });
        optionsHTML += `</optgroup>`;
    });

    selFrom.innerHTML = optionsHTML;
    selTo.innerHTML = optionsHTML;
    
    selFrom.value = "US Dollars (USD)";
    selTo.value = "A Slice of Pizza";
    
    fetchLivePrices();
    
    // Add event listeners that reset time
    document.getElementById('omniValue').addEventListener('input', () => runOmniConversion(true));
    document.getElementById('omniFrom').addEventListener('change', () => runOmniConversion(true));
    document.getElementById('omniTo').addEventListener('change', () => runOmniConversion(true));
}

window.addEventListener('DOMContentLoaded', initOmniDropdowns);
