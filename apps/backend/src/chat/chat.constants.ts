export interface Sucursal {
  nombre: string;
  direccion: string;
  telefono: string;
  horario: string;
  ciudad: string;
  link_wa?: string;
}

export interface FAQ {
  pregunta: string;
  respuesta: string;
  categoria: 'ventas' | 'socios' | 'soporte' | 'cobertura';
}

export const KNOWLEDGE_BASE = {
  empresa: {
    nombre: "Grupo Línea Digital",
    perfil: "Distribuidor Autorizado Premium Telcel en el Sureste.",
    slogan: "Conectamos tu mundo a la velocidad de 5G.",
    contacto_ventas: "961 618 92 00"
  },

  sucursales: [
    {
      nombre: "Corporativo Tuxtla",
      ciudad: "Tuxtla Gutiérrez",
      direccion: "1a Av. Norte Poniente #834, Centro.",
      telefono: "961 618 92 00",
      horario: "Lunes a Viernes: 9am - 6pm",
      link_wa: "https://wa.me/529616189200"
    },
    {
      nombre: "Sucursal Tapachula",
      ciudad: "Tapachula",
      direccion: "4a. Av. Nte. 70, Los Naranjos.",
      telefono: "962 625 58 10",
      horario: "Lunes a Viernes: 9am - 6pm",
      link_wa: "https://wa.me/529626255810"
    }
  ] as Sucursal[],

  faqs: [
    { pregunta: "¿Qué necesito para sacar un plan?", respuesta: "Solo tu INE vigente, comprobante de domicilio reciente y una tarjeta bancaria (crédito/débito).", categoria: "ventas" },
    { pregunta: "¿Venden al mayoreo?", respuesta: "Sí. Manejamos precios especiales a partir de 3 piezas para distribuidores registrados.", categoria: "socios" },
    { pregunta: "¿Cómo me vuelvo distribuidor?", respuesta: "Es gratis y rápido. Te damos de alta el mismo día para que vendas tiempo aire y chips.", categoria: "socios" },
    { pregunta: "¿Tienen cobertura en mi zona?", respuesta: "Cubrimos el 95% de Chiapas con red 4.5G y las principales ciudades con 5G.", categoria: "cobertura" }
  ] as FAQ[],

  intents: {
    comprar: ["comprar", "precio", "costo", "plan", "interesa", "iphone", "samsung", "quiero"],
    negocio: ["vender", "distribuidor", "mayoreo", "comisión", "socio", "proveedor"],
    soporte: ["ayuda", "falla", "no sirve", "garantía", "señal"],
    contacto: ["ubicación", "dónde están", "teléfono", "whatsapp"]
  }
};
