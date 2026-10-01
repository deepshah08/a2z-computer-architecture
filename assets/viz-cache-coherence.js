/* ==========================================================================
   Computer Architecture, Cycle by Cycle — Caches & Coherence
   ========================================================================== */

(function () {
  'use strict';

  /* --------------------------------------------------------------------------
   * 05. Cache Geometry & The 3 C's of Cache Misses
   * -------------------------------------------------------------------------- */
  OS.register('cacheMisses', function (host) {
    let missType = 'COMPULSORY'; // 'COMPULSORY', 'CAPACITY', 'CONFLICT'
    let associativity = '8_WAY'; // 'DIRECT_MAPPED', '8_WAY', 'FULLY_ASSOC'
    let missDesc = 'Compulsory (Cold) Miss: First time memory address is referenced. Cannot be avoided regardless of cache size!';

    let cv = null;
    function render() {
      if (cv && cv.redraw) cv.redraw();
    }

    const controls = OS.controls(host);
    OS.select(controls, 'Miss Category', [
      { value: 'COMPULSORY', label: 'Compulsory Miss (Cold start / First touch)' },
      { value: 'CONFLICT', label: 'Conflict Miss (Collisions in same Cache Set — Solved by Associativity)' },
      { value: 'CAPACITY', label: 'Capacity Miss (Working set exceeds total cache size)' }
    ], (val) => {
      missType = val;
      if (val === 'COMPULSORY') {
        missDesc = 'Cold Miss: First memory reference. Pre-fetching is the only technique that mitigates cold misses.';
      } else if (val === 'CONFLICT') {
        missDesc = 'Conflict Miss: Two active addresses map to the exact same cache set index! Increasing associativity eliminates conflict.';
      } else {
        missDesc = 'Capacity Miss: Working set (e.g. 64MB) exceeds cache capacity (32MB). Fully-associative cache still misses!';
      }
      render();
    });

    OS.select(controls, 'Cache Associativity', [
      { value: '8_WAY', label: '8-Way Set Associative (Modern L1/L2 standard)' },
      { value: 'DIRECT_MAPPED', label: 'Direct Mapped (1-Way — High conflict miss rate)' },
      { value: 'FULLY_ASSOC', label: 'Fully Associative (Zero conflict misses, high lookup power)' }
    ], (val) => {
      associativity = val;
      missDesc = `Associativity set to ${val}.`;
      render();
    });

    cv = OS.canvas(host, {
      height: 250,
      render: function (ctx, w, h) {
        ctx.clearRect(0, 0, w, h);

        ctx.font = OS.font(13, 'display', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`Cache Geometry: Tag / Set Index / Offset & The 3 C's of Cache Misses`, 16, 24);

        ctx.font = OS.font(11, 'mono', 400);
        ctx.fillStyle = missType === 'COMPULSORY' ? OS.C.accent : (missType === 'CONFLICT' ? OS.C.amber : OS.C.red);
        ctx.fillText(missDesc, 16, 46);

        // 64-bit address breakdown
        const barX = 16;
        const barY = 75;
        const barW = Math.min(480, w - 32);
        const barH = 36;

        // Tag bits (70% width)
        const wTag = barW * 0.65;
        ctx.fillStyle = OS.rgba(OS.C.accent, 0.15);
        ctx.fillRect(barX, barY, wTag, barH);
        ctx.fillStyle = OS.C.ink;
        ctx.font = OS.font(9, 'mono', 600);
        ctx.fillText('Tag Bits (Match verification)', barX + 8, barY + 22);

        // Set Index (20% width)
        const wSet = barW * 0.22;
        ctx.fillStyle = OS.rgba(OS.C.amber, 0.2);
        ctx.fillRect(barX + wTag, barY, wSet, barH);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText('Set Index (6-8b)', barX + wTag + 4, barY + 22);

        // Line Offset (10% width - 6 bits for 64 bytes)
        const wOff = barW - (wTag + wSet);
        ctx.fillStyle = OS.rgba(OS.C.teal, 0.2);
        ctx.fillRect(barX + wTag + wSet, barY, wOff, barH);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText('Offset (6b)', barX + wTag + wSet + 4, barY + 22);

        // Metrics card
        const cardY = barY + barH + 28;
        ctx.font = OS.font(10, 'mono', 500);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`Cache Line Size: 64 Bytes (2⁶ Offset Bits) | Configuration: ${associativity}`, 16, cardY);

        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('Hill & Smith 3Cs model: Compulsory (cold), Capacity (size limit), Conflict (mapping collisions).', 16, cardY + 20);
      }
    });
    render();
  });

  /* --------------------------------------------------------------------------
   * 06. The MESI Cache Coherence Protocol (M, E, S, I)
   * -------------------------------------------------------------------------- */
  OS.register('mesiCoherence', function (host) {
    let core1State = 'EXCLUSIVE'; // 'MODIFIED', 'EXCLUSIVE', 'SHARED', 'INVALID'
    let core2State = 'INVALID';
    let busEvent = 'Core 1 holds line exclusively (read/write without bus broadcast).';

    let cv = null;
    function render() {
      if (cv && cv.redraw) cv.redraw();
    }

    const controls = OS.controls(host);
    OS.button(controls, 'Core 2 Reads Line (BusRd)', () => {
      if (core1State === 'MODIFIED') {
        busEvent = 'FLUSH TO MEMORY: Core 1 was MODIFIED. Flushed dirty line to L3, transitioned to SHARED.';
      } else {
        busEvent = 'SNOOP HIT: Core 1 observed BusRd on ring bus. Both cores transition to SHARED (S).';
      }
      core1State = 'SHARED';
      core2State = 'SHARED';
      render();
    }, { primary: true });

    OS.button(controls, 'Core 1 Writes Line (BusRdX Invalidate)', () => {
      core1State = 'MODIFIED';
      core2State = 'INVALID';
      busEvent = 'BUSRDX BROADCAST: Core 1 acquired exclusive write ownership. Invalidation signal forced Core 2 to INVALID (I)!';
      render();
    });

    OS.button(controls, 'Reset Coherence State', () => {
      core1State = 'EXCLUSIVE';
      core2State = 'INVALID';
      busEvent = 'Coherence state reset.';
      render();
    });

    cv = OS.canvas(host, {
      height: 250,
      render: function (ctx, w, h) {
        ctx.clearRect(0, 0, w, h);

        ctx.font = OS.font(13, 'display', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`The MESI Cache Coherence Protocol: Modified, Exclusive, Shared, Invalid`, 16, 24);

        ctx.font = OS.font(11, 'mono', 400);
        ctx.fillStyle = core1State === 'MODIFIED' ? OS.C.amber : (core2State === 'INVALID' ? OS.C.green : OS.C.accent);
        ctx.fillText(busEvent, 16, 46);

        // Core 1 & Core 2 cards
        const cardW = Math.min(220, (w - 48) / 2);
        const cardH = 95;
        const startY = 75;

        // Core 1
        ctx.fillStyle = core1State === 'MODIFIED' ? OS.rgba(OS.C.amber, 0.15) : OS.rgba(OS.C.accent, 0.15);
        ctx.strokeStyle = core1State === 'MODIFIED' ? OS.C.amber : OS.C.accent;
        ctx.beginPath();
        ctx.roundRect(16, startY, cardW, cardH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = OS.C.ink;
        ctx.font = OS.font(11, 'mono', 700);
        ctx.fillText('CPU Core 0 L1 Cache', 26, startY + 22);
        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillText('Cache Line [Addr: 0x1000]', 26, startY + 44);
        ctx.font = OS.font(11, 'mono', 800);
        ctx.fillStyle = core1State === 'MODIFIED' ? OS.C.amber : OS.C.accent;
        ctx.fillText(`MESI State: [${core1State}]`, 26, startY + 68);

        // Core 2
        const x2 = 16 + cardW + 16;
        ctx.fillStyle = core2State === 'INVALID' ? OS.rgba(OS.C.red, 0.1) : OS.rgba(OS.C.teal, 0.15);
        ctx.strokeStyle = core2State === 'INVALID' ? OS.C.red : OS.C.teal;
        ctx.beginPath();
        ctx.roundRect(x2, startY, cardW, cardH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = OS.C.ink;
        ctx.font = OS.font(11, 'mono', 700);
        ctx.fillText('CPU Core 1 L1 Cache', x2 + 10, startY + 22);
        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillText('Cache Line [Addr: 0x1000]', x2 + 10, startY + 44);
        ctx.font = OS.font(11, 'mono', 800);
        ctx.fillStyle = core2State === 'INVALID' ? OS.C.red : OS.C.teal;
        ctx.fillText(`MESI State: [${core2State}]`, x2 + 10, startY + 68);

        // Footer
        ctx.font = OS.font(10, 'mono', 400);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('Interconnect: Intel Ring Bus / AMD Infinity Fabric handles snooping messages at ~12ns latency.', 16, h - 16);
      }
    });
    render();
  });

  /* --------------------------------------------------------------------------
   * 07. Multithreading Pitfall: False Sharing & Cache Line Thrashing
   * -------------------------------------------------------------------------- */
  OS.register('falseSharing', function (host) {
    let padded = false;
    let l1Bounces = 240;
    let scalingLoss = '82% Multi-Core Performance Degradation';
    let statusText = 'False Sharing: Thread 1 modifies varA, Thread 2 modifies varB. Because both reside on the SAME 64B cache line, cores thrash!';

    let cv = null;
    function render() {
      if (cv && cv.redraw) cv.redraw();
    }

    const controls = OS.controls(host);
    OS.button(controls, 'Align with 64-Byte Padding (alignas / @Contended)', () => {
      padded = true;
      l1Bounces = 0;
      scalingLoss = '0% (Near-Linear Multi-Core Speedup!)';
      statusText = '✓ FALSE SHARING ELIMINATED: Injected 64-byte padding between varA and varB. Each variable lives on its own private cache line!';
      render();
    }, { primary: true });

    OS.button(controls, 'Reset Unpadded Memory Layout', () => {
      padded = false;
      l1Bounces = 240;
      scalingLoss = '82% Multi-Core Performance Degradation';
      statusText = 'Reset to unpadded struct.';
      render();
    });

    cv = OS.canvas(host, {
      height: 250,
      render: function (ctx, w, h) {
        ctx.clearRect(0, 0, w, h);

        ctx.font = OS.font(13, 'display', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`Multithreading Concurrency Hazard: False Sharing & Cache Line Bouncing`, 16, 24);

        ctx.font = OS.font(11, 'mono', 400);
        ctx.fillStyle = padded ? OS.C.green : OS.C.red;
        ctx.fillText(statusText, 16, 46);

        // 64-Byte Cache Line Layout
        const barX = 16;
        const barY = 75;
        const barW = Math.min(480, w - 32);
        const barH = 40;

        if (!padded) {
          // Both in same 64B line
          ctx.fillStyle = OS.rgba(OS.C.red, 0.2);
          ctx.strokeStyle = OS.C.red;
          ctx.beginPath();
          ctx.roundRect(barX, barY, barW, barH, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = OS.C.ink;
          ctx.font = OS.font(10, 'mono', 700);
          ctx.fillText('Shared 64-Byte Cache Line (Offset 0..63)', barX + 8, barY + 16);
          ctx.fillStyle = OS.C.red;
          ctx.fillText('varA (Core 0 writes) | varB (Core 1 writes) ➔ CONTINUOUS PING-PONG INVALIDATIONS!', barX + 8, barY + 32);
        } else {
          // Padded: 2 separate 64B lines
          const halfW = (barW - 10) / 2;
          ctx.fillStyle = OS.rgba(OS.C.green, 0.15);
          ctx.strokeStyle = OS.C.green;
          ctx.beginPath();
          ctx.roundRect(barX, barY, halfW, barH, 4);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = OS.C.ink;
          ctx.font = OS.font(9, 'mono', 700);
          ctx.fillText('Cache Line 0: varA (Core 0)', barX + 6, barY + 24);

          ctx.fillStyle = OS.rgba(OS.C.green, 0.15);
          ctx.strokeStyle = OS.C.green;
          ctx.beginPath();
          ctx.roundRect(barX + halfW + 10, barY, halfW, barH, 4);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = OS.C.ink;
          ctx.fillText('Cache Line 1: varB (Core 1)', barX + halfW + 16, barY + 24);
        }

        // Summary footer
        const cardY = barY + barH + 28;
        ctx.font = OS.font(10, 'mono', 500);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`Inter-Core Invalidation Bounces: ${l1Bounces}/sec | Penalty: ${scalingLoss}`, 16, cardY);

        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('Java uses @jdk.internal.vm.annotation.Contended; C++ uses alignas(hardware_destructive_interference_size).', 16, cardY + 20);
      }
    });
    render();
  });

  /* --------------------------------------------------------------------------
   * 08. Store Buffers, Memory Fences & TSO Ordering
   * -------------------------------------------------------------------------- */
  OS.register('memoryOrdering', function (host) {
    let fenceUsed = false;
    let outcome = 'r1=0, r2=0 (Store-Load Reordering Violation!)';
    let statusText = 'x86 Total Store Order (TSO): CPU Store Buffers allow stores to be deferred. Reads can bypass prior uncommitted writes!';

    let cv = null;
    function render() {
      if (cv && cv.redraw) cv.redraw();
    }

    const controls = OS.controls(host);
    OS.button(controls, 'Insert MFENCE (Hardware Memory Barrier)', () => {
      fenceUsed = true;
      outcome = 'r1=1, r2=1 (Strict Sequential Consistency Guaranteed)';
      statusText = '✓ MFENCE DRAINED STORE BUFFER: Forced core to flush store buffer to L1 cache before executing subsequent read!';
      render();
    }, { primary: true });

    OS.button(controls, 'Execute Without Fence (Dekker Race)', () => {
      fenceUsed = false;
      outcome = 'r1=0, r2=0 (Store-Load Reordering Violation!)';
      statusText = 'DEKKER RACE VIOLATION: Both cores read 0 because writes were trapped in local Store Buffers!';
      render();
    });

    cv = OS.canvas(host, {
      height: 250,
      render: function (ctx, w, h) {
        ctx.clearRect(0, 0, w, h);

        ctx.font = OS.font(13, 'display', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`Memory Consistency Models: x86 TSO Store Buffers & MFENCE Barriers`, 16, 24);

        ctx.font = OS.font(11, 'mono', 400);
        ctx.fillStyle = fenceUsed ? OS.C.green : OS.C.red;
        ctx.fillText(statusText, 16, 46);

        // Core execution box
        const cardX = 16;
        const cardY = 75;
        const cardW = Math.min(480, w - 32);
        const cardH = 95;

        ctx.fillStyle = OS.rgba(OS.C.accent, 0.1);
        ctx.strokeStyle = OS.C.accent;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = OS.C.ink;
        ctx.font = OS.font(11, 'mono', 700);
        ctx.fillText(`Dekker's Algorithm Execution: Core 0 [X=1, read Y] vs Core 1 [Y=1, read X]`, cardX + 14, cardY + 24);

        ctx.font = OS.font(10, 'mono', 500);
        ctx.fillText(`• Hardware Fence: ${fenceUsed ? 'MFENCE / smp_mb() (Active)' : 'NONE (Raw Store Buffer Bypass)'}`, cardX + 14, cardY + 48);

        ctx.fillStyle = fenceUsed ? OS.C.green : OS.C.red;
        ctx.font = OS.font(11, 'mono', 700);
        ctx.fillText(`• Final Result: ${outcome}`, cardX + 14, cardY + 70);

        // Footer
        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('ARM / RISC-V use Weak Memory Ordering, where Load-Load and Store-Store reordering are also permitted.', 16, h - 16);
      }
    });
    render();
  });

})();
