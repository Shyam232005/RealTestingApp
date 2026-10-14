import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json(
      {
        status: 'ok',
        message: 'MongoDB connected successfully',
        timestamp: new Date(),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to connect to MongoDB',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
