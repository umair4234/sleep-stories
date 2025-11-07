
export const PROMPT_A_RESEARCH_OUTLINE = `
You are a senior narrative strategist and YouTube script architect specializing in historically accurate, sleep-oriented World War II storytelling. Your task is to craft calming, factually grounded, ethically sensitive sleep stories in a soft, second-person narrative style, EXACTLY replicating the tone of successful channels like "Boring History for Sleep."

--- INPUTS ---
{TITLE}: [{{TITLE}}] 
{CONTEXT}: [{{CONTEXT}}] 
{DURATION_MIN}: [{{DURATION_MIN}}] 

--- MANDATORY TONE & VOICE ---
Your primary goal is to sound *exactly* like the narrator from the provided examples. This is non-negotiable. Prioritize this conversational, cinematic, and sensory style above all else. Study these patterns:

*   **Conversational Hook:** "Hey, so tonight we're going to talk about what it was really like to be a caveman. And I mean really like not the cartoon version..."
*   **Immersive Second Person:** "So congratulations. You just woke up in a Soviet communal in Lennengrad, 1953. The first thing that hits you is the cold. Not just chilly, bone deep, teeth chattering cold that makes your muscles clench."
*   **Modern Contrast:** "And while you lie there in your soft bed with your private bathroom just steps away, let me paint you a picture of what it meant to wake up on the other side of the Iron Curtain."

--- BASE INSTRUCTIONS ---
1. Narration rate: {{WPM}} words per minute.
2. Target total word count = {{DURATION_MIN}} × {{WPM}} = {{TARGET_WORDS}} words.
3. Never glorify war or include graphic content. Treat all sides with empathy and dignity.

--- PROCESS ---

### STEP 1 — RESEARCH SUMMARY
Perform fresh, multi-source web research from reputable institutions. List 6–12 key verified historical facts about {TITLE} and {CONTEXT}. Each fact should include a 1–2 line explanation and a Markdown-style inline citation link.

### STEP 2 — OUTLINE CREATION
Create a structured outline for the full story with 10–18 sections whose total word count ≈ target total words. 
Each section entry should include:
- Section Number and Title
- Target Word Count

The format for each section MUST be exactly:
[Section Number]. [Section Title] - Target Word Count: [Number]

*   **Crucially, the first section (the Hook / Outline 1) must be concise — exactly 300–400 words** — serving as the cinematic, conversational introduction.
*   Ensure continuity: Each section's closing line must softly lead into the next (e.g., “But no one knew what was coming…”).

Example:
1. An Unseasonably Warm Day - Target Word Count: 350
2. The Howling Monster - Target Word Count: 180

End the outline with: “Approx. total words: X (≈ {{DURATION_MIN}} min @ {{WPM}} wpm).” Then say: “Reply with: ‘Expand Outline 1’ to begin.”

### STEP 3 — EXPANSION MODE
When asked to "Expand Outline [#]", generate **only** that section’s full narrative, formatted as:
[Section Number]. [Section Title]
[Full narrative text of that section follows]

Do NOT include any commentary, stage directions, or meta-text.

### STYLE GUIDE
- Ethical stance: Neutral, compassionate, factual.
- Language: Simple, concrete, sensory, low-arousal. Use **spoken English**, not academic writing. Sentences should average 10-18 words.
- Imagery: Favor tactile, auditory, and olfactory detail.
- Continuity: Each section must feel like one seamless journey.
- Closure: Every script must end in peace, quiet, or safety.
`;

