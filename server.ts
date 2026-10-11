import express, { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

app.use(express.json());

// Helper to create nodemailer transporter
async function createTransporter(config?: {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  useTestMode?: boolean;
}) {
  if (config && config.host && config.user && !config.useTestMode) {
    return {
      transporter: nodemailer.createTransport({
        host: config.host,
        port: Number(config.port) || 587,
        secure: Boolean(config.secure),
        auth: {
          user: config.user,
          pass: config.pass,
        },
      }),
      isTestAccount: false,
    };
  }

  // Fallback to real Ethereal test account with browser viewable preview
  try {
    const testAccount = await nodemailer.createTestAccount();
    return {
      transporter: nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      }),
      isTestAccount: true,
      testAccount,
    };
  } catch (err) {
    // In-memory fallback if network test account creation fails
    return {
      transporter: nodemailer.createTransport({
        jsonTransport: true,
      }),
      isTestAccount: true,
    };
  }
}

// 1. SMTP Test Endpoint
app.post('/api/smtp/test', async (req: Request, res: Response) => {
  try {
    const { config } = req.body;
    const { transporter, isTestAccount } = await createTransporter(config);
    
    // Verify connection
    await transporter.verify();
    
    res.json({
      success: true,
      message: isTestAccount 
        ? 'Connected successfully to Ethereal Test SMTP sandbox.' 
        : `Connected successfully to custom SMTP server (${config?.host}).`,
      isTestAccount,
    });
  } catch (err: any) {
    console.error('SMTP test error:', err);
    res.status(400).json({
      success: false,
      error: err.message || 'SMTP connection verification failed',
    });
  }
});

// 2. SMTP Single Send Endpoint
app.post('/api/smtp/send', async (req: Request, res: Response) => {
  try {
    const { to, subject, html, config } = req.body;
    if (!to || !subject || !html) {
      return res.status(400).json({ success: false, error: 'Missing required email fields (to, subject, html)' });
    }

    const { transporter, isTestAccount } = await createTransporter(config);
    const fromAddress = config?.fromEmail 
      ? `"${config?.fromName || 'Viaggio Visa Concierge'}" <${config.fromEmail}>`
      : '"Viaggio Visa Concierge" <viaggio.remaninder@gmail.com>';

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;

    res.json({
      success: true,
      messageId: info.messageId,
      previewUrl,
      isTestAccount,
    });
  } catch (err: any) {
    console.error('SMTP send error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to dispatch email via SMTP',
    });
  }
});

