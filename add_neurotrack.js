const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// Find the Synesthesia block so we can insert NeuroTrack after it
const synesthesiaRegex = /<a href="synesthesia\/index\.html" class="project-card">[\s\S]*?<\/a>\n/g;

html = html.replace(synesthesiaRegex, (match) => {
    return match + `
        <a href="neurotrack/index.html" class="project-card">
            <img src="pixel.png" alt="NeuroTrack AI Racing" class="project-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22280%22 height=%22160%22%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22%23e4e4e7%22/%3E%3C/svg%3E'">
            <div class="project-content">
                <h2 class="project-title">NeuroTrack</h2>
                <p class="project-desc">A 2D top-down racing game with a grid-based track editor. Includes an AI neural network template ready for genetic algorithm training.</p>
                <div class="project-arrow">&rarr;</div>
            </div>
        </a>
`;
});

fs.writeFileSync('index.html', html);
console.log("Updated index.html with NeuroTrack");
