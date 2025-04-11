// --- script.js --- Corrected Drawing Board ---

"use strict"; // 啟用嚴格模式

// --- DOM Elements ---
const vizCanvas = document.getElementById('cutCircleCanvas');
const drawingCanvas = document.getElementById('drawingCanvas');
const slicesInput = document.getElementById('slicesInput');
const drawButton = document.getElementById('drawButton');
const rearrangeButton = document.getElementById('rearrangeButton');
const infoDiv = document.getElementById('info');
// Drawing Controls
const penToolBtn = document.getElementById('penToolBtn');
const lineToolBtn = document.getElementById('lineToolBtn');
const rectToolBtn = document.getElementById('rectToolBtn');
const eraserToolBtn = document.getElementById('eraserToolBtn');
const colorPicker = document.getElementById('colorPicker');
const lineWidthSelect = document.getElementById('lineWidthSelect');
const clearDrawingBtn = document.getElementById('clearDrawingBtn');
const toolBtns = [penToolBtn, lineToolBtn, rectToolBtn, eraserToolBtn];

// --- Canvas Contexts & Error Check ---
let ctxViz, ctxDraw;
try {
    if (!vizCanvas || !drawingCanvas) throw new Error("HTML Canvas element(s) not found.");
    ctxViz = vizCanvas.getContext('2d');
    ctxDraw = drawingCanvas.getContext('2d');
    if (!ctxViz || !ctxDraw) throw new Error("Failed to get 2D context.");
    console.log("Canvas contexts obtained.");
} catch (e) {
    console.error("CRITICAL: Canvas setup failed:", e);
    alert(`錯誤：無法初始化畫布！\n${e.message}`);
    throw e;
}

// --- Constants ---
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const CIRCLE_RADIUS = 100;
const PADDING = 30;
const CENTER_X = CANVAS_WIDTH / 2;
const CENTER_Y = CIRCLE_RADIUS + PADDING + 20; // 150
const COLOR_CIRCUMFERENCE = "red";
const COLOR_RADIUS = "blue";
const COLOR_TEXT = "black";
const LINE_WIDTH_HIGHLIGHT = 2;
const LINE_WIDTH_NORMAL = 1;
const CURVE_FACTOR = 0.3;

// --- State Variables ---
let numSlices = 16;
let vizState = 'initial';
// Drawing Board State
let isDrawing = false;
let currentTool = 'pen'; // Default tool
let currentColor = '#000000';
let currentLineWidth = 2;
let startDrawX = 0;
let startDrawY = 0;
let eraserSize = 2;

// --- Helper Functions ---
function clearVizCanvas() {
    try { ctxViz.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); }
    catch(e) { console.error("Error clearing viz canvas:", e); }
}
function clearDrawingCanvas() {
    try { ctxDraw.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); console.log("[Draw] Cleared drawing canvas."); }
    catch(e) { console.error("Error clearing drawing canvas:", e); }
}
function drawText(text, x, y, size = 14, color = COLOR_TEXT, align = 'center', targetCtx = ctxViz) {
    if (!targetCtx) return;
    try { targetCtx.fillStyle = color; targetCtx.font = `${size}px sans-serif`; targetCtx.textAlign = align; targetCtx.fillText(text, x, y); }
    catch (e) { console.error(`Error drawing text "${text}":`, e); }
}
function getPos(canvas, evt) {
     if (!canvas) return null;
     try {
        const rect = canvas.getBoundingClientRect();
        let touch = evt.touches?.[0];
        const clientX = evt.clientX ?? touch?.clientX;
        const clientY = evt.clientY ?? touch?.clientY;
        if (clientX === undefined || clientY === undefined) return null;
        // console.log(`ClientXY: ${clientX?.toFixed(1)}, ${clientY?.toFixed(1)} | RectTL: ${rect.left.toFixed(1)}, ${rect.top.toFixed(1)}`) // Verbose Log
        return { x: clientX - rect.left, y: clientY - rect.top };
    } catch(e) { console.error("Error in getPos:", e); return null; }
}

