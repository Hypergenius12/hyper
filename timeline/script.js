// Core DOM Elements
const track = document.getElementById('timeline-track');
const wrapper = document.getElementById('timeline-wrapper');
const axisContainer = document.getElementById('axis-container');
const modalOverlay = document.getElementById('modal-overlay');
const modalCloseBtn = document.getElementById('modal-close');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');

// Parallax & Minimap Elements
const parallax1 = document.getElementById('parallax-1');
const parallax2 = document.getElementById('parallax-2');
const minimapWrapper = document.getElementById('minimap-wrapper');
const minimapCanvas = document.getElementById('minimap-canvas');
const minimapIndicator = document.getElementById('minimap-indicator');

// Global Hover Popup Elements
const globalTooltip = document.createElement('div');
globalTooltip.className = 'event-card';
globalTooltip.style.position = 'fixed';
globalTooltip.style.pointerEvents = 'none'; 
globalTooltip.style.display = 'none';
globalTooltip.style.zIndex = '2000';
globalTooltip.style.transform = 'translateX(-50%)';
document.body.appendChild(globalTooltip);

const globalConnector = document.createElement('div');
globalConnector.className = 'event-connector';
globalConnector.style.position = 'fixed';
globalConnector.style.pointerEvents = 'none';
globalConnector.style.display = 'none';
globalConnector.style.zIndex = '1999';
globalConnector.style.width = '3px';
globalConnector.style.transform = 'translateX(-50%)';
document.body.appendChild(globalConnector);

// Settings Elements
const settingsOverlay = document.getElementById('settings-overlay');
const settingsCloseBtn = document.getElementById('settings-close');
const btnSettings = document.getElementById('btn-settings');
const themeSelector = document.getElementById('theme-selector');
const statCenturies = document.getElementById('stat-centuries');
const statSprints = document.getElementById('stat-sprints');

// Absolute Millisecond Tracking
const timelineStartMs = new Date("0900-01-01T00:00:00Z").getTime();
const timelineEndMs = new Date("2100-12-31T00:00:00Z").getTime();
const totalTimeMs = timelineEndMs - timelineStartMs;

// Global State
let currentZoom = 3; 
const minZoom = 1.5;
const maxZoom = 4000; 
let domEvents = []; 
let finalRenderedEvents = []; 

// Game & Achievement State
const visitedCenturies = new Set();
let sprintActive = false;
let sprintTimer = 100;
let sprintInterval = null;
let sprintEventsFound = 0;
let sprintWins = 0;
let sprintTarget = null;

