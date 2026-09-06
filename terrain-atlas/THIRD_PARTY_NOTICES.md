# Third-party software and data

Terrain Atlas original code is MIT-licensed. That license does not replace the licenses of third-party software or geographic datasets.

## CesiumJS 1.145.0

- Project: <https://github.com/CesiumGS/cesium>
- Distribution: `cesium@1.145.0`, unmodified `Build/Cesium/` through jsDelivr, with unpkg fallback.
- License: Apache-2.0, Copyright Cesium GS, Inc. and contributors.
- The complete package license, including its embedded third-party notices, is preserved in [licenses/CESIUM-LICENSE.md](licenses/CESIUM-LICENSE.md).
- The package's [ThirdParty.json](licenses/CESIUM-ThirdParty.json) and [ThirdParty.extra.json](licenses/CESIUM-ThirdParty.extra.json) are also preserved.
- The original on-map credit system remains visible, including on mobile screens.

## Terrain Tiles

- Registry: <https://registry.opendata.aws/terrain-tiles/>
- Maintainer: Mapzen / Tilezen; hosted in the AWS Open Data public S3 bucket `elevation-tiles-prod`.
- Source license and attribution information: <https://github.com/tilezen/joerd/blob/master/docs/attribution.md>.
- An upstream snapshot is preserved in [licenses/terrain-attribution.md](licenses/terrain-attribution.md). It describes the source datasets and their differing public-domain, attribution and open-government terms.
- Required attribution is displayed on [sources.html](sources.html#terrain), linked from the visible map credits and the control panel.
- Terrain Tiles was accessed on 2026-09-06 from the Registry of Open Data on AWS.

Processing: Terrarium PNG decoding, consistent pixel-origin resampling to shared-edge 65×65 heightmaps, browser color mapping and synthetic directional hillshading, and user-selectable vertical exaggeration. These are application modifications to the presentation and sampling, not changes endorsed by any source provider. ETOPO1 U.S. Government material is not subject to copyright protection within the United States. ETOPO1 must not be used for navigation.

## Natural Earth v5.1.2

- Website and terms: <https://www.naturalearthdata.com/about/terms-of-use/>
- Pinned source: <https://github.com/nvkelso/natural-earth-vector/tree/v5.1.2>
- License: public domain. Made with Natural Earth.
- Included datasets: `ne_10m_populated_places`, `ne_50m_admin_0_boundary_lines_land`, `ne_10m_admin_1_states_provinces_lines`, `ne_50m_rivers_lake_centerlines`.
- Processing: selecting city properties, simplifying line coordinates at approximately 0.015 degrees tolerance, rounding line coordinates to four decimals and city coordinates to five decimals, splitting output into static JSON files.
- Reproducible source URLs, original file SHA-256 values and output counts are recorded in [data/manifest.json](data/manifest.json).

## GPlates inspiration

The original GPlates topography explorer inspired the interaction concept. No GPlates application code, terrain endpoints, logo or imagery assets are included. Terrain Atlas is independently authored and is not affiliated with or endorsed by GPlates. This acknowledgment does not assert a license to redistribute GPlates materials.
