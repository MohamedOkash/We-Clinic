import { useState, useMemo } from 'react';
import {
  Users, Search, Activity, Sparkles, Stethoscope,
  History, MessageSquare, Package, Pill, Plus, X,
  HeartPulse, Thermometer, Heart, Droplet, FolderOpen,
  FileImage, BrainCircuit, Printer, AlertCircle, BarChart3, FileText, Settings,
  ChevronDown
} from 'lucide-react';
import { useClinic } from '../contexts/ClinicContext';
import AccountSettingsView from './AccountSettingsView';
import { SPECIALTIES, SPECIALTY_DRUGS, ICD_10 } from '../constants';
import { askGemini } from '../constants/gemini';
import { Card, InnerCard, Avatar, Input, GlassModal, s, printPrescription, printReferralLetter } from '../components/shared';
import { useToast } from '../hooks/useToast';
import LabOrderForm from '../components/LabOrderForm';
import MedicalRecordViewer from '../components/MedicalRecordViewer';
import CardiologyModule from '../modules/CardiologyModule';
import OrthopedicsModule from '../modules/OrthopedicsModule';
import PediatricsModule from '../modules/PediatricsModule';
import OBGYNModule from '../modules/OBGYNModule';
import GeneralModule from '../modules/GeneralModule';
import DermatologyModule from '../modules/DermatologyModule';
import InternalMedicineModule from '../modules/InternalMedicineModule';
import NeurologyModule from '../modules/NeurologyModule';
import PhysicalTherapyModule from '../modules/PhysicalTherapyModule';

function getSpecName(specialty, isAr) {
  const sp = SPECIALTIES.find(s => s.id === specialty);
  return sp ? (isAr ? sp.ar : sp.en) : specialty;
}

const getBPAlert = (bp, isAr) => {
  if (!bp) return null;
  const parts = bp.split('/');
  if (parts.length !== 2) return null;
  const sys = parseInt(parts[0]);
  const dia = parseInt(parts[1]);
  if (isNaN(sys) || isNaN(dia)) return null;
  if (sys >= 140 || dia >= 90) return { type: 'danger', text: isAr ? '⚠️ ارتفاع ضغط الدم' : '⚠️ Hypertension' };
  if (sys < 90 || dia < 60) return { type: 'warning', text: isAr ? '⚠️ انخفاض ضغط الدم' : '⚠️ Hypotension' };
  return null;
};

const getHRAlert = (hr, isAr) => {
  const num = parseInt(hr);
  if (isNaN(num)) return null;
  if (num > 100) return { type: 'danger', text: isAr ? '⚠️ تسارع ضربات القلب' : '⚠️ Tachycardia (>100)' };
  if (num < 60) return { type: 'warning', text: isAr ? '⚠️ تباطؤ ضربات القلب' : '⚠️ Bradycardia (<60)' };
  return null;
};

const getTempAlert = (temp, isAr) => {
  const num = parseFloat(temp);
  if (isNaN(num)) return null;
  if (num > 37.8) return { type: 'danger', text: isAr ? '🔥 حمى / ارتفاع حرارة' : '🔥 Fever (>37.8°C)' };
  if (num < 36.0) return { type: 'warning', text: isAr ? '❄️ انخفاض حرارة الجسم' : '❄️ Hypothermia (<36°C)' };
  return null;
};

const getSpO2Alert = (spo2, isAr) => {
  const clean = spo2?.replace('%', '') || '';
  const num = parseInt(clean);
  if (isNaN(num)) return null;
  if (num < 95) return { type: 'danger', text: isAr ? '⚠️ نقص أكسجين الدم' : '⚠️ Hypoxia (<95%)' };
  return null;
};

