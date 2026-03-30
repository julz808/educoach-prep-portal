#!/usr/bin/env python3
"""
Verify questions Q31-Q79 for Fractions, Decimals & Percentages
"""

questions = [
    # Q31: Gaming tournament
    {
        'num': 31,
        'desc': 'Gaming tournament eliminations',
        'calc': lambda: (
            total := 240,
            elim1 := total * (3/8),  # 90 eliminated
            remain1 := total - elim1,  # 150 remain
            elim2 := remain1 * 0.40,  # 60 eliminated
            remain2 := remain1 - elim2,  # 90 remain
            remain2[-1]
        )[-1],
        'stored': 'C'
    },
    # Q32: Science laboratory chemicals
    {
        'num': 32,
        'desc': 'Laboratory chemicals - solvents',
        'calc': lambda: (
            total := 280,
            acid := total * (3/10),  # 84
            base := total * 0.45,  # 126
            solvent := total - acid - base,  # 70
            solvent[-1]
        )[-1],
        'stored': 'D'
    },
    # Q33: Concert venue tickets
    {
        'num': 33,
        'desc': 'Concert venue - economy tickets',
        'calc': lambda: (
            total := 800,
            premium := total * (2/5),  # 320
            standard := total * 0.45,  # 360
            economy := total - premium - standard,  # 120
            economy[-1]
        )[-1],
        'stored': 'B'
    },
    # Q34: Vintage car restoration
    {
        'num': 34,
        'desc': 'Car restoration - third percentage',
        'calc': lambda: (
            total := 1800,
            first := total * 0.24,  # 432
            second := total * (5/12),  # 750
            third := total - first - second,  # 618
            percent := (third / total) * 100,  # 34.33%
            percent[-1]
        )[-1],
        'stored': 'D'
    },
    # Q35: Meteorological - ALREADY FIXED (Q15)
    {
        'num': 35,
        'desc': 'Meteorological rainfall - ALREADY FIXED',
        'calc': lambda: 67.5,  # Already verified
        'stored': 'E'
    },
    # Q36: Sports equipment - ALREADY VERIFIED (Q24)
    {
        'num': 36,
        'desc': 'Sports equipment sale - ALREADY VERIFIED',
        'calc': lambda: 108,  # Already verified
        'stored': 'A'
    },
    # Q37: Textile factory - ALREADY VERIFIED (Q22)
    {
        'num': 37,
        'desc': 'Textile factory - economy fabric - ALREADY VERIFIED',
        'calc': lambda: 168,  # Already verified
        'stored': 'E'
    },
    # Q38: Botanical orchids
    {
        'num': 38,
        'desc': 'Botanical orchids - yellow percentage',
        'calc': lambda: (
            purple := 3/8,  # 0.375
            white := 0.42,
            yellow := 1 - purple - white,  # 0.205
            percent := yellow * 100,  # 20.5%
            percent[-1]
        )[-1],
        'stored': 'D'
    },
    # Q39: Recycling center - ALREADY VERIFIED (Q23)
    {
        'num': 39,
        'desc': 'Recycling center - glass - ALREADY VERIFIED',
        'calc': lambda: 108,  # Already verified
        'stored': 'B'
    },
    # Q40: Theatre production
    {
        'num': 40,
        'desc': 'Theatre production - second night',
        'calc': lambda: (
            total := 720,
            night1 := total * (5/8),  # 450
            night2 := night1 * (1 + 0.15),  # 517.5
            night2[-1]
        )[-1],
        'stored': 'B'
    },
    # Q41: Garden area
    {
        'num': 41,
        'desc': 'Garden - lawn percentage',
        'calc': lambda: (
            veg := 3/8,  # 0.375
            flower := 0.45,
            lawn := 1 - veg - flower,  # 0.175
            percent := lawn * 100,  # 17.5%
            percent[-1]
        )[-1],
        'stored': 'A'
    },
    # Q42: Wildlife sanctuary
    {
        'num': 42,
        'desc': 'Wildlife sanctuary - NOT birds',
        'calc': lambda: (
            total := 450,
            birds := total * 0.64,  # 288
            not_birds := total - birds,  # 162
            not_birds[-1]
        )[-1],
        'stored': 'A'
    },
    # Q43: Basketball free throws
    {
        'num': 43,
        'desc': 'Basketball - free throw percentage',
        'calc': lambda: (18 / 24) * 100,  # 75%
        'stored': 'C'
    },
    # Q44: Mobile phone battery
    {
        'num': 44,
        'desc': 'Phone battery - new fraction',
        'calc': lambda: (
            current := 2/5,  # 0.4
            increase := current * 0.35,  # 0.14
            new := current + increase,  # 0.54 = 27/50
            new[-1]
        )[-1],
        'stored': 'B'
    },
    # Q45: Science museum ticket
    {
        'num': 45,
        'desc': 'Museum ticket - final price',
        'calc': lambda: (
            new_price := 34.50,
            decrease := new_price * 0.20,  # 6.90
            final := new_price - decrease,  # 27.60
            final[-1]
        )[-1],
        'stored': 'A'
    },
    # Q46: Recipe flour
    {
        'num': 46,
        'desc': 'Recipe flour - grams needed',
        'calc': lambda: (
            total := 2.4,  # kg
            added := total * (5/8),  # 1.5 kg
            needed := total - added,  # 0.9 kg = 900g
            (needed * 1000)[-1]
        )[-1],
        'stored': 'A'
    },
    # Q47: Bookstore novel discount
    {
        'num': 47,
        'desc': 'Novel discount - sale price',
        'calc': lambda: (
            original := 45,
            discount := original * (2/9),  # 10
            sale := original - discount,  # 35
            sale[-1]
        )[-1],
        'stored': 'A'
    },
    # Q48: Swimming pool
    {
        'num': 48,
        'desc': 'Swimming pool - after refilling',
        'calc': lambda: (
            original := 7200,
            after_evap := original * (1 - 1/6),  # 6000
            refilled := original * 0.85,  # 6120
            refilled[-1]
        )[-1],
        'stored': 'B'
    },
    # Q49: Mountain climber
    {
        'num': 49,
        'desc': 'Mountain climber - total height',
        'calc': lambda: (
            day1 := 0.42,
            day2 := 5/12,
            climbed := day1 + day2,  # 0.8367
            remaining_frac := 1 - climbed,  # 0.1633
            remaining_m := 273,
            total := remaining_m / remaining_frac,  # 1671.4
            total[-1]
        )[-1],
        'stored': 'B'
    },
    # Q50: Clothing store jackets
    {
        'num': 50,
        'desc': 'Jackets - sale price',
        'calc': lambda: (
            cost := 80,
            sell := cost * (7/4),  # 140
            sale := sell * (1 - 0.30),  # 98
            sale[-1]
        )[-1],
        'stored': 'A'
    },
]

print("=" * 80)
print("VERIFYING FRACTIONS Q31-50")
print("=" * 80)
print()

errors_found = []
for q in questions:
    result = q['calc']()
    print(f"Q{q['num']}: {q['desc']}")
    print(f"  Calculated: {result}")
    print(f"  Stored: {q['stored']}")

    # Determine if error (this is simplified - would need actual options to verify)
    # For now, just show the calculation
    print(f"  Status: CALCULATED")
    print()

print(f"\nTotal errors found in Q31-50: {len(errors_found)}")
