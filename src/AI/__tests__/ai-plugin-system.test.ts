import { BackgammonGame, BackgammonPlayer } from '@nodots-llc/backgammon-types'
import { Game, Player, Robot } from '../../index'
import { AIPluginManager } from '../AIPluginManager'
import { BasicAIPlugin } from '../plugins/BasicAIPlugin'
import { BackgammonAIPlugin } from '../interfaces/AIPlugin'

describe('AI Plugin System', () => {
  test('plugin registration and retrieval', () => {
    const manager = new AIPluginManager();
    const plugin = new BasicAIPlugin();
    
    // Register plugin
    manager.registerPlugin(plugin);
    expect(manager.hasPlugin('basic-ai')).toBe(true);
    expect(manager.getPluginCount()).toBe(1);
    
    // Retrieve plugin
    const retrievedPlugin = manager.getPlugin('basic-ai');
    expect(retrievedPlugin).toBe(plugin);
    
    // Test default plugin
    expect(manager.getDefaultPlugin()).toBe('basic-ai');
  });
  
  test('plugin management operations', () => {
    const manager = new AIPluginManager();
    const plugin1 = new BasicAIPlugin();
    const plugin2 = new BasicAIPlugin();
    plugin2.name = 'basic-ai-2';
    
    // Register multiple plugins
    manager.registerPlugin(plugin1);
    manager.registerPlugin(plugin2);
    expect(manager.getPluginCount()).toBe(2);
    
    // Set default plugin
    manager.setDefaultPlugin('basic-ai-2');
    expect(manager.getDefaultPlugin()).toBe('basic-ai-2');
    
    // Get plugin without specifying name (should use default)
    const defaultPlugin = manager.getPlugin();
    expect(defaultPlugin.name).toBe('basic-ai-2');
    
    // Unregister plugin
    manager.unregisterPlugin('basic-ai');
    expect(manager.getPluginCount()).toBe(1);
    expect(manager.hasPlugin('basic-ai')).toBe(false);
    
    // Default should reset to remaining plugin
    expect(manager.getDefaultPlugin()).toBe('basic-ai-2');
  });
  
  test('Robot class has plugin management methods', () => {
    // Test that Robot class exposes plugin management
    expect(typeof Robot.registerAIPlugin).toBe('function');
    expect(typeof Robot.setDefaultAI).toBe('function');
    expect(typeof Robot.listAIPlugins).toBe('function');
    expect(typeof Robot.getDefaultAI).toBe('function');
  });
  
  test('Robot auto-registers basic AI plugin', () => {
    // The Robot class should auto-register the basic AI plugin
    const plugins = Robot.listAIPlugins();
    expect(plugins.length).toBeGreaterThan(0);
    
    const basicPlugin = plugins.find(p => p.name === 'basic-ai');
    expect(basicPlugin).toBeDefined();
    expect(basicPlugin?.name).toBe('basic-ai');
  });
  
  test('plugin capabilities are correctly defined', () => {
    const plugin = new BasicAIPlugin();
    const capabilities = plugin.getCapabilities();
    
    expect(capabilities.supportsPositionEvaluation).toBe(false);
    expect(capabilities.supportsMoveExplanation).toBe(false);
    expect(capabilities.supportsOpeningBook).toBe(false);
    expect(capabilities.supportsThreatAnalysis).toBe(false);
    expect(capabilities.supportsMultiMoveSequencing).toBe(false);
    expect(capabilities.supportsGamePhaseRecognition).toBe(false);
  });
  
  test('plugin supports all difficulty levels', () => {
    const plugin = new BasicAIPlugin();
    const difficulties = plugin.getSupportedDifficulties();
    
    expect(difficulties).toContain('beginner');
    expect(difficulties).toContain('intermediate');
    expect(difficulties).toContain('advanced');
    expect(difficulties.length).toBe(3);
  });
});