import { base44 } from '@/api/base44Client';

/**
 * Send a notification to a user
 * @param {string} userEmail - Recipient's email
 * @param {string} title - Notification title
 * @param {string} message - Notification body
 * @param {string} type - One of: booking, payment, quote, support, extra, system
 * @param {string} linkPage - Optional page name to navigate to
 * @param {string} linkId - Optional ID for the linked page
 */
export async function sendNotification({ userEmail, title, message, type = 'system', linkPage, linkId }) {
  await base44.entities.Notification.create({
    user_email: userEmail,
    title,
    message,
    type,
    is_read: false,
    link_page: linkPage || null,
    link_id: linkId || null,
  });
}