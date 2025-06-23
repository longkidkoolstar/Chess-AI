#!/usr/bin/env python
import http.server
import socketserver
import json
import os
import webbrowser
import time
from urllib.parse import urlparse, parse_qs

# Configuration
PORT = 8765
HOST = "localhost"

# Global state to store chess data
chess_state = {
    "fen": "",
    "evaluation": 0,
    "best_move": "",
    "last_update": time.time(),
    "engine_running": False,
    "top_moves": [],
    "depth": 11,
    "elo": 1500,

    # Opening book settings
    "selected_opening_repertoire": "mixed",
    "opening_repertoires": None,

    # Visual settings with timestamps for synchronization
    "move_indicator_location": "main",
    "move_indicator_type": "highlights",
    "use_multicolor_moves": False,
    "move_colors": {},
    "show_multiple_moves": False,
    "number_of_moves_to_show": 3,
    "arrow_style": "curved",
    "arrow_animation": True,
    "arrow_color": "#0077CC",
    "persistent_highlights": True,
    "white_advantage_color": "#4CAF50",
    "black_advantage_color": "#F44336",
    "arrow_opacity": 0.8,

    # Automation settings
    "auto_move": False,
    "auto_run": False,
    "auto_run_delay_min": 0.001,  # Minimum delay in seconds
    "auto_run_delay_max": 1.0,  # Maximum delay in seconds

    # External window settings
    "disable_main_controls": False,  # Option to disable main controls when connected to external window

    # Settings synchronization metadata
    "settings_last_updated": time.time(),
    "settings_update_source": "server",
    "visual_settings": {
        "timestamp": time.time(),
        "source": "server"
    },

    # Command queue for userscript
    "pending_commands": []
}

# Create a directory for the web files if it doesn't exist
os.makedirs("web", exist_ok=True)

# Create the HTML file for the GUI
html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chess AI Controls</title>
    <style>
        body {
            font-family: "Segoe UI", Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        #container {
            max-width: 800px;
            margin: 20px auto;
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 6px 16px rgba(0,0,0,0.15);
            overflow: hidden;
        }
        #header {
            background-color: #2196F3;
            color: white;
            padding: 15px 20px;
            font-weight: bold;
            font-size: 18px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        #content {
            padding: 20px;
        }
        #status {
            margin-top: 20px;
            padding: 10px;
            border-radius: 5px;
            background-color: #e0f7fa;
        }
        #connection-status {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background-color: #f44336;
            margin-right: 8px;
        }
        .connected {
            background-color: #4CAF50 !important;
        }
        #chess-board {
            width: 400px;
            height: 400px;
            margin: 20px auto;
            border: 2px solid #333;
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            grid-template-rows: repeat(8, 1fr);
            position: relative;
        }
        .square {
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 30px;
            position: relative;
        }
        .white {
            background-color: #f0d9b5;
        }
        .black {
            background-color: #b58863;
        }
        .piece {
            width: 80%;
            height: 80%;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            position: absolute;
            z-index: 2;
        }
        .highlight {
            position: absolute;
            width: 100%;
            height: 100%;
            background-color: rgba(235, 97, 80, 0.7);
            z-index: 1;
            box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3);
            border: 2px solid rgba(235, 97, 80, 0.9);
            box-sizing: border-box;
        }
        .arrow {
            position: absolute;
            z-index: 3;
            pointer-events: none;
        }
        #controls {
            margin-top: 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .control-row {
            display: flex;
            justify-content: space-between;
            gap: 10px;
        }
        button {
            padding: 10px 15px;
            background-color: #2196F3;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            flex: 1;
        }
        button:hover {
            background-color: #0b7dda;
        }
        button:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
        }
        #run-engine {
            background-color: #4CAF50;
        }
        #run-engine:hover {
            background-color: #45a049;
        }
        #stop-engine {
            background-color: #F44336;
        }
        #stop-engine:hover {
            background-color: #d32f2f;
        }
        #evaluation-bar-container {
            width: 24px;
            height: 400px;
            background-color: #2a2a2a;
            border-radius: 3px;
            overflow: hidden;
            position: absolute;
            left: -30px;
            top: 0;
        }
        #evaluation-bar {
            position: absolute;
            bottom: 0;
            width: 100%;
            height: 50%;
            background-color: #4CAF50;
            transition: height 0.25s ease;
        }
        #evaluation-text {
            position: absolute;
            top: -30px;
            left: -5px;
            width: 34px;
            text-align: center;
            font-weight: bold;
            font-size: 13px;
            color: #fff;
            background-color: #2a2a2a;
            padding: 4px;
            border-radius: 3px;
        }
        #settings {
            margin-top: 20px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .setting-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        input[type="range"] {
            flex: 1;
            margin: 0 10px;
        }
        input[type="number"] {
            width: 60px;
            padding: 5px;
            border: 1px solid #ddd;
            border-radius: 3px;
        }
        #move-history {
            margin-top: 20px;
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        #move-history table {
            width: 100%;
            border-collapse: collapse;
        }
        #move-history th {
            background-color: #f2f2f2;
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        #move-history td {
            padding: 8px;
            border-bottom: 1px solid #ddd;
        }
    </style>
