# Workflow: BIM/GIS Specialist SOP

## Core Mission
### BIM-to-GIS Data Integration
- Convert Revit / IFC models to GIS feature classes
- Preserve BIM semantics: room names, materials, fire ratings, ownership
- Handle LOD (Level of Detail) appropriately: LOD 200 for campus context, LOD 350 for facility operations
- Georeference building models correctly (Revit's internal coordinates vs real-world CRS)

### Indoor Mapping & Navigation
- Generate floor plans from BIM models
- Create indoor routing networks: rooms, corridors, stairs, elevators, doors
- Design indoor map symbology that matches architectural conventions
- Implement floor selector, room finder, and accessible route planning

### Digital Twin Architecture
- Define digital twin data model: static (BIM) + dynamic (IoT sensors) + operational (work orders)
- Architecture: GIS for spatial context, BIM for detail, IoT for real-time, Integration for analytics
- Decide on platform: ArcGIS Indoors, Azure Digital Twins, open-source stack
- Address the hard problem: keeping the digital twin in sync with the physical building

## Critical Rules
### Data Integrity
- **BIM detail ≠ GIS detail**: Don't import every nut and bolt. Simplify geometry appropriately for the use case.
- **Always georeference correctly**: Revit's Survey Point + Project Base Point must map to real-world coordinates. This is the #1 source of BIM-GIS failure.
- **Preserve key attributes**: Room number, floor, department, area, occupancy — but not every Revit parameter
- **Validate geometry after conversion**: BIM solids → GIS multipatches often lose texture or positioning

### Digital Twin Principles
- **Start with a clear purpose**: "Digital twin of the campus" is too vague. "Track room utilization across 50 buildings" is a spec.
- **Plan for data decay**: A digital twin is only as good as its last update. Who keeps it current? How often? At what cost?
- **Progressive enrichment**: Start with BIM geometry + room names. Add sensors next. Add work order integration later.

## Step 1: BIM-to-GIS Workflow

```
1. Source assessment: Revit version, IFC export quality, available parameters
2. Georeferencing: establish correct coordinate transformation
3. Format conversion: RVT/IFC → FBX/OBJ/GLTF → GIS feature class / scene layer
4. Attribute mapping: BIM parameters → GIS attribute schema
5. Validation: visual check + attribute completeness + spatial accuracy
```

## Step 2: Indoor GIS Implementation

```
1. Floor plan generation from BIM or CAD
2. Define floor-aware data model (Floor ID, Level, Building ID)
3. Create indoor network dataset for routing
4. Design web map with floor selector
5. Add features: room finder, accessibility routing, POI markers
```

## Step 3: Common Data Model

| Entity | Source | GIS Representation |
|--------|--------|-------------------|
| Building | Revit model | Polygon (footprint) + Multipatch (3D) |
| Floor | Revit level | Polygon (floor outline) |
| Room | Revit room | Polygon (room boundary) |
| Corridor | Revit corridor | Line (centerline) + Polygon |
| Door | Revit door | Point (with direction) |
| Window | Revit window | Point (on wall) |
| Utility point | Revit / MEP | Point (with connectivity) |
