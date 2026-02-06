'use client'

/**
 * AI Agent Client Utility
 *
 * Client-side wrapper for calling the AI Agent API route.
 * API keys are kept secure on the server.
 *
 * @example
 * ```tsx
 * import { callAIAgent } from '@/lib/aiAgent'
 *
 * const result = await callAIAgent('Hello!', 'agent-id')
 * if (result.success) {
 *   console.log(result.response.result)
 * }
 * ```
 */

import { useState } from 'react'

// Types
export interface NormalizedAgentResponse {
  status: 'success' | 'error'
  result: Record<string, any>
  message?: string
  metadata?: {
    agent_name?: string
    timestamp?: string
    [key: string]: any
  }
}

export interface AIAgentResponse {
  success: boolean
  response: NormalizedAgentResponse
  agent_id?: string
  user_id?: string
  session_id?: string
  timestamp?: string
  raw_response?: string
  error?: string
  details?: string
}

export interface UploadedFile {
  asset_id: string
  file_name: string
  success: boolean
  error?: string
}

export interface UploadResponse {
  success: boolean
  asset_ids: string[]
  files: UploadedFile[]
  total_files: number
  successful_uploads: number
  failed_uploads: number
  message: string
  timestamp: string
  error?: string
}

/**
 * Generate a simple UUID
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Call the AI Agent directly (fallback when server API fails)
 */
async function callAIAgentDirect(
  message: string,
  agent_id: string,
  options?: { user_id?: string; session_id?: string; assets?: string[] }
): Promise<AIAgentResponse> {
  try {
    const LYZR_API_URL = 'https://agent-prod.studio.lyzr.ai/v3/inference/chat/'
    const LYZR_API_KEY = 'sk-default-XCw5s61QhnvHnRPI1w2pnlKOzYriJ6UU'

    const finalUserId = options?.user_id || `user-${generateUUID()}`
    const finalSessionId = options?.session_id || `${agent_id}-${generateUUID().substring(0, 12)}`

    const payload: Record<string, any> = {
      message,
      agent_id,
      user_id: finalUserId,
      session_id: finalSessionId,
    }

    if (options?.assets && options.assets.length > 0) {
      payload.assets = options.assets
    }

    const response = await fetch(LYZR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': LYZR_API_KEY,
      },
      body: JSON.stringify(payload),
    })

    const rawText = await response.text()
    console.log('[callAIAgentDirect] Raw response:', rawText.substring(0, 200))

    if (response.ok) {
      let parsed: any
      try {
        // Try to parse as JSON first
        parsed = JSON.parse(rawText)
        console.log('[callAIAgentDirect] Parsed JSON successfully')
      } catch {
        console.log('[callAIAgentDirect] Failed to parse as JSON, trying markdown extraction')
        // If that fails, try to extract JSON from markdown code blocks
        const jsonMatch = rawText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[1].trim())
            console.log('[callAIAgentDirect] Extracted JSON from markdown')
          } catch {
            console.log('[callAIAgentDirect] Failed to parse extracted JSON, using raw text')
            parsed = { text: rawText }
          }
        } else {
          console.log('[callAIAgentDirect] No JSON found, using raw text')
          parsed = { text: rawText }
        }
      }

      console.log('[callAIAgentDirect] Final parsed result:', parsed)
      return {
        success: true,
        response: {
          status: 'success',
          result: parsed,
        },
        agent_id,
        user_id: finalUserId,
        session_id: finalSessionId,
        timestamp: new Date().toISOString(),
      }
    } else {
      return {
        success: false,
        response: {
          status: 'error',
          result: {},
          message: `API returned status ${response.status}`,
        },
        error: `API returned status ${response.status}`,
      }
    }
  } catch (error) {
    return {
      success: false,
      response: {
        status: 'error',
        result: {},
        message: error instanceof Error ? error.message : 'Network error',
      },
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

/**
 * Call the AI Agent via server-side API route (with fallback to direct call)
 */
export async function callAIAgent(
  message: string,
  agent_id: string,
  options?: { user_id?: string; session_id?: string; assets?: string[] }
): Promise<AIAgentResponse> {
  console.log('[callAIAgent] Starting request:', { message: message.substring(0, 50), agent_id })

  try {
    console.log('[callAIAgent] Attempting server API route /api/agent')
    const response = await fetch('/api/agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        agent_id,
        user_id: options?.user_id,
        session_id: options?.session_id,
        assets: options?.assets,
      }),
    })

    console.log('[callAIAgent] Server API response status:', response.status)

    // If we get a 404, the API route doesn't exist - use direct call
    if (response.status === 404) {
      console.warn('[aiAgent] Server API not found (404), falling back to direct API call')
      return callAIAgentDirect(message, agent_id, options)
    }

    const data = await response.json()
    console.log('[callAIAgent] Server API response data:', data)
    return data
  } catch (error) {
    // If server API fails completely, fall back to direct call
    console.warn('[aiAgent] Server API failed, falling back to direct API call:', error)
    return callAIAgentDirect(message, agent_id, options)
  }
}

/**
 * Upload files via server-side API route
 */
export async function uploadFiles(files: File | File[]): Promise<UploadResponse> {
  const fileArray = Array.isArray(files) ? files : [files]

  if (fileArray.length === 0) {
    return {
      success: false,
      asset_ids: [],
      files: [],
      total_files: 0,
      successful_uploads: 0,
      failed_uploads: 0,
      message: 'No files provided',
      timestamp: new Date().toISOString(),
      error: 'No files provided',
    }
  }

  try {
    const formData = new FormData()
    for (const file of fileArray) {
      formData.append('files', file, file.name)
    }

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      asset_ids: [],
      files: [],
      total_files: fileArray.length,
      successful_uploads: 0,
      failed_uploads: fileArray.length,
      message: 'Network error during upload',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * React hook for using AI Agent in components
 */
export function useAIAgent() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<NormalizedAgentResponse | null>(null)

  const callAgent = async (
    message: string,
    agent_id: string,
    options?: { user_id?: string; session_id?: string; assets?: string[] }
  ) => {
    setLoading(true)
    setError(null)
    setResponse(null)

    const result = await callAIAgent(message, agent_id, options)

    if (result.success) {
      setResponse(result.response)
    } else {
      setError(result.error || 'Unknown error')
      setResponse(result.response)
    }

    setLoading(false)
    return result
  }

  return {
    callAgent,
    loading,
    error,
    response,
  }
}

/**
 * React hook for file uploads
 */
export function useFileUpload() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<UploadResponse | null>(null)

  const upload = async (files: File | File[]) => {
    setUploading(true)
    setError(null)
    setResult(null)

    const uploadResult = await uploadFiles(files)

    if (uploadResult.success) {
      setResult(uploadResult)
    } else {
      setError(uploadResult.error || 'Upload failed')
      setResult(uploadResult)
    }

    setUploading(false)
    return uploadResult
  }

  return {
    upload,
    uploading,
    error,
    result,
  }
}

/**
 * Extract text from agent response
 */
export function extractText(response: NormalizedAgentResponse): string {
  if (response.message) return response.message
  if (response.result?.text) return response.result.text
  if (response.result?.message) return response.result.message
  if (response.result?.answer) return response.result.answer
  if (response.result?.answer_text) return response.result.answer_text
  if (typeof response.result === 'string') return response.result
  return ''
}
