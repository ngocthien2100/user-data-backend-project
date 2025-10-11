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
// API GET để kiểm tra trạng thái hoạt động của Server
app.get('/api/v1/status', (req, res) => {
    // Trả về một phản hồi JSON chứa thông tin trạng thái
    res.json({ 
        service: "User Data API", 
        version: "1.0", 
        health: "Good",
        timestamp: new Date().toISOString() // Thêm thời gian hiện tại
    });
});

// 1. IMPORT router
const userRoutes = require('./routes/userRoutes.js');

// 2. Middleware bắt buộc để đọc JSON
app.use(express.json());

// 3. Gắn route chính
app.use('/api/v1/users', userRoutes);

// 4. API kiểm tra server
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Server is running correctly ✅' });
});


//4. Lắng nghe các yêu cầu tại cổng định nghĩa
app.listen(PORT, () => {
    console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
});
