# Particle Life Simulation - Web Version

A browser-based particle life simulation featuring interactive physics with particle type interactions and emergent behaviors.

BASED ON THE EXCELLENT WORK OF OfficialCodeNoodles:

https://github.com/OfficialCodeNoodles/Particle-Life-Simulation

Video of his work here: https://www.youtube.com/watch?v=2vt4MBxcOhs

## Features

- **Interactive Physics Simulation**: Watch particles interact based on attraction/repulsion forces
- **Configurable Parameters**:
  - Particle count (2-1600)
  - Particle types (1-10)
  - Particle radius, dampening, repulsion/interaction radius
  - Density limiting
  - Force matrix for type-based interactions

- **Customizable Colors**: Set custom colors for each particle type
- **Force Matrix Control**: Adjust attraction/repulsion between particle types
- **Smooth Camera**: Pan and zoom with mouse controls
- **Real-time FPS Monitoring**: View performance stats

## Controls

| Key | Action |
|-----|--------|
| **F** | Toggle UI panel |
| **Space** | Pause/Resume simulation |
| **R** | Reset simulation |
| **Mouse Drag** | Pan camera |
| **Mouse Scroll** | Zoom in/out |

## Getting Started

Simply open `index.html` in your web browser. No installation or build process needed!

## How to Use

1. **Adjust Parameters**: Use the sliders on the right panel to configure:
   - Number of particles
   - Number of particle types
   - Physics parameters (radius, dampening, etc.)

2. **Set Interactions**: Click on the Force Matrix buttons to adjust attraction/repulsion between particle types:
   - Red hues = attraction
   - Blue hues = repulsion
   - Intensity = strength

3. **Customize Colors**: Use the color pickers to set custom colors for each particle type

4. **Observe Behaviors**: Experiment with different force matrices to observe emergent collective behaviors

## Tips for Interesting Simulations

- Set different forces for same-type vs different-type interactions
- Use high density limits to prevent crowding
- Experiment with asymmetric force matrices (where type A attracts type B differently than B attracts A)
- Adjust repulsion radius to control personal space behavior

## Performance Notes

- The simulation runs at variable frame rates depending on particle count
- Optimal performance: 500-5000 particles on most systems
- For very large particle counts (>10000), frame rate may decrease

## Browser Compatibility

Works in all modern browsers supporting:
- HTML5 Canvas
- JavaScript ES6+
- Web APIs (Mouse events, Keyboard events, requestAnimationFrame)
