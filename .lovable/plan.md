

# Fix MightyCustomer VoiceCommand Card, Add Escalations Card, and Stabilize Dashboard Layout

## Summary of Issues Found

1. **MightyCustomerCard Missing VoiceCommand**: The current `MightyCustomerCard.tsx` is a simple navigation card - it does NOT have VoiceCommand integration. The VoiceCommand component exists at `src/components/VoiceCommand.tsx` and is correctly integrated in the full MightyCustomer PAGE (`src/pages/MightyCustomer.tsx`), but NOT in the dashboard card.

2. **No Escalations Dashboard Card**: An `EscalationsDashboard` component exists at `src/components/admin/EscalationsDashboard.tsx` and is used on `/escalations` page - but there's no compact dashboard card for the main dashboard homepage.

3. **MightyChatCard is Present**: MightyChatCard exists at `src/components/dashboard/MightyChatCard.tsx` and is correctly rendered in Dashboard.tsx (line 275). It's not disappearing - both cards are in a 2-column grid.

4. **Dashboard Card Position**: Currently MightyCustomerCard is secondary to MightyChatCard. User wants MightyCustomer to be prominent as "the brain of the system."

---

## Implementation Plan

### 1. Upgrade MightyCustomerCard with VoiceCommand

**File: `src/components/dashboard/MightyCustomerCard.tsx`**

Transform the card to include the VoiceCommand trigger that:
- Shows the collapsible VoiceCommand panel when clicked
- Parses voice input for customer/vehicle data
- Navigates to `/mighty-customer` with pre-filled URL parameters

```typescript
// New structure:
import VoiceCommand from "@/components/VoiceCommand";
import { Mic, Sparkles } from "lucide-react";

export function MightyCustomerCard() {
  const navigate = useNavigate();
  const [showVoice, setShowVoice] = useState(false);
  
  const handleVoiceTranscript = (transcript: string, parsedData: any) => {
    const params = new URLSearchParams();
    if (parsedData.customerName) params.set('customer', parsedData.customerName);
    if (parsedData.email) params.set('email', parsedData.email);
    if (parsedData.phone) params.set('phone', parsedData.phone);
    if (parsedData.vehicleYear) params.set('year', parsedData.vehicleYear);
    if (parsedData.vehicleMake) params.set('make', parsedData.vehicleMake);
    if (parsedData.vehicleModel) params.set('model', parsedData.vehicleModel);
    navigate(`/mighty-customer?${params.toString()}`);
  };
  
  return (
    <Card className="relative">
      {/* VoiceCommand in top-right corner */}
      <VoiceCommand onTranscript={handleVoiceTranscript} />
      
      {/* Large VoiceCommand CTA Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-4">
        <div className="flex items-center gap-3">
          <Mic className="w-6 h-6 text-emerald-500" />
          <div>
            <h3 className="font-bold">VoiceCommand AI™</h3>
            <p className="text-xs text-muted-foreground">
              Speak quote details: "2024 Bronco full wrap John Smith 555-1234"
            </p>
          </div>
        </div>
      </div>
      
      {/* Quick action buttons */}
    </Card>
  );
}
```

### 2. Create EscalationsDashboardCard

**New File: `src/components/dashboard/EscalationsDashboardCard.tsx`**

Compact card showing:
- Active escalations count (from `conversation_events` where `event_type = 'escalation_sent'`)
- Blocked vs pending breakdown
- "Hot" priority count
- Navigate to `/escalations` when clicked

```typescript
// Queries:
const { count: activeEscalations } = await supabase
  .from('conversation_events')
  .select('conversation_id', { count: 'exact', head: true })
  .eq('event_type', 'escalation_sent');

// Visual:
<Card>
  <CardHeader>
    <AlertTriangle className="text-orange-500" />
    Escalations
  </CardHeader>
  <CardContent>
    <div className="flex gap-4">
      <div>
        <p className="text-2xl font-bold">{activeCount}</p>
        <p className="text-xs">Active</p>
      </div>
      <div>
        <p className="text-2xl font-bold">{blockedCount}</p>
        <p className="text-xs">Blocked</p>
      </div>
    </div>
    <Button onClick={() => navigate('/escalations')}>
      View Escalations →
    </Button>
  </CardContent>
</Card>
```

