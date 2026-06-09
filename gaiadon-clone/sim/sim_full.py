"""
Eclats of Lumiere - Simulador FULL GAME v2 (malha geometrica)
Camadas: Gold Stats / Convergence (portao) / Vestiges+Passivas / Ascension / Eclats+Memoires(Clarte)
Objetivo: medir duracao por mapa, dia de cada Ascension, total de Convergences, gargalos.
"""
import math

# ---------- malha ----------
MAPS = [  # (lvl_lo, lvl_hi, hp_lo, hp_hi, kill_threshold_sub5, dias_alvo)
    (1,    1e3, 10,   1e6,   100, 15),
    (1e3,  1e5, 1e6,  1e16,  200, 11),
    (1e5,  1e7, 1e16, 1e34,  350, 7.5),
    (1e7,  1e8, 1e34, 1e62,  500, 5.5),
    (1e8,  1e9, 1e62, 1e100, 800, 4.5),
]
NSUB = 5

def sub_bounds(m, s):
    l0, l1 = MAPS[m][0], MAPS[m][1]
    r = (l1/l0) ** (1/NSUB)
    return l0 * r**s, l0 * r**(s+1)

def mob_hp(L):
    for (l0, l1, h0, h1, kt, d) in MAPS:
        if L <= l1:
            t = (math.log10(L) - math.log10(l0)) / (math.log10(l1) - math.log10(l0))
            t = max(0.0, min(1.0, t))
            return h0 * (h1/h0) ** t
    return MAPS[-1][3]

def sub_mean_level(m, s):
    a, b = sub_bounds(m, s)
    return math.sqrt(a*b)

# ---------- parametros ----------
MIL = [(10,2.0),(25,2.5),(50,3.0),(100,4.0),(200,4.5),(400,5.0),(800,5.5),(1600,6.0),(3200,6.5)]
def mil_mult(lv):
    p = 1.0
    for k, v in MIL:
        if lv >= k: p *= v
    return p

def stat_cost_total(n0, n1):
    if n1 <= n0: return 0.0
    r = 1.15
    if n1 > 4800: return float('inf')   # protecao de float
    return 10.0 * (r**n1 - r**n0) / (r - 1)

P = dict(
    baseDmg=7.0, baseAPS=0.40, apsCap=1.25,
    strPer=0.08, agiPer=0.04, frtPer=0.05,
    convPoint=0.15, capBase=8, capRamp=1.5,
    ascMult=[10, 5, 5, 5, 5],
    ascCostV=[5e5, 2.5e6, 12e6, 60e6, None],   # A5 = matar Nihel (final, sem custo)
    eclatLump=[100, 300, 900, 2700, 8100],
    clarte=1.07, memCostBase=2.0, memCostRamp=1.12,
    vestSave=0.60,
    passDmgPer=0.05, passCostBase=100.0, passCostRamp=1.25,
    bossHpMult=15.0,
    goldRatio=0.10, xpRatio=0.08,
    dripBase=1.0,                               # eclats/h apos limpar mapa m: drip*3^m
    gearPerAsc=2.0,
)

class G:
    def __init__(s):
        s.t=0.0
        s.lumens=0.0; s.str_l=0; s.agi_l=0; s.frt_l=0
        s.hero=1.0; s.conv=0; s.pts=0
        s.vest_saved=0.0; s.pass_pool=0.0; s.pass_lv=0; s.pass_next=P['passCostBase']
        s.eclats=0.0; s.mem_lv=0; s.mem_next=P['memCostBase']; s.blessure_lv=0
        s.asc=0; s.map=0; s.sub=0; s.best_gsub=0
        s.kills5=0.0; s.cleared=[False]*5
        s.events=[]

    def cap(s): return P['capBase'] * P['capRamp']**s.conv
    def conv_f(s): return 1 + P['convPoint']*s.pts
    def asc_f(s):
        f=1.0
        for i in range(s.asc): f*=P['ascMult'][i]
        return f
    def gear(s): return P['gearPerAsc']**s.asc
    def passive_dmg(s): return 1 + P['passDmgPer']*s.pass_lv
    def memoires(s): return (P['clarte']**s.mem_lv) * (1.10**s.blessure_lv)
    def lvl_bonus(s): return 1 + math.sqrt(s.hero)*0.20
    def str_t(s): return (1+s.str_l*P['strPer'])*mil_mult(s.str_l)
    def aps(s): return min(P['apsCap'], P['baseAPS']*(1+s.agi_l*P['agiPer']))
    def dps(s):
        return (P['baseDmg']*s.str_t()*s.lvl_bonus()*s.conv_f()*s.asc_f()
                *s.gear()*s.passive_dmg()*s.memoires()*s.aps())

def vest_per_kill(gsub):
    m = gsub//5
    return math.ceil((gsub%5+1)*0.5) * 3**m

def max_map(g):  # mapa mais fundo desbloqueado
    return min(g.asc, 4)

