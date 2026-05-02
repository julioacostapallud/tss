/* eslint-disable react/prop-types */
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  Award,
  Coffee,
  Droplet,
  Heart,
  MapPin,
  Shield,
  Users,
  Zap,
} from 'react-feather'
import { GlobalFooter } from '../components/common/GlobalFooter'

/** Misma foto que CinemasComics, servida localmente (el hotlink remoto suele bloquearse en el navegador). */
const IMG_GYM_NORTE = '/landing-sede-norte.jpg'

/**
 * Imágenes de gimnasio — mezcla Pexels + referencias “gimnasio moderno” (sin depender solo de 3 fotos).
 * Orden: referencias externas intercaladas con Pexels para variar en hero / galería / actividades.
 */
const IMG_GYM_POOL = [
  'https://images.ctfassets.net/ipjoepkmtnha/4YvDGusDMT4FaZKlQ77cZE/4487361f16cc6532778499e0d50b2bd6/design-banner-cover.jpg',
  'https://images.pexels.com/photos/29526372/pexels-photo-29526372.jpeg',
  'https://img.freepik.com/fotos-premium/interior-gimnasio-moderno-nuevos-equipos-fitness_93675-121892.jpg',
  'https://images.pexels.com/photos/13104546/pexels-photo-13104546.jpeg',
  IMG_GYM_NORTE,
  'https://images.pexels.com/photos/29639963/pexels-photo-29639963.jpeg',
  'https://img.freepik.com/foto-gratis/gimnasio-moderno-urbano_23-2151918014.jpg?semt=ais_hybrid&w=740&q=80',
  'https://media.gettyimages.com/id/2243539380/es/foto/gimnasio-moderno-con-cintas-de-correr.jpg?s=612x612&w=gi&k=20&c=G8y6RcqotO1AM6D5ltc-LUL3neKvPrMaewcW2yg_ObY=',
]

/** Tres fotos fijas para tarjetas de sede (bien diferenciadas). */
const IMG_GYM_SEDES = [
  IMG_GYM_POOL[1],
  IMG_GYM_NORTE,
  IMG_GYM_POOL[7],
]

/**
 * Kiosco / retail — URLs directas (los enlaces tipo Google imgres no son válidos como src).
 * Referencias: on24 (Nutri-Go), nutrimarket, shutterstock (preview), fitgeneration.
 */
const IMG_KIOSCO = [
  {
    src: 'https://www.on24.com.ar/wp-content/uploads/2023/07/Nutri-Go.png',
    caption: 'Tienda de suplementos',
    alt: 'Local de suplementos y accesorios fitness',
  },
  {
    src: 'https://www.nutrimarket.com/img/cms/homeNueva%20carpeta/5.jpg',
    caption: 'Nutrición deportiva',
    alt: 'Interior tienda nutrición deportiva',
  },
  {
    src: 'https://www.shutterstock.com/image-photo/sport-clothes-store-shopping-mall-260nw-1151331230.jpg',
    caption: 'Indumentaria técnica',
    alt: 'Tienda de ropa deportiva',
  },
  {
    src: 'https://fitgeneration.es/wp-content/uploads/2023/08/las-bebidas-isotonicas.jpg',
    caption: 'Bebidas isotónicas',
    alt: 'Bebidas isotónicas deportivas',
  },
]

const SEDES = [
  { nombre: 'SquatGym Centro', zona: 'Microcentro · acceso 6:00–23:00', tag: 'Flagship' },
  { nombre: 'SquatGym Norte', zona: 'Zona residencial · estacionamiento', tag: 'Family' },
  { nombre: 'SquatGym Sur', zona: 'Amplias salas · clases peak', tag: 'Performance' },
]

