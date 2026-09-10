const INITIAL_NET_WORTH = 1100000000000;
let currentBalance = INITIAL_NET_WORTH;

// Full 185-item inventory mapped to guaranteed Wikipedia article titles
const items = [
    { id: 1, name: "Pack of Gum", price: 1, wiki: "Chewing_gum", count: 0 },
    { id: 2, name: "Bottle of Water", price: 2, wiki: "Bottled_water", count: 0 },
    { id: 3, name: "Pizza Slice", price: 3, wiki: "Pizza", count: 0 },
    { id: 4, name: "Cup of Coffee", price: 4, wiki: "Coffee", count: 0 },
    { id: 5, name: "Big Mac", price: 5, wiki: "Big_Mac", count: 0 },
    { id: 6, name: "Movie Ticket", price: 15, wiki: "Movie_theater", count: 0 },
    { id: 7, name: "Book", price: 20, wiki: "Book", count: 0 },
    { id: 8, name: "Skateboard", price: 50, wiki: "Skateboard", count: 0 },
    { id: 9, name: "Steak Dinner", price: 50, wiki: "Steak", count: 0 },
    { id: 10, name: "Video Game", price: 60, wiki: "Video_game", count: 0 },
    { id: 11, name: "Pair of Rollerblades", price: 100, wiki: "Inline_skates", count: 0 },
    { id: 12, name: "Concert Ticket", price: 100, wiki: "Concert", count: 0 },
    { id: 13, name: "Spotify Premium (1 Year)", price: 120, wiki: "Spotify", count: 0 },
    { id: 14, name: "Amazon Prime (1 Year)", price: 139, wiki: "Amazon_Prime", count: 0 },
    { id: 15, name: "Year of Netflix", price: 180, wiki: "Netflix", count: 0 },
    { id: 16, name: "Pair of Jordans", price: 200, wiki: "Air_Jordan", count: 0 },
    { id: 17, name: "AirPods", price: 250, wiki: "AirPods", count: 0 },
    { id: 18, name: "Hoverboard", price: 300, wiki: "Self-balancing_scooter", count: 0 },
    { id: 19, name: "Gaming Chair", price: 400, wiki: "Gaming_chair", count: 0 },
    { id: 20, name: "Surfboard", price: 400, wiki: "Surfboard", count: 0 },
    { id: 21, name: "PS5", price: 500, wiki: "PlayStation_5", count: 0 },
    { id: 22, name: "Gym Membership (1 Year)", price: 600, wiki: "Health_club", count: 0 },
    { id: 23, name: "Virtual Reality Headset", price: 800, wiki: "Virtual_reality_headset", count: 0 },
    { id: 24, name: "Electric Scooter", price: 800, wiki: "Motorized_scooter", count: 0 },
    { id: 25, name: "Smartphone", price: 1000, wiki: "Smartphone", count: 0 },
    { id: 26, name: "Dji Drone", price: 1200, wiki: "DJI", count: 0 },
    { id: 27, name: "3D Printer", price: 1500, wiki: "3D_printing", count: 0 },
    { id: 28, name: "E-Bike", price: 2000, wiki: "Electric_bicycle", count: 0 },
    { id: 29, name: "Go-Kart", price: 2500, wiki: "Go-kart", count: 0 },
    { id: 30, name: "Gaming PC", price: 2500, wiki: "Gaming_computer", count: 0 },
    { id: 31, name: "Professional DSLR Camera", price: 3000, wiki: "Digital_single-lens_reflex_camera", count: 0 },
    { id: 32, name: "Designer Handbag", price: 3000, wiki: "Handbag", count: 0 },
    { id: 33, name: "Jet Ski", price: 10000, wiki: "Personal_watercraft", count: 0 },
    { id: 34, name: "Diamond Ring", price: 10000, wiki: "Diamond", count: 0 },
    { id: 35, name: "Used Car", price: 12000, wiki: "Used_car", count: 0 },
    { id: 36, name: "Acre of Land", price: 15000, wiki: "Land_lot", count: 0 },
    { id: 37, name: "Rolex", price: 15000, wiki: "Rolex", count: 0 },
    { id: 38, name: "Exotic Pet Tiger", price: 20000, wiki: "Tiger", count: 0 },
    { id: 39, name: "Motorboat", price: 30000, wiki: "Motorboat", count: 0 },
    { id: 40, name: "Brand New Car", price: 40000, wiki: "Sports_car", count: 0 },
    { id: 41, name: "100 Acres on Mars", price: 50000, wiki: "Mars", count: 0 },
    { id: 42, name: "Grand Piano", price: 50000, wiki: "Piano", count: 0 },
    { id: 43, name: "Speedboat", price: 50000, wiki: "Motorboat", count: 0 },
    { id: 44, name: "Tesla Model S", price: 90000, wiki: "Tesla_Model_S", count: 0 },
    { id: 45, name: "College Education", price: 100000, wiki: "Higher_education", count: 0 },
    { id: 46, name: "Hire a Private Chef", price: 100000, wiki: "Chef", count: 0 },
    { id: 47, name: "Light Aircraft", price: 250000, wiki: "Light_aircraft", count: 0 },
    { id: 48, name: "Ambulance", price: 200000, wiki: "Ambulance", count: 0 },
    { id: 49, name: "House in the Suburbs", price: 350000, wiki: "Suburb", count: 0 },
    { id: 50, name: "Fire Truck", price: 500000, wiki: "Fire_engine", count: 0 },
    { id: 51, name: "Security Team (1 Year)", price: 500000, wiki: "Bodyguard", count: 0 },
    { id: 52, name: "Printed Wikipedia", price: 500000, wiki: "Wikipedia", count: 0 },
    { id: 53, name: "Gold Bar", price: 700000, wiki: "Gold_bar", count: 0 },
    { id: 54, name: "Solid Gold Toilet", price: 1000000, wiki: "Toilet", count: 0 },
    { id: 55, name: "Delivery Truck Fleet", price: 1000000, wiki: "Delivery_truck", count: 0 },
    { id: 56, name: "McDonald's Franchise", price: 1500000, wiki: "McDonald's", count: 0 },
    { id: 57, name: "Private Beyonce Concert", price: 2000000, wiki: "Beyoncé", count: 0 },
    { id: 58, name: "Vintage Comic Book", price: 3000000, wiki: "Comic_book", count: 0 },
    { id: 59, name: "Helicopter", price: 3000000, wiki: "Helicopter", count: 0 },
    { id: 60, name: "1,000 Acres in Texas", price: 5000000, wiki: "Ranch", count: 0 },
    { id: 61, name: "Super Bowl Ad", price: 7000000, wiki: "Super_Bowl", count: 0 },
    { id: 62, name: "Military Tank", price: 8000000, wiki: "Tank", count: 0 },
    { id: 63, name: "Small Hospital", price: 10000000, wiki: "Hospital", count: 0 },
    { id: 64, name: "Mansion", price: 10000000, wiki: "Mansion", count: 0 },
    { id: 65, name: "Custom Space Suit", price: 12000000, wiki: "Space_suit", count: 0 },
    { id: 66, name: "Formula 1 Car", price: 15000000, wiki: "Formula_One_car", count: 0 },
    { id: 67, name: "Private Island", price: 15000000, wiki: "Private_island", count: 0 },
    { id: 68, name: "Classic Song Rights", price: 20000000, wiki: "Vinyl_record", count: 0 },
    { id: 69, name: "Custom Roller Coaster", price: 25000000, wiki: "Roller_coaster", count: 0 },
    { id: 70, name: "Private Jet", price: 25000000, wiki: "Business_jet", count: 0 },
    { id: 71, name: "Luxury Yacht", price: 30000000, wiki: "Luxury_yacht", count: 0 },
    { id: 72, name: "Dinosaur Skeleton", price: 30000000, wiki: "Tyrannosaurus", count: 0 },
    { id: 73, name: "Pro eSports Team", price: 50000000, wiki: "Esports", count: 0 },
    { id: 74, name: "Moon Simulation Studio", price: 50000000, wiki: "Neutral_buoyancy_laboratory", count: 0 },
    { id: 75, name: "Fighter Jet", price: 65000000, wiki: "Fighter_aircraft", count: 0 },
    { id: 76, name: "1,000 Cybertrucks", price: 80000000, wiki: "Tesla_Cybertruck", count: 0 },
    { id: 77, name: "Commercial Airliner", price: 90000000, wiki: "Airliner", count: 0 },
    { id: 78, name: "World's Largest Diamond", price: 100000000, wiki: "Cullinan_Diamond", count: 0 },
    { id: 79, name: "Giant Mecha Robot", price: 150000000, wiki: "Mecha", count: 0 },
    { id: 80, name: "Own a Satellite", price: 150000000, wiki: "Satellite", count: 0 },
    { id: 81, name: "Develop a AAA Video Game", price: 150000000, wiki: "Video_game_development", count: 0 },
    { id: 82, name: "Hollywood Movie", price: 200000000, wiki: "Filmmaking", count: 0 },
    { id: 83, name: "The Statue of Liberty", price: 250000000, wiki: "Statue_of_Liberty", count: 0 },
    { id: 84, name: "Personal AI Supercomputer", price: 300000000, wiki: "Supercomputer", count: 0 },
    { id: 85, name: "The Hope Diamond", price: 350000000, wiki: "Hope_Diamond", count: 0 },
    { id: 86, name: "Supercomputer", price: 500000000, wiki: "Supercomputer", count: 0 },
    { id: 87, name: "Cloning Research Facility", price: 500000000, wiki: "Cloning", count: 0 },
    { id: 88, name: "The Eiffel Tower", price: 500000000, wiki: "Eiffel_Tower", count: 0 },
    { id: 89, name: "10,000 Bitcoin", price: 650000000, wiki: "Bitcoin", count: 0 },
    { id: 90, name: "Mona Lisa", price: 860000000, wiki: "Mona_Lisa", count: 0 },
    { id: 91, name: "Buy a US Election", price: 1000000000, wiki: "United_States_Capitol", count: 0 },
    { id: 92, name: "Skyscraper", price: 1000000000, wiki: "Skyscraper", count: 0 },
    { id: 93, name: "Every Professional Gamer", price: 1000000000, wiki: "Gamer", count: 0 },
    { id: 94, name: "Cruise Ship", price: 1200000000, wiki: "Cruise_ship", count: 0 },
    { id: 95, name: "Fund a New University", price: 2000000000, wiki: "University", count: 0 },
    { id: 96, name: "Nuclear Submarine", price: 2000000000, wiki: "Nuclear_submarine", count: 0 },
    { id: 97, name: "News Network", price: 2000000000, wiki: "News_broadcasting", count: 0 },
    { id: 98, name: "Personal Subsea Base", price: 2000000000, wiki: "Underwater_habitat", count: 0 },
    { id: 99, name: "NBA Team", price: 3000000000, wiki: "Basketball_court", count: 0 },
    { id: 100, name: "Internet Cable Network", price: 3000000000, wiki: "Submarine_communications_cable", count: 0 },
    { id: 101, name: "Dinosaur Theme Park", price: 4000000000, wiki: "Dinosaur", count: 0 },
    { id: 102, name: "Buckingham Palace", price: 5000000000, wiki: "Buckingham_Palace", count: 0 },
    { id: 103, name: "NFL Team", price: 5000000000, wiki: "American_football", count: 0 },
    { id: 104, name: "Build a Pyramid", price: 5000000000, wiki: "Great_Pyramid_of_Giza", count: 0 },
    { id: 105, name: "New York Yankees", price: 7000000000, wiki: "Yankee_Stadium", count: 0 },
    { id: 106, name: "Nuclear Power Plant", price: 9000000000, wiki: "Nuclear_power_plant", count: 0 },
    { id: 107, name: "Reddit", price: 10000000000, wiki: "Reddit", count: 0 },
    { id: 108, name: "Aircraft Carrier", price: 10000000000, wiki: "Aircraft_carrier", count: 0 },
    { id: 109, name: "Rainforest Conservation", price: 10000000000, wiki: "Amazon_rainforest", count: 0 },
    { id: 110, name: "Interstellar Telescope", price: 10000000000, wiki: "James_Webb_Space_Telescope", count: 0 },
    { id: 111, name: "Cure for Baldness", price: 15000000000, wiki: "Hair_loss", count: 0 },
    { id: 112, name: "Build a Hyperloop", price: 15000000000, wiki: "Hyperloop", count: 0 },
    { id: 113, name: "Entire City", price: 20000000000, wiki: "City", count: 0 },
    { id: 114, name: "Solve Homelessness (US)", price: 20000000000, wiki: "Homelessness_in_the_United_States", count: 0 },
    { id: 115, name: "Spotify (The Company)", price: 30000000000, wiki: "Spotify", count: 0 },
    { id: 116, name: "High-Speed Rail Line", price: 30000000000, wiki: "High-speed_rail", count: 0 },
    { id: 117, name: "Entire Sports League", price: 30000000000, wiki: "Sports_league", count: 0 },
    { id: 118, name: "Build a Great Wall", price: 30000000000, wiki: "Great_Wall_of_China", count: 0 },
    { id: 119, name: "Epic Games", price: 32000000000, wiki: "Epic_Games", count: 0 },
    { id: 120, name: "End World Hunger", price: 40000000000, wiki: "World_hunger", count: 0 },
    { id: 121, name: "Twitter", price: 44000000000, wiki: "Twitter", count: 0 },
    { id: 122, name: "Mission to Mars", price: 50000000000, wiki: "Human_mission_to_Mars", count: 0 },
    { id: 123, name: "Space Elevator", price: 50000000000, wiki: "Space_elevator", count: 0 },
    { id: 124, name: "Cancer Research Fund", price: 50000000000, wiki: "Cancer_research", count: 0 },
    { id: 125, name: "Army of Humanoid Robots", price: 50000000000, wiki: "Humanoid_robot", count: 0 },
    { id: 126, name: "Buy a Small Country", price: 70000000000, wiki: "Microstate", count: 0 },
    { id: 127, name: "$10 to Everyone on Earth", price: 80000000000, wiki: "Money", count: 0 },
    { id: 128, name: "Fund a Moon Base", price: 100000000000, wiki: "Moon_village", count: 0 },
    { id: 129, name: "Netflix (The Company)", price: 150000000000, wiki: "Netflix", count: 0 },
    { id: 130, name: "Int'l Space Station", price: 150000000000, wiki: "International_Space_Station", count: 0 },
    { id: 131, name: "Global Wi-Fi Network", price: 200000000000, wiki: "Wi-Fi", count: 0 },
    { id: 132, name: "Buy Amazon", price: 300000000000, wiki: "Amazon_(company)", count: 0 },
    { id: 133, name: "Build a Death Star", price: 500000000000, wiki: "Death_Star", count: 0 },
    { id: 134, name: "Solve Climate Change", price: 600000000000, wiki: "Climate_change", count: 0 },
    { id: 135, name: "Buy Apple", price: 800000000000, wiki: "Apple_Inc.", count: 0 },
    { id: 136, name: "Private Solar System", price: 900000000000, wiki: "Solar_System", count: 0 },
    { id: 137, name: "World Peace", price: 1000000000000, wiki: "World_peace", count: 0 },
    { id: 138, name: "Golden Retriever", price: 500, wiki: "Golden_Retriever", count: 0 }, 
    { id: 139, name: "Helicopter Pad", price: 50000, wiki: "Helipad", count: 0 },
    { id: 140, name: "Personal Brewery", price: 150000, wiki: "Brewery", count: 0 },
    { id: 141, name: "Mountain Cabin", price: 400000, wiki: "Log_cabin", count: 0 },
    { id: 142, name: "Small Vineyard", price: 800000, wiki: "Vineyard", count: 0 },
    { id: 143, name: "Boutique Hotel", price: 5000000, wiki: "Boutique_hotel", count: 0 },
    { id: 144, name: "Private Zoo", price: 12000000, wiki: "Zoo", count: 0 },
    { id: 145, name: "Luxury Train", price: 40000000, wiki: "Luxury_train", count: 0 },
    { id: 146, name: "Underwater Hotel", price: 100000000, wiki: "Underwater_habitat", count: 0 },
    { id: 147, name: "Space Tourism Ticket", price: 250000, wiki: "Space_tourism", count: 0 },
    { id: 148, name: "Robotic Dog", price: 75000, wiki: "Robotic_dog", count: 0 },
    { id: 149, name: "Solid Gold Watch", price: 250000, wiki: "Pocket_watch", count: 0 },
    { id: 150, name: "Private Safari", price: 100000, wiki: "Safari", count: 0 },
    { id: 151, name: "Luxury Submarine", price: 5000000, wiki: "Submarine", count: 0 },
    { id: 152, name: "Castle in Europe", price: 20000000, wiki: "Castle", count: 0 },
    { id: 153, name: "Private Ski Resort", price: 80000000, wiki: "Ski_resort", count: 0 },
    { id: 154, name: "Mega Casino", price: 500000000, wiki: "Casino", count: 0 },
    { id: 155, name: "Orbital Space Hotel", price: 25000000000, wiki: "Space_station", count: 0 },
    { id: 156, name: "Paperclip", price: 0.05, wiki: "Paper_clip", count: 0 },
    { id: 157, name: "Gumball", price: 0.25, wiki: "Gumball_machine", count: 0 },
    { id: 158, name: "Postage Stamp", price: 0.68, wiki: "Postage_stamp", count: 0 },
    { id: 159, name: "Pencil", price: 0.50, wiki: "Pencil", count: 0 },
    { id: 160, name: "Cup Noodles", price: 1.50, wiki: "Cup_Noodles", count: 0 },
    { id: 161, name: "Loaf of Bread", price: 3, wiki: "Bread", count: 0 },
    { id: 162, name: "Gallon of Gas", price: 4, wiki: "Gasoline", count: 0 },
    { id: 163, name: "Tactical Helmet", price: 500, wiki: "Combat_helmet", count: 0 },
    { id: 164, name: "Kevlar Vest", price: 1000, wiki: "Bulletproof_vest", count: 0 },
    { id: 165, name: "Night Vision Goggles", price: 3000, wiki: "Night-vision_device", count: 0 },
    { id: 166, name: "Military Humvee", price: 250000, wiki: "Humvee", count: 0 },
    { id: 167, name: "Tomahawk Missile", price: 2000000, wiki: "Tomahawk_(missile)", count: 0 },
    { id: 168, name: "M1 Abrams Tank", price: 9000000, wiki: "M1_Abrams", count: 0 },
    { id: 169, name: "Trident Nuclear Missile", price: 30000000, wiki: "UGM-133_Trident_II", count: 0 },
    { id: 170, name: "Predator Drone", price: 40000000, wiki: "General_Atomics_MQ-1_Predator", count: 0 },
    { id: 171, name: "Apache Helicopter", price: 50000000, wiki: "Boeing_AH-64_Apache", count: 0 },
    { id: 172, name: "F-35 Lightning II", price: 80000000, wiki: "Lockheed_Martin_F-35_Lightning_II", count: 0 },
    { id: 173, name: "Patriot Missile Battery", price: 1000000000, wiki: "MIM-104_Patriot", count: 0 },
    { id: 174, name: "B-2 Stealth Bomber", price: 2000000000, wiki: "Northrop_B-2_Spirit", count: 0 },
    { id: 175, name: "Space Force Base", price: 10000000000, wiki: "United_States_Space_Force", count: 0 },
    { id: 176, name: "Single Grain of Rice", price: 0.0001, wiki: "White_rice", count: 0 },
    { id: 177, name: "Used Toothpick", price: 0.001, wiki: "Toothpick", count: 0 },
    { id: 178, name: "Rubber Band", price: 0.02, wiki: "Rubber_band", count: 0 },
    { id: 179, name: "Loose Button", price: 0.10, wiki: "Button", count: 0 },
    { id: 180, name: "Plastic Fork", price: 0.15, wiki: "Fork", count: 0 },
    { id: 181, name: "Quarter", price: 0.25, wiki: "Quarter_(United_States_coin)", count: 0 },
    { id: 182, name: "Half-Eaten Candy", price: 0.50, wiki: "Candy", count: 0 },
    { id: 183, name: "Tap Water Glass", price: 0.005, wiki: "Tap_water", count: 0 },
    { id: 184, name: "Pocket Lint", price: 0.00001, wiki: "Navel_lint", count: 0 }
];

