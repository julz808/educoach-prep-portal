# 📋 Generation Commands - Copy & Paste

## Quick Reference: Generate Remaining Questions

Just copy and paste these commands into your terminal (make sure you're in the `educoach-prep-portal-2` directory).

---

## 🎯 **Individual Test Products**

### **Test 1: EduTest Scholarship** (6 questions - EASIEST, START HERE)
```bash
./scripts/generation/generate-all-edutest-scholarship.sh
```
**Time:** ~3-5 minutes
**Sections:** Verbal Reasoning (4), Numerical Reasoning (2)

---

### **Test 2: NSW Selective** (8 questions)
```bash
./scripts/generation/generate-all-nsw-selective.sh
```
**Time:** ~3-5 minutes
**Sections:** Reading (1), Mathematical Reasoning (2), Thinking Skills (5)

---

### **Test 3: ACER Scholarship** (30 questions)
```bash
./scripts/generation/generate-all-acer-scholarship.sh
```
**Time:** ~8-12 minutes
**Sections:** Humanities (25), Mathematics (5)

---

### **Test 4: Year 5 NAPLAN** (33 questions)
```bash
./scripts/generation/generate-all-year5-naplan.sh
```
**Time:** ~10-15 minutes
**Sections:** Reading (18), Language Conventions (15)

---

### **Test 5: Year 7 NAPLAN** (53 questions)
```bash
./scripts/generation/generate-all-year7-naplan.sh
```
**Time:** ~15-20 minutes
**Sections:** Reading (43), Language Conventions (5), Numeracy Calculator (5)

---

### **Test 6: VIC Selective** (98 questions - LARGEST GAP)
```bash
./scripts/generation/generate-all-vic-selective.sh
```
**Time:** ~25-35 minutes
**Sections:** Reading Reasoning (69), Mathematics Reasoning (9), General Ability - Verbal (13), General Ability - Quantitative (7)

---

## 🚀 **Generate Everything at Once** (All 228 questions)

```bash
./scripts/generation/generate-all-remaining.sh
```
**Time:** ~45-60 minutes total
**Generates all 6 test products in order**

---

## 📊 Summary Table

| Command | Questions | Time | Priority |
|---------|-----------|------|----------|
| `./scripts/generation/generate-all-edutest-scholarship.sh` | 6 | 3-5 min | ⭐ Start here |
| `./scripts/generation/generate-all-nsw-selective.sh` | 8 | 3-5 min | ⭐ Quick |
| `./scripts/generation/generate-all-acer-scholarship.sh` | 30 | 8-12 min | ⭐⭐ Medium |
| `./scripts/generation/generate-all-year5-naplan.sh` | 33 | 10-15 min | ⭐⭐ Medium |
| `./scripts/generation/generate-all-year7-naplan.sh` | 53 | 15-20 min | ⭐⭐⭐ Large |
| `./scripts/generation/generate-all-vic-selective.sh` | 98 | 25-35 min | ⭐⭐⭐ Largest |
| `./scripts/generation/generate-all-remaining.sh` | **228** | **45-60 min** | **ALL** |

---

## ✅ After Running

### Check completion:
```bash
npx tsx scripts/audit/detailed-gap-analysis.ts
```

### View reports:
```bash
ls -lt docs/generation-reports/ | head -10
```

---

## 💡 Recommended Approach

**Option 1: Start Small (Recommended)**
```bash
# Test first (6 questions, 3-5 min)
./scripts/generation/generate-all-edutest-scholarship.sh

# Then check it worked
ls -lt docs/generation-reports/ | head -5
```

**Option 2: Do Everything**
```bash
./scripts/generation/generate-all-remaining.sh
```

---

## 🔧 If You Get an Error

Make sure scripts are executable:
```bash
chmod +x scripts/generation/*.sh
```

---

*Last updated: February 20, 2026*
