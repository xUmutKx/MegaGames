#!/bin/bash
cd /root/projects/MegaGames/tools/agents/_act
{ echo "window.__AG_action = (function () {"; cat p0.js p[1-9].js; cat tail.js; } > ../action.js
node --check ../action.js && node ../harness.js ../action.js ${1:-2500} 2>&1 | tail -${2:-40}