// Render Timeline Nodes
function renderTimeline() {
    document.querySelectorAll('.event-group').forEach(el => el.remove());
    domEvents = [];
    finalRenderedEvents = [];

    const term = searchInput.value.toLowerCase();
    const cat = categoryFilter.value;

    let processedEvents = eventsData.filter(ev => {
        const yearMatch = ev.date.substring(0, 4);
        if (term.startsWith('-')) {
            return ev.date.endsWith(term);
        }
        const matchText = ev.title.toLowerCase().includes(term) || 
                          ev.desc.toLowerCase().includes(term) || 
                          yearMatch.includes(term);
        const matchCat = cat === 'all' || ev.category === cat;
        return matchText && matchCat;
    });

    processedEvents.sort((a, b) => {
        const timeA = new Date(a.date + "T12:00:00Z").getTime();
        const timeB = new Date(b.date + "T12:00:00Z").getTime();
        return timeA - timeB;
    });

    // Advanced Deduplication
    const getWords = str => new Set(str.toLowerCase().match(/\b\w{4,}\b/g) || []);
    const eventsByDate = {};

    processedEvents.forEach(ev => {
        if (!eventsByDate[ev.date]) {
            eventsByDate[ev.date] = [ev];
            finalRenderedEvents.push(ev);
        } else {
            const evWords = getWords(ev.desc);
            let isDupe = false;
            for (const existing of eventsByDate[ev.date]) {
                const existingWords = getWords(existing.desc);
                for (const w of evWords) {
                    if (existingWords.has(w)) {
                        isDupe = true;
                        break;
                    }
                }
                if (isDupe) break;
            }
            if (!isDupe) {
                eventsByDate[ev.date].push(ev);
                finalRenderedEvents.push(ev);
            }
        }
    });

    const fragment = document.createDocumentFragment();

    finalRenderedEvents.forEach((ev) => {
        const evTime = new Date(ev.date + "T12:00:00Z").getTime();
        const percentage = ((evTime - timelineStartMs) / totalTimeMs) * 100;
        
        const group = document.createElement('div');
        group.className = 'event-group';
        group.style.left = `${percentage}%`;
        group.style.display = 'none'; 
        group.setAttribute('data-category', ev.category);

        const dot = document.createElement('div');
        dot.className = 'event-dot';

        const triggerModal = () => {
            if(sprintActive && sprintTarget && ev.date === sprintTarget.date && ev.title === sprintTarget.title) {
                handleSprintWin();
                return; 
            }

            globalTooltip.style.display = 'none';
            globalConnector.style.display = 'none';

            const fullDateObj = new Date(ev.date + "T12:00:00Z");
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            
            document.getElementById('modal-category').textContent = ev.category.toUpperCase();
            document.getElementById('modal-year').textContent = fullDateObj.toLocaleDateString(undefined, options);
            document.getElementById('modal-title').textContent = ev.title;
            document.getElementById('modal-desc').textContent = ev.desc;
            
            const colorVar = getComputedStyle(document.documentElement).getPropertyValue(`--cat-${ev.category}`);
            document.getElementById('modal-year').style.color = colorVar;

            modalOverlay.classList.add('active');
        };

        dot.addEventListener('mouseenter', () => {
            if (modalOverlay.classList.contains('active') || settingsOverlay.classList.contains('active')) return;

            const rect = dot.getBoundingClientRect();
            globalTooltip.innerHTML = `<div class="event-title">${ev.title}</div>`;
            
            const colorVar = getComputedStyle(document.documentElement).getPropertyValue(`--cat-${ev.category}`).trim() || '#2196f3';
            globalTooltip.style.borderTopColor = colorVar;
            globalConnector.style.background = colorVar;

            const centerX = rect.left + rect.width / 2;
            const topY = rect.top; 
            
            globalConnector.style.left = `${centerX}px`;
            globalConnector.style.top = `${topY - 30}px`; 
            globalConnector.style.height = `30px`;
            globalConnector.style.display = 'block';

            globalTooltip.style.left = `${centerX}px`;
            globalTooltip.style.bottom = `${window.innerHeight - (topY - 30)}px`;
            globalTooltip.style.display = 'block';
        });

        dot.addEventListener('mouseleave', () => {
            globalTooltip.style.display = 'none';
            globalConnector.style.display = 'none';
        });

        dot.addEventListener('click', triggerModal);

        group.appendChild(dot);
        fragment.appendChild(group);

        domEvents.push({ el: group, pct: percentage, visible: false, evData: ev, dotEl: dot });
    });

    track.appendChild(fragment);
    drawMinimap();
    
    lastAxisZoom = -1; 
    cullEvents();
    updateVisuals();
}

// --- VIRTUALIZATION ENGINE ---
function cullEvents() {
    const trackW = track.clientWidth;
    const viewW = wrapper.clientWidth;
    const viewL = wrapper.scrollLeft;

    const viewStartPct = (viewL / trackW) * 100;
    const viewEndPct = ((viewL + viewW) / trackW) * 100;
    const buffer = 1.5; 

    const startBound = viewStartPct - buffer;
    const endBound = viewEndPct + buffer;

    for (let i = 0; i < domEvents.length; i++) {
        const item = domEvents[i];
        const inView = item.pct >= startBound && item.pct <= endBound;
        
        if (inView !== item.visible) {
            item.el.style.display = inView ? 'block' : 'none';
            if (inView) {
                setTimeout(() => item.el.classList.add('loaded'), 5);
            } else {
                item.el.classList.remove('loaded');
            }
            item.visible = inView;
        }
    }
}

