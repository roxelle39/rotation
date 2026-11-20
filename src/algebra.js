
 // Produit scalaire de deux vecteurs
export function dot(u, v) {
  return u.x * v.x + u.y * v.y + u.z * v.z
}

// Produit vectoriel
export function cross(u, v) {
  return {
    x: u.y * v.z - u.z * v.y,
    y: u.z * v.x - u.x * v.z,
    z: u.x * v.y - u.y * v.x
  }
}

// Application d'une matrice 3 × 3
export function applyMatrix(M, v) {
  return {
    x: M[0][0] * v.x + M[0][1] * v.y + M[0][2] * v.z,
    y: M[1][0] * v.x + M[1][1] * v.y + M[1][2] * v.z,
    z: M[2][0] * v.x + M[2][1] * v.y + M[2][2] * v.z
  }
}

// Produit dans l'algèbre A_M
export function multiply(A, B, M) {

  const scalar = A.a * B.a - dot(A.u, B.u)

  const uv = cross(A.u, B.u)

  const Muv = applyMatrix(M, uv)

  const vector = {
    x: A.a * B.u.x + B.a * A.u.x + Muv.x,
    y: A.a * B.u.y + B.a * A.u.y + Muv.y,
    z: A.a * B.u.z + B.a * A.u.z + Muv.z
  }

  return {
    a: scalar,
    u: vector
  }
}

// Conjugaison d'un élément de A_M
export function conjugate(q) {
  return {
    a: q.a,
    u: {
      x: -q.u.x,
      y: -q.u.y,
      z: -q.u.z
    }
  }
}

// Transformation T_M,q(p) = (q * P) * conjugate(q)
export function transformVector(p, q, M) {

  const P = {
    a: 0,
    u: {
      x: p.x,
      y: p.y,
      z: p.z
    }
  }

  const qBar = conjugate(q)

  // Première multiplication : q * P
  const firstProduct = multiply(q, P, M)

  // Deuxième multiplication : (q * P) * qBar
  const finalProduct = multiply(firstProduct, qBar, M)

  return finalProduct
}

export function transformSVector(p, q, M) {

  const P = {
    a: 0,
    u: {
      x: p.x,
      y: p.y,
      z: p.z
    }
  }

  const qBar = conjugate(q)

  // Première multiplication : P * qBar
  const firstProduct = multiply(P, qBar, M)

  // Deuxième multiplication : q * (P * qBar)
  const finalProduct = multiply(q, firstProduct, M)

  return finalProduct
}
