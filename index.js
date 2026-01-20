import { extension_settings } from "../../../extensions.js";

const extensionName = "BabyFontManager";
const storageKey = "BabyCustomFonts";

// --- 🎨 ส่วน CSS: เวทมนตร์แห่งความงาม (Royal Coquette Style) ---
const styles = `
    /* ฟอนต์และการแสดงผล */
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600&display=swap');

    /* หน้าต่าง Modal (ห้องแต่งตัว) */
    #baby-font-manager-modal {
        font-family: 'Sarabun', sans-serif;
        background: rgba(25, 25, 35, 0.85); /* สีพื้นหลังเข้มโปร่งแสง */
        backdrop-filter: blur(15px);         /* เอฟเฟกต์กระจกฝ้า */
        -webkit-backdrop-filter: blur(15px);
        border: 1px solid rgba(255, 183, 178, 0.3); /* ขอบสี Rose Gold จางๆ */
        border-radius: 20px;
        padding: 25px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5),
                    0 0 20px rgba(255, 153, 181, 0.2); /* เงาสีชมพูฟุ้งๆ */
        width: 420px;
        max-height: 85vh;
        overflow-y: auto;
        color: #fff;
        z-index: 10001; /* อยู่เหนือทุกสิ่ง */

        /* จัดให้อยู่กลางจอ */
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: none; /* ซ่อนไว้ก่อน */
    }

    /* หัวข้อ */
    #baby-font-manager-modal h3 {
        color: #ffb7b2; /* สีชมพูพีช */
        text-align: center;
        margin-top: 0;
        font-weight: 600;
        letter-spacing: 1px;
        text-shadow: 0 0 10px rgba(255, 183, 178, 0.5);
    }

    /* เส้นคั่น */
    .baby-divider {
        border: 0;
        height: 1px;
        background-image: linear-gradient(to right, rgba(0, 0, 0, 0), rgba(255, 183, 178, 0.75), rgba(0, 0, 0, 0));
        margin: 15px 0;
    }

    /* Input & Button */
    .baby-input {
        width: 100%;
        margin-top: 8px;
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 10px;
        border-radius: 12px;
        transition: all 0.3s ease;
    }
    .baby-input:focus {
        background: rgba(255, 255, 255, 0.15);
        border-color: #ffb7b2;
        outline: none;
        box-shadow: 0 0 10px rgba(255, 183, 178, 0.3);
    }

    .baby-btn-primary {
        width: 100%;
        margin-top: 15px;
        background: linear-gradient(135deg, #ff99b5 0%, #ff758c 100%);
        color: white;
        border: none;
        padding: 10px;
        border-radius: 12px;
        cursor: pointer;
        font-weight: 600;
        box-shadow: 0 4px 15px rgba(255, 117, 140, 0.4);
        transition: transform 0.2s, box-shadow 0.2s;
    }
    .baby-btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(255, 117, 140, 0.6);
    }
    .baby-btn-primary:active {
        transform: translateY(0);
    }

    /* รายการฟอนต์ */
    .font-list-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        background: rgba(255, 255, 255, 0.05);
        padding: 10px 15px;
        border-radius: 12px;
        transition: background 0.2s;
        border: 1px solid transparent;
    }
    .font-list-item:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 183, 178, 0.3);
    }

    /* ปุ่มลอยฟ้า (Floating Button) */
    #baby-font-trigger-btn {
        position: fixed;
        top: 100px;
        right: 20px;
        width: 50px;
        height: 50px;
        background: rgba(30, 30, 40, 0.6);
        backdrop-filter: blur(5px);
        border: 2px solid #ff99b5;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        cursor: grab; /* รูปมือจับ */
        z-index: 10000;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        transition: transform 0.2s, background 0.3s;
        user-select: none; /* ห้ามคลุมดำ */
    }
    #baby-font-trigger-btn:hover {
        background: rgba(255, 153, 181, 0.2);
        transform: scale(1.1);
        box-shadow: 0 0 20px rgba(255, 153, 181, 0.5);
    }
    #baby-font-trigger-btn:active {
        cursor: grabbing; /* รูปมือบีบ */
    }
`;

// ฟังก์ชันฉีด CSS เข้าไปในหน้าเว็บ
function injectStyles() {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}

