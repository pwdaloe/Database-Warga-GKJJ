import { cn } from '@/lib/utils'
import { type FieldError } from 'react-hook-form'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: FieldError
  required?: boolean
}

export function InputField({ label, error, required, className, ...props }: InputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        {...props}
        className={cn(
          'w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition',
          'focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
          error ? 'border-red-400 bg-red-50' : 'border-gray-300',
          className,
        )}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error.message}</p>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: FieldError
  required?: boolean
  options: { value: string | number; label: string }[]
  placeholder?: string
}

export function SelectField({ label, error, required, options, placeholder, className, ...props }: SelectProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        {...props}
        className={cn(
          'w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition bg-white',
          'focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
          error ? 'border-red-400 bg-red-50' : 'border-gray-300',
          className,
        )}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error.message}</p>}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: FieldError
  required?: boolean
}

export function TextareaField({ label, error, required, className, ...props }: TextareaProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        {...props}
        rows={props.rows ?? 3}
        className={cn(
          'w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition resize-none',
          'focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
          error ? 'border-red-400 bg-red-50' : 'border-gray-300',
          className,
        )}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error.message}</p>}
    </div>
  )
}
