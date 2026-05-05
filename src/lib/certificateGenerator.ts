import jsPDF from 'jspdf';

export interface CertificateData {
  studentName: string;
  courseTitle: string;
  instructorName: string;
  issuedDate: string;
  certificateId: string;
}

// ─── Draw the professional certificate on a canvas ─────────────────────────
export async function drawCertificate(
  canvas: HTMLCanvasElement,
  data: CertificateData
): Promise<void> {
  canvas.width = 1414;   // A4 landscape @ 150 dpi
  canvas.height = 1000;

  const ctx = canvas.getContext('2d')!;
  const W = canvas.width;
  const H = canvas.height;

  // ── Background: deep navy gradient ────────────────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0,   '#0f0c29');
  bgGrad.addColorStop(0.5, '#1a1a2e');
  bgGrad.addColorStop(1,   '#16213e');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // ── Decorative radial glow (top-left) ─────────────────────────────────────
  const glow1 = ctx.createRadialGradient(0, 0, 0, 0, 0, 600);
  glow1.addColorStop(0, 'rgba(99,102,241,0.25)');
  glow1.addColorStop(1, 'transparent');
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, W, H);

  // ── Decorative radial glow (bottom-right) ─────────────────────────────────
  const glow2 = ctx.createRadialGradient(W, H, 0, W, H, 700);
  glow2.addColorStop(0, 'rgba(139,92,246,0.20)');
  glow2.addColorStop(1, 'transparent');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, H);

  // ── Outer border (golden) ─────────────────────────────────────────────────
  const borderGrad = ctx.createLinearGradient(0, 0, W, H);
  borderGrad.addColorStop(0,    '#f59e0b');
  borderGrad.addColorStop(0.5,  '#fbbf24');
  borderGrad.addColorStop(1,    '#d97706');
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 8;
  roundRect(ctx, 30, 30, W - 60, H - 60, 20);
  ctx.stroke();

  // ── Inner border (thin purple) ────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(139,92,246,0.5)';
  ctx.lineWidth = 2;
  roundRect(ctx, 52, 52, W - 104, H - 104, 14);
  ctx.stroke();

  // ── Corner ornaments ──────────────────────────────────────────────────────
  drawCornerOrnament(ctx, 30,      30,      0);
  drawCornerOrnament(ctx, W - 30,  30,      Math.PI / 2);
  drawCornerOrnament(ctx, W - 30,  H - 30,  Math.PI);
  drawCornerOrnament(ctx, 30,      H - 30, -Math.PI / 2);

  // ── Top decorative line ────────────────────────────────────────────────────
  const lineGrad = ctx.createLinearGradient(200, 0, W - 200, 0);
  lineGrad.addColorStop(0,   'transparent');
  lineGrad.addColorStop(0.2, 'rgba(251,191,36,0.7)');
  lineGrad.addColorStop(0.8, 'rgba(251,191,36,0.7)');
  lineGrad.addColorStop(1,   'transparent');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(200, 145);
  ctx.lineTo(W - 200, 145);
  ctx.stroke();

  // ── Brand / Logo area ─────────────────────────────────────────────────────
  // Logo circle
  const logoX = W / 2;
  const logoY = 108;
  const logoR = 38;
  const logoCircleGrad = ctx.createRadialGradient(logoX, logoY, 0, logoX, logoY, logoR);
  logoCircleGrad.addColorStop(0, '#6366f1');
  logoCircleGrad.addColorStop(1, '#4f46e5');
  ctx.fillStyle = logoCircleGrad;
  ctx.beginPath();
  ctx.arc(logoX, logoY, logoR, 0, Math.PI * 2);
  ctx.fill();

  // "N" letter inside logo circle
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 38px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('N', logoX, logoY + 2);
  ctx.textBaseline = 'alphabetic';

  // Platform name
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '0.15em';
  ctx.fillText('NEURAL AKADEMİ', W / 2, 170);

  ctx.fillStyle = 'rgba(251,191,36,0.8)';
  ctx.font = '13px Georgia, serif';
  ctx.fillText('— Geleceğin Eğitim Platformu —', W / 2, 195);

  // ── Bottom decorative line ────────────────────────────────────────────────
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(200, 215);
  ctx.lineTo(W - 200, 215);
  ctx.stroke();

  // ── "BAŞARI SERTİFİKASI" title ────────────────────────────────────────────
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.font = 'bold 85px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('SERTİFİKA', W / 2 + 3, 343);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 80px Georgia, serif';
  ctx.fillText('SERTİFİKA', W / 2, 340);

  // sub label
  ctx.font = '600 18px Georgia, serif';
  ctx.fillStyle = 'rgba(251,191,36,0.9)';
  const label = 'B A Ş A R I   B E L G E S İ';
  ctx.fillText(label, W / 2, 375);

  // ── "This is to certify that" ─────────────────────────────────────────────
  ctx.fillStyle = 'rgba(203,213,225,0.85)';
  ctx.font = 'italic 18px Georgia, serif';
  ctx.fillText('Bu belge, aşağıdaki bireyin başarıyla tamamladığını onaylar:', W / 2, 430);

  // ── Student name ──────────────────────────────────────────────────────────
  // Underline bar
  const nameGrad = ctx.createLinearGradient(W / 2 - 280, 0, W / 2 + 280, 0);
  nameGrad.addColorStop(0,    'transparent');
  nameGrad.addColorStop(0.15, 'rgba(99,102,241,0.5)');
  nameGrad.addColorStop(0.85, 'rgba(99,102,241,0.5)');
  nameGrad.addColorStop(1,    'transparent');
  ctx.fillStyle = nameGrad;
  ctx.fillRect(W / 2 - 280, 478, 560, 52);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 46px Georgia, serif';
  ctx.fillText(data.studentName.toUpperCase(), W / 2, 518);

  // ── "kursunu başarıyla tamamlamıştır" ─────────────────────────────────────
  ctx.fillStyle = 'rgba(203,213,225,0.85)';
  ctx.font = 'italic 18px Georgia, serif';
  ctx.fillText('eğitimini başarıyla tamamlamıştır.', W / 2, 565);

  // ── Course title ──────────────────────────────────────────────────────────
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 30px Georgia, serif';
  // Truncate long titles
  const maxW = W - 300;
  let courseTitle = data.courseTitle;
  while (ctx.measureText(courseTitle).width > maxW && courseTitle.length > 10) {
    courseTitle = courseTitle.slice(0, -1);
  }
  if (courseTitle !== data.courseTitle) courseTitle += '...';
  ctx.fillText(`"${courseTitle}"`, W / 2, 615);

  // ── Divider ────────────────────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, 658);
  ctx.lineTo(W - 120, 658);
  ctx.stroke();

  // ── Footer: 3 columns ──────────────────────────────────────────────────────
  // Left: Instructor
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(148,163,184,0.8)';
  ctx.font = '13px Georgia, serif';
  ctx.fillText('EĞİTMEN', 260, 695);
  ctx.strokeStyle = 'rgba(99,102,241,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, 705);
  ctx.lineTo(400, 705);
  ctx.stroke();
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.fillText(data.instructorName, 260, 730);

  // Center: Official seal
  const sealX = W / 2;
  const sealY = 710;
  const sealR = 48;
  // Outer ring
  const sealGrad = ctx.createRadialGradient(sealX, sealY, sealR * 0.5, sealX, sealY, sealR);
  sealGrad.addColorStop(0, 'rgba(99,102,241,0.3)');
  sealGrad.addColorStop(1, 'rgba(99,102,241,0.1)');
  ctx.fillStyle = sealGrad;
  ctx.beginPath();
  ctx.arc(sealX, sealY, sealR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(251,191,36,0.8)';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // Inner ring
  ctx.strokeStyle = 'rgba(251,191,36,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(sealX, sealY, sealR - 10, 0, Math.PI * 2);
  ctx.stroke();
  // Star
  drawStar(ctx, sealX, sealY - 8, 5, 16, 7, '#fbbf24');
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 9px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('RESMİ', sealX, sealY + 14);
  ctx.fillText('ONAYLI', sealX, sealY + 26);

  // Right: Date & ID
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(148,163,184,0.8)';
  ctx.font = '13px Georgia, serif';
  ctx.fillText('VERİLDİĞİ TARİH', W - 260, 695);
  ctx.strokeStyle = 'rgba(99,102,241,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W - 400, 705);
  ctx.lineTo(W - 120, 705);
  ctx.stroke();
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.fillText(data.issuedDate, W - 260, 730);

  // ── Certificate ID (bottom) ────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(148,163,184,0.5)';
  ctx.font = '11px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`Sertifika No: ${data.certificateId}`, W / 2, 790);

  // ── Bottom bar ─────────────────────────────────────────────────────────────
  const bottomBarGrad = ctx.createLinearGradient(0, 820, W, 840);
  bottomBarGrad.addColorStop(0,   '#6366f1');
  bottomBarGrad.addColorStop(0.5, '#8b5cf6');
  bottomBarGrad.addColorStop(1,   '#6366f1');
  ctx.fillStyle = bottomBarGrad;
  roundRect(ctx, 30, 820, W - 60, 28, { tl: 0, tr: 0, br: 14, bl: 14 });
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Neural Akademi  •  neuralakademi.com  •  Bu sertifika dijital olarak imzalanmıştır.', W / 2, 839);
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  radius: number | { tl: number; tr: number; br: number; bl: number }
) {
  const r = typeof radius === 'number'
    ? { tl: radius, tr: radius, br: radius, bl: radius }
    : radius;
  ctx.beginPath();
  ctx.moveTo(x + r.tl, y);
  ctx.lineTo(x + w - r.tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r.tr);
  ctx.lineTo(x + w, y + h - r.br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
  ctx.lineTo(x + r.bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r.bl);
  ctx.lineTo(x, y + r.tl);
  ctx.quadraticCurveTo(x, y, x + r.tl, y);
  ctx.closePath();
}

function drawCornerOrnament(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, angle: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const g = ctx.createLinearGradient(0, 0, 60, 60);
  g.addColorStop(0, 'rgba(251,191,36,0.9)');
  g.addColorStop(1, 'rgba(251,191,36,0.2)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(60, 0);
  ctx.lineTo(0, 60);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  spikes: number,
  outerR: number, innerR: number,
  color: string
) {
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerR);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}
