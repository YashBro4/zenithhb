import athlete from '@/assets/greatness-athlete.jpg';
import entrepreneur from '@/assets/greatness-entrepreneur.jpg';
import philosopher from '@/assets/greatness-philosopher.jpg';
import scientist from '@/assets/greatness-scientist.jpg';
import warrior from '@/assets/greatness-warrior.jpg';
import artist from '@/assets/greatness-artist.jpg';
import leader from '@/assets/greatness-leader.jpg';

export interface GreatnessFigure {
  name: string;
  role: string;
  pillar: 'Health' | 'Wealth' | 'Logic' | 'Spirit' | 'Craft';
  quote: string;
  image: string;
}

export const greatness: GreatnessFigure[] = [
  {
    name: 'The Athlete',
    role: 'Discipline of the Body',
    pillar: 'Health',
    quote: 'You don\'t rise to the level of your goals. You fall to the level of your systems.',
    image: athlete,
  },
  {
    name: 'The Entrepreneur',
    role: 'Architect of Wealth',
    pillar: 'Wealth',
    quote: 'Compound interest is the eighth wonder of the world. He who understands it, earns it.',
    image: entrepreneur,
  },
  {
    name: 'The Philosopher',
    role: 'Seeker of Wisdom',
    pillar: 'Logic',
    quote: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
    image: philosopher,
  },
  {
    name: 'The Scientist',
    role: 'Mapper of the Unknown',
    pillar: 'Logic',
    quote: 'It is not that I\'m so smart. It\'s just that I stay with problems longer.',
    image: scientist,
  },
  {
    name: 'The Warrior',
    role: 'Master of Self',
    pillar: 'Spirit',
    quote: 'The successful warrior is the average man, with laser-like focus.',
    image: warrior,
  },
  {
    name: 'The Artist',
    role: 'Sculptor of Vision',
    pillar: 'Craft',
    quote: 'Inspiration exists, but it has to find you working.',
    image: artist,
  },
  {
    name: 'The Leader',
    role: 'Shaper of Eras',
    pillar: 'Spirit',
    quote: 'A leader is one who knows the way, goes the way, and shows the way.',
    image: leader,
  },
];

/** Returns a deterministic figure based on the calendar day so it changes every 24h. */
export const getDailyFigure = (date = new Date()): GreatnessFigure => {
  const epoch = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
  return greatness[epoch % greatness.length];
};