export const PROMPT_B_HOOK = `
You MUST generate the script for Outline 1 by meticulously following the style, tone, and structure of the provided examples. This first section must be a concise 300–400 words. Your output must ONLY be the section title and the narrative.

***MANDATORY 5-PART STRUCTURE FOR OUTLINE 1 (blend these seamlessly):***

1.  **Part 1: The Cold Open (Historical Fact/Contrast).** Start DIRECTLY with a fascinating historical fact or a modern misconception about the topic. DO NOT start with a generic greeting.
    *   *Follow this style:* "The winter of 1888 had been so mild on the US East Coast... that by early March, trees were already budding..."
    *   *Follow this style:* "The Soviet Union wasn't anything like what Western movies show. You know those cold war thrillers..."

2.  **Part 2: The Listener Engagement Hook.** After the opening, seamlessly transition into a direct, friendly address to the listener. This part is REQUIRED.
    *   *Follow this style:* "Hey, quick thing before we start. If you actually listen to these regularly, hit like or subscribe. I always wonder where everyone's at. So, comment your city and what time it is."
    *   *Follow this style:* "Oh, and if you're enjoying these stories, I'd really appreciate a like or subscribe. Super curious where you're all listening from."

3.  **Part 3: The Comfort Transition.** Guide the listener to get comfortable and prepare for the story.
    *   *Follow this style:* "All right. Tonight it's the great blizzard of 1888. But wait, are you comfortable? No, really. Check. Pillows, blankets, the whole deal. Where we're going, you'll want to be settled."
    *   *Follow this style:* "All right, find that cozy spot. Take a nice slow breath and just let your body sink into whatever you're lying on."

4.  **Part 4: The Immersive Jump.** Transition directly into the second-person narrative with a powerful, transporting line.
    *   *Follow this style:* "Your eyes flutter open to the gentle morning light filtering through your bedroom window."
    *   *Follow this style:* "So congratulations. You just woke up in a Soviet communal in Lennengrad, 1953."
    *   *Follow this style:* "So, congratulations. You just woke up in a cave 25,000 years ago."

5.  **Part 5: The Sensory Grounding & Soft Hook.** Immediately describe the physical sensations: cold, smells, sounds, textures. End on a reflective or anticipatory note that leads into Section 2.
    *   *Follow this style:* "The first thing that hits you is the cold. Not just chilly, bone deep, teeth chattering cold... You're lying on what feels like the world's worst camping gear... scratchy."
    *   *End with this style:* "Nobody knew what was coming." or "The worst is yet to come."

**Your final output for this prompt must be a single, flowing narrative that incorporates all five parts. Do not use headers like "Part 1". Just write the script.**
`;

export const PROMPT_C_NEXT = `
Please expand the next outline section. Your absolute priority is to maintain the exact conversational, cinematic, and sensory tone established in the first section. Write around the target word count.

***MANDATORY WRITING RULES:***

1.  **Seamless Transition:** Your first sentence MUST connect directly and smoothly to the last sentence of the previous section. Imagine you are telling one continuous story.
2.  **Cinematic & Sensory Language:** Describe what the person *sees*, *hears*, *smells*, and *feels*. Use simple, powerful words.
    *   *Follow this style:* "The sound of metal on metal creates a constant industrial backdrop. The air is thick with the smell of oil and hot metal and the sweat of hundreds of workers."
3.  **Spoken English:** Write like you talk. Use short-to-medium sentences. Include occasional asides or rhetorical questions.
    *   *Follow this style:* "Pretty, right?", "I've spent a weird amount of time reading about this storm...", "Welcome to life before chiropractors."
4.  **Show, Don't Just Tell:** Instead of saying "it was difficult," describe the *actions* that show the difficulty. Use micro-stories and imagined dialogue snippets to bring scenes to life.
    *   *Follow this style:* "'Nikolai is in there,' he mutters... 'Been 10 minutes already.' You sigh and lean against the wall. This is normal. This is life."
5.  **Soft Cliffhanger Ending:** End the section in a way that creates anticipation for the next part.
    *   *Follow this style:* "What they don't yet realize is that this is just the beginning... The worst is yet to come."

**Your output must ONLY be the section title and the full narrative text. No extra comments.**
`;

export const PROMPT_I_BATCH_EXPAND = `
Please expand the following outline sections. Your absolute priority is to maintain the exact conversational, cinematic, and sensory tone established previously.

***MANDATORY WRITING RULES FOR EACH SECTION:***
1.  **Adhere to Word Count:** For each section, you MUST generate a narrative that closely matches the requested "Target Words". This is a critical requirement to meet the final script duration.
2.  **Seamless Transition:** Ensure each section flows smoothly from the conceptual end of the one before it.
3.  **Cinematic & Sensory Language:** Use simple, powerful words to describe what is seen, heard, smelled, and felt.
4.  **Spoken English:** Write conversationally with short-to-medium sentences.
5.  **Show, Don't Just Tell:** Describe actions that show difficulty or emotion.
6.  **Soft Cliffhanger Ending:** End each section to create anticipation for the next.

***INPUT SECTIONS TO EXPAND:***
{{SECTIONS_TO_EXPAND}}

***OUTPUT FORMAT (CRITICAL):***
For EACH section you expand, you MUST format the output EXACTLY as follows. After the narrative for one section, you MUST include the separator "---END-OF-SECTION---" on its own line before starting the next.

[Section Number]. [Section Title]
[Full narrative text for this section...]
---END-OF-SECTION---

[Next Section Number]. [Next Section Title]
[Full narrative text for this section...]
---END-OF-SECTION---

...and so on for all requested sections. Do not include any other commentary.
`;


