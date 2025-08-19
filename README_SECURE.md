# Tomstom — เวอร์ชันรวมทุกอย่าง (Drop-in)

ชุดนี้คือโปรเจกต์ของคุณเดิม + ไฟล์เสริมความปลอดภัยครบ พร้อม deploy:
- ไม่เปลี่ยนชื่อ/ย้ายไฟล์เดิม
- เพิ่ม Cloud Functions proxy เพื่อซ่อนคีย์ไว้ใน Firebase Secrets
- เพิ่มตัวดัก fetch (assets/js/fetch-shim.js) ให้คำขอไป API ปลายทางวิ่งผ่าน `/api/apiProxy` อัตโนมัติ

## สิ่งที่ต้องแก้ 2 จุด
1) โดเมน API จริง
   - `functions/index.js` → เพิ่มโดเมนใน `ALLOWED_HOSTS` (เช่น "api.example.com")
   - `assets/js/fetch-shim.js` → ตั้ง `TOMSTOM_TARGET_ORIGIN = "https://api.example.com"`
2) ใส่ Project ID ใน `.firebaserc`

## Deploy ครั้งแรก
```bash
npm i -g firebase-tools
firebase login
firebase use your-project-id

firebase functions:secrets:set THIRD_PARTY_API_KEY
# วางค่า key จริง แล้ว Enter

firebase deploy
```

เสร็จแล้ว หน้าเว็บจะใช้ API ผ่าน `/api/apiProxy` พร้อมเติมคีย์จาก Secrets โดยอัตโนมัติ


---
### โปรเจกต์นี้ตั้งค่าให้กับ Firebase Project: **tomstom-8** แล้ว
- อัปเดต ALLOWED_HOSTS และ fetch-shim ให้ชี้ไปยัง Realtime Database ของคุณเรียบร้อย
- เพิ่ม `assets/js/firebase-init.js` ที่ลง config ของคุณให้แล้ว (ฝั่ง client)

#### Deploy เร็ว ๆ อีกครั้ง
```bash
firebase login
firebase use tomstom-8
firebase functions:secrets:set THIRD_PARTY_API_KEY
firebase deploy
```
