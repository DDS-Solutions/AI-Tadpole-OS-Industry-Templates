# Full-Funnel Campaign Launch Workflow
*Optimized for Tadpole OS*

## Objective
To take a marketing idea from concept to live ads with automated tracking in under 60 minutes.

## Steps
1. **Define Objective**: The user provides a goal (e.g., \"Sell 100 tickets to my workshop\").
2. **Creative Assets**: 
   - `Content Architect` generates three variations of ad copy.
   - `Content Architect` suggests image prompts for the `generate_image` tool.
3. **Targeting & Spend**:
   - `Ad Optimizer` creates a budget plan across Facebook and Google.
   - Sets up A/B testing parameters for the generated copy.
4. **Tracking Setup**:
   - `Funnel Analyst` generates UTM parameters for all links.
   - Verifies that conversion pixels are active on the destination URL.
5. **Launch**: Push to platforms via connected Marketing MCPs.

## Optimization Loop
- Every 24 hours, the `Ad Optimizer` will re-allocate budget from low-performing ads to the \"Winning\" creative identified by the `Funnel Analyst`.
