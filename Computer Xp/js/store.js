/* WINDOWS CATALOG / ADD OR REMOVE PROGRAMS (store.js) */

const STORE_APPS = window.STORE_APPS = [
    // Core system apps
    { 
        id: 'ie', 
        name: 'Internet Explorer', 
        desc: 'Browse the World Wide Web with security and privacy tools.', 
        icon: 'ie', 
        size: '20 MB', 
        exe: 'iexplore.exe', 
        appId: 'ie-window', 
        shortcut: 'Internet Explorer.lnk', 
        cost: 0, 
        systemApp: true, 
        category: 'Internet & Networking', 
        publisher: 'Microsoft Corporation', 
        version: '6.0 SP1',
        fullDesc: 'Microsoft Internet Explorer 6 delivers a flexible, reliable browsing experience with enhanced privacy settings, cookie filtering, and integrated multimedia support.',
        features: [
            'Full support for HTML 4.01, CSS level 1, and JavaScript',
            'P3P privacy protection and cookie management controls',
            'Integrated Media bar for streaming audio and video content',
            'Fault collection and automated error reporting'
        ],
        rating: 4.5,
        ratingCount: 3820,
        reviews: [
            { author: "WebSurfer2001", stars: 5, date: "Aug 26, 2001", text: "Standard browser for Windows XP. Very fast loading on DSL!" },
            { author: "TechGuy_PA", stars: 4, date: "May 14, 2002", text: "Great compatibility with all corporate intranets." }
        ]
    },
    { 
        id: 'outlook', 
        name: 'Outlook Express', 
        desc: 'Send and receive email messages and internet newsgroup discussions.', 
        icon: 'outlook', 
        size: '3.1 MB', 
        exe: 'msimn.exe', 
        appId: 'email-window', 
        shortcut: 'Outlook Express.lnk', 
        cost: 0, 
        category: 'Internet & Networking', 
        publisher: 'Microsoft Corporation', 
        version: '6.0',
        fullDesc: 'Outlook Express 6 is the premier personal messaging client included with Windows XP. Compose rich HTML emails, organize contacts with the Windows Address Book, and subscribe to internet newsgroups.',
        features: [
            'POP3 and IMAP4 email account synchronization',
            'Integrated Windows Address Book and contact management',
            'Stationery templates and HTML formatted messages',
            'Spam and virus attachment safety warnings'
        ],
        rating: 4.4,
        ratingCount: 1290,
        reviews: [
            { author: "OfficeAdmin", stars: 5, date: "Oct 19, 2002", text: "Simple to configure with my POP3 email provider. Works every time." }
        ]
    },
    { 
        id: 'explorer', 
        name: 'Windows Explorer', 
        desc: 'Explore, manage, and organize files, folders, and storage devices.', 
        icon: 'folder', 
        size: '1.2 MB', 
        exe: 'explorer.exe', 
        appId: 'folder-window', 
        shortcut: 'Windows Explorer.lnk', 
        cost: 0, 
        systemApp: true, 
        category: 'System Utilities', 
        publisher: 'Microsoft Corporation', 
        version: '5.1',
        fullDesc: 'The foundation of the Windows graphical user interface. Organizes your drives, Documents and Settings, and network shares in classic XP style.',
        features: ['Task pane shortcuts', 'Thumbnail and tile icon views', 'ZIP folder compression support'],
        rating: 4.9,
        ratingCount: 9540,
        reviews: [{ author: "PowerUser_XP", stars: 5, date: "Jan 10, 2002", text: "The task-based navigation pane on the left is a huge upgrade over Windows 98." }]
    },
    { 
        id: 'controlpanel', 
        name: 'Control Panel', 
        desc: 'Change computer appearance, hardware settings, and system configuration.', 
        icon: 'settings', 
        size: '1.5 MB', 
        exe: 'control.exe', 
        appId: 'settings-window', 
        shortcut: 'Control Panel.lnk', 
        cost: 0, 
        systemApp: true, 
        category: 'System Utilities', 
        publisher: 'Microsoft Corporation', 
        version: '5.1',
        fullDesc: 'Central hub for customizing your desktop display, sound themes, user accounts, and peripheral hardware.',
        features: ['Category view navigation', 'Display and Theme adjustments', 'User Account management'],
        rating: 4.8,
        ratingCount: 4210,
        reviews: [{ author: "IT_Specialist", stars: 5, date: "Apr 04, 2003", text: "Everything is neatly categorized." }]
    },
    { 
        id: 'cmd', 
        name: 'Command Prompt', 
        desc: 'Execute text-based commands, batch files, and diagnostic scripts.', 
        icon: 'cmd', 
        size: '50 KB', 
        exe: 'cmd.exe', 
        appId: 'cmd-window', 
        shortcut: 'Command Prompt.lnk', 
        cost: 0, 
        systemApp: true, 
        category: 'System Utilities', 
        publisher: 'Microsoft Corporation', 
        version: '5.1',
        fullDesc: 'Powerful 32-bit command line interpreter for executing console utilities, scripts, and administrative actions.',
        features: ['Full command line history', 'Networking diagnostics (ping, ipconfig, tracert)', 'File management commands'],
        rating: 4.9,
        ratingCount: 8120,
        reviews: [{ author: "SysAdminDave", stars: 5, date: "Jun 11, 2002", text: "Fast, reliable, and essential." }]
    },
    { 
        id: 'taskmgr', 
        name: 'Task Manager', 
        desc: 'Monitor computer performance, memory usage, and running processes.', 
        icon: 'taskmgr', 
        size: '150 KB', 
        exe: 'taskmgr.exe', 
        appId: 'taskmgr-window', 
        shortcut: 'Task Manager.lnk', 
        cost: 0, 
        systemApp: true, 
        category: 'System Utilities', 
        publisher: 'Microsoft Corporation', 
        version: '5.1',
        fullDesc: 'Real-time performance graphs and process manager to inspect system resource utilization.',
        features: ['Real-time CPU and Memory usage graphs', 'Process list with End Task capability', 'Application status monitoring'],
        rating: 4.9,
        ratingCount: 6510,
        reviews: [{ author: "GeekGuy", stars: 5, date: "Aug 20, 2002", text: "Saved my computer many times when an app hung." }]
    },
    { 
        id: 'sysinfo', 
        name: 'System Information', 
        desc: 'View comprehensive details about computer hardware and operating system.', 
        icon: 'sysinfo', 
        size: '250 KB', 
        exe: 'msinfo32.exe', 
        appId: 'sysinfo-window', 
        shortcut: 'System Information.lnk', 
        cost: 0, 
        systemApp: true, 
        category: 'System Utilities', 
        publisher: 'Microsoft Corporation', 
        version: '5.1',
        fullDesc: 'Displays detailed summary of BIOS, processor, RAM, and storage device metrics.',
        features: ['Hardware resource tree', 'OS build and service pack verification', 'Driver listing'],
        rating: 4.6,
        ratingCount: 1420,
        reviews: [{ author: "PCBuilder", stars: 5, date: "Sep 05, 2003", text: "Great tool to check RAM and processor speed." }]
    },
    { 
        id: 'regedit', 
        name: 'Registry Editor', 
        desc: 'Inspect and configure hierarchical system registry entries.', 
        icon: 'regedit', 
        size: '210 KB', 
        exe: 'regedit.exe', 
        appId: 'regedit-window', 
        shortcut: 'Registry Editor.lnk', 
        cost: 0, 
        category: 'System Utilities', 
        publisher: 'Microsoft Corporation', 
        version: '5.1',
        fullDesc: 'Advanced tool for viewing and tweaking configuration settings in the Windows registry hive.',
        features: ['Tree hierarchy of keys and values', 'String, DWORD, and Binary data editing', 'Fast key search'],
        rating: 4.7,
        ratingCount: 1840,
        reviews: [{ author: "TweakMaster", stars: 5, date: "Nov 30, 2002", text: "Use with caution, but extremely powerful!" }]
    },
    { 
        id: 'defrag', 
        name: 'Disk Defragmenter', 
        desc: 'Analyze and consolidate fragmented clusters on local hard disk drives.', 
        icon: 'defrag', 
        size: '320 KB', 
        exe: 'dfrg.msc', 
        appId: 'defrag-window', 
        shortcut: 'Disk Defragmenter.lnk', 
        cost: 0, 
        category: 'System Utilities', 
        publisher: 'Microsoft Corporation', 
        version: '5.1',
        fullDesc: 'Visual drive defragmentation utility showing cluster maps in red, blue, and green for optimal drive speed.',
        features: ['Drive analysis report', 'Visual cluster block display', 'Background consolidation'],
        rating: 4.8,
        ratingCount: 3100,
        reviews: [{ author: "SpeedFreak", stars: 5, date: "Feb 14, 2003", text: "Watching the blocks turn blue is oddly satisfying." }]
    },

    // Office & Productivity
    { 
        id: 'excel', 
        name: 'Microsoft Excel', 
        desc: 'Create powerful spreadsheets, formulas, financial budgets, and data tables.', 
        icon: 'Windows XP Icons/Graph View.png', 
        size: '12.4 MB', 
        exe: 'excel.exe', 
        appId: 'excel-window', 
        shortcut: 'Microsoft Excel.lnk', 
        cost: 0, 
        category: 'Productivity & Office', 
        publisher: 'Microsoft Corporation', 
        version: '2002 (XP Edition)',
        fullDesc: 'Microsoft Excel is the premier spreadsheet application designed for Windows XP. Whether creating personal budgets, financial models, or scientific data tables, Excel delivers fast calculations, dynamic formulas, cell styling, and comprehensive .xls workbook storage.',
        features: [
            'Intuitive grid layout with full alphanumeric column & row coordinate navigation',
            'Real-time formula calculation bar supporting standard arithmetic operations',
            'Rich text cell formatting: Bold, Italic, Underline, and Custom Font Colors',
            'Full workbook file operations: Open, Save, and New Sheet creation',
            'Designed for the Microsoft Windows XP Luna desktop interface'
        ],
        rating: 4.9,
        ratingCount: 4210,
        reviews: [
            { author: "AccountantDan", stars: 5, date: "Nov 12, 2002", text: "Excel on Windows XP is the best spreadsheet software I have ever used. Fast calculations and great grid display!" },
            { author: "Sarah_B", stars: 5, date: "Mar 3, 2003", text: "Crucial for my home budget. The Luna blue interface looks so clean on my CRT monitor." },
            { author: "OfficeAdmin03", stars: 4, date: "Jul 19, 2003", text: "Reliable formulas and easy cell formatting. Everything you need for daily work." }
        ]
    },
    { 
        id: 'frontpage', 
        name: 'Microsoft FrontPage', 
        desc: 'Author, edit, and publish HTML web pages and complete websites.', 
        icon: 'frontpage', 
        size: '8.4 MB', 
        exe: 'frontpage.exe', 
        appId: 'frontpage-window', 
        shortcut: 'Microsoft FrontPage.lnk', 
        cost: 0, 
        category: 'Productivity & Office', 
        publisher: 'Microsoft Corporation', 
        version: '2002 (XP Edition)',
        fullDesc: 'Microsoft FrontPage provides an authoring environment for web design and HTML editing. Features dual-pane visual layout, instant previewing, and direct code editing.',
        features: ['WYSIWYG visual web design', 'Split code and preview windows', 'Built-in HTML validation and table wizard'],
        rating: 4.7,
        ratingCount: 1980,
        reviews: [
            { author: "WebMasterXP", stars: 5, date: "Oct 15, 2002", text: "Made building my personal website super simple. Love the preview tab!" }
        ]
    },
    { 
        id: 'wordpad', 
        name: 'WordPad', 
        desc: 'Rich text word processor with advanced font formatting and paragraph tools.', 
        icon: 'wordpad', 
        size: '1.5 MB', 
        exe: 'wordpad.exe', 
        appId: 'wordpad-window', 
        shortcut: 'WordPad.lnk', 
        cost: 0, 
        category: 'Productivity & Office', 
        publisher: 'Microsoft Corporation', 
        version: '5.1',
        fullDesc: 'WordPad provides formatted text editing capabilities bridging the gap between simple Notepad and heavy office suites.',
        features: ['Rich Text Format (RTF) support', 'Font family and size selectors', 'Alignment and bulleted list tools'],
        rating: 4.6,
        ratingCount: 2450,
        reviews: [{ author: "Student2003", stars: 5, date: "Sep 22, 2002", text: "Great for writing term papers without needing Microsoft Word." }]
    },
    { 
        id: 'notepad', 
        name: 'Notepad', 
        desc: 'Fast, lightweight plain text editor for notes, logs, and coding.', 
        icon: 'notepad', 
        size: '64 KB', 
        exe: 'notepad.exe', 
        appId: 'notepad-window', 
        shortcut: 'Notepad.lnk', 
        cost: 0, 
        category: 'Accessories & Tools', 
        publisher: 'Microsoft Corporation', 
        version: '5.1',
        fullDesc: 'The quintessential text editor for Windows. Instant startup time, no formatting bloat, and pure ANSI/Unicode text handling.',
        features: ['Instant opening with zero memory overhead', 'Word Wrap toggle', 'Unsaved changes protection'],
        rating: 4.9,
        ratingCount: 8900,
        reviews: [{ author: "Coder101", stars: 5, date: "Jan 18, 2002", text: "Can't live without Notepad. The absolute classic." }]
    },
    { 
        id: 'calc', 
        name: 'Calculator', 
        desc: 'Perform standard arithmetic and scientific calculations with memory.', 
        icon: 'calc', 
        size: '120 KB', 
        exe: 'calc.exe', 
        appId: 'calc-window', 
        shortcut: 'Calculator.lnk', 
        cost: 0, 
        category: 'Accessories & Tools', 
        publisher: 'Microsoft Corporation', 
        version: '5.1',
        fullDesc: 'Quick mathematical calculations at your fingertips. Features standard number keypad and keyboard shortcut support.',
        features: ['Add, subtract, multiply, and divide', 'Square root, percentage, and reciprocal', 'Memory recall and storage functions'],
        rating: 4.8,
        ratingCount: 5120,
        reviews: [{ author: "MathEnthusiast", stars: 5, date: "May 09, 2002", text: "Clean, responsive, and always gets the math right." }]
    },
    { 
        id: 'charmap', 
        name: 'Character Map', 
        desc: 'Inspect and copy special symbols, accents, and Unicode glyphs.', 
        icon: 'charmap', 
        size: '150 KB', 
        exe: 'charmap.exe', 
        appId: 'charmap-window', 
        shortcut: 'Character Map.lnk', 
        cost: 0, 
        category: 'Accessories & Tools', 
        publisher: 'Microsoft Corporation', 
        version: '5.1',
        fullDesc: 'Browse every glyph in your installed TrueType fonts. Copy symbols directly into your documents.',
        features: ['Font family switching', 'Zoom preview box', 'Keystroke shortcuts for Alt codes'],
        rating: 4.6,
        ratingCount: 940,
        reviews: [{ author: "FontFan", stars: 5, date: "Aug 12, 2003", text: "Handy when looking for foreign accent marks and copyright signs." }]
    },
    { 
        id: 'clipbook', 
        name: 'Clipboard Viewer', 
        desc: 'Inspect clipboard buffer contents and currently copied text.', 
        icon: 'clipbook', 
        size: '110 KB', 
        exe: 'clipbrd.exe', 
        appId: 'clipbook-window', 
        shortcut: 'Clipboard Viewer.lnk', 
        cost: 0, 
        category: 'Accessories & Tools', 
        publisher: 'Microsoft Corporation', 
        version: '5.1',
        fullDesc: 'View live clipboard contents and verify what text or graphics are stored in system memory.',
        features: ['Live clipboard monitoring', 'Clear clipboard buffer', 'Text export'],
        rating: 4.5,
        ratingCount: 680,
        reviews: [{ author: "ClipboardInspector", stars: 4, date: "Dec 01, 2002", text: "Very helpful for troubleshooting copy-paste issues." }]
    },

    // Multimedia & Graphics
    { 
        id: 'paint', 
        name: 'Paint', 
        desc: 'Create drawings, sketch diagrams, and edit pictures with color palettes.', 
        icon: 'paint', 
        size: '340 KB', 
        exe: 'mspaint.exe', 
        appId: 'paint-window', 
        shortcut: 'Paint.lnk', 
        cost: 0, 
        category: 'Graphics & Multimedia', 
        publisher: 'Microsoft Corporation', 
        version: '5.1',
        fullDesc: 'Classic pixel painting and drawing tool. Features pencil, brush, airbrush, paint bucket fill, text tool, and shape tools.',
        features: ['Custom 28-color palette selector', 'Pencil, brush, eraser, and spray paint tools', 'Save to BMP and PNG formats'],
        rating: 4.9,
        ratingCount: 7890,
        reviews: [{ author: "PixelArtist", stars: 5, date: "Jul 24, 2002", text: "The foundation of digital art for millions of people!" }]
    },
    { 
        id: 'photon', 
        name: 'Photon Picture Viewer', 
        desc: 'Fast digital photo previewer, slideshow, and image viewer.', 
        icon: 'image', 
        size: '2.5 MB', 
        exe: 'photon.exe', 
        appId: 'photon-window', 
        shortcut: 'Photon Picture Viewer.lnk', 
        cost: 0, 
        category: 'Graphics & Multimedia', 
        publisher: 'Hyper Labs', 
        version: '2.1',
        fullDesc: 'High-speed image viewer for viewing JPEG, PNG, GIF, and BMP graphics with rotation and slideshow features.',
        features: ['Instant fullscreen slideshow mode', 'Lossless 90-degree image rotation', 'Zoom and pan controls'],
        rating: 4.7,
        ratingCount: 1540,
        reviews: [{ author: "PhotoBuff", stars: 5, date: "Mar 17, 2003", text: "Super lightweight picture viewer. Opens photos in a blink." }]
    },
    { 
        id: 'mediaplayer', 
        name: 'Windows Media Player', 
        desc: 'Play digital music tracks, CD-Audio, and video streams.', 
        icon: 'media', 
        size: '4.5 MB', 
        exe: 'wmplayer.exe', 
        appId: 'mediaplayer-window', 
        shortcut: 'Windows Media Player.lnk', 
        cost: 0, 
        category: 'Graphics & Multimedia', 
        publisher: 'Microsoft Corporation', 
        version: '9.0 Series',
        fullDesc: 'The definitive media hub for Windows XP. Enjoy crisp audio playback, custom visualizations, and playlist management.',
        features: ['Digital audio CD and WAV playback', 'Full visualizer animations', 'Integrated volume and seek bar'],
        rating: 4.8,
        ratingCount: 6300,
        reviews: [{ author: "MusicLover", stars: 5, date: "Nov 03, 2002", text: "The Luna visual styling on Media Player 9 is iconic." }]
    },
    { 
        id: 'soundrecorder', 
        name: 'Sound Recorder', 
        desc: 'Capture microphone audio, apply audio effects, and trim WAV clips.', 
        icon: 'soundrecorder', 
        size: '450 KB', 
        exe: 'sndrec32.exe', 
        appId: 'soundrecorder-window', 
        shortcut: 'Sound Recorder.lnk', 
        cost: 0, 
        category: 'Graphics & Multimedia', 
        publisher: 'Microsoft Corporation', 
        version: '5.1',
        fullDesc: 'Record sound clips directly from your computer microphone or line-in jack. Add echo, reverse audio, or adjust speed.',
        features: ['Green waveform oscilloscope display', 'Echo effect and reverse playback', 'WAV audio export'],
        rating: 4.6,
        ratingCount: 2190,
        reviews: [{ author: "Vocalist", stars: 5, date: "Jan 29, 2003", text: "Fun to record voices and play them backward!" }]
    },

    // Communications
    { 
        id: 'messenger', 
        name: 'Windows Messenger', 
        desc: 'Instant messaging, contact presence, and real-time chat.', 
        icon: 'messenger', 
        size: '2.2 MB', 
        exe: 'msmsgs.exe', 
        appId: 'messenger-window', 
        shortcut: 'Windows Messenger.lnk', 
        cost: 0, 
        category: 'Internet & Communications', 
        publisher: 'Microsoft Corporation', 
        version: '4.7',
        fullDesc: 'Connect with friends and colleagues online. See when contacts are available, send instant text messages, and chat in real-time.',
        features: ['Online presence status indicators', 'Direct messaging windows', 'Nudge and custom status messages'],
        rating: 4.8,
        ratingCount: 5410,
        reviews: [{ author: "ChatterBox", stars: 5, date: "May 22, 2003", text: "The notification chime is etched into my brain. Love it." }]
    },
    { 
        id: 'remotedesktop', 
        name: 'Remote Desktop', 
        desc: 'Connect to remote computers across local network or dial-up.', 
        icon: 'remotedesktop', 
        size: '680 KB', 
        exe: 'mstsc.exe', 
        appId: 'remotedesktop-window', 
        shortcut: 'Remote Desktop.lnk', 
        cost: 0, 
        category: 'Internet & Communications', 
        publisher: 'Microsoft Corporation', 
        version: '5.1',
        fullDesc: 'Access your office or home PC desktop remotely using Remote Desktop Protocol (RDP).',
        features: ['16-bit color remote display', 'Sound and clipboard redirection', 'Full keyboard shortcut support'],
        rating: 4.7,
        ratingCount: 1620,
        reviews: [{ author: "Telecommuter", stars: 5, date: "Feb 19, 2003", text: "Allowed me to work from home seamlessly." }]
    },
    { 
        id: 'xptour', 
        name: 'Tour Windows XP', 
        desc: 'Interactive guided tour of Windows XP operating system features.', 
        icon: 'tourxp', 
        size: '3.4 MB', 
        exe: 'tour.exe', 
        appId: 'xptour-window', 
        shortcut: 'Tour Windows XP.lnk', 
        cost: 0, 
        category: 'Help & Information', 
        publisher: 'Microsoft Corporation', 
        version: '5.1',
        fullDesc: 'Take a multimedia tour discovering the new capabilities of Windows XP, including digital media, connectivity, and performance.',
        features: ['Animated overview slides', 'Interactive category walkthroughs', 'Classic XP presentation'],
        rating: 4.9,
        ratingCount: 3200,
        reviews: [{ author: "NostalgiaKing", stars: 5, date: "Oct 25, 2001", text: "The background music is legendary." }]
    },

    // Entertainment & Games
    { 
        id: 'pinball', 
        name: '3D Pinball', 
        desc: 'Space Cadet 3D Pinball arcade game with multiball, ramps, and missions.', 
        icon: 'pinball', 
        size: '1.2 MB', 
        exe: 'pinball.exe', 
        appId: 'pinball-window', 
        shortcut: '3D Pinball.lnk', 
        cost: 0, 
        category: 'Games & Entertainment', 
        publisher: 'Maxis / Microsoft Corporation', 
        version: '1.0',
        fullDesc: 'Experience the arcade thrill of Space Cadet 3D Pinball. Complete Cadet to Fleet Admiral promotions, light up outer space hazard targets, deploy field shields, and trigger 3-ball multiball madness.',
        features: [
            'Authentic retro physics and high-definition table artwork',
            'Full sound effects with bumpers, flippers, and launch chutes',
            'Interactive Cadet ranking advancement and mission system',
            'High Score leaderboard tracking'
        ],
        rating: 5.0,
        ratingCount: 9820,
        reviews: [
            { author: "PinballWizardXP", stars: 5, date: "Aug 14, 2002", text: "The Space Cadet table is an absolute masterpiece. Sound effects bring back so many memories!" },
            { author: "GamerKid2000", stars: 5, date: "Dec 25, 2002", text: "Got the multiball and Cadet to Commander promotion! Can't stop playing this." },
            { author: "RetroLover", stars: 5, date: "Feb 10, 2003", text: "Best built-in Windows game of all time hands down." }
        ]
    },
    { 
        id: 'solitaire', 
        name: 'Solitaire', 
        desc: 'Classic Klondike card game with timed scoring and customizable deck backs.', 
        icon: 'solitaire', 
        size: '180 KB', 
        exe: 'sol.exe', 
        appId: 'solitaire-window', 
        shortcut: 'Solitaire.lnk', 
        cost: 0, 
        category: 'Games & Entertainment', 
        publisher: 'Microsoft Corporation', 
        version: '5.1',
        fullDesc: 'The world-famous Klondike Solitaire card game. Stack alternating color cards in descending order to move four suits to the top foundation piles.',
        features: ['Draw 1 or Draw 3 card deal options', 'Standard and Vegas scoring rules', 'Winning card bounce victory animation'],
        rating: 4.9,
        ratingCount: 8400,
        reviews: [{ author: "CardShark", stars: 5, date: "Mar 11, 2002", text: "The winning card bounce never gets old!" }]
    },
    { 
        id: 'mine', 
        name: 'Minesweeper', 
        desc: 'Classic strategic puzzle game of locating and clearing hidden minefields.', 
        icon: 'mine', 
        size: '120 KB', 
        exe: 'winmine.exe', 
        appId: 'minesweeper-window', 
        shortcut: 'Minesweeper.lnk', 
        cost: 0, 
        category: 'Games & Entertainment', 
        publisher: 'Microsoft Corporation', 
        version: '5.1',
        fullDesc: 'Test your tactical deduction skills. Reveal safe ground tiles, analyze surrounding proximity numbers, and place red flags on dangerous mines.',
        features: ['Beginner (9x9), Intermediate (16x16), and Expert (30x16) grids', 'Digital timer and mine counter display', 'High score leaderboards with custom names'],
        rating: 4.8,
        ratingCount: 7120,
        reviews: [{ author: "MineSwept", stars: 5, date: "Sep 2, 2002", text: "Pure strategy and quick reflexes. Beat Expert mode in under 100 seconds!" }]
    },
    { 
        id: 'freecell', 
        name: 'FreeCell', 
        desc: 'Strategic card puzzle utilizing four open storage cells.', 
        icon: 'freecell', 
        size: '160 KB', 
        exe: 'freecell.exe', 
        appId: 'freecell-window', 
        shortcut: 'FreeCell.lnk', 
        cost: 0, 
        category: 'Games & Entertainment', 
        publisher: 'Microsoft Corporation', 
        version: '5.1',
        fullDesc: 'Unlike standard Solitaire, almost every single deal in FreeCell can be solved with careful strategy and thoughtful use of four free cells.',
        features: ['32,000 numbered game deals', 'Streak counter and win-loss statistics', 'Undo move capability'],
        rating: 4.8,
        ratingCount: 4500,
        reviews: [{ author: "LogicMaster", stars: 5, date: "Oct 08, 2002", text: "Much deeper strategy than normal solitaire." }]
    },
    { 
        id: 'hearts', 
        name: 'Internet Hearts', 
        desc: 'Card trick-taking game avoiding penalty hearts and the Queen of Spades.', 
        icon: 'hearts', 
        size: '490 KB', 
        exe: 'mshearts.exe', 
        appId: 'hearts-window', 
        shortcut: 'Internet Hearts.lnk', 
        cost: 0, 
        category: 'Games & Entertainment', 
        publisher: 'Microsoft Corporation', 
        version: '5.1',
        fullDesc: 'Compete in 4-player trick-taking card play. Avoid capturing heart cards, steer clear of the 13-point Queen of Spades, or Shoot the Moon for 0 points!',
        features: ['Smart computer AI opponents', 'Point scoring table', 'Shoot the Moon victory bonus'],
        rating: 4.7,
        ratingCount: 3100,
        reviews: [{ author: "HeartsPlayer", stars: 5, date: "Jun 14, 2003", text: "Shooting the moon is the best feeling ever." }]
    },
    { 
        id: 'spades', 
        name: 'Internet Spades', 
        desc: 'Partnership trick-taking card game with bids and trump suits.', 
        icon: 'spades', 
        size: '480 KB', 
        exe: 'spades.exe', 
        appId: 'spades-window', 
        shortcut: 'Internet Spades.lnk', 
        cost: 0, 
        category: 'Games & Entertainment', 
        publisher: 'Microsoft Corporation', 
        version: '5.1',
        fullDesc: 'Join forces with your virtual partner. Bid your contract tricks accurately and play your Spades at the perfect moment to take the match.',
        features: ['Standard bidding and blind nil options', 'Sandbag penalty tracking', 'Match point scoring'],
        rating: 4.7,
        ratingCount: 2950,
        reviews: [{ author: "SpadesAce", stars: 5, date: "Apr 18, 2003", text: "Great multiplayer card game logic." }]
    },
    { 
        id: 'checkers', 
        name: 'Internet Checkers', 
        desc: 'Classic 8x8 checkerboard action against computer or online opponents.', 
        icon: 'Windows XP Icons/Internet Checkers.png', 
        size: '500 KB', 
        exe: 'chkrs.exe', 
        appId: 'checkers-window', 
        shortcut: 'Internet Checkers.lnk', 
        cost: 0, 
        category: 'Games & Entertainment', 
        publisher: 'Microsoft Corporation', 
        version: '5.1',
        fullDesc: 'Jump your pieces, capture enemy checkers, and get crowned on the opponent back row in classic English draughts.',
        features: ['Visual wood board presentation', 'Easy, Medium, and Hard AI levels', 'Move suggestion guide'],
        rating: 4.6,
        ratingCount: 2100,
        reviews: [{ author: "BoardGamer", stars: 5, date: "Nov 02, 2002", text: "Simple and fun game for all ages." }]
    },
    { 
        id: 'reversi', 
        name: 'Internet Reversi', 
        desc: 'Strategic Othello-style disk-flipping board game.', 
        icon: 'Windows XP Icons/Internet Reversi.png', 
        size: '550 KB', 
        exe: 'reversi.exe', 
        appId: 'reversi-window', 
        shortcut: 'Internet Reversi.lnk', 
        cost: 0, 
        category: 'Games & Entertainment', 
        publisher: 'Microsoft Corporation', 
        version: '5.1',
        fullDesc: 'A minute to learn, a lifetime to master! Flank your opponent discs to flip them to your color and dominate the grid.',
        features: ['Green felt board aesthetic', 'Legal move indicator highlights', 'Dynamic piece counter'],
        rating: 4.7,
        ratingCount: 1890,
        reviews: [{ author: "ReversiFan", stars: 5, date: "Jan 07, 2003", text: "Fantastic strategy game." }]
    },
    { 
        id: 'tetris', 
        name: 'Tetris XP', 
        desc: 'Classic falling tetrominoes puzzle game in retro XP theme.', 
        icon: 'tetris', 
        size: '300 KB', 
        exe: 'tetris.exe', 
        appId: 'tetris-window', 
        shortcut: 'Tetris XP.lnk', 
        cost: 0, 
        category: 'Games & Entertainment', 
        publisher: 'Hyper Studios', 
        version: '1.2',
        fullDesc: 'Rotate and drop falling geometric blocks into complete horizontal lines to score points and level up.',
        features: ['Full keyboard controls', 'Level and score progression', 'Classic block colors'],
        rating: 4.8,
        ratingCount: 3600,
        reviews: [{ author: "BlockDropper", stars: 5, date: "Jul 19, 2003", text: "Addictive and nostalgic!" }]
    },
    { 
        id: 'dataminer', 
        name: 'Data Miner', 
        desc: 'Incremental idle clicker game mining virtual data coins.', 
        icon: 'mouse', 
        size: '200 KB', 
        exe: 'dataminer.exe', 
        appId: 'main-window', 
        shortcut: 'Data Miner.lnk', 
        cost: 0, 
        category: 'Games & Entertainment', 
        publisher: 'Hyper Studios', 
        version: '1.0',
        fullDesc: 'Click the central processor unit to extract raw data bytes and purchase automated upgrades.',
        features: ['Byte mining click mechanics', 'Automated server upgrades', 'Persistent local saving'],
        rating: 4.7,
        ratingCount: 2240,
        reviews: [{ author: "ClickerAddict", stars: 5, date: "Aug 15, 2003", text: "Number goes up! Super fun." }]
    }
];