export default function DoctorWorkspace() {
  const { t, isAr, specialty, patients, queue, prescriptions, scans, inquiries,
          sendPrescription, replyInquiry, loggedUser, addVisitToRecord, createNotification,
          recordRequests, organizations, requestPatientRecord, respondToRecordRequest, currentOrganizationId, createInvoice,
          addPatientAllergy, removePatientAllergy, addPatientChronicDisease, removePatientChronicDisease, medicalRecords,
          activePage, setActivePage, addPatient } = useClinic();
  const toast = useToast();

  const tab = activePage;
  const setTab = setActivePage;
  const [activePatient, setActivePatient]   = useState(patients[0] || null);
  const [searchTerm, setSearchTerm]         = useState('');

  // Add Patient States
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({
    fullName: '',
    phone: '',
    dob: '',
    gender: 'male',
    allergies: '',
    chronicDiseases: [],
    notes: '',
  });
  const [newPatientErrors, setNewPatientErrors] = useState({});

  const validateNewPatient = () => {
    const errs = {};
    if (!newPatientForm.fullName.trim()) {
      errs.fullName = isAr ? 'الاسم رباعي مطلوب' : 'Full name is required';
    }
    if (!newPatientForm.phone.trim()) {
      errs.phone = isAr ? 'رقم الهاتف مطلوب' : 'Phone number is required';
    } else if (!/^01\d{9}$/.test(newPatientForm.phone.replace(/\s/g, ''))) {
      errs.phone = isAr ? 'رقم هاتف غير صحيح (مثال: 01012345678)' : 'Invalid phone number (e.g. 01012345678)';
    }
    setNewPatientErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddPatientSubmit = () => {
    if (!validateNewPatient()) return;

    const patientObj = addPatient({
      name: newPatientForm.fullName,
      nameAr: newPatientForm.fullName,
      phone: newPatientForm.phone,
      dob: newPatientForm.dob,
      gender: newPatientForm.gender,
      lastVisit: isAr ? 'زيارة أولى' : 'First Visit',
      status: 'Waiting',
    });

    if (newPatientForm.allergies.trim()) {
      addPatientAllergy(patientObj.id, { name: newPatientForm.allergies.trim(), severity: 'Mild' });
    }
    if (newPatientForm.chronicDiseases.length > 0) {
      newPatientForm.chronicDiseases.forEach(code => {
        const icd = ICD_10.find(i => i.code === code);
        if (icd) {
          addPatientChronicDisease(patientObj.id, icd);
        }
      });
    }

    toast.success(isAr ? '✓ تم تسجيل المريض وبدء الفحص بنجاح!' : '✓ Patient registered and loaded successfully!');

    setNewPatientForm({
      fullName: '',
      phone: '',
      dob: '',
      gender: 'male',
      allergies: '',
      chronicDiseases: [],
      notes: '',
    });
    setNewPatientErrors({});
    setIsAddPatientOpen(false);

    setActivePatient(patientObj);
    setTab('examination');
  };

  const openRegisterWithSearch = () => {
    const isPhone = /^\d+$/.test(searchTerm);
    setNewPatientForm(prev => ({
      ...prev,
      fullName: isPhone ? '' : searchTerm,
      phone: isPhone ? searchTerm : '',
    }));
    setIsAddPatientOpen(true);
  };
  const [vitals, setVitals]                 = useState({ bp: '120/80', temp: '37.2', hr: '75', spo2: '98%' });
  const [diagSearch, setDiagSearch]         = useState('');
  const [selectedDiags, setSelectedDiags]   = useState([]);
  const [aiPrompt, setAiPrompt]             = useState('');
  const [aiResponse, setAiResponse]         = useState('');
  const [isAiLoading, setIsAiLoading]       = useState(false);
  const [aiError, setAiError]               = useState('');
  const [interactionResult, setInteractionResult] = useState('');
  const [isInteractionLoading, setIsInteractionLoading] = useState(false);
  const [rx, setRx]                         = useState([]);
  const [dicomPreview, setDicomPreview]     = useState(null);
  const [replyTexts, setReplyTexts]         = useState({});

  // Scoped states & SOAP visit notes
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [soapSubjective, setSoapSubjective] = useState('');
  const [soapObjective, setSoapObjective]   = useState('');
  const [soapAssessment, setSoapAssessment] = useState('');
  const [soapPlan, setSoapPlan]             = useState('');
  const [onlySpecialtyDiags, setOnlySpecialtyDiags] = useState(true);

  // Custom drug input states
  const [customDrugName, setCustomDrugName] = useState('');
  const [customDrugDosage, setCustomDrugDosage] = useState('');
  const [customDrugFreq, setCustomDrugFreq] = useState('');
  const [customDrugDur, setCustomDrugDur] = useState('');

  // Allergy / Chronic disease input states
  const [allergyInput, setAllergyInput] = useState('');
  const [allergySeverity, setAllergySeverity] = useState('Mild');
  const [chronicDiseaseSearch, setChronicDiseaseSearch] = useState('');

  // Referral states
  const [referralTargetType, setReferralTargetType] = useState(''); // 'clinic' | 'lab' | 'radiology'
  const [referralTargetOrgId, setReferralTargetOrgId] = useState('');
  const [referralNotes, setReferralNotes] = useState('');

  // Consent request states
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [reqPhone, setReqPhone] = useState('');
  const [reqTargetOrgId, setReqTargetOrgId] = useState('');

  const otherClinics = organizations.filter(org => org.type === 'clinic' && org.id !== currentOrganizationId);
  const referTargets = organizations.filter(org => org.id !== currentOrganizationId);
  const pendingRequests = (recordRequests || []).filter(req => req.targetOrgId === currentOrganizationId && req.status === 'pending');

  const activePatientRecord = activePatient ? medicalRecords[activePatient.id] : null;
  const activeAllergies = activePatientRecord?.allergies || [];
  const activeChronicDiseases = activePatientRecord?.chronicDiseases || [];

  const activeSpecialtyDiags = useMemo(() => {
    const hasSpecialtyDiags = ICD_10.some(d => d.specialty === specialty);
    const targetSpecialty = hasSpecialtyDiags ? specialty : 'general';
    return ICD_10.filter(d => d.specialty === targetSpecialty);
  }, [specialty]);

  const filteredPatients = patients.filter(p => {
    const term = searchTerm.toLowerCase();
    return p.name?.toLowerCase().includes(term) || p.nameAr?.includes(searchTerm) || p.phone?.includes(searchTerm);
  });

  const filteredICD = ICD_10.filter(d => {
    const hasSpecialtyDiags = ICD_10.some(item => item.specialty === specialty);
    const targetSpecialty = hasSpecialtyDiags ? specialty : 'general';

    if (onlySpecialtyDiags && d.specialty !== targetSpecialty) return false;
    if (!diagSearch) return onlySpecialtyDiags && d.specialty === targetSpecialty;
    return (
      d.code.toLowerCase().includes(diagSearch.toLowerCase()) ||
      d.en.toLowerCase().includes(diagSearch.toLowerCase()) ||
      d.ar.includes(diagSearch)
    );
  });

  const addDiagnosis = (diag) => {
    if (!selectedDiags.find(d => d.code === diag.code)) {
      setSelectedDiags(prev => [...prev, diag]);
    }
    setDiagSearch('');
  };

  const handleAddCustomDrug = () => {
    if (!customDrugName.trim()) return;
    setRx(prev => [...prev, {
      name: customDrugName,
      dosage: customDrugDosage,
      frequency: customDrugFreq || (isAr ? 'مرة يومياً' : 'Once daily'),
      duration: customDrugDur || (isAr ? '7 أيام' : '7 days'),
      desc: isAr ? 'دواء مخصص مضاف يدوياً' : 'Manually added custom medication',
    }]);
    setCustomDrugName('');
    setCustomDrugDosage('');
    setCustomDrugFreq('');
    setCustomDrugDur('');
    toast.success(isAr ? 'تمت إضافة الدواء المخصص!' : 'Custom medication added!');
  };

  const handleRequestSubmit = () => {
    if (!reqPhone.trim() || !reqTargetOrgId) {
      toast.error(isAr ? 'يرجى إدخال الهاتف واختيار العيادة' : 'Please enter phone and select clinic');
      return;
    }
    try {
      requestPatientRecord(reqPhone, reqTargetOrgId);
      toast.success(isAr ? 'تم إرسال طلب المشاركة للطبيب الآخر!' : 'Record request sent to the other doctor!');
      setIsRequestModalOpen(false);
      setReqPhone('');
    } catch (err) {
      toast.error(err.message || 'Error');
    }
  };

  const handleSaveVisit = () => {
    if (!activePatient) {
      toast.error(isAr ? 'اختر مريضاً أولاً' : 'Select a patient first');
      return;
    }

    // Input Validations
    if (!chiefComplaint.trim()) {
      toast.error(isAr ? 'يرجى إدخال الشكوى الرئيسية للمريض' : 'Please enter the chief complaint');
      return;
    }
    if (selectedDiags.length === 0) {
      toast.error(isAr ? 'يرجى تحديد تشخيص واحد على الأثل للمريض' : 'Please select at least one diagnosis');
      return;
    }

    // Vitals Validations
    const bpRegex = /^\d{2,3}\/\d{2,3}$/;
    if (!bpRegex.test(vitals.bp)) {
      toast.error(isAr ? 'يرجى إدخال ضغط الدم بتنسيق صحيح (مثال: 120/80)' : 'Please enter blood pressure in correct format (e.g., 120/80)');
      return;
    }

    const hrNum = parseInt(vitals.hr);
    if (isNaN(hrNum) || hrNum < 30 || hrNum > 200) {
      toast.error(isAr ? 'نبضات القلب يجب أن تكون بين 30 و 200 نبضة/دقيقة' : 'Heart rate must be between 30 and 200 bpm');
      return;
    }

    const tempNum = parseFloat(vitals.temp);
    if (isNaN(tempNum) || tempNum < 34 || tempNum > 43) {
      toast.error(isAr ? 'درجة الحرارة يجب أن تكون بين 34 و 43 درجة مئوية' : 'Temperature must be between 34 and 43 °C');
      return;
    }

    const spo2Clean = vitals.spo2.replace('%', '');
    const spo2Num = parseInt(spo2Clean);
    if (isNaN(spo2Num) || spo2Num < 50 || spo2Num > 100) {
      toast.error(isAr ? 'نسبة الأكسجين SpO2 يجب أن تكون بين 50% و 100%' : 'SpO2 must be between 50% and 100%');
      return;
    }

    // Compile SOAP notes
    const compiledNotes = `Subjective (الشكوى): ${soapSubjective || 'N/A'}\nObjective (الفحص): ${soapObjective || 'N/A'}\nAssessment (التقييم): ${soapAssessment || 'N/A'}\nPlan (الخطة): ${soapPlan || 'N/A'}`;

    const visitData = {
      date: new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-GB'),
      doctor: loggedUser?.name || 'Doctor',
      specialty,
      chiefComplaint: chiefComplaint || '',
      chiefComplaintAr: chiefComplaint || '',
      vitals: { ...vitals },
      diagnosis: selectedDiags.map(d => ({ code: d.code, desc: d.en, desc_ar: d.ar })),
      notes: compiledNotes,
    };

    // Auto-create unpaid consultation invoice for this clinic
    createInvoice({
      patientId: activePatient.id,
      patientName: activePatient.name,
      patientNameAr: activePatient.nameAr,
      items: [
        { name: isAr ? 'رسوم كشف طبي استشاري' : 'Clinical Consultation Fee', qty: 1, price: 300 }
      ],
      total: 300,
      tax: 0,
      paymentMethod: 'cash',
      status: 'Unpaid',
      source: 'consultation',
      organizationId: currentOrganizationId,
      adjustInventory: false,
    });

    addVisitToRecord(activePatient.id, visitData);
    toast.success(isAr ? 'تم حفظ الزيارة وإنشاء فاتورة الكشف بنجاح!' : 'Visit saved and consultation invoice generated successfully!');
    
    // Process referral if selected
    if (referralTargetOrgId) {
      const targetOrg = organizations.find(org => org.id === referralTargetOrgId);
      const currentOrg = organizations.find(org => org.id === currentOrganizationId);
      if (targetOrg) {
        printReferralLetter({
          date: new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-GB'),
          doctor: loggedUser?.name || 'Doctor',
          specialty: getSpecName(specialty, isAr),
          patientName: activePatient.name,
          patientNameAr: activePatient.nameAr,
          targetOrgName: targetOrg.name,
          targetOrgNameAr: targetOrg.nameAr,
          diagnosis: selectedDiags.map(d => `${d.code}: ${isAr ? d.ar : d.en}`).join(', '),
          notes: referralNotes,
        }, isAr);

        createNotification({
          type: 'referral_received',
          recipient: targetOrg.type === 'clinic' ? 'doctor' : targetOrg.type === 'lab' ? 'radiology' : 'receptionist',
          title: 'إحالة مريض واردة',
          titleEn: 'Incoming Patient Referral',
          message: `تم إحالة المريض ${isAr ? activePatient.nameAr : activePatient.name} إليكم من عيادة ${isAr ? currentOrg?.nameAr : currentOrg?.name}`,
          messageEn: `Patient ${activePatient.name} referred to you from ${currentOrg?.name || 'clinic'}`,
          organizationId: referralTargetOrgId,
          targetOrganizationId: referralTargetOrgId,
          sourceOrganizationId: currentOrganizationId,
        });

        toast.success(isAr ? 'تم طباعة خطاب التحويل وإرسال إشعار للجهة بنجاح!' : 'Referral letter printed and notification sent successfully!');
      }
    }

    // Reset states
    setChiefComplaint('');
    setSoapSubjective('');
    setSoapObjective('');
    setSoapAssessment('');
    setSoapPlan('');
    setSelectedDiags([]);
    setReferralTargetType('');
    setReferralTargetOrgId('');
    setReferralNotes('');

    createNotification({
      type: 'visit_saved',
      recipient: 'doctor',
      title: 'تم حفظ زيارة جديدة',
      titleEn: 'New Visit Saved',
      message: `تم تسجيل زيارة جديدة للمريض ${isAr ? activePatient.nameAr : activePatient.name}`,
      messageEn: `A new visit has been logged for ${activePatient.name}`,
      patientName: activePatient.name,
      patientNameAr: activePatient.nameAr,
      patientId: activePatient.id,
      organizationId: currentOrganizationId
    });
  };

  const addDrugFromLibrary = (drug) => {
    if (rx.find(d => d.name === drug.name)) return;
    setRx(prev => [...prev, { ...drug, dosage: '', frequency: isAr ? 'مرة يومياً' : 'Once daily', duration: isAr ? '7 أيام' : '7 days' }]);
  };

  const updateDrugField = (idx, field, val) => {
    setRx(prev => prev.map((d, i) => i === idx ? { ...d, [field]: val } : d));
  };

  // ── AI Copilot ──────────────────────────────────────────────────────────────
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiResponse('');
    setAiError('');
    try {
      const diagsList = selectedDiags.map(d => `${d.code}: ${isAr ? d.ar : d.en}`).join(', ') || 'Not specified';
      const vitalsStr = `BP: ${vitals.bp}, HR: ${vitals.hr}, Temp: ${vitals.temp}, SpO2: ${vitals.spo2}`;
      const prompt = isAr
        ? `أنت مساعد طبي ذكاء اصطناعي للطبيب. التخصص: ${getSpecName(specialty, true)}.
العلامات الحيوية: ${vitalsStr}
التشخيصات المختارة: ${diagsList}
شكوى المريض: ${aiPrompt}

اكتب تقريراً طبياً موجزاً باللغة العربية يشمل:
1. التحليل الأولي للحالة
2. الاحتمالات التشخيصية
3. توصيات العلاج
4. متى يجب إحالة المريض

اجعل الرد منظماً ومختصراً.`
        : `You are an AI medical assistant for the doctor. Specialty: ${getSpecName(specialty, false)}.
Vitals: ${vitalsStr}
Selected diagnoses: ${diagsList}
Chief complaint: ${aiPrompt}

Write a concise clinical report in English including:
1. Initial case analysis
2. Differential diagnoses
3. Treatment recommendations
4. Referral criteria

Keep it structured and brief.`;
      const result = await askGemini(prompt);
      setAiResponse(result);
    } catch (err) {
      console.error(err);
      setAiError(err.message || (isAr ? 'فشل الاتصال بخادم الذكاء الاصطناعي' : 'Failed to connect to the AI server'));
      toast.error(isAr ? 'خطأ في الاتصال بـ AI' : 'AI connection error');
    } finally {
      setIsAiLoading(false);
    }
  };

  // ── Drug Interaction Check ──────────────────────────────────────────────────
  const checkInteractions = async () => {
    if (rx.length < 2) {
      toast.info(isAr ? 'أضف دواءين على الأقل للفحص' : 'Add at least 2 drugs to check');
      return;
    }
    setIsInteractionLoading(true);
    setInteractionResult('');
    try {
      const drugNames = rx.map(d => d.name).join(', ');
      const prompt = isAr
        ? `فحص تفاعلات الأدوية الآتية: ${drugNames}
هل توجد تفاعلات دوائية خطيرة أو تحذيرات مهمة؟ أجب بإيجاز وعربي واضح.`
        : `Check drug interactions for: ${drugNames}
Are there any serious interactions or warnings? Be concise and clear.`;
      const result = await askGemini(prompt);
      setInteractionResult(result);
    } catch {
      toast.error(isAr ? 'خطأ في فحص التفاعلات' : 'Interaction check failed');
    } finally {
      setIsInteractionLoading(false);
    }
  };

  // ── Send Prescription ───────────────────────────────────────────────────────
  const handleSendToPharmacy = () => {
    if (!rx.length || !activePatient) {
      toast.error(isAr ? 'اختر مريضاً وأضف أدوية أولاً' : 'Select a patient and add drugs first');
      return;
    }
    const newRx = {
      id: Date.now(),
      patientId: activePatient.id,
      patientName: activePatient.name,
      patientNameAr: activePatient.nameAr,
      date: new Date().toLocaleDateString('ar-EG'),
      doctor: loggedUser?.name || 'Dr. Ahmed',
      specialty,
      status: 'New',
      drugs: [...rx],
    };
    sendPrescription(newRx);
    setRx([]);
    setInteractionResult('');
    toast.success(isAr ? 'تم إرسال الروشتة للصيدلية!' : 'Prescription sent to pharmacy!');
  };

  const handlePrint = () => {
    if (!rx.length || !activePatient) {
      toast.error(isAr ? 'الروشتة فارغة' : 'Prescription is empty');
      return;
    }
    printPrescription({
      id: 'DRAFT',
      patientName: activePatient.name,
      patientNameAr: activePatient.nameAr,
      date: new Date().toLocaleDateString(),
      doctor: loggedUser?.name || 'Dr. Ahmed',
      specialty,
      drugs: rx,
    }, isAr);
  };

  const handleSendReply = (inqId) => {
    const text = replyTexts[inqId];
    if (!text?.trim()) return;
    replyInquiry(inqId, text);
    setReplyTexts(prev => ({ ...prev, [inqId]: '' }));
    toast.success(isAr ? 'تم إرسال الرد' : 'Reply sent');
  };

  const currentDrugs     = SPECIALTY_DRUGS[specialty] || SPECIALTY_DRUGS['general'];
  const activeScans      = scans.filter(s => s.patientId === activePatient?.id);
  const activeInquiries  = inquiries.filter(i => i.patientId === activePatient?.id);
  const pendingCount     = inquiries.filter(i => i.status === 'Pending').length;

  const tabBtn = (id, Icon, label, extra = '') => (
    <button
      onClick={() => setTab(id)}
      className={`flex items-center gap-2 pb-2 text-sm font-bold transition-all whitespace-nowrap relative border-b-2
        ${tab === id
          ? (extra || 'text-cyan-400 border-cyan-400 font-black')
          : 'text-slate-400 hover:text-slate-200 border-transparent'}`}
    >
      <Icon className="w-4 h-4" /> {label}
      {id === 'aiPrescription' && pendingCount > 0 && (
        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping" />
      )}
    </button>
  );

  return (
    <div className="min-h-full md:h-full flex flex-col gap-4 overflow-visible md:overflow-hidden animate-in fade-in duration-500">

      {/* Tab bar */}
      <Card className="!p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center shrink-0 gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shrink-0 border border-cyan-300/50 shadow-lg">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-black text-xl text-white">{loggedUser?.name || 'Dr. Ahmed'}</h2>
            <p className="text-xs font-bold text-cyan-300 uppercase tracking-wider">{getSpecName(specialty, isAr)}</p>
          </div>
        </div>
        <div className="flex items-center gap-6 overflow-x-auto w-full lg:w-auto scrollbar-none pb-2 lg:pb-0 border-t border-white/5 lg:border-t-0 pt-3 lg:pt-0">
          {tabBtn('registry',       Users,        t('patientsRegistry'))}
          {tabBtn('patientHistory', FileImage,    t('medicalHistory'))}
          {tabBtn('examination',    Activity,      t('examAndReports'))}
          {tabBtn('labOrders',      BarChart3,    'Lab Orders')}
          {tabBtn('aiPrescription', Sparkles,      t('aiPrescription'),
            'text-violet-400 border-violet-400 font-black'
          )}
        </div>
      </Card>

      {/* Active patient banner */}
      {tab !== 'registry' && activePatient && (
        <div className="flex items-center gap-4 bg-cyan-950/50 px-4 py-3 rounded-2xl border-s-4 border-cyan-400 shrink-0">
          <Avatar name={isAr ? activePatient.nameAr : activePatient.name} size="sm" />
          <div>
            <h3 className="font-black text-white">{isAr ? activePatient.nameAr : activePatient.name}</h3>
            <p className="text-xs text-cyan-300 font-bold">{activePatient.phone}</p>
          </div>
        </div>
      )}

      {/* View container */}
      <div className="flex-1 overflow-visible md:overflow-hidden flex flex-col min-h-0">

        {/* ── Registry ── */}
        {tab === 'registry' && (
          <Card className="min-h-full md:h-full flex flex-col animate-in slide-in-from-bottom-4">
            <div className="shrink-0 mb-4 flex flex-col md:flex-row justify-between items-center gap-4">
              <h2 className="text-2xl font-black text-white">{t('patientsRegistry')}</h2>
              <div className="flex flex-wrap gap-2 w-full md:w-auto items-center justify-end">
                <button
                  onClick={() => setIsAddPatientOpen(true)}
                  className={`${s.btnPrimary} !bg-gradient-to-r !from-cyan-500 !to-blue-600 !border-cyan-400/50 !h-12 text-sm`}
                >
                  <Plus className="w-4 h-4" />
                  {isAr ? 'إضافة مريض جديد' : 'Add New Patient'}
                </button>
                <button
                  onClick={() => setIsRequestModalOpen(true)}
                  className={`${s.btnSec} text-cyan-300 border-cyan-500/20 !h-12 text-sm`}
                >
                  {isAr ? 'طلب ملف مريض من عيادة أخرى' : 'Request Patient File'}
                </button>
                <div className="w-full sm:w-72">
                  <Input placeholder={isAr ? 'ابحث بالاسم أو الهاتف...' : 'Search name or phone...'} icon={Search}
                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Contextual Tip */}
            <div className="shrink-0 mb-4 text-xs font-bold text-slate-400 bg-slate-900/50 p-3 rounded-xl border border-white/5 flex items-center gap-2">
              <span>💡</span>
              <p>
                {isAr
                  ? 'يظهر هنا المرضى المسجلون في عيادتك الحالية فقط. لاستيراد ملف مريض مسجل في عيادة زميلة، يرجى النقر على زر "طلب ملف مريض من عيادة أخرى" في الأعلى.'
                  : 'Only patients registered in this clinic are listed below. To import a patient record from a colleague\'s clinic, click "Request Patient File" above.'}
              </p>
            </div>

            {pendingRequests.length > 0 && (
              <div className="mb-4 flex flex-col gap-2 shrink-0">
                {pendingRequests.map(req => (
                  <div key={req.id} className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 animate-in zoom-in-95">
                    <div>
                      <h4 className="font-bold text-amber-300">{isAr ? 'طلب مشاركة ملف طبي وارد' : 'Incoming File Request'}</h4>
                      <p className="text-sm text-slate-300">
                        {isAr 
                          ? `يطلب الطبيب ${req.requestingDoctor} الوصول إلى الملف الطبي للمريض صاحب رقم الهاتف ${req.patientPhone}` 
                          : `Dr. ${req.requestingDoctor} requests access to the medical file of the patient with phone ${req.patientPhone}`}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => respondToRecordRequest(req.id, true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all"
                      >
                        {isAr ? 'موافقة' : 'Approve'}
                      </button>
                      <button
                        onClick={() => respondToRecordRequest(req.id, false)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all"
                      >
                        {isAr ? 'رفض' : 'Reject'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-3 overflow-visible md:overflow-y-auto flex-1 pe-2">
              {filteredPatients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-in bg-black/20 rounded-2xl border border-white/5 flex-1">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900/80 border border-white/[0.06] flex items-center justify-center mb-4">
                    <Search className="w-7 h-7 text-slate-500" />
                  </div>
                  <h4 className="font-bold text-lg text-slate-300 mb-1">
                    {isAr ? 'لم يتم العثور على نتائج' : 'No Patients Found'}
                  </h4>
                  <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-5">
                    {patients.length === 0
                      ? (isAr ? 'لا يوجد أي مرضى مسجلين في عيادتك الحالية بعد. يمكنك تسجيل مريض جديد مباشرة.' : 'There are no patients registered in your clinic yet. Register a patient to start.')
                      : (isAr ? `لا يوجد مريض يطابق "${searchTerm}". تأكد من الاسم أو الهاتف أو سجله سريعاً.` : `No patient matches "${searchTerm}". Try another search or register them.`)}
                  </p>
                  <button
                    onClick={openRegisterWithSearch}
                    className={`${s.btnPrimary} !bg-cyan-500/20 hover:!bg-cyan-500/30 !text-cyan-300 !border-cyan-400/30 !h-10 text-xs`}
                  >
                    <Plus className="w-4 h-4" />
                    {isAr ? `تسجيل "${searchTerm || 'المريض'}" كحساب جديد` : `Register "${searchTerm || 'Patient'}" Now`}
                  </button>
                </div>
              ) : (
                filteredPatients.map(p => (
                  <InnerCard
                    key={p.id}
                    onClick={() => { setActivePatient(p); setTab('examination'); }}
                    className={`flex flex-col sm:flex-row justify-between items-center gap-4 cursor-pointer transition-all
                      ${activePatient?.id === p.id ? '!border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'hover:bg-slate-800/50'}`}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar name={isAr ? p.nameAr : p.name} />
                      <div>
                        <h4 className="font-black text-xl text-white">{isAr ? p.nameAr : p.name}</h4>
                        <p className="text-sm text-slate-400 font-bold">{p.phone} • {p.lastVisit}</p>
                      </div>
                    </div>
                    <span className={`${s.badge} ${p.status === 'Waiting' ? '!bg-amber-500/20 !text-amber-400 !border-amber-400/50' : '!bg-cyan-500/20 !text-cyan-400 !border-cyan-400/50'}`}>
                      {p.status}
                    </span>
                  </InnerCard>
                ))
              )}
            </div>
          </Card>
        )}

        {/* ── History ── */}
        {tab === 'history' && (
          <div className="flex flex-col md:flex-row gap-4 min-h-full md:h-full min-h-0 animate-in slide-in-from-bottom-4">
            <div className="w-full md:w-1/3 flex flex-col gap-4 overflow-visible md:overflow-y-auto shrink-0 min-h-0">
              <InnerCard>
                <h3 className="font-black text-white flex items-center gap-2 mb-3">
                  <Activity className="w-5 h-5 text-red-400" /> {t('chronicDiseases')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span className={`${s.badge} !bg-red-900/30 !text-red-300 !border-red-500/30`}>Hypertension</span>
                  <span className={`${s.badge} !bg-red-900/30 !text-red-300 !border-red-500/30`}>Diabetes Type 2</span>
                </div>
              </InnerCard>
              <InnerCard>
                <h3 className="font-black text-white flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-orange-400" /> {t('allergies')}
                </h3>
                <span className={`${s.badge} !bg-orange-900/30 !text-orange-300 !border-orange-500/30`}>Penicillin</span>
              </InnerCard>
            </div>
            <Card className="flex-1 flex flex-col overflow-visible md:overflow-y-auto min-h-0">
              <h3 className="font-black text-2xl text-white mb-6 shrink-0">{t('pastVisits')}</h3>
              <div className="relative flex gap-6 pb-6">
                <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-cyan-400 flex flex-col items-center justify-center shrink-0 z-10 shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                  <span className="font-black text-cyan-300 text-lg">12</span>
                  <span className="font-bold text-white text-xs uppercase">May</span>
                </div>
                <InnerCard className="flex-1 mt-2">
                  <h4 className="font-black text-white text-xl mb-2">{getSpecName(specialty, isAr)} Consultation</h4>
                  <p className="text-slate-300 font-bold leading-relaxed">
                    {isAr ? 'شكوى ألم موضعي. تم الفحص وتحديث السجل الطبي وصرف الأدوية.' : 'Patient complained of localized pain. Examined and assigned medications.'}
                  </p>
                </InnerCard>
              </div>
            </Card>
          </div>
        )}

        {/* ── Patient Medical History ── */}
        {tab === 'patientHistory' && activePatient && (
          <Card className="flex-1 flex flex-col overflow-visible md:overflow-y-auto min-h-0 pe-1 animate-in slide-in-from-bottom-4">
            <MedicalRecordViewer patientId={activePatient.id} />
          </Card>
        )}

        {/* ── Lab Orders ── */}
        {tab === 'labOrders' && (
          <Card className="flex-1 flex flex-col gap-6 overflow-visible md:overflow-y-auto min-h-0 pe-1 animate-in slide-in-from-bottom-4">
            {!activePatient ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-in bg-black/20 rounded-2xl border border-white/5 flex-1">
                <div className="w-16 h-16 rounded-2xl bg-slate-900/80 border border-white/[0.06] flex items-center justify-center mb-4">
                  <Users className="w-7 h-7 text-slate-500 animate-pulse" />
                </div>
                <h4 className="font-bold text-lg text-slate-300 mb-1">
                  {isAr ? 'الرجاء اختيار مريض أولاً' : 'Please Select a Patient First'}
                </h4>
                <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-5 font-bold">
                  {isAr 
                    ? 'يجب اختيار مريض من سجل المرضى لتتمكن من طلب تحاليل أو أشعة له.' 
                    : 'You must select a patient from the registry to order tests or scans for them.'}
                </p>
                <button
                  onClick={() => setTab('registry')}
                  className={`${s.btnPrimary} !bg-cyan-500/20 hover:!bg-cyan-500/30 !text-cyan-300 !border-cyan-400/30 !h-10 text-xs`}
                >
                  {isAr ? 'الذهاب لسجل المرضى' : 'Go to Patients Registry'}
                </button>
              </div>
            ) : (
              <LabOrderForm
                patientId={activePatient.id}
                patientName={activePatient.name}
                patientNameAr={activePatient.nameAr}
                doctor={loggedUser?.name || 'Dr. Ahmed'}
                specialty={specialty}
                onOrderCreated={() => {
                  toast.success(isAr ? '✓ تم إرسال الطلب للمعمل' : '✓ Lab order sent');
                }}
              />
            )}
          </Card>
        )}

        {/* ── Examination ── */}
        {tab === 'examination' && (
          <Card className="flex-1 flex flex-col overflow-visible md:overflow-y-auto gap-6 min-h-0 pe-1 animate-in slide-in-from-bottom-4">
            {/* Vitals */}
            <InnerCard className="shrink-0">
              <h3 className="font-black text-white flex items-center gap-3 text-xl mb-5">
                <Activity className="w-7 h-7 text-cyan-400" /> {t('vitals')}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key:'bp',   icon:<HeartPulse className="w-4 h-4 text-red-500"/>,    label:'BP'   },
                  { key:'hr',   icon:<Heart       className="w-4 h-4 text-red-500"/>,    label:'HR'   },
                  { key:'temp', icon:<Thermometer className="w-4 h-4 text-orange-400"/>, label:'Temp' },
                  { key:'spo2', icon:<Droplet     className="w-4 h-4 text-blue-400"/>,   label:'SpO2' },
                ].map(({ key, icon, label }) => {
                  const val = vitals[key];
                  let alertObj = null;
                  if (key === 'bp') alertObj = getBPAlert(val, isAr);
                  if (key === 'hr') alertObj = getHRAlert(val, isAr);
                  if (key === 'temp') alertObj = getTempAlert(val, isAr);
                  if (key === 'spo2') alertObj = getSpO2Alert(val, isAr);

                  return (
                    <div key={key} className="bg-black/50 p-4 rounded-2xl border border-white/5 flex flex-col gap-2">
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest">{icon} {label}</span>
                      <input
                        type="text"
                        value={val}
                        onChange={e => setVitals(prev => ({ ...prev, [key]: e.target.value }))}
                        className="bg-transparent border-b-2 border-slate-700 focus:border-cyan-500 outline-none font-black text-3xl text-white w-full"
                      />
                      {alertObj && (
                        <div className={`text-[10px] font-bold ${alertObj.type === 'danger' ? 'text-red-400' : 'text-amber-400'} mt-1`}>
                          {alertObj.text}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4">
                <Input
                  label={t('chiefComplaint')}
                  placeholder="..."
                  className={`${s.input} text-lg`}
                  value={chiefComplaint}
                  onChange={e => setChiefComplaint(e.target.value)}
                />
              </div>
            </InnerCard>

            {/* Diagnosis (ICD-10) */}
            <InnerCard className="shrink-0">
              <h3 className="font-black text-white flex items-center gap-3 text-xl mb-4">
                <Stethoscope className="w-7 h-7 text-cyan-400" /> {isAr ? 'التشخيص والترميز الطبي (ICD-10)' : 'Diagnosis & ICD-10 Coding'}
              </h3>
              
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="onlySpecDiags"
                    checked={onlySpecialtyDiags}
                    onChange={e => setOnlySpecialtyDiags(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-white/10"
                  />
                  <label htmlFor="onlySpecDiags" className="text-sm font-bold text-slate-300 cursor-pointer select-none">
                    {isAr ? 'عرض أمراض تخصصي فقط' : 'Show only my specialty diseases'}
                  </label>
                </div>
                <div className="w-full md:w-72">
                  <Input
                    placeholder={isAr ? 'ابحث عن مرض أو كود...' : 'Search disease or code...'}
                    value={diagSearch}
                    onChange={e => setDiagSearch(e.target.value)}
                  />
                </div>
              </div>

              {selectedDiags.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{isAr ? 'التشخيصات المختارة:' : 'Selected Diagnoses:'}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDiags.map(d => (
                      <span key={d.code} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-sm font-bold animate-in zoom-in-95">
                        <span>{d.code}: {isAr ? d.ar : d.en}</span>
                        <button onClick={() => setSelectedDiags(prev => prev.filter(x => x.code !== d.code))} className="text-slate-400 hover:text-red-400 font-bold ml-1">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {onlySpecialtyDiags && !ICD_10.some(item => item.specialty === specialty) && (
                <div className="mb-3 text-xs font-bold text-amber-400 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                  {isAr 
                    ? '💡 لا توجد تشخيصات مسجلة لتخصصك حالياً في القائمة المصغرة. تم عرض تشخيصات الطب العام تلقائياً لتسهيل العمل.' 
                    : '💡 No predefined diagnoses for your specialty. Showing general diagnoses.'}
                </div>
              )}

              {filteredICD.length > 0 && (
                <div className="max-h-[180px] overflow-y-auto bg-black/40 border border-white/5 rounded-2xl p-2 flex flex-col gap-1.5 scrollbar-thin">
                  {filteredICD.map(d => {
                    const isSelected = selectedDiags.some(x => x.code === d.code);
                    return (
                      <div
                        key={d.code}
                        onClick={() => isSelected ? setSelectedDiags(prev => prev.filter(x => x.code !== d.code)) : addDiagnosis(d)}
                        className={`flex justify-between items-center px-4 py-2.5 rounded-xl cursor-pointer text-sm font-semibold transition-colors
                          ${isSelected ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20' : 'hover:bg-slate-800 text-slate-200'}`}
                      >
                        <div>
                          <span className="font-bold text-cyan-400 me-2">{d.code}</span>
                          <span>{isAr ? d.ar : d.en}</span>
                        </div>
                        <span className="text-xs text-slate-500 capitalize">{d.specialty?.replace('_', ' ')}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </InnerCard>

            {/* Allergies & Chronic Diseases Management */}
            {activePatient && (
              <InnerCard className="shrink-0 grid grid-cols-1 md:grid-cols-2 gap-6 border-amber-500/10">
                {/* Chronic Diseases */}
                <div>
                  <h3 className="font-black text-white flex items-center gap-2 text-lg mb-3">
                    <Activity className="w-5 h-5 text-red-400" />
                    {isAr ? 'الأمراض المزمنة النشطة' : 'Active Chronic Diseases'}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {activeChronicDiseases.map((item) => {
                      const code = typeof item === 'object' ? item.code : item;
                      const icd = ICD_10.find(i => i.code === code);
                      const key = typeof item === 'object' ? item.id || item.code : item;
                      const name = icd ? (isAr ? icd.ar : icd.en) : (typeof item === 'object' ? (isAr ? item.ar : item.en) : item);
                      return (
                        <span key={key} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-300 border border-red-500/30 text-sm font-bold">
                          <span>{code}: {name}</span>
                          <button
                            onClick={() => removePatientChronicDisease(activePatient.id, typeof item === 'object' ? item.id : item)}
                            className="text-slate-400 hover:text-red-400 font-bold ml-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      );
                    })}
                    {!activeChronicDiseases.length && (
                      <span className="text-slate-500 text-sm italic">{isAr ? 'لا توجد أمراض مزمنة مسجلة' : 'No chronic diseases recorded'}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <div className="relative w-full">
                      <select
                        value={chronicDiseaseSearch}
                        onChange={e => {
                          const code = e.target.value;
                          if (!code) return;
                          const icd = ICD_10.find(i => i.code === code);
                          if (icd) {
                            addPatientChronicDisease(activePatient.id, icd);
                          }
                          setChronicDiseaseSearch('');
                        }}
                        className={`${s.inputSm} w-full appearance-none cursor-pointer pe-10 ps-3`}
                      >
                        <option value="">{isAr ? 'إضافة مرض مزمن من ICD-10...' : 'Add chronic disease from ICD-10...'}</option>
                        {activeSpecialtyDiags.map(d => (
                          <option key={d.code} value={d.code}>{d.code}: {isAr ? d.ar : d.en}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-emerald-500/80" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Allergies */}
                <div>
                  <h3 className="font-black text-white flex items-center gap-2 text-lg mb-3">
                    <AlertCircle className="w-5 h-5 text-orange-400" />
                    {isAr ? 'الحساسية والمحاذير الطبية' : 'Allergies & Contraindications'}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {activeAllergies.map((item) => {
                      const name = typeof item === 'object' ? item.name : item;
                      const severity = typeof item === 'object' && item.severity ? ` (${isAr ? (item.severity === 'Severe' ? 'شديدة' : item.severity === 'Moderate' ? 'متوسطة' : 'خفيفة') : item.severity})` : '';
                      const key = typeof item === 'object' ? item.id || item.name : item;
                      return (
                        <span key={key} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-500/10 text-orange-300 border border-orange-500/30 text-sm font-bold">
                          <span>{name}{severity}</span>
                          <button
                            onClick={() => removePatientAllergy(activePatient.id, typeof item === 'object' ? item.id : item)}
                            className="text-slate-400 hover:text-red-400 font-bold ml-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      );
                    })}
                    {!activeAllergies.length && (
                      <span className="text-slate-500 text-sm italic">{isAr ? 'لا توجد حساسية مسجلة' : 'No allergies recorded'}</span>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder={isAr ? 'اسم مسبب الحساسية (مثال: بنسلين)...' : 'Allergen name (e.g. Penicillin)...'}
                      value={allergyInput}
                      onChange={e => setAllergyInput(e.target.value)}
                      className={`${s.inputSm} bg-slate-900`}
                    />
                    <div className="relative w-32 shrink-0">
                      <select
                        value={allergySeverity}
                        onChange={e => setAllergySeverity(e.target.value)}
                        className={`${s.inputSm} w-full appearance-none cursor-pointer pe-10 ps-3`}
                      >
                        <option value="Mild">{isAr ? 'خفيفة' : 'Mild'}</option>
                        <option value="Moderate">{isAr ? 'متوسطة' : 'Moderate'}</option>
                        <option value="Severe">{isAr ? 'شديدة' : 'Severe'}</option>
                      </select>
                      <div className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-emerald-500/80" />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (!allergyInput.trim()) return;
                        addPatientAllergy(activePatient.id, { name: allergyInput.trim(), severity: allergySeverity });
                        setAllergyInput('');
                        setAllergySeverity('Mild');
                        toast.success(isAr ? 'تمت إضافة الحساسية للمريض!' : 'Allergy added to patient!');
                      }}
                      className="bg-orange-500/20 hover:bg-orange-500/40 text-orange-300 px-3 h-10 rounded-lg border border-orange-400/30 font-bold text-sm shrink-0"
                    >
                      {isAr ? 'إضافة' : 'Add'}
                    </button>
                  </div>
                </div>
              </InnerCard>
            )}

            {/* Specialty module */}
            {specialty === 'general'           && <GeneralModule t={t} />}
            {specialty === 'cardiology'        && <CardiologyModule t={t} />}
            {specialty === 'orthopedics'       && <OrthopedicsModule t={t} setDicomPreview={setDicomPreview} />}
            {specialty === 'pediatrics'        && <PediatricsModule t={t} />}
            {specialty === 'obgyn'             && <OBGYNModule t={t} />}
            {specialty === 'dermatology'       && <DermatologyModule t={t} />}
            {specialty === 'internal_medicine' && <InternalMedicineModule t={t} />}
            {specialty === 'neurology'         && <NeurologyModule t={t} />}
            {specialty === 'physical_therapy'  && <PhysicalTherapyModule t={t} />}

            {/* Past scans */}
            <InnerCard className="shrink-0">
              <h3 className="font-black text-white flex items-center gap-3 text-xl mb-4">
                <FolderOpen className="w-6 h-6 text-yellow-400" /> {t('pastData')}
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {activeScans.map(scan => (
                  <div
                    key={scan.id}
                    onClick={() => setDicomPreview(scan.url)}
                    className="bg-black/60 border border-white/10 p-4 rounded-xl flex items-center gap-3 min-w-[220px] shrink-0 cursor-pointer hover:bg-slate-800"
                  >
                    <FileImage className="w-8 h-8 text-cyan-400" />
                    <div>
                      <h4 className="font-bold text-white">{scan.type}</h4>
                      <p className="text-xs text-slate-400">{scan.date} • {scan.technician}</p>
                    </div>
                  </div>
                ))}
                {!activeScans.length && (
                  <p className="text-slate-500 font-bold text-sm">
                    {isAr ? 'لا توجد أشعة لهذا المريض' : 'No scans for this patient'}
                  </p>
                )}
              </div>
            </InnerCard>

            {/* SOAP Notes & Referral Editor */}
            <InnerCard className="shrink-0 flex flex-col gap-6 border-cyan-500/10">
              <div>
                <h3 className="font-black text-white flex items-center gap-3 text-xl mb-4">
                  <FileText className="w-6 h-6 text-cyan-400" /> {isAr ? 'ملخص الفحص الطبي (SOAP)' : 'SOAP Clinical Documentation'}
                </h3>
                
                {/* 2x2 grid of text areas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                      {isAr ? 'S - الشكوى والأعراض الذاتية (Subjective)' : 'S - Subjective (History & Complaints)'}
                    </label>
                    <textarea
                      value={soapSubjective}
                      onChange={e => setSoapSubjective(e.target.value)}
                      placeholder={isAr ? 'مثال: يشكو المريض من ألم حاد في الصدر يزداد مع المجهود...' : 'e.g. Patient presents with chest pain radiating to left arm...'}
                      className={`${s.input} min-h-[90px] p-3 resize-none !bg-black/60 !h-auto text-sm`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                      {isAr ? 'O - الملاحظات الموضوعية والفحص (Objective)' : 'O - Objective (Physical Exam & Vitals)'}
                    </label>
                    <textarea
                      value={soapObjective}
                      onChange={e => setSoapObjective(e.target.value)}
                      placeholder={isAr ? 'مثال: نبضات القلب سريعة، الصدر خالٍ من الخشخشة...' : 'e.g. Chest clear to auscultation, sinus tachycardia present...'}
                      className={`${s.input} min-h-[90px] p-3 resize-none !bg-black/60 !h-auto text-sm`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                      {isAr ? 'A - التقييم الطبي والتشخيص (Assessment)' : 'A - Assessment (Differential Diagnosis)'}
                    </label>
                    <textarea
                      value={soapAssessment}
                      onChange={e => setSoapAssessment(e.target.value)}
                      placeholder={isAr ? 'مثال: اشتباه ذبحة صدرية غير مستقرة، استبعاد احتشاء عضلة القلب...' : 'e.g. Rule out unstable angina, suspected ACS...'}
                      className={`${s.input} min-h-[90px] p-3 resize-none !bg-black/60 !h-auto text-sm`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                      {isAr ? 'P - الخطة العلاجية والمتابعة (Plan)' : 'P - Plan (Treatment & Follow-up)'}
                    </label>
                    <textarea
                      value={soapPlan}
                      onChange={e => setSoapPlan(e.target.value)}
                      placeholder={isAr ? 'مثال: إعطاء أسبرين 300 مجم، طلب رسم قلب فوري، تحويل للمستشفى...' : 'e.g. Admit to CCU, ECG immediately, start aspirin 325mg...'}
                      className={`${s.input} min-h-[90px] p-3 resize-none !bg-black/60 !h-auto text-sm`}
                    />
                  </div>
                </div>
              </div>

              {/* Patient Referral Section */}
              <div className="border-t border-white/5 pt-5">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="referPatientCheck"
                    checked={!!referralTargetType}
                    onChange={e => {
                      if (!e.target.checked) {
                        setReferralTargetType('');
                        setReferralTargetOrgId('');
                        setReferralNotes('');
                      } else {
                        setReferralTargetType('clinic');
                      }
                    }}
                    className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-white/10"
                  />
                  <label htmlFor="referPatientCheck" className="text-sm font-bold text-cyan-300 cursor-pointer select-none">
                    {isAr ? 'تحويل المريض إلى عيادة / معمل / مركز أشعة آخر' : 'Refer patient to another clinic, lab, or radiology center'}
                  </label>
                </div>

                {!!referralTargetType && (
                  <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col gap-4 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-400">{isAr ? 'نوع الجهة المستهدفة:' : 'Target Entity Type:'}</label>
                        <div className="relative w-full">
                          <select
                            value={referralTargetType}
                            onChange={e => {
                              setReferralTargetType(e.target.value);
                              setReferralTargetOrgId('');
                            }}
                            className={`${s.inputSm} w-full appearance-none cursor-pointer pe-10 ps-3`}
                          >
                            <option value="clinic">{isAr ? 'عيادة طبيب زميل' : 'Fellow Doctor Clinic'}</option>
                            <option value="lab">{isAr ? 'معمل تحاليل' : 'Medical Laboratory'}</option>
                            <option value="radiology">{isAr ? 'مركز أشعة' : 'Radiology Center'}</option>
                          </select>
                          <div className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none">
                            <ChevronDown className="w-4 h-4 text-emerald-500/80" />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-400">{isAr ? 'اختر الجهة المحددة:' : 'Select Target Destination:'}</label>
                        <div className="relative w-full">
                          <select
                            value={referralTargetOrgId}
                            onChange={e => setReferralTargetOrgId(e.target.value)}
                            className={`${s.inputSm} w-full appearance-none cursor-pointer pe-10 ps-3`}
                            required
                          >
                            <option value="">{isAr ? 'اختر جهة التحويل...' : 'Select destination...'}</option>
                            {referTargets
                              .filter(org => org.type === referralTargetType)
                              .map(org => (
                                <option key={org.id} value={org.id}>
                                  {isAr ? org.nameAr : org.name} ({isAr ? org.cityAr : org.city})
                                </option>
                              ))}
                          </select>
                          <div className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none">
                            <ChevronDown className="w-4 h-4 text-emerald-500/80" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-400">{isAr ? 'ملاحظات التحويل والسبب الطبي:' : 'Referral Reason & Notes:'}</label>
                      <textarea
                        value={referralNotes}
                        onChange={e => setReferralNotes(e.target.value)}
                        placeholder={isAr ? 'اكتب هنا تفاصيل وسبب التحويل لتقديمه للجهة المستهدفة...' : 'Write clinical referral instructions...'}
                        className={`${s.input} min-h-[60px] p-3 resize-none !bg-black/60 !h-auto text-sm`}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 italic">
                      {isAr 
                        ? 'سيقوم النظام بإنشاء وطباعة خطاب التحويل الرسمي تلقائياً فور النقر على "حفظ سجل الزيارة الطبي" أدناه.' 
                        : 'System will auto-generate and print the referral document upon clicking "Save Clinical Visit" below.'}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={handleSaveVisit}
                className={`${s.btnPrimary} !bg-gradient-to-r !from-cyan-500 !to-blue-600 !border-cyan-400/50 self-end md:px-12`}
              >
                {isAr ? 'حفظ سجل الزيارة الطبي' : 'Save Clinical Visit'}
              </button>
            </InnerCard>
          </Card>
        )}

        {/* ── AI & Prescription ── */}
        {tab === 'aiPrescription' && (
          <div className="flex flex-col lg:flex-row gap-4 min-h-full md:h-full min-h-0 animate-in slide-in-from-bottom-4">

            {/* Left: inquiries + AI */}
            <div className="flex-1 flex flex-col gap-4 overflow-visible md:overflow-y-auto min-h-0">

              {/* Pharmacy inquiries */}
              <Card className="!p-5 border-cyan-500/30 shrink-0">
                <h3 className="font-black text-white text-xl flex items-center gap-3 mb-4">
                  <MessageSquare className="w-6 h-6 text-cyan-400" /> {t('pharmacyInquiries')}
                </h3>
                {activeInquiries.length === 0
                  ? <p className="text-slate-500 font-bold text-sm italic">{t('noInquiries')}</p>
                  : activeInquiries.map(inq => (
                    <div key={inq.id} className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col gap-3 mb-3">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-bold text-slate-400">{isAr ? 'الصيدلية' : 'Pharmacy'}</span>
                        <span className={`${s.badge} ${inq.status === 'Pending' ? '!bg-amber-500/20 !text-amber-400 !border-amber-400/50' : '!bg-green-500/20 !text-green-300 !border-green-500/50'}`}>
                          {inq.status === 'Pending' ? t('pendingInquiry') : t('repliedInquiry')}
                        </span>
                      </div>
                      <p className="text-base font-bold text-white">{inq.message}</p>
                      {inq.status === 'Pending' ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder={isAr ? 'اكتب الرد...' : 'Write reply...'}
                            value={replyTexts[inq.id] || ''}
                            onChange={e => setReplyTexts(prev => ({ ...prev, [inq.id]: e.target.value }))}
                            className={`${s.inputSm} flex-1`}
                          />
                          <button onClick={() => handleSendReply(inq.id)} className={`${s.btnPrimary} !h-10 text-xs`}>
                            {t('sendReply')}
                          </button>
                        </div>
                      ) : (
                        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                          <span className="text-xs font-black text-green-400 block mb-1">{t('doctorReply')}:</span>
                          <p className="text-sm font-bold text-white">{inq.reply}</p>
                        </div>
                      )}
                    </div>
                  ))
                }
              </Card>

              {/* AI Copilot */}
              <Card className="flex-1 flex flex-col gap-4 !border-fuchsia-500/30 min-h-[280px]">
                <h3 className="font-black text-white text-2xl flex items-center gap-3">
                  <BrainCircuit className="w-8 h-8 text-fuchsia-400" /> {t('askAI')}
                </h3>
                <textarea
                  className={`${s.input} min-h-[100px] p-4 resize-none !bg-black/60`}
                  placeholder={t('aiPrompt')}
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                />
                <button onClick={handleAIGenerate} className={`${s.btnAI} w-full`}>
                  <Sparkles className="w-5 h-5" />
                  {isAiLoading ? (isAr ? 'جاري التحليل...' : 'Analyzing...') : t('generateReport')}
                </button>
                {aiResponse && (
                  <div className="p-4 bg-fuchsia-900/20 border border-fuchsia-500/40 rounded-2xl animate-in zoom-in-95">
                    <h4 className="font-black text-fuchsia-300 mb-2">{isAr ? 'تحليل الذكاء الاصطناعي:' : 'AI Analysis:'}</h4>
                    <p className="text-white font-bold leading-relaxed whitespace-pre-line text-sm">{aiResponse}</p>
                  </div>
                )}
                {aiError && (
                  <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-2xl animate-in zoom-in-95 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <span>{isAr ? 'خطأ في الاتصال بمساعد الذكاء الاصطناعي' : 'AI Assistant Connection Error'}</span>
                    </div>
                    <p className="text-xs text-red-300 font-medium leading-relaxed">{aiError}</p>
                    <button
                      onClick={handleAIGenerate}
                      className="mt-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 self-start transition-colors"
                    >
                      <span>{isAr ? 'إعادة المحاولة' : 'Try Again'}</span>
                    </button>
                  </div>
                )}
              </Card>
            </div>

            {/* Right: drug library + prescription */}
            <div className="w-full lg:w-[45%] flex flex-col gap-4 min-h-full md:h-full min-h-0">

              {/* Drug library */}
              <InnerCard className="flex-1 flex flex-col min-h-[220px] overflow-visible md:overflow-hidden">
                <h3 className="font-black text-white mb-3 flex items-center gap-2 text-lg">
                  <Package className="w-5 h-5 text-cyan-400" /> {t('specialtyDrugs')}
                </h3>
                <div className="flex-1 overflow-visible md:overflow-y-auto flex flex-col gap-2 pe-1">
                  {currentDrugs.map((drug, idx) => (
                    <div key={idx} className="bg-black/50 border border-white/5 p-3 rounded-xl flex justify-between items-center hover:bg-black/70 transition-colors">
                      <div className="flex-1 min-w-0 pe-3">
                        <h4 className="font-black text-cyan-300 truncate">{drug.name}</h4>
                        <p className="text-xs text-slate-400 font-bold leading-tight mt-1 line-clamp-2">{drug.desc}</p>
                      </div>
                      <button
                        onClick={() => addDrugFromLibrary(drug)}
                        className="bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 p-2 rounded-lg border border-cyan-400/30 transition-colors shrink-0 flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </InnerCard>

              {/* Live prescription */}
              <InnerCard className="flex-1 flex flex-col min-h-[280px] border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-black text-white text-lg">
                    <Pill className="inline w-5 h-5 text-emerald-400 me-2" /> {t('prescription')}
                  </h3>
                  <span className={`${s.badge} !bg-emerald-500/20 !text-emerald-300 !border-emerald-500/50`}>{rx.length}</span>
                </div>

                <div className="flex-1 overflow-visible md:overflow-y-auto flex flex-col gap-3 pe-1">
                  {rx.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-500 font-bold text-center text-sm">
                      {isAr ? 'لم تُضف أدوية بعد' : 'No drugs added yet'}
                    </div>
                  ) : rx.map((drug, idx) => (
                    <div key={idx} className="bg-emerald-900/20 border border-emerald-500/30 p-3 rounded-xl animate-in zoom-in-95">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-black text-white">{drug.name}</span>
                        <button onClick={() => setRx(prev => prev.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-400 p-1">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          placeholder={t('dosage')} value={drug.dosage}
                          onChange={e => updateDrugField(idx, 'dosage', e.target.value)}
                          className={`${s.inputSm} !h-8 !text-xs`}
                        />
                        <input
                          placeholder={t('frequency')} value={drug.frequency}
                          onChange={e => updateDrugField(idx, 'frequency', e.target.value)}
                          className={`${s.inputSm} !h-8 !text-xs`}
                        />
                        <input
                          placeholder={t('duration')} value={drug.duration}
                          onChange={e => updateDrugField(idx, 'duration', e.target.value)}
                          className={`${s.inputSm} !h-8 !text-xs`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Interaction warning */}
                {interactionResult && (
                  <div className="mt-2 p-3 bg-amber-900/20 border border-amber-500/30 rounded-xl">
                    <p className="text-xs font-bold text-amber-300 whitespace-pre-line">{interactionResult}</p>
                  </div>
                )}

                <div className="flex flex-col gap-2 mt-3">
                  <button
                    onClick={checkInteractions}
                    className={`${s.btnSec} w-full !h-10 text-sm !text-amber-300`}
                    disabled={isInteractionLoading}
                  >
                    <AlertCircle className="w-4 h-4" />
                    {isInteractionLoading ? t('checkingInteractions') : t('drugInteraction')}
                  </button>
                  <div className="flex gap-2">
                    <button onClick={handlePrint} className={`${s.btnSec} flex-1 !h-10 text-sm`}>
                      <Printer className="w-4 h-4" /> {t('printPrescription')}
                    </button>
                    <button
                      onClick={handleSendToPharmacy}
                      className={`${s.btnPrimary} flex-[2] !bg-gradient-to-r !from-emerald-500 !to-teal-700 !border-emerald-400/50 !h-10 text-sm`}
                    >
                      {t('sendToPharmacy')}
                    </button>
                  </div>
                </div>

                {/* Custom Drug Inputs */}
                <div className="mt-4 p-3 bg-black/40 border border-white/5 rounded-2xl flex flex-col gap-2 shrink-0">
                  <h4 className="text-xs font-black text-cyan-400 uppercase tracking-widest">{isAr ? 'إضافة دواء مخصص يدوياً:' : 'Add Custom Medication Manually:'}</h4>
                  <input
                    placeholder={isAr ? 'اسم الدواء...' : 'Medication name...'}
                    value={customDrugName}
                    onChange={e => setCustomDrugName(e.target.value)}
                    className={`${s.inputSm} !h-8 !text-xs`}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      placeholder={t('dosage')}
                      value={customDrugDosage}
                      onChange={e => setCustomDrugDosage(e.target.value)}
                      className={`${s.inputSm} !h-8 !text-xs`}
                    />
                    <input
                      placeholder={t('frequency')}
                      value={customDrugFreq}
                      onChange={e => setCustomDrugFreq(e.target.value)}
                      className={`${s.inputSm} !h-8 !text-xs`}
                    />
                    <input
                      placeholder={t('duration')}
                      value={customDrugDur}
                      onChange={e => setCustomDrugDur(e.target.value)}
                      className={`${s.inputSm} !h-8 !text-xs`}
                    />
                  </div>
                  <button
                    onClick={handleAddCustomDrug}
                    className="bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 py-1 px-3 rounded-lg border border-cyan-400/30 transition-colors text-xs font-bold self-end"
                  >
                    {isAr ? 'إضافة للروشتة' : 'Add to Rx'}
                  </button>
                </div>
              </InnerCard>
            </div>
          </div>
        )}

      </div>

      {/* Request Patient Record Modal */}
      <GlassModal isOpen={isRequestModalOpen} title={isAr ? 'طلب ملف مريض من عيادة أخرى' : 'Request Patient Record'} onClose={() => setIsRequestModalOpen(false)}>
        <div className="p-6 flex flex-col gap-4">
          <p className="text-sm text-slate-400 font-bold leading-relaxed">
            {isAr 
              ? 'يمكنك طلب الوصول إلى الملف الطبي لمريض من عيادة طبيب أخر باستخدام رقم هاتف المريض المسجل. سيتعين على الطبيب الآخر الموافقة على الطلب لمشاركة البيانات.' 
              : 'You can request access to a patient\'s medical file from another doctor using the patient\'s registered phone number. The other doctor must approve this request to share the file.'}
          </p>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400">{isAr ? 'اختر العيادة المستهدفة / الطبيب' : 'Select Target Clinic / Doctor'}</label>
            <div className="relative w-full">
              <select
                value={reqTargetOrgId}
                onChange={e => setReqTargetOrgId(e.target.value)}
                className={`${s.input} w-full appearance-none cursor-pointer pe-10 ps-4`}
              >
                <option value="">{isAr ? 'اختر العيادة...' : 'Select clinic...'}</option>
                {otherClinics.map(org => (
                  <option key={org.id} value={org.id}>{isAr ? org.nameAr : org.name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 end-0 flex items-center pe-4 pointer-events-none">
                <ChevronDown className="w-5 h-5 text-emerald-500/80" />
              </div>
            </div>
          </div>
          <Input
            label={isAr ? 'رقم هاتف المريض' : 'Patient Phone Number'}
            placeholder="01xxxxxxxxx"
            value={reqPhone}
            onChange={e => setReqPhone(e.target.value)}
          />
          <div className="flex gap-3 justify-end mt-2">
            <button
              onClick={() => setIsRequestModalOpen(false)}
              className={s.btnSec}
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleRequestSubmit}
              className={s.btnPrimary}
            >
              {isAr ? 'إرسال الطلب' : 'Send Request'}
            </button>
          </div>
        </div>
      </GlassModal>

      {/* Add Patient Modal */}
      <GlassModal
        isOpen={isAddPatientOpen}
        title={isAr ? 'تسجيل مريض جديد بالكامل' : 'Register New Patient'}
        onClose={() => setIsAddPatientOpen(false)}
      >
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
            {/* Full Name */}
            <div className="md:col-span-2">
              <Input
                label={isAr ? 'الاسم الرباعي الكامل' : 'Full Name'}
                placeholder={isAr ? 'أدخل الاسم الكامل للمريض...' : 'Enter patient name...'}
                value={newPatientForm.fullName}
                onChange={e => setNewPatientForm(prev => ({ ...prev, fullName: e.target.value }))}
                error={newPatientErrors.fullName}
                required
              />
            </div>
            
            {/* Phone Number */}
            <Input
              label={isAr ? 'رقم الهاتف' : 'Phone Number'}
              placeholder="01xxxxxxxxx"
              value={newPatientForm.phone}
              onChange={e => setNewPatientForm(prev => ({ ...prev, phone: e.target.value }))}
              error={newPatientErrors.phone}
              required
            />

            {/* Date of Birth */}
            <Input
              label={isAr ? 'تاريخ الميلاد' : 'Date of Birth'}
              type="date"
              value={newPatientForm.dob}
              onChange={e => setNewPatientForm(prev => ({ ...prev, dob: e.target.value }))}
            />

            {/* Gender */}
            <div className="flex flex-col gap-1.5 relative">
              <label className={s.label}>{isAr ? 'الجنس' : 'Gender'}</label>
              <div className="relative w-full">
                <select
                  value={newPatientForm.gender}
                  onChange={e => setNewPatientForm(prev => ({ ...prev, gender: e.target.value }))}
                  className={`${s.input} appearance-none cursor-pointer pe-10 ps-4`}
                >
                  <option value="male">{isAr ? 'ذكر' : 'Male'}</option>
                  <option value="female">{isAr ? 'أنثى' : 'Female'}</option>
                </select>
                <div className="absolute inset-y-0 end-0 flex items-center pe-4 pointer-events-none">
                  <ChevronDown className="w-5 h-5 text-emerald-500/80" />
                </div>
              </div>
            </div>

            {/* Known Allergies */}
            <Input
              label={isAr ? 'الحساسية المعروفة (أو اكتب لا يوجد)' : 'Known Allergies'}
              placeholder={isAr ? 'مثل: البنسلين، أسبيرين...' : 'e.g. Penicillin, Aspirin...'}
              value={newPatientForm.allergies}
              onChange={e => setNewPatientForm(prev => ({ ...prev, allergies: e.target.value }))}
            />

            {/* Chronic Diseases Selection */}
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label className={s.label}>{isAr ? 'الأمراض المزمنة (إن وجدت)' : 'Chronic Diseases (if any)'}</label>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {newPatientForm.chronicDiseases.map(code => {
                  const icd = ICD_10.find(i => i.code === code);
                  return (
                    <span key={code} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-300 border border-red-500/20 text-xs font-bold transition-all duration-200">
                      <span>{code}: {isAr ? icd?.ar : icd?.en}</span>
                      <button
                        type="button"
                        onClick={() => setNewPatientForm(prev => ({
                          ...prev,
                          chronicDiseases: prev.chronicDiseases.filter(c => c !== code)
                        }))}
                        className="hover:text-red-400 font-bold ml-1 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  );
                })}
                {newPatientForm.chronicDiseases.length === 0 && (
                  <span className="text-xs text-slate-500 italic px-1 py-1">{isAr ? 'لا توجد أمراض مزمنة محددة' : 'No chronic diseases selected'}</span>
                )}
              </div>
              <div className="relative w-full">
                <select
                  value=""
                  onChange={e => {
                    const code = e.target.value;
                    if (code && !newPatientForm.chronicDiseases.includes(code)) {
                      setNewPatientForm(prev => ({
                        ...prev,
                        chronicDiseases: [...prev.chronicDiseases, code]
                      }));
                    }
                  }}
                  className={`${s.inputSm} appearance-none cursor-pointer pe-10 ps-3`}
                >
                  <option value="">{isAr ? 'اختر مرضاً مزمناً لإضافته...' : 'Select chronic disease to add...'}</option>
                  {activeSpecialtyDiags.map(d => (
                    <option key={d.code} value={d.code}>{d.code}: {isAr ? d.ar : d.en}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-emerald-500/80" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-2">
            <button
              onClick={() => setIsAddPatientOpen(false)}
              className={s.btnSec}
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleAddPatientSubmit}
              className={s.btnPrimary}
            >
              {isAr ? 'حفظ وتسجيل المريض' : 'Save & Register Patient'}
            </button>
          </div>
        </div>
      </GlassModal>

      {/* DICOM Modal */}
      <GlassModal isOpen={!!dicomPreview} title={t('dicomViewer')} onClose={() => setDicomPreview(null)} fullScreen>
        <div className="flex-1 bg-black flex items-center justify-center p-4 rounded-b-2xl h-full">
          <img src={dicomPreview} alt="DICOM" className="max-w-full max-h-full object-contain mix-blend-screen" />
        </div>
      </GlassModal>
    </div>
  );
}
