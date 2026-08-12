import json
import re

# Read the text file
with open(r'c:\Users\Mohammed\OneDrive - St Michaël College\2025-2026\Wiskunde\Uitwerkingen\Projects\Projects\tw page based of flaschardspage httpsreiner-flashcards.vercel.app\content\scheikunde-context.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# Initialize the JSON structure
json_data = {
    "siteMetadata": {
        "title": "Scheikunde - Compleet Curriculum",
        "description": "Compleet scheikunde curriculum met alle hoofdstukken, leerdoelen, leerstof, vragen en antwoorden.",
        "author": "Scheikunde",
        "date": "2025-2026",
        "version": "1.0"
    },
    "contentFormat": "structured",
    "defaultViewMode": "textbook",
    "availableModes": ["textbook", "flashcards", "anki"],
    "showTimestamps": False,
    "showExportButtons": True,
    "showAnkiExport": True,
    "showFlashcardsExport": True,
    "showTranscriptExport": False,
    "showCopyTranscript": False,
    "buttons": [
        {
          "label": "Terug naar overzicht",
          "action": "back"
        }
    ],
    "sections": []
}

# Parse the content and build sections
# This is a simplified parser - in production you'd want more sophisticated parsing
lines = content.split('\n')
current_section = None
current_block = None
current_questions = []
current_answers = []

for line in lines:
    line = line.strip()
    if not line:
        continue
    
    # Detect section headers (e.g., "1.1 Introductie Scheikunde")
    section_match = re.match(r'^(\d+\.\d+)\s+(.+)$', line)
    if section_match:
        # Save previous section if exists
        if current_section:
            json_data["sections"].append(current_section)
        
        # Start new section
        section_num = section_match.group(1)
        section_title = section_match.group(2)
        current_section = {
            "id": f"sec-{section_num.replace('.', '-')}",
            "title": f"§{section_num} {section_title}",
            "blocks": [],
            "answers": []
        }
        current_block = None
        current_questions = []
        current_answers = []
        continue
    
    # Detect learning objectives (bullet points at start of section)
    if current_section and not current_block and line.startswith('•'):
        if not any(b["id"] == f"blk-{current_section['id']}-objectives" for b in current_section["blocks"]):
            objectives_block = {
                "id": f"blk-{current_section['id']}-objectives",
                "type": "text",
                "content": "## Leerdoelen\n\n" + line
            }
            current_section["blocks"].append(objectives_block)
            current_block = objectives_block
        else:
            current_block["content"] += "\n" + line
        continue
    
    # Detect content blocks
    if current_section and (line.startswith("##") or line.startswith("Leerstof")):
        content_block = {
            "id": f"blk-{current_section['id']}-content-{len(current_section['blocks'])}",
            "type": "text",
            "content": line
        }
        current_section["blocks"].append(content_block)
        current_block = content_block
        continue
    
    # Detect questions
    if "Vragen paragraaf" in line or line.startswith("1.") or line.startswith("2.") or line.startswith("3."):
        if "Vragen paragraaf" in line:
            questions_block = {
                "id": f"blk-{current_section['id']}-questions",
                "type": "questions",
                "content": "## " + line,
                "questions": []
            }
            current_section["blocks"].append(questions_block)
            current_block = questions_block
        elif current_block and current_block["type"] == "questions":
            current_block["content"] += "\n" + line
        continue
    
    # Detect answers
    if "Antwoorden" in line or line.startswith("a.") or line.startswith("b.") or line.startswith("c."):
        if "Antwoorden" in line:
            # This would be added to answers array
            pass
        continue
    
    # Add content to current block
    if current_block:
        current_block["content"] += "\n" + line

# Add the last section
if current_section:
    json_data["sections"].append(current_section)

# Write the JSON file
with open(r'c:\Users\Mohammed\OneDrive - St Michaël College\2025-2026\Wiskunde\Uitwerkingen\Projects\Projects\tw page based of flaschardspage httpsreiner-flashcards.vercel.app\content\scheikunde-hoofdstuk-1-2-6-7-complete.json', 'w', encoding='utf-8') as f:
    json.dump(json_data, f, indent=2, ensure_ascii=False)

print("JSON file created successfully!")
print(f"Total sections: {len(json_data['sections'])}")
