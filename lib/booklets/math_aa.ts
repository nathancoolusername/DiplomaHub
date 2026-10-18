import type { Booklet } from "./types";

const r = String.raw;

// Maths AA (first assessment 2021). SL students see the entries without
// `hl`; HL students see everything, as in the exam.
export const MATH_AA_BOOKLET: Booklet = {
  subjectId: "math_aa",
  title: "Maths AA formulas",
  sections: [
    // ── 1 Number and algebra ──────────────────────────────────────────
    {
      topic: "1",
      title: "Sequences and series",
      entries: [
        { name: "Arithmetic sequence: nth term", math: [r`u_n = u_1 + (n-1)d`], keywords: ["AP", "common difference"] },
        {
          name: "Arithmetic series: sum of n terms",
          math: [r`S_n = \frac{n}{2}\left(2u_1 + (n-1)d\right)`, r`S_n = \frac{n}{2}\left(u_1 + u_n\right)`],
          keywords: ["AP", "sum"],
        },
        { name: "Geometric sequence: nth term", math: [r`u_n = u_1 r^{\,n-1}`], keywords: ["GP", "common ratio"] },
        {
          name: "Geometric series: sum of n terms",
          math: [r`S_n = \frac{u_1\left(r^n - 1\right)}{r - 1}`, r`S_n = \frac{u_1\left(1 - r^n\right)}{1 - r}`],
          condition: r`r \ne 1`,
          keywords: ["GP", "sum"],
        },
        { name: "Geometric series: sum to infinity", math: [r`S_\infty = \frac{u_1}{1 - r}`], condition: r`|r| < 1`, keywords: ["GP", "infinite", "convergent"] },
        { name: "Compound interest", math: [r`FV = PV \times \left(1 + \frac{r}{100k}\right)^{kn}`], keywords: ["future value", "present value", "finance"] },
        { name: "Percentage error", math: [r`\varepsilon = \left|\frac{v_A - v_E}{v_E}\right| \times 100\%`], keywords: ["approximate", "exact", "error"] },
      ],
    },
    {
      topic: "1",
      title: "Exponents and logarithms",
      entries: [
        { name: "Definition of a logarithm", math: [r`a^x = b \iff x = \log_a b`], condition: r`a > 0,\ b > 0,\ a \ne 1`, keywords: ["log"] },
        { name: "Inverse relationship", math: [r`\log_a a^x = x = a^{\log_a x}`], keywords: ["log"] },
        {
          name: "Laws of logarithms",
          math: [r`\log_a xy = \log_a x + \log_a y`, r`\log_a \frac{x}{y} = \log_a x - \log_a y`, r`\log_a x^m = m\log_a x`],
          keywords: ["log", "rules"],
        },
        { name: "Change of base", math: [r`\log_a x = \frac{\log_b x}{\log_b a}`], keywords: ["log"] },
        { name: "Exponential with base e", math: [r`a^x = e^{x \ln a}`], keywords: ["exponential", "ln"] },
      ],
    },
    {
      topic: "1",
      title: "Counting and the binomial theorem",
      entries: [
        { name: "Binomial coefficient", math: [r`\binom{n}{r} = {}^nC_r = \frac{n!}{r!\,(n-r)!}`], keywords: ["choose", "combinations"] },
        {
          name: "Binomial theorem",
          math: [r`(a+b)^n = a^n + \binom{n}{1}a^{n-1}b + \cdots + \binom{n}{r}a^{n-r}b^r + \cdots + b^n`],
          condition: r`n \in \mathbb{N}`,
          keywords: ["expansion"],
        },
        { name: "Permutations", math: [r`{}^nP_r = \frac{n!}{(n-r)!}`], hl: true, keywords: ["arrangements", "order"] },
        {
          name: "Binomial theorem for any rational n",
          math: [r`(1+x)^n = 1 + nx + \frac{n(n-1)}{2!}x^2 + \cdots`],
          condition: r`n \in \mathbb{Q},\ |x| < 1`,
          hl: true,
          keywords: ["expansion", "series", "fractional", "negative"],
        },
      ],
    },
    {
      topic: "1",
      title: "Complex numbers",
      entries: [
        { name: "Cartesian form", math: [r`z = a + bi`], hl: true, keywords: ["complex"] },
        {
          name: "Modulus–argument and Euler form",
          math: [r`z = r(\cos\theta + i\sin\theta) = re^{i\theta} = r\operatorname{cis}\theta`],
          hl: true,
          keywords: ["polar", "exponential", "cis", "complex"],
        },
        {
          name: "De Moivre’s theorem",
          math: [r`\left[r(\cos\theta + i\sin\theta)\right]^n = r^n(\cos n\theta + i\sin n\theta)`, r`\phantom{\left[r(\cos\theta + i\sin\theta)\right]^n} = r^n e^{in\theta} = r^n\operatorname{cis} n\theta`],
          hl: true,
          keywords: ["powers", "roots", "complex"],
        },
      ],
    },

    // ── 2 Functions ───────────────────────────────────────────────────
    {
      topic: "2",
      title: "Straight lines",
      entries: [
        { name: "Gradient through two points", math: [r`m = \frac{y_2 - y_1}{x_2 - x_1}`], keywords: ["slope"] },
        { name: "Equations of a line", math: [r`y = mx + c`, r`ax + by + d = 0`, r`y - y_1 = m(x - x_1)`], keywords: ["linear", "point-slope"] },
      ],
    },
    {
      topic: "2",
      title: "Quadratics and polynomials",
      entries: [
        { name: "Axis of symmetry of y = ax² + bx + c", math: [r`x = -\frac{b}{2a}`], keywords: ["vertex", "turning point", "parabola"] },
        { name: "Quadratic formula", math: [r`x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}`], condition: r`a \ne 0`, keywords: ["roots", "solve"] },
        { name: "Discriminant", math: [r`\Delta = b^2 - 4ac`], keywords: ["roots", "real", "nature"] },
        {
          name: "Sum and product of the roots of a polynomial",
          math: [r`\text{sum} = \frac{-a_{n-1}}{a_n}`, r`\text{product} = \frac{(-1)^n a_0}{a_n}`],
          condition: r`a_n x^n + a_{n-1}x^{n-1} + \cdots + a_0 = 0`,
          hl: true,
          keywords: ["roots", "coefficients", "Vieta"],
        },
      ],
    },

    // ── 3 Geometry and trigonometry ───────────────────────────────────
    {
      topic: "3",
      title: "Coordinates",
      entries: [
        { name: "Distance between two points", math: [r`d = \sqrt{(x_1 - x_2)^2 + (y_1 - y_2)^2 + (z_1 - z_2)^2}`], keywords: ["length", "3D"] },
        { name: "Midpoint", math: [r`\left(\frac{x_1 + x_2}{2},\ \frac{y_1 + y_2}{2},\ \frac{z_1 + z_2}{2}\right)`], keywords: ["middle", "3D"] },
      ],
    },
    {
      topic: "3",
      title: "Area and volume",
      entries: [
        { name: "Parallelogram", math: [r`A = bh`], keywords: ["area"] },
        { name: "Triangle", math: [r`A = \frac{1}{2}bh`], keywords: ["area"] },
        { name: "Trapezium", math: [r`A = \frac{1}{2}(a + b)h`], keywords: ["area", "trapezoid"] },
        { name: "Circle", math: [r`A = \pi r^2`, r`C = 2\pi r`], keywords: ["area", "circumference"] },
        { name: "Cuboid", math: [r`V = lwh`], keywords: ["volume", "box"] },
        { name: "Cylinder", math: [r`V = \pi r^2 h`, r`A = 2\pi r h + 2\pi r^2`], keywords: ["volume", "surface area"] },
        { name: "Prism", math: [r`V = Ah`], keywords: ["volume", "cross-section"] },
        { name: "Right pyramid", math: [r`V = \frac{1}{3}Ah`], keywords: ["volume"] },
        { name: "Right cone", math: [r`V = \frac{1}{3}\pi r^2 h`, r`A_{\text{curved}} = \pi r l`], keywords: ["volume", "surface area", "slant height"] },
        { name: "Sphere", math: [r`V = \frac{4}{3}\pi r^3`, r`A = 4\pi r^2`], keywords: ["volume", "surface area", "ball"] },
      ],
    },
    {
      topic: "3",
      title: "Triangles and circles",
      entries: [
        { name: "Sine rule", math: [r`\frac{a}{\sin A} = \frac{b}{\sin B} = \frac{c}{\sin C}`], keywords: ["triangle"] },
        { name: "Cosine rule", math: [r`c^2 = a^2 + b^2 - 2ab\cos C`, r`\cos C = \frac{a^2 + b^2 - c^2}{2ab}`], keywords: ["triangle"] },
        { name: "Area of a triangle", math: [r`A = \frac{1}{2}ab\sin C`], keywords: ["sine"] },
        { name: "Arc length", math: [r`l = r\theta`], condition: r`\theta \text{ in radians}`, keywords: ["sector", "radians"] },
        { name: "Area of a sector", math: [r`A = \frac{1}{2}r^2\theta`], condition: r`\theta \text{ in radians}`, keywords: ["radians"] },
      ],
    },
    {
      topic: "3",
      title: "Trigonometric identities",
      entries: [
        { name: "Tangent", math: [r`\tan\theta = \frac{\sin\theta}{\cos\theta}`] },
        { name: "Pythagorean identity", math: [r`\cos^2\theta + \sin^2\theta = 1`] },
        {
          name: "Double angle",
          math: [r`\sin 2\theta = 2\sin\theta\cos\theta`, r`\cos 2\theta = \cos^2\theta - \sin^2\theta = 2\cos^2\theta - 1 = 1 - 2\sin^2\theta`],
          keywords: ["double angle"],
        },
        { name: "Reciprocal functions", math: [r`\sec\theta = \frac{1}{\cos\theta}`, r`\csc\theta = \frac{1}{\sin\theta}`], hl: true, keywords: ["cosec", "sec"] },
        { name: "More Pythagorean identities", math: [r`1 + \tan^2\theta = \sec^2\theta`, r`1 + \cot^2\theta = \csc^2\theta`], hl: true },
        {
          name: "Compound angles",
          math: [
            r`\sin(A \pm B) = \sin A\cos B \pm \cos A\sin B`,
            r`\cos(A \pm B) = \cos A\cos B \mp \sin A\sin B`,
            r`\tan(A \pm B) = \frac{\tan A \pm \tan B}{1 \mp \tan A\tan B}`,
          ],
          hl: true,
          keywords: ["addition", "sum", "difference"],
        },
        { name: "Double angle for tangent", math: [r`\tan 2\theta = \frac{2\tan\theta}{1 - \tan^2\theta}`], hl: true },
      ],
    },
    {
      topic: "3",
      title: "Vectors, lines and planes",
      entries: [
        { name: "Magnitude", math: [r`|\mathbf{v}| = \sqrt{v_1^2 + v_2^2 + v_3^2}`], hl: true, keywords: ["length", "modulus"] },
        {
          name: "Scalar (dot) product",
          math: [r`\mathbf{v}\cdot\mathbf{w} = v_1w_1 + v_2w_2 + v_3w_3`, r`\mathbf{v}\cdot\mathbf{w} = |\mathbf{v}||\mathbf{w}|\cos\theta`],
          hl: true,
          keywords: ["dot"],
        },
        { name: "Angle between two vectors", math: [r`\cos\theta = \frac{v_1w_1 + v_2w_2 + v_3w_3}{|\mathbf{v}||\mathbf{w}|}`], hl: true },
        {
          name: "Vector (cross) product",
          math: [r`\mathbf{v}\times\mathbf{w} = \begin{pmatrix} v_2w_3 - v_3w_2 \\ v_3w_1 - v_1w_3 \\ v_1w_2 - v_2w_1 \end{pmatrix}`, r`|\mathbf{v}\times\mathbf{w}| = |\mathbf{v}||\mathbf{w}|\sin\theta`],
          hl: true,
          keywords: ["cross"],
        },
        { name: "Area of a parallelogram", math: [r`A = |\mathbf{v}\times\mathbf{w}|`], hl: true, keywords: ["cross product"] },
        { name: "Line: vector equation", math: [r`\mathbf{r} = \mathbf{a} + \lambda\mathbf{b}`], hl: true },
        { name: "Line: parametric form", math: [r`x = x_0 + \lambda l,\quad y = y_0 + \lambda m,\quad z = z_0 + \lambda n`], hl: true },
        { name: "Plane: vector equation", math: [r`\mathbf{r} = \mathbf{a} + \lambda\mathbf{b} + \mu\mathbf{c}`], hl: true },
        { name: "Plane: normal and Cartesian forms", math: [r`\mathbf{r}\cdot\mathbf{n} = \mathbf{a}\cdot\mathbf{n}`, r`ax + by + cz = d`], hl: true, keywords: ["normal"] },
      ],
    },

    // ── 4 Statistics and probability ──────────────────────────────────
    {
      topic: "4",
      title: "Statistics",
      entries: [
        { name: "Interquartile range", math: [r`IQR = Q_3 - Q_1`], keywords: ["IQR", "quartiles", "spread"] },
        { name: "Mean of a frequency table", math: [r`\bar{x} = \frac{\sum_{i=1}^{k} f_i x_i}{n}`], condition: r`n = \sum_{i=1}^{k} f_i`, keywords: ["average"] },
      ],
    },
    {
      topic: "4",
      title: "Probability",
      entries: [
        { name: "Probability of an event", math: [r`P(A) = \frac{n(A)}{n(U)}`] },
        { name: "Complementary events", math: [r`P(A) + P(A') = 1`], keywords: ["not"] },
        { name: "Combined events", math: [r`P(A \cup B) = P(A) + P(B) - P(A \cap B)`], keywords: ["union", "or"] },
        { name: "Mutually exclusive events", math: [r`P(A \cup B) = P(A) + P(B)`] },
        { name: "Conditional probability", math: [r`P(A \mid B) = \frac{P(A \cap B)}{P(B)}`], keywords: ["given"] },
        { name: "Independent events", math: [r`P(A \cap B) = P(A)\,P(B)`] },
        {
          name: "Bayes’ theorem",
          math: [
            r`P(B \mid A) = \frac{P(B)\,P(A \mid B)}{P(B)\,P(A \mid B) + P(B')\,P(A \mid B')}`,
            r`P(B_i \mid A) = \frac{P(B_i)\,P(A \mid B_i)}{\sum_{j=1}^{3} P(B_j)\,P(A \mid B_j)}`,
          ],
          condition: r`B_1, B_2, B_3 \text{ mutually exclusive, covering every outcome}`,
          hl: true,
          keywords: ["conditional"],
        },
      ],
    },
    {
      topic: "4",
      title: "Random variables and distributions",
      entries: [
        { name: "Expected value of a discrete random variable", math: [r`E(X) = \sum x\,P(X = x)`], keywords: ["mean", "expectation"] },
        {
          name: "Binomial distribution",
          math: [r`X \sim B(n, p)`, r`P(X = r) = \binom{n}{r}p^r(1 - p)^{n-r}`, r`E(X) = np`, r`\operatorname{Var}(X) = np(1 - p)`],
          condition: r`r = 0, 1, \ldots, n`,
          keywords: ["mean", "variance"],
        },
        { name: "Standardized normal variable", math: [r`z = \frac{x - \mu}{\sigma}`], keywords: ["normal", "z-score"] },
        {
          name: "Variance of a discrete random variable",
          math: [r`\operatorname{Var}(X) = E\left[(X - \mu)^2\right] = E(X^2) - \left[E(X)\right]^2`],
          hl: true,
        },
        { name: "Linear transformation", math: [r`E(aX + b) = aE(X) + b`, r`\operatorname{Var}(aX + b) = a^2\operatorname{Var}(X)`], hl: true },
        {
          name: "Continuous random variable",
          math: [r`E(X) = \mu = \int_{-\infty}^{\infty} x f(x)\,dx`, r`\operatorname{Var}(X) = \int_{-\infty}^{\infty} (x - \mu)^2 f(x)\,dx = \int_{-\infty}^{\infty} x^2 f(x)\,dx - \mu^2`],
          hl: true,
          keywords: ["pdf", "mean", "variance"],
        },
      ],
    },

    // ── 5 Calculus ────────────────────────────────────────────────────
    {
      topic: "5",
      title: "Derivatives",
      entries: [
        { name: "Derivative from first principles", math: [r`f'(x) = \lim_{h \to 0}\frac{f(x + h) - f(x)}{h}`], hl: true, keywords: ["limit", "definition"] },
        {
          name: "Standard derivatives",
          math: [r`\frac{d}{dx}x^n = nx^{n-1}`, r`\frac{d}{dx}\sin x = \cos x`, r`\frac{d}{dx}\cos x = -\sin x`, r`\frac{d}{dx}e^x = e^x`, r`\frac{d}{dx}\ln x = \frac{1}{x}`],
          keywords: ["differentiate"],
        },
        {
          name: "More standard derivatives",
          math: [
            r`\frac{d}{dx}\tan x = \sec^2 x`,
            r`\frac{d}{dx}\sec x = \sec x\tan x`,
            r`\frac{d}{dx}\csc x = -\csc x\cot x`,
            r`\frac{d}{dx}\cot x = -\csc^2 x`,
            r`\frac{d}{dx}a^x = a^x \ln a`,
            r`\frac{d}{dx}\log_a x = \frac{1}{x\ln a}`,
            r`\frac{d}{dx}\arcsin x = \frac{1}{\sqrt{1 - x^2}}`,
            r`\frac{d}{dx}\arccos x = -\frac{1}{\sqrt{1 - x^2}}`,
            r`\frac{d}{dx}\arctan x = \frac{1}{1 + x^2}`,
          ],
          hl: true,
          keywords: ["differentiate", "inverse trig"],
        },
        { name: "Chain rule", math: [r`y = g(u),\ u = f(x) \implies \frac{dy}{dx} = \frac{dy}{du}\times\frac{du}{dx}`], keywords: ["composite"] },
        { name: "Product rule", math: [r`y = uv \implies \frac{dy}{dx} = u\frac{dv}{dx} + v\frac{du}{dx}`] },
        { name: "Quotient rule", math: [r`y = \frac{u}{v} \implies \frac{dy}{dx} = \frac{v\dfrac{du}{dx} - u\dfrac{dv}{dx}}{v^2}`] },
      ],
    },
    {
      topic: "5",
      title: "Integrals",
      entries: [
        {
          name: "Standard integrals",
          math: [
            r`\int x^n\,dx = \frac{x^{n+1}}{n+1} + C,\quad n \ne -1`,
            r`\int \frac{1}{x}\,dx = \ln|x| + C`,
            r`\int \sin x\,dx = -\cos x + C`,
            r`\int \cos x\,dx = \sin x + C`,
            r`\int e^x\,dx = e^x + C`,
          ],
          keywords: ["integrate", "antiderivative"],
        },
        {
          name: "More standard integrals",
          math: [
            r`\int a^x\,dx = \frac{a^x}{\ln a} + C`,
            r`\int \frac{1}{a^2 + x^2}\,dx = \frac{1}{a}\arctan\frac{x}{a} + C`,
            r`\int \frac{1}{\sqrt{a^2 - x^2}}\,dx = \arcsin\frac{x}{a} + C,\quad |x| < a`,
          ],
          hl: true,
          keywords: ["integrate", "inverse trig"],
        },
        { name: "Integration by parts", math: [r`\int u\frac{dv}{dx}\,dx = uv - \int v\frac{du}{dx}\,dx`], hl: true, keywords: ["by parts"] },
        { name: "Area between a curve and the x-axis", math: [r`A = \int_a^b |y|\,dx`], keywords: ["definite integral"] },
        { name: "Area between a curve and the y-axis", math: [r`A = \int_a^b |x|\,dy`], hl: true },
        { name: "Volume of revolution", math: [r`V = \int_a^b \pi y^2\,dx \quad \text{(about the } x\text{-axis)}`, r`V = \int_a^b \pi x^2\,dy \quad \text{(about the } y\text{-axis)}`], hl: true, keywords: ["solid", "rotation"] },
      ],
    },
    {
      topic: "5",
      title: "Kinematics",
      entries: [
        { name: "Velocity and acceleration", math: [r`v = \frac{ds}{dt}`, r`a = \frac{dv}{dt} = \frac{d^2s}{dt^2} = v\frac{dv}{ds}`], keywords: ["displacement", "motion"] },
        { name: "Distance travelled", math: [r`\text{distance} = \int_{t_1}^{t_2} |v(t)|\,dt`], keywords: ["motion"] },
      ],
    },
    {
      topic: "5",
      title: "Differential equations and series",
      entries: [
        { name: "Euler’s method", math: [r`y_{n+1} = y_n + h \times f(x_n, y_n)`, r`x_{n+1} = x_n + h`], condition: r`h \text{ is the step length}`, hl: true, keywords: ["numerical"] },
        { name: "Integrating factor for y′ + P(x)y = Q(x)", math: [r`e^{\int P(x)\,dx}`], hl: true, keywords: ["first order", "linear"] },
        { name: "Maclaurin series", math: [r`f(x) = f(0) + x f'(0) + \frac{x^2}{2!}f''(0) + \cdots`], hl: true, keywords: ["Taylor", "expansion"] },
        {
          name: "Maclaurin series of special functions",
          math: [
            r`e^x = 1 + x + \frac{x^2}{2!} + \cdots`,
            r`\ln(1 + x) = x - \frac{x^2}{2} + \frac{x^3}{3} - \cdots`,
            r`\sin x = x - \frac{x^3}{3!} + \frac{x^5}{5!} - \cdots`,
            r`\cos x = 1 - \frac{x^2}{2!} + \frac{x^4}{4!} - \cdots`,
            r`\arctan x = x - \frac{x^3}{3} + \frac{x^5}{5} - \cdots`,
          ],
          hl: true,
          keywords: ["Taylor", "expansion"],
        },
      ],
    },
  ],
};
