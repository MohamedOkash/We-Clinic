import { useState } from 'react';
import { ScanLine, UploadCloud, CheckCircle, Search, AlertCircle, FileText, Printer, Settings } from 'lucide-react';
import { useClinic } from '../contexts/ClinicContext';
import AccountSettingsView from './AccountSettingsView';
import { Card, InnerCard, Avatar, Input, s, printReceipt } from '../components/shared';
import { useToast } from '../hooks/useToast';
import LabOrdersManager from '../components/LabOrdersManager';
import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const TEST_TYPES = [
  { en: 'X-Ray', ar: 'أشعة سينية' },
  { en: 'CT Scan', ar: 'طبقي محوري' },
  { en: 'MRI', ar: 'رنين مغناطيسي' },
  { en: 'Ultrasound', ar: 'سونار' },
  { en: 'Blood Test', ar: 'تحليل دم' },
  { en: 'ECG', ar: 'رسم قلب' },
];

export default function RadiologyView() {
  const { t, isAr, patients, scans, uploadScan, invoices, markInvoicePaid, currentOrganizationId, activePage, setActivePage } = useClinic();
  const toast = useToast();

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedType,    setSelectedType]    = useState('');
  const [filePreview,     setFilePreview]      = useState(null);
  const [selectedFile,    setSelectedFile]     = useState(null);
  const [fileName,        setFileName]         = useState('');
  const [searchTerm,      setSearchTerm]       = useState('');
  const [isUploading,     setIsUploading]      = useState(false);
  const tab = activePage;
  const setTab = setActivePage;

  const filteredPatients = patients.filter(p => {
    const term = searchTerm.toLowerCase();
    return p.name?.toLowerCase().includes(term) || p.nameAr?.includes(searchTerm) || p.phone?.includes(searchTerm);
  });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setFileName(file.name);
    const url = URL.createObjectURL(file);
    setFilePreview(url);
  };

  const handleUpload = async () => {
    if (!selectedPatient) { toast.error(isAr ? 'اختر المريض أولاً' : 'Select a patient first'); return; }
    if (!selectedType)    { toast.error(isAr ? 'اختر نوع الفحص' : 'Select test type'); return; }
    if (!filePreview)     { toast.error(isAr ? 'ارفع ملف أولاً' : 'Upload a file first'); return; }

    setIsUploading(true);
    let finalUrl = filePreview;

    try {
      if (storage && selectedFile) {
        // Upload file to Firebase Storage
        const fileExt = fileName.split('.').pop() || 'jpg';
        const path = `scans/${selectedPatient.id}/${Date.now()}_${selectedType.replace(/\s+/g, '_')}.${fileExt}`;
        const storageRef = ref(storage, path);
        
        const uploadResult = await uploadBytes(storageRef, selectedFile);
        finalUrl = await getDownloadURL(uploadResult.ref);
      } else {
        // Local simulation fallback
        await new Promise(r => setTimeout(r, 900));
      }

      uploadScan({
        id: Date.now(),
        patientId: selectedPatient.id,
        type: selectedType,
        date: new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-GB'),
        url: finalUrl,
        technician: isAr ? 'أخصائي الأشعة' : 'Lab Specialist',
      });

      setFilePreview(null);
      setSelectedFile(null);
      setFileName('');
      setSelectedType('');
      toast.success(t('uploadSuccessful'));
      setTab('history');
    } catch (error) {
      console.error("Storage upload error: ", error);
      toast.error(isAr ? 'فشل رفع الملف إلى السحابة' : 'Failed to upload file to cloud');
    } finally {
      setIsUploading(false);
    }
  };

  const patientScans = scans.filter(s => s.patientId === selectedPatient?.id);

  return (
    <div className="min-h-full md:h-full flex flex-col p-4 md:p-6 gap-6 overflow-visible md:overflow-hidden">
      {/* Header */}
      <Card className="!p-4 shrink-0 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-700 rounded-xl flex items-center justify-center border border-purple-300/40">
            <ScanLine className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-black text-2xl text-white">{t('radiology')}</h2>
            <p className="text-xs font-bold text-purple-300 uppercase tracking-widest">{t('uploadResults')}</p>
          </div>
        </div>
        <div className="flex bg-black/50 p-1.5 rounded-2xl border border-white/10 overflow-x-auto w-full md:w-auto gap-1">
          {['orders', 'upload', 'history', 'billing', 'account'].map(tabId => (
            <button key={tabId} onClick={() => setTab(tabId)}
              className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-1 ${tab === tabId ? 'bg-gradient-to-br from-slate-700 to-slate-800 text-purple-400 shadow-inner border border-slate-600' : 'text-slate-400 hover:text-white'}`}>
              {tabId === 'orders' && <AlertCircle className="w-4 h-4" />}
              {tabId === 'upload' ? (isAr ? 'رفع نتيجة' : 'Upload') 
               : tabId === 'history' ? (isAr ? 'سجل الأشعة' : 'History') 
               : tabId === 'orders' ? (isAr ? 'الطلبات الواردة' : 'Incoming Orders')
               : tabId === 'account' ? (isAr ? 'إعدادات الحساب' : 'Account Settings')
               : (isAr ? 'المالية' : 'Billing')}
            </button>
          ))}
        </div>
      </Card>

      <div className="flex-1 overflow-visible md:overflow-y-auto min-h-0 pe-1 pb-4">

        {/* ── Incoming Orders ── */}
        {tab === 'orders' && (
          <Card className="max-w-5xl mx-auto animate-in slide-in-from-bottom-4">
            <LabOrdersManager />
          </Card>
        )}

        {/* ── Upload ── */}
        {tab === 'upload' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto animate-in slide-in-from-bottom-4">

            {/* Patient selector */}
            <Card className="flex flex-col gap-4">
              <h3 className="font-black text-white text-xl">{isAr ? 'اختر المريض' : 'Select Patient'}</h3>
              <Input placeholder={t('search')} icon={Search}
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pe-1">
                {filteredPatients.map(p => (
                  <InnerCard
                    key={p.id}
                    onClick={() => setSelectedPatient(p)}
                    className={`flex items-center gap-4 cursor-pointer transition-all
                      ${selectedPatient?.id === p.id ? '!border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'hover:bg-white/5'}`}
                  >
                    <Avatar name={isAr ? p.nameAr : p.name} size="sm" />
                    <div>
                      <h4 className="font-black text-white">{isAr ? p.nameAr : p.name}</h4>
                      <p className="text-xs text-slate-400">{p.phone}</p>
                    </div>
                    {selectedPatient?.id === p.id && (
                      <CheckCircle className="w-5 h-5 text-purple-400 ms-auto shrink-0" />
                    )}
                  </InnerCard>
                ))}
              </div>
            </Card>

            {/* Upload form */}
            <Card className="flex flex-col gap-5">
              <h3 className="font-black text-white text-xl">{t('uploadResults')}</h3>

              {/* Test type */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-300">{t('testType')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {TEST_TYPES.map(type => (
                    <button
                      key={type.en}
                      onClick={() => setSelectedType(isAr ? type.ar : type.en)}
                      className={`py-2.5 px-3 rounded-xl text-sm font-bold border transition-all
                        ${selectedType === (isAr ? type.ar : type.en)
                          ? 'bg-purple-500/30 text-purple-700 dark:text-purple-200 border-purple-400/60'
                          : 'bg-slate-100 dark:bg-black/40 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:border-purple-400/30'}`}
                    >
                      {isAr ? type.ar : type.en}
                    </button>
                  ))}
                </div>
              </div>

              {/* File upload */}
              <div>
                <label className="text-sm font-bold text-slate-300 block mb-2">{isAr ? 'رفع الملف' : 'Upload File'}</label>
                <label className={`${filePreview
                  ? 'border-purple-400/60 bg-purple-900/20'
                  : 'border-dashed border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-black/40 hover:bg-slate-200 dark:hover:bg-black/60'
                  } border-2 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all p-4 min-h-[140px]`}
                >
                  {filePreview ? (
                    <>
                      <img src={filePreview} alt="preview" className="max-h-[100px] rounded-xl object-contain mb-2" />
                      <span className="text-xs text-purple-300 font-bold truncate max-w-full">{fileName}</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
                      <span className="text-sm font-bold text-slate-400">{isAr ? 'اضغط لرفع صورة أو ملف' : 'Click to upload image or file'}</span>
                      <span className="text-xs text-slate-500 mt-1">JPG, PNG, PDF</span>
                    </>
                  )}
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
                </label>
              </div>

              {selectedPatient && (
                <div className="flex items-center gap-3 bg-purple-900/20 border border-purple-500/30 p-3 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-purple-400 shrink-0" />
                  <span className="text-sm font-bold text-white">
                    {isAr ? `مريض محدد: ${selectedPatient.nameAr}` : `Patient: ${selectedPatient.name}`}
                  </span>
                </div>
              )}

              <button onClick={handleUpload} disabled={isUploading} className={`${s.btnPrimary} w-full !bg-gradient-to-br !from-purple-500 !to-indigo-700 !border-purple-300/30`}>
                <UploadCloud className="w-5 h-5" />
                {isUploading ? (isAr ? 'جاري الرفع...' : 'Uploading...') : t('uploadImage')}
              </button>
            </Card>
          </div>
        )}

        {/* ── History ── */}
        {tab === 'history' && (
          <div className="flex flex-col gap-4 max-w-4xl mx-auto animate-in slide-in-from-bottom-4">
            <div className="flex gap-3">
              <Input placeholder={t('search')} icon={Search}
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={s.input} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {scans
                .filter(sc => {
                  const p = patients.find(p => p.id === sc.patientId);
                  return !searchTerm || p?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p?.nameAr?.includes(searchTerm);
                })
                .map(scan => {
                  const p = patients.find(p => p.id === scan.patientId);
                  return (
                    <InnerCard key={scan.id} className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={isAr ? p?.nameAr : p?.name} size="sm" />
                        <div>
                          <h4 className="font-black text-white">{isAr ? p?.nameAr : p?.name}</h4>
                          <p className="text-xs text-slate-400">{scan.date} • {scan.technician}</p>
                        </div>
                        <span className={`${s.badge} ms-auto`}>{scan.type}</span>
                      </div>
                      {scan.url && scan.url.startsWith('blob:') ? (
                        <div className="h-24 bg-black/40 rounded-xl flex items-center justify-center text-slate-500 text-sm font-bold">
                          {isAr ? 'ملف مرفوع' : 'File uploaded'} ✓
                        </div>
                      ) : (
                        <img src={scan.url} alt={scan.type} className="w-full h-24 object-cover rounded-xl opacity-70 mix-blend-screen" />
                      )}
                    </InnerCard>
                  );
                })}
            </div>
          </div>
        )}

        {/* ── Billing ── */}
        {tab === 'billing' && (
          <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 animate-in slide-in-from-bottom-4">
            <h3 className="text-2xl font-black text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-cyan-400" /> {isAr ? 'الفواتير والتحصيل المالي للمعمل' : 'Lab Invoices & Payments'}
            </h3>
            {invoices.length === 0 ? (
              <p className="text-center text-slate-500 font-bold py-8">{isAr ? 'لا توجد فواتير للمعمل حالياً' : 'No lab/radiology invoices found'}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {invoices.map(inv => (
                  <Card key={inv.id} className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-400 font-bold">{isAr ? 'فاتورة رقم' : 'Invoice'} #{inv.id}</p>
                        <h4 className="font-black text-xl text-white">{isAr ? inv.patientNameAr : inv.patientName}</h4>
                        <p className="text-sm text-slate-400 font-bold">
                          {inv.date} • {inv.time || ''} • {isAr ? 'فحوصات أشعة وتحاليل' : 'Laboratory & Radiology Services'}
                        </p>
                      </div>
                      <div>
                        <span className={`${s.badge} ${
                          inv.status === 'Paid'
                            ? '!bg-green-500/20 !text-green-300 !border-green-500/50'
                            : '!bg-amber-500/20 !text-amber-300 !border-amber-500/50'
                        }`}>
                          {inv.status === 'Paid' ? (isAr ? 'مدفوعة' : 'Paid') : (isAr ? 'غير مدفوعة' : 'Unpaid')}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {inv.items?.map((item, idx) => (
                        <InnerCard key={`${inv.id}-${item.name}-${idx}`} className="!p-3 flex justify-between items-center">
                          <div>
                            <p className="font-bold text-white">{item.name}</p>
                            <p className="text-xs text-slate-400">{item.qty || 1} × {item.price || 0} {isAr ? 'ج.م' : 'EGP'}</p>
                          </div>
                          <p className="font-black text-cyan-300">{(item.price || 0) * (item.qty || 1)} {isAr ? 'ج.م' : 'EGP'}</p>
                        </InnerCard>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-3 border-t border-white/10">
                      <p className="font-black text-white text-lg">
                        {isAr ? 'الإجمالي:' : 'Total:'} <span className="text-cyan-300">{inv.total || 0} {isAr ? 'ج.م' : 'EGP'}</span>
                      </p>
                      <div className="flex gap-2">
                        {inv.status !== 'Paid' && (
                          <button
                            onClick={() => {
                              markInvoicePaid(inv.id, 'cash');
                              toast.success(isAr ? 'تم تحصيل رسوم التحاليل بنجاح!' : 'Lab payment recorded successfully!');
                            }}
                            className={`${s.btnPrimary} !h-10 text-sm`}
                          >
                            <CheckCircle className="w-4 h-4" /> {isAr ? 'تسجيل الدفع' : 'Mark Paid'}
                          </button>
                        )}
                        {inv.status === 'Paid' && (
                          <button
                            onClick={() => printReceipt(inv, isAr)}
                            className={`${s.btnSec} !h-10 text-sm`}
                          >
                            <Printer className="w-4 h-4" /> {isAr ? 'طباعة الإيصال' : 'Print Receipt'}
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'account' && (
          <div className="animate-in slide-in-from-bottom-4">
            <AccountSettingsView />
          </div>
        )}
      </div>
    </div>
  );
}
