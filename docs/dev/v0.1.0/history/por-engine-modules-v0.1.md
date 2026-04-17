# POR Engine Internal Modules

## Development Specification v0.1

This document defines the internal module structure of the **POR
(Portable Object Reconstruction) engine** used in the IdeaMark
processing pipeline.

POR transforms **logical segments** into **portable knowledge
components** that can later be synthesized into IdeaMark documents.

The engine prioritizes:

-   High recall extraction
-   Preservation of unresolved signals
-   Avoidance of premature merging
-   Deferred final selection until synthesis stage

------------------------------------------------------------------------

# Module Overview

  ------------------------------------------------------------------------------------------------------------------------------------
  Module                          Responsibility   Main Input    Main Output                      Execution Style   Controlled By
  ------------------------------- ---------------- ------------- -------------------------------- ----------------- ------------------
  segment_interpreter             Interpret        logical       interpreted segment              model-assisted    por-policy,
                                  logical segment  segment                                                          por-config
                                  and prepare                                                                       
                                  extraction cues                                                                   

  candidate_extractor             Extract Entity / interpreted   raw candidate list               model-assisted    por-policy
                                  Occurrence /     segment                                                          
                                  Section                                                                           
                                  candidates with                                                                   
                                  high recall                                                                       

  candidate_normalizer            Normalize        raw           normalized candidates            deterministic     por-config
                                  candidates,      candidates                                                       
                                  assign IDs,                                                                       
                                  store spans and                                                                   
                                  provenance                                                                        

  candidate_registry              Maintain global  normalized    candidate registry state         deterministic     core engine
                                  candidate        candidates                                                       
                                  registry and                                                                      
                                  provenance                                                                        
                                  tracking                                                                          

  overlap_resolver                Resolve ingest   segments,     overlap relations                deterministic     ingest-config,
                                  overlap and      overlap hints                                                    por-config
                                  semantic overlap                                                                  
                                  relationships                                                                     

  window_builder                  Construct        segments,     windows                          deterministic     por-config
                                  reconciliation   overlap                                                          
                                  windows across   relations                                                        
                                  segments                                                                          

  section_hypothesis_builder      Generate         candidates,   section hypotheses               hybrid            por-policy,
                                  possible section headings                                                         por-config
                                  anchorage                                                                         
                                  hypotheses                                                                        

  occurrence_hypothesis_builder   Generate         candidates,   occurrence hypotheses            hybrid            por-policy,
                                  possible         windows                                                          por-config
                                  occurrence role                                                                   
                                  hypotheses                                                                        

  entity_state_builder            Maintain entity  candidates,   entity state                     deterministic +   por-policy
                                  candidate state  windows                                        model hints       
                                  and unresolved                                                                    
                                  units                                                                             

  placement_scorer                Score candidate  hypotheses,   placement scores                 deterministic     por-config
                                  placement in     candidates                                                       
                                  section /                                                                         
                                  occurrence                                                                        
                                  structures                                                                        

  support_aggregator              Aggregate        registry,     support scores                   deterministic     por-config
                                  support signals  metadata                                                         
                                  (heading,                                                                         
                                  figure,                                                                           
                                  repetition)                                                                       

  transition_analyzer             Detect discourse windows       transition signals               hybrid            por-policy,
                                  transitions                                                                       por-config
                                  (bridge, shift,                                                                   
                                  continuation)                                                                     

  variant_tracker                 Track surface    registry      variant groups                   deterministic     por-policy
                                  variants without                                                                  
                                  premature                                                                         
                                  merging                                                                           

  relation_hypothesis_builder     Propose          candidates,   relation hypotheses              hybrid            por-config
                                  relations such   windows                                                          
                                  as supports /                                                                     
                                  enables /                                                                         
                                  contrasts                                                                         

  confidence_evaluator            Compute          scores,       confidence values                deterministic     por-config
                                  confidence axes  signals                                                          
                                  for candidates                                                                    

  state_updater                   Update candidate confidence    accepted/provisional/discarded   deterministic     por-config
                                  selection state  axes          states                                             

  freeze_controller               Decide which     candidate     freeze decisions                 deterministic     por-config
                                  structures       states                                                           
                                  freeze and which                                                                  
                                  remain plastic                                                                    

  draft_state_emitter             Emit POR draft   full POR      POR draft output                 deterministic     output contract
                                  state snapshot   state                                                            
                                  or delta                                                                          

  synthesis_adapter               Prepare POR      POR draft     synthesis-ready candidates       deterministic     ideamark-policy,
                                  output for                                                                        template
                                  IdeaMark                                                                          
                                  synthesis stage                                                                   
  ------------------------------------------------------------------------------------------------------------------------------------

------------------------------------------------------------------------

# Architectural Layers

The modules above can be grouped into functional layers.

## 1. Interpretation Layer

Responsible for extracting candidate knowledge units from logical
segments.

Modules:

-   segment_interpreter
-   candidate_extractor

Goal:

High recall candidate generation.

------------------------------------------------------------------------

## 2. Candidate Management Layer

Responsible for preserving extracted units and managing provenance.

Modules:

-   candidate_normalizer
-   candidate_registry
-   variant_tracker

Goal:

Maintain reusable knowledge components without premature collapse.

------------------------------------------------------------------------

## 3. Context Reconstruction Layer

Responsible for reconstructing local context using overlaps and windows.

Modules:

-   overlap_resolver
-   window_builder

Goal:

Recover context continuity without reconstructing full source documents.

------------------------------------------------------------------------

## 4. Hypothesis Projection Layer

Responsible for assigning provisional structural interpretations.

Modules:

-   section_hypothesis_builder
-   occurrence_hypothesis_builder
-   entity_state_builder

Goal:

Attach **anchorage** and **role hypotheses** to extracted entities.

------------------------------------------------------------------------

## 5. Reconciliation Layer

Responsible for evaluating and stabilizing structural interpretations.

Modules:

-   placement_scorer
-   support_aggregator
-   transition_analyzer
-   relation_hypothesis_builder
-   confidence_evaluator
-   state_updater

Goal:

Resolve competing interpretations across windows.

------------------------------------------------------------------------

## 6. Stabilization and Output Layer

Responsible for finalizing the POR draft state.

Modules:

-   freeze_controller
-   draft_state_emitter
-   synthesis_adapter

Goal:

Produce a reusable intermediate representation for IdeaMark synthesis.

------------------------------------------------------------------------

# Candidate Data Structure (Recommended)

Each candidate entity should minimally contain:

  Field                   Description
  ----------------------- ----------------------------------------
  candidate_id            Unique identifier
  surface_form            Original textual representation
  source_segments         Segments where the candidate appeared
  extraction_cues         Why the candidate was extracted
  section_hypotheses      Possible anchorage placements
  occurrence_hypotheses   Possible role placements
  support_signals         Heading / figure / repetition evidence
  confidence_axes         Multi-axis confidence values
  selection_state         accepted / provisional / discarded
  freeze_state            plastic / frozen

------------------------------------------------------------------------

# Design Principle

POR is not a system for reconstructing the original document perfectly.

Instead it aims to:

> Extract portable knowledge units while preserving contextual traces
> (anchorage and role) so they can later be reinterpreted, merged,
> split, or reused in new contexts.
