/**
 * Professional HTML Email Template for Employee Check-In Confirmation
 */
const getCheckInEmailTemplate = ({ name, date, time, department }) => {
    return {
        subject: 'Check-In Successful',
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
                        background-color: #ecfdf5;
                        color: #059669;
                        border: 1px solid #a7f3d0;
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
                    }
                    .grid {
                        background-color: #f8fafc;
                        border: 1px solid #f1f5f9;
                        border-radius: 14px;
                        padding: 20px;
                        margin-bottom: 24px;
                    }
                    .row {
                        display: flex;
                        justify-content: space-between;
                        padding: 8px 0;
                        border-bottom: 1px border-dashed #e2e8f0;
                    }
                    .row:last-child {
                        border-bottom: none;
                    }
                    .label {
                        font-size: 11px;
                        font-weight: 700;
                        color: #64748b;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }
                    .value {
                        font-size: 13px;
                        font-weight: 700;
                        color: #0f172a;
                        text-align: right;
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
                    <div class="badge">Attendance Record</div>
                    <div class="header">Check-In Successful</div>
                    <p class="subtext">Hello <strong>${name || 'Employee'}</strong>, your daily attendance check-in has been logged successfully.</p>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                        <tr>
                            <td style="padding: 6px 0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Employee Name:</td>
                            <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #0f172a; text-align: right;">${name || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Department:</td>
                            <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #4f46e5; text-align: right;">${department || 'General'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Check-In Date:</td>
                            <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #0f172a; text-align: right;">${date}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Check-In Time:</td>
                            <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #059669; text-align: right;">${time}</td>
                        </tr>
                    </table>

                    <p style="font-size: 13px; color: #475569; margin: 0;">Thank you for checking in. Have a productive work day!</p>
                    
                    <div class="footer">
                        HR Management System · Automated Attendance Notification
                    </div>
                </div>
            </body>
            </html>
        `
    };
};

module.exports = {
    getCheckInEmailTemplate
};