// --- 🧠 ส่วน Logic: สมองกลอัจฉริยะ ---
jQuery(document).ready(function () {
    injectStyles(); // เรียกใช้เวทมนตร์ CSS

    // โหลดฟอนต์ที่เคยเก็บไว้
    let savedFonts = JSON.parse(localStorage.getItem(storageKey) || "[]");
    let currentFont = localStorage.getItem(storageKey + "_Active");

    function injectFont(name, dataUrl) {
        const styleId = `font-style-${name.replace(/\s+/g, '-')}`;
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                @font-face {
                    font-family: '${name}';
                    src: url('${dataUrl}');
                }
            `;
            document.head.appendChild(style);
        }
    }

    function applyFont(name) {
        if (!name) return;
        // บังคับใช้ฟอนต์กับทุกส่วนที่สำคัญ
        jQuery('body, textarea, input, .mes_text, .name_text').css('font-family', `'${name}', sans-serif`);
        localStorage.setItem(storageKey + "_Active", name);
        toastr.success(`เปลี่ยนฟอนต์เป็น ${name} เรียบร้อยค่ะ! 🎀`, "Baby Font Manager");
    }

    savedFonts.forEach(font => injectFont(font.name, font.data));
    if (currentFont) applyFont(currentFont);

    // --- สร้างหน้าต่าง UI (Modal) ---
    const modalHtml = `
        <div id="baby-font-manager-modal">
            <h3>🎀 Baby Font Collection 🎀</h3>
            <div class="baby-divider"></div>

            <div style="margin-bottom: 20px;">
                <label style="color: #ddd; font-size: 0.9em;">อัปโหลดฟอนต์ใหม่ (.ttf/.otf)</label>
                <input type="file" id="baby-font-upload" accept=".ttf,.otf" class="baby-input" style="padding: 5px;">
                <input type="text" id="baby-font-name" placeholder="ตั้งชื่อฟอนต์น่ารักๆ..." class="baby-input">
                <button id="baby-save-btn" class="baby-btn-primary">✨ บันทึกฟอนต์ ✨</button>
            </div>

            <div id="baby-font-list" style="max-height: 250px; overflow-y: auto; padding-right: 5px;">
                <!-- รายชื่อฟอนต์ -->
            </div>

            <button id="baby-close-btn" class="baby-input" style="background: rgba(255,255,255,0.05); cursor:pointer; margin-top:15px; text-align:center;">ปิดหน้าต่าง</button>
        </div>
    `;

    if (jQuery('#baby-font-manager-modal').length > 0) jQuery('#baby-font-manager-modal').remove();
    jQuery('body').append(modalHtml);

    // --- สร้างปุ่มลอยฟ้า (Draggable Button) ---
    if (jQuery('#baby-font-trigger-btn').length > 0) jQuery('#baby-font-trigger-btn').remove();

    const floatingBtn = jQuery(`<div id="baby-font-trigger-btn" title="เปลี่ยนฟอนต์">🅰️</div>`);
    jQuery('body').append(floatingBtn);

    // *** ส่วนสำคัญ: ทำให้ปุ่มลากได้ (Drag Logic) ***
    let isDragging = false;
    let offset = { x: 0, y: 0 };

    floatingBtn.on('mousedown', function(e) {
        isDragging = true;
        offset.x = e.clientX - floatingBtn[0].getBoundingClientRect().left;
        offset.y = e.clientY - floatingBtn[0].getBoundingClientRect().top;
        floatingBtn.css('transition', 'none'); // ปิด animation ชั่วคราวตอนลาก
    });

    jQuery(document).on('mousemove', function(e) {
        if (!isDragging) return;
        e.preventDefault();
        floatingBtn.css({
            top: e.clientY - offset.y + 'px',
            left: e.clientX - offset.x + 'px',
            right: 'auto' // ยกเลิกค่า right เดิม
        });
    });

    jQuery(document).on('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            floatingBtn.css('transition', 'transform 0.2s, background 0.3s'); // เปิด animation กลับมา

            // จำตำแหน่งล่าสุดไว้ (ถ้าอยากให้รีเฟรชแล้วอยู่ที่เดิม ต้องใช้ localStorage เพิ่ม)
            const rect = floatingBtn[0].getBoundingClientRect();
            localStorage.setItem('BabyBtnPos', JSON.stringify({ top: rect.top, left: rect.left }));
        }
    });

    // โหลดตำแหน่งปุ่มล่าสุด (ถ้ามี)
    const savedPos = JSON.parse(localStorage.getItem('BabyBtnPos'));
    if (savedPos) {
        floatingBtn.css({ top: savedPos.top + 'px', left: savedPos.left + 'px', right: 'auto' });
    }

    // --- Event Listeners ---
    function updateFontList() {
        const list = jQuery('#baby-font-list');
        list.empty();
        savedFonts.forEach((font, index) => {
            const item = jQuery(`
                <div class="font-list-item">
                    <span style="font-family:'${font.name}'; color: #fff; font-size: 1.1em;">${font.name}</span>
                    <div style="display:flex; gap:5px;">
                        <button style="background:none; border:1px solid #ff99b5; color:#ff99b5; padding:4px 10px; border-radius:8px; cursor:pointer;" onclick="window.applyBabyFont('${font.name}')">ใช้</button>
                        <button style="background:none; border:1px solid #ff4d4d; color:#ff4d4d; padding:4px 10px; border-radius:8px; cursor:pointer;" onclick="window.deleteBabyFont(${index})">ลบ</button>
                    </div>
                </div>
            `);
            list.append(item);
        });
    }

    // คลิกปุ่ม (ต้องแยกแยะระหว่าง คลิกเฉยๆ กับ ลากแล้วปล่อย)
    let isClick = true;
    floatingBtn.on('mousedown', () => isClick = true);
    floatingBtn.on('mousemove', () => isClick = false);
    floatingBtn.on('mouseup', () => {
        if (isClick) {
            updateFontList();
            jQuery('#baby-font-manager-modal').fadeIn();
        }
    });

    jQuery('#baby-close-btn').on('click', () => jQuery('#baby-font-manager-modal').fadeOut());

    jQuery('#baby-save-btn').on('click', () => {
        const fileInput = document.getElementById('baby-font-upload');
        const nameInput = jQuery('#baby-font-name').val();

        if (fileInput.files.length === 0 || !nameInput) {
            toastr.error("อย่าลืมเลือกไฟล์และตั้งชื่อฟอนต์นะครับ!", "แจ้งเตือน");
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const fontData = e.target.result;
            savedFonts.push({ name: nameInput, data: fontData });
            localStorage.setItem(storageKey, JSON.stringify(savedFonts));

            injectFont(nameInput, fontData);
            updateFontList();
            toastr.success("บันทึกฟอนต์เรียบร้อยครับ!", "สำเร็จ");

            fileInput.value = '';
            jQuery('#baby-font-name').val('');
        };
        reader.readAsDataURL(fileInput.files[0]);
    });

    window.applyBabyFont = applyFont;
    window.deleteBabyFont = (index) => {
        savedFonts.splice(index, 1);
        localStorage.setItem(storageKey, JSON.stringify(savedFonts));
        updateFontList();
    };
});