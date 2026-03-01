import * as math from 'mathjs';

export type Polarization = 's' | 'p';

export interface SpectralPoint {
  wavelength: number;
  n: number;
  k: number;
}

export interface Layer {
  id: string;
  name: string;
  thickness: number; // in nm
  n: number; // real part of refractive index
  k: number; // imaginary part of refractive index (extinction coefficient)
  isThick: boolean; // if true, interference is ignored
  forceIncoherent?: boolean; // if true, forces incoherent treatment even if thin
  bandwidth?: number; // spectral bandwidth in nm
  spectralData?: SpectralPoint[];
  // Electrical parameters for solar cell modeling
  bandgap?: number; // eV
  affinity?: number; // eV
  dopingType?: 'n' | 'p' | 'i';
  dopingConc?: number; // cm^-3
  mobilityN?: number; // cm^2/Vs
  mobilityP?: number; // cm^2/Vs
}

export interface SimulationResult {
  wavelength: number;
  R: number;
  T: number;
  A: number;
}

export interface AbsorptionProfilePoint {
  z: number; // depth in nm
  absorption: number; // normalized absorption rate
  fieldIntensity: number; // |E|^2
  layerName: string;
}

export const MATERIALS: Record<string, { n: number, k: number }> = {
  'Custom': { n: 1.5, k: 0 },
  'Air': { n: 1.0, k: 0 },
  'Glass (BK7)': { n: 1.51, k: 0 },
  'Silicon (Si)': { n: 3.42, k: 0.01 },
  'Silica (SiO2)': { n: 1.45, k: 0 },
  'Titania (TiO2)': { n: 2.4, k: 0 },
  'Magnesium Fluoride (MgF2)': { n: 1.38, k: 0 },
  'Gold (Au)': { n: 0.2, k: 3.5 },
  'Silver (Ag)': { n: 0.05, k: 4.0 },
  'Aluminum (Al)': { n: 1.2, k: 7.0 },
  'ITO': { n: 1.9, k: 0.01 },
};

/**
 * Color calculation utilities
 */
export class ColorUtils {
  // Simple CIE 1931 XYZ color matching functions (approximate)
  private static xFit(w: number) {
    return 1.056 * Math.exp(-0.5 * Math.pow((w - 599.8) / 37.9, 2)) +
           0.362 * Math.exp(-0.5 * Math.pow((w - 442.0) / 16.0, 2)) -
           0.065 * Math.exp(-0.5 * Math.pow((w - 501.1) / 20.4, 2));
  }
  private static yFit(w: number) {
    return 0.821 * Math.exp(-0.5 * Math.pow((w - 568.8) / 46.9, 2)) +
           0.286 * Math.exp(-0.5 * Math.pow((w - 530.9) / 16.3, 2));
  }
  private static zFit(w: number) {
    return 1.217 * Math.exp(-0.5 * Math.pow((w - 437.0) / 11.8, 2)) +
           0.681 * Math.exp(-0.5 * Math.pow((w - 459.0) / 26.0, 2));
  }

  static spectrumToRGB(results: SimulationResult[]): string {
    let X = 0, Y = 0, Z = 0;
    let norm = 0;

    results.forEach(r => {
      if (r.wavelength >= 380 && r.wavelength <= 780) {
        const x = this.xFit(r.wavelength);
        const y = this.yFit(r.wavelength);
        const z = this.zFit(r.wavelength);
        X += r.R * x;
        Y += r.R * y;
        Z += r.R * z;
        norm += y;
      }
    });

    if (norm === 0) return '#000000';
    X /= norm; Y /= norm; Z /= norm;

    // XYZ to sRGB
    let r = X * 3.2406 + Y * -1.5372 + Z * -0.4986;
    let g = X * -0.9689 + Y * 1.8758 + Z * 0.0415;
    let b = X * 0.0557 + Y * -0.2040 + Z * 1.0570;

    // Gamma correction
    const gamma = (c: number) => c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    r = Math.max(0, Math.min(1, gamma(r)));
    g = Math.max(0, Math.min(1, gamma(g)));
    b = Math.max(0, Math.min(1, gamma(b)));

    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
  }
}

/**
 * Transfer Matrix Method Implementation
 */
