/* ==========================================================================
   Computer Architecture, Cycle by Cycle — Pipelines & Microarchitecture
   ========================================================================== */

(function () {
  'use strict';

  /* --------------------------------------------------------------------------
   * 00. Hero: The Memory Hierarchy Latency Wall Arena
   * -------------------------------------------------------------------------- */
  OS.register('archHero', function (host) {
    let accessTier = 'L1_CACHE'; // 'L1_CACHE', 'L2_CACHE', 'L3_CACHE', 'DRAM', 'NVME'
    let latencyNs = 1.0;
    let cpuCycles = 4;
    let humanScaled = '1 second (Fast human blink)';
    let heroMsg = 'L1 Data Cache: 1.0 nanosecond (~4 CPU cycles). Blazing fast core-local SRAM.';

    function updateTier() {
      if (accessTier === 'L1_CACHE') {
        latencyNs = 1.0; cpuCycles = 4;
        humanScaled = '1 second (Instantaneous reaction)';
        heroMsg = 'L1 Data Cache: 1.0ns (~4 cycles, 32-48KB SRAM). Single-cycle core access.';
      } else if (accessTier === 'L2_CACHE') {
        latencyNs = 3.5; cpuCycles = 14;
        humanScaled = '3.5 seconds';
        heroMsg = 'L2 Unified Cache: 3.5ns (~14 cycles, 512KB-1MB SRAM per core). Fast private cache.';
      } else if (accessTier === 'L3_CACHE') {
        latencyNs = 12.0; cpuCycles = 48;
        humanScaled = '12 seconds';
        heroMsg = 'L3 Last-Level Cache (LLC): 12.0ns (~48 cycles, 16-64MB shared SRAM). Across on-die ring bus.';
      } else if (accessTier === 'DRAM') {
        latencyNs = 65.0; cpuCycles = 260;
        humanScaled = '1 minute 5 seconds (THE MEMORY WALL)';
        heroMsg = 'Main DRAM: 65.0ns (~260 CPU cycles!). CPU pipeline completely stalls waiting for capacitive row buffer!';
      } else {
        // NVMe
        latencyNs = 10000.0; cpuCycles = 40000;
        humanScaled = '2 hours 46 minutes (Drive across town)';
        heroMsg = 'NVMe Flash Storage: 10,000ns (40,000+ CPU cycles!). Requires kernel context switch / async polling.';
      }
      render();
    }

    let cv = null;
    function render() {
      if (cv && cv.redraw) cv.redraw();
    }

    const controls = OS.controls(host);
    OS.select(controls, 'Memory Subsystem Tier', [
      { value: 'L1_CACHE', label: 'L1 D-Cache (1.0 ns / 4 CPU Cycles)' },
      { value: 'L2_CACHE', label: 'L2 Cache (3.5 ns / 14 CPU Cycles)' },
      { value: 'L3_CACHE', label: 'L3 Shared LLC (12 ns / 48 CPU Cycles)' },
      { value: 'DRAM', label: 'Main Memory DRAM (65 ns / 260 CPU Cycles — The Memory Wall!)' },
      { value: 'NVME', label: 'NVMe Solid-State Flash (10,000 ns / 40,000 Cycles)' }
    ], (val) => {
      accessTier = val;
      updateTier();
    });

    OS.button(controls, 'Simulate DRAM Cache Miss Stall', () => {
      accessTier = 'DRAM';
      updateTier();
    }, { primary: true });

    cv = OS.canvas(host, {
      height: 260,
      render: function (ctx, w, h) {
        ctx.clearRect(0, 0, w, h);

        ctx.font = OS.font(13, 'display', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText('The Microarchitecture Latency Hierarchy: L1 ➔ L2 ➔ L3 ➔ DRAM ➔ NVMe', 16, 24);

        ctx.font = OS.font(11, 'mono', 400);
        ctx.fillStyle = latencyNs >= 60 ? OS.C.red : (latencyNs > 5 ? OS.C.amber : OS.C.green);
        ctx.fillText(heroMsg, 16, 46);

        // Latency Tiers Visualization
        const tiers = [
          { name: 'L1 Cache', ns: '1 ns', cyc: '4 cyc', id: 'L1_CACHE' },
          { name: 'L2 Cache', ns: '3.5 ns', cyc: '14 cyc', id: 'L2_CACHE' },
          { name: 'L3 LLC', ns: '12 ns', cyc: '48 cyc', id: 'L3_CACHE' },
          { name: 'Main DRAM', ns: '65 ns', cyc: '260 cyc', id: 'DRAM' },
          { name: 'NVMe Flash', ns: '10 us', cyc: '40k cyc', id: 'NVME' }
        ];

        const tW = Math.min(85, (w - 60) / tiers.length);
        const tH = 80;
        const startY = 75;

        tiers.forEach((t, idx) => {
          const tx = 16 + idx * (tW + 12);
          const isSelected = t.id === accessTier;

          ctx.fillStyle = isSelected ? (t.id === 'DRAM' || t.id === 'NVME' ? OS.rgba(OS.C.red, 0.2) : OS.rgba(OS.C.accent, 0.2)) : OS.rgba(OS.C.muted, 0.08);
          ctx.strokeStyle = isSelected ? (t.id === 'DRAM' || t.id === 'NVME' ? OS.C.red : OS.C.accent) : OS.C.border;
          ctx.lineWidth = isSelected ? 2 : 1;
          ctx.beginPath();
          ctx.roundRect(tx, startY, tW, tH, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = OS.C.ink;
          ctx.font = OS.font(10, 'mono', 700);
          ctx.fillText(t.name, tx + 6, startY + 22);

          ctx.font = OS.font(12, 'mono', 800);
          ctx.fillStyle = isSelected ? OS.C.ink : OS.C.muted;
          ctx.fillText(t.ns, tx + 6, startY + 46);

          ctx.font = OS.font(9, 'mono', 500);
          ctx.fillStyle = OS.C.muted;
          ctx.fillText(t.cyc, tx + 6, startY + 68);
        });

        // Human time scale card
        const cardY = startY + tH + 20;
        ctx.font = OS.font(11, 'mono', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`Normalized Human Scale (If 1 cycle = 1 sec): [${humanScaled}]`, 16, cardY + 16);

        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('A CPU executing instructions at 4 GHz wastes 260 pipeline cycles during every single DRAM cache miss.', 16, cardY + 36);
      }
    });
    updateTier();
  });

  /* --------------------------------------------------------------------------
   * 01. Classic 5-Stage RISC Pipeline & Hazards
   * -------------------------------------------------------------------------- */
  OS.register('pipelineHazards', function (host) {
    let forwardingEnabled = true;
    let cycles = 6;
    let stalls = 0;
    let statusText = 'RISC 5-Stage Pipeline (IF ➔ ID ➔ EX ➔ MEM ➔ WB): Data Forwarding passes ALU results straight from EX stage to next instruction!';

    let cv = null;
    function render() {
      if (cv && cv.redraw) cv.redraw();
    }

    const controls = OS.controls(host);
    OS.select(controls, 'Forwarding Configuration', [
      { value: 'FORWARDING_ON', label: 'Hardware Forwarding ON (Bypasses EX/MEM results directly to EX stage)' },
      { value: 'FORWARDING_OFF', label: 'Hardware Forwarding OFF (RAW Data Hazard forces 2-cycle NOP stall)' }
    ], (val) => {
      forwardingEnabled = val === 'FORWARDING_ON';
      if (forwardingEnabled) {
        stalls = 0;
        statusText = 'FORWARDING ACTIVE: ADD R1, R2, R3 passes R1 immediately to next SUB instruction. ZERO stalls!';
      } else {
        stalls = 2;
        statusText = 'RAW HAZARD (Read-After-Write): Pipeline must stall 2 cycles (NOP bubbles) until R1 written in WB stage!';
      }
      render();
    });

    OS.button(controls, 'Step Pipeline Clock Cycle', () => {
      cycles++;
      statusText = `CLOCK STEP: Cycled to Clock ${cycles}. Instructions advanced through pipeline stages.`;
      render();
    }, { primary: true });

    cv = OS.canvas(host, {
      height: 250,
      render: function (ctx, w, h) {
        ctx.clearRect(0, 0, w, h);

        ctx.font = OS.font(13, 'display', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`Classic 5-Stage RISC Pipeline: Data Forwarding vs Pipeline Stalls (NOP)`, 16, 24);

        ctx.font = OS.font(11, 'mono', 400);
        ctx.fillStyle = stalls > 0 ? OS.C.amber : OS.C.green;
        ctx.fillText(statusText, 16, 46);

        // 5 Stages
        const stages = [
          { name: '1. IF', sub: 'Fetch' },
          { name: '2. ID', sub: 'Decode' },
          { name: '3. EX', sub: 'Execute' },
          { name: '4. MEM', sub: 'Memory' },
          { name: '5. WB', sub: 'Writeback' }
        ];

        const sW = Math.min(85, (w - 60) / stages.length);
        const sH = 75;
        const startY = 75;

        stages.forEach((s, idx) => {
          const sx = 16 + idx * (sW + 12);

          ctx.fillStyle = idx === 2 ? OS.rgba(OS.C.accent, 0.2) : OS.rgba(OS.C.muted, 0.08);
          ctx.strokeStyle = idx === 2 ? OS.C.accent : OS.C.border;
          ctx.beginPath();
          ctx.roundRect(sx, startY, sW, sH, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = OS.C.ink;
          ctx.font = OS.font(11, 'mono', 700);
          ctx.fillText(s.name, sx + 8, startY + 22);

          ctx.font = OS.font(10, 'sans', 400);
          ctx.fillStyle = OS.C.muted;
          ctx.fillText(s.sub, sx + 8, startY + 45);

          if (idx < stages.length - 1) {
            ctx.strokeStyle = OS.C.muted;
            ctx.beginPath();
            ctx.moveTo(sx + sW, startY + sH / 2);
            ctx.lineTo(sx + sW + 12, startY + sH / 2);
            ctx.stroke();
          }
        });

        // Summary footer
        ctx.font = OS.font(10, 'mono', 400);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText(`Clock Cycles: ${cycles} | Stalls Injected: ${stalls} NOPs | Forwarding saves 2 cycles on every RAW dependency.`, 16, h - 16);
      }
    });
    render();
  });

  /* --------------------------------------------------------------------------
   * 02. Dynamic Branch Prediction: 2-Bit Saturating Counters & BTB
   * -------------------------------------------------------------------------- */
  OS.register('branchPredictor', function (host) {
    let fsmState = 3; // 0: Strongly Not Taken, 1: Weakly Not Taken, 2: Weakly Taken, 3: Strongly Taken
    const stateNames = ['00 (Strongly NOT Taken)', '01 (Weakly NOT Taken)', '10 (Weakly Taken)', '11 (Strongly Taken)'];
    let mispredictPenalty = 0;
    let statusText = '2-Bit Saturating Counter: Requires two consecutive mispredictions to flip prediction. Protects loops against exit slips!';

    let cv = null;
    function render() {
      if (cv && cv.redraw) cv.redraw();
    }

    const controls = OS.controls(host);
    OS.button(controls, 'Branch Actually TAKEN (Loop repeats)', () => {
      const predictedTaken = fsmState >= 2;
      fsmState = Math.min(3, fsmState + 1);
      if (predictedTaken) {
        mispredictPenalty = 0;
        statusText = '✓ CORRECT PREDICTION: Predicted TAKEN and branch was TAKEN! Zero pipeline flush.';
      } else {
        mispredictPenalty = 15;
        statusText = '❌ MISPREDICTION: Predicted NOT TAKEN but branch was TAKEN! 15-cycle pipeline flush!';
      }
      render();
    }, { primary: true });

    OS.button(controls, 'Branch Actually NOT TAKEN (Loop exits)', () => {
      const predictedTaken = fsmState >= 2;
      fsmState = Math.max(0, fsmState - 1);
      if (!predictedTaken) {
        mispredictPenalty = 0;
        statusText = '✓ CORRECT PREDICTION: Predicted NOT TAKEN and branch exited! Zero penalty.';
      } else {
        mispredictPenalty = 15;
        statusText = '❌ MISPREDICTION: Predicted TAKEN but loop exited! 15-cycle pipeline flush!';
      }
      render();
    });

    OS.button(controls, 'Reset Predictor FSM', () => {
      fsmState = 3;
      mispredictPenalty = 0;
      statusText = 'Predictor reset to Strongly Taken.';
      render();
    });

    cv = OS.canvas(host, {
      height: 250,
      render: function (ctx, w, h) {
        ctx.clearRect(0, 0, w, h);

        ctx.font = OS.font(13, 'display', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`Dynamic Branch Prediction: 2-Bit Saturating Counter FSM & BTB`, 16, 24);

        ctx.font = OS.font(11, 'mono', 400);
        ctx.fillStyle = mispredictPenalty > 0 ? OS.C.red : OS.C.green;
        ctx.fillText(statusText, 16, 46);

        // FSM State Card
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
        ctx.fillText(`Current FSM Counter: ${stateNames[fsmState]}`, cardX + 14, cardY + 24);

        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillText(`Predicted Decision for Next Branch: ${fsmState >= 2 ? 'TAKEN' : 'NOT TAKEN'}`, cardX + 14, cardY + 48);

        ctx.font = OS.font(10, 'mono', 600);
        ctx.fillStyle = mispredictPenalty > 0 ? OS.C.red : OS.C.green;
        ctx.fillText(`Pipeline Flush Penalty: ${mispredictPenalty} CPU Cycles`, cardX + 14, cardY + 70);

        // Footer
        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('Modern CPUs (Intel Golden Cove, AMD Zen 4) use neural / TAGE predictors achieving >96% accuracy.', 16, h - 16);
      }
    });
    render();
  });

  /* --------------------------------------------------------------------------
   * 03. Out-of-Order Execution (OoO): Tomasulo's Algorithm & ROB
   * -------------------------------------------------------------------------- */
  OS.register('tomasuloRob', function (host) {
    let instructions = [
      { id: 1, ins: 'LOAD R1, [Addr]', state: 'EXECUTING', rob: 1 },
      { id: 2, ins: 'ADD R2, R1, 5', state: 'WAITING (R1)', rob: 2 },
      { id: 3, ins: 'MUL R4, R5, R6', state: 'FINISHED (OoO)', rob: 3 }
    ];
    let logMsg = 'Tomasulo OoO: Instruction 3 (MUL) finishes out-of-order ahead of Instruction 2, but commits in-order via Reorder Buffer (ROB)!';

    let cv = null;
    function render() {
      if (cv && cv.redraw) cv.redraw();
    }

    const controls = OS.controls(host);
    OS.button(controls, 'Complete LOAD R1 from Cache', () => {
      instructions[0].state = 'FINISHED';
      instructions[1].state = 'EXECUTING';
      logMsg = 'COMMON DATA BUS (CDB): LOAD broadcasted R1 value! Reservation Station woke up ADD instruction.';
      render();
    }, { primary: true });

    OS.button(controls, 'Commit In-Order (Head of ROB)', () => {
      if (instructions[0].state === 'FINISHED') {
        logMsg = 'REORDER BUFFER COMMIT: Instruction 1 committed to architectural register file. Head advances.';
      } else {
        logMsg = 'IN-ORDER COMMIT BARRIER: Instruction 3 cannot commit before Instructions 1 and 2 (Preserves precise exceptions)!';
      }
      render();
    });

    OS.button(controls, 'Reset OoO State', () => {
      instructions[0].state = 'EXECUTING';
      instructions[1].state = 'WAITING (R1)';
      instructions[2].state = 'FINISHED (OoO)';
      logMsg = 'OoO state reset.';
      render();
    });

    cv = OS.canvas(host, {
      height: 250,
      render: function (ctx, w, h) {
        ctx.clearRect(0, 0, w, h);

        ctx.font = OS.font(13, 'display', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`Out-of-Order Execution: Reservation Stations & Reorder Buffer (ROB) In-Order Commit`, 16, 24);

        ctx.font = OS.font(11, 'mono', 400);
        ctx.fillStyle = OS.C.green;
        ctx.fillText(logMsg, 16, 46);

        // Draw 3 instructions in ROB
        const cardW = Math.min(145, (w - 60) / instructions.length);
        const cardH = 80;
        const startY = 75;

        instructions.forEach((ins, idx) => {
          const ix = 16 + idx * (cardW + 12);
          const isDone = ins.state.includes('FINISHED');

          ctx.fillStyle = isDone ? OS.rgba(OS.C.teal, 0.15) : (ins.state.includes('WAITING') ? OS.rgba(OS.C.amber, 0.15) : OS.rgba(OS.C.accent, 0.15));
          ctx.strokeStyle = isDone ? OS.C.teal : (ins.state.includes('WAITING') ? OS.C.amber : OS.C.accent);
          ctx.beginPath();
          ctx.roundRect(ix, startY, cardW, cardH, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = OS.C.ink;
          ctx.font = OS.font(10, 'mono', 700);
          ctx.fillText(`ROB #${ins.rob}: ${ins.ins}`, ix + 6, startY + 22);

          ctx.font = OS.font(9, 'mono', 600);
          ctx.fillStyle = isDone ? OS.C.teal : (ins.state.includes('WAITING') ? OS.C.amber : OS.C.accent);
          ctx.fillText(ins.state, ix + 6, startY + 45);

          ctx.font = OS.font(8, 'sans', 400);
          ctx.fillStyle = OS.C.muted;
          ctx.fillText(idx === 0 ? 'ROB Head' : (idx === 2 ? 'Out-of-Order' : 'Speculative'), ix + 6, startY + 65);
        });

        // Footer
        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('Register Renaming eliminates WAR (Write-After-Read) and WAW false name dependencies.', 16, h - 16);
      }
    });
    render();
  });

  /* --------------------------------------------------------------------------
   * 04. SIMD Vector Execution: SSE, AVX-512 & Vector Masking
   * -------------------------------------------------------------------------- */
  OS.register('simdVectorUnits', function (host) {
    let isa = 'AVX_512'; // 'SCALAR', 'AVX_2', 'AVX_512'
    let lanes = 16; // 16 x 32-bit float lanes
    let throughput = '16 FLOPs / Cycle';
    let statusText = 'AVX-512: 512-bit ZMM vector registers compute 16 single-precision floats simultaneously per clock cycle!';

    let cv = null;
    function render() {
      if (cv && cv.redraw) cv.redraw();
    }

    const controls = OS.controls(host);
    OS.select(controls, 'SIMD Vector Architecture', [
      { value: 'AVX_512', label: 'AVX-512 (512-bit ZMM registers — 16 parallel float lanes)' },
      { value: 'AVX_2', label: 'AVX2 (256-bit YMM registers — 8 parallel float lanes)' },
      { value: 'SCALAR', label: 'Scalar x86 (Standard 32-bit registers — 1 float per cycle)' }
    ], (val) => {
      isa = val;
      if (val === 'AVX_512') {
        lanes = 16; throughput = '16 FLOPs / Cycle (32 with FMA)';
        statusText = 'AVX-512: Supports opmask registers (k1-k7) for conditional branching without pipeline stalls!';
      } else if (val === 'AVX_2') {
        lanes = 8; throughput = '8 FLOPs / Cycle (16 with FMA)';
        statusText = 'AVX2: Universal 256-bit SIMD across modern Intel & AMD processors.';
      } else {
        lanes = 1; throughput = '1 FLOP / Cycle';
        statusText = 'Scalar: Processes 1 element per instruction. 16x slower than AVX-512!';
      }
      render();
    });

    OS.button(controls, 'Execute Vector Fused Multiply-Add (FMA)', () => {
      statusText = `FMA EXECUTED: a * b + c computed across all ${lanes} vector lanes in a single clock cycle!`;
      render();
    }, { primary: true });

    cv = OS.canvas(host, {
      height: 250,
      render: function (ctx, w, h) {
        ctx.clearRect(0, 0, w, h);

        ctx.font = OS.font(13, 'display', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`SIMD Vector Acceleration: Scalar vs AVX2 (256b) vs AVX-512 (512b)`, 16, 24);

        ctx.font = OS.font(11, 'mono', 400);
        ctx.fillStyle = lanes > 1 ? OS.C.green : OS.C.amber;
        ctx.fillText(statusText, 16, 46);

        // Draw Vector Register Lanes
        const startX = 16;
        const startY = 75;
        const totalW = Math.min(480, w - 32);
        const laneW = (totalW - (lanes - 1) * 3) / lanes;
        const laneH = 45;

        for (let i = 0; i < lanes; i++) {
          const lx = startX + i * (laneW + 3);

          ctx.fillStyle = OS.rgba(OS.C.accent, 0.2);
          ctx.strokeStyle = OS.C.accent;
          ctx.beginPath();
          ctx.roundRect(lx, startY, laneW, laneH, 3);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = OS.C.ink;
          ctx.font = OS.font(8, 'mono', 600);
          ctx.fillText(`L${i}`, lx + 2, startY + 26);
        }

        // Summary Card
        const cardY = startY + laneH + 20;
        ctx.font = OS.font(11, 'mono', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`Active Register: ${isa === 'AVX_512' ? 'ZMM0 (512 bits)' : (isa === 'AVX_2' ? 'YMM0 (256 bits)' : 'XMM0 (32 bits)')} | Throughput: ${throughput}`, 16, cardY + 16);

        ctx.font = OS.font(10, 'sans', 400);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('AVX-512 vector masking eliminates branch misprediction penalties by executing both paths with bitmasks.', 16, cardY + 36);
      }
    });
    render();
  });

})();
