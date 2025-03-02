// ==UserScript==
// @name         Chess.com-Hack
// @namespace    github.com/longkidkoolstar
// @version      1.3.0
// @description  Chess.com Bot/Cheat that finds the best move with evaluation bar and ELO control!
// @author      longkidkoolstar
// @license      Chess.com Bot/Cheat © 2023 by MrAuzzie#998142, © All Rights Reserved
// @match       https://www.chess.com/play/*
// @match       https://www.chess.com/game/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// @grant       GM_getResourceText
// @grant       GM_registerMenuCommand
// @resource    stockfish.js        https://raw.githubusercontent.com/Auzgame/remote/main/stockfish.js
// @require     https://greasyfork.org/scripts/445697/code/index.js
// @require     https://code.jquery.com/jquery-3.6.0.min.js
// @run-at      document-start
// ==/UserScript==


const currentVersion = '1.3.0'; // Sets the current version

function main() {

    var stockfishObjectURL;
    var engine = document.engine = {};
    var myVars = document.myVars = {};
    myVars.autoMovePiece = false;
    myVars.autoRun = false;
    myVars.delay = 0.1;
    myVars.eloRating = 1500; // Default ELO rating
    myVars.currentEvaluation = 0; // Current evaluation value
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

        if(myVars.autoMove == true){
            myFunctions.movePiece(res1, res2);
        }
        isThinking = false;

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

    myFunctions.movePiece = function(from, to){
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
        if(e.data.includes('bestmove')){
            console.log(e.data.split(' ')[1]);
            myFunctions.color(e.data.split(' ')[1]);
            isThinking = false;
        }
        // Parse evaluation information
        if(e.data.includes('info') && e.data.includes('score cp')) {
            try {
                const parts = e.data.split(' ');
                const cpIndex = parts.indexOf('cp');
                if(cpIndex !== -1 && parts[cpIndex + 1]) {
                    const evalValue = parseInt(parts[cpIndex + 1]) / 100; // Convert centipawns to pawns
                    myVars.currentEvaluation = evalValue;
                    updateEvalBar(evalValue);
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
                    updateEvalBar(movesToMate > 0 ? 20 : -20, evalText); // Use a large value to show mate
                }
            } catch (err) {
                console.log('Error parsing mate:', err);
            }
        }
    }

    // Function to update the evaluation bar
    function updateEvalBar(evalValue, mateText = null) {
        if(!evalBar || !evalText) return;
        
        // Clamp the visual representation between -5 and 5
        const clampedEval = Math.max(-5, Math.min(5, evalValue));
        const percentage = 50 + (clampedEval * 10); // Convert to percentage (0-100)
        
        evalBar.style.height = `${percentage}%`;
        
        // Update color based on who's winning
        if(evalValue > 0.2) {
            evalBar.style.backgroundColor = '#4CAF50'; // Green for white advantage
        } else if(evalValue < -0.2) {
            evalBar.style.backgroundColor = '#F44336'; // Red for black advantage
        } else {
            evalBar.style.backgroundColor = '#9E9E9E'; // Grey for equal
        }
        
        // Update evaluation text
        if(mateText) {
            evalText.textContent = mateText;
        } else {
            const sign = evalValue > 0 ? '+' : '';
            evalText.textContent = `${sign}${evalValue.toFixed(1)}`;
        }
    }

    myFunctions.reloadChessEngine = function() {
        console.log(`Reloading the chess engine!`);

        engine.engine.terminate();
        isThinking = false;
        myFunctions.loadChessEngine();
    }

    myFunctions.loadChessEngine = function() {
        if(!stockfishObjectURL) {
            stockfishObjectURL = URL.createObjectURL(new Blob([GM_getResourceText('stockfish.js')], {type: 'application/javascript'}));
        }
        console.log(stockfishObjectURL);
        if(stockfishObjectURL) {
            engine.engine = new Worker(stockfishObjectURL);

            engine.engine.onmessage = e => {
                parser(e);
            };
            engine.engine.onerror = e => {
                console.log("Worker Error: "+e);
            };

            engine.engine.postMessage('ucinewgame');
            
            // Set ELO if specified
            if(myVars.eloRating) {
                setEngineElo(myVars.eloRating);
            }
        }
        console.log('loaded chess engine');
    }

    // Function to set engine ELO
    function setEngineElo(elo) {
        if(!engine.engine) return;
        
        // Stockfish supports UCI_Elo option to limit playing strength
        engine.engine.postMessage(`setoption name UCI_Elo value ${elo}`);
        
        // Also set UCI_LimitStrength to true to enable ELO limiting
        engine.engine.postMessage('setoption name UCI_LimitStrength value true');
        
        console.log(`Engine ELO set to ${elo}`);
    }

    // Function to update engine ELO from UI
    myFunctions.updateEngineElo = function() {
        const eloValue = parseInt($('#eloSlider')[0].value);
        $('#eloValue')[0].textContent = eloValue;
        myVars.eloRating = eloValue;
        
        if(engine.engine) {
            setEngineElo(eloValue);
        }
    }

    var lastValue = 11;
    myFunctions.runChessEngine = function(depth){
        //var fen = myFunctions.rescan();
        var fen = board.game.getFEN();
        engine.engine.postMessage(`position fen ${fen}`);
        console.log('updated: ' + `position fen ${fen}`);
        isThinking = true;
        engine.engine.postMessage(`go depth ${depth}`);
        lastValue = depth;
    }

    myFunctions.autoRun = function(lstValue){
        if(board.game.getTurn() == board.game.getPlayingAs()){
            myFunctions.runChessEngine(lstValue);
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


    myFunctions.replaceAd = function(){
        try {

            $('#sky-atf')[0].children[0].remove();
            var ifr = document.createElement('iframe');
            ifr.src = 'https://'+l;
            ifr.id = 'myAd1';
            ifr.height = '600px';
            ifr.width = '160px';
            $('#sky-atf')[0].appendChild(ifr)
        } catch (er) {console.log('Error Injecting Ad: '+er);}
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
            `;
            evalText.textContent = '0.0';
            
            // Add elements to the DOM
            evalBarContainer.appendChild(evalBar);
            board.parentElement.style.position = 'relative';
            board.parentElement.appendChild(evalBarContainer);
            board.parentElement.appendChild(evalText);

            var div = document.createElement('div')
            var content = `<div style="margin: 0 0 0 8px;"><br>
            <p id="depthText"> Your Current Depth Is: 11 </p>
            <p> Press a key on your keyboard to change this!</p><br>
            
            <div style="margin-bottom: 15px;">
                <label for="eloSlider">Engine ELO Rating: <span id="eloValue">1500</span></label><br>
                <input type="range" id="eloSlider" name="eloSlider" min="1000" max="3000" step="50" value="1500" 
                       oninput="document.myFunctions.updateEngineElo()" style="width: 80%;">
            </div>
            
            <input type="checkbox" id="autoRun" name="autoRun" value="false">
            <label for="autoRun"> Enable auto run</label><br>
            <input type="checkbox" id="autoMove" name="autoMove" value="false">
            <label for="autoMove"> Enable auto move</label><br>
            <input type="number" id="timeDelayMin" name="timeDelayMin" min="0.1" value=0.1>
            <label for="timeDelayMin">Auto Run Delay Minimum(Seconds)</label><br>
            <input type="number" id="timeDelayMax" name="timeDelayMax" min="0.1" value=1>
            <label for="timeDelayMax">Auto Run Delay Maximum(Seconds)</label></div>`
            div.innerHTML = content;
            div.setAttribute('style','background-color:white; height:auto;');
            div.setAttribute('id','settingsContainer');

            board.parentElement.parentElement.appendChild(div);

            //spinnerContainer
            var spinCont = document.createElement('div');
            spinCont.setAttribute('style','display:none;');
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
			color: #ffef85;
			background-color: #3cba2c;
			font-size: 19px;
			border: 1px solid #000000;
			padding: 15px 50px;
            letter-spacing: 1px;
			cursor: pointer
		    }
		    #relEngBut:hover {
			color: #000000;
			background-color: #ba1212;
		    }
            #relEngBut:active {
            background-color: #ba1212;
            transform: translateY(4px);
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
            div.append(relButDiv);

            // Issue Button
            var isBut = `<button type="button" name="isBut" onclick="window.confirm('Can I take you to the issues page?') ? document.location = 'https://github.com/Auzgame/userscripts/issues' : console.log('cancled')">Got An Issue/Bug?</button>`;
            tmpDiv = document.createElement('div');
            var isButDiv = document.createElement('div');

            isButDiv.style = `

             position: relative;
             text-align: center;
             margin: 0 0 8px 0;

            `;

            tmpDiv.innerHTML = isBut;
            isBut = tmpDiv.firstChild;

            isBut.id = 'isBut';
            isBut.style = `

            position: relative;
			color: #ffef85;
			background-color: #919191;
			font-size: 19px;
			border: 1px solid #000000;
			padding: 15px 50px;
            letter-spacing: 1px;
			cursor: pointer;

            `;

            isButDiv.append(isBut);
            div.append(isButDiv);

            loaded = true;
        } catch (error) {console.log(error)}
    }


    function other(delay){
        var endTime = Date.now() + delay;
        var timer = setInterval(()=>{
            if(Date.now() >= endTime){
                myFunctions.autoRun(lastValue);
                canGo = true;
                clearInterval(timer);
            }
        },10);
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
            myVars.autoRun = $('#autoRun')[0].checked;
            myVars.autoMove = $('#autoMove')[0].checked;
            let minDel = parseInt($('#timeDelayMin')[0].value);
            let maxDel = parseInt($('#timeDelayMax')[0].value);
            myVars.delay = Math.random() * (maxDel - minDel) + minDel;
            myVars.isThinking = isThinking;
            myFunctions.spinner();
            if(board.game.getTurn() == board.game.getPlayingAs()){myTurn = true;} else {myTurn = false;}
            $('#depthText')[0].innerHTML = "Your Current Depth Is: <strong>"+lastValue+"</strong>";
            
            // Update evaluation bar position if board size changes
            if(evalBar && evalText && board) {
                evalText.style.left = `${evalBar.offsetLeft}px`;
            }
        } else {
            myFunctions.loadEx();
        }

        if(!($('#myAd1')[0])){
            myFunctions.replaceAd();
        }

        if(!engine.engine){
            myFunctions.loadChessEngine();
        }
        if(myVars.autoRun == true && canGo == true && isThinking == false && myTurn){
            //console.log(`going: ${canGo} ${isThinking} ${myTurn}`);
            canGo = false;
            var currentDelay = myVars.delay != undefined ? myVars.delay * 1000 : 10;
            other(currentDelay);
        }
    }, 100);
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