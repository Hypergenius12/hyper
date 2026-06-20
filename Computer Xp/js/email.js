window.lastSelectedEmailIndex = -1;
window.emailData = {
    inbox: [
        { id: 1, from: 'Bill Gates', subject: 'Welcome to Outlook Express!', received: '10/24/2001', body: '<b>Welcome to Outlook Express 6.</b><br><br>The premier email client for Windows XP.<br><br>Enjoy your stay!', read: false },
        { id: 2, from: 'System Administrator', subject: 'System Alert', received: '11/05/2001', body: 'Please remember to back up your critical documents to a floppy disk.', read: true },
        { id: 3, from: 'Nigerian Prince', subject: 'URGENT: BUSINESS PROPOSAL', received: '12/12/2001', body: 'DEAR FRIEND,<br><br>I AM A PRINCE AND I NEED YOUR HELP TRANSFERRING 10 MILLION DOLLARS...', read: true },
        { id: 4, from: 'Blockbuster Video', subject: 'Your Late Fees', received: '01/14/2002', body: 'You have unreturned tapes. Please return "The Matrix" to avoid further fees.', read: true },
        { id: 5, from: 'AOL Online', subject: 'Get 500 Free Hours!', received: '02/10/2002', body: 'Order your CD today to get 500 FREE HOURS of America Online!', read: true },
        { id: 6, from: 'Your Bank', subject: 'Account Security Notice', received: '03/05/2002', body: 'We have updated our privacy terms. No action is required.', read: true },
        { id: 7, from: 'eBay Notifications', subject: 'Item Sold: Furby', received: '04/01/2002', body: 'Congratulations, your item has sold for $45.00!', read: true },
        { id: 8, from: 'Mom', subject: 'Fwd: Fwd: Fw: FUNNY JOKE!!!!', received: '05/22/2002', body: 'LOL you have to read this!!!<br><br>Why did the chicken cross the road??', read: true },
        { id: 9, from: 'Napster User', subject: 'RE: Linkin Park MP3', received: '06/02/2002', body: 'The file is totally legit, just ignore the .exe extension at the end of the mp3.', read: false },
        { id: 10, from: 'Hotmail Team', subject: 'Your Hotmail account will be DELETED', received: '07/15/2002', body: 'Forward this email to 15 people or your MSN Messenger logo will turn blue and your account will be deleted!', read: true },
        { id: 11, from: 'Neopets', subject: 'Your pets are starving!', received: '08/01/2002', body: 'You have not fed your Neopet in 45 days. They are very hungry. Please log in to feed them.', read: false },
        { id: 12, from: 'Ask Jeeves', subject: 'Search Results', received: '09/10/2002', body: 'Here are the search results for "how to beat water temple ocarina of time".', read: true },
        { id: 13, from: 'Limewire Support', subject: 'PRO Upgrade Offer', received: '10/12/2002', body: 'Get Limewire PRO today for faster downloads and no spyware! Just kidding, still spyware.', read: true },
        { id: 14, from: 'Borders Books', subject: 'New Harry Potter release!', received: '11/01/2002', body: 'Reserve your copy of the new Harry Potter book at your local Borders store today.', read: true },
        { id: 15, from: 'Mom', subject: 'computer broken', received: '12/22/2002', body: 'I installed bonzi buddy and now the computer is very slow. How do I fix it?', read: false },
        { id: 16, from: 'Yahoo! GeoCities', subject: 'Your website is live', received: '01/05/2003', body: 'Your GeoCities page "Welcome to my Under Construction Page" is now live on the world wide web!', read: true },
        { id: 17, from: 'RealPlayer', subject: 'Buffering...', received: '02/14/2003', body: 'Update RealPlayer to watch the latest movie trailers. Warning: May buffer at 99% indefinitely.', read: true },
        { id: 18, from: 'Winamp', subject: 'It really whips the llamas ass!', received: '03/10/2003', body: 'Download the latest skins for your Winamp player.', read: true },
        { id: 19, from: 'SmarterChild', subject: 'Away message', received: '04/14/2003', body: 'I am currently away from my computer. Leave a message.', read: true },
        { id: 20, from: 'Runescape', subject: 'Free Armor Trimming', received: '05/17/2003', body: 'Meet me in the wildy with your full rune armor, I trim it for free.', read: false },
        { id: 21, from: 'Kazaa', subject: 'Virus Alert', received: '06/01/2003', body: 'The file "Britney_Spears_Toxic.mp3.exe" has infected your computer. Happy April Fools!', read: true }
    ],
    outbox: [],
    sent: [],
    deleted: [],
    drafts: []
};

window.currentEmailFolder = 'inbox';
window.currentEmailId = null;

window.composeQueue = [];
window.composeActiveIndex = 0;

if (!window._emailCloseHooked) {
    window._emailCloseHooked = true;
    let oldClEmail = window.closeWindow;
    window.closeWindow = function(id) {
        if(id === 'email-compose-window') {
            window.composeQueue = [];
            window.composeActiveIndex = 0;
        }
        if (oldClEmail) oldClEmail(id);
    };
}

// Track attachments for current compose session
window._composeAttachments = [];

const fakeSenders = [
    'Amazon.com', 'PayPal', 'Webmaster', 'IT Support', 'Newsletter', 'Hotmail Team', 'Yahoo! Mail', 
    'Kazaa Support', 'Limewire Pro', 'AOL Online', 'Ebay Bidding', 'Blockbuster', 
    'Your Bank', 'Mom', 'Nigerian Prince', 'X10 Cameras', 'Banzai Buddy', 'Napster', 'Netscape',
    'Geocities Admin', 'Myspace Tom', 'Runescape', 'Neopets', 'Winamp', 'RealPlayer',
    'SmileyCentral', 'WeatherBug', 'ICQ', 'AskJeeves', 'CompuServe', 'EarthLink',
    'Habbo Hotel', 'Miniclip', 'Ebaumsworld', 'Maddox', 'Newgrounds', 'IGN', 'GameSpy'
];
const fakeSubjects = [
    'Your order has shipped', 'Security Alert', 'Check out this website', 'Update required', 
    'Weekly Digest', 'Meeting at 3PM', 'Special Offer!', 'FWD: FWD: FWD: READ THIS NOW OR ELSE',
    'Enlarge your ...', 'Free iPod Nano!', 'URGENT BUSINESS PROPOSAL', 'Your AOL Trial CD is on the way',
    'Claim your free smiley cursors!', 'Download more RAM today!', 'Your Geocities page is down',
    'New friend request from Tom', 'Your Neopet is starving!', 'Winamp 3 is out!',
    'Your Runescape membership expired', 'Hot new flash games!', 'Download WeatherBug now!',
    'ICQ number reassignment', 'AskJeeves search results', 'Habbo coins sale', 'RealPlayer update available',
    'Your eBaumsworld submission', 'GameSpy arcade matches'
];

