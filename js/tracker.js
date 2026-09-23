import { db } from './firebase-config.js';
import { collection, doc, getDoc, setDoc, updateDoc, deleteDoc, increment, query, orderBy, limit, getDocs, getCountFromServer, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

function sanitizeHTML(str) {
    var temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

function censorName(str) {
    const badWords = ['fuck', 'pussy', 'piss', 'shit', 'bitch', 'asshole', 'cunt', 'dick', 'cock', 'slut', 'whore', 'nigger', 'nigga', 'fag', 'faggot'];
    let censored = str;
    badWords.forEach(word => {
        const regex = new RegExp(word, 'gi');
        censored = censored.replace(regex, match => '*'.repeat(match.length));
    });
    return censored;
}

function formatTime(seconds) {
    if (!seconds) return "0s";
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    let str = [];
    if(d > 0) {
        str.push(d + 'd');
        str.push(h + 'h');
    } else if (h > 0) {
        str.push(h + 'h');
        str.push(m + 'm');
    } else if (m > 0) {
        str.push(m + 'm');
        str.push(s + 's');
    } else {
        str.push(s + 's');
    }
    return str.join(' ');
}

function getProjectName() {
    let path = window.location.pathname;
    if (path.endsWith('/')) path += 'index.html';
    const parts = path.split('/');
    if (path.includes('paths.html')) return 'paths.html';
    if (parts.length <= 2 || (parts.length === 3 && parts[1] === '')) return 'Home';
    let name = decodeURIComponent(parts[parts.length - 2]) || 'Home';
    if (name.toLowerCase() === 'hyper') return 'Home';
    return name;
}

const PROJECT_NAMES = {
    'Computer Xp': 'Windows XP',
    'slopcraft 3D': 'Slopcraft 3D',
    'style': 'OS Style Showcase',
    'cmd': 'The Elias Thorne Mystery',
    'agar': 'Agar',
    'Cyber': 'Exodus Adventure',
    'trillion': 'Spend Elon\'s Money',
    'timeline': 'Interactive US History Timeline',
    'convert': 'Omni-Dimensional Converter',
    'paths': 'Text Adventure Editor',
    'paths.html': 'Text Adventure Editor',
    'waveform editor': 'Waveform Editor',
    'dvd': 'DVD Logo Simulator',
    'rubiks': '2x2 Rubik\'s Cube',
    'synesthesia': 'Synesthesia Color Mixer',
    'neurotrack': 'NeuroTrack AI Racing',
    'dust': 'Dust Sandbox'
};

function getDisplayProjectName(rawName) {
    return PROJECT_NAMES[rawName] || rawName;
}

function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function getCookie(name) {
    let nameEQ = name + "=";
    let ca = document.cookie.split(';');
    for(let i=0;i < ca.length;i++) {
        let c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

const isHome = getProjectName() === 'Home';
const projectName = getProjectName();

// --- Username System ---
let username = localStorage.getItem('hyper_username') || getCookie('hyper_username');
let isTemp = localStorage.getItem('hyper_is_temp') === 'true' || getCookie('hyper_is_temp') === 'true';

if (!username) {
    username = `user_${Math.floor(Math.random() * 10000000)}`;
    isTemp = true;
    localStorage.setItem('hyper_username', username);
    setCookie('hyper_username', username, 3650);
    localStorage.setItem('hyper_is_temp', 'true');
    setCookie('hyper_is_temp', 'true', 3650);
} else {
    // Sync cookie and localstorage so it's super resilient
    localStorage.setItem('hyper_username', username);
    setCookie('hyper_username', username, 3650);
    if (isTemp) {
        localStorage.setItem('hyper_is_temp', 'true');
        setCookie('hyper_is_temp', 'true', 3650);
    }
}

let isOptedOut = localStorage.getItem('hyper_tracking_optout') === 'true';

// Global flag and listener for hypergenius12 to see all users
window.hyperShowAllUsers = false;
window.loadLeaderboard = loadLeaderboard;
document.addEventListener('keyup', (e) => {
    if (e.key === 'L' && e.shiftKey && username === 'hypergenius12') {
        window.hyperShowAllUsers = !window.hyperShowAllUsers;
        loadLeaderboard();
    }
});

if (isHome) {
    const modal = document.getElementById('username-modal');
    const form = document.getElementById('username-form');
    const errorMsg = document.getElementById('username-error');

    // Change "Skip for now" text to "Later" in case the HTML has it as Skip for now
    const skipBtn = document.querySelector('#username-modal button[type="button"]');
    if (skipBtn) skipBtn.innerText = 'Later';

    if (isTemp && !isOptedOut) {
        // Show modal if they are on a temp name and not opted out
        setTimeout(() => modal.classList.add('active'), 1500);
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = document.getElementById('username-input').value.trim();
            if (!input) return;
            
            const btn = document.getElementById('username-submit');
            btn.innerText = 'Checking...';
            btn.disabled = true;
            errorMsg.style.display = 'none';

            try {
                const userRef = doc(db, 'users', input.toLowerCase());
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    errorMsg.innerText = 'That name is taken!';
                    errorMsg.style.display = 'block';
                    btn.innerText = 'Claim Name';
                    btn.disabled = false;
                } else {
                    // Migrate data if they were a temp user
                    let oldData = { totalTime: 0, projects: {} };
                    if (isTemp && username) {
                        try {
                            const oldRef = doc(db, 'users', username);
                            const oldSnap = await getDoc(oldRef);
                            if (oldSnap.exists()) {
                                oldData = oldSnap.data();
                                await deleteDoc(oldRef);
                            }
                        } catch (err) {
                            console.error("Migration error:", err);
                        }
                    }

                    // Register
                    await setDoc(userRef, {
                        username: input,
                        totalTime: oldData.totalTime || 0,
                        projects: oldData.projects || {}
                    });
                    
                    // Make it super persistent
                    localStorage.setItem('hyper_username', input.toLowerCase());
                    setCookie('hyper_username', input.toLowerCase(), 3650);
                    localStorage.removeItem('hyper_is_temp');
                    setCookie('hyper_is_temp', '', -1);
                    
                    username = input.toLowerCase();
                    isTemp = false;
                    
                    modal.classList.remove('active');
                    loadLeaderboard(); // refresh leaderboard
                }
            } catch (err) {
                console.error("Firebase Auth/DB Error:", err);
                errorMsg.innerText = 'Database error. Did you enable Firestore Test Mode?';
                errorMsg.style.display = 'block';
                btn.innerText = 'Claim Name';
                btn.disabled = false;
            }
        });
    }
}

// --- Time Tracking ---
// Ping every 15 seconds
if (username) {
    setInterval(async () => {
        if (localStorage.getItem('hyper_tracking_optout') === 'true') return;
        const userRef = doc(db, 'users', username);
        try {
            await setDoc(userRef, {
                username: username,
                totalTime: increment(15),
                [`projects.${projectName}`]: increment(15)
            }, { merge: true });
        } catch (e) {
            console.error("Tracking error", e);
        }
    }, 15000);
}


// --- Leaderboard Rendering ---
let cachedUsers = null;

async function loadLeaderboard() {
    const lbContent = document.getElementById('lb-content');
    if (!lbContent) return;

    lbContent.innerHTML = '<div style="text-align: center; opacity: 0.5; padding: 2rem;">Loading data...</div>';
    try {
        const q = query(collection(db, 'users'), orderBy('totalTime', 'desc'), limit(200));
        const querySnapshot = await getDocs(q);
        let users = [];
        querySnapshot.forEach(d => users.push(d.data()));
        cachedUsers = users;

        lbContent.innerHTML = '';
        let rank = 1;
        users.forEach((u) => {
            // Spoofing Protection: Ignore users with > 365 days of playtime
            if (u.totalTime > 31536000) return;
            
            // Hide users with < 15s of playtime unless hyperShowAllUsers is true
            if (u.totalTime < 15 && !window.hyperShowAllUsers) return;
            
            // Hide opted out users
            if (u.optOut) return;
            
            let medal = rank === 1 ? '[1]' : rank === 2 ? '[2]' : rank === 3 ? '[3]' : `[${rank}]`;
            let isMe = username && u.username.toLowerCase() === username.toLowerCase();
            let bg = isMe ? '#22c55e' : 'transparent';
            let color = isMe ? '#000' : 'inherit';
            let border = '1px solid #333';
            
            let displayUsername = u.username;
            if (displayUsername.startsWith('user_')) {
                displayUsername = 'User #' + displayUsername.substring(5);
            }
            
            lbContent.innerHTML += `
                <div style="display: flex; justify-content: space-between; padding: 0.75rem; background: ${bg}; color: ${color}; border: ${border}; border-radius: 0; align-items: center; margin-bottom: 4px; font-family: monospace; text-transform: uppercase; letter-spacing: 1px;">
                    <span style="font-weight: bold; width: 40px; text-align: center;">${medal}</span>
                    <span style="flex-grow: 1; margin-left: 10px; font-weight: ${isMe ? 'bold': 'normal'}">${sanitizeHTML(censorName(displayUsername))} ${isMe ? '<span style="font-size: 0.8rem; margin-left: 4px;">&lt;YOU&gt;</span>' : ''}</span>
                    <span style="font-family: monospace;">${formatTime(u.totalTime)}</span>
                </div>
            `;
            rank++;
        });
        if (users.length === 0) lbContent.innerHTML = '<div style="text-align:center; opacity:0.5; padding: 2rem;">No users yet.</div>';

    } catch (e) {
        lbContent.innerHTML = '<div style="text-align: center; color: #ef4444; padding: 2rem;">Error loading leaderboard.</div>';
        console.error(e);
    }
}

// Global exposure
window.loadSubProject = function() {
    loadLeaderboard();
};

if (isHome) {
    loadLeaderboard();

    const toggleBtn = document.getElementById('tracking-toggle-btn');
    if (toggleBtn) {
        if (isOptedOut) {
            toggleBtn.innerText = "Enable Time Tracking";
            toggleBtn.style.color = "#ef4444";
            toggleBtn.style.borderColor = "#ef4444";
        }
        toggleBtn.addEventListener('click', async () => {
            isOptedOut = !isOptedOut;
            localStorage.setItem('hyper_tracking_optout', isOptedOut ? 'true' : 'false');
            if (isOptedOut) {
                toggleBtn.innerText = "Enable Time Tracking";
                toggleBtn.style.color = "#ef4444";
                toggleBtn.style.borderColor = "#ef4444";
            } else {
                toggleBtn.innerText = "Disable Time Tracking";
                toggleBtn.style.color = "var(--text-color)";
                toggleBtn.style.borderColor = "var(--border-color)";
            }
            if (username) {
                try {
                    await setDoc(doc(db, 'users', username), { optOut: isOptedOut }, { merge: true });
                } catch(e) {}
            }
            updateProfileBadge();
            loadLeaderboard();
        });
    }

    async function updateProfileBadge() {
        const badge = document.getElementById('profile-badge');
        const nameEl = document.getElementById('profile-name');
        const rankEl = document.getElementById('profile-rank');
        if (!badge || !nameEl || !rankEl) return;
        
        badge.style.display = 'flex';
        
        if (isOptedOut) {
            nameEl.innerText = "Tracking Disabled";
            nameEl.style.color = "#71717a";
            rankEl.innerText = "";
            return;
        }

        let displayUsername = username;
        if (displayUsername && displayUsername.startsWith('user_')) {
            displayUsername = 'User #' + displayUsername.substring(5);
        }
        nameEl.innerText = displayUsername || "Unknown";
        nameEl.style.color = "#a855f7";
        rankEl.innerText = "Rank: Calculating...";

        try {
            const userRef = doc(db, 'users', username);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                let totalTime = userSnap.data().totalTime || 0;
                const coll = collection(db, 'users');
                const q = query(coll, where('totalTime', '>', totalTime));
                const snapshot = await getCountFromServer(q);
                let rank = snapshot.data().count + 1;
                rankEl.innerText = `Global Rank: #${rank}`;
            } else {
                rankEl.innerText = `Global Rank: --`;
            }
        } catch (e) {
            console.error("Rank calculation error:", e);
            rankEl.innerText = `Global Rank: --`;
        }
    }
    
    // Call it initially
    updateProfileBadge();
}
