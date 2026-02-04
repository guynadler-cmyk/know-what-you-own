import { Resend } from 'resend';

const resend = new Resend(process.env.replit_email_resend);

async function sendTestEmail() {
  try {
    const toAddress = process.argv[2] || 'product@restnvest.com';
    const { data, error } = await resend.emails.send({
      from: 'Know What You Own <product@restnvest.com>',
      to: toAddress,
      subject: 'Test Email from Know What You Own',
      html: '<p>Hi there!</p><p>This is a test email from <strong>Know What You Own</strong> sent via Resend.</p><p>Your email infrastructure is working!</p>'
    });
    console.log('Sending to:', toAddress);

    if (error) {
      console.error('Error sending email:', error);
      return;
    }

    console.log('Email sent successfully!');
    console.log('Email ID:', data?.id);
  } catch (err) {
    console.error('Failed to send email:', err);
  }
}

sendTestEmail();
