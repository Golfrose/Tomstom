// firebase.js
import { firebaseConfig } from './config.js';

// ใช้ compat SDK ตามของเดิม (มี firebase เป็น global จาก <script>)
firebase.initializeApp(firebaseConfig);

export const auth = firebase.auth();
export const database = firebase.database();