export class TMMSimulator {
  /**
   * Interpolates n and k for a given wavelength from spectral data.
   */
  private static getInterpolatedNK(wavelength: number, layer: Layer): { n: number, k: number } {
    if (!layer.spectralData || layer.spectralData.length === 0) {
      return { n: layer.n, k: layer.k };
    }

    const data = layer.spectralData.sort((a, b) => a.wavelength - b.wavelength);
    
    // Find the two points to interpolate between
    let i = 0;
    while (i < data.length && data[i].wavelength < wavelength) {
      i++;
    }

    if (i === 0) return { n: data[0].n, k: data[0].k };
    if (i === data.length) return { n: data[data.length - 1].n, k: data[data.length - 1].k };

    const p1 = data[i - 1];
    const p2 = data[i];
    const t = (wavelength - p1.wavelength) / (p2.wavelength - p1.wavelength);

    return {
      n: p1.n + t * (p2.n - p1.n),
      k: p1.k + t * (p2.k - p1.k)
    };
  }

  /**
   * Calculates R, T, A for a specific wavelength and angle, handling both thin and thick layers.
   */
  static calculate(
    wavelength: number,
    angleDeg: number,
    polarization: Polarization,
    layers: Layer[],
    nStart: number = 1.0,
    nEnd: number = 1.0
  ): SimulationResult {
    // If no thick or forceIncoherent layers, use standard TMM
    if (!layers.some(l => l.isThick || l.forceIncoherent)) {
      return this.calculateCoherent(wavelength, angleDeg, polarization, layers, nStart, nEnd);
    }

    // Hybrid approach: Split into coherent sub-stacks separated by thick/incoherent layers
    // For simplicity and common use cases, we handle the layers sequentially.
    // We combine stacks using the incoherent formula:
    // R_total = R1 + (T1^2 * R2 * internal_trans) / (1 - R1 * R2 * internal_trans^2)
    
    let currentR = 0;
    let currentT = 1;
    let currentNStart = nStart;

    // We iterate through the structure and combine stacks
    let i = 0;
    while (i < layers.length) {
      if (layers[i].isThick || layers[i].forceIncoherent) {
        // Handle thick or forceIncoherent layer
        const layer = layers[i];
        const { n: nLayer, k: kLayer } = this.getInterpolatedNK(wavelength, layer);
        const dLayer = layer.thickness;

        // 1. Calculate R, T of the interface/stack before this layer
        const interfaceResult = this.calculateCoherent(wavelength, angleDeg, polarization, [], currentNStart, nLayer);
        
        // 2. Calculate internal transmittance of the layer
        const alpha = (4 * Math.PI * kLayer) / wavelength;
        const angleRad = (angleDeg * Math.PI) / 180;
        const cosTheta = Math.sqrt(1 - Math.pow((nStart * Math.sin(angleRad)) / nLayer, 2));
        const internalTrans = Math.exp(-alpha * dLayer / (cosTheta || 1));

        // 3. Combine current stack with this interface and layer
        const R1 = currentR;
        const T1 = currentT;
        const R2 = interfaceResult.R;
        const T2 = interfaceResult.T;

        // Incoherent combination of two stacks
        const denom = 1 - R1 * R2 * Math.pow(internalTrans, 2);
        const newR = R1 + (Math.pow(T1, 2) * R2 * Math.pow(internalTrans, 2)) / denom;
        const newT = (T1 * T2 * internalTrans) / denom;

        currentR = newR;
        currentT = newT;
        currentNStart = nLayer;
        i++;
      } else {
        // Handle a sequence of thin layers as a coherent sub-stack
        const thinStack: Layer[] = [];
        while (i < layers.length && !layers[i].isThick && !layers[i].forceIncoherent) {
          thinStack.push(layers[i]);
          i++;
        }
        
        // Peek at the next layer's n to determine the exit medium for this thin stack
        const nextN = (i < layers.length) ? layers[i].n : nEnd;
        const stackResult = this.calculateCoherent(wavelength, angleDeg, polarization, thinStack, currentNStart, nextN);

        if (currentT === 1 && currentR === 0) {
          // First stack
          currentR = stackResult.R;
          currentT = stackResult.T;
        } else {
          // Combine existing incoherent stack with this new coherent stack
          const R1 = currentR;
          const T1 = currentT;
          const R2 = stackResult.R;
          const T2 = stackResult.T;
          
          const denom = 1 - R1 * R2;
          const newR = R1 + (Math.pow(T1, 2) * R2) / denom;
          const newT = (T1 * T2) / denom;
          
          currentR = newR;
          currentT = newT;
        }
        currentNStart = nextN;
      }
    }

    // Final interface to nEnd if the last layer was thick
    if (layers.length > 0 && layers[layers.length - 1].isThick) {
      const finalInterface = this.calculateCoherent(wavelength, angleDeg, polarization, [], currentNStart, nEnd);
      const R1 = currentR;
      const T1 = currentT;
      const R2 = finalInterface.R;
      const T2 = finalInterface.T;
      
      const denom = 1 - R1 * R2;
      currentR = R1 + (Math.pow(T1, 2) * R2) / denom;
      currentT = (T1 * T2) / denom;
    }

    return {
      wavelength,
      R: currentR,
      T: currentT,
      A: Math.max(0, 1 - currentR - currentT)
    };
  }