const PLANES = [
  { nombre: 'Individual', precio: 'desde $28.900', desc: 'Musculación, cardio y onboarding técnico.' },
  { nombre: 'Premium ilimitado', precio: 'desde $39.200', desc: 'Clases, sala libre y multi-sede donde aplique.' },
  { nombre: 'Grupo familiar', precio: 'desde $51.200', desc: 'Hasta 6 integrantes con tarifa escalonada.' },
]

const ACTIVIDADES = ['Funcional', 'Spinning', 'HIIT', 'Yoga', 'Stretching', 'Boxing fit', 'Sala libre', 'Calistenia']

const PROFES = [
  {
    nombre: 'Valentina R.',
    rol: 'Head Coach · fuerza',
    img: 'https://www.shutterstock.com/image-photo/female-gym-instructor-half-length-260nw-101551159.jpg',
    imgAlt: 'Profesora de gimnasio en entorno de sala',
  },
  {
    nombre: 'Martín Q.',
    rol: 'Spinning & cardio',
    img: 'https://img.freepik.com/foto-gratis/adulto-joven-haciendo-deporte-interior-gimnasio_23-2149205542.jpg',
    imgAlt: 'Entrenador en interior de gimnasio',
  },
  {
    nombre: 'Lucía F.',
    rol: 'Nutrición deportiva',
    img: 'https://static.vecteezy.com/system/resources/previews/029/633/547/non_2x/female-physical-education-teacher-holds-a-smiling-gym-folder-behind-her-for-students-to-exercise-free-photo.jpeg',
    imgAlt: 'Profesora de educación física en gimnasio',
  },
  {
    nombre: 'Franco L.',
    rol: 'Rehab & movilidad',
    img: 'https://titulae.es/wp-content/uploads/2015/09/Monitor-deportivo-y-musculacion.jpg',
    imgAlt: 'Monitor deportivo y musculación en sala',
  },
]

