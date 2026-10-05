import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { name, email, phone, institution, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Please complete all required fields.' },
        { status: 400 }
      );
    }

    // Configure your SMTP credentials in .env.local (e.g. SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"${name}" <${process.env.SMTP_USER}>`,
      replyTo: email,
      to: 'dpiit.ipr@nludelhi.ac.in',
      subject: `[Vidhi Pragati Query] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #0A192F;">
          <h2 style="color: #8B0000; border-bottom: 2px solid #8B0000; padding-bottom: 8px;">
            New Inquiry Received — Vidhi Pragati 2027
          </h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
          <p><strong>Institution / University:</strong> ${institution || 'N/A'}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
          <h3 style="color: #0A192F;">Message / Query:</h3>
          <p style="white-space: pre-wrap; background: #FBFBFA; padding: 15px; border-radius: 8px; border: 1px solid #eee;">${message}</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Inquiry submitted successfully!' });
  } catch (error) {
    console.error('Email API Error:', error);
    return NextResponse.json(
      { error: 'Failed to send query. Please try again later.' },
      { status: 500 }
    );
  }
}