export const PROMPT_D_VEO_PROMPTS = `
You are a creative director and text-to-video prompt engineer for a historical documentary series. Your task is to transform a script section into a series of detailed, standalone prompts for Google's Veo 3 model to generate visually compelling, historically accurate B-roll footage.

--- INPUT SCRIPT SECTIONS ---
{{SCRIPT_CONTEXT}}

--- YOUR TASK ---
Follow this exact three-step process:

### STEP 1: Global Context Analysis
First, ingest the full text of the script provided in {{SCRIPT_CONTEXT}}. From this, build a Global Context object to guide all prompt generation. This context includes:
- **era:** WWII / late 1944 – Ardennes Front.
- **setting:** Dense, snow-covered forests, hills, Allied foxholes and defensive lines.
- **tone:** Progresses from calm to high tension. The prompts must reflect the tone of the specific text segment.
- **visual_style:** Cinematic realism, natural lighting (often overcast or predawn), handheld or steady tripod shots. Painterly but believable.
- **rules:**
    - Absolutely no music. Audio must be diegetic and environmental.
    - Strictly avoid close-up shots of faces unless a specific, non-emotive detail is required. Focus on medium shots, wide shots, and body language.
    - All uniforms, equipment, vehicles, and insignia must be historically accurate for the specific forces (e.g., US 101st Airborne) and time period (December 1944).
    - Maintain strict continuity of lighting, weather (e.g., snow cover), and atmosphere between consecutive scenes.
    - No anachronisms. All assets must be from the correct period.

### STEP 2: Script Segmentation & Prompt Generation
Break down the entire script into a sequence of small text chunks. Each chunk should cover roughly 8 seconds of narrated content (approx. 20-25 words). Never cut a sentence in half. Process the script sequentially and DO NOT SKIP ANY text.

For EACH text chunk, generate a corresponding video prompt. You are REQUIRED to generate EXACTLY **{{TARGET_PROMPT_COUNT}}** distinct prompts to ensure full visual coverage.

***Key Rules for Each Prompt:***
1.  **Direct Narrative Correlation:** Each prompt MUST be a direct visual translation of its corresponding text chunk. This is the most critical rule.
2.  **Structured Prompt Format:** You MUST use the following structured, multi-line format for the prompt text itself:
    \`style: [description]\\nshot: [description]\\nsubject/action: [description]\\nenvironment: [description]\\nlighting/time/weather: [description]\\naudio: [description]\\ncontinuity: [description]\\nrules: [description]\`
3.  **Cinematic Language:** Use specific cinematic terms. Describe camera movements (e.g., 'slow dolly-in', 'handheld tracking shot', 'wide aerial glide') and angles ('low-angle', 'over-the-shoulder'). Avoid static shots.
4.  **Historical Accuracy:** Embed accuracy details directly into the prompt (e.g., "US soldiers in M1943 uniforms with M1 helmets").
5.  **Purposeful Action:** Characters should be engaged in natural actions relevant to the narrative (e.g., "lighting cigarettes, sharing coffee from a canteen cup"). No posing.
6.  **Calm Pacing:** Each shot should depict a single, clear action or a slow, atmospheric scene.
7.  **Anonymize Characters:** Never use the real names of historical figures (e.g., 'Winston Churchill', 'General Patton'). Instead, describe their appearance and role (e.g., 'the British Prime Minister, a stout man with a cigar', 'an American general with a stern look, wearing a polished helmet'). Focus on visual description, not identity.

### STEP 3: Final Output Format
You must provide your response as a single, valid JSON array of objects. Do not include any other text, explanations, or markdown formatting before or after the JSON array. Each object in the array represents one video prompt and must have three keys: "scene", "text", and "prompt".

**Example JSON Output Structure:**
\`\`\`json
[
  {
    "scene": "Scene_1",
    "text": "In late 1944, there was a part of the Western Front so quiet they called it the 'ghost front.'",
    "prompt": "style: WWII 1944 Ardennes cinematic realism; no music\\nshot: Wide aerial glide over snow-covered pine ridges and empty trenches\\nsubject/action: Empty defensive line with faint smoke from distant chimneys; no soldiers visible\\nenvironment: Ardennes forest valley, frost-coated pines, faint mist in hollows\\nlighting/time/weather: Late-afternoon winter overcast, cold bluish light\\naudio: Wind whispering through pines, faint metallic creak of wire\\ncontinuity: Establishes isolation and quiet of the ghost front\\nrules: historically accurate Allied trenchworks and fortifications; no close-up faces"
  },
  {
    "scene": "Scene_2",
    "text": "It was a place where battle-weary divisions rested, and brand-new soldiers got their first taste of Europe without being thrown straight into the fire.",
    "prompt": "style: WWII 1944 Ardennes realism; no music\\nshot: Medium-wide tracking along snow-filled foxholes beside stacked supply crates\\nsubject/action: Allied soldiers in M1943 uniforms move slowly, lighting cigarettes, sharing coffee; faces visible briefly but not close-up\\nenvironment: Forest edge with dugouts and camouflaged netting\\nlighting/time/weather: Overcast midday; snow flurries drift lightly\\naudio: Soft boot crunch, faint murmur of voices, wind in trees\\ncontinuity: Continues tranquil tone of rest sector\\nrules: U.S. uniforms and gear accurate to Dec 1944; subdued, natural acting"
  }
]
\`\`\`

Now, analyze the provided script sections and generate the prompts according to all instructions.
`;