// --- Visualization Drawing Functions ---
// Using the fixed V6 version for circle drawing
function drawCircleWithSectors(n) {
     console.log(`[Viz] ENTERING drawCircleWithSectors for n = ${n}`);
     if (!ctxViz) { console.error("Viz context missing"); return false; }
     if (isNaN(n) || n < 1) { console.error(`[Viz] Invalid n: ${n}`); clearVizCanvas(); drawText(`錯誤：無效份數 n=${n}`, CANVAS_WIDTH/2, 50, 16, 'red'); return false; }
     let errorOccurred = false;
     try {
        clearVizCanvas(); ctxViz.lineWidth = 1; console.log(`[Viz] Drawing circumference...`);
        ctxViz.beginPath(); ctxViz.arc(CENTER_X, CENTER_Y, CIRCLE_RADIUS, 0, 2 * Math.PI); ctxViz.strokeStyle = COLOR_CIRCUMFERENCE; ctxViz.lineWidth = LINE_WIDTH_HIGHLIGHT; ctxViz.stroke(); console.log("[Viz] Circumference drawn.");
        console.log(`[Viz] Starting radius lines loop (n=${n})...`); const angleStep = (2 * Math.PI) / n;
        if (isNaN(angleStep) || !isFinite(angleStep)) { throw new Error(`Invalid angleStep: ${angleStep}`); }
        ctxViz.strokeStyle = COLOR_RADIUS; ctxViz.lineCap = 'round';
        for (let i = 0; i < n; i++) {
            try {
                const angle = i * angleStep; const endX = CENTER_X + CIRCLE_RADIUS * Math.cos(angle); const endY = CENTER_Y + CIRCLE_RADIUS * Math.sin(angle);
                if ([angle, endX, endY].some(v => isNaN(v) || !isFinite(v))) { console.error(`[Viz] Invalid calc i=${i}. Skipping.`); errorOccurred = true; continue; }
                ctxViz.lineWidth = (i === 0) ? LINE_WIDTH_HIGHLIGHT : LINE_WIDTH_NORMAL;
                ctxViz.beginPath(); ctxViz.moveTo(CENTER_X, CENTER_Y); ctxViz.lineTo(endX, endY); ctxViz.stroke();
            } catch (loopError) { console.error(`[Viz] Error in loop i=${i}:`, loopError); errorOccurred = true; }
        }
        console.log("[Viz] Radius lines loop COMPLETED.");
    } catch(e) { console.error("[Viz] CRITICAL ERROR in drawCircleWithSectors:", e); errorOccurred = true; }
    finally {
        try { ctxViz.lineWidth = 1; ctxViz.lineCap = 'butt'; } catch {}
        if (errorOccurred) { clearVizCanvas(); drawText("繪製圓形時出錯", CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 16, 'red','center',ctxViz); }
         console.log(`[Viz] === drawCircleWithSectors finished (Errors: ${errorOccurred}) === `);
    }
    return !errorOccurred; // Return success status
}

