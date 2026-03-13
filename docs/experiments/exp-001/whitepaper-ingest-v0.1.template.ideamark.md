# Whitepaper Ingest Template v0.1

``` yaml
doc_type: template
template_type: ingest
template_id: whitepaper-ingest-v0.1
target_release: v0.1.0
description: >
  Ingest template for structured policy documents (whitepapers, government reports,
  annual reports). This template defines normalization rules for ingest chunks,
  layout role classification, logical segment generation, and hints for POR
  processing.
```

## Section: InputAssumptions

``` yaml
section_type: specification
purpose: Define assumptions about the structure of whitepaper-style documents.
```

Whitepapers typically contain:

-   hierarchical headings (Part → Chapter → Section → Subsection)
-   paragraph-structured body text
-   numbered figures and tables
-   captions and source notes
-   page layout artifacts such as page bands or sidebars

These assumptions allow reliable extraction of section anchorage hints.

------------------------------------------------------------------------

## Section: IngestChunkNormalization

``` yaml
section_type: processing_step
input_unit: ingest_chunk
output_unit: normalized_chunk
```

Each ingest chunk represents a fragment of the source document.

Normalization operations:

-   OCR or text extraction
-   layout role classification
-   noise filtering
-   ingest overlap detection
-   ordering hint estimation

Output is a normalized chunk annotated with layout and overlap metadata.

------------------------------------------------------------------------

## Section: LayoutRoleClassification

``` yaml
section_type: classification
output_field: segment_type
allowed_values:
  - heading
  - body
  - figure
  - caption
  - source_note
  - noise
```

Detected layout roles are used to generate logical segments for POR.

------------------------------------------------------------------------

## Section: LogicalSegmentGeneration

``` yaml
section_type: transformation
input_unit: normalized_chunk
output_unit: logical_segment
```

Logical segments are the units passed to POR.

Each segment contains metadata:

``` yaml
segment_metadata:
  - segment_type
  - layout_role_confidence
  - heading_level
  - figure_anchor
  - overlap_group
  - ordering_hint
  - section_hint
  - evidence_hint
```

Segments may overlap in meaning due to document structure or processing
limits.

------------------------------------------------------------------------

## Section: PORInteractionHints

``` yaml
section_type: interpretation_hint
target_system: POR
```

Segment roles suggest possible semantic interpretation:

  segment_type   POR hint
  -------------- ---------------------------------------
  heading        section anchorage candidate
  body           claim / context / mechanism candidate
  figure         evidence candidate
  caption        evidence metadata
  source_note    provenance metadata

Final interpretation is performed by POR using windowed reconciliation.

------------------------------------------------------------------------

## Section: OverlapHandling

``` yaml
section_type: concept_definition
concepts:
  - ingest_overlap
  - semantic_overlap
```

### ingest_overlap

Used to reconstruct document continuity when chunks were split during
capture.

### semantic_overlap

Used by POR to interpret meaning across adjacent logical segments.

------------------------------------------------------------------------

## Section: ExpectedOutcome

``` yaml
section_type: specification
outputs:
  - ordered_logical_segments
  - overlap_relations
  - layout_role_hints
  - section_anchorage_hints
```

Applying this template should produce logical segments suitable for POR
entity extraction and interpretation.
