import { io, Socket } from 'socket.io-client';
import type { Risk } from '../types/risk';

interface RiskUpdateEvent {
  riskId: string;
  action: 'create' | 'update' | 'delete';
  data: Risk | null;
}

interface RiskSyncEvent {
  risks: Risk[];
  timestamp: number;
}

class RealtimeService {
  private socket: Socket | null = null;
  private isConnected = false;
  private eventHandlers: Map<string, Array<(data: any) => void>> = new Map();

  constructor() {
    // Integration feature flag: off by default.
    // Avoid connecting (or even initializing) unless explicitly enabled.
    if (import.meta.env.VITE_ENABLE_REALTIME === 'true') {
      this.initializeSocket();
    }
  }

  private initializeSocket() {
    try {
      // In a real implementation, this would connect to your Vercel serverless functions
      // For now, we'll use a placeholder URL that would be configured via environment variables
      const serverUrl = import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:3001';

      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => {
        console.log('Connected to real-time service');
        this.isConnected = true;
        this.emitEvent('connect', { connected: true });
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected from real-time service:', reason);
        this.isConnected = false;
        this.emitEvent('disconnect', { connected: false, reason });
      });

      this.socket.on('connect_error', (error) => {
        console.error('Real-time connection error:', error);
        this.emitEvent('connect_error', { error: error.message });
      });

      // Listen for risk update events
      this.socket.on('risk-update', (data: RiskUpdateEvent) => {
        this.emitEvent('risk-update', data);
      });

      // Listen for bulk risk sync events
      this.socket.on('risk-sync', (data: RiskSyncEvent) => {
        this.emitEvent('risk-sync', data);
      });
    } catch (error) {
      console.error('Failed to initialize real-time service:', error);
    }
  }

  public connect(): void {
    if (import.meta.env.VITE_ENABLE_REALTIME !== 'true') return;
    if (this.socket && !this.isConnected) {
      this.socket.connect();
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }

  public isConnectedToRealtime(): boolean {
    return this.isConnected;
  }

  public subscribe(event: string, handler: (data: any) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)?.push(handler);
  }

  public unsubscribe(event: string, handler: (data: any) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emitEvent(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  public async broadcastRiskUpdate(risk: Risk, action: 'create' | 'update' | 'delete'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Not connected to real-time service'));
        return;
      }

      const payload: RiskUpdateEvent = {
        riskId: risk.id,
        action,
        data: action === 'delete' ? null : risk,
      };

      this.socket.emit('risk-update', payload, (response: any) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve();
        }
      });
    });
  }

  public async requestRiskSync(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Not connected to real-time service'));
        return;
      }

      this.socket.emit('request-risk-sync', (response: RiskSyncEvent | { error: string }) => {
        if ('error' in response) {
          reject(new Error(response.error));
        } else {
          this.emitEvent('risk-sync', response);
          resolve();
        }
      });
    });
  }

  // Method to join a specific room for risk updates
  public joinRiskRoom(riskId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-risk-room', { riskId });
    }
  }

  // Method to leave a specific room
  public leaveRiskRoom(riskId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-risk-room', { riskId });
    }
  }
}

// Singleton instance
export const realtimeService = new RealtimeService();

// React hook for using the real-time service
import { useEffect, useState } from 'react';

export const useRealtime = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleConnectError = (data: { error: string }) => setConnectionError(data.error);

    realtimeService.subscribe('connect', handleConnect);
    realtimeService.subscribe('disconnect', handleDisconnect);
    realtimeService.subscribe('connect_error', handleConnectError);

    // Initialize connection
    if (!realtimeService.isConnectedToRealtime()) {
      realtimeService.connect();
    }

    return () => {
      realtimeService.unsubscribe('connect', handleConnect);
      realtimeService.unsubscribe('disconnect', handleDisconnect);
      realtimeService.unsubscribe('connect_error', handleConnectError);
    };
  }, []);

  return {
    isConnected,
    connectionError,
    realtimeService,
  };
}; 
