import { useCallback, useMemo } from 'react';
import Particles from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';

export default function ParticleBackground() {
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const options = useMemo(() => ({
    fullScreen: { enable: false },
    fpsLimit: 60,
    particles: {
      number: { value: 30, density: { enable: true, width: 1920, height: 1080 } },
      color: { value: '#E4002B' },
      opacity: { value: { min: 0.05, max: 0.15 } },
      size: { value: { min: 1, max: 2.5 } },
      move: {
        enable: true,
        speed: 0.3,
        direction: 'none',
        outModes: { default: 'out' },
      },
      links: {
        enable: true,
        distance: 150,
        color: '#E4002B',
        opacity: 0.04,
        width: 1,
      },
    },
    detectRetina: true,
  }), []);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      options={options}
      className="absolute inset-0 pointer-events-none"
    />
  );
}
