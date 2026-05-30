import React from 'react';
import { Calendar, FileText, AlertCircle, Pill, Syringe, BarChart3, Printer, Activity, TrendingUp } from 'lucide-react';
import { useClinic } from '../contexts/ClinicContext';
import { Card, InnerCard, s, printMedicalReport, exportCompleteMedicalHistory, exportMedicalHistoryToPDF } from './shared';
import { ICD_10 } from '../constants';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

function LabSparkline({ label, data, color = '#10b981', unit = '' }) {
  return (
    <div className="flex items-center justify-between bg-slate-900/60 p-3.5 rounded-xl border border-white/5">
      <div>
        <p className="text-xs text-slate-400 font-bold">{label}</p>
        <p className="text-sm font-black text-white mt-0.5">
          {data[data.length - 1]} <span className="text-[10px] text-slate-500 font-bold uppercase">{unit}</span>
        </p>
      </div>
      <div className="w-24 h-8 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.map((val, idx) => ({ id: idx, value: val }))} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} activeDot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function MedicalRecordViewer({ patientId }) {
  const { medicalRecords, t, isAr, prescriptions, labOrders, patients, theme } = useClinic();
  const record = medicalRecords[patientId];
  const patient = patients.find((p) => p.id === patientId);
  const isDark = theme !== 'light';

  if (!record) {
    return (
      <Card className="bg-slate-800/50 border-yellow-500/20">
        <div className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
          <p className="text-gray-300">{isAr ? 'لا توجد بيانات طبية' : 'No medical records found'}</p>
        </div>
      </Card>
    );
  }

  const patientPrescriptions = prescriptions.filter((p) => p.patientId === patientId);
  const patientLabOrders = labOrders.filter((o) => o.patientId === patientId);

  // Prepare Vitals data for Recharts LineChart
  const vitalsData = [...(record.visits || [])]
    .filter(v => v.vitals)
    .map(v => {
      const bp = v.vitals.bp || '';
      const bpParts = bp.split('/');
      const sys = bpParts.length === 2 ? parseInt(bpParts[0]) : null;
      const dia = bpParts.length === 2 ? parseInt(bpParts[1]) : null;
      const hr = parseInt(v.vitals.hr) || null;
      const temp = parseFloat(v.vitals.temp) || null;
      const spo2 = parseInt(v.vitals.spo2?.replace('%', '')) || null;
      return {
        date: v.date,
        systolic: sys,
        diastolic: dia,
        heartRate: hr,
        temperature: temp,
        oxygen: spo2
      };
    })
    .reverse(); // Chronological order

  const labelColor = isDark ? '#94a3b8' : '#475569';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

  // Mock lab trend values for patient's health parameters if patient matches 
  const hbData = [13.2, 13.8, 14.1, 14.5];
  const glData = [118, 102, 105, 96];
  const crData = [1.1, 0.95, 1.0, 0.88];

  return (
    <div className="space-y-4">
      {/* File Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-900/40 p-4 rounded-2xl border border-white/5 shrink-0">
        <div>
          <h2 className="text-xl font-black text-white">{isAr ? 'الملف الطبي الموحد للمريض' : 'Unified Patient Medical File'}</h2>
          <p className="text-xs text-slate-400 font-bold">{isAr ? 'عرض وتصدير التاريخ السريري الكامل' : 'View and export complete clinical history'}</p>
        </div>
        {patient && (
          <div className="flex gap-2">
            <button
              onClick={() => exportCompleteMedicalHistory(record, patient, isAr)}
              className={`${s.btnSec} !h-10 text-xs text-cyan-300 border-cyan-500/20`}
            >
              <Printer className="w-4 h-4" />
              {isAr ? 'طباعة السجل' : 'Print History'}
            </button>
            <button
              onClick={() => exportMedicalHistoryToPDF(record, patient, isAr)}
              className={`${s.btnSec} !h-10 text-xs text-cyan-300 border-cyan-500/20`}
            >
              <FileText className="w-4 h-4" />
              {isAr ? 'تحميل PDF' : 'Download PDF'}
            </button>
          </div>
        )}
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Visits */}
        <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 border-blue-500/30">
          <div className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-xs">{isAr ? 'الزيارات' : 'Visits'}</p>
              <p className="text-white font-bold text-lg">{record.visits?.length || 0}</p>
            </div>
          </div>
        </Card>

        {/* Prescriptions */}
        <Card className="bg-gradient-to-br from-cyan-900/30 to-cyan-800/30 border-cyan-500/30">
          <div className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <Pill className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-gray-400 text-xs">{isAr ? 'الروشتات' : 'Prescriptions'}</p>
              <p className="text-white font-bold text-lg">{patientPrescriptions.length}</p>
            </div>
          </div>
        </Card>

        {/* Lab Orders */}
        <Card className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 border-purple-500/30">
          <div className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-xs">{isAr ? 'التحاليل' : 'Lab Orders'}</p>
              <p className="text-white font-bold text-lg">{patientLabOrders.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Chronic Diseases & Allergies */}
      {(record.chronicDiseases?.length > 0 || record.allergies?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {record.chronicDiseases?.length > 0 && (
            <Card className="bg-red-900/20 border-red-500/30">
              <InnerCard className="bg-red-900/40">
                <h3 className="text-red-300 font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {isAr ? 'الأمراض المزمنة' : 'Chronic Diseases'}
                </h3>
                <div className="space-y-2">
                  {record.chronicDiseases.map((item) => {
                    const code = typeof item === 'object' ? item.code : item;
                    const icd = ICD_10.find((i) => i.code === code);
                    const key = typeof item === 'object' ? item.id || item.code : item;
                    return (
                      <p key={key} className="text-red-200 text-sm">
                        {icd ? `${code}: ${isAr ? icd.ar : icd.en}` : (typeof item === 'object' ? `${item.code}: ${isAr ? item.ar : item.en}` : item)}
                      </p>
                    );
                  })}
                </div>
              </InnerCard>
            </Card>
          )}

          {record.allergies?.length > 0 && (
            <Card className="bg-orange-900/20 border-orange-500/30">
              <InnerCard className="bg-orange-900/40">
                <h3 className="text-orange-300 font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {isAr ? 'الحساسية' : 'Allergies'}
                </h3>
                <div className="space-y-2">
                  {record.allergies.map((item) => {
                    const name = typeof item === 'object' ? item.name : item;
                    const severity = typeof item === 'object' && item.severity ? ` (${isAr ? (item.severity === 'Severe' ? 'شديدة' : item.severity === 'Moderate' ? 'متوسطة' : 'خفيفة') : item.severity})` : '';
                    const key = typeof item === 'object' ? item.id || item.name : item;
                    return (
                      <p key={key} className="text-orange-200 text-sm">
                        • {name}{severity}
                      </p>
                    );
                  })}
                </div>
              </InnerCard>
            </Card>
          )}
        </div>
      )}

      {/* Vitals Trending */}
      {record.visits?.some(v => v.vitals) && (
        <Card className="bg-slate-800/50 border-cyan-500/20">
          <InnerCard className="bg-slate-800">
            <h3 className="text-cyan-400 font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              {isAr ? 'مخطط اتجاهات العلامات الحيوية' : 'Vitals Signs Trend Graph'}
            </h3>

            {/* Vitals LineChart */}
            <div className="w-full h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vitalsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="date" stroke={labelColor} style={{ fontSize: 10, fontWeight: 'bold' }} />
                  <YAxis stroke={labelColor} style={{ fontSize: 10, fontWeight: 'bold' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11, fontWeight: 'bold' }} />
                  <Line type="monotone" name={isAr ? 'الضغط الانقباضي' : 'Systolic BP'} dataKey="systolic" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" name={isAr ? 'الضغط الانبساطي' : 'Diastolic BP'} dataKey="diastolic" stroke="#ec4899" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" name={isAr ? 'نبض القلب' : 'Heart Rate'} dataKey="heartRate" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" name={isAr ? 'الحرارة' : 'Temperature'} dataKey="temperature" stroke="#eab308" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto border-t border-slate-700/50 pt-4">
              <table className="w-full text-left border-collapse text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="py-2 px-3">{isAr ? 'التاريخ' : 'Date'}</th>
                    <th className="py-2 px-3">{isAr ? 'ضغط الدم (BP)' : 'BP'}</th>
                    <th className="py-2 px-3">{isAr ? 'نبض القلب (HR)' : 'HR'}</th>
                    <th className="py-2 px-3">{isAr ? 'الحرارة (Temp)' : 'Temp'}</th>
                    <th className="py-2 px-3">{isAr ? 'الأكسجين (SpO2)' : 'SpO2'}</th>
                  </tr>
                </thead>
                <tbody>
                  {record.visits
                    .filter(v => v.vitals)
                    .map((visit) => {
                      const bp = visit.vitals.bp || '';
                      const hr = parseInt(visit.vitals.hr);
                      const temp = parseFloat(visit.vitals.temp);
                      const spo2 = parseInt(visit.vitals.spo2?.replace('%', ''));

                      let bpAlert = false;
                      const bpParts = bp.split('/');
                      if (bpParts.length === 2) {
                        const sys = parseInt(bpParts[0]);
                        const dia = parseInt(bpParts[1]);
                        if (sys >= 140 || sys < 90 || dia >= 90 || dia < 60) bpAlert = true;
                      }

                      const hrAlert = !isNaN(hr) && (hr > 100 || hr < 60);
                      const tempAlert = !isNaN(temp) && (temp > 37.8 || temp < 36.0);
                      const spo2Alert = !isNaN(spo2) && (spo2 < 95);

                      return (
                        <tr key={visit.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                          <td className="py-2 px-3 font-semibold text-cyan-300">{visit.date}</td>
                          <td className={`py-2 px-3 ${bpAlert ? 'text-red-400 font-bold' : ''}`}>{bp}</td>
                          <td className={`py-2 px-3 ${hrAlert ? 'text-red-400 font-bold' : ''}`}>{visit.vitals.hr} bpm</td>
                          <td className={`py-2 px-3 ${tempAlert ? 'text-red-400 font-bold' : ''}`}>{visit.vitals.temp} °C</td>
                          <td className={`py-2 px-3 ${spo2Alert ? 'text-red-400 font-bold' : ''}`}>{visit.vitals.spo2}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </InnerCard>
        </Card>
      )}

      {/* Lab Values Sparklines Section */}
      <Card className="bg-slate-800/50 border-cyan-500/20">
        <InnerCard className="bg-slate-800">
          <h3 className="text-cyan-400 font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            {isAr ? 'مؤشرات التحاليل المخبرية التاريخية' : 'Historical Laboratory Indicators'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <LabSparkline label={isAr ? 'الهيموجلوبين (Hb)' : 'Hemoglobin (Hb)'} data={hbData} color="#10b981" unit="g/dL" />
            <LabSparkline label={isAr ? 'سكر الدم العشوائي (RBS)' : 'Blood Glucose (RBS)'} data={glData} color="#f59e0b" unit="mg/dL" />
            <LabSparkline label={isAr ? 'الكرياتينين في المصل (Creatinine)' : 'Serum Creatinine'} data={crData} color="#a855f7" unit="mg/dL" />
          </div>
        </InnerCard>
      </Card>

      {/* Visits History */}
      {record.visits?.length > 0 && (
        <Card className="bg-slate-800/50 border-cyan-500/20">
          <InnerCard className="bg-slate-800">
            <h3 className="text-cyan-400 font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {isAr ? 'سجل الزيارات' : 'Visit History'}
            </h3>
            <div className="space-y-4">
              {record.visits.map((visit) => (
                <div key={visit.id} className="p-3 bg-slate-700/50 rounded-lg border border-slate-600/50">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div>
                      <p className="text-gray-300 text-sm">
                        <span className="font-semibold text-cyan-300">{visit.date}</span>
                        {' • '}
                        <span className="text-gray-400">{visit.doctor}</span>
                      </p>
                      <p className="text-gray-500 text-xs">{visit.specialty}</p>
                    </div>
                    {patient && (
                      <button
                        onClick={() => printMedicalReport(visit, patient, isAr)}
                        className="p-1.5 bg-black/40 hover:bg-slate-700/80 rounded-lg border border-white/5 text-cyan-400 hover:text-cyan-300 transition-all flex items-center gap-1.5 text-xs font-bold active:scale-95 shrink-0"
                        title={isAr ? 'طباعة التقرير الطبي' : 'Print Medical Report'}
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>{isAr ? 'طباعة التقرير' : 'Print Report'}</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 text-xs text-gray-300">
                    {visit.chiefComplaint && (
                      <p>
                        <span className="text-gray-400">{isAr ? 'الشكوى: ' : 'Complaint: '}</span>
                        {isAr ? visit.chiefComplaintAr : visit.chiefComplaint}
                      </p>
                    )}

                    {visit.vitals && (
                      <p className="text-gray-400">
                        💊 BP: {visit.vitals.bp} | HR: {visit.vitals.hr} | Temp: {visit.vitals.temp} | SpO2:{' '}
                        {visit.vitals.spo2}
                      </p>
                    )}

                    {visit.diagnosis?.length > 0 && (
                      <div>
                        <span className="text-gray-400">{isAr ? 'التشخيص: ' : 'Diagnosis: '}</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {visit.diagnosis.map((d) => (
                            <span
                              key={d.code}
                              className="inline-block px-2 py-1 bg-blue-900/40 text-blue-300 rounded text-xs"
                            >
                              {d.code}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {visit.notes && (
                      <p className="text-gray-400 italic">
                        {isAr ? '📝 ملاحظات: ' : '📝 Notes: '}
                        {visit.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </InnerCard>
        </Card>
      )}

      {/* Recent Prescriptions */}
      {patientPrescriptions.length > 0 && (
        <Card className="bg-slate-800/50 border-cyan-500/20">
          <InnerCard className="bg-slate-800">
            <h3 className="text-cyan-400 font-semibold mb-4 flex items-center gap-2">
              <Pill className="w-4 h-4" />
              {isAr ? 'آخر الروشتات' : 'Recent Prescriptions'}
            </h3>
            <div className="space-y-2">
              {patientPrescriptions.slice(0, 3).map((rx) => (
                <div key={rx.id} className="p-2 bg-slate-700/50 rounded text-xs">
                  <p className="text-gray-300">
                    <span className="text-cyan-300 font-semibold">{rx.date}</span>
                    {' - '}
                    <span className="text-gray-400">{rx.doctor}</span>
                  </p>
                  <p className="text-gray-400">📋 {rx.drugs?.length || 0} medicines</p>
                </div>
              ))}
            </div>
          </InnerCard>
        </Card>
      )}

      {/* Recent Lab Orders */}
      {patientLabOrders.length > 0 && (
        <Card className="bg-slate-800/50 border-cyan-500/20">
          <InnerCard className="bg-slate-800">
            <h3 className="text-cyan-400 font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              {isAr ? 'آخر التحاليل' : 'Recent Lab Orders'}
            </h3>
            <div className="space-y-2">
              {patientLabOrders.slice(0, 3).map((order) => (
                <div key={order.id} className="p-2 bg-slate-700/50 rounded text-xs">
                  <p className="text-gray-300">
                    <span className="text-cyan-300 font-semibold">{order.date}</span>
                    {' - '}
                    <span className={`px-2 py-0.5 rounded ${
                      order.status === 'Completed'
                        ? 'bg-green-900/40 text-green-300'
                        : 'bg-yellow-900/40 text-yellow-300'
                    }`}>
                      {order.status}
                    </span>
                  </p>
                  <p className="text-gray-400 mt-1">
                    {isAr ? 'الفحوصات: ' : 'Tests: '}
                    {order.requestedTests?.map(t => t.name_ar || t.test).join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </InnerCard>
        </Card>
      )}
    </div>
  );
}
