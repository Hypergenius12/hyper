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

y_p, y_o = mult(all_moves['U'][0], all_moves['U'][1], all_moves["D'"][0], all_moves["D'"][1])
x_p, x_o = mult(all_moves['R'][0], all_moves['R'][1], all_moves["L'"][0], all_moves["L'"][1])
z_p, z_o = mult(all_moves['F'][0], all_moves['F'][1], all_moves["B'"][0], all_moves["B'"][1])

def state_id(p, o):
    idx = 0
    for x in p: idx = (idx * 8) + x
    for x in o[:-1]: idx = (idx * 3) + x
    return idx

q = [([0,1,2,3,4,5,6,7], [0]*8)]
visited = set()
results = []

while len(q) > 0:
    curr_p, curr_o = q.pop(0)
    idx = state_id(curr_p, curr_o)
    if idx not in visited:
        visited.add(idx)
        results.append((curr_p, curr_o))
        
        q.append(mult(curr_p, curr_o, y_p, y_o))
        q.append(mult(curr_p, curr_o, x_p, x_o))
        q.append(mult(curr_p, curr_o, z_p, z_o))

print("Found", len(results), "solved states!")
