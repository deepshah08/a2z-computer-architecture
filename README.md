# Computer Architecture & Microarchitecture, Cycle by Cycle

> An interactive, visual field guide to CPU microarchitecture, pipelining, and memory hierarchies: from RISC 5-stage data hazards and dynamic branch prediction to MESI cache coherence, false sharing thrashing, multi-socket NUMA latency cliffs, Williams' Roofline model, and Spectre transient side-channels.

---

## 🏛️ Curricular Foundations

This curriculum synthesizes reference algorithms and operational architectures from:
- **John L. Hennessy & David A. Patterson**, *Computer Architecture: A Quantitative Approach* (6th Edition, Morgan Kaufmann)
- **Randal E. Bryant & David R. O'Hallaron**, *Computer Systems: A Programmer's Perspective* (CS:APP 3rd Edition, Pearson)
- **Ulrich Drepper (Red Hat)**, *What Every Programmer Should Know About Memory*
- **Samuel Williams, Andrew Waterman, David Patterson**, *Roofline: An Insightful Visual Performance Model for Multicore Architectures* (CACM 2009)
- **Paul Kocher et al.**, *Spectre Attacks: Exploiting Speculative Execution* (IEEE S&P 2019)

---

## 🔬 Interactive Simulators Included

| Chapter | Simulator | Key Concepts Demonstrated |
|---|---|---|
| **Figure 00** | `archHero` | The Microarchitecture Latency Wall: L1 (1ns) vs L2 (3.5ns) vs L3 (12ns) vs DRAM (65ns) vs NVMe (10us) |
| **Chapter 01** | `pipelineHazards` | RISC 5-Stage Pipeline, RAW Data Hazards, Forwarding Bypasses vs 2-Cycle NOP Stalls |
| **Chapter 02** | `branchPredictor` | Dynamic Branch Prediction: 2-Bit Saturating Counter FSM, BTB & 15-Cycle Flush Penalty |
| **Chapter 03** | `tomasuloRob` | Tomasulo Out-of-Order Execution, Reservation Stations, Common Data Bus & Reorder Buffer (ROB) |
| **Chapter 04** | `simdVectorUnits` | SIMD Vector Acceleration: Scalar vs 256-bit AVX2 vs 512-bit AVX-512 & Vector Opmasks |
| **Chapter 05** | `cacheMisses` | Cache Geometry: Tag, Set Index, Line Offset Bitfields & The 3 C's (Compulsory, Capacity, Conflict) |
| **Chapter 06** | `mesiCoherence` | MESI Cache Coherence Protocol: Modified, Exclusive, Shared, Invalid State Transitions |
| **Chapter 07** | `falseSharing` | Multithreading Pitfall: False Sharing, 64-Byte Cache Line Ping-Pong & 64B Padding |
| **Chapter 08** | `memoryOrdering` | Memory Consistency: x86 TSO Store Buffers, Dekker Race Violations & MFENCE Hardware Barriers |
| **Chapter 09** | `dramTiming` | DRAM Microarchitecture: Banks, Row Buffers, CAS Latency ($t_{CL}$), Activate ($t_{RCD}$), Precharge ($t_{RP}$) |
| **Chapter 10** | `numaLatencyMap` | Dual-Socket NUMA Topology: Local Memory Channels (65ns) vs Remote UPI Interconnect Hops (135ns) |
| **Chapter 11** | `rooflineModel` | Williams' Roofline Model: Arithmetic Intensity (FLOPs/Byte), Memory-Bound vs Compute-Bound Ceilings |
| **Chapter 12** | `prefetcherDynamics` | Hardware Prefetching: Stream & Stride Detectors on Contiguous Arrays vs Pointer Chasing Misses |
| **Chapter 13** | `spectreExploit` | Hardware Security: Spectre Variant 1 (Bounds Check Bypass), Speculative L1 Cache Timing Channels |
| **Chapter 14** | `mmuHugepages` | Hardware MMU TLB Reach: Standard 4KB (256KB Reach) vs 2MB HugePages (128MB Reach) |
| **Chapter 15** | `dvfsPowerStates` | Power Architecture: Dynamic Voltage & Frequency Scaling (DVFS), P-States & C6 Deep Sleep Power Gating |

---

## 🧪 Automated Testing & Verification

The test harness mounts all 16 simulators across 4 viewports (320px, 480px, 768px, 1200px) and exercises all interactive controls:

```bash
npm test
```

---

## 🚀 Deployment

Zero-build vanilla web architecture. Built with pure HTML5, CSS3, and ES6+ Canvas APIs.
Hosted on GitHub Pages.
