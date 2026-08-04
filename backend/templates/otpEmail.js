const getOtpEmailTemplate = ({ name, otp }) => {
    return {
        subject: `Your Password Reset OTP - HR Management System`,
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset OTP</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-color: #f8fafc;
                    margin: 0;
                    padding: 0;
                    color: #334155;
                }
                .container {
                    max-width: 600px;
                    margin: 40px auto;
                    background-color: #ffffff;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }
                .header {
                    background-color: #4f46e5;
                    padding: 30px 40px;
                    text-align: center;
                }
                .header h1 {
                    color: #ffffff;
                    margin: 0;
                    font-size: 24px;
                    font-weight: 600;
                }
                .content {
                    padding: 40px;
                }
                .content h2 {
                    color: #1e293b;
                    font-size: 20px;
                    margin-top: 0;
                }
                .content p {
                    font-size: 16px;
                    line-height: 1.6;
                    color: #475569;
                    margin: 10px 0 20px;
                }
                .otp-box {
                    background-color: #f1f5f9;
                    border: 2px dashed #cbd5e1;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                    margin: 30px 0;
                }
                .otp-code {
                    font-size: 32px;
                    font-weight: 700;
                    letter-spacing: 6px;
                    color: #4f46e5;
                    margin: 0;
                }
                .footer {
                    background-color: #f8fafc;
                    padding: 20px 40px;
                    text-align: center;
                    border-top: 1px solid #e2e8f0;
                }
                .footer p {
                    font-size: 13px;
                    color: #64748b;
                    margin: 0;
                }
                .warning {
                    font-size: 14px;
                    color: #ef4444;
                    font-weight: 600;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Reset Request</h1>
                </div>
                <div class="content">
                    <h2>Hello ${name},</h2>
                    <p>We received a request to reset the password for your HR Management System account.</p>
                    <p>Please use the following One-Time Password (OTP) to complete the process. This code will expire in <strong class="warning">3 minutes</strong>.</p>
                    
                    <div class="otp-box">
                        <p class="otp-code">${otp}</p>
                    </div>
                    
                    <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
                </div>
                <div class="footer">
                    <p>This is an automated message from the HR Management System. Please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        `
    };
};

module.exports = { getOtpEmailTemplate };
