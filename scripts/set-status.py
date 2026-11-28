#!/usr/bin/env python3
"""python3 scripts/set-status.py id=status ... : set a sim's status in docs/sim-redraw.md (golden column 'exact' when redrawn)."""
import re,sys
p='docs/sim-redraw.md'; t=open(p).read()
for a in sys.argv[1:]:
    i,v=a.split('=',1)
    t,n=re.subn(r'(^\| `%s` \|[^|]*\|)[^|]*\|[^|]*\|'%re.escape(i), lambda m:m.group(1)+' %s | exact (min, default, objective-met) |'%v, t, flags=re.M)
    assert n==1,i
open(p,'w').write(t)
