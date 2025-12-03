import { motion } from 'framer-motion';

const pillars = [
  {
    title: "Socializing shouldn't be awkward",
    description: 'Walking into events alone can be intimidating. Gatherly eliminates that friction by giving you a built-in group.',
  },
  {
    title: 'Small groups feel natural and safe',
    description: 'Research shows people connect best in groups of 3-5. No overwhelming crowds, just meaningful conversations.',
  },
  {
    title: 'Built for real life—not endless swiping',
    description: 'Stop scrolling through profiles. Start showing up to real experiences with real people who share your interests.',
  },
];

export function WhyGatherlySection() {
  return (
    <section className="py-16 md:py-32 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-[1220px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Why Gatherly Exists
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            We believe making friends as an adult shouldn't be this hard
          </p>
        </motion.div>

        <div className="space-y-16 md:space-y-24">
          {pillars.map((pillar, index) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
              className={`max-w-3xl ${index % 2 === 1 ? 'ml-auto text-right' : ''}`}
            >
              <span className="text-6xl md:text-8xl font-bold text-primary/10">
                0{index + 1}
              </span>
              <h3 className="text-2xl md:text-3xl font-bold tracking-tight -mt-6 mb-4">
                {pillar.title}
              </h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {pillar.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