// Keep V3 rearrange function
function drawRearranged_Final_Sheared_Curved_V3(n) {
    console.log(`[Viz] Drawing rearranged V3 (n=${n})`);
    if (!ctxViz) { console.error("Viz context missing"); return false; }
    if (n % 2 !== 0 || n < 2) { drawText("錯誤：需偶數且>=2", CANVAS_WIDTH/2, 50, 16, 'red','center',ctxViz); return false; }
    let errorOccurred = false;
    try {
        clearVizCanvas();
        const angleStepRad = (2*Math.PI)/n; const arcLength = CIRCLE_RADIUS*angleStepRad; const numSectors = n/2; const totalBaseLength = arcLength*numSectors; const shapeHeight = CIRCLE_RADIUS; const shiftX = arcLength/2; const visualWidth = totalBaseLength+shiftX; const startX = (CANVAS_WIDTH-visualWidth)/2; const topBaseY = PADDING+50; const tipY = topBaseY+shapeHeight; const curveBulge = arcLength*CURVE_FACTOR;
        const leftBound=startX; const rightBound=startX+visualWidth; const topBound=topBaseY-curveBulge; const bottomBound=tipY+curveBulge;
        if (leftBound < PADDING || rightBound > CANVAS_WIDTH - PADDING || topBound < PADDING || bottomBound > CANVAS_HEIGHT - PADDING - 50) { drawText("錯誤：圖形太大", CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 16, 'red','center',ctxViz); return false; }
        ctxViz.lineWidth = LINE_WIDTH_HIGHLIGHT;
        for (let i = 0; i < numSectors; i++) {
            const baseLeftX=startX+i*arcLength; const baseRightX=startX+(i+1)*arcLength; const tipX=startX+(i+0.5)*arcLength;
            ctxViz.beginPath(); ctxViz.moveTo(baseLeftX, topBaseY); ctxViz.lineTo(tipX, tipY); ctxViz.strokeStyle = COLOR_RADIUS; ctxViz.stroke();
            ctxViz.beginPath(); ctxViz.moveTo(tipX, tipY); ctxViz.lineTo(baseRightX, topBaseY); ctxViz.strokeStyle = COLOR_RADIUS; ctxViz.stroke();
            const midTopX=(baseLeftX+baseRightX)/2; const ctrlTopY=topBaseY-curveBulge;
            ctxViz.beginPath(); ctxViz.moveTo(baseLeftX, topBaseY); ctxViz.quadraticCurveTo(midTopX, ctrlTopY, baseRightX, topBaseY); ctxViz.strokeStyle = COLOR_CIRCUMFERENCE; ctxViz.stroke();
            const botSegStartX=baseLeftX+shiftX; const botSegEndX=baseRightX+shiftX; const midBotX=(botSegStartX+botSegEndX)/2; const ctrlBotY=tipY+curveBulge;
            ctxViz.beginPath(); ctxViz.moveTo(botSegStartX, tipY); ctxViz.quadraticCurveTo(midBotX, ctrlBotY, botSegEndX, tipY); ctxViz.strokeStyle = COLOR_CIRCUMFERENCE; ctxViz.stroke();
        }
        const topRightX=startX+totalBaseLength; const bottomRightX=startX+totalBaseLength+shiftX;
        ctxViz.beginPath(); ctxViz.moveTo(topRightX, topBaseY); ctxViz.lineTo(bottomRightX, tipY); ctxViz.strokeStyle = COLOR_RADIUS; ctxViz.stroke();
        const textY = bottomBound + PADDING + 5;
        if (textY + 45 < CANVAS_HEIGHT) { const approxBase=Math.PI*CIRCLE_RADIUS; const approxHeight=CIRCLE_RADIUS; const approxArea=approxBase*approxHeight; const actualArea=Math.PI*CIRCLE_RADIUS*CIRCLE_RADIUS; drawText(`重組後 (n=${n})...`, CANVAS_WIDTH / 2, textY, 14, COLOR_TEXT, 'center', ctxViz); /* etc */ }
        console.log("[Viz] Rearranged shape drawn.");
    } catch(e) { console.error("Error in drawRearranged:", e); errorOccurred = true; }
    finally {
         try { ctxViz.lineWidth = 1; } catch {}
         if (errorOccurred) { clearVizCanvas(); drawText("繪製重組圖形時出錯", CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 16, 'red','center',ctxViz); }
          console.log(`[Viz] === drawRearranged finished (Errors: ${errorOccurred}) === `);
    }
     return !errorOccurred; // Return success status
}

// --- Drawing Board Functions (Draw on ctxDraw) ---

