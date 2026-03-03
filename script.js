const liffId = "2008591672-siSxw5Gt";
const googleScriptUrl = "https://script.google.com/macros/s/AKfycbxGM4UCjDA8-455SyvX-h2BK7wDLnhUU_BIWrp30GHim0Fblwe1x5KBdpaVFnuTQ5Cw2g/exec";

let profileData = null;
let lineEmail = '';
let linePhone = '';

document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();

    // Modal functions
    window.showProfileModal = function() {
        document.getElementById('profile-modal').classList.remove('hidden');
        document.getElementById('profile-modal').classList.add('flex');
    };
    window.hideProfileModal = function() {
        const modal = document.getElementById('profile-modal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    };

    // LIFF Init
    liff.init({ liffId: liffId })
        .then(() => {
            if (!liff.isLoggedIn()) {
                liff.login({ redirectUri: window.location.href });
            } else {
                return Promise.all([liff.getProfile(), liff.getDecodedIDToken()]);
            }
        })
        .then(([profile, idToken]) => {
            profileData = profile;
            lineEmail = idToken?.email || '';
            linePhone = idToken?.phone_number || '';

            // Hide loading
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('profile').classList.remove('hidden');

            // Fill data
            document.getElementById('display-name').textContent = profile.displayName;
            document.getElementById('user-id').textContent = profile.userId;
            document.getElementById('status-message').textContent = profile.statusMessage || 'ไม่ได้ตั้งค่าสถานะ';

            const preview = document.getElementById('profile-preview');
            const modalImg = document.getElementById('modal-profile-image');
            if (profile.pictureUrl) {
                preview.src = profile.pictureUrl;
                modalImg.src = profile.pictureUrl;
            } else {
                const def = 'https://i.imgur.com/3J3WQwX.png';
                preview.src = def;
                modalImg.src = def;
            }

            // Phone handling
            const phoneInput = document.getElementById('phone');
            if (linePhone) {
                phoneInput.value = linePhone;
                phoneInput.readOnly = true;
                phoneInput.classList.add('readonly-input');
                document.getElementById('line-phone-info').classList.remove('hidden');
                document.getElementById('line-phone-value').textContent = linePhone;
            } else {
                phoneInput.focus();
            }

            lucide.createIcons();
        })
        .catch(err => {
            console.error(err);
            document.getElementById('loading').innerHTML = `
                <div class="text-red-400 text-center">
                    <i data-lucide="alert-circle" class="w-12 h-12 mx-auto mb-4"></i>
                    <p class="font-bold">ไม่สามารถดึงข้อมูลได้</p>
                    <p class="text-sm mt-2">${err.message}</p>
                    <button onclick="location.reload()" class="mt-6 bg-white/10 text-white px-6 py-3 rounded-2xl">ลองใหม่</button>
                </div>`;
            lucide.createIcons();
        });
});

async function sendToGoogleSheets(data) {
    const url = new URL(googleScriptUrl);
    url.searchParams.append('callback', 'handleResponse');
    
    await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return { status: 'success' };
}

window.submitForm = async function() {
    const phone = document.getElementById('phone').value.trim();
    if (!phone) {
        alert('กรุณากรอกเบอร์โทรศัพท์');
        return;
    }

    const btn = document.getElementById('submit-btn');
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="animate-spin inline-block w-6 h-6 border-2 border-[#244439]/30 border-t-[#244439] rounded-full mr-3"></span>กำลังส่ง...`;

    const formData = {
        lineUserId: profileData.userId,
        displayName: profileData.displayName,
        pictureUrl: profileData.pictureUrl || '',
        statusMessage: profileData.statusMessage || '',
        email: lineEmail,
        phone: phone,
        comments: '',
        timestamp: new Date().toISOString()
    };

    try {
        await sendToGoogleSheets(formData);
        btn.innerHTML = '✓ ส่งข้อมูลสำเร็จ!';
        btn.style.backgroundColor = '#4CAF50';
        setTimeout(() => liff.closeWindow(), 1800);
    } catch (err) {
        console.error(err);
        btn.innerHTML = originalHTML;
        btn.disabled = false;
        alert('ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
};
