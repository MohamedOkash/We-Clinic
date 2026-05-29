import { useState } from 'react';
import {
  Search, Package, CheckCircle, MessageSquare, Plus, PlusCircle,
  FileText, ShoppingCart, Minus, Trash2, Printer, Settings
} from 'lucide-react';
import { useClinic } from '../contexts/ClinicContext';
import AccountSettingsView from './AccountSettingsView';
import { Card, InnerCard, Avatar, Input, GlassModal, s, printReceipt } from '../components/shared';
import { useToast } from '../hooks/useToast';

export default function PharmacyView() {
    const { t, isAr, prescriptions, inventory, inquiries, invoices,
      dispensePrescription, updateStock, addMedication, sendInquiry, createNotification,
      createInvoice, markInvoicePaid, activePage, setActivePage } = useClinic();
  const toast = useToast();

  const tab = activePage;
  const setTab = setActivePage;
  const [rxSearch, setRxSearch]             = useState('');
  const [invSearch, setInvSearch]           = useState('');
  const [inquiryModal, setInquiryModal]     = useState(null);
  const [inquiryText, setInquiryText]       = useState('');
  const [newMedForm, setNewMedForm]         = useState({ name: '', desc: '', stock: '', price: '' });
  const [addMedModal, setAddMedModal]       = useState(false);
  const [invoiceModal, setInvoiceModal]     = useState(null);
  const [cart, setCart]                     = useState([]);
  const [customerName, setCustomerName]     = useState('');
  const [paymentMethod, setPaymentMethod]   = useState('cash');

  const tabs = ['pos', 'prescriptions', 'inventory', 'inquiries', 'invoices', 'account'];

  const handleDispense = (rx) => {
    const ok = dispensePrescription(rx.id);
    if (ok) {
      toast.success(isAr ? `تم صرف روشتة ${isAr ? rx.patientNameAr : rx.patientName} ✅` : `Dispensed for ${rx.patientName} ✅`);
    } else {
      toast.error(isAr ? 'صنف غير متوفر في المخزون!' : 'Out of stock!');
    }
  };

  const handleSendInquiry = (rx) => {
    if (!inquiryText.trim()) return;
    sendInquiry({
      id: Date.now(),
      patientId: rx.patientId,
      patientName: rx.patientName,
      patientNameAr: rx.patientNameAr,
      rxId: rx.id,
      message: inquiryText,
      doctor: rx.doctor,
      status: 'Pending',
      reply: '',
    });
    setInquiryText('');
    setInquiryModal(null);
    toast.info(isAr ? 'تم إرسال الاستفسار للطبيب' : 'Inquiry sent to doctor');
  };

  const handleAddMed = () => {
    if (!newMedForm.name.trim() || !newMedForm.stock) {
      toast.error(isAr ? 'الاسم والمخزون مطلوبان' : 'Name and stock are required');
      return;
    }
    addMedication({
      name: newMedForm.name,
      desc: newMedForm.desc,
      stock: parseInt(newMedForm.stock) || 0,
      price: parseFloat(newMedForm.price) || 0,
    });
    setNewMedForm({ name: '', desc: '', stock: '', price: '' });
    setAddMedModal(false);
    toast.success(isAr ? 'تم إضافة الدواء للمخزون' : 'Medication added to inventory');
  };

  const buildInvoiceItems = (rx) => rx.drugs.map(drug => {
    const invItem = inventory.find(item => item.name.toLowerCase() === drug.name.toLowerCase());
    return {
      name: drug.name,
      qty: 1,
      price: invItem?.price || 0,
      dosage: drug.dosage,
      frequency: drug.frequency,
      duration: drug.duration,
    };
  });

  const getInvoiceTotal = (items) => items.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 1), 0);

  const cartTotal = getInvoiceTotal(cart);

  const addToCart = (item) => {
    if (item.stock <= 0) {
      toast.error(isAr ? 'الصنف غير متوفر في المخزون' : 'Item is out of stock');
      return;
    }
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.name === item.name);
      if (existing) {
        if (existing.qty >= item.stock) return prev;
        return prev.map(cartItem => cartItem.name === item.name ? { ...cartItem, qty: cartItem.qty + 1 } : cartItem);
      }
      return [...prev, { name: item.name, price: item.price || 0, qty: 1 }];
    });
  };

  const updateCartQty = (itemName, amount) => {
    const invItem = inventory.find(item => item.name === itemName);
    setCart(prev => prev
      .map(item => {
        if (item.name !== itemName) return item;
        const nextQty = Math.min(Math.max(item.qty + amount, 0), invItem?.stock || item.qty);
        return { ...item, qty: nextQty };
      })
      .filter(item => item.qty > 0)
    );
  };

  const removeFromCart = (itemName) => {
    setCart(prev => prev.filter(item => item.name !== itemName));
  };

  const checkoutCart = () => {
    if (cart.length === 0) {
      toast.error(isAr ? 'السلة فارغة' : 'Cart is empty');
      return;
    }

    const hasStockIssue = cart.some(cartItem => {
      const invItem = inventory.find(item => item.name === cartItem.name);
      return !invItem || invItem.stock < cartItem.qty;
    });
    if (hasStockIssue) {
      toast.error(isAr ? 'راجع الكميات المتاحة في المخزون' : 'Check available stock quantities');
      return;
    }

    createInvoice({
      customerName: customerName.trim() || 'Walk-in Customer',
      customerNameAr: customerName.trim() || 'عميل الصيدلية',
      items: cart,
      total: cartTotal,
      tax: 0,
      paymentMethod,
      status: 'Paid',
      source: 'pharmacy_pos',
    });
    setCart([]);
    setCustomerName('');
    setPaymentMethod('cash');
    toast.success(isAr ? 'تم إنشاء فاتورة بيع مباشر' : 'Direct sale invoice created');
  };

  const handleCompleteInvoice = () => {
    if (!invoiceModal) return;

    const ok = dispensePrescription(invoiceModal.id);
    if (!ok) {
      toast.error(isAr ? 'فشل في الصرف - تحقق من المخزون' : 'Dispense failed - check inventory');
      return;
    }

    const items = buildInvoiceItems(invoiceModal);
    const total = getInvoiceTotal(items);
    const invoice = createInvoice({
      patientId: invoiceModal.patientId,
      patientName: invoiceModal.patientName,
      patientNameAr: invoiceModal.patientNameAr,
      prescriptionId: invoiceModal.id,
      items,
      total,
      tax: 0,
      paymentMethod: 'cash',
      status: 'Paid',
      source: 'prescription',
      adjustInventory: false,
    });

    createNotification({
      type: 'invoice_paid',
      recipient: 'patient',
      title: isAr ? 'فاتورة الصرف' : 'Invoice Paid',
      titleEn: 'Invoice Paid',
      message: isAr
        ? `تم إنشاء فاتورة رقم ${invoice.id} وصرف الروشتة للمريض ${invoiceModal.patientName}`
        : `Invoice #${invoice.id} created and prescription dispensed for ${invoiceModal.patientName}`,
      messageEn: `Invoice #${invoice.id} created and prescription dispensed for ${invoiceModal.patientName}`,
      patientId: invoiceModal.patientId,
      patientName: invoiceModal.patientName,
      patientNameAr: invoiceModal.patientNameAr,
    });

    toast.success(isAr ? 'تم إنشاء الفاتورة وصرف الروشتة' : 'Invoice created and dispensed');
    setInvoiceModal(null);
  };

  const filteredRx = prescriptions.filter(rx => {
    const term = rxSearch.toLowerCase();
    return (
      rx.patientName?.toLowerCase().includes(term) ||
      rx.patientNameAr?.includes(rxSearch) ||
      rx.drugs?.some(d => d.name?.toLowerCase().includes(term))
    );
  });

  const filteredInv = inventory.filter(item =>
    item.name?.toLowerCase().includes(invSearch.toLowerCase())
  );

  const pendingInquiries = inquiries.filter(i => i.status === 'Pending').length;

  return (
    <div className="min-h-full md:h-full flex flex-col p-4 md:p-6 gap-6 overflow-visible md:overflow-hidden">
      {/* Header */}
      <Card className="!p-4 shrink-0 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl flex items-center justify-center border border-amber-300/40">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-black text-2xl text-white">{t('pharmacy')}</h2>
            <p className="text-xs font-bold text-amber-300 uppercase tracking-widest">{t('medicationInventory')}</p>
          </div>
        </div>
        <div className="flex bg-black/50 p-1.5 rounded-2xl border border-white/10 w-full md:w-auto overflow-x-auto gap-1">
          {tabs.map(tabId => (
            <button
              key={tabId}
              onClick={() => setTab(tabId)}
              className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-sm font-black transition-all whitespace-nowrap flex items-center gap-2 justify-center
                ${tab === tabId ? 'bg-gradient-to-br from-slate-700 to-slate-800 text-amber-400 shadow-inner border border-slate-600' : 'text-slate-400 hover:text-white'}`}
            >
              {tabId === 'prescriptions' ? (isAr ? 'الروشتات' : 'Prescriptions')
               : tabId === 'pos'          ? (isAr ? 'نقطة بيع' : 'POS')
               : tabId === 'inventory'    ? (isAr ? 'المخزون' : 'Inventory')
               : tabId === 'inquiries'    ? (isAr ? 'الاستفسارات' : 'Inquiries')
               : tabId === 'account'      ? (isAr ? 'إعدادات الحساب' : 'Account Settings')
               :                           (isAr ? 'الفواتير' : 'Invoices')}
              {tabId === 'inquiries' && pendingInquiries > 0 && (
                <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-black">{pendingInquiries}</span>
              )}
            </button>
          ))}
        </div>
      </Card>

      <div className="flex-1 overflow-visible md:overflow-y-auto min-h-0 pe-1 pb-4">

        {/* ── Independent POS ── */}
        {tab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 max-w-6xl mx-auto animate-in slide-in-from-bottom-4">
            <Card className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                <div>
                  <h3 className="text-2xl font-black text-white flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6 text-amber-400" /> {isAr ? 'بيع مباشر من الصيدلية' : 'Independent Pharmacy Sale'}
                  </h3>
                  <p className="text-sm text-slate-400 font-bold mt-1">
                    {isAr ? 'بيع نقدي مستقل، لا يحتاج روشتة أو ملف مريض' : 'Cash sale, independent from clinic prescriptions'}
                  </p>
                </div>
                <button onClick={() => setAddMedModal(true)} className={`${s.btnPrimary} !h-10 text-sm`}>
                  <PlusCircle className="w-4 h-4" /> {t('addNewMed')}
                </button>
              </div>

              <Input
                placeholder={isAr ? 'ابحث عن صنف للبيع...' : 'Search items to sell...'}
                icon={Search}
                value={invSearch}
                onChange={e => setInvSearch(e.target.value)}
                className={`${s.input} !h-14`}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredInv.map(item => {
                  const cartItem = cart.find(c => c.name === item.name);
                  return (
                    <InnerCard key={item.name} className="!p-4 flex flex-col gap-3">
                      <div className="flex justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="font-black text-white truncate">{item.name}</h4>
                          <p className="text-xs text-slate-400 font-bold line-clamp-2 mt-1">{item.desc}</p>
                        </div>
                        <span className="font-black text-amber-300 shrink-0">{item.price} {isAr ? 'ج.م' : 'EGP'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/5">
                        <span className={`${s.badge} ${
                          item.stock <= 0 ? '!bg-red-500/20 !text-red-300 !border-red-500/50'
                          : item.stock < 20 ? '!bg-amber-500/20 !text-amber-300 !border-amber-500/50'
                          : '!bg-green-500/20 !text-green-300 !border-green-500/50'
                        }`}>
                          {item.stock <= 0 ? t('outOfStock') : `${item.stock} ${isAr ? 'وحدة' : 'units'}`}
                        </span>
                        <button
                          onClick={() => addToCart(item)}
                          disabled={item.stock <= 0 || cartItem?.qty >= item.stock}
                          className={`${s.btnPrimary} !h-9 !px-4 text-xs disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <Plus className="w-4 h-4" /> {isAr ? 'إضافة' : 'Add'}
                        </button>
                      </div>
                    </InnerCard>
                  );
                })}
              </div>
            </Card>

            <Card className="flex flex-col gap-4 h-fit lg:sticky lg:top-0">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-cyan-400" /> {isAr ? 'السلة' : 'Cart'}
              </h3>
              <Input
                label={isAr ? 'اسم العميل اختياري' : 'Customer name optional'}
                placeholder={isAr ? 'عميل الصيدلية' : 'Walk-in Customer'}
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
              />

              <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pe-1">
                {cart.length === 0 ? (
                  <div className="py-10 text-center text-slate-500 font-bold">
                    {isAr ? 'لا توجد أصناف في السلة' : 'No items in cart'}
                  </div>
                ) : cart.map(item => (
                  <InnerCard key={item.name} className="!p-3 flex flex-col gap-2">
                    <div className="flex justify-between gap-2">
                      <p className="font-black text-white text-sm">{item.name}</p>
                      <button onClick={() => removeFromCart(item.name)} className="text-slate-500 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateCartQty(item.name, -1)} className="w-8 h-8 rounded-lg bg-slate-800 text-cyan-300 flex items-center justify-center">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-black text-white w-6 text-center">{item.qty}</span>
                        <button onClick={() => updateCartQty(item.name, 1)} className="w-8 h-8 rounded-lg bg-slate-800 text-cyan-300 flex items-center justify-center">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="font-black text-cyan-300">{item.qty * item.price} {isAr ? 'ج.م' : 'EGP'}</p>
                    </div>
                  </InnerCard>
                ))}
              </div>

              <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
                <label className="text-sm font-bold text-slate-300 px-1">{isAr ? 'طريقة الدفع' : 'Payment method'}</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className={`${s.input} appearance-none cursor-pointer bg-black/50`}
                >
                  <option value="cash">{isAr ? 'نقدي' : 'Cash'}</option>
                  <option value="card">{isAr ? 'بطاقة' : 'Card'}</option>
                  <option value="wallet">{isAr ? 'محفظة إلكترونية' : 'Wallet'}</option>
                </select>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-400 font-bold">{isAr ? 'الإجمالي' : 'Total'}</span>
                  <span className="text-2xl font-black text-white">{cartTotal} {isAr ? 'ج.م' : 'EGP'}</span>
                </div>
                <button onClick={checkoutCart} className={`${s.btnPrimary} w-full !h-12`}>
                  <CheckCircle className="w-5 h-5" /> {isAr ? 'إنهاء البيع' : 'Complete Sale'}
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* ── Prescriptions ── */}
        {tab === 'prescriptions' && (
          <div className="flex flex-col gap-4 max-w-4xl mx-auto animate-in slide-in-from-bottom-4">
            <Input placeholder={t('search')} icon={Search}
              value={rxSearch} onChange={e => setRxSearch(e.target.value)}
              className={`${s.input} !h-14`} />

            {filteredRx.length === 0 && (
              <p className="text-center text-slate-500 font-bold py-8">{isAr ? 'لا توجد روشتات' : 'No prescriptions found'}</p>
            )}

            {filteredRx.map(rx => (
              <Card key={rx.id} className="flex flex-col gap-4 hover:!bg-slate-800/60 transition-all">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <Avatar name={isAr ? rx.patientNameAr : rx.patientName} />
                    <div>
                      <h4 className="font-black text-xl text-white">{isAr ? rx.patientNameAr : rx.patientName}</h4>
                      <p className="text-sm text-slate-400 font-bold">{rx.doctor} • {rx.date}</p>
                    </div>
                  </div>
                  <span className={`${s.badge} ${
                    rx.status === 'Dispensed' ? '!bg-green-500/20 !text-green-300 !border-green-500/50'
                    : '!bg-amber-500/20 !text-amber-300 !border-amber-500/50'}`}>
                    {rx.status === 'Dispensed' ? (isAr ? 'صُرف' : 'Dispensed') : (isAr ? 'جديدة' : 'New')}
                  </span>
                </div>

                {/* Drugs list */}
                <div className="flex flex-col gap-2">
                  {rx.drugs?.map((d, i) => (
                    <InnerCard key={i} className="flex justify-between items-center !p-3">
                      <div>
                        <span className="font-black text-white">{d.name}</span>
                        {d.dosage && (
                          <p className="text-xs text-cyan-300 font-bold mt-1">
                            {d.dosage} — {d.frequency} — {d.duration}
                          </p>
                        )}
                      </div>
                      <span className={`${s.badge} ${
                        inventory.find(inv => inv.name.toLowerCase() === d.name.toLowerCase())?.stock > 0
                          ? '!bg-green-500/20 !text-green-300 !border-green-500/50'
                          : '!bg-red-500/20 !text-red-300 !border-red-500/50'}`}>
                        {inventory.find(inv => inv.name.toLowerCase() === d.name.toLowerCase())?.stock > 0
                          ? t('available') : t('outOfStock')}
                      </span>
                    </InnerCard>
                  ))}
                </div>

                {/* Actions */}
                {rx.status !== 'Dispensed' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setInquiryModal(rx); setInquiryText(''); }}
                      className={`${s.btnSec} flex-1 !h-10 text-sm`}
                    >
                      <MessageSquare className="w-4 h-4" /> {t('sendInquiry')}
                    </button>
                    <button
                      onClick={() => setInvoiceModal(rx)}
                      className={`${s.btnPrimary} flex-1 !h-10 text-sm`}
                    >
                      <PlusCircle className="w-4 h-4" /> {isAr ? 'إنشاء فاتورة' : 'Create Invoice'}
                    </button>
                    <button
                      onClick={() => handleDispense(rx)}
                      className={`${s.btnPrimary} flex-[2] !bg-gradient-to-r !from-green-500 !to-emerald-700 !border-green-400/50 !h-10 text-sm`}
                    >
                      <CheckCircle className="w-4 h-4" /> {t('confirmDispense')}
                    </button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* ── Inventory ── */}
        {tab === 'inventory' && (
          <div className="flex flex-col gap-4 max-w-4xl mx-auto animate-in slide-in-from-bottom-4">
            <div className="flex gap-3">
              <Input placeholder={isAr ? 'بحث في المخزون...' : 'Search inventory...'} icon={Search}
                value={invSearch} onChange={e => setInvSearch(e.target.value)}
                className={`${s.input} flex-1`} />
              <button onClick={() => setAddMedModal(true)} className={`${s.btnPrimary} shrink-0`}>
                <PlusCircle className="w-5 h-5" /> {t('addNewMed')}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredInv.map((item, idx) => (
                <InnerCard key={idx} className="flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 pe-2">
                      <h4 className="font-black text-white truncate">{item.name}</h4>
                      <p className="text-xs text-slate-400 font-bold leading-tight mt-1 line-clamp-2">{item.desc}</p>
                    </div>
                    <span className={`${s.badge} shrink-0 ${
                      item.stock <= 0    ? '!bg-red-500/20 !text-red-300 !border-red-500/50'
                      : item.stock < 20  ? '!bg-amber-500/20 !text-amber-300 !border-amber-500/50'
                      :                    '!bg-green-500/20 !text-green-300 !border-green-500/50'}`}>
                      {item.stock <= 0 ? t('outOfStock') : `${item.stock} ${isAr ? 'وحدة' : 'units'}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/5">
                    <span className="font-black text-amber-400">{item.price} {isAr ? 'ج.م' : 'EGP'}</span>
                    <div className="flex gap-2">
                      {[10, 50].map(amount => (
                        <button
                          key={amount}
                          onClick={() => { updateStock(item.name, amount); toast.info(`+${amount} ${item.name}`); }}
                          className="bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 text-xs font-black px-3 py-1.5 rounded-lg border border-cyan-400/30 transition-colors"
                        >
                          +{amount}
                        </button>
                      ))}
                    </div>
                  </div>
                  {item.stock < 20 && item.stock > 0 && (
                    <p className="text-xs text-amber-400 font-bold flex items-center gap-1">
                      ⚠️ {t('lowStockAlert')}
                    </p>
                  )}
                </InnerCard>
              ))}
            </div>
          </div>
        )}

        {/* ── Inquiries ── */}
        {tab === 'inquiries' && (
          <div className="flex flex-col gap-4 max-w-3xl mx-auto animate-in slide-in-from-bottom-4">
            <h3 className="text-2xl font-black text-white">{t('pharmacyInquiries')}</h3>
            {inquiries.length === 0 && (
              <p className="text-center text-slate-500 font-bold py-8">{t('noInquiries')}</p>
            )}
            {inquiries.map(inq => (
              <Card key={inq.id} className="flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-white">{isAr ? inq.patientNameAr : inq.patientName}</h4>
                    <p className="text-xs text-slate-400 font-bold">{isAr ? 'طبيب:' : 'Doctor:'} {inq.doctor}</p>
                  </div>
                  <span className={`${s.badge} ${inq.status === 'Pending' ? '!bg-amber-500/20 !text-amber-400 !border-amber-400/50' : '!bg-green-500/20 !text-green-300 !border-green-500/50'}`}>
                    {inq.status === 'Pending' ? t('pendingInquiry') : t('repliedInquiry')}
                  </span>
                </div>
                <InnerCard className="!p-3">
                  <p className="text-sm font-bold text-white">{inq.message}</p>
                </InnerCard>
                {inq.reply && (
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                    <span className="text-xs font-black text-green-400 block mb-1">{t('doctorReply')}:</span>
                    <p className="text-sm font-bold text-white">{inq.reply}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* ── Invoices ── */}
        {tab === 'invoices' && (
          <div className="flex flex-col gap-4 max-w-4xl mx-auto animate-in slide-in-from-bottom-4">
            <h3 className="text-2xl font-black text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-cyan-400" /> {isAr ? 'الفواتير' : 'Invoices'}
            </h3>
            {invoices.length === 0 && (
              <p className="text-center text-slate-500 font-bold py-8">{isAr ? 'لا توجد فواتير' : 'No invoices yet'}</p>
            )}
            {invoices.map(inv => (
              <Card key={inv.id} className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-400 font-bold">{isAr ? 'فاتورة رقم' : 'Invoice'} #{inv.id}</p>
                    <h4 className="font-black text-xl text-white">{isAr ? inv.patientNameAr : inv.patientName}</h4>
                    <p className="text-sm text-slate-400 font-bold">
                      {inv.date} • {inv.time || ''} • {inv.source === 'prescription' ? (isAr ? 'روشتة' : 'Prescription') : (isAr ? 'بيع مباشر' : 'Direct Sale')}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
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
                          toast.success(isAr ? 'تم تسجيل الدفع' : 'Payment recorded');
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

        {tab === 'account' && (
          <div className="animate-in slide-in-from-bottom-4">
            <AccountSettingsView />
          </div>
        )}
      </div>

      {/* Inquiry Modal */}
      <GlassModal isOpen={!!inquiryModal} title={t('sendInquiry')} onClose={() => setInquiryModal(null)}>
        <div className="flex flex-col gap-4">
          <p className="text-slate-400 font-bold text-sm">
            {isAr ? 'روشتة المريض:' : 'Prescription for:'}{' '}
            <span className="text-white font-black">{isAr ? inquiryModal?.patientNameAr : inquiryModal?.patientName}</span>
          </p>
          <textarea
            className={`${s.input} min-h-[120px] p-4 resize-none !h-auto`}
            placeholder={t('writeInquiry')}
            value={inquiryText}
            onChange={e => setInquiryText(e.target.value)}
          />
          <div className="flex gap-3">
            <button onClick={() => setInquiryModal(null)} className={`${s.btnSec} flex-1`}>{t('cancel')}</button>
            <button onClick={() => handleSendInquiry(inquiryModal)} className={`${s.btnPrimary} flex-[2]`}>
              <MessageSquare className="w-5 h-5" /> {t('sendInquiry')}
            </button>
          </div>
        </div>
      </GlassModal>

      {/* Invoice / POS Modal */}
      <GlassModal isOpen={!!invoiceModal} title={isAr ? 'فاتورة البيع' : 'Invoice'} onClose={() => setInvoiceModal(null)}>
        {invoiceModal && (
          <div className="flex flex-col gap-4">
            <p className="text-slate-400 text-sm">{isAr ? 'المريض:' : 'Patient:'} <span className="text-white font-bold">{isAr ? invoiceModal.patientNameAr : invoiceModal.patientName}</span></p>
            <div className="space-y-2">
              {buildInvoiceItems(invoiceModal).map((item, idx) => {
                const invItem = inventory.find(i => i.name.toLowerCase() === item.name.toLowerCase()) || { stock: 0 };
                return (
                  <div key={idx} className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.dosage || ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{item.price} {isAr ? 'ج.م' : 'EGP'}</p>
                      <p className="text-xs text-slate-400">{invItem.stock} {isAr ? 'بالمخزون' : 'in stock'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="pt-3 border-t border-white/10">
              <p className="text-white font-bold">
                {isAr ? 'الإجمالي:' : 'Total:'}{' '}
                <span className="text-cyan-300">{getInvoiceTotal(buildInvoiceItems(invoiceModal))} {isAr ? 'ج.م' : 'EGP'}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setInvoiceModal(null)} className={`${s.btnSec} flex-1`}>{t('cancel')}</button>
              <button onClick={handleCompleteInvoice} className={`${s.btnPrimary} flex-[2]`}>{isAr ? 'إنهاء وخصم' : 'Complete & Charge'}</button>
            </div>
          </div>
        )}
      </GlassModal>

      {/* Add Medication Modal */}
      <GlassModal isOpen={addMedModal} title={t('addNewMed')} onClose={() => setAddMedModal(false)}>
        <div className="flex flex-col gap-4">
          <Input label={isAr ? 'اسم الدواء' : 'Drug Name'} placeholder="e.g. Panadol 500mg"
            value={newMedForm.name} onChange={e => setNewMedForm(p => ({ ...p, name: e.target.value }))} />
          <Input label={isAr ? 'الوصف' : 'Description'} placeholder="..."
            value={newMedForm.desc} onChange={e => setNewMedForm(p => ({ ...p, desc: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('stock')} type="number" placeholder="0"
              value={newMedForm.stock} onChange={e => setNewMedForm(p => ({ ...p, stock: e.target.value }))} />
            <Input label={`${t('price')} (${isAr ? 'ج.م' : 'EGP'})`} type="number" placeholder="0"
              value={newMedForm.price} onChange={e => setNewMedForm(p => ({ ...p, price: e.target.value }))} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setAddMedModal(false)} className={`${s.btnSec} flex-1`}>{t('cancel')}</button>
            <button onClick={handleAddMed} className={`${s.btnPrimary} flex-[2]`}>
              <Plus className="w-5 h-5" /> {t('add')}
            </button>
          </div>
        </div>
      </GlassModal>
    </div>
  );
}
