"""
Eclats of Lumiere - Simulador do nucleo de combate v1 (Map 1 / early game)
Estrutura aprovada:
- Mob HP:   hp(L)  = 10 * 1.04^(L-1)            [mantido do BALANCE]
- Mob DMG:  dmg(L) = mobBaseDmg * dmgRamp^(L-1) [NOVO - curva propria, desacoplada do HP]
- Player DMG = baseDmg * str_total * level_bonus * conv_factor
- Player HP  = baseHp  * vit_total * level_bonus * conv_factor  [conv aplicado ao HP - correcao]
- Convergence: portao Gaiadon (cap de hero level); pontos = maior subarea alcancada na run
- Morte: knockback (sim: nao avanca / recua), sem perda
"""
import math

# ---------------- parametros (v1 proposto) ----------------
P = dict(
    baseHp=10.0, hpRamp=1.04,            # mob HP
    mobBaseDmg=1.0, dmgRamp=1.015,       # mob dano (NOVO)
    bossHpMult=15.0, bossDmgMult=3.0,
    baseDmg=7.0, baseAPS=0.40,
    playerBaseHp=50.0, regenPct=0.01, regenOnKillPct=0.02,
    goldRatio=0.10, xpRatio=0.08,
    statCostBase=10.0, statCostRamp=1.15,
    strPerLvl=0.08, vitPerLvl=0.06,
    milestones={10: 2.0, 25: 2.5, 50: 3.0, 100: 4.0},
    levelBonusK=0.20,
    xpBase=50.0, xpRamp=1.25,
    capBase=10, capStep=5,               # cap de hero level por convergence
    convPointBonus=0.15,                 # +15% por ponto de convergence (aditivo entre si)
    killThresholdSub5=100,
)

SUBS = [  # (lvl_min, lvl_max, pack)
    (1, 50, 1), (51, 100, 2), (101, 150, 4), (151, 200, 6), (201, 250, 8),
]

def mob_hp(L):  return P['baseHp'] * P['hpRamp'] ** (L - 1)
def mob_dmg(L): return P['mobBaseDmg'] * P['dmgRamp'] ** (L - 1)

def stat_total(level, per_lvl):
    m = 1.0
    for k, v in P['milestones'].items():
        if level >= k: m *= v
    return (1 + level * per_lvl) * m

def stat_cost(level):  # custo do proximo nivel
    return P['statCostBase'] * P['statCostRamp'] ** level

def level_bonus(hero_lvl):
    return 1 + math.sqrt(hero_lvl) * P['levelBonusK']

def xp_to_level(n):
    return P['xpBase'] * P['xpRamp'] ** n

# ---------------- estado ----------------
class S:
    def __init__(self):
        self.t = 0.0
        self.lumens = 0.0
        self.str_l = 0; self.vit_l = 0
        self.hero_lvl = 1; self.xp = 0.0
        self.conv = 0; self.conv_points = 0
        self.sub = 0          # indice da subarea atual (0-4)
        self.best_sub = 0     # maior subarea alcancada nesta run
        self.kills_sub5 = 0
        self.boss_active = False; self.boss_hp = 0.0
        self.map_cleared_runs = 0
        self.log = []

    def conv_factor(self): return 1 + P['convPointBonus'] * self.conv_points
    def cap(self): return P['capBase'] + P['capStep'] * self.conv

    def dmg_per_hit(self):
        return P['baseDmg'] * stat_total(self.str_l, P['strPerLvl']) * level_bonus(self.hero_lvl) * self.conv_factor()
    def dps(self): return self.dmg_per_hit() * P['baseAPS']
    def hp_max(self):
        return P['playerBaseHp'] * stat_total(self.vit_l, P['vitPerLvl']) * level_bonus(self.hero_lvl) * self.conv_factor()

def incoming_dps(st, sub_idx, with_boss=False):
    lo, hi, pack = SUBS[sub_idx]
    L = (lo + hi) / 2
    inc = pack * mob_dmg(L)
    if with_boss: inc += mob_dmg(hi) * P['bossDmgMult']
    return inc

def sustain_dps(st, kill_rate):
    return st.hp_max() * P['regenPct'] + st.hp_max() * P['regenOnKillPct'] * kill_rate

def survivable(st, sub_idx, with_boss=False, margin=1.0):
    lo, hi, pack = SUBS[sub_idx]
    L = (lo + hi) / 2
    kt = mob_hp(L) / max(st.dps(), 1e-9)
    kr = 1.0 / max(kt, 0.1)
    return sustain_dps(st, kr) * margin >= incoming_dps(st, sub_idx, with_boss)

