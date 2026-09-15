// The USB console of a KUSH SMART board, over Web Serial (Chrome / Edge desktop).
//
// The firmware reads newline-terminated lines at 115200: a command word ("info")
// or any app JSON command, which it runs with config rights — USB is physically
// trusted. It answers on the same line-based stream, interleaved with its own
// log output, so replies are picked out as the next JSON line that fits.
//
// Two limits in the firmware shape how this writes:
//  - a line may be at most 1200 bytes (longer ones are cut), and
//  - the UART receive buffer is small, so bytes are paced in short chunks
//    instead of arriving faster than the loop drains them.

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const MAX_LINE_BYTES = 1100;

export const serialSupported = () => typeof navigator !== 'undefined' && 'serial' in navigator;

export async function openBoard() {
  const port = await navigator.serial.requestPort();
  await port.open({ baudRate: 115200, bufferSize: 65536 });
  // The usual USB bridges wire DTR/RTS to reset and boot-mode; release both so
  // the board runs normally instead of sitting in reset or the ROM loader.
  try { await port.setSignals({ dataTerminalReady: false, requestToSend: false }); } catch (_) { /* not all drivers */ }

  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const reader = port.readable.getReader();
  const writer = port.writable.getWriter();
  const lines = [];
  let partial = '';
  let alive = true;

  const pump = (async () => {
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        partial += dec.decode(value, { stream: true });
        const parts = partial.split(/\r\n|\n|\r/);
        partial = parts.pop();
        for (const p of parts) if (p.trim()) lines.push(p.trim());
        if (partial.length > 200000) partial = '';
      }
    } catch (_) { /* unplugged, or closed by us */ }
    alive = false;
  })();

  // The first JSON line from `from` on that satisfies `pred`, or null after `ms`.
  async function nextJson(from, pred, ms) {
    const until = Date.now() + ms;
    let i = from;
    while (Date.now() < until && alive) {
      for (; i < lines.length; i++) {
        if (lines[i][0] !== '{') continue;
        try {
          const j = JSON.parse(lines[i]);
          if (!pred || pred(j)) return j;
        } catch (_) { /* a log line that happens to start with { */ }
      }
      await sleep(80);
    }
    return null;
  }

  async function send(text) {
    const bytes = enc.encode(`${text}\n`);
    for (let o = 0; o < bytes.length; o += 48) {
      await writer.write(bytes.subarray(o, o + 48));
      await sleep(15);
    }
  }

  return {
    get connected() { return alive; },
    /** Send `cmd` until a reply satisfying `pred` comes back (the board may still be booting). */
    async request(cmd, pred, { tries = 8, every = 900 } = {}) {
      for (let k = 0; k < tries && alive; k++) {
        const from = lines.length;
        await send(cmd);
        const j = await nextJson(from, pred, every);
        if (j) return j;
      }
      return null;
    },
    /** Send one JSON command line and return the board's JSON reply (or null). */
    async command(line, ms = 4000) {
      const from = lines.length;
      await send(line);
      return nextJson(from, null, ms);
    },
    async close() {
      alive = false;
      try { await reader.cancel(); } catch (_) { /* already closed */ }
      try { reader.releaseLock(); } catch (_) { /* released */ }
      try { writer.releaseLock(); } catch (_) { /* released */ }
      try { await port.close(); } catch (_) { /* already closed */ }
      await pump;
    },
  };
}

export const utf8Bytes = (s) => new TextEncoder().encode(s).length;