function generateRandomEmail() {
    let sender = fakeSenders[Math.floor(Math.random() * fakeSenders.length)];
    let subject = fakeSubjects[Math.floor(Math.random() * fakeSubjects.length)];
    let body = `Hello,<br><br>This is an automated message regarding: <b>${subject}</b>.<br><br>Please do not reply to this email.`;
    
    if(subject.includes('FWD:')) body = `YOU HAVE TO FORWARD THIS TO 15 PEOPLE OR BAD LUCK WILL FOLLOW YOU FOR 10 YEARS!!!<br><br>Don't believe me? A boy from Texas didn't forward it and his dog ran away!`;
    else if(subject.includes('iPod')) body = `CONGRATULATIONS! You are the 1,000,000th visitor!<br><br>Click here to claim your FREE Apple iPod Nano!`;
    else if(sender === 'Banzai Buddy') body = `Hi friend! It's me, Bonzi! Would you like me to sing a song or search the web for you?`;
    else if(sender === 'Myspace Tom') body = `Hey, thanks for joining MySpace! I'm your first friend!`;
    else if(sender === 'Neopets') body = `Your Neopet is hungry! Please feed it or it will be very sad.`;
    else if(subject.includes('RAM')) body = `Is your computer running slow? Download more RAM today for FREE! Click here!`;
    else if(subject.includes('Geocities')) body = `Your website has exceeded its 1MB bandwidth limit for the month.`;
    else if(sender === 'SmileyCentral') body = `Get 10,000 FREE animated smileys for your emails and IMs!`;

    return { id: Date.now() + Math.random(), from: sender, subject: subject, received: new Date().toLocaleDateString(), body: body, read: false };
}

function scheduleNextEmail() {
    let delay = Math.floor(Math.random() * (480000 - 60000 + 1)) + 60000;
    setTimeout(() => {
        let newEmail = generateRandomEmail();
        window.emailData.inbox.unshift(newEmail);
        if(window.currentEmailFolder === 'inbox') window.renderEmailList();
        if(typeof window.showBalloon === 'function') window.showBalloon('New Email Received', `From: ${newEmail.from}\n${newEmail.subject}`);
        scheduleNextEmail();
    }, delay);
}
scheduleNextEmail();

window.selectEmailFolder = function(folderName) {
    window.currentEmailFolder = folderName;
    ['inbox','outbox','sent','deleted','drafts'].forEach(f => {
        let el = document.getElementById('email-folder-' + f);
        if(el) {
            el.style.background = f === folderName ? '#e6f0fa' : 'transparent';
            el.style.fontWeight = f === folderName ? 'bold' : 'normal';
            el.style.border = f === folderName ? '1px dotted #ccc' : '1px solid transparent';
        }
    });
    window.renderEmailList();
    let prev = document.getElementById('email-preview-pane');
    if(prev) prev.innerHTML = '<div style="color:#666; text-align:center; margin-top:30px;">Select an item to view it.</div>';
    window.currentEmailId = null;
};

window.renderEmailList = function() {
    let table = document.getElementById('email-list-table');
    if(!table) return;
    while(table.rows.length > 1) table.deleteRow(1);
    let emails = window.emailData[window.currentEmailFolder] || [];
    if(emails.length === 0) {
        let tr = document.createElement('tr');
        let td = document.createElement('td');
        td.colSpan = 4; td.style.cssText = 'padding:10px; text-align:center; color:#666;';
        td.innerText = 'There are no items to show in this view.';
        tr.appendChild(td); table.appendChild(tr); return;
    }
    emails.forEach(email => {
        let tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        let isSelected = window.selectedEmailIds && window.selectedEmailIds.includes(email.id);
        if (window.currentEmailId === email.id && (!window.selectedEmailIds || window.selectedEmailIds.length === 0)) {
            isSelected = true;
        }
        
        tr.onclick = function(e) { 
            let idx = emails.indexOf(email);
            if(e.shiftKey && window.lastSelectedEmailIndex !== -1) {
                let start = Math.min(window.lastSelectedEmailIndex, idx);
                let end = Math.max(window.lastSelectedEmailIndex, idx);
                window.selectedEmailIds = emails.slice(start, end + 1).map(x => x.id);
                window.currentEmailId = email.id;
            } else if(e.ctrlKey) {
                if(!window.selectedEmailIds) window.selectedEmailIds = [];
                if(window.selectedEmailIds.includes(email.id)) {
                    window.selectedEmailIds = window.selectedEmailIds.filter(id => id !== email.id);
                } else {
                    window.selectedEmailIds.push(email.id);
                }
                window.currentEmailId = email.id;
                window.lastSelectedEmailIndex = idx;
            } else {
                if (window.selectedEmailIds && window.selectedEmailIds.length === 1 && window.selectedEmailIds[0] === email.id) {
                    window.selectedEmailIds = [];
                    window.currentEmailId = null;
                    let rp = document.getElementById('email-reading-pane');
                    if(rp) rp.innerHTML = '<div style="color:#666; font-style:italic;">Select a message to view its contents.</div>';
                } else {
                    window.selectedEmailIds = [email.id];
                    window.currentEmailId = email.id;
                    window.lastSelectedEmailIndex = idx;
                    window.readEmail(email.id);
                }
            }
            window.renderEmailList();
        };
        
        tr.oncontextmenu = function(e) {
            e.preventDefault();
            window.contextEmailId = email.id;
            if(!window.selectedEmailIds) window.selectedEmailIds = [];
            if(!window.selectedEmailIds.includes(email.id)) {
                window.selectedEmailIds = [email.id];
                window.currentEmailId = email.id;
                window.renderEmailList();
            }
            let ctx = document.getElementById('context-menu-email');
            if(ctx) {
                ctx.style.display = 'flex';
                ctx.style.left = e.pageX + 'px';
                ctx.style.top = e.pageY + 'px';
            }
        };
        
        tr.style.background = isSelected ? '#0055E5' : (email.read ? '#fff' : '#f4f4f4');
        tr.style.color = isSelected ? 'white' : 'black';
        let fw = email.read ? 'normal' : 'bold';
        let iconHtml = email.read ? '<img src="Windows XP Icons/MSN Email.png" style="width:16px;">' : '<img src="Windows XP Icons/Email.png" style="width:16px;">';
        if(window.currentEmailFolder === 'drafts') iconHtml = '<img src="Windows XP Icons/Notepad.png" style="width:16px;">';
        tr.innerHTML = `
            <td style="padding:2px 5px; border-right:1px solid #ACA899; border-bottom:1px solid #f0f0f0;">${iconHtml}</td>
            <td style="padding:2px 5px; border-right:1px solid #ACA899; border-bottom:1px solid #f0f0f0; font-weight:${fw};">${email.from}</td>
            <td style="padding:2px 5px; border-right:1px solid #ACA899; border-bottom:1px solid #f0f0f0; font-weight:${fw};">${email.subject}</td>
            <td style="padding:2px 5px; border-bottom:1px solid #f0f0f0;">${email.received}</td>
        `;
        table.appendChild(tr);
    });
};

