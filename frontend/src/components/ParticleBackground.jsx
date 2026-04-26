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
    background: { color: { value: 'transparent' } },
    particles: {
      number: { value: 36, density: { enable: true, width: 1920, height: 1080 } },
      color: { value: '#E4002B' },
      opacity: { value: { min: 0.05, max: 0.18 } },
      size: { value: { min: 1, max: 2.8 } },
      move: {
        enable: true,
        speed: 0.45,
        direction: 'none',
        outModes: { default: 'out' },
      },
      links: {
        enable: true,
        distance: 140,
        color: '#E4002B',
        opacity: 0.05,
        width: 1,
      },
    },
    interactivity: {
      events: {
        onHover: {
          enable: true,
          mode: 'grab',
        },
        resize: true,
      },
      modes: {
        grab: {
          distance: 120,
          links: {
            opacity: 0.2,
          },
        },
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
