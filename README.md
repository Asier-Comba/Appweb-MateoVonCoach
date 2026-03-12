<div align="center">

# Metafit — Plataforma Web de Coaching Fitness

**Aplicación web full-stack para la gestión integral de clientes de coaching personal**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)

</div>

---

## Descripción del proyecto

Metafit es una plataforma web desarrollada para el coach personal **Mateo Von Coach**. Combina una landing page de presentación con un área privada de cliente donde los atletas acceden a sus rutinas, planes nutricionales y seguimiento de progreso en tiempo real.

La aplicación está dividida en dos grandes bloques:

- **Web pública** — landing page con secciones de servicios, historias de éxito y reserva de sesiones vía Calendly.
- **Área de cliente** — plataforma privada con autenticación donde cada atleta gestiona su entrenamiento, nutrición, check-ins semanales y comunicación con el coach.
- **Panel de administrador** — interfaz exclusiva para el coach que permite gestionar recursos, planes nutricionales y rutinas de entrenamiento.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | React 18 + React Router DOM v6 |
| **Build tool** | Vite 4 |
| **Estilos** | Tailwind CSS 3 + shadcn/ui (Radix UI) |
| **Animaciones** | Framer Motion |
| **Backend / Auth / DB** | Supabase (PostgreSQL + Auth + Storage) |
| **Iconos** | Lucide React |
| **Linting** | ESLint |

---

## Características principales

### Web pública
- Landing page con hero animado, vídeo de presentación y sección de testimonios
- Integración con **Calendly** para reserva de sesiones online
- Página de login con autenticación vía Supabase Auth
- SEO básico con `react-helmet`

### Área de cliente (rutas protegidas)
- **Dashboard** personalizado con resumen de peso, calorías, rutina del día y estado del check-in
- **Entrenamiento** — rutinas diarias organizadas por día de la semana con ejercicios detallados
- **Nutrición** — plan calórico con macros (proteínas, carbohidratos, grasas) y notas del coach
- **Progreso** — registro de check-ins semanales con peso, medidas corporales, calidad de sueño, nivel de energía y adherencia
- **Chat** — mensajería directa con el coach
- **Recursos** — biblioteca de materiales (vídeos, documentos) subidos por el coach
- Alertas automáticas cuando el check-in semanal está pendiente

### Panel de administrador
- Gestión de recursos multimedia
- Configuración de planes nutricionales por usuario
- Creación y edición de rutinas de entrenamiento

---

## Arquitectura del proyecto

```
src/
├── components/
│   ├── ui/              # Componentes base (Button, Card, Dialog, etc.)
│   ├── chat/            # Shell de mensajería (bubbles, composer, inbox)
│   └── ...              # Header, Footer, Hero, CallToAction
├── contexts/
│   └── SupabaseAuthContext.jsx   # Contexto global de autenticación
├── layouts/
│   ├── MainLayout.jsx   # Layout público (header + footer)
│   └── AppLayout.jsx    # Layout protegido (sidebar de la app)
├── lib/
│   ├── customSupabaseClient.js   # Cliente Supabase configurado
│   ├── chat/            # API y formateadores del chat
│   └── resources/       # API de recursos
├── pages/
│   ├── HomePage.jsx     # Landing page
│   ├── BookingPage.jsx  # Reserva de sesiones
│   ├── LoginPage.jsx
│   ├── app/             # Páginas del área de cliente
│   │   ├── DashboardPage.jsx
│   │   ├── TrainingPage.jsx
│   │   ├── NutritionPage.jsx
│   │   ├── ProgressPage.jsx
│   │   ├── ChatPage.jsx
│   │   ├── ResourcesAppPage.jsx
│   │   └── CheckInPage.jsx
│   └── admin/           # Panel del coach
│       └── AdminPage.jsx
└── App.jsx              # Enrutamiento principal + guards de rutas
```

---

## Puesta en marcha local

### Requisitos previos
- Node.js 18+
- Una cuenta y proyecto en [Supabase](https://supabase.com)

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/Asier-Comba/Appweb-MateoVonCoach.git
cd Appweb-MateoVonCoach

# Instalar dependencias
npm install
```

### Variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

### Scripts disponibles

```bash
npm run dev       # Servidor de desarrollo en http://localhost:3000
npm run build     # Build de producción
npm run preview   # Vista previa del build
npm run lint      # Análisis estático con ESLint
```

---

## Decisiones de diseño destacadas

- **Rutas protegidas con guards** — `ProtectedRoute` y `AdminRoute` envuelven las rutas privadas redirigiendo a `/login` si no hay sesión activa.
- **Carga paralela de datos** — el dashboard lanza todas las peticiones a Supabase en paralelo con `Promise.all`, minimizando el tiempo de carga.
- **UX orientada a métricas** — el dashboard calcula automáticamente delta de peso semanal, adherencia media de 7 días y días desde el último check-in para dar contexto inmediato al atleta.
- **Diseño responsive** — la interfaz funciona en móvil, tablet y escritorio sin librerías externas de grid.

---

## Autor

**Asier Comba**
- GitHub: [@Asier-Comba](https://github.com/Asier-Comba)

---

<div align="center">
Desarrollado con React, Vite y Supabase
</div>
