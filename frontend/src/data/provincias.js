export const PROVINCIAS = [
  { provincia: 'Álava', comunidad: 'País Vasco' },
  { provincia: 'Albacete', comunidad: 'Castilla-La Mancha' },
  { provincia: 'Alicante', comunidad: 'Comunidad Valenciana' },
  { provincia: 'Almería', comunidad: 'Andalucía' },
  { provincia: 'Asturias', comunidad: 'Asturias' },
  { provincia: 'Ávila', comunidad: 'Castilla y León' },
  { provincia: 'Badajoz', comunidad: 'Extremadura' },
  { provincia: 'Barcelona', comunidad: 'Cataluña' },
  { provincia: 'Burgos', comunidad: 'Castilla y León' },
  { provincia: 'Cáceres', comunidad: 'Extremadura' },
  { provincia: 'Cádiz', comunidad: 'Andalucía' },
  { provincia: 'Cantabria', comunidad: 'Cantabria' },
  { provincia: 'Castellón', comunidad: 'Comunidad Valenciana' },
  { provincia: 'Ciudad Real', comunidad: 'Castilla-La Mancha' },
  { provincia: 'Córdoba', comunidad: 'Andalucía' },
  { provincia: 'Cuenca', comunidad: 'Castilla-La Mancha' },
  { provincia: 'Girona', comunidad: 'Cataluña' },
  { provincia: 'Granada', comunidad: 'Andalucía' },
  { provincia: 'Guadalajara', comunidad: 'Castilla-La Mancha' },
  { provincia: 'Guipúzcoa', comunidad: 'País Vasco' },
  { provincia: 'Huelva', comunidad: 'Andalucía' },
  { provincia: 'Huesca', comunidad: 'Aragón' },
  { provincia: 'Islas Baleares', comunidad: 'Islas Baleares' },
  { provincia: 'Jaén', comunidad: 'Andalucía' },
  { provincia: 'La Coruña', comunidad: 'Galicia' },
  { provincia: 'La Rioja', comunidad: 'La Rioja' },
  { provincia: 'Las Palmas', comunidad: 'Canarias' },
  { provincia: 'León', comunidad: 'Castilla y León' },
  { provincia: 'Lleida', comunidad: 'Cataluña' },
  { provincia: 'Lugo', comunidad: 'Galicia' },
  { provincia: 'Madrid', comunidad: 'Comunidad de Madrid' },
  { provincia: 'Málaga', comunidad: 'Andalucía' },
  { provincia: 'Murcia', comunidad: 'Región de Murcia' },
  { provincia: 'Navarra', comunidad: 'Navarra' },
  { provincia: 'Ourense', comunidad: 'Galicia' },
  { provincia: 'Palencia', comunidad: 'Castilla y León' },
  { provincia: 'Pontevedra', comunidad: 'Galicia' },
  { provincia: 'Salamanca', comunidad: 'Castilla y León' },
  { provincia: 'Santa Cruz de Tenerife', comunidad: 'Canarias' },
  { provincia: 'Segovia', comunidad: 'Castilla y León' },
  { provincia: 'Sevilla', comunidad: 'Andalucía' },
  { provincia: 'Soria', comunidad: 'Castilla y León' },
  { provincia: 'Tarragona', comunidad: 'Cataluña' },
  { provincia: 'Teruel', comunidad: 'Aragón' },
  { provincia: 'Toledo', comunidad: 'Castilla-La Mancha' },
  { provincia: 'Valencia', comunidad: 'Comunidad Valenciana' },
  { provincia: 'Valladolid', comunidad: 'Castilla y León' },
  { provincia: 'Vizcaya', comunidad: 'País Vasco' },
  { provincia: 'Zamora', comunidad: 'Castilla y León' },
  { provincia: 'Zaragoza', comunidad: 'Aragón' },
  { provincia: 'Ceuta', comunidad: 'Ceuta' },
  { provincia: 'Melilla', comunidad: 'Melilla' },
];

export const CURSOS_COLEGIO = [
  { group: 'Infantil', options: ['1º Infantil', '2º Infantil', '3º Infantil'] },
  { group: 'Primaria', options: ['1º Primaria', '2º Primaria', '3º Primaria', '4º Primaria', '5º Primaria', '6º Primaria'] },
  { group: 'ESO', options: ['1º ESO', '2º ESO', '3º ESO', '4º ESO'] },
  { group: 'Bachillerato', options: ['1º Bachillerato', '2º Bachillerato'] },
];

