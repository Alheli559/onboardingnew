import grupoColor from '../assets/grupo-color.webp'
import friopacking from '../assets/friopacking.png'
import frioteam from '../assets/frioteam.png'
import coldtainer from '../assets/coldtainer.png'
import colombia from '../assets/colombia.png'
import mexico from '../assets/mexico.png'
import hermetica from '../assets/hermetica.png'
import grupo from '../assets/grupo.webp'

export { grupo, grupoColor }

// [imagen, ancho en px, desplazamiento izquierdo para compensar márgenes del archivo]
export const LOGOS = {
  'grupo friopacking': [grupoColor, 112, 0],
  friopacking: [friopacking, 140, 0],
  frioteam: [frioteam, 140, 0],
  coldtainer: [coldtainer, 164, -12],
  'friopacking colombia': [colombia, 146, -2],
  'hermética': [hermetica, 136, 0],
  hermetica: [hermetica, 136, 0],
  'friopacking méxico': [mexico, 150, 0],
  'friopacking mexico': [mexico, 150, 0],
}