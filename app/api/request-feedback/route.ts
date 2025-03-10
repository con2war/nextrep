import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { name, email, requestDetails } = await request.json();

    // Send email to admin (your Gmail)
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: process.env.SUPPORT_EMAIL || 'support@nextrepai.com',
      subject: `Support Request from ${name}`,
      html: `
        <h2>New Support Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Request Details:</strong></p>
        <p>${requestDetails}</p>
        <p><strong>Submitted at:</strong> ${new Date().toLocaleString()}</p>
      `
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Support request error:', error);
    return NextResponse.json(
      { error: 'Failed to send support request' },
      { status: 500 }
    );
  }
} 