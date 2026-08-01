/**
 * Professional Welcome Email HTML Template (Matching Check-In Email Style)
 */
const getWelcomeEmailTemplate = ({ name, email, tempPassword, loginUrl }) => {
    const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const appLoginUrl = loginUrl || `${baseUrl}/login`;

    return {
        subject: 'Welcome to HR Management System - Account Credentials',
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
                        border-radius: 20px;
                        padding: 32px;
                        max-width: 560px;
                        margin: 0 auto;
                        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.04);
                    }
                    .badge {
                        display: inline-block;
                        background-color: #e0e7ff;
                        color: #4338ca;
                        border: 1px solid #c7d2fe;
                        padding: 4px 12px;
                        border-radius: 9999px;
                        font-size: 11px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        margin-bottom: 16px;
                    }
                    .header {
                        font-size: 20px;
                        font-weight: 800;
                        color: #0f172a;
                        margin-bottom: 6px;
                    }
                    .subtext {
                        font-size: 13px;
                        color: #64748b;
                        margin-bottom: 24px;
                        line-height: 1.6;
                    }
                    .credentials-box {
                        background-color: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 14px;
                        padding: 20px;
                        margin-bottom: 20px;
                    }
                    .row-label {
                        font-size: 11px;
                        font-weight: 700;
                        color: #64748b;
                        text-transform: uppercase;
                        padding: 6px 0;
                    }
                    .row-val {
                        font-size: 13px;
                        font-weight: 700;
                        color: #0f172a;
                        text-align: right;
                        padding: 6px 0;
                    }
                    .pass-badge {
                        font-family: monospace;
                        font-size: 14px;
                        color: #4f46e5;
                        background-color: #eef2ff;
                        padding: 3px 8px;
                        border-radius: 6px;
                    }
                    .security-note {
                        background-color: #fffbeb;
                        border: 1px solid #fef3c7;
                        border-radius: 12px;
                        padding: 14px;
                        font-size: 12px;
                        color: #92400e;
                        line-height: 1.5;
                        margin-bottom: 24px;
                    }
                    .btn-container {
                        text-align: center;
                        margin: 24px 0;
                    }
                    .btn {
                        background-color: #4f46e5;
                        color: #ffffff !important;
                        text-decoration: none;
                        padding: 12px 28px;
                        border-radius: 12px;
                        font-size: 13px;
                        font-weight: 700;
                        display: inline-block;
                    }
                    .footer {
                        margin-top: 28px;
                        padding-top: 16px;
                        border-top: 1px solid #f1f5f9;
                        font-size: 12px;
                        color: #94a3b8;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="badge">Welcome Onboarding</div>
                    <div class="header">Welcome to HR Management System! 🎉</div>
                    <p class="subtext">Hello <strong>${name}</strong>,<br>Your employee account has been successfully created. Here are your initial login credentials:</p>

                    <table width="100%" cellpadding="0" cellspacing="0" class="credentials-box">
                        <tr>
                            <td class="row-label">Work Email:</td>
                            <td class="row-val">${email}</td>
                        </tr>
                        <tr>
                            <td class="row-label" style="padding-top: 8px;">Initial Password:</td>
                            <td class="row-val" style="padding-top: 8px;"><span class="pass-badge">${tempPassword}</span></td>
                        </tr>
                    </table>

                    <div class="security-note">
                        🔒 <strong>Security Note:</strong> For security reasons, please change your password immediately after your first login.
                    </div>

                    <div class="btn-container">
                        <a href="${appLoginUrl}" class="btn" target="_blank">Login to HR System</a>
                    </div>

                    <div class="footer">
                        HR Management System · Automated Credentials Notification
                    </div>
                </div>
            </body>
            </html>
        `
    };
};

module.exports = {
    getWelcomeEmailTemplate
};
