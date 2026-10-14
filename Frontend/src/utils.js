export const currency = (amount) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(amount || 0)

export const paymentMethodLabel = (value) => value === 'razorpay' ? 'Razorpay test mode' : value || 'Demo'
export const isApprovedTheater = (theater) => theater.approvalStatus === 'approved' || !theater.approvalStatus

export const loadRazorpayCheckout = () => new Promise((resolve) => {
  if (window.Razorpay) return resolve(true)
  const script = document.createElement('script')
  script.src = 'https://checkout.razorpay.com/v1/checkout.js'
  script.onload = () => resolve(true)
  script.onerror = () => resolve(false)
  document.body.appendChild(script)
})

export const dateInputValue = (date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

export const dateTimeInputValue = (date) => {
  const local = new Date(new Date(date).getTime() - new Date(date).getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

export const displayDate = (date) => new Intl.DateTimeFormat('en-IN', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
}).format(new Date(date))

export const displayTime = (date) => new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric',
  minute: '2-digit',
}).format(new Date(date))