window.readEmail = function(id) {
    let emails = window.emailData[window.currentEmailFolder] || [];
    let email = emails.find(e => e.id === id);
    if(!email) return;
    email.read = true;
    window.currentEmailId = id;
    window.renderEmailList();
    let pane = document.getElementById('email-preview-pane');
    if(pane) {
        pane.innerHTML = `
            <div style="background:#ECE9D8; padding:5px; border-bottom:1px solid #ACA899; margin:-10px -10px 10px -10px;">
                <b>From:</b> ${email.from}<br>
                <b>Subject:</b> ${email.subject}
            </div>
            <div style="padding:10px; font-family:Arial;">${email.body}</div>
            ${email.attachments && email.attachments.length ? `<div style="padding:5px 10px; border-top:1px solid #ACA899; background:#ECE9D8;">
                <b>Attachments:</b> ${email.attachments.map(a => `<span style="margin-left:8px;">${a.name}</span>`).join('')}
            </div>` : ''}
        `;
    }
};

window.deleteSelectedEmail = function() {
    if(!window.selectedEmailIds || window.selectedEmailIds.length === 0) {
        if(window.currentEmailId !== null) window.selectedEmailIds = [window.currentEmailId];
        else { window.xpDialog('Delete', 'Please select a message to delete.', 'error'); return; }
    }
    let arr = window.emailData[window.currentEmailFolder] || [];
    let toDelete = arr.filter(e => window.selectedEmailIds.includes(e.id));
    
    // Remove from current
    window.emailData[window.currentEmailFolder] = arr.filter(e => !window.selectedEmailIds.includes(e.id));
    
    // Add to deleted
    if(!window.emailData['deleted']) window.emailData['deleted'] = [];
    if(window.currentEmailFolder !== 'deleted') {
        toDelete.forEach(msg => window.emailData['deleted'].push(msg));
    }
    
    window.selectedEmailIds = [];
    window.currentEmailId = null;
    window.lastSelectedEmailIndex = -1;
    let rp = document.getElementById('email-reading-pane'); if(rp) rp.innerHTML = '<div style="color:#666; font-style:italic;">Select a message to view its contents.</div>';
    window.renderEmailList();
};

window.refreshEmails = function(silent) {
    
    if(silent) {
        if(!window.hasReceivedSimulatedEmail) {
            window.hasReceivedSimulatedEmail = true;
            let newMsg = {
                id: Date.now() + 1,
                from: 'System Administrator',
                subject: 'Welcome to Outlook Express!',
                received: new Date().toLocaleDateString(),
                body: '<p>Welcome to your new Outlook Express mailbox. You can now send and receive emails.</p>',
                attachments: [],
                read: false
            };
            window.emailData.inbox.unshift(newMsg);
            if(window.currentEmailFolder === 'inbox') window.renderEmailList();
            if(window.emailOptions && window.emailOptions.playSound && typeof window.playSound === 'function') window.playSound('notify');
        }
        
        if(window.emailData && window.emailData.outbox && window.emailData.outbox.length > 0) {
            window.emailData.outbox.forEach(msg => {
                msg.received = new Date().toLocaleDateString();
                if(!window.emailData.sent) window.emailData.sent = [];
                window.emailData.sent.push(msg);
            });
            window.emailData.outbox = [];
            if(window.currentEmailFolder === 'outbox' || window.currentEmailFolder === 'sent') window.renderEmailList();
        }
        return;
    }

    let win = document.getElementById('printing-progress-window');
    if(win && !silent) {
        win.querySelector('.title-bar span').innerText = 'Outlook Express - Send/Receive Progress';
        win.querySelector('#printing-doc-name').innerHTML = '<b>Connecting to server...</b><br>Authorizing Administrator...';
        win.querySelector('#printing-progress-bar').style.width = '0%';
        win.style.display = 'block';
        window.bringToFront(win);
        
        setTimeout(() => {
            win.querySelector('#printing-doc-name').innerHTML = '<b>Receiving messages...</b><br>Downloading 0 of 0...';
            win.querySelector('#printing-progress-bar').style.width = '50%';
        }, 1500);
        
        setTimeout(() => {
            win.querySelector('#printing-doc-name').innerHTML = '<b>Completed.</b><br>No new messages found.';
            win.querySelector('#printing-progress-bar').style.width = '100%';
        }, 3000);
        
        setTimeout(() => {
            win.style.display = 'none';
        }, 4000);
    } else {
        window.xpDialog('Send/Recv', 'Checking for new messages...\n\nNo new messages found at this exact moment.', 'info');
    }
};

window._composeAttachments = [];

