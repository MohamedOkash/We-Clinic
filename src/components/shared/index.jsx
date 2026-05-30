import { useState, useEffect, useRef } from 'react';
import { X, Inbox, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// ─── Design Tokens ────────────────────────────────────────────────────────────
export const s = {
  card: 'bg-emerald-50/75 dark:bg-emerald-950/20 backdrop-blur-2xl border border-emerald-500/10 dark:border-emerald-400/10 shadow-lg dark:shadow-[0_8px_32px_0_rgba(16,185,129,0.05)] rounded-3xl text-emerald-900 dark:text-emerald-50 transition-all duration-300 hover:shadow-xl hover:border-emerald-500/20',
  cardStatic: 'bg-emerald-50/75 dark:bg-emerald-950/20 backdrop-blur-2xl border border-emerald-500/10 dark:border-emerald-400/10 shadow-lg dark:shadow-[0_8px_32px_0_rgba(16,185,129,0.05)] rounded-3xl text-emerald-900 dark:text-emerald-50',
  inner: 'bg-emerald-100/30 dark:bg-black/40 backdrop-blur-xl border border-emerald-500/5 dark:border-emerald-400/5 shadow-sm rounded-2xl text-emerald-900 dark:text-emerald-100',
  input: 'theme-input',
  inputSm: 'theme-input-sm',
  btnPrimary: 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)] active:scale-[0.97] hover:brightness-110 transition-all duration-200 rounded-xl h-12 font-bold px-8 flex items-center justify-center gap-2 shrink-0 border border-emerald-400/20 select-none keep-text-white',
  btnAI: 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-[0_0_20px_rgba(192,132,252,0.4),inset_2px_2px_5px_rgba(255,255,255,0.3)] active:scale-[0.97] transition-all duration-200 rounded-xl h-12 font-bold px-6 flex items-center justify-center gap-2 border border-fuchsia-400/40 select-none hover:shadow-glow-purple keep-text-white',
  btnSec: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/25 shadow-sm active:scale-[0.97] hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition-all duration-200 rounded-xl h-12 font-semibold px-6 flex items-center justify-center gap-2 shrink-0 select-none',
  btnGhost: 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 active:scale-[0.97] transition-all duration-200 rounded-xl h-10 font-semibold px-4 flex items-center justify-center gap-2 shrink-0 select-none',
  btnDanger: 'bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-btn active:scale-[0.97] hover:brightness-110 transition-all duration-200 rounded-xl h-12 font-bold px-8 flex items-center justify-center gap-2 shrink-0 border border-red-400/20 select-none keep-text-white',
  badge: 'bg-emerald-100/50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-3.5 py-1 rounded-full text-xs font-bold whitespace-nowrap shrink-0 tracking-wide',
  label: 'theme-label',
};;

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({ label, icon: Icon, className, error, ...props }) {
  const base = className || s.input;
  return (
    <div className="flex flex-col gap-1.5 w-full min-w-0">
      {label && <label className={s.label}>{label}</label>}
      <div className="relative w-full">
        {Icon && (
          <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
            <Icon className="w-5 h-5 text-cyan-400/80" />
          </div>
        )}
        <input className={`${base} ${Icon ? 'ps-12 pe-4' : ''}`} {...props} />
      </div>
      {error && <p className="text-xs text-red-400 font-semibold px-1">{error}</p>}
    </div>
  );
}