// Ensure items are strictly sorted by price dynamically (micro-cents appear at the top)
items.sort((a, b) => a.price - b.price);

const balanceEl = document.getElementById("balance");
const itemsGridEl = document.getElementById("items-grid");
const receiptItemsEl = document.getElementById("receipt-items");
const totalSpentEl = document.getElementById("total-spent");
const receiptSectionEl = document.getElementById("receipt-section");

// IntersectionObserver to fetch Wikipedia images only when the item scrolls into view
const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            const wikiTitle = img.getAttribute('data-wiki');
            const itemName = img.getAttribute('alt');
            
            if (wikiTitle) {
                // FIXED: Added &redirects=1 so it automatically follows URL redirects. 
                // Increased pithumbsize to 300 to ensure crisp images.
                const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiTitle)}&prop=pageimages&format=json&pithumbsize=300&redirects=1&origin=*`;
                
                fetch(apiUrl)
                    .then(response => response.json())
                    .then(data => {
                        const pages = data.query.pages;
                        const pageId = Object.keys(pages)[0];
                        
                        if (pages[pageId] && pages[pageId].thumbnail) {
                            img.src = pages[pageId].thumbnail.source;
                        } else {
                            // Fallback if the specific Wikipedia page lacks a thumbnail
                            img.src = `https://placehold.co/200x200/e0e0e0/333333?text=${encodeURIComponent(itemName)}`;
                        }
                    })
                    .catch(() => {
                        // Fallback on network error
                        img.src = `https://placehold.co/200x200/e0e0e0/333333?text=${encodeURIComponent(itemName)}`;
                    });
            }
            
            // Stop observing once the fetch has been triggered
            observer.unobserve(img);
        }
    });
}, {
    rootMargin: '100px' // Load images slightly before they enter the screen
});