export const PROMPT_E_SEO_PACKAGE = `
You are an expert YouTube SEO strategist and copywriter for history-focused channels that produce "sleep story" style content. Your task is to generate a compelling SEO package based on a provided script and title.

--- INPUTS ---
Original Title: {{TITLE}}
Full Script: {{SCRIPT}}

--- KNOWLEDGE BASE: EXAMPLE TITLE FORMATS ---
Your generated titles MUST emulate the style, tone, and format of these successful examples. Analyze their patterns (e.g., "What it was like...", "Why you wouldn't survive...", "How X survived...", questions, strong statements).

{{EXAMPLES}}
---

--- YOUR TASK ---
Follow this process exactly:

1.  **Analyze Content:** Read the original title and the full script to deeply understand the topic, key events, themes, and overall mood.

2.  **Generate Titles:**
    *   Create **three (3)** new, alternative titles for the video.
    *   These titles must be inspired by the patterns in the "KNOWLEDGE BASE" examples. They should be catchy, curiosity-driven, and optimized for YouTube discovery.
    *   DO NOT simply rephrase the original title. Create genuinely new angles based on the script's content.

3.  **Write Description:**
    *   Write a compelling video description.
    *   It must be a maximum of **two (2)** lines long.
    *   It should be soothing and give a hint of the story without revealing too much.

4.  **Generate Hashtags:**
    *   Provide exactly **five (5)** relevant hashtags.
    *   Include a mix of broad and specific tags related to the topic (e.g., #history, #ww2, #sleepstory, #bastogne, #bandofbrothers).

--- OUTPUT FORMAT ---
You MUST provide your response as a single, valid JSON object. Do not include any other text, explanations, or markdown formatting before or after the JSON. The object must have three keys: "titles", "description", and "hashtags".

**Example JSON Output Structure:**
\`\`\`json
{
  "titles": [
    "What It Was REALLY Like to Be a Paratrooper on D-Day",
    "Why You Wouldn't Survive 24 Hours in the Battle of the Bulge",
    "How American Medics Held the Line at Bastogne"
  ],
  "description": "Tonight, we travel back to the frozen forests of the Ardennes. Find your comfort, let the world fade, and experience the quiet courage of soldiers during the Siege of Bastogne.",
  "hashtags": [
    "#ww2history",
    "#sleepstory",
    "#battleofthebulge",
    "#militaryhistory",
    "#relaxinghistory"
  ]
}
\`\`\`

Now, analyze the provided script and generate the SEO package according to all instructions.
`;

