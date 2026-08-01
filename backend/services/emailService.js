const { Resend } = require('resend');

/**
 * Initialize Resend client dynamically using RESEND_API_KEY
 */
const getResendClient = () => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.warn('[EmailService] Warning: RESEND_API_KEY environment variable is missing.');
        return null;
    }
    return new Resend(apiKey);
};

/**
 * Base method to dispatch emails via Resend
 * @param {Object} params
 * @param {string|string[]} params.to - Target recipient email(s)
 * @param {string} params.subject - Email subject line
 * @param {string} params.html - Rendered HTML body content
 * @returns {Promise<{success: boolean, data?: object, error?: any}>}
 */
const sendEmail = async ({ to, subject, html }) => {
    try {
        if (!to) {
            return { success: false, error: 'Recipient email address (to) is required.' };
        }

        const resend = getResendClient();
        if (!resend) {
            return { success: false, error: 'Resend service is unconfigured. RESEND_API_KEY missing.' };
        }

        const fromAddress = process.env.EMAIL_FROM || 'HR Management System <onboarding@resend.dev>';
        let targetTo = Array.isArray(to) ? to : [to];

        let response = await resend.emails.send({
            from: fromAddress,
            to: targetTo,
            subject: subject || 'HR Management System Notification',
            html
        });

        // If Resend free tier sandbox blocks direct external recipient delivery
        if (response.error) {
            const errStr = JSON.stringify(response.error);
            if (errStr.includes('only send testing emails') || errStr.includes('resend.com/domains')) {
                const ownerEmail = process.env.RESEND_OWNER_EMAIL || 'abdulrehmanaleem46@gmail.com';
                console.warn(`\n⚠️ [Resend Sandbox Limitation] Resend API blocked direct delivery to "${to}".`);
                console.warn(`   Reason: Resend unverified sandbox keys only send directly to verified account owner (${ownerEmail}).`);
                console.warn(`   To send directly to external recipients, verify your domain at resend.com/domains.`);
                console.warn(`   Forwarding test notification to account owner "${ownerEmail}" so it is not lost.\n`);

                response = await resend.emails.send({
                    from: fromAddress,
                    to: [ownerEmail],
                    subject: `[Target: ${Array.isArray(to) ? to.join(', ') : to}] ${subject || 'HR Notification'}`,
                    html
                });
            }
        }

        if (response.error) {
            console.error('[EmailService Error Response]:', response.error);
            return { success: false, error: response.error.message || response.error };
        }

        console.log(`[EmailService] Email successfully sent. Email ID: ${response.data?.id}`);
        return { success: true, data: response.data };
    } catch (err) {
        console.error('[EmailService Exception]:', err.message || err);
        return { success: false, error: err.message || 'Failed to deliver email' };
    }
};

module.exports = {
    sendEmail
};
