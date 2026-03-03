import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ChevronRight, Layers, Zap, Globe, Github } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0] overflow-hidden">
      {/* Navigation */}
      <nav className="border-b border-[#141414]/20 p-6 flex justify-between items-center relative z-10 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3"
        >
          <img src="/assets/icons/logo.ico" alt="Marzia Logo" className="w-18 h-18 opacity-100" />
          <div className="hidden md:block">
            <h1 className="text-3xl font-serif italic tracking-tight">Marzia</h1>
            <p className="text-[10px] uppercase tracking-widest opacity-50 font-mono mt-1">TMM Engine</p>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex gap-6 items-center"
        >
          <a href="https://github.com/noor-global/marzia" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-mono opacity-70 hover:opacity-100 transition-opacity">
            <Github className="w-4 h-4" />
            <span>GITHUB</span>
          </a>
          <Link to="/editor" className="flex items-center gap-2 bg-[#141414] text-[#E4E3E0] px-5 py-2.5 rounded-none hover:bg-opacity-90 transition-all">
            <span className="font-mono text-xs uppercase tracking-wider">Launch App</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-24 pb-32 px-6 max-w-7xl mx-auto z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="inline-block border border-[#141414] px-4 py-1.5 mb-8">
              <span className="font-mono text-[10px] uppercase tracking-widest">Version 2.0 • Now with Spectral Data</span>
            </div>
            
            <h2 className="text-6xl md:text-8xl font-serif italic tracking-tight leading-[0.9] mb-8">
              Design the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#141414] to-gray-500">Unseen.</span>
            </h2>
            
            <p className="text-lg md:text-xl font-sans opacity-80 max-w-lg mb-12 leading-relaxed">
              Marzia is an advanced web-based Transfer Matrix Method (TMM) engine for simulating thin-film optics, solar cells, and custom multilayer structures.
            </p>
            
            <div className="flex gap-4">
              <Link to="/editor" className="flex items-center justify-center gap-3 bg-[#141414] text-[#E4E3E0] px-8 py-4 rounded-none hover:bg-opacity-90 transition-all text-lg group w-full md:w-auto">
                <span className="font-serif italic">Start Simulating</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="relative h-[600px] hidden lg:block"
          >
            {/* Abstract Visual Representation */}
            <div className="absolute inset-0 border border-[#141414]/20 bg-white/50 backdrop-blur-sm p-8 shadow-2xl flex flex-col justify-end">
              <motion.div 
                className="w-full bg-gradient-to-t from-[#141414]/10 to-transparent border-t border-[#141414]"
                initial={{ height: '0%' }}
                animate={{ height: '20%' }}
                transition={{ duration: 1.5, delay: 0.8 }}
              />
              <motion.div 
                className="w-full bg-gradient-to-t from-[#141414]/20 to-transparent border-t border-[#141414]"
                initial={{ height: '0%' }}
                animate={{ height: '40%' }}
                transition={{ duration: 1.5, delay: 1.0 }}
              />
              <motion.div 
                className="w-full bg-gradient-to-t from-[#141414]/30 to-transparent border-t border-[#141414] border-b-0"
                initial={{ height: '0%' }}
                animate={{ height: '60%' }}
                transition={{ duration: 1.5, delay: 1.2 }}
              >
                <div className="h-full w-full flex items-center justify-center">
                  <span className="font-mono text-xs uppercase tracking-widest opacity-50">Multilayer Simulation</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Features Grid */}
      <section className="border-t border-[#141414]/20 bg-white relative z-10 px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                icon: Layers,
                title: "Complex Structures",
                desc: "Simulate arbitrary stacks of thin films, including absorbing layers and dispersive materials."
              },
              {
                icon: Zap,
                title: "Real-time Processing",
                desc: "Instantaneous recalculation of reflectance and transmittance over wide wavelength ranges."
              },
              {
                icon: Globe,
                title: "Browser Based",
                desc: "No installation required. Powerful TMM calculations running entirely on your local machine."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                className="border border-[#141414] p-8 group hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors"
              >
                <feature.icon className="w-8 h-8 mb-6" strokeWidth={1.5} />
                <h3 className="text-2xl font-serif italic mb-4">{feature.title}</h3>
                <p className="font-mono text-xs opacity-70 leading-relaxed uppercase">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#141414]/20 bg-[#E4E3E0] relative z-10 px-6 py-6 text-center text-[10px] uppercase tracking-wider font-mono">
        <span className="opacity-60">Built by</span>{" "}
        <a href="https://tech.noorglobal.page" target="_blank" rel="noreferrer" className="underline hover:opacity-100 transition-opacity opacity-80 font-bold">
          Noor Tech Global
        </a>
      </footer>

      {/* Background Graphic */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex justify-center items-center opacity-[0.03]">
        <div className="w-[150vw] h-[150vw] rounded-full border-[1px] border-[#141414] animate-[spin_120s_linear_infinite]" />
        <div className="absolute w-[100vw] h-[100vw] rounded-full border-[1px] border-[#141414] animate-[spin_90s_linear_infinite_reverse]" />
        <div className="absolute w-[50vw] h-[50vw] rounded-full border-[1px] border-[#141414] animate-[spin_60s_linear_infinite]" />
      </div>
    </div>
  );
}