def kill_time(g, m, s):
    return mob_hp(sub_mean_level(m, s)) / max(g.dps(), 1e-12)

def try_position(g):
    # pode mover-se por todos os mapas desbloqueados
    while True:
        moved=False
        nm, ns = g.map, g.sub
        if g.sub < 4: nm, ns = g.map, g.sub+1
        elif g.map < max_map(g): nm, ns = g.map+1, 0
        if (nm, ns) != (g.map, g.sub) and kill_time(g, nm, ns) <= 15.0:
            g.map, g.sub = nm, ns; moved=True
        elif kill_time(g, g.map, g.sub) > 45.0:
            if g.sub>0: g.sub-=1; moved=True
            elif g.map>0: g.map-=1; g.sub=4; moved=True
        if not moved: break
    g.best_gsub = max(g.best_gsub, g.map*5+g.sub)

def spend(g):
    for frac, attr in [(0.7,'str_l'),(0.2,'agi_l'),(0.1,'frt_l')]:
        budget = g.lumens*frac
        lv = getattr(g, attr); add=0
        while stat_cost_total(lv, lv+add+1) <= budget and add<4000: add+=1
        g.lumens -= stat_cost_total(lv, lv+add)
        setattr(g, attr, lv+add)
    while g.eclats >= g.mem_next:
        g.eclats -= g.mem_next
        if g.asc>=4 and (g.mem_lv+g.blessure_lv) % 3 == 0: g.blessure_lv+=1
        else: g.mem_lv+=1
        g.mem_next *= P['memCostRamp']
    while g.pass_pool >= g.pass_next:
        g.pass_pool -= g.pass_next
        g.pass_lv += 1
        g.pass_next *= P['passCostRamp']

def gain_xp(g, xp):
    if g.hero >= g.cap(): return
    cum = 10*g.hero**2.5 + xp
    g.hero = min(g.cap(), (cum/10)**0.4)

def converge(g):
    g.conv += 1
    g.pts += (g.best_gsub+1)
    g.lumens=0; g.str_l=0; g.agi_l=0; g.frt_l=0
    g.map=0; g.sub=0; g.best_gsub=0; g.kills5=0.0

def run(max_days=90, quiet=False):
    g=G()
    while g.t < max_days*86400:
        kt = max(kill_time(g, g.map, g.sub), 1.0/g.aps())   # cap fisico: 1 kill por ataque
        dt = max(10.0, min(1800.0, kt*20))
        g.t += dt
        kills = dt/kt
        hp = mob_hp(sub_mean_level(g.map, g.sub))
        g.lumens += kills*hp*P['goldRatio']*(1+g.frt_l*P['frtPer'])
        gain_xp(g, kills*hp*P['xpRatio'])
        v = kills*vest_per_kill(g.map*5+g.sub)
        g.vest_saved += v*P['vestSave']; g.pass_pool += v*(1-P['vestSave'])
        # gotejamento: boss farming dos mapas limpos, escalado pela profundidade maxima ja alcancada
        if any(g.cleared):
            depth = max(i for i,c in enumerate(g.cleared) if c)*5+4
            g.eclats += P['dripBase'] * (1.45 ** max(depth, g.best_gsub)) * dt/3600
        cur = max_map(g)
        if g.map==cur and g.sub==4 and not g.cleared[cur]:
            g.kills5 += kills
            if g.kills5 >= MAPS[cur][4]:
                bhp = mob_hp(MAPS[cur][1])*P['bossHpMult']
                tb = bhp/g.dps()
                if tb < 1200:
                    g.t += tb; g.cleared[cur]=True
                    g.events.append((g.t/86400, f"Boss do Map {cur+1} derrotado"))
        if g.asc < 5 and g.cleared[g.asc]:
            cost = P['ascCostV'][g.asc]
            if cost is None or g.vest_saved >= cost:
                if cost: g.vest_saved -= cost
                g.eclats += P['eclatLump'][g.asc]
                g.asc += 1
                g.events.append((g.t/86400, f"ASCENSION {g.asc}"))
                if g.asc==5:
                    g.events.append((g.t/86400, "FIM - Nihel derrotado"))
                    return g
        spend(g); try_position(g)
        if g.hero >= g.cap()*0.999 and g.best_gsub>=1:
            converge(g); try_position(g)
    return g

if __name__=='__main__':
    g=run()
    print("=== EVENTOS ===")
    for d,e in g.events: print(f"  dia {d:6.1f} | {e}")
    print(f"\nConvergences: {g.conv} | pontos {g.pts} | hero {g.hero:,.0f}")
    print(f"Memoires: {g.mem_lv} +{g.blessure_lv} Blessure | passivas {g.pass_lv}")
    print(f"DPS final: {g.dps():.2e} | dia {g.t/86400:.1f} | posicao Map {g.map+1} Sub {g.sub+1}")