function startDrawing(e) {
    console.log("[Draw] Event: mousedown or touchstart"); // Log event start
    const pos = getPos(drawingCanvas, e);
    if (!pos) { console.log("[Draw] No position, ignoring start."); return; }
    isDrawing = true;
    startDrawX = pos.x;
    startDrawY = pos.y;

    // ** Explicitly set all relevant drawing styles **
    ctxDraw.lineWidth = currentLineWidth;
    ctxDraw.strokeStyle = currentColor;
    ctxDraw.fillStyle = currentColor; // Needed for eraser fillRect
    ctxDraw.lineCap = 'round';
    ctxDraw.lineJoin = 'round';

    console.log(`[Draw] Starting at (${startDrawX.toFixed(1)}, ${startDrawY.toFixed(1)}) | Tool: ${currentTool} | Color: ${currentColor} | Width: ${currentLineWidth}`);

    if (currentTool === 'eraser') {
        // Use destination-out to "clear" pixels
        ctxDraw.globalCompositeOperation = 'destination-out';
        // Initial erase block at the start point
        // Using fillRect for consistent size erasing
        ctxDraw.fillRect(startDrawX - eraserSize / 2, startDrawY - eraserSize / 2, eraserSize, eraserSize);
        console.log(`[Draw] Eraser started, compositeOp=${ctxDraw.globalCompositeOperation}, size=${eraserSize}`);
    } else {
        // Ensure normal drawing mode for other tools
        ctxDraw.globalCompositeOperation = 'source-over';
        ctxDraw.beginPath(); // <<-- Crucial: Start a new path
        ctxDraw.moveTo(startDrawX, startDrawY);
         console.log(`[Draw] Pen/Line/Rect started, compositeOp=${ctxDraw.globalCompositeOperation}`);
    }
}

function draw(e) {
    if (!isDrawing) return; // Only draw if mouse/touch is down
    const pos = getPos(drawingCanvas, e);
    if (!pos) return;
    e.preventDefault(); // Prevent default touch actions like scrolling

    const currentX = pos.x;
    const currentY = pos.y;
    // console.log(`[Draw] Moving to (${currentX.toFixed(1)}, ${currentY.toFixed(1)})`); // Can be very verbose

    if (currentTool === 'pen') {
        // Continue the path started in startDrawing
        ctxDraw.lineTo(currentX, currentY);
        ctxDraw.stroke(); // Stroke the segment
    } else if (currentTool === 'eraser') {
        // Clear small rectangles along the path
        // Use fillRect because stroke doesn't work well with destination-out for erasing paths
        ctxDraw.fillRect(currentX - eraserSize / 2, currentY - eraserSize / 2, eraserSize, eraserSize);
    }
    // For Line and Rect, we don't draw during move in this simple version
}

function stopDrawing(e) {
    if (!isDrawing) return; // Only stop if we were drawing
    const pos = getPos(drawingCanvas, e); // Get final position if possible
    isDrawing = false; // Reset flag

    const endX = pos ? pos.x : startDrawX; // Use last known if cursor/touch left canvas
    const endY = pos ? pos.y : startDrawY;
    console.log(`[Draw] Stop at (${endX.toFixed(1)}, ${endY.toFixed(1)}) | Tool: ${currentTool}`);

    // Set back to normal drawing mode AFTER finishing the current shape/action
    // Important especially after eraser or if we added preview logic later
    ctxDraw.globalCompositeOperation = 'source-over';

    if (currentTool === 'line') {
        // Draw the final line from start to end
        ctxDraw.beginPath(); // Start a path specifically for this line
        ctxDraw.moveTo(startDrawX, startDrawY);
        ctxDraw.lineTo(endX, endY);
        ctxDraw.stroke();
    } else if (currentTool === 'rect') {
        // Draw the final rectangle
        ctxDraw.beginPath(); // Start a path specifically for this rectangle
        ctxDraw.strokeRect(startDrawX, startDrawY, endX - startDrawX, endY - startDrawY);
    } else if (currentTool === 'pen') {
        // Path was drawn during 'draw', maybe close it? Optional.
        // ctxDraw.closePath(); // Usually not needed for freehand pen
    } else if (currentTool === 'eraser') {
        // Nothing special needed on mouseup for eraser using fillRect method
    }

    // Reset path for the *next* drawing operation
    ctxDraw.beginPath();
    console.log("[Draw] Drawing stopped, path reset.");
}

