import type { Event } from 'vscode';
import { EventEmitter } from 'vscode';
import type { Container } from '../../container';

export interface ConnectionStateChangeEvent {
	key: string;
	reason: 'connected' | 'disconnected';
}

export class RichRemoteProviderService {
	private readonly _onDidChangeConnectionState = new EventEmitter<ConnectionStateChangeEvent>();
	get onDidChangeConnectionState(): Event<ConnectionStateChangeEvent> {
		return this._onDidChangeConnectionState.event;
	}

	private readonly _onAfterDidChangeConnectionState = new EventEmitter<ConnectionStateChangeEvent>();
	get onAfterDidChangeConnectionState(): Event<ConnectionStateChangeEvent> {
		return this._onAfterDidChangeConnectionState.event;
	}

	private readonly _connectedCache = new Set<string>();

	constructor(private readonly container: Container) {}

	connected(key: string): void {
		// Only fire events if the key is being connected for the first time
		if (this._connectedCache.has(key)) return;

		this._connectedCache.add(key);
		this.container.telemetry.sendEvent('remoteProviders/connected', { 'remoteProviders.key': key });

		this._onDidChangeConnectionState.fire({ key: key, reason: 'connected' });
		setTimeout(() => this._onAfterDidChangeConnectionState.fire({ key: key, reason: 'connected' }), 250);
	}

	disconnected(key: string): void {
		// Probably shouldn't bother to fire the event if we don't already think we are connected, but better to be safe
		// if (!_connectedCache.has(key)) return;
		this._connectedCache.delete(key);
		this.container.telemetry.sendEvent('remoteProviders/disconnected', { 'remoteProviders.key': key });

		this._onDidChangeConnectionState.fire({ key: key, reason: 'disconnected' });
		setTimeout(() => this._onAfterDidChangeConnectionState.fire({ key: key, reason: 'disconnected' }), 250);
	}

	isConnected(key?: string): boolean {
		return key == null ? this._connectedCache.size !== 0 : this._connectedCache.has(key);
	}
}
