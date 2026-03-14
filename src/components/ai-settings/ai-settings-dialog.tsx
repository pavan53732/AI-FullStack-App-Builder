'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Settings,
  Check,
  Loader2,
  Key,
  Globe,
  Cpu,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ProviderPreset {
  id: string
  name: string
  baseUrl: string
  models: string[]
  requiresApiKey: boolean
  icon: string
}

interface AISettings {
  provider: string
  baseUrl: string
  apiKey: string
  model: string
  maxTokens: number
  temperature: number
  hasApiKey?: boolean
}

interface AISettingsDialogProps {
  trigger?: React.ReactNode
  onSettingsChange?: () => void
}

export function AISettingsDialog({ trigger, onSettingsChange }: AISettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  
  const [settings, setSettings] = useState<AISettings>({
    provider: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o',
    maxTokens: 4096,
    temperature: 0.7,
    hasApiKey: false
  })
  
  const [validationResult, setValidationResult] = useState<{
    tested: boolean
    valid: boolean
    error?: string
  } | null>(null)
  
  const [providers, setProviders] = useState<ProviderPreset[]>([])
  const [availableModels, setAvailableModels] = useState<string[]>([])

  useEffect(() => {
    if (open) loadSettings()
  }, [open])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai-settings')
      const data = await res.json()
      
      if (data.success) {
        setSettings(prev => ({
          ...prev,
          ...data.settings,
          apiKey: ''
        }))
        setProviders(data.providers || [])
        const currentProvider = data.providers?.find((p: ProviderPreset) => p.id === data.settings?.provider)
        if (currentProvider) setAvailableModels(currentProvider.models)
      }
    } catch {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleProviderChange = (providerId: string) => {
    const preset = providers.find(p => p.id === providerId)
    if (preset) {
      setSettings(prev => ({
        ...prev,
        provider: providerId,
        baseUrl: preset.baseUrl,
        model: preset.models[0] || prev.model
      }))
      setAvailableModels(preset.models)
      setValidationResult(null)
    }
  }

  const validateCredentials = async (showToast = true) => {
    if (!settings.baseUrl) {
      if (showToast) toast.error('Enter base URL')
      return { valid: false }
    }
    
    setValidating(true)
    setValidationResult(null)
    
    try {
      const res = await fetch('/api/ai-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate', ...settings })
      })
      
      const data = await res.json()
      const result = { tested: true, valid: data.valid, error: data.error }
      setValidationResult(result)
      
      if (showToast) {
        if (data.valid) {
          toast.success('✅ Connected!')
        } else {
          toast.error(`❌ ${data.error}`)
        }
      }
      return result
    } catch {
      const result = { tested: true, valid: false, error: 'Failed' }
      setValidationResult(result)
      return result
    } finally {
      setValidating(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    
    try {
      const validation = await validateCredentials(false)
      
      if (!validation.valid) {
        toast.error('❌ Connection failed. Check settings.')
        setSaving(false)
        return
      }
      
      const res = await fetch('/api/ai-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      
      const data = await res.json()
      
      if (data.success) {
        toast.success('✅ Saved!')
        onSettingsChange?.()
        setOpen(false)
      } else {
        toast.error(data.error || 'Failed')
      }
    } catch {
      toast.error('Failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="gap-1.5 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white">
            <Settings className="h-4 w-4" />
            AI Settings
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-purple-500" />
            AI Provider
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Provider Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Provider</Label>
              <div className="grid grid-cols-4 gap-1.5">
                {providers.slice(0, 8).map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleProviderChange(preset.id)}
                    className={cn(
                      "p-2 rounded-md border transition-all text-center",
                      settings.provider === preset.id
                        ? "border-primary bg-primary/10"
                        : "border-muted hover:border-muted-foreground/50"
                    )}
                  >
                    <div className="text-lg">{preset.icon}</div>
                    <div className="text-[10px] truncate">{preset.name}</div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Base URL & Model */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Globe className="h-3 w-3" /> URL
                </Label>
                <Input
                  value={settings.baseUrl}
                  onChange={e => { setSettings(prev => ({ ...prev, baseUrl: e.target.value })); setValidationResult(null) }}
                  className="h-8 text-xs"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Cpu className="h-3 w-3" /> Model
                </Label>
                {availableModels.length > 0 ? (
                  <Select value={settings.model} onValueChange={v => setSettings(prev => ({ ...prev, model: v }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {availableModels.map(m => <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={settings.model} onChange={e => setSettings(prev => ({ ...prev, model: e.target.value }))} className="h-8 text-xs" />
                )}
              </div>
            </div>
            
            {/* API Key */}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <Key className="h-3 w-3" /> API Key
                {settings.hasApiKey && !settings.apiKey && <Badge variant="outline" className="text-[10px] h-4">Saved</Badge>}
              </Label>
              <div className="relative">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  value={settings.apiKey}
                  onChange={e => { setSettings(prev => ({ ...prev, apiKey: e.target.value })); setValidationResult(null) }}
                  placeholder={settings.hasApiKey ? "Leave empty to keep" : "sk-..."}
                  className="h-8 text-xs pr-8"
                />
                <Button variant="ghost" size="sm" className="absolute right-0 top-0 h-8 w-8 p-0" onClick={() => setShowApiKey(!showApiKey)}>
                  {showApiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
              </div>
            </div>
            
            {/* Validation Result */}
            {validationResult?.tested && (
              <div className={cn(
                "p-2 rounded flex items-center gap-2 text-xs",
                validationResult.valid ? "bg-green-500/10 text-green-700" : "bg-red-500/10 text-red-700"
              )}>
                {validationResult.valid ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {validationResult.valid ? 'Connected!' : validationResult.error}
              </div>
            )}
            
            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => validateCredentials(true)} disabled={validating || !settings.baseUrl}>
                {validating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                Test
              </Button>
              <Button size="sm" onClick={saveSettings} disabled={saving} className="bg-gradient-to-r from-purple-600 to-pink-500">
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                Save
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
