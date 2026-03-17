// ==UserScript==
// @name               beautifulcarrot-watermark-remover
// @name:zh-CN         萝卜工坊去水印
// @namespace          https://github.com/scriptscat
// @version            1.1.0
// @description        Remove watermark, adjust exposure, and auto-crop blank areas for beautifulcarrot.com canvas
// @description:zh-CN  萝卜工坊去水印工具，支持曝光调节、Canvas下载和智能裁剪
// @author             Aurorp1g
// @match              https://beautifulcarrot.com/v2/*
// @icon               https://cdn.beautifulcarrot.com/static/img/logosmall.png
// @grant              none
// @run-at             document-end
// @license            MIT
// ==/UserScript==

(function () {
    'use strict';

    // ===== 工具函数 =====
    function makeDraggable(el) {
        let ox = 0, oy = 0, down = false;
        el.style.position = "fixed";
        // 如需启用拖拽，取消下方注释
        /*
        el.style.cursor = "move";
        el.addEventListener("mousedown", e => {
            down = true;
            ox = e.clientX - el.offsetLeft;
            oy = e.clientY - el.offsetTop;
        });
        document.addEventListener("mousemove", e => {
            if (!down) return;
            el.style.left = (e.clientX - ox) + "px";
            el.style.top = (e.clientY - oy) + "px";
        });
        document.addEventListener("mouseup", () => { down = false; });
        */
    }

    // ===== 找画布 =====
    function getCanvas() {
        return document.querySelector("#pic_canvas");
    }

    // ===== 曝光处理 =====
    function applyExposure(evValue) {
        const canvas = getCanvas();
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // EV 曝光转换：EV=1 大约亮度 *2；EV=-1 大约亮度 *0.5
        const scale = Math.pow(2, evValue);

        for (let i = 0; i < data.length; i += 4) {
            data[i]     = Math.min(data[i]     * scale, 255);
            data[i + 1] = Math.min(data[i + 1] * scale, 255);
            data[i + 2] = Math.min(data[i + 2] * scale, 255);
        }

        ctx.putImageData(imgData, 0, 0);
    }

    // ===== 去水印（亮色提亮） =====
    function removeWatermark() {
        const canvas = getCanvas();
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        const target = { r: 0xE7, g: 0xE7, b: 0xE7 }; // 浅灰色水印特征值
        const tol = 33; // 容差

        for (let i = 0; i < data.length; i += 4) {
            let r = data[i], g = data[i+1], b = data[i+2];

            if (Math.abs(r-target.r)<=tol && Math.abs(g-target.g)<=tol && Math.abs(b-target.b)<=tol) {
                data[i]     = Math.min(r + 100, 255);
                data[i + 1] = Math.min(g + 100, 255);
                data[i + 2] = Math.min(b + 100, 255);
            }
        }

        ctx.putImageData(imgData, 0, 0);
    }

    // ===== 检测内容边界 =====
    function getContentBounds(canvas, ctx) {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const width = canvas.width;
        const height = canvas.height;
        
        let minX = width, minY = height, maxX = 0, maxY = 0;
        let hasContent = false;
        
        // 扫描所有像素，查找非空白区域
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
                
                // 判断是否为"有内容"：不透明且不是纯白/浅灰背景
                // 阈值：alpha > 20，且RGB不全是接近255的值
                const isWhite = r > 245 && g > 245 && b > 245;
                const isTransparent = a < 20;
                
                if (!isTransparent && !isWhite) {
                    if (!hasContent) {
                        minX = maxX = x;
                        minY = maxY = y;
                        hasContent = true;
                    } else {
                        minX = Math.min(minX, x);
                        maxX = Math.max(maxX, x);
                        minY = Math.min(minY, y);
                        maxY = Math.max(maxY, y);
                    }
                }
            }
        }
        
        if (!hasContent) return null;
        
        // 添加20px边距，但不超过画布边界
        const padding = 20;
        return {
            x: Math.max(0, minX - padding),
            y: Math.max(0, minY - padding),
            width: Math.min(width - minX, maxX - minX + 1) + Math.min(padding * 2, minX + (width - maxX - 1)),
            height: Math.min(height - minY, maxY - minY + 1) + Math.min(padding * 2, minY + (height - maxY - 1))
        };
    }

    // ===== 下载函数（智能裁剪版） =====
    function downloadCanvas() {
        const canvas = getCanvas();
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        const bounds = getContentBounds(canvas, ctx);
        
        if (!bounds) {
            alert("未检测到可下载的内容");
            return;
        }

        // 创建临时canvas进行裁剪
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = bounds.width;
        tempCanvas.height = bounds.height;
        const tempCtx = tempCanvas.getContext("2d");

        // 将原画布指定区域绘制到新canvas
        tempCtx.drawImage(
            canvas, 
            bounds.x, bounds.y, bounds.width, bounds.height,  // 源区域
            0, 0, bounds.width, bounds.height                 // 目标区域
        );

        // 下载裁剪后的图片
        const url = tempCanvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url;
        a.download = "萝卜工坊_去水印_" + new Date().getTime() + ".png";
        a.click();
        
        console.log(`[去水印] 裁剪区域: x=${bounds.x}, y=${bounds.y}, w=${bounds.width}, h=${bounds.height}`);
    }

    // ===== 创建按钮 =====
    function createButton(text, left, top, onClick) {
        const btn = document.createElement("div");
        btn.textContent = text;
        btn.style.cssText = `
            position: fixed;
            left: ${left}px;
            top: ${top}px;
            padding: 8px 16px;
            background: linear-gradient(135deg, #187bff, #0056cc);
            color: white;
            border-radius: 6px;
            z-index: 999999;
            user-select: none;
            font-size: 14px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            box-shadow: 0 2px 8px rgba(24, 123, 255, 0.3);
            cursor: pointer;
            transition: transform 0.1s, box-shadow 0.1s;
        `;
        
        // 点击效果
        btn.addEventListener("mousedown", () => {
            btn.style.transform = "scale(0.95)";
            btn.style.boxShadow = "0 1px 4px rgba(24, 123, 255, 0.3)";
        });
        btn.addEventListener("mouseup", () => {
            btn.style.transform = "scale(1)";
            btn.style.boxShadow = "0 2px 8px rgba(24, 123, 255, 0.3)";
        });

        btn.addEventListener("click", e => {
            e.stopPropagation();
            onClick();
        });

        document.body.appendChild(btn);
        makeDraggable(btn);
        return btn;
    }

    // ===== 创建滑条控件 =====
    function createExposureSlider(left, top) {
        const wrap = document.createElement("div");
        wrap.style.cssText = `
            position: fixed;
            left: ${left}px;
            top: ${top}px;
            padding: 8px 12px;
            background: linear-gradient(135deg, #187bff, #0056cc);
            color: white;
            border-radius: 6px;
            z-index: 999999;
            user-select: none;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            box-shadow: 0 2px 8px rgba(24, 123, 255, 0.3);
            display: flex;
            align-items: center;
            gap: 8px;
        `;

        const label = document.createElement("span");
        label.textContent = "曝光";
        label.style.fontSize = "14px";
        wrap.appendChild(label);

        const input = document.createElement("input");
        input.type = "range";
        input.min = -0.5;
        input.max = 0.5;
        input.step = 0.01;
        input.value = 0;
        input.style.cssText = `
            vertical-align: middle;
            width: 100px;
            cursor: pointer;
        `;
        
        const valueDisplay = document.createElement("span");
        valueDisplay.textContent = "0";
        valueDisplay.style.fontSize = "12px";
        valueDisplay.style.minWidth = "32px";
        valueDisplay.style.textAlign = "right";

        input.addEventListener("input", () => {
            const val = Number(input.value);
            valueDisplay.textContent = val.toFixed(2);
            applyExposure(val);
        });

        wrap.appendChild(input);
        wrap.appendChild(valueDisplay);
        document.body.appendChild(wrap);
        makeDraggable(wrap);
    }

    // ===== 初始化 =====
    function init() {
        // 等待画布加载完成
        if (!getCanvas()) {
            setTimeout(init, 500);
            return;
        }
        
        console.log("[萝卜工坊去水印] 脚本已加载（含智能裁剪）");
        
        // 创建控制按钮
        createButton("去水印", 20, 20, removeWatermark);
        createButton("下载图片", 100, 20, downloadCanvas);
        createExposureSlider(200, 20);
    }

    // 页面加载完成后执行
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();