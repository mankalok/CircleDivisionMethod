// --- DOM Elements ---
const canvas = document.getElementById('cutCircleCanvas');
const ctx = canvas.getContext('2d');
const slicesInput = document.getElementById('slicesInput');
const drawButton = document.getElementById('drawButton');
const rearrangeButton = document.getElementById('rearrangeButton');
const infoDiv = document.getElementById('info');

// --- Constants ---
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const CIRCLE_RADIUS = 100;
const PADDING = 30;
const CENTER_X = CANVAS_WIDTH / 2;
const CENTER_Y = CIRCLE_RADIUS + PADDING + 20; // 150
const COLOR_CIRCUMFERENCE = "red";    // 上下弧線顏色
const COLOR_RADIUS = "blue";       // 斜線顏色
const COLOR_TEXT = "black";
const LINE_WIDTH_HIGHLIGHT = 2;
const LINE_WIDTH_NORMAL = 1;
const CURVE_FACTOR = 0.3; // 弧度因子

// --- State Variables ---
let initialSlices = parseInt(slicesInput.value);
if (isNaN(initialSlices) || initialSlices < 4) { initialSlices = 16; slicesInput.value = initialSlices; }
let numSlices = initialSlices;
let currentState = 'initial';

// --- Helper Functions --- (保持不變)
function clearCanvas() {
    console.log("[Debug] Clearing canvas...");
    try { ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); console.log("[Debug] Canvas cleared."); }
    catch(e) { console.error("[Debug] Error clearing canvas:", e); }
}
function drawText(text, x, y, size = 14, color = COLOR_TEXT, align = 'center') {
    console.log(`[Debug] Drawing text: "${text}"...`);
    try { ctx.fillStyle = color; ctx.font = `${size}px sans-serif`; ctx.textAlign = align; ctx.fillText(text, x, y); }
    catch (e) { console.error("[Debug] Error drawing text:", text, e); }
}

// --- Drawing Functions ---

function drawCircleWithSectors(n) { /* ... (同上一版本) ... */
    console.log(`[Debug] === ENTERING drawCircleWithSectors for n = ${n} ===`);
     if (isNaN(n) || n < 1) { console.error(`[Debug] Invalid n value: ${n}`); clearCanvas(); drawText(`錯誤：無效的份數 n=${n}`, CANVAS_WIDTH/2, 50, 16, 'red'); return; }
     try {
        clearCanvas(); ctx.lineWidth = 1; console.log(`[Debug] Drawing circumference...`);
        ctx.beginPath(); ctx.arc(CENTER_X, CENTER_Y, CIRCLE_RADIUS, 0, 2*Math.PI); ctx.strokeStyle = COLOR_CIRCUMFERENCE; ctx.lineWidth = LINE_WIDTH_HIGHLIGHT; ctx.stroke(); console.log("[Debug] Circumference drawn.");
        console.log(`[Debug] Starting radius lines loop (n=${n})...`); const angleStep = (2*Math.PI)/n; ctx.strokeStyle = COLOR_RADIUS;
        for (let i = 0; i < n; i++) {
            const angle = i*angleStep; const endX = CENTER_X+CIRCLE_RADIUS*Math.cos(angle); const endY = CENTER_Y+CIRCLE_RADIUS*Math.sin(angle);
            if ([angle, endX, endY].some(isNaN)) { console.error(`NaN in loop i=${i}`); continue; }
            ctx.lineWidth = (i===0)?LINE_WIDTH_HIGHLIGHT:LINE_WIDTH_NORMAL; ctx.beginPath(); ctx.moveTo(CENTER_X, CENTER_Y); ctx.lineTo(endX, endY); ctx.stroke();
        }
        ctx.lineWidth = 1; console.log("[Debug] Radius lines loop finished."); console.log("[Debug] === drawCircleWithSectors finished successfully === ");
    } catch(e) { console.error("[Debug] CRITICAL ERROR in drawCircleWithSectors:", e); clearCanvas(); drawText("繪製圓形時發生嚴重錯誤", CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 16, 'red'); }
}


/**
 * 【最終版本 V3】繪製重組圖形：上方扇形 + 分段位移底部弧線 + 右側藍線 + 頂部弧線
 */
