import { PrismaClient, PostModule } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Contraseña común para todos los usuarios de prueba
const TEST_PASSWORD = 'Test1234';

async function main() {
  console.log('🌱 Iniciando seed...');

  // Limpiar datos existentes (en orden para respetar FK)
  await prisma.refreshToken.deleteMany();
  await prisma.message.deleteMany();
  await prisma.report.deleteMany();
  await prisma.tripBooking.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash(TEST_PASSWORD, 10);

  // ── Usuarios ─────────────────────────────────────────────────────────────
  const [carlos, maria, juan, ana, diego] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'carlos@kiwilatino.test',
        passwordHash: hash,
        name: 'Carlos Rodríguez',
        countryOrigin: 'Chile',
        cityNz: 'Auckland',
        bio: 'Electricista con 8 años de experiencia. Llegué a NZ en 2023 buscando nuevas oportunidades.',
      },
    }),
    prisma.user.create({
      data: {
        email: 'maria@kiwilatino.test',
        passwordHash: hash,
        name: 'María González',
        countryOrigin: 'Colombia',
        cityNz: 'Wellington',
        bio: 'Chef colombiana explorando la cocina neozelandesa. Busco arriendo cercano al centro.',
      },
    }),
    prisma.user.create({
      data: {
        email: 'juan@kiwilatino.test',
        passwordHash: hash,
        name: 'Juan Pérez',
        countryOrigin: 'México',
        cityNz: 'Christchurch',
        bio: 'Trabajador en farm de kiwis. Feliz de ayudar a recién llegados.',
      },
    }),
    prisma.user.create({
      data: {
        email: 'ana@kiwilatino.test',
        passwordHash: hash,
        name: 'Ana Martínez',
        countryOrigin: 'Argentina',
        cityNz: 'Hamilton',
        bio: 'Enfermera argentina viviendo en Hamilton. Me encanta el senderismo por Waikato.',
      },
    }),
    prisma.user.create({
      data: {
        email: 'diego@kiwilatino.test',
        passwordHash: hash,
        name: 'Diego López',
        countryOrigin: 'Venezuela',
        cityNz: 'Queenstown',
        bio: 'Guía de ski en Coronet Peak. Vendo equipos de segunda mano cada temporada.',
      },
    }),
  ]);

  console.log(`✅ ${5} usuarios creados`);

  // ── Posts: Arriendos ─────────────────────────────────────────────────────
  await prisma.post.createMany({
    data: [
      {
        userId: carlos.id,
        module: PostModule.HOUSING,
        title: 'Pieza en casa compartida — Auckland CBD',
        description:
          'Pieza amoblada disponible en casa con 4 latinos. Incluye WiFi, lavadora y todas las cuentas. A 10 min caminando del Sky Tower. Ambiente tranquilo, ideal para trabajadores.',
        city: 'Auckland',
        price: 280,
        images: [],
        contactInfo: 'WhatsApp +64 21 123 4567',
        metadata: { tipo: 'pieza', amueblado: true, serviciosIncluidos: true },
      },
      {
        userId: maria.id,
        module: PostModule.HOUSING,
        title: 'Se arrienda pieza en Wellington — cerca del parlament',
        description:
          'Habitación en departamento de 3 personas. Muy bien conectado en transporte público. Cocina equipada, salón compartido. Disponible desde el 1 de julio.',
        city: 'Wellington',
        price: 250,
        images: [],
        contactInfo: 'maria@kiwilatino.test',
        metadata: { tipo: 'pieza', amueblado: true, serviciosIncluidos: false, disponibleDesde: '2026-07-01' },
      },
      {
        userId: ana.id,
        module: PostModule.HOUSING,
        title: 'Casa completa en Hamilton — 3 habitaciones',
        description:
          'Buscamos 2 personas más para compartir casa de 3 habitaciones. Barrio tranquilo, jardín, garaje. 15 min del centro. Mascotas pequeñas OK.',
        city: 'Hamilton',
        price: 220,
        images: [],
        metadata: { tipo: 'casa', amueblado: false, serviciosIncluidos: false },
      },
    ],
  });

  // ── Posts: Trabajo ───────────────────────────────────────────────────────
  await prisma.post.createMany({
    data: [
      {
        userId: juan.id,
        module: PostModule.JOBS,
        title: 'Se busca trabajador para farm de kiwis — Tauranga',
        description:
          'Farm familiar necesita 3 trabajadores para temporada de cosecha (julio–septiembre). Sin experiencia necesaria, capacitación en el lugar. Alojamiento disponible a precio reducido.',
        city: 'Tauranga',
        price: 23,
        images: [],
        contactInfo: 'juan@kiwilatino.test',
        metadata: { tipo: 'farm', salarioTipo: 'por hora', requiereVehiculo: false, requiereIngles: 'básico' },
      },
      {
        userId: carlos.id,
        module: PostModule.JOBS,
        title: 'Oferta: Ayudante de construcción — Auckland',
        description:
          'Empresa de construcción busca ayudantes para proyecto en North Shore. Full time, lunes a viernes. Licencia de conducir deseable pero no indispensable. Pago semanal.',
        city: 'Auckland',
        price: 25,
        images: [],
        metadata: { tipo: 'construcción', salarioTipo: 'por hora', requiereVehiculo: false, requiereIngles: 'intermedio' },
      },
    ],
  });

  // ── Posts: Compra y Venta ────────────────────────────────────────────────
  await prisma.post.createMany({
    data: [
      {
        userId: diego.id,
        module: PostModule.MARKETPLACE,
        title: 'Vendo equipo de ski completo — talla M',
        description:
          'Vendo skis Rossignol 165cm + botas talla 43 + casco + guantes. Todo en muy buen estado, una temporada de uso. Me voy del país y no puedo llevarlo.',
        city: 'Queenstown',
        price: 350,
        images: [],
        metadata: { categoria: 'camping', condicion: 'buen estado' },
      },
      {
        userId: maria.id,
        module: PostModule.MARKETPLACE,
        title: 'Vendo bicicleta de ciudad — Wellington',
        description:
          'Trek FX3 2022, 7 velocidades, talla M. Ideal para commuting por Wellington. Con luces y candado incluidos. Me compré auto.',
        city: 'Wellington',
        price: 420,
        images: [],
        metadata: { categoria: 'vehículos', condicion: 'buen estado' },
      },
      {
        userId: ana.id,
        module: PostModule.MARKETPLACE,
        title: 'Libros de enfermería + medicina NZ (en inglés)',
        description:
          'Lote de 6 libros de enfermería y farmacología usados en mis estudios. Muy útiles para convalidar título en NZ. Precio por el lote.',
        city: 'Hamilton',
        price: 80,
        images: [],
        metadata: { categoria: 'libros', condicion: 'usado' },
      },
    ],
  });

  // ── Posts: Comunidad ─────────────────────────────────────────────────────
  await prisma.post.createMany({
    data: [
      {
        userId: carlos.id,
        module: PostModule.COMMUNITY,
        title: '¿Cómo renovar el visa de trabajo en NZ? Guía 2026',
        description:
          'Comparto mi experiencia renovando el Open Work Visa este año. El proceso cambió bastante desde 2024. Pregunten lo que necesiten, con gusto ayudo.',
        city: 'Auckland',
        images: [],
      },
      {
        userId: ana.id,
        module: PostModule.COMMUNITY,
        title: 'Grupo de senderismo latinos en Waikato — ¡Únete!',
        description:
          'Organizamos caminatas cada tercer domingo. Próxima salida: Raglan Beach el 15 de junio. Todos los niveles bienvenidos. Familia también.',
        city: 'Hamilton',
        images: [],
      },
    ],
  });

  // ── Trips ────────────────────────────────────────────────────────────────
  const trip1 = await prisma.trip.create({
    data: {
      userId: juan.id,
      origin: 'Christchurch',
      destination: 'Queenstown',
      departureDate: new Date('2026-06-15T08:00:00Z'),
      seatsTotal: 3,
      seatsAvailable: 2,
      costPerPerson: 45,
      notes: 'Salida puntual. Parada en Lake Tekapo para fotos ~30 min. Llevar snacks.',
    },
  });

  await prisma.trip.create({
    data: {
      userId: diego.id,
      origin: 'Queenstown',
      destination: 'Auckland',
      departureDate: new Date('2026-06-20T06:30:00Z'),
      seatsTotal: 4,
      seatsAvailable: 3,
      costPerPerson: 80,
      notes: 'Vuelo, no auto. Busco gente para compartir taxi al aeropuerto de QT.',
    },
  });

  // Reserva de prueba: carlos reserva en el viaje de juan
  await prisma.tripBooking.create({
    data: {
      tripId: trip1.id,
      userId: carlos.id,
      seats: 1,
    },
  });

  await prisma.trip.update({
    where: { id: trip1.id },
    data: { seatsAvailable: trip1.seatsAvailable - 1 },
  });

  // ── Mensajes de prueba ───────────────────────────────────────────────────
  await prisma.message.createMany({
    data: [
      {
        senderId: maria.id,
        receiverId: carlos.id,
        content: 'Hola Carlos, ¿la pieza en Auckland sigue disponible?',
      },
      {
        senderId: carlos.id,
        receiverId: maria.id,
        content: 'Sí, todavía está disponible. ¿Cuándo puedes verla?',
      },
      {
        senderId: maria.id,
        receiverId: carlos.id,
        content: 'Este sábado en la tarde me vendría bien. ¿A qué hora te queda bien?',
      },
    ],
  });

  // ── Resumen ──────────────────────────────────────────────────────────────
  const counts = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.trip.count(),
    prisma.message.count(),
  ]);

  console.log('\n📊 Resumen del seed:');
  console.log(`   👤 Usuarios:      ${counts[0]}`);
  console.log(`   📋 Publicaciones: ${counts[1]}`);
  console.log(`   🚗 Viajes:        ${counts[2]}`);
  console.log(`   💬 Mensajes:      ${counts[3]}`);
  console.log('\n🔑 Credenciales de prueba (todos con la misma contraseña):');
  console.log(`   Contraseña: ${TEST_PASSWORD}`);
  console.log('   carlos@kiwilatino.test  — Auckland  (Chile)');
  console.log('   maria@kiwilatino.test   — Wellington (Colombia)');
  console.log('   juan@kiwilatino.test    — Christchurch (México)');
  console.log('   ana@kiwilatino.test     — Hamilton  (Argentina)');
  console.log('   diego@kiwilatino.test   — Queenstown (Venezuela)');
  console.log('\n✅ Seed completado.\n');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
