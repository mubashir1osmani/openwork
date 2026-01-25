// apps/web-server/src/routes/apiKeys.ts

import { Router, type Router as RouterType } from 'express';
import { storeApiKey, getApiKey, deleteApiKey, getAllApiKeys, hasAnyApiKey } from '../store/secureStorage.js';

const router: RouterType = Router();

/**
 * Check if any API key exists
 */
router.get('/has-any', async (req, res) => {
  try {
    const exists = await hasAnyApiKey();
    res.json({ exists });
  } catch (error) {
    console.error('[API Keys] Error checking if any API key exists:', error);
    res.status(500).json({ error: 'Failed to check API keys' });
  }
});

/**
 * Get all API keys (returns providers with keys, not the keys themselves)
 */
router.get('/all', async (req, res) => {
  try {
    const keys = await getAllApiKeys();
    res.json(keys);
  } catch (error) {
    console.error('[API Keys] Error getting all API keys:', error);
    res.status(500).json({ error: 'Failed to get API keys' });
  }
});

/**
 * Check if a specific API key exists
 */
router.get('/:provider/exists', async (req, res) => {
  try {
    const { provider } = req.params;
    const key = await getApiKey(provider);
    res.json({ exists: key !== null });
  } catch (error) {
    console.error('[API Keys] Error checking API key existence:', error);
    res.status(500).json({ error: 'Failed to check API key' });
  }
});

/**
 * Get an API key for a provider
 */
router.get('/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const key = await getApiKey(provider);
    res.json({ key });
  } catch (error) {
    console.error('[API Keys] Error getting API key:', error);
    res.status(500).json({ error: 'Failed to get API key' });
  }
});

/**
 * Store an API key for a provider
 */
router.post('/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const { key, label } = req.body;
    
    if (!key || typeof key !== 'string') {
      return res.status(400).json({ error: 'API key is required' });
    }
    
    await storeApiKey(provider, key, label);
    res.json({ success: true });
  } catch (error) {
    console.error('[API Keys] Error storing API key:', error);
    res.status(500).json({ error: 'Failed to store API key' });
  }
});

/**
 * Delete an API key for a provider
 */
router.delete('/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    await deleteApiKey(provider);
    res.json({ success: true });
  } catch (error) {
    console.error('[API Keys] Error deleting API key:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

/**
 * Validate an API key (basic check - actually calling the provider API would be better)
 */
router.post('/:provider/validate', async (req, res) => {
  try {
    const { provider } = req.params;
    const { key } = req.body;
    
    if (!key || typeof key !== 'string') {
      return res.status(400).json({ valid: false, error: 'API key is required' });
    }
    
    // Basic validation - just check if it's not empty
    // In a real implementation, you'd call the provider API to validate
    const valid = key.length > 0;
    res.json({ valid, error: valid ? undefined : 'Invalid API key format' });
  } catch (error) {
    console.error('[API Keys] Error validating API key:', error);
    res.status(500).json({ valid: false, error: 'Failed to validate API key' });
  }
});

export default router;
