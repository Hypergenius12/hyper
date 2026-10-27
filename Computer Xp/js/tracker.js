import { db } from './firebase-config.js';
import { collection, doc, getDoc, setDoc, updateDoc, deleteDoc, increment, query, orderBy, limit, getDocs, getCountFromServer, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

function sanitizeHTML(str) {
    if (!str) return '';
    var temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

function censorName(str) {
    if (!str) return '';
    const badWords = ['fuck', 'pussy', 'piss', 'shit', 'bitch', 'asshole', 'cunt', 'dick', 'cock', 'slut', 'whore', 'nigger', 'nigga', 'fag', 'faggot'];
    let censored = str;
    badWords.forEach(word => {
        const regex = new RegExp(word, 'gi');
        censored = censored.replace(regex, match => '*'.repeat(match.length));
    });
    return censored;
}

function formatTime(seconds) {
    if (!seconds || seconds <= 0) return "0s";
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    let str = [];
    if (d > 0) {
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

function formatRelativeTime(timestamp) {
    if (!timestamp) return 'Never';
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 30) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function getProjectName() {
    let path = window.location.pathname;
    if (path.endsWith('/')) path += 'index.html';
    const parts = path.split('/');
    if (path.includes('paths.html')) return 'paths.html';
    if (parts.length <= 2 || (parts.length === 3 && parts[1] === '')) return 'Home';
    let name = decodeURIComponent(parts[parts.length - 2]) || 'Home';
    if (name.toLowerCase() === 'hyper' || name.toLowerCase() === 'hyper-main') return 'Home';
    return name;
}

const PROJECT_NAMES = {
    'Home': 'Home Hub',
    'Computer Xp': 'Windows XP',
    'slopcraft 3D': 'Slopcraft 3D',
    'slopcraft-desktop': 'Slopcraft Desktop',
    'style': 'OS Style Showcase',
    'cmd': 'The Elias Thorne Mystery',
    'agar': 'Agar Sandbox',
    'Cyber': 'Exodus Adventure',
    'trillion': 'Spend Elon\'s Money',
    'timeline': 'US History Timeline',
    'convert': 'Omni-Dimensional Converter',
    'paths': 'Text Adventure Editor',
    'paths.html': 'Text Adventure Editor',
    'waveform editor': 'Waveform Editor',
    'dvd': 'DVD Logo Simulator',
    'rubiks': '2x2 Rubik\'s Cube',
    'synesthesia': 'Synesthesia Color Mixer',
    'color-pallete-generator': 'ChromaCraft',
    'joyful-rutherford': 'Seleste',
    'neurotrack': 'NeuroTrack AI Racing',
    'dust': 'Dust Sandbox',
    'satisfy': 'Satisfy (Globs & Filings)',
    'Itch': 'Itch.io Unblocked',
    'florr.io-craft-sim': 'Florr.io Craft Sim',
    'puzzley': 'Puzzley Wordplay Arcade',
    '3d terrain gen': '3D Terrain Generator',
    'backrooms': 'The Backrooms',
    'excavator': 'The DOM Excavator',
    'genesis': 'Genesis Evolution',
    'raycaster': 'Wolfenstein 3D Raycaster',
    'snake': 'Snake 3D'
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

const DEV_USERNAMES = ['hypergenius12', 'ptechlocal'];

function isDevName(name) {
    if (!name) return false;
    return DEV_USERNAMES.includes(name.toLowerCase().trim());
}

if (isDevName(username)) {
    isTemp = false;
    localStorage.removeItem('hyper_is_temp');
    setCookie('hyper_is_temp', '', -1);
}

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

function isDevUser() {
    return isDevName(username) || window.hyperShowAllUsers === true;
}

// Global flag and listener for developers to toggle developer mode
window.hyperShowAllUsers = false;
window.loadLeaderboard = loadLeaderboard;
document.addEventListener('keyup', (e) => {
    if (e.key === 'L' && e.shiftKey && isDevName(username)) {
        window.hyperShowAllUsers = !window.hyperShowAllUsers;
        loadLeaderboard();
    }
});

// --- Session Visit & Presence Tracking ---
(async function recordVisitAndPresence() {
    if (isOptedOut) return;

    // 1. Session visit counter in stats/global
    if (!sessionStorage.getItem('hyper_session_visit_logged')) {
        sessionStorage.setItem('hyper_session_visit_logged', 'true');
        try {
            await setDoc(doc(db, 'stats', 'global'), {
                totalVisits: increment(1),
                lastUpdated: Date.now()
            }, { merge: true });
        } catch (e) {}

        if (username) {
            try {
                await setDoc(doc(db, 'users', username.toLowerCase()), {
                    visits: increment(1)
                }, { merge: true });
            } catch (e) {}
        }
    }

    // 2. Initial presence timestamp
    if (username) {
        try {
            await setDoc(doc(db, 'users', username.toLowerCase()), {
                username: username,
                lastActive: Date.now(),
                currentProject: projectName
            }, { merge: true });
        } catch(e) {}
    }
})();

// --- Username Modal UI Handling ---
if (isHome) {
    const modal = document.getElementById('username-modal');
    const form = document.getElementById('username-form');
    const errorMsg = document.getElementById('username-error');

    const skipBtn = document.querySelector('#username-modal button[type="button"]');
    if (skipBtn) skipBtn.innerText = 'Later';

    if (isTemp && !isOptedOut) {
        setTimeout(() => modal && modal.classList.add('active'), 1500);
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = document.getElementById('username-input').value.trim();
            if (!input) return;
            
            const btn = document.getElementById('username-submit');
            btn.innerText = 'Checking...';
            btn.disabled = true;
            if (errorMsg) errorMsg.style.display = 'none';

            try {
                // Strict normalization to prevent any bypasses (homoglyphs, invisible spaces, zero-width chars)
                const normalized = input.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
                const targetKey = normalized.toLowerCase();
                const stripped = targetKey.replace(/[^a-z0-9]/g, '');

                // Strictly disallow renaming to developer / admin usernames - no way around it
                const RESERVED = ['hypergenius12', 'hypergenius', 'ptechlocal'];
                const isTryingReserved = RESERVED.includes(targetKey) || RESERVED.includes(stripped) || stripped.startsWith('hypergenius') || stripped.startsWith('ptechlocal');

                if (isTryingReserved) {
                    if (errorMsg) {
                        errorMsg.innerText = 'That name is reserved!';
                        errorMsg.style.display = 'block';
                    }
                    btn.innerText = 'Claim Name';
                    btn.disabled = false;
                    return;
                }

                const userRef = doc(db, 'users', targetKey);
                const userSnap = await getDoc(userRef);

                const isSelf = username && targetKey === username.toLowerCase();

                if (userSnap.exists() && !isSelf) {
                    if (errorMsg) {
                        errorMsg.innerText = 'That name is taken!';
                        errorMsg.style.display = 'block';
                    }
                    btn.innerText = 'Claim Name';
                    btn.disabled = false;
                    return;
                }

                let oldData = { totalTime: 0, projects: {} };
                if (isTemp && username) {
                    try {
                        const oldRef = doc(db, 'users', username.toLowerCase());
                        const oldSnap = await getDoc(oldRef);
                        if (oldSnap.exists()) {
                            oldData = oldSnap.data();
                            await deleteDoc(oldRef);
                        }
                    } catch (err) {
                        console.error("Migration error:", err);
                    }
                }

                // Register or sync user doc
                if (!userSnap.exists()) {
                    await setDoc(userRef, {
                        username: normalized,
                        totalTime: oldData.totalTime || 0,
                        projects: oldData.projects || {},
                        lastActive: Date.now(),
                        currentProject: projectName
                    }, { merge: true });
                } else {
                    await setDoc(userRef, {
                        lastActive: Date.now(),
                        currentProject: projectName
                    }, { merge: true });
                }
                
                localStorage.setItem('hyper_username', normalized);
                setCookie('hyper_username', normalized, 3650);
                localStorage.removeItem('hyper_is_temp');
                setCookie('hyper_is_temp', '', -1);
                
                username = normalized;
                isTemp = false;
                
                if (modal) modal.classList.remove('active');
                updateProfileBadge();
                loadLeaderboard();
            } catch (err) {
                console.error("Firebase Auth/DB Error:", err);
                if (errorMsg) {
                    errorMsg.innerText = 'Database error. Please try again.';
                    errorMsg.style.display = 'block';
                }
                btn.innerText = 'Claim Name';
                btn.disabled = false;
            }
        });
    }
}

// --- Time Tracking Heartbeat (Every 15s) ---
if (username) {
    setInterval(async () => {
        if (localStorage.getItem('hyper_tracking_optout') === 'true') return;
        const userRef = doc(db, 'users', username.toLowerCase());
        try {
            await setDoc(userRef, {
                username: username,
                totalTime: increment(15),
                lastActive: Date.now(),
                currentProject: projectName,
                [`projects.${projectName}`]: increment(15)
            }, { merge: true });
        } catch (e) {
            console.error("Tracking error", e);
        }
    }, 15000);
}

// --- Leaderboard & Developer Command Center Rendering ---
let cachedUsers = null;
window.cachedUsers = null;

function aggregateProjectData(users) {
    const projectTotals = {};
    const projectPlayers = {};
    let totalEverSeconds = 0;

    users.forEach(u => {
        totalEverSeconds += (u.totalTime || 0);
        const userProjects = {};

        if (u.projects && typeof u.projects === 'object') {
            for (const [k, v] of Object.entries(u.projects)) {
                if (typeof v === 'number' && v > 0) userProjects[k] = (userProjects[k] || 0) + v;
            }
        }
        for (const [k, v] of Object.entries(u)) {
            if (k.startsWith('projects.') && typeof v === 'number' && v > 0) {
                const pName = k.replace('projects.', '');
                userProjects[pName] = (userProjects[pName] || 0) + v;
            }
        }

        for (const [p, sec] of Object.entries(userProjects)) {
            projectTotals[p] = (projectTotals[p] || 0) + sec;
            projectPlayers[p] = (projectPlayers[p] || 0) + 1;
        }
    });

    const popularGames = Object.entries(projectTotals)
        .map(([name, time]) => ({
            name,
            displayName: getDisplayProjectName(name),
            time,
            players: projectPlayers[name] || 0
        }))
        .filter(g => g.name !== 'Home' && g.name !== 'hyper') // Rank actual interactive games
        .sort((a, b) => b.time - a.time);

    return { projectTotals, projectPlayers, popularGames, totalEverSeconds };
}

async function loadLeaderboard() {
    const lbContent = document.getElementById('lb-content');
    if (!lbContent) return;

    const isDev = isDevUser();

    lbContent.innerHTML = '<div style="text-align: center; opacity: 0.5; padding: 2rem;">Loading data...</div>';

    try {
        let users = [];
        let globalVisits = 0;

        if (isDev) {
            // DEVELOPER MODE: Fetch all users ever (unlimited)
            const q = query(collection(db, 'users'), orderBy('totalTime', 'desc'));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach(d => users.push({ id: d.id, ...d.data() }));

            // Fetch global visits counter from stats/global
            try {
                const statsSnap = await getDoc(doc(db, 'stats', 'global'));
                if (statsSnap.exists()) {
                    globalVisits = statsSnap.data().totalVisits || 0;
                }
            } catch (err) {}
        } else {
            // REGULAR MODE: Only top 100 users
            const q = query(collection(db, 'users'), orderBy('totalTime', 'desc'), limit(100));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach(d => users.push({ id: d.id, ...d.data() }));
        }

        cachedUsers = users;
        window.cachedUsers = users;
        lbContent.innerHTML = '';

        // Update container header title
        const headerTitle = document.querySelector('.leaderboard-container h2');
        if (headerTitle) {
            headerTitle.innerText = isDev ? 'DEVELOPER COMMAND CENTER • LEADERBOARD' : 'LEADERBOARD (TOP 100)';
        }

        if (isDev) {
            renderDevDashboard(lbContent, users, globalVisits);
        } else {
            renderPublicLeaderboard(lbContent, users);
        }

    } catch (e) {
        lbContent.innerHTML = '<div style="text-align: center; color: #ef4444; padding: 2rem;">Error loading leaderboard.</div>';
        console.error("Leaderboard error:", e);
    }
}

// --- Render Public Leaderboard (Top 100) ---
function renderPublicLeaderboard(container, users) {
    let rank = 1;
    let renderedCount = 0;

    users.forEach((u) => {
        if (renderedCount >= 100) return;

        // Spoofing Protection: Ignore users with > 365 days of playtime
        if (u.totalTime > 31536000) return;
        
        // Hide users with < 15s of playtime unless it's current user
        let isMe = username && u.username && u.username.toLowerCase() === username.toLowerCase();
        if (u.totalTime < 15 && !isMe) return;
        
        // Hide opted out users
        if (u.optOut && !isMe) return;
        
        let medal = rank === 1 ? '[1]' : rank === 2 ? '[2]' : rank === 3 ? '[3]' : `[${rank}]`;
        let bg = isMe ? '#22c55e' : 'transparent';
        let color = isMe ? '#000' : 'inherit';
        let border = '1px solid var(--border-color, #333)';
        
        let displayUsername = u.username || u.id || 'Anonymous';
        if (displayUsername.startsWith('user_')) {
            displayUsername = 'User #' + displayUsername.substring(5);
        }
        
        container.innerHTML += `
            <div style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: ${bg}; color: ${color}; border: ${border}; border-radius: 0; align-items: center; margin-bottom: 4px; font-family: monospace; letter-spacing: 0.5px;">
                <span style="font-weight: bold; width: 50px; text-align: left;">${medal}</span>
                <span style="flex-grow: 1; margin-left: 10px; font-weight: ${isMe ? 'bold': 'normal'}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${sanitizeHTML(censorName(displayUsername))} ${isMe ? '<span style="font-size: 0.8rem; margin-left: 6px; padding: 2px 6px; background: rgba(0,0,0,0.2); border-radius: 0;">&lt;YOU&gt;</span>' : ''}</span>
                <span style="font-family: monospace; font-weight: 600; margin-left: 10px;">${formatTime(u.totalTime)}</span>
            </div>
        `;
        rank++;
        renderedCount++;
    });

    if (renderedCount === 0) {
        container.innerHTML = '<div style="text-align:center; opacity:0.5; padding: 2rem;">No users yet.</div>';
    }
}

// --- Render Developer Dashboard (hypergenius12) ---
function renderDevDashboard(container, users, globalVisits) {
    const now = Date.now();
    const { popularGames, totalEverSeconds } = aggregateProjectData(users);

    // Filter online visitors (active within last 2 minutes / 120s)
    // Always include current active dev user if viewing
    const onlineUsers = users.filter(u => {
        if (u.username && username && u.username.toLowerCase() === username.toLowerCase()) return true;
        return u.lastActive && (now - u.lastActive <= 120000);
    });

    // Calculate visits estimate if global document is fresh
    const totalEverVisitors = users.length;
    const computedTotalVisits = Math.max(globalVisits || 0, Math.round(totalEverSeconds / 240) + totalEverVisitors);

    // Dev Command Center Container
    const devHTML = `
        <div id="dev-analytics-panel" style="margin-bottom: 2rem; background: rgba(168, 85, 247, 0.05); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 0; padding: 1.5rem; backdrop-filter: blur(10px);">
            <!-- Admin Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(168, 85, 247, 0.2); padding-bottom: 0.8rem; margin-bottom: 1.2rem; flex-wrap: wrap; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <strong style="color: #a855f7; font-family: monospace; font-size: 1rem; letter-spacing: 1px;">DEVELOPER TELEMETRY &amp; LIVE AUDIT</strong>
                </div>
                <div style="font-size: 0.8rem; opacity: 0.8; font-family: monospace;">
                    Logged in as <strong style="color: #22c55e;">${sanitizeHTML(username || 'Developer')}</strong>
                </div>
            </div>

            <!-- Key Metric Cards -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 1.5rem;">
                <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 0; padding: 1rem; text-align: center;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 6px; color: #22c55e; font-size: 0.8rem; font-weight: bold; text-transform: uppercase;">
                        <span style="width: 8px; height: 8px; background: #22c55e; border-radius: 0; display: inline-block;"></span>
                        Online Visitors
                    </div>
                    <div style="font-size: 2rem; font-weight: 800; color: #22c55e; font-family: monospace; margin-top: 4px;">${onlineUsers.length}</div>
                    <div style="font-size: 0.75rem; opacity: 0.7;">Active in last 2 mins</div>
                </div>

                <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 0; padding: 1rem; text-align: center;">
                    <div style="color: #3b82f6; font-size: 0.8rem; font-weight: bold; text-transform: uppercase;">Total Ever Visitors</div>
                    <div style="font-size: 2rem; font-weight: 800; color: #3b82f6; font-family: monospace; margin-top: 4px;">${totalEverVisitors}</div>
                    <div style="font-size: 0.75rem; opacity: 0.7;">Unique player profiles</div>
                </div>

                <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 0; padding: 1rem; text-align: center;">
                    <div style="color: #f59e0b; font-size: 0.8rem; font-weight: bold; text-transform: uppercase;">Total Ever Visits</div>
                    <div style="font-size: 2rem; font-weight: 800; color: #f59e0b; font-family: monospace; margin-top: 4px;">${computedTotalVisits.toLocaleString()}</div>
                    <div style="font-size: 0.75rem; opacity: 0.7;">Aggregate site sessions</div>
                </div>

                <div style="background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 0; padding: 1rem; text-align: center;">
                    <div style="color: #a855f7; font-size: 0.8rem; font-weight: bold; text-transform: uppercase;">Total Playtime</div>
                    <div style="font-size: 1.5rem; font-weight: 800; color: #a855f7; font-family: monospace; margin-top: 8px;">${formatTime(totalEverSeconds)}</div>
                    <div style="font-size: 0.75rem; opacity: 0.7;">Across all games</div>
                </div>
            </div>

            <!-- Current Visitors Detail Section -->
            <div style="margin-bottom: 1.5rem; background: rgba(0,0,0,0.25); border: 1px solid var(--border-color); border-radius: 0; padding: 1rem;">
                <div style="font-weight: bold; font-size: 0.85rem; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: space-between;">
                    <span>CURRENTLY ON SITE (${onlineUsers.length} ONLINE)</span>
                    <span style="font-size: 0.75rem; opacity: 0.6; font-family: monospace;">Heartbeat: 15s</span>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${onlineUsers.length > 0 ? onlineUsers.map(u => {
                        const isMe = username && u.username && u.username.toLowerCase() === username.toLowerCase();
                        const isDev = isDevName(u.username);
                        const currentProj = getDisplayProjectName(u.currentProject || 'Home');
                        const activeAgo = formatRelativeTime(u.lastActive || now);
                        return `
                            <div style="background: ${isMe ? 'rgba(34, 197, 94, 0.2)' : isDev ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.08)'}; border: 1px solid ${isMe ? '#22c55e' : isDev ? '#a855f7' : 'var(--border-color)'}; border-radius: 0; padding: 6px 10px; font-family: monospace; font-size: 0.8rem; display: flex; align-items: center; gap: 8px;">
                                <span style="width: 6px; height: 6px; background: #22c55e; border-radius: 0;"></span>
                                <strong>${sanitizeHTML(u.username || u.id)}</strong>
                                ${isDev ? '<span style="font-size: 0.65rem; padding: 1px 4px; background: rgba(168, 85, 247, 0.3); color: #c084fc; border-radius: 0;">DEV</span>' : ''}
                                <span style="opacity: 0.7;">in ${sanitizeHTML(currentProj)}</span>
                                <span style="font-size: 0.7rem; opacity: 0.5;">(${activeAgo})</span>
                            </div>
                        `;
                    }).join('') : '<div style="opacity: 0.5; font-size: 0.8rem;">No other visitors active right now.</div>'}
                </div>
            </div>

            <!-- Most Popular Games Ranking -->
            <div style="margin-bottom: 1.5rem; background: rgba(0,0,0,0.25); border: 1px solid var(--border-color); border-radius: 0; padding: 1rem;">
                <div style="font-weight: bold; font-size: 0.85rem; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: space-between;">
                    <span>MOST POPULAR GAMES &amp; PROJECTS (PLAYTIME RANKING)</span>
                    <span style="font-size: 0.75rem; opacity: 0.6; font-family: monospace;">Ranked by Hours</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${popularGames.slice(0, 8).map((g, idx) => {
                        const topTime = popularGames[0]?.time || 1;
                        const pct = Math.min(100, Math.round((g.time / topTime) * 100));
                        return `
                            <div style="display: flex; flex-direction: column; gap: 3px; font-family: monospace; font-size: 0.8rem;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span>
                                        <strong style="color: #a855f7;">[${idx + 1}]</strong> 
                                        <strong>${sanitizeHTML(g.displayName)}</strong> 
                                        <span style="opacity: 0.6; font-size: 0.75rem;">(${g.players} players)</span>
                                    </span>
                                    <span style="font-weight: bold;">${formatTime(g.time)}</span>
                                </div>
                                <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.06); border-radius: 0; overflow: hidden;">
                                    <div style="width: ${pct}%; height: 100%; background: linear-gradient(90deg, #3b82f6, #a855f7); border-radius: 0;"></div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- All People Ever Directory & Search -->
            <div style="margin-top: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 8px;">
                    <div style="font-weight: bold; font-size: 0.85rem;">
                        ALL PEOPLE EVER (${users.length} TOTAL USERS)
                    </div>
                    <input 
                        type="text" 
                        id="dev-user-search" 
                        placeholder="Search any user..." 
                        style="padding: 6px 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 0; color: var(--text-color); font-family: monospace; font-size: 0.8rem; outline: none; width: 180px;"
                    />
                </div>
                <div id="dev-users-list" style="max-height: 400px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; padding-right: 4px;">
                    <!-- Injected by renderDevUserRows -->
                </div>
            </div>
        </div>
    `;

    container.innerHTML = devHTML;

    // Helper to render user rows with live search filtering
    function renderDevUserRows(queryText = '') {
        const listEl = document.getElementById('dev-users-list');
        if (!listEl) return;

        const filtered = users.filter(u => {
            const name = (u.username || u.id || '').toLowerCase();
            return !queryText || name.includes(queryText.toLowerCase());
        });

        if (filtered.length === 0) {
            listEl.innerHTML = '<div style="text-align: center; opacity: 0.5; padding: 1.5rem; font-size: 0.8rem;">No matching users found.</div>';
            return;
        }

        listEl.innerHTML = filtered.map((u, idx) => {
            const isOnline = (username && u.username && u.username.toLowerCase() === username.toLowerCase()) || (u.lastActive && (now - u.lastActive <= 120000));
            const isMe = username && u.username && u.username.toLowerCase() === username.toLowerCase();
            const isDev = isDevName(u.username);
            const displayUsername = u.username || u.id || 'Anonymous';
            const activeAgo = formatRelativeTime(u.lastActive);
            const currentProj = getDisplayProjectName(u.currentProject || 'None');

            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.8rem; background: ${isMe ? 'rgba(34, 197, 94, 0.15)' : 'rgba(0,0,0,0.15)'}; border: 1px solid ${isMe ? 'rgba(34, 197, 94, 0.4)' : 'var(--border-color)'}; border-radius: 0; font-family: monospace; font-size: 0.8rem;">
                    <div style="display: flex; align-items: center; gap: 8px; flex-grow: 1; min-width: 0;">
                        <span style="opacity: 0.5; width: 32px; font-size: 0.75rem;">[${idx + 1}]</span>
                        <span style="width: 8px; height: 8px; border-radius: 0; background: ${isOnline ? '#22c55e' : '#71717a'}; display: inline-block; shrink: 0;" title="${isOnline ? 'Online now' : 'Offline'}"></span>
                        <strong style="color: ${isMe ? '#22c55e' : isDev ? '#a855f7' : 'inherit'}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${sanitizeHTML(displayUsername)}
                        </strong>
                        ${isDev ? '<span style="font-size: 0.65rem; padding: 1px 4px; background: rgba(168, 85, 247, 0.2); color: #c084fc; border-radius: 0;">DEV</span>' : ''}
                        ${u.totalTime < 15 ? '<span style="font-size: 0.65rem; padding: 1px 4px; background: rgba(239, 68, 68, 0.15); color: #ef4444; border-radius: 0;">&lt;15s</span>' : ''}
                    </div>
                    <div style="display: flex; align-items: center; gap: 14px; shrink: 0;">
                        <span style="opacity: 0.6; font-size: 0.75rem;" title="Last Active">${activeAgo}</span>
                        <span style="font-weight: bold; width: 70px; text-align: right;">${formatTime(u.totalTime)}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderDevUserRows();

    // Hook up live search
    const searchInput = document.getElementById('dev-user-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderDevUserRows(e.target.value.trim());
        });
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
                    await setDoc(doc(db, 'users', username.toLowerCase()), { optOut: isOptedOut }, { merge: true });
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
        badge.style.cursor = 'pointer';
        badge.title = 'Click to switch or rename username';
        
        badge.onclick = () => {
            const modal = document.getElementById('username-modal');
            const input = document.getElementById('username-input');
            if (modal) {
                if (input && username) input.value = username;
                modal.classList.add('active');
            }
        };

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
        nameEl.style.color = isDevName(username) ? "#22c55e" : "#a855f7";
        rankEl.innerText = "Rank: Calculating...";

        try {
            const userRef = doc(db, 'users', username.toLowerCase());
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