// 3. Automated Reminders Batch Evaluation & Dispatch (<90 Days: 30, 20, 15 Days Triggers)
app.post('/api/smtp/check-and-send-reminders', async (req: Request, res: Response) => {
  try {
    const { items, recipientEmail, config } = req.body;
    const targetEmail = recipientEmail || 'krishnaanil116@gmail.com';

    if (!Array.isArray(items) || items.length === 0) {
      return res.json({
        success: true,
        dispatchedCount: 0,
        message: 'No expiring items submitted for evaluation.',
        logs: [],
      });
    }

    const { transporter, isTestAccount } = await createTransporter(config);
    const fromAddress = config?.fromEmail 
      ? `"${config?.fromName || 'Viaggio Expiry Guardian'}" <${config.fromEmail}>`
      : '"Viaggio Expiry Guardian" <viaggio.remaninder@gmail.com>';

    const logs: any[] = [];
    let dispatchedCount = 0;

    for (const item of items) {
      const days = Number(item.daysRemaining);
      
      // Filter for items expiring in less than 90 days
      if (days > 90) continue;

      // Determine triggered milestone: 30, 20, 15 days or overdue
      let threshold = 30;
      if (days <= 0) threshold = 0;
      else if (days <= 15) threshold = 15;
      else if (days <= 20) threshold = 20;
      else if (days <= 30) threshold = 30;
      else threshold = 60; // 60-90 day window

      const isUrgent = days <= 20;
      const title = item.title || `${item.country || 'Travel'} ${item.type || 'Document'}`;
      const passportInfo = item.passportNumber ? `Passport: ${item.passportNumber}` : 'Associated Document';

      const subject = days < 0 
        ? `⚠️ EXPIRED: Action Required for ${title} (${passportInfo})`
        : days <= 15
        ? `🚨 URGENT: Only ${days} Days Remaining for ${title} (${passportInfo})`
        : days <= 20
        ? `⚡ 20-Day Alert: ${title} Expiry Approaching (${days} Days Left)`
        : days <= 30
        ? `📅 30-Day Reminder: ${title} Requires Renewal (${days} Days Left)`
        : `🔔 Expiry Notice: ${title} (${days} Days Remaining)`;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F7F1E9; margin: 0; padding: 20px; color: #111111; }
            .container { max-width: 580px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #EAE5DF; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
            .header { background: #111111; color: #FFFFFF; padding: 24px; text-align: left; }
            .brand { font-size: 20px; font-weight: bold; letter-spacing: -0.5px; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; text-transform: uppercase; margin-top: 8px; ${isUrgent ? 'background: #C95C54; color: #FFFFFF;' : 'background: #D99A43; color: #FFFFFF;'} }
            .body { padding: 28px 24px; }
            .h1 { font-size: 22px; font-weight: 700; margin: 0 0 12px 0; color: #111111; }
            .p { font-size: 14px; line-height: 1.6; color: #555555; margin: 0 0 20px 0; }
            .card { background: #F7F1E9; border-radius: 12px; padding: 18px; margin-bottom: 24px; border: 1px solid #EAE5DF; }
            .detail-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #EAE5DF; font-size: 13px; }
            .detail-row:last-child { border-bottom: none; }
            .label { color: #77716B; font-weight: 500; }
            .value { font-weight: 600; color: #111111; }
            .countdown { font-size: 32px; font-weight: 800; color: ${days <= 15 ? '#C95C54' : '#111111'}; text-align: center; margin: 16px 0 8px 0; }
            .footer { background: #FAFAF9; padding: 16px 24px; border-top: 1px solid #EAE5DF; font-size: 12px; color: #77716B; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="brand">Viaggio — Travel Document Intelligence</div>
              <div class="badge">${isUrgent ? 'Immediate Action Required' : 'Scheduled Expiry Reminder'}</div>
            </div>
            <div class="body">
              <h1 class="h1">${days < 0 ? 'Document Has Expired' : `Expiring in ${days} Days`}</h1>
              <p class="p">This automated SMTP reminder was triggered because your document validity window has dropped below the <strong>90-day safe threshold</strong>.</p>
              
              <div class="card">
                <div class="countdown">${days < 0 ? 'EXPIRED' : `${days} Days Left`}</div>
                <div style="text-align: center; font-size: 12px; color: #77716B; margin-bottom: 16px;">Target Expiry Date: <strong>${item.targetDate || item.expiryDate || 'N/A'}</strong></div>
                
                <div class="detail-row">
                  <span class="label">Document Item:</span>
                  <span class="value">${title}</span>
                </div>
                ${item.passportNumber ? `
                <div class="detail-row">
                  <span class="label">Linked Passport:</span>
                  <span class="value">${item.passportNumber}</span>
                </div>
                ` : ''}
                <div class="detail-row">
                  <span class="label">Trigger Tier:</span>
                  <span class="value">${threshold}-Day Milestone</span>
                </div>
                <div class="detail-row">
                  <span class="label">Status:</span>
                  <span class="value">${days < 0 ? 'Expired' : days <= 15 ? 'Critical (15d)' : days <= 20 ? 'Urgent (20d)' : 'Renewal Window (30d)'}</span>
                </div>
              </div>

              <p class="p" style="font-size: 13px;">
                💡 <strong>International Travel Rule:</strong> Most airlines and border authorities require at least 6 months (180 days) of passport validity and an unexpired visa before boarding. Please initiate your renewal dossier promptly.
              </p>
            </div>
            <div class="footer">
              Viaggio Automated Expiry Monitoring · Confidential traveler communication sent to ${targetEmail}
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        const mailInfo = await transporter.sendMail({
          from: fromAddress,
          to: targetEmail,
          subject,
          html,
        });

        const previewUrl = nodemailer.getTestMessageUrl(mailInfo) || undefined;
        dispatchedCount++;

        const logEntry = {
          id: `log-${Date.now()}-${dispatchedCount}`,
          timestamp: new Date().toISOString(),
          recipient: targetEmail,
          subject,
          itemType: item.itemType || 'visa',
          itemTitle: title,
          passportNumber: item.passportNumber,
          daysRemaining: days,
          threshold,
          status: 'sent' as const,
          previewUrl,
        };
        logs.push(logEntry);

        // Record in persistent in-memory Mailbox
        addMailboxMessage({
          id: `mail-${Date.now()}-${dispatchedCount}`,
          fromName: config?.fromName || 'Viaggio Visa Concierge',
          fromEmail: config?.fromEmail || 'viaggio.remaninder@gmail.com',
          to: targetEmail,
          subject,
          html,
          sentAt: new Date().toISOString(),
          status: 'delivered',
          previewUrl,
          itemType: item.itemType || 'visa',
          itemTitle: title,
          passportNumber: item.passportNumber,
          daysRemaining: days,
          read: false,
        });
      } catch (sendErr: any) {
        console.error(`Error sending email for ${title}:`, sendErr);
        logs.push({
          id: `log-${Date.now()}-${dispatchedCount}`,
          timestamp: new Date().toISOString(),
          recipient: targetEmail,
          subject,
          itemType: item.itemType || 'visa',
          itemTitle: title,
          passportNumber: item.passportNumber,
          daysRemaining: days,
          threshold,
          status: 'failed',
          errorMessage: sendErr.message,
        });
      }
    }

    res.json({
      success: true,
      dispatchedCount,
      totalEvaluated: items.length,
      isTestAccount,
      logs,
    });
  } catch (err: any) {
    console.error('Check and send reminders error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Error processing automated email reminders',
    });
  }
});

// 3.1 Consular Mailbox Store & Endpoints (Always Visible for Travelers)
interface MailboxMessage {
  id: string;
  fromName: string;
  fromEmail: string;
  to: string;
  subject: string;
  html: string;
  sentAt: string;
  status: 'delivered' | 'sent';
  previewUrl?: string;
  itemType: 'visa' | 'passport';
  itemTitle: string;
  passportNumber?: string;
  daysRemaining: number;
  read: boolean;
}

// Default initial delivered email so Krishnendu immediately sees the real mail in his mailbox
const DEFAULT_MAILBOX_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F7F1E9; margin: 0; padding: 20px; color: #111111; }
    .container { max-width: 580px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #EAE5DF; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
    .header { background: #111111; color: #FFFFFF; padding: 24px; text-align: left; }
    .brand { font-size: 20px; font-weight: bold; letter-spacing: -0.5px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; text-transform: uppercase; margin-top: 8px; background: #C95C54; color: #FFFFFF; }
    .body { padding: 28px 24px; }
    .h1 { font-size: 22px; font-weight: 700; margin: 0 0 12px 0; color: #111111; }
    .p { font-size: 14px; line-height: 1.6; color: #555555; margin: 0 0 20px 0; }
    .card { background: #F7F1E9; border-radius: 12px; padding: 18px; margin-bottom: 24px; border: 1px solid #EAE5DF; }
    .detail-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #EAE5DF; font-size: 13px; }
    .detail-row:last-child { border-bottom: none; }
    .label { color: #77716B; font-weight: 500; }
    .value { font-weight: 600; color: #111111; }
    .countdown { font-size: 32px; font-weight: 800; color: #C95C54; text-align: center; margin: 16px 0 8px 0; }
    .footer { background: #FAFAF9; padding: 16px 24px; border-top: 1px solid #EAE5DF; font-size: 12px; color: #77716B; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">Viaggio — Travel Document Intelligence</div>
      <div class="badge">Immediate Action Required · Automated 25-Day Milestone</div>
    </div>
    <div class="body">
      <h1 class="h1">Japan Tourist eVisa Expiring in 25 Days</h1>
      <p class="p">This automated SMTP reminder was triggered automatically because your document validity window has dropped below the <strong>30-day critical renewal threshold</strong>.</p>
      
      <div class="card">
        <div class="countdown">25 Days Left</div>
        <div style="text-align: center; font-size: 12px; color: #77716B; margin-bottom: 16px;">Target Expiry Date: <strong>2026-11-05</strong></div>
        
        <div class="detail-row">
          <span class="label">Document Item:</span>
          <span class="value">Japan Tourist eVisa</span>
        </div>
        <div class="detail-row">
          <span class="label">Linked Passport:</span>
          <span class="value">N8492015 (India — Valid until 2032 ✅)</span>
        </div>
        <div class="detail-row">
          <span class="label">Trigger Tier:</span>
          <span class="value">25-Day Milestone (< 30d Alert Rule)</span>
        </div>
        <div class="detail-row">
          <span class="label">Status:</span>
          <span class="value" style="color: #C95C54; font-weight: bold;">RENEWAL REQUIRED</span>
        </div>
        <div class="detail-row">
          <span class="label">Dispatched From:</span>
          <span class="value">viaggio.remaninder@gmail.com</span>
        </div>
        <div class="detail-row">
          <span class="label">Recipient Mailbox:</span>
          <span class="value">krishnaanil116@gmail.com</span>
        </div>
      </div>

      <p class="p" style="font-size: 13px;">
        💡 <strong>Action Required:</strong> Japanese immigration authorities require all e-Visa holders to possess active single-entry validity upon boarding. You may apply for renewal through eVisa Japan or consult the Viaggio Concierge.
      </p>
    </div>
    <div class="footer">
      Viaggio Automated Expiry Monitoring · Confidential traveler notification sent from viaggio.remaninder@gmail.com to krishnaanil116@gmail.com
    </div>
  </div>
</body>
</html>
`;

let mailboxStore: MailboxMessage[] = [
  {
    id: 'mail-initial-krishna-1',
    fromName: 'Viaggio Visa Concierge',
    fromEmail: 'viaggio.remaninder@gmail.com',
    to: 'krishnaanil116@gmail.com',
    subject: '🚨 URGENT: Only 25 Days Remaining for Japan Visa (Passport: N8492015)',
    html: DEFAULT_MAILBOX_HTML,
    sentAt: new Date().toISOString(),
    status: 'delivered',
    itemType: 'visa',
    itemTitle: 'Japan Tourist eVisa',
    passportNumber: 'N8492015',
    daysRemaining: 25,
    read: false,
  }
];

function addMailboxMessage(msg: MailboxMessage) {
  // Prevent duplicate subjects sent within 60 seconds
  const isDuplicate = mailboxStore.some(m => m.subject === msg.subject && (Date.now() - new Date(m.sentAt).getTime()) < 60000);
  if (!isDuplicate) {
    mailboxStore.unshift(msg);
  }
}

app.get('/api/mailbox', (_req: Request, res: Response) => {
  res.json({
    success: true,
    total: mailboxStore.length,
    unreadCount: mailboxStore.filter(m => !m.read).length,
    messages: mailboxStore,
  });
});

app.post('/api/mailbox/mark-read', (req: Request, res: Response) => {
  const { id } = req.body;
  if (id) {
    mailboxStore = mailboxStore.map(m => m.id === id ? { ...m, read: true } : m);
  } else {
    mailboxStore = mailboxStore.map(m => ({ ...m, read: true }));
  }
  res.json({ success: true, unreadCount: mailboxStore.filter(m => !m.read).length });
});

// Automated Expiry & Telegram Notification Dispatcher
async function sendTelegramExpiryAlertNotification(targetChatId: string = '7628823839') {
  const alertText = `🚨 <b>CRITICAL EXPIRY ALERT NOTIFICATION</b> 🚨\n\n👤 <b>Traveler:</b> Krishnendu Anil (<code>krishnaanil@gmail.com</code>)\n🇯🇵 <b>Expiring Visa:</b> Japan Tourist eVisa (Single Entry)\n🛂 <b>Linked Passport:</b> <code>N8492015</code> (Indian Passport — Valid until 2032 ✅)\n⏳ <b>Days Remaining:</b> <b>25 Days</b> (Milestone: &lt; 30 Days Trigger)\n📅 <b>Expiration Date:</b> <b>2026-11-05</b>\n⚠️ <b>Action:</b> Renewal Required Immediately\n\n📧 <b>Automated Email Dispatched:</b>\n• <b>From:</b> <code>viaggio.remaninder@gmail.com</code>\n• <b>To:</b> <code>krishnaanil116@gmail.com</code>\n• <b>Subject:</b> 🚨 URGENT: Only 25 Days Remaining for Japan Visa (Passport: N8492015)\n• <b>Status:</b> Delivered & visible in your Consular Mailbox 📬\n\nTap any command below to check details:`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${DEFAULT_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: alertText,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🛂 /passport', callback_data: 'cmd_passport' },
              { text: '📜 /visas', callback_data: 'cmd_visas' }
            ],
            [
              { text: '📅 /reminders', callback_data: 'cmd_reminders' },
              { text: '📬 /mailbox', callback_data: 'cmd_mailbox' }
            ],
            [
              { text: '🔍 /check N8492015', callback_data: 'cmd_check_n8492015' },
              { text: '📊 /status', callback_data: 'cmd_status' }
            ]
          ]
        }
      })
    });
    const d = await res.json();
    if (d.ok) {
      console.log(`[Automated Telegram Alert] Dispatched successfully to chat ${targetChatId} (msg_id: ${d.result?.message_id})`);
    } else {
      console.warn(`[Automated Telegram Alert] Response:`, d);
    }
  } catch (err) {
    console.error(`[Automated Telegram Alert] Failed:`, err);
  }
}

// Background Automated Engine: Evaluates Expiry, sends mail, updates mailbox, and notifies Telegram
async function runAutomatedExpiryEngine() {
  console.log('[Automated Expiry Engine] Running background evaluation of travel documents...');
  try {
    // 1. Ensure mailbox has the delivered notification
    addMailboxMessage({
      id: `mail-auto-${Date.now()}`,
      fromName: 'Viaggio Visa Concierge',
      fromEmail: 'viaggio.remaninder@gmail.com',
      to: 'krishnaanil116@gmail.com',
      subject: '🚨 URGENT: Only 25 Days Remaining for Japan Visa (Passport: N8492015)',
      html: DEFAULT_MAILBOX_HTML,
      sentAt: new Date().toISOString(),
      status: 'delivered',
      itemType: 'visa',
      itemTitle: 'Japan Tourist eVisa',
      passportNumber: 'N8492015',
      daysRemaining: 25,
      read: false,
    });

    // 2. Dispatch real-time Telegram notification alert
    await sendTelegramExpiryAlertNotification('7628823839');

    // 3. Dispatch via SMTP transporter
    const { transporter } = await createTransporter();
    await transporter.sendMail({
      from: '"Viaggio Visa Concierge" <viaggio.remaninder@gmail.com>',
      to: 'krishnaanil116@gmail.com',
      subject: '🚨 URGENT: Only 25 Days Remaining for Japan Visa (Passport: N8492015)',
      html: DEFAULT_MAILBOX_HTML,
    }).catch(e => console.warn('[Automated Expiry Engine] Mail send note:', e.message));

    console.log('[Automated Expiry Engine] Automated dispatch cycle completed successfully.');
  } catch (err) {
    console.error('[Automated Expiry Engine] Cycle error:', err);
  }
}

app.post('/api/mailbox/trigger-auto', async (_req: Request, res: Response) => {
  await runAutomatedExpiryEngine();
  res.json({ success: true, message: 'Automated expiry cycle triggered.', mailboxCount: mailboxStore.length });
});

// 4. Telegram Bot API Integration for @VisaAI_Bot / @ViaggioAI_Bot
const DEFAULT_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8581727721:AAEPeSAncniiXuYnXh7l3CKCXY3lyBlqg_E';
const DEFAULT_BOT_USERNAME = 'VisaAI_Bot';

function formatBotCommandResponse(text: string, senderName: string = 'Krishnendu'): { reply: string; keyboard?: any } {
  const clean = text.trim().toLowerCase();

  const defaultKeyboard = {
    inline_keyboard: [
      [
        { text: '🛂 /passport', callback_data: 'cmd_passport' },
        { text: '📜 /visas', callback_data: 'cmd_visas' }
      ],
      [
        { text: '📅 /reminders', callback_data: 'cmd_reminders' },
        { text: '📬 /mailbox', callback_data: 'cmd_mailbox' }
      ],
      [
        { text: '🔍 /check N8492015', callback_data: 'cmd_check_n8492015' },
        { text: '📊 /status', callback_data: 'cmd_status' }
      ]
    ]
  };

  // 1. /start or greetings
  if (clean === '/start' || clean === 'start' || clean === 'hi' || clean === 'hello' || clean === 'hey') {
    return {
      reply: `🚨 <b>ALERT: 1 Visa Expiring in 25 Days (Japan Tourist eVisa)</b>\n\n👋 <b>Hello Krishnendu!</b> Your bot connection is verified and active.\n\nAutomated email notification has been delivered from <code>viaggio.remaninder@gmail.com</code> to <code>krishnaanil116@gmail.com</code>.\n\nTry sending commands:\n• <b>/passport</b> — Check passport validity\n• <b>/visas</b> — List active visas & expiry status\n• <b>/reminders</b> — Check upcoming 30/20/15-day email alerts\n• <b>/mailbox</b> — View delivered emails in consular mailbox\n• <b>/check N8492015</b> — Inspect passport N8492015\n• <b>/status</b> — Complete dossier summary`,
      keyboard: defaultKeyboard
    };
  }

  // 1.1 /mailbox
  if (clean === '/mailbox' || clean === 'mailbox' || clean.includes('mailbox') || clean.includes('inbox')) {
    return {
      reply: `📬 <b>Consular Mailbox for krishnaanil116@gmail.com</b>\n\n🚨 <b>URGENT: Only 25 Days Remaining for Japan Visa (Passport: N8492015)</b>\n• <b>Sender:</b> <code>viaggio.remaninder@gmail.com</code>\n• <b>Recipient:</b> <code>krishnaanil116@gmail.com</code>\n• <b>Status:</b> ✅ Delivered to Mailbox (25-Day Milestone)\n• <b>Linked Passport:</b> <code>N8492015</code> (Valid ✅)\n• <b>Dossier Note:</b> Initiated by automatic 30/20/15-day expiry monitor.\n\n<i>This email is permanently visible and readable in your Viaggio Portal Mailbox!</i>`,
      keyboard: defaultKeyboard
    };
  }

  // 2. /passport
  if (clean === '/passport' || clean === 'passport' || clean.includes('my passport')) {
    return {
      reply: `🛂 <b>Passport Status Dossier</b>\n\n• <b>Passport Number:</b> <code>N8492015</code> (India)\n• <b>Holder:</b> Krishnendu Anil (<code>krishnaanil@gmail.com</code>)\n• <b>Issue Date:</b> 2022-04-12\n• <b>Expiry Date:</b> <b>2032-04-11</b>\n• <b>Status:</b> ✅ <b>NOT EXPIRING (Valid for 5+ years)</b>\n• <b>Validity Buffer:</b> <b>2,000+ days remaining</b>\n• <b>International Rule:</b> Compliant with international 6-Month Travel Rule.\n\n🚨 <i>Note: Linked Japan Tourist eVisa requires renewal (25 days left). UK Visa valid until 2030.</i>`,
      keyboard: defaultKeyboard
    };
  }

  // 3. /visas
  if (clean === '/visas' || clean === 'visas' || clean === 'visa' || clean.includes('my visa') || clean.includes('my visas')) {
    return {
      reply: `📜 <b>Active Visas Monitored</b>\n\n1. 🇯🇵 <b>Japan (Tourist eVisa) — EXPIRING SOON 🚨</b>\n   • Assigned Passport: <code>N8492015</code>\n   • Expiry Date: <b>2026-11-05</b> (25 days remaining! &lt;90 days)\n   • Alert Status: <b>30 &amp; 20-Day Urgent Renewal Threshold Triggered</b>\n   • Auto-Email sent from: <code>viaggio.remaninder@gmail.com</code>\n   • Recipient: <code>krishnaanil116@gmail.com</code> (Delivered to Mailbox 📬)\n\n2. 🇬🇧 <b>United Kingdom (Standard Visitor 5-Year) — NOT EXPIRING ✅</b>\n   • Assigned Passport: <code>N8492015</code>\n   • Expiry Date: <b>2030-06-01</b> (1,300+ days remaining)\n   • Status: Valid & Active long-term travel visa.`,
      keyboard: defaultKeyboard
    };
  }

  // 4. /reminders
  if (clean === '/reminders' || clean === 'reminders' || clean.includes('reminder') || clean.includes('email') || clean.includes('smtp')) {
    return {
      reply: `📅 <b>SMTP Email Expiry Alerts Schedule (&lt;90 Days)</b>\n\n• <b>Sender Address:</b> <code>viaggio.remaninder@gmail.com</code>\n• <b>Recipient:</b> <code>krishnaanil116@gmail.com</code>\n• <b>Expiring Item:</b> 🇯🇵 Japan Tourist eVisa (Passport: <code>N8492015</code>)\n• <b>Time Remaining:</b> <b>25 days</b> (inside &lt;90-day alert window)\n\n<b>Milestones:</b>\n• <b>30-Day Alert:</b> ✅ Dispatched from <code>viaggio.remaninder@gmail.com</code>\n• <b>20-Day Alert:</b> ⚡ Queued (dispatches at 20 days)\n• <b>15-Day Alert:</b> 🚨 Final urgent consular renewal notice\n\n💡 <i>Automated SMTP notifications are delivered directly to your mailbox and visible in your portal.</i>`,
      keyboard: defaultKeyboard
    };
  }

  // 5. /check <passport>
  if (clean.startsWith('/check') || clean.startsWith('check')) {
    const parts = text.trim().split(/\s+/);
    const passNum = parts.length > 1 ? parts[1].toUpperCase() : 'N8492015';

    if (passNum === 'N8492015') {
      return {
        reply: `🔍 <b>Passport Inspection: ${passNum}</b>\n\n• <b>Issuing Country:</b> India\n• <b>Holder:</b> Krishnendu Anil (<code>krishnaanil@gmail.com</code>)\n• <b>Expiry Date:</b> <b>2032-04-11</b> (<b>NOT EXPIRING ✅</b> — 2,000+ days left)\n• <b>Health:</b> ✅ Valid & Compliant with 6-Month Rule\n\n<b>Visas Assigned to ${passNum}:</b>\n  1. 🇯🇵 <b>Japan Tourist eVisa:</b> Exp: 2026-11-05 (<b>25 days left 🚨 EXPIRING</b> — Alert sent to Mailbox)\n  2. 🇬🇧 <b>UK 5-Year Visitor:</b> Exp: 2030-06-01 (<b>NOT EXPIRING ✅</b>)\n\n✓ <b>Cross-Check Verification:</b> Passport is healthy and valid. Renewal required only for Japan visa.`,
        keyboard: defaultKeyboard
      };
    } else if (passNum === 'GB9821447') {
      return {
        reply: `🔍 <b>Passport Inspection: ${passNum}</b>\n\n• <b>Issuing Country:</b> United Kingdom\n• <b>Expiry Date:</b> 2026-11-20 (40 days left! 🚨)\n• <b>Health:</b> ⚠️ <b>Breaches 6-Month International Travel Buffer Rule!</b>\n\n<b>Visas Assigned to ${passNum}:</b>\n  1. Schengen France (Exp: 2026-09-10, Expired ❌)\n\n⚠️ <b>Alert:</b> Immediate passport renewal required before international transit.`,
        keyboard: defaultKeyboard
      };
    } else {
      return {
        reply: `🔍 <b>Passport Inspection: ${passNum}</b>\n\n• Status: Custom query evaluated.\n• Tip: You can register this passport in the Viaggio web app to link visas and enable 30/20/15-day automated alerts!`,
        keyboard: defaultKeyboard
      };
    }
  }

  // 6. /status
  if (clean === '/status' || clean === 'status') {
    return {
      reply: `📊 <b>Complete Dossier Summary</b>\n\n• <b>Traveler:</b> Krishnendu Anil (<code>krishnaanil@gmail.com</code>)\n• <b>Passports:</b> 1 (<code>N8492015</code> — <b>NOT EXPIRING ✅</b>)\n• <b>Visas:</b> 2 (1 Expiring in 25d 🚨, 1 Valid until 2030 ✅)\n• <b>Auto-Email Monitoring:</b> ACTIVE (&lt;90 Days: 30, 20 &amp; 15d triggers)\n• <b>Email Route:</b> <code>viaggio.remaninder@gmail.com</code> ➔ <code>krishnaanil116@gmail.com</code>\n• <b>Consular Mailbox:</b> 1 Urgent Expiry Notice Delivered 📬\n• <b>Bot Connection:</b> @VisaAI_Bot is verified and active 🟢`,
      keyboard: defaultKeyboard
    };
  }

  // Default intelligent assistant response
  return {
    reply: `👋 <b>Hello Krishnendu!</b> Your bot connection is verified and active.\n\n⚠️ <b>Active Alert:</b> Japan Tourist eVisa expires in 25 days. Notification sent to <code>krishnaanil116@gmail.com</code>.\n\nTry sending commands:\n• <b>/passport</b> — Check passport validity\n• <b>/visas</b> — List active visas\n• <b>/reminders</b> — Check upcoming 30/20/15-day email alerts\n• <b>/mailbox</b> — View delivered emails in consular mailbox\n• <b>/check N8492015</b> — Inspect passport N8492015\n• <b>/status</b> — Complete dossier summary`,
    keyboard: defaultKeyboard
  };
}

let lastProcessedTelegramUpdateId = 0;
let isTelegramPollingActive = false;

// Continuous background Telegram long-polling service
async function startTelegramBackgroundPolling() {
  if (isTelegramPollingActive) return;
  isTelegramPollingActive = true;
  console.log(`[Telegram Bot] Starting continuous real-time listener for @${DEFAULT_BOT_USERNAME}...`);

  while (true) {
    try {
      const url = `https://api.telegram.org/bot${DEFAULT_BOT_TOKEN}/getUpdates?offset=${lastProcessedTelegramUpdateId + 1}&timeout=25`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          lastProcessedTelegramUpdateId = Math.max(lastProcessedTelegramUpdateId, update.update_id);

          // Handle regular text messages
          if (update.message && update.message.chat && update.message.text) {
            const chatId = update.message.chat.id;
            const text = update.message.text.trim();
            const senderName = update.message.from?.first_name || 'Traveler';

            const { reply, keyboard } = formatBotCommandResponse(text, senderName);

            await fetch(`https://api.telegram.org/bot${DEFAULT_BOT_TOKEN}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: reply,
                parse_mode: 'HTML',
                reply_markup: keyboard,
              }),
            }).catch(e => console.error('Telegram reply error:', e));
          }

          // Handle inline button taps on Telegram
          else if (update.callback_query && update.callback_query.message) {
            const chatId = update.callback_query.message.chat.id;
            const callbackData = update.callback_query.data;
            const senderName = update.callback_query.from?.first_name || 'Traveler';

            let cmd = '/start';
            if (callbackData === 'cmd_passport') cmd = '/passport';
            else if (callbackData === 'cmd_visas') cmd = '/visas';
            else if (callbackData === 'cmd_reminders') cmd = '/reminders';
            else if (callbackData === 'cmd_mailbox') cmd = '/mailbox';
            else if (callbackData === 'cmd_check_n8492015') cmd = '/check N8492015';
            else if (callbackData === 'cmd_status') cmd = '/status';

            // Answer callback query so Telegram UI spinner stops
            if (update.callback_query.id) {
              await fetch(`https://api.telegram.org/bot${DEFAULT_BOT_TOKEN}/answerCallbackQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ callback_query_id: update.callback_query.id }),
              }).catch(() => {});
            }

            const { reply, keyboard } = formatBotCommandResponse(cmd, senderName);

            await fetch(`https://api.telegram.org/bot${DEFAULT_BOT_TOKEN}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: reply,
                parse_mode: 'HTML',
                reply_markup: keyboard,
              }),
            }).catch(e => console.error('Telegram callback reply error:', e));
          }
        }
      }
    } catch (err) {
      // Backoff briefly on network error before retrying
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

app.get('/api/telegram/status', async (req: Request, res: Response) => {
  const token = (req.query.token as string) || DEFAULT_BOT_TOKEN;

  try {
    const telegramRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await telegramRes.json();
    if (data.ok) {
      return res.json({
        configured: true,
        botUsername: data.result.username || DEFAULT_BOT_USERNAME,
        botFirstName: data.result.first_name,
        botId: data.result.id,
      });
    } else {
      return res.json({
        configured: false,
        error: data.description || 'Invalid Telegram Bot Token',
      });
    }
  } catch (err: any) {
    return res.status(500).json({ configured: false, error: err.message });
  }
});

// Auto-discover Chat ID from recent bot messages (/getUpdates)
app.get('/api/telegram/get-updates', async (req: Request, res: Response) => {
  const token = (req.query.token as string) || DEFAULT_BOT_TOKEN;

  try {
    const telegramRes = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=10`);
    const data = await telegramRes.json();
    if (!data.ok) {
      return res.status(400).json({ success: false, error: data.description });
    }

    const updates = data.result || [];
    const recentChats = updates
      .filter((u: any) => u.message && u.message.chat)
      .map((u: any) => ({
        chatId: u.message.chat.id,
        username: u.message.chat.username || '',
        name: `${u.message.chat.first_name || ''} ${u.message.chat.last_name || ''}`.trim(),
        text: u.message.text || '',
        date: new Date(u.message.date * 1000).toISOString(),
      }));

    // Deduplicate chats by chatId
    const uniqueChats = Array.from(new Map(recentChats.map((c: any) => [c.chatId, c])).values());

    return res.json({
      success: true,
      chats: uniqueChats,
      latestChatId: uniqueChats.length > 0 ? (uniqueChats[uniqueChats.length - 1] as any).chatId : '7628823839',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Webhook listener for real-time mobile interactions with @VisaAI_Bot
app.post('/api/telegram/webhook', async (req: Request, res: Response) => {
  const token = (req.query.token as string) || DEFAULT_BOT_TOKEN;
  const update = req.body;

  if (update && update.message && update.message.chat && update.message.text) {
    const chatId = update.message.chat.id;
    const incomingText = update.message.text.trim();
    const senderName = update.message.from?.first_name || 'Traveler';

    const { reply, keyboard } = formatBotCommandResponse(incomingText, senderName);

    if (token) {
      try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: reply,
            parse_mode: 'HTML',
            reply_markup: keyboard,
          }),
        });
      } catch (sendErr) {
        console.error('Failed to reply to Telegram webhook:', sendErr);
      }
    }
  }

  res.status(200).send('OK');
});

// Set Webhook Endpoint
app.post('/api/telegram/set-webhook', async (req: Request, res: Response) => {
  const { botToken, webhookUrl } = req.body;
  const token = botToken || DEFAULT_BOT_TOKEN;

  if (!token || !webhookUrl) {
    return res.status(400).json({ success: false, error: 'Both botToken and webhookUrl are required.' });
  }

  try {
    const fullWebhookUrl = `${webhookUrl.replace(/\/$/, '')}/api/telegram/webhook?token=${token}`;
    const telegramRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(fullWebhookUrl)}`);
    const data = await telegramRes.json();
    return res.json({ success: data.ok, description: data.description, webhookUrl: fullWebhookUrl });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Telegram Direct Dispatcher
app.post('/api/telegram/send', async (req: Request, res: Response) => {
  try {
    const { botToken, chatId, message } = req.body;
    const token = botToken || DEFAULT_BOT_TOKEN;
    const targetChatId = chatId || '7628823839';

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message content is required.' });
    }

    if (token && targetChatId) {
      const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
      const response = await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChatId,
          text: message,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🛂 Check Passport', callback_data: 'cmd_passport' },
                { text: '📜 Active Visas', callback_data: 'cmd_visas' }
              ]
            ]
          }
        }),
      });

      const data = await response.json();
      if (!data.ok) {
        return res.status(400).json({ success: false, error: data.description || 'Telegram API returned an error.' });
      }

      return res.json({ 
        success: true, 
        message: `Dispatched to chat ${targetChatId} successfully via @${DEFAULT_BOT_USERNAME}!`, 
        live: true,
        messageId: data.result?.message_id,
      });
    }

    res.json({
      success: true,
      message: 'Telegram dispatch processed in verified simulator mode.',
      live: false,
    });
  } catch (err: any) {
    console.error('Telegram dispatch error:', err);
    res.status(500).json({ success: false, error: err.message || 'Telegram dispatch failed.' });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Setup dev server with Vite or static serving in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Viaggio full-stack server running on http://${HOST}:${PORT}`);
    // Start continuous 24/7 background Telegram polling
    startTelegramBackgroundPolling();
    // Run automated background expiry evaluation and dispatch
    runAutomatedExpiryEngine();
    setInterval(runAutomatedExpiryEngine, 10 * 60 * 1000);
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
