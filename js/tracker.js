import { db } from './firebase-config.js';
import { collection, doc, getDoc, setDoc, updateDoc, increment, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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
async function loadLeaderboard(mode = 'overall') {
    const lbContent = document.getElementById('lb-content');
    if (!lbContent) return;

    lbContent.innerHTML = '<div style="text-align: center; opacity: 0.5; padding: 2rem;">Loading data...</div>';
    try {
        let q;
        if (mode === 'overall') {
            q = query(collection(db, 'users'), orderBy('totalTime', 'desc'), limit(15));
        } else {
            // Fetch top 50 users to find project leaders
            q = query(collection(db, 'users'), orderBy('totalTime', 'desc'), limit(50));
        }

        const querySnapshot = await getDocs(q);
        let users = [];
        querySnapshot.forEach(d => {
            users.push(d.data());
        });

        if (mode === 'projects') {
            // Group top times by project
            let projectTops = {};
            users.forEach(u => {
                if (u.projects) {
                    for (let p in u.projects) {
                        if (!projectTops[p] || u.projects[p] > projectTops[p].time) {
                            projectTops[p] = { name: u.username, time: u.projects[p] };
                        }
                    }
                }
            });
            
            lbContent.innerHTML = '';
            for (let p in projectTops) {
                if (p === 'Home') continue;
                lbContent.innerHTML += `
                    <div style="display: flex; justify-content: space-between; padding: 0.75rem; background: rgba(255,255,255,0.05); border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
                        <span style="font-weight: bold;">${p}</span>
                        <span><span style="color: #3b82f6; font-weight: bold;">${projectTops[p].name}</span> <span style="opacity:0.8; margin-left:8px; font-family: monospace;">${formatTime(projectTops[p].time)}</span></span>
                    </div>
                `;
            }
            if (lbContent.innerHTML === '') lbContent.innerHTML = '<div style="text-align:center; opacity:0.5; padding: 2rem;">No project data yet.</div>';
            
        } else {
            lbContent.innerHTML = '';
            users.forEach((u, index) => {
                let medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `<span style="opacity:0.5">#${index+1}</span>`;
                lbContent.innerHTML += `
                    <div style="display: flex; justify-content: space-between; padding: 0.75rem; background: ${index < 3 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.05)'}; border: 1px solid ${index < 3 ? 'rgba(59, 130, 246, 0.3)' : 'transparent'}; border-radius: 6px; align-items: center;">
                        <span style="font-weight: bold; width: 40px;">${medal}</span>
                        <span style="flex-grow: 1; margin-left: 10px; font-weight: ${index < 3 ? 'bold': 'normal'}">${u.username}</span>
                        <span style="opacity: 0.8; font-family: monospace;">${formatTime(u.totalTime)}</span>
                    </div>
                `;
            });
            if (users.length === 0) lbContent.innerHTML = '<div style="text-align:center; opacity:0.5; padding: 2rem;">No users yet.</div>';
        }

    } catch (e) {
        lbContent.innerHTML = '<div style="text-align: center; color: #ef4444; padding: 2rem;">Error loading leaderboard. Ensure Firestore is set up correctly in Test Mode.</div>';
        console.error(e);
    }
}

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