  /**
   * Standard Coherent TMM (Thin Films)
   */
  static calculateCoherent(
    wavelength: number,
    angleDeg: number,
    polarization: Polarization,
    layers: Layer[],
    nStart: number = 1.0,
    nEnd: number = 1.0
  ): SimulationResult {
    const angleRad = (angleDeg * Math.PI) / 180;
    
    // Start with identity matrix
    let M: any = [[1, 0], [0, 1]];
    
    // Indices of refraction including start and end media
    const ns = [
      math.complex(nStart, 0),
      ...layers.map(l => {
        const { n, k } = this.getInterpolatedNK(wavelength, l);
        return math.complex(n, k);
      }),
      math.complex(nEnd, 0)
    ];
    
    // Angles in each layer (Snell's Law: n1*sin(theta1) = n2*sin(theta2))
    const thetas: any[] = [];
    const currentSinTheta = math.complex(Math.sin(angleRad), 0);
    const nIn = ns[0];
    
    for (let i = 0; i < ns.length; i++) {
      const sinTheta = math.divide(math.multiply(nIn, currentSinTheta), ns[i]);
      const cosTheta = math.sqrt(math.subtract(math.complex(1, 0), math.multiply(sinTheta, sinTheta) as any) as any);
      thetas.push(cosTheta);
    }

    // Fresnel coefficients and Transfer Matrix
    for (let i = 0; i < ns.length - 1; i++) {
      const n1 = ns[i];
      const n2 = ns[i + 1];
      const cos1 = thetas[i];
      const cos2 = thetas[i + 1];

      let r: any;
      let t: any;

      if (polarization === 's') {
        const term1 = math.multiply(n1, cos1);
        const term2 = math.multiply(n2, cos2);
        r = math.divide(math.subtract(term1, term2), math.add(term1, term2));
        t = math.divide(math.multiply(2, term1), math.add(term1, term2));
      } else {
        const term1 = math.multiply(n2, cos1);
        const term2 = math.multiply(n1, cos2);
        r = math.divide(math.subtract(term1, term2), math.add(term1, term2));
        t = math.divide(math.multiply(2, math.multiply(n1, cos1)), math.add(term1, term2));
      }

      // Interface matrix
      const L = [
        [math.divide(1, t), math.divide(r, t)],
        [math.divide(r, t), math.divide(1, t)]
      ];

      M = math.multiply(M, L);

      // Propagation matrix (if not the last interface)
      if (i < layers.length) {
        const layer = layers[i];
        const phase = math.multiply(
          math.complex(0, 2 * Math.PI / wavelength),
          math.multiply(ns[i+1], math.multiply(layer.thickness, thetas[i+1]))
        );
        
        const P = [
          [math.exp(math.multiply(-1, phase) as any), 0],
          [0, math.exp(phase as any)]
        ];
        M = math.multiply(M, P);
      }
    }

    const M00 = M[0][0];
    const M10 = M[1][0];

    const r_total = math.divide(M10, M00) as any;
    const t_total = math.divide(1, M00) as any;

    const R = Math.pow(math.abs(r_total), 2);
    
    const powerEnd = math.re(math.multiply(ns[ns.length - 1], thetas[thetas.length - 1]) as any) as unknown as number;
    const powerStart = math.re(math.multiply(ns[0], thetas[0]) as any) as unknown as number;
    const T = (Math.pow(math.abs(t_total), 2) * powerEnd) / powerStart;

    return {
      wavelength,
      R,
      T,
      A: Math.max(0, 1 - R - T)
    };
  }

