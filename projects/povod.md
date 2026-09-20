# ПОВОД

**Personalized event discovery for the MAX ecosystem.**

[← Back to profile](../README.md)

## Overview

ПОВОД is a solo-first event discovery product designed for the MAX ecosystem. The goal is to turn a broad city event feed into a useful personal agenda: authenticate through MAX, capture interests and practical constraints, and surface event occurrences with the information needed to decide what to do next.

The first product scope is intentionally narrow: **Moscow first, verified event data, useful filtering, and a strong individual discovery flow before social features.**

## Problem

Event discovery is usually fragmented across listings, social channels and recommendation feeds. Even when an event looks interesting, the information needed to act — exact date and time, venue, price and source — is often incomplete or hard to compare.

ПОВОД is built around a simpler product question:

> What is actually worth doing, when is it happening, where is it, and what do I need to know before I go?

## My work

My work on the project spans product scope, system architecture and engineering integration:

- defining the P0 product boundary and the occurrence model;
- MAX identity/session integration and server-side validation;
- backend/frontend architecture and delivery contracts;
- data-source evaluation and ingestion gates;
- interests, constraints, discovery and filtering flows;
- reliability and test-oriented implementation of the foundation.

## System / architecture

Current engineering direction:

```text
MAX Mini App
    |
    v
React + Vite
    |
    v
Fastify / TypeScript backend
    |
    +--> PostgreSQL
    |
    +--> Redis / BullMQ
    |
    +--> event-source ingestion and normalization
```

Core product entities distinguish an **event** from a concrete **occurrence**, so date, time, venue and price can be represented explicitly instead of being treated as loose text.

## Stack

- TypeScript
- Fastify
- React
- Vite
- PostgreSQL
- Redis
- BullMQ
- Docker
- MAX Mini App / platform integration

## What is being built

P0 focuses on:

- MAX identity;
- one working city — Moscow;
- interests and practical constraints;
- personalized event discovery;
- structured search and filters;
- occurrences with date, time, place and price when the source provides it;
- source/provenance visibility;
- a foundation for favorites and later social functionality.

Map-first discovery, expanded social mechanics and additional cities are deliberately outside the first required scope.

## Status

**Active development / private source.**

The product foundation and authentication work are in place, while verified event ingestion and the full end-to-end P0 runtime remain active implementation gates. The portfolio description intentionally avoids presenting unfinished provider integration as a live production feed.

## Media

Production case-study media will be added here after the README asset pass:

<!--
- product UI overview
- event card / occurrence detail
- interests / filters
- architecture diagram
-->

## Links

- **Source code:** Private
- **Platform:** MAX ecosystem
