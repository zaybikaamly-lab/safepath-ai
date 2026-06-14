# SafePath AI — Band.ai Integration Files

These are the 4 files you need to update your GitHub repo to use Band.ai for multi-agent orchestration.

## Files Included

1. **src/lib/api/band.ts**
   - Band.ai client for communicating with agents
   - Handles WebSocket connections and REST API calls

2. **src/lib/agents/band-orchestrator.ts**
   - Orchestrator that triggers your 7 agents via Band
   - Listens for agent responses and coordinates communication

3. **src/app/api/analyze/route.ts**
   - Updated API endpoint that uses Band instead of Claude pipeline

4. **.env.example**
   - Updated with Band.ai environment variables

## How to Upload to GitHub

1. Go to: https://github.com/zaybikaamly-lab/safepath-ai

2. Click **"Add file"** → **"Upload files"**

3. Drag these 4 files/folders into the upload box (they maintain folder structure)

4. Click **"Commit changes"**

## Update Your .env.local

Add your Band API key:

```
BAND_API_KEY=your-band-api-key-from-dashboard
BAND_CHAT_ROOM_ID=693cafbc-80cf-4811-aca0-57f7db738df2
```

## Update Vercel Environment Variables

Go to: https://vercel.com/zaybi-s-projects/safepath-ai-4iph/settings/environment-variables

Add:
- `BAND_API_KEY` = your Band API key
- `BAND_CHAT_ROOM_ID` = 693cafbc-80cf-4811-aca0-57f7db738df2

Then make a small commit to GitHub to trigger Vercel redeploy.

## Your 7 Agents in Band

All configured and ready:
- @emailzarayb/hazard-agent
- @emailzarayb/safety-agent
- @emailzarayb/shelter-agent
- @emailzarayb/navigation-agent
- @emailzarayb/preparation-agent
- @emailzarayb/what-if-agent
- @emailzarayb/coordinator-agent

They will communicate in chat room: `693cafbc-80cf-4811-aca0-57f7db738df2`