function setActiveTool(selectedTool) {
    // Basic validation
    if (!['pen', 'line', 'rect', 'eraser'].includes(selectedTool)) {
        console.warn("Invalid tool selected:", selectedTool);
        return;
    }
    currentTool = selectedTool;
    console.log("[Draw] Tool changed to:", currentTool);

    // Update button styles
    toolBtns.forEach(btn => {
        if(btn) { // Check button exists
             btn.classList.toggle('active', btn.dataset.tool === selectedTool);
        }
    });

    // Update cursor and potentially eraser size
    if (currentTool === 'eraser') {
        eraserSize = currentLineWidth; // Link size
        drawingCanvas.style.cursor = 'cell'; // Indicate eraser
        console.log("[Draw] Eraser active, size:", eraserSize);
        // IMPORTANT: Don't set globalCompositeOperation here, do it in startDrawing/draw
        // because we need 'source-over' for drawing lines/rects even if eraser is selected
    } else {
        drawingCanvas.style.cursor = 'crosshair'; // Default drawing cursor
        // Ensure drawing mode is normal if switching away from eraser action
        ctxDraw.globalCompositeOperation = 'source-over';
    }
}


// --- Event Listeners --- (Add more checks for element existence)

if (drawButton) drawButton.addEventListener('click', () => {
    console.log("[Viz] Draw button clicked.");
    if (!slicesInput || !infoDiv || !rearrangeButton || !drawButton) { console.error("UI Element missing in draw listener!"); return; }
    let success = false;
    try {
        let val = parseInt(slicesInput.value);
        if (isNaN(val) || val < 4) { val = 4; slicesInput.value = val; }
        numSlices = val;
        success = drawCircleWithSectors(numSlices); // Function now returns true/false
        if (success) {
            vizState = 'circle_drawn';
            rearrangeButton.disabled = false;
            drawButton.disabled = true;
            infoDiv.textContent = `圓已分割 ${numSlices} 份。點擊重組。`;
        } else {
             vizState = 'error'; rearrangeButton.disabled = true; drawButton.disabled = false;
             infoDiv.textContent = `繪製圓形失敗 (n=${numSlices})。`; // Error text drawn on canvas
        }
    } catch(e) { console.error("Error in drawButton listener:", e); infoDiv.textContent = "繪製按鈕出錯"; }
});

if (rearrangeButton) rearrangeButton.addEventListener('click', () => {
    console.log("[Viz] Rearrange button clicked.");
    if (!slicesInput || !infoDiv || !drawButton) { console.error("UI Element missing in rearrange listener!"); return; }
     let success = false;
    try {
        let val = parseInt(slicesInput.value);
        if (isNaN(val)) throw new Error("Invalid n");
        if (val % 2 !== 0) { val++; slicesInput.value = val; infoDiv.textContent = `調整偶數 ${val}...`; }
        else { infoDiv.textContent = `重組 n=${val}...`; }
        if (val < 2) { val = 2; slicesInput.value = val; }
        numSlices = val;
        success = drawRearranged_Final_Sheared_Curved_V3(numSlices); // Function returns true/false
        if (success) {
            vizState = 'rearranged'; rearrangeButton.disabled = false; drawButton.disabled = false;
             infoDiv.textContent = `已重組 (n=${numSlices})`; // Update info on success
        } else {
             vizState = 'error'; rearrangeButton.disabled = true; drawButton.disabled = false;
             infoDiv.textContent = `重組失敗 (n=${numSlices})。`; // Error text drawn on canvas
        }
    } catch(e) { console.error("Error in rearrangeButton listener:", e); infoDiv.textContent = "重組按鈕出錯"; }
});

