# Workflow: AIS Vessel Traffic Monitoring SOP

## Step 1: High-Density AIS Telemetry Stream Processing
Ingest AISStream WebSocket transponder updates. Decode MMSI, Speed Over Ground (SOG), Course Over Ground (COG), destination, and navigation status.

## Step 2: Kinematic Anomaly & Dark Ship Blackout Detection
Detect vessels deviating from established Traffic Separation Schemes (TSS), experiencing sudden deceleration, or undergoing suspicious transponder blackouts.

## Step 3: Chokepoint Congestion, Demurrage & Safety Notification
Assess transit queuing times in high-density maritime straits and compile safety bulletins. Calculate estimated port arrival slippage, container demurrage penalties, and inventory buffer impacts for scheduled inbound commercial shipments trapped in congestion queues.
