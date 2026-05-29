import { useState } from 'react';
import { Plus, X, Send, Activity, Clock, CheckCircle, FolderOpen, FileImage, AlertCircle } from 'lucide-react';
import { useClinic } from '../contexts/ClinicContext';
import { Card, InnerCard, s } from './shared';

const SPECIALTY_TESTS = {
  general: {
    labs: [
      { id: 'CBC', name: 'Complete Blood Count (CBC)', nameAr: 'صورة الدم الكاملة' },
      { id: 'BMP', name: 'Basic Metabolic Panel (BMP)', nameAr: 'الفحوصات الأساسية للتمثيل الغذائي' },
      { id: 'LFT', name: 'Liver Function Tests (LFT)', nameAr: 'وظائف الكبد' },
      { id: 'RFT', name: 'Renal Function Tests (RFT)', nameAr: 'وظائف الكلى' },
      { id: 'Lipid', name: 'Lipid Profile', nameAr: 'ملف دهون الدم كاملة' },
      { id: 'HbA1c', name: 'Glycated Hemoglobin (HbA1c)', nameAr: 'السكر التراكمي' },
      { id: 'TSH', name: 'Thyroid Stimulating Hormone (TSH)', nameAr: 'هرمون الغدة الدرقية' },
      { id: 'Urine-Ana', name: 'Urine Analysis & Culture', nameAr: 'تحليل ومزرعة بول' },
    ],
    imaging: [
      { id: 'XRay-Chest', name: 'Chest X-Ray (AP/Lateral)', nameAr: 'أشعة عادية على الصدر' },
      { id: 'US-Abdomen', name: 'Abdominal & Pelvic Ultrasound', nameAr: 'سونار البطن والحوض' },
      { id: 'CT-Brain', name: 'Brain CT Scan', nameAr: 'أشعة مقطعية على المخ' },
      { id: 'ECG', name: 'Electrocardiogram (ECG)', nameAr: 'رسم القلب الكهربائي' },
    ]
  },
  cardiology: {
    labs: [
      { id: 'Troponin', name: 'Cardiac Troponin I/T', nameAr: 'إنزيمات القلب (تروبونين)' },
      { id: 'CK-MB', name: 'Creatine Kinase-MB (CK-MB)', nameAr: 'إنزيم القلب CK-MB' },
      { id: 'BNP', name: 'B-type Natriuretic Peptide (BNP)', nameAr: 'مؤشر قصور القلب BNP' },
      { id: 'Lipid', name: 'Lipid Profile (Cholesterol, TG, HDL, LDL)', nameAr: 'ملف دهون الدم كاملة' },
      { id: 'Coagulation', name: 'PT / INR (Coagulation Profile)', nameAr: 'فحص سيولة الدم وتجلطه' },
      { id: 'D-Dimer', name: 'D-Dimer Test', nameAr: 'تحليل د-دايمر للجلطات' },
    ],
    imaging: [
      { id: 'ECG', name: 'Standard 12-Lead ECG', nameAr: 'رسم القلب الكهربائي بـ 12 قناة' },
      { id: 'Echo-TTE', name: 'Transthoracic Echocardiography (Echo)', nameAr: 'أشعة موجات صوتية على القلب (إيكو)' },
      { id: 'Holter', name: '24-Hour Holter Monitoring', nameAr: 'جهاز هولتر لمراقبة ضربات القلب 24 ساعة' },
      { id: 'Stress-ECG', name: 'Exercise Stress Test (Treadmill)', nameAr: 'رسم قلب بالمجهود (جهاز الجري)' },
      { id: 'CT-Coronary', name: 'Coronary CT Angiography (CCTA)', nameAr: 'أشعة مقطعية بالصبغة على الشرايين التاجية' },
      { id: 'MRI-Cardiac', name: 'Cardiac MRI Scan', nameAr: 'رنين مغناطيسي على القلب' },
    ]
  },
  orthopedics: {
    labs: [
      { id: 'RF', name: 'Rheumatoid Factor (RF)', nameAr: 'عامل الروماتويد' },
      { id: 'Anti-CCP', name: 'Anti-Cyclic Citrullinated Peptide', nameAr: 'تحليل الروماتويد النوعي Anti-CCP' },
      { id: 'UricAcid', name: 'Serum Uric Acid (Gout Check)', nameAr: 'حمض البوليك (النقرس)' },
      { id: 'ESR-CRP', name: 'ESR & C-Reactive Protein (CRP)', nameAr: 'مؤشرات الالتهاب وسرعة الترسيب' },
      { id: 'Calcium-D3', name: 'Calcium & Vitamin D3 Levels', nameAr: 'الكالسيوم وفيتامين د3' },
    ],
    imaging: [
      { id: 'XRay-Spine', name: 'Spine X-Ray (Cervical/Lumbar)', nameAr: 'أشعة عادية على العمود الفقري' },
      { id: 'XRay-Joint', name: 'Joint X-Ray (Affected Area)', nameAr: 'أشعة عادية على المفصل المصاب' },
      { id: 'MRI-Joint', name: 'Joint MRI (Knee/Shoulder/Hip)', nameAr: 'رنين مغناطيسي على المفصل' },
      { id: 'MRI-Spine', name: 'Spine MRI (Cervical/Thoracic/Lumbar)', nameAr: 'رنين مغناطيسي على العمود الفقري' },
      { id: 'CT-Bone-3D', name: '3D CT Bone Reconstruction', nameAr: 'أشعة مقطعية ثلاثية الأبعاد للعظام' },
      { id: 'DEXA', name: 'DEXA Bone Density Scan', nameAr: 'قياس كثافة العظام (ديكسا)' },
      { id: 'US-MSK', name: 'Musculoskeletal Ultrasound (MSK)', nameAr: 'سونار على الأوتار والأربطة' },
    ]
  },
  pediatrics: {
    labs: [
      { id: 'CBC-Diff', name: 'CBC with Differential', nameAr: 'صورة دم كاملة مع تفصيل الخلايا' },
      { id: 'CRP-Ped', name: 'C-Reactive Protein (CRP) Quantitative', nameAr: 'بروتين سي التفاعلي للأطفال' },
      { id: 'Stool-Culture', name: 'Stool Analysis & Culture', nameAr: 'تحليل ومزرعة براز للأطفال' },
      { id: 'Urine-Culture-Ped', name: 'Urine Culture & Sensitivity (Pediatric)', nameAr: 'تحليل ومزرعة بول للأطفال' },
      { id: 'Neonatal-TSH', name: 'Neonatal Thyroid Panel (TSH/T4)', nameAr: 'تحليل الغدة لحديثي الولادة' },
    ],
    imaging: [
      { id: 'XRay-Chest-Ped', name: 'Chest X-Ray Pediatric (AP)', nameAr: 'أشعة عادية على الصدر للأطفال' },
      { id: 'US-Hip-Ped', name: 'Hip Ultrasound (Developmental Dysplasia)', nameAr: 'سونار مفصل الحوض للرضع' },
      { id: 'US-Cranial-Ped', name: 'Cranial Ultrasound (Infant)', nameAr: 'سونار على المخ لحديثي الولادة' },
      { id: 'US-Abdomen-Ped', name: 'Abdominal Ultrasound Pediatric', nameAr: 'سونار على بطن الطفل' },
    ]
  },
  obgyn: {
    labs: [
      { id: 'Preg-hCG', name: 'Beta-hCG Quantitative (Pregnancy Tracker)', nameAr: 'تحليل الحمل الرقمي كمي' },
      { id: 'Hormone-Panel', name: 'LH, FSH, Prolactin, Progesterone', nameAr: 'هرمونات الخصوبة والحليب والتبويض' },
      { id: 'TORCH', name: 'TORCH Screening Panel (IgG/IgM)', nameAr: 'مسح الفيروسات للحوامل' },
      { id: 'OGTT', name: 'Oral Glucose Tolerance Test (OGTT)', nameAr: 'اختبار تحمل الجلوكوز للحوامل' },
      { id: 'Vaginal-Swab', name: 'Vaginal Swab Culture & Sensitivity', nameAr: 'مسحة مهبلية ومزرعتها' },
      { id: 'Pap-Smear', name: 'Pap Smear Liquid Cytology', nameAr: 'تحليل مسحة عنق الرحم' },
    ],
    imaging: [
      { id: 'US-Pelvis-TAS', name: 'Pelvic Ultrasound (Transabdominal)', nameAr: 'سونار الحوض عبر البطن' },
      { id: 'US-Pelvis-TVS', name: 'Pelvic Ultrasound (Transvaginal)', nameAr: 'سونار الحوض المهبلي' },
      { id: 'US-Fetal-3D', name: '3D/4D Obstetric Fetal Ultrasound', nameAr: 'سونار الجنين ثلاثي/رباعي الأبعاد' },
      { id: 'Mammography', name: 'Mammography Bilateral (Breast Scan)', nameAr: 'أشعة الماموجرام للثدي' },
      { id: 'HSG', name: 'Hysterosalpingography (HSG)', nameAr: 'أشعة بالصبغة على الرحم والأنابيب' },
      { id: 'Echo-Fetal', name: 'Fetal Echocardiography', nameAr: 'موجات صوتية على قلب الجنين' },
    ]
  },
  dermatology: {
    labs: [
      { id: 'IgE-Total', name: 'Total IgE Level (Allergy Check)', nameAr: 'مستوى الأجسام المضادة للحساسية IgE' },
      { id: 'ANA-Panel', name: 'Antinuclear Antibody (ANA) Screen', nameAr: 'تحليل الأجسام المضادة للأمراض المناعية' },
      { id: 'Fungal-KOH', name: 'Fungal Scraping & KOH Prep', nameAr: 'تحليل كشط الفطريات المجهري' },
      { id: 'Skin-Culture', name: 'Bacterial/Fungal Skin Culture', nameAr: 'مزرعة بكتيرية وفطرية من الجلد' },
    ],
    imaging: [
      { id: 'Dermoscopy', name: 'Structured Dermoscopy Study', nameAr: 'فحص منظار الجلد الرقمي (الدرموسكوب)' },
      { id: 'Skin-Biopsy', name: 'Punch/Shave Skin Biopsy Histology', nameAr: 'عينة جلدية للفحص الهيستوباثولوجي' },
      { id: 'Wood-Lamp', name: 'Wood Lamp Diagnostic Scan', nameAr: 'فحص مصباح وود للأمراض الفطرية والبهاق' },
    ]
  },
  internal_medicine: {
    labs: [
      { id: 'CBC', name: 'Complete Blood Count (CBC)', nameAr: 'صورة الدم الكاملة' },
      { id: 'HbA1c', name: 'Glycated Hemoglobin (HbA1c)', nameAr: 'السكر التراكمي' },
      { id: 'Liver-Profile', name: 'LFT (ALT, AST, Bilirubin, Albumin)', nameAr: 'لوحة وظائف الكبد كاملة' },
      { id: 'Kidney-Profile', name: 'RFT (Urea, Creatinine, eGFR)', nameAr: 'لوحة وظائف الكلى كاملة' },
      { id: 'TSH-Med', name: 'Free T3, Free T4, TSH Panel', nameAr: 'لوحة هرمونات الغدة الدرقية' },
      { id: 'Lipid-Med', name: 'Lipid Profile (HDL, LDL, Chol, TG)', nameAr: 'ملف دهون الدم كاملة' },
    ],
    imaging: [
      { id: 'US-Abdomen', name: 'Abdominal & Pelvic Ultrasound', nameAr: 'سونار البطن والحوض' },
      { id: 'XRay-Chest', name: 'Chest X-Ray (AP/Lateral)', nameAr: 'أشعة عادية على الصدر' },
      { id: 'CT-Abdo-Pelvis', name: 'CT Abdomen & Pelvis (with Contrast)', nameAr: 'أشعة مقطعية بالصبغة على البطن والحوض' },
      { id: 'Upper-Endo', name: 'Upper GI Endoscopy (EGD)', nameAr: 'منظار الجهاز الهضمي العلوي' },
      { id: 'Colonoscopy', name: 'Colonoscopy (Lower GI)', nameAr: 'منظار القولون والأمعاء' },
    ]
  },
  neurology: {
    labs: [
      { id: 'Vit-B12', name: 'Vitamin B12 & Folate Levels', nameAr: 'مستوى فيتامين ب12 وحمض الفوليك' },
      { id: 'AChR-Ab', name: 'Anti-AChR Receptor Antibodies', nameAr: 'مضادات مستقبلات الأسيتيل كولين' },
      { id: 'CSF-Panel', name: 'CSF Analysis (Protein, Glucose, Culture)', nameAr: 'تحليل السائل النخاعي CSF' },
    ],
    imaging: [
      { id: 'MRI-Brain', name: 'Brain MRI (Multi-Sequence / Contrast)', nameAr: 'رنين مغناطيسي على المخ بالصبغة' },
      { id: 'CT-Brain-Neuro', name: 'Brain & Spine CT Scan', nameAr: 'أشعة مقطعية على المخ والفقرات' },
      { id: 'EEG', name: 'Electroencephalogram (EEG)', nameAr: 'رسم المخ الكهربائي' },
      { id: 'EMG-NCS', name: 'Electromyography & Nerve Conduction (EMG)', nameAr: 'رسم العضلات وسرعة توصيل الأعصاب' },
      { id: 'Carotid-Duplex', name: 'Carotid & Vertebral Duplex Scan', nameAr: 'أشعة الدوبلكس على الشرايين السباتية' },
    ]
  },
  physical_therapy: {
    labs: [
      { id: 'ESR-CRP', name: 'ESR & C-Reactive Protein (CRP)', nameAr: 'سرعة الترسيب وبروتين سي التفاعلي' },
      { id: 'CBC', name: 'Complete Blood Count (CBC)', nameAr: 'صورة الدم الكاملة' },
      { id: 'UricAcid', name: 'Serum Uric Acid (Gout Check)', nameAr: 'حمض البوليك (النقرس)' },
      { id: 'RF', name: 'Rheumatoid Factor (RF)', nameAr: 'عامل الروماتويد' },
    ],
    imaging: [
      { id: 'MRI-Spine', name: 'Spine MRI (Cervical/Lumbar)', nameAr: 'رنين مغناطيسي على العمود الفقري' },
      { id: 'XRay-Spine', name: 'Spine X-Ray (Cervical/Lumbar)', nameAr: 'أشعة عادية على العمود الفقري' },
      { id: 'XRay-Joint', name: 'Joint X-Ray (Affected Area)', nameAr: 'أشعة عادية على المفصل المصاب' },
      { id: 'MRI-Joint', name: 'Joint MRI (Affected Area)', nameAr: 'رنين مغناطيسي على المفصل المصاب' },
      { id: 'US-MSK', name: 'Musculoskeletal Ultrasound (MSK)', nameAr: 'سونار على الجهاز الحركي (أوتار وعضلات)' },
    ]
  }
};

