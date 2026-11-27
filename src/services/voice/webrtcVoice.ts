/**
 * Consent-first WebRTC Peer-to-Peer Voice Chat manager.
 * Microphone access is requested ONLY after explicit user action ("Join Voice").
 * Audio streams travel directly peer-to-peer; never recorded or stored on servers.
 */

type SignalSender = (
  toClientId: string,
  signalType: 'offer' | 'answer' | 'ice' | 'join' | 'leave',
  payload?: unknown,
) => void;

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

class WebRtcVoiceManager {
  private localStream: MediaStream | null = null;
  private peers = new Map<string, RTCPeerConnection>();
  private audioElements = new Map<string, HTMLAudioElement>();
  private sendSignal: SignalSender | null = null;
  private muted = false;

  public isActive(): boolean {
    return this.localStream !== null;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public async join(sendSignal: SignalSender): Promise<{ ok: boolean; error?: string }> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return { ok: false, error: 'Voice chat is not supported in this browser.' };
    }
    if (typeof RTCPeerConnection === 'undefined') {
      return { ok: false, error: 'WebRTC is unavailable in this environment.' };
    }

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      this.sendSignal = sendSignal;
      this.muted = false;
      this.sendSignal('*', 'join');
      return { ok: true };
    } catch (err) {
      const name = err instanceof Error ? err.name : '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        return {
          ok: false,
          error: 'Microphone permission denied. Voice chat remains off; text chat still works.',
        };
      }
      if (name === 'NotFoundError') {
        return { ok: false, error: 'No microphone detected on this device.' };
      }
      return { ok: false, error: 'Could not start voice chat.' };
    }
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.localStream) {
      for (const track of this.localStream.getAudioTracks()) {
        track.enabled = !this.muted;
      }
    }
    return this.muted;
  }

  public leave(): void {
    if (this.sendSignal && this.localStream) {
      this.sendSignal('*', 'leave');
    }
    for (const pc of this.peers.values()) {
      try {
        pc.close();
      } catch {
        // ignore
      }
    }
    this.peers.clear();

    for (const audio of this.audioElements.values()) {
      try {
        audio.pause();
        audio.srcObject = null;
        audio.remove();
      } catch {
        // ignore
      }
    }
    this.audioElements.clear();

    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        track.stop();
      }
      this.localStream = null;
    }
    this.sendSignal = null;
    this.muted = false;
  }

  private createPeer(remoteClientId: string): RTCPeerConnection {
    const existing = this.peers.get(remoteClientId);
    if (existing) return existing;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    this.peers.set(remoteClientId, pc);

    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        pc.addTrack(track, this.localStream);
      }
    }

    pc.onicecandidate = (evt) => {
      if (evt.candidate && this.sendSignal) {
        this.sendSignal(remoteClientId, 'ice', evt.candidate.toJSON());
      }
    };

    pc.ontrack = (evt) => {
      const [remoteStream] = evt.streams;
      if (!remoteStream || typeof document === 'undefined') return;
      let audio = this.audioElements.get(remoteClientId);
      if (!audio) {
        audio = document.createElement('audio');
        audio.autoplay = true;
        audio.setAttribute('playsinline', 'true');
        this.audioElements.set(remoteClientId, audio);
      }
      audio.srcObject = remoteStream;
      void audio.play().catch(() => {});
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.closePeer(remoteClientId);
      }
    };

    return pc;
  }

  private closePeer(remoteClientId: string): void {
    const pc = this.peers.get(remoteClientId);
    if (pc) {
      try {
        pc.close();
      } catch {
        // ignore
      }
      this.peers.delete(remoteClientId);
    }
    const audio = this.audioElements.get(remoteClientId);
    if (audio) {
      try {
        audio.pause();
        audio.srcObject = null;
        audio.remove();
      } catch {
        // ignore
      }
      this.audioElements.delete(remoteClientId);
    }
  }

  public async handleSignal(
    fromClientId: string,
    signalType: 'offer' | 'answer' | 'ice' | 'join' | 'leave',
    payload?: unknown,
  ): Promise<void> {
    if (!this.localStream) return;

    if (signalType === 'leave') {
      this.closePeer(fromClientId);
      return;
    }

    if (signalType === 'join') {
      const pc = this.createPeer(fromClientId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.sendSignal?.(fromClientId, 'offer', offer);
      return;
    }

    if (signalType === 'offer' && payload) {
      const pc = this.createPeer(fromClientId);
      await pc.setRemoteDescription(new RTCSessionDescription(payload as RTCSessionDescriptionInit));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.sendSignal?.(fromClientId, 'answer', answer);
      return;
    }

    if (signalType === 'answer' && payload) {
      const pc = this.peers.get(fromClientId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(payload as RTCSessionDescriptionInit));
      }
      return;
    }

    if (signalType === 'ice' && payload) {
      const pc = this.peers.get(fromClientId);
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload as RTCIceCandidateInit));
        } catch {
          // ignore stale ICE candidate
        }
      }
    }
  }
}

export const voiceManager = new WebRtcVoiceManager();
