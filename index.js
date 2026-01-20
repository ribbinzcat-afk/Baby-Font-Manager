jQuery(document).ready(function () {
    const extensionName = "BabyFontManager";
    const storageKey = "BabyCustomFonts";

    // --- ส่วนโหลดฟอนต์ (Logic เดิมที่ทำงานได้แล้ว) ---
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
        jQuery('body').css('font-family', `'${name}', sans-serif`);
        localStorage.setItem(storageKey + "_Active", name);
        toastr.success(`เปลี่ยนฟอนต์เป็น ${name} แล้วครับ!`, "Baby Font Manager");
    }

    savedFonts.forEach(font => injectFont(font.name, font.data));
    if (currentFont) applyFont(currentFont);

    // --- ส่วนสร้างหน้าต่าง UI (เหมือนเดิม) ---
    const modalHtml = `
        <div id="baby-font-manager-modal" class="baby-font-modal" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); z-index:9999; width: 400px; max-height: 80vh; overflow-y: auto; background: rgba(20, 20, 20, 0.95); border: 2px solid #ff99b5; border-radius: 15px; padding: 20px; box-shadow: 0 0 20px rgba(255, 153, 181, 0.3);">
            <h3 style="color:#ff99b5; text-align:center; font-family: sans-serif;">🎀 คลังฟอนต์ของคุณเบบี้ 🎀</h3>
            <hr style="border-color:#ff99b5; opacity: 0.5;">

            <div style="margin-bottom: 15px;">
                <label style="color: white;">อัปโหลดฟอนต์ใหม่ (.ttf/.otf)</label>
                <input type="file" id="baby-font-upload" accept=".ttf,.otf" style="width:100%; margin-top:5px; color: white;">
                <input type="text" id="baby-font-name" placeholder="ตั้งชื่อฟอนต์..." style="width:100%; margin-top:5px; background:#333; color:white; border:1px solid #555; padding:8px; border-radius: 5px;">
                <button id="baby-save-btn" class="baby-btn" style="width:100%; margin-top:10px; background: #ff99b5; color: white; border: none; padding: 8px; border-radius: 5px; cursor: pointer;">บันทึกฟอนต์ ✨</button>
            </div>

            <div id="baby-font-list" style="max-height: 200px; overflow-y: auto;">
                <!-- รายชื่อฟอนต์ -->
            </div>

            <button id="baby-close-btn" class="baby-btn" style="background:#555; color:white; width:100%; margin-top:10px; border: none; padding: 8px; border-radius: 5px; cursor: pointer;">ปิดหน้าต่าง</button>
        </div>
    `;

    // เช็คก่อนว่ามี Modal หรือยัง ถ้ามีแล้วลบของเก่าทิ้งก่อนสร้างใหม่ (กันเบิ้ล)
    if (jQuery('#baby-font-manager-modal').length > 0) {
        jQuery('#baby-font-manager-modal').remove();
    }
    jQuery('body').append(modalHtml);

    // --- ส่วนสร้างปุ่ม (ฉบับปุ่มลอยฟ้า!) ---

    // ลบปุ่มเก่าทิ้งก่อน (ถ้ามี)
    if (jQuery('#baby-font-trigger-btn').length > 0) {
        jQuery('#baby-font-trigger-btn').remove();
    }

    // สร้างปุ่มแบบ Fixed Position
    const floatingBtn = jQuery(`
        <div id="baby-font-trigger-btn" title="เปลี่ยนฟอนต์">
            🅰️
        </div>
    `);

    // ใส่ CSS ให้ปุ่มโดยตรงเลย (จะได้ไม่ต้องง้อไฟล์ css มาก)
    floatingBtn.css({
        "position": "fixed",
        "top": "10px",           // ห่างจากขอบบน 10px
        "right": "100px",        // ห่างจากขอบขวา 100px (เผื่อหลบปุ่มอื่น)
        "z-index": "10000",      // อยู่บนสุดของห่วงโซ่อาหาร
        "cursor": "pointer",
        "font-size": "24px",
        "background": "rgba(255, 255, 255, 0.2)",
        "border-radius": "50%",
        "width": "40px",
        "height": "40px",
        "display": "flex",
        "align-items": "center",
        "justify-content": "center",
        "backdrop-filter": "blur(5px)",
        "border": "1px solid #ff99b5"
    });

    // แปะลงไปที่ Body โดยตรง
    jQuery('body').append(floatingBtn);

    // --- Event Listeners ---

    function updateFontList() {
        const list = jQuery('#baby-font-list');
        list.empty();
        savedFonts.forEach((font, index) => {
            const item = jQuery(`
                <div class="font-list-item" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; background: rgba(255,255,255,0.1); padding: 5px; border-radius: 5px;">
                    <span class="font-preview" style="font-family:'${font.name}'; color: white;">${font.name}</span>
                    <div>
                        <button style="background:#ff99b5; border:none; color:white; padding:2px 8px; border-radius:3px; cursor:pointer;" onclick="window.applyBabyFont('${font.name}')">ใช้</button>
                        <button style="background:#ff4d4d; border:none; color:white; padding:2px 8px; border-radius:3px; cursor:pointer;" onclick="window.deleteBabyFont(${index})">ลบ</button>
                    </div>
                </div>
            `);
            list.append(item);
        });
    }

    floatingBtn.on('click', () => {
        updateFontList();
        jQuery('#baby-font-manager-modal').fadeIn();
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