let storeCurrentTab = 'all';
let storeViewMode = 'list'; // 'list' or 'detail'
let currentStoreAppId = null;
window.activeStoreInstalls = window.activeStoreInstalls || {};

// Helper: parse human-readable sizes
function parseSizeString(str) {
    if(!str) return 0;
    str = str.toUpperCase();
    let val = parseFloat(str);
    if(str.includes('MB')) return val * 1024 * 1024;
    if(str.includes('KB')) return val * 1024;
    if(str.includes('GB')) return val * 1024 * 1024 * 1024;
    return val;
}

// Helper: resolve icon src with fallbacks
function resolveStoreIcon(iconName) {
    if(!iconName) return 'Windows XP Icons/Setup.png';
    if(iconName.startsWith('data:') || iconName.includes('/')) return iconName;
    if(typeof sysIcons !== 'undefined' && sysIcons[iconName]) return sysIcons[iconName];
    return 'Windows XP Icons/' + iconName + '.png';
}

// Find an app object by any identifier
window.findStoreApp = function(query) {
    if (!query) return null;
    if (typeof query === 'object') {
        if (query.id) {
            let found = STORE_APPS.find(a => a.id === query.id);
            if (found) return found;
        }
        if (query.name) {
            let found = STORE_APPS.find(a => a.name.toLowerCase() === query.name.toLowerCase());
            if (found) return found;
        }
        if (query.appId) {
            let found = STORE_APPS.find(a => a.appId === query.appId);
            if (found) return found;
        }
        query = query.name || query.id || query.appId || '';
    }
    let str = typeof query === 'string' ? query : String(query);
    let q = str.trim().toLowerCase().replace('.exe', '').replace('-window', '').replace('.lnk', '');
    return STORE_APPS.find(a => 
        a.id.toLowerCase() === q ||
        a.name.toLowerCase() === q ||
        a.appId.toLowerCase() === str.toLowerCase() ||
        a.appId.toLowerCase().replace('-window', '') === q ||
        (a.exe && a.exe.toLowerCase().replace('.exe', '') === q) ||
        (a.shortcut && a.shortcut.toLowerCase().replace('.lnk', '') === q)
    );
};

