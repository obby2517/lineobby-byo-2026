// ตั้งค่า LIFF ID ของคุณที่นี่
const liffId = "2008591672-siSxw5Gt";

// ตั้งค่า Google Apps Script URL ของคุณที่นี่
const googleScriptUrl = "https://script.google.com/macros/s/AKfycbxGM4UCjDA8-455SyvX-h2BK7wDLnhUU_BIWrp30GHim0Fblwe1x5KBdpaVFnuTQ5Cw2g/exec";

document.addEventListener('DOMContentLoaded', function() {
  // เริ่มต้น Modal
  const modal = document.getElementById('profile-modal');
  const modalImg = document.getElementById('modal-profile-image');
  const previewImg = document.getElementById('profile-preview');
  const closeModal = document.querySelector('.modal-close');
  
  // เปิด Modal เมื่อคลิกที่รูปเล็ก
  previewImg.addEventListener('click', function() {
    modal.classList.add('show');
  });
  
  // ปิด Modal
  closeModal.addEventListener('click', function() {
    modal.classList.remove('show');
  });
  
  // ปิด Modal เมื่อคลิกนอกภาพ
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.classList.remove('show');
    }
  });
  
  // เริ่มต้น LIFF
  liff.init({
    liffId: liffId
  })
  .then(() => {
    if (!liff.isLoggedIn()) {
      liff.login({
        redirectUri: window.location.href
      });
    } else {
      // ดึงข้อมูลโปรไฟล์และอีเมล
      return Promise.all([
        liff.getProfile(),
        liff.getDecodedIDToken()
      ]);
    }
  })
  .then(([profile, idToken]) => {
    // ซ่อน loading และแสดงโปรไฟล์
    document.getElementById('loading').style.display = 'none';
    document.getElementById('profile').style.display = 'block';
    
    // แสดงข้อมูลโปรไฟล์
    document.getElementById('display-name').textContent = profile.displayName;
    document.getElementById('user-id').textContent = profile.userId;
    document.getElementById('status-message').textContent = 
      profile.statusMessage || 'ไม่ได้ตั้งค่าสถานะ';
    
    // ดึงอีเมลและเบอร์โทรศัพท์จาก LINE (ถ้ามี)
    const lineEmail = idToken?.email || '';
    const linePhone = idToken?.phone_number || '';
    
    // ส่วนจัดการอีเมล
    const lineEmailInfo = document.getElementById('line-email-info');
    if (lineEmail) {
      document.getElementById('email').value = lineEmail;
      document.getElementById('line-email-value').textContent = lineEmail;
      lineEmailInfo.style.display = 'block';
      document.getElementById('email').readOnly = true;
      document.getElementById('email').classList.add('readonly-input');
    } else {
      lineEmailInfo.style.display = 'none';
    }
    
    // ส่วนจัดการเบอร์โทรศัพท์
    const linePhoneInfo = document.getElementById('line-phone-info');
    if (linePhone) {
      document.getElementById('phone').value = linePhone;
      document.getElementById('line-phone-value').textContent = linePhone;
      linePhoneInfo.style.display = 'block';
      document.getElementById('phone').readOnly = true;
      document.getElementById('phone').classList.add('readonly-input');
    } else {
      linePhoneInfo.style.display = 'none';
    }
    
    // แสดงรูปโปรไฟล์ (ถ้ามี)
    if (profile.pictureUrl) {
      previewImg.src = profile.pictureUrl;
      modalImg.src = profile.pictureUrl;
    } else {
      // รูปโปรไฟล์เริ่มต้นถ้าไม่มี
      const defaultImg = 'https://i.imgur.com/3J3WQwX.png';
      previewImg.src = defaultImg;
      modalImg.src = defaultImg;
    }
    
    // จัดการฟอร์มเพิ่มเติม
    document.getElementById('additional-form').addEventListener('submit', function(e) {
      e.preventDefault();
      
      // เก็บค่าจากฟอร์ม
      const formData = {
        lineUserId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl || '',
        statusMessage: profile.statusMessage || '',
        email: document.getElementById('email').value || lineEmail,
        phone: document.getElementById('phone').value || linePhone,
        comments: document.getElementById('comments').value,
        timestamp: new Date().toISOString()
      };
      
      // แสดงการโหลดขณะส่งข้อมูล
      const submitBtn = document.querySelector('button[type="submit"]');
      submitBtn.innerHTML = '<span class="spinner"></span> กำลังส่งข้อมูล...';
      submitBtn.disabled = true;
      
      // ส่งข้อมูลไปยัง Google Sheets
      sendToGoogleSheets(formData)
        .then(response => {
          // แสดงข้อความสำเร็จ
          submitBtn.innerHTML = '<span style="display: inline-block; margin-right: 8px;">✓</span> ส่งข้อมูลสำเร็จ!';
          submitBtn.style.backgroundColor = 'var(--success-color)';
          
          // ปิดหน้าต่างหลังจาก 2 วินาที
          setTimeout(() => {
            liff.closeWindow();
          }, 2000);
        })
        .catch(error => {
          console.error('Error:', error);
          submitBtn.innerHTML = '<span style="display: inline-block; margin-right: 8px;">✗</span> ส่งข้อมูลไม่สำเร็จ';
          submitBtn.style.backgroundColor = 'var(--error-color)';
          
          // แสดงข้อความผิดพลาด
          const errorDiv = document.createElement('div');
          errorDiv.className = 'error-message';
          errorDiv.textContent = 'เกิดข้อผิดพลาดในการส่งข้อมูล: ' + error.message;
          submitBtn.parentNode.insertBefore(errorDiv, submitBtn.nextSibling);
          
          // เปิดใช้งานปุ่มอีกครั้งหลังจาก 3 วินาที
          setTimeout(() => {
            submitBtn.innerHTML = '<span style="display: inline-block; margin-right: 8px;">✓</span> ส่งข้อมูล';
            submitBtn.style.backgroundColor = 'var(--primary-color)';
            submitBtn.disabled = false;
            if (errorDiv.parentNode) {
              errorDiv.parentNode.removeChild(errorDiv);
            }
          }, 3000);
        });
    });
  })
  .catch(err => {
    console.error('เกิดข้อผิดพลาด:', err);
    document.getElementById('loading').innerHTML = `
      <div style="color: var(--error-color); background: #fdecea; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
        <p style="font-weight: 500; margin-bottom: 10px;">เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์</p>
        <p style="font-size: 14px;">${err.message || 'ไม่สามารถเชื่อมต่อกับ LINE ได้'}</p>
      </div>
      <button onclick="window.location.reload()" style="background-color: var(--error-color);">ลองอีกครั้ง</button>
    `;
  });
});

// ฟังก์ชันสำหรับส่งข้อมูลไปยัง Google Sheets
async function sendToGoogleSheets(data) {
  try {
    // เพิ่ม parameter เพื่อหลีกเลี่ยงปัญหา CORS
    const url = new URL(googleScriptUrl);
    url.searchParams.append('callback', 'handleResponse');
    
    const response = await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      redirect: 'follow'
    });
    
    // เนื่องจากใช้ no-cors เราจะไม่สามารถอ่าน response ได้โดยตรง
    return {status: 'success', message: 'Data submitted'};
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