// ─── Card / InnerCard ─────────────────────────────────────────────────────────
export function Card({ children, className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      className={`${onClick ? s.card : s.cardStatic} p-5 md:p-6 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function InnerCard({ children, className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      className={`${s.inner} p-4 md:p-5 ${onClick ? 'cursor-pointer hover:bg-white/[0.04] transition-colors duration-200' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ name = '?', size = 'md' }) {
  const sizes = {
    sm: 'w-10 h-10 text-sm rounded-xl',
    md: 'w-14 h-14 text-xl rounded-2xl',
    lg: 'w-20 h-20 text-3xl rounded-2xl',
  };
  return (
    <div className={`${sizes[size]} bg-gradient-to-br from-cyan-400 to-blue-700 text-white flex items-center justify-center font-black shadow-[4px_6px_15px_rgba(0,0,0,0.5),inset_2px_2px_6px_rgba(255,255,255,0.5)] shrink-0 border border-cyan-300/30 select-none`}>
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

// ─── GlassModal ───────────────────────────────────────────────────────────────
export function GlassModal({ isOpen, title, onClose, children, fullScreen = false }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl animate-fade-in">
      <div
        className={`${s.cardStatic} ${fullScreen ? 'w-full h-full max-w-none max-h-none rounded-2xl' : 'w-full max-w-2xl max-h-[90vh]'} flex flex-col animate-fade-scale border border-white/[0.1]`}
      >
        <div className="flex justify-between items-center border-b border-white/[0.08] p-5 shrink-0 bg-white/[0.02] rounded-t-3xl">
          <h3 className="font-bold text-xl text-white truncate">{title}</h3>
          <button onClick={onClose} className="p-2 bg-black/40 rounded-full hover:bg-red-500/80 text-white transition-all duration-200 shrink-0 ms-2 active:scale-90">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 md:p-6 overflow-y-auto min-h-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ className = '', variant = 'rect' }) {
  const variants = {
    rect: 'h-4 rounded-lg',
    title: 'h-6 w-3/5 rounded-lg',
    avatar: 'w-12 h-12 rounded-2xl',
    card: 'h-32 rounded-2xl',
    circle: 'w-10 h-10 rounded-full',
  };
  return <div className={`skeleton ${variants[variant]} ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className={`${s.inner} p-5 flex flex-col gap-3`}>
      <div className="flex items-center gap-4">
        <Skeleton variant="avatar" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton variant="title" />
          <Skeleton className="h-3 w-2/5 rounded" />
        </div>
      </div>
      <Skeleton className="h-3 w-full rounded" />
      <Skeleton className="h-3 w-4/5 rounded" />
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-3xl bg-slate-800/80 border border-white/[0.06] flex items-center justify-center mb-5 shadow-inner-deep">
        <Icon className="w-9 h-9 text-slate-500" />
      </div>
      <h4 className="font-bold text-lg text-slate-300 mb-2">{title}</h4>
      {description && <p className="text-sm text-slate-500 font-medium max-w-xs leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
export function AnimatedCounter({ value, duration = 800, prefix = '', suffix = '' }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const numVal = typeof value === 'number' ? value : parseInt(value) || 0;

  useEffect(() => {
    let start = 0;
    const end = numVal;
    if (end === 0) { setDisplay(0); return; }
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      setDisplay(current);
      if (progress < 1) {
        ref.current = requestAnimationFrame(animate);
      }
    };

    ref.current = requestAnimationFrame(animate);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [numVal, duration]);

  return <span className="tabular-nums">{prefix}{display.toLocaleString()}{suffix}</span>;
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({ icon: Icon, label, value, color, trend, trendLabel, prefix = '', suffix = '' }) {
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-500';
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className={`${s.inner} p-5 flex flex-col gap-3 group`}>
      <div className="flex justify-between items-start">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg border border-white/20 group-hover:scale-105 transition-transform duration-300`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold ${trendColor} bg-black/30 px-2 py-1 rounded-full`}>
            <TrendIcon className="w-3 h-3" />
            {trendLabel}
          </div>
        )}
      </div>
      <div>
        <p className="text-3xl font-black text-white animate-counter">
          <AnimatedCounter value={typeof value === 'number' ? value : parseInt(value) || 0} prefix={prefix} suffix={suffix} />
        </p>
        <p className="text-sm font-semibold text-slate-400 mt-1">{label}</p>
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between gap-4 mb-1">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && <Icon className="w-6 h-6 text-cyan-400 shrink-0" />}
        <div className="min-w-0">
          <h3 className="font-bold text-xl text-white truncate">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ─── Print Prescription ───────────────────────────────────────────────────────
export function printPrescription(rx, isAr) {
  const win = window.open('', '_blank', 'width=700,height=900');
  win.document.write(`
    <!DOCTYPE html><html dir="${isAr ? 'rtl' : 'ltr'}" lang="${isAr ? 'ar' : 'en'}">
    <head>
      <meta charset="UTF-8">
      <title>${isAr ? 'روشتة طبية' : 'Medical Prescription'}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif; background: #fff; color: #111; padding: 40px; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0891b2; padding-bottom: 20px; margin-bottom: 24px; }
        .logo { font-size: 28px; font-weight: 900; color: #0891b2; }
        .info { font-size: 13px; color: #555; text-align: ${isAr ? 'left' : 'right'}; line-height: 1.8; }
        .patient { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
        .patient h3 { font-size: 18px; font-weight: 700; color: #0369a1; margin-bottom: 6px; }
        .patient p { font-size: 13px; color: #555; }
        .drugs h3 { font-size: 16px; font-weight: 700; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
        .drug { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; border-bottom: 1px dashed #e2e8f0; }
        .drug-num { width: 28px; height: 28px; background: #0891b2; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; flex-shrink: 0; margin-top: 2px; }
        .drug-name { font-weight: 700; font-size: 16px; }
        .drug-detail { font-size: 12px; color: #666; margin-top: 4px; }
        .sig { display: inline-block; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; border-radius: 6px; padding: 2px 8px; margin-top: 4px; font-weight: 600; }
        .footer { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
        .stamp { width: 100px; height: 100px; border: 2px dashed #ccc; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #ccc; font-size: 12px; }
        .sign { border-top: 1px solid #333; width: 180px; text-align: center; padding-top: 8px; font-size: 13px; color: #555; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🏥 ${isAr ? 'عيادتنا 3D' : 'Our Clinic 3D'}</div>
        <div class="info">
          <div>${isAr ? 'طبيب:' : 'Doctor:'} ${rx.doctor}</div>
          <div>${isAr ? 'التخصص:' : 'Specialty:'} ${rx.specialty}</div>
          <div>${isAr ? 'التاريخ:' : 'Date:'} ${rx.date}</div>
          <div>${isAr ? 'رقم الروشتة:' : 'Rx No:'} ${rx.id}</div>
        </div>
      </div>
      <div class="patient">
        <h3>${isAr ? 'بيانات المريض' : 'Patient Information'}</h3>
        <p>${isAr ? 'الاسم:' : 'Name:'} <strong>${isAr ? rx.patientNameAr : rx.patientName}</strong></p>
      </div>
      <div class="drugs">
        <h3>${isAr ? 'الأدوية الموصوفة' : 'Prescribed Medications'}</h3>
        ${rx.drugs.map((d, i) => `
          <div class="drug">
            <div class="drug-num">${i + 1}</div>
            <div>
              <div class="drug-name">${d.name}</div>
              <div class="drug-detail">${d.desc || ''}</div>
              ${d.dosage ? `<span class="sig">${d.dosage} — ${d.frequency || ''} — ${d.duration || ''}</span>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
      <div class="footer">
        <div class="stamp">${isAr ? 'الختم' : 'Stamp'}</div>
        <div class="sign">${isAr ? 'توقيع الطبيب' : 'Doctor Signature'}</div>
      </div>
      <script>window.onload = () => { window.print(); }</script>
    </body></html>
  `);
  win.document.close();
}

// ─── Print Receipt ────────────────────────────────────────────────────────────
export function printReceipt(inv, isAr) {
  const win = window.open('', '_blank', 'width=500,height=700');
  
  let headerTitle = isAr ? 'إيصال دفع صيدلية' : 'Pharmacy Receipt';
  if (inv.source === 'consultation') {
    headerTitle = isAr ? 'إيصال دفع كشف طبي' : 'Medical Consultation Receipt';
  } else if (inv.source === 'lab_order') {
    headerTitle = isAr ? 'إيصال دفع أشعة وتحاليل' : 'Laboratory & Radiology Receipt';
  }

  const paymentMethodLabel = {
    cash: isAr ? 'نقداً' : 'Cash',
    card: isAr ? 'بطاقة ائتمانية' : 'Credit Card',
    wallet: isAr ? 'محفظة إلكترونية' : 'Digital Wallet'
  }[inv.paymentMethod] || (isAr ? 'نقداً' : 'Cash');

  win.document.write(`
    <!DOCTYPE html><html dir="${isAr ? 'rtl' : 'ltr'}" lang="${isAr ? 'ar' : 'en'}">
    <head>
      <meta charset="UTF-8">
      <title>${isAr ? 'إيصال الدفع' : 'Receipt'}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Cairo', 'Inter', sans-serif; background: #fff; color: #000; padding: 25px; width: 100%; max-width: 450px; margin: 0 auto; }
        .receipt-header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 15px; margin-bottom: 15px; }
        .logo { font-size: 22px; font-weight: 900; color: #000; }
        .sub-logo { font-size: 14px; font-weight: 700; color: #444; margin-top: 5px; }
        .meta-info { font-size: 12px; margin-top: 8px; line-height: 1.5; color: #333; text-align: start; }
        .item-table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px; }
        .item-table th { border-bottom: 1px solid #000; padding: 6px 0; text-align: start; font-weight: 700; }
        .item-table td { padding: 8px 0; border-bottom: 1px dashed #eee; }
        .text-end { text-align: end !important; }
        .receipt-total { border-top: 2px dashed #000; padding-top: 10px; margin-top: 10px; }
        .total-row { display: flex; justify-content: space-between; font-weight: 900; font-size: 16px; padding: 4px 0; }
        .meta-row { display: flex; justify-content: space-between; font-size: 12px; color: #555; padding: 2px 0; }
        .footer-note { text-align: center; font-size: 11px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; color: #666; }
        @media print {
          body { padding: 10px; }
        }
      </style>
    </head>
    <body>
      <div class="receipt-header">
        <div class="logo">🏥 ${isAr ? 'عيادتنا 3D' : 'Our Clinic 3D'}</div>
        <div class="sub-logo">${headerTitle}</div>
        <div class="meta-info">
          <div><strong>${isAr ? 'رقم الإيصال:' : 'Receipt No:'}</strong> #${inv.id}</div>
          <div><strong>${isAr ? 'التاريخ:' : 'Date:'}</strong> ${inv.date} ${inv.time || ''}</div>
          <div><strong>${isAr ? 'العميل/المريض:' : 'Customer/Patient:'}</strong> ${isAr ? inv.patientNameAr : inv.patientName}</div>
        </div>
      </div>
      <table class="item-table">
        <thead>
          <tr>
            <th>${isAr ? 'الصنف/الخدمة' : 'Item/Service'}</th>
            <th class="text-end" style="width: 50px;">${isAr ? 'الكمية' : 'Qty'}</th>
            <th class="text-end" style="width: 80px;">${isAr ? 'السعر' : 'Price'}</th>
            <th class="text-end" style="width: 90px;">${isAr ? 'الإجمالي' : 'Total'}</th>
          </tr>
        </thead>
        <tbody>
          ${inv.items.map(item => `
            <tr>
              <td>
                <div><strong>${item.name}</strong></div>
                ${item.dosage ? `<div style="font-size: 11px; color:#555;">${item.dosage}</div>` : ''}
              </td>
              <td class="text-end">${item.qty || 1}</td>
              <td class="text-end">${item.price || 0}</td>
              <td class="text-end">${(item.price || 0) * (item.qty || 1)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="receipt-total">
        <div class="meta-row">
          <span>${isAr ? 'طريقة الدفع:' : 'Payment Method:'}</span>
          <span>${paymentMethodLabel}</span>
        </div>
        <div class="meta-row">
          <span>${isAr ? 'حالة الفاتورة:' : 'Status:'}</span>
          <strong>${inv.status === 'Paid' ? (isAr ? 'مدفوعة' : 'Paid') : (isAr ? 'غير مدفوعة' : 'Unpaid')}</strong>
        </div>
        <div class="total-row">
          <span>${isAr ? 'الإجمالي الكلي:' : 'Grand Total:'}</span>
          <span>${inv.total} ${isAr ? 'ج.م' : 'EGP'}</span>
        </div>
      </div>
      <div class="footer-note">
        <p>${isAr ? 'شكرًا لتعاملكم معنا ونتمنى لكم الشفاء العاجل' : 'Thank you for your visit, we wish you a speedy recovery!'}</p>
        <p>${isAr ? 'نظام عيادتنا إدارة موزع مستقل' : 'Powered by 3D Clinic System'}</p>
      </div>
      <script>window.onload = () => { window.print(); }</script>
    </body></html>
  `);
  win.document.close();
}

// ─── Print Referral Letter ───────────────────────────────────────────────────
export function printReferralLetter(ref, isAr) {
  const win = window.open('', '_blank', 'width=700,height=900');
  win.document.write(`
    <!DOCTYPE html><html dir="${isAr ? 'rtl' : 'ltr'}" lang="${isAr ? 'ar' : 'en'}">
    <head>
      <meta charset="UTF-8">
      <title>${isAr ? 'خطاب تحويل طبي رسمي' : 'Official Medical Referral Letter'}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Cairo', 'Inter', sans-serif; background: #fff; color: #111; padding: 40px; }
        .letter-header { border-bottom: 3px double #0891b2; padding-bottom: 20px; margin-bottom: 25px; }
        .logo { font-size: 26px; font-weight: 900; color: #0891b2; display: flex; align-items: center; gap: 8px; }
        .title { font-size: 20px; font-weight: 900; color: #334155; margin-top: 10px; text-transform: uppercase; letter-spacing: 1px; }
        .meta-info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0; padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 14px; }
        .meta-group { display: flex; flex-direction: column; gap: 4px; }
        .meta-label { font-weight: 700; color: #64748b; font-size: 12px; text-transform: uppercase; }
        .meta-value { font-weight: 700; color: #1e293b; }
        .section-title { font-size: 16px; font-weight: 900; color: #0891b2; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin: 25px 0 12px 0; }
        .content-box { font-size: 14px; line-height: 1.8; color: #334155; padding: 15px; background: #fff; border: 1px dashed #cbd5e1; border-radius: 8px; min-height: 100px; }
        .footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; }
        .signature-line { border-top: 1px solid #475569; width: 200px; text-align: center; padding-top: 8px; font-size: 13px; font-weight: 700; color: #475569; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="letter-header">
        <div class="logo">🏥 ${isAr ? 'عيادتنا 3D' : 'Our Clinic 3D'}</div>
        <div class="title">${isAr ? 'خطاب تحويل طبي رسمي' : 'Medical Referral Letter'}</div>
      </div>
      
      <div class="meta-info">
        <div class="meta-group">
          <span class="meta-label">${isAr ? 'تاريخ التحويل:' : 'Referral Date:'}</span>
          <span class="meta-value">${ref.date}</span>
        </div>
        <div class="meta-group">
          <span class="meta-label">${isAr ? 'الطبيب المحيل:' : 'Referring Doctor:'}</span>
          <span class="meta-value">${ref.doctor}</span>
        </div>
        <div class="meta-group">
          <span class="meta-label">${isAr ? 'التخصص المحيل:' : 'Referring Specialty:'}</span>
          <span class="meta-value">${ref.specialty}</span>
        </div>
        <div class="meta-group">
          <span class="meta-label">${isAr ? 'المريض:' : 'Patient:'}</span>
          <span class="meta-value">${isAr ? ref.patientNameAr : ref.patientName}</span>
        </div>
        <div class="meta-group" style="grid-column: span 2;">
          <span class="meta-label">${isAr ? 'الجهة المحال إليها:' : 'Referred To:'}</span>
          <span class="meta-value" style="color: #0891b2; font-size: 16px;">${isAr ? ref.targetOrgNameAr : ref.targetOrgName}</span>
        </div>
      </div>

      <div class="section-title">${isAr ? 'التشخيص المبدئي والترميز الطبي' : 'Initial Diagnosis & ICD Code'}</div>
      <div class="content-box">
        <strong>${ref.diagnosis || (isAr ? 'غير محدد' : 'Not specified')}</strong>
      </div>

      <div class="section-title">${isAr ? 'الشكوى السريرية وسبب التحويل' : 'Clinical Complaint & Referral Notes'}</div>
      <div class="content-box" style="white-space: pre-line;">
        ${ref.notes || (isAr ? 'لا توجد ملاحظات إضافية' : 'No additional notes provided.')}
      </div>

      <div class="footer">
        <div>
          <div style="font-size: 12px; color: #64748b; margin-bottom: 5px;">${isAr ? 'ختم المنشأة:' : 'Organization Stamp:'}</div>
          <div style="width: 110px; height: 110px; border: 2px dashed #cbd5e1; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 12px; font-weight: 700;">${isAr ? 'الختم الرسمي' : 'Official Stamp'}</div>
        </div>
        <div>
          <div class="signature-line">${isAr ? 'توقيع الطبيب المحيل' : 'Referring Doctor Signature'}</div>
        </div>
      </div>
      
      <script>window.onload = () => { window.print(); }</script>
    </body></html>
  `);
  win.document.close();
}

// ─── Print Medical Report ────────────────────────────────────────────────────
export function printMedicalReport(visit, patient, isAr) {
  const win = window.open('', '_blank', 'width=800,height=1000');
  
  // Format SOAP notes
  const soapNotes = visit.notes || '';
  let subjective = '', objective = '', assessment = '', plan = '';
  
  if (soapNotes.includes('Subjective') || soapNotes.includes('الشكوى')) {
    const lines = soapNotes.split('\n');
    lines.forEach(line => {
      if (line.startsWith('Subjective') || line.startsWith('S -')) subjective = line.replace(/^(Subjective \(الشكوى\): |S - Subjective \(History & Complaints\): )/, '');
      else if (line.startsWith('Objective') || line.startsWith('O -')) objective = line.replace(/^(Objective \(الفحص\): |O - Objective \(Physical Exam & Vitals\): )/, '');
      else if (line.startsWith('Assessment') || line.startsWith('A -')) assessment = line.replace(/^(Assessment \(التقييم\): |A - Assessment \(Differential Diagnosis\): )/, '');
      else if (line.startsWith('Plan') || line.startsWith('P -')) plan = line.replace(/^(Plan \(الخطة\): |P - Plan \(Treatment & Follow-up\): )/, '');
    });
  } else {
    subjective = soapNotes;
  }

  const vitalsHtml = visit.vitals ? `
    <div class="vitals-grid">
      <div class="vital-item">
        <span class="vital-label">${isAr ? 'ضغط الدم (BP)' : 'Blood Pressure'}</span>
        <span class="vital-val">${visit.vitals.bp || 'N/A'}</span>
      </div>
      <div class="vital-item">
        <span class="vital-label">${isAr ? 'النبض (HR)' : 'Heart Rate'}</span>
        <span class="vital-val">${visit.vitals.hr || 'N/A'} bpm</span>
      </div>
      <div class="vital-item">
        <span class="vital-label">${isAr ? 'درجة الحرارة (Temp)' : 'Temperature'}</span>
        <span class="vital-val">${visit.vitals.temp || 'N/A'} °C</span>
      </div>
      <div class="vital-item">
        <span class="vital-label">${isAr ? 'الأكسجين (SpO2)' : 'Oxygen Sat.'}</span>
        <span class="vital-val">${visit.vitals.spo2 || 'N/A'}</span>
      </div>
    </div>
  ` : '';

  const diagnosisHtml = visit.diagnosis && visit.diagnosis.length > 0 ? `
    <div class="section-title">${isAr ? 'التشخيص الطبي والترميز (ICD-10)' : 'Medical Diagnosis & Coding (ICD-10)'}</div>
    <div class="content-box">
      ${visit.diagnosis.map(d => `
        <div style="margin-bottom: 6px; font-weight: 700;">
          <span style="color: #0891b2; margin-inline-end: 8px;">[${d.code}]</span>
          <span>${isAr ? d.desc_ar || d.desc : d.desc}</span>
        </div>
      `).join('')}
    </div>
  ` : '';

  const soapHtml = `
    <div class="section-title">${isAr ? 'الفحص والتوصيات الطبية (SOAP)' : 'Clinical Documentation (SOAP)'}</div>
    <div class="soap-grid">
      ${subjective ? `
        <div class="soap-item">
          <div class="soap-label">${isAr ? 'الشكوى والأعراض (Subjective)' : 'Subjective (Complaints)'}</div>
          <div class="soap-val">${subjective}</div>
        </div>
      ` : ''}
      ${objective ? `
        <div class="soap-item">
          <div class="soap-label">${isAr ? 'ملاحظات الفحص والقياس (Objective)' : 'Objective (Physical Exam)'}</div>
          <div class="soap-val">${objective}</div>
        </div>
      ` : ''}
      ${assessment ? `
        <div class="soap-item">
          <div class="soap-label">${isAr ? 'التقييم والتحليل الطبي (Assessment)' : 'Assessment (Clinical Opinion)'}</div>
          <div class="soap-val">${assessment}</div>
        </div>
      ` : ''}
      ${plan ? `
        <div class="soap-item">
          <div class="soap-label">${isAr ? 'الخطة العلاجية والتوجيهات (Plan)' : 'Plan (Treatment & Advice)'}</div>
          <div class="soap-val">${plan}</div>
        </div>
      ` : ''}
    </div>
  `;

  win.document.write(`
    <!DOCTYPE html><html dir="${isAr ? 'rtl' : 'ltr'}" lang="${isAr ? 'ar' : 'en'}">
    <head>
      <meta charset="UTF-8">
      <title>${isAr ? 'التقرير الطبي للزيارة' : 'Visit Medical Report'}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Cairo', 'Inter', sans-serif; background: #fff; color: #1e293b; padding: 40px; }
        .report-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px double #0891b2; padding-bottom: 20px; margin-bottom: 25px; }
        .logo { font-size: 26px; font-weight: 900; color: #0891b2; }
        .title { font-size: 20px; font-weight: 900; color: #334155; margin-top: 10px; text-transform: uppercase; letter-spacing: 1px; }
        .clinic-info { text-align: ${isAr ? 'left' : 'right'}; font-size: 13px; color: #64748b; line-height: 1.6; }
        .patient-card { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; font-size: 14px; }
        .meta-group { display: flex; flex-direction: column; gap: 4px; }
        .meta-label { font-weight: 700; color: #64748b; font-size: 11px; text-transform: uppercase; }
        .meta-value { font-weight: 700; color: #1e293b; }
        .section-title { font-size: 16px; font-weight: 900; color: #0891b2; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin: 25px 0 12px 0; }
        .vitals-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
        .vital-item { background: #f0fdfa; border: 1px solid #ccfbf1; padding: 12px; border-radius: 12px; text-align: center; }
        .vital-label { display: block; font-size: 11px; font-weight: 700; color: #0f766e; margin-bottom: 4px; }
        .vital-val { font-size: 18px; font-weight: 950; color: #115e59; }
        .content-box { font-size: 14px; line-height: 1.8; color: #334155; padding: 15px; background: #fff; border: 1px dashed #cbd5e1; border-radius: 12px; }
        .soap-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
        .soap-item { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; }
        .soap-label { font-weight: 900; font-size: 13px; color: #0891b2; margin-bottom: 6px; }
        .soap-val { font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-line; }
        .footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; page-break-inside: avoid; }
        .stamp-box { width: 110px; height: 110px; border: 2px dashed #cbd5e1; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 11px; font-weight: 700; }
        .signature-line { border-top: 1px solid #475569; width: 200px; text-align: center; padding-top: 8px; font-size: 13px; font-weight: 700; color: #475569; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="report-header">
        <div>
          <div class="logo">🏥 ${isAr ? 'عيادتنا 3D' : 'Our Clinic 3D'}</div>
          <div class="title">${isAr ? 'التقرير الطبي المعتمد للزيارة' : 'Official Consultation Report'}</div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; margin: 0 10px;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=WE-CLINIC-VISIT-${visit.id || Date.now()}" width="70" height="70" style="border: 1px solid #e2e8f0; padding: 2px; border-radius: 6px;" />
          <span style="font-size: 8px; color: #94a3b8; margin-top: 4px; font-family: monospace;">VISIT-${visit.id || 'NEW'}</span>
        </div>
        <div class="clinic-info">
          <div><strong>${isAr ? 'العيادة:' : 'Clinic:'}</strong> ${visit.doctor}</div>
          <div><strong>${isAr ? 'التخصص:' : 'Specialty:'}</strong> ${visit.specialty}</div>
          <div><strong>${isAr ? 'تاريخ التقرير:' : 'Report Date:'}</strong> ${visit.date}</div>
        </div>
      </div>

      <div class="patient-card">
        <div class="meta-group">
          <span class="meta-label">${isAr ? 'اسم المريض:' : 'Patient Name:'}</span>
          <span class="meta-value" style="font-size: 16px; color: #0891b2;">${isAr ? patient.nameAr || patient.name : patient.name}</span>
        </div>
        <div class="meta-group">
          <span class="meta-label">${isAr ? 'رقم الهاتف:' : 'Phone Number:'}</span>
          <span class="meta-value">${patient.phone || 'N/A'}</span>
        </div>
        <div class="meta-group">
          <span class="meta-label">${isAr ? 'الرقم القومي:' : 'National ID:'}</span>
          <span class="meta-value">${patient.nationalId || (isAr ? 'غير مسجل' : 'Not specified')}</span>
        </div>
        <div class="meta-group">
          <span class="meta-label">${isAr ? 'تاريخ الميلاد / الجنس:' : 'DOB / Gender:'}</span>
          <span class="meta-value">${patient.dob || 'N/A'} • ${patient.gender === 'female' ? (isAr ? 'أنثى' : 'Female') : (isAr ? 'ذكر' : 'Male')}</span>
        </div>
      </div>

      ${vitalsHtml}

      ${diagnosisHtml}

      ${soapHtml}

      <div class="footer">
        <div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 5px; font-weight: 700;">${isAr ? 'ختم المنشأة الطبي:' : 'Medical Stamp:'}</div>
          <div class="stamp-box">${isAr ? 'الختم الرسمي' : 'Official Stamp'}</div>
        </div>
        <div>
          <div class="signature-line">${isAr ? 'توقيع الطبيب المعالج' : 'Attending Physician Signature'}</div>
        </div>
      </div>

      <script>window.onload = () => { window.print(); }</script>
    </body></html>
  `);
  win.document.close();
}

// ─── Export Complete Medical History ─────────────────────────────────────────
export function exportCompleteMedicalHistory(record, patient, isAr) {
  const win = window.open('', '_blank', 'width=900,height=1000');
  
  const chronicHtml = record.chronicDiseases && record.chronicDiseases.length > 0 ? `
    <div class="section-title">${isAr ? 'الأمراض المزمنة المسجلة' : 'Chronic Medical Conditions'}</div>
    <div class="tag-container">
      ${record.chronicDiseases.map(d => {
        const code = typeof d === 'object' ? d.code : d;
        const name = typeof d === 'object' ? (isAr ? d.ar || d.en : d.en) : d;
        return `<span class="tag tag-danger">${code}: ${name}</span>`;
      }).join('')}
    </div>
  ` : `<p style="font-size:13px; color:#64748b;">${isAr ? 'لا توجد أمراض مزمنة مسجلة.' : 'No chronic conditions recorded.'}</p>`;

  const allergiesHtml = record.allergies && record.allergies.length > 0 ? `
    <div class="section-title">${isAr ? 'الحساسية والمحاذير الطبية' : 'Allergies & Medical Alerts'}</div>
    <div class="tag-container">
      ${record.allergies.map(a => {
        const name = typeof a === 'object' ? a.name : a;
        const severity = typeof a === 'object' && a.severity ? ` (${isAr ? (a.severity === 'Severe' ? 'شديدة' : 'خفيفة') : a.severity})` : '';
        return `<span class="tag tag-warning">${name}${severity}</span>`;
      }).join('')}
    </div>
  ` : `<p style="font-size:13px; color:#64748b;">${isAr ? 'لا توجد حساسية دوائية مسجلة.' : 'No drug allergies recorded.'}</p>`;

  const visitsHtml = record.visits && record.visits.length > 0 ? `
    <div class="section-title">${isAr ? 'الخط الزمني لكافة الزيارات السريرية' : 'Clinical Consultations Timeline'}</div>
    ${record.visits.map((v, i) => {
      const vitalsSummary = v.vitals ? `
        <div class="visit-vitals">
          <span><strong>BP:</strong> ${v.vitals.bp || 'N/A'}</span> | 
          <span><strong>HR:</strong> ${v.vitals.hr || 'N/A'} bpm</span> | 
          <span><strong>Temp:</strong> ${v.vitals.temp || 'N/A'} °C</span> | 
          <span><strong>SpO2:</strong> ${v.vitals.spo2 || 'N/A'}</span>
        </div>
      ` : '';

      const diags = v.diagnosis && v.diagnosis.length > 0 ? `
        <div style="margin-top:8px;">
          <strong>${isAr ? 'التشخيص:' : 'Diagnosis:'}</strong>
          ${v.diagnosis.map(d => `<span style="font-size:12px; background:#f0f9ff; color:#0369a1; padding:2px 6px; border-radius:4px; margin-inline-start:6px; font-weight:700;">${d.code} - ${isAr ? d.desc_ar || d.desc : d.desc}</span>`).join('')}
        </div>
      ` : '';

      return `
        <div class="visit-card">
          <div class="visit-header">
            <span class="visit-num">#${record.visits.length - i}</span>
            <span class="visit-date">${v.date}</span>
            <span class="visit-doc">${v.doctor} (${v.specialty})</span>
          </div>
          ${vitalsSummary}
          ${v.chiefComplaint ? `<div style="margin-top:8px;"><strong>${isAr ? 'الشكوى:' : 'Chief Complaint:'}</strong> ${isAr ? v.chiefComplaintAr || v.chiefComplaint : v.chiefComplaint}</div>` : ''}
          ${diags}
          ${v.notes ? `<div style="margin-top:10px; font-style:italic; white-space:pre-line; color:#475569; border-inline-start:3px solid #cbd5e1; padding-inline-start:10px;">${v.notes}</div>` : ''}
        </div>
      `;
    }).join('')}
  ` : `<p style="font-size:14px; text-align:center; color:#64748b; padding:20px;">${isAr ? 'لا توجد أي زيارات سريرية مسجلة.' : 'No visits recorded yet.'}</p>`;

  win.document.write(`
    <!DOCTYPE html><html dir="${isAr ? 'rtl' : 'ltr'}" lang="${isAr ? 'ar' : 'en'}">
    <head>
      <meta charset="UTF-8">
      <title>${isAr ? 'السجل الطبي الكامل للمريض' : 'Complete Medical History Record'}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Cairo', 'Inter', sans-serif; background: #fff; color: #1e293b; padding: 40px; }
        .report-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px double #0891b2; padding-bottom: 20px; margin-bottom: 25px; }
        .logo { font-size: 26px; font-weight: 900; color: #0891b2; }
        .title { font-size: 20px; font-weight: 900; color: #334155; margin-top: 10px; text-transform: uppercase; letter-spacing: 1px; }
        .timestamp { text-align: ${isAr ? 'left' : 'right'}; font-size: 12px; color: #94a3b8; }
        .patient-card { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; font-size: 14px; }
        .meta-group { display: flex; flex-direction: column; gap: 4px; }
        .meta-label { font-weight: 700; color: #64748b; font-size: 11px; text-transform: uppercase; }
        .meta-value { font-weight: 700; color: #1e293b; }
        .section-title { font-size: 16px; font-weight: 900; color: #0891b2; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin: 25px 0 12px 0; }
        .tag-container { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 15px; }
        .tag { padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 700; border: 1px solid; }
        .tag-danger { background: #fef2f2; color: #991b1b; border-color: #fca5a5; }
        .tag-warning { background: #fffbeb; color: #92400e; border-color: #fde68a; }
        .visit-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 16px; margin-bottom: 16px; font-size: 13px; line-height: 1.6; }
        .visit-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 10px; font-size: 14px; font-weight: 700; }
        .visit-num { background: #0891b2; color: white; padding: 2px 8px; border-radius: 6px; font-size: 11px; }
        .visit-date { color: #0891b2; }
        .visit-doc { color: #475569; }
        .visit-vitals { font-size: 12px; color: #64748b; background: #fff; padding: 6px 12px; border-radius: 8px; display: inline-block; border: 1px solid #e2e8f0; margin-bottom: 8px; }
        .footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; page-break-inside: avoid; }
        .stamp-box { width: 110px; height: 110px; border: 2px dashed #cbd5e1; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 11px; font-weight: 700; }
        .signature-line { border-top: 1px solid #475569; width: 200px; text-align: center; padding-top: 8px; font-size: 13px; font-weight: 700; color: #475569; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="report-header">
        <div>
          <div class="logo">🏥 ${isAr ? 'عيادتنا 3D' : 'Our Clinic 3D'}</div>
          <div class="title">${isAr ? 'السجل الطبي التاريخي الشامل للمريض' : 'Complete Medical History Dossier'}</div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; margin: 0 10px;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=WE-CLINIC-PATIENT-${patient.id}" width="70" height="70" style="border: 1px solid #e2e8f0; padding: 2px; border-radius: 6px;" />
          <span style="font-size: 8px; color: #94a3b8; margin-top: 4px; font-family: monospace;">PATIENT-${patient.id}</span>
        </div>
        <div class="timestamp">
          <div>${isAr ? 'تم الاستخراج في:' : 'Extracted on:'} ${new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-GB')}</div>
          <div>${isAr ? 'نظام عيادتنا الموحد' : '3D Clinic EHR System'}</div>
        </div>
      </div>

      <div class="patient-card">
        <div class="meta-group">
          <span class="meta-label">${isAr ? 'اسم المريض:' : 'Patient Name:'}</span>
          <span class="meta-value" style="font-size: 16px; color: #0891b2;">${isAr ? patient.nameAr || patient.name : patient.name}</span>
        </div>
        <div class="meta-group">
          <span class="meta-label">${isAr ? 'رقم الهاتف:' : 'Phone Number:'}</span>
          <span class="meta-value">${patient.phone || 'N/A'}</span>
        </div>
        <div class="meta-group">
          <span class="meta-label">${isAr ? 'الرقم القومي:' : 'National ID:'}</span>
          <span class="meta-value">${patient.nationalId || (isAr ? 'غير مسجل' : 'Not specified')}</span>
        </div>
        <div class="meta-group">
          <span class="meta-label">${isAr ? 'تاريخ الميلاد / الجنس:' : 'DOB / Gender:'}</span>
          <span class="meta-value">${patient.dob || 'N/A'} • ${patient.gender === 'female' ? (isAr ? 'أنثى' : 'Female') : (isAr ? 'ذكر' : 'Male')}</span>
        </div>
      </div>

      ${chronicHtml}

      ${allergiesHtml}

      ${visitsHtml}

      <div class="footer">
        <div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 5px; font-weight: 700;">${isAr ? 'الختم الطبي للمنشأة:' : 'Clinic Stamp:'}</div>
          <div class="stamp-box">${isAr ? 'الختم الرسمي' : 'Official Stamp'}</div>
        </div>
        <div>
          <div class="signature-line">${isAr ? 'اعتماد المدير الطبي للعيادة' : 'Medical Director Endorsement'}</div>
        </div>
      </div>

      <script>window.onload = () => { window.print(); }</script>
    </body></html>
  `);
  win.document.close();
}

// ─── Export Patients List to Excel ───────────────────────────────────────────
export function exportPatientsToExcel(patients, isAr = true) {
  const data = patients.map((p, idx) => ({
    [isAr ? 'م' : 'No.']: idx + 1,
    [isAr ? 'الاسم' : 'Name']: isAr ? p.nameAr || p.name : p.name,
    [isAr ? 'الهاتف' : 'Phone']: p.phone || '',
    [isAr ? 'تاريخ الميلاد' : 'Date of Birth']: p.dob || '',
    [isAr ? 'الجنس' : 'Gender']: p.gender === 'female' ? (isAr ? 'أنثى' : 'Female') : (isAr ? 'ذكر' : 'Male'),
    [isAr ? 'آخر زيارة' : 'Last Visit']: p.lastVisit || '',
    [isAr ? 'الحالة' : 'Status']: p.status || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, isAr ? 'المرضى' : 'Patients');
  
  if (isAr) {
    worksheet['!views'] = [{ RTL: true }];
  }

  XLSX.writeFile(workbook, `patients_export_${Date.now()}.xlsx`);
}

// ─── Export Invoices to Excel ────────────────────────────────────────────────
export function exportInvoicesToExcel(invoices, isAr = true) {
  const data = invoices.map((inv, idx) => ({
    [isAr ? 'رقم الفاتورة' : 'Invoice ID']: inv.id,
    [isAr ? 'النوع' : 'Type']: inv.source === 'prescription' ? (isAr ? 'روشتة طبية' : 'Prescription') : (isAr ? 'مبيعات مباشرة' : 'POS Direct'),
    [isAr ? 'اسم المريض' : 'Patient Name']: isAr ? inv.patientNameAr || inv.patientName : inv.patientName,
    [isAr ? 'التاريخ' : 'Date']: inv.date,
    [isAr ? 'الإجمالي' : 'Total Amount']: inv.total,
    [isAr ? 'الحالة' : 'Status']: inv.status === 'Paid' ? (isAr ? 'مدفوعة' : 'Paid') : (isAr ? 'غير مدفوعة' : 'Unpaid'),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, isAr ? 'المبيعات والفواتير' : 'Invoices');

  if (isAr) {
    worksheet['!views'] = [{ RTL: true }];
  }

  XLSX.writeFile(workbook, `revenue_report_${Date.now()}.xlsx`);
}

// ─── Export Medical Record to PDF ────────────────────────────────────────────
export function exportMedicalHistoryToPDF(record, patient, isAr = true) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Header Title
  doc.setFontSize(22);
  doc.setTextColor(8, 145, 178); // Cyan-600
  doc.text('We-Clinic Unified EHR Report', 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text(`Generated: ${new Date().toLocaleDateString()} | EHR Security Tag: WE-CLINIC-SECURE`, 14, 26);
  
  // Patient details box
  doc.setFillColor(248, 250, 252);
  doc.rect(14, 32, 182, 35, 'F');
  
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(`Patient Name: ${patient.name} (${patient.nameAr || ''})`, 18, 39);
  doc.text(`Phone: ${patient.phone || 'N/A'}`, 18, 45);
  doc.text(`DOB: ${patient.dob || 'N/A'} | Gender: ${patient.gender || 'N/A'}`, 18, 51);
  doc.text(`National ID: ${patient.nationalId || 'N/A'}`, 18, 57);
  doc.text(`Record Status: ${patient.status || 'Active'}`, 18, 63);

  // Bounding box representing the validation QR Code
  doc.rect(162, 36, 26, 26);
  doc.setFontSize(7);
  doc.text('SCAN QR', 170, 48);
  doc.text('VALIDATION', 165, 52);

  // Medical Summary
  doc.setFontSize(14);
  doc.setTextColor(8, 145, 178);
  doc.text('Medical Summary', 14, 78);
  
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  const chronicList = (record.chronicDiseases || []).map(d => typeof d === 'object' ? `${d.code}: ${d.en}` : d).join(', ');
  const allergyList = (record.allergies || []).map(a => typeof a === 'object' ? `${a.name} (${a.severity})` : a).join(', ');
  doc.text(`Chronic Conditions: ${chronicList || 'None'}`, 14, 85);
  doc.text(`Allergies: ${allergyList || 'None'}`, 14, 91);

  // Visits table
  doc.setFontSize(14);
  doc.setTextColor(8, 145, 178);
  doc.text('Clinical Encounters History', 14, 102);

  const tableRows = (record.visits || []).map((v, idx) => [
    record.visits.length - idx,
    v.date,
    v.doctor,
    v.specialty,
    v.vitals ? `BP: ${v.vitals.bp || 'N/A'} | HR: ${v.vitals.hr || 'N/A'} | Temp: ${v.vitals.temp || 'N/A'}` : 'N/A',
    v.notes ? v.notes.substring(0, 55) + (v.notes.length > 55 ? '...' : '') : 'N/A'
  ]);

  doc.autoTable({
    startY: 107,
    head: [['No.', 'Date', 'Physician', 'Department', 'Vitals Signs', 'Clinical Summary']],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [8, 145, 178] },
    styles: { fontSize: 8, font: 'helvetica' }
  });

  doc.save(`medical_record_${patient.id}_${Date.now()}.pdf`);
}