const DEFAULT_UNINSTALLED_APPS = ['checkers', 'reversi', 'hearts', 'spades', 'freecell', 'messenger', 'excel', 'remotedesktop', 'xptour'];

// Storage for uninstalled apps
window.getUninstalledApps = function() {
    try {
        let saved = localStorage.getItem('xp_uninstalled_apps');
        if (saved !== null) return JSON.parse(saved);
    } catch(e) {}
    return [...DEFAULT_UNINSTALLED_APPS];
};

window.setUninstalledApps = function(list) {
    try {
        localStorage.setItem('xp_uninstalled_apps', JSON.stringify(list));
    } catch(e) {}
};

// Universal isAppInstalled check
window.isAppInstalled = function(app) {
    if (!app) return false;
    let sApp = window.findStoreApp(app);
    let appName = sApp ? sApp.name : (typeof app === 'string' ? app : (app.name || ''));
    let appId = sApp ? sApp.id : '';

    // Core non-removable system apps
    if (sApp && sApp.systemApp) return true;
    if (appName === "Windows Explorer" || appName === "Control Panel" || appName === "Command Prompt" || appName === "Task Manager" || appName === "Registry Editor") return true;

    // Check uninstalled list
    let uninstalled = window.getUninstalledApps();
    if (uninstalled.includes(appId) || uninstalled.includes(appName) || (sApp && uninstalled.includes(sApp.appId))) {
        return false;
    }

    // Check recycle bin
    if (typeof window.isAppInRecycler === 'function' && window.isAppInRecycler(appName)) {
        return false;
    }

    return true;
};

