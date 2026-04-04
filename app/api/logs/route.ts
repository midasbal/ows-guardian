import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);
export const dynamic = 'force-dynamic';

const logPath = path.join(process.cwd(), 'simulator-logs.jsonl');

export async function GET() {
  try {
    if (!fs.existsSync(logPath)) {
      return NextResponse.json({ logs: [] });
    }
    
    const fileContent = fs.readFileSync(logPath, 'utf-8');
    const logs = fileContent
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => JSON.parse(line))
      .reverse(); 

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Log read error:", error);
    return NextResponse.json({ error: "Failed to read logs" }, { status: 500 });
  }
}

export async function POST() {
  try {
    // DON'T FORGET TO PUT YOUR OWN KEY ID HERE
    const KEY_ID = "YOUR_KEY_ID_HERE"; 
    await execPromise(`ows key revoke --id ${KEY_ID} --confirm`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Revocation failed:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    if (fs.existsSync(logPath)) {
      fs.writeFileSync(logPath, ''); 
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Clear logs failed:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}