import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Verify required fields
    if (!body.university || !body.pocEmail || !body.sp1Name) {
      return NextResponse.json(
        { error: 'Missing required registration fields' },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();

    const rowData = [
      timestamp,
      body.pocEmail,
      body.university,
      body.address,
      body.deanName,
      body.deanEmail,
      body.pocContact,
      body.pocEmail,
      body.bonafideUrl,
      
      // Speaker 1
      body.sp1Name,
      body.sp1Course,
      body.sp1Year,
      body.sp1Contact,
      body.sp1Email,
      body.sp1Gender,
      body.sp1PhotoUrl,
      body.sp1Linkedin,

      // Speaker 2
      body.sp2Name,
      body.sp2Course,
      body.sp2Year,
      body.sp2Contact,
      body.sp2Email,
      body.sp2Gender,
      body.sp2PhotoUrl,
      body.sp2Linkedin,

      // Researcher
      body.resName,
      body.resCourse,
      body.resYear,
      body.resContact,
      body.resEmail,
      body.resGender,
      body.resPhotoUrl,
      body.resLinkedin,
    ];

    console.log('Registration Submitted:', rowData);

    return NextResponse.json(
      { success: true, message: 'Registration recorded successfully.' },
      { status: 200 }
    );
  } catch (err) {
    console.error('Registration Route Error:', err);
    return NextResponse.json(
      { error: 'Failed to process registration.' },
      { status: 500 }
    );
  }
}