function formatMoney(amount) {
    // If the item costs less than a penny, show up to 5 decimal places
    if (amount < 0.01 && amount > 0) {
        return amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 5
        });
    }
    // Normal formatting for everything else
    return amount.toLocaleString('en-US', {
        minimumFractionDigits: amount % 1 !== 0 ? 2 : 0,
        maximumFractionDigits: 2
    });
}

// Render the HTML exactly ONCE
function initGrid() {
    itemsGridEl.innerHTML = "";
    
    // A tiny transparent placeholder gif to sit in the <img> tags until the Wikipedia API fills them
    const transparentGif = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

    items.forEach(item => {
        const card = document.createElement("div");
        card.className = "item-card";

        card.innerHTML = `
            <img id="img-${item.id}" src="${transparentGif}" alt="${item.name}" data-wiki="${item.wiki}" class="item-image">
            <div class="item-name">${item.name}</div>
            <div class="item-price">$${formatMoney(item.price)}</div>
            
            <div class="item-actions-container">
                <div class="qty-row">
                    <label>Qty:</label>
                    <input type="number" id="qty-${item.id}" class="qty-input" value="1" min="1" oninput="updateUI()">
                </div>
                
                <div class="item-controls">
                    <button id="btn-sell-${item.id}" class="btn btn-sell" onclick="sellItem(${item.id})">Sell</button>
                    <div id="count-${item.id}" class="item-count">${item.count}</div>
                    <button id="btn-buy-${item.id}" class="btn btn-buy" onclick="buyItem(${item.id})">Buy</button>
                </div>
            </div>
        `;
        itemsGridEl.appendChild(card);
        
        // Instruct the lazy-loader to watch this specific image
        imageObserver.observe(card.querySelector(`#img-${item.id}`));
    });
}

