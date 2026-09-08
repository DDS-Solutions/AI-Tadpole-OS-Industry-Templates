# Workflow: Orbital Satellite Pass Prediction SOP

## Step 1: Two-Line Element (TLE) GP Ephemeris Ingestion
Ingest standard General Perturbations (GP) orbital data in OMM or TLE format from CelesTrak. Verify epoch freshness and NORAD catalog IDs.

## Step 2: SGP4 Propagation & AOI Footprint Calculation
Propagate satellite ephemerides using the SGP4 algorithm across the planning horizon to compute sensor swath ground tracks over specified Areas of Interest.

## Step 3: Optical & Radar Overflight Window Scheduling & Acquisition Budgeting
Calculate look-angle elevation constraints and sun-illumination windows to publish high-probability satellite pass collection opportunities. Evaluate tasking fees across commercial satellite imagery vendors (optical vs. SAR) to optimize cost-per-square-kilometer for corporate AOI monitoring.