window.openEmailCompose = function(opts) {
    opts = opts || {};
    window.composeQueue.push({
        to: opts.to || '',
        cc: opts.cc || '',
        subject: opts.subject || '',
        body: opts.body || '',
        attachments: opts.attachments || []
    });
    window.composeActiveIndex = window.composeQueue.length - 1;
    window._renderComposeWindow();
    window.openProgram('email-compose-window');
};

window._renderComposeWindow = function() {
    if(window.composeQueue.length === 0) {
        if (typeof window.closeWindow === 'function') {
            let oldHook = window._emailCloseHooked;
            window._emailCloseHooked = false; // temporarily bypass hook to just close
            window.closeWindow('email-compose-window');
            window._emailCloseHooked = oldHook;
        }
        return;
    }
    
    let tabsContainer = document.getElementById('email-compose-tabs');
    if(!tabsContainer) {
        tabsContainer = document.createElement('div');
        tabsContainer.id = 'email-compose-tabs';
        tabsContainer.style.cssText = 'display:none; gap:2px; background:#ECE9D8; border-bottom:1px solid #ACA899; padding: 2px 2px 0 2px; height: 22px; overflow-x:auto; overflow-y:hidden; user-select:none;';
        
        let menuBar = document.querySelector('#email-compose-window .menu-bar');
        if(menuBar) {
            menuBar.parentNode.insertBefore(tabsContainer, menuBar.nextSibling);
        }
    }
    
    if(window.composeQueue.length > 1) {
        tabsContainer.style.display = 'flex';
        tabsContainer.innerHTML = '';
        window.composeQueue.forEach((draft, idx) => {
            let tab = document.createElement('div');
            tab.className = 'ie-fake-tab';
            tab.style.cssText = 'background:#fff; border:1px solid #ACA899; border-bottom:none; border-radius:3px 3px 0 0; padding:2px 10px; cursor:pointer; font-size:11px; display:flex; align-items:center; gap:5px; margin-bottom:-1px; position:relative; z-index:2; max-width: 150px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;';
            if(idx !== window.composeActiveIndex) {
                tab.style.background = '#ece9d8';
                tab.style.zIndex = '1';
                tab.style.borderBottom = '1px solid #ACA899';
            }
            tab.innerText = draft.subject || '(No Subject)';
            tab.onclick = () => {
                window._saveCurrentComposeState();
                window.composeActiveIndex = idx;
                window._renderComposeWindow();
            };
            
            let closeBtn = document.createElement('span');
            closeBtn.innerText = 'x';
            closeBtn.style.cssText = 'font-weight:bold; margin-left:5px; padding:0 3px; border-radius:2px;';
            closeBtn.onmouseover = () => closeBtn.style.background = '#ffcccc';
            closeBtn.onmouseout = () => closeBtn.style.background = 'transparent';
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                window._saveCurrentComposeState();
                window.composeQueue.splice(idx, 1);
                if(window.composeActiveIndex >= window.composeQueue.length) window.composeActiveIndex = Math.max(0, window.composeQueue.length - 1);
                window._renderComposeWindow();
            };
            tab.appendChild(closeBtn);
            
            tabsContainer.appendChild(tab);
        });
    } else {
        tabsContainer.style.display = 'none';
        tabsContainer.innerHTML = '';
    }
    
    let current = window.composeQueue[window.composeActiveIndex];
    window._composeAttachments = current.attachments || [];
    document.getElementById('email-compose-to').value = current.to || '';
    document.getElementById('email-compose-cc').value = current.cc || '';
    document.getElementById('email-compose-subject').value = current.subject || '';
    document.getElementById('email-compose-body').innerHTML = current.body || '';
    if(typeof window._renderComposeAttachments === 'function') window._renderComposeAttachments();
};

window._saveCurrentComposeState = function() {
    if(window.composeQueue.length === 0 || window.composeActiveIndex >= window.composeQueue.length) return;
    let current = window.composeQueue[window.composeActiveIndex];
    current.to = document.getElementById('email-compose-to').value;
    current.cc = document.getElementById('email-compose-cc').value;
    current.subject = document.getElementById('email-compose-subject').value;
    current.body = document.getElementById('email-compose-body').innerHTML;
    current.attachments = window._composeAttachments || [];
};

window._renderComposeAttachments = function() {
    let bar = document.getElementById('email-attach-bar');
    if (!bar) return;
    if (window._composeAttachments.length === 0) {
        bar.style.display = 'none';
        return;
    }
    bar.style.display = 'flex';
    let list = document.getElementById('email-attach-list');
    if (!list) return;
    list.innerHTML = '';
    window._composeAttachments.forEach((att, idx) => {
        let chip = document.createElement('span');
        chip.style.cssText = 'display:inline-flex;align-items:center;gap:4px;border:1px solid #ACA899;padding:2px 6px;background:#fff;font-size:10px;border-radius:2px;';
        chip.innerHTML = `<img src="${att.icon||'Windows XP Icons/Briefcase.png'}" style="width:14px;height:14px;" onerror="this.style.display='none'"> ${att.name} <span style="cursor:pointer;color:red;font-weight:bold;margin-left:4px;" onclick="window._removeAttachment(${idx})">×</span>`;
        list.appendChild(chip);
    });
};

window._removeAttachment = function(idx) {
    window._composeAttachments.splice(idx, 1);
    window._renderComposeAttachments();
};

