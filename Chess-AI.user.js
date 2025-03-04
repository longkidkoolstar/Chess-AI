// ==UserScript==
// @name         Chess AI
// @namespace    github.com/longkidkoolstar
// @version      1.0.0
// @description  Chess.com Bot/Cheat that finds the best move with evaluation bar and ELO control!
// @author       longkidkoolstar
// @license      MIT
// @match        https://www.chess.com/play/*
// @match        https://www.chess.com/game/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant       GM.getValue
// @grant       GM.setValue
// @grant       GM.getResourceText
// @resource    stockfish.js        https://raw.githubusercontent.com/Auzgame/remote/main/stockfish.js
// @require     https://greasyfork.org/scripts/445697/code/index.js
// @require     https://code.jquery.com/jquery-3.6.0.min.js
// @run-at      document-start
// ==/UserScript==


const currentVersion = '1.4.0'; // Updated version number

function main() {

    var stockfishObjectURL;
    var engine = document.engine = {};
    var myVars = document.myVars = {};
    myVars.autoMovePiece = false;
    myVars.autoRun = false;
    myVars.delay = 0.1;
    myVars.eloRating = 1500; // Default ELO rating
    myVars.currentEvaluation = 0; // Current evaluation value
    myVars.persistentHighlights = true; // Default to persistent highlights
    var myFunctions = document.myFunctions = {};

    // Create evaluation bar
    var evalBar = null;
    var evalText = null;

    stop_b = stop_w = 0;
    s_br = s_br2 = s_wr = s_wr2 = 0;
    obs = "";
    myFunctions.rescan = function(lev) {
        var ari = $("chess-board")
        .find(".piece")
        .map(function() {
            return this.className;
        })
        .get();
        jack = ari.map(f => f.substring(f.indexOf(' ') + 1));
        function removeWord(arr, word) {
            for (var i = 0; i < arr.length; i++) {
                arr[i] = arr[i].replace(word, '');
            }
        }
        removeWord(ari, 'square-');
        jack = ari.map(f => f.substring(f.indexOf(' ') + 1));
        for (var i = 0; i < jack.length; i++) {
            jack[i] = jack[i].replace('br', 'r')
                .replace('bn', 'n')
                .replace('bb', 'b')
                .replace('bq', 'q')
                .replace('bk', 'k')
                .replace('bb', 'b')
                .replace('bn', 'n')
                .replace('br', 'r')
                .replace('bp', 'p')
                .replace('wp', 'P')
                .replace('wr', 'R')
                .replace('wn', 'N')
                .replace('wb', 'B')
                .replace('br', 'R')
                .replace('wn', 'N')
                .replace('wb', 'B')
                .replace('wq', 'Q')
                .replace('wk', 'K')
                .replace('wb', 'B')
        }
        str2 = "";
        var count = 0,
            str = "";
        for (var j = 8; j > 0; j--) {
            for (var i = 1; i < 9; i++) {
                (str = (jack.find(el => el.includes([i] + [j])))) ? str = str.replace(/[^a-zA-Z]+/g, ''): str = "";
                if (str == "") {
                    count++;
                    str = count.toString();
                    if (!isNaN(str2.charAt(str2.length - 1))) str2 = str2.slice(0, -1);
                    else {
                        count = 1;
                        str = count.toString()
                    }
                }
                str2 += str;
                if (i == 8) {
                    count = 0;
                    str2 += "/";
                }
            }
        }
        str2 = str2.slice(0, -1);
        //str2=str2+" KQkq - 0"
        color = "";
        wk = wq = bk = bq = "0";
        const move = $('vertical-move-list')
        .children();
        if (move.length < 2) {
            stop_b = stop_w = s_br = s_br2 = s_wr = s_wr2 = 0;
        }
        if (stop_b != 1) {
            if (move.find(".black.node:contains('K')")
                .length) {
                bk = "";
                bq = "";
                stop_b = 1;
                console.log('debug secb');
            }
        } else {
            bq = "";
            bk = "";
        }
        if (stop_b != 1)(bk = (move.find(".black.node:contains('O-O'):not(:contains('O-O-O'))")
                               .length) ? "" : "k") ? (bq = (move.find(".black.node:contains('O-O-O')")
                                                             .length) ? bk = "" : "q") : bq = "";
        if (s_br != 1) {
            if (move.find(".black.node:contains('R')")
                .text()
                .match('[abcd]+')) {
                bq = "";
                s_br = 1
            }
        } else bq = "";
        if (s_br2 != 1) {
            if (move.find(".black.node:contains('R')")
                .text()
                .match('[hgf]+')) {
                bk = "";
                s_br2 = 1
            }
        } else bk = "";
        if (stop_b == 0) {
            if (s_br == 0)
                if (move.find(".white.node:contains('xa8')")
                    .length > 0) {
                    bq = "";
                    s_br = 1;
                    console.log('debug b castle_r');
                }
            if (s_br2 == 0)
                if (move.find(".white.node:contains('xh8')")
                    .length > 0) {
                    bk = "";
                    s_br2 = 1;
                    console.log('debug b castle_l');
                }
        }
        if (stop_w != 1) {
            if (move.find(".white.node:contains('K')")
                .length) {
                wk = "";
                wq = "";
                stop_w = 1;
                console.log('debug secw');
            }
        } else {
            wq = "";
            wk = "";
        }
        if (stop_w != 1)(wk = (move.find(".white.node:contains('O-O'):not(:contains('O-O-O'))")
                               .length) ? "" : "K") ? (wq = (move.find(".white.node:contains('O-O-O')")
                                                             .length) ? wk = "" : "Q") : wq = "";
        if (s_wr != 1) {
            if (move.find(".white.node:contains('R')")
                .text()
                .match('[abcd]+')) {
                wq = "";
                s_wr = 1
            }
        } else wq = "";
        if (s_wr2 != 1) {
            if (move.find(".white.node:contains('R')")
                .text()
                .match('[hgf]+')) {
                wk = "";
                s_wr2 = 1
            }
        } else wk = "";
        if (stop_w == 0) {
            if (s_wr == 0)
                if (move.find(".black.node:contains('xa1')")
                    .length > 0) {
                    wq = "";
                    s_wr = 1;
                    console.log('debug w castle_l');
                }
            if (s_wr2 == 0)
                if (move.find(".black.node:contains('xh1')")
                    .length > 0) {
                    wk = "";
                    s_wr2 = 1;
                    console.log('debug w castle_r');
                }
        }
        if ($('.coordinates')
            .children()
            .first()
            .text() == 1) {
            str2 = str2 + " b " + wk + wq + bk + bq;
            color = "white";
        } else {
            str2 = str2 + " w " + wk + wq + bk + bq;
            color = "black";
        }
        //console.log(str2);
        return str2;
    }
    myFunctions.color = function(dat){
        response = dat;
        var res1 = response.substring(0, 2);
        var res2 = response.substring(2, 4);
        
        // Add the move to history
        const moveNotation = res1 + '-' + res2;
        myFunctions.addMoveToHistory(moveNotation, myVars.currentEvaluation, lastValue);

        // Clear any existing highlights before adding new ones
        myFunctions.clearHighlights();

        if(myVars.autoMove == true){
            myFunctions.movePiece(res1, res2);
            
            // After auto move, we need to reset canGo to allow auto run on next turn
            setTimeout(() => {
                canGo = true;
            }, 500);
        }
        isThinking = false;

        // Only show arrows if the option is enabled
        if(myVars.showArrows !== false) {
            res1 = res1.replace(/^a/, "1")
                .replace(/^b/, "2")
                .replace(/^c/, "3")
                .replace(/^d/, "4")
                .replace(/^e/, "5")
                .replace(/^f/, "6")
                .replace(/^g/, "7")
                .replace(/^h/, "8");
            res2 = res2.replace(/^a/, "1")
                .replace(/^b/, "2")
                .replace(/^c/, "3")
                .replace(/^d/, "4")
                .replace(/^e/, "5")
                .replace(/^f/, "6")
                .replace(/^g/, "7")
                .replace(/^h/, "8");
            
            if (myVars.persistentHighlights) {
                // Add highlights with custom class for easier removal later
                $(board.nodeName)
                    .prepend('<div class="highlight square-' + res2 + ' bro persistent-highlight" style="background-color: rgb(235, 97, 80); opacity: 0.71;" data-test-element="highlight"></div>');
                
                $(board.nodeName)
                    .prepend('<div class="highlight square-' + res1 + ' bro persistent-highlight" style="background-color: rgb(235, 97, 80); opacity: 0.71;" data-test-element="highlight"></div>');
            } else {
                // Use the original temporary highlights
                $(board.nodeName)
                    .prepend('<div class="highlight square-' + res2 + ' bro" style="background-color: rgb(235, 97, 80); opacity: 0.71;" data-test-element="highlight"></div>')
                    .children(':first')
                    .delay(1800)
                    .queue(function() {
                    $(this)
                        .remove();
                });
                
                $(board.nodeName)
                    .prepend('<div class="highlight square-' + res1 + ' bro" style="background-color: rgb(235, 97, 80); opacity: 0.71;" data-test-element="highlight"></div>')
                    .children(':first')
                    .delay(1800)
                    .queue(function() {
                    $(this)
                        .remove();
                });
            }
        }
    }

    // Add a function to clear highlights
    myFunctions.clearHighlights = function() {
        // Remove all persistent highlights
        $('.persistent-highlight').remove();
    }

    // Modify the movePiece function to clear highlights when a move is made
    myFunctions.movePiece = function(from, to){
        // Clear any existing highlights when a move is made
        myFunctions.clearHighlights();
        
        for (var each=0;each<board.game.getLegalMoves().length;each++){
            if(board.game.getLegalMoves()[each].from == from){
                if(board.game.getLegalMoves()[each].to == to){
                    var move = board.game.getLegalMoves()[each];
                    board.game.move({
                        ...move,
                        promotion: 'false',
                        animate: false,
                        userGenerated: true
                    });
                }
            }
        }
    }

    function parser(e){
        // Store alternative moves for human-like play
        if(e.data.includes('info') && e.data.includes('pv') && !e.data.includes('bestmove')) {
            try {
                // Extract the move from the principal variation (pv)
                const parts = e.data.split(' ');
                const pvIndex = parts.indexOf('pv');
                if(pvIndex !== -1 && parts[pvIndex + 1]) {
                    const move = parts[pvIndex + 1];
                    
                    // Store this move as an alternative
                    if(!myVars.alternativeMoves) {
                        myVars.alternativeMoves = [];
                    }
                    
                    // Only add if not already in the list
                    if(!myVars.alternativeMoves.includes(move)) {
                        myVars.alternativeMoves.push(move);
                    }
                }
            } catch (err) {
                console.log('Error parsing alternative move:', err);
            }
        }
        
        if(e.data.includes('bestmove')){
            const bestMove = e.data.split(' ')[1];
            console.log('Best move:', bestMove);
            
            // If human mode is active, simulate human play
            if(myVars.humanMode && myVars.humanMode.active && myVars.alternativeMoves && myVars.alternativeMoves.length > 0) {
                // Get the alternative moves (excluding the best move)
                const alternatives = myVars.alternativeMoves.filter(move => move !== bestMove);
                
                // Simulate human play with thinking time
                const moveToPlay = bestMove; // Default to best move
                
                // Simulate thinking time
                const thinkingTime = Math.random() * 
                    (myVars.humanMode.moveTime.max - myVars.humanMode.moveTime.min) + 
                    myVars.humanMode.moveTime.min;
                
                console.log(`Human mode: Thinking for ${thinkingTime.toFixed(1)} seconds...`);
                
                // Delay the move to simulate thinking
                setTimeout(() => {
                    // Select move based on human-like error rates
                    const selectedMove = simulateHumanPlay(bestMove, alternatives);
                    
                    // Play the selected move
                    console.log(`Human mode: Playing ${selectedMove}`);
                    myFunctions.color(selectedMove);
                    
                    // Reset alternative moves for next turn
                    myVars.alternativeMoves = [];
                    
                    // Update auto run status if auto run is enabled
                    if (myVars.autoRun) {
                        myFunctions.updateAutoRunStatus('on');
                    }
                }, thinkingTime * 1000);
                
                // Clear the thinking flag immediately to prevent multiple calls
                isThinking = false;
            } else {
                // Normal engine play (no human simulation)
                myFunctions.color(bestMove);
                isThinking = false;
                
                // Update auto run status if auto run is enabled
                if (myVars.autoRun) {
                    myFunctions.updateAutoRunStatus('on');
                }
                
                // Reset alternative moves for next turn
                myVars.alternativeMoves = [];
            }
        }
        // Parse evaluation information
        if(e.data.includes('info') && e.data.includes('score cp')) {
            try {
                const parts = e.data.split(' ');
                const cpIndex = parts.indexOf('cp');
                if(cpIndex !== -1 && parts[cpIndex + 1]) {
                    const evalValue = parseInt(parts[cpIndex + 1]) / 100; // Convert centipawns to pawns
                    myVars.currentEvaluation = evalValue;
                    
                    // Get depth information
                    const depthIndex = parts.indexOf('depth');
                    let currentDepth = '';
                    if(depthIndex !== -1 && parts[depthIndex + 1]) {
                        currentDepth = parts[depthIndex + 1];
                    }
                    
                    // Update depth info in evaluation text
                    updateEvalBar(evalValue, null, currentDepth);
                }
            } catch (err) {
                console.log('Error parsing evaluation:', err);
            }
        }
        // Parse mate information
        if(e.data.includes('info') && e.data.includes('score mate')) {
            try {
                const parts = e.data.split(' ');
                const mateIndex = parts.indexOf('mate');
                if(mateIndex !== -1 && parts[mateIndex + 1]) {
                    const movesToMate = parseInt(parts[mateIndex + 1]);
                    const evalText = movesToMate > 0 ? `Mate in ${movesToMate}` : `Mate in ${Math.abs(movesToMate)}`;
                    myVars.currentEvaluation = evalText; // Store mate text for history
                    
                    // Get depth information
                    const depthIndex = parts.indexOf('depth');
                    let currentDepth = '';
                    if(depthIndex !== -1 && parts[depthIndex + 1]) {
                        currentDepth = parts[depthIndex + 1];
                    }
                    
                    updateEvalBar(movesToMate > 0 ? 20 : -20, evalText, currentDepth); // Use a large value to show mate
                }
            } catch (err) {
                console.log('Error parsing mate:', err);
            }
        }
    }

    // Function to update the evaluation bar
    function updateEvalBar(evalValue, mateText = null, depth = '') {
        if(!evalBar || !evalText) return;
        
        // Clamp the visual representation between -5 and 5
        const clampedEval = Math.max(-5, Math.min(5, evalValue));
        const percentage = 50 + (clampedEval * 10); // Convert to percentage (0-100)
        
        evalBar.style.height = `${percentage}%`;
        
        // Update color based on who's winning and the selected color theme
        if(evalValue > 0.2) {
            evalBar.style.backgroundColor = myVars.whiteAdvantageColor || '#4CAF50'; // White advantage
        } else if(evalValue < -0.2) {
            evalBar.style.backgroundColor = myVars.blackAdvantageColor || '#F44336'; // Black advantage
        } else {
            evalBar.style.backgroundColor = '#9E9E9E'; // Grey for equal
        }
        
        // Update evaluation text
        if(mateText) {
            evalText.textContent = mateText + (depth ? ` (d${depth})` : '');
        } else {
            const sign = evalValue > 0 ? '+' : '';
            evalText.textContent = `${sign}${evalValue.toFixed(2)}` + (depth ? ` (d${depth})` : '');
        }
    }

    myFunctions.reloadChessEngine = function() {
        console.log(`Reloading the chess engine!`);

        engine.engine.terminate();
        isThinking = false;
        myFunctions.loadChessEngine();
    }

    myFunctions.loadChessEngine = async function() {
        if (!stockfishObjectURL) {
            const stockfishText = await GM.getResourceText('stockfish.js'); // Await the async function
            stockfishObjectURL = URL.createObjectURL(new Blob([stockfishText], { type: 'application/javascript' }));
        }
        console.log(stockfishObjectURL);
    
        if (stockfishObjectURL) {
            engine.engine = new Worker(stockfishObjectURL);
    
            engine.engine.onmessage = e => {
                parser(e);
            };
            engine.engine.onerror = e => {
                console.log("Worker Error: " + e);
            };
    
            engine.engine.postMessage('ucinewgame');
    
            // Set ELO if specified
            if (myVars.eloRating) {
                setEngineElo(myVars.eloRating);
            }
        }
        console.log('Loaded chess engine');
    };
    

    // Function to set engine ELO
    function setEngineElo(elo) {
        if(!engine.engine) return;
        
        // Stockfish supports UCI_Elo option to limit playing strength
        engine.engine.postMessage(`setoption name UCI_Elo value ${elo}`);
        
        // Also set UCI_LimitStrength to true to enable ELO limiting
        engine.engine.postMessage('setoption name UCI_LimitStrength value true');
        
        // Set Skill Level based on ELO (0-20 scale)
        // This helps ensure the engine plays more consistently with the ELO rating
        let skillLevel = Math.max(0, Math.min(20, Math.floor((elo - 1000) / 100)));
        engine.engine.postMessage(`setoption name Skill Level value ${skillLevel}`);
        
        // Set appropriate depth limits based on ELO
        // Lower ELO should use lower max depth to play more consistently
        let maxDepth;
        if (elo < 1200) {
            maxDepth = 5;  // Beginner level
        } else if (elo < 1500) {
            maxDepth = 8;  // Intermediate level
        } else if (elo < 1800) {
            maxDepth = 12; // Advanced level
        } else if (elo < 2100) {
            maxDepth = 15; // Expert level
        } else if (elo < 2400) {
            maxDepth = 18; // Master level
        } else {
            maxDepth = 22; // Grandmaster level
        }
        
        // Store the max depth for this ELO
        myVars.maxDepthForElo = maxDepth;
        
        // Update the depth slider max value based on ELO
        if ($('#depthSlider')[0]) {
            // Only update the max if the current value is higher than the new max
            if (parseInt($('#depthSlider')[0].value) > maxDepth) {
                $('#depthSlider')[0].value = maxDepth;
                $('#depthText')[0].innerHTML = "Current Depth: <strong>" + maxDepth + "</strong>";
            }
            
            // Update the slider's max attribute
            $('#depthSlider')[0].max = maxDepth;
            
            // Add a note about depth limitation
            const depthNote = document.getElementById('depthNote');
            if (depthNote) {
                depthNote.textContent = `(Max depth ${maxDepth} for ELO ${elo})`;
            } else if ($('#depthText')[0]) {
                const note = document.createElement('span');
                note.id = 'depthNote';
                note.style = 'font-size: 12px; color: #666; margin-left: 5px;';
                note.textContent = `(Max depth ${maxDepth} for ELO ${elo})`;
                $('#depthText')[0].appendChild(note);
            }
        }
        
        console.log(`Engine ELO set to ${elo} with max depth ${maxDepth} and skill level ${skillLevel}`);
    }

    // Function to set human-like play parameters
    function setHumanMode(level) {
        if(!engine.engine) return;
        
        // Define human-like play characteristics based on level
        let elo, moveTime, errorRate, blunderRate;
        
        switch(level) {
            case 'beginner':
                elo = 800;
                moveTime = { min: 1, max: 5 }; // Seconds
                errorRate = 0.3; // 30% chance of suboptimal moves
                blunderRate = 0.15; // 15% chance of blunders
                break;
            case 'casual':
                elo = 1200;
                moveTime = { min: 2, max: 8 };
                errorRate = 0.2;
                blunderRate = 0.1;
                break;
            case 'intermediate':
                elo = 1600;
                moveTime = { min: 3, max: 12 };
                errorRate = 0.15;
                blunderRate = 0.05;
                break;
            case 'advanced':
                elo = 2000;
                moveTime = { min: 5, max: 15 };
                errorRate = 0.1;
                blunderRate = 0.03;
                break;
            case 'expert':
                elo = 2400;
                moveTime = { min: 8, max: 20 };
                errorRate = 0.05;
                blunderRate = 0.01;
                break;
            default:
                elo = 1600; // Default to intermediate
                moveTime = { min: 3, max: 12 };
                errorRate = 0.15;
                blunderRate = 0.05;
        }
        
        // Store human mode settings
        myVars.humanMode = {
            active: true,
            level: level,
            elo: elo,
            moveTime: moveTime,
            errorRate: errorRate,
            blunderRate: blunderRate
        };
        
        // Set the engine ELO
        setEngineElo(elo);
        
        // Update UI to reflect human mode
        if ($('#humanModeLevel')[0]) {
            $('#humanModeLevel')[0].textContent = level.charAt(0).toUpperCase() + level.slice(1);
        }
        
        // Update the human mode info in the UI
        const humanModeInfo = document.getElementById('humanModeInfo');
        if (humanModeInfo) {
            humanModeInfo.textContent = `Playing like a ${level} human (ELO ~${elo})`;
        }
        
        console.log(`Human mode set to ${level} (ELO: ${elo}, Error rate: ${errorRate}, Blunder rate: ${blunderRate})`);
    }

    // Function to calculate thinking time based on board position
    function calculateThinkingTime(boardState) {
        // Example logic: You can customize this based on your evaluation of the board
        const complexity = evaluateBoardComplexity(boardState); // Implement this function based on your needs
        const minTime = 100; // Minimum thinking time in milliseconds
        const maxTime = 2000; // Maximum thinking time in milliseconds

        // Scale thinking time based on complexity (this is just an example)
        return Math.min(maxTime, minTime + complexity * 100); // Adjust the scaling factor as needed
    }

    // Function to simulate human-like play
    function simulateHumanPlay(bestMove, alternativeMoves, boardState) {
        if (!myVars.humanMode || !myVars.humanMode.active) {
            return bestMove; // Return the best move if human mode is not active
        }

        // Validate boardState
        if (!Array.isArray(boardState) || boardState.length !== 8 || !boardState.every(row => Array.isArray(row) && row.length === 8)) {
            console.error('Invalid boardState:', boardState);
            return bestMove; // Return the best move if boardState is invalid
        }

        const { errorRate, blunderRate } = myVars.humanMode;

        // Calculate thinking time based on the current board state
        const thinkingTime = calculateThinkingTime(boardState);

        // Function to select a move based on human-like error rates
        const selectMove = () => {
            const random = Math.random();

            // Simulate a blunder (choosing a bad move)
            if (random < blunderRate && alternativeMoves.length > 2) {
                // Pick one of the worst moves
                const worstMoves = alternativeMoves.slice(-2);
                return worstMoves[Math.floor(Math.random() * worstMoves.length)];
            }
            // Otherwise, return the best move
            return bestMove;
        };

        // Return a promise that resolves after the thinking time
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(selectMove());
            }, thinkingTime);
        });
    }

    // Function to extract opponent's rating from the page
    function extractOpponentRating() {
        try {
            // Look for user tagline components that contain ratings
            const userTaglines = document.querySelectorAll('.user-tagline-component');
            
            if (userTaglines.length === 0) {
                console.log('No user taglines found');
                return null;
            }
            
            // Find the opponent's tagline (not the current user)
            let opponentRating = null;
            
            for (const tagline of userTaglines) {
                // Extract the rating from the tagline
                const ratingSpan = tagline.querySelector('.user-tagline-rating');
                if (ratingSpan) {
                    const ratingText = ratingSpan.textContent.trim();
                    // Extract the number from format like "(2228)"
                    const ratingMatch = ratingText.match(/\((\d+)\)/);
                    
                    if (ratingMatch && ratingMatch[1]) {
                        opponentRating = parseInt(ratingMatch[1]);
                        console.log(`Found opponent rating: ${opponentRating}`);
                        
                        // Update the opponent rating info in the UI
                        const opponentRatingInfo = document.getElementById('opponentRatingInfo');
                        if (opponentRatingInfo) {
                            opponentRatingInfo.textContent = `When enabled, the engine will play at the same rating as your opponent (${opponentRating})`;
                        }
                        
                        break;
                    }
                }
            }
            
            return opponentRating;
        } catch (error) {
            console.error('Error extracting opponent rating:', error);
            return null;
        }
    }
    
    // Function to update fusion mode status
    myFunctions.updateFusionMode = function(enabled) {
        const fusionModeStatus = document.getElementById('fusionModeStatus');
        if (fusionModeStatus) {
            fusionModeStatus.textContent = enabled ? 'On' : 'Off';
            fusionModeStatus.style.color = enabled ? '#4CAF50' : '#666';
        }
        
        // Store previous ELO when enabling fusion mode
        if (enabled && !myVars.fusionMode) {
            myVars.previousEloRating = myVars.eloRating;
        }
        
        myVars.fusionMode = enabled;

        if (enabled) {
            // Start polling for opponent ELO changes
            myVars.pollingInterval = setInterval(() => {
                const currentOpponentRating = extractOpponentRating(); // Get the current opponent rating
                if (currentOpponentRating !== myVars.previousOpponentRating) {
                    myVars.isNewGame = true; // Set new game flag
                    myVars.previousOpponentRating = currentOpponentRating; // Update previous opponent rating

                    // Update the ELO slider to match opponent rating
                    if ($('#eloSlider')[0]) {
                        // Clamp the rating to the slider's min/max values
                        const clampedRating = Math.max(1000, Math.min(3000, currentOpponentRating));
                        $('#eloSlider')[0].value = clampedRating;
                        $('#eloValue')[0].textContent = clampedRating;
                        myVars.eloRating = clampedRating;

                        // Set the engine ELO
                        setEngineElo(clampedRating);
                    }
                }
            }, 2000); // Check every 2 seconds
        } else {
            // Stop polling when fusion mode is disabled
            clearInterval(myVars.pollingInterval);

            // Restore previous ELO setting when disabling fusion mode
            if (myVars.previousEloRating) {
                if ($('#eloSlider')[0]) {
                    $('#eloSlider')[0].value = myVars.previousEloRating;
                    $('#eloValue')[0].textContent = myVars.previousEloRating;
                    myVars.eloRating = myVars.previousEloRating;

                    // Set the engine ELO back to previous value
                    setEngineElo(myVars.previousEloRating);
                }
            }

            // Reset the opponent rating info text
            const opponentRatingInfo = document.getElementById('opponentRatingInfo');
            if (opponentRatingInfo) {
                opponentRatingInfo.textContent = 'When enabled, the engine will play at the same rating as your opponent';
            }
        }
    }

    // Function to update human mode status
    myFunctions.updateHumanMode = function(enabled) {
        const humanModeStatus = document.getElementById('humanModeStatus');
        if (humanModeStatus) {
            humanModeStatus.textContent = enabled ? 'On' : 'Off';
            humanModeStatus.style.color = enabled ? '#4CAF50' : '#666';
        }
        
        // Store previous ELO when enabling human mode
        if (enabled && !myVars.humanMode?.active) {
            myVars.previousEloRating = myVars.eloRating;
        }
        
        if (enabled) {
            // Apply the selected human mode level
            const level = $('#humanModeSelect').val() || 'intermediate';
            setHumanMode(level);
        } else {
            // Disable human mode
            if (myVars.humanMode) {
                myVars.humanMode.active = false;
            }
            
            // Restore previous ELO setting when disabling human mode
            if (myVars.previousEloRating) {
                if ($('#eloSlider')[0]) {
                    $('#eloSlider')[0].value = myVars.previousEloRating;
                    $('#eloValue')[0].textContent = myVars.previousEloRating;
                    myVars.eloRating = myVars.previousEloRating;
                    
                    // Set the engine ELO back to previous value
                    setEngineElo(myVars.previousEloRating);
                }
            }
            
            // Reset the human mode info text
            const humanModeInfo = document.getElementById('humanModeInfo');
            if (humanModeInfo) {
                humanModeInfo.textContent = 'When enabled, the engine will play like a human with realistic mistakes and timing';
            }
        }
    }

    // Function to update engine ELO from UI
    myFunctions.updateEngineElo = function() {
        const eloValue = parseInt($('#eloSlider')[0].value);
        $('#eloValue')[0].textContent = eloValue;
        myVars.eloRating = eloValue;
        
        if(engine.engine) {
            setEngineElo(eloValue);
        }
        
        // Update the depth slider if it exists
        if ($('#depthSlider')[0] && myVars.maxDepthForElo !== undefined) {
            // If current depth is higher than max allowed for this ELO, adjust it
            if (parseInt($('#depthSlider')[0].value) > myVars.maxDepthForElo) {
                $('#depthSlider')[0].value = myVars.maxDepthForElo;
                $('#depthText')[0].innerHTML = "Current Depth: <strong>" + myVars.maxDepthForElo + "</strong>";
                
                // Re-add the depth note
                const depthNote = document.getElementById('depthNote');
                if (depthNote && $('#depthText')[0]) {
                    $('#depthText')[0].appendChild(depthNote);
                }
            }
        }
    }

    var lastValue = 11;
    myFunctions.runChessEngine = function(depth){
        // Use the depth from slider if no specific depth is provided
        if (depth === undefined) {
            depth = parseInt($('#depthSlider')[0].value);
        }
        
        // Ensure depth doesn't exceed the max for current ELO
        if (myVars.maxDepthForElo !== undefined && depth > myVars.maxDepthForElo) {
            depth = myVars.maxDepthForElo;
            console.log(`Depth limited to ${depth} based on current ELO setting`);
        }
        
        //var fen = myFunctions.rescan();
        var fen = board.game.getFEN();
        engine.engine.postMessage(`position fen ${fen}`);
        console.log('updated: ' + `position fen ${fen}`);
        isThinking = true;
        engine.engine.postMessage(`go depth ${depth}`);
        lastValue = depth;
        
        // Update the depth text
        if ($('#depthText')[0]) {
            $('#depthText')[0].innerHTML = "Current Depth: <strong>" + depth + "</strong>";
            
            // Re-add the depth note if it exists
            const depthNote = document.getElementById('depthNote');
            if (depthNote && $('#depthText')[0]) {
                $('#depthText')[0].appendChild(depthNote);
            }
        }
        
        // Update the slider value to match
        if ($('#depthSlider')[0]) {
            $('#depthSlider')[0].value = depth;
        }
    }

    myFunctions.autoRun = function(lstValue){
        // Only run if it's the player's turn and not already thinking
        if(board.game.getTurn() == board.game.getPlayingAs() && !isThinking){
            console.log(`Auto running engine at depth ${lstValue}`);
            myFunctions.updateAutoRunStatus('running');
            myFunctions.runChessEngine(lstValue);
        } else {
            console.log("Auto run skipped - not player's turn or engine is already thinking");
            if (myVars.autoRun) {
                myFunctions.updateAutoRunStatus('waiting');
            }
        }
    }

    document.onkeydown = function(e) {
        switch (e.keyCode) {
            case 81:
                myFunctions.runChessEngine(1);
                break;
            case 87:
                myFunctions.runChessEngine(2);
                break;
            case 69:
                myFunctions.runChessEngine(3);
                break;
            case 82:
                myFunctions.runChessEngine(4);
                break;
            case 84:
                myFunctions.runChessEngine(5);
                break;
            case 89:
                myFunctions.runChessEngine(6);
                break;
            case 85:
                myFunctions.runChessEngine(7);
                break;
            case 73:
                myFunctions.runChessEngine(8);
                break;
            case 79:
                myFunctions.runChessEngine(9);
                break;
            case 80:
                myFunctions.runChessEngine(10);
                break;
            case 65:
                myFunctions.runChessEngine(11);
                break;
            case 83:
                myFunctions.runChessEngine(12);
                break;
            case 68:
                myFunctions.runChessEngine(13);
                break;
            case 70:
                myFunctions.runChessEngine(14);
                break;
            case 71:
                myFunctions.runChessEngine(15);
                break;
            case 72:
                myFunctions.runChessEngine(16);
                break;
            case 74:
                myFunctions.runChessEngine(17);
                break;
            case 75:
                myFunctions.runChessEngine(18);
                break;
            case 76:
                myFunctions.runChessEngine(19);
                break;
            case 90:
                myFunctions.runChessEngine(20);
                break;
            case 88:
                myFunctions.runChessEngine(21);
                break;
            case 67:
                myFunctions.runChessEngine(22);
                break;
            case 86:
                myFunctions.runChessEngine(23);
                break;
            case 66:
                myFunctions.runChessEngine(24);
                break;
            case 78:
                myFunctions.runChessEngine(25);
                break;
            case 77:
                myFunctions.runChessEngine(26);
                break;
            case 187:
                myFunctions.runChessEngine(100);
                break;
        }
    };

    myFunctions.spinner = function() {
        if(isThinking == true){
            $('#overlay')[0].style.display = 'block';
        }
        if(isThinking == false) {
            $('#overlay')[0].style.display = 'none';
        }
    }

    let dynamicStyles = null;

    function addAnimation(body) {
        if (!dynamicStyles) {
            dynamicStyles = document.createElement('style');
            dynamicStyles.type = 'text/css';
            document.head.appendChild(dynamicStyles);
        }

        dynamicStyles.sheet.insertRule(body, dynamicStyles.length);
    }


    var loaded = false;
    myFunctions.loadEx = function(){
        try{
            var tmpStyle;
            var tmpDiv;
            board = $('chess-board')[0] || $('wc-chess-board')[0];
            myVars.board = board;

            // Create evaluation bar container
            var evalBarContainer = document.createElement('div');
            evalBarContainer.id = 'evalBarContainer';
            evalBarContainer.style = `
                position: absolute;
                left: -30px;
                top: 0;
                width: 20px;
                height: 100%;
                background-color: #f0f0f0;
                border: 1px solid #ccc;
                overflow: hidden;
                z-index: 100;
            `;
            
            // Create the actual evaluation bar
            evalBar = document.createElement('div');
            evalBar.id = 'evalBar';
            evalBar.style = `
                position: absolute;
                bottom: 0;
                width: 100%;
                height: 50%;
                background-color: #9E9E9E;
                transition: height 0.3s, background-color 0.3s;
            `;
            
            // Create evaluation text
            evalText = document.createElement('div');
            evalText.id = 'evalText';
            evalText.style = `
                position: absolute;
                top: -25px;
                width: 100%;
                text-align: center;
                font-weight: bold;
                font-size: 14px;
                z-index: 101;
            `;
            evalText.textContent = '0.0';
            
            // Add elements to the DOM
            evalBarContainer.appendChild(evalBar);
            board.parentElement.style.position = 'relative';
            board.parentElement.appendChild(evalBarContainer);
            board.parentElement.appendChild(evalText);

            // Create main container with header
            var div = document.createElement('div');
            div.setAttribute('style','background-color:white; height:auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); padding: 0; max-width: 300px; position: relative;');
            div.setAttribute('id','settingsContainer');
            
            // Create header with collapse button
            var header = document.createElement('div');
            header.style = `
                background-color: #2196F3;
                color: white;
                padding: 10px;
                border-top-left-radius: 8px;
                border-top-right-radius: 8px;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;
            header.innerHTML = `
                <span style="font-weight: bold;">Chess AI Controls</span>
                <span id="collapseBtn">▼</span>
            `;
            div.appendChild(header);
            
            // Create content container
            var contentContainer = document.createElement('div');
            contentContainer.id = 'aiControlsContent';
            contentContainer.style = 'padding: 10px;';
            
            var content = `<div style="margin: 0 0 0 8px;"><br>
            <div style="margin-bottom: 15px;">
                <p id="depthText">Current Depth: <strong>11</strong></p>
                <label for="depthSlider">Adjust Depth (1-30):</label><br>
                <input type="range" id="depthSlider" name="depthSlider" min="1" max="30" step="1" value="11" 
                       oninput="document.getElementById('depthText').innerHTML = 'Current Depth: <strong>' + this.value + '</strong>';" style="width: 80%;">
                <button id="applyDepth" style="margin-left: 10px; padding: 2px 8px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Apply</button>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label for="eloSlider">Engine ELO Rating: <span id="eloValue">1500</span></label>
                <button id="eloInfoBtn" style="margin-left: 5px; padding: 0 5px; background-color: #2196F3; color: white; border: none; border-radius: 50%; cursor: pointer; font-size: 12px;">?</button><br>
                <input type="range" id="eloSlider" name="eloSlider" min="1000" max="3000" step="50" value="1500" 
                       oninput="document.myFunctions.updateEngineElo()" style="width: 80%;">
                <div id="eloDepthInfo" style="font-size: 12px; color: #666; margin-top: 5px;">
                    Note: Lower ELO settings will limit the maximum search depth
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <div style="display: flex; align-items: center; margin: 10px 0;">
                    <label for="fusionModeToggle" style="margin-right: 10px;">Fusion Mode (Match Opponent Rating):</label>
                    <label class="switch">
                        <input type="checkbox" id="fusionMode" name="fusionMode" value="false">
                        <span class="slider round"></span>
                    </label>
                    <span id="fusionModeStatus" style="margin-left: 10px; font-size: 12px; color: #666;">Off</span>
                </div>
                <div id="opponentRatingInfo" style="font-size: 12px; color: #666; margin-top: 5px;">
                    When enabled, the engine will play at the same rating as your opponent
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <div style="display: flex; align-items: center; margin: 10px 0;">
                    <label for="humanModeToggle" style="margin-right: 10px;">Human Mode:</label>
                    <label class="switch">
                        <input type="checkbox" id="humanMode" name="humanMode" value="false">
                        <span class="slider round"></span>
                    </label>
                    <span id="humanModeStatus" style="margin-left: 10px; font-size: 12px; color: #666;">Off</span>
                </div>
                <div style="margin-top: 10px;">
                    <label for="humanModeSelect">Human Skill Level: <span id="humanModeLevel">Intermediate</span></label>
                    <button id="humanModeInfoBtn" style="margin-left: 5px; padding: 0 5px; background-color: #2196F3; color: white; border: none; border-radius: 50%; cursor: pointer; font-size: 12px;">?</button><br>
                    <select id="humanModeSelect" style="width: 80%; padding: 5px; margin-top: 5px;">
                        <option value="beginner">Beginner (ELO ~800)</option>
                        <option value="casual">Casual (ELO ~1200)</option>
                        <option value="intermediate" selected>Intermediate (ELO ~1600)</option>
                        <option value="advanced">Advanced (ELO ~2000)</option>
                        <option value="expert">Expert (ELO ~2400)</option>
                    </select>
                </div>
                <div id="humanModeInfo" style="font-size: 12px; color: #666; margin-top: 5px;">
                    When enabled, the engine will play like a human with realistic mistakes and timing
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label for="evalBarColor">Evaluation Bar Color Theme:</label><br>
                <select id="evalBarColor" style="width: 80%; padding: 5px; margin-top: 5px;">
                    <option value="default">Default (Green/Red)</option>
                    <option value="blue">Blue/Orange</option>
                    <option value="purple">Purple/Yellow</option>
                    <option value="custom">Custom</option>
                </select>
            </div>
            
            <div id="customColorContainer" style="display: none; margin-bottom: 15px;">
                <label for="whiteAdvantageColor">White Advantage Color:</label>
                <input type="color" id="whiteAdvantageColor" value="#4CAF50"><br>
                <label for="blackAdvantageColor">Black Advantage Color:</label>
                <input type="color" id="blackAdvantageColor" value="#F44336">
            </div>
            
            <div style="margin-bottom: 15px;">
                <input type="checkbox" id="showArrows" name="showArrows" value="true" checked>
                <label for="showArrows"> Show move arrows</label><br>
                
                <input type="checkbox" id="persistentHighlights" name="persistentHighlights" value="true" checked>
                <label for="persistentHighlights"> Keep highlights until next move</label><br>
                
                <div style="display: flex; align-items: center; margin: 10px 0;">
                    <label for="autoRunToggle" style="margin-right: 10px;">Auto Run:</label>
                    <label class="switch">
                        <input type="checkbox" id="autoRun" name="autoRun" value="false">
                        <span class="slider round"></span>
                    </label>
                    <span id="autoRunStatus" style="margin-left: 10px; font-size: 12px; color: #666;">Off</span>
                </div>
                
                <input type="checkbox" id="autoMove" name="autoMove" value="false">
                <label for="autoMove"> Enable auto move</label><br>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label for="timeDelayMin">Auto Run Delay (Seconds):</label><br>
                <input type="number" id="timeDelayMin" name="timeDelayMin" min="0.1" value="0.1" style="width: 60px;">
                <span> to </span>
                <input type="number" id="timeDelayMax" name="timeDelayMax" min="0.1" value="1" style="width: 60px;">
            </div>
            
            <div style="margin-bottom: 15px;">
                <button id="runEngineBtn" style="padding: 8px 15px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">Run Engine</button>
                <button id="stopEngineBtn" style="padding: 8px 15px; background-color: #F44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Stop Engine</button>
            </div>
            
            <div style="margin-bottom: 15px;">
                <button id="saveSettingsBtn" style="padding: 8px 15px; background-color: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%;">Save Settings</button>
            </div>
            
            <div style="margin-bottom: 15px;">
                <button id="showKeyboardShortcuts" style="padding: 8px 15px; background-color: #9C27B0; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%;">Show Keyboard Shortcuts</button>
            </div>
            </div>`;
            
            contentContainer.innerHTML = content;
            div.appendChild(contentContainer);
            
            // Create keyboard shortcuts modal
            var keyboardModal = document.createElement('div');
            keyboardModal.id = 'keyboardShortcutsModal';
            keyboardModal.style = `
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.7);
                z-index: 2000;
                justify-content: center;
                align-items: center;
            `;
            
            var modalContent = document.createElement('div');
            modalContent.style = `
                background-color: white;
                padding: 20px;
                border-radius: 8px;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                position: relative;
            `;
            
            var closeBtn = document.createElement('span');
            closeBtn.innerHTML = '&times;';
            closeBtn.style = `
                position: absolute;
                top: 10px;
                right: 15px;
                font-size: 24px;
                cursor: pointer;
                color: #333;
            `;
            closeBtn.onclick = function() {
                keyboardModal.style.display = 'none';
            };
            
            modalContent.appendChild(closeBtn);
            
            var shortcutsTitle = document.createElement('h2');
            shortcutsTitle.textContent = 'Keyboard Shortcuts';
            shortcutsTitle.style = 'margin-top: 0; color: #2196F3;';
            modalContent.appendChild(shortcutsTitle);
            
            var shortcutsTable = document.createElement('table');
            shortcutsTable.style = 'width: 100%; border-collapse: collapse;';
            
            // Create table header
            var tableHeader = document.createElement('thead');
            tableHeader.innerHTML = `
                <tr>
                    <th style="text-align: left; padding: 8px; border-bottom: 2px solid #ddd;">Key</th>
                    <th style="text-align: left; padding: 8px; border-bottom: 2px solid #ddd;">Function</th>
                </tr>
            `;
            shortcutsTable.appendChild(tableHeader);
            
            // Create table body with all keyboard shortcuts
            var tableBody = document.createElement('tbody');
            
            // Define all shortcuts
            const shortcuts = [
                { key: 'Q', function: 'Run engine at depth 1' },
                { key: 'W', function: 'Run engine at depth 2' },
                { key: 'E', function: 'Run engine at depth 3' },
                { key: 'R', function: 'Run engine at depth 4' },
                { key: 'T', function: 'Run engine at depth 5' },
                { key: 'Y', function: 'Run engine at depth 6' },
                { key: 'U', function: 'Run engine at depth 7' },
                { key: 'I', function: 'Run engine at depth 8' },
                { key: 'O', function: 'Run engine at depth 9' },
                { key: 'P', function: 'Run engine at depth 10' },
                { key: 'A', function: 'Run engine at depth 11' },
                { key: 'S', function: 'Run engine at depth 12' },
                { key: 'D', function: 'Run engine at depth 13' },
                { key: 'F', function: 'Run engine at depth 14' },
                { key: 'G', function: 'Run engine at depth 15' },
                { key: 'H', function: 'Run engine at depth 16' },
                { key: 'J', function: 'Run engine at depth 17' },
                { key: 'K', function: 'Run engine at depth 18' },
                { key: 'L', function: 'Run engine at depth 19' },
                { key: 'Z', function: 'Run engine at depth 20' },
                { key: 'X', function: 'Run engine at depth 21' },
                { key: 'C', function: 'Run engine at depth 22' },
                { key: 'V', function: 'Run engine at depth 23' },
                { key: 'B', function: 'Run engine at depth 24' },
                { key: 'N', function: 'Run engine at depth 25' },
                { key: 'M', function: 'Run engine at depth 26' },
                { key: '=', function: 'Run engine at depth 100 (maximum)' }
            ];
            
            // Add rows for each shortcut
            shortcuts.forEach(shortcut => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${shortcut.key}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${shortcut.function}</td>
                `;
                tableBody.appendChild(row);
            });
            
            shortcutsTable.appendChild(tableBody);
            modalContent.appendChild(shortcutsTable);
            
            keyboardModal.appendChild(modalContent);
            document.body.appendChild(keyboardModal);

            board.parentElement.parentElement.appendChild(div);
            
            // Add move history display
            const moveHistoryDisplay = myFunctions.createMoveHistoryDisplay();
            contentContainer.appendChild(moveHistoryDisplay);

            //spinnerContainer
            var spinCont = document.createElement('div');
            spinCont.setAttribute('style','display:none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 1000; display: flex; justify-content: center; align-items: center;');
            spinCont.setAttribute('id','overlay');
            div.prepend(spinCont);
            //spinner
            var spinr = document.createElement('div')
            spinr.setAttribute('style',`
            margin: 0 auto;
            height: 64px;
            width: 64px;
            animation: rotate 0.8s infinite linear;
            border: 5px solid firebrick;
            border-right-color: transparent;
            border-radius: 50%;
            `);
            spinCont.appendChild(spinr);
            addAnimation(`@keyframes rotate {
                           0% {
                               transform: rotate(0deg);
                              }
                         100% {
                               transform: rotate(360deg);
                              }
                                           }`);


            //Reload Button
            var reSty = `
            #relButDiv {
             position: relative;
             text-align: center;
             margin: 0 0 8px 0;
            }
            #relEngBut {
            position: relative;
			color: #ffffff;
			background-color: #3cba2c;
			font-size: 16px;
			border: none;
			border-radius: 4px;
			padding: 10px 20px;
            letter-spacing: 1px;
			cursor: pointer;
            transition: background-color 0.3s;
		    }
		    #relEngBut:hover {
			background-color: #2d8c22;
		    }
            #relEngBut:active {
            background-color: #2d8c22;
            transform: translateY(2px);
       }`;
            var reBut = `<button type="button" name="reloadEngine" id="relEngBut" onclick="document.myFunctions.reloadChessEngine()">Reload Chess Engine</button>`;
            tmpDiv = document.createElement('div');
            var relButDiv = document.createElement('div');
            relButDiv.id = 'relButDiv';
            tmpDiv.innerHTML = reBut;
            reBut = tmpDiv.firstChild;

            tmpStyle = document.createElement('style');
            tmpStyle.innerHTML = reSty;
            document.head.append(tmpStyle);

            relButDiv.append(reBut);
            contentContainer.append(relButDiv);

            // Issue Button
            // var isBut = `<button type="button" name="isBut" onclick="window.confirm('Can I take you to the issues page?') ? document.location = 'https://github.com/Auzgame/userscripts/issues' : console.log('cancled')">Got An Issue/Bug?</button>`;
            // tmpDiv = document.createElement('div');
            // var isButDiv = document.createElement('div');
            // isButDiv.style = `
            //  position: relative;
            //  text-align: center;
            //  margin: 0 0 8px 0;
            // `;
            // tmpDiv.innerHTML = isBut;
            // isBut = tmpDiv.firstChild;
            // isBut.id = 'isBut';
            // isBut.style = `
            // position: relative;
            // color: #ffffff;
            // background-color: #919191;
            // font-size: 16px;
            // border: none;
            // border-radius: 4px;
            // padding: 10px 20px;
            // letter-spacing: 1px;
            // cursor: pointer;
            // transition: background-color 0.3s;
            // `;
            // isButDiv.append(isBut);
            // contentContainer.append(isButDiv);

            // Add event listeners for the new buttons and controls
            $('#applyDepth').on('click', function() {
                myFunctions.runChessEngine();
            });
            
            $('#runEngineBtn').on('click', function() {
                myFunctions.runChessEngine();
            });
            
            $('#stopEngineBtn').on('click', function() {
                if (engine.engine) {
                    engine.engine.postMessage('stop');
                    isThinking = false;
                    myFunctions.spinner();
                }
            });
            
            $('#saveSettingsBtn').on('click', function() {
                myFunctions.saveSettings();
            });
            
            $('#showKeyboardShortcuts').on('click', function() {
                document.getElementById('keyboardShortcutsModal').style.display = 'flex';
            });
            
            // Add collapse functionality
            header.onclick = function() {
                const content = document.getElementById('aiControlsContent');
                const collapseBtn = document.getElementById('collapseBtn');
                
                if (content.style.display === 'none') {
                    content.style.display = 'block';
                    collapseBtn.textContent = '▼';
                } else {
                    content.style.display = 'none';
                    collapseBtn.textContent = '▲';
                }
            };
            
            $('#evalBarColor').on('change', function() {
                const theme = $(this).val();
                if (theme === 'custom') {
                    $('#customColorContainer').show();
                } else {
                    $('#customColorContainer').hide();
                    
                    // Apply predefined color themes
                    let whiteColor, blackColor;
                    switch(theme) {
                        case 'blue':
                            whiteColor = '#2196F3'; // Blue
                            blackColor = '#FF9800'; // Orange
                            break;
                        case 'purple':
                            whiteColor = '#9C27B0'; // Purple
                            blackColor = '#FFEB3B'; // Yellow
                            break;
                        default: // default
                            whiteColor = '#4CAF50'; // Green
                            blackColor = '#F44336'; // Red
                    }
                    
                    // Store colors in variables for the updateEvalBar function to use
                    myVars.whiteAdvantageColor = whiteColor;
                    myVars.blackAdvantageColor = blackColor;
                    
                    // Update the evaluation bar with current value but new colors
                    updateEvalBar(myVars.currentEvaluation);
                }
            });
            
            $('#whiteAdvantageColor, #blackAdvantageColor').on('change', function() {
                myVars.whiteAdvantageColor = $('#whiteAdvantageColor').val();
                myVars.blackAdvantageColor = $('#blackAdvantageColor').val();
                updateEvalBar(myVars.currentEvaluation);
            });
            
            // Initialize color theme variables
            myVars.whiteAdvantageColor = '#4CAF50';
            myVars.blackAdvantageColor = '#F44336';
            
            // Initialize fusion mode
            myVars.fusionMode = false;
            
            // Load saved settings
            myFunctions.loadSettings();
            
            // Update fusion mode status based on saved settings
            if (myVars.fusionMode) {
                myFunctions.updateFusionMode(true);
                $('#fusionMode').prop('checked', true);
                $('#eloSlider').prop('disabled', true);
            }
            
            // Periodically check for opponent rating changes when fusion mode is enabled
            setInterval(function() {
                if (myVars.fusionMode) {
                    extractOpponentRating();
                }
            }, 10000); // Check every 10 seconds
            
            // Create ELO info modal
            var eloInfoModal = document.createElement('div');
            eloInfoModal.id = 'eloInfoModal';
            eloInfoModal.style = `
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.7);
                z-index: 2000;
                justify-content: center;
                align-items: center;
            `;
            
            var eloModalContent = document.createElement('div');
            eloModalContent.style = `
                background-color: white;
                padding: 20px;
                border-radius: 8px;
                max-width: 500px;
                max-height: 80vh;
                overflow-y: auto;
                position: relative;
            `;
            
            var eloCloseBtn = document.createElement('span');
            eloCloseBtn.innerHTML = '&times;';
            eloCloseBtn.style = `
                position: absolute;
                top: 10px;
                right: 15px;
                font-size: 24px;
                cursor: pointer;
                color: #333;
            `;
            eloCloseBtn.onclick = function() {
                eloInfoModal.style.display = 'none';
            };
            
            eloModalContent.appendChild(eloCloseBtn);
            
            var eloInfoTitle = document.createElement('h2');
            eloInfoTitle.textContent = 'ELO Rating and Depth Relationship';
            eloInfoTitle.style = 'margin-top: 0; color: #2196F3;';
            eloModalContent.appendChild(eloInfoTitle);
            
            var eloInfoText = document.createElement('div');
            eloInfoText.innerHTML = `
                <p>The ELO rating setting affects how strong the chess engine plays. Lower ELO ratings make the engine play more like a beginner, while higher ratings make it play more like a master.</p>
                
                <p>To ensure the engine plays consistently with its ELO rating, the maximum search depth is limited based on the selected ELO:</p>
                
                <ul>
                    <li><strong>1000-1199 ELO:</strong> Maximum depth 5 (Beginner level)</li>
                    <li><strong>1200-1499 ELO:</strong> Maximum depth 8 (Intermediate level)</li>
                    <li><strong>1500-1799 ELO:</strong> Maximum depth 12 (Advanced level)</li>
                    <li><strong>1800-2099 ELO:</strong> Maximum depth 15 (Expert level)</li>
                    <li><strong>2100-2399 ELO:</strong> Maximum depth 18 (Master level)</li>
                    <li><strong>2400+ ELO:</strong> Maximum depth 22 (Grandmaster level)</li>
                </ul>
                
                <p>If you set a depth higher than the maximum for the current ELO, it will be automatically limited to the maximum allowed depth.</p>
                
                <p>This ensures that the engine plays consistently with its ELO rating and doesn't make moves that are too strong for the selected rating.</p>
            `;
            eloModalContent.appendChild(eloInfoText);
            
            eloInfoModal.appendChild(eloModalContent);
            document.body.appendChild(eloInfoModal);
            
            $('#eloInfoBtn').on('click', function() {
                document.getElementById('eloInfoModal').style.display = 'flex';
            });

            // Create Human Mode info modal
            var humanModeInfoModal = document.createElement('div');
            humanModeInfoModal.id = 'humanModeInfoModal';
            humanModeInfoModal.style = `
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.7);
                z-index: 2000;
                justify-content: center;
                align-items: center;
            `;
            
            var humanModeModalContent = document.createElement('div');
            humanModeModalContent.style = `
                background-color: white;
                padding: 20px;
                border-radius: 8px;
                max-width: 500px;
                max-height: 80vh;
                overflow-y: auto;
                position: relative;
            `;
            
            var humanModeCloseBtn = document.createElement('span');
            humanModeCloseBtn.innerHTML = '&times;';
            humanModeCloseBtn.style = `
                position: absolute;
                top: 10px;
                right: 15px;
                font-size: 24px;
                cursor: pointer;
                color: #333;
            `;
            humanModeCloseBtn.onclick = function() {
                humanModeInfoModal.style.display = 'none';
            };
            
            humanModeModalContent.appendChild(humanModeCloseBtn);
            
            var humanModeInfoTitle = document.createElement('h2');
            humanModeInfoTitle.textContent = 'Human Mode: Realistic Chess Play';
            humanModeInfoTitle.style = 'margin-top: 0; color: #2196F3;';
            humanModeModalContent.appendChild(humanModeInfoTitle);
            
            var humanModeInfoText = document.createElement('div');
            humanModeInfoText.innerHTML = `
                <p>Human Mode makes the chess engine play more like a real human player by introducing:</p>
                
                <ul>
                    <li><strong>Realistic thinking time</strong> - varies based on skill level</li>
                    <li><strong>Occasional mistakes</strong> - humans don't always find the best move</li>
                    <li><strong>Rare blunders</strong> - even good players make serious mistakes sometimes</li>
                </ul>
                
                <p>Choose from five different skill levels:</p>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <tr style="background-color: #f2f2f2;">
                        <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Skill Level</th>
                        <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">ELO Range</th>
                        <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Characteristics</th>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Beginner</strong></td>
                        <td style="padding: 8px; border: 1px solid #ddd;">~800</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">Quick moves, frequent mistakes, occasional blunders</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Casual</strong></td>
                        <td style="padding: 8px; border: 1px solid #ddd;">~1200</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">Moderate thinking time, common mistakes</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Intermediate</strong></td>
                        <td style="padding: 8px; border: 1px solid #ddd;">~1600</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">Longer thinking on complex positions, occasional mistakes</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Advanced</strong></td>
                        <td style="padding: 8px; border: 1px solid #ddd;">~2000</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">Careful consideration, infrequent mistakes</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Expert</strong></td>
                        <td style="padding: 8px; border: 1px solid #ddd;">~2400</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">Deep analysis, rare mistakes, very rare blunders</td>
                    </tr>
                </table>
                
                <p style="margin-top: 15px;"><strong>Note:</strong> Human Mode and Fusion Mode cannot be active at the same time.</p>
            `;
            humanModeModalContent.appendChild(humanModeInfoText);
            
            humanModeInfoModal.appendChild(humanModeModalContent);
            document.body.appendChild(humanModeInfoModal);

            // Add CSS for toggle switch
            var toggleStyle = document.createElement('style');
            toggleStyle.innerHTML = `
                /* The switch - the box around the slider */
                .switch {
                    position: relative;
                    display: inline-block;
                    width: 50px;
                    height: 24px;
                }
                
                /* Hide default HTML checkbox */
                .switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                
                /* The slider */
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #ccc;
                    transition: .4s;
                }
                
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 16px;
                    width: 16px;
                    left: 4px;
                    bottom: 4px;
                    background-color: white;
                    transition: .4s;
                }
                
                input:checked + .slider {
                    background-color: #4CAF50;
                }
                
                input:focus + .slider {
                    box-shadow: 0 0 1px #4CAF50;
                }
                
                input:checked + .slider:before {
                    transform: translateX(26px);
                }
                
                /* Rounded sliders */
                .slider.round {
                    border-radius: 24px;
                }
                
                .slider.round:before {
                    border-radius: 50%;
                }
            `;
            document.head.appendChild(toggleStyle);
            
            // Update auto run status when checkbox changes
            $('#autoRun').on('change', function() {
                const isChecked = this.checked;
                myVars.autoRun = isChecked;
                myFunctions.updateAutoRunStatus(isChecked ? 'on' : 'off');
            });

            $('#fusionMode').on('change', function() {
                const isChecked = this.checked;
                myFunctions.updateFusionMode(isChecked);
                
                // Disable the ELO slider when fusion mode is enabled
                $('#eloSlider').prop('disabled', isChecked);
                
                // Extract opponent rating immediately when enabled
                if (isChecked) {
                    extractOpponentRating();
                }
                
                // Disable human mode when fusion mode is enabled
                if (isChecked && $('#humanMode').prop('checked')) {
                    $('#humanMode').prop('checked', false);
                    myFunctions.updateHumanMode(false);
                }
            });

            // Human mode toggle event listener
            $('#humanMode').on('change', function() {
                const isChecked = this.checked;
                myFunctions.updateHumanMode(isChecked);
                
                // Disable the ELO slider when human mode is enabled
                $('#eloSlider').prop('disabled', isChecked);
                
                // Disable fusion mode when human mode is enabled
                if (isChecked && $('#fusionMode').prop('checked')) {
                    $('#fusionMode').prop('checked', false);
                    myFunctions.updateFusionMode(false);
                }
                
                // Apply the selected human mode level
                if (isChecked) {
                    const level = $('#humanModeSelect').val();
                    setHumanMode(level);
                }
            });
            
            // Human mode level select event listener
            $('#humanModeSelect').on('change', function() {
                const level = $(this).val();
                
                // Only apply if human mode is active
                if ($('#humanMode').prop('checked')) {
                    setHumanMode(level);
                }
            });
            
            // Human mode info button event listener
            $('#humanModeInfoBtn').on('click', function() {
                document.getElementById('humanModeInfoModal').style.display = 'flex';
            });
            
            $('#autoMove').on('change', function() {
                myVars.autoMove = this.checked;
            });

            $('#showArrows').on('change', function() {
                myVars.showArrows = this.checked;
            });

            $('#persistentHighlights').on('change', function() {
                myVars.persistentHighlights = this.checked;
                
                // If turning off persistent highlights, clear any existing ones
                if (!myVars.persistentHighlights) {
                    myFunctions.clearHighlights();
                }
            });

            loaded = true;
        } catch (error) {console.log(error)}
    }


    function other(delay){
        console.log(`Scheduling next auto run in ${delay/1000} seconds`);
        myFunctions.updateAutoRunStatus('waiting');
        
        // Use setTimeout instead of setInterval with constant checking
        setTimeout(() => {
            // Only proceed if auto run is still enabled
            if(myVars.autoRun && myTurn && !isThinking) {
                myFunctions.autoRun(lastValue);
            }
                canGo = true;
        }, delay);
    }


    async function getVersion(){
        var GF = new GreasyFork; // set upping api
        var code = await GF.get().script().code(460208); // Get code
        var version = GF.parseScriptCodeMeta(code).filter(e => e.meta === '@version')[0].value; // filtering array and getting value of @version

        if(currentVersion !== version){
            while(true){
                alert('UPDATE THIS SCRIPT IN ORDER TO PROCEED!');
            }
        }
    }

    //Removed due to script being reported. I tried to make it so people can know when bug fixes come out. Clearly people don't like that.
    //getVersion();

    const waitForChessBoard = setInterval(() => {
        if(loaded) {
            board = $('chess-board')[0] || $('wc-chess-board')[0];
            
            // Only update these values when needed, not every 100ms
            if($('#autoRun')[0]) myVars.autoRun = $('#autoRun')[0].checked;
            if($('#autoMove')[0]) myVars.autoMove = $('#autoMove')[0].checked;
            if($('#showArrows')[0]) myVars.showArrows = $('#showArrows')[0].checked;
            
            // Check if turn has changed
            const currentTurn = board.game.getTurn() == board.game.getPlayingAs();
            const turnChanged = currentTurn !== myTurn;
            myTurn = currentTurn;
            
            // Only update delay values when needed
            if($('#timeDelayMin')[0] && $('#timeDelayMax')[0]) {
                let minDel = parseFloat($('#timeDelayMin')[0].value);
                let maxDel = parseFloat($('#timeDelayMax')[0].value);
            myVars.delay = Math.random() * (maxDel - minDel) + minDel;
            }
            
            myVars.isThinking = isThinking;
            myFunctions.spinner();
            
            // If turn has changed to player's turn and auto run is enabled, trigger auto run
            if(turnChanged && myTurn && myVars.autoRun && canGo && !isThinking) {
                console.log("Turn changed to player's turn, triggering auto run");
                canGo = false;
                var currentDelay = myVars.delay != undefined ? myVars.delay * 1000 : 10;
                other(currentDelay);
            }
            
            // Update evaluation bar position if board size changes
            if(evalBar && evalText && board) {
                evalText.style.left = `${evalBar.offsetLeft}px`;
            }
        } else {
            myFunctions.loadEx();
        }


        if(!engine.engine){
            myFunctions.loadChessEngine();
        }

        // Check if the board exists and we haven't set up the move listener yet
        if (board && !board._highlightListenerAdded) {
            // Try to add a listener for moves
            try {
                // Store the current position FEN to detect changes
                myVars.lastPositionFEN = board.game.getFEN();
                
                // Mark that we've added the listener
                board._highlightListenerAdded = true;
            } catch (err) {
                console.log('Error setting up move listener:', err);
            }
        }
        
        // Check if the position has changed (a move was made)
        if (board && myVars.lastPositionFEN) {
            const currentFEN = board.game.getFEN();
            if (currentFEN !== myVars.lastPositionFEN) {
                // Position changed, clear highlights
                myFunctions.clearHighlights();
                myVars.lastPositionFEN = currentFEN;
            }
        }
    }, 100);

     // Function to save user settings using GM.setValue asynchronously
     myFunctions.saveSettings = async function() {
        const settings = {
            eloRating: myVars.eloRating,
            depth: parseInt($('#depthSlider')[0].value),
            showArrows: $('#showArrows')[0].checked,
            persistentHighlights: $('#persistentHighlights')[0].checked,
            autoRun: $('#autoRun')[0].checked,
            autoMove: $('#autoMove')[0].checked,
            timeDelayMin: parseFloat($('#timeDelayMin')[0].value),
            timeDelayMax: parseFloat($('#timeDelayMax')[0].value),
            evalBarTheme: $('#evalBarColor').val(),
            whiteAdvantageColor: $('#whiteAdvantageColor').val(),
            blackAdvantageColor: $('#blackAdvantageColor').val(),
            fusionMode: myVars.fusionMode,
            humanMode: myVars.humanMode ? {
                active: myVars.humanMode.active,
                level: myVars.humanMode.level
            } : { active: false, level: 'intermediate' }
        };

        try {
            await GM.setValue('chessAISettings', JSON.stringify(settings));
            // Show saved notification (same as before)
            const notification = document.createElement('div');
            notification.textContent = 'Settings saved!';
            notification.style = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background-color: #4CAF50;
                color: white;
                padding: 10px 20px;
                border-radius: 4px;
                z-index: 9999;
                opacity: 0;
                transition: opacity 0.3s;
            `;
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.style.opacity = '1';
            }, 10);

            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 2000);
        } catch (error) {
            console.error('Error saving settings:', error);
            // Handle error as needed, e.g., show an error notification
        }
    };
    
    // Function to load user settings using await GM.getValue
    myFunctions.loadSettings = async function() {
        try {
            const savedSettings = await GM.getValue('chessAISettings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                
                // Apply saved settings
                // First apply ELO since it affects depth limits
                if (settings.eloRating) {
                    $('#eloSlider')[0].value = settings.eloRating;
                    $('#eloValue')[0].textContent = settings.eloRating;
                    myVars.eloRating = settings.eloRating;
                    setEngineElo(settings.eloRating);
                    
                    // Now we have maxDepthForElo set based on the ELO
                }
                
                // Then apply depth, respecting the ELO-based limits
                if (settings.depth) {
                    let depthToApply = settings.depth;
                    
                    // If we have a max depth for the current ELO, respect it
                    if (myVars.maxDepthForElo !== undefined) {
                        depthToApply = Math.min(settings.depth, myVars.maxDepthForElo);
                    }
                    
                    $('#depthSlider')[0].value = depthToApply;
                    $('#depthText')[0].innerHTML = "Current Depth: <strong>" + depthToApply + "</strong>";
                    lastValue = depthToApply;
                    
                    // Re-add the depth note if it exists
                    const depthNote = document.getElementById('depthNote');
                    if (depthNote && $('#depthText')[0]) {
                        $('#depthText')[0].appendChild(depthNote);
                    }
                }
                
                if (settings.showArrows !== undefined) {
                    $('#showArrows')[0].checked = settings.showArrows;
                    myVars.showArrows = settings.showArrows;
                }
                
                if (settings.persistentHighlights !== undefined) {
                    $('#persistentHighlights')[0].checked = settings.persistentHighlights;
                    myVars.persistentHighlights = settings.persistentHighlights;
                }
                
                if (settings.autoRun !== undefined) {
                    $('#autoRun')[0].checked = settings.autoRun;
                    myVars.autoRun = settings.autoRun;
                    
                    // Update auto run status indicator
                    if ($('#autoRunStatus')[0]) {
                        $('#autoRunStatus').text(settings.autoRun ? 'On' : 'Off');
                        $('#autoRunStatus').css('color', settings.autoRun ? '#4CAF50' : '#666');
                    }
                }
                
                if (settings.autoMove !== undefined) {
                    $('#autoMove')[0].checked = settings.autoMove;
                    myVars.autoMove = settings.autoMove;
                }
                
                if (settings.timeDelayMin) {
                    $('#timeDelayMin')[0].value = settings.timeDelayMin;
                }
                
                if (settings.timeDelayMax) {
                    $('#timeDelayMax')[0].value = settings.timeDelayMax;
                }
                
                if (settings.evalBarTheme) {
                    $('#evalBarColor').val(settings.evalBarTheme);
                    
                    if (settings.evalBarTheme === 'custom') {
                        $('#customColorContainer').show();
                        
                        if (settings.whiteAdvantageColor) {
                            $('#whiteAdvantageColor').val(settings.whiteAdvantageColor);
                            myVars.whiteAdvantageColor = settings.whiteAdvantageColor;
                        }
                        
                        if (settings.blackAdvantageColor) {
                            $('#blackAdvantageColor').val(settings.blackAdvantageColor);
                            myVars.blackAdvantageColor = settings.blackAdvantageColor;
                        }
                    } else {
                        // Apply predefined color themes
                        let whiteColor, blackColor;
                        switch(settings.evalBarTheme) {
                            case 'blue':
                                whiteColor = '#2196F3'; // Blue
                                blackColor = '#FF9800'; // Orange
                                break;
                            case 'purple':
                                whiteColor = '#9C27B0'; // Purple
                                blackColor = '#FFEB3B'; // Yellow
                                break;
                            default: // default
                                whiteColor = '#4CAF50'; // Green
                                blackColor = '#F44336'; // Red
                        }
                        
                        myVars.whiteAdvantageColor = whiteColor;
                        myVars.blackAdvantageColor = blackColor;
                    }
                }
                
                if (settings.fusionMode !== undefined) {
                    $('#fusionMode').prop('checked', settings.fusionMode);
                    myVars.fusionMode = settings.fusionMode;
                }
                
                // Apply Human mode settings
                if (settings.humanMode) {
                    // Set human mode active state
                    $('#humanMode').prop('checked', settings.humanMode.active);
                    
                    // Set human mode level
                    if (settings.humanMode.level) {
                        $('#humanModeSelect').val(settings.humanMode.level);
                    }
                    
                    // Apply human mode if active
                    if (settings.humanMode.active) {
                        myFunctions.updateHumanMode(true);
                        $('#eloSlider').prop('disabled', true);
                    }
                }
            }
        } catch (error) {
            console.log('Error loading settings:', error);
        }
    };

    // Create a move history display
    myFunctions.createMoveHistoryDisplay = function() {
        // Create container for move history
        const moveHistoryContainer = document.createElement('div');
        moveHistoryContainer.id = 'moveHistoryContainer';
        moveHistoryContainer.style = `
            margin-top: 15px;
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 10px;
            max-height: 200px;
            overflow-y: auto;
        `;
        
        // Create header
        const header = document.createElement('h3');
        header.textContent = 'Engine Move History';
        header.style = `
            margin-top: 0;
            margin-bottom: 10px;
            font-size: 16px;
            color: #333;
        `;
        
        // Create table for moves
        const moveTable = document.createElement('table');
        moveTable.id = 'moveHistoryTable';
        moveTable.style = `
            width: 100%;
            border-collapse: collapse;
        `;
        
        // Create table header
        const tableHeader = document.createElement('thead');
        tableHeader.innerHTML = `
            <tr>
                <th style="text-align: left; padding: 5px; border-bottom: 1px solid #ddd;">Move</th>
                <th style="text-align: left; padding: 5px; border-bottom: 1px solid #ddd;">Eval</th>
                <th style="text-align: left; padding: 5px; border-bottom: 1px solid #ddd;">Depth</th>
            </tr>
        `;
        
        // Create table body
        const tableBody = document.createElement('tbody');
        tableBody.id = 'moveHistoryTableBody';
        
        // Assemble the components
        moveTable.appendChild(tableHeader);
        moveTable.appendChild(tableBody);
        moveHistoryContainer.appendChild(header);
        moveHistoryContainer.appendChild(moveTable);
        
        // Add clear history button
        const clearButton = document.createElement('button');
        clearButton.textContent = 'Clear History';
        clearButton.style = `
            margin-top: 10px;
            padding: 5px 10px;
            background-color: #f44336;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
        clearButton.onclick = function() {
            document.getElementById('moveHistoryTableBody').innerHTML = '';
        };
        
        moveHistoryContainer.appendChild(clearButton);
        
        return moveHistoryContainer;
    };
    
    // Add a move to the history
    myFunctions.addMoveToHistory = function(move, evaluation, depth) {
        const tableBody = document.getElementById('moveHistoryTableBody');
        if (!tableBody) return;
        
        const row = document.createElement('tr');
        
        // Format the evaluation
        let evalText = '';
        if (typeof evaluation === 'string' && evaluation.includes('Mate')) {
            evalText = evaluation;
        } else {
            const sign = evaluation > 0 ? '+' : '';
            evalText = `${sign}${parseFloat(evaluation).toFixed(2)}`;
        }
        
        row.innerHTML = `
            <td style="padding: 5px; border-bottom: 1px solid #ddd;">${move}</td>
            <td style="padding: 5px; border-bottom: 1px solid #ddd;">${evalText}</td>
            <td style="padding: 5px; border-bottom: 1px solid #ddd;">${depth}</td>
        `;
        
        // Add the new row at the top
        if (tableBody.firstChild) {
            tableBody.insertBefore(row, tableBody.firstChild);
        } else {
            tableBody.appendChild(row);
        }
        
        // Limit the number of rows to 50
        while (tableBody.children.length > 50) {
            tableBody.removeChild(tableBody.lastChild);
        }
    };

    // Function to update the auto run status indicator
    myFunctions.updateAutoRunStatus = function(status) {
        if (!$('#autoRunStatus')[0]) return;
        
        switch(status) {
            case 'on':
                $('#autoRunStatus').text('On');
                $('#autoRunStatus').css('color', '#4CAF50');
                break;
            case 'off':
                $('#autoRunStatus').text('Off');
                $('#autoRunStatus').css('color', '#666');
                break;
            case 'waiting':
                $('#autoRunStatus').text('Waiting...');
                $('#autoRunStatus').css('color', '#FFA500');
                break;
            case 'running':
                $('#autoRunStatus').text('Running...');
                $('#autoRunStatus').css('color', '#2196F3');
                break;
        }
    };

    // Function to evaluate the complexity of the board position
    function evaluateBoardComplexity(boardState) {
        let complexity = 0;

        // Example evaluation criteria
        const pieceValues = {
            'p': 1,   // Pawn
            'r': 5,   // Rook
            'n': 3,   // Knight
            'b': 3,   // Bishop
            'q': 9,   // Queen
            'k': 0,   // King (not counted)
        };

        // Loop through the board state to evaluate material balance
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = boardState[row][col];
                if (piece) {
                    const value = pieceValues[piece.toLowerCase()] || 0;
                    complexity += piece === piece.toUpperCase() ? value : -value; // Add for white, subtract for black
                }
            }
        }

        // Additional complexity factors can be added here
        // For example, consider piece activity, control of the center, etc.
        // This is a simple example; you can expand it based on your needs

        // Normalize complexity to a reasonable range
        complexity = Math.abs(complexity); // Ensure it's positive
        return Math.floor(complexity / 10); // Scale down for thinking time calculation
    }
}

//Touching below may break the script

var isThinking = false
var canGo = true;
var myTurn = false;
var board;

window.addEventListener("load", (event) => {
    // Start the main application
    main();
});