// Open the catalog directly on a specific app's detail page
window.openCatalogApp = function(appIdOrName) {
    let app = window.findStoreApp(appIdOrName);
    
    if (app) {
        storeViewMode = 'detail';
        currentStoreAppId = app.id;
    }
    
    // Open the catalog window
    if (typeof window.openProgram === 'function') {
        window.openProgram('store-window');
    }
    let storeWin = document.getElementById('store-window');
    if (storeWin && typeof window.bringToFront === 'function') {
        window.bringToFront(storeWin);
    }
    
    if (app) {
        window.showStoreAppDetail(app.id);
    } else {
        window.backToStoreList();
    }
};

// Switch back to list view
window.backToStoreList = function() {
    storeViewMode = 'list';
    currentStoreAppId = null;
    renderStore();
};

// Custom user reviews storage
function getAppReviews(appId) {
    let app = STORE_APPS.find(a => a.id === appId);
    let baseReviews = app && app.reviews ? [...app.reviews] : [];
    try {
        let stored = localStorage.getItem('xp_app_reviews_' + appId);
        if (stored) {
            let customReviews = JSON.parse(stored);
            return customReviews.concat(baseReviews);
        }
    } catch(e) {}
    return baseReviews;
}

function saveCustomReview(appId, reviewObj) {
    try {
        let stored = localStorage.getItem('xp_app_reviews_' + appId);
        let list = stored ? JSON.parse(stored) : [];
        list.unshift(reviewObj);
        localStorage.setItem('xp_app_reviews_' + appId, JSON.stringify(list));
    } catch(e) {}
}