const SERVICIOS = [
  { icon: Users, t: 'Entrenamiento personal', d: 'Planes a medida y seguimiento semanal.' },
  { icon: Shield, t: 'Evaluación inicial', d: 'Biomecánica básica y objetivos claros.' },
  { icon: Heart, t: 'Bienestar', d: 'Hidratación, recuperación y hábitos sostenibles.' },
  { icon: Zap, t: 'Performance', d: 'Testing y progresión de cargas guiada.' },
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function PublicLandingPage() {
  const heroActividad = useMemo(() => shuffle([...IMG_GYM_POOL]), [])
  const bentoImgs = useMemo(() => shuffle([...IMG_GYM_POOL]).slice(0, 6), [])

  return (
    <div className="sg-landing">
      <header className="sg-landing-nav">
        <div className="sg-landing-nav-inner">
          <a href="#inicio" className="sg-landing-brand">
            <img src="/squatgym-icon.svg" alt="" width={36} height={36} className="sg-landing-brand-icon" />
            <span className="sg-landing-brand-text">SquatGym</span>
          </a>
          <nav className="sg-landing-nav-links" aria-label="Secciones">
            <a href="#quienes-somos">Quiénes somos</a>
            <a href="#sedes">Gimnasios</a>
            <a href="#planes">Planes</a>
            <a href="#actividades">Actividades</a>
            <a href="#profesores">Profesores</a>
            <a href="#servicios">Servicios</a>
            <a href="#kiosco">Kiosco</a>
          </nav>
          <Link to="/login" className="sg-landing-cta-nav">
            Iniciar sesión
          </Link>
        </div>
      </header>

      <main>
        <section id="inicio" className="sg-landing-hero">
          <div className="sg-landing-hero-bg" aria-hidden />
          <div className="sg-landing-hero-grid">
            <div className="sg-landing-hero-copy">
              <p className="sg-landing-eyebrow">Cadena fitness</p>
              <h1 className="sg-landing-hero-title">
                Entrená fuerte.
                <span className="sg-landing-hero-accent"> Recuperá mejor.</span>
              </h1>
              <p className="sg-landing-hero-lead">
                SquatGym une salas de musculación de primer nivel, clases guiadas y un kiosco pensado
                para hidratación y suplementación — todo con una experiencia clara y humana.
              </p>
              <div className="sg-landing-hero-actions">
                <Link to="/login" className="sg-landing-btn sg-landing-btn-primary">Ingresá al portal</Link>
                <a href="#planes" className="sg-landing-btn sg-landing-btn-ghost">Ver planes</a>
              </div>
              <ul className="sg-landing-hero-stats" aria-label="Resumen">
                <li><strong>3</strong> sedes en la ciudad</li>
                <li><strong>40+</strong> clases semanales</li>
                <li><strong>Kiosco</strong> isotónicos & proteínas</li>
              </ul>
            </div>
            <div className="sg-landing-hero-visual">
              <div className="sg-landing-hero-card sg-landing-glass">
                <img src={heroActividad[0]} alt="Sala de musculación moderna" loading="eager" />
                <div className="sg-landing-hero-card-cap">
                  <Droplet size={18} aria-hidden />
                  <span>Hidratación & recuperación en sede</span>
                </div>
              </div>
              <div className="sg-landing-hero-float sg-landing-glass">
                <Coffee size={20} aria-hidden />
                <div>
                  <strong>SquatBar</strong>
                  <span>Bebidas isotónicas y snacks proteicos</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="quienes-somos" className="sg-landing-section sg-landing-section--alt">
          <div className="sg-landing-wrap">
            <p className="sg-landing-kicker">Quiénes somos</p>
            <h2 className="sg-landing-h2">Somos un equipo obsesionado con el detalle</h2>
            <p className="sg-landing-prose">
              Nacimos como proyecto de diseño de software aplicado a la gestión de gimnasios: turnos, pagos,
              stock de kiosco y experiencia del socio en un solo lugar. Esta web pública resume nuestra
              propuesta de marca — energía controlada, espacios limpios y tecnología al servicio del entrenador.
            </p>
            <div className="sg-landing-values">
              <div className="sg-landing-value-card">
                <Activity className="sg-landing-value-icon" size={22} aria-hidden />
                <h3>Ritmo constante</h3>
                <p>Programación de clases y cupos pensados para evitar aglomeraciones.</p>
              </div>
              <div className="sg-landing-value-card">
                <Award className="sg-landing-value-icon" size={22} aria-hidden />
                <h3>Estándar alto</h3>
                <p>Equipamiento revisado y protocolos de higiene visibles para todos.</p>
              </div>
              <div className="sg-landing-value-card">
                <Users className="sg-landing-value-icon" size={22} aria-hidden />
                <h3>Comunidad</h3>
                <p>Del primer día al socio avanzado: acompañamos con datos y feedback.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="sedes" className="sg-landing-section">
          <div className="sg-landing-wrap">
            <p className="sg-landing-kicker">Nuestros gimnasios</p>
            <h2 className="sg-landing-h2">Tres sedes, una misma filosofía</h2>
            <div className="sg-landing-sedes">
              {SEDES.map((s, idx) => (
                <article key={s.nombre} className="sg-landing-sede-card">
                  <div className="sg-landing-sede-img-wrap">
                    <img src={IMG_GYM_SEDES[idx]} alt="" loading="lazy" />
                    <span className="sg-landing-sede-tag">{s.tag}</span>
                  </div>
                  <h3><MapPin size={16} aria-hidden /> {s.nombre}</h3>
                  <p>{s.zona}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="planes" className="sg-landing-section sg-landing-section--dark">
          <div className="sg-landing-wrap">
            <p className="sg-landing-kicker sg-landing-kicker--on-dark">Planes</p>
            <h2 className="sg-landing-h2 sg-landing-h2--on-dark">Membresías que escalan con vos</h2>
            <div className="sg-landing-planes">
              {PLANES.map((p) => (
                <article key={p.nombre} className="sg-landing-plan-card">
                  <h3>{p.nombre}</h3>
                  <p className="sg-landing-plan-price">{p.precio}</p>
                  <p className="sg-landing-plan-desc">{p.desc}</p>
                  <Link to="/login" className="sg-landing-plan-link">Consultar en el portal →</Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="actividades" className="sg-landing-section">
          <div className="sg-landing-wrap">
            <p className="sg-landing-kicker">Actividades</p>
            <h2 className="sg-landing-h2">Clases y espacios para cada objetivo</h2>
            <div className="sg-landing-pills">
              {ACTIVIDADES.map((a) => (
                <span key={a} className="sg-landing-pill">{a}</span>
              ))}
            </div>
            <div className="sg-landing-split-img">
              <img src={heroActividad[1]} alt="Ambiente de entrenamiento en gimnasio" loading="lazy" />
              <img src={heroActividad[2]} alt="Sala de musculación y equipamiento" loading="lazy" />
            </div>
          </div>
        </section>

        <section id="profesores" className="sg-landing-section sg-landing-section--alt">
          <div className="sg-landing-wrap">
            <p className="sg-landing-kicker">Nuestros profesores</p>
            <h2 className="sg-landing-h2">Staff certificado y cercano</h2>
            <div className="sg-landing-profe-grid">
              {PROFES.map((p) => (
                <article key={p.nombre} className="sg-landing-profe-card">
                  <div className="sg-landing-profe-photo">
                    <img src={p.img} alt={p.imgAlt} loading="lazy" />
                  </div>
                  <h3>{p.nombre}</h3>
                  <p>{p.rol}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="servicios" className="sg-landing-section">
          <div className="sg-landing-wrap">
            <p className="sg-landing-kicker">Servicios</p>
            <h2 className="sg-landing-h2">Todo lo que rodea al entrenamiento</h2>
            <div className="sg-landing-servicios">
              {SERVICIOS.map(({ icon: Icon, t, d }) => (
                <article key={t} className="sg-landing-servicio">
                  <div className="sg-landing-servicio-icon"><Icon size={22} aria-hidden /></div>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="kiosco" className="sg-landing-section sg-landing-kiosco">
          <div className="sg-landing-wrap">
            <p className="sg-landing-kicker">Kiosco SquatBar</p>
            <h2 className="sg-landing-h2">Isotónicos, proteínas y recuperación</h2>
            <p className="sg-landing-prose sg-landing-prose--narrow">
              En cada sede encontrás bebidas deportivas, electrolitos, barras proteicas, whey, creatina y
              accesorios — curado para entrenadores y socios que no negocian la calidad del post-entreno.
            </p>
            <div className="sg-landing-kiosco-grid">
              {IMG_KIOSCO.map((item) => (
                <figure key={item.src} className="sg-landing-kiosco-fig sg-landing-glass">
                  <img src={item.src} alt={item.alt} loading="lazy" />
                  <figcaption>{item.caption}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="sg-landing-section sg-landing-gallery-section" aria-label="Galería de ambientes">
          <div className="sg-landing-wrap sg-landing-wrap--wide">
            <p className="sg-landing-kicker">Ambientes</p>
            <h2 className="sg-landing-h2">Un vistazo a nuestras sedes</h2>
            <div className="sg-landing-bento">
              {bentoImgs.map((src, i) => (
                <div key={`${src}-${i}`} className="sg-landing-bento-cell">
                  <img src={src} alt="" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="sg-landing-cta-final">
          <div className="sg-landing-wrap sg-landing-cta-final-inner">
            <h2>¿Listo para moverte?</h2>
            <p>Ingresá con tu cuenta para gestionar pagos, kiosco y operaciones.</p>
            <Link to="/login" className="sg-landing-btn sg-landing-btn-primary sg-landing-btn-lg">Iniciar sesión</Link>
          </div>
        </section>
      </main>

      <GlobalFooter tone="dark" />
    </div>
  )
}
