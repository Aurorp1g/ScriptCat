// ==UserScript==
// @name               beautifulcarrot-watermark-remover-batch
// @name:zh-CN         萝卜工坊批量去水印下载
// @namespace          https://github.com/Aurorp1g/ScriptCat
// @version            2.5.2
// @description        Remove watermark preview + batch download (ZIP/PDF) for beautifulcarrot.com
// @description:zh-CN  萝卜工坊去水印工具，支持单页预览去水印、曝光调节、一键批量下载所有页面为ZIP或PDF
// @author             Aurorp1g
// @match              https://beautifulcarrot.com/v2/*
// @icon               https://cdn.beautifulcarrot.com/static/img/logosmall.png
// @grant              none
// @run-at             document-end
// @require            https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
// @require            https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js
// @supportURL         https://github.com/Aurorp1g/ScriptCat/issues
// @license            MIT
// ==/UserScript==

(function () {
    'use strict';

    // ===== Font Awesome 6 内联 SVG 图标定义 =====
    const ICONS = {
        eye: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" style="width:14px;height:14px;fill:currentColor;vertical-align:middle;margin-right:4px;"><path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.8-1.9-11.2 3.4-9.3 9.3c5.7 17.3 20.6 29.7 38.3 29.7c22.5 0 40.7-18.2 40.7-40.7s-18.2-40.7-40.7-40.7c-17.7 0-32.6 12.4-38.3 29.7c-1.9 5.8 3.5 11.2 9.3 9.3c6.4-2.1 13.2-3.3 20.3-3.3c35.3 0 64 28.7 64 64z"/></svg>',
        download: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="width:14px;height:14px;fill:currentColor;vertical-align:middle;margin-right:4px;"><path d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V274.7l-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7V32zM64 352c-35.3 0-64 28.7-64 64v32c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V416c0-35.3-28.7-64-64-64H298.5l-45.3 45.3c-25 25-65.5 25-90.5 0L117.5 352H64zM432 456c-13.3 0-24-10.7-24-24s10.7-24 24-24s24 10.7 24 24s-10.7 24-24 24z"/></svg>',
        camera: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="width:12px;height:12px;fill:currentColor;vertical-align:middle;margin-right:3px;"><path d="M149.1 64.8L138.7 96H64C28.7 96 0 124.7 0 160V416c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V160c0-35.3-28.7-64-64-64H373.3L362.9 64.8C356.4 45.2 338.1 32 317.4 32H194.6c-20.7 0-39 13.2-45.5 32.8zM256 384c-53 0-96-43-96-96s43-96 96-96s96 43 96 96s-43 96-96 96z"/></svg>',
        fileZipper: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" style="width:14px;height:14px;fill:currentColor;vertical-align:middle;margin-right:4px;"><path d="M64 0C28.7 0 0 28.7 0 64V448c0 35.3 28.7 64 64 64H320c35.3 0 64-28.7 64-64V160H256c-17.7 0-32-14.3-32-32V0H64zM96 192c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H112c-8.8 0-16-7.2-16-16V192zm48 128c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H160c-8.8 0-16-7.2-16-16V320zm-32 96c8.8 0 16-7.2 16-16V384c0-8.8-7.2-16-16-16H112c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h32zm96 32c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H224c-8.8 0-16-7.2-16-16V448zm65-192c-8.8 0-16-7.2-16-16V224c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16h-32zm16 128c-8.8 0-16-7.2-16-16V320c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16h-32zM224 64H336c8.8 0 16 7.2 16 16s-7.2 16-16 16H224c-8.8 0-16-7.2-16-16s7.2-16 16-16z"/></svg>',
        filePdf: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="width:14px;height:14px;fill:currentColor;vertical-align:middle;margin-right:4px;"><path d="M64 0C28.7 0 0 28.7 0 64V448c0 35.3 28.7 64 64 64H320c35.3 0 64-28.7 64-64V160H256c-17.7 0-32-14.3-32-32V0H64zM256 0V128H384V256H128V0H256zM48 368c0-8.8 7.2-16 16-16h48c8.8 0 16 7.2 16 16v48c0 8.8-7.2 16-16 16H64c-8.8 0-16-7.2-16-16V368zm128 0c0-8.8 7.2-16 16-16h48c8.8 0 16 7.2 16 16v48c0 8.8-7.2 16-16 16H192c-8.8 0-16-7.2-16-16V368zm128 0c0-8.8 7.2-16 16-16h48c8.8 0 16 7.2 16 16v48c0 8.8-7.2 16-16 16H320c-8.8 0-16-7.2-16-16V368z"/></svg>',
        checkCircle: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="width:16px;height:16px;fill:#28a745;vertical-align:middle;margin-right:6px;"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm113-303L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"/></svg>',
        play: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" style="width:10px;height:10px;fill:currentColor;vertical-align:middle;margin-right:3px;"><path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.9 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"/></svg>'
    };

    // ===== 配置项 =====
    const CONFIG = {
        defaultExposure: 0,
        watermarkColor: { r: 0xE7, g: 0xE7, b: 0xE7 },
        tolerance: 33,
        cropPadding: 20,
        delayBetweenPages: 800,
        zipFileName: '萝卜工坊_批量下载.zip',
        pdfFileName: '萝卜工坊_批量下载.pdf'
    };

    const originalCanvasData = new Map();

    // ===== 工具函数 =====
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function getCanvas() {
        return document.querySelector("#pic_canvas");
    }

    function getPageInfo() {
        const current = window.current_page_index !== undefined ? window.current_page_index : 0;
        const max = window.max_page_index !== undefined ? window.max_page_index : 0;
        return { current, max, total: max + 1 };
    }

    // ===== 图像处理函数 =====
    function saveOriginalData(canvas) {
        const pageIndex = window.current_page_index || 0;
        if (!originalCanvasData.has(pageIndex)) {
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            originalCanvasData.set(pageIndex, ctx.getImageData(0, 0, canvas.width, canvas.height));
        }
    }

    function applyExposure(canvas, evValue) {
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const scale = Math.pow(2, evValue);

        for (let i = 0; i < data.length; i += 4) {
            data[i]     = Math.min(data[i]     * scale, 255);
            data[i + 1] = Math.min(data[i + 1] * scale, 255);
            data[i + 2] = Math.min(data[i + 2] * scale, 255);
        }

        ctx.putImageData(imgData, 0, 0);
        return canvas;
    }

    function removeWatermark(canvas) {
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const { r: tr, g: tg, b: tb } = CONFIG.watermarkColor;
        const tol = CONFIG.tolerance;

        for (let i = 0; i < data.length; i += 4) {
            let r = data[i], g = data[i+1], b = data[i+2];

            if (Math.abs(r-tr)<=tol && Math.abs(g-tg)<=tol && Math.abs(b-tb)<=tol) {
                data[i]     = Math.min(r + 100, 255);
                data[i + 1] = Math.min(g + 100, 255);
                data[i + 2] = Math.min(b + 100, 255);
            }
        }

        ctx.putImageData(imgData, 0, 0);
        return canvas;
    }

    function restoreOriginal(canvas) {
        const pageIndex = window.current_page_index || 0;
        const originalData = originalCanvasData.get(pageIndex);
        if (originalData) {
            const ctx = canvas.getContext("2d");
            ctx.putImageData(originalData, 0, 0);
            return true;
        }
        return false;
    }

    function getContentBounds(canvas) {
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const width = canvas.width;
        const height = canvas.height;
        
        const alphaThreshold = 250;
        
        let minX = width, minY = height, maxX = 0, maxY = 0;
        let found = false;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4 + 3;
                const alpha = data[idx];
                
                if (alpha >= alphaThreshold) {
                    found = true;
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }
            }
        }
        
        if (!found) return null;
        
        minX += 2;
        maxX -= 2;
        minY += 2;
        maxY -= 2;
        
        if (minX > maxX) { minX = maxX = (minX + maxX) / 2; }
        if (minY > maxY) { minY = maxY = (minY + maxY) / 2; }
        
        const bounds = {
            x: minX,
            y: minY,
            width: maxX - minX + 1,
            height: maxY - minY + 1
        };
        
        console.log(`[精确裁剪] 边界: (${minX}, ${minY}) -> (${maxX}, ${maxY}), 尺寸: ${bounds.width}x${bounds.height}`);
        return bounds;
    }

    function cropCanvas(canvas, bounds) {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = bounds.width;
        tempCanvas.height = bounds.height;
        const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });
        tempCtx.drawImage(canvas, bounds.x, bounds.y, bounds.width, bounds.height, 0, 0, bounds.width, bounds.height);
        return tempCanvas;
    }

    // ===== 单页功能 =====
    function previewWatermarkRemoval() {
        const canvas = getCanvas();
        if (!canvas) {
            alert("未检测到画布，请确保已进入预览模式");
            return;
        }
        saveOriginalData(canvas);
        removeWatermark(canvas);
        showToast("已去除水印预览，切换页面或点击刷新可恢复原样", 3000);
    }

    function previewWithExposure(evValue) {
        const canvas = getCanvas();
        if (!canvas) return;
        saveOriginalData(canvas);
        restoreOriginal(canvas);
        if (evValue !== 0) applyExposure(canvas, evValue);
        removeWatermark(canvas);
        showToast(`预览效果：曝光 ${evValue > 0 ? '+' : ''}${evValue}`, 2000);
    }

    function downloadCurrentPage() {
        const canvas = getCanvas();
        if (!canvas) {
            alert("未检测到画布");
            return;
        }
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const ctx = tempCanvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(canvas, 0, 0);

        removeWatermark(tempCanvas);
        const bounds = getContentBounds(tempCanvas);
        const finalCanvas = bounds ? cropCanvas(tempCanvas, bounds) : tempCanvas;
        
        const url = finalCanvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url;
        a.download = `萝卜工坊_第${(window.current_page_index || 0) + 1}页_${Date.now()}.png`;
        a.click();
        showToast("当前页已下载（智能裁剪）");
    }

    // ===== Toast 提示 =====
    function showToast(message, duration = 3000) {
        const existing = document.getElementById('watermark-toast');
        if (existing) existing.remove();
        
        const toast = document.createElement("div");
        toast.id = 'watermark-toast';
        toast.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 14px;
            z-index: 1000000;
            animation: fadeIn 0.3s;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        toast.innerHTML = `${ICONS.checkCircle} ${message}`;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.5s';
            setTimeout(() => toast.remove(), 500);
        }, duration);
    }

    // ===== 批量处理逻辑 =====
    async function waitForPageLoad(targetIndex) {
        if (window.current_page_index === targetIndex && window.work_img_src) {
            await sleep(300);
            return true;
        }

        let attempts = 0;
        const maxAttempts = 30;
        
        while (attempts < maxAttempts) {
            const modal = document.getElementById('loading_show_modal_div');
            const isModalHidden = !modal || modal.classList.contains('d-none') || modal.style.display === 'none';
            const indexMatch = window.current_page_index === targetIndex;
            const hasImage = window.work_img_src && window.work_img_src.length > 0;
            
            if (isModalHidden && indexMatch && hasImage) {
                await sleep(400);
                return true;
            }
            await sleep(100);
            attempts++;
        }
        return false;
    }

    async function switchToPage(pageIndex) {
        const currentIndex = window.current_page_index || 0;
        if (currentIndex === pageIndex) {
            await sleep(200);
            return getCanvas();
        }
        
        const targetPage = pageIndex + 1;
        if (typeof window.switch_page === 'function') {
            window.switch_page(targetPage);
        } else {
            const pageBtn = document.querySelector(`#data_pagination_ul li a[onclick="switch_page(${targetPage})"]`) || 
                           document.querySelector(`#data_pagination_ul li:nth-child(${targetPage}) a`);
            if (pageBtn) pageBtn.click();
        }
        
        await waitForPageLoad(pageIndex);
        return getCanvas();
    }

    async function batchProcessAllPages(exposureValue = 0, onProgress = () => {}) {
        const { total, current: originalPage } = getPageInfo();
        const processedImages = [];
        
        console.log(`[批量处理] 共 ${total} 页`);
        onProgress(0, total, "准备开始...");
        
        for (let i = 0; i < total; i++) {
            try {
                onProgress(i + 1, total, `正在处理第 ${i + 1}/${total} 页...`);
                
                const canvas = await switchToPage(i);
                if (!canvas || canvas.width === 0) {
                    console.error(`[批量处理] 第 ${i+1} 页画布无效，跳过`);
                    continue;
                }
                
                const tempCanvas = document.createElement("canvas");
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                const ctx = tempCanvas.getContext("2d", { willReadFrequently: true });
                ctx.drawImage(canvas, 0, 0);

                removeWatermark(tempCanvas);
                if (exposureValue !== 0) applyExposure(tempCanvas, exposureValue);
                
                const bounds = getContentBounds(tempCanvas);
                const finalCanvas = bounds ? cropCanvas(tempCanvas, bounds) : tempCanvas;
                
                const blob = await new Promise((resolve) => {
                    finalCanvas.toBlob(resolve, "image/png");
                });
                
                processedImages.push({
                    page: i + 1,
                    blob: blob,
                    filename: `第${i + 1}页.png`,
                    width: finalCanvas.width,
                    height: finalCanvas.height
                });
                
                if (i < total - 1) await sleep(CONFIG.delayBetweenPages);
                
            } catch (err) {
                console.error(`[批量处理] 第 ${i+1} 页失败:`, err);
            }
        }
        
        if (originalPage !== window.current_page_index) {
            try {
                if (typeof window.switch_page === 'function') {
                    window.switch_page(originalPage + 1);
                    await waitForPageLoad(originalPage);
                }
            } catch (e) {
                console.warn("恢复原始页面失败:", e);
            }
        }
        
        return processedImages;
    }

    async function downloadAsZip(images) {
        const zip = new JSZip();
        const folder = zip.folder("萝卜工坊批量下载");
        images.forEach(img => folder.file(img.filename, img.blob));
        
        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = CONFIG.zipFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ===== PDF生成功能 =====
    async function generatePDF(images, onProgress = () => {}) {
        const { jsPDF } = window.jspdf;
        
        const firstImg = images[0];
        const isLandscape = firstImg && firstImg.width > firstImg.height;
        
        const pdf = new jsPDF({
            orientation: isLandscape ? 'landscape' : 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 5;

        for (let i = 0; i < images.length; i++) {
            onProgress(i + 1, images.length, `正在生成PDF...第${i + 1}/${images.length}页`);
            
            const img = images[i];
            const imgData = await blobToBase64(img.blob);
            
            const availableWidth = pageWidth - 2 * margin;
            const availableHeight = pageHeight - 2 * margin;
            
            const imgRatio = img.width / img.height;
            const pageRatio = availableWidth / availableHeight;
            
            let finalWidth, finalHeight;
            if (imgRatio > pageRatio) {
                finalWidth = availableWidth;
                finalHeight = availableWidth / imgRatio;
            } else {
                finalHeight = availableHeight;
                finalWidth = availableHeight * imgRatio;
            }
            
            const x = margin + (availableWidth - finalWidth) / 2;
            const y = margin + (availableHeight - finalHeight) / 2;
            
            pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
            
            if (i < images.length - 1) {
                pdf.addPage();
            }
        }
        
        pdf.save(CONFIG.pdfFileName);
        return true;
    }

    function blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    // ===== UI 创建 =====
    function createUI() {
        const originalBtnDiv = document.getElementById('download_button_div');
        if (originalBtnDiv) {
            originalBtnDiv.style.display = 'none';
        }

        const container = document.createElement("div");
        container.id = "batch-watermark-container";
        container.style.cssText = `
            position: absolute;
            top: 16px;
            right: 16px;
            z-index: 107;
            display: flex;
            flex-direction: column;
            gap: 8px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            width: 220px;
        `;

        const operationDiv = document.getElementById('operation_part_div') || document.body;
        operationDiv.appendChild(container);

        // 第一行：除水印预览 + 下载当前页
        const row1 = document.createElement("div");
        row1.style.cssText = `
            display: flex;
            gap: 8px;
            width: 100%;
        `;

        const previewBtn = document.createElement("button");
        previewBtn.innerHTML = `${ICONS.eye} 除水印预览`;
        previewBtn.title = "预览去水印效果（当前页）";
        previewBtn.style.cssText = `
            flex: 1;
            padding: 8px 0;
            background: linear-gradient(135deg, #187bff, #0056cc);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
            box-shadow: 0 2px 6px rgba(24, 123, 255, 0.3);
            transition: transform 0.1s;
            white-space: nowrap;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        previewBtn.addEventListener("mouseenter", () => previewBtn.style.transform = "scale(1.02)");
        previewBtn.addEventListener("mouseleave", () => previewBtn.style.transform = "scale(1)");
        previewBtn.addEventListener("click", () => previewWatermarkRemoval());

        const downloadBtn = document.createElement("button");
        downloadBtn.innerHTML = `${ICONS.download} 下载当前页`;
        downloadBtn.title = "下载当前页（智能裁剪）";
        downloadBtn.style.cssText = `
            flex: 1;
            padding: 8px 0;
            background: linear-gradient(135deg, #28a745, #1e7e34);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
            box-shadow: 0 2px 6px rgba(40, 167, 69, 0.3);
            transition: transform 0.1s;
            white-space: nowrap;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        downloadBtn.addEventListener("mouseenter", () => downloadBtn.style.transform = "scale(1.02)");
        downloadBtn.addEventListener("mouseleave", () => downloadBtn.style.transform = "scale(1)");
        downloadBtn.addEventListener("click", () => downloadCurrentPage());

        row1.appendChild(previewBtn);
        row1.appendChild(downloadBtn);

        // 第二行：批量曝光调节
        const exposureWrap = document.createElement("div");
        exposureWrap.style.cssText = `
            padding: 10px;
            background: rgba(108, 117, 125, 0.95);
            color: white;
            border-radius: 6px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            display: flex;
            flex-direction: column;
            gap: 5px;
            width: 100%;
            box-sizing: border-box;
        `;
        
        const exposureLabel = document.createElement("div");
        exposureLabel.innerHTML = `${ICONS.camera} <b>批量曝光调节</b> <span style="font-size:11px;opacity:0.8">(影响批量下载)</span>`;
        exposureLabel.style.fontSize = "12px";
        
        const exposureInputWrap = document.createElement("div");
        exposureInputWrap.style.cssText = `
            display: flex;
            align-items: center;
            gap: 6px;
            width: 100%;
        `;
        
        const exposureInput = document.createElement("input");
        exposureInput.type = "range";
        exposureInput.min = -0.5;
        exposureInput.max = 0.5;
        exposureInput.step = 0.01;
        exposureInput.value = CONFIG.defaultExposure;
        exposureInput.style.cssText = `
            flex: 1;
            cursor: pointer;
            margin: 0;
        `;
        
        const exposureValue = document.createElement("span");
        exposureValue.textContent = "0";
        exposureValue.style.cssText = `
            min-width: 30px;
            font-size: 11px;
            text-align: center;
        `;
        
        const previewExpBtn = document.createElement("button");
        previewExpBtn.innerHTML = `${ICONS.play} 试看`;
        previewExpBtn.style.cssText = `
            padding: 2px 8px;
            font-size: 10px;
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        exposureInput.addEventListener("input", (e) => {
            const val = parseFloat(e.target.value);
            exposureValue.textContent = val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
        });
        
        previewExpBtn.addEventListener("click", () => {
            previewWithExposure(parseFloat(exposureInput.value));
        });
        
        exposureInputWrap.appendChild(exposureInput);
        exposureInputWrap.appendChild(exposureValue);
        exposureInputWrap.appendChild(previewExpBtn);
        exposureWrap.appendChild(exposureLabel);
        exposureWrap.appendChild(exposureInputWrap);

        // 第三行：批量下载按钮（ZIP）
        const batchBtn = document.createElement("button");
        batchBtn.innerHTML = `${ICONS.fileZipper} 批量下载 (ZIP)`;
        batchBtn.style.cssText = `
            width: 100%;
            padding: 10px 0;
            background: linear-gradient(135deg, #dc3545, #c82333);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: bold;
            box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);
            transition: all 0.2s;
            white-space: nowrap;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
        `;
        batchBtn.addEventListener("mouseenter", () => {
            batchBtn.style.transform = "scale(1.01)";
            batchBtn.style.boxShadow = "0 4px 12px rgba(220, 53, 69, 0.4)";
        });
        batchBtn.addEventListener("mouseleave", () => {
            batchBtn.style.transform = "scale(1)";
            batchBtn.style.boxShadow = "0 2px 8px rgba(220, 53, 69, 0.3)";
        });

        // 第四行：生成PDF按钮
        const pdfBtn = document.createElement("button");
        pdfBtn.innerHTML = `${ICONS.filePdf} 生成PDF文档`;
        pdfBtn.style.cssText = `
            width: 100%;
            padding: 10px 0;
            background: linear-gradient(135deg, #6f42c1, #5a32a3);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: bold;
            box-shadow: 0 2px 8px rgba(111, 66, 193, 0.3);
            transition: all 0.2s;
            white-space: nowrap;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
        `;
        pdfBtn.addEventListener("mouseenter", () => {
            pdfBtn.style.transform = "scale(1.01)";
            pdfBtn.style.boxShadow = "0 4px 12px rgba(111, 66, 193, 0.4)";
        });
        pdfBtn.addEventListener("mouseleave", () => {
            pdfBtn.style.transform = "scale(1)";
            pdfBtn.style.boxShadow = "0 2px 8px rgba(111, 66, 193, 0.3)";
        });

        // 进度面板
        const progressPanel = document.createElement("div");
        progressPanel.id = "batch-progress-panel";
        progressPanel.style.cssText = `
            padding: 10px;
            background: rgba(0,0,0,0.85);
            color: white;
            border-radius: 6px;
            font-size: 11px;
            display: none;
            flex-direction: column;
            gap: 5px;
            width: 100%;
            box-sizing: border-box;
        `;
        
        const progressText = document.createElement("div");
        progressText.id = "batch-progress-text";
        progressText.textContent = "准备中...";
        progressText.style.width = "100%";
        
        const progressBar = document.createElement("div");
        progressBar.style.cssText = `
            width: 100%;
            height: 4px;
            background: rgba(255,255,255,0.2);
            border-radius: 2px;
            overflow: hidden;
        `;
        
        const progressFill = document.createElement("div");
        progressFill.id = "batch-progress-fill";
        progressFill.style.cssText = `
            height: 100%;
            width: 0%;
            background: #28a745;
            transition: width 0.3s;
        `;
        
        progressBar.appendChild(progressFill);
        progressPanel.appendChild(progressText);
        progressPanel.appendChild(progressBar);

        // 组装UI
        container.appendChild(row1);
        container.appendChild(exposureWrap);
        container.appendChild(batchBtn);
        container.appendChild(pdfBtn);
        container.appendChild(progressPanel);

        // ZIP批量下载事件
        batchBtn.addEventListener("click", async () => {
            await startBatchProcess('zip', exposureInput, progressPanel, progressText, progressFill, batchBtn, pdfBtn);
        });

        // PDF生成事件
        pdfBtn.addEventListener("click", async () => {
            await startBatchProcess('pdf', exposureInput, progressPanel, progressText, progressFill, batchBtn, pdfBtn);
        });
    }

    // 抽取的批量处理函数
    async function startBatchProcess(mode, exposureInput, progressPanel, progressText, progressFill, batchBtn, pdfBtn) {
        const { total } = getPageInfo();
        if (total <= 0) {
            alert("未检测到页面，请确保已进入编辑模式且有分页");
            return;
        }
        
        const exposure = parseFloat(exposureInput.value);
        const modeText = mode === 'pdf' ? '生成PDF' : '打包ZIP';
        const confirmed = confirm(`即将批量处理 ${total} 页并${modeText}：\n• 自动去除水印\n• 应用曝光值: ${exposure > 0 ? '+' : ''}${exposure}\n• 智能裁剪空白边距\n\n预计耗时约 ${Math.ceil(total * 1.5)} 秒，是否继续？`);
        
        if (!confirmed) return;
        
        progressPanel.style.display = "flex";
        batchBtn.disabled = true;
        pdfBtn.disabled = true;
        batchBtn.style.opacity = "0.6";
        pdfBtn.style.opacity = "0.6";
        
        try {
            const images = await batchProcessAllPages(exposure, (current, total, msg) => {
                progressText.textContent = msg;
                progressFill.style.width = `${(current / total) * 100}%`;
            });
            
            if (images.length === 0) {
                alert("没有成功处理任何页面");
                return;
            }
            
            progressText.textContent = mode === 'pdf' ? `正在生成PDF，包含 ${images.length} 页...` : `正在打包 ${images.length} 张图片...`;
            
            if (mode === 'pdf') {
                await generatePDF(images, (current, total, msg) => {
                    progressText.textContent = msg;
                    progressFill.style.width = `${(current / total) * 100}%`;
                });
                showToast(`PDF生成完成！共 ${images.length} 页`);
            } else {
                if (typeof JSZip !== 'undefined') {
                    await downloadAsZip(images);
                    showToast(`批量下载完成！共 ${images.length} 页`);
                } else {
                    alert("ZIP 库加载失败，将逐个下载...");
                    for (let img of images) {
                        const url = URL.createObjectURL(img.blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = img.filename;
                        a.click();
                        URL.revokeObjectURL(url);
                        await sleep(200);
                    }
                }
            }
            
        } catch (err) {
            console.error(err);
            alert("批量处理出错: " + err.message);
        } finally {
            progressPanel.style.display = "none";
            batchBtn.disabled = false;
            pdfBtn.disabled = false;
            batchBtn.style.opacity = "1";
            pdfBtn.style.opacity = "1";
            progressFill.style.width = "0%";
        }
    }

    // ===== 初始化 =====
    function init() {
        if (!getCanvas()) {
            setTimeout(init, 1000);
            return;
        }
        createUI();
        console.log("[萝卜工坊批量去水印] v2.5.2 已加载");
    }

    // 添加CSS动画
    const style = document.createElement("style");
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
    `;
    document.head.appendChild(style);

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();