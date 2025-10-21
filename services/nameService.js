/**
 * Servicio para procesar nombres y separar nombres de apellidos
 */

class NameService {
  
  /**
   * Separa un nombre completo en nombres y apellidos
   * @param {string} nombreCompleto - El nombre completo a separar
   * @returns {object} - Objeto con nombres y apellidos separados
   */
  static separarNombre(nombreCompleto) {
    if (!nombreCompleto || typeof nombreCompleto !== 'string') {
      return {
        nombres: '',
        apellidos: ''
      };
    }

    // Limpiar el nombre
    const nombreLimpio = nombreCompleto.trim().toUpperCase();
    
    // Dividir por espacios
    const partes = nombreLimpio.split(/\s+/).filter(parte => parte.length > 0);
    
    if (partes.length === 0) {
      return {
        nombres: '',
        apellidos: ''
      };
    }

    // Si solo hay una parte, asumir que es nombre
    if (partes.length === 1) {
      return {
        nombres: partes[0],
        apellidos: ''
      };
    }

    // Si hay dos partes, la primera es nombre y la segunda apellido
    if (partes.length === 2) {
      return {
        nombres: partes[0],
        apellidos: partes[1]
      };
    }

    // Si hay más de dos partes, separar nombres y apellidos
    // Generalmente los apellidos son los últimos 1-2 elementos
    // y los nombres son el resto
    
    // Lista de palabras que comúnmente son nombres (no apellidos)
    const nombresComunes = [
      'MARIA', 'JOSE', 'JUAN', 'CARLOS', 'LUIS', 'ANTONIO', 'FRANCISCO',
      'MANUEL', 'DAVID', 'DANIEL', 'RAFAEL', 'PEDRO', 'JESUS', 'MIGUEL',
      'ALEJANDRO', 'ROBERTO', 'FERNANDO', 'SERGIO', 'ANDRES', 'DIEGO',
      'ELENA', 'ANA', 'CARMEN', 'LAURA', 'ISABEL', 'PATRICIA', 'MONICA',
      'ADRIANA', 'ALEJANDRA', 'ANDREA', 'BEATRIZ', 'CLAUDIA', 'DOLORES',
      'FRANCISCA', 'GLORIA', 'GUADALUPE', 'JOSEFINA', 'LUCIA', 'MARGARITA',
      'MARTA', 'MERCEDES', 'NATALIA', 'OLGA', 'PILAR', 'RAQUEL', 'ROSA',
      'SILVIA', 'SOFIA', 'TERESA', 'VICTORIA', 'YOLANDA'
    ];

    // Intentar identificar nombres y apellidos
    let nombres = [];
    let apellidos = [];

    // Si la primera palabra es un nombre común, probablemente es nombre
    if (nombresComunes.includes(partes[0])) {
      // Buscar hasta encontrar una palabra que no sea nombre común
      let i = 0;
      while (i < partes.length && nombresComunes.includes(partes[i])) {
        nombres.push(partes[i]);
        i++;
      }
      
      // El resto son apellidos
      apellidos = partes.slice(i);
    } else {
      // Si la primera palabra no es un nombre común, asumir que es nombre
      // y los últimos 1-2 elementos son apellidos
      if (partes.length <= 3) {
        nombres = [partes[0]];
        apellidos = partes.slice(1);
      } else {
        // Para nombres más largos, tomar los primeros como nombres
        // y los últimos 2 como apellidos
        nombres = partes.slice(0, partes.length - 2);
        apellidos = partes.slice(-2);
      }
    }

    // Si no se encontraron apellidos, tomar la última parte
    if (apellidos.length === 0 && nombres.length > 0) {
      apellidos = [nombres.pop()];
    }

    return {
      nombres: nombres.join(' '),
      apellidos: apellidos.join(' ')
    };
  }

  /**
   * Normaliza un nombre eliminando caracteres especiales y estandarizando
   * @param {string} nombre - El nombre a normalizar
   * @returns {string} - El nombre normalizado
   */
  static normalizarNombre(nombre) {
    if (!nombre || typeof nombre !== 'string') {
      return '';
    }

    return nombre
      .trim()
      .toUpperCase()
      .replace(/[^\w\s]/g, '') // Eliminar caracteres especiales
      .replace(/\s+/g, ' '); // Normalizar espacios
  }

  /**
   * Verifica si dos nombres son similares (para búsquedas)
   * @param {string} nombre1 - Primer nombre
   * @param {string} nombre2 - Segundo nombre
   * @returns {boolean} - True si son similares
   */
  static nombresSimilares(nombre1, nombre2) {
    if (!nombre1 || !nombre2) {
      return false;
    }

    const n1 = this.normalizarNombre(nombre1);
    const n2 = this.normalizarNombre(nombre2);

    // Coincidencia exacta
    if (n1 === n2) {
      return true;
    }

    // Coincidencia parcial (uno contiene al otro)
    if (n1.includes(n2) || n2.includes(n1)) {
      return true;
    }

    // Coincidencia por palabras individuales
    const palabras1 = n1.split(' ');
    const palabras2 = n2.split(' ');

    // Si al menos la mitad de las palabras coinciden
    const coincidencias = palabras1.filter(palabra => 
      palabras2.some(palabra2 => palabra === palabra2)
    );

    return coincidencias.length >= Math.min(palabras1.length, palabras2.length) / 2;
  }
}

module.exports = NameService;
