let audioUnlocked = false

/** Einmalig nach Nutzerklick aufrufen (Browser erlauben Ton). */
export function unlockOrderAudio() {
  audioUnlocked = true
}

export function playOrderBeep() {
  if (!audioUnlocked) return
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.value = 0.12
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    window.setTimeout(() => {
      osc.stop()
      void ctx.close()
    }, 160)
  } catch {
    /* ignore */
  }
}
