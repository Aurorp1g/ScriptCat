// ==UserScript==
// @name         超星学习通答案提取器
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  自动爬取页面中的题目、选项及正确答案，并导出为txt文件
// @author       You
// @match        *://*.chaoxing.com/*
// @match        *://*.fanya.chaoxing.com/*
// @match        *://*.edu.cn/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // 等待页面加载完成
    function init() {
        if (document.querySelector('.TiMu') || document.querySelector('.aiArea')) {
            createFloatingButton();
        } else {
            setTimeout(init, 1000);
        }
    }

    // 创建浮动导出按钮 (使用 Inline SVG 避免 CSP 问题)
    function createFloatingButton() {
        const btn = document.createElement('div');
        btn.id = 'extract-answer-btn';
        btn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span style="margin-left: 5px; color: white; font-size: 14px;">导出答案</span>
        `;
        
        // 样式设置
        btn.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            z-index: 99999;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 12px 20px;
            border-radius: 25px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-weight: 500;
            transition: all 0.3s ease;
            user-select: none;
        `;

        // 悬停效果
        btn.onmouseenter = () => {
            btn.style.transform = 'scale(1.05)';
            btn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
        };
        btn.onmouseleave = () => {
            btn.style.transform = 'scale(1)';
            btn.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
        };

        btn.onclick = extractAllAnswers;
        document.body.appendChild(btn);
        
        console.log('[答案提取器] 按钮已创建');
    }

    // 清理 HTML 文本
    function cleanText(html) {
        if (!html) return '';
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        let text = tmp.textContent || tmp.innerText || '';
        // 清理多余空格和换行
        return text.replace(/\s+/g, ' ').trim();
    }

    // 提取所有题目
    function extractAllAnswers() {
        const questions = [];
        
        // 选择所有题目容器 (支持两种常见结构)
        const questionElements = document.querySelectorAll('.TiMu.newTiMu, .aiArea .TiMu');
        
        if (questionElements.length === 0) {
            alert('未找到题目，请确保页面已完全加载！');
            return;
        }

        questionElements.forEach((qEl, index) => {
            try {
                const qData = extractSingleQuestion(qEl, index + 1);
                if (qData) questions.push(qData);
            } catch (e) {
                console.error(`提取第 ${index + 1} 题失败:`, e);
            }
        });

        if (questions.length === 0) {
            alert('未提取到有效题目数据！');
            return;
        }

        // 生成并下载文件
        const content = formatContent(questions);
        downloadFile(content, `超星答案_${new Date().toLocaleDateString()}.txt`);
        
        // 显示成功提示
        showNotification(`成功导出 ${questions.length} 道题目！`);
    }

    // 提取单道题目
    function extractSingleQuestion(element, index) {
        // 1. 题号
        const numEl = element.querySelector('.Zy_TItle i.fl');
        const number = numEl ? cleanText(numEl.innerText) : index;

        // 2. 题型 (单选题/多选题/判断题等)
        const typeEl = element.querySelector('.newZy_TItle');
        const type = typeEl ? cleanText(typeEl.innerText).replace(/[【】]/g, '') : '未知题型';

        // 3. 题目内容 (可能在 .qtContent 或 .fontLabel 中)
        let questionText = '';
        const contentEl = element.querySelector('.qtContent, .Zy_TItle .fontLabel');
        if (contentEl) {
            // 移除题型标签，只保留题目内容
            const clone = contentEl.cloneNode(true);
            const typeSpan = clone.querySelector('.newZy_TItle');
            if (typeSpan) typeSpan.remove();
            questionText = cleanText(clone.innerHTML);
        }

        // 4. 提取选项
        const options = [];
        const optionEls = element.querySelectorAll('.Zy_ulTop.qtDetail li, .Zy_ulTop li');
        optionEls.forEach(li => {
            const keyEl = li.querySelector('i.fl'); // A、B、C、D
            const valEl = li.querySelector('a.fl p, a.fl'); // 选项内容
            
            if (keyEl) {
                const key = cleanText(keyEl.innerText).replace(/、/g, '').trim();
                const value = valEl ? cleanText(valEl.innerText) : '';
                options.push({ key, value });
            }
        });

        // 5. 正确答案
        let correctAnswer = '';
        const correctBx = element.querySelector('.correctAnswerBx');
        if (correctBx) {
            // 标准格式：答案在 .answerCon 中
            const answerCon = correctBx.querySelector('.answerCon');
            if (answerCon) {
                correctAnswer = cleanText(answerCon.innerText);
            } else {
                // 填空题格式：答案在 .correctAnswer div 中（跳过带 answerFont 的标题行）
                const answerDivs = correctBx.querySelectorAll('.correctAnswer');
                const blanks = [];
                answerDivs.forEach(div => {
                    // 跳过包含"正确答案："标签的标题行
                    if (!div.querySelector('.answerFont')) {
                        const text = cleanText(div.innerText);
                        if (text) blanks.push(text);
                    }
                });
                correctAnswer = blanks.join('；');
            }
        }

        // 6. 我的答案 (可选)
        let myAnswer = '';
        const myAnswerEl = element.querySelector('.myAnswer .answerCon');
        if (myAnswerEl) {
            myAnswer = cleanText(myAnswerEl.innerText);
        } else {
            // 填空题格式：我的答案在 .myAllAnswerBx 下的 .myAnswer div 中
            const myAllBx = element.querySelector('.myAllAnswerBx');
            if (myAllBx) {
                const myAnswerDivs = myAllBx.querySelectorAll('.myAnswer');
                const blanks = [];
                myAnswerDivs.forEach(div => {
                    const text = cleanText(div.innerText);
                    if (text) blanks.push(text);
                });
                myAnswer = blanks.join('；');
            }
        }

        // 7. 解析 (如果有)
        let analysis = '';
        const analysisEl = element.querySelector('.analysisDiv, .analysis');
        if (analysisEl) {
            analysis = cleanText(analysisEl.innerText);
        }

        // 8. 判断是否做错
        let isWrong = false;
        if (element.querySelector('.marking_cuo')) {
            // 有明确错误标记
            isWrong = true;
        } else if (!element.querySelector('.marking_dui')) {
            // 没有对错标记时，通过得分判断
            const scoreEl = element.querySelector('.newAnswerScore .scoreNum');
            if (scoreEl) {
                const score = parseFloat(scoreEl.textContent);
                if (isNaN(score) || score <= 0) {
                    isWrong = true;
                }
            }
            // 得分也无法判断时，对比我的答案和正确答案
            if (!isWrong && myAnswer && correctAnswer) {
                const normalize = (s) => s.replace(/第[一二三四五六七八九十\d]+空[：:]\s*/g, '').replace(/\s+/g, '').toLowerCase();
                if (normalize(myAnswer) !== normalize(correctAnswer)) {
                    isWrong = true;
                }
            }
        }

        return {
            number,
            type,
            question: questionText,
            options,
            correctAnswer,
            myAnswer,
            analysis,
            isWrong
        };
    }

    // 格式化内容为 TXT
    function formatContent(questions) {
        const lines = [];
        const timestamp = new Date().toLocaleString('zh-CN');
        const wrongCount = questions.filter(q => q.isWrong).length;

        lines.push('=====================================');
        lines.push('    超星学习通 - 题目与答案导出');
        lines.push(`    导出时间：${timestamp}`);
        lines.push(`    题目数量：${questions.length} 道`);
        if (wrongCount > 0) {
            lines.push(`    错题数量：${wrongCount} 道`);
        }
        lines.push('=====================================');
        lines.push('');

        questions.forEach((q, idx) => {
            const wrongTag = q.isWrong ? ' [❌ 错题]' : '';
            lines.push(`【第 ${q.number} 题】[${q.type}]${wrongTag}`);
            lines.push(`题目：${q.question}`);
            lines.push('');

            // 选项
            if (q.options.length > 0) {
                q.options.forEach(opt => {
                    lines.push(`    ${opt.key}. ${opt.value}`);
                });
                lines.push('');
            }

            // 我的答案（错题时特别标注）
            if (q.isWrong && q.myAnswer) {
                lines.push(`【我的答案】${q.myAnswer}  ✗`);
            }

            // 答案
            if (q.correctAnswer) {
                lines.push(`【正确答案】${q.correctAnswer}`);
            } else {
                lines.push(`【正确答案】未显示`);
            }

            if (q.analysis) {
                lines.push(`【解析】${q.analysis}`);
            }

            lines.push('-------------------------------------');
            lines.push('');
        });

        lines.push('');
        lines.push('=====================================');
        if (wrongCount > 0) {
            lines.push(`错题汇总：共 ${wrongCount} 道错题`);
            questions.filter(q => q.isWrong).forEach(q => {
                lines.push(`  - 第${q.number}题 [${q.type}]`);
            });
        } else {
            lines.push('全部正确！');
        }
        lines.push('导出完成');
        lines.push('=====================================');

        return lines.join('\n');
    }

    // 下载文件
    function downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    // 显示通知 (替代 alert)
    function showNotification(message) {
        const notif = document.createElement('div');
        notif.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="margin-right: 8px;">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>${message}</span>
        `;
        notif.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(46, 204, 113, 0.95);
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 16px;
            font-weight: 500;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            z-index: 100000;
            display: flex;
            align-items: center;
            animation: fadeInOut 3s ease;
        `;
        
        // 添加动画样式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                15% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                85% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 3000);
    }

    // 启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // 对于动态加载的页面，定期检查
    setInterval(() => {
        if (!document.getElementById('extract-answer-btn')) {
            init();
        }
    }, 3000);
})();