export const TIPOS_GRUPO = ['Colegio/Instituto', 'Universidad', 'FP', 'Máster', 'Otro'];

export const PACKS = ['Físico', 'Digital', 'Premium', 'Personalizado'];

export const ESTADOS_LEAD = [
  { value: 'contactado', label: 'Contactado' },
  { value: 'no_contesta', label: 'No contesta' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'proceso_venta', label: 'Proceso venta' },
  { value: 'en_produccion', label: 'En producción' },
  { value: 'en_envio', label: 'En envío' },
  { value: 'completado', label: 'Completado' },
  { value: 'perdido', label: 'Perdido' },
];

export const ESTADO_CONFIG = {
  contactado:    { label: 'Contactado',    color: '#4a9eff', bg: 'rgba(74,158,255,0.12)' },
  no_contesta:   { label: 'No contesta',   color: '#888',    bg: 'rgba(136,136,136,0.12)' },
  en_proceso:    { label: 'En proceso',    color: '#f0a500', bg: 'rgba(240,165,0,0.12)' },
  proceso_venta: { label: 'Proceso venta', color: '#ff8c42', bg: 'rgba(255,140,66,0.12)' },
  en_produccion: { label: 'En producción', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  en_envio:      { label: 'En envío',      color: '#22c5b0', bg: 'rgba(34,197,176,0.12)' },
  completado:    { label: 'Completado',    color: '#4cae74', bg: 'rgba(76,174,116,0.12)' },
  perdido:       { label: 'Perdido',       color: '#e05252', bg: 'rgba(224,82,82,0.12)' },
};

export const ESTADO_APROBACION_CONFIG = {
  pendiente: { label: 'Pendiente', color: '#f0a500', bg: 'rgba(240,165,0,0.12)' },
  aprobado:  { label: 'Aprobado',  color: '#4cae74', bg: 'rgba(76,174,116,0.12)' },
};

export const ESTADO_FOTOGRAFO_CONFIG = {
  sin_empezar:       { label: 'Sin empezar',       color: '#555',    bg: 'rgba(85,85,85,0.12)' },
  shooting_hecho:    { label: 'Shooting hecho',    color: '#4a9eff', bg: 'rgba(74,158,255,0.12)' },
  material_editado:  { label: 'Material editado',  color: '#f0a500', bg: 'rgba(240,165,0,0.12)' },
  material_importado:{ label: 'Material importado',color: '#4cae74', bg: 'rgba(76,174,116,0.12)' },
};

export const ESTADO_DISENADOR_CONFIG = {
  sin_empezar: { label: 'Sin empezar', color: '#555',    bg: 'rgba(85,85,85,0.12)' },
  en_proceso:  { label: 'En proceso',  color: '#f0a500', bg: 'rgba(240,165,0,0.12)' },
  completado:  { label: 'Completado',  color: '#4cae74', bg: 'rgba(76,174,116,0.12)' },
};

export const ROL_CONFIG = {
  administrador:      { label: 'Administrador',      color: '#c9a84c', bg: 'rgba(201,168,76,0.13)' },
  director_comercial: { label: 'Director Comercial', color: '#1e7fd4', bg: 'rgba(30,127,212,0.13)' },
  comercial:          { label: 'Comercial',          color: '#4a9eff', bg: 'rgba(74,158,255,0.13)' },
  fotografo:          { label: 'Fotógrafo',          color: '#4cae74', bg: 'rgba(76,174,116,0.13)' },
  disenador:          { label: 'Diseñador',          color: '#a855f7', bg: 'rgba(168,85,247,0.13)' },
  desarrollador:      { label: 'Desarrollador',      color: '#888',    bg: 'rgba(136,136,136,0.13)' },
};

export const ROLES_LISTA = [
  'administrador', 'director_comercial', 'comercial', 'fotografo', 'disenador', 'desarrollador',
];

export const ESTADOS_FOTOGRAFO = [
  { value: 'sin_empezar', label: 'Sin empezar' },
  { value: 'shooting_hecho', label: 'Shooting hecho' },
  { value: 'material_editado', label: 'Material editado' },
  { value: 'material_importado', label: 'Material importado' },
];

export const ESTADOS_DISENADOR = [
  { value: 'sin_empezar', label: 'Sin empezar' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'completado', label: 'Completado' },
];
