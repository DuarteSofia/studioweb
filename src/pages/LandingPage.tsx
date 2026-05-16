import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Zap, Shield, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const floatingCards = [
  { color: 'from-blue-500 to-cyan-400', x: '10%', y: '20%', delay: 0 },
  { color: 'from-violet-500 to-purple-400', x: '85%', y: '15%', delay: 1 },
  { color: 'from-emerald-500 to-green-400', x: '75%', y: '70%', delay: 2 },
  { color: 'from-orange-500 to-amber-400', x: '5%', y: '65%', delay: 1.5 },
];

export default function LandingPage() {
  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950 noise-overlay"
    >
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[150px]" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-grid opacity-30" />

      {/* Floating mini cards */}
      {floatingCards.map((card, i) => (
        <motion.div
          key={i}
          className={`absolute w-16 h-12 rounded-lg bg-gradient-to-br ${card.color} opacity-20 blur-sm hidden lg:block`}
          style={{ left: card.x, top: card.y }}
          animate={{ y: [-10, 10, -10], rotate: [-5, 5, -5] }}
          transition={{ duration: 5, repeat: Infinity, delay: card.delay, ease: 'easeInOut' }}
        />
      ))}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8"
          >
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">
              🔥 70 Diseños Profesionales Disponibles
            </span>
            <ArrowRight className="w-3 h-3 text-blue-400" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white leading-[0.9] tracking-tight font-display"
          >
            Tu Página Web
            <br />
            <span className="gradient-text">Lista en 24h</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            Páginas Web <strong className="text-white">profesionales, modernas y 100% personalizables</strong>.
            Diseños que convierten visitantes en clientes. Fáciles de gestionar, rápidas y efectivas.
          </motion.p>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-4 mt-6 text-sm text-slate-500"
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              100% Responsive
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-blue-400" />
              Soporte incluido
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-violet-400" />
              Entrega inmediata
            </span>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
          >
            <Link
              to="/diseños"
              className="btn-shine group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-2xl text-lg shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all flex items-center gap-3"
            >
              <span>Explorar Diseños</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent" />
    </section>
  );
}
