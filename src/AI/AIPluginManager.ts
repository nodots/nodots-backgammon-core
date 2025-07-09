import { BackgammonAIPlugin } from './interfaces/AIPlugin'

export class AIPluginManager {
  private plugins = new Map<string, BackgammonAIPlugin>()
  private defaultPlugin: string | null = null
  
  registerPlugin(plugin: BackgammonAIPlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} already registered`)
    }
    this.plugins.set(plugin.name, plugin)
    
    // Set first plugin as default if none set
    if (!this.defaultPlugin) {
      this.defaultPlugin = plugin.name
    }
  }
  
  unregisterPlugin(pluginName: string): void {
    if (!this.plugins.has(pluginName)) {
      throw new Error(`Plugin ${pluginName} not found`)
    }
    this.plugins.delete(pluginName)
    
    // Reset default if we removed it
    if (this.defaultPlugin === pluginName) {
      this.defaultPlugin = this.plugins.size > 0 ? this.plugins.keys().next().value || null : null
    }
  }
  
  setDefaultPlugin(pluginName: string): void {
    if (!this.plugins.has(pluginName)) {
      throw new Error(`Plugin ${pluginName} not found`)
    }
    this.defaultPlugin = pluginName
  }
  
  getPlugin(pluginName?: string): BackgammonAIPlugin {
    const targetPlugin = pluginName || this.defaultPlugin
    if (!targetPlugin) {
      throw new Error('No AI plugin available')
    }
    
    const plugin = this.plugins.get(targetPlugin)
    if (!plugin) {
      throw new Error(`Plugin ${targetPlugin} not found`)
    }
    
    return plugin
  }
  
  listAvailablePlugins(): BackgammonAIPlugin[] {
    return Array.from(this.plugins.values())
  }
  
  getDefaultPlugin(): string | null {
    return this.defaultPlugin
  }
  
  hasPlugin(pluginName: string): boolean {
    return this.plugins.has(pluginName)
  }
  
  getPluginCount(): number {
    return this.plugins.size
  }
}