  static calculateAbsorptionProfile(
    wavelength: number,
    angleDeg: number,
    polarization: Polarization,
    layers: Layer[],
    nStart: number = 1.0,
    nEnd: number = 1.0,
    resolution: number = 100
  ): AbsorptionProfilePoint[] {
    const angleRad = (angleDeg * Math.PI) / 180;
    const ns = [
      math.complex(nStart, 0),
      ...layers.map(l => {
        const { n, k } = this.getInterpolatedNK(wavelength, l);
        return math.complex(n, k);
      }),
      math.complex(nEnd, 0)
    ];
    
    const thetas: any[] = [];
    const currentSinTheta = math.complex(Math.sin(angleRad), 0);
    const nIn = ns[0];
    
    for (let i = 0; i < ns.length; i++) {
      const sinTheta = math.divide(math.multiply(nIn, currentSinTheta), ns[i]);
      const cosTheta = math.sqrt(math.subtract(math.complex(1, 0), math.multiply(sinTheta, sinTheta) as any) as any);
      thetas.push(cosTheta);
    }

    const matricesFromRight: any[] = new Array(layers.length + 1);
    matricesFromRight[layers.length] = [[1, 0], [0, 1]];

    for (let i = layers.length - 1; i >= 0; i--) {
      const n1 = ns[i + 1];
      const n2 = ns[i + 2];
      const cos1 = thetas[i + 1];
      const cos2 = thetas[i + 2];

      let r: any, t: any;
      if (polarization === 's') {
        const term1 = math.multiply(n1, cos1);
        const term2 = math.multiply(n2, cos2);
        r = math.divide(math.subtract(term1, term2), math.add(term1, term2));
        t = math.divide(math.multiply(2, term1), math.add(term1, term2));
      } else {
        const term1 = math.multiply(n2, cos1);
        const term2 = math.multiply(n1, cos2);
        r = math.divide(math.subtract(term1, term2), math.add(term1, term2));
        t = math.divide(math.multiply(2, math.multiply(n1, cos1)), math.add(term1, term2));
      }

      const L = [
        [math.divide(1, t), math.divide(r, t)],
        [math.divide(r, t), math.divide(1, t)]
      ];

      const layer = layers[i];
      const phase = math.multiply(
        math.complex(0, 2 * Math.PI / wavelength),
        math.multiply(ns[i+1], math.multiply(layer.thickness, thetas[i+1]))
      );
      
      const P = [
        [math.exp(math.multiply(-1, phase) as any), 0],
        [0, math.exp(phase as any)]
      ];

      matricesFromRight[i] = math.multiply(P, math.multiply(L, matricesFromRight[i + 1]));
    }

    const n0 = ns[0];
    const n1 = ns[1];
    const cos0 = thetas[0];
    const cos1 = thetas[1];
    let r01: any, t01: any;
    if (polarization === 's') {
      const term1 = math.multiply(n0, cos0);
      const term2 = math.multiply(n1, cos1);
      r01 = math.divide(math.subtract(term1, term2), math.add(term1, term2));
      t01 = math.divide(math.multiply(2, term1), math.add(term1, term2));
    } else {
      const term1 = math.multiply(n1, cos0);
      const term2 = math.multiply(n0, cos1);
      r01 = math.divide(math.subtract(term1, term2), math.add(term1, term2));
      t01 = math.divide(math.multiply(2, math.multiply(n0, cos0)), math.add(term1, term2));
    }
    const L01 = [[math.divide(1, t01), math.divide(r01, t01)], [math.divide(r01, t01), math.divide(1, t01)]];
    const M_total = math.multiply(L01, matricesFromRight[0]) as any;
    const t_total = math.divide(1, M_total[0][0]) as any;

    const profile: AbsorptionProfilePoint[] = [];
    let currentZ = 0;

    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const n = ns[i + 1];
      const cosTheta = thetas[i + 1];
      const layerThickness = layer.thickness;
      const steps = Math.max(1, Math.round((layerThickness / (layers.reduce((acc, l) => acc + l.thickness, 0) || 1)) * resolution));

      for (let s = 0; s <= steps; s++) {
        const zInLayer = (s / steps) * layerThickness;
        const phaseAtZ = math.multiply(
          math.complex(0, 2 * Math.PI / wavelength),
          math.multiply(n, math.multiply(layerThickness - zInLayer, cosTheta))
        );

        const P_z = [
          [math.exp(math.multiply(-1, phaseAtZ) as any), 0],
          [0, math.exp(phaseAtZ as any)]
        ];

        const M_z = math.multiply(P_z, matricesFromRight[i + 1]) as any;
        const fields = math.multiply(M_z, [[t_total], [0]]) as any;
        const Ep = fields[0][0];
        const Em = fields[1][0];
        
        const E_total = math.add(Ep, Em) as any;
        const intensity = Math.pow(math.abs(E_total), 2);
        const { n: layerN, k: layerK } = this.getInterpolatedNK(wavelength, layer);
        const absRate = (4 * Math.PI * layerK * layerN / wavelength) * intensity;

        profile.push({
          z: currentZ + zInLayer,
          absorption: absRate,
          fieldIntensity: intensity,
          layerName: layer.name
        });
      }
      currentZ += layerThickness;
    }

    return profile;
  }
}
