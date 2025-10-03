// index.js

//1. import thư viện Express
const express = require('express');

//2. Khơi tạo ứng dụng Express
const app = express();
const PORT = 3000;//cổng ứng dụng chạy

//3. Xây dựng Route/Endpoint đầu tiên (API chào mừng)
//Phương thức GET, đường dẫn /
app.get('/', (req, res) => {
    //Trả về phản hồi JSON
    res.json({ message: 'Chào mừng đến với API Dữ liệu người dùng' });
});

//4. Lắng nghe các yêu cầu tại cổng định nghĩa
app.listen(PORT, () => {
    console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
});