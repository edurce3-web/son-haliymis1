import jsPDF from 'jspdf';

export interface CertificateData {
  studentName: string;
  courseTitle: string;
  instructorName: string;
  issuedDate: string;
  certificateId: string;
}

// ─── Draw the professional certificate on a canvas ─────────────────────────

/**
 * Logoyu canvas'a ortalayarak çizer.
 *
 * Logo koyu turkuaz olduğu için koyu sertifika zemininde okunmaz; bu yüzden
 * beyaza çevriliyor: görsel ara bir canvas'a çizilip 'source-in' ile
 * boyanıyor. Böylece yalnızca harflerin olduğu pikseller beyaz oluyor,
 * arka plan saydam kalıyor.
 *
 * @returns başarıyla çizildiyse true
 */
async function drawLogo(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  maxW: number,
  maxH: number,
  tintColor: string
): Promise<boolean> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      // Dosya aynı kökten geldiği için CORS sorunu yok; yine de canvas'ın
      // kirlenmemesi (tainted) adına açıkça belirtiyoruz.
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('logo yüklenemedi'));
      image.src = '/logo.png';
    });

    // Oranı koruyarak sığdır
    const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;

    // Beyaza boyama için ara canvas
    const tint = document.createElement('canvas');
    tint.width = Math.max(1, Math.round(w));
    tint.height = Math.max(1, Math.round(h));
    const tctx = tint.getContext('2d');
    if (!tctx) return false;

    tctx.drawImage(img, 0, 0, tint.width, tint.height);
    tctx.globalCompositeOperation = 'source-in';
    tctx.fillStyle = tintColor;
    tctx.fillRect(0, 0, tint.width, tint.height);

    ctx.drawImage(tint, centerX - w / 2, centerY - h / 2, w, h);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sertifikayı çizer.
 *
 * Tasarım bilinçli olarak sade: beyaz zemin, tek ince çerçeve, ortada büyük
 * logo. Önceki sürümde koyu gradyan zemin, altın çerçeve, köşe süsleri, mühür
 * ve yıldızlar vardı; çıktı basıldığında hem mürekkep yiyor hem de belgeden
 * çok afişe benziyordu. Bilgi hiyerarşisi: kim (öğrenci), ne (kurs), kimden
 * (eğitmen), ne zaman ve belge numarası.
 */
export async function drawCertificate(
  canvas: HTMLCanvasElement,
  data: CertificateData
): Promise<void> {
  canvas.width = 1414;   // A4 yatay @ 150 dpi
  canvas.height = 1000;

  const ctx = canvas.getContext('2d')!;
  const W = canvas.width;
  const H = canvas.height;

  // ── Zemin ─────────────────────────────────────────────────────────────────
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // ── Çerçeve: ince dış çizgi, üstte marka renginde kalın şerit ─────────────
  ctx.fillStyle = '#175D5D';
  ctx.fillRect(0, 0, W, 14);

  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  ctx.strokeRect(48, 48, W - 96, H - 96);

  // ── Logo ──────────────────────────────────────────────────────────────────
  const logoDrawn = await drawLogo(ctx, W / 2, 190, 460, 150, '#175D5D');
  if (!logoDrawn) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#175D5D';
    ctx.font = 'bold 60px Georgia, serif';
    ctx.fillText('edurce', W / 2, 205);
  }

  ctx.textAlign = 'center';

  // ── Başlık ────────────────────────────────────────────────────────────────
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText('BAŞARI SERTİFİKASI', W / 2, 320);

  ctx.strokeStyle = '#175D5D';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 60, 345);
  ctx.lineTo(W / 2 + 60, 345);
  ctx.stroke();

  // ── Öğrenci ───────────────────────────────────────────────────────────────
  ctx.fillStyle = '#64748B';
  ctx.font = '20px Georgia, serif';
  ctx.fillText('Bu belge', W / 2, 415);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 52px Georgia, serif';
  ctx.fillText(data.studentName, W / 2, 480);

  ctx.fillStyle = '#64748B';
  ctx.font = '20px Georgia, serif';
  ctx.fillText('adlı katılımcının aşağıdaki eğitimi tamamladığını onaylar.', W / 2, 528);

  // ── Kurs adı — uzunsa iki satıra bölünüyor ───────────────────────────────
  ctx.fillStyle = '#175D5D';
  ctx.font = 'bold 34px Georgia, serif';
  const lines = wrapText(ctx, data.courseTitle, W - 340, 2);
  let y = lines.length > 1 ? 596 : 610;
  for (const line of lines) {
    ctx.fillText(line, W / 2, y);
    y += 44;
  }

  // ── Alt bilgiler: eğitmen ve tarih ───────────────────────────────────────
  const baseY = 790;

  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(240, baseY);
  ctx.lineTo(560, baseY);
  ctx.moveTo(W - 560, baseY);
  ctx.lineTo(W - 240, baseY);
  ctx.stroke();

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText(data.instructorName, 400, baseY - 16);
  ctx.fillText(data.issuedDate, W - 400, baseY - 16);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '15px Georgia, serif';
  ctx.fillText('EĞİTMEN', 400, baseY + 28);
  ctx.fillText('VERİLİŞ TARİHİ', W - 400, baseY + 28);

  // ── Belge numarası ────────────────────────────────────────────────────────
  ctx.fillStyle = '#94A3B8';
  ctx.font = '14px Georgia, serif';
  ctx.fillText(`Belge no: ${data.certificateId}  ·  edurce.com`, W / 2, H - 78);
}

/**
 * Metni verilen genişliğe sığdırır.
 *
 * Satır sayısı aşılırsa son satır üç noktayla kesiliyor; uzun kurs adları
 * sertifikanın dışına taşmasın.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);

  if (lines.length === maxLines) {
    let last = lines[maxLines - 1];
    while (last.length > 4 && ctx.measureText(`${last}…`).width > maxWidth) {
      last = last.slice(0, -1);
    }
    const consumed = lines.join(' ');
    if (consumed.length < text.length) lines[maxLines - 1] = `${last}…`;
  }

  return lines;
}

// ─── Export as PNG (download) ───────────────────────────────────────────────
export function downloadPNG(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// ─── Export as PDF (download) ───────────────────────────────────────────────
export async function downloadPDF(canvas: HTMLCanvasElement, filename: string) {
  const imgData = canvas.toDataURL('image/png');
  // A4 landscape mm: 297 x 210 — we use the canvas ratio
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  pdf.addImage(imgData, 'PNG', 0, 0, pageW, pageH);
  pdf.save(`${filename}.pdf`);
}

