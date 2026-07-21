const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// The Dust block to find
const dustBlockRegex = /<a href="dust\/index\.html" class="project-card">[\s\S]*?<\/a>\n\n/g;

// Remove the Dust block
const dustMatch = html.match(dustBlockRegex);
if(dustMatch) {
    html = html.replace(dustBlockRegex, '');
    
    // We want to insert it after Synesthesia, which is the last card before </div> </div> for the grid.
    // The grid ends with:
    //         </a>
    //     </div>
    // </div>
    
    const synesthesiaEndRegex = /<a href="synesthesia\/index\.html" class="project-card">[\s\S]*?<\/a>\n/g;
    html = html.replace(synesthesiaEndRegex, (match) => {
        return match + `
        <!-- Flex break to force a new row (5th layer) -->
        <div style="flex-basis: 100%; height: 0;"></div>

        <a href="dust/index.html" class="project-card">
            <img src="screenshot_dust.png" alt="Dust Sandbox" class="project-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22280%22 height=%22160%22%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22%23e4e4e7%22/%3E%3C/svg%3E'">
            <div class="project-content">
                <h2 class="project-title">Dust</h2>
                <p class="project-desc">A high-performance pixel physics sandbox for elemental cellular automata. Note: it might be a little broken!</p>
                <div class="project-arrow">&rarr;</div>
            </div>
        </a>
`;
    });
    
    fs.writeFileSync('index.html', html);
    console.log("Updated index.html");
} else {
    console.log("Could not find Dust block");
}
