import type { Booklet } from "./types";

const r = String.raw;

// Physics (first assessment 2025): what the official data booklet gives,
// checked against it, in our own layout. SL students see the entries without
// `hl` (the booklet's "Additional higher level" boxes); HL students see
// everything. Circuit symbols (drawings) aren't included.
export const PHYSICS_BOOKLET: Booklet = {
  subjectId: "physics",
  title: "Physics data booklet",
  searchHint: "Search formulas and constants",
  sections: [
    // ── Constants, conversions, uncertainties ─────────────────────────
    {
      topic: "T",
      title: "Constants",
      entries: [],
      tables: [
        {
          caption: "Fundamental constants",
          columns: ["Quantity", "Symbol", "Value"],
          keywords: ["constants"],
          rows: [
            ["Acceleration of free fall (Earth’s surface)", "g", "9.8 m s⁻²"],
            ["Gravitational constant", "G", "6.67 × 10⁻¹¹ N m² kg⁻²"],
            ["Avogadro constant", "N_A", "6.02 × 10²³ mol⁻¹"],
            ["Gas constant", "R", "8.31 J K⁻¹ mol⁻¹"],
            ["Boltzmann constant", "k_B", "1.38 × 10⁻²³ J K⁻¹"],
            ["Stefan–Boltzmann constant", "σ", "5.67 × 10⁻⁸ W m⁻² K⁻⁴"],
            ["Coulomb constant", "k", "8.99 × 10⁹ N m² C⁻²"],
            ["Permittivity of free space", "ε₀", "8.85 × 10⁻¹² C² N⁻¹ m⁻²"],
            ["Permeability of free space", "μ₀", "4π × 10⁻⁷ T m A⁻¹"],
            ["Speed of light in a vacuum", "c", "3.00 × 10⁸ m s⁻¹"],
            ["Planck constant", "h", "6.63 × 10⁻³⁴ J s"],
            ["Elementary charge", "e", "1.60 × 10⁻¹⁹ C"],
            ["Electron rest mass", "m_e", "9.110 × 10⁻³¹ kg = 0.000549 u = 0.511 MeV c⁻²"],
            ["Proton rest mass", "m_p", "1.673 × 10⁻²⁷ kg = 1.007276 u = 938 MeV c⁻²"],
            ["Neutron rest mass", "m_n", "1.675 × 10⁻²⁷ kg = 1.008665 u = 940 MeV c⁻²"],
            ["Unified atomic mass unit", "u", "1.661 × 10⁻²⁷ kg = 931.5 MeV c⁻²"],
            ["Solar constant", "S", "1.36 × 10³ W m⁻²"],
            ["Fermi radius", "R₀", "1.20 × 10⁻¹⁵ m"],
          ],
        },
        {
          caption: "Unit conversions",
          columns: ["From", "To"],
          keywords: ["convert", "units"],
          rows: [
            ["1 radian (rad)", "180°/π"],
            ["Temperature in K", "temperature in °C + 273"],
            ["1 light year (ly)", "9.46 × 10¹⁵ m"],
            ["1 parsec (pc)", "3.26 ly"],
            ["1 astronomical unit (AU)", "1.50 × 10¹¹ m"],
            ["1 kilowatt-hour (kWh)", "3.60 × 10⁶ J"],
            ["hc", "1.99 × 10⁻²⁵ J m = 1.24 × 10⁻⁶ eV m"],
          ],
        },
        {
          caption: "Metric prefixes",
          columns: ["Prefix", "Symbol", "Multiplier"],
          keywords: ["SI", "powers of ten"],
          rows: [
            ["peta", "P", "10¹⁵"],
            ["tera", "T", "10¹²"],
            ["giga", "G", "10⁹"],
            ["mega", "M", "10⁶"],
            ["kilo", "k", "10³"],
            ["hecto", "h", "10²"],
            ["deca", "da", "10¹"],
            ["deci", "d", "10⁻¹"],
            ["centi", "c", "10⁻²"],
            ["milli", "m", "10⁻³"],
            ["micro", "μ", "10⁻⁶"],
            ["nano", "n", "10⁻⁹"],
            ["pico", "p", "10⁻¹²"],
            ["femto", "f", "10⁻¹⁵"],
          ],
        },
      ],
    },
    {
      topic: "T",
      title: "Mathematical equations",
      entries: [
        { name: "Area of a triangle and a circle", math: [r`A = \frac{1}{2}bh`, r`A = \pi r^2`, r`C = 2\pi r`], keywords: ["circumference"] },
        { name: "Volumes", math: [r`V = lwh \quad \text{(cuboid)}`, r`V = \pi r^2 h \quad \text{(cylinder)}`, r`V = Ah \quad \text{(prism)}`, r`V = \frac{4}{3}\pi r^3 \quad \text{(sphere)}`] },
        { name: "Curved surface area of a cylinder", math: [r`A = 2\pi r h`] },
        { name: "Components of a vector", math: [r`A_H = A\cos\theta`, r`A_V = A\sin\theta`], keywords: ["resolving", "horizontal", "vertical"] },
        { name: "Trigonometric relationships", math: [r`\tan\theta = \frac{\sin\theta}{\cos\theta}`, r`\sin^2\theta + \cos^2\theta = 1`] },
      ],
      tables: [
        {
          caption: "Electromagnetic spectrum (in order of increasing wavelength)",
          columns: ["Region", "Note"],
          keywords: ["electromagnetic spectrum", "wavelength", "light"],
          rows: [
            ["γ-rays", "shortest wavelength, highest energy"],
            ["X-rays", "–"],
            ["ultraviolet", "–"],
            ["visible", "400–700 nm (violet to red)"],
            ["infrared", "–"],
            ["microwaves", "–"],
            ["radio waves", "longest wavelength, lowest energy"],
          ],
        },
      ],
    },
    {
      topic: "T",
      title: "Uncertainties",
      entries: [
        { name: "Adding or subtracting", math: [r`y = a \pm b \implies \Delta y = \Delta a + \Delta b`], keywords: ["error", "absolute uncertainty"] },
        {
          name: "Multiplying or dividing",
          math: [r`y = \frac{ab}{c} \implies \frac{\Delta y}{y} = \frac{\Delta a}{a} + \frac{\Delta b}{b} + \frac{\Delta c}{c}`],
          keywords: ["error", "fractional", "percentage uncertainty"],
        },
        { name: "Powers", math: [r`y = a^n \implies \frac{\Delta y}{y} = \left|n\frac{\Delta a}{a}\right|`], keywords: ["error", "fractional"] },
      ],
    },

    // ── A Space, time and motion ──────────────────────────────────────
    {
      topic: "A",
      title: "Kinematics",
      entries: [
        { name: "Equations of uniform acceleration", math: [r`v = u + at`, r`s = \frac{u + v}{2}\,t`, r`s = ut + \frac{1}{2}at^2`, r`v^2 = u^2 + 2as`], keywords: ["suvat", "motion"] },
      ],
    },
    {
      topic: "A",
      title: "Forces and momentum",
      entries: [
        { name: "Newton’s second law", math: [r`F = ma = \frac{\Delta p}{\Delta t}`], keywords: ["force", "resultant"] },
        { name: "Weight", math: [r`F_g = mg`], keywords: ["gravitational force"] },
        { name: "Momentum and impulse", math: [r`p = mv`, r`J = F\Delta t = \Delta p`] },
        { name: "Friction", math: [r`F_f \le \mu_s F_N`, r`F_f = \mu_d F_N`], keywords: ["static", "dynamic", "coefficient"] },
        { name: "Hooke’s law", math: [r`F_H = -kx`], keywords: ["spring", "elastic"] },
        { name: "Viscous drag (Stokes’ law)", math: [r`F_d = 6\pi\eta r v`], keywords: ["fluid", "viscosity"] },
        { name: "Buoyancy", math: [r`F_b = \rho V g`], keywords: ["upthrust", "Archimedes"] },
        {
          name: "Circular motion",
          math: [r`v = \omega r = \frac{2\pi r}{T}`, r`a = \frac{v^2}{r} = \omega^2 r = \frac{4\pi^2 r}{T^2}`],
          keywords: ["centripetal", "angular velocity"],
        },
      ],
    },
    {
      topic: "A",
      title: "Work, energy and power",
      entries: [
        { name: "Work done", math: [r`W = Fs\cos\theta`] },
        { name: "Kinetic energy", math: [r`E_k = \frac{1}{2}mv^2 = \frac{p^2}{2m}`] },
        { name: "Gravitational potential energy (near the surface)", math: [r`\Delta E_p = mg\Delta h`] },
        { name: "Elastic potential energy", math: [r`E_H = \frac{1}{2}k(\Delta x)^2`], keywords: ["spring"] },
        { name: "Power", math: [r`P = \frac{\Delta W}{\Delta t} = Fv`] },
        { name: "Efficiency", math: [r`\eta = \frac{\text{useful work out}}{\text{total work in}} = \frac{\text{useful power out}}{\text{total power in}}`] },
      ],
    },
    {
      topic: "A",
      title: "Rigid body mechanics",
      entries: [
        { name: "Torque", math: [r`\tau = Fr\sin\theta`], hl: true, keywords: ["moment"] },
        { name: "Moment of inertia", math: [r`I = \sum mr^2`], hl: true },
        { name: "Newton’s second law for rotation", math: [r`\tau = I\alpha`], hl: true },
        {
          name: "Equations of uniform angular acceleration",
          math: [r`\omega_f = \omega_i + \alpha t`, r`\Delta\theta = \frac{\omega_f + \omega_i}{2}\,t`, r`\Delta\theta = \omega_i t + \frac{1}{2}\alpha t^2`, r`\omega_f^2 = \omega_i^2 + 2\alpha\Delta\theta`],
          hl: true,
          keywords: ["rotation"],
        },
        { name: "Angular momentum", math: [r`L = I\omega`, r`\Delta L = \tau\Delta t = \Delta(I\omega)`], hl: true },
        { name: "Rotational kinetic energy", math: [r`E_k = \frac{1}{2}I\omega^2 = \frac{L^2}{2I}`], hl: true },
      ],
    },
    {
      topic: "A",
      title: "Galilean and special relativity",
      entries: [
        { name: "Galilean transformation", math: [r`x' = x - vt`, r`t' = t`, r`u' = u - v`], hl: true },
        { name: "Lorentz factor", math: [r`\gamma = \frac{1}{\sqrt{1 - \dfrac{v^2}{c^2}}}`], hl: true },
        {
          name: "Lorentz transformation",
          math: [r`x' = \gamma(x - vt)`, r`t' = \gamma\left(t - \frac{vx}{c^2}\right)`],
          hl: true,
        },
        { name: "Velocity addition", math: [r`u' = \frac{u - v}{1 - \dfrac{uv}{c^2}}`], hl: true },
        { name: "Time dilation and length contraction", math: [r`\Delta t = \gamma\,\Delta t_0`, r`L = \frac{L_0}{\gamma}`], hl: true, keywords: ["proper time", "proper length"] },
        { name: "Spacetime interval", math: [r`(\Delta s)^2 = (c\Delta t)^2 - \Delta x^2`], hl: true, keywords: ["invariant"] },
        { name: "Angle of a world line from the time axis", math: [r`\tan\theta = \frac{v}{c}`], hl: true, keywords: ["spacetime diagram"] },
      ],
    },

    // ── B The particulate nature of matter ────────────────────────────
    {
      topic: "B",
      title: "Thermal energy transfers",
      entries: [
        { name: "Density", math: [r`\rho = \frac{m}{V}`] },
        { name: "Average kinetic energy of a particle", math: [r`\bar{E}_k = \frac{3}{2}k_B T`] },
        { name: "Specific heat capacity", math: [r`Q = mc\Delta T`], keywords: ["heating"] },
        { name: "Specific latent heat", math: [r`Q = mL`], keywords: ["melting", "boiling", "phase change"] },
        { name: "Thermal conduction", math: [r`\frac{\Delta Q}{\Delta t} = kA\frac{\Delta T}{\Delta x}`], keywords: ["conductivity"] },
        { name: "Stefan–Boltzmann law", math: [r`L = \sigma A T^4`], keywords: ["luminosity", "black body", "radiation"] },
        { name: "Wien’s displacement law", math: [r`\lambda_{\max} T = 2.9 \times 10^{-3}\ \text{m K}`], keywords: ["peak wavelength", "black body"] },
        { name: "Apparent brightness", math: [r`b = \frac{L}{4\pi d^2}`], keywords: ["intensity", "inverse square"] },
      ],
    },
    {
      topic: "B",
      title: "Greenhouse effect",
      entries: [
        { name: "Emissivity", math: [r`\text{emissivity} = \frac{\text{power radiated per unit area}}{\sigma T^4}`] },
        { name: "Albedo", math: [r`\text{albedo} = \frac{\text{total scattered power}}{\text{total incident power}}`], keywords: ["reflected"] },
      ],
    },
    {
      topic: "B",
      title: "Gas laws",
      entries: [
        { name: "Pressure", math: [r`P = \frac{F}{A}`] },
        { name: "Amount of substance", math: [r`n = \frac{N}{N_A}`], keywords: ["moles"] },
        { name: "Ideal gas", math: [r`\frac{PV}{T} = \text{constant}`, r`PV = Nk_B T = nRT`], keywords: ["equation of state"] },
        { name: "Pressure from kinetic theory", math: [r`P = \frac{1}{3}\rho\overline{v^2}`], keywords: ["mean square speed"] },
        { name: "Internal energy of an ideal monatomic gas", math: [r`U = \frac{3}{2}Nk_B T = \frac{3}{2}nRT`] },
      ],
    },
    {
      topic: "B",
      title: "Thermodynamics",
      entries: [
        { name: "First law of thermodynamics", math: [r`Q = \Delta U + W`], hl: true },
        { name: "Work done by a gas", math: [r`W = P\Delta V`], hl: true },
        { name: "Change in internal energy (monatomic)", math: [r`\Delta U = \frac{3}{2}Nk_B\Delta T = \frac{3}{2}nR\Delta T`], hl: true },
        { name: "Entropy", math: [r`\Delta S = \frac{\Delta Q}{T}`, r`S = k_B\ln\Omega`], hl: true },
        { name: "Adiabatic process (monatomic)", math: [r`PV^{\frac{5}{3}} = \text{constant}`], hl: true },
        { name: "Efficiency of a heat engine", math: [r`\eta = \frac{\text{useful work}}{\text{input energy}}`, r`\eta_{\text{Carnot}} = 1 - \frac{T_c}{T_h}`], hl: true },
      ],
    },
    {
      topic: "B",
      title: "Current and circuits",
      entries: [
        { name: "Current", math: [r`I = \frac{\Delta q}{\Delta t}`] },
        { name: "Potential difference", math: [r`V = \frac{W}{q}`], keywords: ["voltage"] },
        { name: "Resistance and resistivity", math: [r`R = \frac{V}{I}`, r`\rho = \frac{RA}{L}`] },
        { name: "Electrical power", math: [r`P = IV = I^2R = \frac{V^2}{R}`] },
        { name: "Series circuits", math: [r`I = I_1 = I_2 = \cdots`, r`V = V_1 + V_2 + \cdots`, r`R_s = R_1 + R_2 + \cdots`], keywords: ["resistors"] },
        { name: "Parallel circuits", math: [r`I = I_1 + I_2 + \cdots`, r`V = V_1 = V_2 = \cdots`, r`\frac{1}{R_p} = \frac{1}{R_1} + \frac{1}{R_2} + \cdots`], keywords: ["resistors"] },
        { name: "EMF and internal resistance", math: [r`\varepsilon = I(R + r)`], keywords: ["cell", "battery"] },
      ],
    },

    // ── C Wave behaviour ──────────────────────────────────────────────
    {
      topic: "C",
      title: "Simple harmonic motion",
      entries: [
        { name: "Period, frequency and angular frequency", math: [r`T = \frac{1}{f} = \frac{2\pi}{\omega}`] },
        { name: "Defining equation", math: [r`a = -\omega^2 x`], keywords: ["SHM"] },
        { name: "Mass on a spring", math: [r`T = 2\pi\sqrt{\frac{m}{k}}`], keywords: ["oscillator", "period"] },
        { name: "Simple pendulum", math: [r`T = 2\pi\sqrt{\frac{l}{g}}`], keywords: ["period"] },
        {
          name: "Displacement and velocity",
          math: [r`x = x_0\sin(\omega t + \phi)`, r`v = \omega x_0\cos(\omega t + \phi)`, r`v = \pm\,\omega\sqrt{x_0^2 - x^2}`],
          hl: true,
          keywords: ["SHM", "phase"],
        },
        { name: "Energy in SHM", math: [r`E_T = \frac{1}{2}m\omega^2 x_0^2`, r`E_p = \frac{1}{2}m\omega^2 x^2`], hl: true },
      ],
    },
    {
      topic: "C",
      title: "Waves",
      entries: [
        { name: "Wave equation", math: [r`v = f\lambda = \frac{\lambda}{T}`], keywords: ["speed", "wavelength"] },
        { name: "Refraction (Snell’s law)", math: [r`\frac{n_1}{n_2} = \frac{\sin\theta_2}{\sin\theta_1} = \frac{v_2}{v_1}`], keywords: ["refractive index"] },
        { name: "Double-slit interference", math: [r`s = \frac{\lambda D}{d}`], keywords: ["fringe spacing", "Young"] },
        { name: "Constructive and destructive interference", math: [r`\text{path difference} = n\lambda`, r`\text{path difference} = \left(n + \frac{1}{2}\right)\lambda`] },
        { name: "Single-slit diffraction (first minimum)", math: [r`\theta = \frac{\lambda}{b}`], hl: true },
        { name: "Diffraction grating", math: [r`n\lambda = d\sin\theta`], hl: true, keywords: ["multiple slits"] },
      ],
    },
    {
      topic: "C",
      title: "Doppler effect",
      entries: [
        { name: "Electromagnetic waves", math: [r`\frac{\Delta f}{f} = \frac{\Delta\lambda}{\lambda} \approx \frac{v}{c}`], keywords: ["redshift", "light"] },
        { name: "Moving source", math: [r`f' = f\left(\frac{v}{v \pm u_s}\right)`], hl: true, keywords: ["sound"] },
        { name: "Moving observer", math: [r`f' = f\left(\frac{v \pm u_o}{v}\right)`], hl: true, keywords: ["sound"] },
      ],
    },

    // ── D Fields ──────────────────────────────────────────────────────
    {
      topic: "D",
      title: "Gravitational fields",
      entries: [
        { name: "Newton’s law of gravitation", math: [r`F = G\frac{m_1 m_2}{r^2}`] },
        { name: "Gravitational field strength", math: [r`g = \frac{F}{m} = G\frac{M}{r^2}`] },
        { name: "Gravitational potential energy and potential", math: [r`E_p = -G\frac{m_1 m_2}{r}`, r`V_g = -G\frac{M}{r}`], hl: true },
        { name: "Field strength and potential", math: [r`g = -\frac{\Delta V_g}{\Delta r}`, r`W = m\Delta V_g`], hl: true },
        { name: "Escape and orbital speed", math: [r`v_{\text{esc}} = \sqrt{\frac{2GM}{r}}`, r`v_{\text{orbital}} = \sqrt{\frac{GM}{r}}`], hl: true, keywords: ["satellite", "orbit"] },
      ],
    },
    {
      topic: "D",
      title: "Electric and magnetic fields",
      entries: [
        { name: "Coulomb’s law", math: [r`F = k\frac{q_1 q_2}{r^2}`, r`k = \frac{1}{4\pi\varepsilon_0}`] },
        { name: "Electric field strength", math: [r`E = \frac{F}{q}`, r`E = \frac{V}{d} \quad \text{(uniform field)}`], keywords: ["parallel plates"] },
        { name: "Electric potential energy and potential", math: [r`E_p = k\frac{q_1 q_2}{r}`, r`V_e = \frac{kQ}{r}`], hl: true },
        { name: "Field strength and potential", math: [r`E = -\frac{\Delta V_e}{\Delta r}`, r`W = q\Delta V_e`], hl: true },
      ],
    },
    {
      topic: "D",
      title: "Motion in electromagnetic fields",
      entries: [
        { name: "Force on a moving charge", math: [r`F = qvB\sin\theta`] },
        { name: "Force on a current-carrying conductor", math: [r`F = BIL\sin\theta`] },
        { name: "Force between two parallel wires", math: [r`\frac{F}{L} = \mu_0\frac{I_1 I_2}{2\pi r}`] },
      ],
    },
    {
      topic: "D",
      title: "Induction",
      entries: [
        { name: "Magnetic flux", math: [r`\Phi = BA\cos\theta`], hl: true },
        { name: "Faraday’s law", math: [r`\varepsilon = -N\frac{\Delta\Phi}{\Delta t}`], hl: true, keywords: ["Lenz", "emf"] },
        { name: "Moving conductor", math: [r`\varepsilon = BvL`], hl: true, keywords: ["emf"] },
      ],
    },

    // ── E Nuclear and quantum physics ─────────────────────────────────
    {
      topic: "E",
      title: "Atoms and photons",
      entries: [
        { name: "Photon energy", math: [r`E = hf`] },
        { name: "Nuclear radius", math: [r`R = R_0 A^{\frac{1}{3}}`], hl: true },
        { name: "Bohr model of hydrogen", math: [r`E = -\frac{13.6}{n^2}\ \text{eV}`, r`mvr = \frac{nh}{2\pi}`], hl: true, keywords: ["energy levels"] },
        { name: "Photoelectric effect", math: [r`E_{\max} = hf - \Phi`], hl: true, keywords: ["work function"] },
        { name: "de Broglie wavelength", math: [r`\lambda = \frac{h}{p}`], hl: true, keywords: ["matter waves"] },
        { name: "Compton scattering", math: [r`\lambda_f - \lambda_i = \Delta\lambda = \frac{h}{m_e c}(1 - \cos\theta)`], hl: true },
      ],
    },
    {
      topic: "E",
      title: "Radioactive decay and energy",
      entries: [
        { name: "Mass–energy equivalence", math: [r`E = mc^2`], keywords: ["binding energy", "mass defect"] },
        { name: "Radioactive decay law", math: [r`N = N_0 e^{-\lambda t}`, r`A = \lambda N = \lambda N_0 e^{-\lambda t}`], hl: true, keywords: ["activity", "decay constant"] },
        { name: "Half-life and decay constant", math: [r`T_{\frac{1}{2}} = \frac{\ln 2}{\lambda}`], hl: true },
      ],
    },
    {
      topic: "E",
      title: "Stars",
      entries: [
        { name: "Parallax distance", math: [r`d\,(\text{pc}) = \frac{1}{p\,(\text{arc-second})}`], keywords: ["parsec"] },
      ],
    },
  ],
};
