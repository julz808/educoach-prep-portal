# Debug Instructions - Get Console Logs

I've deployed enhanced logging to help diagnose both remaining issues. Please follow these steps:

---

## 🔍 How to Get Console Logs

### Step 1: Open Developer Tools
- **Chrome/Edge**: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
- **Firefox**: Press `F12`
- **Safari**: Press `Cmd+Option+C`

### Step 2: Go to Console Tab
Click the "Console" tab in the developer tools

### Step 3: Clear Previous Logs
Click the "🚫 Clear console" button (or press `Ctrl+L`)

---

## 📝 Test #1: Writing Assessment

### Steps:
1. **Clear console** (very important!)
2. Start any **writing drill** (Narrative, Persuasive, etc.)
3. Write **at least 50 words** (a proper test, not just "2 words")
4. Submit the test
5. Wait for the assessment to complete
6. **Copy ALL console logs** and send them to me

### What I'm Looking For:
Look for these specific log lines:
- `🔐 Session check:` - Should say "User authenticated"
- `🔄 Attempting Supabase Edge Function...`
- `📤 Sending to Edge Function:` - Should show your response details
- `📥 Edge Function raw response:` - **This is the most important one!**
- Either:
  - `✅ Supabase Edge Function successful` (GOOD)
  - `❌ Supabase Edge Function failed with error:` (This will show the error)

---

## 📖 Test #2: Reading Passage Grouping

### Steps:
1. **Clear console** (very important!)
2. Start a **Reading, Comprehension, or Humanities** section
3. Wait for questions to load
4. **Copy ALL console logs** that start with `📖 READING:`
5. Send them to me

### What I'm Looking For:
Look for these log lines:
- `📖 READING: Organizing questions by passage`
- `📖 Q1: passageId=XXXXXXXX` (should show passage IDs for each question)
- `📖 READING: Questions WITH passageId:` (how many have IDs)
- `📖 READING: Questions WITHOUT passageId:` (how many don't)
- `📖 READING: Final question order:` (shows final grouping)

**Key Question**: Do ALL reading questions have a passageId, or are some showing `passageId=NONE`?

---

## 📋 What to Send Me

### For Writing Assessment:
```
FULL console output including:
- All 🔐 🔄 📤 📥 ✅ or ❌ messages
- Any error messages in red
- The full error details if it fails
```

### For Passage Grouping:
```
All lines that start with:
📖 READING:
```

---

## 🎯 Example of What Good Logs Look Like

### Writing Assessment (Success):
```
🔐 Session check: User authenticated
🔄 Attempting Supabase Edge Function...
📤 Sending to Edge Function: {userResponseLength: 245, rubricName: "Narrative Writing", ...}
📥 Edge Function raw response: {hasError: false, hasData: true, ...}
✅ Supabase Edge Function successful
✅ Assessment processed: {totalScore: 15, maxScore: 20, percentage: 75}
```

### Writing Assessment (Failure - this is what we need to see):
```
🔐 Session check: User authenticated
🔄 Attempting Supabase Edge Function...
📤 Sending to Edge Function: {userResponseLength: 245, rubricName: "Narrative Writing", ...}
📥 Edge Function raw response: {hasError: true, hasData: false, error: {...}}
❌ Supabase Edge Function failed with error: {...}
❌ Full error details: "..." <-- THIS IS WHAT I NEED
```

### Passage Grouping (Good):
```
📖 READING: Organizing questions by passage for Humanities
📖 READING: Total questions before grouping: 35
📖 Q1: passageId=a1b2c3d4, text="Based on the passage about climate..."
📖 Q2: passageId=a1b2c3d4, text="The author's main argument is..."
📖 Q3: passageId=a1b2c3d4, text="Which evidence supports..."
📖 Q4: passageId=e5f6g7h8, text="According to the second passage..."
...
📖 READING: Questions WITH passageId: 35
📖 READING: Questions WITHOUT passageId: 0
📖 READING: Organized into 4 passage groups
```

### Passage Grouping (Problem - missing IDs):
```
📖 READING: Organizing questions by passage for Humanities
📖 Q1: passageId=a1b2c3d4, text="..."
📖 Q2: passageId=NONE, text="..." <-- PROBLEM: Missing passageId
📖 Q3: passageId=a1b2c3d4, text="..."
...
📖 READING: Questions WITH passageId: 20
📖 READING: Questions WITHOUT passageId: 15 <-- PROBLEM: Some questions missing IDs
```

---

## ⏱️ Timing

Wait **~5 minutes** after I deploy (the push just went through), then:
1. Hard refresh your site (Ctrl+Shift+R or Cmd+Shift+R)
2. Run the tests above
3. Copy and send me the console logs

---

## 🚨 Important Notes

- **Write a proper response** (50+ words) for the writing test, not just "2 words"
- **Clear the console before each test** so I only see relevant logs
- **Copy the ENTIRE console output**, not just parts of it
- If you see red error messages, those are especially important!

---

Once I see the logs, I'll know exactly what's failing and can fix it immediately! 🎯
