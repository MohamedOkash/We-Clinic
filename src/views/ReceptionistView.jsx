import { useState } from 'react';
import { Search, Plus, Calendar, Bell, FileText, CheckCircle, Printer } from 'lucide-react';
import { useClinic } from '../contexts/ClinicContext';
import { Card, InnerCard, Avatar, Input, s, printReceipt } from '../components/shared';
import { useToast } from '../hooks/useToast';

export default function ReceptionistView() {
  const { t, isAr, patients, queue, addPatient, addToQueue, createAppointment, getAppointmentsForDay, sendAppointmentReminder, currentOrganization, invoices, markInvoicePaid, activePage, setActivePage } = useClinic();
  const toast = useToast();

  const activeTab = activePage;
  const setActiveTab = setActivePage;
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({ fullName: '', phone: '', dob: '' });
  const [errors, setErrors] = useState({});
  const [apptForm, setApptForm] = useState({ patientId: null, doctor: '', date: '', time: '' });

  const tabs = ['register', 'search', 'queue', 'appointments', 'billing'];

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = isAr ? 'الاسم مطلوب' : 'Name is required';
    if (!form.phone.trim())    e.phone    = isAr ? 'الهاتف مطلوب' : 'Phone is required';
    if (form.phone && !/^01\d{9}$/.test(form.phone.replace(/\s/g,'')))
      e.phone = isAr ? 'رقم هاتف غير صحيح' : 'Invalid phone number';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleRegister = () => {
    if (!validate()) return;
    addPatient({
      name: form.fullName,
      nameAr: form.fullName,
      phone: form.phone,
      dob: form.dob,
      lastVisit: isAr ? 'زيارة أولى' : 'First Visit',
      status: 'Waiting',
    });
    setForm({ fullName: '', phone: '', dob: '' });
    setErrors({});
    setActiveTab('search');
    toast.success(isAr ? 'تم تسجيل المريض بنجاح!' : 'Patient registered successfully!');
  };

  const handleAddToQueue = (patient) => {
    if (queue.find(q => q.patientId === patient.id)) {
      toast.error(isAr ? 'المريض موجود في الطابور بالفعل!' : 'Patient is already in queue!');
      return;
    }
    addToQueue(patient);
    toast.success(isAr ? `تم إضافة ${isAr ? patient.nameAr : patient.name} للطابور` : `${patient.name} added to queue`);
  };

  const filteredPatients = patients.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(term) ||
      p.nameAr?.includes(searchTerm) ||
      p.phone?.includes(searchTerm)
    );
  });

  const todayStr = new Date().toLocaleDateString('en-GB');
  const todaysAppointments = getAppointmentsForDay(todayStr);

  return (
    <div className="h-full flex flex-col p-4 md:p-6 gap-6 overflow-hidden">
      {/* Header */}
      <Card className="!p-4 flex flex-col lg:flex-row items-center justify-between shrink-0 gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Avatar name="R" size="sm" />
          <div>
            <h2 className="font-black text-2xl text-white">{t('appTitle')}</h2>
            <p className="text-sm text-cyan-400 font-bold uppercase tracking-widest">{t('receptionist')}</p>
          </div>
        </div>
        <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 w-full lg:w-auto overflow-x-auto gap-1">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 lg:flex-none px-5 py-2.5 rounded-xl text-sm font-black transition-all whitespace-nowrap
                ${activeTab === tab
                  ? 'bg-gradient-to-br from-slate-700 to-slate-800 text-cyan-400 shadow-inner border border-slate-600'
                  : 'text-slate-400 hover:text-white'}`}
            >
              {tab === 'register' ? (isAr ? 'تسجيل' : 'Register')
               : tab === 'search' ? (isAr ? 'بحث' : 'Search')
               : tab === 'queue' ? (isAr ? 'الطابور' : 'Queue')
               : tab === 'appointments' ? (isAr ? 'المواعيد' : 'Appointments')
               : (isAr ? 'الفواتير والمالية' : 'Billing')}
            </button>
          ))}
        </div>
      </Card>

      {/* Body */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-4 pe-1">
        {/* ── Register ── */}
        {activeTab === 'register' && (
          <Card className="w-full max-w-3xl mx-auto flex flex-col gap-6 animate-in slide-in-from-bottom-4">
            <h3 className="text-3xl font-black text-white border-b border-white/10 pb-4">{t('newPatient')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input label={t('fullName')} placeholder={t('fullName')}
                value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })}
                error={errors.fullName} />
              <Input label={t('phone')} placeholder="01xxxxxxxxx"
                value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                error={errors.phone} />
              <Input label={t('dob')} type="date" icon={Calendar}
                value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
            </div>
            <button onClick={handleRegister} className={`${s.btnPrimary} !h-14 text-lg w-full md:w-auto self-end md:px-16`}>
              {t('savePatient')}
            </button>
          </Card>
        )}

        {/* ── Search ── */}
        {activeTab === 'search' && (
          <div className="w-full max-w-3xl mx-auto flex flex-col gap-4 animate-in slide-in-from-bottom-4">
            <Input
              placeholder={t('searchPatient')} icon={Search}
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className={`${s.input} !h-14 text-lg`}
            />
            {filteredPatients.length === 0 && (
              <p className="text-center text-slate-500 font-bold py-8">
                {isAr ? 'لا توجد نتائج' : 'No results found'}
              </p>
            )}
            {filteredPatients.map(p => (
              <InnerCard key={p.id} className="flex flex-col sm:flex-row justify-between items-center gap-4 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <Avatar name={isAr ? p.nameAr : p.name} />
                  <div>
                    <h4 className="font-black text-xl text-white">{isAr ? p.nameAr : p.name}</h4>
                    <p className="text-sm text-cyan-200 font-bold">{p.phone} • {p.lastVisit}</p>
                  </div>
                </div>
                <button onClick={() => handleAddToQueue(p)} className={`${s.btnPrimary} w-full sm:w-auto`}>
                  <Plus className="w-5 h-5" /> {t('addToQueue')}
                </button>
              </InnerCard>
            ))}
          </div>
        )}

        {/* ── Queue ── */}
        {activeTab === 'queue' && (
          <div className="w-full max-w-3xl mx-auto flex flex-col gap-4 animate-in slide-in-from-bottom-4">
            <h3 className="text-2xl font-black text-white mb-2">{t('waitingQueue')} ({queue.length})</h3>
            {queue.length === 0 && (
              <p className="text-center text-slate-500 font-bold py-8">{isAr ? 'الطابور فارغ' : 'Queue is empty'}</p>
            )}
            {queue.map((q, idx) => (
              <InnerCard key={q.id} className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <span className="font-black text-cyan-300 w-8 text-center text-xl">{idx + 1}</span>
                  <Avatar name={q.nameAr || q.name} />
                  <div>
                    <h4 className="font-bold text-white text-lg">{isAr ? q.nameAr : q.name}</h4>
                    <p className="text-xs text-slate-400">{isAr ? 'دخل الساعة' : 'Entered at'} {q.time}</p>
                  </div>
                </div>
                <span className={`${s.badge} ${q.status === 'inProgress' ? '!bg-cyan-500/20 !text-cyan-400 !border-cyan-400/50' : '!bg-amber-500/20 !text-amber-400 !border-amber-400/50'}`}>
                  {q.status === 'inProgress' ? t('inProgress') : t('waiting')}
                </span>
              </InnerCard>
            ))}
          </div>
        )}

        {/* ── Appointments ── */}
        {activeTab === 'appointments' && (
          <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 animate-in slide-in-from-bottom-4">
            <h3 className="text-2xl font-black text-white">{isAr ? 'المواعيد' : 'Appointments'}</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Card className="p-4">
                  <h4 className="text-lg font-bold text-white mb-3">{isAr ? 'حجز موعد جديد' : 'Book Appointment'}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select value={apptForm.patientId || ''} onChange={e => setApptForm(f => ({ ...f, patientId: Number(e.target.value) }))} className={`${s.inputSm} appearance-none cursor-pointer bg-slate-50 dark:bg-slate-900`}>
                      <option value="">{isAr ? 'اختر مريضاً' : 'Select patient'}</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{isAr ? p.nameAr : p.name} • {p.phone}</option>
                      ))}
                    </select>
                    <input type="text" className={`${s.inputSm} bg-slate-50 dark:bg-slate-900`} placeholder={isAr ? 'الطبيب' : 'Doctor'} value={apptForm.doctor} onChange={e => setApptForm(f => ({ ...f, doctor: e.target.value }))} />
                    <input type="date" className={`${s.inputSm} bg-slate-50 dark:bg-slate-900`} value={apptForm.date} onChange={e => setApptForm(f => ({ ...f, date: e.target.value }))} />
                    <input type="time" className={`${s.inputSm} bg-slate-50 dark:bg-slate-900`} value={apptForm.time} onChange={e => setApptForm(f => ({ ...f, time: e.target.value }))} />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => {
                      if (!apptForm.patientId || !apptForm.date || !apptForm.time) { toast.error(isAr ? 'املأ الحقول المطلوبة' : 'Fill required fields'); return; }
                      const patient = patients.find(p => p.id === apptForm.patientId);
                      createAppointment({
                        patientId: patient.id,
                        patientName: patient.name,
                        patientNameAr: patient.nameAr,
                        doctor: apptForm.doctor || (isAr ? currentOrganization?.nameAr : currentOrganization?.name) || 'Doctor',
                        specialty: currentOrganization?.specialty || 'general',
                        date: apptForm.date,
                        time: apptForm.time
                      });
                      setApptForm({ patientId: null, doctor: '', date: '', time: '' });
                      toast.success(isAr ? 'تم حجز الموعد' : 'Appointment booked');
                    }} className={`${s.btnPrimary}`}>{isAr ? 'حجز' : 'Book'}</button>
                    <button onClick={() => setApptForm({ patientId: null, doctor: '', date: '', time: '' })} className={`${s.btnSec}`}>{t('cancel')}</button>
                  </div>
                </Card>
              </div>

              <div>
                <Card className="p-4">
                  <h4 className="text-lg font-bold text-white mb-3">{isAr ? 'مواعيد اليوم' : "Today's Appointments"}</h4>
                  {todaysAppointments.length === 0 ? (
                    <p className="text-slate-400">{isAr ? 'لا توجد مواعيد لليوم' : 'No appointments for today'}</p>
                  ) : (
                    <div className="space-y-2">
                      {todaysAppointments.map(a => (
                        <div key={a.id} className="flex items-center justify-between bg-black/40 p-2 rounded">
                          <div>
                            <p className="font-bold text-white">{isAr ? a.patientNameAr : a.patientName}</p>
                            <p className="text-xs text-slate-400">{a.time} • {a.doctor}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button onClick={() => { sendAppointmentReminder(a.id); toast.info(isAr ? 'تم إرسال تذكير' : 'Reminder sent'); }} className="px-3 py-1 bg-cyan-600 text-white rounded text-xs">{isAr ? 'أرسل تذكير' : 'Send Reminder'}</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* ── Billing ── */}
        {activeTab === 'billing' && (
          <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 animate-in slide-in-from-bottom-4">
            <h3 className="text-2xl font-black text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-cyan-400" /> {isAr ? 'الفواتير والتحصيل المالي للعيادة' : 'Clinic Invoices & Payments'}
            </h3>
            {invoices.length === 0 ? (
              <p className="text-center text-slate-500 font-bold py-8">{isAr ? 'لا توجد فواتير للعيادة حالياً' : 'No clinic invoices found'}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {invoices.map(inv => (
                  <Card key={inv.id} className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-400 font-bold">{isAr ? 'فاتورة رقم' : 'Invoice'} #{inv.id}</p>
                        <h4 className="font-black text-xl text-white">{isAr ? inv.patientNameAr : inv.patientName}</h4>
                        <p className="text-sm text-slate-400 font-bold">
                          {inv.date} • {inv.time || ''} • {inv.source === 'consultation' ? (isAr ? 'كشف طبي عيادة' : 'Clinical Consultation') : (isAr ? 'طلب تحاليل معامل' : 'Lab Test Order')}
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
                              toast.success(isAr ? 'تم تحصيل الرسوم بنجاح!' : 'Payment recorded successfully!');
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
      </div>
    </div>
  );
}
