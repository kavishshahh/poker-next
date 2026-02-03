// Sound effects for poker actions using MP3 files

class SoundEffects {
  private isMuted = false
  private callSound: HTMLAudioElement | null = null
  private raiseSound: HTMLAudioElement | null = null
  private audioContext: AudioContext | null = null

  constructor() {
    // Initialize sounds if in browser
    if (typeof window !== 'undefined') {
      this.callSound = new Audio('/callPokerChips.mp3')
      this.raiseSound = new Audio('/allinpushchips.mp3')
      document.addEventListener('click', () => this.initAudioContext(), { once: true })
    }
  }

  private initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }

  private play(frequency: number, duration: number, type: 'sine' | 'square' = 'sine') {
    if (!this.audioContext || this.isMuted) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.connect(gain)
    gain.connect(this.audioContext.destination)

    osc.type = type
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration)

    osc.start(this.audioContext.currentTime)
    osc.stop(this.audioContext.currentTime + duration)
  }

  playCall() {
    // Play call poker chips sound
    if (this.isMuted || !this.callSound) return
    this.callSound.currentTime = 0
    this.callSound.play().catch(() => {})
  }

  playBet() {
    // Play raise/all-in push chips sound
    if (this.isMuted || !this.raiseSound) return
    this.raiseSound.currentTime = 0
    this.raiseSound.play().catch(() => {})
  }

  playFold() {
    // Descending pitch - "fold" sound
    if (!this.audioContext || this.isMuted) return
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.connect(gain)
    gain.connect(this.audioContext.destination)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, this.audioContext.currentTime)
    osc.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.3)

    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3)

    osc.start(this.audioContext.currentTime)
    osc.stop(this.audioContext.currentTime + 0.3)
  }

  playCheck() {
    // Soft single beep - "check" sound
    this.play(440, 0.2, 'sine')
  }

  playWin() {
    // Victory fanfare
    if (!this.audioContext || this.isMuted) return
    const notes = [523.25, 659.25, 783.99] // C, E, G
    notes.forEach((freq, i) => {
      setTimeout(() => this.play(freq, 0.3, 'sine'), i * 150)
    })
  }

  toggleMute() {
    this.isMuted = !this.isMuted
    return this.isMuted
  }

  getMuteState() {
    return this.isMuted
  }
}

export const soundEffects = new SoundEffects()