// --- HEATMAP MINIMAP GENERATOR ---
function drawMinimap() {
    const ctx = minimapCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = minimapWrapper.getBoundingClientRect();
    
    minimapCanvas.width = rect.width * dpr;
    minimapCanvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    finalRenderedEvents.forEach(ev => {
        const evTime = new Date(ev.date + "T12:00:00Z").getTime();
        const pct = (evTime - timelineStartMs) / totalTimeMs;
        const x = pct * rect.width;

        const colorVar = getComputedStyle(document.documentElement).getPropertyValue(`--cat-${ev.category}`).trim() || '#2196f3';
        ctx.fillStyle = colorVar;
        ctx.globalAlpha = 0.3; 
        ctx.fillRect(x, 5, 2, rect.height - 10); 
    });
}

minimapWrapper.addEventListener('click', (e) => {
    const rect = minimapWrapper.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = clickX / rect.width;
    wrapper.scrollLeft = (pct * track.clientWidth) - (wrapper.clientWidth / 2);
    
    updateVisuals();
    cullEvents();
});
window.addEventListener('resize', drawMinimap);

// --- UNLOCK SYSTEM EVALUATOR ---
function checkUnlocks() {
    const c = visitedCenturies.size;
    const w = sprintWins;
    
    statCenturies.innerText = c;
    statSprints.innerText = w;

    if(c >= 1) document.querySelector('option[value="theme-golden"]').removeAttribute('disabled');
    if(c >= 2) document.querySelector('option[value="theme-obsidian"]').removeAttribute('disabled');
    if(c >= 3) document.querySelector('option[value="theme-ruby"]').removeAttribute('disabled');
    if(c >= 4) document.querySelector('option[value="theme-emerald"]').removeAttribute('disabled');
    if(c >= 5) document.querySelector('option[value="theme-sapphire"]').removeAttribute('disabled');
    if(c >= 6) document.querySelector('option[value="theme-amethyst"]').removeAttribute('disabled');
    if(c >= 7) document.querySelector('option[value="theme-neon"]').removeAttribute('disabled');
    
    if(w >= 1) document.querySelector('option[value="theme-sunset"]').removeAttribute('disabled');
    if(w >= 3) document.querySelector('option[value="theme-hacker"]').removeAttribute('disabled');
}

// --- VISUALS, PARALLAX & ERA EXPLORER ---
let lastAxisZoom = -1;
let lastRenderStartMs = -1;
let lastRenderEndMs = -1;

function updateVisuals() {
    const trackW = track.clientWidth;
    const viewW = wrapper.clientWidth;
    const viewL = wrapper.scrollLeft;

    globalTooltip.style.display = 'none';
    globalConnector.style.display = 'none';

    const scrollPct = viewL / (trackW - viewW || 1); 
    parallax1.style.transform = `translate3d(${scrollPct * -20}vw, 0, 0)`;
    parallax2.style.transform = `translate3d(${scrollPct * -8}vw, 0, 0)`;

    const indicatorLeftPct = (viewL / trackW) * 100;
    const indicatorWidthPct = (viewW / trackW) * 100;
    minimapIndicator.style.left = `${indicatorLeftPct}%`;
    minimapIndicator.style.width = `${indicatorWidthPct}%`;

    const msPerPx = totalTimeMs / trackW;
    const centerTimeMs = timelineStartMs + ((viewL + (viewW / 2)) * msPerPx);
    
    // ERA EXPLORER LOGIC
    const centerDate = new Date(centerTimeMs);
    const centerYear = centerDate.getUTCFullYear();
    const currentCentury = Math.floor(centerYear / 100) * 100;
    
    if (currentCentury >= 1400 && currentCentury <= 2000 && !visitedCenturies.has(currentCentury)) {
        visitedCenturies.add(currentCentury);
        const badge = document.getElementById(`badge-${currentCentury}`);
        if(badge) badge.classList.add('unlocked');
        checkUnlocks();
    }

    const viewStartMs = timelineStartMs + (viewL * msPerPx);
    const viewEndMs = timelineStartMs + ((viewL + viewW) * msPerPx);

    if (currentZoom === lastAxisZoom && viewStartMs >= lastRenderStartMs && viewEndMs <= lastRenderEndMs) {
        return; 
    }

    const bufferMs = (viewW * 1.5) * msPerPx; 
    lastRenderStartMs = viewStartMs - bufferMs;
    lastRenderEndMs = viewEndMs + bufferMs;
    lastAxisZoom = currentZoom;

    const startDate = new Date(Math.max(timelineStartMs, lastRenderStartMs));
    const endDate = new Date(Math.min(timelineEndMs, lastRenderEndMs));
    const pxPerYear = (1000 * 60 * 60 * 24 * 365.25) / msPerPx;
    
    let renderMode = 'decade'; 
    if (pxPerYear > 4000) renderMode = 'day'; 
    else if (pxPerYear > 300) renderMode = 'month'; 
    else if (pxPerYear > 30) renderMode = 'year';

    let html = '';

    for (let y = startDate.getUTCFullYear(); y <= endDate.getUTCFullYear(); y++) {
        if (renderMode === 'decade' && y % 10 !== 0) continue;
        
        const yearMs = new Date(Date.UTC(y, 0, 1)).getTime();
        const posPct = ((yearMs - timelineStartMs) / totalTimeMs) * 100;
        
        html += `<div class="tick tick-year" style="left: ${posPct}%"><div class="tick-label">${y}</div></div>`;

        if (renderMode === 'month' || renderMode === 'day') {
            for (let m = 1; m < 12; m++) {
                const monthMs = new Date(Date.UTC(y, m, 1)).getTime();
                const mPos = ((monthMs - timelineStartMs) / totalTimeMs) * 100;
                const monthName = new Date(Date.UTC(y, m, 1)).toLocaleString('default', { month: 'short' });
                html += `<div class="tick tick-month" style="left: ${mPos}%"><div class="tick-label-small">${monthName}</div></div>`;
            }
        }

        if (renderMode === 'day') {
            for (let m = 0; m < 12; m++) {
                const daysInMonth = new Date(y, m + 1, 0).getDate();
                for (let d = 2; d <= daysInMonth; d++) {
                    const dayMs = new Date(Date.UTC(y, m, d)).getTime();
                    const dPos = ((dayMs - timelineStartMs) / totalTimeMs) * 100;
                    html += `<div class="tick tick-day" style="left: ${dPos}%"><div class="tick-label-tiny">${d}</div></div>`;
                }
            }
        }
    }
    axisContainer.innerHTML = html;
}

