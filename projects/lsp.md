# LSP

**AI-assisted ship inspection platform.**

[← Back to profile](../README.md)

## Overview

LSP is a system for supporting ship-hull inspection workflows: collecting inspection materials, preserving evidence, structuring findings and preparing the path toward computer-vision-assisted analysis.

The core principle is human-in-the-loop: the system can organize evidence and support analysis, but the engineering decision and final report remain the responsibility of the inspector.

## Problem

Ship inspection work combines media, observations, defect evidence, review decisions and reporting. A useful engineering system needs more than a model prediction: it must preserve traceability, distinguish machine findings from verified findings, support recovery, and keep the evidence chain understandable.

## My work

My work spans the system architecture and the foundations required before ML can be trusted inside the workflow:

- domain and application boundaries;
- inspection and media lifecycle;
- PostgreSQL persistence;
- evidence and finding contracts;
- import/recovery behavior;
- internal inspection workflow;
- inference contract foundations;
- reporting foundations and quality gates.

## System / architecture

The project is structured around explicit layers:

```text
UI / host
   |
   v
Application
   |
   +----> versioned Contracts
   |
   v
Domain
   ^
   |
Infrastructure
   |
   +----> PostgreSQL / EF Core
   +----> media/object-storage integration
   +----> decoder / analysis integration boundaries
```

A key design decision is to keep these concepts separate:

```text
ModelFinding
ReviewDecision
VerifiedFinding
```

A failed inference path must not silently become a verified defect.

## Stack

- C# / .NET
- ASP.NET Core
- PostgreSQL
- EF Core
- Python
- Computer Vision integration contracts
- object/media storage
- Docker / local infrastructure tooling

## What has been built

The private development branch includes foundations for:

- inspection domain rules;
- persisted inspection state;
- media acquisition/import lifecycle;
- evidence handling;
- recovery/fencing behavior;
- PostgreSQL-backed persistence;
- versioned analysis/inference contracts;
- internal demo workflow;
- draft reporting foundations.

## Status

**Active R&D / private source / not pilot-ready.**

The project has a real persisted internal-demo inspection path, but the current public description does **not** claim a production AI runtime. Preview/media-selection UX, richer finding workflows, recovery UX and the complete inference/review/report path are still part of the path to a pilot-ready system.

## Project context

The ship-inspection project has also been used in university/startup programs and presentations. The engineering case study here focuses on the product and system design rather than reproducing private source code.

## Media

To be added in the production asset pass:

<!--
- inspection workspace
- inspection summary
- review screen
- architecture / evidence lifecycle diagram
-->

## Links

- **Source code:** Private
- **Portfolio mode:** Public case study only