function drawRearranged_Final_Sheared_Curved_V3(n) { // 函數名更新為 V3
    clearCanvas();
    console.log(`--- Running drawRearranged_Final_Sheared_Curved_V3 for n = ${n} ---`);

    if (n % 2 !== 0) { drawText("錯誤：此佈局需要偶數分割份數", CANVAS_WIDTH / 2, 50, 16, 'red'); return; }
    if (n < 2) { drawText("錯誤：份數至少需要為 2", CANVAS_WIDTH / 2, 50, 16, 'red'); return; }

    const angleStepRad = (2 * Math.PI) / n;
    const arcLength = CIRCLE_RADIUS * angleStepRad;
    const numSectors = n / 2;
    const totalBaseLength = arcLength * numSectors; // Approx πr
    const shapeHeight = CIRCLE_RADIUS; // Approx r
    const shiftX = arcLength / 2; // 水平位移量

    // --- Placement & Visibility ---
    const topBaseY = PADDING + 50;
    const tipY = topBaseY + shapeHeight;
    const visualWidth = totalBaseLength + shiftX;
    const startX = (CANVAS_WIDTH - visualWidth) / 2; // 水平居中
    const curveBulge = arcLength * CURVE_FACTOR;

    // Check boundaries
    const leftBound = startX; const rightBound = startX + visualWidth; const topBound = topBaseY - curveBulge; const bottomBound = tipY + curveBulge;
    if (leftBound < PADDING || rightBound > CANVAS_WIDTH - PADDING || topBound < PADDING || bottomBound > CANVAS_HEIGHT - PADDING - 50) {
        drawText("錯誤：圖形太大無法完全顯示", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10, 16, 'red'); console.error("Shape too large"); return;
    }
    console.log(`Layout: numSectors=${numSectors}, totalBaseLength=${totalBaseLength.toFixed(2)}, shapeHeight=${shapeHeight}, shiftX=${shiftX.toFixed(2)}`);
    console.log(`Placement: startX=${startX.toFixed(2)}, topBaseY=${topBaseY.toFixed(2)}, tipY=${tipY.toFixed(2)}`);

    // --- 繪製上半部分扇形 和 分段的底部弧線 ---
    console.log("[Debug] Drawing top row triangles and segmented bottom curve...");
    for (let i = 0; i < numSectors; i++) {
        const baseLeftX = startX + i * arcLength;
        const baseRightX = startX + (i + 1) * arcLength;
        const tipX = startX + (i + 0.5) * arcLength;

        // 繪製左半徑 (Blue)
        ctx.beginPath(); ctx.moveTo(baseLeftX, topBaseY); ctx.lineTo(tipX, tipY);
        ctx.strokeStyle = COLOR_RADIUS; ctx.lineWidth = LINE_WIDTH_HIGHLIGHT; ctx.stroke();

        // 繪製右半徑 (Blue)
        ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.lineTo(baseRightX, topBaseY);
        ctx.strokeStyle = COLOR_RADIUS; ctx.lineWidth = LINE_WIDTH_HIGHLIGHT; ctx.stroke();

        // 繪製帶弧度的頂部基線 (Red) - Bulge Up
        const midBaseX_Top = (baseLeftX + baseRightX) / 2;
        const controlY_Up = topBaseY - curveBulge;
        ctx.beginPath(); ctx.moveTo(baseLeftX, topBaseY);
        ctx.quadraticCurveTo(midBaseX_Top, controlY_Up, baseRightX, topBaseY);
        ctx.strokeStyle = COLOR_CIRCUMFERENCE; ctx.lineWidth = LINE_WIDTH_HIGHLIGHT; ctx.stroke();

        // **【修改】繪製對應的、位移的、分段的底部弧線 (Red)**
        const bottomSegStartX = baseLeftX + shiftX; // 應用位移
        const bottomSegEndX = baseRightX + shiftX;   // 應用位移
        const midBaseX_Bottom = (bottomSegStartX + bottomSegEndX) / 2; // 位移後的中點
        const controlY_Down = tipY + curveBulge; // 向下凸出

        ctx.beginPath();
        ctx.moveTo(bottomSegStartX, tipY); // 從位移後的起點開始
        ctx.quadraticCurveTo(midBaseX_Bottom, controlY_Down, bottomSegEndX, tipY); // 繪製到位移後的終點
        ctx.strokeStyle = COLOR_CIRCUMFERENCE; // Red
        ctx.lineWidth = LINE_WIDTH_HIGHLIGHT;
        ctx.stroke();
    }
    console.log("[Debug] Drawing loop finished.");

    // --- 【移除】不再需要單獨繪製整條底部紅線的代碼 ---

    // --- 【修改】只繪製右側藍色封閉斜線 ---
    const topRightX = startX + totalBaseLength; // 頂部基線的最右端 X
    const bottomRightX = startX + totalBaseLength + shiftX; // 底部基線(位移後)的最右端 X

    console.log(`Adding right closing line from (${topRightX.toFixed(1)}, ${topBaseY}) to (${bottomRightX.toFixed(1)}, ${tipY})`);
    ctx.beginPath();
    ctx.moveTo(topRightX, topBaseY);    // Top-right corner
    ctx.lineTo(bottomRightX, tipY); // Bottom-right corner (shifted)
    ctx.strokeStyle = COLOR_RADIUS;    // Blue
    ctx.lineWidth = LINE_WIDTH_HIGHLIGHT;
    ctx.stroke();

    // --- 添加說明文字 --- (保持不變)
    console.log("[Debug] Drawing text...");
    const approxBase = Math.PI*CIRCLE_RADIUS; const approxHeight = CIRCLE_RADIUS; const approxArea = approxBase*approxHeight; const actualArea = Math.PI*CIRCLE_RADIUS*CIRCLE_RADIUS; const textY = bottomBound + PADDING + 5; // 確保在底部弧線下方
     if (textY + 45 < CANVAS_HEIGHT) {
        drawText(`重組後 (n=${n}) - 平行四邊形樣式`, CANVAS_WIDTH / 2, textY);
        drawText(`近似平行四邊形: 底 ≈ πr (${approxBase.toFixed(1)}), 高 ≈ r (${approxHeight})`, CANVAS_WIDTH / 2, textY + 20);
        drawText(`面積 ≈ 底 × 高 ≈ ${approxArea.toFixed(1)} (實際 πr² ≈ ${actualArea.toFixed(1)})`, CANVAS_WIDTH / 2, textY + 40);
    } else { drawText(`n=${n}, Area ≈ ${approxArea.toFixed(1)}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10, 12); }
    ctx.lineWidth = 1;
    console.log(`[Debug] === drawRearranged_Final_Sheared_Curved_V3 finished ===`);
}


// --- Event Listeners --- (確保 rearrangeButton 調用 V3 函數)

drawButton.addEventListener('click', () => {
    console.log("[Debug] Draw button clicked.");
    try {
        let currentInputValue = parseInt(slicesInput.value);
        if (isNaN(currentInputValue) || currentInputValue < 4) { currentInputValue = 4; slicesInput.value = currentInputValue; }
        numSlices = currentInputValue;
        drawCircleWithSectors(numSlices);
        currentState = 'circle_drawn';
        rearrangeButton.disabled = false;
        drawButton.disabled = true;
        infoDiv.textContent = `圓已分割成 ${numSlices} 份。點擊按鈕進行重組。`;
    } catch(e) { console.error("[Debug] Error in drawButton listener:", e); }
});

rearrangeButton.addEventListener('click', () => {
    console.log("[Debug] Rearrange button clicked.");
    try {
        let currentInputValue = parseInt(slicesInput.value);
        if (isNaN(currentInputValue)) { console.error("Invalid n"); infoDiv.textContent="無效份數"; return; }
         if (currentInputValue % 2 !== 0) {
             currentInputValue++; slicesInput.value = currentInputValue;
             infoDiv.textContent = `份數調整為偶數 ${currentInputValue}。正在重組...`;
         } else {
              infoDiv.textContent = `正在重組 n=${currentInputValue} ...`;
         }
         if (currentInputValue < 2) { currentInputValue = 2; slicesInput.value = currentInputValue; }
         numSlices = currentInputValue;

         console.log("[Debug] Calling drawRearranged_Final_Sheared_Curved_V3 with n =", numSlices);
        // ** 調用 V3 繪圖函數 **
        drawRearranged_Final_Sheared_Curved_V3(numSlices); // <--- Function name updated
        currentState = 'rearranged';
        rearrangeButton.disabled = false;
        drawButton.disabled = false;
    } catch(e) {
        console.error("[Debug] Error in rearrangeButton listener:", e);
        infoDiv.textContent = "重組時發生錯誤，請查看控制台。";
     }
});

slicesInput.addEventListener('change', () => {
    console.log("[Debug] Input changed.");
    try {
        let potentialSlices = parseInt(slicesInput.value);
        if (isNaN(potentialSlices) || potentialSlices < 4) { potentialSlices = 4; slicesInput.value = potentialSlices; }
        numSlices = potentialSlices;
        clearCanvas();
        currentState = 'initial';
        rearrangeButton.disabled = true;
        drawButton.disabled = false;
        infoDiv.textContent = `份數更改為 ${numSlices}。請點擊 "繪製圓形"。`;
        drawText(`請點擊 "繪製圓形" 以使用 n=${numSlices}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
    } catch(e) { console.error("[Debug] Error in slicesInput listener:", e); }
});

// --- Initial State ---
function initialize() {
     console.log("[Debug] Initializing...");
     try {
        if (!ctx) { throw new Error("Canvas context is null!"); }
        clearCanvas();
        slicesInput.disabled = false;
        drawButton.disabled = false;
        rearrangeButton.disabled = true;
        drawText(`請選擇偶數份數 (建議≥8)，點擊 '繪製圓形'`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
        currentState = 'initial';
        if (isNaN(numSlices) || numSlices < 4) { numSlices = 16; }
        slicesInput.value = numSlices;
        console.log("[Debug] Init complete. n =", numSlices);
    } catch(e) {
        console.error("[Debug] Error during initialize:", e);
        try { document.body.innerHTML = `<p style="color:red;">初始化錯誤: ${e.message}</p>`; } catch {}
    }
}
initialize();

// --- Include Full Helper Function Definitions ---
// (Make sure these are actually present in your final script)
// function drawText(...) { ... }
// function drawCircleWithSectors(...) { ... }