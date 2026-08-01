/**
 * Simple HTML Template for SMTP Integration Testing
 */
const getTestEmailTemplate = () => {
    return {
        subject: 'HR Management System',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                        background-color: #f8fafc;
                        color: #1e293b;
                        margin: 0;
                        padding: 24px;
                    }
                    .card {
                        background-color: #ffffff;
                        border: 1px solid #e2e8f0;
                        border-radius: 16px;
                        padding: 32px;
                        max-width: 560px;
                        margin: 0 auto;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                    }
                    .header {
                        font-size: 18px;
                        font-weight: 700;
                        color: #4f46e5;
                        margin-bottom: 16px;
                    }
                    .content {
                        font-size: 14px;
                        line-height: 1.6;
                        color: #334155;
                    }
                    .footer {
                        margin-top: 24px;
                        padding-top: 16px;
                        border-top: 1px solid #f1f5f9;
                        font-size: 12px;
                        color: #94a3b8;
                    }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="header">HR Management System</div>
                    <div class="content">
                        <p>Hello,</p>
                        <p>This is a test email from the HR Management System.</p>
                        <p>If you received this email, the SMTP email integration is working successfully.</p>
                    </div>
                    <div class="footer">
                        Sent automatically by HR Management System Backend.
                    </div>
                </div>
            </body>
            </html>
        `
    };
};

module.exports = {
    getTestEmailTemplate
};
