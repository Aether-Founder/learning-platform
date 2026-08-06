# Magister API Structure

This document captures the actual JSON structure returned by Magister APIs based on Network tab inspection.

## Calendar/Agenda API

**Endpoint Pattern**: `/api/personen/{id}/afspraken`

### Response Structure (Empty - Holiday Period)

```json
{
  "Items": [],
  "TotalCount": 0
}
```

### Expected Event Object Structure

Based on Magister field naming conventions:

```json
{
  "Id": 123456,
  "Start": "2025-09-01T09:00:00.000+02:00",
  "Einde": "2025-09-01T10:00:00.000+02:00",
  "LesuurVan": 1,
  "LesuurTotMet": 2,
  "Omschrijving": "Wiskunde",
  "Lokatie": "Lokaal 101",
  "Status": 1,
  "Type": 1,
  "WeergaveType": 1,
  "Inhoud": "Hoofdstuk 3: Algebra",
  "InfoType": 0,
  "Aantekening": "",
  "Afgerond": false,
  "Vakken": [
    {
      "Id": 789,
      "Naam": "Wiskunde"
    }
  ],
  "Docenten": [
    {
      "Id": 456,
      "Naam": "Dhr. de Vries"
    }
  ],
  "Links": []
}
```

**Key Fields:**
- `Id` - Unique identifier for the event
- `Start` - Start time (ISO 8601 with timezone)
- `Einde` - End time (Dutch for "end")
- `Omschrijving` - Description/title
- `Lokatie` - Location

**Fallback Field Names** (for compatibility):
- `start`, `Begin` → Start time
- `end`, `End` → End time
- `title`, `Titel` → Title/description

---

## Grades API

**Endpoint Pattern**: `/api/personen/{id}/cijfers`

### Actual Response Structure

```json
{
  "items": [
    {
      "CijferId": 789,
      "Vak": "Nederlands",
      "Omschrijving": "Proefwerk spelling",
      "Cijfer": "7.5",
      "Weging": 2,
      "Datum": "2025-10-15T00:00:00.000+02:00",
      "Periode": 2
    }
  ],
  "links": {
    "voortgangscijfers": {
      "href": "/api/aanmeldingen/38613/cijfers"
    }
  },
  "totalCount": 1
}
```

**Key Fields:**
- `CijferId` - Unique identifier for the grade
- `Vak` - Subject name (Dutch for "subject")
- `Omschrijving` - Description (e.g., "Proefwerk spelling" = spelling test)
- `Cijfer` - Grade value (as string, e.g., "7.5")
- `Weging` - Weight/importance of the grade
- `Datum` - Date the grade was recorded
- `Periode` - Period/semester number

**Note on Case Sensitivity:**
- Grades API uses **lowercase** `items` and `totalCount`
- Calendar API uses **PascalCase** `Items` and `TotalCount`
- Our interceptor handles both cases

**Fallback Field Names** (for compatibility):
- `Id`, `id` → Grade ID
- `subject`, `Subject` → Subject name
- `grade`, `Grade` → Grade value

---

## Field Mapping Strategy

### Interceptor Flexibility

The interceptor and content script use a **flexible field mapping** approach:

```javascript
// Primary field || Fallback 1 || Fallback 2
const id = event.Id || event.id || generateId(event);
const subject = grade.Vak || grade.subject || grade.Subject;
```

This ensures the extension works even if Magister changes their API field names.

### Raw Payload Storage

All data includes a `raw_payload` JSONB column in Supabase that stores the complete, unmodified API response. This provides:

1. **Future-proofing**: Access to all fields even if we don't currently use them
2. **Debugging**: See exactly what Magister returned
3. **Feature expansion**: Add new features without re-syncing historical data
4. **Data recovery**: Reconstruct events/grades if our parsing logic changes

---

## API Observations

### Calendar API
- Returns empty array during holiday periods
- Uses PascalCase for fields (`Items`, `TotalCount`)
- Times include timezone offset (`+02:00`)
- Events can have multiple teachers and subjects

### Grades API
- Uses camelCase for root fields (`items`, `totalCount`)
- Uses PascalCase for item fields (`CijferId`, `Vak`, `Cijfer`)
- Grades are stored as strings (not numbers)
- Includes weight (`Weging`) for calculating averages
- Links to related endpoints (`voortgangscijfers`)

### Common Patterns
- All IDs are numeric
- Dates use ISO 8601 format with timezone
- Empty results return `[]` array (not null)
- Count fields: `TotalCount` or `totalCount`

---

## Testing the API

### Manual Network Inspection

1. Open magister.net and log in
2. Open DevTools (F12) → Network tab
3. Filter by "Fetch/XHR"
4. Navigate to:
   - Agenda page → Look for `/afspraken` requests
   - Cijfers page → Look for `/cijfers` requests
5. Click on request → Preview/Response tab
6. Copy the JSON structure

### Extension Console Logs

The interceptor logs all captured data:

```javascript
// Look for these in console:
[Magister Interceptor] Intercepting: /api/personen/123/afspraken
[Magister Interceptor] Sent CALENDAR data to content script
[Magister Sync] Received intercepted data: CALENDAR
```

---

## Updating Field Mappings

If Magister changes their API, update these files:

1. **`interceptor.js`** - API URL patterns
2. **`content.js`** - Field mapping in `formatCalendarData()` and `formatGradesData()`
3. **This document** - Document the new structure

The extension is designed to be resilient to field name changes through fallback chains.