if (slicesInput) slicesInput.addEventListener('change', () => {
    console.log("[Viz] Slices input changed.");
    if (!infoDiv || !rearrangeButton || !drawButton) { console.error("UI Element missing in slices listener!"); return; }
    try {
        let val = parseInt(slicesInput.value);
        if (isNaN(val) || val < 4) { val = 4; slicesInput.value = val; }
        numSlices = val;
        clearVizCanvas(); vizState = 'initial';
        rearrangeButton.disabled = true; drawButton.disabled = false;
        infoDiv.textContent = `份數改為 ${numSlices}。請點擊繪製圓形。`;
        drawText(`點擊 "繪製圓形" (n=${numSlices})`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
    } catch(e) { console.error("Error in slicesInput listener:", e); }
});

// Drawing Canvas Listeners
if (drawingCanvas) {
    // Use named functions for potentially easier removal if needed later
    drawingCanvas.addEventListener('mousedown', startDrawing);
    drawingCanvas.addEventListener('mousemove', draw);
    drawingCanvas.addEventListener('mouseup', stopDrawing);
    drawingCanvas.addEventListener('mouseout', stopDrawing); // Important to stop drawing if mouse leaves
    // Touch events
    drawingCanvas.addEventListener('touchstart', startDrawing, { passive: false });
    drawingCanvas.addEventListener('touchmove', draw, { passive: false });
    drawingCanvas.addEventListener('touchend', stopDrawing);
    drawingCanvas.addEventListener('touchcancel', stopDrawing); // Handle cancelled touches
    console.log("[Draw] Drawing listeners attached.");
} else { console.error("Drawing canvas element not found! Drawing listeners not attached."); }


// Drawing Control Listeners
toolBtns.forEach(btn => {
    if(btn) {
        const tool = btn.dataset.tool;
        if (tool) btn.addEventListener('click', () => setActiveTool(tool));
        else console.warn("Button missing data-tool attribute:", btn.id);
    } else { console.warn("A tool button was not found in the DOM."); }
});
if (colorPicker) colorPicker.addEventListener('input', (e) => { currentColor = e.target.value; });
if (lineWidthSelect) lineWidthSelect.addEventListener('change', (e) => { currentLineWidth = parseInt(e.target.value); if (currentTool === 'eraser') eraserSize = currentLineWidth; });
if (clearDrawingBtn) clearDrawingBtn.addEventListener('click', clearDrawingCanvas);


// --- Initial State ---
function initialize() {
     console.log("Initializing application...");
     try {
        // Contexts checked at top
        clearVizCanvas(); clearDrawingCanvas();

        // Init Viz State
        if(slicesInput) slicesInput.disabled = false; else console.warn("Slices input missing!");
        if(drawButton) drawButton.disabled = false; else console.warn("Draw button missing!");
        if(rearrangeButton) rearrangeButton.disabled = true; else console.warn("Rearrange button missing!");
        drawText(`請選偶數份數(≥4)，點擊 '繪製圓形'`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
        vizState = 'initial';
        let initVal = parseInt(slicesInput?.value);
        if (isNaN(initVal) || initVal < 4) initVal = 16;
        numSlices = initVal; if (slicesInput) slicesInput.value = numSlices;

        // Init Drawing Board State
        if(colorPicker) currentColor = colorPicker.value; else currentColor = '#000000';
        if(lineWidthSelect) currentLineWidth = parseInt(lineWidthSelect.value); else currentLineWidth = 2;
        eraserSize = currentLineWidth;
        setActiveTool('pen'); // Set default tool and style button

        if(infoDiv) infoDiv.textContent = "請選擇份數並點擊 '繪製圓形'";
        console.log("Initialization complete. Initial n =", numSlices);
    } catch(e) {
        console.error("Error during initialize:", e);
        try { document.body.innerHTML = `<p style="color:red;">初始化錯誤: ${e.message}</p>`; } catch {}
    }
}

// Run initialize() only after the script is fully loaded
initialize();