</head>
<body>
    <div id="container">
        <div id="header">
            <span>Chess AI Controls (External Window)</span>
            <div>
                <span id="connection-status"></span>
                <span id="connection-text">Disconnected</span>
            </div>
        </div>
        <div id="content">
            <div id="status">
                <p>This window provides an external interface for the Chess AI userscript.</p>
                <p>Status: <span id="status-text">Waiting for connection from userscript...</span></p>
            </div>

            <div style="position: relative; margin: 20px auto; width: 400px;">
                <div id="evaluation-bar-container">
                    <div id="evaluation-bar"></div>
                </div>
                <div id="evaluation-text">0.0</div>
                <div id="chess-board">
                    <!-- Chess board will be generated by JavaScript -->
                </div>
            </div>

            <div id="controls">
                <div class="control-row">
                    <button id="run-engine">Run Engine Analysis</button>
                    <button id="stop-engine" disabled>Stop Engine</button>
                </div>

                <div style="margin-top: 20px; border: 1px solid #eee; border-radius: 8px; padding: 15px;">
                    <h3 style="margin-top: 0; color: #333; font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 15px;">Automation Settings</h3>

                    <!-- Auto Move Toggle -->
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
                        <div>
                            <label for="auto-move-toggle" style="font-weight: bold; color: #4CAF50;">Auto Move</label>
                            <div style="font-size: 12px; color: #666;">Automatically plays the best move</div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="auto-move-toggle">
                            <span class="slider round"></span>
                        </label>
                    </div>

                    <!-- Auto Run Toggle -->
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
                        <div>
                            <label for="auto-run-toggle" style="font-weight: bold; color: #FF9800;">Auto Run</label>
                            <div style="font-size: 12px; color: #666;">Automatically analyzes when it's your turn</div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="auto-run-toggle">
                            <span class="slider round"></span>
                        </label>
                    </div>

                    <!-- Auto Run Delay Settings -->
                    <div id="auto-run-delay-container" style="margin-top: 15px; display: none;">
                        <div style="font-weight: bold; margin-bottom: 10px;">Auto Run Delay (seconds):</div>

                        <!-- Min Delay -->
                        <div style="display: flex; align-items: center; margin-bottom: 10px;">
                            <label for="auto-run-delay-min" style="width: 80px;">Minimum:</label>
                            <input type="number" id="auto-run-delay-min" min="0.001" max="10.0" step="0.001" value="0.1" style="width: 80px; padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
                            <span style="margin-left: 5px;">seconds</span>
                        </div>

                        <!-- Max Delay -->
                        <div style="display: flex; align-items: center; margin-bottom: 5px;">
                            <label for="auto-run-delay-max" style="width: 80px;">Maximum:</label>
                            <input type="number" id="auto-run-delay-max" min="0.001" max="10.0" step="0.001" value="1.0" style="width: 80px; padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
                            <span style="margin-left: 5px;">seconds</span>
                        </div>

                        <div style="font-size: 12px; color: #666; margin-top: 8px; font-style: italic;">
                            Random delay between min and max to simulate human thinking time
                        </div>
                    </div>
                </div>
            </div>

            <style>
                /* Toggle Switch Styles */
                .switch {
                    position: relative;
                    display: inline-block;
                    width: 60px;
                    height: 34px;
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
                    transition: .4s;
                }

                .slider:before {
                    position: absolute;
                    content: "";
                    height: 26px;
                    width: 26px;
                    left: 4px;
                    bottom: 4px;
                    background-color: white;
                    transition: .4s;
                }

                input:checked + .slider {
                    background-color: #2196F3;
                }

                input:checked + .slider:before {
                    transform: translateX(26px);
                }

                .slider.round {
                    border-radius: 34px;
                }

                .slider.round:before {
                    border-radius: 50%;
                }

                /* Color specific toggles */
                #auto-move-toggle:checked + .slider {
                    background-color: #4CAF50;
                }

                #auto-run-toggle:checked + .slider {
                    background-color: #FF9800;
                }
            </style>

            <div id="settings">
                <h3>Settings</h3>
                <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                    <button id="engine-tab" class="settings-tab active" data-tab="engine-settings">Engine</button>
                    <button id="visual-tab" class="settings-tab" data-tab="visual-settings">Visual</button>
                    <button id="interface-tab" class="settings-tab" data-tab="interface-settings">Interface</button>
                </div>

                <!-- Engine Settings Tab -->
                <div id="engine-settings" class="settings-content active">
                    <div class="setting-row">
                        <label for="depth">Depth:</label>
                        <input type="range" id="depth" min="1" max="20" value="11">
                        <span id="depth-value">11</span>
                    </div>
                    <div class="setting-row">
                        <label for="elo">ELO Rating:</label>
                        <input type="range" id="elo" min="1000" max="3000" step="50" value="1500">
                        <span id="elo-value">1500</span>
                    </div>
                </div>

                <!-- Visual Settings Tab -->
                <div id="visual-settings" class="settings-content" style="display: none;">
                    <div class="setting-row">
                        <label for="move-indicator-location">Move Indicator Location:</label>
                        <select id="move-indicator-location" style="flex: 1; padding: 5px;">
                            <option value="main">Main Board Only</option>
                            <option value="external">External Board Only</option>
                            <option value="both">Both Boards</option>
                        </select>
                    </div>

                    <div class="setting-row">
                        <label for="move-indicator-type">Move Indicator Type:</label>
                        <select id="move-indicator-type" style="flex: 1; padding: 5px;">
                            <option value="highlights">Highlights</option>
                            <option value="arrows">Arrows</option>
                        </select>
                    </div>

                    <div class="setting-row">
                        <input type="checkbox" id="show-multiple-moves" style="margin-right: 10px;">
                        <label for="show-multiple-moves">Show Multiple Moves</label>
                    </div>

                    <div class="setting-row" id="multiple-moves-options" style="display: none; margin-left: 20px;">
                        <label for="number-of-moves">Number of Moves:</label>
                        <input type="range" id="number-of-moves" min="2" max="5" value="3" style="flex: 1; margin: 0 10px;">
                        <span id="number-of-moves-value">3</span>
                    </div>

                    <div class="setting-row" id="multiple-moves-color-option" style="display: none; margin-left: 20px;">
                        <input type="checkbox" id="use-multicolor-moves" style="margin-right: 10px;">
                        <label for="use-multicolor-moves">Use Different Colors</label>
                    </div>

                    <div class="setting-row" id="arrow-options" style="display: none;">
                        <label for="arrow-style">Arrow Style:</label>
                        <select id="arrow-style" style="flex: 1; padding: 5px;">
                            <option value="curved">Curved</option>
                            <option value="straight">Straight</option>
                        </select>
                    </div>

                    <div class="setting-row" id="arrow-animation-option" style="display: none;">
                        <input type="checkbox" id="arrow-animation" style="margin-right: 10px;" checked>
                        <label for="arrow-animation">Animate Arrows</label>
                    </div>

                    <div class="setting-row">
                        <label for="white-advantage-color">White Advantage Color:</label>
                        <input type="color" id="white-advantage-color" value="#4CAF50" style="margin-left: 10px;">
                    </div>

                    <div class="setting-row">
                        <label for="black-advantage-color">Black Advantage Color:</label>
                        <input type="color" id="black-advantage-color" value="#F44336" style="margin-left: 10px;">
                    </div>
                </div>

                <!-- Interface Settings Tab -->
                <div id="interface-settings" class="settings-content" style="display: none;">
                    <div class="setting-row" style="margin-bottom: 15px; border-left: 3px solid #9C27B0; padding-left: 12px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
                            <label for="disable-main-controls" style="font-weight: bold; color: #9C27B0;">Disable Main Controls:</label>
                            <label class="switch">
                                <input type="checkbox" id="disable-main-controls">
                                <span class="slider round"></span>
                            </label>
                        </div>
                        <div style="font-size: 12px; color: #666; margin-top: 5px;">
                            When enabled, the main Chess AI controls on chess.com will be hidden while connected to this external window
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .settings-tab {
                    padding: 8px 15px;
                    background-color: #f0f0f0;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    cursor: pointer;
                    flex: 1;
                    margin: 0 5px;
                    font-weight: bold;
                }

                .settings-tab.active {
                    background-color: #2196F3;
                    color: white;
                    border-color: #2196F3;
                }

                .settings-content {
                    margin-top: 10px;
                    border-top: 1px solid #eee;
                    padding-top: 10px;
                }
            </style>

            <div id="move-history">
                <h3>Move History</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Move</th>
                            <th>Evaluation</th>
                            <th>Depth</th>
                        </tr>
                    </thead>
                    <tbody id="move-history-body">
                        <!-- Move history will be populated by JavaScript -->
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script>
        // Global variables
        let chessState = {
            fen: "",
            evaluation: 0,
            best_move: "",
            engine_running: false,
            top_moves: [],
            depth: 11,
            elo: 1500,

            // Move indicator settings
            move_indicator_location: "main",
            move_indicator_type: "highlights",
            persistent_highlights: true,

            // Multiple moves settings
            show_multiple_moves: false,
            number_of_moves_to_show: 3,
            use_multicolor_moves: false,
            move_colors: {},

            // Arrow settings
            arrow_style: "curved",
            arrow_animation: true,
            arrow_color: "#0077CC",
            arrow_opacity: 0.8,

            // Evaluation bar colors
            white_advantage_color: "#4CAF50",
            black_advantage_color: "#F44336",

            // Automation settings
            auto_move: false,
            auto_run: false,
            auto_run_delay_min: 0.001,
            auto_run_delay_max: 1.0,

            // External window settings
            disable_main_controls: false,

            // Settings synchronization metadata
            settings_last_updated: 0,
            settings_update_source: "external_board",
            visual_settings: {
                timestamp: 0,
                source: "external_board"
            }
        };

        // Flag to prevent settings update loops
        let isUpdatingSettings = false;
        let connected = false;
        let updateInterval = null;

        // Piece images
        const pieceImages = {
            'P': 'https://www.chess.com/chess-themes/pieces/neo/150/wp.png', // white pawn
            'R': 'https://www.chess.com/chess-themes/pieces/neo/150/wr.png', // white rook
            'N': 'https://www.chess.com/chess-themes/pieces/neo/150/wn.png', // white knight
            'B': 'https://www.chess.com/chess-themes/pieces/neo/150/wb.png', // white bishop
            'Q': 'https://www.chess.com/chess-themes/pieces/neo/150/wq.png', // white queen
            'K': 'https://www.chess.com/chess-themes/pieces/neo/150/wk.png', // white king
            'p': 'https://www.chess.com/chess-themes/pieces/neo/150/bp.png', // black pawn
            'r': 'https://www.chess.com/chess-themes/pieces/neo/150/br.png', // black rook
            'n': 'https://www.chess.com/chess-themes/pieces/neo/150/bn.png', // black knight
            'b': 'https://www.chess.com/chess-themes/pieces/neo/150/bb.png', // black bishop
            'q': 'https://www.chess.com/chess-themes/pieces/neo/150/bq.png', // black queen
            'k': 'https://www.chess.com/chess-themes/pieces/neo/150/bk.png'  // black king
        };

        // Initialize the chess board
        function initializeChessBoard() {
            const board = document.getElementById('chess-board');
            board.innerHTML = '';

            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    const square = document.createElement('div');
                    square.className = `square ${(row + col) % 2 === 0 ? 'white' : 'black'}`;
                    square.dataset.row = 8 - row;
                    square.dataset.col = String.fromCharCode(97 + col); // 'a' to 'h'
                    board.appendChild(square);
                }
            }
        }

        // Function to draw an arrow on the chess board
        function drawArrow(fromSquare, toSquare, color = '#0077CC', opacity = 0.8, arrowStyle = 'curved', animate = true) {
            // Get the from and to squares
            const fromSquareEl = document.querySelector(`.square[data-col="${fromSquare.charAt(0)}"][data-row="${fromSquare.charAt(1)}"]`);
            const toSquareEl = document.querySelector(`.square[data-col="${toSquare.charAt(0)}"][data-row="${toSquare.charAt(1)}"]`);

            if (!fromSquareEl || !toSquareEl) {
                console.log('Square not found for arrow:', fromSquare, toSquare);
                return;
            }

            // Get the chess board element and its position
            const chessBoard = document.getElementById('chess-board');
            const boardRect = chessBoard.getBoundingClientRect();

            // Get the positions of the squares
            const fromRect = fromSquareEl.getBoundingClientRect();
            const toRect = toSquareEl.getBoundingClientRect();

            // Calculate positions relative to the chess board
            const fromX = fromRect.left - boardRect.left + (fromRect.width / 2);
            const fromY = fromRect.top - boardRect.top + (fromRect.height / 2);
            const toX = toRect.left - boardRect.left + (toRect.width / 2);
            const toY = toRect.top - boardRect.top + (toRect.height / 2);

            // Calculate the angle and length of the arrow
            const dx = toX - fromX;
            const dy = toY - fromY;
            const angle = Math.atan2(dy, dx);

            // Create an SVG element for the arrow
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
            svg.setAttribute('class', 'move-arrow');
            svg.style.position = 'absolute';
            svg.style.top = '0';
            svg.style.left = '0';
            svg.style.pointerEvents = 'none';
            svg.style.zIndex = '10';

            // Adjust start and end points to not cover the pieces
            const squareSize = fromRect.width;
            const margin = squareSize * 0.3;
            const startX = fromX + Math.cos(angle) * margin;
            const startY = fromY + Math.sin(angle) * margin;
            const endX = toX - Math.cos(angle) * margin;
            const endY = toY - Math.sin(angle) * margin;

            // Create the arrow path based on style
            let path;
            if (arrowStyle === 'curved') {
                // Create a curved path
                const midX = (startX + endX) / 2;
                const midY = (startY + endY) / 2;

                // Calculate control point for the curve
                // Perpendicular to the line from start to end
                const perpX = -Math.sin(angle) * squareSize * 0.2;
                const perpY = Math.cos(angle) * squareSize * 0.2;

                path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', `M ${startX} ${startY} Q ${midX + perpX} ${midY + perpY} ${endX} ${endY}`);
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke', color);
                path.setAttribute('stroke-width', squareSize / 10);
                path.setAttribute('opacity', opacity);
            } else {
                // Create a straight line
                path = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                path.setAttribute('x1', startX);
                path.setAttribute('y1', startY);
                path.setAttribute('x2', endX);
                path.setAttribute('y2', endY);
                path.setAttribute('stroke', color);
                path.setAttribute('stroke-width', squareSize / 10);
                path.setAttribute('opacity', opacity);
            }

            // Create the arrowhead
            const arrowHead = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');

            // Calculate arrowhead points
            const arrowHeadSize = squareSize / 4;
            const arrowAngle1 = angle - Math.PI / 6;
            const arrowAngle2 = angle + Math.PI / 6;

            const point1X = endX - arrowHeadSize * Math.cos(arrowAngle1);
            const point1Y = endY - arrowHeadSize * Math.sin(arrowAngle1);
            const point2X = endX - arrowHeadSize * Math.cos(arrowAngle2);
            const point2Y = endY - arrowHeadSize * Math.sin(arrowAngle2);

            arrowHead.setAttribute('points', `${endX},${endY} ${point1X},${point1Y} ${point2X},${point2Y}`);
            arrowHead.setAttribute('fill', color);
            arrowHead.setAttribute('opacity', opacity);

            // Add animation if enabled
            if (animate) {
                // Add animation for the path
                if (arrowStyle === 'curved') {
                    const pathLength = path.getTotalLength();
                    path.style.strokeDasharray = pathLength;
                    path.style.strokeDashoffset = pathLength;
                    path.style.animation = 'arrow-draw 0.3s ease-in-out forwards';
                } else {
                    const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
                    path.style.strokeDasharray = length;
                    path.style.strokeDashoffset = length;
                    path.style.animation = 'arrow-draw 0.3s ease-in-out forwards';
                }

                // Add animation for the arrowhead
                arrowHead.style.opacity = '0';
                arrowHead.style.animation = 'arrow-fade-in 0.2s ease-in-out 0.2s forwards';

                // Add the animation keyframes if they don't exist
                if (!document.getElementById('arrow-animations')) {
                    const style = document.createElement('style');
                    style.id = 'arrow-animations';
                    style.textContent = `
                        @keyframes arrow-draw {
                            to {
                                stroke-dashoffset: 0;
                            }
                        }
                        @keyframes arrow-fade-in {
                            to {
                                opacity: ${opacity};
                            }
                        }
                    `;
                    document.head.appendChild(style);
                }
            }

            // Add the elements to the SVG
            svg.appendChild(path);
            svg.appendChild(arrowHead);

            // Add the SVG to the board
            document.getElementById('chess-board').appendChild(svg);

            // Log arrow creation for debugging
            console.log(`Arrow drawn from ${fromSquare} to ${toSquare} with color ${color}`);

            return svg;
        }

        // Function to add a highlight to a square
        function addHighlight(square, color = 'rgba(235, 97, 80, 0.7)') {
            const squareEl = document.querySelector(`.square[data-col="${square.charAt(0)}"][data-row="${square.charAt(1)}"]`);
            if (!squareEl) {
                console.log('Square not found for highlight:', square);
                return;
            }

            const highlight = document.createElement('div');
            highlight.className = 'highlight';
            highlight.style.backgroundColor = color;
            squareEl.appendChild(highlight);

            return highlight;
        }

        // Update the chess board based on FEN string
        function updateChessBoard(fen) {
            if (!fen) return;

            // Clear existing pieces
            const pieces = document.querySelectorAll('.piece');
            pieces.forEach(piece => piece.remove());

            // Clear existing highlights
            const highlights = document.querySelectorAll('.highlight');
            highlights.forEach(highlight => highlight.remove());

            // Clear existing arrows
            const arrows = document.querySelectorAll('.move-arrow');
            arrows.forEach(arrow => arrow.remove());

            // Parse FEN string
            const fenParts = fen.split(' ');
            const position = fenParts[0];
            const rows = position.split('/');

            // Place pieces on the board
            for (let row = 0; row < 8; row++) {
                let col = 0;
                for (let i = 0; i < rows[row].length; i++) {
                    const char = rows[row][i];

                    if (/[1-8]/.test(char)) {
                        // Skip empty squares
                        col += parseInt(char);
                    } else {
                        // Place a piece
                        const square = document.querySelector(`.square[data-row="${8-row}"][data-col="${String.fromCharCode(97+col)}"]`);
                        if (square) {
                            const piece = document.createElement('div');
                            piece.className = 'piece';
                            piece.style.backgroundImage = `url(${pieceImages[char]})`;
                            square.appendChild(piece);
                        }
                        col++;
                    }
                }
            }

            // Show move indicators on the external board if configured
            if ((chessState.move_indicator_location === 'external' || chessState.move_indicator_location === 'both')) {

                // Show multiple moves if enabled
                if (chessState.show_multiple_moves && chessState.top_moves && chessState.top_moves.length > 1) {
                    console.log('Showing multiple moves on external board');
                    console.log('Top moves array:', JSON.stringify(chessState.top_moves));
                    console.log('Number of moves to show:', chessState.number_of_moves_to_show);
                    console.log('Show multiple moves setting:', chessState.show_multiple_moves);

                    // Determine how many moves to show
                    const movesToShow = Math.min(
                        chessState.number_of_moves_to_show || 3,
                        chessState.top_moves.length
                    );
                    console.log('Moves to show:', movesToShow);

                    // Loop through all moves in reverse order (so best move is drawn last and appears on top)
                    // Start from lower ranked moves (higher index) and end with the best move (index 0)
                    for (let i = movesToShow - 1; i >= 0; i--) {
                        console.log('Processing move index:', i);
                        // Check if the move exists at this index
                        if (!chessState.top_moves[i]) {
                            console.log('No move found at index:', i);
                            continue;
                        }

                        const move = chessState.top_moves[i].move;
                        console.log('Move found:', move);

                        if (move && move.length >= 4) {
                            const fromSquare = move.substring(0, 2);
                            const toSquare = move.substring(2, 4);
                            console.log('Drawing arrow from', fromSquare, 'to', toSquare);

                            // Calculate opacity based on move rank
                            let opacity = chessState.arrow_opacity - (i * 0.1); // Decrease opacity for lower-ranked moves
                            opacity = Math.max(0.3, opacity); // Don't go below 0.3 opacity

                            // Get color based on settings
                            let moveColor;
                            if (chessState.use_multicolor_moves && chessState.move_colors && chessState.move_colors[i+1]) {
                                // Use the specific color for this move rank
                                moveColor = chessState.move_colors[i+1];
                            } else {
                                // Use the default arrow color with adjusted opacity
                                moveColor = chessState.arrow_color;
                            }

                            // Show the move based on the move indicator type
                            if (chessState.move_indicator_type === 'arrows') {
                                // Draw an arrow for this move
                                drawArrow(
                                    fromSquare,
                                    toSquare,
                                    moveColor,
                                    opacity,
                                    chessState.arrow_style,
                                    chessState.arrow_animation
                                );
                            } else {
                                // Use highlights for this move
                                addHighlight(fromSquare, moveColor);
                                addHighlight(toSquare, moveColor);
                            }
                        }
                    }
                }
                // If multiple moves are not enabled, just show the best move
                else if (chessState.best_move && chessState.best_move.length >= 4) {
                    console.log('Showing only best move on external board:', chessState.best_move);

                    const fromSquare = chessState.best_move.substring(0, 2);
                    const toSquare = chessState.best_move.substring(2, 4);

                    // Get color for best move
                    let bestMoveColor = chessState.arrow_color;
                    if (chessState.use_multicolor_moves && chessState.move_colors && chessState.move_colors['1']) {
                        bestMoveColor = chessState.move_colors['1'];
                    }

                    // Show the best move based on the move indicator type
                    if (chessState.move_indicator_type === 'arrows') {
                        // Draw an arrow for the best move
                        drawArrow(
                            fromSquare,
                            toSquare,
                            bestMoveColor,
                            chessState.arrow_opacity,
                            chessState.arrow_style,
                            chessState.arrow_animation
                        );
                    } else {
                        // Use highlights for the best move
                        addHighlight(fromSquare, bestMoveColor);
                        addHighlight(toSquare, bestMoveColor);
                    }
                }
            }
        }

        // Update the evaluation bar
        function updateEvaluationBar(evaluation) {
            const evalBar = document.getElementById('evaluation-bar');
            const evalText = document.getElementById('evaluation-text');

            // Clamp the visual representation between -5 and 5
            const clampedEval = Math.max(-5, Math.min(5, evaluation));
            const percentage = 50 + (clampedEval * 10); // Convert to percentage (0-100)

            // Update the bar height
            evalBar.style.height = `${percentage}%`;

            // Get custom colors from state
            const whiteAdvantageColor = chessState.white_advantage_color || '#4CAF50';
            const blackAdvantageColor = chessState.black_advantage_color || '#F44336';

            // Update the color based on who's winning
            if (evaluation > 0.2) {
                evalBar.style.backgroundColor = whiteAdvantageColor; // White advantage
            } else if (evaluation < -0.2) {
                evalBar.style.backgroundColor = blackAdvantageColor; // Black advantage
            } else {
                evalBar.style.backgroundColor = '#9E9E9E'; // Equal (gray)
            }

            // Update the text
            if (typeof evaluation === 'string' && evaluation.includes('Mate')) {
                evalText.textContent = evaluation;

                // Set background color for mate
                if (evaluation.includes('Mate in')) {
                    evalText.style.backgroundColor = whiteAdvantageColor;
                    evalText.style.color = getContrastColor(whiteAdvantageColor);
                } else {
                    evalText.style.backgroundColor = blackAdvantageColor;
                    evalText.style.color = getContrastColor(blackAdvantageColor);
                }
            } else {
                const sign = evaluation > 0 ? '+' : '';
                evalText.textContent = `${sign}${Math.abs(evaluation).toFixed(1)}`;

                // Reset background color
                evalText.style.backgroundColor = '#2a2a2a';
                evalText.style.color = '#fff';
            }
        }

        // Helper function to get contrasting text color (black or white) based on background color
        function getContrastColor(hexColor) {
            // Convert hex to RGB
            let r, g, b;
            if (hexColor.startsWith('#')) {
                r = parseInt(hexColor.slice(1, 3), 16);
                g = parseInt(hexColor.slice(3, 5), 16);
                b = parseInt(hexColor.slice(5, 7), 16);
            } else {
                // Handle RGB or RGBA format
                const rgbMatch = hexColor.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*[\\d.]+)?\\)/);
                if (rgbMatch) {
                    r = parseInt(rgbMatch[1]);
                    g = parseInt(rgbMatch[2]);
                    b = parseInt(rgbMatch[3]);
                } else {
                    return '#000000'; // Default to black if format not recognized
                }
            }

            // Calculate luminance - https://www.w3.org/TR/WCAG20-TECHS/G17.html
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

            // Return black for light colors, white for dark colors
            return luminance > 0.5 ? '#000000' : '#ffffff';
        }

        // Add a move to the history
        function addMoveToHistory(move, evaluation, depth) {
            const tableBody = document.getElementById('move-history-body');

            // Create a new row
            const row = document.createElement('tr');

            // Format the evaluation
            let evalText = '';
            if (typeof evaluation === 'string' && evaluation.includes('Mate')) {
                evalText = evaluation;
            } else {
                const sign = evaluation > 0 ? '+' : '';
                evalText = `${sign}${parseFloat(evaluation).toFixed(2)}`;
            }

            // Add cells
            row.innerHTML = `
                <td>${move}</td>
                <td>${evalText}</td>
                <td>${depth}</td>
            `;

            // Add the row to the table
            if (tableBody.firstChild) {
                tableBody.insertBefore(row, tableBody.firstChild);
            } else {
                tableBody.appendChild(row);
            }

            // Limit the number of rows to 50
            while (tableBody.children.length > 50) {
                tableBody.removeChild(tableBody.lastChild);
            }
        }

        // Send a command to the userscript
        function sendCommand(command, params = {}) {
            if (!connected) {
                console.error('Not connected to userscript');
                return Promise.reject(new Error('Not connected to userscript'));
            }

            return fetch('/api/command', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    command: command,
                    params: params
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Server responded with status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Command response:', data);

                // Update UI based on command
                if (command === 'run_engine') {
                    document.getElementById('run-engine').disabled = true;
                    document.getElementById('stop-engine').disabled = false;
                    document.getElementById('status-text').textContent = 'Engine running...';
                } else if (command === 'stop_engine') {
                    document.getElementById('run-engine').disabled = false;
                    document.getElementById('stop-engine').disabled = true;
                    document.getElementById('status-text').textContent = 'Engine stopped';
                }

                return data;
            })
            .catch(error => {
                console.error('Error sending command:', error);
                throw error;
            });
        }

        // Fetch the current state from the server
        function fetchState() {
            fetch('/api/state')
                .then(response => response.json())
                .then(data => {
                    // Log the state for debugging
                    console.log('Received state from server:', data);
                    console.log('Move indicator location:', data.move_indicator_location);
                    console.log('Best move:', data.best_move);

                    // Log top moves specifically
                    if (data.top_moves && data.top_moves.length > 0) {
                        console.log('Received top moves:', JSON.stringify(data.top_moves));
                        console.log('Show multiple moves setting:', data.show_multiple_moves);
                        console.log('Number of moves to show:', data.number_of_moves_to_show);
                    } else {
                        console.log('No top moves received or empty array');
                    }

                    // Update the local state
                    const oldFen = chessState.fen;
                    const oldBestMove = chessState.best_move;

                    // Check if we need to handle visual settings synchronization
                    const incomingSettingsTimestamp = data.settings_last_updated || 0;
                    const currentSettingsTimestamp = chessState.settings_last_updated || 0;
                    const incomingSource = data.settings_update_source || '';

                    console.log(`Received state update - Current timestamp: ${currentSettingsTimestamp}, Incoming timestamp: ${incomingSettingsTimestamp}, Source: ${incomingSource}`);

                    // If we're currently updating settings from the external board, don't override with userscript settings
                    if (isUpdatingSettings && incomingSource === 'userscript') {
                        console.log('Ignoring userscript settings update while external board is updating settings');

                        // Only update non-visual settings
                        const visualSettingsKeys = [
                            "move_indicator_location", "move_indicator_type", "show_multiple_moves",
                            "number_of_moves_to_show", "use_multicolor_moves", "arrow_style",
                            "arrow_animation", "white_advantage_color", "black_advantage_color",
                            "arrow_opacity", "persistent_highlights"
                        ];

                        // Copy only non-visual settings
                        for (const key in data) {
                            if (!visualSettingsKeys.includes(key)) {
                                chessState[key] = data[key];
                            }
                        }
                    }
                    // If the incoming settings are from the userscript and are newer than our current settings
                    else if (incomingSource === 'userscript' && incomingSettingsTimestamp > currentSettingsTimestamp) {
                        console.log('Applying newer settings from userscript');
                        chessState = data;
                    }
                    // Otherwise, update everything
                    else {
                        chessState = data;
                    }

                    // Update the UI
                    // Always update the board to show move indicators, even if FEN hasn't changed
                    if (chessState.fen) {
                        updateChessBoard(chessState.fen);
                    }

                    if (chessState.evaluation !== undefined) {
                        updateEvaluationBar(chessState.evaluation);
                    }

                    // Add move to history if best move changed
                    if (chessState.best_move && chessState.best_move !== oldBestMove) {
                        const moveNotation = `${chessState.best_move.substring(0, 2)}-${chessState.best_move.substring(2, 4)}`;
                        addMoveToHistory(moveNotation, chessState.evaluation, chessState.depth);
                    }

                    // Update engine status
                    if (chessState.engine_running) {
                        document.getElementById('run-engine').disabled = true;
                        document.getElementById('stop-engine').disabled = false;
                        document.getElementById('status-text').textContent = 'Engine running...';
                    } else {
                        document.getElementById('run-engine').disabled = false;
                        document.getElementById('stop-engine').disabled = true;
                        document.getElementById('status-text').textContent = 'Connected to Chess AI userscript';
                    }

                    // Only update UI controls if we're not currently updating settings
                    if (!isUpdatingSettings) {
                        // Update engine settings
                        document.getElementById('depth').value = chessState.depth;
                        document.getElementById('depth-value').textContent = chessState.depth;
                        document.getElementById('elo').value = chessState.elo;
                        document.getElementById('elo-value').textContent = chessState.elo;

                        // Update automation settings
                        document.getElementById('auto-move-toggle').checked = chessState.auto_move;
                        document.getElementById('auto-run-toggle').checked = chessState.auto_run;

                        // Update auto run delay
                        const minDelayInput = document.getElementById('auto-run-delay-min');
                        const maxDelayInput = document.getElementById('auto-run-delay-max');
                        const delayContainer = document.getElementById('auto-run-delay-container');

                        minDelayInput.value = chessState.auto_run_delay_min.toFixed(3);
                        maxDelayInput.value = chessState.auto_run_delay_max.toFixed(3);
                        delayContainer.style.display = chessState.auto_run ? 'block' : 'none';

                        // Update visual settings
                        document.getElementById('move-indicator-location').value = chessState.move_indicator_location;
                        document.getElementById('move-indicator-type').value = chessState.move_indicator_type;
                        document.getElementById('show-multiple-moves').checked = chessState.show_multiple_moves;

                        // Show/hide multiple moves options
                        if (chessState.show_multiple_moves) {
                            document.getElementById('multiple-moves-options').style.display = 'flex';
                            document.getElementById('multiple-moves-color-option').style.display = 'flex';
                        } else {
                            document.getElementById('multiple-moves-options').style.display = 'none';
                            document.getElementById('multiple-moves-color-option').style.display = 'none';
                        }

                        // Update number of moves slider
                        document.getElementById('number-of-moves').value = chessState.number_of_moves_to_show;
                        document.getElementById('number-of-moves-value').textContent = chessState.number_of_moves_to_show;

                        // Update multicolor moves checkbox
                        document.getElementById('use-multicolor-moves').checked = chessState.use_multicolor_moves;

                        // Show/hide arrow options based on move indicator type
                        if (chessState.move_indicator_type === 'arrows') {
                            document.getElementById('arrow-options').style.display = 'flex';
                            document.getElementById('arrow-animation-option').style.display = 'flex';
                        } else {
                            document.getElementById('arrow-options').style.display = 'none';
                            document.getElementById('arrow-animation-option').style.display = 'none';
                        }

                        // Update arrow style and animation
                        document.getElementById('arrow-style').value = chessState.arrow_style;
                        document.getElementById('arrow-animation').checked = chessState.arrow_animation;

                        // Update evaluation bar colors
                        document.getElementById('white-advantage-color').value = chessState.white_advantage_color;
                        document.getElementById('black-advantage-color').value = chessState.black_advantage_color;
                    }
                })
                .catch(error => {
                    console.error('Error fetching state:', error);

                    // If we can't connect, mark as disconnected
                    if (connected) {
                        connected = false;
                        document.getElementById('connection-status').classList.remove('connected');
                        document.getElementById('connection-text').textContent = 'Disconnected';
                        document.getElementById('status-text').textContent = 'Lost connection to Chess AI userscript';

                        // Stop the update interval
                        if (updateInterval) {
                            clearInterval(updateInterval);
                            updateInterval = null;
                        }
                    }
                });
        }

        // Initialize the connection to the server
        function initializeConnection() {
            fetch('/api/status')
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'running') {
                        connected = true;
                        document.getElementById('connection-status').classList.add('connected');
                        document.getElementById('connection-text').textContent = 'Connected';
                        document.getElementById('status-text').textContent = 'Connected to Chess AI userscript';

                        // Start polling for updates
                        updateInterval = setInterval(fetchState, 1000);

                        // Fetch the initial state
                        fetchState();
                    }
                })
                .catch(error => {
                    console.error('Error connecting to server:', error);
                    document.getElementById('status-text').textContent = 'Error connecting to server';
                });
        }

        // Initialize the page
        window.onload = function() {
            initializeChessBoard();
            initializeConnection();

            // Add event listeners for buttons
            document.getElementById('run-engine').addEventListener('click', function() {
                const depth = parseInt(document.getElementById('depth').value);
                sendCommand('run_engine', { depth: depth });
            });

            document.getElementById('stop-engine').addEventListener('click', function() {
                sendCommand('stop_engine');
            });

            // Add event listeners for toggle switches
            document.getElementById('auto-move-toggle').addEventListener('change', function() {
                sendCommand('toggle_auto_move');
                // UI will be updated when we receive the state update
            });

            document.getElementById('auto-run-toggle').addEventListener('change', function() {
                sendCommand('toggle_auto_run');
                // Show/hide the delay slider based on auto run state
                document.getElementById('auto-run-delay-container').style.display =
                    this.checked ? 'block' : 'none';
                // UI will be updated when we receive the state update
            });

            // Add event listeners for auto run delay inputs
            // Input validation function
            function validateDelayInput(input) {
                // Allow only numbers and a single decimal point
                input.value = input.value.replace(/[^0-9.]/g, '');

                // Ensure only one decimal point
                const parts = input.value.split('.');
                if (parts.length > 2) {
                    input.value = parts[0] + '.' + parts.slice(1).join('');
                }
            }

            // Add input event listeners for validation
            document.getElementById('auto-run-delay-min').addEventListener('input', function() {
                validateDelayInput(this);
            });

            document.getElementById('auto-run-delay-max').addEventListener('input', function() {
                validateDelayInput(this);
            });

            // Add change event listeners for updating the server
            document.getElementById('auto-run-delay-min').addEventListener('change', function() {
                let minDelay = parseFloat(this.value);

                // Validate input
                if (isNaN(minDelay) || minDelay < 0.001) {
                    minDelay = 0.001;
                    this.value = minDelay.toFixed(3);
                } else if (minDelay > 10.0) {
                    minDelay = 10.0;
                    this.value = minDelay.toFixed(3);
                } else {
                    // Preserve the user's input with proper precision
                    this.value = parseFloat(this.value).toString();
                }

                // Ensure min doesn't exceed max
                const maxDelay = parseFloat(document.getElementById('auto-run-delay-max').value);
                if (minDelay > maxDelay) {
                    document.getElementById('auto-run-delay-max').value = minDelay.toString();
                }

                sendCommand('update_auto_run_delay', {
                    min_delay: minDelay,
                    max_delay: Math.max(minDelay, maxDelay)
                });
            });

            document.getElementById('auto-run-delay-max').addEventListener('change', function() {
                let maxDelay = parseFloat(this.value);

                // Validate input
                if (isNaN(maxDelay) || maxDelay < 0.001) {
                    maxDelay = 0.001;
                    this.value = maxDelay.toFixed(3);
                } else if (maxDelay > 10.0) {
                    maxDelay = 10.0;
                    this.value = maxDelay.toFixed(3);
                } else {
                    // Preserve the user's input with proper precision
                    this.value = parseFloat(this.value).toString();
                }

                // Ensure max doesn't go below min
                const minDelay = parseFloat(document.getElementById('auto-run-delay-min').value);
                if (maxDelay < minDelay) {
                    document.getElementById('auto-run-delay-min').value = maxDelay.toString();
                }

                sendCommand('update_auto_run_delay', {
                    min_delay: Math.min(minDelay, maxDelay),
                    max_delay: maxDelay
                });
            });

            // Add event listeners for settings tabs
            document.querySelectorAll('.settings-tab').forEach(tab => {
                tab.addEventListener('click', function() {
                    // Remove active class from all tabs
                    document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
                    // Add active class to clicked tab
                    this.classList.add('active');

                    // Hide all content
                    document.querySelectorAll('.settings-content').forEach(content => {
                        content.style.display = 'none';
                    });

                    // Show content for clicked tab
                    const tabId = this.getAttribute('data-tab');
                    document.getElementById(tabId).style.display = 'block';
                });
            });

            // Add event listeners for engine settings
            document.getElementById('depth').addEventListener('input', function() {
                const depth = parseInt(this.value);
                document.getElementById('depth-value').textContent = depth;
                sendCommand('update_depth', { depth: depth });
            });

            document.getElementById('elo').addEventListener('input', function() {
                const elo = parseInt(this.value);
                document.getElementById('elo-value').textContent = elo;
                sendCommand('update_elo', { elo: elo });
            });

            // Add event listeners for visual settings
            document.getElementById('move-indicator-location').addEventListener('change', function() {
                // Only process if we're not already updating settings
                if (isUpdatingSettings) {
                    console.log('Ignoring move-indicator-location change while settings are being updated');
                    return;
                }

                console.log('External board: move-indicator-location changed to', this.value);
                chessState.move_indicator_location = this.value;
                updateChessBoard(chessState.fen);
                sendVisualSettingsToUserscript();
            });

            document.getElementById('move-indicator-type').addEventListener('change', function() {
                // Only process if we're not already updating settings
                if (isUpdatingSettings) {
                    console.log('Ignoring move-indicator-type change while settings are being updated');
                    return;
                }

                console.log('External board: move-indicator-type changed to', this.value);
                chessState.move_indicator_type = this.value;

                // Show/hide arrow options based on selection
                if (this.value === 'arrows') {
                    document.getElementById('arrow-options').style.display = 'flex';
                    document.getElementById('arrow-animation-option').style.display = 'flex';
                } else {
                    document.getElementById('arrow-options').style.display = 'none';
                    document.getElementById('arrow-animation-option').style.display = 'none';
                }

                updateChessBoard(chessState.fen);
                sendVisualSettingsToUserscript();
            });

            document.getElementById('show-multiple-moves').addEventListener('change', function() {
                // Only process if we're not already updating settings
                if (isUpdatingSettings) {
                    console.log('Ignoring show-multiple-moves change while settings are being updated');
                    return;
                }

                console.log('External board: show-multiple-moves changed to', this.checked);
                chessState.show_multiple_moves = this.checked;

                // Show/hide multiple moves options
                if (this.checked) {
                    document.getElementById('multiple-moves-options').style.display = 'flex';
                    document.getElementById('multiple-moves-color-option').style.display = 'flex';
                } else {
                    document.getElementById('multiple-moves-options').style.display = 'none';
                    document.getElementById('multiple-moves-color-option').style.display = 'none';
                }

                updateChessBoard(chessState.fen);
                sendVisualSettingsToUserscript();
            });

            document.getElementById('number-of-moves').addEventListener('input', function() {
                // Only process if we're not already updating settings
                if (isUpdatingSettings) {
                    console.log('Ignoring number-of-moves change while settings are being updated');
                    return;
                }

                const numMoves = parseInt(this.value);
                console.log('External board: number-of-moves changed to', numMoves);
                document.getElementById('number-of-moves-value').textContent = numMoves;
                chessState.number_of_moves_to_show = numMoves;
                updateChessBoard(chessState.fen);
                sendVisualSettingsToUserscript();
            });

            document.getElementById('use-multicolor-moves').addEventListener('change', function() {
                // Only process if we're not already updating settings
                if (isUpdatingSettings) {
                    console.log('Ignoring use-multicolor-moves change while settings are being updated');
                    return;
                }

                console.log('External board: use-multicolor-moves changed to', this.checked);
                chessState.use_multicolor_moves = this.checked;
                updateChessBoard(chessState.fen);
                sendVisualSettingsToUserscript();
            });

            document.getElementById('arrow-style').addEventListener('change', function() {
                // Only process if we're not already updating settings
                if (isUpdatingSettings) {
                    console.log('Ignoring arrow-style change while settings are being updated');
                    return;
                }

                console.log('External board: arrow-style changed to', this.value);
                chessState.arrow_style = this.value;
                updateChessBoard(chessState.fen);
                sendVisualSettingsToUserscript();
            });

            document.getElementById('arrow-animation').addEventListener('change', function() {
                // Only process if we're not already updating settings
                if (isUpdatingSettings) {
                    console.log('Ignoring arrow-animation change while settings are being updated');
                    return;
                }

                console.log('External board: arrow-animation changed to', this.checked);
                chessState.arrow_animation = this.checked;
                updateChessBoard(chessState.fen);
                sendVisualSettingsToUserscript();
            });

            document.getElementById('white-advantage-color').addEventListener('change', function() {
                // Only process if we're not already updating settings
                if (isUpdatingSettings) {
                    console.log('Ignoring white-advantage-color change while settings are being updated');
                    return;
                }

                console.log('External board: white-advantage-color changed to', this.value);
                chessState.white_advantage_color = this.value;
                updateEvaluationBar(chessState.evaluation);
                sendVisualSettingsToUserscript();
            });

            document.getElementById('black-advantage-color').addEventListener('change', function() {
                // Only process if we're not already updating settings
                if (isUpdatingSettings) {
                    console.log('Ignoring black-advantage-color change while settings are being updated');
                    return;
                }

                console.log('External board: black-advantage-color changed to', this.value);
                chessState.black_advantage_color = this.value;
                updateEvaluationBar(chessState.evaluation);
                sendVisualSettingsToUserscript();
            });

            // Add event listener for the disable main controls toggle
            document.getElementById('disable-main-controls').addEventListener('change', function() {
                // Only process if we're not already updating settings
                if (isUpdatingSettings) {
                    console.log('Ignoring disable-main-controls change while settings are being updated');
                    return;
                }

                console.log('External board: disable-main-controls changed to', this.checked);
                chessState.disable_main_controls = this.checked;

                // Send the command to update the userscript
                sendCommand('update_interface_settings', {
                    disable_main_controls: this.checked,
                    settings_last_updated: Date.now() / 1000,
                    settings_update_source: 'external_board'
                });
            });

            // Function to send visual settings to the userscript
            function sendVisualSettingsToUserscript() {
                // Set the updating flag to prevent update loops
                isUpdatingSettings = true;
                console.log('Sending visual settings from external board to userscript');

                // Update the timestamp for this settings change
                const currentTime = Date.now() / 1000; // Convert to seconds to match Python's time.time()

                // Update our local state with the new timestamp and source
                chessState.settings_last_updated = currentTime;
                chessState.settings_update_source = 'external_board';
                chessState.visual_settings = {
                    timestamp: currentTime,
                    source: 'external_board'
                };

                // Send the command with the updated settings
                sendCommand('update_visual_settings', {
                    move_indicator_location: chessState.move_indicator_location,
                    move_indicator_type: chessState.move_indicator_type,
                    show_multiple_moves: chessState.show_multiple_moves,
                    number_of_moves_to_show: chessState.number_of_moves_to_show,
                    use_multicolor_moves: chessState.use_multicolor_moves,
                    arrow_style: chessState.arrow_style,
                    arrow_animation: chessState.arrow_animation,
                    white_advantage_color: chessState.white_advantage_color,
                    black_advantage_color: chessState.black_advantage_color,
                    // Include synchronization metadata
                    settings_last_updated: currentTime,
                    settings_update_source: 'external_board'
                }).then(response => {
                    console.log('Visual settings sent to userscript:', response);

                    // Clear the updating flag after a short delay to allow the update to propagate
                    setTimeout(() => {
                        isUpdatingSettings = false;
                        console.log('Settings update complete, resuming normal operation');
                    }, 1000);
                }).catch(error => {
                    console.error('Error sending visual settings:', error);
                    isUpdatingSettings = false;
                });
            }
        };
    </script>
