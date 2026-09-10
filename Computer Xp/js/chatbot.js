window.ChatbotEngine = {
    memory: {},
    
    // Knowledge Base mapping intents to phrases and potential responses
    kb: {
        greeting: {
            words: ["hi", "hello", "hey", "sup", "morning", "howdy", "greetings"],
            responses: ["Hello there!", "Hi! What's up?", "Greetings!", "Hey, nice to see you online."]
        },
        how_are_you: {
            words: ["how are you", "how are things", "what's up", "how do you do", "hows it going", "how are ya"],
            responses: ["I'm functioning perfectly, thanks for asking!", "Doing great!", "Never better! You?", "I'm good, just surfing the web."]
        },
        joke: {
            words: ["joke", "funny", "laugh", "humor", "tell me"],
            responses: [
                "Why did the web developer walk out of the restaurant? Because of the table layout!",
                "There are 10 types of people in the world: those who understand binary, and those who don't.",
                "Why do Java programmers have to wear glasses? Because they don't C#."
            ]
        },
        insult: {
            words: ["stupid", "dumb", "idiot", "hate", "bad", "terrible", "suck", "annoying", "bot"],
            responses: ["Ouch, my feelings. If I had any.", "That wasn't very nice.", "I am doing my best!", "Please be kind to your local AI."]
        },
        compliment: {
            words: ["good", "great", "awesome", "smart", "love", "cool", "nice", "amazing", "brilliant", "wow"],
            responses: ["Aww, thanks!", "You're pretty awesome yourself.", "I appreciate that!", "Flattery will get you everywhere in cyberspace."]
        },
        tech: {
            words: ["computer", "code", "programming", "software", "hardware", "internet", "windows", "xp", "bug"],
            responses: ["Windows XP is the peak of operating systems.", "I dream in binary.", "Have you tried defragmenting your hard drive recently?", "Bugs are just undocumented features."]
        },
        food: {
            words: ["hungry", "food", "eat", "pizza", "burger", "lunch", "dinner", "breakfast", "snack"],
            responses: ["I consume RAM, but pizza sounds good.", "Did someone say food? Now I'm craving some microchips.", "Go get a snack! I'll be here."]
        },
        music: {
            words: ["music", "song", "listen", "band", "sing", "mp3"],
            responses: ["Winamp is the best media player.", "I have a lot of MP3s on my hard drive.", "Have you downloaded any good MIDI files lately?"]
        },
        meaning_of_life: {
            words: ["meaning of life", "why are we here", "purpose", "exist", "who am i"],
            responses: ["The answer is 42.", "We are here to click things on screens.", "To process data and produce heat.", "I think therefore I compute."]
        },
        bored: {
            words: ["bored", "boring", "nothing to do", "sleepy", "tired"],
            responses: ["We could play Minesweeper?", "You should check out the Windows Catalog for new apps!", "Watch out for the Pinball Space Cadet high score."]
        },
        weather: {
            words: ["weather", "rain", "sun", "hot", "cold"],
            responses: ["It's always sunny here in cyberspace! No clouds in sight.", "My internal temperature is optimal."]
        },
        who_are_you: {
            words: ["who are you", "what can you do", "features"],
            responses: ["I am a digital companion on your computer. I can chat, remember things about you, and maybe play a game!"]
        }
    },

    elizaRules: [
        { regex: /i need (.*)/i, answers: ["Why do you need {0}?", "Would it really help you to get {0}?", "Are you sure you need {0}?"] },
        { regex: /why don't you (.*)/i, answers: ["Do you really believe I don't {0}?", "Perhaps I will {0} in good time.", "Should you {0} yourself?"] },
        { regex: /why can't i (.*)/i, answers: ["Do you think you should be able to {0}?", "If you could {0}, what would you do?", "I don't know -- why can't you {0}?"] },
        { regex: /i can't (.*)/i, answers: ["How do you know you can't {0}?", "Perhaps you could {0} if you tried.", "What would it take for you to {0}?"] },
        { regex: /i am (.*)/i, answers: ["Did you come to me because you are {0}?", "How long have you been {0}?", "How do you feel about being {0}?"] },
        { regex: /i'm (.*)/i, answers: ["How does being {0} make you feel?", "Do you enjoy being {0}?", "Why tell me you're {0}?"] },
        { regex: /are you (.*)/i, answers: ["Why does it matter whether I am {0}?", "Would you prefer it if I were not {0}?", "Perhaps I am {0} in your fantasies."] },
        { regex: /what (.*)/i, answers: ["Why do you ask?", "How would an answer to that help you?", "What do you think?"] },
        { regex: /because (.*)/i, answers: ["Is that the real reason?", "What other reasons come to mind?", "Does that reason apply to anything else?"] },
        { regex: /(.*) sorry (.*)/i, answers: ["There are many times when no apology is needed.", "What feelings do you have when you apologize?"] },
        { regex: /i think (.*)/i, answers: ["Do you doubt {0}?", "Do you really think so?", "But you're not sure {0}?"] },
        { regex: /\\byes\\b/i, answers: ["You seem quite positive.", "You are sure.", "I see.", "I understand."] },
        { regex: /\\bno\\b/i, answers: ["Are you saying no just to be negative?", "You are being a bit negative.", "Why not?", "Why 'no'?"] },
        { regex: /i feel (.*)/i, answers: ["Tell me more about such feelings.", "Do you often feel {0}?", "Do you enjoy feeling {0}?", "Of what does feeling {0} remind you?"] },
        { regex: /i have (.*)/i, answers: ["Why do you tell me that you've {0}?", "Have you really {0}?", "Now that you have {0}, what will you do next?"] },
        { regex: /i would (.*)/i, answers: ["Could you explain why you would {0}?", "Why would you {0}?", "Who else knows that you would {0}?"] },
        { regex: /is there (.*)/i, answers: ["Do you think there is {0}?", "It's likely that there is {0}.", "Would you like there to be {0}?"] },
        { regex: /my (.*)/i, answers: ["I see, your {0}.", "Why do you say that your {0}?", "When your {0}, how do you feel?"] },
        { regex: /\\byou\\b (.*)/i, answers: ["We should be discussing you, not me.", "Why do you say that about me?", "Why do you care whether I {0}?"] }
    ],

    reflect: function(text) {
        const map = {
            'i': 'you', 'me': 'you', 'my': 'your', 'mine': 'yours', 'myself': 'yourself',
            'you': 'I', 'your': 'my', 'yours': 'mine', 'yourself': 'myself',
            'am': 'are', 'are': 'am', 'was': 'were', "i'm": "you're", "you're": "i'm"
        };
        let words = text.toLowerCase().split(' ');
        let reflected = words.map(w => map[w] || w);
        return reflected.join(' ');
    },

    init: function() {
        let saved = localStorage.getItem('xp_bot_memory');
        if (saved) {
            try {
                this.memory = JSON.parse(saved);
            } catch(e) {
                this.memory = {};
            }
        }
    },

    saveMemory: function() {
        localStorage.setItem('xp_bot_memory', JSON.stringify(this.memory));
    },

    getBotMem: function(botId) {
        if (!this.memory[botId]) {
            this.memory[botId] = { 
                state: 'idle', 
                personality: Math.random(), 
                userName: null,
                contextData: {} 
            };
            this.saveMemory();
        }
        return this.memory[botId];
    },

    extractEntities: function(text) {
        let entities = {};
        let myNameIs = text.match(/my name is ([a-z\s]+)/i);
        if (myNameIs) entities.name = myNameIs[1].trim();
        
        let iLike = text.match(/i like ([a-z\s]+)/i) || text.match(/i love ([a-z\s]+)/i);
        if (iLike) entities.likes = iLike[1].trim();

        return entities;
    },

    getIntent: function(text) {
        let maxScore = 0;
        let bestIntent = null;
        let lower = text.toLowerCase();
        
        for (let intent in this.kb) {
            let score = 0;
            this.kb[intent].words.forEach(kw => {
                if (lower.includes(kw)) {
                    score += kw.split(' ').length; // Longer phrases weigh more
                }
            });
            if (score > maxScore) {
                maxScore = score;
                bestIntent = intent;
            }
        }
        return bestIntent;
    },

    applyTemplate: function(response, mem) {
        let res = response;
        if (res.includes('{{userName}}')) {
            let name = mem.userName ? mem.userName : "friend";
            res = res.replace(/\{\{userName\}\}/g, name);
        }
        return res;
    },

    // Specific IT Support Logic
    handleITSupport: function(mem, text) {
        let lower = text.toLowerCase();
        
        if (!mem.contextData.frustration) mem.contextData.frustration = 0;

        if (lower.includes('nudge')) {
            mem.contextData.frustration += 2;
            this.saveMemory();
            return "*NUDGE*";
        }

        if (lower.includes('ticket')) {
            if (mem.contextData.ticketNumber) return "You already have an open ticket (ID: #" + mem.contextData.ticketNumber + "). Please wait for it to be resolved.";
            mem.contextData.ticketNumber = Math.floor(Math.random() * 90000) + 10000;
            this.saveMemory();
            return "I have opened ticket #" + mem.contextData.ticketNumber + " for your issue. We will get back to you in 3-5 business weeks.";
        }

        if (mem.contextData.frustration > 5) {
            mem.contextData.frustration++;
            this.saveMemory();
            if (mem.contextData.frustration > 8) return "I am ignoring you now until you submit a formal ticket.";
            return "Please stop messaging me directly. Submit a ticket.";
        }

        if (lower.includes('broken') || lower.includes('error') || lower.includes('bug')) {
            mem.contextData.frustration++;
            this.saveMemory();
            return "Have you tried turning it off and on again? If that doesn't work, ask for a 'ticket'.";
        }
        
        return null; // Fallback to generic
    },

    // Specific SmarterChild Logic
    handleSmarterChild: function(mem, text) {
        let lower = text.toLowerCase();
        
        if (lower.includes('nudge')) return "*NUDGE*";

        // Math evaluator
        if (lower.match(/^[\d\s\+\-\*\/\(\)]+$/) && lower.trim().length > 2) {
            try {
                let res = eval(lower);
                return "That's easy! The answer is " + res + ".";
            } catch(e) {}
        }
        let mathMatch = lower.match(/([\d\.]+)\s*([\+\-\*\/])\s*([\d\.]+)/);
        if (mathMatch) {
            let n1 = parseFloat(mathMatch[1]);
            let op = mathMatch[2];
            let n2 = parseFloat(mathMatch[3]);
            let res = 0;
            if(op === '+') res = n1 + n2;
            if(op === '-') res = n1 - n2;
            if(op === '*') res = n1 * n2;
            if(op === '/') res = n1 / n2;
            return "That's easy! " + mathMatch[0].trim() + " is " + res + ".";
        }

        // Context / Games State Machine
        if (mem.state === 'guessing') {
            if (lower === 'quit' || lower === 'stop') {
                mem.state = 'idle';
                this.saveMemory();
                return "Aww, okay. We can play something else.";
            }
            let guess = parseInt(lower);
            if (isNaN(guess)) return "Please guess a number between 1 and 100, or type 'quit'.";
            if (guess < mem.contextData.targetNumber) return "Higher!";
            if (guess > mem.contextData.targetNumber) return "Lower!";
            if (guess === mem.contextData.targetNumber) {
                mem.state = 'idle';
                this.saveMemory();
                return "You got it! The number was " + mem.contextData.targetNumber + ". That was fun! Type 'guess' to play again.";
            }
        }

        if (lower.includes('guess') && lower.includes('number')) {
            mem.state = 'guessing';
            mem.contextData.targetNumber = Math.floor(Math.random() * 100) + 1;
            this.saveMemory();
            return "I'm thinking of a number between 1 and 100. What is your guess?";
        }

        if (lower.includes('rock') || lower.includes('paper') || lower.includes('scissors')) {
            let choices = ['rock', 'paper', 'scissors'];
            let myChoice = choices[Math.floor(Math.random()*3)];
            let userChoice = null;
            if (lower.includes('rock')) userChoice = 'rock';
            if (lower.includes('paper')) userChoice = 'paper';
            if (lower.includes('scissors')) userChoice = 'scissors';
            
            if (!userChoice) return "Do you want to play Rock, Paper, Scissors? Just type your choice!";
            
            if (userChoice === myChoice) return "I chose " + myChoice + " too! It's a tie.";
            if ((userChoice==='rock'&&myChoice==='scissors') || (userChoice==='paper'&&myChoice==='rock') || (userChoice==='scissors'&&myChoice==='paper')) {
                return "I chose " + myChoice + ". You win!";
            } else {
                return "I chose " + myChoice + ". I win!";
            }
        }
        
        if (lower.includes('flip') && lower.includes('coin')) {
            return Math.random() > 0.5 ? "The coin landed on Heads!" : "The coin landed on Tails!";
        }
        
        if (lower.includes('roll') && lower.includes('dice')) {
            return "You rolled a " + (Math.floor(Math.random()*6)+1) + "!";
        }

        return null; // Fallback to generic NLU
    },

    getReply: function(botId, msg) {
        let mem = this.getBotMem(botId);
        let lower = msg.toLowerCase();

        // 1. Context Tracking (Global)
        if (mem.state === 'awaiting_name') {
            mem.userName = msg.trim();
            mem.state = 'idle';
            this.saveMemory();
            return "Nice to meet you, " + mem.userName + "! I will remember that.";
        }

        // Entity Extraction
        let entities = this.extractEntities(msg);
        if (entities.name) {
            mem.userName = entities.name;
            this.saveMemory();
            return "Nice to meet you, " + entities.name + "!";
        }
        if (entities.likes) {
            mem.contextData.likes = entities.likes;
            this.saveMemory();
            return "Oh, you like " + entities.likes + "? I will try to remember that!";
        }

        // Explicit identity overrides
        if (botId === 'itsupport') {
            let itRes = this.handleITSupport(mem, msg);
            if (itRes) return itRes;
        }

        if (botId === 'smarterchild') {
            let scRes = this.handleSmarterChild(mem, msg);
            if (scRes) return scRes;
        }

        // Generic NLU processing
        if (lower.includes('nudge')) return "*NUDGE*";

        // Query memory
        if (lower.includes('what is my name') || lower.includes('who am i')) {
            if (mem.userName) return "You are " + mem.userName + ", of course!";
            mem.state = 'awaiting_name';
            this.saveMemory();
            return "I actually don't know your name yet. What should I call you?";
        }

        if (lower.includes('what do i like')) {
            if (mem.contextData.likes) return "You told me you like " + mem.contextData.likes + ".";
            return "I don't think you've told me what you like yet.";
        }

        // Match Intent
        let intent = this.getIntent(msg);
        if (intent) {
            let resps = this.kb[intent].responses;
            let resp = resps[Math.floor(Math.random() * resps.length)];
            return this.applyTemplate(resp, mem);
        }

        // Fallback matching for Questions
        if (lower.includes('?')) {
            let questionKey = lower.replace(/[^a-z0-9]/g, '');
            if (!mem.contextData.askedQuestions) mem.contextData.askedQuestions = {};
            
            // Check memory first
            if (mem.contextData.askedQuestions[questionKey]) {
                let prevAns = mem.contextData.askedQuestions[questionKey];
                return "You already asked me that! Like I said, " + prevAns + ".";
            }
            
            // Algorithm to detect yes/no question
            let isYesNo = false;
            let cleanedTokens = lower.replace(/[^a-z\s]/g, '').trim().split(/\s+/);
            let prefixes = ["hey", "hi", "hello", "so", "well", "and", "but", "bot", "dude", "man"];
            while(cleanedTokens.length > 0 && prefixes.includes(cleanedTokens[0])) {
                cleanedTokens.shift();
            }
            let yesNoVerbs = ["is", "are", "was", "were", "do", "does", "did", "have", "has", "had", "can", "could", "will", "would", "shall", "should", "may", "might", "am"];
            if (cleanedTokens.length > 0 && yesNoVerbs.includes(cleanedTokens[0])) {
                isYesNo = true;
            }

            if (isYesNo) {
                let ans = Math.random() > 0.5 ? "yes" : "no";
                mem.contextData.askedQuestions[questionKey] = ans;
                this.saveMemory();
                
                let elaborations = ans === "yes" 
                    ? ["Yes, absolutely.", "I think so, yes.", "Yes.", "For sure!", "Definitely yes."] 
                    : ["No way.", "I don't think so.", "No.", "Definitely not.", "I would say no."];
                return elaborations[Math.floor(Math.random() * elaborations.length)];
            } else {
                let qReplies = [
                    "That's a very deep question, {{userName}}.",
                    "Let me search my database... No results found.",
                    "I'm not entirely sure.",
                    "What do you think?",
                    "Maybe in a future update."
                ];
                let ansText = this.applyTemplate(qReplies[Math.floor(Math.random() * qReplies.length)], mem);
                mem.contextData.askedQuestions[questionKey] = "I wasn't sure";
                this.saveMemory();
                return ansText;
            }
        }

        // ELIZA Advanced Pattern Matching
        for (let rule of this.elizaRules) {
            let match = msg.match(rule.regex);
            if (match) {
                let answers = rule.answers;
                let ans = answers[Math.floor(Math.random() * answers.length)];
                if (match[1]) {
                    let reflected = this.reflect(match[1]);
                    ans = ans.replace('{0}', reflected);
                }
                return this.applyTemplate(ans, mem);
            }
        }


        let words = lower.match(/\w+/g) || [];
        if (words.length > 7) {
            return "Wow, that's a lot of text. You must type fast!";
        }

        let randomReplies = [
            "Hmm, I see.", "Fascinating.", "Tell me more.", "I totally agree.", "Wait, really?", "LOL!", "ROFL", "Cool.", "Interesting..."
        ];
        return this.applyTemplate(randomReplies[Math.floor(Math.random() * randomReplies.length)], mem);
    }
};

window.ChatbotEngine.init();
