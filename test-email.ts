import { Resend } from 'resend';

const resend = new Resend(process.env.replit_email_resend);

async function sendTestEmail() {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Know What You Own <product@restnvest.com>',
      to: 'product@restnvest.com',
      subject: 'Hello World',
      html: '<p>Congrats on sending your <strong>first email</strong> from product@restnvest.com!</p>'
    });

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
