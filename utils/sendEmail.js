const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1. Tạo transporter
    const transporter = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
            user: "b0572c96509347",
            pass: "a90dbb692ff223"
  }
});

    // 2. Cấu hình email
    const mailOptions = {
        from: '"VLSC Shop" <no-reply@vlscshop.com>',
        to: options.email,
        subject: options.subject,
        text: options.message,
    };
    
    // 3. Gửi email
    await transporter.sendMail(mailOptions);
};
module.exports = sendEmail;