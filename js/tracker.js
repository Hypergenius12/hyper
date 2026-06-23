import { db } from './firebase-config.js';
import { collection, doc, getDoc, setDoc, updateDoc, increment, query, orderBy, limit, getDocs, getCountFromServer, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// --- Helpers ---
function formatTime(seconds) {
    if (!seconds) return "< 1m";
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    let str = [];
    if(d > 0) str.push(d + 'd');
    if(h > 0 || d > 0) str.push(h + 'h');
    str.push(m + 'm');
    if (d === 0 && h === 0 && m === 0) return "< 1m";
    return str.join(' ');
}

function getProjectName() {
    let path = window.location.pathname;
    if (path.endsWith('/')) path += 'index.html';
    const parts = path.split('/');
    if (parts.length <= 2 || (parts.length === 3 && parts[1] === '')) return 'Home';
    return decodeURIComponent(parts[parts.length - 2]) || 'Home';
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

if (username) {
    // Sync cookie and localstorage so it's super resilient
    localStorage.setItem('hyper_username', username);
    setCookie('hyper_username', username, 3650); // 10 years
}

if (isHome) {
    const modal = document.getElementById('username-modal');
    const form = document.getElementById('username-form');
    const errorMsg = document.getElementById('username-error');

    // Remove the "Skip for now" button so they are forced to pick one
    const skipBtn = document.querySelector('#username-modal button[type="button"]');
    if (skipBtn) skipBtn.remove();

    if (!username) {
        // Show modal on first visit
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
                    // Register
                    await setDoc(userRef, {
                        username: input,
                        totalTime: 0,
                        projects: {}
                    });
                    
                    // Make it super persistent
                    localStorage.setItem('hyper_username', input.toLowerCase());
                    setCookie('hyper_username', input.toLowerCase(), 3650);
                    username = input.toLowerCase();
                    
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
        const userRef = doc(db, 'users', username);
        try {
            await updateDoc(userRef, {
                totalTime: increment(15),
                [`projects.${projectName}`]: increment(15)
            });
        } catch (e) {
            console.error("Tracking error", e);
            // If document was deleted, we might need to recreate, but ignore for now
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
            users.forEach((u, index) => {
                let medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `<span style="opacity:0.5; font-size: 0.9rem;">#${index+1}</span>`;
                let isMe = u.username === username;
                let bg = isMe ? 'rgba(59, 130, 246, 0.2)' : (index < 3 ? 'rgba(59, 130, 246, 0.05)' : 'rgba(255,255,255,0.02)');
                let border = isMe ? '1px solid #3b82f6' : (index < 3 ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent');
                
                lbContent.innerHTML += `
                    <div style="display: flex; justify-content: space-between; padding: 0.75rem; background: ${bg}; border: ${border}; border-radius: 6px; align-items: center; margin-bottom: 4px;">
                        <span style="font-weight: bold; width: 40px; text-align: center;">${medal}</span>
                        <span style="flex-grow: 1; margin-left: 10px; font-weight: ${isMe || index < 3 ? 'bold': 'normal'}">${u.username} ${isMe ? '<span style="color:#3b82f6; font-size: 0.8rem; margin-left: 4px;">(You)</span>' : ''}</span>
                        <span style="opacity: 0.8; font-family: monospace;">${formatTime(u.totalTime)}</span>
                    </div>
                `;
            });
            if (users.length === 0) lbContent.innerHTML = '<div style="text-align:center; opacity:0.5; padding: 2rem;">No users yet.</div>';

        } else if (mode === 'projects') {
            if (!cachedUsers) {
                const q = query(collection(db, 'users'), orderBy('totalTime', 'desc'), limit(200));
                const snap = await getDocs(q);
                cachedUsers = [];
                snap.forEach(d => cachedUsers.push(d.data()));
            }

            let projectNames = new Set();
            cachedUsers.forEach(u => {
                if (u.projects) {
                    Object.keys(u.projects).forEach(p => {
                        if (p !== 'Home') projectNames.add(p);
                    });
                }
            });
            let pList = Array.from(projectNames).sort();

            if (pList.length === 0) {
                lbContent.innerHTML = '<div style="text-align:center; opacity:0.5; padding: 2rem;">No project data yet. Play a game first!</div>';
                return;
            }

            let activeProj = subProject || pList[0];

            let tabsHtml = `<div style="display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 1rem; margin-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); scrollbar-width: none;">`;
            pList.forEach(p => {
                let isActive = p === activeProj;
                tabsHtml += `<button onclick="window.loadSubProject('${p.replace(/'/g, "\\'")}')" style="white-space: nowrap; padding: 0.4rem 0.8rem; border-radius: 20px; border: 1px solid ${isActive ? '#3b82f6' : 'rgba(255,255,255,0.2)'}; background: ${isActive ? '#3b82f6' : 'transparent'}; color: ${isActive ? 'white' : 'var(--text-color)'}; cursor: pointer; font-family: inherit; transition: all 0.2s;">${p}</button>`;
            });
            tabsHtml += `</div><div id="sub-lb-content"><div style="text-align:center;opacity:0.5;">Loading top 100 for ${activeProj}...</div></div>`;
            
            lbContent.innerHTML = tabsHtml;

            try {
                const qp = query(collection(db, 'users'), orderBy(`projects.${activeProj}`, 'desc'), limit(100));
                const snapP = await getDocs(qp);
                let pUsers = [];
                snapP.forEach(d => pUsers.push(d.data()));

                let subContent = document.getElementById('sub-lb-content');
                subContent.innerHTML = '';
                pUsers.forEach((u, index) => {
                    let medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `<span style="opacity:0.5; font-size: 0.9rem;">#${index+1}</span>`;
                    let isMe = u.username === username;
                    let bg = isMe ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.02)';
                    let border = isMe ? '1px solid #3b82f6' : '1px solid transparent';
                    let timeVal = u.projects[activeProj];
                    
                    subContent.innerHTML += `
                        <div style="display: flex; justify-content: space-between; padding: 0.75rem; background: ${bg}; border: ${border}; border-radius: 6px; align-items: center; margin-bottom: 4px;">
                            <span style="font-weight: bold; width: 40px; text-align: center;">${medal}</span>
                            <span style="flex-grow: 1; margin-left: 10px; font-weight: ${isMe ? 'bold': 'normal'}">${u.username} ${isMe ? '<span style="color:#3b82f6; font-size: 0.8rem; margin-left: 4px;">(You)</span>' : ''}</span>
                            <span style="opacity: 0.8; font-family: monospace;">${formatTime(timeVal)}</span>
                        </div>
                    `;
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
        tabOverall.addEventListener('click', () => {
            tabOverall.style.background = '#3b82f6'; tabOverall.style.color = 'white'; tabOverall.style.border = 'none';
            tabProjects.style.background = 'transparent'; tabProjects.style.color = 'var(--text-color)'; tabProjects.style.border = '1px solid var(--border-color)';
            loadLeaderboard('overall');
        });
        tabProjects.addEventListener('click', () => {
            tabProjects.style.background = '#3b82f6'; tabProjects.style.color = 'white'; tabProjects.style.border = 'none';
            tabOverall.style.background = 'transparent'; tabOverall.style.color = 'var(--text-color)'; tabOverall.style.border = '1px solid var(--border-color)';
            loadLeaderboard('projects');
        });
        
        loadLeaderboard('overall');
    }
}
