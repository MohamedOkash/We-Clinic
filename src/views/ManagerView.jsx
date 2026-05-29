import { Users, ClipboardList, DollarSign, Package, Activity, AlertTriangle, BarChart2, TrendingUp } from 'lucide-react';
import { useClinic } from '../contexts/ClinicContext';
import { Card, InnerCard, s } from '../components/shared';

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <InnerCard className="flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg border border-white/20`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {sub && <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-full">{sub}</span>}
      </div>
      <div>
        <p className="text-3xl font-black text-white">{value}</p>
        <p className="text-sm font-bold text-slate-400 mt-1">{label}</p>
      </div>
    </InnerCard>
  );
}

export default function ManagerView() {
  const { t, isAr, patients, queue, prescriptions, inventory, invoices, allUsers, currentOrganizationId } = useClinic();

  const totalPatients    = patients.length;
  const queueToday       = queue.length;
  const dispensedToday   = prescriptions.filter(rx => rx.status === 'Dispensed').length;
  const lowStockItems    = inventory.filter(item => item.stock < 20 && item.stock > 0);
  const outOfStock       = inventory.filter(item => item.stock <= 0);
  const paidInvoices     = invoices.filter(inv => inv.status === 'Paid');
  const unpaidInvoices   = invoices.filter(inv => inv.status !== 'Paid');
  const totalRevenue     = paidInvoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
  const pharmacyDirectRevenue = paidInvoices
    .filter(inv => inv.source !== 'prescription')
    .reduce((acc, inv) => acc + (inv.total || 0), 0);
  const prescriptionRevenue = paidInvoices
    .filter(inv => inv.source === 'prescription')
    .reduce((acc, inv) => acc + (inv.total || 0), 0);

  const roleStats = [
    { role: 'receptionist', color: 'from-teal-500 to-cyan-700',    count: allUsers.filter(u => u.role === 'receptionist' && u.organizationId === currentOrganizationId).length },
    { role: 'doctor',       color: 'from-blue-500 to-indigo-700',  count: allUsers.filter(u => u.role === 'doctor' && u.organizationId === currentOrganizationId).length },
    { role: 'pharmacy',     color: 'from-amber-500 to-orange-700', count: allUsers.filter(u => u.role === 'pharmacy' && u.organizationId === currentOrganizationId).length },
    { role: 'radiology',    color: 'from-purple-500 to-violet-700',count: allUsers.filter(u => u.role === 'radiology' && u.organizationId === currentOrganizationId).length },
  ];

  return (
    <div className="min-h-full md:h-full flex flex-col p-4 md:p-6 gap-6 overflow-visible md:overflow-y-auto">
      {/* Header */}
      <Card className="!p-5 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-slate-500 to-slate-700 rounded-2xl flex items-center justify-center border border-white/20">
            <BarChart2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="font-black text-3xl text-white">{t('managerDashboard')}</h2>
            <p className="text-sm font-bold text-slate-400">
              {new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </Card>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <StatCard icon={Users}        label={t('totalPatients')}  value={totalPatients}  color="from-cyan-500 to-blue-700"    sub={isAr ? 'إجمالي' : 'Total'} />
        <StatCard icon={ClipboardList} label={t('todayQueue')}    value={queueToday}     color="from-amber-500 to-orange-700" sub={isAr ? 'اليوم' : 'Today'} />
        <StatCard icon={DollarSign}   label={t('totalRevenue')}   value={`${totalRevenue} ${isAr ? 'ج.م' : 'EGP'}`} color="from-emerald-500 to-teal-700" sub={`${paidInvoices.length} ${isAr ? 'مدفوعة' : 'paid'}`} />
        <StatCard icon={Package}      label={t('dispensedToday')} value={dispensedToday} color="from-fuchsia-500 to-violet-700" />
      </div>

      {/* Active Roles */}
      <Card>
        <h3 className="font-black text-white text-xl mb-4 flex items-center gap-2">
          <Activity className="w-6 h-6 text-cyan-400" /> {t('activeStaff')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {roleStats.map(({ role, color, count }) => (
            <div key={role} className={`bg-gradient-to-br ${color} rounded-2xl p-4 border border-white/20 flex flex-col gap-2`}>
              <p className="text-3xl font-black text-white">{count}</p>
              <p className="text-sm font-bold text-white/80">{t(role)}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Prescriptions chart */}
        <Card className="flex flex-col gap-4">
          <h3 className="font-black text-white text-xl flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-400" /> {isAr ? 'حالة الروشتات' : 'Prescription Status'}
          </h3>
          <div className="flex flex-col gap-3">
            {[
              { label: isAr ? 'جديدة'  : 'New',      value: prescriptions.filter(r => r.status === 'New').length,      color: 'from-amber-500 to-orange-600' },
              { label: isAr ? 'صُرفت' : 'Dispensed', value: dispensedToday,                                             color: 'from-emerald-500 to-teal-600' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-bold text-slate-300">{label}</span>
                  <span className="font-black text-white">{value}</span>
                </div>
                <div className="h-3 bg-black/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-700`}
                    style={{ width: prescriptions.length ? `${(value / prescriptions.length) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Invoice chart */}
        <Card className="flex flex-col gap-4">
          <h3 className="font-black text-white text-xl flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-cyan-400" /> {isAr ? 'حالة الفواتير' : 'Invoice Status'}
          </h3>
          <div className="flex flex-col gap-3">
            {[
              { label: isAr ? 'مدفوعة' : 'Paid', value: paidInvoices.length, color: 'from-emerald-500 to-teal-600' },
              { label: isAr ? 'غير مدفوعة' : 'Unpaid', value: unpaidInvoices.length, color: 'from-amber-500 to-orange-600' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-bold text-slate-300">{label}</span>
                  <span className="font-black text-white">{value}</span>
                </div>
                <div className="h-3 bg-black/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-700`}
                    style={{ width: invoices.length ? `${(value / invoices.length) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
            <div className="bg-black/30 rounded-xl p-3 border border-white/5">
              <p className="text-xs font-bold text-slate-400">{isAr ? 'بيع صيدلية مباشر' : 'Direct pharmacy sales'}</p>
              <p className="font-black text-cyan-300 mt-1">{pharmacyDirectRevenue} {isAr ? 'ج.م' : 'EGP'}</p>
            </div>
            <div className="bg-black/30 rounded-xl p-3 border border-white/5">
              <p className="text-xs font-bold text-slate-400">{isAr ? 'روشتات العيادة' : 'Clinic prescriptions'}</p>
              <p className="font-black text-emerald-300 mt-1">{prescriptionRevenue} {isAr ? 'ج.م' : 'EGP'}</p>
            </div>
          </div>
        </Card>

        {/* Inventory alerts */}
        <Card className="flex flex-col gap-4">
          <h3 className="font-black text-white text-xl flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-400" /> {t('lowStockAlert')}
          </h3>
          {lowStockItems.length === 0 && outOfStock.length === 0 ? (
            <p className="text-slate-400 font-bold text-sm">{isAr ? 'المخزون بخير ✅' : 'Stock is healthy ✅'}</p>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[200px]">
              {outOfStock.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-red-900/20 border border-red-500/30 rounded-xl">
                  <span className="font-bold text-white text-sm">{item.name}</span>
                  <span className={`${s.badge} !bg-red-500/20 !text-red-300 !border-red-500/50`}>{t('outOfStock')}</span>
                </div>
              ))}
              {lowStockItems.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-amber-900/20 border border-amber-500/30 rounded-xl">
                  <span className="font-bold text-white text-sm">{item.name}</span>
                  <span className={`${s.badge} !bg-amber-500/20 !text-amber-300 !border-amber-500/50`}>{item.stock} {isAr ? 'وحدة' : 'units'}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Patients list */}
      <Card className="flex flex-col gap-4">
        <h3 className="font-black text-white text-xl flex items-center gap-2">
          <Users className="w-6 h-6 text-cyan-400" /> {t('patientsRegistry')}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 font-bold border-b border-white/10">
                <th className="text-start py-3 pe-4">#</th>
                <th className="text-start py-3 pe-4">{isAr ? 'الاسم' : 'Name'}</th>
                <th className="text-start py-3 pe-4">{isAr ? 'الهاتف' : 'Phone'}</th>
                <th className="text-start py-3 pe-4">{isAr ? 'آخر زيارة' : 'Last Visit'}</th>
                <th className="text-start py-3">{isAr ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p, i) => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 pe-4 font-black text-cyan-400">{i + 1}</td>
                  <td className="py-3 pe-4 font-bold text-white">{isAr ? p.nameAr : p.name}</td>
                  <td className="py-3 pe-4 text-slate-400">{p.phone}</td>
                  <td className="py-3 pe-4 text-slate-400">{p.lastVisit}</td>
                  <td className="py-3">
                    <span className={`${s.badge} ${p.status === 'Waiting' ? '!bg-amber-500/20 !text-amber-400 !border-amber-400/50' : '!bg-cyan-500/20 !text-cyan-400 !border-cyan-400/50'}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
