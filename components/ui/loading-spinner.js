"use client"

export function LoadingSpinner({ size = "md", color = "gray" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  }

  const colorClasses = {
    blue: "text-blue-500",
    green: "text-green-500",
    gray: "text-gray-500"
  }

  return (
    <div className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`}>
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  )
}

export function PulseSpinner({ size = "md", color = "gray" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  }

  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500", 
    gray: "bg-gray-500"
  }

  return (
    <div className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-pulse`} />
  )
}

export function BounceSpinner({ size = "md", color = "gray" }) {
  const sizeClasses = {
    sm: "h-1 w-1",
    md: "h-2 w-2",
    lg: "h-3 w-3"
  }

  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    gray: "bg-gray-500"
  }

  return (
    <div className="flex space-x-1">
      <div className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }} />
      <div className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }} />
      <div className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }} />
    </div>
  )
}
