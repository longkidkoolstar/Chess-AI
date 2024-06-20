// ==UserScript==
// @name         Chess-AI
// @namespace    github.com/longkidkoolstar
// @version      0.1
// @description  try to take over the world!
// @author       longkidkoolstar
// @match        https://www.chess.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=chess.com
// @grant        none
// ==/UserScript==

console.log("User-Script Started");


var myFunctions = document.myFunctions = {};

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
