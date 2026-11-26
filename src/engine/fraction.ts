/**
 * Fracción exacta con enteros. Siempre queda simplificada, con el signo
 * en el numerador y denominador positivo. Nada de decimales flotantes:
 * así 1/3 + 1/3 + 1/3 es exactamente 1.
 */

export function mcd(a: number, b: number): number {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b !== 0) {
    ;[a, b] = [b, a % b]
  }
  return a
}

function entero(n: number, nombre: string) {
  if (!Number.isSafeInteger(n)) throw new RangeError(`${nombre} debe ser un entero seguro: ${n}`)
}

export class Fraction {
  readonly num: number
  readonly den: number

  private constructor(num: number, den: number) {
    this.num = num
    this.den = den
  }

  static of(num: number, den = 1): Fraction {
    entero(num, 'numerador')
    entero(den, 'denominador')
    if (den === 0) throw new RangeError('El denominador no puede ser cero')
    if (den < 0) {
      num = -num
      den = -den
    }
    const g = mcd(num, den) || 1
    const n = num / g
    return new Fraction(n === 0 ? 0 : n, den / g)
  }

  static readonly cero = Fraction.of(0)
  static readonly uno = Fraction.of(1)

  add(o: Fraction): Fraction {
    return Fraction.of(this.num * o.den + o.num * this.den, this.den * o.den)
  }

  sub(o: Fraction): Fraction {
    return this.add(o.neg())
  }

  mul(o: Fraction): Fraction {
    return Fraction.of(this.num * o.num, this.den * o.den)
  }

  div(o: Fraction): Fraction {
    if (o.num === 0) throw new RangeError('División entre cero')
    return Fraction.of(this.num * o.den, this.den * o.num)
  }

  neg(): Fraction {
    return Fraction.of(-this.num, this.den)
  }

  inv(): Fraction {
    return Fraction.of(this.den, this.num)
  }

  /** Potencia con exponente entero (negativo = inverso). */
  pow(k: number): Fraction {
    entero(k, 'exponente')
    if (k < 0) return this.inv().pow(-k)
    let r = Fraction.uno
    for (let i = 0; i < k; i++) r = r.mul(this)
    return r
  }

  equals(o: Fraction): boolean {
    return this.num === o.num && this.den === o.den
  }

  compare(o: Fraction): number {
    return Math.sign(this.num * o.den - o.num * this.den)
  }

  isZero(): boolean {
    return this.num === 0
  }

  isInteger(): boolean {
    return this.den === 1
  }

  /** Texto que el lector de respuestas entiende: "3", "-3/4". */
  toString(): string {
    return this.den === 1 ? `${this.num}` : `${this.num}/${this.den}`
  }
}

/** Atajo: f(3), f(-3, 4). */
export const f = (num: number, den = 1) => Fraction.of(num, den)
