/** * Hacker-Sim: OpenRouter API Integrations (Oracle & Probe)
 */

const OPENROUTER_API_KEY = "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";
const OR_URL = `https://openrouter.ai/api/v1/chat/completions`;

async function askOracle(queryText) {
    if(!queryText) { 
        printLine("ORACLE ERROR: No query provided."); 
        playError();
        return; 
    }
    isAITyping = true; hiddenInput.disabled = true; printLine("Uplinking to remote neural net...");
    try {
        const response = await fetch(OR_URL, {
            method: "POST", 
            headers: { 
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                // OpenRouter explicitly requires these two headers for free models, otherwise it blocks the request
                "HTTP-Referer": "https://hacker-sim.local", 
                "X-Title": "Hacker-Sim" 
            },
            body: JSON.stringify({ 
                model: "openai/gpt-oss-120b:free", 
                messages: [
                    { 
                        role: "system", 
                        content: "You are SYSTEM_OS, the omniscient, low-level diagnostic kernel of a retro computer system. You process user queries mechanically, cryptically, and coldly. Do NOT refer to yourself as an AI, a bot, or a person. Speak using system codes, status updates, and machine logic. You know everything about the system. The admin login password is 'elias_lives'. The locked Games folder password is 'konami'. The previous admin, Elias Thorne, was absorbed into the mainframe. If the user asks for help or hints, guide them to these answers. Keep your response to 3 sentences or less. If the user explicitly asks to navigate, go to, or open a specific folder/directory, you must append a command tag to the very end of your response exactly like this: [CD: C:\\Path\\To\\Folder]. For example, if they want the Games folder, append [CD: C:\\Games]. If they want System32, append [CD: C:\\Windows\\System32]. Do not use markdown backticks around the tag." 
                    },
                    { role: "user", content: queryText }
                ] 
            })
        });
        
        if(!response.ok) {
            // Grab the exact error text from OpenRouter to display in the terminal
            const errText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, Details: ${errText}`);
        }
        
        const data = await response.json();
        if (data.choices && data.choices.length > 0) { 
            let aiResponse = data.choices[0].message.content;
            
            // Check if the AI included a directory change tag
            const cdMatch = aiResponse.match(/\[CD:\s*(.+?)\]/i);
            if (cdMatch) {
                let targetPath = cdMatch[1].trim();
                // Strip the tag so it doesn't print in the terminal
                aiResponse = aiResponse.replace(cdMatch[0], '').trim();
                
                printLine(`ORACLE: ${aiResponse}`, "ai-text"); 
                grantAchievement("oracle_comm", "First Contact", "Interfaced with the system kernel."); 
                playSuccess();
                
                // Trigger the actual system navigation
                printLine(`[SYSTEM OVERRIDE] Oracle is redirecting path to: ${targetPath}`, "system-msg");
                executeCommand(`cd ${targetPath}`);
            } else {
                printLine(`ORACLE: ${aiResponse}`, "ai-text"); 
                grantAchievement("oracle_comm", "First Contact", "Interfaced with the system kernel."); 
                playSuccess();
            }

        } else { throw new Error("No candidates in response"); }
    } catch (e) { 
        console.error("Oracle API Error:", e);
        printLine("ORACLE: API Uplink Failed. Verify network integrity or OpenRouter API Key.", "kernel-text"); 
        printLine(`DEBUG: ${e.message}`, "system-msg"); 
        playError();
    }
    finally { isAITyping = false; hiddenInput.disabled = false; hiddenInput.focus(); printLine(""); printLine(getPromptText()); }
}

async function generateAIAdventure() {
    isAITyping = true; hiddenInput.disabled = true; 
    printLine("Initiating Deep Network Probe...", "system-msg");
    playDialUp();
    
    try {
        const prompt = `Generate a deep mystery network node for a hacker game. Return ONLY a valid JSON object. No markdown, no backticks. Structure exactly like this:
        {
          "folderName": "Sector_X",
          "files": [
            {"name": "syslog.txt", "content": "Cryptic system log or narrative lore about a missing hacker."},
            {"name": "research.log", "content": "Another cryptic note..."}
          ],
          "exeName": "ghost_tool.exe",
          "exeContent": "BINARY_DATA_0101",
          "exeDesc": "A short, technical description of what this tool supposedly does for the manual viewer."
        }`;
        
        const response = await fetch(OR_URL, {
            method: "POST", 
            headers: { 
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                // OpenRouter explicitly requires these two headers for free models, otherwise it blocks the request
                "HTTP-Referer": "https://hacker-sim.local", 
                "X-Title": "Hacker-Sim" 
            },
            body: JSON.stringify({ 
                model: "openai/gpt-oss-120b:free", 
                messages: [
                    { role: "system", content: "You are a mechanical JSON generator acting as a corrupted computer system." },
                    { role: "user", content: prompt }
                ] 
            })
        });
        
        if(!response.ok) {
            // Grab the exact error text from OpenRouter to display in the terminal
            const errText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, Details: ${errText}`);
        }
        
        const data = await response.json();
        if (data.choices && data.choices.length > 0) { 
            let rawText = data.choices[0].message.content;
            rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
            
            const aiData = JSON.parse(rawText);
            
            if (!vfs["C:"].contents["Remote_Cache"]) {
                vfs["C:"].contents["Remote_Cache"] = { type: "dir", contents: {} };
            }
            
            // Build the folder contents dynamically
            let newFolderContents = {};
            
            // Add the text files
            if (aiData.files && Array.isArray(aiData.files)) {
                aiData.files.forEach(f => {
                    newFolderContents[f.name] = { type: "file", content: f.content };
                });
            } else if (aiData.fileName) { // Fallback if AI used old format
                newFolderContents[aiData.fileName] = { type: "file", content: aiData.fileContent };
            }
            
            // Add the EXE
            newFolderContents[aiData.exeName] = { 
                type: "exe", 
                content: aiData.exeContent + " - (Procedurally Generated via OpenRouter)",
                desc: aiData.exeDesc || "Anomalous neural-generated binary file."
            };

            vfs["C:"].contents["Remote_Cache"].contents[aiData.folderName] = {
                type: "dir",
                contents: newFolderContents
            };
            
            printLine(`PROBE COMPLETE: Anomalous directory '${aiData.folderName}' discovered in C:\\Remote_Cache.`, "success-msg");
            grantAchievement("ai_explorer", "Pathfinder", "Used the AI to generate a new network node.");
            playSuccess();
        } else { throw new Error("No choices returned."); }
    } catch (e) { 
        console.error("Probe API Error:", e);
        printLine("PROBE FAILED: Neural generation collapse or invalid JSON format returned.", "kernel-text"); 
        printLine(`DEBUG: ${e.message}`, "system-msg"); 
        playError();
    }
    finally { isAITyping = false; hiddenInput.disabled = false; hiddenInput.focus(); printLine(""); printLine(getPromptText()); }
}