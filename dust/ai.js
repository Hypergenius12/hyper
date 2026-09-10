const AI_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const FALLBACK_MODELS = [
    "nvidia/nemotron-3-ultra-550b-a55b:free",
    "poolside/laguna-xs-2.1:free",
    "cohere/north-mini-code:free"
];
let currentModelIndex = 0;

const keyInput = document.getElementById('ai-key');
if (localStorage.getItem('openRouterKey')) {
    keyInput.value = localStorage.getItem('openRouterKey');
}
keyInput.addEventListener('change', () => {
    localStorage.setItem('openRouterKey', keyInput.value.trim());
});

const chatBox = document.getElementById('ai-chat');
const promptInput = document.getElementById('ai-prompt');
const btn = document.getElementById('ai-btn');

function addMsg(text, sender) {
    const d = document.createElement('div');
    d.className = `chat-msg ${sender}`;
    d.innerText = text;
    chatBox.appendChild(d);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function getSystemPrompt() {
    const elList = Object.keys(ELEMENTS).join(', ');
    return `You are an expert physicist AI for a cellular automata falling sand engine. The user asks you to create elements, tools, or modify existing ones. Output the JSON immediately. DO NOT ask questions.

Your ENTIRE response must be EXACTLY ONE RAW JSON ARRAY (no markdown, no text, no comments):

[
  {
    "name": "Display Name",
    "idName": "UPPER_SNAKE_CASE",
    "color": [r, g, b],
    "uiColor": "#hexcolor",
    "type": "solid|liquid|gas|tool",
    "gravity": true|false,
    "flammable": false,
    "defaultTemp": 70,
    "density": 1.0,
    "dispersion": 0,
    "thermalConductivity": 0.05,
    "conductive": false,
    "acidic": 0.0,
    "acidResistant": false,
    "transitions": [],
    "reactions": [],
    "onUpdate": "",
    "toolOnDraw": "",
    "_delete": false
  }
]

=== STATE OF MATTER ===
- "solid" + gravity:false = Static solid block (Wall, Iron, Wood, Brick)
- "solid" + gravity:true  = Powder/granular (Sand, Dirt, Rust, Gravel, Salt)
- "liquid" + gravity:true = Flowing liquid (Water, Oil, Syrup, Blood). Use "dispersion" for flow speed.
- "gas"                   = Floats upward, dissipates over time (Smoke, Steam, Methane)
- "tool"                  = Invisible brush, no pixels. REQUIRES "toolOnDraw" JS function body.
- Custom type (e.g. "plasma") = No built-in physics. REQUIRES "onUpdate" to handle ALL movement.

=== REFERENCE SCALES ===
Density (determines sinking order): Smoke=0.1, Steam=0.05, Oil=0.8, Water=1.0, Sand=2.0, Lava=3.0, Stone=5.0, Iron=7.8, Gold=19.3
Dispersion (liquid flow speed): 0=no flow, 1=honey/lava, 2=syrup, 3=water, 4=alcohol, 5=very thin
ThermalConductivity: 0.01=insulator(wood,rubber), 0.05=normal(stone,dirt), 0.1=conductor(water), 0.2=metal
Temperature (°F): Absolute zero=-460, Frozen=0, Room=70, Boiling water=212, Wood ignites=451, Fire=1000, Lava=2000, Iron melts=2800

=== TRANSITIONS (temperature-based phase changes) ===
Format: { "type": "HOT"|"COLD", "threshold": tempInF, "becomes": "ELEMENT_IDNAME" }
Example: Ice melts at 32°F → { "type": "HOT", "threshold": 32, "becomes": "WATER" }

=== REACTIONS (touch-based) ===
Format: { "touches": "ELEMENT_IDNAME"|"ANY", "turnSelfInto": "IDNAME"|"EMPTY"|"EXPLODE", "turnOtherInto": "IDNAME"|"EMPTY", "chance": 0.0-1.0 }
"EMPTY" = destroy pixel. "EXPLODE" = big explosion. Use low chance (0.01-0.1) for gradual reactions.

=== SPECIAL PROPERTIES ===
- "conductive": true = Carries electricity through stateGrid. Glows cyan when active.
- "growthRate": 0.01-0.5 = For type "plant". How fast it spreads per frame.
- "growsOn": ["WATER","DIRT"] = For type "plant". Only grows adjacent to these elements.
- "behavior": "wander"|"crawl"|"fly" = For type "life". Controls AI creature movement.
- "acidic": 0.0-1.0 = Chance per frame to dissolve non-acidResistant neighbors.

=== WRITING onUpdate CODE ===
Runs per-pixel per-frame. Signature: (x, y, i, grid, stateGrid, tempGrid, ELEMENTS, WIDTH, HEIGHT, getIndex, swap, updated, Math)
Available: getIndex(x,y) returns idx or -1. swap(i,j) swaps two cells. Set updated[idx]=1 after modifying grid[idx].
Read custom props via ELEMENTS[grid[i]].myProp. Access neighbors: getIndex(x+1,y), getIndex(x-1,y), getIndex(x,y-1), getIndex(x,y+1).
MUST be a SINGLE LINE string (no literal newlines). Use semicolons to separate statements.
Example onUpdate for a bouncing particle: "var below=getIndex(x,y+1); if(below!==-1 && grid[below]===0){swap(i,below);}else{var side=getIndex(x+(Math.random()>0.5?1:-1),y-1); if(side!==-1 && grid[side]===0){swap(i,side);}}"

=== WRITING toolOnDraw CODE ===
Runs per-pixel-in-brush when user drags. Signature: (x, y, idx, grid, stateGrid, tempGrid, ELEMENTS, WIDTH, HEIGHT, getIndex, swap, updated, Math)
Example toolOnDraw for a "Super Heat" tool: "tempGrid[idx] = Math.min(3000, tempGrid[idx] + 500);"

=== FEW-SHOT EXAMPLES ===
Iron (static metal): {"name":"Iron","idName":"IRON","color":[106,106,106],"uiColor":"#6a6a6a","type":"solid","gravity":false,"flammable":false,"defaultTemp":70,"density":7.8,"dispersion":0,"thermalConductivity":0.2,"conductive":true,"acidic":0.0,"acidResistant":false,"transitions":[{"type":"HOT","threshold":2800,"becomes":"LAVA"}],"reactions":[{"touches":"WATER","turnSelfInto":"RUST","turnOtherInto":"WATER","chance":0.001}]}
Rust (powder): {"name":"Rust","idName":"RUST","color":[183,65,14],"uiColor":"#b7410e","type":"solid","gravity":true,"flammable":false,"defaultTemp":70,"density":5.2,"dispersion":0,"thermalConductivity":0.05}
Oil (flammable liquid): {"name":"Oil","idName":"OIL","color":[60,40,10],"uiColor":"#3c280a","type":"liquid","gravity":true,"flammable":true,"defaultTemp":70,"density":0.8,"dispersion":2,"thermalConductivity":0.03,"transitions":[{"type":"HOT","threshold":550,"becomes":"FIRE"}]}

=== CRITICAL RULES ===
1. NO COMMENTS in JSON. Must parse with JSON.parse().
2. REALISM by default. Use real-world physics values.
3. NO MULTILINE STRINGS. onUpdate/toolOnDraw must be ONE LINE.
4. NEVER output an "id" field. The engine assigns IDs.
5. UNIQUE idNames. Don't reuse existing names unless editing.
6. NO HALLUCINATED ELEMENTS in transitions/reactions. Only reference existing elements (${elList}) or ones you define in the SAME array.
7. Omit onUpdate for simple elements that don't need custom behavior — the engine handles gravity, flow, reactions, and transitions automatically!
8. Custom properties: Add any extra field to the JSON. Read it in onUpdate via ELEMENTS[grid[i]].fieldName.
9. OUTPUT THE JSON ARRAY IMMEDIATELY. NO PREAMBLE.`;
}

let messages = [];

function resetChat() {
    messages = [
        { role: "system", content: getSystemPrompt() },
        { role: "assistant", content: "What would you like to create? (e.g. Acid, C4, Slime). I'll invent the physics and build it immediately!" }
    ];
    chatBox.innerHTML = '';
    addMsg(messages[1].content, "system");
}
resetChat();

let aiRetryCount = 0;
const MAX_AI_RETRIES = 2;

async function runAI() {
    const apiKey = keyInput.value.trim();
    if (!apiKey) {
        addMsg("Please enter an OpenRouter API key above first!", "system");
        return;
    }

    addMsg("Thinking...", "system");
    btn.disabled = true;
    
    try {
        let data = null;
        let lastError = null;
        let usedModel = FALLBACK_MODELS[currentModelIndex];

        for (let attempt = 0; attempt < FALLBACK_MODELS.length; attempt++) {
            usedModel = FALLBACK_MODELS[currentModelIndex];
            try {
                const response = await fetch(AI_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: usedModel,
                        messages: messages
                    })
                });

                data = await response.json();
                if (data.error) throw new Error(data.error.message || "API Error");
                
                // Success! We can stop trying
                break;
            } catch (e) {
                lastError = e;
                const failedModel = usedModel.split('/').pop().split(':')[0];
                console.warn(`Model ${usedModel} failed:`, e.message);
                data = null;
                // Move to next model
                currentModelIndex = (currentModelIndex + 1) % FALLBACK_MODELS.length;
                addMsg(`⚠ ${failedModel} failed, switching to ${FALLBACK_MODELS[currentModelIndex].split('/').pop().split(':')[0]}...`, "system");
            }
        }

        if (!data) {
            throw new Error(`All models failed. Last error: ${lastError.message}`);
        }

        // Remove the "Thinking..." message (and any fallback messages)
        if (chatBox.lastChild) chatBox.removeChild(chatBox.lastChild);

        let reply = data.choices[0].message.content.trim();
        messages.push({ role: "assistant", content: reply });

        // Check if reply contains JSON
        let jsonStr = reply;
        const match = reply.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
        if (match) {
            jsonStr = match[1].trim();
        } else {
            // Fallback: find first [ and last ] or first { and last }
            const startArr = reply.indexOf('[');
            const endArr = reply.lastIndexOf(']');
            const startObj = reply.indexOf('{');
            const endObj = reply.lastIndexOf('}');
            
            if (startArr !== -1 && endArr !== -1 && endArr > startArr && (startObj === -1 || startArr < startObj)) {
                jsonStr = reply.substring(startArr, endArr + 1);
            } else if (startObj !== -1 && endObj !== -1 && endObj > startObj) {
                jsonStr = reply.substring(startObj, endObj + 1);
            }
        }
        
        // Clean single line comments just in case the AI hallucinated them
        jsonStr = jsonStr.replace(/\/\/.*$/gm, '');

        try {
            const configs = JSON.parse(jsonStr);
            let configsArray = Array.isArray(configs) ? configs : [configs];
            
            let names = [];
            for (let config of configsArray) {
                if (config.idName) {
                    try {
                        window.injectElement(config);
                        names.push(config.name || config.idName);
                    } catch (compileError) {
                        if (aiRetryCount < MAX_AI_RETRIES) {
                            aiRetryCount++;
                            addMsg(`Compilation Error: ${compileError.message}. Asking AI to fix... (retry ${aiRetryCount}/${MAX_AI_RETRIES})`, "system");
                            messages.push({ role: "user", content: `Your JSON caused a compilation error: ${compileError.message}. Please check your syntax in onUpdate/toolOnDraw and provide the corrected JSON.` });
                            setTimeout(runAI, 100);
                            return;
                        } else {
                            addMsg(`Failed after ${MAX_AI_RETRIES} retries: ${compileError.message}`, "system");
                            aiRetryCount = 0;
                        }
                    }
                }
            }
            if (names.length > 0) {
                addMsg(`✓ Built: ${names.join(', ')}`, "system");
                aiRetryCount = 0;
                btn.disabled = false;
                return;
            }
        } catch (e) {
            // If it failed to parse, it might have been just a chat message OR malformed JSON
            if (reply.includes('{') || reply.includes('[')) {
                if (aiRetryCount < MAX_AI_RETRIES) {
                    aiRetryCount++;
                    addMsg(`JSON Parse Error. Asking AI to fix... (retry ${aiRetryCount}/${MAX_AI_RETRIES})`, "system");
                    messages.push({ role: "user", content: `Your response was not valid JSON: ${e.message}. Do not include markdown text or comments (//). Output ONLY raw JSON.` });
                    setTimeout(runAI, 100);
                    return;
                } else {
                    addMsg(`Failed to parse JSON after ${MAX_AI_RETRIES} retries.`, "system");
                    aiRetryCount = 0;
                }
            }
        }
        
        addMsg(reply, "system");
        
    } catch (err) {
        console.error(err);
        if (chatBox.lastChild) chatBox.removeChild(chatBox.lastChild); // Remove thinking
        addMsg(`Error: ${err.message}`, "system");
        // Remove the failed assistant message if one was pushed
        if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
            messages.pop();
        }
    } finally {
        btn.disabled = false;
    }
}

btn.addEventListener('click', () => {
    const answer = promptInput.value.trim();
    if (!answer) return;
    
    addMsg(answer, "user");
    promptInput.value = '';
    messages.push({ role: "user", content: answer });
    
    runAI();
});

promptInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') btn.click();
});
