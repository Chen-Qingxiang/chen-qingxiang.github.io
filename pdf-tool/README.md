# PDF Local

A small browser-only PDF toolkit hosted at:

**https://chen-qingxiang.github.io/pdf-tool/**

The project is intentionally narrow: it covers a few recurring personal PDF tasks without uploading documents to a third-party PDF service.

## Features

### 1. Extract pages

Choose one PDF and export only selected pages.

Supported page syntax:

```text
3, 17-18, 52
```

Ranges can also be entered in reverse order if a reversed sequence is useful.

### 2. Merge PDFs

Add multiple PDFs, reorder them with the up/down controls, and export one merged document.

### 3. Combine two ID scans into one page

This is deliberately optimized for a recurring scanner workflow rather than a general-purpose crop editor.

Typical workflow:

1. Scan the front of an ID near the **top** of an A4 page and save it as one PDF.
2. Turn the ID over, place it near the **bottom** of an A4 page, and save that scan as a second PDF.
3. Select the two PDFs in PDF Local.
4. The tool takes the **top half of page 1 from the front PDF** and the **bottom half of page 1 from the back PDF**.
5. Those halves are combined into one output page.

The output page keeps the page size of the first scan. When both files come from the same scanner with the same page settings, the scanned ID size and position are preserved closely.

If either input PDF contains multiple pages, only its first page is used and the interface reports this explicitly.

## Privacy model

PDF files are never uploaded by this application.

Processing happens in the browser using the [`pdf-lib`](https://pdf-lib.js.org/) JavaScript library. The application has:

- no upload endpoint;
- no backend;
- no user account;
- no analytics or tracking code;
- no persistent PDF storage.

The PDF objects live in browser memory while the page is open. Generated PDFs are returned directly through a browser download.

### External dependency

The page currently loads a pinned version of `pdf-lib` (`1.17.1`) from jsDelivr. This means opening the tool requires a normal web request for the JavaScript library, but the selected PDF files are not sent to jsDelivr.

## Technology

- Static HTML
- CSS
- Vanilla JavaScript
- pdf-lib 1.17.1
- GitHub Pages

There is no build step and no server-side code.

## Local development

Clone the Pages repository and serve its root with any static HTTP server, for example:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/pdf-tool/
```

## Limitations

- Password-protected/encrypted PDFs are not supported.
- Very large PDFs can use substantial browser memory because all processing is local.
- The ID-scan workflow intentionally uses fixed top/bottom half-page crops rather than free-form crop rectangles.
- Complex PDF forms, unusual annotations, or uncommon PDF structures may not behave exactly like Adobe Acrobat.

## Design principle

This is a personal utility, not an attempt to reproduce a full online PDF suite. New features should only be added when they solve a recurring workflow while preserving the browser-only privacy model.