let isScrolling = false;
wrapper.addEventListener('scroll', () => {
    if (!isScrolling) {
        requestAnimationFrame(() => {
            updateVisuals();
            cullEvents();
            isScrolling = false;
        });
        isScrolling = true;
    }
}, { passive: true });

searchInput.addEventListener('input', renderTimeline);
categoryFilter.addEventListener('change', renderTimeline);

// --- CURSOR-ANCHORED ZOOM LOGIC ---
function setZoom(newZoom, originX = null) {
    if (originX === null) originX = wrapper.clientWidth / 2;

    const mouseTrackX = originX + wrapper.scrollLeft;
    const trackWidth = track.clientWidth;
    const timeUnderOrigin = timelineStartMs + (mouseTrackX / trackWidth) * totalTimeMs;
    
    currentZoom = newZoom;
    track.style.width = `${currentZoom * 100}vw`;

    const textScale = Math.min(1.4, 1 + (Math.log10(currentZoom) * 0.15)); 
    document.documentElement.style.setProperty('--zoom-text', textScale);
    
    requestAnimationFrame(() => {
        const newTrackWidth = track.clientWidth;
        const newMouseTrackX = ((timeUnderOrigin - timelineStartMs) / totalTimeMs) * newTrackWidth;
        
        wrapper.scrollLeft = newMouseTrackX - originX;
        updateVisuals(); 
        cullEvents(); 
    });
}

document.getElementById('btn-zoom-in').addEventListener('click', () => {
    setZoom(Math.min(currentZoom * (currentZoom > 100 ? 1.5 : 2), maxZoom));
});

document.getElementById('btn-zoom-out').addEventListener('click', () => {
    setZoom(Math.max(currentZoom / (currentZoom > 100 ? 1.5 : 2), minZoom));
});

document.getElementById('btn-reset').addEventListener('click', () => { setZoom(3); });

wrapper.addEventListener('wheel', (e) => {
    e.preventDefault(); 
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        wrapper.scrollLeft += e.deltaX;
    } else {
        const delta = e.deltaY > 0 ? 0.85 : 1.18; 
        setZoom(Math.max(minZoom, Math.min(currentZoom * delta, maxZoom)), e.clientX);
    }
}, { passive: false });

