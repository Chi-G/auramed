import React, { useState } from 'react';
import { X, Activity, Calendar, User, FileText } from 'lucide-react';
import { format } from 'date-fns';
import type { ClinicalVisit } from '../types';

interface ViewVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  visit?: ClinicalVisit;
}

const ViewVisitModal: React.FC<ViewVisitModalProps> = ({ isOpen, onClose, visit }) => {
  const [activeTab, setActiveTab] = useState('assessment');

  if (!isOpen || !visit) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Clinical Visit Details</h2>
            <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
              <Calendar size={14} />
              {format(new Date(visit.visit_date), 'MMMM d, yyyy - h:mm a')}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-6">
          <button 
            onClick={() => setActiveTab('assessment')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${activeTab === 'assessment' ? 'text-sky-600 border-sky-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
          >
            Clinical Assessment
          </button>
          <button 
            onClick={() => setActiveTab('treatments')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${activeTab === 'treatments' ? 'text-sky-600 border-sky-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
          >
            Treatments
          </button>
          <button 
            onClick={() => setActiveTab('diagnostics')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${activeTab === 'diagnostics' ? 'text-sky-600 border-sky-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
          >
            Diagnostics
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'assessment' && (
            <div className="space-y-6">
              {/* Patient Info */}
              <section className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-4">
                <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 font-bold text-lg">
                  <User size={24} />
                </div>
                <div>
                   <h3 className="font-bold text-slate-900 text-lg">
                    {visit.patient ? `${visit.patient.first_name} ${visit.patient.last_name}` : 'Unknown Patient'}
                   </h3>
                   <p className="text-sm text-slate-500">ID: {visit.patient?.patient_id || 'N/A'}</p>
                </div>
              </section>

              {/* Vitals Section */}
              <section>
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Activity size={18} className="text-sky-600" />
                  Primary Vitals
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Height</p>
                    <p className="font-semibold text-slate-700">{visit.height_cm ? `${visit.height_cm} cm` : 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Weight</p>
                    <p className="font-semibold text-slate-700">{visit.weight_kg ? `${visit.weight_kg} kg` : 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">BMI</p>
                     <p className="font-semibold text-slate-700">{visit.bmi || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">BP</p>
                    <p className="font-semibold text-slate-700">
                      {visit.bp_systolic && visit.bp_diastolic ? `${visit.bp_systolic}/${visit.bp_diastolic}` : 'N/A'}
                    </p>
                  </div>
                   <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Glucose</p>
                    <p className="font-semibold text-slate-700">{visit.glucose_level ? `${visit.glucose_level} mg/dL` : 'N/A'}</p>
                  </div>
                </div>
              </section>

              {/* Clinical Findings */}
              <section className="space-y-4">
                <div>
                   <h3 className="text-sm font-bold text-slate-900 mb-2">Chief Complaints</h3>
                   <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-700 leading-relaxed">
                     {visit.complaints || 'No complaints recorded.'}
                   </div>
                </div>
                <div>
                   <h3 className="text-sm font-bold text-slate-900 mb-2">Diagnosis</h3>
                   <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-700 leading-relaxed">
                      {visit.diagnosis || 'No diagnosis recorded.'}
                   </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Follow-up Date</h3>
                  <div className="p-3 border border-slate-200 rounded-lg bg-white inline-block text-slate-700 font-medium">
                     {visit.follow_up_date ? format(new Date(visit.follow_up_date), 'MMMM d, yyyy') : 'No follow-up scheduled'}
                   </div>
                </div>
                 <div>
                   <h3 className="text-sm font-bold text-slate-900 mb-2">Notes</h3>
                   <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-700 leading-relaxed italic">
                      {visit.notes || 'No additional notes.'}
                   </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'treatments' && (
            <div className="space-y-6">
              {visit.treatment_records && visit.treatment_records.length > 0 ? (
                visit.treatment_records.map((treatment) => (
                  <div key={treatment.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 mb-2">{treatment.treatment_type}</h3>
                    {treatment.notes && (
                      <div className="text-slate-600 text-sm">
                        <span className="font-semibold text-slate-700">Notes:</span> {treatment.notes}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <FileText size={48} className="mb-4 opacity-50" />
                  <p>No treatment details recorded.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'diagnostics' && (
            <div className="space-y-6">
              {visit.specialized_diagnostics && visit.specialized_diagnostics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {visit.specialized_diagnostics.map((diagnostic) => (
                    <div key={diagnostic.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                      <h3 className="font-bold text-sky-700 mb-2 flex items-center gap-2">
                         <Activity size={16} />
                         {diagnostic.diagnostic_type}
                      </h3>
                      {diagnostic.findings && (
                         <div className="text-slate-600 text-sm mt-2">
                           <span className="font-semibold text-slate-700 block mb-1">Findings:</span>
                           {diagnostic.findings}
                         </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <FileText size={48} className="mb-4 opacity-50" />
                  <p>No diagnostic details recorded.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end">
           <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-all"
            >
              Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default ViewVisitModal;
