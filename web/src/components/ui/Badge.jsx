'use client';

const STATUS_CLASSES = {
  // Booking statuses
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  confirmed: 'bg-green-100 text-green-800',
  refused: 'bg-red-100 text-red-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-gray-100 text-gray-600',
  // Mission statuses
  searching: 'bg-yellow-100 text-yellow-800',
  offered: 'bg-blue-100 text-blue-800',
  no_match: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-600',
  // Verification statuses
  en_attente: 'bg-yellow-100 text-yellow-800',
  accepte: 'bg-green-100 text-green-800',
  rejete: 'bg-red-100 text-red-800',
  // Subscription statuses
  active: 'bg-green-100 text-green-800',
  trialing: 'bg-blue-100 text-blue-800',
  past_due: 'bg-orange-100 text-orange-800',
  canceled: 'bg-gray-100 text-gray-600',
  // Generic
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  default: 'bg-gray-100 text-gray-700',
};

const SIZE_CLASSES = {
  xs: 'text-xs px-2 py-0.5 rounded-md',
  sm: 'text-xs px-2.5 py-1 rounded-lg',
  md: 'text-sm px-3 py-1 rounded-lg',
};

export default function Badge({ status, label, size = 'sm', className = '' }) {
  const colorClass = STATUS_CLASSES[status] || STATUS_CLASSES.default;
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.sm;

  return (
    <span className={`inline-flex items-center font-medium ${colorClass} ${sizeClass} ${className}`}>
      {label}
    </span>
  );
}