window.insertEmailAttachment = function() {
    let dlg = document.getElementById('import-source-dialog');
    if (dlg) {
        dlg.style.display = 'block';
        window.bringToFront(dlg);
    }
    
    window._importSourceCallback = function(source) {
        if (source === 'pc') {
            let input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.onchange = function() {
                Array.from(input.files).forEach(file => {
                    let reader = new FileReader();
                    reader.onload = function(e) {
                        let ext = file.name.split('.').pop().toLowerCase();
                        let icon = 'Windows XP Icons/Briefcase.png';
                        if(['jpg','jpeg','png','gif','bmp','webp'].includes(ext)) icon = e.target.result;
                        else if(ext === 'txt') icon = 'Windows XP Icons/Notepad.png';
                        else if(ext === 'pdf') icon = 'Windows XP Icons/Briefcase.png';
                        else if(['doc','docx'].includes(ext)) icon = 'Windows XP Icons/Wordpad.png';
                        else if(['xls','xlsx'].includes(ext)) icon = 'Windows XP Icons/Graph View.png';
                        
                        window._composeAttachments.push({
                            name: file.name,
                            icon: icon,
                            size: file.size,
                            dataUrl: e.target.result,
                            type: file.type
                        });
                        window._renderComposeAttachments();
                    };
                    reader.readAsDataURL(file);
                });
            };
            input.click();
        } else if (source === 'xp') {
            if (typeof window.openFileDialog === 'function') {
                window.openFileDialog('open', '', function(filepath) {
                    if (filepath) {
                        let name = filepath.filename || "Unknown File";
                        window._composeAttachments.push({
                            name: name,
                            icon: 'Windows XP Icons/Briefcase.png',
                            size: 1024,
                            dataUrl: null,
                            type: 'application/octet-stream'
                        });
                        window._renderComposeAttachments();
                    }
                });
            } else {
                window.xpDialog('Error', 'XP File Picker is not available.', 'error');
            }
        }
    };
};

window.insertEmailImage = function() {
    let dlg = document.getElementById('import-source-dialog');
    if (dlg) {
        dlg.style.display = 'block';
        window.bringToFront(dlg);
    }
    
    window._importSourceCallback = function(source) {
        if (source === 'pc') {
            let input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = function() {
                let file = input.files[0];
                if(!file) return;
                let reader = new FileReader();
                reader.onload = function(e) {
                    let body = document.getElementById('email-compose-body');
                    body.focus();
                    let img = document.createElement('img');
                    img.src = e.target.result;
                    img.style.maxWidth = '100%';
                    img.style.display = 'block';
                    img.style.margin = '4px 0';
                    
                    let sel = window.getSelection();
                    if (sel.rangeCount > 0 && body.contains(sel.getRangeAt(0).commonAncestorContainer)) {
                        let range = sel.getRangeAt(0);
                        range.deleteContents();
                        range.insertNode(img);
                    } else {
                        body.appendChild(img);
                    }
                };
                reader.readAsDataURL(file);
            };
            input.click();
        } else if (source === 'xp') {
            if (typeof window.openFileDialog === 'function') {
                window.openFileDialog('open', '', function(filepath) {
                    if (filepath) {
                        let body = document.getElementById('email-compose-body');
                        body.focus();
                        let img = document.createElement('img');
                        // Fake image from XP file system
                        img.src = 'Windows XP Icons/Picture.png';
                        img.style.width = '100px';
                        img.style.display = 'block';
                        img.style.margin = '4px 0';
                        img.alt = filepath.filename || 'Picture';
                        
                        let sel = window.getSelection();
                        if (sel.rangeCount > 0 && body.contains(sel.getRangeAt(0).commonAncestorContainer)) {
                            let range = sel.getRangeAt(0);
                            range.deleteContents();
                            range.insertNode(img);
                        } else {
                            body.appendChild(img);
                        }
                    }
                });
            } else {
                window.xpDialog('Error', 'XP File Picker is not available.', 'error');
            }
        }
    };
};

window.insertEmailHyperlink = function() {
    window.xpDialog('Insert Hyperlink', 'Enter the URL:', 'prompt', 'https://').then(url => {
        if(!url) return;
        let text = '';
        window.xpDialog('Insert Hyperlink', 'Enter the display text:', 'prompt', url).then(displayText => {
            let body = document.getElementById('email-compose-body');
            body.focus();
            let link = document.createElement('a');
            link.href = url;
            link.textContent = displayText || url;
            link.style.color = '#0000FF';
            let sel = window.getSelection();
            if (sel.rangeCount > 0 && body.contains(sel.getRangeAt(0).commonAncestorContainer)) {
                let range = sel.getRangeAt(0);
                range.deleteContents();
                range.insertNode(link);
            } else {
                body.appendChild(link);
            }
        });
    });
};

window.insertEmailHRule = function() {
    let body = document.getElementById('email-compose-body');
    body.focus();
    document.execCommand('insertHorizontalRule', false, null);
};

window.saveEmailDraft = function() {
    window._saveCurrentComposeState();
    if(window.composeQueue.length === 0) return;
    let current = window.composeQueue[window.composeActiveIndex];
    
    let newEmail = {
        id: Date.now(),
        from: 'Me (Draft)',
        subject: current.subject || '(No Subject)',
        received: new Date().toLocaleDateString(),
        body: current.body,
        to: current.to,
        cc: current.cc,
        attachments: [...(current.attachments || [])],
        read: true
    };
    if(!window.emailData.drafts) window.emailData.drafts = [];
    window.emailData.drafts.push(newEmail);
    if(window.currentEmailFolder === 'drafts') window.renderEmailList();
    
    window.xpDialog('Draft Saved', 'Message has been saved to the Drafts folder.', 'info');
};

window.formatEmailBody = function(command, value) {
    document.getElementById('email-compose-body').focus();
    document.execCommand(command, false, value || null);
};

window.emailBodyFontFamily = function(font) {
    document.getElementById('email-compose-body').focus();
    document.execCommand('fontName', false, font);
};

window.emailBodyFontSize = function(size) {
    document.getElementById('email-compose-body').focus();
    document.execCommand('fontSize', false, size);
};

window.emailBodyForeColor = function() {
    // Simple color picker inline
    let picker = document.createElement('input');
    picker.type = 'color';
    picker.value = '#000000';
    picker.style.cssText = 'position:fixed;opacity:0;width:0;height:0;';
    document.body.appendChild(picker);
    picker.onchange = function() {
        document.getElementById('email-compose-body').focus();
        document.execCommand('foreColor', false, this.value);
        picker.remove();
    };
    picker.click();
};

