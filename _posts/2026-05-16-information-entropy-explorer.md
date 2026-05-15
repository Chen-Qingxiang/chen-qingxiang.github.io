---
layout: default
title: "Information Entropy Explorer — uncertainty in bits"
tags: [complexity, information-theory, entropy, shannon, visualization]
description: An interactive page for exploring Shannon information, entropy, probability distributions, random sequences, and compressibility.
---

> **Project:** [Information Entropy Explorer](https://chen-qingxiang.github.io/information-entropy/)

Shannon information measures surprise. For an event with probability `p`, the information content is:

```text
I(x) = -log2 p(x)
```

Rare events carry more information when they happen. Certain events carry no surprise.

Entropy is the expected information of a random variable:

```text
H(X) = - sum_i p_i log2 p_i
```

Using log base 2 means the unit is bits.

## What the page does

The explorer includes:

- single-event information
- coin entropy
- multi-symbol distribution entropy
- random sequence generation
- entropy and compressibility notes
- a custom string / frequency demo if enabled

The coin explorer is the easiest place to start. A fair coin has entropy 1 bit. A deterministic coin has entropy 0 bits. A biased coin sits in between.

## Why I made it

Entropy is a compact formula, but the intuition can drift. It is tempting to equate entropy with disorder, complexity, meaning, or importance. This page keeps the focus on probability distributions and expected information.

The multi-symbol section is useful because it shows entropy changing as probability mass spreads out or concentrates. Uniform distributions maximize entropy. Concentrated distributions are more predictable and have lower entropy.

## Compressibility note

The compressibility section includes an important limitation. Shannon entropy based on single-symbol frequencies does not capture every kind of structure.

For example, two sequences can have similar symbol counts while one has a strong repeating pattern and the other looks irregular. Entropy is a powerful tool, but the level of description matters.

## What to look for

Start with the coin entropy curve. Move `p` from 0 to 1 and watch entropy peak at `p = 0.5`.

Then switch to the four-symbol distribution. Compare a uniform distribution with a concentrated one. The labels A/B/C/D do not matter; the probability distribution does.

Finally, generate finite sequences and compare theoretical entropy with empirical entropy. Short samples fluctuate. Longer samples usually move closer to the underlying distribution.

## Link

Open the project here:

[https://chen-qingxiang.github.io/information-entropy/](https://chen-qingxiang.github.io/information-entropy/)
