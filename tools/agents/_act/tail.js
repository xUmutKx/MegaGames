  const M = (id, title, icon, cat, desc, goal, extra) => Object.assign({ id, title, icon, cat, desc, engine: id, goal }, extra || {});
  return {
    engines: { shooter, asteroid },
    minis: [
      M('shooter', 'Space Defender', '🚀', 'ACTION', 'Wave shooter with diving raiders, shielded gunships, dreadnought bosses, power-ups, bombs and an upgrade pick after every wave.', 300),
      M('asteroid', 'Asteroid Miner', '🪨', 'ACTION', 'Inertia flight: blast rocks into ore, dodge explosive rocks and UFO raiders, upgrade your ship each sector.', 80)
    ],
    aaa: []
  };
})();
