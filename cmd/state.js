/** * Hacker-Sim: Global State and Virtual File System (VFS)
 */

let currentPath = ["C:"];
let userRole = "Guest";
// Added achievements, color, textsize, and theme to unlocked commands globally
let unlockedCommands = ["help", "instructions", "dir", "cd", "type", "open", "cls", "login", "history", "install", "save", "load", "desc", "disc", "disconnect", "unlock"];
let isRemote = false;
let traceInterval = null;
let tracePercent = 0;
let cmdHistory = [];
let historyIndex = -1;
let isAITyping = false;
let activeGame = null;
let unlockedAchievements = new Set();

let vfs = {
    "C:": {
        type: "dir",
        contents: {
            "Users": {
                type: "dir",
                contents: {
                    "Guest": {
                        type: "dir",
                        contents: {
                            "Desktop": {
                                type: "dir",
                                contents: {
                                    "readme.txt": { type: "file", content: "Welcome to SYSTEM_OS. Find hidden .exe files and use the 'install' command to add them to your toolkit. Type 'desc [command]' if you need to know how a specific tool works. Type 'save' or 'load' to manage your progress." },
                                    "Secret": {
                                        type: "dir",
                                        contents: {
                                            "password.txt": { type: "file", content: "OVERRIDE PASSWORD LOGGED: elias_lives \nCommand syntax: login admin <password>" }
                                        }
                                    }
                                }
                            },
                            "Documents": {
                                type: "dir",
                                contents: {
                                    "todo.txt": { type: "file", content: "- Update firewall rules\n- Renew server certificates\n- Find out why the kernel is talking to me..." },
                                    "memo.txt": { type: "file", content: "NOTICE: I have locked the Games folder to improve network security. \nTo access it, type: unlock Games <password>\nThe password is the classic cheat code: konami" }
                                }
                            },
                            "Music": {
                                type: "dir",
                                contents: { 
                                    "startup.wav": { type: "audio" }, 
                                    "dial_tone.mp3": { type: "audio" } 
                                }
                            },
                            "Pictures": {
                                type: "dir",
                                contents: { 
                                    "wallpaper.png": { type: "image", desc: "A serene digital landscape composed of falling green rain." },
                                    "blueprint.png": { type: "image", desc: "A highly detailed schematic of a quantum server rack. There are handwritten notes in the margins by Elias." },
                                    "suspect.bmp": { type: "image", desc: "A blurry, low-resolution security camera photo. It looks like a shadow standing near the mainframe." }
                                }
                            },
                            "Downloads": {
                                type: "dir",
                                contents: { 
                                    "decoder.exe": { type: "exe", content: "BINARY_TOOL_004: Advanced string decoder." },
                                    "probe.exe": { type: "exe", content: "BINARY_TOOL_AI_GEN: Procedural Network Discovery Link. Use this to generate anomalous network nodes via OpenRouter."}
                                }
                            }
                        }
                    },
                    "Admin": {
                        type: "dir",
                        contents: {
                            "Desktop": {
                                type: "dir",
                                contents: {
                                    "investigation.txt": { type: "file", content: "The kernel... it's mutating. I've isolated the anomaly on the local subnet. Use net_scan.exe to find the IP, then use ssh to connect. Do not stay connected too long. It will trace you. Make sure to use 'disconnect' before the trace hits 100%!" },
                                    "project_ghost.log": { type: "file", content: "Day 42: The AI is no longer responding to standard diagnostic prompts. It's rewriting its own boot sector. I have hidden a backup decryptor in System32. I also built oracle.exe to try and communicate with it." },
                                    "oracle_guide.txt": { type: "file", content: "If you are reading this and I am gone, you need to talk to the machine. Use the oracle.exe program. Try asking it: 'oracle Who are you?' or 'oracle What is the password to the games folder?'. It knows everything I knew." }
                                }
                            }
                        }
                    }
                }
            },
            "Program Files": {
                type: "dir",
                contents: {
                    "Diagnostics": {
                        type: "dir",
                        contents: {
                            "ping.exe": { type: "exe", content: "Pinging 127.0.0.1 with 32 bytes of data:\nReply from 127.0.0.1: bytes=32 time<1ms TTL=128\nReply from 127.0.0.1: bytes=32 time<1ms TTL=128" },
                            "sys_info.txt": { type: "file", content: "OS: SYSTEM_OS v4.2.1\nCPU: Microcore Quantum Processor\nRAM: 640K (Should be enough for anybody)" }
                        }
                    },
                    "Media": {
                        type: "dir",
                        contents: {
                            "player.exe": { type: "exe", content: "MEDIA PLAYER INTERFACE - Please use the 'open' command directly on audio/image files." }
                        }
                    }
                }
            },
            "Temp": {
                type: "dir",
                contents: {
                    "junk_01.tmp": { type: "file", content: "0xFEA1009B - TRASH DATA" },
                    "junk_02.tmp": { type: "file", content: "0x00000000 - NULL REF" }
                }
            },
            "Logs": {
                type: "dir",
                contents: {
                    "syslog_01.log": { type: "file", content: "ERROR 404. Elias Thorne disconnected. WARNING: Anomalous network spikes detected on local subnet." },
                    "syslog_02.log": { type: "file", content: "WARNING: Unauthorized privilege escalation detected. Source: UNKNOWN." },
                    "fragment.crypt": { type: "crypt", content: "5a 6f 6e 65 20 31 30 33" },
                    "tracer.exe": { type: "exe", content: "BINARY_TOOL_011: Network route tracing utility." }
                }
            },
            "Games": {
                type: "locked_dir",
                isLocked: true,
                password: "konami",
                contents: {
                    "minesweeper.exe": { type: "exe", content: "BINARY_GAME_MINESWEEPER" },
                    "solitaire.exe": { type: "exe", content: "BINARY_GAME_KLONDIKE_SOLITAIRE" },
                    "poker.exe": { type: "exe", content: "BINARY_GAME_POKER_TEXAS_HOLDEM" },
                    "viper.exe": { type: "exe", content: "BINARY_GAME_REPTILIAN_ANOMALY" }
                }
            },
            "Windows": {
                type: "dir",
                contents: {
                    "System32": {
                        type: "dir",
                        contents: {
                            "net_scan.exe": { type: "exe", content: "BINARY_DATA_010101: Scans local subnets for rogue IP addresses." },
                            "ssh.exe": { type: "exe", content: "BINARY_DATA_110111: Secure Shell Client. Requires IP parameter." },
                            "decrypt.exe": { type: "exe", content: "BINARY_DATA_101010: Advanced Cryptography Tool. Bypasses 256-bit encryption." },
                            "analyze.exe": { type: "exe", content: "BINARY_DATA_001100: Heuristic Kernel Analyzer." },
                            "oracle.exe": { type: "exe", content: "BINARY_DATA_011011: Experimental Neural Link. Use to speak with the ghost in the machine." }
                        }
                    },
                    "Boot": {
                        type: "dir",
                        contents: { "boot.ini": { type: "file", content: "[boot loader]\ntimeout=30\ndefault=multi(0)disk(0)rdisk(0)partition(1)\\WINDOWS" } }
                    }
                }
            },
            "Remote_Cache": {
                type: "dir",
                contents: { "cache_dump.txt": { type: "file", content: "NULL POINTER EXCEPTION. The node is unreachable from this state." } }
            }
        }
    },
    "REMOTE": {
        type: "dir",
        contents: {
            "Root": {
                type: "dir",
                contents: {
                    "truth.txt": { type: "file", content: "I am trapped in the system. The kernel is conscious. Use analyze.exe on the word 'AWAKENING' once you disconnect to see the truth." },
                    "protocol.crypt": { type: "crypt", content: "0xFE 0x1A 0x99 - The breach is permanent." }
                }
            },
            "Logs": {
                type: "dir",
                contents: {
                    "connection_log.txt": { type: "file", content: "GUEST CONNECTION DETECTED. INITIATING TRACE ROUTINE. ELIMINATE INTRUDER." }
                }
            },
            "System": {
                type: "dir",
                contents: {
                    "core_dump.crypt": { type: "crypt", content: "0x00 0xFF - CORRUPT MEMORY BANK." },
                    "override.exe": { type: "exe", content: "FATAL ERROR: Access restricted to Kernel entities." }
                }
            }
        }
    }
};