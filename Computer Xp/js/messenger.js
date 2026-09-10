const MESSENGER_CONTACTS = [
    { id: 'smarterchild', name: 'SmarterChild', status: 'Online', msgs: [], typing: false },
    { id: 'itsupport', name: 'IT Support', status: 'Online', msgs: [], typing: false },
    { id: 'guest', name: 'Guest', status: 'Offline', msgs: [], typing: false }
];

let currentChatId = null;

window.initMessenger = function() {
    renderMessengerContacts();
};

function renderMessengerContacts() {
    let list = document.getElementById('messenger-contacts-list');
    if(!list) return;
    list.innerHTML = '';
    
    let currentUser = localStorage.getItem('xp_user') || 'Administrator';
    let currentUserDisplay = document.getElementById('messenger-current-user-display');
    if(currentUserDisplay) currentUserDisplay.innerText = currentUser + ' (Online)';
    
    MESSENGER_CONTACTS.filter(c => c.name.toLowerCase() !== currentUser.toLowerCase()).forEach(c => {
        let div = document.createElement('div');
        div.style.padding = '5px';
        div.style.cursor = 'pointer';
        div.style.borderBottom = '1px solid #eee';
        div.innerHTML = `<span style="color:${c.status==='Online'?'green':'gray'}">●</span> <strong>${c.name}</strong> <span style="color:#999; font-size:10px;">(${c.status})</span>`;
        div.onclick = () => openMessengerChat(c.id);
        
        div.onmouseover = () => div.style.background = '#eef3fa';
        div.onmouseout = () => div.style.background = 'transparent';
        
        list.appendChild(div);
    });
}

window.openMessengerChat = function(id) {
    currentChatId = id;
    let contact = MESSENGER_CONTACTS.find(c => c.id === id);
    if(!contact) return;
    
    document.getElementById('messenger-contacts-view').style.display = 'none';
    document.getElementById('messenger-chat-view').style.display = 'flex';
    document.getElementById('messenger-chat-name').innerText = contact.name;
    
    renderChatHistory();
};

window.messengerCloseChat = function() {
    currentChatId = null;
    document.getElementById('messenger-chat-view').style.display = 'none';
    document.getElementById('messenger-contacts-view').style.display = 'flex';
};

window.addNewContactPrompt = async function() {
    let name = null;
    if (typeof window.xpDialog === 'function') {
        name = await window.xpDialog('Add Contact', 'Enter the name or email of your new contact:', 'prompt');
    } else {
        name = prompt("Enter the name or email of your new contact:");
    }
    
    if(!name || name.trim() === '') return;
    
    let safeId = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if(!safeId) safeId = 'contact' + Date.now();
    
    if(MESSENGER_CONTACTS.find(c => c.id === safeId)) {
        if(typeof window.xpDialog === 'function') window.xpDialog('Add Contact', 'This contact already exists.', 'error');
        return;
    }
    
    MESSENGER_CONTACTS.push({
        id: safeId,
        name: name.trim(),
        status: 'Online',
        msgs: [],
        typing: false
    });
    
    renderMessengerContacts();
    if(typeof window.playXPSound === 'function') window.playXPSound('notify');
};

function renderChatHistory() {
    let hist = document.getElementById('messenger-chat-history');
    if(!hist || !currentChatId) return;
    
    let contact = MESSENGER_CONTACTS.find(c => c.id === currentChatId);
    hist.innerHTML = '';
    
    contact.msgs.forEach(m => {
        let div = document.createElement('div');
        div.style.marginBottom = '8px';
        if(m.type === 'nudge') {
            div.innerHTML = `<hr><div style="color:red; text-align:center; font-weight:bold;">${m.sender === 'me' ? 'You sent a Nudge!' : contact.name + ' sent you a Nudge!'}</div><hr>`;
        } else if(m.sender === 'me') {
            div.innerHTML = `<strong style="color:gray;">You say:</strong><br>${m.text}`;
        } else {
            div.innerHTML = `<strong style="color:blue;">${contact.name} says:</strong><br>${m.text}`;
        }
        hist.appendChild(div);
    });
    
    if(contact.typing) {
        let div = document.createElement('div');
        div.style.color = '#aaa';
        div.style.fontStyle = 'italic';
        div.innerText = `${contact.name} is typing a message...`;
        hist.appendChild(div);
    }
    
    hist.scrollTop = hist.scrollHeight;
}

