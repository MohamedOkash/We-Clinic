import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Bell, Calendar, FileText, Home, Pill, Clock, Plus, Trash2, BrainCircuit, Settings } from 'lucide-react';
import { useClinic } from '../contexts/ClinicContext';
import { Card, InnerCard, Avatar, Input, s } from '../components/shared';
import { useToast } from '../hooks/useToast';
import { callGemini } from '../constants/gemini';
import AccountSettingsView from './AccountSettingsView';

const TIME_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30'];

export default function PatientPortal() {
  const { t, isAr, loggedUser, patients, prescriptions, createAppointment, activePage, setActivePage } = useClinic();
  const toast = useToast();

  const tab = activePage;
  const setTab = setActivePage;
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: isAr
        ? 'مرحباً! أنا مساعدك الطبي المدعوم بالذكاء الاصطناعي 🏥 صِف لي أعراضك وسأساعدك بمعلومات طبية عامة.'
        : "Hello! I'm your AI-powered medical assistant 🏥 Describe your symptoms and I'll give you general medical guidance.",
    },
  ]);
  const [input, setInput]     = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [alarms, setAlarms]   = useState([
    { id: 1, label: isAr ? 'ميتفورمين 500 مج' : 'Metformin 500mg', time: '08:00', active: true },
    { id: 2, label: isAr ? 'أسبرين 81 مج'    : 'Aspirin 81mg',    time: '20:00', active: true },
  ]);
  const [alarmForm, setAlarmForm] = useState({ label: '', time: '' });
  const [selectedSlot,  setSelectedSlot]  = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate,   setSelectedDate]   = useState(new Date().toISOString().split('T')[0]);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Find current patient
  const currentPatient = loggedUser?.patientId
    ? patients.find(p => p.id === loggedUser.patientId)
    : patients[0];

  const myPrescriptions = prescriptions.filter(rx => rx.patientId === currentPatient?.id);

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input.trim();
    setInput('');
    const updatedMessages = [...messages, { role: 'user', text: userMsg }];
    setMessages(updatedMessages);
    setIsTyping(true);

    const systemPrompt = isAr
      ? `أنت مساعد طبي ذكاء اصطناعي تتحدث مع مريض. قدم معلومات طبية عامة مفيدة وآمنة، وذكّر دائماً بضرورة مراجعة الطبيب للتشخيص الدقيق. كن ودوداً ومطمئناً. رد بالعربية بشكل موجز ومفيد.`
      : `You are a medical AI assistant talking to a patient. Provide helpful, safe general medical information. Always remind them to see a doctor for proper diagnosis. Be friendly and reassuring. Reply briefly and helpfully in English.`;

    try {
      const formattedHistory = updatedMessages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.text
      }));

      const reply = await callGemini(formattedHistory, systemPrompt);
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch (error) {
      console.error(error);
      const errMsg = isAr
        ? "⚠️ خطأ في الاتصال بالذكاء الاصطناعي. تحقق من مفتاح API."
        : "⚠️ AI connection error. Check your API key.";
      setMessages(prev => [...prev, { role: 'assistant', text: errMsg }]);
    } finally {
      setIsTyping(false);
    }
  };

  const addAlarm = () => {
    if (!alarmForm.label || !alarmForm.time) { toast.error(isAr ? 'الاسم والوقت مطلوبان' : 'Name and time required'); return; }
    setAlarms(prev => [...prev, { id: Date.now(), ...alarmForm, active: true }]);
    setAlarmForm({ label: '', time: '' });
    toast.success(isAr ? 'تم ضبط المنبه' : 'Alarm set');
  };

  const tabBtn = (id, Icon, label) => (
    <button
      onClick={() => setTab(id)}
      className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all
        ${tab === id ? 'text-cyan-600 dark:text-cyan-400 bg-slate-100 dark:bg-white/5' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
    >
      <Icon className={`w-6 h-6 ${tab === id ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : ''}`} />
      <span className="text-xs font-black">{label}</span>
    </button>
  );

  return (
    <div className="min-h-full md:h-full flex flex-col overflow-visible md:overflow-hidden">
      <div className="flex-1 overflow-visible md:overflow-y-auto p-4 md:p-6 pb-20 md:pb-6 min-h-0">

        {/* ── Home ── */}
        {tab === 'home' && (
          <div className="flex flex-col gap-5 max-w-2xl mx-auto animate-in slide-in-from-bottom-4">
            <Card className="flex items-center gap-5">
              <Avatar name={isAr ? currentPatient?.nameAr : currentPatient?.name} size="lg" />
              <div>
                <p className="text-slate-400 font-bold text-sm">{t('welcome')}</p>
                <h2 className="font-black text-3xl text-white">{isAr ? currentPatient?.nameAr : currentPatient?.name}</h2>
                <p className="text-cyan-300 font-bold text-sm">{currentPatient?.phone}</p>
              </div>
            </Card>

            {/* Active alarms */}
            <Card className="flex flex-col gap-3">
              <h3 className="font-black text-white text-xl flex items-center gap-2">
                <Bell className="w-6 h-6 text-cyan-400" /> {t('activeAlarms')}
              </h3>
              {alarms.filter(a => a.active).map(alarm => (
                <InnerCard key={alarm.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Pill className="w-5 h-5 text-fuchsia-400" />
                    <div>
                      <p className="font-black text-white">{alarm.label}</p>
                      <p className="text-xs text-cyan-300 font-bold">{alarm.time}</p>
                    </div>
                  </div>
                  <span className={`${s.badge} !bg-green-500/20 !text-green-300 !border-green-500/50`}>{t('alarmActive')}</span>
                </InnerCard>
              ))}
              <button onClick={() => setTab('alarms')} className={`${s.btnSec} w-full !h-10 text-sm`}>
                <Plus className="w-4 h-4" /> {t('setAlarm')}
              </button>
            </Card>

            {/* Latest prescription */}
            {myPrescriptions[0] && (
              <Card className="flex flex-col gap-3">
                <h3 className="font-black text-white text-xl flex items-center gap-2">
                  <FileText className="w-6 h-6 text-emerald-400" /> {isAr ? 'آخر روشتة' : 'Latest Prescription'}
                </h3>
                {myPrescriptions[0].drugs?.map((d, i) => (
                  <InnerCard key={i} className="flex items-center gap-3 !p-3">
                    <Pill className="w-5 h-5 text-cyan-400 shrink-0" />
                    <div>
                      <p className="font-black text-white">{d.name}</p>
                      {d.dosage && <p className="text-xs text-slate-400 font-bold">{d.dosage} — {d.frequency}</p>}
                    </div>
                  </InnerCard>
                ))}
              </Card>
            )}
          </div>
        )}

        {/* ── AI Chat ── */}
        {tab === 'ai' && (
          <div className="flex flex-col h-full max-w-2xl mx-auto animate-in slide-in-from-bottom-4">
            <Card className="mb-4 shrink-0">
              <h3 className="font-black text-white text-xl flex items-center gap-3">
                <BrainCircuit className="w-7 h-7 text-fuchsia-400" /> {t('patientAI')}
              </h3>
              <p className="text-sm text-slate-400 font-bold mt-1">{t('patientAISub')}</p>
            </Card>
            <Card className="flex-1 flex flex-col gap-3 overflow-visible md:overflow-hidden min-h-[400px]">
              <div className="flex-1 overflow-visible md:overflow-y-auto flex flex-col gap-3 pe-1">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-9 h-9 bg-gradient-to-br from-fuchsia-500 to-violet-700 rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(192,132,252,0.5)]">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[80%] px-4 py-3 rounded-2xl font-bold text-sm leading-relaxed
                      ${msg.role === 'user'
                        ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-se-none'
                        : 'bg-black/50 border border-white/10 text-slate-200 rounded-ss-none'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-fuchsia-500 to-violet-700 rounded-xl flex items-center justify-center shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-black/50 border border-white/10 rounded-2xl rounded-ss-none px-4 py-3">
                      <div className="flex gap-1.5 items-center h-5">
                        {[0, 0.15, 0.3].map(d => (
                          <span key={d} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-3 shrink-0">
                <input
                  className={`${s.input} flex-1`}
                  placeholder={t('aiChatPlaceholder')}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                />
                <button onClick={sendMessage} disabled={isTyping} className={`${s.btnAI} !px-4`}>
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* ── Book ── */}
        {tab === 'book' && (
          <div className="flex flex-col gap-5 max-w-2xl mx-auto animate-in slide-in-from-bottom-4">
            <Card className="flex flex-col gap-4">
              <h3 className="font-black text-white text-2xl flex items-center gap-3">
                <Calendar className="w-7 h-7 text-cyan-400" /> {t('bookNow')}
              </h3>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-300">{t('chooseDoctor')}</label>
                <div className="flex flex-col gap-2">
                  {['Dr. Ahmed — Orthopedics', 'Dr. Sarah — Cardiology', 'Dr. Omar — Pediatrics'].map(doc => (
                    <label key={doc} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedDoctor === doc ? 'bg-cyan-900/30 border-cyan-500/60' : 'bg-black/40 border-white/5 hover:border-white/15'}`}>
                      <input type="radio" name="doctor" value={doc} checked={selectedDoctor === doc}
                        onChange={() => setSelectedDoctor(doc)} className="accent-cyan-400" />
                      <span className="font-bold text-white">{doc}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> {isAr ? 'اختر تاريخ الموعد' : 'Select Date'}
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className={`${s.inputSm} !h-12`}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> {t('selectTimeSlot')}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {TIME_SLOTS.map(slot => (
                    <button key={slot} onClick={() => setSelectedSlot(slot)}
                      className={`py-3 rounded-xl text-sm font-black border transition-all
                        ${selectedSlot === slot ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400/60' : 'bg-black/40 text-slate-400 border-white/5 hover:border-cyan-400/30'}`}>
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  if (!selectedDoctor) {
                    toast.error(isAr ? 'يرجى اختيار الطبيب المعالج' : 'Please select a doctor');
                    return;
                  }
                  if (!selectedDate) {
                    toast.error(isAr ? 'يرجى تحديد تاريخ الموعد' : 'Please select a date');
                    return;
                  }
                  if (!selectedSlot) {
                    toast.error(isAr ? 'يرجى اختيار توقيت الموعد المناسب' : 'Please select a time slot');
                    return;
                  }

                  // Prevent past dates
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const chosenDate = new Date(selectedDate);
                  chosenDate.setHours(0, 0, 0, 0);
                  if (chosenDate < today) {
                    toast.error(isAr ? 'لا يمكن حجز موعد في تاريخ سابق' : 'Cannot book appointment in a past date');
                    return;
                  }

                  const docName = selectedDoctor.split(' — ')[0];
                  const docSpec = selectedDoctor.split(' — ')[1]?.toLowerCase() || 'general';

                  createAppointment({
                    patientId: currentPatient?.id || Date.now(),
                    patientName: currentPatient?.name || loggedUser?.name || 'Patient',
                    patientNameAr: currentPatient?.nameAr || loggedUser?.nameAr || 'مريض',
                    doctor: docName,
                    specialty: docSpec,
                    date: selectedDate.split('-').reverse().join('/'), // DD/MM/YYYY
                    time: selectedSlot
                  });

                  toast.success(isAr 
                    ? `تم حجز موعد الساعة ${selectedSlot} بتاريخ ${selectedDate} ✅` 
                    : `Appointment booked at ${selectedSlot} on ${selectedDate} ✅`
                  );
                  setSelectedSlot('');
                  setSelectedDoctor('');
                }}
                className={`${s.btnPrimary} w-full !h-14 text-lg`}
              >
                <Calendar className="w-5 h-5" /> {t('confirmBooking')}
              </button>
            </Card>
          </div>
        )}

        {/* ── Alarms ── */}
        {tab === 'alarms' && (
          <div className="flex flex-col gap-5 max-w-2xl mx-auto animate-in slide-in-from-bottom-4">
            <Card className="flex flex-col gap-4">
              <h3 className="font-black text-white text-2xl flex items-center gap-3">
                <Bell className="w-7 h-7 text-cyan-400" /> {t('setAlarm')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input label={isAr ? 'اسم الدواء' : 'Drug Name'} placeholder="Metformin..."
                  value={alarmForm.label} onChange={e => setAlarmForm(p => ({ ...p, label: e.target.value }))} />
                <Input label={isAr ? 'وقت الجرعة' : 'Dose Time'} type="time"
                  value={alarmForm.time} onChange={e => setAlarmForm(p => ({ ...p, time: e.target.value }))} />
                <div className="flex items-end">
                  <button onClick={addAlarm} className={`${s.btnPrimary} w-full`}>
                    <Plus className="w-5 h-5" /> {t('add')}
                  </button>
                </div>
              </div>
            </Card>

            <div className="flex flex-col gap-3">
              {alarms.map(alarm => (
                <InnerCard key={alarm.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-500 to-violet-700 rounded-xl flex flex-col items-center justify-center shadow-[0_0_10px_rgba(192,132,252,0.4)]">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-black text-white">{alarm.label}</p>
                      <p className="text-xl font-black text-cyan-400">{alarm.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`${s.badge} ${alarm.active ? '!bg-green-500/20 !text-green-300 !border-green-500/50' : '!bg-slate-700 !text-slate-400'}`}>
                      {alarm.active ? t('alarmActive') : (isAr ? 'موقوف' : 'Paused')}
                    </span>
                    <button
                      onClick={() => { setAlarms(prev => prev.filter(a => a.id !== alarm.id)); toast.info(isAr ? 'تم حذف المنبه' : 'Alarm deleted'); }}
                      className="text-slate-500 hover:text-red-400 p-2 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </InnerCard>
              ))}
            </div>
          </div>
        )}

        {/* ── Account Settings ── */}
        {tab === 'account' && (
          <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom-4">
            <AccountSettingsView />
          </div>
        )}
      </div>
    </div>
  );
}