window.sendEmail = function() {
    window._saveCurrentComposeState();
    if(window.composeQueue.length === 0) return;
    let current = window.composeQueue[window.composeActiveIndex];
    
    let to = current.to.trim();
    if(!to) { window.xpDialog('Error', 'Please enter at least one recipient.', 'error'); return; }
    let subject = current.subject.trim() || '(No Subject)';
    let bodyHtml = current.body;

    let newEmail = {
        id: Date.now(),
        from: 'Me (To: ' + to + ')',
        subject: subject,
        received: new Date().toLocaleDateString(),
        body: bodyHtml,
        attachments: [...(current.attachments || [])],
        read: true
    };
    if(!window.emailData.outbox) window.emailData.outbox = [];
    window.emailData.outbox.push(newEmail);
    if(window.currentEmailFolder === 'outbox') window.renderEmailList();
    
    window.composeQueue.splice(window.composeActiveIndex, 1);
    if(window.composeActiveIndex >= window.composeQueue.length) window.composeActiveIndex = Math.max(0, window.composeQueue.length - 1);
    
    window._renderComposeWindow();
    window.xpDialog('Message Queued', 'Your message to ' + to + ' has been placed in your Outbox. Click Send/Recv to send it.', 'info');
};

window.emailReply = function() {
    let ids = window.selectedEmailIds && window.selectedEmailIds.length > 0 ? window.selectedEmailIds : (window.currentEmailId ? [window.currentEmailId] : []);
    if(ids.length === 0) { window.xpDialog('Reply', 'Please select a message first.', 'error'); return; }
    if(ids.length > 1) {
        window.xpDialog('Outlook Express', 'You cannot reply to multiple messages at once. Please use "Reply All" or select a single message.', 'error');
        return;
    }
    let emails = (window.emailData[window.currentEmailFolder] || []).filter(e => ids.includes(e.id));
    
    emails.forEach(email => {
        let bodyHtml = (window.emailOptions && window.emailOptions.includeMessageInReply) ? '<br><br>----- Original Message -----<br>' + email.body : '<br>';
        window.openEmailCompose({ to: email.from, subject: 'Re: ' + email.subject, body: bodyHtml });
    });
};

window.emailReplyAll = function() {
    let ids = window.selectedEmailIds && window.selectedEmailIds.length > 0 ? window.selectedEmailIds : (window.currentEmailId ? [window.currentEmailId] : []);
    if(ids.length === 0) { window.xpDialog('Reply All', 'Please select a message first.', 'error'); return; }
    
    let emails = (window.emailData[window.currentEmailFolder] || []).filter(e => ids.includes(e.id));
    
    emails.forEach(email => {
        let bodyHtml = (window.emailOptions && window.emailOptions.includeMessageInReply) ? '<br><br>----- Original Message -----<br>' + email.body : '<br>';
        window.openEmailCompose({ to: email.from, cc: email.from, subject: 'Re: ' + email.subject, body: bodyHtml });
    });
    // Explicitly open the program once after all queues are pushed, otherwise only the last one renders
    if (emails.length > 0) {
        window.openProgram('email-compose-window');
    }
};

window.emailForward = function() {
    let ids = window.selectedEmailIds && window.selectedEmailIds.length > 0 ? window.selectedEmailIds : (window.currentEmailId ? [window.currentEmailId] : []);
    if(ids.length === 0) { window.xpDialog('Forward', 'Please select a message first.', 'error'); return; }
    let emails = (window.emailData[window.currentEmailFolder] || []).filter(e => ids.includes(e.id));
    
    emails.forEach(email => {
        window.openEmailCompose({ subject: 'Fwd: ' + email.subject, body: '<br><br>----- Forwarded Message -----<br>From: ' + email.from + '<br>Subject: ' + email.subject + '<br><br>' + email.body });
    });
};

window.emailFind = function() {
    window.xpDialog('Find Message', 'Enter text to search in emails:', 'prompt').then(findVal => {
        if(!findVal) return;
        let q = findVal.toLowerCase();
        let emails = window.emailData[window.currentEmailFolder];
        let found = emails.find(e => (e.subject||'').toLowerCase().includes(q) || (e.body||'').toLowerCase().includes(q) || (e.from||'').toLowerCase().includes(q));
        if(found) { window.readEmail(found.id); }
        else window.xpDialog('Find Message', 'No matching messages found.', 'info');
    });
};

window.openOutlookAccounts = function() {
    window.xpDialog('Internet Accounts', 'No real SMTP accounts are configured.\n\nThis is a simulated email environment.\nMessages are stored locally in this session only.', 'info');
};

window.openOutlookOptions = function() {
    window.xpDialog('Outlook Express Options', 'Send messages: Immediately\nCheck for new messages: Every 30 minutes\nFont: Arial 12pt\nSignature: (none)\n\nThese settings are for display only in this simulation.', 'info');
};

window.emailSpellCheck = function() {
    let body = document.getElementById('email-compose-body');
    if(body) body.focus();
    window.xpDialog('Spelling', 'Spell check complete. No errors found.', 'info');
};

window.emailSelectAll = function() {
    let body = document.getElementById('email-compose-body');
    if(body) { body.focus(); document.execCommand('selectAll', false, null); }
};

window.emailMarkAsRead = function() {
    if(window.currentEmailId === null) { window.xpDialog('Mark as Read', 'Please select a message first.', 'error'); return; }
    let email = (window.emailData[window.currentEmailFolder]||[]).find(e => e.id === window.currentEmailId);
    if(email) { email.read = true; window.renderEmailList(); }
};

window.emailMarkAsUnread = function() {
    if(window.currentEmailId === null) { window.xpDialog('Mark as Unread', 'Please select a message first.', 'error'); return; }
    let email = (window.emailData[window.currentEmailFolder]||[]).find(e => e.id === window.currentEmailId);
    if(email) { email.read = false; window.renderEmailList(); }
};



window.emailComposePrint = function() {
    let subject = document.getElementById('email-compose-subject').value || 'Untitled Message';
    if (typeof window.fakePrint === 'function') {
        window.fakePrint('Message: ' + subject);
    } else {
        window.xpDialog('Print', 'Fake print not found.', 'error');
    }
};

// Initialize list on load
setTimeout(() => { if(document.getElementById('email-list-table')) window.renderEmailList(); }, 500);