// Render individual stars string
function renderStarHTML(stars) {
    let s = Math.round(stars || 5);
    let out = '';
    for(let i=1; i<=5; i++) {
        if(i <= s) {
            out += '<span style="color:#C67600; font-size:12px;">★</span>';
        } else {
            out += '<span style="color:#ACA899; font-size:12px;">★</span>';
        }
    }
    return out;
}

// Show the single program detail page
window.showStoreAppDetail = function(appId) {
    let app = STORE_APPS.find(a => a.id === appId);
    if (!app) return;

    storeViewMode = 'detail';
    currentStoreAppId = appId;

    let container = document.getElementById('store-list-container');
    if (!container) return;

    let isInst = window.isAppInstalled(app);
    let activeInst = window.activeStoreInstalls[app.id];
    let iconSrc = resolveStoreIcon(app.icon);
    let allReviews = getAppReviews(app.id);

    // Update banner
    let bannerIcon = document.getElementById('store-header-icon');
    let bannerTitle = document.getElementById('store-header-title');
    let bannerSubtitle = document.getElementById('store-header-subtitle');
    if (bannerIcon) bannerIcon.src = iconSrc;
    if (bannerTitle) bannerTitle.innerText = app.name;
    if (bannerSubtitle) bannerSubtitle.innerText = (app.category || 'Windows Application') + ' • Publisher: ' + (app.publisher || 'Microsoft Corporation');

    // Calculate rating
    let totalScore = allReviews.reduce((acc, r) => acc + (r.stars || 5), 0);
    let avgRating = allReviews.length > 0 ? (totalScore / allReviews.length).toFixed(1) : (app.rating || 4.8).toFixed(1);

    let progStyle = activeInst ? "display:block;" : "display:none;";

    let actionHTML = '';
    if (app.systemApp) {
        actionHTML = `
            <div style="text-align:right;">
                <div style="font-family:Tahoma; font-size:10px; color:#555; margin-bottom:4px; font-style:italic;">Windows System Component</div>
                <button onclick="openProgram('${app.appId}')" style="font-family:Tahoma; font-size:11px; font-weight:bold; padding:3px 12px; cursor:pointer;">Run Program</button>
            </div>
        `;
    } else if (isInst) {
        actionHTML = `
            <div style="text-align:right;">
                <div style="color:#006600; font-family:Tahoma; font-size:11px; font-weight:bold; margin-bottom:4px; display:flex; align-items:center; justify-content:flex-end; gap:4px;">
                    <img src="Windows XP Icons/Security Center (safe).png" style="width:14px; height:14px;"> Program is Installed
                </div>
                <div style="display:flex; gap:6px; justify-content:flex-end;">
                    <button onclick="openProgram('${app.appId}')" style="font-family:Tahoma; font-size:11px; font-weight:bold; padding:3px 12px; cursor:pointer;">Run Program</button>
                    <button onclick="uninstallApp('${app.id}')" style="font-family:Tahoma; font-size:11px; padding:3px 8px; cursor:pointer;">Uninstall</button>
                </div>
            </div>
        `;
    } else {
        actionHTML = `
            <div style="text-align:right;">
                <button id="store-btn-${app.id}" onclick="installApp('${app.id}')" style="font-family:Tahoma; font-size:11px; font-weight:bold; padding:4px 16px; cursor:pointer;" ${activeInst ? 'disabled' : ''}>
                    <img src="Windows XP Icons/Setup.png" style="width:16px; height:16px; vertical-align:middle; margin-right:4px;"> ${activeInst ? 'Installing...' : 'Install Program'}
                </button>
                <div id="store-prog-${app.id}" style="${progStyle} margin-top:6px; height:14px; width:160px; background:#FFF; border:2px inset #D5D2C2; position:relative; overflow:hidden;">
                    <div id="store-prog-bar-${app.id}" style="position:absolute; top:0; left:0; height:100%; width:0%; background:repeating-linear-gradient(90deg, #388E3C 0px, #388E3C 8px, #FFF 8px, #FFF 10px);"></div>
                </div>
                <div id="store-prog-text-${app.id}" style="${progStyle} font-family:Tahoma; font-size:10px; color:#555; margin-top:2px;"></div>
            </div>
        `;
    }

    // Render features list
    let featuresHTML = '';
    if (app.features && app.features.length > 0) {
        featuresHTML = `
            <div style="margin-top:8px;">
                <b style="font-family:Tahoma; font-size:11px; color:#000;">Key Features:</b>
                <ul style="margin:4px 0 0 16px; padding:0; font-family:Tahoma; font-size:11px; color:#333; line-height:16px;">
                    ${app.features.map(f => `<li>${f}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    // Render reviews list
    let reviewsListHTML = '';
    if (allReviews.length === 0) {
        reviewsListHTML = `<div style="padding:10px; color:#666; font-family:Tahoma; font-size:11px; font-style:italic;">No customer reviews yet. Be the first to review this program!</div>`;
    } else {
        reviewsListHTML = allReviews.map(r => `
            <div style="padding:6px 8px; border-bottom:1px dotted #CCC; background:#FFF; margin-bottom:4px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        ${renderStarHTML(r.stars)}
                        <b style="font-family:Tahoma; font-size:11px; color:#0A246A; margin-left:6px;">${r.author || 'Windows User'}</b>
                        <span style="font-family:Tahoma; font-size:10px; color:#666; margin-left:4px;">(Verified XP User)</span>
                    </div>
                    <span style="font-family:Tahoma; font-size:10px; color:#777;">${r.date || 'Recent'}</span>
                </div>
                <div style="font-family:Tahoma; font-size:11px; color:#000; margin-top:3px; line-height:14px;">
                    "${r.text}"
                </div>
            </div>
        `).join('');
    }

    container.innerHTML = `
        <div style="padding:2px;">
            <!-- Navigation Toolbar -->
            <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:6px; margin-bottom:8px; border-bottom:1px solid #ACA899;">
                <button onclick="window.backToStoreList()" style="display:inline-flex; align-items:center; gap:4px; padding:2px 8px; font-family:Tahoma; font-size:11px; font-weight:bold; cursor:pointer;">
                    <img src="Windows XP Icons/Back.png" style="width:16px; height:16px;" onerror="this.src='Windows XP Icons/Folder_Up.png'"> Back to Software List
                </button>
                <div style="font-family:Tahoma; font-size:11px; color:#555;">
                    Windows Catalog &gt; <span style="color:#0A246A;">${app.category || 'Applications'}</span> &gt; <b>${app.name}</b>
                </div>
            </div>

            <!-- Program Header Box -->
            <div style="background:#FFF; border:2px inset #D5D2C2; padding:10px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:12px; max-width:65%;">
                    <img src="${iconSrc}" onerror="this.src='Windows XP Icons/Setup.png'" style="width:48px; height:48px; display:block;">
                    <div>
                        <div style="font-family:Tahoma; font-size:15px; font-weight:bold; color:#0A246A;">${app.name}</div>
                        <div style="font-family:Tahoma; font-size:11px; color:#555; margin-top:2px;">
                            Publisher: <b>${app.publisher || 'Microsoft Corporation'}</b> &bull; Version: ${app.version || '5.1'}
                        </div>
                        <div style="display:flex; align-items:center; gap:6px; margin-top:4px;">
                            ${renderStarHTML(avgRating)}
                            <span style="font-family:Tahoma; font-size:11px; font-weight:bold; color:#333;">${avgRating} / 5.0</span>
                            <span style="font-family:Tahoma; font-size:10px; color:#777;">(${allReviews.length} user reviews)</span>
                        </div>
                        <div style="margin-top:4px; font-family:Tahoma; font-size:11px; color:#444;">
                            Category: <b>${app.category || 'General'}</b> &bull; Download Size: <b>${app.size || '1 MB'}</b>
                        </div>
                    </div>
                </div>
                <div>
                    ${actionHTML}
                </div>
            </div>

            <!-- Fieldset 1: Overview & Features -->
            <fieldset style="border:1px solid #ACA899; padding:8px 12px; margin-bottom:10px; background:#ECE9D8;">
                <legend style="font-family:Tahoma; font-size:11px; font-weight:bold; color:#003399; padding:0 4px;">Program Overview</legend>
                <div style="font-family:Tahoma; font-size:11px; color:#000; line-height:16px;">
                    ${app.fullDesc || app.desc}
                </div>
                ${featuresHTML}
                <div style="background:#FFF; border:1px solid #ACA899; padding:6px 8px; font-family:Tahoma; font-size:11px; color:#333; margin-top:8px;">
                    <b>System Requirements:</b> Microsoft Windows XP (Home or Professional), 64 MB RAM, Super VGA (800x600) display adapter.
                </div>
            </fieldset>

            <!-- Fieldset 2: Customer Ratings & Reviews -->
            <fieldset style="border:1px solid #ACA899; padding:8px 12px; margin-bottom:10px; background:#ECE9D8;">
                <legend style="font-family:Tahoma; font-size:11px; font-weight:bold; color:#003399; padding:0 4px;">Customer Ratings &amp; Reviews (Average: ${avgRating} / 5.0)</legend>
                <!-- Reviews List -->
                <div style="max-height:140px; overflow-y:auto; background:#FFF; border:2px inset #D5D2C2; padding:6px; margin-bottom:8px;">
                    ${reviewsListHTML}
                </div>

                <!-- Write a Review Form -->
                <div style="border-top:1px solid #ACA899; padding-top:8px;">
                    <div style="font-family:Tahoma; font-size:11px; font-weight:bold; color:#000; margin-bottom:4px;">
                        Write a Customer Review:
                    </div>
                    <div style="display:flex; gap:8px; align-items:center; margin-bottom:5px;">
                        <label style="font-family:Tahoma; font-size:11px; color:#000;">Your Name:</label>
                        <input type="text" id="review-author-${app.id}" value="${window.currentAccount || 'Administrator'}" style="font-family:Tahoma; font-size:11px; padding:2px 4px; border:2px inset #D5D2C2; width:120px;">
                        <label style="font-family:Tahoma; font-size:11px; color:#000; margin-left:8px;">Rating:</label>
                        <select id="review-stars-${app.id}" style="font-family:Tahoma; font-size:11px; border:1px solid #7F9DB9; padding:1px 3px;">
                            <option value="5">★★★★★ (5 Stars - Excellent)</option>
                            <option value="4">★★★★☆ (4 Stars - Good)</option>
                            <option value="3">★★★☆☆ (3 Stars - Average)</option>
                            <option value="2">★★☆☆☆ (2 Stars - Fair)</option>
                            <option value="1">★☆☆☆☆ (1 Star - Poor)</option>
                        </select>
                    </div>
                    <div style="display:flex; gap:6px; align-items:center;">
                        <input type="text" id="review-text-${app.id}" placeholder="Type your experience with ${app.name}..." style="flex:1; font-family:Tahoma; font-size:11px; padding:3px 5px; border:2px inset #D5D2C2;">
                        <button onclick="window.submitAppReview('${app.id}')" style="font-family:Tahoma; font-size:11px; font-weight:bold; padding:3px 12px; cursor:pointer;">Submit Review</button>
                    </div>
                </div>
            </fieldset>

            <!-- Fieldset 3: Technical Specifications -->
            <fieldset style="border:1px solid #ACA899; padding:8px 12px; margin-bottom:5px; background:#ECE9D8;">
                <legend style="font-family:Tahoma; font-size:11px; font-weight:bold; color:#003399; padding:0 4px;">Technical Information</legend>
                <table style="width:100%; border-collapse:collapse; background:#FFF; border:2px inset #D5D2C2; font-family:Tahoma; font-size:11px;">
                    <tr style="border-bottom:1px solid #E0DFE3;">
                        <td style="padding:3px 8px; width:130px; background:#F5F4EC; color:#444; border-right:1px solid #E0DFE3;">Executable Name:</td>
                        <td style="padding:3px 8px; font-family:monospace; font-weight:bold;">${app.exe || 'app.exe'}</td>
                    </tr>
                    <tr style="border-bottom:1px solid #E0DFE3;">
                        <td style="padding:3px 8px; background:#F5F4EC; color:#444; border-right:1px solid #E0DFE3;">Default Location:</td>
                        <td style="padding:3px 8px; font-family:monospace;">C:\\Program Files\\${app.name}\\</td>
                    </tr>
                    <tr style="border-bottom:1px solid #E0DFE3;">
                        <td style="padding:3px 8px; background:#F5F4EC; color:#444; border-right:1px solid #E0DFE3;">Architecture:</td>
                        <td style="padding:3px 8px;">32-bit (x86) Windows Executable</td>
                    </tr>
                    <tr>
                        <td style="padding:3px 8px; background:#F5F4EC; color:#444; border-right:1px solid #E0DFE3;">Operating System:</td>
                        <td style="padding:3px 8px;">Microsoft Windows XP (SP1, SP2, SP3)</td>
                    </tr>
                </table>
            </fieldset>
        </div>
    `;
};

// Handle review submission
window.submitAppReview = function(appId) {
    let authorInput = document.getElementById('review-author-' + appId);
    let starsInput = document.getElementById('review-stars-' + appId);
    let textInput = document.getElementById('review-text-' + appId);

    let author = authorInput ? authorInput.value.trim() : (window.currentAccount || 'Administrator');
    let stars = starsInput ? parseInt(starsInput.value) : 5;
    let text = textInput ? textInput.value.trim() : '';

    if (!text) {
        if (typeof window.xpDialog === 'function') {
            window.xpDialog('Windows Catalog', 'Please enter a review comment before submitting.', 'info');
        } else {
            alert('Please enter a review comment before submitting.');
        }
        return;
    }

    let today = new Date();
    let dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    saveCustomReview(appId, {
        author: author || 'Windows User',
        stars: stars,
        date: dateStr,
        text: text
    });

    if (typeof window.showBalloon === 'function') {
        window.showBalloon('Review Submitted', 'Thank you! Your review has been published to Windows Catalog.');
    }

    showStoreAppDetail(appId);
};

// Main store renderer
window.renderStore = function() {
    let container = document.getElementById('store-list-container');
    if (!container) return;

    if (storeViewMode === 'detail' && currentStoreAppId) {
        showStoreAppDetail(currentStoreAppId);
        return;
    }

    // Update banner for list view
    let bannerIcon = document.getElementById('store-header-icon');
    let bannerTitle = document.getElementById('store-header-title');
    let bannerSubtitle = document.getElementById('store-header-subtitle');
    if (storeCurrentTab === 'all') {
        if (bannerIcon) bannerIcon.src = 'Windows XP Icons/Windows Catalog.png';
        if (bannerTitle) bannerTitle.innerText = 'Windows Catalog';
        if (bannerSubtitle) bannerSubtitle.innerText = 'Find, review, and install certified software for Windows XP';
    } else {
        if (bannerIcon) bannerIcon.src = 'Windows XP Icons/Setup.png';
        if (bannerTitle) bannerTitle.innerText = 'Currently Installed Programs';
        if (bannerSubtitle) bannerSubtitle.innerText = 'To change a program or remove it from your computer, click Change/Remove.';
    }

    container.innerHTML = '';

    let toShow = [];
    STORE_APPS.forEach(app => {
        let isInst = window.isAppInstalled(app);
        if (storeCurrentTab === 'all') {
            if (!isInst) toShow.push(app); // Page 1: only uninstalled apps ready to install
        } else if (storeCurrentTab === 'installed') {
            if (isInst) toShow.push(app); // Page 2: installed apps to manage or remove
        }
    });

    let listHTML = `
        <div style="background:#FFF; border:2px inset #D5D2C2; height:100%; box-sizing:border-box; overflow-y:auto;">
    `;

    if (toShow.length === 0) {
        listHTML += `<div style="padding:30px 10px; text-align:center; color:#666; font-family:Tahoma; font-size:11px;">No programs found in this category.</div></div>`;
        container.innerHTML = listHTML;
        return;
    }

    toShow.forEach(app => {
        let isInst = window.isAppInstalled(app);
        let activeInst = window.activeStoreInstalls[app.id];
        let iconSrc = resolveStoreIcon(app.icon);
        let allReviews = getAppReviews(app.id);
        let totalScore = allReviews.reduce((acc, r) => acc + (r.stars || 5), 0);
        let avgRating = allReviews.length > 0 ? (totalScore / allReviews.length).toFixed(1) : (app.rating || 4.8).toFixed(1);

        let progStyle = activeInst ? "display:block;" : "display:none;";

        let statusArea = '';
        if (app.systemApp) {
            statusArea = `
                <span style="font-family:Tahoma; font-size:11px; color:#555; margin-right:6px; font-style:italic;">Windows Component</span>
                <button onclick="event.stopPropagation(); window.showStoreAppDetail('${app.id}')" style="padding:2px 8px; font-family:Tahoma; font-size:11px; cursor:pointer;">Details »</button>
            `;
        } else if (isInst) {
            statusArea = `
                <span style="font-family:Tahoma; font-size:11px; color:#006600; font-weight:bold; margin-right:8px;">Installed</span>
                <button onclick="event.stopPropagation(); window.showStoreAppDetail('${app.id}')" style="padding:2px 8px; font-family:Tahoma; font-size:11px; cursor:pointer;">Details »</button>
                <button onclick="event.stopPropagation(); window.uninstallApp('${app.id}')" style="padding:2px 8px; font-family:Tahoma; font-size:11px; cursor:pointer; margin-left:4px;">Uninstall</button>
            `;
        } else {
            statusArea = `
                <button id="store-btn-${app.id}" onclick="event.stopPropagation(); window.installApp('${app.id}')" style="padding:2px 10px; font-family:Tahoma; font-size:11px; font-weight:bold; cursor:pointer;" ${activeInst ? 'disabled' : ''}>
                    ${activeInst ? 'Installing...' : 'Install'}
                </button>
                <button onclick="event.stopPropagation(); window.showStoreAppDetail('${app.id}')" style="padding:2px 8px; font-family:Tahoma; font-size:11px; cursor:pointer; margin-left:4px;">Details »</button>
            `;
        }

        listHTML += `
            <div class="store-app-row" onclick="window.showStoreAppDetail('${app.id}')" style="display:flex; justify-content:space-between; align-items:center; padding:6px 10px; border-bottom:1px solid #E8E7E0; cursor:pointer;" onmouseover="this.style.background='#F0F4FA'" onmouseout="this.style.background='transparent'">
                <div style="display:flex; align-items:center; gap:10px; flex:1; min-width:0; padding-right:10px;">
                    <img src="${iconSrc}" onerror="this.src='Windows XP Icons/Setup.png'" style="width:32px; height:32px; flex-shrink:0;">
                    <div style="min-width:0; flex:1;">
                        <div style="font-family:Tahoma; font-size:12px; font-weight:bold; color:#000;">
                            ${app.name} <span style="font-size:10px; font-weight:normal; color:#666;">(${app.category || 'Utility'})</span>
                        </div>
                        <div style="font-family:Tahoma; font-size:11px; color:#444; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                            ${app.desc}
                        </div>
                        <div style="font-family:Tahoma; font-size:10px; color:#555; margin-top:2px;">
                            ${renderStarHTML(avgRating)} <b style="color:#333;">${avgRating}</b> (${allReviews.length} reviews) &bull; Size: ${app.size}
                        </div>
                        <div id="store-prog-${app.id}" style="${progStyle} margin-top:4px; height:12px; width:100%; max-width:200px; background:white; border:1px solid #7F9DB9; position:relative; overflow:hidden; box-sizing:border-box;">
                            <div id="store-prog-bar-${app.id}" style="position:absolute; top:0; left:0; height:100%; width:0%; background:repeating-linear-gradient(90deg, #388E3C 0px, #388E3C 8px, #FFF 8px, #FFF 10px);"></div>
                        </div>
                        <div id="store-prog-text-${app.id}" style="${progStyle} font-family:Tahoma; font-size:10px; color:#555; margin-top:2px;"></div>
                    </div>
                </div>
                <div style="display:flex; align-items:center; flex-shrink:0;">
                    ${statusArea}
                </div>
            </div>
        `;
    });

    listHTML += `</div>`;
    container.innerHTML = listHTML;
};

// Install app implementation
window.installApp = function(appId) {
    let app = STORE_APPS.find(a => a.id === appId);
    if(!app) return;

    let totalBytes = parseSizeString(app.size) || 102400; 
    window.activeStoreInstalls[appId] = {
        total: totalBytes,
        current: 0
    };
    
    renderStore();

    if(!window.storeInstallLoopRunning) {
        window.storeInstallLoopRunning = true;
        let loop = setInterval(() => {
            let activeKeys = Object.keys(window.activeStoreInstalls);
            if(activeKeys.length === 0) {
                clearInterval(loop);
                window.storeInstallLoopRunning = false;
                return;
            }
            
            activeKeys.forEach(id => {
                let inst = window.activeStoreInstalls[id];
                let a = STORE_APPS.find(x => x.id === id);
                if (!inst || !a) return;
                
                inst.current += Math.max(120000, Math.floor(inst.total / 10)) + Math.floor(Math.random() * 50000); 
                
                let isDone = false;
                if (inst.current >= inst.total) {
                    inst.current = inst.total;
                    isDone = true;
                }
                
                let pText = document.getElementById('store-prog-text-' + id);
                let pBar = document.getElementById('store-prog-bar-' + id);
                if (pText && pBar) {
                    let pct = Math.min(100, Math.floor((inst.current / inst.total) * 100));
                    pBar.style.width = pct + '%';
                    
                    let cMB = (inst.current / (1024*1024)).toFixed(2);
                    let tMB = (inst.total / (1024*1024)).toFixed(2);
                    if (inst.total < 1024 * 1024) {
                        pText.innerText = (inst.current / 1024).toFixed(0) + ' KB / ' + (inst.total / 1024).toFixed(0) + ' KB (' + pct + '%)';
                    } else {
                        pText.innerText = cMB + ' MB / ' + tMB + ' MB (' + pct + '%)';
                    }
                }
                
                if (isDone) {
                    delete window.activeStoreInstalls[id];
                    executeInstall(a);
                }
            });
        }, 50);
    }
};

function executeInstall(app) {
    // 1. Remove from uninstalled state
    let uninstalled = window.getUninstalledApps();
    uninstalled = uninstalled.filter(x => x !== app.id && x !== app.name && x !== app.appId && x !== app.exe);
    window.setUninstalledApps(uninstalled);

    // 2. Ensure desktop shortcut exists
    let deskNode = window.resolvePath(window.getDesktopPath());
    let rawBytes = parseSizeString(app.size) || 0;
    if (deskNode) {
        deskNode[app.shortcut] = { type: "exe", app: app.appId, icon: app.icon };
    }
    
    // 3. Ensure Program Files folder & exe exists
    let pfNode = window.resolvePath("C:\\Program Files");
    if(pfNode) {
        if(!pfNode[app.name]) {
            pfNode[app.name] = { type: 'folder', contents: {} };
        }
        if (pfNode[app.name].contents) {
            pfNode[app.name].contents[app.exe] = { type: "exe", app: app.appId, icon: app.icon, sizeRaw: rawBytes };
        } else {
            pfNode[app.name][app.exe] = { type: "exe", app: app.appId, icon: app.icon, sizeRaw: rawBytes };
        }
    }

    if (typeof window.saveFileSystem === 'function') window.saveFileSystem();
    if (typeof window.renderDesktop === 'function') window.renderDesktop();
    
    let startItem = document.getElementById('start-menu-' + app.id);
    if(startItem) startItem.style.display = 'block';
    let smItem = document.querySelector('.start-menu-item[data-name="' + app.name + '"]');
    if(smItem) smItem.style.display = 'block';

    renderStore();
    if(typeof window.showBalloon === 'function') window.showBalloon("Installation Complete", `${app.name} has been successfully installed.`);
    if(typeof window.syncStartMenuWithInstalledApps === 'function') window.syncStartMenuWithInstalledApps();
}

window.uninstallApp = function(appId) {
    let app = STORE_APPS.find(a => a.id === appId);
    if(!app) return;

    // Core apps cannot be uninstalled
    if (app.systemApp) return;

    // 1. Close program window if currently open
    if (typeof window.closeWindow === 'function') {
        window.closeWindow(app.appId);
    }

    // 2. Mark as uninstalled in storage
    let uninstalled = window.getUninstalledApps();
    if (!uninstalled.includes(app.id)) uninstalled.push(app.id);
    if (!uninstalled.includes(app.name)) uninstalled.push(app.name);
    if (app.appId && !uninstalled.includes(app.appId)) uninstalled.push(app.appId);
    if (app.exe && !uninstalled.includes(app.exe)) uninstalled.push(app.exe);
    window.setUninstalledApps(uninstalled);

    // 3. Delete Desktop shortcut
    let deskNode = window.resolvePath(window.getDesktopPath());
    if (deskNode && deskNode[app.shortcut]) {
        delete deskNode[app.shortcut];
    }
    
    // 4. Delete from Program Files if present
    let pfNode = window.resolvePath("C:\\Program Files");
    if(pfNode && pfNode[app.name]) {
        delete pfNode[app.name];
    }

    // 5. Delete from System32 if present
    let sys32Node = window.resolvePath("C:\\Windows\\System32");
    if(sys32Node && sys32Node[app.exe]) {
        delete sys32Node[app.exe];
    }

    if (typeof window.saveFileSystem === 'function') window.saveFileSystem();
    if (typeof window.renderDesktop === 'function') window.renderDesktop();
    
    let startItem = document.getElementById('start-menu-' + app.id);
    if(startItem) startItem.style.display = 'none';
    let smItem = document.querySelector('.start-menu-item[data-name="' + app.name + '"]');
    if(smItem) smItem.style.display = 'none';

    renderStore();
    if(typeof window.showBalloon === 'function') window.showBalloon("Uninstallation Complete", `${app.name} has been successfully uninstalled.`);
    if(typeof window.syncStartMenuWithInstalledApps === 'function') window.syncStartMenuWithInstalledApps();
};

window.switchStoreTab = function(tab) {
    storeCurrentTab = tab;
    storeViewMode = 'list';
    currentStoreAppId = null;
    
    let allBtn = document.getElementById('store-nav-all');
    let instBtn = document.getElementById('store-nav-installed');
    
    if (allBtn) {
        allBtn.style.background = tab === 'all' ? '#436a99' : 'transparent';
        allBtn.style.fontWeight = tab === 'all' ? 'bold' : 'normal';
        allBtn.style.boxShadow = tab === 'all' ? 'inset 1px 1px 2px rgba(0,0,0,0.3)' : 'none';
    }
    
    if (instBtn) {
        instBtn.style.background = tab === 'installed' ? '#436a99' : 'transparent';
        instBtn.style.fontWeight = tab === 'installed' ? 'bold' : 'normal';
        instBtn.style.boxShadow = tab === 'installed' ? 'inset 1px 1px 2px rgba(0,0,0,0.3)' : 'none';
    }
    
    renderStore();
};
