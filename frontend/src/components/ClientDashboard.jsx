import React, { useState } from 'react';
import { 
  Home, DollarSign, CheckCircle, Clock, Download, 
  CreditCard, Sparkles, Image, PhoneCall, Shield, ArrowRight 
} from 'react-feather';

export default function ClientDashboard({ 
  currentProject, 
  invoices, 
  changeOrders, 
  onPayInvoice, 
  onRequestChangeOrder 
}) {
  const [showPayModal, setShowPayModal] = useState(null); // invoice object
  const [showCOModal, setShowCOModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Change order form state
  const [coForm, setCoForm] = useState({
    title: 'Italian Marble Flooring Upgrade in Living Room',
    description: 'Replace standard porcelain tiles with 20mm Bottochino Italian Marble.',
    estimatedAdditionalCost: '350000',
    timeExtensionDays: '4'
  });

  const proj = currentProject || {
    id: '',
    name: 'No Active Project',
    clientName: 'Client',
    location: 'N/A',
    budget: 0,
    spent: 0,
    progress: 0,
    engineerInCharge: 'N/A',
    contactPhone: '',
    type: 'Building',
    milestones: []
  };

  const projInvoices = invoices.filter(i => i.projectId === proj.id || !i.projectId);
  const totalPaid = projInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.totalAmount, 0);

  const handleCoSubmit = (e) => {
    e.preventDefault();
    onRequestChangeOrder({
      projectId: proj.id,
      projectName: proj.name,
      requestedBy: proj.clientName,
      ...coForm
    });
    setShowCOModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Banner / Client Welcome */}
      <div className="glass-card" style={{
        padding: '24px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(19, 27, 46, 0.9) 100%)',
        borderLeft: '4px solid var(--accent-emerald)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge badge-emerald">Client Owner Portal</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Welcome, {proj.clientName}</span>
            </div>
            <h2 style={{ fontSize: '1.6rem', marginTop: '6px' }}>
              {proj.name}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Location: {proj.location} | Site Engineer: {proj.engineerInCharge} ({proj.contactPhone})
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" onClick={() => setShowCOModal(true)}>
              <Sparkles size={16} /> Request Custom Change Order
            </button>
          </div>
        </div>
      </div>

      {/* Progress & Milestone Timeline Section */}
      <div className="grid-2">
        
        {/* Left Column: Overall Progress & Milestone Stages */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.15rem' }}>Construction Milestone Stages</h3>
            <span className="badge badge-amber">{proj.progress}% Completed</span>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div className="progress-track" style={{ height: '12px' }}>
              <div className="progress-fill" style={{ width: `${proj.progress}%` }}></div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {proj.milestones.map((m, idx) => (
              <div key={m.id} style={{
                padding: '14px',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: m.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : m.status === 'in_progress' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.05)',
                    color: m.status === 'completed' ? 'var(--accent-emerald)' : m.status === 'in_progress' ? 'var(--accent-amber)' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                  }}>
                    {m.status === 'completed' ? <CheckCircle size={18} /> : idx + 1}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{m.name}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status: {m.status.replace('_', ' ').toUpperCase()}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${m.status === 'completed' ? 'badge-emerald' : m.status === 'in_progress' ? 'badge-amber' : 'badge-rose'}`}>
                    {m.progress}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Invoices & Payment Center */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Billing & Invoices</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Total Paid: ₹{totalPaid.toLocaleString('en-IN')} | Download Invoices
              </p>
            </div>
            <CreditCard size={22} color="var(--accent-emerald)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {projInvoices.map(inv => (
              <div key={inv.id} style={{
                padding: '16px',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-amber">{inv.id}</span>
                    <strong style={{ fontSize: '0.95rem' }}>₹{inv.totalAmount.toLocaleString('en-IN')}</strong>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '4px' }}>
                    {inv.stage}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Due Date: {inv.dueDate} | Incl. 18% GST (₹{inv.gst.toLocaleString('en-IN')})
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {inv.status === 'paid' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="badge badge-emerald">PAID</span>
                      <button className="btn btn-sm btn-secondary" onClick={() => setSelectedReceipt(inv)}>
                        <Download size={14} /> Receipt
                      </button>
                    </div>
                  ) : (
                    <button className="btn btn-sm btn-primary" onClick={() => setShowPayModal(inv)}>
                      <CreditCard size={14} /> Pay Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Change Orders Status Section */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="var(--accent-purple)" /> My Change Order Requests
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {changeOrders.map(co => (
            <div key={co.id} style={{
              padding: '16px',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <h4 style={{ fontSize: '0.95rem' }}>{co.title}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{co.description}</p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Est. Additional Cost: +₹{co.estimatedAdditionalCost.toLocaleString('en-IN')} | Time Extension: +{co.timeExtensionDays} Days
                </span>
              </div>
              <div>
                <span className={`badge ${co.status === 'approved' ? 'badge-emerald' : co.status === 'rejected' ? 'badge-rose' : 'badge-amber'}`}>
                  {co.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Modal */}
      {showPayModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-card" style={{ padding: '24px', width: '90%', maxWidth: '480px' }}>
            <h3 style={{ marginBottom: '12px' }}>Online Milestone Payment</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Invoice: <strong>{showPayModal.id}</strong> ({showPayModal.stage})
            </p>

            <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Milestone Amount:</span>
                <span>₹{showPayModal.amount.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span>GST (18%):</span>
                <span>+₹{showPayModal.gst.toLocaleString('en-IN')}</span>
              </div>
              <hr style={{ borderColor: 'var(--border-color)', margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--accent-emerald)' }}>
                <span>Total Payable:</span>
                <span>₹{showPayModal.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Gateway Simulation</label>
              <select className="form-control">
                <option>UPI (Google Pay / PhonePe / Paytm)</option>
                <option>Net Banking (HDFC / SBI / ICICI)</option>
                <option>Credit / Debit Card</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setShowPayModal(null)}>Cancel</button>
              <button className="btn btn-success" onClick={() => {
                onPayInvoice(showPayModal.id);
                setShowPayModal(null);
              }}>
                <Shield size={16} /> Confirm & Pay ₹{showPayModal.totalAmount.toLocaleString('en-IN')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Order Modal */}
      {showCOModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-card" style={{ padding: '24px', width: '90%', maxWidth: '520px' }}>
            <h3 style={{ marginBottom: '12px' }}>Request Change Order / Customization</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Submit change requests for floor plan, tiles, or paint color modifications.
            </p>

            <form onSubmit={handleCoSubmit}>
              <div className="form-group">
                <label className="form-label">Change Title</label>
                <input className="form-control" value={coForm.title} onChange={e => setCoForm({...coForm, title: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Detailed Specification</label>
                <textarea className="form-control" value={coForm.description} onChange={e => setCoForm({...coForm, description: e.target.value})} required />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Est. Add. Budget (₹)</label>
                  <input className="form-control" type="number" value={coForm.estimatedAdditionalCost} onChange={e => setCoForm({...coForm, estimatedAdditionalCost: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Days Needed (+Days)</label>
                  <input className="form-control" type="number" value={coForm.timeExtensionDays} onChange={e => setCoForm({...coForm, timeExtensionDays: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCOModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Change Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Receipt Preview Modal */}
      {selectedReceipt && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-card" style={{ padding: '32px', width: '90%', maxWidth: '580px', background: '#fff', color: '#000' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #f59e0b', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ color: '#0f172a', fontSize: '1.4rem' }}>BuildMaster ERP</h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Official Construction Payment Receipt</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontWeight: 'bold', color: '#10b981' }}>PAID RECEIPT</span>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Receipt #: {selectedReceipt.id}</p>
              </div>
            </div>

            <div style={{ marginTop: '20px', fontSize: '0.9rem', lineHeight: '1.8' }}>
              <p><strong>Client Name:</strong> {selectedReceipt.clientName}</p>
              <p><strong>Project:</strong> {selectedReceipt.projectName}</p>
              <p><strong>Milestone Stage:</strong> {selectedReceipt.stage}</p>
              <p><strong>Payment Date:</strong> {selectedReceipt.paidDate || new Date().toISOString().split('T')[0]}</p>
              <p><strong>Base Amount:</strong> ₹{selectedReceipt.amount.toLocaleString('en-IN')}</p>
              <p><strong>GST (18%):</strong> ₹{selectedReceipt.gst.toLocaleString('en-IN')}</p>
              <hr style={{ margin: '12px 0' }} />
              <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#059669' }}>
                Total Paid Amount: ₹{selectedReceipt.totalAmount.toLocaleString('en-IN')}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button className="btn btn-secondary" style={{ background: '#e2e8f0', color: '#000' }} onClick={() => setSelectedReceipt(null)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={() => {
                alert('Receipt downloaded as PDF!');
                setSelectedReceipt(null);
              }}>
                <Download size={16} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
