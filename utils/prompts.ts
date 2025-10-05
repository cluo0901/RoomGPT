import { roomType, themeType } from "./dropdownTypes";

export type PromptSections = {
  general: string;
  room: string;
  theme: string;
  full: string;
};

const GENERAL_PROMPT =
  "Redesign this room while keeping the existing layout, proportions, and architecture (windows, doors, fireplace, beams, shelving) intact. Do not move structural elements or alter built-ins; focus on finishes, furnishings, lighting, and décor to create a cohesive, realistic concept suitable for everyday use.";

const ROOM_PROMPTS: Record<roomType, string> = {
  "Living Room":
    "Arrange inviting seating, a functional coffee table, layered lighting, and considered décor that encourages conversation.",
  "Dining Room":
    "Highlight a welcoming dining setup with a practical table arrangement, complementary chairs, and ambient overhead lighting.",
  Bedroom:
    "Present a restful bedroom with a well-dressed bed, balanced bedside storage, calming lighting, and subtle decorative accents.",
  Bathroom:
    "Deliver a spa-like bathroom featuring premium fixtures, organized storage, flattering lighting, and clean finishes.",
  Office:
    "Design a productive home office with an ergonomic workstation, intentional storage, and technology neatly integrated.",
  "Home Office":
    "Curate a focused home office with a modern desk, ergonomic seating, clear organization, and minimal distractions.",
  Kitchen:
    "Feature streamlined cabinetry, efficient work zones, quality appliances, and purposeful lighting for cooking and gathering.",
  "Gaming Room":
    "Create an immersive gaming space with performance hardware, comfortable seating zones, and atmospheric accent lighting.",
};

const THEME_PROMPTS: Record<themeType, string> = {
  Modern:
    "Use a contemporary palette with sleek lines, contrasting accents, and minimal clutter.",
  Vintage:
    "Introduce nostalgic elements, warm tones, and characterful furnishings inspired by mid-century interiors.",
  Minimalist:
    "Focus on clean silhouettes, restrained color use, and purposeful negative space.",
  Professional:
    "Incorporate tailored furniture, polished finishes, and a composed executive mood.",
  Tropical:
    "Layer breezy textures, botanical accents, and sunlit warmth reminiscent of coastal escapes.",
  Scandinavian:
    "Blend pale woods, light neutrals, and cozy textiles to achieve a calm, functional hygge feel.",
  Industrial:
    "Reference exposed structure, metal accents, and moody tones balanced with warm lighting.",
  Japandi:
    "Merge Japanese minimalism with Scandinavian comfort using natural materials, low silhouettes, and muted earthy hues.",
  "Luxury Modern":
    "Highlight upscale finishes, statement lighting, and refined textures for a polished, high-end impression.",
};

const DEFAULT_ROOM: roomType = "Living Room";
const DEFAULT_THEME: themeType = "Modern";

export function buildPromptSections(
  roomInput: string,
  themeInput: string
): PromptSections {
  const knownRooms = Object.keys(ROOM_PROMPTS) as roomType[];
  const knownThemes = Object.keys(THEME_PROMPTS) as themeType[];

  const room = knownRooms.includes(roomInput as roomType)
    ? (roomInput as roomType)
    : DEFAULT_ROOM;

  const theme = knownThemes.includes(themeInput as themeType)
    ? (themeInput as themeType)
    : DEFAULT_THEME;

  const sections = {
    general: GENERAL_PROMPT,
    room: ROOM_PROMPTS[room],
    theme: THEME_PROMPTS[theme],
  };

  return {
    ...sections,
    full: `General: ${sections.general}\nRoom: ${sections.room}\nStyle: ${sections.theme}`,
  };
}