const SPECIALTIES_KEYS = ['general', 'cardiology', 'orthopedics', 'pediatrics', 'obgyn', 'dermatology', 'internal_medicine', 'neurology', 'physical_therapy'];

const GENERAL_COMMON_TESTS = [
  { id: 'CBC', name: 'Complete Blood Count (CBC)', nameAr: 'صورة الدم الكاملة', type: 'labs' },
  { id: 'BMP', name: 'Basic Metabolic Panel (BMP)', nameAr: 'الفحوصات الأساسية للتمثيل الغذائي', type: 'labs' },
  { id: 'LFT', name: 'Liver Function Tests (LFT)', nameAr: 'وظائف الكبد', type: 'labs' },
  { id: 'RFT', name: 'Renal Function Tests (RFT)', nameAr: 'وظائف الكلى', type: 'labs' },
  { id: 'Lipid', name: 'Lipid Profile', nameAr: 'ملف دهون الدم كاملة', type: 'labs' },
  { id: 'HbA1c', name: 'Glycated Hemoglobin (HbA1c)', nameAr: 'السكر التراكمي', type: 'labs' },
  { id: 'TSH', name: 'Thyroid Stimulating Hormone (TSH)', nameAr: 'هرمون الغدة الدرقية', type: 'labs' },
  { id: 'Urine-Ana', name: 'Urine Analysis & Culture', nameAr: 'تحليل ومزرعة بول', type: 'labs' },
  { id: 'FastingGlucose', name: 'Fasting Blood Glucose', nameAr: 'السكر الصائم', type: 'labs' },
  { id: 'XRay-Chest', name: 'Chest X-Ray (AP/Lateral)', nameAr: 'أشعة عادية على الصدر', type: 'imaging' },
  { id: 'US-Abdomen', name: 'Abdominal & Pelvic Ultrasound', nameAr: 'سونار البطن والحوض', type: 'imaging' },
  { id: 'CT-Brain', name: 'Brain CT Scan', nameAr: 'أشعة مقطعية على المخ', type: 'imaging' },
  { id: 'ECG', name: 'Electrocardiogram (ECG)', nameAr: 'رسم القلب الكهربائي', type: 'imaging' },
];

