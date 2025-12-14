import { IProvider, ProviderId, ProviderConfig } from '@oneship/core';
import { BaseProvider } from './base-provider';

/**
 * Provider registry for managing all courier providers
 */
export class ProviderRegistry {
  private providers: Map<ProviderId, IProvider> = new Map();
  private initializedProviders: Map<ProviderId, ProviderConfig> = new Map();

  /**
   * Register a provider
   */
  register(provider: IProvider): void {
    if (this.providers.has(provider.id)) {
      throw new Error(`Provider ${provider.id} is already registered`);
    }
    this.providers.set(provider.id, provider);
  }

  /**
   * Get a provider by ID
   */
  get(providerId: ProviderId): IProvider | undefined {
    return this.providers.get(providerId);
  }

  /**
   * Get all registered providers
   */
  getAll(): IProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Initialize a provider with configuration
   */
  async initializeProvider(providerId: ProviderId, config: ProviderConfig): Promise<void> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} is not registered`);
    }

    await provider.initialize(config);
    this.initializedProviders.set(providerId, config);
  }

  /**
   * Check if a provider is initialized
   */
  isInitialized(providerId: ProviderId): boolean {
    return this.initializedProviders.has(providerId);
  }

  /**
   * Get initialized provider
   */
  getInitialized(providerId: ProviderId): IProvider | undefined {
    if (!this.isInitialized(providerId)) {
      return undefined;
    }
    return this.providers.get(providerId);
  }

  /**
   * Unregister a provider
   */
  unregister(providerId: ProviderId): void {
    const provider = this.providers.get(providerId);
    if (provider && 'stopFreeShippingListener' in provider) {
      provider.stopFreeShippingListener?.();
    }
    this.providers.delete(providerId);
    this.initializedProviders.delete(providerId);
  }

  /**
   * Clear all providers
   */
  clear(): void {
    this.providers.forEach((provider) => {
      if ('stopFreeShippingListener' in provider) {
        provider.stopFreeShippingListener?.();
      }
    });
    this.providers.clear();
    this.initializedProviders.clear();
  }
}

