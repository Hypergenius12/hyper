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
    'synesthesia': 'Synesthesia Color Mixer'
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
        let mode = 'overall';
        const tabProjects = document.getElementById('tab-projects');
        if (tabProjects && tabProjects.style.background !== 'transparent' && tabProjects.style.background !== '') {
            mode = 'projects';
        }
        loadLeaderboard(mode);
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
                    loadLeaderboard('overall'); // refresh leaderboard
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

async function loadLeaderboard(mode = 'overall', subProject = null) {
    const lbContent = document.getElementById('lb-content');
    if (!lbContent) return;

    lbContent.innerHTML = '<div style="text-align: center; opacity: 0.5; padding: 2rem;">Loading data...</div>';
    try {
        if (mode === 'overall') {
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

        } else if (mode === 'projects') {
            if (!cachedUsers) {
                const q = query(collection(db, 'users'), orderBy('totalTime', 'desc'), limit(200));
                const snap = await getDocs(q);
                cachedUsers = [];
                snap.forEach(d => cachedUsers.push(d.data()));
            }

            let projectNames = new Set(Object.keys(PROJECT_NAMES).filter(k => k !== 'paths'));
            cachedUsers.forEach(u => {
                if (u.projects) {
                    Object.keys(u.projects).forEach(p => {
                        if (p !== 'Home' && p !== 'paths' && p.toLowerCase() !== 'hyper') projectNames.add(p);
                    });
                }
            });
            let pList = Array.from(projectNames).sort();

            if (pList.length === 0) {
                lbContent.innerHTML = '<div style="text-align:center; opacity:0.5; padding: 2rem;">No project data yet. Play a game first!</div>';
                return;
            }

            let activeProj = subProject || pList[0];

            let tabsHtml = `<div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 2px solid #333; font-family: monospace; text-transform: uppercase;">`;
            pList.forEach(p => {
                let isActive = p === activeProj;
                let displayName = getDisplayProjectName(p);
                let btnText = isActive ? `[${displayName}]` : displayName;
                let bg = isActive ? '#22c55e' : 'transparent';
                let color = isActive ? '#000' : 'var(--text-color)';
                let border = isActive ? '1px solid #22c55e' : '1px solid #333';
                let hoverColor = isActive ? '#000' : '#fff';
                tabsHtml += `<button onclick="window.loadSubProject('${p.replace(/'/g, "\\'")}')" style="white-space: nowrap; padding: 0.5rem 1rem; border: ${border}; border-radius: 0; background: ${bg}; color: ${color}; cursor: pointer; font-family: monospace; font-weight: bold; letter-spacing: 1px; transition: all 0.2s;" onmouseover="this.style.borderColor='${isActive ? '#22c55e' : '#fff'}'; this.style.color='${hoverColor}';" onmouseout="this.style.borderColor='${isActive ? '#22c55e' : '#333'}'; this.style.color='${color}';">${btnText}</button>`;
            });
            tabsHtml += `</div><div id="sub-lb-content"><div style="text-align:center; opacity:0.5; font-family: monospace;">LOADING ${getDisplayProjectName(activeProj)}...</div></div>`;
            
            lbContent.innerHTML = tabsHtml;

            try {
                const qp = query(collection(db, 'users'), orderBy(`projects.${activeProj}`, 'desc'), limit(100));
                const snapP = await getDocs(qp);
                let pUsers = [];
                snapP.forEach(d => pUsers.push(d.data()));

                let subContent = document.getElementById('sub-lb-content');
                subContent.innerHTML = '';
                let rank = 1;
                pUsers.forEach((u) => {
                    let timeVal = u.projects[activeProj];
                    if (!timeVal || timeVal > 31536000) return; // Spoofing protection
                    
                    // Hide users with < 15s of playtime unless hyperShowAllUsers is true
                    if (timeVal < 15 && !window.hyperShowAllUsers) return;
                    
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
                    
                    subContent.innerHTML += `
                        <div style="display: flex; justify-content: space-between; padding: 0.75rem; background: ${bg}; color: ${color}; border: ${border}; border-radius: 0; align-items: center; margin-bottom: 4px; font-family: monospace; text-transform: uppercase; letter-spacing: 1px;">
                            <span style="font-weight: bold; width: 40px; text-align: center;">${medal}</span>
                            <span style="flex-grow: 1; margin-left: 10px; font-weight: ${isMe ? 'bold': 'normal'}">${sanitizeHTML(censorName(displayUsername))} ${isMe ? '<span style="font-size: 0.8rem; margin-left: 4px;">&lt;YOU&gt;</span>' : ''}</span>
                            <span style="font-family: monospace;">${formatTime(timeVal)}</span>
                        </div>
                    `;
                    rank++;
                });
                if (pUsers.length === 0) subContent.innerHTML = '<div style="text-align:center; opacity:0.5;">No data for this project.</div>';

            } catch(e) {
                document.getElementById('sub-lb-content').innerHTML = `<div style="text-align:center; color:#ef4444; padding: 1rem;">Firestore requires an automatic index for this project. Check your console.</div>`;
                console.error(e);
            }
        }

    } catch (e) {
        lbContent.innerHTML = '<div style="text-align: center; color: #ef4444; padding: 2rem;">Error loading leaderboard.</div>';
        console.error(e);
    }
}

// Global exposure for the onclick handler
window.loadSubProject = function(p) {
    loadLeaderboard('projects', p);
};

if (isHome) {
    const tabOverall = document.getElementById('tab-overall');
    const tabProjects = document.getElementById('tab-projects');

    if (tabOverall) {
        tabOverall.style.borderRadius = '0';
        tabOverall.style.fontFamily = 'monospace';
        tabOverall.style.textTransform = 'uppercase';
        tabProjects.style.borderRadius = '0';
        tabProjects.style.fontFamily = 'monospace';
        tabProjects.style.textTransform = 'uppercase';

        tabOverall.addEventListener('click', () => {
            tabOverall.style.background = '#fff'; tabOverall.style.color = '#000'; tabOverall.style.border = '1px solid #fff';
            tabProjects.style.background = 'transparent'; tabProjects.style.color = 'var(--text-color)'; tabProjects.style.border = '1px solid #333';
            loadLeaderboard('overall');
        });
        tabProjects.addEventListener('click', () => {
            tabProjects.style.background = '#fff'; tabProjects.style.color = '#000'; tabProjects.style.border = '1px solid #fff';
            tabOverall.style.background = 'transparent'; tabOverall.style.color = 'var(--text-color)'; tabOverall.style.border = '1px solid #333';
            loadLeaderboard('projects');
        });
        
        tabOverall.click(); // trigger initial styling
    }

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
            loadLeaderboard('overall');
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
