import { useState } from 'react';
import { CheckCircle, AlertCircle, Clock, Upload, Eye, Plus, X } from 'lucide-react';
import { useClinic } from '../contexts/ClinicContext';
import { Card, InnerCard } from './shared';

export default function LabOrdersManager() {
  const { labOrders, updateLabOrderStatus, uploadLabResults, t, isAr } = useClinic();
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [uploadingOrderId, setUploadingOrderId] = useState(null);
  const [newResults, setNewResults] = useState({});

  const handleStatusChange = (orderId, newStatus) => {
    updateLabOrderStatus(orderId, newStatus);
  };

  const handleUploadResults = (orderId) => {
    const results = newResults[orderId];
    if (!results || results.length === 0) return;

    uploadLabResults(orderId, results);
    setNewResults({ ...newResults, [orderId]: [] });
    setUploadingOrderId(null);
  };

  const addResultInput = (orderId) => {
    setNewResults({
      ...newResults,
      [orderId]: [...(newResults[orderId] || []), { test: '', result: '' }],
    });
  };

  const updateResult = (orderId, index, field, value) => {
    const updated = [...(newResults[orderId] || [])];
    updated[index] = { ...updated[index], [field]: value };
    setNewResults({ ...newResults, [orderId]: updated });
  };

  const removeResultInput = (orderId, index) => {
    const updated = newResults[orderId].filter((_, i) => i !== index);
    setNewResults({ ...newResults, [orderId]: updated });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-900/40 text-yellow-300 border-yellow-500/30';
      case 'In Progress':
        return 'bg-blue-900/40 text-blue-300 border-blue-500/30';
      case 'Completed':
        return 'bg-green-900/40 text-green-300 border-green-500/30';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <Clock className="w-4 h-4" />;
      case 'In Progress':
        return <AlertCircle className="w-4 h-4" />;
      case 'Completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const pendingOrders = labOrders.filter((o) => o.status === 'Pending' || o.status === 'In Progress');
  const completedOrders = labOrders.filter((o) => o.status === 'Completed');

  return (
    <div className="space-y-6">
      {/* Incoming Orders */}
      <div>
        <h2 className="text-cyan-300 font-bold text-lg mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {isAr ? 'الطلبات الواردة' : 'Incoming Orders'} ({pendingOrders.length})
        </h2>

        {pendingOrders.length === 0 ? (
          <Card className="bg-slate-800/50 border-cyan-500/20">
            <p className="p-6 text-center text-gray-400">
              {isAr ? 'لا توجد طلبات واردة' : 'No incoming orders'}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingOrders.map((order) => (
              <Card
                key={order.id}
                className={`${
                  order.status === 'In Progress'
                    ? 'bg-blue-900/20 border-blue-500/30'
                    : 'bg-yellow-900/20 border-yellow-500/30'
                }`}
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() =>
                    setExpandedOrderId(expandedOrderId === order.id ? null : order.id)
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="text-white font-bold">
                          {isAr ? 'المريض: ' : 'Patient: '}
                          <span className="text-cyan-300">
                            {order.patientName} ({order.patientNameAr})
                          </span>
                        </p>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 border ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusIcon(order.status)}
                          {isAr
                            ? order.status === 'Pending'
                              ? 'قيد الانتظار'
                              : 'قيد المعالجة'
                            : order.status}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        {isAr ? 'الطبيب: ' : 'Doctor: '}
                        {order.doctor}
                        {' • '}
                        {order.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-xs">
                        {isAr ? 'رقم الطلب: ' : 'Order ID: '}
                        <span className="text-cyan-300 font-mono">{order.id}</span>
                      </p>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedOrderId === order.id && (
                    <div className="mt-4 pt-4 border-t border-slate-600 space-y-3">
                      <div>
                        <h4 className="text-gray-300 font-semibold text-sm mb-2">
                          {isAr ? 'الفحوصات المطلوبة:' : 'Requested Tests:'}
                        </h4>
                        <div className="space-y-1">
                          {order.requestedTests.map((test) => (
                            <p
                              key={test.test}
                              className={`text-xs p-2 rounded bg-slate-900 border-l-2 ${
                                test.priority === 'High'
                                  ? 'border-red-500 text-red-300'
                                  : 'border-cyan-500 text-cyan-300'
                              }`}
                            >
                              {isAr ? test.name_ar : test.test}
                              {test.priority === 'High' && ' 🔴 ' + (isAr ? 'عاجل' : 'URGENT')}
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* Status Controls */}
                      {order.status === 'Pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStatusChange(order.id, 'In Progress')}
                            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-colors"
                          >
                            {isAr ? 'بدء المعالجة' : 'Start Processing'}
                          </button>
                        </div>
                      )}

                      {/* Upload Results Section */}
                      {(order.status === 'In Progress' || order.status === 'Pending') && (
                        <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-cyan-500/20">
                          {uploadingOrderId === order.id ? (
                            <div className="space-y-3">
                              <h4 className="text-cyan-300 font-semibold text-sm">
                                {isAr ? 'رفع النتائج:' : 'Upload Results:'}
                              </h4>
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {(newResults[order.id] || []).map((result, idx) => (
                                  <div key={idx} className="flex gap-2">
                                    <select
                                      value={result.test}
                                      onChange={(e) =>
                                        updateResult(order.id, idx, 'test', e.target.value)
                                      }
                                      className="flex-1 px-2 py-1 bg-slate-800 border border-cyan-500/30 rounded text-white text-xs focus:outline-none focus:border-cyan-500"
                                    >
                                      <option value="">
                                        {isAr ? 'اختر الفحص' : 'Select Test'}
                                      </option>
                                      {order.requestedTests.map((t) => (
                                        <option key={t.test} value={t.test}>
                                          {isAr ? t.name_ar : t.test}
                                        </option>
                                      ))}
                                    </select>
                                    <input
                                      type="text"
                                      placeholder={
                                        isAr
                                          ? 'النتيجة (مثال: طبيعي)'
                                          : 'Result (e.g., Normal)'
                                      }
                                      value={result.result}
                                      onChange={(e) =>
                                        updateResult(order.id, idx, 'result', e.target.value)
                                      }
                                      className="flex-1 px-2 py-1 bg-slate-800 border border-cyan-500/30 rounded text-white text-xs focus:outline-none focus:border-cyan-500"
                                    />
                                    <button
                                      onClick={() => removeResultInput(order.id, idx)}
                                      className="px-2 py-1 bg-red-900/40 hover:bg-red-900/60 text-red-300 rounded text-xs transition-colors"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <button
                                onClick={() => addResultInput(order.id)}
                                className="w-full px-2 py-1.5 bg-slate-800 hover:bg-slate-700 border border-cyan-500/30 text-cyan-300 rounded text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                {isAr ? 'إضافة نتيجة' : 'Add Result'}
                              </button>
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => handleUploadResults(order.id)}
                                  disabled={!newResults[order.id]?.every((r) => r.test && r.result)}
                                  className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  {isAr ? 'حفظ النتائج' : 'Save Results'}
                                </button>
                                <button
                                  onClick={() => setUploadingOrderId(null)}
                                  className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs font-semibold transition-colors"
                                >
                                  {isAr ? 'إلغاء' : 'Cancel'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setUploadingOrderId(order.id);
                                if (!newResults[order.id]) {
                                  setNewResults({ ...newResults, [order.id]: [] });
                                }
                              }}
                              className="w-full px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                              <Upload className="w-4 h-4" />
                              {isAr ? 'رفع النتائج' : 'Upload Results'}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Show Results if Completed */}
                      {order.status === 'Completed' && order.results?.length > 0 && (
                        <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                          <h4 className="text-green-300 font-semibold text-sm mb-2">
                            ✓ {isAr ? 'النتائج:' : 'Results:'}
                          </h4>
                          <div className="space-y-1">
                            {order.results.map((r, idx) => (
                              <p key={idx} className="text-green-200 text-xs">
                                • {r.test}: {r.result}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Completed Orders */}
      {completedOrders.length > 0 && (
        <div>
          <h2 className="text-green-300 font-bold text-lg mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {isAr ? 'الطلبات المنجزة' : 'Completed Orders'} ({completedOrders.length})
          </h2>
          <div className="space-y-2">
            {completedOrders.slice(0, 5).map((order) => (
              <Card key={order.id} className="bg-green-900/10 border-green-500/20 opacity-75">
                <div className="p-3 text-xs text-gray-400">
                  <p className="text-green-300 font-semibold">
                    {order.patientName} • {order.date}
                  </p>
                  <p>{order.requestedTests.length} tests completed</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