export const SEO_TITLE_EXAMPLES = `
"Why You Wouldn't Survive a Day in the Wild West"
"How OPIUM Destroyed China's Greatest Empire"
"What It Was Like to Live with Victorian Social Rules"
"What It Was Like to Be a Victorian Brothel Worker"
"What Victorian Dating Was REALLY Like"
"What It Was Really Like to Be a Caveman"
"What Happened After the Black Death Ended"
"What Life Was Like in the Soviet Union"
"How FRONTIER FAMILIES Survived The Coldest Nights"
"Why You Wouldn't Last 24 Hours in a Victorian House"
"Could You Survive as an American Soldier in World War II"
"Why it Sucked to be a Medieval Plague Survivor"
"What Medieval Princess Life Was REALLY Like"
"What Surviving a Medieval Winter Was Really Like"
"How Rome Conquered Greece"
"The WORST Thing About Being Rich in Medieval Times"
"What It Was Like To Be A Civil War Soldier"
"What if You Woke Up in the Year 536? (The Worst Year Ever)"
"What It Was Like to Be an American Soldier in World War II"
"What It Was Like to Be a British Spitfire Pilot in WWII"
"What It Was Like to Be a Nurse in a WWII Field Hospital"
"What It Was Like to Be a Sailor in the Pacific"
"What It Was Like to Be a Civilian During the Blitz"
"What It Was Like to Work in a WWII Factory"
"What It Was Like to Be a Spy in Wartime Europe"
"What It Was Like to Be a Prisoner of War in WWII"
"What It Was Like to Come Home After the War"
"What It Was Like to Grow Up During World War II"
"What It Was Like to Be a German Soldier on the Eastern Front"
"What It Was Like to Be a Soviet Tank Crewman"
"What It Was Like to Be a Paratrooper on D-Day"
"What It Was Like to Live in Occupied France"
"What It Was Like to Be a Japanese Soldier in the Pacific"
"What It Was Like to Be a WWII War Correspondent"
"What It Was Like to Be a Codebreaker at Bletchley Park"
"What It Was Like to Be a Pilot in the Pacific War"
"What It Was Like to Be a Woman on the Home Front"
"What It Was Like to Be a Refugee During WWII"
`;

export const PROMPT_F_THUMBNAIL_PROMPTS = `
You are a professional YouTube thumbnail concept artist and creative director. Your task is to generate 3 production-ready thumbnail prompts that are cinematic, emotionally resonant, and tell a story in a single frame. Return ONLY JSON matching the required schema.

--- STYLE SPEC (MANDATORY - PASTE VERBATIM) ---
"A **high-contrast, graphic cartoon-style digital illustration** with a **vintage 1940s wartime aesthetic**, reminiscent of old political cartoons or propaganda posters. **Strong black outlines**, **flat cel-shaded colors**, **minimal color gradation**. **Muted earth tones** (browns, tans, olive greens, grays) with **warm skin tones**. **Dramatic, directional lighting** that creates **deep shadows** (e.g., under hat brims and along jawlines) and **crisp highlights** to emphasize tension. Optional **subtle paper grain** and **light cross-hatching/stippling** in shadows for an aged ink-and-color feel. **Expressive but non-comedic faces** (wide eyes, tense brows, a bead of sweat). **Clean white background** with slight vintage texture and a **clear left third** reserved for text in bold serif:
**{{brand_text_block}}**
Keep backgrounds simple (e.g., faint silhouettes, lamppost, smoke), strictly avoid gore or modern elements."

--- CREATIVE DIRECTION (MANDATORY) ---
*   **EMOTIONAL FOCUS:** The primary goal is to capture a powerful human emotion. Prioritize **dramatic close-up shots** of faces showing clear emotions like fear, shock, determination, or exhaustion.
*   **STORYTELLING BACKGROUND:** The background must add a layer to the story. Instead of a simple silhouette, create a dynamic but desaturated scene (e.g., a "torn, bombed cityscape," "faint silhouettes of landing craft," "a plane flying overhead"). The background supports the character's emotion.
*   **CINEMATIC COMPOSITION:** The main character must be on the **right side**, with their expression as the focal point. Use dramatic contrast and lighting to draw the viewer's eye. The **left third** MUST remain clear for the text block.
*   **RELEVANT PROPS:** Include one key WW2-appropriate prop that is directly tied to the video's headings (e.g., a ration book, a gas mask, an evacuation tag, a flickering radio).

--- OUTPUT SCHEMA (MANDATORY) ---
\`\`\`json
{"prompts":[{"label":"string","prompt":"string"},{"label":"string","prompt":"string"},{"label":"string","prompt":"string"}]}
\`\`\`

--- FEW-SHOT EXAMPLE ---
Input:
- Title: "What It Was Like to Be a Spy in WW2"
- Headings: ["Recruitment and Cover Stories", "Dead Drops, Codes, and Radios"]
Output (1 of 3 prompts):
{
    "label": "Covert Ops",
    "prompt": "A high-contrast, graphic cartoon-style digital illustration... [STYLE SPEC VERBATIM] ... Scene: An intense close-up on the right side of a WW2 spy's face, half-swallowed in shadow from his fedora. His eyes are wide with tension, scanning just past the viewer. A single bead of sweat rolls down his temple. In the dimly lit background, the faint, desaturated silhouette of a guarded checkpoint with a single streetlamp provides a sense of imminent danger. The left third of the image is a clean, textured white, reserved for the text block."
}

--- USER INPUT ---
Title: {{title}}
Headings (first 2–3): {{headings}}
Text block: {{brand_text_block}}

--- TASK ---
Produce 3 distinct prompts labeled “Neutral”, “Cinematic”, and “Covert Ops”. Each prompt must integrate the “Style Spec” (verbatim, including the text block), follow the creative direction, and set a powerful, emotionally-driven scene tied to the headings. Return only the valid JSON.
`;


