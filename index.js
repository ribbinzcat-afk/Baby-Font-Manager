// ---------------------------------------------------------
// 0. นำเข้าเครื่องมือลับจาก SillyTavern (Top Secret Imports 🤫)
// ---------------------------------------------------------
import { saveSettingsDebounced } from "../../../../script.js";
import { extension_settings } from "../../../extensions.js";

const EXTENSION_NAME = "BabyFontManager";
const EXTENSION_FOLDER = `scripts/extensions/third-party/${EXTENSION_NAME}`;

jQuery(document).ready(function () {
    // ---------------------------------------------------------
    // 1. ตั้งค่าตัวแปรและระบบเซฟข้อมูล (Setup & Storage System)
    // ---------------------------------------------------------
    const storageKey = "BabyCustomFonts";

    const defaultSettings = {
        savedFonts: [],
        currentFont: null,
        btnPos: { top: "10px", right: "20px" },
        isFloatingHidden: false
    };

    function loadData() {
        // ดึงข้อมูลจาก Server
        let settings = extension_settings[EXTENSION_NAME] || {};

        // ดึงข้อมูลสำรองจาก LocalStorage
        const localFonts = JSON.parse(localStorage.getItem(storageKey) || "null");

        // 🛡️ ระบบกู้ชีพ: ถ้า Server ทำฟอนต์หาย (เพราะไฟล์ใหญ่ไป) ให้ดึงจาก LocalStorage มาใช้
        if ((!settings.savedFonts || settings.savedFonts.length === 0) && localFonts && localFonts.length > 0) {
            console.log("🕵️‍♂️ BabyFont: กู้คืนไฟล์ฟอนต์จาก LocalStorage สำเร็จ!");
            settings.savedFonts = localFonts;
        }

        // กู้คืนชื่อฟอนต์ที่กำลังใช้งาน
        if (!settings.currentFont) {
            settings.currentFont = localStorage.getItem(storageKey + "_Active") || null;
        }

        return { ...defaultSettings, ...settings };
    }

    let myData = loadData();

    function saveData() {
        extension_settings[EXTENSION_NAME] = myData;
        saveSettingsDebounced(); // เซฟลง Server

        // เซฟลง LocalStorage เผื่อ Server งอแง
        try {
            localStorage.setItem(storageKey, JSON.stringify(myData.savedFonts));
            if (myData.currentFont) localStorage.setItem(storageKey + "_Active", myData.currentFont);
            localStorage.setItem(storageKey + "_BtnPos", JSON.stringify(myData.btnPos));
            localStorage.setItem("BabyFont_HideFloat", myData.isFloatingHidden);
        } catch (e) {
            console.warn("⚠️ BabyFont: LocalStorage พื้นที่เต็ม แต่ยังทำงานได้อยู่ค่ะ");
        }
    }

    // ---------------------------------------------------------
    // 2. ฟังก์ชันหลัก (Core Functions)
    // ---------------------------------------------------------

    function injectFont(name, dataUrl) {
        const styleId = `font-style-${name.replace(/\s+/g, '-')}`;
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                @font-face { font-family: '${name}'; src: url('${dataUrl}'); }
            `;
            document.head.appendChild(style);
        }
    }

    // 🛡️ เพิ่ม isSilent เพื่อไม่ให้เด้งแจ้งเตือนกวนใจตอนโหลดหน้าเว็บ
    function applyFont(name, isSilent = false) {
        // ลบสไตล์เก่าออกก่อน
        jQuery('#baby-custom-font-style').remove();

        if (!name) {
             myData.currentFont = null;
             if (!isSilent) saveData();
             return;
        }

        // 🛡️ ไม้ตาย: สร้าง Style ฝัง !important บังคับทับทุกจุดใน SillyTavern
        const forceStyle = jQuery('<style id="baby-custom-font-style"></style>');
        forceStyle.text(`
            body, #bg_all, .mes_text, .text_pole, textarea, input, button, select, .mes_block, .list-group-item, h1, h2, h3, h4, h5, span, div {
                font-family: '${name}', sans-serif !important;
            }
        `);
        jQuery('head').append(forceStyle);

        myData.currentFont = name;
        if (!isSilent) saveData();

        if (!isSilent) {
            toastr.success(`เปลี่ยนฟอนต์เป็น ${name} แล้วค่ะ! 🎀`, "Baby Font Manager");
        }
    }

    function updateFontList() {
        const list = jQuery('#baby-font-list');
        list.empty();
        if (!myData.savedFonts || myData.savedFonts.length === 0) {
            list.append('<div style="text-align:center; color:#888; font-style:italic; padding:10px;">ยังไม่มีฟอนต์เลยจ้า</div>');
        } else {
            myData.savedFonts.forEach((font, index) => {
                const item = jQuery(`
                    <div class="font-list-item" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                        <span class="font-preview" style="font-family:'${font.name}'; color: white; font-size: 1.1em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60%;">${font.name}</span>
                        <div style="display:flex; gap:5px;">
                            <button style="background:#ff99b5; border:none; color:white; padding:6px 12px; border-radius:15px; cursor:pointer; font-size:0.8em;" onclick="window.applyBabyFont('${font.name}')">ใช้</button>
                            <button style="background:rgba(255, 77, 77, 0.2); border:1px solid #ff4d4d; color:#ff4d4d; padding:6px 12px; border-radius:15px; cursor:pointer; font-size:0.8em;" onclick="window.deleteBabyFont(${index})">ลบ</button>
                        </div>
                    </div>
                `);
                list.append(item);
            });
        }
    }

    // เริ่มต้นระบบ: โหลดฟอนต์ที่มีอยู่
    if (myData.savedFonts && myData.savedFonts.length > 0) {
        myData.savedFonts.forEach(font => injectFont(font.name, font.data));
    }

    if (myData.currentFont) {
        // 🛡️ หน่วงเวลาให้ธีมโหลดเสร็จก่อน และสั่ง isSilent = true เพื่อซ่อนแจ้งเตือนตอนเริ่มแอป
        setTimeout(() => applyFont(myData.currentFont, true), 800);
    }

    // ---------------------------------------------------------
    // 3. สร้างหน้าตา UI (User Interface) - Responsive 📱
    // ---------------------------------------------------------

    const customStyle = `
        <style>
            .baby-file-label {
                display: block; width: 100%; padding: 15px;
                background: rgba(255, 153, 181, 0.2);
                border: 1px dashed #ff99b5; border-radius: 8px;
                text-align: center; color: #ffb7c5; cursor: pointer;
                transition: all 0.3s ease; margin-top: 5px; font-size: 0.9em;
            }
            .baby-file-label:hover, .baby-file-label:active {
                background: rgba(255, 153, 181, 0.4); color: white; border-style: solid;
            }
            .baby-btn-pink {
                background: linear-gradient(45deg, #ff99b5, #ff5e7e);
                color: white; border: none; padding: 10px 15px;
                border-radius: 20px; cursor: pointer; width: 100%;
                box-shadow: 0 2px 5px rgba(255, 94, 126, 0.4);
                font-size: 1em; margin-top: 15px;
            }
            #baby-font-upload { display: none; }
            #baby-font-manager-modal {
                width: 90vw !important; max-width: 400px; max-height: 85vh;
            }
        </style>
    `;
    jQuery('head').append(customStyle);

    const modalHtml = `
        <div id="baby-font-manager-modal" class="baby-font-modal" style="display:none; margin: 10px auto; position: fixed; z-index: 9999; overflow-y: auto; background: rgba(20, 20, 20, 0.95); border: 2px solid #ff99b5; border-radius: 15px; padding: 20px; box-shadow: 0 0 20px rgba(255, 153, 181, 0.3); backdrop-filter: blur(10px);">

            <div id="baby-modal-header" style="cursor: grab; padding-bottom: 10px; margin-bottom: 10px; border-bottom: 1px solid rgba(255,153,181,0.3); touch-action: none;">
                <h3 style="color:#ff99b5; text-align:center; margin:0; pointer-events: none;">🎀 คลังฟอนต์ของคุณเบบี้ 🎀</h3>
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

    // สร้างปุ่มลอยฟ้า
    if (jQuery('#baby-font-trigger-btn').length > 0) jQuery('#baby-font-trigger-btn').remove();
    const floatingBtn = jQuery(`<div id="baby-font-trigger-btn" title="เปลี่ยนฟอนต์">🎀</div>`);

    floatingBtn.css({
        "position": "fixed",
        "top": myData.btnPos.top,
        "right": myData.btnPos.right,
        "left": myData.btnPos.left || "auto",
        "z-index": "10000",
        "cursor": "grab",
        "font-size": "24px",
        "background": "rgba(20, 20, 20, 0.6)",
        "border-radius": "50%",
        "width": "50px", "height": "50px",
        "display": "flex", "align-items": "center", "justify-content": "center",
        "backdrop-filter": "blur(5px)",
        "border": "2px solid #ff99b5",
        "box-shadow": "0 0 10px rgba(255, 153, 181, 0.5)",
        "user-select": "none",
        "touch-action": "none"
    });
    jQuery('body').append(floatingBtn);

    // ---------------------------------------------------------
    // 4. Logic & Events (Update for Dual Save)
    // ---------------------------------------------------------

    // [Logic] ซ่อน/แสดงปุ่ม
    if (myData.isFloatingHidden) {
        floatingBtn.hide();
        jQuery('#baby-toggle-float').prop('checked', false);
    }
    jQuery(document).on('change', '#baby-toggle-float', function() {
        if(this.checked) {
            floatingBtn.fadeIn();
            myData.isFloatingHidden = false;
        } else {
            floatingBtn.fadeOut();
            myData.isFloatingHidden = true;
        }
        saveData(); // บันทึกค่า
    });

    // [Logic] Universal Drag (เหมือนเดิม แต่เพิ่มการบันทึก)
    function makeDraggable(element, handle, isBtn) {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        function dragStart(e) {
            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            isDragging = true;
            startX = clientX; startY = clientY;
            const rect = element[0].getBoundingClientRect();
            initialLeft = rect.left; initialTop = rect.top;
            element.css('cursor', 'grabbing');
        }

        function dragMove(e) {
            if (!isDragging) return;
            e.preventDefault();
            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            const dx = clientX - startX;
            const dy = clientY - startY;
            element.css({ top: (initialTop + dy) + 'px', left: (initialLeft + dx) + 'px', right: 'auto', transform: 'none' });
        }

        function dragEnd() {
            if (!isDragging) return;
            isDragging = false;
            element.css('cursor', 'grab');

            // ถ้าเป็นปุ่ม ให้บันทึกตำแหน่งลงระบบ
            if (isBtn) {
                myData.btnPos = { top: element.css('top'), left: element.css('left'), right: 'auto' };
                saveData();
            }
        }

        handle.on('mousedown touchstart', dragStart);
        jQuery(document).on('mousemove touchmove', dragMove);
        jQuery(document).on('mouseup touchend', dragEnd);
    }

    makeDraggable(floatingBtn, floatingBtn, true);
    makeDraggable(jQuery('#baby-font-manager-modal'), jQuery('#baby-modal-header'), false);

    // ---------------------------------------------------------
    // 5. General Listeners
    // ---------------------------------------------------------

    let isDragAction = false;
    floatingBtn.on('touchmove mousemove', () => { isDragAction = true; });
    floatingBtn.on('touchstart mousedown', () => { isDragAction = false; });
    floatingBtn.on('mouseup touchend', (e) => {
        if (!isDragAction) {
            if(e.type === 'touchend') e.preventDefault();
            updateFontList();
            jQuery('#baby-font-manager-modal').fadeIn();
        }
    });

    jQuery('#baby-close-btn').on('click', () => jQuery('#baby-font-manager-modal').fadeOut());

    jQuery(document).on('change', '#baby-font-upload', function() {
        const fileName = this.files[0] ? this.files[0].name : "";
        if (fileName) {
            jQuery('#file-name-display').text("✅ " + fileName);
            jQuery('.baby-file-label').css({background: 'rgba(255, 153, 181, 0.4)', borderStyle: 'solid'});
        } else {
            jQuery('#file-name-display').text("");
        }
    });

    jQuery('#baby-save-btn').on('click', () => {
        const fileInput = document.getElementById('baby-font-upload');
        const nameInput = jQuery('#baby-font-name').val();

        if (fileInput.files.length === 0 || !nameInput) {
            toastr.error("กรุณาเลือกไฟล์และตั้งชื่อฟอนต์", "แจ้งเตือน");
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const fontData = e.target.result;

            // อัปเดตข้อมูลลงตัวแปรหลัก
            myData.savedFonts.push({ name: nameInput, data: fontData });

            // สั่งบันทึก (ลงทั้ง 2 ที่)
            saveData();

            injectFont(nameInput, fontData);
            updateFontList();
            toastr.success("บันทึกเรียบร้อย!", "สำเร็จ");

            fileInput.value = '';
            jQuery('#baby-font-name').val('');
            jQuery('#file-name-display').text('');
            jQuery('.baby-file-label').css('background', 'rgba(255, 153, 181, 0.2)');
        };
        reader.readAsDataURL(fileInput.files[0]);
    });

    jQuery('#baby-reset-btn').on('click', () => {
        if(confirm('ต้องการคืนค่าเป็นฟอนต์เริ่มต้นใช่ไหมคะ?')) {
            myData.currentFont = null;
            saveData(); // บันทึกค่าว่าง
            applyFont(null);
            toastr.info("รีเซ็ตเรียบร้อย", "Reset");
        }
    });

    window.applyBabyFont = applyFont;
    window.deleteBabyFont = (index) => {
        if(confirm('จะลบฟอนต์นี้จริงๆ เหรอคะ? 🥺')) {
            myData.savedFonts.splice(index, 1);
            saveData(); // บันทึกการลบ
            updateFontList();
        }
    };

    // --- ส่วนเพิ่มปุ่มในเมนู (Hacker Search 🕸️) ---
    function createMenuBtn() {
        return jQuery(`
            <div class="list-group-item baby-font-menu-item" title="จัดการฟอนต์" style="cursor: pointer; display: flex; align-items: center; gap: 10px; border-left: 3px solid #ff99b5; background: rgba(255, 153, 181, 0.1); margin-bottom: 2px; padding: 10px; border-radius: 10px;">
                <span class="fa-solid fa-font" style="color: #ff99b5;"></span>
                <span style="font-weight: bold; color: #ccc;">คลังฟอนต์ของคุณเบบี้ 🎀</span>
            </div>
        `);
    }
        const checkMenuInterval = setInterval(() => {
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
                btn.on('click', () => { updateFontList(); jQuery('#baby-font-manager-modal').fadeIn(); });
            }
        });
    }, 2000);
    
});
