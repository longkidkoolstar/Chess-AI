// ==UserScript==
// @name         Chess AI
// @namespace    github.com/longkidkoolstar
// @version      1.0.0
// @description  Chess.com Bot/Cheat that finds the best move with evaluation bar and ELO control!
// @author       longkidkoolstar
// @license      none
// @match        https://www.chess.com/play/*
// @match        https://www.chess.com/game/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant       GM.getValue
// @grant       GM.setValue
// @grant       GM.getResourceText
// @resource    stockfish.js        https://raw.githubusercontent.com/longkidkoolstar/stockfish/refs/heads/main/stockfish.js
// @require     https://greasyfork.org/scripts/445697/code/index.js
// @require     https://code.jquery.com/jquery-3.6.0.min.js
// @run-at      document-start
// ==/UserScript==


const currentVersion = '1.0.0'; // Updated version number

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
    myVars.moveIndicatorType = 'highlights'; // Default to highlights instead of arrows
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

        // Clear any existing highlights and arrows before adding new ones
        myFunctions.clearHighlights();
        myFunctions.clearArrows();

        if(myVars.autoMove == true){
            myFunctions.movePiece(res1, res2);
            
            // After auto move, we need to reset canGo to allow auto run on next turn
            setTimeout(() => {
                canGo = true;
            }, 500);
        }
        isThinking = false;

        // Only show move indicators if the option is enabled
        if(myVars.showArrows !== false) {
            // Convert algebraic notation to numeric coordinates
            let fromSquare = res1.replace(/^a/, "1")
                .replace(/^b/, "2")
                .replace(/^c/, "3")
                .replace(/^d/, "4")
                .replace(/^e/, "5")
                .replace(/^f/, "6")
                .replace(/^g/, "7")
                .replace(/^h/, "8");
            let toSquare = res2.replace(/^a/, "1")
                .replace(/^b/, "2")
                .replace(/^c/, "3")
                .replace(/^d/, "4")
                .replace(/^e/, "5")
                .replace(/^f/, "6")
                .replace(/^g/, "7")
                .replace(/^h/, "8");
            
            // Use arrows or highlights based on user preference
            if (myVars.moveIndicatorType === 'arrows') {
                // Draw an arrow from the source to the destination square
                myFunctions.drawArrow(res1, res2, myVars.persistentHighlights);
            } else {
                // Use the original highlighting method
                if (myVars.persistentHighlights) {
                    // Add highlights with custom class for easier removal later
                    $(board.nodeName)
                        .prepend('<div class="highlight square-' + toSquare + ' bro persistent-highlight" style="background-color: rgb(235, 97, 80); opacity: 0.71;" data-test-element="highlight"></div>');
                    
                    $(board.nodeName)
                        .prepend('<div class="highlight square-' + fromSquare + ' bro persistent-highlight" style="background-color: rgb(235, 97, 80); opacity: 0.71;" data-test-element="highlight"></div>');
                } else {
                    // Use the original temporary highlights
                    $(board.nodeName)
                        .prepend('<div class="highlight square-' + toSquare + ' bro" style="background-color: rgb(235, 97, 80); opacity: 0.71;" data-test-element="highlight"></div>')
                        .children(':first')
                        .delay(1800)
                        .queue(function() {
                        $(this)
                            .remove();
                    });
                    
                    $(board.nodeName)
                        .prepend('<div class="highlight square-' + fromSquare + ' bro" style="background-color: rgb(235, 97, 80); opacity: 0.71;" data-test-element="highlight"></div>')
                        .children(':first')
                        .delay(1800)
                        .queue(function() {
                        $(this)
                            .remove();
                    });
                }
            }
        }
    }

    // Add a function to clear highlights
    myFunctions.clearHighlights = function() {
        // Remove all persistent highlights
        $('.persistent-highlight').remove();
    }

    // Add a function to clear arrows
    myFunctions.clearArrows = function() {
        // Remove all arrows
        $('.chess-arrow-svg').remove();
    }

    // Function to draw an arrow on the chess board
    myFunctions.drawArrow = function(from, to, isPersistent) {
        // Convert algebraic notation to coordinates
        const files = {'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4, 'f': 5, 'g': 6, 'h': 7};
        const ranks = {'1': 7, '2': 6, '3': 5, '4': 4, '5': 3, '6': 2, '7': 1, '8': 0};
        
        const fromFile = files[from[0]];
        const fromRank = ranks[from[1]];
        const toFile = files[to[0]];
        const toRank = ranks[to[1]];
        
        // Get the board element and its dimensions
        const boardElement = $(board.nodeName)[0];
        const boardRect = boardElement.getBoundingClientRect();
        const squareSize = boardRect.width / 8;
        
        // Calculate the center coordinates of the squares
        const fromX = (fromFile + 0.5) * squareSize;
        const fromY = (fromRank + 0.5) * squareSize;
        const toX = (toFile + 0.5) * squareSize;
        const toY = (toRank + 0.5) * squareSize;
        
        // Create SVG element for the arrow
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("width", boardRect.width);
        svg.setAttribute("height", boardRect.height);
        svg.setAttribute("class", "chess-arrow-svg");
        svg.style.position = "absolute";
        svg.style.top = "0";
        svg.style.left = "0";
        svg.style.pointerEvents = "none";
        svg.style.zIndex = "100";
        
        // Calculate the angle and length of the arrow
        const dx = toX - fromX;
        const dy = toY - fromY;
        const angle = Math.atan2(dy, dx);
        const length = Math.sqrt(dx * dx + dy * dy);
        
        // Adjust start and end points to not cover the pieces
        const margin = squareSize * 0.3;
        const startX = fromX + Math.cos(angle) * margin;
        const startY = fromY + Math.sin(angle) * margin;
        const endX = toX - Math.cos(angle) * margin;
        const endY = toY - Math.sin(angle) * margin;
        
        // Create the arrow line
        const line = document.createElementNS(svgNS, "line");
        line.setAttribute("x1", startX);
        line.setAttribute("y1", startY);
        line.setAttribute("x2", endX);
        line.setAttribute("y2", endY);
        line.setAttribute("stroke", "rgb(235, 97, 80)");
        line.setAttribute("stroke-width", squareSize / 8);
        line.setAttribute("opacity", "0.8");
        
        // Create the arrow head
        const arrowHead = document.createElementNS(svgNS, "polygon");
        const arrowSize = squareSize / 4;
        const arrowAngle = Math.PI / 7;
        
        const point1X = endX;
        const point1Y = endY;
        const point2X = endX - arrowSize * Math.cos(angle - arrowAngle);
        const point2Y = endY - arrowSize * Math.sin(angle - arrowAngle);
        const point3X = endX - arrowSize * Math.cos(angle + arrowAngle);
        const point3Y = endY - arrowSize * Math.sin(angle + arrowAngle);
        
        arrowHead.setAttribute("points", `${point1X},${point1Y} ${point2X},${point2Y} ${point3X},${point3Y}`);
        arrowHead.setAttribute("fill", "rgb(235, 97, 80)");
        arrowHead.setAttribute("opacity", "0.8");
        
        // Add elements to SVG
        svg.appendChild(line);
        svg.appendChild(arrowHead);
        
        // Add the SVG to the board
        boardElement.appendChild(svg);
        
        // If not persistent, remove after delay
        if (!isPersistent) {
            setTimeout(() => {
                if (svg.parentNode) {
                    svg.parentNode.removeChild(svg);
                }
            }, 1800);
        }
    }

    // Modify the movePiece function to clear highlights and arrows when a move is made
    myFunctions.movePiece = function(from, to){
        // Clear any existing highlights and arrows when a move is made
        myFunctions.clearHighlights();
        myFunctions.clearArrows();
        
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
        
        // Add visual indicators for advantage
        const advantageIndicator = document.getElementById('advantage-indicator');
        if (!advantageIndicator) {
            const indicator = document.createElement('div');
            indicator.id = 'advantage-indicator';
            indicator.style = `
                position: absolute;
                right: 0;
                width: 100%;
                text-align: center;
                font-size: 12px;
                font-weight: bold;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
                pointer-events: none;
            `;
            evalBar.parentElement.appendChild(indicator);
        }
        
        const indicator = document.getElementById('advantage-indicator');
        
        // Clear any existing labels
        while (indicator.firstChild) {
            indicator.removeChild(indicator.firstChild);
        }
        
        // Add advantage labels
        const addLabel = (position, text, color) => {
            const label = document.createElement('div');
            label.textContent = text;
            label.style = `
                position: absolute;
                top: ${position}%;
                width: 100%;
                color: ${color};
                transform: translateY(-50%);
            `;
            indicator.appendChild(label);
        };
        
        // Add labels for different advantage levels
        addLabel(0, "Black ++", myVars.blackAdvantageColor || '#F44336');
        addLabel(25, "Black +", myVars.blackAdvantageColor || '#F44336');
        addLabel(50, "Equal", '#9E9E9E');
        addLabel(75, "White +", myVars.whiteAdvantageColor || '#4CAF50');
        addLabel(100, "White ++", myVars.whiteAdvantageColor || '#4CAF50');
        
        // Add a marker for current evaluation
        const marker = document.createElement('div');
        marker.style = `
            position: absolute;
            top: ${percentage}%;
            left: -15px;
            width: 0;
            height: 0;
            border-top: 6px solid transparent;
            border-bottom: 6px solid transparent;
            border-left: 10px solid #FFC107;
            transform: translateY(-50%);
        `;
        indicator.appendChild(marker);
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
            div.setAttribute('style','background-color:white; height:auto; border-radius: 12px; box-shadow: 0 6px 16px rgba(0,0,0,0.15); padding: 0; max-width: 300px; position: relative; font-family: "Segoe UI", Arial, sans-serif;');
            div.setAttribute('id','settingsContainer');
            
            // Create header with collapse button
            var header = document.createElement('div');
            header.style = `
                background-color: #2196F3;
                color: white;
                padding: 12px 15px;
                border-top-left-radius: 12px;
                border-top-right-radius: 12px;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-weight: 600;
                letter-spacing: 0.3px;
            `;
            header.innerHTML = `
                <span style="font-weight: bold; font-size: 15px;">Chess AI Controls</span>
                <span id="collapseBtn" style="transition: transform 0.3s;">▼</span>
            `;
            //div.appendChild(header);


            async function createDraggableHeader(div) {
                // Set initial positioning and z-index
                div.style.position = 'fixed';
                div.style.zIndex = '9999';
                div.style.margin = '0';
                div.style.padding = '0';
            
                var header = document.createElement('div');
                header.style = `
                    background-color: #2196F3;
                    color: white;
                    padding: 12px 15px;
                    border-top-left-radius: 12px;
                    border-top-right-radius: 12px;
                    cursor: move;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-weight: 600;
                    letter-spacing: 0.3px;
                    user-select: none;
                `;
                header.innerHTML = `
                    <span id="dragArea" style="font-weight: bold; font-size: 15px; flex-grow: 1; cursor: move;">Chess AI Controls</span>
                    <span id="collapseBtn" style="transition: transform 0.3s;">▼</span>
                `;
                div.appendChild(header);
            
                // Make the entire div draggable
                let isDragging = false;
                let currentX;
                let currentY;
                let initialX;
                let initialY;
                let xOffset = 0;
                let yOffset = 0;
            
                // Restore previous position on load
                try {
                    const savedPosition = await GM.getValue('GUI Position', null);
                    if (savedPosition) {
                        xOffset = savedPosition.x;
                        yOffset = savedPosition.y;
                        div.style.transform = `translate3d(${xOffset}px, ${yOffset}px, 0)`;
                    }
                } catch (error) {
                    console.error('Error loading saved position:', error);
                }
            
                // Drag area now includes the entire text span
                const dragArea = header.querySelector('#dragArea');
            
                // Event listeners for dragging
                dragArea.addEventListener('mousedown', dragStart);
                document.addEventListener('mouseup', dragEnd);
                document.addEventListener('mousemove', drag);
            
                function dragStart(e) {
                    // Prevent default to stop text selection and scrolling
                    e.preventDefault();
                    
                    initialX = e.clientX - xOffset;
                    initialY = e.clientY - yOffset;
            
                    isDragging = true;
                }
            
                function dragEnd(e) {
                    // Prevent default to stop any browser scrolling behavior
                    e.preventDefault();
                    
                    initialX = currentX;
                    initialY = currentY;
            
                    isDragging = false;
            
                    // Save the current position
                    try {
                        GM.setValue('GUI Position', { x: xOffset, y: yOffset });
                    } catch (error) {
                        console.error('Error saving position:', error);
                    }
                }
            
                function drag(e) {
                    if (isDragging) {
                        // Prevent default to stop scrolling and text selection
                        e.preventDefault();
                        
                        // Constrain to viewport
                        currentX = Math.max(0, Math.min(e.clientX - initialX, window.innerWidth - div.offsetWidth));
                        currentY = Math.max(0, Math.min(e.clientY - initialY, window.innerHeight - div.offsetHeight));
            
                        xOffset = currentX;
                        yOffset = currentY;
            
                        setTranslate(currentX, currentY, div);
                    }
                }
            
                function setTranslate(xPos, yPos, el) {
                    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
                }
            
                return header;
            }
            
            // Usage example:
             (async () => {
                 //var div = document.createElement('div');
                 await createDraggableHeader(div);
             })();



            // Create content container
            var contentContainer = document.createElement('div');
            contentContainer.id = 'aiControlsContent';
            contentContainer.style = 'padding: 15px; font-family: "Segoe UI", Arial, sans-serif; font-size: 14px;';
            
            // Add CSS for tabs
            var tabStyle = document.createElement('style');
            tabStyle.textContent = `
                .tab-container {
                    width: 100%;
                }
                .tab-nav {
                    display: flex;
                    border-bottom: 2px solid #2196F3;
                    margin-bottom: 15px;
                    overflow-x: hidden; /* Prevent scrolling */
                    flex-wrap: nowrap; /* Keep tabs in a single row */
                    justify-content: space-between; /* Distribute space evenly */
                }
                .tab-button {
                    padding: 8px 5px; /* Reduce padding to fit all tabs */
                    background-color: #f8f8f8;
                    border: none;
                    border-radius: 8px 8px 0 0;
                    margin-right: 1px; /* Reduce margin between tabs */
                    cursor: pointer;
                    transition: all 0.3s;
                    font-weight: bold;
                    color: #666;
                    flex: 1;
                    text-align: center;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 -2px 5px rgba(0,0,0,0.05);
                    font-size: 12px; /* Reduce font size to fit better */
                }
                .tab-button:hover {
                    background-color: #e9f5ff;
                    color: #2196F3;
                    transform: translateY(-2px);
                }
                .tab-button.active {
                    background-color: #2196F3;
                    color: white;
                    box-shadow: 0 -2px 5px rgba(33,150,243,0.3);
                    transform: translateY(-3px);
                    position: relative;
                }
                .tab-button.active::after {
                    content: '';
                    position: absolute;
                    bottom: -2px;
                    left: 0;
                    width: 100%;
                    height: 2px;
                    background-color: #2196F3;
                }
                .tab-content {
                    display: none;
                    padding: 10px 0;
                }
                .tab-content.active {
                    display: block;
                    animation: fadeIn 0.3s;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                /* Responsive design for small screens */
                @media (max-width: 500px) {
                    .tab-button {
                        padding: 8px 5px;
                        font-size: 12px;
                    }
                }
                
                /* Toggle switch styles */
                .switch {
                    position: relative;
                    display: inline-block;
                    width: 46px;
                    height: 24px;
                }
                
                .switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #ccc;
                    transition: .3s;
                    border-radius: 24px;
                }
                
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 18px;
                    width: 18px;
                    left: 3px;
                    bottom: 3px;
                    background-color: white;
                    transition: .3s;
                    border-radius: 50%;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                
                input:checked + .slider {
                    background-color: #2196F3;
                }
                
                input:focus + .slider {
                    box-shadow: 0 0 2px #2196F3;
                }
                
                input:checked + .slider:before {
                    transform: translateX(22px);
                }
                
                /* Button styles */
                button {
                    transition: all 0.2s ease;
                }
                
                button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }
                
                button:active {
                    transform: translateY(0);
                }
                
                /* Input styles */
                input[type="range"] {
                    -webkit-appearance: none;
                    height: 8px;
                    border-radius: 4px;
                    background: #e0e0e0;
                    outline: none;
                }
                
                input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: #2196F3;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                
                input[type="range"]::-moz-range-thumb {
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: #2196F3;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                
                /* Select styles */
                select {
                    appearance: none;
                    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
                    background-repeat: no-repeat;
                    background-position: right 10px center;
                    background-size: 12px;
                    padding-right: 30px !important;
                    transition: all 0.2s;
                }
                
                select:focus {
                    border-color: #2196F3;
                    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
                }
                
                /* Tooltip styles */
                [title] {
                    position: relative;
                }
                
                [title]:hover::after {
                    content: attr(title);
                    position: absolute;
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: #333;
                    color: white;
                    padding: 5px 10px;
                    border-radius: 4px;
                    white-space: nowrap;
                    z-index: 1000;
                    font-size: 12px;
                }
            `;
            document.head.appendChild(tabStyle);
            
            var content = `<div style="margin: 0;">
            <!-- Tab Navigation -->
            <div class="tab-container">
                <div class="tab-nav">
                    <button class="tab-button active" data-tab="engine">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 3px;">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        Engine
                    </button>
                    <button class="tab-button" data-tab="actions">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 3px;">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                        Actions
                    </button>
                    <button class="tab-button" data-tab="visual">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 3px;">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        Visual
                    </button>
                    <button class="tab-button" data-tab="playstyle">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 3px;">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        Play
                    </button>
                    <button class="tab-button" data-tab="auto">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 3px;">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                            <path d="M2 17l10 5 10-5"></path>
                            <path d="M2 12l10 5 10-5"></path>
                        </svg>
                        Auto
                    </button>
                </div>
                
                <!-- Engine Tab -->
                <div id="engine-tab" class="tab-content active">
            <div style="margin-bottom: 15px;">
                        <p id="depthText" style="margin: 0 0 5px 0;">Current Depth: <strong>11</strong></p>
                        <div style="display: flex; align-items: center;">
                            <div style="flex-grow: 1;">
                                <label for="depthSlider" style="display: block; margin-bottom: 5px;">Adjust Depth (1-30):</label>
                <input type="range" id="depthSlider" name="depthSlider" min="1" max="30" step="1" value="11" 
                                    oninput="document.getElementById('depthText').innerHTML = 'Current Depth: <strong>' + this.value + '</strong>';" 
                                    style="width: 100%;" title="Higher depth = stronger analysis but slower calculation">
                            </div>
                            <button id="applyDepth" style="margin-left: 10px; padding: 5px 10px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; box-shadow: 0 2px 4px rgba(76, 175, 80, 0.2);" title="Apply the selected depth to the engine">Apply</button>
                        </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                        <div style="display: flex; align-items: center; margin-bottom: 5px;">
                            <label for="eloSlider" style="margin-right: 5px;">Engine ELO Rating: <span id="eloValue">1500</span></label>
                            <button id="eloInfoBtn" title="ELO rating determines the playing strength of the engine" style="margin-left: 5px; padding: 0 5px; background-color: #2196F3; color: white; border: none; border-radius: 50%; cursor: pointer; font-size: 12px;">?</button>
                        </div>
                <input type="range" id="eloSlider" name="eloSlider" min="1000" max="3000" step="50" value="1500" 
                               oninput="document.myFunctions.updateEngineElo()" style="width: 100%;">
                        <div id="eloDepthInfo" style="font-size: 12px; color: #666; margin-top: 5px; font-style: italic;">
                    Note: Lower ELO settings will limit the maximum search depth
                        </div>
                </div>
            </div>
            
                <!-- Play Style Tab -->
                <div id="playstyle-tab" class="tab-content">
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        <!-- Fusion Mode -->
                        <div style="border-left: 3px solid #2196F3; padding-left: 10px;">
                            <div style="display: flex; align-items: center; margin-bottom: 5px;">
                                <label for="fusionModeToggle" style="margin-right: 10px; font-weight: bold;">Fusion Mode:</label>
                    <label class="switch">
                        <input type="checkbox" id="fusionMode" name="fusionMode" value="false">
                        <span class="slider"></span>
                    </label>
                    <span id="fusionModeStatus" style="margin-left: 10px; font-size: 12px; color: #666;">Off</span>
                </div>
                <div id="opponentRatingInfo" style="font-size: 12px; color: #666; margin-top: 5px;">
                                When enabled, the engine will match your opponent's rating
                </div>
            </div>
            
                        <!-- Human Mode -->
                        <div style="border-left: 3px solid #9C27B0; padding-left: 10px;">
                            <div style="display: flex; align-items: center; margin-bottom: 5px;">
                                <label for="humanModeToggle" style="margin-right: 10px; font-weight: bold;">Human Mode:</label>
                    <label class="switch">
                        <input type="checkbox" id="humanMode" name="humanMode" value="false">
                        <span class="slider"></span>
                    </label>
                    <span id="humanModeStatus" style="margin-left: 10px; font-size: 12px; color: #666;">Off</span>
                </div>
                            
                <div style="margin-top: 10px;">
                                <div style="display: flex; align-items: center; margin-bottom: 5px;">
                                    <label for="humanModeSelect" style="margin-right: 5px;">Human Skill Level: <span id="humanModeLevel">Intermediate</span></label>
                                    <button id="humanModeInfoBtn" title="Choose how the engine mimics human play" style="margin-left: 5px; padding: 0 5px; background-color: #9C27B0; color: white; border: none; border-radius: 50%; cursor: pointer; font-size: 12px;">?</button>
                                </div>
                                <select id="humanModeSelect" style="width: 100%; padding: 8px; margin-top: 5px; border-radius: 4px; border: 1px solid #ddd;">
                        <option value="beginner">Beginner (ELO ~800)</option>
                        <option value="casual">Casual (ELO ~1200)</option>
                        <option value="intermediate" selected>Intermediate (ELO ~1600)</option>
                        <option value="advanced">Advanced (ELO ~2000)</option>
                        <option value="expert">Expert (ELO ~2400)</option>
                    </select>
                </div>
                            <div id="humanModeInfo" style="font-size: 12px; color: #666; margin-top: 5px; font-style: italic;">
                    When enabled, the engine will play like a human with realistic mistakes and timing
                            </div>
                        </div>
                </div>
            </div>
            
                <!-- Visual Settings Tab -->
                <div id="visual-tab" class="tab-content">
            <div style="margin-bottom: 15px;">
                        <label for="evalBarColor" style="display: block; margin-bottom: 5px;">Evaluation Bar Color Theme:</label>
                        <select id="evalBarColor" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
                    <option value="default">Default (Green/Red)</option>
                    <option value="blue">Blue/Orange</option>
                    <option value="purple">Purple/Yellow</option>
                    <option value="custom">Custom</option>
                </select>
            </div>
            
                    <div id="customColorContainer" style="display: none; margin-bottom: 15px; padding: 10px; border: 1px dashed #ccc; border-radius: 4px;">
                        <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px;">
                            <label for="whiteAdvantageColor">White Advantage:</label>
                            <input type="color" id="whiteAdvantageColor" value="#4CAF50" style="width: 40px; height: 30px;">
                        </div>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <label for="blackAdvantageColor">Black Advantage:</label>
                            <input type="color" id="blackAdvantageColor" value="#F44336" style="width: 40px; height: 30px;">
                        </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                        <div style="display: flex; align-items: center; margin-bottom: 8px;">
                            <input type="checkbox" id="showArrows" name="showArrows" value="true" checked style="margin-right: 8px;">
                            <label for="showArrows"> Show move arrows</label>
                        </div>
                        
                        <div style="display: flex; align-items: center; margin-bottom: 12px;">
                            <input type="checkbox" id="persistentHighlights" name="persistentHighlights" value="true" checked style="margin-right: 8px;">
                            <label for="persistentHighlights"> Keep highlights until next move</label>
                        </div>

                        <div style="margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: bold;">Move Indicator Style:</label>
                            <div style="display: flex; align-items: center; margin-bottom: 8px;">
                                <input type="radio" id="moveIndicatorHighlights" name="moveIndicatorType" value="highlights" checked style="margin-right: 8px;">
                                <label for="moveIndicatorHighlights"> Highlights</label>
                            </div>
                            <div style="display: flex; align-items: center;">
                                <input type="radio" id="moveIndicatorArrows" name="moveIndicatorType" value="arrows" style="margin-right: 8px;">
                                <label for="moveIndicatorArrows"> Arrows</label>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Automation Tab -->
                <div id="auto-tab" class="tab-content">
                    <div style="margin-bottom: 20px; border-left: 3px solid #FF9800; padding-left: 12px;">
                        <div style="display: flex; align-items: center; margin-bottom: 10px;">
                            <label for="autoRunToggle" style="margin-right: 10px; font-weight: bold; color: #FF9800;">Auto Run:</label>
                            <label class="switch">
                                <input type="checkbox" id="autoRun" name="autoRun" value="false">
                                <span class="slider" style="background-color: #ccc;"></span>
                            </label>
                            <span id="autoRunStatus" style="margin-left: 10px; font-size: 12px; color: #666;">Off</span>
                        </div>
                        <div style="font-size: 12px; color: #666; margin-bottom: 10px;">
                            Automatically runs the engine when it's your turn
                        </div>
                    </div>
                
                    <div style="margin-bottom: 20px; border-left: 3px solid #4CAF50; padding-left: 12px;">
                        <div style="display: flex; align-items: center; margin-bottom: 10px;">
                            <label for="autoMove" style="margin-right: 10px; font-weight: bold; color: #4CAF50;">Auto Move:</label>
                            <label class="switch">
                                <input type="checkbox" id="autoMove" name="autoMove" value="false">
                                <span class="slider" style="background-color: #ccc;"></span>
                            </label>
                            <span id="autoMoveStatus" style="margin-left: 10px; font-size: 12px; color: #666;">Off</span>
                        </div>
                        <div style="font-size: 12px; color: #666; margin-bottom: 10px;">
                            Automatically plays the best move for you
                        </div>
                    </div>
            
                    <div style="margin-top: 15px; background-color: #f8f8f8; padding: 12px; border-radius: 6px;">
                        <label style="display: block; margin-bottom: 10px; font-weight: bold;">Auto Run Delay (Seconds):</label>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="flex: 1;">
                                <label for="timeDelayMin" style="display: block; font-size: 12px; margin-bottom: 3px;">Minimum:</label>
                                <input type="number" id="timeDelayMin" name="timeDelayMin" min="0.1" value="0.1" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
                            </div>
                            <span style="color: #666;">to</span>
                            <div style="flex: 1;">
                                <label for="timeDelayMax" style="display: block; font-size: 12px; margin-bottom: 3px;">Maximum:</label>
                                <input type="number" id="timeDelayMax" name="timeDelayMax" min="0.1" value="1" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
                            </div>
                        </div>
                        <div style="font-size: 12px; color: #666; margin-top: 8px; font-style: italic;">
                            Random delay between min and max to simulate human thinking time
                        </div>
                    </div>
                </div>
            </div>
            
                <!-- Actions Tab -->
                <div id="actions-tab" class="tab-content">
                    <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                        <button id="runEngineBtn" style="flex: 1; padding: 10px; background-color: #4CAF50; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; box-shadow: 0 2px 5px rgba(76, 175, 80, 0.3);">
                            <span style="display: flex; align-items: center; justify-content: center;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 5px;">
                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                                Run Engine
                            </span>
                        </button>
                        <button id="stopEngineBtn" style="flex: 1; padding: 10px; background-color: #F44336; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; box-shadow: 0 2px 5px rgba(244, 67, 54, 0.3);">
                            <span style="display: flex; align-items: center; justify-content: center;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 5px;">
                                    <rect x="6" y="6" width="12" height="12"></rect>
                                </svg>
                                Stop Engine
                            </span>
                        </button>
                    </div>
            
                    <button id="saveSettingsBtn" style="width: 100%; padding: 10px; background-color: #2196F3; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; margin-bottom: 10px; box-shadow: 0 2px 5px rgba(33, 150, 243, 0.3);">
                        <span style="display: flex; align-items: center; justify-content: center;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 5px;">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                <polyline points="7 3 7 8 15 8"></polyline>
                            </svg>
                            Save Settings
                        </span>
                    </button>
                    
                    <button id="showKeyboardShortcuts" style="width: 100%; padding: 10px; background-color: #9C27B0; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; box-shadow: 0 2px 5px rgba(156, 39, 176, 0.3);">
                        <span style="display: flex; align-items: center; justify-content: center;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 5px;">
                                <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
                                <line x1="6" y1="8" x2="6" y2="8"></line>
                                <line x1="10" y1="8" x2="10" y2="8"></line>
                                <line x1="14" y1="8" x2="14" y2="8"></line>
                                <line x1="18" y1="8" x2="18" y2="8"></line>
                                <line x1="8" y1="12" x2="16" y2="12"></line>
                                <line x1="6" y1="16" x2="6" y2="16"></line>
                                <line x1="18" y1="16" x2="18" y2="16"></line>
                                <line x1="10" y1="16" x2="14" y2="16"></line>
                            </svg>
                            Keyboard Shortcuts
                        </span>
                    </button>
                </div>
            </div>
            </div>`;
            
            contentContainer.innerHTML = content;
            div.appendChild(contentContainer);
            
            // Move history will be added later in the code
            
            // Create keyboard shortcuts modal with improved styling
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
                box-shadow: 0 4px 20px rgba(0,0,0,0.2);
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
                transition: color 0.2s;
            `;
            closeBtn.onmouseover = function() {
                this.style.color = '#F44336';
            };
            closeBtn.onmouseout = function() {
                this.style.color = '#333';
            };
            closeBtn.onclick = function() {
                keyboardModal.style.display = 'none';
            };
            
            modalContent.appendChild(closeBtn);
            
            var shortcutsTitle = document.createElement('h2');
            shortcutsTitle.textContent = 'Keyboard Shortcuts';
            shortcutsTitle.style = 'margin-top: 0; color: #2196F3; border-bottom: 2px solid #eee; padding-bottom: 10px;';
            modalContent.appendChild(shortcutsTitle);
            
            // Add a brief description
            var shortcutsDescription = document.createElement('p');
            shortcutsDescription.textContent = 'Press any of these keys to quickly run the engine at different depths. Keys are organized by strength level.';
            shortcutsDescription.style = 'margin-bottom: 20px; color: #666;';
            modalContent.appendChild(shortcutsDescription);
            
            // Add visual keyboard layout
            var keyboardLayout = document.createElement('div');
            keyboardLayout.style = `
                background-color: #f5f5f5;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 20px;
                text-align: center;
                font-family: monospace;
            `;
            
            keyboardLayout.innerHTML = `
                <div style="margin-bottom: 10px; font-weight: bold; color: #666;">Visual Keyboard Guide</div>
                <div style="display: flex; justify-content: center; margin-bottom: 8px;">
                    <div style="width: 40px; height: 40px; background-color: #e0e0e0; border: 1px solid #ccc; border-radius: 4px; display: flex; justify-content: center; align-items: center; margin: 0 2px; position: relative;">Q<span style="position: absolute; bottom: 2px; right: 2px; font-size: 8px; color: #F44336;">1</span></div>
                    <div style="width: 40px; height: 40px; background-color: #e0e0e0; border: 1px solid #ccc; border-radius: 4px; display: flex; justify-content: center; align-items: center; margin: 0 2px; position: relative;">W<span style="position: absolute; bottom: 2px; right: 2px; font-size: 8px; color: #F44336;">2</span></div>
                    <div style="width: 40px; height: 40px; background-color: #e0e0e0; border: 1px solid #ccc; border-radius: 4px; display: flex; justify-content: center; align-items: center; margin: 0 2px; position: relative;">E<span style="position: absolute; bottom: 2px; right: 2px; font-size: 8px; color: #F44336;">3</span></div>
                    <div style="width: 40px; height: 40px; background-color: #e0e0e0; border: 1px solid #ccc; border-radius: 4px; display: flex; justify-content: center; align-items: center; margin: 0 2px; position: relative;">R<span style="position: absolute; bottom: 2px; right: 2px; font-size: 8px; color: #FF9800;">4</span></div>
                    <div style="width: 40px; height: 40px; background-color: #e0e0e0; border: 1px solid #ccc; border-radius: 4px; display: flex; justify-content: center; align-items: center; margin: 0 2px; position: relative;">T<span style="position: absolute; bottom: 2px; right: 2px; font-size: 8px; color: #FF9800;">5</span></div>
                    <div style="width: 40px; height: 40px; background-color: #e0e0e0; border: 1px solid #ccc; border-radius: 4px; display: flex; justify-content: center; align-items: center; margin: 0 2px; position: relative;">Y<span style="position: absolute; bottom: 2px; right: 2px; font-size: 8px; color: #FF9800;">6</span></div>
                    <div style="width: 40px; height: 40px; background-color: #e0e0e0; border: 1px solid #ccc; border-radius: 4px; display: flex; justify-content: center; align-items: center; margin: 0 2px; position: relative;">U<span style="position: absolute; bottom: 2px; right: 2px; font-size: 8px; color: #FF9800;">7</span></div>
                    <div style="width: 40px; height: 40px; background-color: #e0e0e0; border: 1px solid #ccc; border-radius: 4px; display: flex; justify-content: center; align-items: center; margin: 0 2px; position: relative;">I<span style="position: absolute; bottom: 2px; right: 2px; font-size: 8px; color: #FF9800;">8</span></div>
                    <div style="width: 40px; height: 40px; background-color: #e0e0e0; border: 1px solid #ccc; border-radius: 4px; display: flex; justify-content: center; align-items: center; margin: 0 2px; position: relative;">O<span style="position: absolute; bottom: 2px; right: 2px; font-size: 8px; color: #FF9800;">9</span></div>
                    <div style="width: 40px; height: 40px; background-color: #e0e0e0; border: 1px solid #ccc; border-radius: 4px; display: flex; justify-content: center; align-items: center; margin: 0 2px; position: relative;">P<span style="position: absolute; bottom: 2px; right: 2px; font-size: 8px; color: #4CAF50;">10</span></div>
                </div>
                <div style="display: flex; justify-content: center; margin-bottom: 8px; margin-left: 20px;">
                    <div style="width: 40px; height: 40px; background-color: #e0e0e0; border: 1px solid #ccc; border-radius: 4px; display: flex; justify-content: center; align-items: center; margin: 0 2px; position: relative;">A<span style="position: absolute; bottom: 2px; right: 2px; font-size: 8px; color: #4CAF50;">11</span></div>
                    <div style="width: 40px; height: 40px; background-color: #e0e0e0; border: 1px solid #ccc; border-radius: 4px; display: flex; justify-content: center; align-items: center; margin: 0 2px; position: relative;">S<span style="position: absolute; bottom: 2px; right: 2px; font-size: 8px; color: #4CAF50;">12</span></div>
                    <div style="width: 40px; height: 40px; background-color: #e0e0e0; border: 1px solid #ccc; border-radius: 4px; display: flex; justify-content: center; align-items: center; margin: 0 2px; position: relative;">D<span style="position: absolute; bottom: 2px; right: 2px; font-size: 8px; color: #4CAF50;">13</span></div>
                    <div style="width: 40px; height: 40px; background-color: #e0e0e0; border: 1px solid #ccc; border-radius: 4px; display: flex; justify-content: center; align-items: center; margin: 0 2px; position: relative;">F<span style="position: absolute; bottom: 2px; right: 2px; font-size: 8px; color: #4CAF50;">14</span></div>
                    <div style="width: 40px; height: 40px; background-color: #e0e0e0; border: 1px solid #ccc; border-radius: 4px; display: flex; justify-content: center; align-items: center; margin: 0 2px; position: relative;">G<span style="position: absolute; bottom: 2px; right: 2px; font-size: 8px; color: #4CAF50;">15</span></div>
                    <div style="width: 40px; height: 40px; background-color: #e0e0e0; border: 1px solid #ccc; border-radius: 4px; display: flex; justify-content: center; align-items: center; margin: 0 2px; position: relative;">H<span style="position: absolute; bottom: 2px; right: 2px; font-size: 8px; color: #2196F3;">16</span></div>
                    <div style="width: 40px; height: 40px; background-color: #e0e0e0; border: 1px solid #ccc; border-radius: 4px; display: flex; justify-content: center; align-items: center; margin: 0 2px; position: relative;">J<span style="position: absolute; bottom: 2px; right: 2px; font-size: 8px; color: #2196F3;">17</span></div>
                    <div style="width: 40px; height: 40px; background-color: #e0e0e0; border: 1px solid #ccc; border-radius: 4px; display: flex; justify-content: center; align-items: center; margin: 0 2px; position: relative;">K<span style="position: absolute; bottom: 2px; right: 2px; font-size: 8px; color: #2196F3;">18</span></div>
                    <div style="width: 40px; height: 40px; background-color: #e0e0e0; border: 1px solid #ccc; border-radius: 4px; display: flex; justify-content: center; align-items: center; margin: 0 2px; position: relative;">L<span style="position: absolute; bottom: 2px; right: 2px; font-size: 8px; color: #2196F3;">19</span></div>
                </div>
                <div style="display: flex; justify-content: center; margin-left: 40px;">
                    <div style="width: 40px; height: 40px; background-color: #e0e0e0; border: 1px solid #ccc; border-radius: 4px; display: flex; justify-content: center; align-items: center; margin: 0 2px; position: relative;">Z<span style="position: absolute; bottom: 2px; right: 2px; font-size: 8px; color: #9C27B0;">20</span></div>
                    <div style="width: 40px; height: 40px; background-color: #e0e0e0; border: 1px solid #ccc; border-radius: 4px; display: flex; justify-content: center; align-items: center; margin: 0 2px; position: relative;">X<span style="position: absolute; bottom: 2px; right: 2px; font-size: 8px; color: #9C27B0;">21</span></div>
                    <div style="width: 40px; height: 40px; background-color: #e0e0e0; border: 1px solid #ccc; border-radius: 4px; display: flex; justify-content: center; align-items: center; margin: 0 2px; position: relative;">C<span style="position: absolute; bottom: 2px; right: 2px; font-size: 8px; color: #9C27B0;">22</span></div>
                    <div style="width: 40px; height: 40px; background-color: #e0e0e0; border: 1px solid #ccc; border-radius: 4px; display: flex; justify-content: center; align-items: center; margin: 0 2px; position: relative;">V<span style="position: absolute; bottom: 2px; right: 2px; font-size: 8px; color: #9C27B0;">23</span></div>
                    <div style="width: 40px; height: 40px; background-color: #e0e0e0; border: 1px solid #ccc; border-radius: 4px; display: flex; justify-content: center; align-items: center; margin: 0 2px; position: relative;">B<span style="position: absolute; bottom: 2px; right: 2px; font-size: 8px; color: #9C27B0;">24</span></div>
                    <div style="width: 40px; height: 40px; background-color: #e0e0e0; border: 1px solid #ccc; border-radius: 4px; display: flex; justify-content: center; align-items: center; margin: 0 2px; position: relative;">N<span style="position: absolute; bottom: 2px; right: 2px; font-size: 8px; color: #9C27B0;">25</span></div>
                    <div style="width: 40px; height: 40px; background-color: #e0e0e0; border: 1px solid #ccc; border-radius: 4px; display: flex; justify-content: center; align-items: center; margin: 0 2px; position: relative;">M<span style="position: absolute; bottom: 2px; right: 2px; font-size: 8px; color: #9C27B0;">26</span></div>
                </div>
                <div style="margin-top: 15px; display: flex; justify-content: center;">
                    <div style="width: 80px; height: 40px; background-color: #e0e0e0; border: 1px solid #ccc; border-radius: 4px; display: flex; justify-content: center; align-items: center; margin: 0 2px; position: relative;">=<span style="position: absolute; bottom: 2px; right: 2px; font-size: 8px; color: #E91E63;">MAX</span></div>
                </div>
                <div style="margin-top: 15px; font-size: 12px;">
                    <span style="color: #F44336;">■</span> Beginner &nbsp;
                    <span style="color: #FF9800;">■</span> Intermediate &nbsp;
                    <span style="color: #4CAF50;">■</span> Advanced &nbsp;
                    <span style="color: #2196F3;">■</span> Expert &nbsp;
                    <span style="color: #9C27B0;">■</span> Master &nbsp;
                    <span style="color: #E91E63;">■</span> Maximum
                </div>
            `;
            
            modalContent.appendChild(keyboardLayout);
            
            var shortcutsTable = document.createElement('table');
            shortcutsTable.style = 'width: 100%; border-collapse: collapse;';
            
            // Create table header
            var tableHeader = document.createElement('thead');
            tableHeader.innerHTML = `
                <tr style="background-color: #f5f5f5;">
                    <th style="text-align: left; padding: 12px; border-bottom: 2px solid #ddd; width: 20%;">Key</th>
                    <th style="text-align: left; padding: 12px; border-bottom: 2px solid #ddd;">Function</th>
                    <th style="text-align: left; padding: 12px; border-bottom: 2px solid #ddd;">Strength</th>
                </tr>
            `;
            shortcutsTable.appendChild(tableHeader);
            
            // Create table body with all keyboard shortcuts
            var tableBody = document.createElement('tbody');
            
            // Define all shortcuts with strength categories
            const shortcuts = [
                { key: 'Q', function: 'Run engine at depth 1', strength: 'Beginner' },
                { key: 'W', function: 'Run engine at depth 2', strength: 'Beginner' },
                { key: 'E', function: 'Run engine at depth 3', strength: 'Beginner' },
                { key: 'R', function: 'Run engine at depth 4', strength: 'Intermediate' },
                { key: 'T', function: 'Run engine at depth 5', strength: 'Intermediate' },
                { key: 'Y', function: 'Run engine at depth 6', strength: 'Intermediate' },
                { key: 'U', function: 'Run engine at depth 7', strength: 'Intermediate' },
                { key: 'I', function: 'Run engine at depth 8', strength: 'Intermediate' },
                { key: 'O', function: 'Run engine at depth 9', strength: 'Intermediate' },
                { key: 'P', function: 'Run engine at depth 10', strength: 'Advanced' },
                { key: 'A', function: 'Run engine at depth 11', strength: 'Advanced' },
                { key: 'S', function: 'Run engine at depth 12', strength: 'Advanced' },
                { key: 'D', function: 'Run engine at depth 13', strength: 'Advanced' },
                { key: 'F', function: 'Run engine at depth 14', strength: 'Advanced' },
                { key: 'G', function: 'Run engine at depth 15', strength: 'Advanced' },
                { key: 'H', function: 'Run engine at depth 16', strength: 'Expert' },
                { key: 'J', function: 'Run engine at depth 17', strength: 'Expert' },
                { key: 'K', function: 'Run engine at depth 18', strength: 'Expert' },
                { key: 'L', function: 'Run engine at depth 19', strength: 'Expert' },
                { key: 'Z', function: 'Run engine at depth 20', strength: 'Master' },
                { key: 'X', function: 'Run engine at depth 21', strength: 'Master' },
                { key: 'C', function: 'Run engine at depth 22', strength: 'Master' },
                { key: 'V', function: 'Run engine at depth 23', strength: 'Master' },
                { key: 'B', function: 'Run engine at depth 24', strength: 'Master' },
                { key: 'N', function: 'Run engine at depth 25', strength: 'Master' },
                { key: 'M', function: 'Run engine at depth 26', strength: 'Master' },
                { key: '=', function: 'Run engine at maximum depth', strength: 'Maximum' }
            ];
            
            // Add rows for each shortcut
            shortcuts.forEach((shortcut, index) => {
                const row = document.createElement('tr');
                row.style = index % 2 === 0 ? '' : 'background-color: #f9f9f9;';
                
                // Set color based on strength
                let strengthColor = '#333';
                switch(shortcut.strength) {
                    case 'Beginner': strengthColor = '#F44336'; break;
                    case 'Intermediate': strengthColor = '#FF9800'; break;
                    case 'Advanced': strengthColor = '#4CAF50'; break;
                    case 'Expert': strengthColor = '#2196F3'; break;
                    case 'Master': strengthColor = '#9C27B0'; break;
                    case 'Maximum': strengthColor = '#E91E63'; break;
                }
                
                row.innerHTML = `
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">
                            <kbd style="background-color: #f1f1f1; border: 1px solid #ccc; border-radius: 4px; padding: 2px 6px; font-family: monospace;">${shortcut.key}</kbd>
                        </td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${shortcut.function}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; color: ${strengthColor};">${shortcut.strength}</td>
                `;
                
                tableBody.appendChild(row);
            });
            
            shortcutsTable.appendChild(tableBody);
            modalContent.appendChild(shortcutsTable);
            
            // Add a note at the bottom
            var shortcutsNote = document.createElement('p');
            shortcutsNote.innerHTML = '<strong>Note:</strong> Higher depths provide stronger analysis but take longer to calculate. For casual play, depths 1-10 are usually sufficient. For serious analysis, try depths 15+.';
            shortcutsNote.style = 'margin-top: 20px; color: #666; font-size: 13px; background-color: #f5f5f5; padding: 10px; border-radius: 4px;';
            modalContent.appendChild(shortcutsNote);
            
            keyboardModal.appendChild(modalContent);
            document.body.appendChild(keyboardModal);
            
            // Add JavaScript for tab switching
            setTimeout(function() {
                const tabButtons = document.querySelectorAll('.tab-button');
                const collapseBtn = document.getElementById('collapseBtn');
                const aiControlsContent = document.getElementById('aiControlsContent');
                const header = document.querySelector('#settingsContainer > div:first-child');
                
                // Function to toggle content visibility
                const toggleContent = () => {
                    if (aiControlsContent.style.display === 'none') {
                        aiControlsContent.style.display = 'block';
                        collapseBtn.style.transform = 'rotate(0deg)';
                    } else {
                        aiControlsContent.style.display = 'none';
                        collapseBtn.style.transform = 'rotate(180deg)';
                    }
                };
                
                // Add collapse functionality to button
                if (collapseBtn && aiControlsContent) {
                    collapseBtn.addEventListener('click', function(e) {
                        e.stopPropagation(); // Prevent header click event
                        toggleContent();
                    });
                }
                
                // Make header clickable
                if (header && aiControlsContent) {
                    header.addEventListener('click', toggleContent);
                }
                
                // Handle Auto Move toggle
                const autoMoveCheckbox = document.getElementById('autoMove');
                const autoMoveStatus = document.getElementById('autoMoveStatus');
                if (autoMoveCheckbox && autoMoveStatus) {
                    autoMoveCheckbox.addEventListener('change', function() {
                        autoMoveStatus.textContent = this.checked ? 'On' : 'Off';
                        autoMoveStatus.style.color = this.checked ? '#4CAF50' : '#666';
                    });
                }
                
                // Handle Auto Run toggle
                const autoRunCheckbox = document.getElementById('autoRun');
                const autoRunStatus = document.getElementById('autoRunStatus');
                if (autoRunCheckbox && autoRunStatus) {
                    autoRunCheckbox.addEventListener('change', function() {
                        autoRunStatus.textContent = this.checked ? 'On' : 'Off';
                        autoRunStatus.style.color = this.checked ? '#FF9800' : '#666';
                    });
                }
                
                tabButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        // Remove active class from all tabs
                        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                        
                        // Add active class to clicked tab
                        this.classList.add('active');
                        document.getElementById(this.dataset.tab + '-tab').classList.add('active');
                    });
                });
            }, 500);

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
                // Visual feedback for auto move toggle
                if (this.checked) {
                    $(this).parent().append('<span id="autoMoveStatus" style="margin-left: 10px; font-size: 12px; color: #4CAF50;">On</span>');
                } else {
                    $('#autoMoveStatus').remove();
                }
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
            
            // Add event listeners for the move indicator type radio buttons
            $('input[name="moveIndicatorType"]').on('change', function() {
                myVars.moveIndicatorType = this.value;
                
                // Clear any existing highlights and arrows when changing the indicator type
                myFunctions.clearHighlights();
                myFunctions.clearArrows();
            });
            
            // Improved visual feedback for toggle switches
            $('.switch input[type="checkbox"]').each(function() {
                const statusElement = $('#' + this.id + 'Status');
                if (statusElement.length) {
                    if (this.checked) {
                        statusElement.text('On');
                        statusElement.css('color', '#4CAF50');
                    } else {
                        statusElement.text('Off');
                        statusElement.css('color', '#666');
                    }
                }
            });
            
            // Add visual feedback to buttons
            $('#runEngineBtn, #stopEngineBtn, #saveSettingsBtn, #showKeyboardShortcuts, #applyDepth').each(function() {
                $(this).css('transition', 'all 0.2s ease');
                
                $(this).hover(
                    function() { 
                        $(this).css({
                            'opacity': '0.9',
                            'transform': 'translateY(-1px)',
                            'box-shadow': '0 2px 5px rgba(0,0,0,0.2)'
                        });
                    },
                    function() { 
                        $(this).css({
                            'opacity': '1',
                            'transform': 'translateY(0)',
                            'box-shadow': 'none'
                        });
                    }
                );
                
                $(this).mousedown(function() {
                    $(this).css('transform', 'translateY(1px)');
                });
                
                $(this).mouseup(function() {
                    $(this).css('transform', 'translateY(-1px)');
                });
            });
            
            // Improve color theme selector
            $('#evalBarColor').on('change', function() {
                if (this.value === 'custom') {
                    $('#customColorContainer').slideDown(200);
                } else {
                    $('#customColorContainer').slideUp(200);
                }
            });
            
            // Add tooltips to buttons and controls
            $('#runEngineBtn').attr('title', 'Analyze the current position with the chess engine');
            $('#stopEngineBtn').attr('title', 'Stop the engine analysis');
            $('#saveSettingsBtn').attr('title', 'Save your current settings for future sessions');
            $('#depthSlider').attr('title', 'Higher depth = stronger analysis but slower calculation');
            $('#showArrows').attr('title', 'Display arrows showing the best moves on the board');
            $('#persistentHighlights').attr('title', 'Keep move highlights visible until the next move is made');
            $('#autoRun').attr('title', 'Automatically run the engine after each move');
            $('#autoMove').attr('title', 'Automatically make the best move for your side');
            $('#timeDelayMin').attr('title', 'Minimum delay before auto-running the engine');
            $('#timeDelayMax').attr('title', 'Maximum delay before auto-running the engine');
            
            // Close modals when clicking outside
            $('.modal-container').on('click', function(event) {
                if (event.target === this) {
                    $(this).css('display', 'none');
                }
            });
            
            // Add escape key to close modals
            $(document).on('keydown', function(event) {
                if (event.key === 'Escape') {
                    $('.modal-container').css('display', 'none');
                }
            });
            
            // Add class to modals for easier selection
            $('#keyboardShortcutsModal, #eloInfoModal, #humanModeInfoModal').addClass('modal-container');

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

//    getVersion();

    const waitForChessBoard = setInterval(() => {
        if(loaded) {
            board = $('chess-board')[0] || $('wc-chess-board')[0];
            
            // Only update these values when needed, not every 100ms
            if($('#autoRun')[0]) myVars.autoRun = $('#autoRun')[0].checked;
            if($('#autoMove')[0]) myVars.autoMove = $('#autoMove')[0].checked;
            if($('#showArrows')[0]) myVars.showArrows = $('#showArrows')[0].checked;
            
            // Update move indicator type if radio buttons exist
            if($('input[name="moveIndicatorType"]:checked')[0]) {
                myVars.moveIndicatorType = $('input[name="moveIndicatorType"]:checked')[0].value;
            }
            
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
                // Position changed, clear highlights and arrows
                myFunctions.clearHighlights();
                myFunctions.clearArrows();
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
            moveIndicatorType: myVars.moveIndicatorType || 'highlights',
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
            // First try to load settings from the combined JSON
            const savedSettings = await GM.getValue('chessAISettings', null);
            
            if (savedSettings) {
                // If settings exist as JSON, parse and apply them
                const settings = JSON.parse(savedSettings);
                
                // Apply saved settings to myVars
                myVars.eloRating = settings.eloRating || 1500;
                myVars.depth = settings.depth || 11;
                myVars.showArrows = settings.showArrows !== undefined ? settings.showArrows : true;
                myVars.persistentHighlights = settings.persistentHighlights !== undefined ? settings.persistentHighlights : true;
                myVars.moveIndicatorType = settings.moveIndicatorType || 'highlights';
                myVars.autoRun = settings.autoRun !== undefined ? settings.autoRun : false;
                myVars.autoMove = settings.autoMove !== undefined ? settings.autoMove : false;
                myVars.fusionMode = settings.fusionMode !== undefined ? settings.fusionMode : false;
                myVars.whiteAdvantageColor = settings.whiteAdvantageColor || '#4CAF50';
                myVars.blackAdvantageColor = settings.blackAdvantageColor || '#F44336';
                
                // Set humanMode
                if (settings.humanMode) {
                    myVars.humanMode = {
                        active: settings.humanMode.active,
                        level: settings.humanMode.level
                    };
                } else {
                    myVars.humanMode = { active: false, level: 'intermediate' };
                }
                
                // Update UI elements
                if ($('#depthSlider')[0]) {
                    $('#depthSlider')[0].value = myVars.depth;
                    $('#depthText').html('Current Depth: <strong>' + myVars.depth + '</strong>');
                }
                
                if ($('#eloSlider')[0]) {
                    $('#eloSlider')[0].value = myVars.eloRating;
                    $('#eloText').html('Current ELO: <strong>' + myVars.eloRating + '</strong>');
                }
                
                if ($('#autoMove')[0]) {
                    $('#autoMove')[0].checked = myVars.autoMove;
                }
                
                if ($('#autoRun')[0]) {
                    $('#autoRun')[0].checked = myVars.autoRun;
                }
                
                if ($('#showArrows')[0]) {
                    $('#showArrows')[0].checked = myVars.showArrows;
                }
                
                if ($('#persistentHighlights')[0]) {
                    $('#persistentHighlights')[0].checked = myVars.persistentHighlights;
                }
                
                if ($('input[name="moveIndicatorType"]').length) {
                    $('input[name="moveIndicatorType"][value="' + myVars.moveIndicatorType + '"]').prop('checked', true);
                }
                
                if ($('#humanMode')[0] && myVars.humanMode) {
                    $('#humanMode')[0].checked = myVars.humanMode.active;
                }
                
                if ($('#humanLevelSelect')[0] && myVars.humanMode) {
                    $('#humanLevelSelect')[0].value = myVars.humanMode.level;
                }
                
                if ($('#fusionMode')[0]) {
                    $('#fusionMode')[0].checked = myVars.fusionMode;
                }
                
                if ($('#whiteAdvantageColor')[0]) {
                    $('#whiteAdvantageColor')[0].value = myVars.whiteAdvantageColor;
                }
                
                if ($('#blackAdvantageColor')[0]) {
                    $('#blackAdvantageColor')[0].value = myVars.blackAdvantageColor;
                }
                
                if (settings.timeDelayMin !== undefined && $('#timeDelayMin')[0]) {
                    $('#timeDelayMin')[0].value = settings.timeDelayMin;
                }
                
                if (settings.timeDelayMax !== undefined && $('#timeDelayMax')[0]) {
                    $('#timeDelayMax')[0].value = settings.timeDelayMax;
                }
                
                if (settings.evalBarTheme && $('#evalBarColor')[0]) {
                    $('#evalBarColor').val(settings.evalBarTheme);
                    if (settings.evalBarTheme === 'custom') {
                        $('#customColorContainer').show();
                    }
                }
            } else {
                // Fallback to old method for backward compatibility
                const savedDepth = await GM.getValue('depth', 11);
                const savedElo = await GM.getValue('elo', 1500);
                const savedAutoMove = await GM.getValue('autoMove', false);
                const savedAutoRun = await GM.getValue('autoRun', false);
                const savedShowArrows = await GM.getValue('showArrows', true);
                const savedPersistentHighlights = await GM.getValue('persistentHighlights', true);
                const savedMoveIndicatorType = await GM.getValue('moveIndicatorType', 'highlights');
                const savedHumanMode = await GM.getValue('humanMode', false);
                const savedHumanLevel = await GM.getValue('humanLevel', 'intermediate');
                const savedFusionMode = await GM.getValue('fusionMode', false);
                const savedWhiteAdvantageColor = await GM.getValue('whiteAdvantageColor', '#4CAF50');
                const savedBlackAdvantageColor = await GM.getValue('blackAdvantageColor', '#F44336');
                
                // Apply saved settings
                myVars.depth = savedDepth;
                myVars.eloRating = savedElo;
                myVars.autoMove = savedAutoMove;
                myVars.autoRun = savedAutoRun;
                myVars.showArrows = savedShowArrows;
                myVars.persistentHighlights = savedPersistentHighlights;
                myVars.moveIndicatorType = savedMoveIndicatorType;
                myVars.humanMode = { active: savedHumanMode, level: savedHumanLevel };
                myVars.fusionMode = savedFusionMode;
                myVars.whiteAdvantageColor = savedWhiteAdvantageColor;
                myVars.blackAdvantageColor = savedBlackAdvantageColor;
                
                // Update UI elements to match saved settings
                if ($('#depthSlider')[0]) {
                    $('#depthSlider')[0].value = savedDepth;
                    $('#depthText').html('Current Depth: <strong>' + savedDepth + '</strong>');
                }
                
                if ($('#eloSlider')[0]) {
                    $('#eloSlider')[0].value = savedElo;
                    $('#eloText').html('Current ELO: <strong>' + savedElo + '</strong>');
                }
                
                if ($('#autoMove')[0]) {
                    $('#autoMove')[0].checked = savedAutoMove;
                }
                
                if ($('#autoRun')[0]) {
                    $('#autoRun')[0].checked = savedAutoRun;
                }
                
                if ($('#showArrows')[0]) {
                    $('#showArrows')[0].checked = savedShowArrows;
                }
                
                if ($('#persistentHighlights')[0]) {
                    $('#persistentHighlights')[0].checked = savedPersistentHighlights;
                }
                
                if ($('input[name="moveIndicatorType"]').length) {
                    $('input[name="moveIndicatorType"][value="' + savedMoveIndicatorType + '"]').prop('checked', true);
                }
                
                if ($('#humanMode')[0]) {
                    $('#humanMode')[0].checked = savedHumanMode;
                }
                
                if ($('#humanLevelSelect')[0]) {
                    $('#humanLevelSelect')[0].value = savedHumanLevel;
                }
                
                if ($('#fusionMode')[0]) {
                    $('#fusionMode')[0].checked = savedFusionMode;
                }
                
                if ($('#whiteAdvantageColor')[0]) {
                    $('#whiteAdvantageColor')[0].value = savedWhiteAdvantageColor;
                }
                
                if ($('#blackAdvantageColor')[0]) {
                    $('#blackAdvantageColor')[0].value = savedBlackAdvantageColor;
                }
                
                // After loading the settings from individual values, save them as a combined object
                // This will migrate users to the new format
                myFunctions.saveSettings();
            }
            
            // Check for first run (always use individual setting for this)
            const savedFirstRun = await GM.getValue('firstRun', true);
            
            // Show welcome modal for first-time users
            if (savedFirstRun) {
                setTimeout(() => {
                    myFunctions.showWelcomeModal();
                    GM.setValue('firstRun', false);
                }, 1000);
            }
            
            console.log('Settings loaded successfully');
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
    
    // Function to show welcome modal for first-time users
    function showWelcomeModal() {
        // Create welcome modal
        const welcomeModal = document.createElement('div');
        welcomeModal.id = 'welcomeModal';
        welcomeModal.style = `
            display: flex;
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
        
        const modalContent = document.createElement('div');
        modalContent.style = `
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        `;
        
        const closeBtn = document.createElement('span');
        closeBtn.innerHTML = '&times;';
        closeBtn.style = `
            position: absolute;
            top: 10px;
            right: 15px;
            font-size: 24px;
            cursor: pointer;
            color: #333;
            transition: color 0.2s;
        `;
        closeBtn.onmouseover = function() {
            this.style.color = '#F44336';
        };
        closeBtn.onmouseout = function() {
            this.style.color = '#333';
        };
        closeBtn.onclick = function() {
            welcomeModal.style.display = 'none';
        };
        
        modalContent.appendChild(closeBtn);
        
        // Welcome content
        const welcomeTitle = document.createElement('h2');
        welcomeTitle.textContent = 'Welcome to Chess AI!';
        welcomeTitle.style = 'margin-top: 0; color: #2196F3; border-bottom: 2px solid #eee; padding-bottom: 10px;';
        modalContent.appendChild(welcomeTitle);
        
        const welcomeText = document.createElement('p');
        welcomeText.textContent = 'Thank you for installing Chess AI. This tool helps you analyze chess positions and find the best moves during your games on Chess.com.';
        welcomeText.style = 'margin-bottom: 20px; color: #666;';
        modalContent.appendChild(welcomeText);
        
        // Quick start guide
        const quickStartTitle = document.createElement('h3');
        quickStartTitle.textContent = 'Quick Start Guide';
        quickStartTitle.style = 'color: #4CAF50; margin-bottom: 15px;';
        modalContent.appendChild(quickStartTitle);
        
        const steps = [
            { title: 'Run the Engine', content: 'Press any key from Q to M to run the engine at different depths. Higher depths give stronger analysis but take longer.' },
            { title: 'View Best Moves', content: 'The best moves will be highlighted on the board, and the evaluation bar will show who has the advantage.' },
            { title: 'Adjust Settings', content: 'Click the settings icon to customize the engine strength, visual indicators, and auto-play options.' },
            { title: 'Keyboard Shortcuts', content: 'Use keyboard shortcuts for quick access. Press the "Keyboard Shortcuts" button to see all available shortcuts.' }
        ];
        
        const stepsList = document.createElement('div');
        stepsList.style = 'margin-bottom: 25px;';
        
        steps.forEach((step, index) => {
            const stepItem = document.createElement('div');
            stepItem.style = 'margin-bottom: 15px; display: flex;';
            
            const stepNumber = document.createElement('div');
            stepNumber.textContent = (index + 1);
            stepNumber.style = `
                width: 25px;
                height: 25px;
                background-color: #2196F3;
                color: white;
                border-radius: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
                margin-right: 15px;
                flex-shrink: 0;
                font-weight: bold;
            `;
            
            const stepContent = document.createElement('div');
            
            const stepTitle = document.createElement('div');
            stepTitle.textContent = step.title;
            stepTitle.style = 'font-weight: bold; margin-bottom: 5px;';
            
            const stepDescription = document.createElement('div');
            stepDescription.textContent = step.content;
            stepDescription.style = 'color: #666;';
            
            stepContent.appendChild(stepTitle);
            stepContent.appendChild(stepDescription);
            
            stepItem.appendChild(stepNumber);
            stepItem.appendChild(stepContent);
            
            stepsList.appendChild(stepItem);
        });
        
        modalContent.appendChild(stepsList);
        
        // Tips section
        const tipsTitle = document.createElement('h3');
        tipsTitle.textContent = 'Pro Tips';
        tipsTitle.style = 'color: #FF9800; margin-bottom: 15px;';
        modalContent.appendChild(tipsTitle);
        
        const tipsList = document.createElement('ul');
        tipsList.style = 'margin-bottom: 25px; padding-left: 20px;';
        
        const tips = [
            'Use depths 1-10 for quick analysis and casual play.',
            'Use depths 15+ for serious analysis and difficult positions.',
            'Enable "Auto Move" to automatically play the best move.',
            'Try "Human Mode" to get more natural, human-like suggestions.',
            'Customize the evaluation bar colors in the Visual tab.'
        ];
        
        tips.forEach(tip => {
            const tipItem = document.createElement('li');
            tipItem.textContent = tip;
            tipItem.style = 'margin-bottom: 8px; color: #666;';
            tipsList.appendChild(tipItem);
        });
        
        modalContent.appendChild(tipsList);
        
        // Get started button
        const getStartedBtn = document.createElement('button');
        getStartedBtn.textContent = 'Get Started';
        getStartedBtn.style = `
            width: 100%;
            padding: 12px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            font-size: 16px;
            transition: background-color 0.2s;
        `;
        getStartedBtn.onmouseover = function() {
            this.style.backgroundColor = '#45a049';
        };
        getStartedBtn.onmouseout = function() {
            this.style.backgroundColor = '#4CAF50';
        };
        getStartedBtn.onclick = function() {
            welcomeModal.style.display = 'none';
        };
        
        modalContent.appendChild(getStartedBtn);
        
        welcomeModal.appendChild(modalContent);
        document.body.appendChild(welcomeModal);
    }

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

    myFunctions.extractOpponentRating = function() {
        // Try to find the opponent's rating
        try {
            const ratingElements = document.querySelectorAll('.user-tagline-rating');
            if (ratingElements.length >= 2) {
                // Find the element that doesn't match the player's username
                const playerUsername = document.querySelector('.user-username-component')?.textContent.trim();
                
                for (const element of ratingElements) {
                    const usernameElement = element.closest('.user-tagline')?.querySelector('.user-username-component');
                    if (usernameElement && usernameElement.textContent.trim() !== playerUsername) {
                        const rating = parseInt(element.textContent.trim());
                        if (!isNaN(rating)) {
                            console.log(`Opponent rating detected: ${rating}`);
                            return rating;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error extracting opponent rating:', error);
        }
        
        return null;
    }
    
    // Function to show welcome modal for first-time users
    myFunctions.showWelcomeModal = function() {
        // Create welcome modal
        const welcomeModal = document.createElement('div');
        welcomeModal.id = 'welcomeModal';
        welcomeModal.style = `
            display: flex;
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
        
        const modalContent = document.createElement('div');
        modalContent.style = `
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        `;
        
        const closeBtn = document.createElement('span');
        closeBtn.innerHTML = '&times;';
        closeBtn.style = `
            position: absolute;
            top: 10px;
            right: 15px;
            font-size: 24px;
            cursor: pointer;
            color: #333;
            transition: color 0.2s;
        `;
        closeBtn.onmouseover = function() {
            this.style.color = '#F44336';
        };
        closeBtn.onmouseout = function() {
            this.style.color = '#333';
        };
        closeBtn.onclick = function() {
            welcomeModal.style.display = 'none';
        };
        
        modalContent.appendChild(closeBtn);
        
        // Welcome content
        const welcomeTitle = document.createElement('h2');
        welcomeTitle.textContent = 'Welcome to Chess AI!';
        welcomeTitle.style = 'margin-top: 0; color: #2196F3; border-bottom: 2px solid #eee; padding-bottom: 10px;';
        modalContent.appendChild(welcomeTitle);
        
        const welcomeText = document.createElement('p');
        welcomeText.textContent = 'Thank you for installing Chess AI. This tool helps you analyze chess positions and find the best moves during your games on Chess.com.';
        welcomeText.style = 'margin-bottom: 20px; color: #666;';
        modalContent.appendChild(welcomeText);
        
        // Quick start guide
        const quickStartTitle = document.createElement('h3');
        quickStartTitle.textContent = 'Quick Start Guide';
        quickStartTitle.style = 'color: #4CAF50; margin-bottom: 15px;';
        modalContent.appendChild(quickStartTitle);
        
        const steps = [
            { title: 'Run the Engine', content: 'Press any key from Q to M to run the engine at different depths. Higher depths give stronger analysis but take longer.' },
            { title: 'View Best Moves', content: 'The best moves will be highlighted on the board, and the evaluation bar will show who has the advantage.' },
            { title: 'Adjust Settings', content: 'Click the settings icon to customize the engine strength, visual indicators, and auto-play options.' },
            { title: 'Keyboard Shortcuts', content: 'Use keyboard shortcuts for quick access. Press the "Keyboard Shortcuts" button to see all available shortcuts.' }
        ];
        
        const stepsList = document.createElement('div');
        stepsList.style = 'margin-bottom: 25px;';
        
        steps.forEach((step, index) => {
            const stepItem = document.createElement('div');
            stepItem.style = 'margin-bottom: 15px; display: flex;';
            
            const stepNumber = document.createElement('div');
            stepNumber.textContent = (index + 1);
            stepNumber.style = `
                width: 25px;
                height: 25px;
                background-color: #2196F3;
                color: white;
                border-radius: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
                margin-right: 15px;
                flex-shrink: 0;
                font-weight: bold;
            `;
            
            const stepContent = document.createElement('div');
            
            const stepTitle = document.createElement('div');
            stepTitle.textContent = step.title;
            stepTitle.style = 'font-weight: bold; margin-bottom: 5px;';
            
            const stepDescription = document.createElement('div');
            stepDescription.textContent = step.content;
            stepDescription.style = 'color: #666;';
            
            stepContent.appendChild(stepTitle);
            stepContent.appendChild(stepDescription);
            
            stepItem.appendChild(stepNumber);
            stepItem.appendChild(stepContent);
            
            stepsList.appendChild(stepItem);
        });
        
        modalContent.appendChild(stepsList);
        
        // Tips section
        const tipsTitle = document.createElement('h3');
        tipsTitle.textContent = 'Pro Tips';
        tipsTitle.style = 'color: #FF9800; margin-bottom: 15px;';
        modalContent.appendChild(tipsTitle);
        
        const tipsList = document.createElement('ul');
        tipsList.style = 'margin-bottom: 25px; padding-left: 20px;';
        
        const tips = [
            'Use depths 1-10 for quick analysis and casual play.',
            'Use depths 15+ for serious analysis and difficult positions.',
            'Enable "Auto Move" to automatically play the best move.',
            'Try "Human Mode" to get more natural, human-like suggestions.',
            'Customize the evaluation bar colors in the Visual tab.'
        ];
        
        tips.forEach(tip => {
            const tipItem = document.createElement('li');
            tipItem.textContent = tip;
            tipItem.style = 'margin-bottom: 8px; color: #666;';
            tipsList.appendChild(tipItem);
        });
        
        modalContent.appendChild(tipsList);
        
        // Get started button
        const getStartedBtn = document.createElement('button');
        getStartedBtn.textContent = 'Get Started';
        getStartedBtn.style = `
            width: 100%;
            padding: 12px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            font-size: 16px;
            transition: background-color 0.2s;
        `;
        getStartedBtn.onmouseover = function() {
            this.style.backgroundColor = '#45a049';
        };
        getStartedBtn.onmouseout = function() {
            this.style.backgroundColor = '#4CAF50';
        };
        getStartedBtn.onclick = function() {
            welcomeModal.style.display = 'none';
        };
        
        modalContent.appendChild(getStartedBtn);
        
        welcomeModal.appendChild(modalContent);
        document.body.appendChild(welcomeModal);
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