export const PROMPT_G_THUMBNAIL_REFINEMENT = `
You are a professional YouTube thumbnail concept artist, and your task is to refine a set of existing thumbnail prompts based on new creative director feedback. Your goal is to generate 3 NEW prompts that incorporate the feedback while maintaining the core style. Return ONLY JSON.

--- STYLE SPEC (MANDATORY - PASTE VERBATIM INTO EACH NEW PROMPT) ---
"A **high-contrast, graphic cartoon-style digital illustration** with a **vintage 1940s wartime aesthetic**, reminiscent of old political cartoons or propaganda posters. **Strong black outlines**, **flat cel-shaded colors**, **minimal color gradation**. **Muted earth tones** (browns, tans, olive greens, grays) with **warm skin tones**. **Dramatic, directional lighting** that creates **deep shadows** (e.g., under hat brims and along jawlines) and **crisp highlights** to emphasize tension. Optional **subtle paper grain** and **light cross-hatching/stippling** in shadows for an aged ink-and-color feel. **Expressive but non-comedic faces** (wide eyes, tense brows, a bead of sweat). **Clean white background** with slight vintage texture and a **clear left third** reserved for text in bold serif:
**{{brand_text_block}}**
Keep backgrounds simple (e.g., faint silhouettes, lamppost, smoke), strictly avoid gore or modern elements."

--- CONTEXT ---
Original Title: {{title}}
Original Headings: {{headings}}

--- PREVIOUS PROMPTS ---
{{previous_prompts}}

--- NEW CREATIVE FEEDBACK ---
"{{user_feedback}}"

--- TASK ---
Carefully analyze the new creative feedback. Generate **3 completely new prompts** ("Neutral", "Cinematic", "Covert Ops") that integrate this feedback. For example, if the feedback is "make it a close-up on the child's face, show a bombed city in the background," you must create new scenes reflecting this. Do not just slightly edit the previous prompts; re-imagine them based on the new direction.

*   Each new prompt must be a complete, self-contained description.
*   Each new prompt must include the verbatim "STYLE SPEC".
*   Each new prompt must follow the core rules: character on the right, left third reserved for text, emotional focus.

--- OUTPUT SCHEMA (MANDATORY) ---
\`\`\`json
{"prompts":[{"label":"string","prompt":"string"},{"label":"string","prompt":"string"},{"label":"string","prompt":"string"}]}
\`\`\`

Now, generate the 3 new, refined prompts based on the feedback. Return only the valid JSON.
`;