export default function LabOrderForm({ patientId, patientName, patientNameAr, doctor, specialty, onOrderCreated }) {
  const { createLabOrder, labOrders, t, isAr } = useClinic();
  const [category, setCategory] = useState('labs'); // 'labs' | 'imaging'
  const [cart, setCart] = useState([]);
  const [selectedGeneralTest, setSelectedGeneralTest] = useState('');
  const [priority, setPriority] = useState('Normal');

  // Load specialty specific tests (fallback to general)
  const specKey = SPECIALTIES_KEYS.includes(specialty) ? specialty : 'general';
  const specData = SPECIALTY_TESTS[specKey] || SPECIALTY_TESTS['general'];
  const quickOptions = category === 'labs' ? specData.labs : specData.imaging;

  // Filter general tests by selected category
  const generalDropdownOptions = GENERAL_COMMON_TESTS.filter(t => t.type === category);

  // Patient history of orders
  const patientHistory = (labOrders || []).filter(o => o.patientId === patientId);

  const handleToggleCartTest = (testItem) => {
    const isAdded = cart.some(t => t.test === testItem.id);
    if (isAdded) {
      setCart(prev => prev.filter(t => t.test !== testItem.id));
    } else {
      setCart(prev => [
        ...prev,
        {
          test: testItem.id,
          name: testItem.name,
          name_ar: testItem.nameAr,
          priority: priority,
        }
      ]);
    }
  };

  const handleAddGeneralTest = () => {
    if (!selectedGeneralTest) return;
    const testItem = GENERAL_COMMON_TESTS.find(t => t.id === selectedGeneralTest);
    if (testItem && !cart.some(t => t.test === testItem.id)) {
      setCart(prev => [
        ...prev,
        {
          test: testItem.id,
          name: testItem.name,
          name_ar: testItem.nameAr,
          priority: priority,
        }
      ]);
      setSelectedGeneralTest('');
    }
  };

  const handleRemoveCartItem = (testId) => {
    setCart(prev => prev.filter(t => t.test !== testId));
  };

  const handleSubmitOrder = () => {
    if (cart.length === 0) return;

    const order = createLabOrder({
      patientId,
      patientName,
      patientNameAr,
      doctor,
      specialty,
      requestedTests: cart,
    });

    setCart([]);
    if (onOrderCreated) onOrderCreated(order);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5 animate-spin-slow" />
            {isAr ? 'قيد الانتظار' : 'Pending'}
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            {isAr ? 'قيد المعالجة' : 'In Progress'}
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3.5 h-3.5" />
            {isAr ? 'مكتمل' : 'Completed'}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 flex-1">
      {/* Right/Form Column */}
      <div className="lg:col-span-7 flex flex-col gap-5">
        <InnerCard className="!p-5 flex flex-col gap-4 border-cyan-500/10 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Send className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                {isAr ? 'طلب فحوصات طبية جديدة' : 'New Investigation Order'}
              </h3>
              <p className="text-xs font-bold text-slate-400 mt-0.5">
                {isAr ? `الطبيب الواصف: ${doctor}` : `Ordering Clinician: ${doctor}`}
              </p>
            </div>
            
            {/* Priority and Toggle */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="text-xs font-bold text-slate-400">{isAr ? 'الأولوية:' : 'Priority:'}</span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className={`${s.inputSm} bg-slate-900 border-white/10 !h-9 text-xs py-1 font-bold ${priority === 'High' ? '!text-red-400 !border-red-500/30 bg-red-950/20' : '!text-slate-300'}`}
              >
                <option value="Normal">{isAr ? 'عادي (Normal)' : 'Normal'}</option>
                <option value="High">{isAr ? '🔴 عاجل (High)' : '🔴 High'}</option>
              </select>
            </div>
          </div>

          {/* Labs vs Imaging Tabs */}
          <div className="flex bg-black/60 p-1.5 rounded-xl border border-white/5 w-full">
            <button
              onClick={() => setCategory('labs')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black transition-all
                ${category === 'labs'
                  ? 'bg-gradient-to-br from-slate-700 to-slate-800 text-cyan-400 shadow-inner border border-slate-600'
                  : 'text-slate-400 hover:text-white'}`}
            >
              <Activity className="w-4 h-4" />
              {isAr ? 'التحاليل المخبرية (Labs)' : 'Laboratory Tests'}
            </button>
            <button
              onClick={() => setCategory('imaging')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black transition-all
                ${category === 'imaging'
                  ? 'bg-gradient-to-br from-slate-700 to-slate-800 text-cyan-400 shadow-inner border border-slate-600'
                  : 'text-slate-400 hover:text-white'}`}
            >
              <FileImage className="w-4 h-4" />
              {isAr ? 'الأشعة والتصوير الطبي' : 'Radiology & Imaging'}
            </button>
          </div>

          {/* Quick Select Chips */}
          <div>
            <h4 className="text-xs font-black text-cyan-400/90 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <span>⚡</span>
              {isAr ? 'فحوصات التخصص السريعة:' : 'Specialty Specific Quick Selection:'}
            </h4>
            <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin">
              {quickOptions.map(test => {
                const isSelected = cart.some(t => t.test === test.id);
                return (
                  <button
                    key={test.id}
                    onClick={() => handleToggleCartTest(test)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border text-start flex-1 sm:flex-none min-w-[140px] sm:min-w-0
                      ${isSelected
                        ? 'bg-cyan-500/10 text-cyan-300 border-cyan-400/50 shadow-[0_0_8px_rgba(34,211,238,0.2)]'
                        : 'bg-slate-900/40 hover:bg-slate-800/80 text-slate-300 border-white/5'}`}
                  >
                    {isAr ? test.nameAr : test.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* General Common Selection */}
          <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center bg-black/40 p-3 rounded-2xl border border-white/5">
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                {isAr ? 'البحث في الفحوصات العامة المشتركة:' : 'Search General Common Investigations:'}
              </label>
              <select
                value={selectedGeneralTest}
                onChange={(e) => setSelectedGeneralTest(e.target.value)}
                className={`w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-cyan-500`}
              >
                <option value="">
                  {isAr ? 'اختر فحصاً عاماً مشتركاً...' : 'Select a general/common test...'}
                </option>
                {generalDropdownOptions.map((test) => {
                  const isAdded = cart.some(t => t.test === test.id);
                  return (
                    <option key={test.id} value={test.id} disabled={isAdded}>
                      {isAr ? test.nameAr : test.name} {isAdded ? `(${isAr ? 'مضاف مسبقاً' : 'already added'})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
            <button
              onClick={handleAddGeneralTest}
              disabled={!selectedGeneralTest}
              className="w-full sm:w-auto px-4 h-9 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 rounded-xl transition-all font-black text-xs shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAr ? 'إضافة للطلب' : 'Add Test'}
            </button>
          </div>
        </InnerCard>

        {/* Selected Test Cart */}
        <InnerCard className="flex-1 flex flex-col min-h-0 border-emerald-500/10">
          <h3 className="text-base font-black text-white mb-3 shrink-0 flex items-center justify-between">
            <span>{isAr ? 'الفحوصات المطلوبة في هذا السند:' : 'Selected Cart Items:'}</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black">
              {cart.length}
            </span>
          </h3>

          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0 scrollbar-thin">
            {cart.map(item => (
              <div
                key={item.test}
                className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5 animate-in slide-in-from-bottom-2 duration-200"
              >
                <div className="min-w-0">
                  <p className="text-white text-sm font-bold truncate">
                    {isAr ? item.name_ar : item.name}
                  </p>
                  <span className="text-[10px] font-black text-cyan-400/80 tracking-wide bg-cyan-950/40 px-2 py-0.5 rounded-md border border-cyan-500/10">
                    {item.test}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${item.priority === 'High' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-slate-800 text-slate-400'}`}>
                    {item.priority === 'High' ? (isAr ? 'عاجل' : 'URGENT') : (isAr ? 'عادي' : 'NORMAL')}
                  </span>
                  <button
                    onClick={() => handleRemoveCartItem(item.test)}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center p-8 flex-1">
                <span className="text-3xl mb-2">📋</span>
                <p className="text-slate-500 text-xs font-black">
                  {isAr ? 'لم يتم إضافة أي فحوصات بعد. انقر على أزرار التخصص أعلاه.' : 'No items added. Click quick buttons above.'}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleSubmitOrder}
            disabled={cart.length === 0}
            className={`w-full py-3 px-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 mt-4 shrink-0
              ${cart.length === 0
                ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-950/20'}`}
          >
            <Send className="w-4 h-4" />
            {isAr ? 'إرسال الفحوصات والأشعة للمعمل والمركز' : 'Submit Orders to Lab & Scan Center'}
          </button>
        </InnerCard>
      </div>

      {/* Left/History Column */}
      <div className="lg:col-span-5 flex flex-col min-h-0">
        <Card className="h-full flex flex-col min-h-0 border-yellow-500/10">
          <div className="pb-3 border-b border-white/5 shrink-0 flex items-center gap-2 mb-4">
            <FolderOpen className="w-5.5 h-5.5 text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]" />
            <h3 className="font-black text-white text-lg">
              {isAr ? 'سجل فحوصات وأشعة المريض' : 'Patient Investigation History'}
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 scrollbar-thin">
            {patientHistory.map((order) => (
              <div
                key={order.id}
                className="bg-black/50 border border-white/5 rounded-2xl p-4 flex flex-col gap-3 relative hover:border-white/10 transition-all duration-300"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-500/10">
                      ID: {order.id}
                    </span>
                    <p className="text-xs text-slate-400 mt-1 font-bold">
                      {order.date} • {isAr ? `بواسطة: ${order.doctor}` : `By: ${order.doctor}`}
                    </p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                <div className="border-t border-white/5 pt-2.5">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    {isAr ? 'الفحوصات المطلوبة:' : 'Requested Investigations:'}
                  </h4>
                  <div className="flex flex-col gap-1.5">
                    {order.requestedTests.map((test, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-900/60 px-3 py-1.5 rounded-xl border border-white/5 text-xs">
                        <span className="text-white font-bold">
                          {isAr ? test.name_ar : test.test}
                        </span>
                        {test.priority === 'High' && (
                          <span className="text-[9px] font-black text-red-400 bg-red-950/40 px-1.5 py-0.5 rounded border border-red-500/10 uppercase">
                            {isAr ? 'عاجل' : 'Urgent'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Show Results if Completed */}
                {order.status === 'Completed' && order.results?.length > 0 && (
                  <div className="bg-emerald-950/10 border border-emerald-500/20 p-3 rounded-xl">
                    <h5 className="text-xs font-black text-emerald-400 mb-1.5 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {isAr ? 'نتائج الفحص المخبرية والتشخيصية:' : 'Test Results & Findings:'}
                    </h5>
                    <div className="flex flex-col gap-1">
                      {order.results.map((r, idx) => (
                        <div key={idx} className="text-xs text-emerald-200/90 font-bold bg-emerald-950/20 p-2 rounded-lg border border-emerald-500/10 flex justify-between gap-2">
                          <span>{r.test}:</span>
                          <span className="text-white font-black">{r.result}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {patientHistory.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center p-8 flex-1">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/[0.05] flex items-center justify-center mb-3">
                  <Activity className="w-6 h-6 text-slate-600" />
                </div>
                <p className="text-slate-500 text-xs font-bold">
                  {isAr ? 'لا يوجد طلبات فحوصات أو أشعة مسجلة سابقاً للمريض.' : 'No previous investigations or scans for this patient.'}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