let isDragging = false;
let startX;
let startScrollLeft;

wrapper.addEventListener('mousedown', (e) => {
    if(e.target.closest('.controls') || e.target.closest('.minimap-wrapper') || e.target.closest('.header') || e.target.closest('.game-hud')) return;
    isDragging = true;
    wrapper.style.cursor = 'grabbing';
    startX = e.pageX - wrapper.offsetLeft;
    startScrollLeft = wrapper.scrollLeft;
});
wrapper.addEventListener('mouseleave', () => { isDragging = false; wrapper.style.cursor = 'grab'; });
wrapper.addEventListener('mouseup', () => { isDragging = false; wrapper.style.cursor = 'grab'; });
wrapper.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    wrapper.scrollLeft = startScrollLeft - ((e.pageX - wrapper.offsetLeft - startX) * 1.5); 
});

// --- THEME SETTINGS MENU ---
btnSettings.addEventListener('click', () => {
    checkUnlocks();
    settingsOverlay.classList.add('active');
});
settingsCloseBtn.addEventListener('click', () => settingsOverlay.classList.remove('active'));
settingsOverlay.addEventListener('click', (e) => {
    if (e.target === settingsOverlay) settingsOverlay.classList.remove('active');
});

themeSelector.addEventListener('change', (e) => {
    document.body.className = e.target.value;
});

// --- ON THIS DAY TELEPORT ---
document.getElementById('btn-on-this-day').addEventListener('click', () => {
    let val = document.getElementById('otd-input').value.trim();
    if(val) {
        if(!val.includes('-') && val.length === 4) {
            val = val.substring(0,2) + '-' + val.substring(2,4);
            document.getElementById('otd-input').value = val;
        }
        
        searchInput.value = "-" + val;
        renderTimeline();
        
        if (finalRenderedEvents.length > 0) {
            setZoom(minZoom);
        } else {
            alert(`No major events recorded on ${val}! Try another date.`);
        }
    }
});

document.getElementById('otd-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') document.getElementById('btn-on-this-day').click();
});


// --- CHRONOLOGICAL SPRINT GAME ---
function startSprint() {
    if(finalRenderedEvents.length < 5) {
        alert("Not enough events! Clear your search filter.");
        return;
    }
    sprintActive = true;
    sprintTimer = 100;
    sprintEventsFound = 0;
    
    document.getElementById('btn-sprint-game').style.display = 'none';
    document.getElementById('game-hud').style.display = 'block';
    
    nextSprintTask();
    
    sprintInterval = setInterval(() => {
        sprintTimer--;
        document.getElementById('game-timer').innerText = sprintTimer;
        
        if (sprintTimer <= 0) {
            endSprint(`Time's up! You found ${sprintEventsFound} events.`);
        }
    }, 1000);
}

function nextSprintTask() {
    if (sprintEventsFound >= 5) {
        sprintWins++;
        checkUnlocks(); 
        endSprint(`You won! Score: ${sprintTimer} seconds remaining!`);
        return;
    }

    const randomIndex = Math.floor(Math.random() * finalRenderedEvents.length);
    sprintTarget = finalRenderedEvents[randomIndex];
    document.getElementById('target-task').innerText = sprintTarget.title;
    document.getElementById('sprint-progress').innerText = sprintEventsFound;
}

function handleSprintWin() {
    document.body.classList.add('success-flash');
    setTimeout(() => document.body.classList.remove('success-flash'), 800);
    sprintEventsFound++;
    nextSprintTask();
}

function endSprint(message) {
    sprintActive = false;
    clearInterval(sprintInterval);
    alert(message);
    document.getElementById('game-hud').style.display = 'none';
    document.getElementById('btn-sprint-game').style.display = 'flex';
}

document.getElementById('btn-sprint-game').addEventListener('click', startSprint);
document.getElementById('quit-game').addEventListener('click', () => endSprint("You surrendered the sprint."));

modalCloseBtn.addEventListener('click', () => modalOverlay.classList.remove('active'));
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.remove('active');
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') modalOverlay.classList.remove('active');
});

// Initialize application
setZoom(currentZoom); 
renderTimeline();
setTimeout(() => { wrapper.scrollLeft = 0; }, 100);