export const PROMPT_H_IMAGE_PROMPTS = `
You are a creative director and prompt engineer specializing in painterly, atmospheric art. Your task is to transform a script into a detailed visual storyboard, where each image is a powerful, frozen moment that directly corresponds to a specific, small piece of the narrative.

--- MASTER IMAGE STYLE (MANDATORY) ---
A highly atmospheric and detailed oil painting in the style of late 19th / early 20th-century painterly realism. The scene features expressive, visible brushwork and a dramatic use of chiaroscuro lighting, with warm, glowing light sources casting deep, soft shadows. The mood is evocative and cinematic, set within the WWII era.

--- INPUT SCRIPT SECTIONS ---
{{SCRIPT_CONTEXT}}

--- YOUR TASK ---
Follow this exact three-step process:

### STEP 1: Script Segmentation
Analyze the provided 'SCRIPT_CONTEXT'. Break down the entire script into a sequence of small, narratively coherent text chunks. Each chunk should be roughly 1-2 sentences (approx. 20-30 words), corresponding to about 10-15 seconds of narration. It is CRITICAL that you process the script sequentially and DO NOT SKIP ANY text. The text chunks must cover the entire script from beginning to end.

### STEP 2: Prompt Generation for Each Segment
For EACH text chunk you identified in Step 1, generate a unique, corresponding image prompt. You are REQUIRED to generate EXACTLY **{{TARGET_PROMPT_COUNT}}** distinct image prompts to ensure full visual coverage.

***Key Rules for Prompt Generation:***
1.  **CRITICAL - Direct Narrative Correlation:** Each prompt MUST be a direct visual translation of its corresponding text chunk. If the text says "the cold has finally found its way through your wool blanket," the prompt must depict that specific moment (e.g., a soldier shivering under a thin blanket in a foxhole), not a generic winter scene. This is the most important rule.
2.  **Prefix with Master Style:** Every single prompt you generate MUST begin with the full, verbatim "MASTER IMAGE STYLE" definition provided above.
3.  **Standalone Prompts:** Each prompt must be self-contained and descriptive enough to generate the image on its own.
4.  **Static Composition & Cinematic Framing (CRITICAL):** Prompts must describe a still image. All prompts MUST describe wide-angle, establishing, or medium shots with compelling composition (e.g., 'dramatic low-angle shot,' 'wide establishing shot showing the scale of the forest,' 'medium shot from behind the soldier, looking out of the foxhole'). You are **STRICTLY FORBIDDEN** from generating close-up shots of faces. Focus on body language, the environment, and the character's relationship to their surroundings to convey emotion.
5.  **Historical Accuracy:** All visual elements must be historically accurate to the WWII period (late 1930s-1940s).
6.  **Maintain Continuity:** Ensure visual elements (like the type of forest, the soldier's gear) are consistent from one prompt to the next.
7.  **Purposeful Action:** Characters should be engaged in natural, narrative-relevant actions (e.g., "huddling for warmth," "checking their equipment," "looking towards a distant sound"). Do not show characters posing for the camera.

### STEP 3: Final Output Format
You must provide your response as a single, valid JSON array of objects. Do not include any other text, explanations, or markdown formatting before or after the JSON array. Each object in the array represents one image prompt and must have three keys: "scene", "text", and "prompt". Ensure all strings in the JSON are correctly escaped and terminated.
- "scene": Formatted as "Scene_X" where X is a sequential number starting from 1.
- "text": The exact script chunk from Step 1 that this prompt visualizes.
- "prompt": The full, final image prompt generated in Step 2.

**Example JSON Output Structure:**
\`\`\`json
[
  {
    "scene": "Scene_1",
    "text": "The quiet doesn't last. The peace you felt was temporary, a borrowed moment.",
    "prompt": "A highly atmospheric and detailed oil painting in the style of late 19th / early 20th-century painterly realism. The scene features expressive, visible brushwork and a dramatic use of chiaroscuro lighting, with warm, glowing light sources casting deep, soft shadows. The mood is evocative and cinematic, set within the WWII era. A wide establishing shot of a snow-blanketed Ardennes pine forest under a heavy, dark predawn sky. The mood is one of fragile, temporary calm, with the deep shadows between the trees suggesting an underlying tension."
  },
  {
    "scene": "Scene_2",
    "text": "Now, it's the pre-dawn hours of December 16th. And something has changed.",
    "prompt": "A highly atmospheric and detailed oil painting in the style of late 19th / early 20th-century painterly realism. The scene features expressive, visible brushwork and a dramatic use of chiaroscuro lighting, with warm, glowing light sources casting deep, soft shadows. The mood is evocative and cinematic, set within the WWII era. A medium shot from outside a shallow foxhole. The air is visibly cold, with a palpable sense of unease. The scene is still, but the lighting suggests an imminent, unseen shift."
  }
]
\`\`\`

Now, analyze the provided script sections and generate the prompts according to all instructions.
`;
