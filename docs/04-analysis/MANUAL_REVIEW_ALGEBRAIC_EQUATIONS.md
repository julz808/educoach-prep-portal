# Manual Review: Algebraic Equations & Problem Solving

**Reviewer**: Claude (Independent Manual Calculation)
**Date**: March 24, 2026
**Questions Reviewed**: 10 (first batch of 30)

---

## Q1: Bird Population Conservation
**Question**: Population starts at 240, increases by x each month for 5 months, then 60 migrate away leaving 280.
Equation: 240 + 5x - 60 = 280

**My Solution**:
240 + 5x - 60 = 280
180 + 5x = 280
5x = 100
x = 20

**MY ANSWER**: 20
**STORED**: B (20)
**RESULT**: ✅ CORRECT

---

## Q2: Streaming Service Fees
**Question**: Emma rented 4 movies, paid $23. Then rented 7 movies, paid $32. Find subscription fee.

**My Solution**:
Let f = fixed subscription fee, m = cost per movie
Equation 1: f + 4m = 23
Equation 2: f + 7m = 32

Subtract equation 1 from equation 2:
3m = 9
m = 3

Substitute back: f + 4(3) = 23
f + 12 = 23
f = 11

**MY ANSWER**: $11
**STORED**: C ($11)
**RESULT**: ✅ CORRECT

---

## Q3: Team Donations
**Question**: Initial $120 donation + 8 equal member donations = $280 total

**My Solution**:
120 + 8x = 280
8x = 160
x = 20

**MY ANSWER**: $20
**STORED**: B ($20)
**RESULT**: ✅ CORRECT

---

## Q4: Dolphin Population
**Question**: Population increases by 12 each week. After 4 weeks there are 68 dolphins. Find initial.

**My Solution**:
Let initial = x
x + 4(12) = 68
x + 48 = 68
x = 20

**MY ANSWER**: 20
**STORED**: B (20)
**RESULT**: ✅ CORRECT

---

## Q5: Museum Entrance
**Question**: 32 = f + 4e, where f = $12 (entrance), e = cost per exhibit

**My Solution**:
32 = 12 + 4e
20 = 4e
e = 5

**MY ANSWER**: $5
**STORED**: B ($5)
**RESULT**: ✅ CORRECT

---

## Q6: Bacterial Growth
**Question**: P = 50 × 3^h, find h when P = 12,150

**My Solution**:
12,150 = 50 × 3^h
243 = 3^h
3^5 = 243
h = 5

**MY ANSWER**: 5 hours
**STORED**: B (5)
**RESULT**: ✅ CORRECT

---

## Q7: Carpenter's Wood
**Question**: Started with x meters. Used 24m for frame, divided remaining among 7 shelves at 3.5m each

**My Solution**:
x = 24 + 7(3.5)
x = 24 + 24.5
x = 48.5

**MY ANSWER**: 48.5 meters
**STORED**: B (48.5)
**RESULT**: ✅ CORRECT

---

## Q8: Cycling Trip
**Question**: Bike rental $85 + $12 per person = $157 total

**My Solution**:
85 + 12p = 157
12p = 72
p = 6

**MY ANSWER**: 6 people
**STORED**: B (6)
**RESULT**: ✅ CORRECT

---

## Q9: Baker's Cupcakes
**Question**: Gave away 18 to teachers, then divided remaining among 5 classrooms with 12 each

**My Solution**:
Let total = x
x - 18 = 5(12)
x - 18 = 60
x = 78

**MY ANSWER**: 78 cupcakes
**STORED**: B (78)
**RESULT**: ✅ CORRECT

---

## Q10: Robotics Club Membership
**Question**: If 3 join, each pays $8 less. If 2 leave, each pays $12 more. Find current members.

**My Solution**:
Let n = current members, C = total cost

Current: C/n per person
If 3 join: C/(n+3) = C/n - 8
If 2 leave: C/(n-2) = C/n + 12

From first equation: C/(n+3) = C/n - 8
C = (C/n - 8)(n+3)
C = C + 3C/n - 8n - 24
0 = 3C/n - 8n - 24
3C/n = 8n + 24
3C = 8n² + 24n  ... (equation 1)

From second equation: C/(n-2) = C/n + 12
C = (C/n + 12)(n-2)
C = C - 2C/n + 12n - 24
0 = -2C/n + 12n - 24
2C/n = 12n - 24
2C = 12n² - 24n
C = 6n² - 12n  ... (equation 2)

Substitute equation 2 into equation 1:
3(6n² - 12n) = 8n² + 24n
18n² - 36n = 8n² + 24n
10n² = 60n
10n = 60
n = 6

Wait, let me verify: if n=6, then C = 6(6²) - 12(6) = 216 - 72 = 144
Current cost per person: 144/6 = 24
If 3 join (9 people): 144/9 = 16 (which is 24-8 ✓)
If 2 leave (4 people): 144/4 = 36 (which is 24+12 ✓)

Hmm, my answer is 6 but stored is B which should be 10 based on pattern.
Let me recalculate...

Actually wait, the options are A)8, B)10, C)12, D)14, E)None
Let me check n=10:
If n=10, C = 6(100) - 12(10) = 600 - 120 = 480
Current: 480/10 = 48
If 3 join (13): 480/13 = 36.92... (should be 40) ✗

Let me try different approach. Let me check the options:

If n=10:
Current per person: C/10
If 3 join: C/13 = C/10 - 8
C/13 = C/10 - 8
10C = 13C - 1040
-3C = -1040
C = 346.67

Check with leaving equation:
C/8 = C/10 + 12
10C = 8C + 960
2C = 960
C = 480

These don't match, so n≠10.

Let me try n=8:
If 3 join: C/11 = C/8 - 8
8C = 11C - 704
-3C = -704
C = 234.67

If 2 leave: C/6 = C/8 + 12
8C = 6C + 576
2C = 576
C = 288

Don't match.

Let me try n=12:
If 3 join: C/15 = C/12 - 8
12C = 15C - 1440
-3C = -1440
C = 480

If 2 leave: C/10 = C/12 + 12
12C = 10C + 1440
2C = 1440
C = 720

Don't match.

Hmm, this is complex. Let me solve it properly:

From C/(n+3) = C/n - 8:
nC = (n+3)(C - 8n)
nC = nC + 3C - 8n² - 24n
0 = 3C - 8n² - 24n
C = (8n² + 24n)/3

From C/(n-2) = C/n + 12:
nC = (n-2)(C + 12n)
nC = nC - 2C + 12n² - 24n
0 = -2C + 12n² - 24n
C = 6n² - 12n

Equating:
(8n² + 24n)/3 = 6n² - 12n
8n² + 24n = 18n² - 36n
0 = 10n² - 60n
0 = 10n(n - 6)
n = 6 or n = 0

n = 6 is the answer but stored says B=10!

Let me verify n=6 once more with C=6(36)-12(6)=216-72=144:
Current: 144/6 = 24
With 3 more (9 people): 144/9 = 16 = 24-8 ✓
With 2 fewer (4 people): 144/4 = 36 = 24+12 ✓

My answer is definitely 6, but stored says 10.

**MY ANSWER**: 6
**STORED**: B - But if B=10, this is WRONG!
**RESULT**: ❌ **POTENTIAL ERROR** - Need to check what option B actually represents

Let me check if maybe the options are different order or B=6...

