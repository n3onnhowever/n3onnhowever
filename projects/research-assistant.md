# Research Assistant

**Evidence-first AI workspace for scientific research.**

[← Back to profile](../README.md)

## Overview

Research Assistant is a hackathon prototype built by team **The Boys** for scientific literature research in oncology. It turns a research question into a structured evidence workspace instead of returning an opaque one-shot answer.

The system is a research tool prototype — **not a medical or clinical recommendation system**.

## Problem

Literature research is not only about retrieving papers. A useful workflow must keep track of:

- what was searched;
- what was screened in or out;
- which exact evidence supports each claim;
- whether numerical statements are grounded;
- whether studies can actually be combined;
- what limitations remain.

The project was designed to make that process inspectable.

## Contribution

This was a team-built hackathon project. The portfolio case study documents the end-to-end product and engineering system without claiming sole authorship of every component.

The engineering focus of the work included connecting the research workflow to a structured backend/frontend product flow with explicit verification stages and inspectable evidence.

## System / architecture

```text
React / TypeScript frontend
          |
          v
      FastAPI API
          |
          v
      Redis / RQ
          |
          v
research pipeline
   |
   +--> PubMed / NCBI
   +--> Europe PMC
   +--> ClinicalTrials.gov
   +--> screening
   +--> evidence extraction
   +--> claim / numeric verification
   +--> structured report
```

For suitable research intents, the prototype also includes study-family normalization and meta-analysis-oriented outputs such as forest/funnel artifacts when the underlying evidence is compatible.

## Stack

- Python
- FastAPI
- React
- TypeScript
- Redis
- RQ
- Docker
- structured scientific APIs
- LLM-assisted screening / extraction with deterministic verification layers

## What was built

The prototype includes:

- PICO/PCC-style research planning;
- multi-source scientific retrieval;
- deduplication and screening;
- evidence-span extraction;
- source-quality checks;
- claim → citation → quote verification;
- numerical verification;
- PRISMA-style flow reporting;
- structured report UI;
- meta-analysis feasibility logic and artifacts for compatible cases.

## Status

**Hackathon prototype / private source.**

A committed demo fixture is used for reliable presentation. Full live execution depends on external services, search/model credentials, Redis and the worker runtime.

The project should be read as an engineering prototype for evidence-oriented research assistance, not as a clinical decision tool.

## Media

To be added:

<!--
- research question / plan
- screening funnel
- evidence report
- verification / meta-analysis artifact
-->

## Links

- **Source code:** Private
- **Team:** The Boys
