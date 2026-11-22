import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Dice6,
  Flame,
  HelpCircle,
  MapPin,
  Shield,
  Sparkles,
  Swords,
  X,
} from 'lucide-react';
import { soundEngine } from '../../audio/soundEngine';

interface Slide {
  id: number;
  title: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  summary: string;
  details: string[];
  tip?: string;
}

const HOW_TO_PLAY_SLIDES: Slide[] = [
  {
    id: 1,
    title: 'Objective & The 4 Kingdoms',
    badge: 'Introduction',
    icon: Flame,
    iconColor: 'text-[#E6A93C]',
    summary: 'Lead your fantasy heroes to glory across the living enchanted island!',
    details: [
      'Four mighty realms contest the realm: Red Ignis Drake, Blue Glacier Lupus, Yellow Auric Leo, and Green Bamboo Warden.',
      'Each player commands 4 heroes starting within their kingdom courtyard yard.',
      'Your ultimate goal is to guide all 4 heroes around the circuit track and into the central Royal Crown Sanctuary.',
    ],
    tip: 'Pass & Play lets friends play on one device, while AI Bots will challenge you across Easy, Medium, and Hard tiers.',
  },
  {
    id: 2,
    title: 'Rolling a 6 & Deploying Heroes',
    badge: 'Yard Phase',
    icon: Dice6,
    iconColor: 'text-amber-400',
    summary: 'Awaken heroes from their starting yards into active battle.',
    details: [
      'Heroes begin dormant inside the corner kingdom courtyards.',
      'You must roll a 6 to summon a hero from the yard onto your kingdom’s starting track tile.',
      'Rolling a 6 also grants an immediate bonus roll!',
      'If you have no active pieces on the track and roll 1-5, your turn passes to the next player.',
    ],
    tip: 'Rolling three consecutive 6s in one turn forfeits the turn to ensure fair strategic balance.',
  },
  {
    id: 3,
    title: 'Circuit Movement & Capturing Opponents',
    badge: 'Track Battles',
    icon: Swords,
    iconColor: 'text-rose-400',
    summary: 'Travel clockwise around the island and clash with enemy heroes.',
    details: [
      'Once deployed, tap or press 1-4 to move your active hero forward by the dice roll count.',
      'Landing on an opponent’s piece on any regular track cell captures them!',
      'The captured enemy hero is knocked back to their home courtyard yard to start over.',
      'Making a capture awards an immediate extra bonus roll!',
    ],
    tip: 'Plan your moves ahead: hunting opponents gives bonus momentum and slows down dangerous rivals.',
  },
  {
    id: 4,
    title: 'Safe Star Sanctuaries',
    badge: 'Protection',
    icon: Shield,
    iconColor: 'text-sky-400',
    summary: 'Eight sacred golden star tiles provide sanctuary from capture.',
    details: [
      'The 8 golden engraved star tiles along the track are protected zones.',
      'Pieces resting on a Star Sanctuary tile cannot be captured by opponents.',
      'Multiple friendly or rival heroes can coexist peacefully on the same star tile.',
      'Your starting tile right outside your yard is also a permanent safe sanctuary.',
    ],
    tip: 'When opponents are right behind you, seek refuge on the nearest Star tile to stay invulnerable.',
  },
  {
    id: 5,
    title: 'The Home Runway & The Royal Crown',
    badge: 'Ascension',
    icon: Crown,
    iconColor: 'text-yellow-300',
    summary: 'Ascend your kingdom’s private home runway to claim the crown.',
    details: [
      'After completing the 52-tile circuit, heroes enter their kingdom’s private colored 5-tile home lane.',
      'No opponents can enter your private home lane, keeping your heroes completely safe.',
      'To reach the 6th tile (the Royal Crown Sanctuary), an exact roll is required.',
      'Landing a hero in the Crown awards a bonus roll. The first player to bring all 4 heroes home wins the match!',
    ],
    tip: 'Celebrate with kingdom-colored fireworks and confetti bursts upon claiming the crown!',
  },
  {
    id: 6,
    title: 'Corner Dice & Camera Controls',
    badge: 'Controls & Views',
    icon: Sparkles,
    iconColor: 'text-emerald-400',
    summary: 'Master the game controls, camera modes, and island views.',
    details: [
      'Corner Dice Controls: Each kingdom has a dedicated dice button in their corner card. Tap it or hit Spacebar to roll.',
      'Camera Controls: Drag with mouse/finger to orbit 360°; scroll/pinch to zoom in and out.',
      'Views: Press C or tap the camera button to cycle Isometric, Top-Down, and Follow modes. Press H to reset view.',
      '2D / 3D Toggle: Switch between the full 3D living island and high-contrast 2D tactical board at any time.',
    ],
    tip: 'Use Explore Island mode in the top bar to inspect surrounding waterfalls, citadels, and wildlife up close!',
  },
];

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') nextSlide();
      else if (e.key === 'ArrowLeft') prevSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentSlide]);

  if (!isOpen) return null;

  const slide = HOW_TO_PLAY_SLIDES[currentSlide];
  const Icon = slide.icon;

  const nextSlide = () => {
    soundEngine.playUiClick();
    setCurrentSlide((prev) => (prev < HOW_TO_PLAY_SLIDES.length - 1 ? prev + 1 : 0));
  };

  const prevSlide = () => {
    soundEngine.playUiClick();
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : HOW_TO_PLAY_SLIDES.length - 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#E6A93C]/40 bg-[#141A26] shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E7E2D8]/10 bg-[#10141E] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E6A93C]/50 bg-[#E6A93C]/10 text-[#E6A93C]">
              <HelpCircle className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-[#E7E2D8]">
                How to Play KingdomLudo
              </h2>
              <p className="text-[11px] text-[#E7E2D8]/60">
                Official rules, hero mechanics, and strategic guides
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E7E2D8]/15 text-[#E7E2D8]/70 hover:border-[#E6A93C] hover:text-[#E7E2D8] transition"
            aria-label="Close how to play guide"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Slide Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between">
            <span className="rounded-full border border-[#E6A93C]/40 bg-[#E6A93C]/10 px-3 py-1 text-xs font-bold text-[#E6A93C]">
              {slide.badge}
            </span>
            <span className="font-mono-num text-xs text-[#E7E2D8]/50">
              Slide {slide.id} of {HOW_TO_PLAY_SLIDES.length}
            </span>
          </div>

          <div className="flex items-start gap-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#E7E2D8]/15 bg-[#10141E] ${slide.iconColor}`}>
              <Icon className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-[#E7E2D8] sm:text-2xl">
                {slide.title}
              </h3>
              <p className="mt-1 text-sm font-medium text-[#E6A93C]">
                {slide.summary}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-[#E7E2D8]/10 bg-[#10141E]/80 p-4">
            <ul className="space-y-2.5 text-xs sm:text-sm leading-relaxed text-[#E7E2D8]/85">
              {slide.details.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E6A93C]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {slide.tip && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              <Sparkles className="h-4 w-4 shrink-0 text-[#E6A93C] mt-0.5" />
              <span>
                <strong>Pro Tip:</strong> {slide.tip}
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer with Slide Navigation */}
        <div className="flex items-center justify-between border-t border-[#E7E2D8]/10 bg-[#10141E] px-6 py-4">
          <button
            type="button"
            onClick={prevSlide}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#E7E2D8]/15 bg-[#1A2130] px-3.5 text-xs font-bold text-[#E7E2D8] hover:border-[#E6A93C] transition"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5">
            {HOW_TO_PLAY_SLIDES.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  soundEngine.playUiClick();
                  setCurrentSlide(idx);
                }}
                className={`h-2.5 rounded-full transition-all ${
                  idx === currentSlide ? 'w-6 bg-[#E6A93C]' : 'w-2 bg-[#E7E2D8]/20 hover:bg-[#E7E2D8]/40'
                }`}
                aria-label={`Jump to slide ${s.id}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={nextSlide}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#E6A93C]/60 bg-[#E6A93C] px-3.5 text-xs font-bold text-[#10141E] hover:bg-[#FDE047] transition shadow-md"
          >
            <span className="hidden sm:inline">
              {currentSlide === HOW_TO_PLAY_SLIDES.length - 1 ? 'Start Again' : 'Next'}
            </span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
