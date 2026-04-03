import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Exec fonksiyonunu async/await ile kullanabilmek için promisify yapıyoruz
const execAsync = promisify(exec);

export async function POST() {
  try {
    // 1. OWS'nin key klasörünü bul
    const keysDir = path.join(os.homedir(), '.ows', 'keys');
    
    if (!fs.existsSync(keysDir)) {
        return NextResponse.json({ error: "Keys directory not found" }, { status: 404 });
    }

    // 2. Klasördeki json dosyalarını (aktif ajanları) bul
    const files = fs.readdirSync(keysDir).filter(f => f.endsWith('.json'));
    
    if (files.length === 0) {
        return NextResponse.json({ error: "No active agents found" }, { status: 404 });
    }

    // 3. İlk ajanın ID'sini al (Dosya adındaki .json kısmını atıyoruz)
    const keyId = files[0].replace('.json', '');

    // 4. OWS CLI komutunu çalıştırarak yetkiyi kalıcı olarak sil
    console.log(`[SYSTEM] Revoking agent with ID: ${keyId}`);
    const { stdout, stderr } = await execAsync(`ows key revoke --id ${keyId} --confirm`);

    return NextResponse.json({ 
        success: true, 
        message: `Agent ${keyId} successfully terminated.`,
        output: stdout 
    });

  } catch (error) {
    console.error("Kill Switch error:", error);
    return NextResponse.json({ error: "Failed to terminate agent" }, { status: 500 });
  }
}