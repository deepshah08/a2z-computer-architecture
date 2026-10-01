/* ==========================================================================
   Computer Architecture, Cycle by Cycle — NUMA, Memory & Hardware Security
   ========================================================================== */

(function () {
  'use strict';

  /* --------------------------------------------------------------------------
   * 09. DRAM Physics: Banks, Row Buffers & CAS Latency Timings
   * -------------------------------------------------------------------------- */
  OS.register('dramTiming', function (host) {
    let accessType = 'ROW_HIT'; // 'ROW_HIT' vs 'ROW_MISS'
    let latencyNs = 14.0;
    let timingLog = 'Row Buffer Hit: Open page in sense amplifiers. Requires only tCL (CAS Latency ~14ns)!';

    let cv = null;
    function render() {
      if (cv && cv.redraw) cv.redraw();
    }

    const controls = OS.controls(host);
    OS.select(controls, 'DRAM Access Pattern', [
      { value: 'ROW_HIT', label: 'Row Buffer HIT (Sequential array read — Row already active in sense amps)' },
      { value: 'ROW_MISS', label: 'Row Buffer MISS / Conflict (Requires Precharge tRP + Activate tRCD + Read tCL)' }
    ], (val) => {
      accessType = val;
      if (val === 'ROW_HIT') {
        latencyNs = 14.0;
        timingLog = 'ROW HIT: Fast column access. Sense amplifier already holds 8KB open page. Latency = tCL (~14ns).';
      } else {
        latencyNs = 52.0;
        timingLog = 'ROW CONFLICT: Must close current page (tRP ~14ns), activate new row (tRCD ~14ns), and read column (tCL ~14ns). Total = 52ns!';
      }
      render();
    });

    OS.button(controls, 'Simulate Random DRAM Read', () => {
      accessType = 'ROW_MISS';
      latencyNs = 52.0;
      timingLog = 'RANDOM ACCESS: Jumped to different bank row! Triggered expensive precharge & activate cycle.';
      render();
    }, { primary: true });

    cv = OS.canvas(host, {
      height: 250,
      render: function (ctx, w, h) {
        ctx.clearRect(0, 0, w, h);

        ctx.font = OS.font(13, 'display', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`DRAM Microarchitecture Timing: tCL (CAS) + tRCD (RAS-to-CAS) + tRP (Precharge)`, 16, 24);

        ctx.font = OS.font(11, 'mono', 400);
        ctx.fillStyle = latencyNs > 20 ? OS.C.red : OS.C.green;
        ctx.fillText(timingLog, 16, 46);

        // Stages breakdown
        const steps = [
          { name: '1. Precharge (tRP)', desc: accessType === 'ROW_HIT' ? 'BYPASSED (0ns)' : 'Close row (14ns)' },
          { name: '2. Activate (tRCD)', desc: accessType === 'ROW_HIT' ? 'BYPASSED (0ns)' : 'Charge row (14ns)' },
          { name: '3. Column Read (tCL)', desc: 'Sense read (14ns)' }
        ];

        const sW = Math.min(145, (w - 60) / steps.length);
        const sH = 75;
        const startY = 75;

        steps.forEach((s, idx) => {
          const sx = 16 + idx * (sW + 12);

          ctx.fillStyle = s.desc.includes('BYPASSED') ? OS.rgba(OS.C.green, 0.15) : OS.rgba(OS.C.accent, 0.15);
          ctx.strokeStyle = s.desc.includes('BYPASSED') ? OS.C.green : OS.C.accent;
          ctx.beginPath();
          ctx.roundRect(sx, startY, sW, sH, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = OS.C.ink;
          ctx.font = OS.font(11, 'mono', 700);
          ctx.fillText(s.name, sx + 8, startY + 22);

          ctx.font = OS.font(10, 'sans', 400);
          ctx.fillStyle = s.desc.includes('BYPASSED') ? OS.C.green : OS.C.accent;
          ctx.fillText(s.desc, sx + 8, startY + 48);
        });

        // Summary footer
        ctx.font = OS.font(10, 'mono', 400);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText(`Total Memory Controller Latency: ${latencyNs} ns | Sequential access maximizes Row Buffer Hit rates.`, 16, h - 16);
      }
    });
    render();
  });

  /* --------------------------------------------------------------------------
   * 10. Non-Uniform Memory Access (NUMA): Socket Interconnects
   * -------------------------------------------------------------------------- */
  OS.register('numaLatencyMap', function (host) {
    let accessLoc = 'LOCAL'; // 'LOCAL' vs 'REMOTE'
    let latencyNs = 65;
    let bandwidthGbps = 120;
    let logMsg = 'Local NUMA Node: CPU core accesses DDR5 DRAM directly attached to local socket memory controller (~65ns).';

    let cv = null;
    function render() {
      if (cv && cv.redraw) cv.redraw();
    }

    const controls = OS.controls(host);
    OS.select(controls, 'NUMA Placement', [
      { value: 'LOCAL', label: 'Local Memory Access (CPU Node 0 ➔ Local DRAM Node 0)' },
      { value: 'REMOTE', label: 'Remote NUMA Interconnect Hop (CPU Node 0 ➔ UPI ➔ DRAM Node 1)' }
    ], (val) => {
      accessLoc = val;
      if (val === 'LOCAL') {
        latencyNs = 65; bandwidthGbps = 120;
        logMsg = 'LOCAL ACCESS: Directly attached memory channel. Sub-70ns latency, full bus bandwidth.';
      } else {
        latencyNs = 135; bandwidthGbps = 45;
        logMsg = 'REMOTE NUMA PENALTY: Traverses Intel UPI / AMD Infinity Fabric interconnect! 2x latency, 60% bandwidth drop!';
      }
      render();
    });

    OS.button(controls, 'Pin Process with numactl --membind', () => {
      accessLoc = 'LOCAL';
      latencyNs = 65; bandwidthGbps = 120;
      logMsg = '✓ PINNED VIA NUMACTL: Thread bound to NUMA Node 0 memory allocation. Remote hops eliminated.';
      render();
    }, { primary: true });

    cv = OS.canvas(host, {
      height: 250,
      render: function (ctx, w, h) {
        ctx.clearRect(0, 0, w, h);

        ctx.font = OS.font(13, 'display', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`Dual-Socket NUMA Topology: Local Memory Controller vs UPI Interconnect Hops`, 16, 24);

        ctx.font = OS.font(11, 'mono', 400);
        ctx.fillStyle = accessLoc === 'REMOTE' ? OS.C.red : OS.C.green;
        ctx.fillText(logMsg, 16, 46);

        // Socket 0 & Socket 1 cards
        const cardW = Math.min(220, (w - 48) / 2);
        const cardH = 95;
        const startY = 75;

        // Socket 0
        ctx.fillStyle = OS.rgba(OS.C.accent, 0.15);
        ctx.strokeStyle = OS.C.accent;
        ctx.beginPath();
        ctx.roundRect(16, startY, cardW, cardH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = OS.C.ink;
        ctx.font = OS.font(11, 'mono', 700);
        ctx.fillText('NUMA Node 0 (Socket 0)', 26, startY + 22);
        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillText('• 32 Cores / 64 Threads', 26, startY + 44);
        ctx.fillText('• 128 GB DDR5 Memory Channel', 26, startY + 65);

        // Socket 1
        const x2 = 16 + cardW + 16;
        ctx.fillStyle = accessLoc === 'REMOTE' ? OS.rgba(OS.C.red, 0.15) : OS.rgba(OS.C.muted, 0.08);
        ctx.strokeStyle = accessLoc === 'REMOTE' ? OS.C.red : OS.C.border;
        ctx.beginPath();
        ctx.roundRect(x2, startY, cardW, cardH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = OS.C.ink;
        ctx.font = OS.font(11, 'mono', 700);
        ctx.fillText('NUMA Node 1 (Socket 1)', x2 + 10, startY + 22);
        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillText('• 32 Cores / 64 Threads', x2 + 10, startY + 44);
        ctx.fillText('• 128 GB DDR5 Memory Channel', x2 + 10, startY + 65);

        // Footer
        ctx.font = OS.font(10, 'mono', 400);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText(`Latency: ${latencyNs} ns | Bandwidth: ${bandwidthGbps} GB/s | Linux automatic balancing: numad / sysctl vm.zone_reclaim_mode`, 16, h - 16);
      }
    });
    render();
  });

  /* --------------------------------------------------------------------------
   * 11. The Roofline Model: Arithmetic Intensity & The Memory Wall
   * -------------------------------------------------------------------------- */
  OS.register('rooflineModel', function (host) {
    let intensity = 1.0; // FLOPs per Byte
    let peakGflops = 1200; // Peak compute ceiling
    let memBandwidthGb = 150; // Peak memory bandwidth
    let operationalState = 'MEMORY_BOUND';

    function calcPerformance() {
      const memCeiling = intensity * memBandwidthGb;
      if (memCeiling < peakGflops) {
        operationalState = 'MEMORY_BOUND';
      } else {
        operationalState = 'COMPUTE_BOUND';
      }
      render();
    }

    let cv = null;
    function render() {
      if (cv && cv.redraw) cv.redraw();
    }

    const controls = OS.controls(host);
    OS.slider(controls, {
      label: 'Operational Arithmetic Intensity (FLOPs / Byte)',
      min: 0.1,
      max: 16.0,
      step: 0.5,
      value: intensity,
      onChange: (v) => { intensity = parseFloat(v); calcPerformance(); }
    });

    OS.button(controls, 'Matrix Multiplication (GEMM — 12.0 FLOPs/Byte)', () => {
      intensity = 12.0;
      calcPerformance();
    }, { primary: true });

    OS.button(controls, 'Vector Addition / SpMV (0.25 FLOPs/Byte)', () => {
      intensity = 0.25;
      calcPerformance();
    });

    cv = OS.canvas(host, {
      height: 250,
      render: function (ctx, w, h) {
        ctx.clearRect(0, 0, w, h);

        ctx.font = OS.font(13, 'display', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`Williams & Patterson Roofline Model: Arithmetic Intensity vs Hardware Ceilings`, 16, 24);

        const curGflops = Math.min(peakGflops, intensity * memBandwidthGb);
        ctx.font = OS.font(11, 'mono', 400);
        ctx.fillStyle = operationalState === 'COMPUTE_BOUND' ? OS.C.green : OS.C.amber;
        ctx.fillText(`Intensity = ${intensity.toFixed(2)} FLOP/Byte | Attained: ${Math.round(curGflops)} GFLOPs/s | Regime: [${operationalState}]`, 16, 46);

        // Roofline plot
        const plotX = 30;
        const plotY = 70;
        const plotW = Math.min(450, w - 60);
        const plotH = 120;

        ctx.strokeStyle = OS.C.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(plotX, plotY);
        ctx.lineTo(plotX, plotY + plotH);
        ctx.lineTo(plotX + plotW, plotY + plotH);
        ctx.stroke();

        // Compute Ceiling (Horizontal Line)
        const peakY = plotY + 15;
        ctx.strokeStyle = OS.C.green;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(plotX + 160, peakY);
        ctx.lineTo(plotX + plotW, peakY);
        ctx.stroke();

        // Memory Bandwidth Ceiling (Slanted Line)
        ctx.strokeStyle = OS.C.amber;
        ctx.beginPath();
        ctx.moveTo(plotX, plotY + plotH);
        ctx.lineTo(plotX + 160, peakY);
        ctx.stroke();

        // Active point
        const ptX = plotX + Math.min(plotW - 20, (intensity / 16) * plotW);
        const ptY = plotY + plotH - (curGflops / peakGflops) * (plotH - 15);

        ctx.fillStyle = OS.C.red;
        ctx.beginPath();
        ctx.arc(ptX, ptY, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText(operationalState === 'MEMORY_BOUND' 
          ? 'Memory-Bound: Throttled by DRAM bus bandwidth. Optimizing ALU instructions has ZERO effect!' 
          : 'Compute-Bound: Saturating execution units. SIMD vectorization and FMA will maximize speed.', 16, h - 16);
      }
    });
    calcPerformance();
  });

  /* --------------------------------------------------------------------------
   * 12. Hardware Prefetching: Stream & Stride Prefetchers
   * -------------------------------------------------------------------------- */
  OS.register('prefetcherDynamics', function (host) {
    let mode = 'STRIDED_PREFETCH'; // 'RANDOM', 'STRIDED_PREFETCH'
    let hits = 18;
    let prefetchedLines = 4;
    let logMsg = 'Hardware Stride Prefetcher: Detects regular address stride (e.g. +64 bytes). Loads cache line before instructions request it!';

    let cv = null;
    function render() {
      if (cv && cv.redraw) cv.redraw();
    }

    const controls = OS.controls(host);
    OS.select(controls, 'Access Traversal', [
      { value: 'STRIDED_PREFETCH', label: 'Sequential Array Iteration (Stride +64B — Prefetcher Active)' },
      { value: 'RANDOM', label: 'Pointer-Chasing Linked List (Random — Prefetcher Fails / Pollutes)' }
    ], (val) => {
      mode = val;
      if (val === 'STRIDED_PREFETCH') {
        hits = 42; prefetchedLines = 8;
        logMsg = 'STREAM PREFETCH HIT: CPU pre-loaded upcoming array lines into L2/L1 cache. Zero DRAM wait!';
      } else {
        hits = 2; prefetchedLines = 0;
        logMsg = 'POINTER CHASING MISS: Hardware prefetcher cannot predict random pointers! Severe cache pollution and stalls.';
      }
      render();
    });

    OS.button(controls, 'Step Memory Loop', () => {
      render();
    }, { primary: true });

    cv = OS.canvas(host, {
      height: 250,
      render: function (ctx, w, h) {
        ctx.clearRect(0, 0, w, h);

        ctx.font = OS.font(13, 'display', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`Hardware Prefetching Mechanics: Stream & Stride Detectors`, 16, 24);

        ctx.font = OS.font(11, 'mono', 400);
        ctx.fillStyle = mode === 'STRIDED_PREFETCH' ? OS.C.green : OS.C.red;
        ctx.fillText(logMsg, 16, 46);

        // Prefetch buffer visual
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
        ctx.fillText(`Prefetch Unit State (${mode})`, cardX + 14, cardY + 24);

        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillText(`• Prefetched Lines in L2: ${prefetchedLines} lines (512 Bytes loaded ahead)`, cardX + 14, cardY + 48);
        ctx.fillStyle = mode === 'STRIDED_PREFETCH' ? OS.C.green : OS.C.red;
        ctx.fillText(`• Hit Rate: ${hits > 20 ? '95% (Near-Zero Stall Time)' : '15% (Full DRAM Penalty)'}`, cardX + 14, cardY + 70);

        // Footer
        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('Reason to prefer contiguous flat arrays (vectors) over linked nodes: Hardware prefetch compatibility.', 16, h - 16);
      }
    });
    render();
  });

  /* --------------------------------------------------------------------------
   * 13. Hardware Security: Spectre Variant 1 & Transient Execution
   * -------------------------------------------------------------------------- */
  OS.register('spectreExploit', function (host) {
    let speculativeLeak = false;
    let leakedByte = null;
    let statusMsg = 'Spectre Variant 1 (Bounds Check Bypass): Speculative execution ignores "if (x < size)" bounds check during branch prediction!';

    let cv = null;
    function render() {
      if (cv && cv.redraw) cv.redraw();
    }

    const controls = OS.controls(host);
    OS.button(controls, 'Train Branch Predictor (x < size = TRUE)', () => {
      speculativeLeak = false;
      statusMsg = 'PREDICTOR TRAINED: Executed 100 valid reads. Branch predictor strongly expects boundary check to pass.';
      render();
    }, { primary: true });

    OS.button(controls, 'Inject Out-Of-Bounds Malicious Offset', () => {
      speculativeLeak = true;
      leakedByte = '0x42 ("B")';
      statusMsg = '⚡ TRANSIENT LEAK: CPU speculatively executed array[secret] before branch check completed! Secret loaded into L1 cache!';
      render();
    });

    OS.button(controls, 'Insert LFENCE (Speculation Barrier)', () => {
      speculativeLeak = false;
      leakedByte = null;
      statusMsg = '✓ SPECULATION BLOCKED: LFENCE serialized CPU execution. Prevented out-of-bounds speculative load.';
      render();
    });

    cv = OS.canvas(host, {
      height: 250,
      render: function (ctx, w, h) {
        ctx.clearRect(0, 0, w, h);

        ctx.font = OS.font(13, 'display', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`Hardware Security: Spectre Variant 1 (CVE-2017-5753) Transient Side-Channel`, 16, 24);

        ctx.font = OS.font(11, 'mono', 400);
        ctx.fillStyle = speculativeLeak ? OS.C.red : OS.C.green;
        ctx.fillText(statusMsg, 16, 46);

        // Security card
        const cardX = 16;
        const cardY = 75;
        const cardW = Math.min(480, w - 32);
        const cardH = 95;

        ctx.fillStyle = speculativeLeak ? OS.rgba(OS.C.red, 0.15) : OS.rgba(OS.C.accent, 0.1);
        ctx.strokeStyle = speculativeLeak ? OS.C.red : OS.C.accent;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = OS.C.ink;
        ctx.font = OS.font(11, 'mono', 700);
        ctx.fillText('Microarchitectural Side-Channel State', cardX + 14, cardY + 24);

        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillText('Pattern: if (x < array1_size) { y = array2[array1[x] * 512]; }', cardX + 14, cardY + 48);

        ctx.font = OS.font(10, 'mono', 600);
        ctx.fillStyle = speculativeLeak ? OS.C.red : OS.C.green;
        ctx.fillText(`Cache Timing State: ${speculativeLeak ? `L1 Cache Line #66 Warm! Leaked Secret: ${leakedByte}` : 'Clean (No Timing Channel)'}`, cardX + 14, cardY + 70);

        // Footer
        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('Remediation: Compilers inject LFENCE or use conditional move (CMOV) instructions to defeat transient leak.', 16, h - 16);
      }
    });
    render();
  });

  /* --------------------------------------------------------------------------
   * 14. Hardware MMU & HugePages: 4KB vs 2MB / 1GB TLB Reach
   * -------------------------------------------------------------------------- */
  OS.register('mmuHugepages', function (host) {
    let pageSize = '4KB'; // '4KB', '2MB', '1GB'
    let tlbEntries = 64; // L1 D-TLB entries
    let tlbReachMb = 0.25; // 64 * 4KB = 256KB
    let statusText = 'Standard 4KB Pages: 64 TLB entries cover only 256KB of RAM! High-memory databases thrash the TLB.';

    let cv = null;
    function render() {
      if (cv && cv.redraw) cv.redraw();
    }

    const controls = OS.controls(host);
    OS.select(controls, 'Virtual Page Size', [
      { value: '4KB', label: 'Standard 4KB Pages (TLB Reach: 256 KB)' },
      { value: '2MB', label: '2MB HugePages (TLB Reach: 128 MB — 500x expansion!)' },
      { value: '1GB', label: '1GB Gigantic Pages (TLB Reach: 64 GB — Zero Page Walks!)' }
    ], (val) => {
      pageSize = val;
      if (val === '4KB') {
        tlbReachMb = 0.25;
        statusText = '4KB Pages: 4-level page table walks frequent. 20-30% CPU cycles lost to TLB miss walks in databases!';
      } else if (val === '2MB') {
        tlbReachMb = 128;
        statusText = '2MB HugePages: Bypasses PT (Page Table) level. TLB coverage expands to 128MB. Massive database speedup!';
      } else {
        tlbReachMb = 65536;
        statusText = '1GB HugePages: Bypasses PD and PT levels. Single TLB entry maps entire gigabytes of continuous physical RAM.';
      }
      render();
    });

    OS.button(controls, 'Calculate TLB Reach', () => {
      render();
    }, { primary: true });

    cv = OS.canvas(host, {
      height: 250,
      render: function (ctx, w, h) {
        ctx.clearRect(0, 0, w, h);

        ctx.font = OS.font(13, 'display', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`Hardware MMU: TLB Reach Scaling (4KB ➔ 2MB HugePages ➔ 1GB Pages)`, 16, 24);

        ctx.font = OS.font(11, 'mono', 400);
        ctx.fillStyle = pageSize === '4KB' ? OS.C.amber : OS.C.green;
        ctx.fillText(statusText, 16, 46);

        // Coverage bar
        const barX = 16;
        const barY = 75;
        const barW = Math.min(480, w - 32);
        const barH = 36;

        ctx.fillStyle = OS.rgba(OS.C.accent, 0.1);
        ctx.strokeStyle = OS.C.accent;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = OS.C.ink;
        ctx.font = OS.font(11, 'mono', 700);
        ctx.fillText(`L1 D-TLB Reach: ${tlbReachMb >= 1024 ? (tlbReachMb / 1024) + ' GB' : (tlbReachMb >= 1 ? tlbReachMb + ' MB' : (tlbReachMb * 1024) + ' KB')}`, barX + 14, barY + 22);

        // Card summary
        const cardY = barY + barH + 28;
        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('Linux Transparent Huge Pages (THP) / Static HugeTLBfs (/dev/hugepages) critical for JVM & storage engines.', 16, cardY);
      }
    });
    render();
  });

  /* --------------------------------------------------------------------------
   * 15. Energy-Efficient Computing: DVFS, P-States & C-States
   * -------------------------------------------------------------------------- */
  OS.register('dvfsPowerStates', function (host) {
    let pState = 'P0'; // 'P0' (Max freq), 'P1', 'P2'
    let cState = 'C0'; // 'C0' (Active), 'C6' (Deep Sleep)
    let clockGhz = 4.2;
    let powerWatts = 95;
    let statusText = 'P-States (Performance): Dynamic Voltage and Frequency Scaling (DVFS). P0 delivers max clock at highest power.';

    let cv = null;
    function render() {
      if (cv && cv.redraw) cv.redraw();
    }

    const controls = OS.controls(host);
    OS.select(controls, 'Processor Performance State', [
      { value: 'P0', label: 'P0 (Turbo Boost: 4.2 GHz @ 1.25V — Max compute / 95W)' },
      { value: 'P1', label: 'P1 (Nominal: 2.8 GHz @ 1.05V — Balanced / 45W)' },
      { value: 'P2', label: 'P2 (Low Power: 1.6 GHz @ 0.85V — Energy saver / 18W)' }
    ], (val) => {
      pState = val;
      if (val === 'P0') { clockGhz = 4.2; powerWatts = 95; }
      else if (val === 'P1') { clockGhz = 2.8; powerWatts = 45; }
      else { clockGhz = 1.6; powerWatts = 18; }
      statusText = `DVFS: Adjusted clock frequency to ${clockGhz} GHz (${powerWatts}W TDP). P = C · V² · f formula!`;
      render();
    });

    OS.button(controls, 'Core Enters C6 Deep Sleep (Core Power-Gate)', () => {
      cState = 'C6';
      powerWatts = 2;
      statusText = 'C6 STATE: Core halted, L1/L2 caches flushed, voltage dropped to 0V. Wakes in ~40 microseconds.';
      render();
    }, { primary: true });

    OS.button(controls, 'Wake Core to C0 Active', () => {
      cState = 'C0';
      powerWatts = pState === 'P0' ? 95 : (pState === 'P1' ? 45 : 18);
      statusText = 'C0 STATE: Core energized and executing instructions.';
      render();
    });

    cv = OS.canvas(host, {
      height: 250,
      render: function (ctx, w, h) {
        ctx.clearRect(0, 0, w, h);

        ctx.font = OS.font(13, 'display', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`Power Architecture: DVFS Dynamic Scaling & C-State Sleep Latency`, 16, 24);

        ctx.font = OS.font(11, 'mono', 400);
        ctx.fillStyle = cState === 'C6' ? OS.C.accent : OS.C.green;
        ctx.fillText(statusText, 16, 46);

        // Power gauge
        const barX = 16;
        const barY = 75;
        const barW = Math.min(480, w - 32);
        const barH = 36;

        ctx.fillStyle = OS.rgba(OS.C.muted, 0.1);
        ctx.strokeStyle = OS.C.border;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, 4);
        ctx.fill();
        ctx.stroke();

        const pW = (powerWatts / 95) * barW;
        ctx.fillStyle = powerWatts > 70 ? OS.C.red : (powerWatts > 30 ? OS.C.amber : OS.C.green);
        ctx.fillRect(barX, barY, pW, barH);

        ctx.fillStyle = OS.C.ink;
        ctx.font = OS.font(10, 'mono', 600);
        ctx.fillText(`Clock: ${clockGhz} GHz | Power: ${powerWatts}W | State: [${pState} / ${cState}]`, barX + 8, barY + 22);

        // Card summary
        const cardY = barY + barH + 28;
        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('Dynamic Power Law: Power = Capacitance × Voltage² × Frequency. Lowering voltage has quadratic savings.', 16, cardY);
      }
    });
    render();
  });

})();