# ---------------- loop ----------------
def buy_stats(st):
    # estrategia: manter kill time <= 6s (str) e sobrevivencia (vit); senao, o mais barato
    for _ in range(200):
        lo, hi, pack = SUBS[st.sub]
        L = (lo + hi) / 2
        kt = mob_hp(L) / max(st.dps(), 1e-9)
        need_str = kt > 6.0
        need_vit = not survivable(st, st.sub, st.boss_active, margin=1.2)
        cs, cv = stat_cost(st.str_l), stat_cost(st.vit_l)
        pick = None
        if need_vit and st.lumens >= cv: pick = 'vit'
        elif need_str and st.lumens >= cs: pick = 'str'
        elif st.lumens >= min(cs, cv) * 4:      # sobra: investe no mais barato
            pick = 'str' if cs <= cv else 'vit'
        if pick == 'str': st.lumens -= cs; st.str_l += 1
        elif pick == 'vit': st.lumens -= cv; st.vit_l += 1
        else: break

def step(st, dt):
    lo, hi, pack = SUBS[st.sub]
    L = (lo + hi) / 2
    if st.boss_active:
        dmg = st.dps() * dt
        st.boss_hp -= dmg
        if st.boss_hp <= 0:
            st.boss_active = False
            st.map_cleared_runs += 1
            st.lumens += mob_hp(hi) * P['goldRatio'] * 5
            gain_xp(st, mob_hp(hi) * P['xpRatio'] * 5)
        return
    kt = mob_hp(L) / max(st.dps(), 1e-9)
    kills = dt / kt
    st.lumens += kills * mob_hp(L) * P['goldRatio']
    gain_xp(st, kills * mob_hp(L) * P['xpRatio'])
    if st.sub == 4:
        st.kills_sub5 += kills
        if st.kills_sub5 >= P['killThresholdSub5'] and st.map_cleared_runs == 0:
            st.boss_active = True
            st.boss_hp = mob_hp(hi) * P['bossHpMult']

def gain_xp(st, amount):
    if st.hero_lvl >= st.cap(): return
    st.xp += amount
    while st.hero_lvl < st.cap() and st.xp >= xp_to_level(st.hero_lvl):
        st.xp -= xp_to_level(st.hero_lvl)
        st.hero_lvl += 1

def try_advance(st):
    if st.sub < 4:
        nxt = st.sub + 1
        lo, hi, pack = SUBS[nxt]
        L = (lo + hi) / 2
        kt = mob_hp(L) / max(st.dps(), 1e-9)
        if kt <= 15.0 and survivable(st, nxt, margin=1.1):
            st.sub = nxt
            st.best_sub = max(st.best_sub, nxt)

def converge(st):
    st.conv += 1
    st.conv_points += (st.best_sub + 1)   # pontos = maior subarea alcancada (1-5)
    st.log.append(dict(conv=st.conv, t=st.t, hero=st.hero_lvl,
                       points=st.conv_points, best_sub=st.best_sub + 1,
                       str_l=st.str_l, vit_l=st.vit_l))
    st.lumens = 0.0; st.str_l = 0; st.vit_l = 0
    st.sub = 0; st.best_sub = 0; st.kills_sub5 = 0
    st.boss_active = False; st.map_cleared_runs = 0

def run(max_days=30, max_conv=8):
    st = S()
    dt = 2.0
    while st.t < max_days * 86400 and st.conv < max_conv:
        st.t += dt
        step(st, dt)
        if int(st.t) % 10 < dt:
            buy_stats(st); try_advance(st)
        # portao: bateu o cap de hero level -> converge (apos ter pelo menos chegado na sub 2)
        if st.hero_lvl >= st.cap() and st.xp >= xp_to_level(st.hero_lvl) * 0.0 and st.best_sub >= 1:
            # exigir que o xp realmente travou (cap atingido)
            converge(st)
    return st

if __name__ == '__main__':
    st = run()
    print(f"{'Conv':>4} {'tempo':>10} {'hero':>5} {'pts':>4} {'best sub':>8} {'str':>4} {'vit':>4}")
    for e in st.log:
        h = e['t'] / 3600
        tt = f"{h*60:.0f} min" if h < 1.5 else f"{h:.1f} h"
        print(f"{e['conv']:>4} {tt:>10} {e['hero']:>5} {e['points']:>4} {e['best_sub']:>8} {e['str_l']:>4} {e['vit_l']:>4}")
    print(f"\nTempo total simulado: {st.t/86400:.2f} dias | Convergences: {st.conv}")
