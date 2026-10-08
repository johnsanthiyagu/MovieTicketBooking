const nodemailer = require('nodemailer');

const paymentMethodLabels = {
  demo: 'Demo',
  upi: 'UPI',
  qr: 'QR code',
  card: 'Credit/debit card',
  netbanking: 'Net banking',
  wallet: 'Digital wallet'
};

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[character]);

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Configure EMAIL_USER and EMAIL_PASS in Backend/.env to send email.');
  }
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const sendPasswordResetEmail = async (user, resetToken) => {
  const transporter = createTransporter();
  const resetUrl = new URL('/reset-password', process.env.FRONTEND_URL || 'http://localhost:5173');
  resetUrl.searchParams.set('token', resetToken);
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Reset your Lumière password',
    text: [
      `Hi ${user.name},`,
      '',
      'We received a request to reset your Lumière password.',
      `Use this link within one hour: ${resetUrl.toString()}`,
      '',
      'If you did not request a password reset, you can ignore this email.'
    ].join('\n'),
    html: `
      <div style="margin:0;padding:32px 12px;background:#11120f;font-family:Arial,sans-serif;color:#f0ebe1">
        <div style="max-width:520px;margin:0 auto;border:1px solid #39382f;background:#191a17">
          <div style="padding:28px 30px">
            <p style="margin:0 0 10px;color:#d6b879;font-size:11px;letter-spacing:3px">LUMIÈRE · ACCOUNT SECURITY</p>
            <h1 style="margin:0;color:#f0ebe1;font-family:Georgia,serif;font-size:28px;font-weight:normal">Reset your password.</h1>
            <p style="margin:14px 0 22px;color:#aaa69b;font-size:14px;line-height:1.7">Hi ${escapeHtml(user.name)}, use the button below to choose a new password. This link expires in one hour and can only be used once.</p>
            <a href="${escapeHtml(resetUrl.toString())}" style="display:inline-block;padding:14px 20px;color:#191711;background:#d2b679;font-size:12px;font-weight:bold;letter-spacing:1px;text-decoration:none">RESET PASSWORD</a>
            <p style="margin:22px 0 0;color:#898579;font-size:12px;line-height:1.6">If you did not request this change, you can ignore this email. Your password will remain unchanged.</p>
          </div>
        </div>
      </div>`
  });
};

const sendBookingEmail = async (transaction, user, movie, theater, showtime) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return false;
  }

  const transporter = createTransporter();
  const details = [
    ['Film', movie.title],
    ['Cinema', `${theater.name}, ${theater.city}`],
    ['Showtime', new Date(showtime.startsAt).toLocaleString()],
    ['Seats', transaction.seats.join(', ')],
    ['Payment method', paymentMethodLabels[transaction.paymentMethod] || 'Demo'],
    ['Amount', `${transaction.currency} ${transaction.amount.toFixed(2)}`]
  ];
  const rows = details.map(([label, value]) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #39382f;color:#aaa69b;font-size:13px">${escapeHtml(label)}</td>
      <td style="padding:12px 0;border-bottom:1px solid #39382f;color:#f0ebe1;font-size:13px;text-align:right">${escapeHtml(value)}</td>
    </tr>`).join('');
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: `Your ${movie.title} tickets — ${transaction.bookingCode}`,
    text: [
      `Hi ${user.name},`,
      '',
      `Your booking is confirmed with a simulated ${paymentMethodLabels[transaction.paymentMethod] || 'demo'} payment. No money was collected.`,
      ...details.map(([label, value]) => `${label}: ${value}`),
      `Booking code: ${transaction.bookingCode}`,
      '',
      'This is a digital ticket confirmation. Please present your booking code at the theater.'
    ].join('\n'),
    html: `
      <div style="margin:0;padding:32px 12px;background:#11120f;font-family:Arial,sans-serif;color:#f0ebe1">
        <div style="max-width:560px;margin:0 auto;border:1px solid #39382f;background:#191a17">
          <div style="padding:28px 30px;border-bottom:1px solid #39382f">
            <p style="margin:0 0 10px;color:#d6b879;font-size:11px;letter-spacing:3px">LUMIÈRE · YOUR MOVIE NIGHT</p>
            <h1 style="margin:0;color:#f0ebe1;font-family:Georgia,serif;font-size:30px;font-weight:normal">You're all set, ${escapeHtml(user.name)}.</h1>
            <p style="margin:12px 0 0;color:#aaa69b;font-size:14px;line-height:1.6">Your seats are reserved. Keep this email handy and show your booking code at the cinema.</p>
          </div>
          <div style="padding:20px 30px">
            <table role="presentation" style="width:100%;border-collapse:collapse">${rows}</table>
            <div style="margin-top:20px;padding:16px;border:1px solid #6c5b37;background:#211f19">
              <p style="margin:0 0 7px;color:#aaa69b;font-size:10px;letter-spacing:2px">BOOKING CODE</p>
              <p style="margin:0;color:#d6b879;font-family:monospace;font-size:22px;letter-spacing:2px">${escapeHtml(transaction.bookingCode)}</p>
            </div>
            <p style="margin:18px 0 0;padding:12px;color:#e2c991;background:#262217;font-size:12px;line-height:1.6"><strong>DEMO PAYMENT</strong><br>This payment was simulated using ${escapeHtml(paymentMethodLabels[transaction.paymentMethod] || 'Demo')}. No money was collected.</p>
          </div>
          <div style="padding:16px 30px;border-top:1px solid #39382f;color:#898579;font-size:11px">This is your digital ticket confirmation. Enjoy the show.</div>
        </div>
      </div>`
  });
  return true;
};

module.exports = { sendBookingEmail, sendPasswordResetEmail };