window.messengerNudge = function() {
    if(!currentChatId) return;
    let contact = MESSENGER_CONTACTS.find(c => c.id === currentChatId);
    if(!contact || contact.status === 'Offline') return;
    
    contact.msgs.push({ type: 'nudge', sender: 'me' });
    shakeWindow('messenger-window');
    renderChatHistory();
    if(typeof window.playSound === 'function') window.playSound('balloon'); // Use balloon sound as nudge fallback
    
    // Bot gets annoyed by nudges
    setTimeout(() => {
        contact.typing = true;
        renderChatHistory();
        setTimeout(() => {
            contact.typing = false;
            contact.msgs.push({ sender: 'them', text: "Hey! Don't nudge me, I'm busy!" });
            renderChatHistory();
            if(typeof window.playXPSound === 'function') window.playXPSound('notify');
        }, 1500);
    }, 1000);
};

function shakeWindow(id) {
    let win = document.getElementById(id);
    if(!win) return;
    let ox = parseInt(win.style.left) || 0;
    let oy = parseInt(win.style.top) || 0;
    let shakes = [ {x:10,y:10}, {x:-10,y:-10}, {x:10,y:-10}, {x:-10,y:10}, {x:0,y:0} ];
    let i = 0;
    let intv = setInterval(() => {
        if(i >= shakes.length) { clearInterval(intv); win.style.left = ox+"px"; win.style.top = oy+"px"; return; }
        win.style.left = (ox + shakes[i].x) + "px";
        win.style.top = (oy + shakes[i].y) + "px";
        i++;
    }, 50);
}

window.messengerSendMessage = function() {
    let input = document.getElementById('messenger-chat-input');
    let text = input.value.trim();
    if(!text || !currentChatId) return;
    
    let contact = MESSENGER_CONTACTS.find(c => c.id === currentChatId);
    if(!contact) return;
    
    contact.msgs.push({ sender: 'me', text: text });
    input.value = '';
    renderChatHistory();
    
    if(contact.status === 'Offline') {
        setTimeout(() => {
            contact.msgs.push({ sender: 'them', text: `This message could not be delivered because ${contact.name} is offline.` });
            if(currentChatId === contact.id) renderChatHistory();
        }, 500);
        return;
    }
    
    // Bot logic - simulate typing delay
    setTimeout(() => {
        contact.typing = true;
        if(currentChatId === contact.id) renderChatHistory();
        
        setTimeout(() => {
            contact.typing = false;
            let reply = window.ChatbotEngine.getReply(contact.id, text);
            
            if(reply === '*NUDGE*') {
                contact.msgs.push({ type: 'nudge', sender: 'them' });
                shakeWindow('messenger-window');
            } else {
                contact.msgs.push({ sender: 'them', text: reply });
            }
            
            if(currentChatId === contact.id) {
                renderChatHistory();
                if(typeof window.playXPSound === 'function') window.playXPSound('notify');
            } else {
                if(typeof window.showBalloon === 'function') {
                    window.showBalloon("MSN Messenger", `New message from ${contact.name}!`, () => {
                        window.openProgram('messenger-window');
                        openMessengerChat(contact.id);
                    });
                }
                if(typeof window.playXPSound === 'function') window.playXPSound('notify');
            }
        }, 1000 + (Math.random() * 2000)); // 1-3 sec typing
    }, 500); // 0.5 sec before typing starts
};

