import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../utils/api'
import Step1_Client from './Step1_Client'
import Step2_Unit from './Step2_Unit'
import Step3_Amounts from './Step3_Amounts'
import Step4_Sources from './Step4_Sources'
import Step5_MarginSched from './Step5_MarginSched'
import Step6_LoanSched from './Step6_LoanSched'
import Step7_CashSched from './Step7_CashSched'
import Step8_Registry from './Step8_Registry'

const STEPS = [
  { label: 'Client' }, { label: 'Unit' }, { label: 'Amounts' }, { label: 'Sources' },
  { label: 'Margin' }, { label: 'Loan' }, { label: 'Cash' }, { label: 'Registry' }
]

const WizardStep = ({ index, current, label }) => {
  const completed = index < current
  const active = index === current
  return (
    <div className="wizard-step-wrapper">
      <div className={`wizard-step ${completed ? 'completed' : ''} ${active ? 'active' : ''}`}>
        <div className="wizard-step-circle">
          {completed ? '✓' : index + 1}
        </div>
      </div>
      <div className={`wizard-step-label ${active ? 'active' : ''} ${completed ? 'completed' : ''}`}>{label}</div>
    </div>
  )
}

const DealWizard = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    // Step 1
    client: null, newClient: false,
    clientName: '', clientMobile: '', clientEmail: '', clientPan: '', clientAadhar: '', clientAddress: '',
    // Step 2
    project: null, unit: null,
    // Step 3
    dealAmount: '', maintenanceDeposit: '', gstOverridden: false, gstAmount: '',
    extraWork: '', otherCharges: '',
    // Calculated
    stampDuty: 0, gstRate: 0, gstAmountCalc: 0, subTotal: 0, totalCash: 0,
    // Step 4
    ownMargin: '', loanAmount: '', loanBank: '',
    // Step 5
    marginSchedule: [],
    // Step 6
    loanSchedule: [],
    // Step 7
    cashSchedule: [],
    // Step 8
    possessionDate: '', registryTargetDate: '', notes: ''
  })

  const update = (fields) => setFormData(prev => ({ ...prev, ...fields }))

  const next = () => setStep(s => Math.min(s + 1, 7))
  const prev = () => setStep(s => Math.max(s - 1, 0))

  const handleSubmit = async () => {
    try {
      setSaving(true)

      // Create client if new
      let clientId = formData.client?.id
      if (formData.newClient) {
        const res = await api.post('/clients', {
          name: formData.clientName, mobile: formData.clientMobile,
          email: formData.clientEmail, pan: formData.clientPan,
          aadhar: formData.clientAadhar, address: formData.clientAddress
        })
        clientId = res.data.data.id
      }

      const payload = {
        projectId: formData.project.id,
        unitId: formData.unit.id,
        clientId,
        dealAmount: parseFloat(formData.dealAmount),
        maintenanceDeposit: parseFloat(formData.maintenanceDeposit || formData.project?.maintenanceDeposit || 0),
        ownMargin: parseFloat(formData.ownMargin),
        loanAmount: parseFloat(formData.loanAmount),
        loanBank: formData.loanBank || null,
        extraWork: parseFloat(formData.extraWork || 0),
        otherCharges: parseFloat(formData.otherCharges || 0),
        gstOverridden: formData.gstOverridden,
        gstAmount: formData.gstOverridden ? parseFloat(formData.gstAmount) : undefined,
        possessionDate: formData.possessionDate || null,
        registryTargetDate: formData.registryTargetDate || null,
        notes: formData.notes || null,
        marginSchedule: formData.marginSchedule.map(ms => ({ description: ms.description, dueDate: ms.dueDate, amount: parseFloat(ms.amount) })),
        loanSchedule: formData.loanSchedule.map(ls => ({ stageDescription: ls.stageDescription, expectedDate: ls.expectedDate, amount: parseFloat(ls.amount) })),
        cashSchedule: formData.cashSchedule.map(cs => ({ description: cs.description, dueDate: cs.dueDate, amount: parseFloat(cs.amount) }))
      }

      const res = await api.post('/deals', payload)
      toast.success('Deal created successfully! 🎉')
      navigate(`/deals/${res.data.data.id}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create deal. Please check all fields.')
    } finally {
      setSaving(false)
    }
  }

  const stepComponents = [
    <Step1_Client formData={formData} update={update} onNext={next} />,
    <Step2_Unit formData={formData} update={update} onNext={next} onPrev={prev} />,
    <Step3_Amounts formData={formData} update={update} onNext={next} onPrev={prev} />,
    <Step4_Sources formData={formData} update={update} onNext={next} onPrev={prev} />,
    <Step5_MarginSched formData={formData} update={update} onNext={next} onPrev={prev} />,
    <Step6_LoanSched formData={formData} update={update} onNext={next} onPrev={prev} />,
    <Step7_CashSched formData={formData} update={update} onNext={next} onPrev={prev} />,
    <Step8_Registry formData={formData} update={update} onPrev={prev} onSubmit={handleSubmit} saving={saving} />
  ]

  return (
    <div>
      <div className="page-header">
        <h1>New Booking</h1>
        <p>Complete all 8 steps to create a new deal</p>
      </div>

      {/* Step indicator */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="wizard-steps">
          {STEPS.map((s, i) => (
            <React.Fragment key={i}>
              <WizardStep index={i} current={step} label={s.label} />
              {i < STEPS.length - 1 && <div className={`wizard-connector ${i < step ? 'completed' : ''}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="card">
        {stepComponents[step]}
      </div>
    </div>
  )
}

export default DealWizard