### 3. Update Dashboard Layout - Make MightyCustomer Prominent

**File: `src/pages/Dashboard.tsx`**

Restructure the card section:
- **Row 1**: MightyCustomerCard (FULL WIDTH) - The brain of the system gets top billing
- **Row 2**: 2-column grid with MightyChatCard + EscalationsDashboardCard

```typescript
import { EscalationsDashboardCard } from "@/components/dashboard/EscalationsDashboardCard";

// New layout structure:
{/* Section 2: MightyCustomer - The Brain (Full Width) */}
<MightyCustomerCard />

{/* Section 3: MightyChat & Escalations */}
<div className="grid md:grid-cols-2 gap-4">
  <MightyChatCard />
  <EscalationsDashboardCard />
</div>
```

---

## Technical Details

| File | Action |
|------|--------|
| `src/components/dashboard/MightyCustomerCard.tsx` | **REWRITE** - Add VoiceCommand integration |
| `src/components/dashboard/EscalationsDashboardCard.tsx` | **CREATE** - New escalations overview card |
| `src/pages/Dashboard.tsx` | **UPDATE** - New layout with MightyCustomer prominent |

---

## Database Queries

**EscalationsDashboardCard:**
```sql
-- Active escalations (unique conversations with escalation events)
SELECT COUNT(DISTINCT conversation_id) 
FROM conversation_events 
WHERE event_type = 'escalation_sent';

-- Will use existing useEscalationStatus hook logic to determine:
-- - Blocked (needs quote but none sent)
-- - Pending (escalation sent, awaiting response)
-- - Resolved (resolution logged)
```

---

## Visual Result

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  Dashboard                                      [Create Video Ad]           │
├─────────────────────────────────────────────────────────────────────────────┤
│  TODAY: [Active Jobs] [Pending Approvals] [Open Orders] [Quote Requests]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  🎙️ MightyCustomer - VoiceCommand AI™              [Open Tool →]   │   │
│  │  ───────────────────────────────────────────────────────────────    │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │ 🎤 VoiceCommand AI™                                          │   │   │
│  │  │ Hold & speak: "2024 Bronco full wrap John Smith 555-1234"    │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  [New Quote]    [Quote Drafts]                                      │   │
│  │                                                                     │   │
│  │  🚗 Vehicle wrap quotes | ⚡ Instant pricing                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌───────────────────────────────┐  ┌───────────────────────────────────┐  │
│  │  💬 MightyChat                │  │  ⚠️ Escalations                   │  │
│  │  ─────────────────            │  │  ─────────────────                │  │
│  │  🔥 3 Hot Leads               │  │                                   │  │
│  │  ┌───────┬───────┬──────┐     │  │  ┌──────────┐  ┌──────────┐      │  │
│  │  │Website│ Phone │Files │     │  │  │    12    │  │    3     │      │  │
│  │  │  42   │  15   │ 114  │     │  │  │  Active  │  │ Blocked  │      │  │
│  │  └───────┴───────┴──────┘     │  │  └──────────┘  └──────────┘      │  │
│  │  📋 2 quote requests          │  │  → View Escalations              │  │
│  └───────────────────────────────┘  └───────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Files to Modify

1. `src/components/dashboard/MightyCustomerCard.tsx` - Add VoiceCommand integration
2. `src/components/dashboard/EscalationsDashboardCard.tsx` - Create new escalations card
3. `src/pages/Dashboard.tsx` - Update layout with MightyCustomer prominent + add EscalationsDashboardCard