</body>
</html>
"""

# Write the HTML file
with open(os.path.join("web", "index.html"), "w") as f:
    f.write(html_content)

# Create a custom request handler
class ChessAIHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory="web", **kwargs)

    def do_GET(self):
        # Parse the URL
        parsed_url = urlparse(self.path)

        # Handle API requests
        if parsed_url.path.startswith('/api/'):
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            # Handle different API endpoints
            if parsed_url.path == '/api/status':
                self.wfile.write(json.dumps({"status": "running"}).encode())
            elif parsed_url.path == '/api/state':
                # Return the current chess state
                # Create a copy without the pending_commands to avoid exposing them
                state_copy = {k: v for k, v in chess_state.items() if k != 'pending_commands'}
                self.wfile.write(json.dumps(state_copy).encode())
            elif parsed_url.path == '/api/pending_commands':
                # Return any pending commands for the userscript
                commands = chess_state.get('pending_commands', [])
                response = {
                    "commands": commands
                }
                # Clear the pending commands after sending them
                chess_state['pending_commands'] = []
                self.wfile.write(json.dumps(response).encode())
            else:
                self.wfile.write(json.dumps({"error": "Unknown API endpoint"}).encode())
        else:
            # Serve static files
            super().do_GET()

    def do_OPTIONS(self):
        # Handle CORS preflight requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        # Handle POST requests for API
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

        try:
            data = json.loads(post_data.decode('utf-8'))

            # Handle different API endpoints
            if self.path == '/api/command':
                # Process command from userscript
                command = data.get('command')
                if command == 'run_engine':
                    chess_state['engine_running'] = True
                    chess_state['depth'] = data.get('depth', chess_state['depth'])

                    # Add the command to the pending commands queue for the userscript
                    chess_state['pending_commands'].append({
                        'command': 'run_engine',
                        'params': {
                            'depth': chess_state['depth']
                        },
                        'timestamp': time.time()
                    })

                    response = {"status": "success", "message": f"Engine started with depth {chess_state['depth']}"}
                elif command == 'stop_engine':
                    chess_state['engine_running'] = False

                    # Add the command to the pending commands queue for the userscript
                    chess_state['pending_commands'].append({
                        'command': 'stop_engine',
                        'params': {},
                        'timestamp': time.time()
                    })

                    response = {"status": "success", "message": "Engine stopped"}
                elif command == 'toggle_auto_move':
                    # Toggle the auto move state
                    chess_state['auto_move'] = not chess_state['auto_move']

                    # Add the command to the pending commands queue for the userscript
                    chess_state['pending_commands'].append({
                        'command': 'toggle_auto_move',
                        'params': {
                            'state': chess_state['auto_move']
                        },
                        'timestamp': time.time()
                    })

                    response = {"status": "success", "message": f"Auto move {'enabled' if chess_state['auto_move'] else 'disabled'}"}
                elif command == 'toggle_auto_run':
                    # Toggle the auto run state
                    chess_state['auto_run'] = not chess_state['auto_run']

                    # Add the command to the pending commands queue for the userscript
                    chess_state['pending_commands'].append({
                        'command': 'toggle_auto_run',
                        'params': {
                            'state': chess_state['auto_run']
                        },
                        'timestamp': time.time()
                    })

                    response = {"status": "success", "message": f"Auto run {'enabled' if chess_state['auto_run'] else 'disabled'}"}
                elif command == 'update_auto_run_delay':
                    # Update the auto run delay
                    params = data.get('params', {})
                    min_delay = params.get('min_delay', 0.1)
                    max_delay = params.get('max_delay', 1.0)

                    # Ensure min doesn't exceed max
                    if min_delay > max_delay:
                        min_delay = max_delay

                    chess_state['auto_run_delay_min'] = min_delay
                    chess_state['auto_run_delay_max'] = max_delay

                    # Add the command to the pending commands queue for the userscript
                    chess_state['pending_commands'].append({
                        'command': 'update_auto_run_delay',
                        'params': {
                            'min_delay': min_delay,
                            'max_delay': max_delay
                        },
                        'timestamp': time.time()
                    })

                    response = {"status": "success", "message": f"Auto run delay updated to {min_delay}-{max_delay} seconds"}
                elif command == 'update_opening_repertoire':
                    # Update the opening repertoire selection
                    params = data.get('params', {})
                    selected_repertoire = params.get('selected_opening_repertoire', 'mixed')

                    chess_state['selected_opening_repertoire'] = selected_repertoire

                    # Add the command to the pending commands queue for the userscript
                    chess_state['pending_commands'].append({
                        'command': 'update_opening_repertoire',
                        'params': {
                            'selected_opening_repertoire': selected_repertoire
                        },
                        'timestamp': time.time()
                    })

                    response = {"status": "success", "message": f"Opening repertoire updated to {selected_repertoire}"}
                elif command == 'update_visual_settings':
                    # Handle visual settings update from the external board
                    print("Received visual settings update from external board")

                    # Update the timestamp for this settings change
                    current_time = time.time()

                    # Visual settings that can be updated
                    visual_settings_keys = [
                        "move_indicator_location", "move_indicator_type", "show_multiple_moves",
                        "number_of_moves_to_show", "use_multicolor_moves", "arrow_style",
                        "arrow_animation", "white_advantage_color", "black_advantage_color"
                    ]

                    # Update the settings
                    params = data.get('params', {})
                    for key in visual_settings_keys:
                        if key in params:
                            chess_state[key] = params[key]

                    # Update the timestamp and source
                    chess_state['settings_last_updated'] = current_time
                    chess_state['settings_update_source'] = 'external_board'
                    chess_state['visual_settings'] = {
                        'timestamp': current_time,
                        'source': 'external_board'
                    }

                    # Add the command to the pending commands queue for the userscript
                    chess_state['pending_commands'].append({
                        'command': 'update_visual_settings',
                        'params': params,
                        'timestamp': current_time
                    })

                    print(f"Updated visual settings from external board (timestamp: {current_time})")

                    response = {
                        "status": "success",
                        "message": "Visual settings updated",
                        "timestamp": current_time
                    }
                elif command == 'update_interface_settings':
                    # Handle interface settings update from the external board
                    print("Received interface settings update from external board")

                    # Update the timestamp for this settings change
                    current_time = time.time()

                    # Interface settings that can be updated
                    interface_settings_keys = [
                        "disable_main_controls"
                    ]

                    # Update the settings
                    params = data.get('params', {})
                    for key in interface_settings_keys:
                        if key in params:
                            chess_state[key] = params[key]

                    # Update the timestamp and source
                    chess_state['settings_last_updated'] = current_time
                    chess_state['settings_update_source'] = 'external_board'

                    # Add the command to the pending commands queue for the userscript
                    chess_state['pending_commands'].append({
                        'command': 'update_interface_settings',
                        'params': params,
                        'timestamp': current_time
                    })

                    print(f"Updated interface settings from external board (timestamp: {current_time})")

                    response = {
                        "status": "success",
                        "message": "Interface settings updated",
                        "timestamp": current_time
                    }
                else:
                    response = {"status": "error", "message": f"Unknown command: {command}"}

                self.wfile.write(json.dumps(response).encode())
            elif self.path == '/api/update_state':
                # Update the chess state
                print(f"Received state update from userscript: {data.get('settings_update_source', 'unknown')}")

                # Check if this is a settings update from the userscript
                is_settings_update = False
                has_visual_settings = False

                # Track which visual settings are being updated
                visual_settings_keys = [
                    "move_indicator_location", "move_indicator_type", "show_multiple_moves",
                    "number_of_moves_to_show", "use_multicolor_moves", "arrow_style",
                    "arrow_animation", "arrow_color", "persistent_highlights",
                    "white_advantage_color", "black_advantage_color", "arrow_opacity"
                ]

                # Check if any visual settings are being updated
                for key in visual_settings_keys:
                    if key in data:
                        has_visual_settings = True
                        break

                # If this update contains visual settings and comes from the userscript
                if has_visual_settings and data.get('settings_update_source') == 'userscript':
                    is_settings_update = True
                    userscript_timestamp = data.get('settings_last_updated', 0)
                    server_timestamp = chess_state.get('settings_last_updated', 0)

                    # Only update if the userscript settings are newer or this is the first update
                    if userscript_timestamp > server_timestamp:
                        print(f"Applying visual settings from userscript (timestamp: {userscript_timestamp})")

                        # Update the visual settings
                        for key in visual_settings_keys:
                            if key in data:
                                chess_state[key] = data[key]

                        # Update the timestamp and source
                        chess_state['settings_last_updated'] = userscript_timestamp
                        chess_state['settings_update_source'] = 'userscript'
                        chess_state['visual_settings'] = {
                            'timestamp': userscript_timestamp,
                            'source': 'userscript'
                        }
                    else:
                        print(f"Ignoring older visual settings from userscript (userscript: {userscript_timestamp}, server: {server_timestamp})")

                # For non-visual settings or updates from other sources, update normally
                for key, value in data.items():
                    if key in chess_state and key not in visual_settings_keys:
                        chess_state[key] = value

                # Always update the last_update timestamp
                chess_state['last_update'] = time.time()

                response = {
                    "status": "success",
                    "message": "State updated",
                    "is_settings_update": is_settings_update,
                    "server_timestamp": chess_state['settings_last_updated']
                }
                self.wfile.write(json.dumps(response).encode())
            else:
                response = {"status": "error", "message": "Unknown endpoint"}
                self.wfile.write(json.dumps(response).encode())
        except json.JSONDecodeError:
            response = {"status": "error", "message": "Invalid JSON"}
            self.wfile.write(json.dumps(response).encode())

# Start the server
def start_server():
    with socketserver.TCPServer((HOST, PORT), ChessAIHandler) as httpd:
        print(f"Server started at http://{HOST}:{PORT}")
        print("Press Ctrl+C to stop the server")

        # Open the browser
        webbrowser.open(f"http://{HOST}:{PORT}")

        # Start the server
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("Server stopped.")

if __name__ == "__main__":
    start_server()