window.showEmailProperties = function() {
    let to = document.getElementById('email-compose-to').value || 'None';
    let subject = document.getElementById('email-compose-subject').value || '(No subject)';
    let size = 'Unknown';
    if (window._composeAttachments && window._composeAttachments.length > 0) {
        size = window._composeAttachments.reduce((acc, curr) => acc + curr.size, 0);
        size = Math.max(1, Math.round(size / 1024)) + ' KB';
    } else {
        size = '1 KB';
    }
    
    let info = `Subject: ${subject}
To: ${to}
Size: ${size}
Priority: Normal
Format: HTML
Encoding: Western European (ISO)
Created: ${new Date().toLocaleString()}
`;
    
    if (typeof window.xpDialog === 'function') {
        window.xpDialog('Message Properties', info, 'info');
    }
};


window.selectedEmailIds = [];

window.emailPrint = function(isPreview = false) {
    let ids = window.selectedEmailIds && window.selectedEmailIds.length > 0 ? window.selectedEmailIds : (window.currentEmailId ? [window.currentEmailId] : []);
    if(ids.length === 0) { window.xpDialog('Print', 'Please select a message to print.', 'error'); return; }
    let emails = (window.emailData[window.currentEmailFolder]||[]).filter(e => ids.includes(e.id));
    
    emails.forEach(email => {
        let previewContent = '<div style="padding:20px; font-family: Arial, sans-serif;"><h3>' + email.subject + '</h3><p><b>From:</b> ' + email.from + '<br><b>Date:</b> ' + email.received + '</p><hr>' + email.body + '</div>';
        if (isPreview && typeof window.fakePrintPreview === 'function') {
            window.fakePrintPreview('Message: ' + email.subject, previewContent);
        } else if (typeof window.fakePrint === 'function') {
            window.fakePrint('Message: ' + email.subject, previewContent);
        } else {
            window.xpDialog('Print', 'Fake print not found.', 'error');
        }
    });
};



window.selectAllUnread = function() {
    let emails = window.emailData[window.currentEmailFolder] || [];
    window.selectedEmailIds = emails.filter(e => !e.read).map(e => e.id);
    if(window.selectedEmailIds.length > 0) window.currentEmailId = window.selectedEmailIds[0];
    window.renderEmailList();
};

window.selectAllRead = function() {
    let emails = window.emailData[window.currentEmailFolder] || [];
    window.selectedEmailIds = emails.filter(e => e.read).map(e => e.id);
    if(window.selectedEmailIds.length > 0) window.currentEmailId = window.selectedEmailIds[0];
    window.renderEmailList();
};

window.openEmailInNewWindow = function(id) {
    let folder = window.currentEmailFolder;
    let email = (window.emailData[folder]||[]).find(e => e.id === id);
    if(!email) return;
    
    email.read = true;
    window.renderEmailList();
    
    let win = document.getElementById('email-read-window');
    if (!win) {
        window.xpDialog('Error', 'Email Read Window template missing.', 'error');
        return;
    }
    
    document.getElementById('email-read-subject').innerText = email.subject;
    document.getElementById('email-read-from').innerText = email.from;
    document.getElementById('email-read-date').innerText = email.received;
    document.getElementById('email-read-body').innerHTML = email.body;
    
    win.style.display = 'flex';
    window.bringToFront(win);
};

document.addEventListener("click", function(e) { let cm = document.getElementById("context-menu-email"); if(cm) cm.style.display="none"; });

window.emailOptions = {
    checkNewMsg: true,
    playSound: true,
    emptyDeleted: false,
    includeMessageInReply: true
};

window.emailAccounts = [
    { name: 'Administrator (Default)', server: 'mail.localnet' }
];

window.hasReceivedSimulatedEmail = false;

window.openEmailOptionsDialog = function() {
    let win = document.getElementById('email-options-window');
    if(!win) return;
    document.getElementById('opt-general-check').checked = window.emailOptions.checkNewMsg;
    document.getElementById('opt-general-sound').checked = window.emailOptions.playSound;
    document.getElementById('opt-general-empty').checked = window.emailOptions.emptyDeleted;
    document.getElementById('opt-send-reply').checked = window.emailOptions.includeMessageInReply;
    
    window.switchEmailOptionsTab('general');
    win.style.display = 'block';
    if(typeof window.bringToFront === 'function') window.bringToFront(win);
};

window.saveEmailOptions = function() {
    window.emailOptions.checkNewMsg = document.getElementById('opt-general-check').checked;
    window.emailOptions.playSound = document.getElementById('opt-general-sound').checked;
    window.emailOptions.emptyDeleted = document.getElementById('opt-general-empty').checked;
    window.emailOptions.includeMessageInReply = document.getElementById('opt-send-reply').checked;
    document.getElementById('email-options-window').style.display = 'none';
};

window.switchEmailOptionsTab = function(tabName) {
    document.getElementById('opt-tab-general-content').style.display = tabName === 'general' ? 'block' : 'none';
    document.getElementById('opt-tab-read-content').style.display = tabName === 'read' ? 'block' : 'none';
    document.getElementById('opt-tab-send-content').style.display = tabName === 'send' ? 'block' : 'none';
    
    document.getElementById('opt-tab-general-btn').style.background = tabName === 'general' ? '#ECE9D8' : 'transparent';
    document.getElementById('opt-tab-general-btn').style.borderBottom = tabName === 'general' ? 'none' : '1px solid #ACA899';
    document.getElementById('opt-tab-read-btn').style.background = tabName === 'read' ? '#ECE9D8' : 'transparent';
    document.getElementById('opt-tab-read-btn').style.borderBottom = tabName === 'read' ? 'none' : '1px solid #ACA899';
    document.getElementById('opt-tab-send-btn').style.background = tabName === 'send' ? '#ECE9D8' : 'transparent';
    document.getElementById('opt-tab-send-btn').style.borderBottom = tabName === 'send' ? 'none' : '1px solid #ACA899';
};

window.renderEmailAccounts = function() {
    let list = document.getElementById('email-accounts-list');
    if(!list) return;
    list.innerHTML = '';
    window.emailAccounts.forEach((acc, i) => {
        let div = document.createElement('div');
        div.style.padding = '2px';
        div.style.cursor = 'pointer';
        if (i === 0) {
            div.style.background = '#0055E5';
            div.style.color = 'white';
        }
        div.innerText = acc.name;
        div.onclick = () => {
            Array.from(list.children).forEach(c => { c.style.background = ''; c.style.color = 'black'; });
            div.style.background = '#0055E5';
            div.style.color = 'white';
            window.selectedAccountId = i;
        };
        list.appendChild(div);
    });
    if(window.emailAccounts.length > 0) window.selectedAccountId = 0;
};

