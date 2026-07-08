import collections

def mult(p1, o1, p2, o2):
    p_new = [p1[p2[i]] for i in range(8)]
    o_new = [(o1[p2[i]] + o2[i]) % 3 for i in range(8)]
    return p_new, o_new

moves = {}
moves['U'] = ([3, 0, 1, 2, 4, 5, 6, 7], [0, 0, 0, 0, 0, 0, 0, 0])
moves['D'] = ([0, 1, 2, 3, 5, 6, 7, 4], [0, 0, 0, 0, 0, 0, 0, 0])
moves['R'] = ([3, 1, 2, 7, 0, 5, 6, 4], [1, 0, 0, 2, 2, 0, 0, 1])
moves['L'] = ([0, 5, 1, 3, 4, 6, 2, 7], [0, 2, 1, 0, 0, 1, 2, 0])
moves['F'] = ([1, 5, 2, 3, 0, 4, 6, 7], [2, 1, 0, 0, 1, 2, 0, 0])
moves['B'] = ([0, 1, 3, 7, 4, 5, 2, 6], [0, 0, 2, 1, 0, 0, 1, 2])

all_moves = {}
for m, (p, o) in moves.items():
    all_moves[m] = (p, o)
    p2, o2 = mult(p, o, p, o)
    all_moves[m+'2'] = (p2, o2)
    p3, o3 = mult(p2, o2, p, o)
    all_moves[m+"'"] = (p3, o3)

# Test R R' = I
rp, ro = all_moves["R'"]
i_p, i_o = mult(moves['R'][0], moves['R'][1], rp, ro)
print("R R' = ", i_p, i_o)

def state_id(p, o):
    idx = 0
    for x in p: idx = (idx * 8) + x
    for x in o[:-1]: idx = (idx * 3) + x
    return idx

# generate a scramble
p, o = [0,1,2,3,4,5,6,7], [0]*8
for m in ["R", "U", "R'", "U'"]:
    mp, mo = all_moves[m]
    p, o = mult(p, o, mp, mo)

print("Scrambled state:", p, o)
