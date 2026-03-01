# Marzia

**A professional-grade optical simulator for thin and thick multilayer films using the Transfer Matrix Method (TMM).**

Marzia calculates reflection, transmission, and internal absorption profiles in planar multilayer thin films, including the effects of multiple internal reflections and interference. It can simulate purely thick films, purely thin films, or combinations of both (e.g., a thick piece of glass with a multi-layer antireflection coating on one side and a mirror on the other).

## Features
- Calculate Transmittance and Reflectance parameters.
- Calculate the absorption profile at any point in the structure (crucial for solar-cell modeling).
- Wavelength sweep visualization (e.g., 400-700 nm) to see responses across spectrums.
- Support for complex refractive indexes to accurately model absorbing materials.
- Calculate parameters measured in ellipsometry.

## Algorithm Credits

This project makes extensive use of the Transfer Matrix Method algorithms originally developed by **Steve Byrnes**.
- **Author Homepage:** http://sjbyrnes.com
- **Original Source Package:** [TMM on PyPI](https://pypi.org/project/tmm/) and [TMM on GitHub](https://github.com/sbyrnes321/tmm)
- **Physics Explanations:** For the physics-based explanations and derivations of the various formulas calculated by this package, see [arxiv.org/abs/1603.02720](https://arxiv.org/abs/1603.02720).

## License
Please see `other/tmm/LICENSE.txt` or the respective open source licenses for dependencies. All physics engines correctly respect the algorithms credited to Steve Byrnes.
