// ---------------------------------------------------------
// 0. นำเข้าเครื่องมือลับจาก SillyTavern
// ---------------------------------------------------------
import { saveSettingsDebounced } from "../../../../script.js";
import { extension_settings } from "../../../extensions.js";

const EXTENSION_NAME = "BabyFontManager";

jQuery(document).ready(function () {
    // ---------------------------------------------------------
    // 1. ระบบฐานข้อมูล IndexedDB (ทนทาน จุเยอะ ไม่หน่วงเครื่อง!)
    // ---------------------------------------------------------
    const dbName = "BabyFontDB";
    const storeName = "fonts";

    // เปิด/สร้างฐานข้อมูล
    function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, 1);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: 'name' });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // บันทึกฟอนต์ลง DB
    async function saveFontToDB(fontObj) {
        const db = await initDB();
        return new Promise((resolve) => {
            const tx = db.transaction(storeName, 'readwrite');
            tx.objectStore(storeName).put(fontObj);
            tx.oncomplete = () => resolve();
        });
    }

    // โหลดฟอนต์ทั้งหมดจาก DB
    async function loadFontsFromDB() {
        const db = await initDB();
        return new Promise((resolve) => {
            const tx = db.transaction(storeName, 'readonly');
            const request = tx.objectStore(storeName).getAll();
            request.onsuccess = () => resolve(request.result || []);
        });
    }

    // ลบฟอนต์จาก DB
    async function deleteFontFromDB(fontName) {
        const db = await initDB();
        return new Promise((resolve) => {
            const tx = db.transaction(storeName, 'readwrite');
            tx.objectStore(storeName).delete(fontName);
            tx.oncomplete = () => resolve();
        });
    }

    // ---------------------------------------------------------
    // 2. เริ่มต้นระบบ (Async Initialization)
    // ---------------------------------------------------------
    (async function startBabyFontSystem() {
        // ดึงฟอนต์จาก IndexedDB
        let savedFontsList = await loadFontsFromDB();

        // ดึงแค่ "การตั้งค่า" จาก SillyTavern (ไม่เอาไฟล์ฟอนต์ไปหนัก Server แล้ว!)
        let settings = extension_settings[EXTENSION_NAME] || {};
        let myData = {
            currentFont: settings.currentFont || null,
            btnPos: settings.btnPos || { top: "5vh", right: "20px" },
            isFloatingHidden: settings.isFloatingHidden || false
        };

        // ฟังก์ชันเซฟเฉพาะการตั้งค่าเล็กๆ ไปที่ Server
        function saveMetadata() {
            extension_settings[EXTENSION_NAME] = myData;
            saveSettingsDebounced();
        }

        // ---------------------------------------------------------
        // 3. ฟังก์ชันจัดการฟอนต์ (Core Logic)
        // ---------------------------------------------------------
        function injectFont(name, dataUrl) {
            const styleId = `font-style-${name.replace(/\s+/g, '-')}`;
            if (!document.getElementById(styleId)) {
                const style = document.createElement('style');
                style.id = styleId;
                style.textContent = `@font-face { font-family: '${name}'; src: url('${dataUrl}'); font-weight: normal; font-style: normal; font-display: swap; }`;
                document.head.appendChild(style);
            }
        }

        window.applyBabyFont = (name) => {
            jQuery('#baby-custom-font-style').remove();

            if (!name) {
                 myData.currentFont = null;
                 saveMetadata();
                 return;
            }

            // 🛡️ โคตรไม้ตาย: บังคับทับทุกกฎของ SillyTavern
            const forceStyle = jQuery('<style id="baby-custom-font-style"></style>');
            forceStyle.text(`
                html:root, body#bg_all { --main-font-family: '${name}', sans-serif !important; }
                html body, html body .mes_text, html body textarea, html body .text_pole, html body .ch_name, html body .mes_block { font-family: '${name}', sans-serif !important; }
            `);
            jQuery('body').append(forceStyle);

            myData.currentFont = name;
            saveMetadata();
            toastr.success(`เปลี่ยนฟอนต์เป็น ${name} แล้วค่ะ! 🎀`, "Baby Font Manager");
        };

        window.deleteBabyFont = async (fontName) => {
            if(confirm(`จะลบฟอนต์ ${fontName} จริงๆ เหรอคะ? 🥺`)) {
                await deleteFontFromDB(fontName); // ลบจาก DB
                savedFontsList = savedFontsList.filter(f => f.name !== fontName); // ลบจาก Array
                if (myData.currentFont === fontName) {
                    window.applyBabyFont(null); // ถอดฟอนต์ออกถ้ากำลังใช้อยู่
                }
                updateFontList();
            }
        };

        function updateFontList() {
            const list = jQuery('#baby-font-list');
            list.empty();
            if (savedFontsList.length === 0) {
                list.append('<div style="text-align:center; color:#888; font-style:italic; padding:10px;">ยังไม่มีฟอนต์เลยจ้า</div>');
            } else {
                savedFontsList.forEach((font) => {
                    const item = jQuery(`
                        <div class="font-list-item" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                            <span class="font-preview" style="font-family:'${font.name}'; color: white; font-size: 1.1em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60%;">${font.name}</span>
                            <div style="display:flex; gap:5px;">
                                <button style="background:#ff99b5; border:none; color:white; padding:6px 12px; border-radius:15px; cursor:pointer; font-size:0.8em;" onclick="window.applyBabyFont('${font.name}')">ใช้</button>
                                <button style="background:rgba(255, 77, 77, 0.2); border:1px solid #ff4d4d; color:#ff4d4d; padding:6px 12px; border-radius:15px; cursor:pointer; font-size:0.8em;" onclick="window.deleteBabyFont('${font.name}')">ลบ</button>
                            </div>
                        </div>
                    `);
                    list.append(item);
                });
            }
        }

        // ฝังฟอนต์ทั้งหมดลงหน้าเว็บ
        savedFontsList.forEach(font => injectFont(font.name, font.data));

        // ถ้ามีฟอนต์ที่เลือกไว้ ให้ใช้งานเลยแบบเงียบๆ
        if (myData.currentFont) {
            setTimeout(() => {
                const forceStyle = jQuery('<style id="baby-custom-font-style"></style>');
                forceStyle.text(`
                    html:root, body#bg_all { --main-font-family: '${myData.currentFont}', sans-serif !important; }
                    html body, html body .mes_text, html body textarea, html body .text_pole, html body .ch_name, html body .mes_block { font-family: '${myData.currentFont}', sans-serif !important; }
                `);
                jQuery('body').append(forceStyle);
            }, 800);
        }

        // ---------------------------------------------------------
        // 4. สร้างหน้าตา UI (User Interface)
        // ---------------------------------------------------------
        const customStyle = `
            <style>
                .baby-file-label { display: block; width: 100%; padding: 15px; background: rgba(255, 153, 181, 0.2); border: 1px dashed #ff99b5; border-radius: 8px; text-align: center; color: #ffb7c5; cursor: pointer; transition: all 0.3s ease; margin-top: 5px; font-size: 0.9em; }
                .baby-file-label:hover { background: rgba(255, 153, 181, 0.4); color: white; border-style: solid; }
                .baby-btn-pink { background: linear-gradient(45deg, #ff99b5, #ff5e7e); color: white; border: none; padding: 10px 15px; border-radius: 20px; cursor: pointer; width: 100%; box-shadow: 0 2px 5px rgba(255, 94, 126, 0.4); font-size: 1em; margin-top: 15px; }
                #baby-font-upload { display: none; }
            </style>
        `;
        if (jQuery('#baby-custom-style-tag').length === 0) jQuery('head').append(`<div id="baby-custom-style-tag">${customStyle}</div>`);

        const modalHtml = `
            <div id="baby-font-manager-modal" class="baby-font-modal" style="display:none; position: fixed; top: 5vh; left: 0; right: 0; margin: auto; z-index: 9999; overflow-y: auto; background: rgba(20, 20, 20, 0.95); border: 2px solid #ff99b5; border-radius: 15px; padding: 20px; box-shadow: 0 0 20px rgba(255, 153, 181, 0.3); backdrop-filter: blur(10px); width: 90vw; max-width: 400px; max-height: 85vh;">
                <div id="baby-modal-header" style="cursor: grab; padding-bottom: 10px; margin-bottom: 10px; border-bottom: 1px solid rgba(255,153,181,0.3); touch-action: none;">
                    <h3 style="color:#ff99b5; text-align:center; margin:0; pointer-events: none;">🎀 คลังฟอนต์ (IndexedDB) 🎀</h3>
                    <div style="text-align:center; font-size: 0.8em; color: #888;">(ลากหัวข้อเพื่อย้าย)</div>
                </div>
                <div style="margin-bottom: 15px;">
                    <label for="baby-font-upload" class="baby-file-label">📂 จิ้มเลือกไฟล์ฟอนต์</label>
                    <input type="file" id="baby-font-upload" accept=".ttf,.otf">
                    <div id="file-name-display" style="color: #ff99b5; font-size: 0.9em; margin-top: 5px; text-align: center; min-height: 1.2em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"></div>
                    <input type="text" id="baby-font-name" placeholder="ตั้งชื่อฟอนต์..." style="width:100%; margin-top:10px; background:rgba(255,255,255,0.1); color:white; border:1px solid #555; padding:10px; border-radius: 5px; outline: none;">
                    <button id="baby-save-btn" class="baby-btn-pink">บันทึกฟอนต์ ✨</button>
                </div>
                <div style="border-top: 1px solid rgba(255,153,181,0.3); margin-top: 15px; padding-top: 10px;">
                    <h4 style="color:white; margin: 0 0 10px 0;">รายการฟอนต์:</h4>
                    <div id="baby-font-list" style="max-height: 150px; overflow-y: auto; padding-right: 5px;"></div>
                </div>
                <div style="margin-top: 15px; display: flex; align-items: center; gap: 10px; color: white; font-size: 0.9em;">
                    <input type="checkbox" id="baby-toggle-float" checked style="transform: scale(1.2);">
                    <label for="baby-toggle-float">แสดงปุ่มลอยฟ้า</label>
                </div>
                <button id="baby-reset-btn" style="background:#ffcc00; color:black; width:100%; margin-top:10px; border: none; padding: 10px; border-radius: 5px; cursor: pointer; font-weight: bold;">↺ คืนค่าเดิม (Reset)</button>
                <button id="baby-close-btn" style="background:transparent; border: 1px solid #555; color:#aaa; width:100%; margin-top:10px; padding: 10px; border-radius: 5px; cursor: pointer;">ปิดหน้าต่าง</button>
            </div>
        `;
        if (jQuery('#baby-font-manager-modal').length > 0) jQuery('#baby-font-manager-modal').remove();
        jQuery('body').append(modalHtml);

        if (jQuery('#baby-font-trigger-btn').length > 0) jQuery('#baby-font-trigger-btn').remove();
        const floatingBtn = jQuery(`<div id="baby-font-trigger-btn" title="เปลี่ยนฟอนต์">🎀</div>`);
        floatingBtn.css({
            "position": "fixed", "top": myData.btnPos.top, "right": myData.btnPos.right, "left": myData.btnPos.left || "auto",
            "z-index": "10000", "cursor": "grab", "font-size": "24px", "background": "rgba(20, 20, 20, 0.6)",
            "border-radius": "50%", "width": "50px", "height": "50px", "display": "flex", "align-items": "center", "justify-content": "center",
            "backdrop-filter": "blur(5px)", "border": "2px solid #ff99b5", "box-shadow": "0 0 10px rgba(255, 153, 181, 0.5)",
            "user-select": "none", "touch-action": "none"
        });
        jQuery('body').append(floatingBtn);

        // ---------------------------------------------------------
        // 5. Events & Listeners
        // ---------------------------------------------------------
        if (myData.isFloatingHidden) { floatingBtn.hide(); jQuery('#baby-toggle-float').prop('checked', false); }
        jQuery(document).on('change', '#baby-toggle-float', function() {
            if(this.checked) { floatingBtn.fadeIn(); myData.isFloatingHidden = false; }
            else { floatingBtn.fadeOut(); myData.isFloatingHidden = true; }
            saveMetadata();
        });

        function makeDraggable(element, handle, isBtn) {
            let isDragging = false; let startX, startY, initialLeft, initialTop;
            function dragStart(e) {
                const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
                const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
                isDragging = true; startX = clientX; startY = clientY;
                const rect = element[0].getBoundingClientRect();
                initialLeft = rect.left; initialTop = rect.top;
                element.css('cursor', 'grabbing');
            }
            function dragMove(e) {
                if (!isDragging) return; e.preventDefault();
                const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
                const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
                element.css({ top: (initialTop + (clientY - startY)) + 'px', left: (initialLeft + (clientX - startX)) + 'px', right: 'auto', margin: '0', transform: 'none' });
            }
            function dragEnd() {
                if (!isDragging) return; isDragging = false; element.css('cursor', 'grab');
                if (isBtn) { myData.btnPos = { top: element.css('top'), left: element.css('left'), right: 'auto' }; saveMetadata(); }
            }
            handle.on('mousedown touchstart', dragStart);
            jQuery(document).on('mousemove touchmove', dragMove);
            jQuery(document).on('mouseup touchend', dragEnd);
        }
        makeDraggable(floatingBtn, floatingBtn, true);
        makeDraggable(jQuery('#baby-font-manager-modal'), jQuery('#baby-modal-header'), false);

        function openBabyModal() {
            updateFontList();
            const modal = jQuery('#baby-font-manager-modal');
            modal.css({ 'top': '5vh', 'left': '0', 'right': '0', 'margin': 'auto', 'transform': 'none' });
            modal.fadeIn();
        }

        let isDragAction = false;
        floatingBtn.on('touchmove mousemove', () => { isDragAction = true; });
        floatingBtn.on('touchstart mousedown', () => { isDragAction = false; });
        floatingBtn.on('mouseup touchend', (e) => {
            if (!isDragAction) { if(e.type === 'touchend') e.preventDefault(); openBabyModal(); }
        });

        jQuery('#baby-close-btn').on('click', () => jQuery('#baby-font-manager-modal').fadeOut());

        jQuery(document).on('change', '#baby-font-upload', function() {
            const fileName = this.files[0] ? this.files[0].name : "";
            if (fileName) { jQuery('#file-name-display').text("✅ " + fileName); jQuery('.baby-file-label').css({background: 'rgba(255, 153, 181, 0.4)', borderStyle: 'solid'}); }
            else { jQuery('#file-name-display').text(""); }
        });

        jQuery('#baby-save-btn').on('click', () => {
            const fileInput = document.getElementById('baby-font-upload');
            const nameInput = jQuery('#baby-font-name').val();

            if (fileInput.files.length === 0 || !nameInput) {
                toastr.error("กรุณาเลือกไฟล์และตั้งชื่อฟอนต์", "แจ้งเตือน"); return;
            }

            // แสดงสถานะกำลังโหลด
            toastr.info("กำลังประมวลผลฟอนต์... กรุณารอสักครู่", "Processing");

            const reader = new FileReader();
            reader.onload = async function(e) {
                const fontData = e.target.result;
                const newFont = { name: nameInput, data: fontData };

                // บันทึกลง IndexedDB (ทำงานเบื้องหลัง ไม่ค้าง!)
                await saveFontToDB(newFont);

                // อัปเดต Array ในหน่วยความจำ
                const existingIndex = savedFontsList.findIndex(f => f.name === nameInput);
                if (existingIndex > -1) savedFontsList[existingIndex] = newFont;
                else savedFontsList.push(newFont);

                injectFont(nameInput, fontData);
                updateFontList();
                toastr.success("บันทึกลงฐานข้อมูลเรียบร้อย!", "สำเร็จ");

                fileInput.value = ''; jQuery('#baby-font-name').val('');
                jQuery('#file-name-display').text(''); jQuery('.baby-file-label').css('background', 'rgba(255, 153, 181, 0.2)');
            };
            reader.readAsDataURL(fileInput.files[0]);
        });

        jQuery('#baby-reset-btn').on('click', () => {
            if(confirm('ต้องการคืนค่าเป็นฟอนต์เริ่มต้นใช่ไหมคะ?')) {
                window.applyBabyFont(null);
            }
        });

        function createMenuBtn() {
            return jQuery(`
                <div class="list-group-item baby-font-menu-item" title="จัดการฟอนต์" style="cursor: pointer; display: flex; align-items: center; gap: 10px; border-left: 3px solid #ff99b5; background: rgba(255, 153, 181, 0.1); margin-bottom: 2px; padding: 10px; border-radius: 10px;">
                    <span class="fa-solid fa-font" style="color: #ff99b5;"></span>
                    <span style="font-weight: bold; color: #ccc;">คลังฟอนต์ของคุณเบบี้ 🎀</span>
                </div>
            `);
        }

        setInterval(() => {
            const possibleTargets = ['#extensions_settings', '#extensions_menu', '#rm_extensions_block', '.extensions_menu'];
            possibleTargets.forEach(selector => {
                const target = jQuery(selector);
                if (target.length > 0 && target.find('.baby-font-menu-item').length === 0) {
                    const btn = createMenuBtn();
                    if (selector === '#top-bar') {
                        btn.css({ 'width': 'auto', 'border': 'none', 'background': 'transparent', 'padding': '0 10px' });
                        btn.html('<span class="fa-solid fa-font" style="color: #ff99b5; font-size: 1.2em;"></span>');
                    }
                    target.append(btn);
                    btn.on('click', () => { openBabyModal(); });
                }
            });
        }, 2000);

        // 🛡️ The Ultimate Guard
        setInterval(() => {
            if (myData.currentFont && jQuery('#baby-custom-font-style').length === 0) {
                const forceStyle = jQuery('<style id="baby-custom-font-style"></style>');
                forceStyle.text(`
                    html:root, body#bg_all { --main-font-family: '${myData.currentFont}', sans-serif !important; }
                    html body, html body .mes_text, html body textarea, html body .text_pole, html body .ch_name, html body .mes_block { font-family: '${myData.currentFont}', sans-serif !important; }
                `);
                jQuery('body').append(forceStyle);
            }
        }, 2000);

    })(); // จบฟังก์ชัน Async
});
