import jsPDF from 'jspdf';

/** Logodaki turkuaz — belgedeki tüm vurgular bu renkten türüyor. */
const BRAND = '#175D5D';

export interface CertificateData {
  studentName: string;
  courseTitle: string;
  instructorName: string;
  /** Belgenin düzenlendiği tarih — kursun tamamlandığı gün. */
  issuedDate: string;
  certificateId: string;
  /** Toplam ders süresi, dakika. Bilinmiyorsa satır çizilmez. */
  durationMinutes?: number | null;
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
  /** Sol üst köşe — logo artık ortada değil, antetli kâğıt gibi köşede. */
  x: number,
  y: number,
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
      image.src = '/logo-wordmark.png';
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

    ctx.drawImage(tint, x, y, w, h);
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

  // ── Çerçeve ───────────────────────────────────────────────────────────────
  // Üstte kalın marka şeridi, sayfayı saran ince bir çizgi ve sol kenarda
  // şeridin devamı gibi duran dar bir sütun. Belgeye ağırlık veriyor ama
  // baskıda mürekkep yemiyor.
  ctx.fillStyle = BRAND;
  ctx.fillRect(0, 0, W, 16);
  ctx.fillRect(0, 0, 16, H);

  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(56, 56, W - 112, H - 112);

  // ── Logo — sol üstte, antetli kâğıt düzeni ───────────────────────────────
  const LEFT = 104;
  const logoDrawn = await drawLogo(ctx, LEFT, 104, 230, 62, BRAND);
  if (!logoDrawn) {
    ctx.textAlign = 'left';
    ctx.fillStyle = BRAND;
    ctx.font = 'bold 40px Georgia, serif';
    ctx.fillText('edurce', LEFT, 148);
  }

  // Logonun karşısında belge numarası — üst satır dengede dursun
  ctx.textAlign = 'right';
  ctx.fillStyle = '#94A3B8';
  ctx.font = '15px Georgia, serif';
  ctx.fillText(`BELGE NO  ${data.certificateId}`, W - LEFT, 148);

  // ── Başlık ────────────────────────────────────────────────────────────────
  ctx.textAlign = 'center';
  ctx.fillStyle = '#94A3B8';
  ctx.font = '17px Georgia, serif';
  ctx.letterSpacing = '6px';
  ctx.fillText('EDURCE ONLINE EĞİTİM PLATFORMU', W / 2, 268);
  ctx.letterSpacing = '0px';

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 50px Georgia, serif';
  ctx.fillText('BAŞARI SERTİFİKASI', W / 2, 334);

  ctx.strokeStyle = BRAND;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 54, 362);
  ctx.lineTo(W / 2 + 54, 362);
  ctx.stroke();

  // ── Öğrenci ───────────────────────────────────────────────────────────────
  ctx.fillStyle = '#64748B';
  ctx.font = '20px Georgia, serif';
  ctx.fillText('Bu belge', W / 2, 432);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 54px Georgia, serif';
  ctx.fillText(data.studentName, W / 2, 500);

  ctx.fillStyle = '#64748B';
  ctx.font = '20px Georgia, serif';
  ctx.fillText('adlı katılımcının aşağıdaki eğitimi tamamladığını onaylar.', W / 2, 548);

  // ── Kurs adı — uzunsa iki satıra bölünüyor ───────────────────────────────
  ctx.fillStyle = BRAND;
  ctx.font = 'bold 34px Georgia, serif';
  const lines = wrapText(ctx, data.courseTitle, W - 360, 2);
  let y = lines.length > 1 ? 618 : 632;
  for (const line of lines) {
    ctx.fillText(line, W / 2, y);
    y += 44;
  }

  // ── Künye: eğitmen · süre · tamamlanma tarihi ────────────────────────────
  //
  // Üç sütun eşit aralıkta. Süre bilinmiyorsa sütun düşürülüp kalan ikisi
  // yeniden ortalanıyor; boş bir "—" bırakmak belgeyi eksik gösteriyordu.
  const facts: Array<[string, string]> = [
    ['EĞİTMEN', data.instructorName],
    ...(data.durationMinutes && data.durationMinutes > 0
      ? [['EĞİTİM SÜRESİ', formatDuration(data.durationMinutes)] as [string, string]]
      : []),
    ['TAMAMLANMA TARİHİ', data.issuedDate],
  ];

  const factsY = 800;
  const span = W - 2 * 300;
  const step = facts.length > 1 ? span / (facts.length - 1) : 0;

  facts.forEach(([label, value], i) => {
    const cx = facts.length > 1 ? 300 + step * i : W / 2;

    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 150, factsY);
    ctx.lineTo(cx + 150, factsY);
    ctx.stroke();

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillText(fit(ctx, value, 296), cx, factsY - 16);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '14px Georgia, serif';
    ctx.letterSpacing = '2px';
    ctx.fillText(label, cx, factsY + 30);
    ctx.letterSpacing = '0px';
  });

  // ── Alt satır ─────────────────────────────────────────────────────────────
  ctx.fillStyle = '#94A3B8';
  ctx.font = '14px Georgia, serif';
  ctx.fillText('Bu belgenin geçerliliği edurce.com adresinden doğrulanabilir.', W / 2, H - 84);
}

/** 195 dakika -> "3 sa 15 dk" */
function formatDuration(minutes: number): string {
  const m = Math.max(1, Math.round(minutes));
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h === 0) return `${rest} dk`;
  if (rest === 0) return `${h} saat`;
  return `${h} sa ${rest} dk`;
}

/** Tek satırlık metni verilen genişliğe sığdırır; taşarsa üç noktayla keser. */
function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let out = text;
  while (out.length > 2 && ctx.measureText(`${out}…`).width > maxWidth) out = out.slice(0, -1);
  return `${out}…`;
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

