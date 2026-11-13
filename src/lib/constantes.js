// Constantes del dashboard: etapas, preguntas, niveles y temas.
export const EMPRESAS = ['Friopacking', 'Frioteam', 'Coldtainer', 'Friopacking Colombia', 'Friopacking México'];
export const ETAPAS = [15, 30, 60, 90];
export const MESES = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'set.', 'oct.', 'nov.', 'dic.'];
export const META = 4;
export const ARC = 282.7;
export const REALIZADO = ['Alhelí Carrasco', 'Patricia Clausen'];
export const NIVELES = ['Muy buena adaptación', 'Buena adaptación', 'Adaptación en proceso', 'Riesgo medio', 'Riesgo alto'];
export const EMOJI = { 1: '😞', 2: '🙁', 3: '😐', 4: '🙂', 5: '😄' };
export const TONO = { pos: { i: '✓', l: 'Positivo' }, neu: { i: '–', l: 'Sugerencia' }, info: { i: '·', l: 'Informativo' }, neg: { i: '!', l: 'Por mejorar' }, '': { i: '?', l: 'Sin clasificar' } };
export const ESCALA_L = { 1: 'Muy bajo', 2: 'Bajo', 3: 'Regular', 4: 'Bueno', 5: 'Muy bueno' };
export const CERR = {
  15: [['Recibimiento', '¿Qué tan bien recibido/a te has sentido por tu jefe y compañeros desde tu ingreso?'], ['Claridad de funciones', '¿Qué tan claras tienes tus funciones principales y lo que se espera de ti?'], ['Recursos y herramientas', '¿Qué tan adecuados han sido los recursos, accesos o herramientas que recibiste para realizar tu trabajo?'], ['Confianza para pedir apoyo', '¿Qué tanta confianza tienes para hacer preguntas o pedir apoyo cuando lo necesitas?'], ['Cumplimiento de expectativas', '¿Qué tanto tu experiencia hasta el momento coincide con lo que esperabas al ingresar?']],
  30: [['Integración al equipo', '¿Qué tan integrado/a te sientes con tu equipo de trabajo?'], ['Orientación y feedback', '¿Qué tan útil ha sido la orientación o retroalimentación que has recibido hasta ahora?'], ['Comprensión de procedimientos', '¿Qué tanto comprendes los procedimientos, normas y dinámica de tu área?'], ['Manejo de carga laboral', '¿Qué tan manejable consideras tu carga de trabajo en esta etapa?'], ['Motivación', '¿Qué tan motivado/a te sientes para continuar aprendiendo y desarrollándote en la empresa?']],
  60: [['Mejora del desempeño', '¿Qué tanto sientes que tu desempeño ha mejorado desde tu ingreso?'], ['Autonomía', '¿Qué tanta autonomía tienes actualmente para realizar tus funciones correctamente?'], ['Apoyo de jefatura', '¿Qué tanto la relación con tu jefe inmediato favorece tu adaptación y desempeño?'], ['Ambiente laboral', '¿Qué tan cómodo/a te sientes con el ambiente laboral y la cultura de la empresa?'], ['Equilibrio y bienestar', '¿Qué tan equilibradas sientes las exigencias del puesto con tu bienestar personal?']],
  90: [['Adaptación al puesto', '¿Qué tan adaptado/a te sientes actualmente a tu puesto y a la dinámica de la empresa?'], ['Reconocimiento', '¿Qué tan valorado/a te sientes por el trabajo que realizas?'], ['Oportunidades de desarrollo', '¿Qué tantas oportunidades de aprendizaje, crecimiento o estabilidad ves dentro de la empresa?'], ['Recomendación de la empresa', '¿Qué tan dispuesto/a estarías a recomendar la empresa como un buen lugar para trabajar?'], ['Intención de permanencia', '¿Qué tan interesado/a estás en continuar trabajando en la empresa durante el siguiente año?']]
};
export const ABIER = {
  15: ['¿Qué te ha ayudado más a adaptarte durante estos primeros días?', '¿Qué dificultad, duda o situación incómoda has tenido hasta el momento?', '¿Hay algo que te preocupe o que consideres importante revisar desde ahora?'],
  30: ['¿Qué has aprendido durante este primer mes que te ha ayudado a desempeñarte mejor?', '¿Qué aspecto del puesto, del área o de la empresa aún necesitas comprender mejor?', '¿Qué apoyo adicional consideras necesario para consolidar tu adaptación?'],
  60: ['¿En qué aspectos sientes que has evolucionado desde tu ingreso?', '¿Qué situaciones han favorecido o dificultado tu adaptación hasta ahora?', '¿Qué necesitarías para sentirte más estable, productivo/a o comprometido/a?'],
  90: ['¿Qué factores influyen más en tu decisión de continuar en la empresa?', '¿Qué aspectos deberían mejorar para fortalecer tu experiencia laboral?', '¿Qué expectativas tienes sobre tu desarrollo o continuidad dentro de la empresa?']
};
export const TEMAS = ['Accesos y herramientas', 'Acompañamiento de jefatura', 'Adaptación al puesto', 'Ambiente laboral', 'Apoyo del equipo', 'Aprendizaje', 'Autonomía', 'Capacitación', 'Carga de trabajo y plazos', 'Claridad de funciones', 'Comunicación interna', 'Confianza y seguridad', 'Equilibrio y bienestar', 'Espacio de trabajo', 'Expectativas del puesto', 'Inducción y traspaso', 'Iniciativa propia', 'Integración con el equipo', 'Línea de carrera', 'Motivación y compromiso', 'Procedimientos del área', 'Reconocimiento', 'Retroalimentación', 'Sin observaciones', 'Trato entre compañeros'];
export const AREAS = ['Ingeniería', 'Operaciones', 'Administración y Finanzas', 'Comercial'];