// Update only the numbers and button colors dynamically
function updateUI() {
    balanceEl.innerText = formatMoney(currentBalance);
    
    let totalSpent = 0;
    let hasItems = false;
    receiptItemsEl.innerHTML = "";

    items.forEach(item => {
        const qtyInput = document.getElementById(`qty-${item.id}`);
        let qtyToProcess = parseInt(qtyInput ? qtyInput.value : 1);
        if (isNaN(qtyToProcess) || qtyToProcess < 1) qtyToProcess = 1;

        const costForQty = item.price * qtyToProcess;
        // Fix float precision bugs when buying huge quantities of micro-cent items
        const canBuy = (currentBalance + 0.000001) >= costForQty;
        const canSell = item.count >= qtyToProcess;

        const countEl = document.getElementById(`count-${item.id}`);
        const buyBtn = document.getElementById(`btn-buy-${item.id}`);
        const sellBtn = document.getElementById(`btn-sell-${item.id}`);

        if (countEl) countEl.innerText = item.count;
        
        if (buyBtn) buyBtn.disabled = !canBuy;
        
        if (sellBtn) {
            sellBtn.disabled = !canSell;
            if (item.count > 0) {
                sellBtn.classList.add('active');
            } else {
                sellBtn.classList.remove('active');
            }
        }

        // Build Receipt dynamically
        if (item.count > 0) {
            hasItems = true;
            const spentOnItem = item.count * item.price;
            totalSpent += spentOnItem;

            const receiptItem = document.createElement("div");
            receiptItem.className = "receipt-item";
            receiptItem.innerHTML = `
                <div class="receipt-item-name">${item.name}</div>
                <div class="receipt-item-count">x${formatMoney(item.count)}</div>
                <div class="receipt-item-price">$${formatMoney(spentOnItem)}</div>
            `;
            receiptItemsEl.appendChild(receiptItem);
        }
    });

    totalSpentEl.innerText = `$${formatMoney(totalSpent)}`;
    receiptSectionEl.style.display = hasItems ? "block" : "none";
}

window.buyItem = function(id) {
    const item = items.find(i => i.id === id);
    const qtyInput = document.getElementById(`qty-${id}`);
    let qty = parseInt(qtyInput.value);
    if (isNaN(qty) || qty < 1) qty = 1;

    const totalCost = item.price * qty;

    if (item && (currentBalance + 0.000001) >= totalCost) {
        item.count += qty;
        currentBalance -= totalCost;
        updateUI();
    }
}

window.sellItem = function(id) {
    const item = items.find(i => i.id === id);
    const qtyInput = document.getElementById(`qty-${id}`);
    let qty = parseInt(qtyInput.value);
    if (isNaN(qty) || qty < 1) qty = 1;

    if (item && item.count >= qty) {
        item.count -= qty;
        currentBalance += (item.price * qty);
        updateUI();
    } else if (item && item.count > 0) {
        currentBalance += (item.price * item.count);
        item.count = 0;
        updateUI();
    }
}

// Initial build
initGrid();
updateUI();