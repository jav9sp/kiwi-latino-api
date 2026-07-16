// Para volver a iniciar la DB ejecutar npx prisma db seed

import 'dotenv/config';
import { PrismaClient, PostModule, TripStatus, BookingStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🧹 Limpiando base de datos...');

  await prisma.emailVerificationToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.userPushToken.deleteMany();
  await prisma.savedPost.deleteMany();
  await prisma.postLike.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.report.deleteMany();
  await prisma.message.deleteMany();
  await prisma.tripBooking.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.post.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('👥 Creando usuarios...');

  const hash = await bcrypt.hash('Test1234!', 10);
  const now = Date.now();
  const min = (n: number) => new Date(now - n * 60_000);
  const hrs = (n: number) => new Date(now - n * 3_600_000);
  const days = (n: number) => new Date(now - n * 86_400_000);
  const future = (n: number) => new Date(now + n * 86_400_000);

  const [camila, andres, valentina, rodrigo, sofia, luis] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'camila.torres@test.com',
        passwordHash: hash,
        name: 'Camila Torres',
        countryOrigin: 'CL',
        cityNz: 'Auckland',
        bio: 'Chilena en Auckland hace 2 años. Amante del café y los paisajes de NZ.',
        emailVerified: true,
        lastSeenAt: min(5),
        oficio: 'Manicurista / Esteticista',
        descripcionServicio: 'Uñas acrílicas, gel y nail art. Atiendo a domicilio en Auckland.',
        contactoDirectorio: '+64 21 987 654',
        instagram: '@camila_nails_akl',
        tiktok: '@camilanails',
      },
    }),
    prisma.user.create({
      data: {
        email: 'andres.garcia@test.com',
        passwordHash: hash,
        name: 'Andrés García',
        countryOrigin: 'CO',
        cityNz: 'Wellington',
        bio: 'Colombiano en Wellington. Trabajo en tech, apasionado por la música y el fútbol.',
        emailVerified: true,
        lastSeenAt: min(30),
        oficio: 'Diseño Gráfico / Web',
        descripcionServicio: 'Logos, branding, páginas web y redes sociales para pequeños negocios.',
        contactoDirectorio: 'andres.garcia.dev@gmail.com',
        instagram: '@andresdesigns_co',
        facebook: 'andresgarcia.design',
      },
    }),
    prisma.user.create({
      data: {
        email: 'valentina.perez@test.com',
        passwordHash: hash,
        name: 'Valentina Pérez',
        countryOrigin: 'VE',
        cityNz: 'Auckland',
        bio: 'Venezolana en Auckland. Cocinera de corazón y exploradora de weekends.',
        emailVerified: true,
        lastSeenAt: hrs(2),
        oficio: 'Cocinero / Chef',
        descripcionServicio: 'Catering para eventos y comida venezolana a pedido. Pabellón, arepas y más.',
        contactoDirectorio: '+64 21 456 789',
        instagram: '@valecocina_nz',
        tiktok: '@valentinachef',
        facebook: 'ValentinaCocinaNZ',
      },
    }),
    prisma.user.create({
      data: {
        email: 'rodrigo.morales@test.com',
        passwordHash: hash,
        name: 'Rodrigo Morales',
        countryOrigin: 'MX',
        cityNz: 'Christchurch',
        bio: 'Mexicano en Christchurch. Constructor, manitas y buen cocinero de tacos.',
        emailVerified: true,
        lastSeenAt: days(1),
        oficio: 'Construcción / Albañilería',
        descripcionServicio: 'Remodelaciones, cerámicas, pintura y trabajos generales de construcción en Christchurch.',
        contactoDirectorio: '+64 22 111 333',
        instagram: '@rodrigo_builds_nz',
      },
    }),
    prisma.user.create({
      data: {
        email: 'sofia.mendoza@test.com',
        passwordHash: hash,
        name: 'Sofía Mendoza',
        countryOrigin: 'AR',
        cityNz: 'Hamilton',
        bio: 'Argentina en Hamilton. Profesora de español, fanática del mate y los libros.',
        emailVerified: true,
        lastSeenAt: days(3),
        oficio: 'Profesor / Tutor',
        descripcionServicio: 'Clases de español para adultos y niños, preparación DELE y tutorías escolares.',
        contactoDirectorio: 'sofia.mendoza.clases@gmail.com',
        facebook: 'SofiaMendozaClases',
      },
    }),
    prisma.user.create({
      data: {
        email: 'luis.herrera@test.com',
        passwordHash: hash,
        name: 'Luis Herrera',
        countryOrigin: 'PE',
        cityNz: 'Tauranga',
        bio: 'Peruano en Tauranga. Chef de oficio, busco abrir mi propio negocio algún día.',
        emailVerified: true,
        lastSeenAt: min(5),
        oficio: 'Cocinero / Chef',
        descripcionServicio: 'Chef peruano especialista en ceviche, lomo saltado y menús para eventos.',
        contactoDirectorio: '+64 27 321 654',
        instagram: '@luischef_tauranga',
        tiktok: '@luisherrera_chef',
      },
    }),
    prisma.user.create({
      data: {
        email: 'francisco@admin.com',
        passwordHash: hash,
        name: 'Francisco Admin',
        countryOrigin: 'Chile',
        cityNz: 'Christchurch',
        bio: 'Psicólo y programador, fundador de esta página. De Concepción Chile pal mundo.',
        emailVerified: true,
        lastSeenAt: min(5),
      },
    }),
  ]);

  // ─── HOUSING ──────────────────────────────────────────────────────────────
  console.log('🏠 Housing...');

  const [postH1, , postH3] = await Promise.all([
    prisma.post.create({
      data: {
        userId: camila.id,
        module: PostModule.HOUSING,
        title: 'Habitación en Auckland Central – $310/semana',
        description:
          'Habitación amoblada en depto de 3 personas. Cocina equipada, living cómodo, a 10 min a pie de Britomart. Servicios incluidos. Buscamos persona tranquila y responsable.',
        city: 'Auckland',
        price: 310,
        currency: 'NZD',
        images: [],
        contactInfo: 'WhatsApp +64 21 123 4567',
        metadata: { type: 'habitacion', furnished: true, bills: 'incluidos', flatmates: 2 },
        createdAt: days(5),
      },
    }),
    prisma.post.create({
      data: {
        userId: valentina.id,
        module: PostModule.HOUSING,
        title: 'Busco flatmate para depto en Grey Lynn – $380/semana',
        description:
          'Habitación en depto de 2 dormitorios, Grey Lynn. Barrio tranquilo, cerca de cafés y parques. Todo incluido. Solo personas respetuosas.',
        city: 'Auckland',
        price: 380,
        currency: 'NZD',
        images: [],
        contactInfo: 'Mensaje por aquí',
        metadata: { type: 'habitacion', furnished: true, bills: 'incluidos' },
        createdAt: days(3),
      },
    }),
    prisma.post.create({
      data: {
        userId: andres.id,
        module: PostModule.HOUSING,
        title: 'Busco habitación en Wellington – hasta $350/semana',
        description:
          'Colombiano, trabajo en IT, busco habitación desde agosto. Soy ordenado, tranquilo, full-time. Prefiero cerca del CBD o Newtown. No fumo. Tengo buenas referencias.',
        city: 'Wellington',
        price: 350,
        currency: 'NZD',
        images: [],
        contactInfo: 'andres.garcia@test.com',
        metadata: { type: 'busqueda', available: future(25).toISOString() },
        createdAt: days(2),
      },
    }),
  ]);

  // ─── JOBS ─────────────────────────────────────────────────────────────────
  console.log('💼 Jobs...');

  const [, postJ2, postJ3] = await Promise.all([
    prisma.post.create({
      data: {
        userId: rodrigo.id,
        module: PostModule.JOBS,
        title: 'Ayudante de construcción – Christchurch – $22/hora',
        description:
          'Empresa familiar busca ayudante para obras menores, pintura y reparaciones. No se necesita experiencia, se enseña. Lunes a viernes 7am–4pm. Transporte propio requerido.',
        city: 'Christchurch',
        price: 22,
        currency: 'NZD',
        images: [],
        contactInfo: '+64 27 987 6543',
        metadata: { type: 'oferta', hours: 'full-time' },
        createdAt: days(7),
      },
    }),
    prisma.post.create({
      data: {
        userId: sofia.id,
        module: PostModule.JOBS,
        title: 'Clases de español – presencial y online – Hamilton',
        description:
          'Profesora argentina con título universitario. Todos los niveles, individuales o grupales. $40/hora individual, $25/persona en grupos. También preparo para exámenes DELE.',
        city: 'Hamilton',
        price: 40,
        currency: 'NZD',
        images: [],
        contactInfo: 'sofia.mendoza@test.com',
        metadata: { type: 'oferta', modality: 'presencial y online' },
        createdAt: days(4),
      },
    }),
    prisma.post.create({
      data: {
        userId: luis.id,
        module: PostModule.JOBS,
        title: 'Busco trabajo en gastronomía – chef con visa y experiencia',
        description:
          'Chef con 8 años de experiencia en cocina latinoamericana y fusión. Open work visa válida hasta 2027. Disponible de inmediato. Puntual, responsable, con referencias.',
        city: 'Tauranga',
        price: null,
        currency: 'NZD',
        images: [],
        contactInfo: 'luis.herrera@test.com',
        metadata: { type: 'busqueda', visa: 'open work', experience: '8 años' },
        createdAt: days(6),
      },
    }),
  ]);

  // ─── MARKETPLACE ──────────────────────────────────────────────────────────
  console.log('🛒 Marketplace...');

  const [postM1, postM2] = await Promise.all([
    prisma.post.create({
      data: {
        userId: camila.id,
        module: PostModule.MARKETPLACE,
        title: 'Bicicleta Trek Marlin 5 – excelente estado – $450',
        description:
          'Trek Marlin 5, talla M, 21 velocidades, frenos de disco. 1 año de uso. Incluye casco, luces y candado. Precio negociable. Retiro en Auckland Central.',
        city: 'Auckland',
        price: 450,
        currency: 'NZD',
        images: [],
        contactInfo: 'Mensaje por la app',
        metadata: { category: 'deportes', condition: 'excelente', brand: 'Trek' },
        createdAt: days(2),
      },
    }),
    prisma.post.create({
      data: {
        userId: andres.id,
        module: PostModule.MARKETPLACE,
        title: 'iPhone 13 Pro 256GB Space Grey – $900',
        description:
          'Estado 9/10, pantalla perfecta, batería al 91%. Con cargador original y funda. Desbloqueado. No cambios, solo venta.',
        city: 'Wellington',
        price: 900,
        currency: 'NZD',
        images: [],
        contactInfo: 'WhatsApp +64 21 555 7890',
        metadata: { category: 'tecnología', condition: '9/10', brand: 'Apple' },
        createdAt: days(1),
      },
    }),
    prisma.post.create({
      data: {
        userId: valentina.id,
        module: PostModule.MARKETPLACE,
        title: 'Muebles de living completo – vendo por mudanza',
        description:
          'Sofá 3 cuerpos, mesa de comedor + 4 sillas, escritorio y estantería. Todo por $450 o por piezas. Buen estado. Solo retiro en Grey Lynn, Auckland.',
        city: 'Auckland',
        price: 450,
        currency: 'NZD',
        images: [],
        contactInfo: 'Mensaje aquí',
        metadata: { category: 'muebles', condition: 'buen estado' },
        createdAt: days(1),
      },
    }),
  ]);

  // ─── TRIPS (posts) ────────────────────────────────────────────────────────
  console.log('✈️  Trips...');

  const [postT1, postT2] = await Promise.all([
    prisma.post.create({
      data: {
        userId: rodrigo.id,
        module: PostModule.TRIPS,
        title: `Christchurch → Auckland – ${future(8).toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })} – $80`,
        description:
          'Salida 6am desde Christchurch Central, llegada estimada 7pm. Toyota Corolla cómodo. Comparto nafta: $80/persona. Quedan 2 plazas.',
        city: 'Christchurch',
        price: 80,
        currency: 'NZD',
        images: [],
        contactInfo: 'rodrigo.morales@test.com',
        metadata: { destination: 'Auckland', seats: 2 },
        createdAt: days(1),
      },
    }),
    prisma.post.create({
      data: {
        userId: sofia.id,
        module: PostModule.TRIPS,
        title: `Road trip South Island – 5 días desde ${future(15).toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })}`,
        description:
          'Christchurch → Queenstown → Milford Sound → Dunedin. 5 días, aprox. $400/persona (nafta + hostel). Busco 3 personas buena onda.',
        city: 'Hamilton',
        price: 400,
        currency: 'NZD',
        images: [],
        contactInfo: 'sofia.mendoza@test.com',
        metadata: { destination: 'South Island', days: 5, seats: 3 },
        createdAt: days(2),
      },
    }),
  ]);

  // ─── COMMUNITY ────────────────────────────────────────────────────────────
  console.log('🤝 Community...');

  const [postC1, postC2, postC3] = await Promise.all([
    prisma.post.create({
      data: {
        userId: luis.id,
        module: PostModule.COMMUNITY,
        title: '¿Tips para sacar la licencia de conducir en NZ?',
        description:
          'Llegué hace 3 meses y quiero sacarme la licencia. Tengo licencia peruana válida. ¿Hay que rendir examen teórico? ¿Cuánto cuesta? ¿Alguien que haya pasado por esto?',
        city: 'Tauranga',
        price: null,
        currency: null,
        images: [],
        contactInfo: null,
        metadata: { topic: 'tramites' },
        createdAt: days(1),
      },
    }),
    prisma.post.create({
      data: {
        userId: camila.id,
        module: PostModule.COMMUNITY,
        title: 'Recomendaciones de dentista hispanohablante en Auckland',
        description:
          'Necesito una limpieza y revisión. Tengo cobertura del ACC. ¿Alguien conoce un dentista que hable español en Auckland? Me quedaría mucho más cómoda.',
        city: 'Auckland',
        price: null,
        currency: null,
        images: [],
        contactInfo: null,
        metadata: { topic: 'salud' },
        createdAt: hrs(8),
      },
    }),
    prisma.post.create({
      data: {
        userId: andres.id,
        module: PostModule.COMMUNITY,
        title: '¡Asado latino este sábado en Wellington – todos invitados!',
        description:
          'Waitangi Park, este sábado desde las 12pm. Cada uno trae algo: carne, ensaladas, bebidas. Grupo mixto de colombianos, chilenos y venezolanos. ¡Cuantos más, mejor!',
        city: 'Wellington',
        price: null,
        currency: null,
        images: [],
        contactInfo: 'andres.garcia@test.com',
        metadata: { topic: 'evento', date: future(5).toISOString() },
        createdAt: hrs(12),
      },
    }),
  ]);

  // ─── TRIPS (model) ────────────────────────────────────────────────────────
  console.log('🚗 Trip model + bookings...');

  const [trip1, trip2] = await Promise.all([
    prisma.trip.create({
      data: {
        userId: rodrigo.id,
        origin: 'Christchurch',
        destination: 'Auckland',
        departureDate: future(8),
        seatsTotal: 2,
        seatsAvailable: 1,
        costPerPerson: 80,
        currency: 'NZD',
        notes: 'Toyota Corolla. Salida 6am desde el CBD.',
        status: TripStatus.OPEN,
      },
    }),
    prisma.trip.create({
      data: {
        userId: sofia.id,
        origin: 'Hamilton',
        destination: 'South Island',
        departureDate: future(15),
        seatsTotal: 3,
        seatsAvailable: 2,
        costPerPerson: 400,
        currency: 'NZD',
        notes: '5 días. Gastos compartidos: nafta + hostel.',
        status: TripStatus.OPEN,
      },
    }),
  ]);

  await Promise.all([
    prisma.tripBooking.create({
      data: { tripId: trip1.id, userId: luis.id, seats: 1, status: BookingStatus.ACCEPTED },
    }),
    prisma.tripBooking.create({
      data: { tripId: trip2.id, userId: camila.id, seats: 1, status: BookingStatus.PENDING },
    }),
    prisma.tripBooking.create({
      data: { tripId: trip2.id, userId: andres.id, seats: 1, status: BookingStatus.ACCEPTED },
    }),
  ]);

  // ─── MESSAGES ─────────────────────────────────────────────────────────────
  console.log('💬 Mensajes...');

  // Valentina → Camila (habitación)
  await prisma.message.createMany({
    data: [
      {
        senderId: valentina.id, receiverId: camila.id, postId: postH1.id,
        content: 'Hola Camila! Vi tu publicación de la habitación. ¿Sigue disponible?',
        createdAt: hrs(2), readAt: new Date(now - 2 * 3_600_000 + 30 * 60_000),
      },
      {
        senderId: camila.id, receiverId: valentina.id, postId: postH1.id,
        content: 'Hola Vale! Sí, sigue. ¿Me contás un poco de ti? ¿A qué te dedicás?',
        createdAt: new Date(now - 2 * 3_600_000 + 35 * 60_000),
        readAt: new Date(now - 2 * 3_600_000 + 70 * 60_000),
      },
      {
        senderId: valentina.id, receiverId: camila.id, postId: postH1.id,
        content: 'Trabajo en un café en Ponsonby, full-time. Soy tranquila, limpia y sin mascotas. ¿Cuándo podría ver el cuarto?',
        createdAt: hrs(1), readAt: min(45),
      },
      {
        senderId: camila.id, receiverId: valentina.id,
        content: '¡Perfecto! ¿Te viene bien este sábado a las 11am?',
        createdAt: min(30), readAt: null,
      },
    ],
  });

  // Luis → Rodrigo (viaje)
  await prisma.message.createMany({
    data: [
      {
        senderId: luis.id, receiverId: rodrigo.id, postId: postT1.id,
        content: 'Hola Rodrigo! Vi que hacés viaje a Auckland. ¿Todavía hay lugar?',
        createdAt: hrs(5), readAt: new Date(now - 5 * 3_600_000 + 20 * 60_000),
      },
      {
        senderId: rodrigo.id, receiverId: luis.id, postId: postT1.id,
        content: '¡Sí! Queda 1 lugar. ¿Podés salir a las 6am desde el CBD?',
        createdAt: new Date(now - 5 * 3_600_000 + 25 * 60_000),
        readAt: new Date(now - 5 * 3_600_000 + 50 * 60_000),
      },
      {
        senderId: luis.id, receiverId: rodrigo.id,
        content: 'Sí, las 6am me viene bien. ¿Cómo pagamos los $80?',
        createdAt: hrs(4), readAt: new Date(now - 4 * 3_600_000 + 30 * 60_000),
      },
      {
        senderId: rodrigo.id, receiverId: luis.id,
        content: 'Bank transfer o cash al llegar. Te mando las coordenadas del punto de encuentro.',
        createdAt: new Date(now - 4 * 3_600_000 + 35 * 60_000),
        readAt: new Date(now - 4 * 3_600_000 + 60 * 60_000),
      },
      {
        senderId: luis.id, receiverId: rodrigo.id,
        content: 'Banco transfer mejor. ¡Gracias hermano, nos vemos ese día! 🤝',
        createdAt: hrs(3), readAt: new Date(now - 3 * 3_600_000 + 15 * 60_000),
      },
    ],
  });

  // Sofía → Luis (trabajo)
  await prisma.message.createMany({
    data: [
      {
        senderId: sofia.id, receiverId: luis.id, postId: postJ3.id,
        content: 'Hola Luis! Tengo un amigo con restaurante de fusión latina en Hamilton que busca chef. ¿Te interesaría?',
        createdAt: days(1), readAt: new Date(now - 86_400_000 + 3_600_000),
      },
      {
        senderId: luis.id, receiverId: sofia.id, postId: postJ3.id,
        content: '¡Claro que me interesa! ¿Qué tipo de cocina hace?',
        createdAt: new Date(now - 86_400_000 + 3_900_000),
        readAt: new Date(now - 86_400_000 + 7_200_000),
      },
      {
        senderId: sofia.id, receiverId: luis.id,
        content: 'Fusión latinoamericana, en Hamilton central. Le puedo pasar tu contacto si querés.',
        createdAt: new Date(now - 86_400_000 + 9_000_000),
        readAt: new Date(now - 86_400_000 + 10_800_000),
      },
      {
        senderId: luis.id, receiverId: sofia.id,
        content: '¡Dale! Muchas gracias Sofía, la comunidad latina es lo mejor 🙌',
        createdAt: new Date(now - 86_400_000 + 12_600_000),
        readAt: null,
      },
    ],
  });

  // Camila → Andrés (asado)
  await prisma.message.createMany({
    data: [
      {
        senderId: camila.id, receiverId: andres.id, postId: postC3.id,
        content: '¡Me apunto al asado! Llevo ensalada de quinoa y bebidas. ¿Cuántos van?',
        createdAt: hrs(6), readAt: new Date(now - 6 * 3_600_000 + 30 * 60_000),
      },
      {
        senderId: andres.id, receiverId: camila.id, postId: postC3.id,
        content: '¡Genial Camila! Somos como 10 confirmados. Va a ser épico 🔥',
        createdAt: new Date(now - 6 * 3_600_000 + 40 * 60_000),
        readAt: new Date(now - 6 * 3_600_000 + 70 * 60_000),
      },
    ],
  });

  // ─── LIKES ────────────────────────────────────────────────────────────────
  console.log('❤️  Likes...');

  await prisma.postLike.createMany({
    data: [
      { postId: postC3.id, userId: camila.id },
      { postId: postC3.id, userId: valentina.id },
      { postId: postC3.id, userId: luis.id },
      { postId: postC3.id, userId: rodrigo.id },
      { postId: postC1.id, userId: camila.id },
      { postId: postC1.id, userId: andres.id },
      { postId: postC1.id, userId: sofia.id },
      { postId: postC2.id, userId: valentina.id },
      { postId: postC2.id, userId: andres.id },
      { postId: postJ2.id, userId: camila.id },
      { postId: postJ2.id, userId: rodrigo.id },
      { postId: postJ3.id, userId: sofia.id },
      { postId: postJ3.id, userId: camila.id },
      { postId: postH1.id, userId: andres.id },
      { postId: postH1.id, userId: rodrigo.id },
      { postId: postM1.id, userId: andres.id },
      { postId: postM1.id, userId: luis.id },
      { postId: postM2.id, userId: camila.id },
      { postId: postM2.id, userId: valentina.id },
      { postId: postT1.id, userId: camila.id },
      { postId: postT1.id, userId: andres.id },
      { postId: postT2.id, userId: valentina.id },
      { postId: postT2.id, userId: luis.id },
    ],
  });

  // ─── SAVES ────────────────────────────────────────────────────────────────
  console.log('🔖 Guardados...');

  await prisma.savedPost.createMany({
    data: [
      { postId: postH1.id, userId: andres.id },
      { postId: postH1.id, userId: rodrigo.id },
      { postId: postH3.id, userId: luis.id },
      { postId: postJ2.id, userId: rodrigo.id },
      { postId: postJ3.id, userId: sofia.id },
      { postId: postM1.id, userId: andres.id },
      { postId: postM2.id, userId: valentina.id },
      { postId: postT1.id, userId: camila.id },
      { postId: postT2.id, userId: andres.id },
      { postId: postC3.id, userId: rodrigo.id },
    ],
  });

  // ─── COMMENTS ─────────────────────────────────────────────────────────────
  console.log('💬 Comentarios...');

  await prisma.comment.createMany({
    data: [
      {
        postId: postC1.id, userId: sofia.id,
        content: 'Con licencia latinoamericana podés conducir hasta 12 meses. Después hay que rendir teórico ($53.30) y práctico. El libro "Road Code" de NZTA es esencial.',
        createdAt: hrs(3),
      },
      {
        postId: postC1.id, userId: andres.id,
        content: 'Confirmo lo de Sofía. El examen teórico está en español en la web de NZTA, eso ayuda muchísimo.',
        createdAt: new Date(now - 3 * 3_600_000 + 30 * 60_000),
      },
      {
        postId: postC1.id, userId: luis.id,
        content: '¡Gracias a los dos! Justo lo que necesitaba. Voy a buscar el libro 🙏',
        createdAt: hrs(2),
      },
      {
        postId: postC2.id, userId: valentina.id,
        content: 'Hay una dentista venezolana en Ponsonby, Dra. Martínez. Habla español perfecto. Te mando el número por privado.',
        createdAt: hrs(1),
      },
      {
        postId: postC2.id, userId: rodrigo.id,
        content: 'En Christchurch hay una clínica con dentistas latinos también. Busca "Latam Dental Christchurch".',
        createdAt: min(45),
      },
      {
        postId: postC3.id, userId: valentina.id,
        content: '¡Me apunto! Llevo arepas venezolanas 🇻🇪',
        createdAt: hrs(4),
      },
      {
        postId: postC3.id, userId: rodrigo.id,
        content: 'Ojalá pudiera ir, estoy en Chch ese día. Para el próximo avisadme con tiempo! 🤙',
        createdAt: hrs(3),
      },
      {
        postId: postC3.id, userId: luis.id,
        content: 'Me sumo! Llevo ceviche y causa limeña 🇵🇪',
        createdAt: hrs(2),
      },
      {
        postId: postJ2.id, userId: camila.id,
        content: '¿Dás clases a adultos sin conocimiento previo? Tengo una amiga kiwi que quiere aprender español.',
        createdAt: hrs(5),
      },
      {
        postId: postJ2.id, userId: sofia.id,
        content: '¡Claro que sí Camila! Mándame un mensaje y coordinamos 😊',
        createdAt: new Date(now - 5 * 3_600_000 + 30 * 60_000),
      },
    ],
  });

  // ─── RESUMEN ──────────────────────────────────────────────────────────────
  const [users, posts, trips, messages, likes, saves, comments] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.trip.count(),
    prisma.message.count(),
    prisma.postLike.count(),
    prisma.savedPost.count(),
    prisma.comment.count(),
  ]);

  console.log('\n✅ Seed completado!\n');
  console.log('👤 Usuarios (contraseña: Test1234!):');
  console.log('   camila.torres@test.com    — Auckland      (Chile)');
  console.log('   andres.garcia@test.com    — Wellington    (Colombia)');
  console.log('   valentina.perez@test.com  — Auckland      (Venezuela)');
  console.log('   rodrigo.morales@test.com  — Christchurch  (México)');
  console.log('   sofia.mendoza@test.com    — Hamilton      (Argentina)');
  console.log('   luis.herrera@test.com     — Tauranga      (Perú)');
  console.log(`\n📦 Posts: ${posts}  🚗 Trips: ${trips}  💬 Mensajes: ${messages}`);
  console.log(`❤️  Likes: ${likes}  🔖 Saves: ${saves}  💬 Comentarios: ${comments}`);
  console.log(`👤 Usuarios: ${users}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
