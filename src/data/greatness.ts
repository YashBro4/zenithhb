import athlete from '@/assets/greatness-athlete.jpg';
import entrepreneur from '@/assets/greatness-entrepreneur.jpg';
import philosopher from '@/assets/greatness-philosopher.jpg';
import scientist from '@/assets/greatness-scientist.jpg';
import warrior from '@/assets/greatness-warrior.jpg';
import artist from '@/assets/greatness-artist.jpg';
import leader from '@/assets/greatness-leader.jpg';

export type GreatnessPillar = 'Health' | 'Wealth' | 'Logic' | 'Spirit' | 'Craft';

export interface GreatnessFigure {
  name: string;
  role: string;
  pillar: GreatnessPillar;
  quote: string;
  image: string;
}

type QuoteSeed = Omit<GreatnessFigure, 'image'>;

const portraitByPillar: Record<GreatnessPillar, string> = {
  Health: athlete,
  Wealth: entrepreneur,
  Logic: scientist,
  Spirit: leader,
  Craft: artist,
};

/**
 * A long local catalog keeps the daily experience useful without a network
 * request. Each quote is paired with the visual archetype that best matches
 * the figure's discipline, so the image and message stay in the same world.
 */
const quoteSeeds: QuoteSeed[] = [
  { name: 'Steve Jobs', role: 'Entrepreneur & inventor', pillar: 'Craft', quote: 'The only way to do great work is to love what you do.' },
  { name: 'Kobe Bryant', role: 'Champion & athlete', pillar: 'Health', quote: 'The most important thing is to try and inspire people so that they can be great in whatever they want to do.' },
  { name: 'Eleanor Roosevelt', role: 'Diplomat & humanitarian', pillar: 'Spirit', quote: 'The future belongs to those who believe in the beauty of their dreams.' },
  { name: 'Albert Einstein', role: 'Physicist & thinker', pillar: 'Logic', quote: 'Life is like riding a bicycle. To keep your balance, you must keep moving.' },
  { name: 'Maya Angelou', role: 'Writer & poet', pillar: 'Craft', quote: 'You can’t use up creativity. The more you use, the more you have.' },
  { name: 'Nelson Mandela', role: 'Leader & statesman', pillar: 'Spirit', quote: 'It always seems impossible until it’s done.' },
  { name: 'Marie Curie', role: 'Scientist & pioneer', pillar: 'Logic', quote: 'Nothing in life is to be feared; it is only to be understood.' },
  { name: 'Walt Disney', role: 'Creator & entrepreneur', pillar: 'Craft', quote: 'The way to get started is to quit talking and begin doing.' },
  { name: 'Serena Williams', role: 'Champion & athlete', pillar: 'Health', quote: 'Every woman’s success should be an inspiration to another.' },
  { name: 'Winston Churchill', role: 'Leader & writer', pillar: 'Spirit', quote: 'Success is not final, failure is not fatal: it is the courage to continue that counts.' },
  { name: 'Leonardo da Vinci', role: 'Artist & inventor', pillar: 'Craft', quote: 'Learning never exhausts the mind.' },
  { name: 'Oprah Winfrey', role: 'Producer & philanthropist', pillar: 'Wealth', quote: 'The biggest adventure you can take is to live the life of your dreams.' },
  { name: 'Martin Luther King Jr.', role: 'Leader & activist', pillar: 'Spirit', quote: 'Faith is taking the first step even when you don’t see the whole staircase.' },
  { name: 'Amelia Earhart', role: 'Aviator & pioneer', pillar: 'Health', quote: 'The most difficult thing is the decision to act, the rest is merely tenacity.' },
  { name: 'Benjamin Franklin', role: 'Inventor & statesman', pillar: 'Logic', quote: 'An investment in knowledge pays the best interest.' },
  { name: 'Mahatma Gandhi', role: 'Leader & reformer', pillar: 'Spirit', quote: 'The future depends on what you do today.' },
  { name: 'Michael Jordan', role: 'Champion & athlete', pillar: 'Health', quote: 'Some people want it to happen, some wish it would happen, others make it happen.' },
  { name: 'Maya Lin', role: 'Architect & artist', pillar: 'Craft', quote: 'To fly, we have to have resistance.' },
  { name: 'Thomas Edison', role: 'Inventor & entrepreneur', pillar: 'Logic', quote: 'Opportunity is missed by most people because it is dressed in overalls and looks like work.' },
  { name: 'Ruth Bader Ginsburg', role: 'Justice & trailblazer', pillar: 'Spirit', quote: 'Real change, enduring change, happens one step at a time.' },
  { name: 'Muhammad Ali', role: 'Champion & activist', pillar: 'Health', quote: 'He who is not courageous enough to take risks will accomplish nothing in life.' },
  { name: 'J.K. Rowling', role: 'Author & storyteller', pillar: 'Craft', quote: 'It is our choices that show what we truly are, far more than our abilities.' },
  { name: 'Stephen Hawking', role: 'Physicist & author', pillar: 'Logic', quote: 'However difficult life may seem, there is always something you can do and succeed at.' },
  { name: 'Malala Yousafzai', role: 'Activist & advocate', pillar: 'Spirit', quote: 'One child, one teacher, one book, one pen can change the world.' },
  { name: 'Usain Bolt', role: 'Champion & sprinter', pillar: 'Health', quote: 'Don’t think about the start of the race, think about the ending.' },
  { name: 'Michelangelo', role: 'Sculptor & painter', pillar: 'Craft', quote: 'The greatest danger for most of us is not that our aim is too high and we miss it, but that it is too low and we reach it.' },
  { name: 'Galileo Galilei', role: 'Astronomer & scientist', pillar: 'Logic', quote: 'You cannot teach a man anything; you can only help him find it within himself.' },
  { name: 'Jane Goodall', role: 'Primatologist & activist', pillar: 'Spirit', quote: 'What you do makes a difference, and you have to decide what kind of difference you want to make.' },
  { name: 'Simone Biles', role: 'Champion & gymnast', pillar: 'Health', quote: 'I’d rather regret the risks that didn’t work out than the chances I didn’t take at all.' },
  { name: 'Maya Angelou', role: 'Writer & poet', pillar: 'Craft', quote: 'Nothing will work unless you do.' },
  { name: 'Isaac Newton', role: 'Physicist & mathematician', pillar: 'Logic', quote: 'If I have seen further it is by standing on the shoulders of giants.' },
  { name: 'Desmond Tutu', role: 'Leader & peacemaker', pillar: 'Spirit', quote: 'Do your little bit of good where you are; it’s those little bits of good put together that overwhelm the world.' },
  { name: 'Tom Brady', role: 'Champion & athlete', pillar: 'Health', quote: 'I think sometimes in life the biggest challenges end up being the best things that happen in your life.' },
  { name: 'Pablo Picasso', role: 'Artist & innovator', pillar: 'Craft', quote: 'Everything you can imagine is real.' },
  { name: 'Ada Lovelace', role: 'Mathematician & pioneer', pillar: 'Logic', quote: 'The more I study, the more insatiable do I feel my genius for it to be.' },
  { name: 'Theodore Roosevelt', role: 'President & explorer', pillar: 'Spirit', quote: 'Believe you can and you’re halfway there.' },
  { name: 'Lionel Messi', role: 'Champion & footballer', pillar: 'Health', quote: 'You have to fight to reach your dream. You have to sacrifice and work hard for it.' },
  { name: 'Frida Kahlo', role: 'Painter & original', pillar: 'Craft', quote: 'At the end of the day, we can endure much more than we think we can.' },
  { name: 'Carl Sagan', role: 'Astronomer & educator', pillar: 'Logic', quote: 'Somewhere, something incredible is waiting to be known.' },
  { name: 'Harriet Tubman', role: 'Leader & liberator', pillar: 'Spirit', quote: 'Every great dream begins with a dreamer.' },
  { name: 'LeBron James', role: 'Champion & philanthropist', pillar: 'Health', quote: 'You have to be able to accept failure to get better.' },
  { name: 'Georgia O’Keeffe', role: 'Painter & modernist', pillar: 'Craft', quote: 'I have already settled it for myself so flattery and criticism go down the same drain and I am quite free.' },
  { name: 'Richard Feynman', role: 'Physicist & teacher', pillar: 'Logic', quote: 'The first principle is that you must not fool yourself—and you are the easiest person to fool.' },
  { name: 'Cesar Chavez', role: 'Organizer & reformer', pillar: 'Spirit', quote: 'The end of all knowledge should be service to others.' },
  { name: 'Megan Rapinoe', role: 'Champion & advocate', pillar: 'Health', quote: 'You can’t win unless you learn how to lose.' },
  { name: 'Vincent van Gogh', role: 'Painter & visionary', pillar: 'Craft', quote: 'Great things are done by a series of small things brought together.' },
  { name: 'Alan Turing', role: 'Mathematician & pioneer', pillar: 'Logic', quote: 'We can only see a short distance ahead, but we can see plenty there that needs to be done.' },
  { name: 'Amos Bronson Alcott', role: 'Educator & philosopher', pillar: 'Spirit', quote: 'Our aspirations are our possibilities.' },
  { name: 'Mia Hamm', role: 'Champion & footballer', pillar: 'Health', quote: 'Take your victories, whatever they may be, cherish them, use them, but don’t settle for them.' },
  { name: 'Georgia O’Keeffe', role: 'Painter & modernist', pillar: 'Craft', quote: 'I found I could say things with color and shapes that I couldn’t say any other way.' },
  { name: 'Richard Branson', role: 'Entrepreneur & adventurer', pillar: 'Wealth', quote: 'You don’t learn to walk by following rules. You learn by doing and falling over.' },
  { name: 'Confucius', role: 'Teacher & philosopher', pillar: 'Logic', quote: 'It does not matter how slowly you go as long as you do not stop.' },
  { name: 'Audre Lorde', role: 'Poet & activist', pillar: 'Spirit', quote: 'When I dare to be powerful—to use my strength in the service of my vision—it becomes less and less important whether I am afraid.' },
  { name: 'Jackie Joyner-Kersee', role: 'Champion & athlete', pillar: 'Health', quote: 'Age is no barrier. It’s a limitation you put on your mind.' },
  { name: 'David Bowie', role: 'Musician & artist', pillar: 'Craft', quote: 'If you feel safe in the area you’re working in, you’re not working in the right area. Always go a little bit out of your depth.' },
  { name: 'Srinivasa Ramanujan', role: 'Mathematician & visionary', pillar: 'Logic', quote: 'An equation for me has no meaning unless it expresses a thought of God.' },
  { name: 'Viktor Frankl', role: 'Psychiatrist & author', pillar: 'Spirit', quote: 'When we are no longer able to change a situation, we are challenged to change ourselves.' },
  { name: 'Billie Jean King', role: 'Champion & equality advocate', pillar: 'Health', quote: 'Champions keep playing until they get it right.' },
  { name: 'Toni Morrison', role: 'Novelist & editor', pillar: 'Craft', quote: 'If you want to fly, you have to give up the things that weigh you down.' },
  { name: 'Niels Bohr', role: 'Physicist & thinker', pillar: 'Logic', quote: 'An expert is a person who has made all the mistakes that can be made in a very narrow field.' },
  { name: 'Booker T. Washington', role: 'Educator & leader', pillar: 'Spirit', quote: 'If you want to lift yourself up, lift up someone else.' },
  { name: 'Jackie Robinson', role: 'Athlete & barrier-breaker', pillar: 'Health', quote: 'A life is not important except in the impact it has on other lives.' },
  { name: 'Martha Graham', role: 'Dancer & choreographer', pillar: 'Craft', quote: 'There is a vitality, a life force, a quickening that is translated through you into action.' },
  { name: 'Katherine Johnson', role: 'Mathematician & space pioneer', pillar: 'Logic', quote: 'Everything is possible. You just have to believe.' },
  { name: 'Hellen Keller', role: 'Author & advocate', pillar: 'Spirit', quote: 'Alone we can do so little; together we can do so much.' },
  { name: 'Bill Russell', role: 'Champion & coach', pillar: 'Health', quote: 'The only important statistic is the final score.' },
  { name: 'Beyoncé', role: 'Artist & performer', pillar: 'Craft', quote: 'The most alluring thing a woman can have is confidence.' },
  { name: 'Socrates', role: 'Philosopher & teacher', pillar: 'Logic', quote: 'The secret of change is to focus all of your energy not on fighting the old but on building the new.' },
  { name: 'Václav Havel', role: 'Leader & writer', pillar: 'Spirit', quote: 'Hope is not prognostication. It is an orientation of the spirit.' },
  { name: 'Jack Nicklaus', role: 'Champion & golfer', pillar: 'Health', quote: 'Resolve never to criticize or downgrade yourself, but instead rejoice that you are going to be better than you are.' },
  { name: 'Meryl Streep', role: 'Actor & artist', pillar: 'Craft', quote: 'Integrate what you believe into every single area of your life.' },
  { name: 'Aristotle', role: 'Philosopher & scholar', pillar: 'Logic', quote: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.' },
  { name: 'Anne Frank', role: 'Writer & diarist', pillar: 'Spirit', quote: 'How wonderful it is that nobody need wait a single moment before starting to improve the world.' },
  { name: 'Caitlyn Jenner', role: 'Champion & advocate', pillar: 'Health', quote: 'The best part of the journey is the destination.' },
  { name: 'Maya Lin', role: 'Architect & artist', pillar: 'Craft', quote: 'To me, the process is more important than the result.' },
  { name: 'Nikola Tesla', role: 'Inventor & engineer', pillar: 'Logic', quote: 'The present is theirs; the future, for which I really worked, is mine.' },
  { name: 'Mother Teresa', role: 'Humanitarian & nun', pillar: 'Spirit', quote: 'We ourselves feel that what we are doing is just a drop in the ocean, but the ocean would be less because of that missing drop.' },
  { name: 'Pelé', role: 'Champion & footballer', pillar: 'Health', quote: 'Success is no accident. It is hard work, perseverance, learning, studying, sacrifice, and most of all, love of what you are doing.' },
  { name: 'Akira Kurosawa', role: 'Director & storyteller', pillar: 'Craft', quote: 'In a mad world, only the mad are sane.' },
  { name: 'Rosalind Franklin', role: 'Chemist & scientist', pillar: 'Logic', quote: 'Science and everyday life cannot and should not be separated.' },
  { name: 'Maya Angelou', role: 'Writer & poet', pillar: 'Spirit', quote: 'Try to be a rainbow in someone’s cloud.' },
  { name: 'Jack LaLanne', role: 'Fitness pioneer', pillar: 'Health', quote: 'Exercise is king. Nutrition is queen. Put them together and you’ve got a kingdom.' },
  { name: 'Hayao Miyazaki', role: 'Animator & director', pillar: 'Craft', quote: 'Always believe in yourself. Do this and no matter where you are, you will have nothing to fear.' },
  { name: 'Rachel Carson', role: 'Biologist & author', pillar: 'Logic', quote: 'In nature, nothing exists alone.' },
  { name: 'C.S. Lewis', role: 'Writer & scholar', pillar: 'Spirit', quote: 'You are never too old to set another goal or to dream a new dream.' },
  { name: 'Florence Griffith Joyner', role: 'Champion & sprinter', pillar: 'Health', quote: 'When anyone tells me I can’t do anything, I’m just not listening any more.' },
  { name: 'Georgia O’Keeffe', role: 'Painter & modernist', pillar: 'Craft', quote: 'I decided that if I could paint that flower in a huge scale, you could not ignore its beauty.' },
  { name: 'Leonhard Euler', role: 'Mathematician & scholar', pillar: 'Logic', quote: 'Nothing takes place in the world whose meaning is not reflected in some way in the laws of mathematics.' },
  { name: 'Desmond Tutu', role: 'Leader & peacemaker', pillar: 'Spirit', quote: 'My humanity is bound up in yours, for we can only be human together.' },
  { name: 'Shaquille O’Neal', role: 'Champion & entrepreneur', pillar: 'Health', quote: 'Excellence is not a singular act, but a habit. You are what you do repeatedly.' },
  { name: 'Maya Angelou', role: 'Writer & poet', pillar: 'Craft', quote: 'Success likes yourself, liking what you do, and liking how you do it.' },
  { name: 'Sally Ride', role: 'Astronaut & physicist', pillar: 'Logic', quote: 'The stars don’t look bigger, but they do look brighter.' },
  { name: 'Dalai Lama', role: 'Teacher & leader', pillar: 'Spirit', quote: 'With realization of one’s own potential and self-confidence in one’s ability, one can build a better world.' },
  { name: 'Misty Copeland', role: 'Dancer & author', pillar: 'Health', quote: 'You can become stronger and more confident by facing your fears and challenging yourself.' },
  { name: 'David Hockney', role: 'Artist & innovator', pillar: 'Craft', quote: 'Enjoyment of life is an art, and it is a thing that one can learn.' },
  { name: 'Grace Hopper', role: 'Computer scientist & admiral', pillar: 'Logic', quote: 'The most dangerous phrase in the language is, “We’ve always done it this way.”' },
  { name: 'Maya Angelou', role: 'Writer & poet', pillar: 'Spirit', quote: 'Do the best you can until you know better. Then when you know better, do better.' },
  { name: 'Roger Federer', role: 'Champion & tennis player', pillar: 'Health', quote: 'You have to believe in the long term plan you have but you need the short term goals to motivate and inspire you.' },
  { name: 'Isabel Allende', role: 'Author & storyteller', pillar: 'Craft', quote: 'Write it down on your heart that every day is the best day in the year.' },
  { name: 'Claude Shannon', role: 'Mathematician & engineer', pillar: 'Logic', quote: 'I visualize a time when we will be to robots what dogs are to humans.' },
  { name: 'Desmond Tutu', role: 'Leader & peacemaker', pillar: 'Spirit', quote: 'If you are neutral in situations of injustice, you have chosen the side of the oppressor.' },
  { name: 'Carol Dweck', role: 'Psychologist & researcher', pillar: 'Health', quote: 'Becoming is better than being.' },
  { name: 'Octavia Butler', role: 'Author & visionary', pillar: 'Craft', quote: 'All that you touch you change. All that you change changes you.' },
  { name: 'Richard Feynman', role: 'Physicist & teacher', pillar: 'Logic', quote: 'I would rather have questions that can’t be answered than answers that can’t be questioned.' },
  { name: 'Maya Angelou', role: 'Writer & poet', pillar: 'Spirit', quote: 'We may encounter many defeats but we must not be defeated.' },
  { name: 'Nadia Comăneci', role: 'Champion & gymnast', pillar: 'Health', quote: 'Hard work has made it easy. That is my secret. That is why I win.' },
  { name: 'Zaha Hadid', role: 'Architect & designer', pillar: 'Craft', quote: 'There are 360 degrees, so why stick to one?' },
  { name: 'George Washington Carver', role: 'Scientist & educator', pillar: 'Logic', quote: 'Education is the key to unlock the golden door of freedom.' },
  { name: 'Brené Brown', role: 'Researcher & author', pillar: 'Spirit', quote: 'Courage starts with showing up and letting ourselves be seen.' },
  { name: 'Venus Williams', role: 'Champion & entrepreneur', pillar: 'Health', quote: 'Just believe in yourself. Even if you don’t, pretend that you do and, at some point, you will.' },
  { name: 'Maya Angelou', role: 'Writer & poet', pillar: 'Craft', quote: 'You may not control all of the events that happen to you, but you can decide not to be reduced by them.' },
  { name: 'James Clerk Maxwell', role: 'Physicist & mathematician', pillar: 'Logic', quote: 'Thoroughly conscious ignorance is the prelude to every real advance in science.' },
  { name: 'Rosa Parks', role: 'Activist & leader', pillar: 'Spirit', quote: 'I have learned over the years that when one’s mind is made up, this diminishes fear.' },
  { name: 'Mia Hamm', role: 'Champion & footballer', pillar: 'Health', quote: 'The vision of a champion is bent over, drenched in sweat, at the point of exhaustion.' },
  { name: 'Yayoi Kusama', role: 'Artist & sculptor', pillar: 'Craft', quote: 'I fight pain, anxiety, and fear every day, and the only method I have found that relieves my illness is to continue to create art.' },
  { name: 'Maryam Mirzakhani', role: 'Mathematician & scholar', pillar: 'Logic', quote: 'The beauty of mathematics only shows itself to more patient followers.' },
  { name: 'Thich Nhat Hanh', role: 'Teacher & author', pillar: 'Spirit', quote: 'The present moment is filled with joy and happiness. If you are attentive, you will see it.' },
  { name: 'Allyson Felix', role: 'Champion & advocate', pillar: 'Health', quote: 'You can’t be what you can’t see.' },
  { name: 'Antoni Gaudí', role: 'Architect & designer', pillar: 'Craft', quote: 'Nothing is art if it does not come from nature.' },
  { name: 'George Pólya', role: 'Mathematician & teacher', pillar: 'Logic', quote: 'It is better to solve one problem five different ways than to solve five problems one way.' },
  { name: 'Kofi Annan', role: 'Diplomat & leader', pillar: 'Spirit', quote: 'Knowledge is power. Information is liberating. Education is the premise of progress, in every society, in every family.' },
  { name: 'Wilma Rudolph', role: 'Champion & sprinter', pillar: 'Health', quote: 'The triumph can’t be had without the struggle.' },
  { name: 'William Shakespeare', role: 'Playwright & poet', pillar: 'Craft', quote: 'We know what we are, but know not what we may be.' },
  { name: 'George Box', role: 'Statistician & teacher', pillar: 'Logic', quote: 'All models are wrong, but some are useful.' },
  { name: 'Angela Davis', role: 'Scholar & activist', pillar: 'Spirit', quote: 'I am no longer accepting the things I cannot change. I am changing the things I cannot accept.' },
  { name: 'Jackie Joyner-Kersee', role: 'Champion & athlete', pillar: 'Health', quote: 'It is better to look ahead and prepare than to look back and regret.' },
  { name: 'Louise Bourgeois', role: 'Artist & sculptor', pillar: 'Craft', quote: 'Art is a guarantee of sanity.' },
  { name: 'Hannah Arendt', role: 'Philosopher & historian', pillar: 'Logic', quote: 'Forgiveness is the key to action and freedom.' },
  { name: 'Wangari Maathai', role: 'Scientist & environmentalist', pillar: 'Spirit', quote: 'It’s the little things citizens do. That’s what will make the difference.' },
  { name: 'Mary Lou Retton', role: 'Champion & gymnast', pillar: 'Health', quote: 'Optimism is the faith that leads to achievement.' },
  { name: 'Paul Klee', role: 'Painter & teacher', pillar: 'Craft', quote: 'A line is a dot that went for a walk.' },
  { name: 'Lise Meitner', role: 'Physicist & pioneer', pillar: 'Logic', quote: 'Science makes people reach selflessly for truth and objectivity.' },
  { name: 'Eleanor Roosevelt', role: 'Diplomat & humanitarian', pillar: 'Spirit', quote: 'No one can make you feel inferior without your consent.' },
  { name: 'Jackie Robinson', role: 'Athlete & barrier-breaker', pillar: 'Health', quote: 'The right of every American to first-class citizenship is the most important issue of our time.' },
  { name: 'Georgia O’Keeffe', role: 'Painter & modernist', pillar: 'Craft', quote: 'I know I cannot paint a flower. I cannot paint the sun on the desert. But perhaps I can paint an idea.' },
  { name: 'Srinivasa Ramanujan', role: 'Mathematician & visionary', pillar: 'Logic', quote: 'An equation means nothing to me unless it expresses a thought of God.' },
  { name: 'Maya Angelou', role: 'Writer & poet', pillar: 'Spirit', quote: 'My mission in life is not merely to survive, but to thrive.' },
  { name: 'Michael Phelps', role: 'Champion & swimmer', pillar: 'Health', quote: 'You can’t put a limit on anything. The more you dream, the farther you get.' },
  { name: 'Auguste Rodin', role: 'Sculptor & artist', pillar: 'Craft', quote: 'Nothing is a waste of time if you use the experience wisely.' },
  { name: 'Rachel Carson', role: 'Biologist & author', pillar: 'Logic', quote: 'Those who dwell among the beauties and mysteries of the earth are never alone or weary of life.' },
  { name: 'Martin Luther King Jr.', role: 'Leader & activist', pillar: 'Spirit', quote: 'The time is always right to do what is right.' },
  { name: 'Arthur Ashe', role: 'Champion & humanitarian', pillar: 'Health', quote: 'Start where you are. Use what you have. Do what you can.' },
  { name: 'Mary Oliver', role: 'Poet & naturalist', pillar: 'Craft', quote: 'Tell me, what is it you plan to do with your one wild and precious life?' },
  { name: 'Jane Goodall', role: 'Primatologist & activist', pillar: 'Logic', quote: 'The least I can do is speak out for those who cannot speak for themselves.' },
  { name: 'Maya Angelou', role: 'Writer & poet', pillar: 'Spirit', quote: 'Nothing can dim the light which shines from within.' },
  { name: 'Cristiano Ronaldo', role: 'Champion & footballer', pillar: 'Health', quote: 'Your love makes me strong, your hate makes me unstoppable.' },
  { name: 'Bob Ross', role: 'Painter & teacher', pillar: 'Craft', quote: 'Talent is a pursued interest. Anything that you’re willing to practice, you can do.' },
  { name: 'Carl Sagan', role: 'Astronomer & educator', pillar: 'Logic', quote: 'Somewhere, something incredible is waiting to be known.' },
  { name: 'Abraham Lincoln', role: 'President & leader', pillar: 'Spirit', quote: 'The best way to predict your future is to create it.' },
  { name: 'David Goggins', role: 'Athlete & author', pillar: 'Health', quote: 'We should not judge people by their peak of excellence; but by the distance they have traveled from the point where they started.' },
  { name: 'Pablo Picasso', role: 'Artist & innovator', pillar: 'Craft', quote: 'Action is the foundational key to all success.' },
  { name: 'Stephen Hawking', role: 'Physicist & author', pillar: 'Logic', quote: 'Remember to look up at the stars and not down at your feet.' },
  { name: 'Desmond Tutu', role: 'Leader & peacemaker', pillar: 'Spirit', quote: 'There is only one way to eat an elephant: a bite at a time.' },
  { name: 'Novak Djokovic', role: 'Champion & tennis player', pillar: 'Health', quote: 'If you don’t have the confidence, you’ll always find a way not to win.' },
  { name: 'Maya Angelou', role: 'Writer & poet', pillar: 'Craft', quote: 'I’ve learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel.' },
  { name: 'Alan Turing', role: 'Mathematician & pioneer', pillar: 'Logic', quote: 'Sometimes it is the people no one imagines anything of who do the things that no one can imagine.' },
  { name: 'Eleanor Roosevelt', role: 'Diplomat & humanitarian', pillar: 'Spirit', quote: 'Do one thing every day that scares you.' },
];

export const greatness: GreatnessFigure[] = quoteSeeds.map((seed) => ({
  ...seed,
  image: portraitByPillar[seed.pillar],
}));

/** Hour of the day (local time) at which the daily quote rolls over. */
export const DAILY_RESET_HOUR = 5;

/**
 * Returns the effective "quote date": the calendar day this moment belongs
 * to once the 5:00 AM reset is applied. Before 5 AM, the previous day's
 * quote is still shown; at or after 5 AM, today's quote takes over.
 */
export const getQuoteCycleDate = (now = new Date()): Date => {
  const cycle = new Date(now);
  if (cycle.getHours() < DAILY_RESET_HOUR) {
    cycle.setDate(cycle.getDate() - 1);
  }
  cycle.setHours(0, 0, 0, 0);
  return cycle;
};

/**
 * Milliseconds from `now` until the next 5:00 AM local reset — the moment
 * the daily quote should switch over.
 */
export const getMsUntilNextReset = (now = new Date()): number => {
  const next = new Date(now);
  next.setHours(DAILY_RESET_HOUR, 0, 0, 250);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return Math.max(1000, next.getTime() - now.getTime());
};

/**
 * Returns a deterministic figure for the current 5:00 AM cycle.
 * The index is seeded by the cycle's local calendar date (year + day-of-year),
 * so the quote is identical for every reload within the same 24-hour window,
 * changes exactly once per day at 5 AM, and never loops on a 7-day cycle.
 */
export const getDailyFigure = (now = new Date()): GreatnessFigure => {
  const cycle = getQuoteCycleDate(now);
  const startOfYear = new Date(cycle.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((cycle.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const seed = cycle.getFullYear() * 1000 + dayOfYear;

  return greatness[((seed % greatness.length) + greatness.length) % greatness.length];
};