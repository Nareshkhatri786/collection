import React from 'react'

const FormField = ({ label, required, hint, error, children, style }) => (
  <div className="form-group" style={style}>
    {label && (
      <label className="form-label">
        {label}{required && <span className="required"> *</span>}
      </label>
    )}
    {children}
    {hint && <div className="form-hint">{hint}</div>}
    {error && <div className="form-error">⚠ {error}</div>}
  </div>
)

export default FormField
