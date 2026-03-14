import { NextRequest, NextResponse } from 'next/server'
import {
  loadSettings,
  saveSettings,
  validateCredentials,
  PROVIDER_PRESETS
} from '@/lib/ai-settings'

/**
 * GET - Load current AI settings
 */
export async function GET() {
  try {
    const settings = await loadSettings()
    
    return NextResponse.json({
      success: true,
      settings: {
        provider: settings.provider,
        baseUrl: settings.baseUrl,
        model: settings.model,
        maxTokens: settings.maxTokens,
        temperature: settings.temperature,
        hasApiKey: !!settings.apiKey
      },
      providers: PROVIDER_PRESETS
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * POST - Validate or save settings
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body
    
    if (action === 'validate') {
      const result = await validateCredentials(data)
      return NextResponse.json(result)
    }
    
    // Save settings
    const settings = await saveSettings(data)
    
    return NextResponse.json({
      success: true,
      message: 'Settings saved'
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * DELETE - Reset settings
 */
export async function DELETE() {
  try {
    await saveSettings({
      provider: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      model: 'gpt-4o',
      maxTokens: 4096,
      temperature: 0.7
    })
    
    return NextResponse.json({ success: true, message: 'Reset complete' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
