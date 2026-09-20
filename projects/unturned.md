# Unturned

**Video-based shelf price recognition pipeline.**

[← Back to profile](../README.md)

## Overview

Unturned is a web interface and backend ML pipeline for recognizing shelf price tags from robot video. The output is a structured table plus a CSV contract suitable for the Lenta Tech Life Hack task.

## Problem

A shelf-scanning robot produces video, not a ready-to-use product dataset. The system needs to detect relevant frames and price tags, extract structured values, track processing state and return a predictable machine-readable result.

## Contribution

This is a team project. The public case study focuses on the end-to-end productization and integration of the recognition flow rather than claiming sole authorship of every model.

The repository packages the ML stages behind a usable web/API workflow with job state, result retrieval and a fixed CSV contract.

## System / architecture

```text
React frontend
      |
      | POST /jobs/upload
      v
FastAPI backend
      |
      +--> detect
      +--> classify
      +--> OCR
      +--> finalize
      |
      +--> job status / result / CSV
```

The local backend uses RabbitMQ and workers. The hosted Hugging Face deployment uses an inline execution mode while preserving the same HTTP contract.

## Stack

- Python
- FastAPI
- React
- RabbitMQ
- Docker
- computer vision
- OCR
- Hugging Face Spaces
- Vercel

## What was built

- video upload through the UI;
- asynchronous-style job flow;
- detect → classify → OCR → finalize pipeline;
- job polling;
- structured result table;
- downloadable result CSV;
- backend and mock frontend modes;
- a 29-column CSV contract;
- local Docker Compose runtime;
- hosted demo backend and frontend.

## Status

**Public demo / public source.**

The current demo is suitable for showcasing the end-to-end flow. Long-video quality and CPU processing time remain practical limitations that require separate evaluation.

## Links

- [Live demo ↗](https://unturned-lenta-tech.vercel.app)
- [Source code ↗](https://github.com/n3onnhowever/unturned-lenta-tech)
