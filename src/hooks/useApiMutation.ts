"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

interface UseApiMutationOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  showSuccessToast?: boolean
  showErrorToast?: boolean
  successMessage?: string
}

interface UseApiMutationReturn<T, P> {
  data: T | null
  loading: boolean
  error: Error | null
  mutate: (params: P) => Promise<T>
  reset: () => void
}

export function useApiMutation<T, P = any>(
  apiFunction: (params: P) => Promise<T>,
  options: UseApiMutationOptions<T> = {},
): UseApiMutationReturn<T, P> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()

  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
    successMessage = "Operation completed successfully",
  } = options

  const mutate = async (params: P): Promise<T> => {
    try {
      setLoading(true)
      setError(null)

      const result = await apiFunction(params)
      setData(result)

      if (onSuccess) {
        onSuccess(result)
      }

      if (showSuccessToast) {
        toast({
          title: "Success",
          description: successMessage,
        })
      }

      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error("An error occurred")
      setError(error)

      if (onError) {
        onError(error)
      }

      if (showErrorToast) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      }

      throw error
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setData(null)
    setError(null)
    setLoading(false)
  }

  return {
    data,
    loading,
    error,
    mutate,
    reset,
  }
}