window.openEmailAccountsDialog = function() {
    let win = document.getElementById('email-accounts-window');
    if(!win) return;
    window.renderEmailAccounts();
    win.style.display = 'block';
    if(typeof window.bringToFront === 'function') window.bringToFront(win);
};


window.editingAccountId = -1;

window.switchAccTab = function(tabName) {
    document.getElementById('acc-tab-general-content').style.display = tabName === 'general' ? 'block' : 'none';
    document.getElementById('acc-tab-servers-content').style.display = tabName === 'servers' ? 'block' : 'none';
    
    document.getElementById('acc-tab-general-btn').style.background = tabName === 'general' ? '#ECE9D8' : 'transparent';
    document.getElementById('acc-tab-general-btn').style.borderBottom = tabName === 'general' ? 'none' : '1px solid #ACA899';
    document.getElementById('acc-tab-servers-btn').style.background = tabName === 'servers' ? '#ECE9D8' : 'transparent';
    document.getElementById('acc-tab-servers-btn').style.borderBottom = tabName === 'servers' ? 'none' : '1px solid #ACA899';
};

window.openEmailAccountProperties = function() {
    if(window.selectedAccountId == null || window.selectedAccountId < 0) return;
    let acc = window.emailAccounts[window.selectedAccountId];
    window.editingAccountId = window.selectedAccountId;
    
    document.getElementById('account-prop-title').innerText = acc.name + " Properties";
    document.getElementById('acc-prop-name').value = acc.name || "";
    document.getElementById('acc-prop-username').value = acc.username || "";
    document.getElementById('acc-prop-email').value = acc.email || "";
    document.getElementById('acc-prop-reply').value = acc.reply || "";
    document.getElementById('acc-prop-pop').value = acc.pop || "mail.localnet";
    document.getElementById('acc-prop-smtp').value = acc.smtp || "mail.localnet";
    document.getElementById('acc-prop-accname').value = acc.accname || "";
    document.getElementById('acc-prop-pass').value = acc.pass || "";
    
    window.switchAccTab('general');
    let win = document.getElementById('email-account-properties-window');
    if(win) {
        win.style.display = 'block';
        if(typeof window.bringToFront === 'function') window.bringToFront(win);
    }
};

window.addEmailAccount = function() {
    window.editingAccountId = -1;
    document.getElementById('account-prop-title').innerText = "New Account Properties";
    document.getElementById('acc-prop-name').value = "New Account";
    document.getElementById('acc-prop-username').value = "";
    document.getElementById('acc-prop-email').value = "";
    document.getElementById('acc-prop-reply').value = "";
    document.getElementById('acc-prop-pop').value = "mail.localnet";
    document.getElementById('acc-prop-smtp').value = "mail.localnet";
    document.getElementById('acc-prop-accname').value = "";
    document.getElementById('acc-prop-pass').value = "";
    
    window.switchAccTab('general');
    let win = document.getElementById('email-account-properties-window');
    if(win) {
        win.style.display = 'block';
        if(typeof window.bringToFront === 'function') window.bringToFront(win);
    }
};

window.saveEmailAccount = function(keepOpen) {
    let acc = {
        name: document.getElementById('acc-prop-name').value || "Unnamed Account",
        username: document.getElementById('acc-prop-username').value,
        email: document.getElementById('acc-prop-email').value,
        reply: document.getElementById('acc-prop-reply').value,
        pop: document.getElementById('acc-prop-pop').value,
        smtp: document.getElementById('acc-prop-smtp').value,
        accname: document.getElementById('acc-prop-accname').value,
        pass: document.getElementById('acc-prop-pass').value
    };
    
    if(window.editingAccountId === -1) {
        window.emailAccounts.push(acc);
        window.selectedAccountId = window.emailAccounts.length - 1;
        window.editingAccountId = window.selectedAccountId;
    } else {
        window.emailAccounts[window.editingAccountId] = acc;
    }
    
    window.renderEmailAccounts();
    if(!keepOpen) {
        document.getElementById('email-account-properties-window').style.display = 'none';
    } else {
        document.getElementById('account-prop-title').innerText = acc.name + " Properties";
    }
};

window.removeEmailAccount = function() {
    if(window.selectedAccountId === 0) {
        window.xpDialog('Accounts', 'You cannot remove the default account.', 'error');
    } else if (window.selectedAccountId > 0) {
        window.emailAccounts.splice(window.selectedAccountId, 1);
        window.renderEmailAccounts();
    }
};


window.emailSyncInterval = setInterval(() => {
    if (window.emailOptions && window.emailOptions.checkNewMsg) {
        // Do not interrupt if there are no accounts or if compose is open to avoid annoyances
        if (window.emailAccounts && window.emailAccounts.length > 0) {
            if(document.getElementById('email-window') && document.getElementById('email-window').style.display !== 'none') {
                if(typeof window.refreshEmails === 'function') window.refreshEmails(true);
            }
        }
    }
}, 60000); // Check every 60 seconds

window.selectAllEmails = function() {
        let emails = window.emailData[window.currentEmailFolder] || [];
        window.selectedEmailIds = emails.map(e => e.id);
        window.renderEmailList();
    };

window.markSelectedAsRead = function() {
        let emails = window.emailData[window.currentEmailFolder] || [];
        let ids = window.selectedEmailIds && window.selectedEmailIds.length > 0 ? window.selectedEmailIds : (window.contextEmailId ? [window.contextEmailId] : (window.currentEmailId ? [window.currentEmailId] : []));
        emails.forEach(e => {
            if (ids.includes(e.id)) e.read = true;
        });
        window.renderEmailList();
    };

    window.markSelectedAsUnread = function() {
        let emails = window.emailData[window.currentEmailFolder] || [];
        let ids = window.selectedEmailIds && window.selectedEmailIds.length > 0 ? window.selectedEmailIds : (window.contextEmailId ? [window.contextEmailId] : (window.currentEmailId ? [window.currentEmailId] : []));
        emails.forEach(e => {
            if (ids.includes(e.id)) e.read = false;
        });
        window.renderEmailList();
    };
